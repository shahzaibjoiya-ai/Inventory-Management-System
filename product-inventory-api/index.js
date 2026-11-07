const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const connectDB = require("./config/db");
const authRoutes = require("../routes/authRoutes");
const productRoutes = require("../routes/productRouts");
const { notFound, errorHandler } =
  require("../middleware/errorMiddleware");
 
const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many requests. Try again later." },
  })
);

// Uploaded images are accessible through their saved paths.
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.json({ message: "Product Inventory API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// Always register these after the routes.
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
      throw new Error("MONGO_URI and JWT_SECRET must be configured");
    }

    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();