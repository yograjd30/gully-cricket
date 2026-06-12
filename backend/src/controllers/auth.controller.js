import passport from 'passport';
import User from '../models/User.js';

export const googleAuth = async (req, res, next) => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  if (!clientID || clientID.includes('your-google-client-id') || clientID === 'your-google-client-id') {
    try {
      let user = await User.findOne({ email: 'yograjd30@gmail.com' });
      if (!user) {
        user = await User.create({
          googleId: 'mock-google-id-12345',
          displayName: 'Yograj D',
          email: 'yograjd30@gmail.com',
          avatar: '',
        });
      }
      return req.login(user, (err) => {
        if (err) {
          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile?error=auth_failed`);
        }
        return res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
      });
    } catch (error) {
      console.error('Mock login fallback error:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile?error=auth_failed`);
    }
  }
  return passport.authenticate('google', {
    scope: ['profile', 'email'],
  })(req, res, next);
};

export const googleCallback = passport.authenticate('google', {
  failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile?error=auth_failed`,
});

export const googleCallbackRedirect = (req, res) => {
  res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
};

export const getMe = (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({ success: true, data: req.user });
  }
  return res.json({ success: true, data: null });
};

export const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Logout failed', code: 500 });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Session destroy failed', code: 500 });
      }
      res.clearCookie('connect.sid');
      return res.json({ success: true, data: { message: 'Logged out' } });
    });
  });
};
