// Import express.js
const express = require("express");

const path = require("path");
const bodyParser = require("body-parser");

const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');

// Set the sessions
var session = require("express-session");

const { User } = require("./models/user");

// Get the functions in the db.js file to use
const db = require("./controllers/db");

const isAuthenticated = require('./controllers/authMiddleware');

const reservationRoutes = require('./routes/reservationRoutes');
const authRoutes = require("./routes/authRoutes");

// Create express app
var app = express();

// pasers for JSON and URL-encoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "secretkeysdfjsflyoifasd",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Is authenticated 
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.loggedIn || false;
  res.locals.userEmail = req.session.userEmail || null;  // Pass user email 
  next();
});

app.use(cookieParser());

// Add static files location
app.use(express.static("static"));
app.use(express.static(path.join(__dirname, 'public')));

// Use the Pug templating engine
app.set("view engine", "pug");
app.set("views", "./app/views");

// prevent caching for protected paths to avou
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});


// Authentication routes
app.use("/", authRoutes);
// Reservation routes
app.use('/', reservationRoutes);


// app.js
const globalReservation = {
  time: null,
  date: null,
  tableNumber: null,
};

module.exports = globalReservation;


// render homepage
app.get("/", function (req, res) {
  res.render("index");
});


// Render privacy policy
app.get('/privacy-policy', function (req, res) {
  res.render('privacy-policy');
});

// Render terms of service
app.get('/terms-of-service', function (req, res) {
  res.render('terms-of-service');
});

// Create a route for /goodbye
app.get("/goodbye", function (req, res) {
  res.send("Goodbye world!");
});

// Create a route for testing the db
app.get("/db_test", function (req, res) {
  console.log(req);
  console.log(res);

  // Assumes a table called test_table exists in your database
  sql = "select * from Menu";
  db.query(sql).then((results) => {
    console.log(results);
    res.send(results);
  });
});


// set password
// app.post("/set-password", async function (req, res) {
//   params = req.body;
//   var user = new User(params.email);
//   try {
//     uId = await user.getIdFromEmail();
//     if (uId) {
//       // If a valid, existing user is found, set the password and redirect to the users single-student page
//       await user.setUserPassword(params.password);
//       console.log(req.session.id);
//       res.send("Password set successfully");
//     } else {
//       // If no existing user is found, add a new one
//       newId = await user.addUser(params.email);
//       res.send(
//         "Perhaps a page where a new user sets a programme would be good here"
//       );
//     }
//   } catch (err) {
//     console.error(`Error while adding password `, err.message);
//   }
// });


app.get("/", function (req, res) {
  console.log(req.session);
  if (req.session.uid) {
    res.send("Welcome back, " + req.session.uid + "!");
  } else {
    res.send("Please login to view this page!");
  }
  res.end();
});

// Start server on port 3000
app.listen(3000, function () {
  console.log(`Server running at http://127.0.0.1:3000/`);
});