const authController = require('../controller/authController');
const passport = require('passport');
const Router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate, signupSchema, loginSchema, resetPasswordSchema } = require('../middleware/validation');

// Apply validation middleware before controllers
Router.post('/signup', validate(signupSchema), authController.SignUp);
Router.post('/signin', validate(loginSchema), authController.SignIn);
// Add new route for checking company name uniqueness
Router.post('/check-company-name', authController.checkCompanyName);

// Google Auth Route
Router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google Callback + JWT response
Router.get('/google/callback', passport.authenticate('google', { session: false }), authController.GoogleAuth);

Router.put('/complete-signup', authMiddleware, authController.completeSignUp);
// In your auth.routes.js
Router.put('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Debug route to check token contents
Router.get('/verify-token', authMiddleware, (req, res) => {
  try {
    // Send back user info from the token
    res.status(200).json({
      user: req.user,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Token verification failed' });
  }
});

module.exports = Router;