import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

// Only register Google OAuth strategy if credentials are properly configured
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const hasValidOAuth = clientID
  && clientSecret
  && !clientID.includes('your-google-client-id')
  && clientID !== 'your-google-client-id'
  && !clientSecret.includes('your-google-client-secret')
  && clientSecret !== 'your-google-client-secret';

if (hasValidOAuth) {
  passport.use(new GoogleStrategy({
    clientID,
    clientSecret,
    callbackURL: '/api/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id }).lean();

      if (!user) {
        user = await User.create({
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value || '',
          avatar: profile.photos?.[0]?.value || '',
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
} else {
  console.warn('⚠️ Google OAuth not configured. Mock login will be used.');
}

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).lean();
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
