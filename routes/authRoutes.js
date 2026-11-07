const express = require("express");
const { body } = require("express-validator");
const { register, login } = require("../controllers/authController");
const validate = require("../middleware/validateMiddleware");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2, max: 60 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    validate,
  ],
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
    validate,
  ],
  login
);

module.exports = router;