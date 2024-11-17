// Import express.js
const express = require("express");
const path = require('path');

// Create express app
var app = express();
// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');
// Add static files location
//app.use(express.static("static"));
app.use(express.static(path.join(__dirname, 'public')));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Create a route for root - /
app.get("/", function(req, res) {
    sql = 'SELECT * FROM Menu'; // Assuming 'image' column is BLOB
    
    db.query(sql).then(results => {
        // Iterate through results and convert each image to Base64
        results.forEach(item => {
            if (item.imagePath) {
                // Convert the binary BLOB data to Base64 string
                item.imageBase64 = Buffer.from(item.imagePath).toString('base64');
                // Construct the src string for the image, including the correct MIME type
                item.imageSrc = `data:image/jpeg;base64,${item.imageBase64}`;
            } else {
                // In case there's no image, set the src as a placeholder
              //  item.imageSrc = '/path/to/default/image.jpg'; // Replace with an actual default image URL
            }
        });

        res.render("item", { 'data': results });
    }).catch(error => {
        console.error("Error fetching data from database:", error);
        res.status(500).send("Error fetching data");
    });
});


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

// Create a dynamic route for /hello/<name>, where name is any value provided by user
// At the end of the URL
// Responds to a 'GET' request
app.get("/hello/:name", function(req, res) {
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'name' parameter and use it in a dynamically generated page
    res.send("Hello " + req.params.name);
});

// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});