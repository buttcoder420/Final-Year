const express = require("express");
const {
  registerUser,
  loginUser,
  verifyEmail,
} = require("../Controller/UserController");

const router = express.Router();

// Register Route
router.post("/register", registerUser);
router.post("/login", loginUser);

// Verify Email Route
router.get("/verify-email", verifyEmail);

module.exports = router;
