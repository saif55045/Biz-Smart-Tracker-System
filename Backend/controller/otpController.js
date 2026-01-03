const User = require('../models/User');
const { Resend } = require('resend');
// Verify OTP
const jwt = require('jsonwebtoken');
// Temporary in-memory store (for production use Redis or database)
const otpStore = {};

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Generate OTP function
const generateOTP = async (email) => {
    // Generate 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP with expiry (5 min)
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // 5 minutes validity

    // Send email using Resend
    await resend.emails.send({
        from: 'BizSmartTrack <onboarding@resend.dev>',
        to: email,
        subject: 'Your Verification Code - BizSmartTrack',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td align="center" style="padding: 40px 20px;">
                            <table role="presentation" style="max-width: 480px; width: 100%; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
                                <!-- Header -->
                                <tr>
                                    <td style="padding: 32px 32px 24px; text-align: center;">
                                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                                            <span style="color: #60a5fa;">Biz</span>SmartTrack
                                        </h1>
                                    </td>
                                </tr>
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 0 32px 32px;">
                                        <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 24px; text-align: center;">
                                            <p style="margin: 0 0 8px; font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                                                Verification Code
                                            </p>
                                            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 20px; border-radius: 8px; margin: 16px 0;">
                                                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #ffffff;">
                                                    ${otp}
                                                </span>
                                            </div>
                                            <p style="margin: 16px 0 0; font-size: 14px; color: #64748b;">
                                                This code expires in <strong style="color: #f59e0b;">5 minutes</strong>
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 0 32px 32px; text-align: center;">
                                        <p style="margin: 0 0 16px; font-size: 13px; color: #64748b; line-height: 1.6;">
                                            If you didn't request this code, you can safely ignore this email.
                                        </p>
                                        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 20px;">
                                            <p style="margin: 0; font-size: 12px; color: #475569;">
                                                © ${new Date().getFullYear()} BizSmartTrack. All rights reserved.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `
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
