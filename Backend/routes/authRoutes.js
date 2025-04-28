const authController=require('../controller/authController');
const passport = require('passport');
const Router=require('express').Router();
const authMiddleware = require('../middleware/authMiddleware'); 
Router.post('/signup',authController.SignUp);
Router.post('/signin',authController.SignIn);

// Google Auth Route
Router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));

// Google Callback + JWT response
Router.get('/google/callback',passport.authenticate('google', { session: false }),authController.GoogleAuth);

Router.put('/complete-signup', authMiddleware, authController.completeSignUp);
// In your auth.routes.js
Router.put('/reset-password', authController.resetPassword);

module.exports=Router;