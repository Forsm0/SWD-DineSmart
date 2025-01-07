const express = require('express');  
const router = express.Router();  
const db = require('../controllers/db');  
const filterReservations = require('../controllers/filterReservations');
const { 
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
    cancelReservationHandler
} = require('../controllers/reservationController');
const isAuthenticated = require('../controllers/authMiddleware');

router.get('/book-time', isAuthenticated, renderBookingPage);
// router.get('/book-time', (req, res) => {
//     console.log("Book-time route hit");
//     res.send("Route is active");
// });


router.get('/timeslots', isAuthenticated, handleTimeSlotRequest);

router.get('/getTableId', fetchTableId);

// reservation form
router.get("/reservation-form", isAuthenticated, renderReservationForm);
  
router.post('/reserve', reserveTable);

// Create a route for viewing menu /
router.get("/Menu", viewMenu);


// Cart Route
router.get('/cart', isAuthenticated, renderCart);

router.post('/send-cart-details', isAuthenticated, sendCartDetails);

// Restaurant Profile Route
router.get('/restaurants', renderRestaurantProfile);

// Menu Order Route
router.get('/menuorder', isAuthenticated, renderMenuOrder);

//my orders
router.get('/my-orders', isAuthenticated, getMyOrders);

// Cancel reservation route
router.post('/cancel-reservation', isAuthenticated, cancelReservationHandler);

module.exports = router;
