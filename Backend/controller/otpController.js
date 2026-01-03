const User = require('../models/User');
const nodemailer = require('nodemailer');
// Verify OTP
const jwt = require('jsonwebtoken');
// Temporary in-memory store (for production use Redis or database)
const otpStore = {};

// Generate OTP function
const generateOTP = async (email) => {
    // Generate 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP with expiry (5 min)
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // 5 minutes validity

    // Setup nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, // Your Gmail email
            pass: process.env.EMAIL_PASS  // Your Gmail App Password
        }
    });

    // Send email
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}`
    });
};

// Send OTP (for signup/login etc.)
const sendOtp = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Check if email credentials are configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('Email configuration missing: EMAIL_USER or EMAIL_PASS not set');
            return res.status(500).json({
                message: 'Email service not configured. Please contact administrator.'
            });
        }

        await generateOTP(email);
        res.status(200).json({ message: 'OTP sent successfully!' });
    } catch (error) {
        console.error('Error sending OTP:', error.message || error);
        // Return more descriptive error for debugging
        res.status(500).json({
            message: 'Error sending OTP',
            error: process.env.NODE_ENV === 'production' ? 'Email service error' : error.message
        });
    }
};



// Update verifyOtp
const verifyOtp = async (req, res) => {

    const { email, otp } = req.body;

    try {

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        if (!otpStore[email]) {
            return res.status(400).json({ message: "No OTP sent to this email." });
        }

        const storedOtp = otpStore[email];

        if (storedOtp.expiresAt < Date.now()) {
            delete otpStore[email];
            return res.status(400).json({ message: "OTP expired. Please request a new one." });
        }

        if (storedOtp.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // ✅ OTP verified, create reset token (valid for 15 min)
        const resetToken = jwt.sign({ email }, process.env.JWT_SECRET_KEY, { expiresIn: '15m' });

        // Delete OTP after success
        delete otpStore[email];

        res.status(200).json({ message: 'OTP verified successfully', resetToken });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error verifying OTP' });
    }
};

// Forget Password OTP sending
const forgetPasswordOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }

        await generateOTP(email);
        req.body = user;
        res.status(200).json({ message: 'OTP sent successfully!' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error generating OTP' });
    }
};

module.exports = { sendOtp, verifyOtp, forgetPasswordOtp };
