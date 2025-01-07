const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Routes for rendering login/register pages
router.get("/login", authController.getLogin);
router.get("/register", authController.getRegister);

// Routes for form submission (login/register)
router.post("/authenticate", authController.authenticateUser);
router.post("/register", authController.registerUser);

// Logout route
router.get("/logout", authController.logoutUser);

module.exports = router;



