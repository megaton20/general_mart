


const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require("../model/databaseTable");
const { promisify } = require('util');
const query = promisify(db.query).bind(db);
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
require('dotenv').config();

// Convert db.query to return a promise

// Passport session setup
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    // Use $1 for parameterized query
    const {rows:results} = await query('SELECT * FROM "Users" WHERE id = $1', [id]);

    if (results.length <= 0) {
      return done(null, false); // User not found, return false
    }

    done(null, results[0]); // User found, return the user object
  } catch (err) {
    done(err, null); // Pass the error to the done callback
  }
});




// Local strategy for traditional login
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    // Query the database for a user with the provided email
    const {rows:results} = await query('SELECT * FROM "Users" WHERE email = $1', [email]);

    // Check if any user was found
    if (results.length <= 0) {
      return done(null, false, { message: 'User does not exist' });
    }

    // Extract the user from the query results
    const user = results[0];

    // Check if the user has a password set (indicating they did not sign up via Google)
    if (!user.Password) {
      return done(null, false, { message: 'Use Google to sign into that account' });
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return done(null, false, { message: 'Incorrect email or password' });
    }

    // If everything is okay, return the user object
    return done(null, user);
  } catch (err) {
    // Log any errors and return an error response
    console.error('Error during authentication:', err);
    return done(err);
  }
}));



// Use the GoogleStrategy within Passport
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if the user already exists
    const {rows:results} = await query('SELECT * FROM "Users" WHERE "googleId" = $1', [profile.id]);


    if (results.length > 0) {
      return done(null, results[0]); // User exists, return the user
    } else {
      // User does not exist, create a new user record with Google data
      const newUser = {
        googleId: profile.id,
        First_name: profile.name.givenName,
        Last_name: profile.name.familyName,
        email: profile.emails[0].value,
        created_date: new Date(),
        previous_visit: new Date(),
        spending: 0,
        verify_email: true,
        status: "verified"
      };

      // Insert the new user into the database
      const {rows:insertResult} = await query(`INSERT INTO "Users" ("googleId", "First_name", "Last_name", "email", "created_date", "previous_visit", "spending", "verify_email", "status") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`, 
        [newUser.googleId, newUser.First_name, newUser.Last_name, newUser.email, newUser.created_date, newUser.previous_visit, newUser.spending, newUser.verify_email, newUser.status]
      );

      newUser.id = insertResult[0].id; // Get the inserted user's ID
      return done(null, newUser);
    }
  } catch (err) {
    return done(err, null);
  }
}));


module.exports = passport;
