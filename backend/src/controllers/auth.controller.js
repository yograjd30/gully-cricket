import passport from 'passport';

export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

export const googleCallback = passport.authenticate('google', {
  failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`,
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
