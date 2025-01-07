function isAuthenticated(req, res, next) {
  // Check if the session exists and the user is logged in
  if (req.session && req.session.loggedIn) {
    return next(); // Continue to the route if authenticated
  } else {
    res.redirect("/login?error=Please login first"); // Redirect to login if not authenticated
  }
}

module.exports = isAuthenticated;