const createError = require("http-errors");

const notFound = (req, res, next) => {
  next(createError(404, `Route not found: ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.name === "ValidationError") {
    status = 400;
    message = err.message;
  }

  if (err.name === "CastError") {
    status = 400;
    message = "Invalid ID or data format";
  }

  if (err.code === 11000) {
    status = 409;
    message = "A record with this unique value already exists";
  }

  if (err.name === "MulterError") {
    status = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image must not exceed 5 MB"
        : err.message;
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};

module.exports = { notFound, errorHandler };