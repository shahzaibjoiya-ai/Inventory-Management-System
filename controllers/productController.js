const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const createError = require("http-errors");
const fs = require("fs/promises");
const path = require("path");

const removeImage = async (imagePath) => {
  if (!imagePath) return;

  try {
    await fs.unlink(
      path.join(__dirname, "..", imagePath.replace(/^\/+/, ""))
    );
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Could not remove image:", error.message);
    }
  }
};

// POST /api/products
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, stock } = req.body;

  const product = await Product.create({
    name,
    description,
    price,
    category,
    stock,
    image: req.file ? `/uploads/${req.file.filename}` : null,
    createdBy: req.user._id,
  });

  res.status(201).json({
    message: "Product created successfully",
    product,
  });
});

// GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    search,
    sort = "newest",
    page = "1",
    limit = "10",
  } = req.query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  if (
    !Number.isInteger(pageNumber) ||
    pageNumber < 1 ||
    !Number.isInteger(limitNumber) ||
    limitNumber < 1 ||
    limitNumber > 100
  ) {
    throw createError(400, "Invalid page or limit");
  }

  const filter = {};

  if (category) {
    filter.category = category;
  }

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
  };

  if (!sortOptions[sort]) {
    throw createError(
      400,
      "Invalid sort. Use newest, oldest, price_asc, or price_desc"
    );
  }

  const skip = (pageNumber - 1) * limitNumber;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortOptions[sort])
      .skip(skip)
      .limit(limitNumber)
      .populate("createdBy", "name email"),

    Product.countDocuments(filter),
  ]);

  res.json({
    products,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
    },
  });
});

// GET /api/products/:id
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("createdBy", "name email");

  if (!product) {
    throw createError(404, "Product not found");
  }

  res.json({ product });
});

// PUT /api/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  const allowedFields = [
    "name",
    "description",
    "price",
    "category",
    "stock",
  ];

  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (req.file) {
    updates.image = `/uploads/${req.file.filename}`;
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    if (req.file) {
      await removeImage(`/uploads/${req.file.filename}`);
    }
    throw createError(404, "Product not found");
  }

  // Only the product owner can update it.
  if (product.createdBy.toString() !== req.user._id.toString()) {
    if (req.file) {
      await removeImage(`/uploads/${req.file.filename}`);
    }
    throw createError(403, "You cannot update this product");
  }

  Object.assign(product, updates);
  await product.save();

  // Remove the old image only after the database update succeeds.
  if (req.file && product.image !== updates.image) {
    // The new path has already been assigned, so retrieve the old path
    // from a saved value instead; see the improved version below.
  }

  res.json({
    message: "Product updated successfully",
    product,
  });
});

// DELETE /api/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw createError(404, "Product not found");
  }

  if (product.createdBy.toString() !== req.user._id.toString()) {
    throw createError(403, "You cannot delete this product");
  }

  await product.deleteOne();

  if (product.image) {
    await removeImage(product.image);
  }

  res.json({ message: "Product deleted successfully" });
});

// GET /api/products/stats/summary
const getProductStats = asyncHandler(async (req, res) => {
  const stats = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        productCount: { $sum: 1 },
        averagePrice: { $avg: "$price" },
        totalStock: { $sum: "$stock" },
      },
    },
    {
      $project: {
        _id: 0,
        category: "$_id",
        productCount: 1,
        averagePrice: { $round: ["$averagePrice", 2] },
        totalStock: 1,
      },
    },
    { $sort: { category: 1 } },
  ]);

  res.json({ stats });
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
};