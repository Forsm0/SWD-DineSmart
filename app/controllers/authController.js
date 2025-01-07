
const { User } = require('../models/user');

//  login logic
const authenticateUser = async function (req, res) {
    console.log("Email:", req.body.email);
    console.log("Password:", req.body.password);
    console.log("login request body:", req.body)
    const email = req.body.email;
    const password = req.body.password;
    let passmatch = false;
    
    const user = new User(email);
  
    try {
      // Get user ID from email
      uId = await user.getIdFromEmail();
      console.log(uId, "from db");
  
      if (uId) {
        // Authenticate user with password
        passmatch = await user.authenticate(password, uId);
        
        if (passmatch) {
          // Create session for logged-in user
          req.session.userId = uId;
          req.session.userEmail = req.body.email;
          req.session.loggedIn = true;
          console.log("Session ID:", req.session.id);
          
          // Redirect to restaurants or dashboard
          res.redirect("/restaurants");
        } else {
          // Redirect to login with error
          res.redirect("/login?error=Invalid credentials");
        }
      } else {
        res.redirect("/login?error=Invalid credentials");
      }
    } catch (err) {
      console.error(`Error while comparing: `, err.message);
      res.redirect("/login?error=Something went wrong");
    }
  };

// render login page
const getLogin = (req, res) => {
    const error = req.query.error;
    const success = req.query.success;
    res.render("login");
  };
  
// Render register page
const getRegister = (req, res) => {
    res.render("register");
}

// Handle user registration
const registerUser = async function (req, res) {
    const { name, phone, email, password } = req.body;
  
    const user = new User(email);
    
    try {
      const existingUser = await user.getIdFromEmail();
      
      if (existingUser) {
        // Email already exists, show registration-specific error
        res.render("register", { registerError: "Email is already registered. Please log in or use a different email." });
      } else {
        // Proceed to register if no existing user
        await user.addUser(name, email, password, phone);
  
        // Redirect to login with success message
        res.redirect("/login?success=User created successfully. Please log in.");
      }
    } catch (err) {
      console.error("Error during registration:", err);
      res.render("register", { registerError: "An error occurred during registration. Please try again." });
    }
  };
  
  // Handle logout
const logoutUser = (req, res) => {
    req.session.destroy(() => {
      res.redirect("/login");
    });
};


module.exports = {
    authenticateUser,
    registerUser,
    getLogin,
    getRegister,
    logoutUser,   
};