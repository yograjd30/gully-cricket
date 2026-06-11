/**
 * Attaches user to req if authenticated, but doesn't block guests.
 * req.user will be set if logged in, undefined otherwise.
 */
const optionalAuth = (req, res, next) => {
  // Passport already attaches req.user from session if available
  next();
};

export default optionalAuth;
