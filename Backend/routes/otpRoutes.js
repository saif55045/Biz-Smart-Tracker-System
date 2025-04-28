const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp,forgetPasswordOtp } = require('../controller/otpController');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forget-password-otp',forgetPasswordOtp);
module.exports = router;
