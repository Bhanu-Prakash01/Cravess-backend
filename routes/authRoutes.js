const express = require("express");
const router = express.Router();
const userAuth = require("../controllers/authController");
const rateLimit = require("express-rate-limit");

const otpRateLimit = rateLimit({
  // windowMs: 60 * 60 * 1000,
  windowMs: 60 *  1000,
  max:100000,
  // max: 5, 
  message:
    "Too many OTP requests from this IP, please try again after an hour.",
});

const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100000, 
  message:
    "Too many authentication requests from this IP, please try again after an hour.",
});

router.post("/sendotp", otpRateLimit, userAuth.sendOtp);
router.post("/signin", authRateLimit, userAuth.userAuth);

module.exports = router;