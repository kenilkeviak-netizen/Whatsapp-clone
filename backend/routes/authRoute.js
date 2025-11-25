const express = require("express");
const authControllers = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { multerMiddleware } = require("../config/cloudinaryConfig");

const router = express.Router();

router.post("/send-otp", authControllers.sendOtp);
router.post("/verify-otp", authControllers.verifyOtp);
router.get("/logout", authControllers.logout);

// Protected Router

router.put(
  "/update-profile",
  authMiddleware,
  multerMiddleware,
  authControllers.updateProfile
);
router.get("/check-auth", authMiddleware, authControllers.checkAuthenticated);
router.get("/users", authMiddleware, authControllers.getAllUser);

module.exports = router;
