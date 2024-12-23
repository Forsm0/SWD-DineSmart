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

// Get the functions in the db.js file to use
const db = require('./services/db');

app.get("/", function(req, res) {
    res.render("index");
});

app.get("/reservation-form", function(req, res) {
    res.render("reservation_form");
});

app.get('/book-time', (req, res) => {
    const sql = `
    SELECT * FROM restaurant_table
    WHERE table_status = 'open'
`;
    db.query(sql).then(results => {
        console.log(results);
        const resultsArray = Array.isArray(results) ? results : [results];
        console.log("All Rows from DB:", resultsArray)
        const timeSlots = [];
        resultsArray.forEach(row => {
            const date = row.available_date.toISOString().split('T')[0].split('-').reverse().join('.'); // Format date as DD.MM.YYYY
            const existingSlot = timeSlots.find(slot => slot.date === date);

            if (existingSlot) {
                // Add the time if the date already exists
                existingSlot.times.push(row.available_time);
            } else {
                // Add a new date with its first time
                timeSlots.push({
                    date,
                    times: [row.available_time]
                });
            }
        });
        console.log("Formatted TimeSlots:", timeSlots);
        res.render('table_reservations', { timeSlots });
    });

  });
  

  app.get('/timeslots', async (req, res) => {
    const { guests, date, time } = req.query;

    // Basic Validation
    if (!guests || !date || !time) {
        return res.status(400).send('All filter fields are required.');
    }

    // Format the date as YYYY-MM-DD
    const formattedDate = date.split('/').reverse().join('-'); // Converts to YYYY-MM-DD
    // Format time as HH:MM:SS (adding :00 if necessary)
    const formattedTime = time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;

    console.log("Formatted Time:", formattedTime);  // Debugging
    console.log("Formatted Date:", formattedDate);  // Debugging

    // SQL Query with placeholders
    const query = `
        SELECT * FROM restaurant_table
        WHERE capacity >= ? 
        AND available_time = ?
    `;

    try {
        // Execute Query using await
        const values = [guests, formattedTime];
        const results = await db.query(query, values);

        console.log("Query Results:", results); // Debugging query results

        if (results.length === 0) {
            console.log("No available tables found.");
            return res.status(404).send('No available tables found.');
        }

        // Ensure results is always an array
        const formattedResults = Array.isArray(results) ? results : [results];

        // Convert BinaryRow to a plain JavaScript object and group by available_date
        const formattedData = [];

        formattedResults.forEach(row => {
            const availableDate = row.available_date.toISOString().split('T')[0]; // Format to 'YYYY-MM-DD'
            const availableTime = row.available_time;

            // Find the existing entry for the date
            const existingDateSlot = formattedData.find(slot => slot.date === availableDate);

            if (existingDateSlot) {
                // If the date exists, push the available_time into the `times` array
                existingDateSlot.times.push(availableTime);
            } else {
                // If the date doesn't exist, create a new entry
                formattedData.push({
                    date: availableDate,
                    times: [availableTime]
                });
            }
        });

        console.log("Formatted Data for Pug:", formattedData); // Debugging

        // Pass the formattedData to your Pug template for rendering
        res.render('table_reservations', { timeSlots: formattedData });

    } catch (err) {
        console.error("Error retrieving time slots:", err);
        res.status(500).send('Error retrieving time slots.');
    }
});


  
// Create a route for root - Home page /
app.get("/Menu", function(req, res) {

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

app.get("/restaurants", function(req, res) {
    res.render("restaurant_profile");
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