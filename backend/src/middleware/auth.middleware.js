/**
 * Requires authenticated user. Returns 401 if not logged in.
 */
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({
    success: false,
    error: 'Authentication required',
    code: 401,
  });
};

export default requireAuth;
