// Import express.js
const express = require("express");

const path = require("path");
const bodyParser = require("body-parser");

const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');


// Create express app
var app = express();
app.use(bodyParser.json());

const { User } = require("./models/user");
// app.js
const globalReservation = {
  time: null,
  date: null,
  tableNumber: null,
};

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

// prevent caching for protected paths to avou
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

function isAuthenticated(req, res, next) {
  // Check if the session exists and the user is logged in
  if (req.session && req.session.loggedIn) {
    return next(); // Continue to the route if authenticated
  } else {
    res.redirect("/login?error=Please login first"); // Redirect to login if not authenticated
  }
}

// Use the Pug templating engine
app.set("view engine", "pug");
app.set("views", "./app/views");
// Add static files location
app.use(express.static("static"));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies

// Test to see navbar as logged in
// Temporary middleware to simulate logged-in state
// app.use((req, res, next) => {
//     res.locals.loggedIn = true; // Change to `false` to simulate logged-out state
//     next();
// });

// here
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.loggedIn || false;
  res.locals.userEmail = req.session.userEmail || null;  // Pass user email 
  next();
});



// Get the functions in the db.js file to use
const db = require("./services/db");

// render homepage
app.get("/", function (req, res) {
  res.render("index");
});

app.use(cookieParser());


app.post('/send-cart-details', (req, res) => {
  const { cartDetails, totalSum, customerEmail, reservationDate, reservationTime, reservationTableNumber } = req.body;

  // Immediate redirect
  res.redirect("/my-orders");

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ammadmanandubizzle@gmail.com',
      pass: 'wvkt qvnc gxnp qczy',
    },
  });

  const cartDetailsHtml = cartDetails
    .map(
      item => `
        <tr>
          <td>${item.name}</td>
          <td>£${item.price}</td>
          <td>${item.quantity}</td>
          <td>£${item.total}</td>
        </tr>
      `
    )
    .join('');

  const emailBody = `
    <h2>Your Cart Details</h2>
    <p><strong>Your Reservation Details:</strong></p>
    <ul>
      <li>Date: ${reservationDate || 'Not selected'}</li>
      <li>Time: ${reservationTime || 'Not selected'}</li>
    </ul>
    <table border="1" cellpadding="5" cellspacing="0">
      <thead>
        <tr>
          <th>Item Name</th>
          <th>Price</th>
          <th>Quantity</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${cartDetailsHtml}
      </tbody>
    </table>
    <p><strong>Total Sum:</strong> £${totalSum}</p>
  `;

  // Send the email asynchronously without blocking the response
  transporter.sendMail({
    from: 'ammadmanandubizzle@gmail.com',
    to: req.session.userEmail,
    subject: 'Your Cart Details',
    html: emailBody,
  }).then(() => {
    console.log('Email sent successfully');
  }).catch((error) => {
    console.error('Error sending email:', error);
    console.log('Full error:', error.stack);
  });
});




// Route for the cart page
app.get("/cart", isAuthenticated, (req, res) => {
    // Retrieve cartItems from cookies
    const storedCartItems = req.cookies.cartItems ? JSON.parse(req.cookies.cartItems) : []; 
    console.log("Global Reservation Data:", globalReservation);

    res.render("cart", { 
        data: storedCartItems,globalReservation // Pass cartItems as 'data' to the Pug template
    });
});


app.get("/", function(req, res) {
    res.render("index");
});

// Register
// app.get("/register", function (req, res) {
//   res.render("register");
// });

// Login
app.get("/login", (req, res) => {
  const error = req.query.error;
  const success = req.query.success;  // Get success message
  res.render("login", { error, success });
});


// Render privacy policy
app.get('/privacy-policy', function (req, res) {
    res.render('privacy-policy');
});

// Render terms of service
app.get('/terms-of-service', function (req, res) {
    res.render('terms-of-service');
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
app.get("/menuorder", isAuthenticated, function (req, res) {
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
  req.session.destroy(() => {
    res.redirect("/login");
  });
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

app.post("/register", async function (req, res) {
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
});



app.get("/", function(req, res) {
    console.log(req.session);
    if (req.session.uid) {
		res.send('Welcome back, ' + req.session.uid + '!');
	} else {
		res.send('Please login to view this page!');
	}
	res.end();
});


// Route to handle login submission
app.post("/authenticate", async function (req, res) {
    console.log("Email:", req.body.email);
    console.log("Password:", req.body.password);
  
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
  });
  


// Table reservation routes (add isAuthenticated) HERE
app.get('/book-time', isAuthenticated, (req, res) => {
  const timeslotError = req.query.timeslot_error 
      ? req.query.timeslot_error.replace('timeslot_', '') 
      : null;

  const sql = `
      SELECT available_date, available_time, table_number, Capacity
      FROM RestaurantTable
      WHERE table_status = 'Available'
      AND available_date >= CURDATE()
      ORDER BY available_date ASC, available_time ASC
      LIMIT 15
  `;

  db.query(sql).then(results => {
      const resultsArray = Array.isArray(results) ? results : [results];
      const timeSlots = [];

      resultsArray.forEach(row => {
          const date = row.available_date.toISOString().split('T')[0].split('-').reverse().join('/');
          const existingSlot = timeSlots.find(slot => slot.date === date);

          if (existingSlot) {
              if (!existingSlot.times.includes(row.available_time)) {
                  existingSlot.times.push(row.available_time);
              }
          } else {
              timeSlots.push({
                  date,
                  times: [row.available_time],
              });
          }
      });

      res.render('table_reservations', {
          timeSlots,
          timeslotError,  // Pass the error to the template
      });
  }).catch(err => {
      console.error("Error fetching available slots:", err);
      res.status(500).send('Failed to load available time slots.');
  });
});


// timeslots
app.get('/timeslots', async (req, res) => {
  const { guests, date, time } = req.query;

  if (!guests || !date || !time) {
      const errorMessage = encodeURIComponent('timeslot_All fields are required.');
      return res.redirect(`/book-time?timeslot_error=${errorMessage}`);
  }

  const formattedDate = date.split('/').reverse().join('-');
  const formattedTime = time.includes(':') ? `${time}:00` : time;

  try {
      // 1. Exact match query - look for the exact date and time
      const exactMatchQuery = `
          SELECT available_date, available_time
          FROM RestaurantTable
          WHERE capacity >= ?
          AND available_date = ?
          AND available_time = ?
          AND table_status = 'Available'
      `;

      const exactValues = [guests, formattedDate, formattedTime];

      // 2. Time-based fallback - find closest times on the same date
      const timeQuery = `
        (
          SELECT available_date, available_time
          FROM RestaurantTable
          WHERE capacity >= ?
          AND available_date = ?
          AND available_time > ?
          AND table_status = 'Available'
          ORDER BY available_time ASC
          LIMIT 1
        )
        UNION
        (
          SELECT available_date, available_time
          FROM RestaurantTable
          WHERE capacity >= ?
          AND available_date = ?
          AND available_time < ?
          AND table_status = 'Available'
          ORDER BY available_time DESC
          LIMIT 1
        )
      `;

      // 3. Date-based fallback - search closest dates if no slots are available on the selected day
      const dateQuery = `
        (
          SELECT available_date, available_time
          FROM RestaurantTable
          WHERE capacity >= ?
          AND available_date < ?
          AND table_status = 'Available'
          ORDER BY available_date DESC, available_time DESC
          LIMIT 1
        )
        UNION
        (
          SELECT available_date, available_time
          FROM RestaurantTable
          WHERE capacity >= ?
          AND available_date > ?
          AND table_status = 'Available'
          ORDER BY available_date ASC, available_time ASC
          LIMIT 1
        )
      `;

      // Execute exact match query first
      const exactResults = await db.query(exactMatchQuery, exactValues);
      let results;
      let message;

      if (exactResults.length > 0) {
          // Exact match found
          results = exactResults;
          message = 'Here is your requested slot:';
      } else {
          // If no exact match, execute time-based fallback query
          const timeValues = [guests, formattedDate, formattedTime, guests, formattedDate, formattedTime];
          const timeResults = await db.query(timeQuery, timeValues);

          if (timeResults.length > 0) {
              results = timeResults;
              message = 'Closest available times on the selected date:';
          } else {
              // If no times are available on the selected date, perform date-based fallback
              const dateValues = [guests, formattedDate, guests, formattedDate];
              const dateResults = await db.query(dateQuery, dateValues);

              if (dateResults.length > 0) {
                  results = dateResults;
                  message = 'No slots on the selected date. Here are the closest alternatives:';
              } else {
                  message = 'No available time slots on nearby dates.';
                  results = [];
              }
          }
      }

      // Format results for Pug template rendering
      const formattedData = results.reduce((acc, row) => {
          const date = row.available_date.toISOString().split('T')[0];
          const existingSlot = acc.find(slot => slot.date === date);

          if (existingSlot) {
              existingSlot.times.push(row.available_time);
          } else {
              acc.push({
                  date,
                  times: [row.available_time],
              });
          }
          return acc;
      }, []);

      res.render('table_reservations', {
          timeSlots: formattedData,
          timeslotMessage: message,
      });

  } catch (err) {
      console.error("Error retrieving time slots:", err);
      res.status(500).send('An error occurred while retrieving time slots.');
  }
});









app.get('/getTableId', async (req, res) => {
    const { date, time } = req.query;
    // Format the date as YYYY-MM-DD
    const formattedDate = date.split('/').reverse().join('-'); // Converts to YYYY-MM-DD
    console.log("Formatted Date:", formattedDate);  // Debugging


    if (!date || !time) {
        return res.status(400).send({ error: 'Date and time are required.' });
    }

    try {
        const query = `
            SELECT TableID AS id, table_number
            FROM RestaurantTable
            WHERE available_date = ? AND available_time = ?
        `;
        const values = [formattedDate, time];
        const results = await db.query(query, values);
        console.log(values)

        if (results.length === 0) {
            return res.status(404).send({ error: 'No table found for the selected date and time.' });
        }

        res.status(200).send({ tableId: results[0].id, tableNumber: results[0].table_number });
    } catch (err) {
        console.error('Error fetching table ID:', err);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

app.get("/reservation-form", isAuthenticated, (req, res) => {
    const { tableId, tableNumber,date,time } = req.query;
    console.log("Received Table Info:", tableId, tableNumber,date,time); // Debugging
    globalReservation.time = time;
    globalReservation.date = date;
    globalReservation.tableNumber = tableNumber;
    if (!tableId || !tableNumber) {
        return res.status(400).send('Table information is missing.');
    }

    // Render the reservation form with table info
    res.render("reservation_form", { tableId, tableNumber,date,time });
});

  


app.post('/reserve', async (req, res) => {
  // Extract form data from the request body
  const { name, email, phone, Allergies, guests } = req.body;
  // Extract table and reservation details from the query parameters
  const { tableId, tableNumber, date, time } = req.query;

  // Log incoming form data and query parameters for debugging purposes
  console.log('Form Data:', req.body);
  console.log('Query Params:', req.query);

  // Validate required fields - if any are missing, return a 400 error
  if (!name || !email || !phone || !guests || !tableId || !tableNumber || !date || !time) {
      console.error('Missing data: ', { name, email, phone, Allergies, guests, tableId, tableNumber, date, time });
      return res.status(400).send('Please fill out all required fields.');
  }

  try {
      // Convert the date from DD/MM/YYYY to ISO format (YYYY-MM-DD) for database compatibility
      const isoDate = date.split('/').reverse().join('-');

      // Check if a reservation already exists for the same table, date, and time
      const existingReservation = await db.query(`
          SELECT * FROM Reservation WHERE TableID = ? AND Date = ? AND StartTime = ?
      `, [tableId, isoDate, time]);

      // If a reservation exists, return a 400 error to prevent double booking
      if (existingReservation.length > 0) {
          return res.status(400).send('This table is already reserved for the selected time.');
      }

      // Prepare the SQL query to insert a new reservation into the database
      const insertQuery = `
          INSERT INTO Reservation (name, email, phone_number, number_of_guests, TableID, Allergies, UserID, Date, StartTime)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      // Set a default value for allergies if none is provided
      const allergiesValue = Allergies || null;
      // Values to be inserted into the Reservation table
      const insertValues = [name, email, phone, guests, tableId, allergiesValue, req.session.userId, isoDate, time];
      
      // Execute the insert query to save the reservation
      await db.query(insertQuery, insertValues);

      // Update the table status to 'reserved' to prevent further bookings
      const updateQuery = `
          UPDATE RestaurantTable
          SET table_status = 'reserved'
          WHERE TableID = ?
      `;
      // Execute the update query for the specified table
      await db.query(updateQuery, [tableId]);

      // Redirect to the Menuorder page with a success message in the URL
      res.redirect(`/Menuorder?tableId=${tableId}&tableNumber=${tableNumber}&success=Reservation confirmed`);
  } catch (error) {
      // Log any errors that occur during the reservation process
      console.error('Error processing reservation:', error);
      // Return a 500 error if the reservation fails
      res.status(500).send('There was an error processing your reservation. Please try again.');
  }
});



// View past and upcoming reservations
const filterReservations = require("./services/filterReservations");

app.get("/my-orders", isAuthenticated, async (req, res) => {
    const userId = req.session.userId;
    console.log("UserID from session:", userId);

    if (!userId) {
        return res.redirect("/login");
    }

    try {
        const sql = `
            SELECT r.ReservationID AS reservation_id, r.Date, r.StartTime, r.Number_of_guests, r.Allergies, r.name
            FROM Reservation r
            WHERE r.UserID = ?
            ORDER BY r.Date ASC, r.StartTime ASC
        `;
        
        // Fetch reservations
        const reservations = await db.query(sql, [userId]);
        const reservationList = Array.isArray(reservations) ? reservations : (reservations ? [reservations] : []);

        console.log("Raw Reservations from DB:", reservationList);

        // Handle no results
        if (reservationList.length === 0) {
            console.log("No reservations found.");
            return res.render("my-orders", { upcomingReservations: [], pastReservations: [] });
        }

        // Use helper function to filter reservations
        const { upcomingReservations, pastReservations } = filterReservations(reservationList);

        console.log("Upcoming:", upcomingReservations);
        console.log("Past:", pastReservations);

        res.render("my-orders", { upcomingReservations, pastReservations });
    } catch (err) {
        console.error("Error fetching reservations:", err);
        res.status(500).send("Error fetching reservations.");
    }
});

// cancel reservation
app.post('/cancel-reservation', async (req, res) => {
  const { reservation_id } = req.body;
  const userId = req.session.userId;

  if (!reservation_id || !userId) {
      return res.status(400).send('Invalid request.');
  }

  try {
      // Fetch the table ID from the reservation before deleting
      const [reservation] = await db.query(`
          SELECT TableID FROM Reservation 
          WHERE ReservationID = ? AND UserID = ?
      `, [reservation_id, userId]);

      if (!reservation) {
          return res.status(404).send('Reservation not found.');
      }

      const tableId = reservation.TableID;

      // Delete the reservation
      await db.query(`
          DELETE FROM Reservation 
          WHERE ReservationID = ? AND UserID = ?
      `, [reservation_id, userId]);

      // Update the table status to 'Available'
      await db.query(`
          UPDATE RestaurantTable
          SET table_status = 'Available'
          WHERE TableID = ?
      `, [tableId]);

      console.log(`Reservation ${reservation_id} cancelled, Table ${tableId} marked as available.`);
      res.redirect('/my-orders?success=Reservation cancelled');
  } catch (error) {
      console.error('Error cancelling reservation:', error);
      res.status(500).send('Failed to cancel the reservation. Please try again.');
  }
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