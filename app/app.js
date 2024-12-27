// Import express.js
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

// Create express app
var app = express();

const { User } = require("./models/user");

// Set the sessions
var session = require("express-session");

// app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "secretkeysdfjsflyoifasd",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Use the Pug templating engine
app.set("view engine", "pug");
app.set("views", "./app/views");
// Add static files location
app.use(express.static("static"));
//app.use(express.static(path.join(__dirname, 'public')));

// Test to see navbar as logged in
// Temporary middleware to simulate logged-in state
// app.use((req, res, next) => {
//     res.locals.loggedIn = true; // Change to `false` to simulate logged-out state
//     next();
// });

// Get the functions in the db.js file to use
const db = require("./services/db");

// render homepage
app.get("/", function (req, res) {
  res.render("index");
});

// Register
// app.get("/register", function (req, res) {
//   res.render("register");
// });

// Login
app.get("/login", function (req, res) {
  res.render("login");
});

// Create a route for viewing menu /
app.get("/Menu", function (req, res) {
  sql = "SELECT * FROM Menu";

  db.query(sql)
    .then((results) => {
      res.render("item", { data: results });
    })
    .catch((error) => {
      console.error("Error fetching data from database:", error);
      res.status(500).send("Error fetching data");
    });
});

// Menu ordering page (table selection logic can be added later)
app.get("/menuorder", function (req, res) {
  const sortBy = req.query.sort || "Name"; // Default sorting
  const categoryFilter = req.query.category || "All"; // Default category filter

  let sql = "SELECT * FROM Menu";
  const queryParams = [];

  // Add WHERE clause if a category filter is applied
  if (categoryFilter !== "All") {
    sql += " WHERE Category = ?";
    queryParams.push(categoryFilter);
  }

  // Add ORDER BY clause for sorting
  if (sortBy === "PriceAsc") {
    sql += " ORDER BY Price ASC";
  } else if (sortBy === "PriceDesc") {
    sql += " ORDER BY Price DESC";
  } else {
    sql += " ORDER BY Name ASC";
  }

  // Execute query with parameterized input
  db.query(sql, queryParams)
    .then((results) => {
      res.render("menuorder", {
        data: results,
        sortBy,
        categoryFilter,
      });
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      res.status(500).send("Error fetching data");
    });
});

app.get("/", function (req, res) {
  console.log(req.session);
  if (req.session.uid) {
    res.send("Welcome back, " + req.session.uid + "!");
  } else {
    res.send("Please login to view this page!");
  }
  res.end();
});

// Logout
app.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/login");
});

app.post("/set-password", async function (req, res) {
  params = req.body;
  var user = new User(params.email);
  try {
    uId = await user.getIdFromEmail();
    if (uId) {
      // If a valid, existing user is found, set the password and redirect to the users single-student page
      await user.setUserPassword(params.password);
      console.log(req.session.id);
      res.send("Password set successfully");
    } else {
      // If no existing user is found, add a new one
      newId = await user.addUser(params.email);
      res.send(
        "Perhaps a page where a new user sets a programme would be good here"
      );
    }
  } catch (err) {
    console.error(`Error while adding password `, err.message);
  }
});

app.get("/register", async function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  console.log("Name:", req.body.name);
  console.log("Phone:", req.body.phone);
  console.log("Email:", req.body.email);
  console.log("Password:", req.body.password);
  const name = req.body.name;
  const phone = req.body.phone;
  const email = req.body.email;
  const password = req.body.password;

  const user = new User();
  user.addUser(name, email, password, phone);

  //   res.send("Form submitted successfully!");
  res.render("register");
  //   var user = new User(params.email);
  // try {
  //   uId = await user.getIdFromEmail();
  //   if (uId) {
  //     // If a valid, existing user is found, set the password and redirect to the users single-student page
  //     await user.setUserPassword(params.password);
  //     console.log(req.session.id);
  //     res.send("Password set successfully");
  //   } else {
  //     // If no existing user is found, add a new one
  //     newId = await user.addUser(params.email);
  //     res.send(
  //       "Perhaps a page where a new user sets a programme would be good here"
  //     );
  //   }
  // } catch (err) {
  //   console.error(`Error while adding password `, err.message);
  // }
});

app.post("/authenticate", async function (req, res) {
  params = req.body;
  var user = new User(params.email);
  try {
    uId = await user.getIdFromEmail();
    if (uId) {
      match = await user.authenticate(params.password);
      if (match) {
        req.session.uid = uId;
        req.session.loggedIn = true;
        console.log(req.session.id);
        res.redirect("/restaurants/" + uId);
      } else {
        // TODO improve the user journey here
        res.send("invalid password");
      }
    } else {
      res.send("invalid email");
    }
  } catch (err) {
    console.error(`Error while comparing `, err.message);
  }
});

//  app.get("/menuorder", async (req, res) => {
//     if (!req.session.selectedTable) {
//         return res.redirect("/select-table"); // Ensure a table is selected
//     }
//     const sql = "SELECT * FROM Menu"; // Fetch all menu items
//     try {
//         const menuItems = await db.query(sql);
//         const loggedIn = req.session?.loggedIn || false; // Check login status
//         res.render("menuorder", {
//             data: menuItems,
//             loggedIn,
//             selectedTable: req.session.selectedTable,
//         });
//     } catch (error) {
//         console.error("Error fetching menu items:", error);
//         res.status(500).send("Error loading menu");
//     }
// });

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

// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function (req, res) {
  res.send("Goodbye world!");
});

app.get("/restaurants", function (req, res) {
  res.render("restaurant_profile");
});

// Start server on port 3000
app.listen(3000, function () {
  console.log(`Server running at http://127.0.0.1:3000/`);
});
