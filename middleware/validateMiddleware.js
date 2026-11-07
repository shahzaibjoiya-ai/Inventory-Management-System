
const { validationResult } = require("express-validator");
const createError = require("http-errors");

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }

  next();
};

module.exports = validate;
