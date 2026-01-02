const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
},  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });

      if (!user) {
        // Check if username already exists and generate a unique one if needed
        let username = profile.displayName;
        let userWithSameUsername = await User.findOne({ username: username });
        
        // If username exists, create a unique one by adding Google ID or a random suffix
        if (userWithSameUsername) {
          username = `${profile.displayName}_${profile.id.substring(0, 5)}`;
        }
        
        // Create new user with Google info and defaults
        user = new User({
          username: username,
          password: 'google', // Placeholder, not used
          email: profile.emails[0].value,
          company_name: 'GoogleUser_' + profile.id,
          address: 'N/A',
          phone_number: '0000000000',
          role: 'Admin', // Or logic to assign role
        });

        await user.save();
      }

      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
