const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw createError(401, "Authentication token required");
  }

  const token = authHeader.split(" ")[1];

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw createError(401, "Invalid or expired token");
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw createError(401, "User no longer exists");
  }

  req.user = user;
  next();
});

module.exports = { protect };