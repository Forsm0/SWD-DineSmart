const db = require('../controllers/db');
const nodemailer = require('nodemailer');
const globalReservation = require("../app");
const filterReservations = require('../controllers/filterReservations');

const {
    getUserReservations,
    getAvailableTimeSlots,
    getClosestDateSlots,
    getClosestTimeSlots,
    checkExistingReservation,
    createReservation,
    updateTableStatus,
    getMenuItems,
    getReservationById,
    cancelReservation,
    getTableIdByDateAndTime
} = require('../models/reservation');

const { getExactMatchSlot } = require('../models/reservation');



// booking page
const renderBookingPage = async (req, res) => {
    console.log("renderBookingPage called");
    const timeslotError = req.query.timeslot_error 
        ? req.query.timeslot_error.replace('timeslot_', '') 
        : null;

    try {
        
        const resultsArray = await getAvailableTimeSlots();
        console.log("Time Slot Results:", resultsArray);
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

        console.log("Formatted time slots:", timeSlots);
        res.render('table_reservations', {
            timeSlots,
            timeslotError,
        });
    } catch (err) {
        console.error("Error loading booking page:", err.stack);
        res.status(500).send('Failed to load available time slots.');
    }
};


// view menu
const viewMenu = (req, res) => {
  sql = "SELECT * FROM Menu";

  db.query(sql)
    .then((results) => {
      res.render("item", { data: results });
    })
    .catch((error) => {
      console.error("Error fetching data from database:", error);
      res.status(500).send("Error fetching data");
    });
};

//render reservation form
const renderReservationForm = (req, res) => {
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
};

// timeslot requests
const handleTimeSlotRequest = async (req, res) => {
    const { guests, date, time } = req.query;

    if (!guests || !date || !time) {
        const errorMessage = encodeURIComponent('timeslot_All fields are required.');
        console.log("Missing fields in request:", req.query);
        return res.redirect(`/book-time?timeslot_error=${errorMessage}`);
    }

    const formattedDate = date.split('/').reverse().join('-');
    const formattedTime = time.includes(':') ? `${time}:00` : time;

    try {
        console.log("Formatted Request Data:", { guests, formattedDate, formattedTime });
        // Step 1: Try to find exact match
        const exactResults = await getExactMatchSlot(guests, formattedDate, formattedTime);
        console.log("Exact Match Results:", exactResults);
        let results;
        let message;

        if (exactResults.length > 0) {
            results = exactResults;
            message = 'Here is your requested slot:';
        } else {
            // Step 2: Fallback to closest times on the same date
            const timeResults = await getClosestTimeSlots(guests, formattedDate, formattedTime);
            console.log("Closest Time Results:", timeResults);

            if (timeResults.length > 0) {
                results = timeResults;
                message = 'Closest available times on the selected date:';
            } else {
                // Step 3: Fallback to closest dates
                const dateResults = await getClosestDateSlots(guests, formattedDate);
                console.log("Closest Date Results:", dateResults)

                if (dateResults.length > 0) {
                    results = dateResults;
                    message = 'No slots on the selected date. Here are the closest alternatives:';
                } else {
                    message = 'No available time slots on nearby dates.';
                    results = [];
                }
            }
        }

        // Format results for rendering
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
};

// fetch table id
const fetchTableId = async (req, res) => {
    const { date, time } = req.query;

    if (!date || !time) {
        return res.status(400).send({ error: 'Date and time are required.' });
    }

    const formattedDate = date.split('/').reverse().join('-');  // Convert to YYYY-MM-DD
    console.log("Formatted Date:", formattedDate);  

    try {
        const results = await getTableIdByDateAndTime(formattedDate, time);
        console.log("Query Values:", formattedDate, time);

        if (results.length === 0) {
            return res.status(404).send({ error: 'No table found for the selected date and time.' });
        }

        res.status(200).send({ tableId: results[0].id, tableNumber: results[0].table_number });
    } catch (err) {
        console.error('Error fetching table ID:', err);
        res.status(500).send({ error: 'Internal server error.' });
    }
};


//reserve table
const reserveTable = async (req, res) => {
    const { name, email, phone, Allergies, guests } = req.body;
    const { tableId, tableNumber, date, time } = req.query;

    console.log('Form Data:', req.body);
    console.log('Query Params:', req.query);

    if (!name || !email || !phone || !guests || !tableId || !tableNumber || !date || !time) {
        console.error('Missing data:', { name, email, phone, guests, tableId, tableNumber, date, time });
        return res.status(400).send('Please fill out all required fields.');
    }

    try {
        const isoDate = date.split('/').reverse().join('-');

        const existingReservation = await checkExistingReservation(tableId, isoDate, time);

        if (existingReservation.length > 0) {
            return res.status(400).send('This table is already reserved for the selected time.');
        }

        const reservationData = [
            name, 
            email, 
            phone, 
            guests, 
            tableId, 
            Allergies || null, 
            req.session.userId, 
            isoDate, 
            time
        ];

        await createReservation(reservationData);
        await updateTableStatus(tableId);

        res.redirect(`/Menuorder?tableId=${tableId}&tableNumber=${tableNumber}&success=Reservation confirmed`);
    } catch (error) {
        console.error('Error processing reservation:', error);
        res.status(500).send('There was an error processing your reservation. Please try again.');
    }
};


// Render the menu order page with filters and sorting
const renderMenuOrder = async (req, res) => {
    const sortBy = req.query.sort || "Name";  // Sorting (default by Name)
    const categoryFilter = req.query.category || "All";  // Category filter (default to All)

    try {
        const menuItems = await getMenuItems(categoryFilter, sortBy);  // Fetch menu items
        res.render("menuorder", {
            data: menuItems,
            sortBy,
            categoryFilter
        });
    } catch (error) {
        console.error("Error fetching menu data:", error);
        res.status(500).send("Error fetching data");
    }
};

const cancelReservationHandler = async (req, res) => {
    const { reservation_id } = req.body;
    const userId = req.session.userId;

    if (!reservation_id || !userId) {
        return res.status(400).send('Invalid request.');
    }

    try {
        const reservation = await getReservationById(reservation_id, userId);

        if (!reservation) {
            return res.status(404).send('Reservation not found.');
        }

        // Perform the cancellation
        await cancelReservation(reservation_id, userId);

        // Update table status
        await updateTableStatus(reservation.TableID);

        console.log(`Reservation ${reservation_id} cancelled, Table ${reservation.TableID} marked as available.`);
        res.redirect('/my-orders?success=Reservation cancelled');
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        res.status(500).send('Failed to cancel the reservation. Please try again.');
    }
};



// Render the cart page
const renderCart = (req, res) => {
    const storedCartItems = req.cookies.cartItems ? JSON.parse(req.cookies.cartItems) : []; 
    console.log("Global Reservation Data:", globalReservation);

    res.render("cart", { 
        data: storedCartItems,
        globalReservation
    });
};

// Render the restaurant profile page
const renderRestaurantProfile = (req, res) => {
    res.render("restaurant_profile");
};







// send email confirmation
const sendCartDetails = (req, res) => {
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
  };

// my orders
  const getMyOrders = async (req, res) => {
    const userId = req.session.userId;
    console.log("UserID from session:", userId);

    if (!userId) {
        return res.redirect("/login");
    }

    try {
        // Fetch reservations from model
        const reservationList = await getUserReservations(userId);

        if (reservationList.length === 0) {
            console.log("No reservations found.");
            return res.render("my-orders", { 
                upcomingReservations: [], 
                pastReservations: [] 
            });
        }

        const { upcomingReservations, pastReservations } = filterReservations(reservationList);

        res.render("my-orders", { 
            upcomingReservations, 
            pastReservations 
        });
    } catch (err) {
        console.error("Error fetching reservations:", err);
        res.status(500).send("Error fetching reservations.");
    }
};





// Export functions
module.exports = {
    viewMenu,
    sendCartDetails,
    renderReservationForm,
    renderBookingPage,
    handleTimeSlotRequest,
    fetchTableId,
    reserveTable,
    renderCart,
    renderRestaurantProfile,
    renderMenuOrder,
    getMyOrders,
    cancelReservationHandler,
};