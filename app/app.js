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

// prevent caching for protected paths to avoid back button access after logout
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// to check if the user is authenticated.
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

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.loggedIn || false;
    next();
});


// Get the functions in the db.js file to use
const db = require("./services/db");

// render homepage
app.get("/", function (req, res) {
  res.render("index");
});

app.use(cookieParser());


app.post('/send-cart-details', async (req, res) => {
    const { cartDetails, totalSum, customerEmail } = req.body;

    if (!customerEmail) {
        return res.status(400).send('Customer email is required.');
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'ammadmanandubizzle@gmail.com',  // Replace with your Gmail address
                pass: 'wvkt qvnc gxnp qczy',     // Use your Gmail App Password (NOT regular Gmail password)
            },
        });

        const cartDetailsHtml = cartDetails
            .map(
                item => `
                <tr>
                    <td>${item.name}</td>
                    <td>£${item.price.toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td>£${item.total.toFixed(2)}</td>
                </tr>
            `
            )
            .join('');

        const emailBody = `
            <h2>Your Cart Details</h2>
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

        // Send the email
        await transporter.sendMail({
            from: 'ammadmanandubizzle@gmail.com',  // Replace with your Gmail address
            to: customerEmail,
            subject: 'Your Cart Details',
            html: emailBody,
        });

        res.send('Email sent successfully');
    } catch (error) {
        // Log the full error for debugging
        console.error('Error sending email:', error);  // Log full error object
        res.status(500).send(`Error sending email: ${error.message}`);  // Send the detailed error message to the frontend
    }
});



// Route for the cart page
app.get("/cart", isAuthenticated, (req, res) => {
    // Retrieve cartItems from cookies
    const storedCartItems = req.cookies.cartItems ? JSON.parse(req.cookies.cartItems) : []; 

    res.render("cart", { 
        data: storedCartItems // Pass cartItems as 'data' to the Pug template
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
    res.render("login", { error });
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
app.get("/", function(req, res) {
    console.log(req.session);
    if (req.session.uid) {
		res.send('Welcome back, ' + req.session.uid + '!');
	} else {
		res.send('Please login to view this page!');
	}
	res.end();
});

// app.post("/authenticate", async function (req, res) {
//   params = req.body;
//   var user = new User(params.email);
//   try {
//     uId = await user.getIdFromEmail();
//     if (uId) {
//       match = await user.authenticate(params.password);
//       if (match) {
//         req.session.uid = uId;
//         req.session.loggedIn = true;
//         console.log(req.session.id);
//         res.redirect("/restaurants/" + uId);
//       } else {
//         // TODO improve the user journey here
//         res.send("invalid password");
//       }
//     } else {
//       res.send("invalid email");
//     }
//   } catch (err) {
//     console.error(`Error while comparing `, err.message);
//   }
// });


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
  


// Table reservation routes 
app.get('/book-time', isAuthenticated, (req, res) => {
    const sql = `
    SELECT * FROM RestaurantTable
    WHERE table_status = 'Available'
`;
    db.query(sql).then(results => {
        const resultsArray = Array.isArray(results) ? results : [results];
        console.log("All Rows from DB:", resultsArray)
        const timeSlots = [];           
        resultsArray.forEach(row => {
            const date = row.available_date.toISOString().split('T')[0].split('-').reverse().join('/'); // Format date as DD.MM.YYYY
            console.log(date)
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
        SELECT * FROM RestaurantTable
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

app.get("/reservation-form", (req, res) => {
    const { tableId, tableNumber,date,time } = req.query;
    console.log("Received Table Info:", tableId, tableNumber,date,time); // Debugging

    if (!tableId || !tableNumber) {
        return res.status(400).send('Table information is missing.');
    }

    // Render the reservation form with table info
    res.render("reservation_form", { tableId, tableNumber,date,time });
});

  


app.post('/reserve', async (req, res) => {
    const { name, email, phone, Allergies, guests } = req.body; // Form data
    const { tableId, tableNumber,date,time } = req.query; // Query params from URL

    // Debug: Log incoming data
    console.log('Form Data:', req.body);
    console.log('Query Params:', req.query);


    if (!name || !email || !phone || !Allergies || !guests || !tableId || !tableNumber|| !date || !time) {
        console.error('Missing data: ', { name, email, phone,Allergies, guests, tableId, tableNumber,date,time });
        return res.status(400).send('All fields are required.');
    }
    
    try {
        // Insert the reservation into the reservations table
        
        const isoDate = date.split('/').reverse().join('-');
        const insertQuery = `
            INSERT INTO Reservation (name, email, phone_number, number_of_guests, TableID,Allergies,UserID,Date,StartTime)
            VALUES (?, ?, ?, ?, ?,?,?,?,?)
        `;
        const insertValues = [name, email, phone, guests, tableId,Allergies,2,isoDate,time];
        await db.query(insertQuery, insertValues);

        // Update the table status to 'reserved'
        const updateQuery = `
            UPDATE RestaurantTable
            SET table_status = 'reserved'
            WHERE TableID = ?
        `;
        await db.query(updateQuery, [tableId]);

        // Redirect to confirmation page or Cart page 
        res.redirect(`/Menuorder?tableId=${tableId}&tableNumber=${tableNumber}`);
    } catch (error) {
        console.error('Error processing reservation:', error);
        res.status(500).send('Error processing reservation.');
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