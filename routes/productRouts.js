const express = require("express");
const { body, param } = require("express-validator");
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
} = require("../controllers/productController");

const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const validate = require("../middleware/validateMiddleware");

const router = express.Router();

const productValidation = [
  body("name").trim().isLength({ min: 2, max: 120 }),
  body("price").isFloat({ min: 0 }),
  body("category").trim().notEmpty().isLength({ max: 80 }),
  body("stock").isInt({ min: 0 }),
  body("description").optional().isString().isLength({ max: 2000 }),
  validate,
];

const validateId = [
  param("id").isMongoId().withMessage("Invalid product ID"),
  validate,
];

// Public routes
router.get("/stats/summary", getProductStats);
router.get("/", getProducts);
router.get("/:id", validateId, getProduct);

// Protected routes
router.post(
  "/",
  protect,
  upload.single("image"),
  productValidation,
  createProduct
);

router.put(
  "/:id",
  protect,
  validateId,
  upload.single("image"),
  [
    body("name").optional().trim().isLength({ min: 2, max: 120 }),
    body("price").optional().isFloat({ min: 0 }),
    body("category").optional().trim().notEmpty().isLength({ max: 80 }),
    body("stock").optional().isInt({ min: 0 }),
    body("description").optional().isString().isLength({ max: 2000 }),
    validate,
  ],
  updateProduct
);

router.delete("/:id", protect, validateId, deleteProduct);

module.exports = router;