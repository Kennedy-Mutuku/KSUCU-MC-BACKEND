const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/user'); // Adjust the path as needed
const dotenv = require('dotenv');
dotenv.config();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null); // Pass the error to the done callback
    });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'https://ksucu-mc.co.ke/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user already exists with the Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User already exists, return the user
          console.log('user already exists');
          
          return done(null, user);
        }

        // Check if the user already exists with the email
        user = await User.findOne({ email: profile.emails[0].value });

        if(!user){
          console.log('user not found');
        }

        if (user) {
          console.log('user available');
          
          // If a user exists with the same email but a different Google ID, update the Google ID
          user.googleId = profile.id;
          await user.save();
          return done(null, user);
        }

        console.log('creating user...');
        
        // Create a new user if none exists with the same email
        user = new User({
          googleId: profile.id,
          username: profile.displayName,
          email: profile.emails[0].value,
        });
        await user.save();

        done(null, user);
      } catch (err) {
        console.log(err);
        
        // Check for duplicate key error and handle it gracefully
        if (err.code === 11000) {
          // Duplicate key error
          const errorMessage = 'An account with this email already exists. Please use a different email address.';
          return done(null, false, { message: errorMessage });
        }

        // Handle other errors
        done(err, null);
      }
    }
  )
);

module.exports = passport;

