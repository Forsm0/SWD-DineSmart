// Import express.js
const express = require("express");
const path = require('path');

// Create express app
var app = express();

// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');
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
const db = require('./services/db');

// render homepage
app.get("/", function(req, res) {
    res.render("index");
});

// Create a route for viewing menu /
app.get("/Menu", function(req, res) {

    sql = 'SELECT * FROM Menu'; 
    
    db.query(sql).then(results => {
        res.render("item", { 'data': results });
    }).catch(error => {
        console.error("Error fetching data from database:", error);
        res.status(500).send("Error fetching data");
    });
});

// Menu ordering page (table selection logic can be added later)
app.get("/menuorder", function (req, res) {
    const sortBy = req.query.sort || 'Name'; // Default sorting
    const categoryFilter = req.query.category || 'All'; // Default category filter

    let sql = "SELECT * FROM Menu";
    const queryParams = [];

    // Add WHERE clause if a category filter is applied
    if (categoryFilter !== 'All') {
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
        .then(results => {
            res.render("menuorder", { 
                data: results, 
                sortBy, 
                categoryFilter 
            });
        })
        .catch(error => {
            console.error("Error fetching data:", error);
            res.status(500).send("Error fetching data");
        });
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
app.get("/db_test", function(req, res) {
    console.log(req)
    console.log(res)
    // Assumes a table called test_table exists in your database
    sql = 'select * from Menu';
    db.query(sql).then(results => {
        console.log(results);
        res.send(results)
    });
});

// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

app.get("/restaurants", function(req, res) {
    res.render("restaurant_profile");
});



// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});