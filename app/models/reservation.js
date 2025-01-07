// reservation.js for models
const db = require("../controllers/db");


// get available timslots for book-time
const getAvailableTimeSlots = async () => {
    const sql = `
        SELECT available_date, available_time, table_number, Capacity
        FROM RestaurantTable
        WHERE table_status = 'Available'
        AND available_date >= CURDATE()
        ORDER BY available_date ASC, available_time ASC
        LIMIT 15
    `;
    try {
        console.log("Running SQL Query for Available Slots...");
        const results = await db.query(sql);
        console.log("Query Results:", results);
        return results;
    } catch (err) {
        console.error("Error fetching available slots:", err.stack);
        throw new Error('Failed to fetch available slots');
    }
};

// Exact match query
const getExactMatchSlot = async (guests, formattedDate, formattedTime) => {
    const sql = `
        SELECT available_date, available_time
        FROM RestaurantTable
        WHERE capacity >= ?
        AND available_date = ?
        AND available_time = ?
        AND table_status = 'Available'
    `;
    return await db.query(sql, [guests, formattedDate, formattedTime]);
};

// Time-based fallback query
const getClosestTimeSlots = async (guests, formattedDate, formattedTime) => {
    const sql = `
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
    return await db.query(sql, [guests, formattedDate, formattedTime, guests, formattedDate, formattedTime]);
};

// Date-based fallback query
const getClosestDateSlots = async (guests, formattedDate) => {
    const sql = `
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
    return await db.query(sql, [guests, formattedDate, guests, formattedDate]);
};




// Fetch table ID by date and time
const getTableIdByDateAndTime = async (formattedDate, time) => {
    const sql = `
        SELECT TableID AS id, table_number
        FROM RestaurantTable
        WHERE available_date = ? AND available_time = ?
    `;
    return await db.query(sql, [formattedDate, time]);
};


// Check if a reservation already exists
const checkExistingReservation = async (tableId, date, time) => {
    const sql = `
        SELECT * FROM Reservation WHERE TableID = ? AND Date = ? AND StartTime = ?
    `;
    return await db.query(sql, [tableId, date, time]);
};

// Create a new reservation
const createReservation = async (reservationData) => {
    const sql = `
        INSERT INTO Reservation (name, email, phone_number, number_of_guests, TableID, Allergies, UserID, Date, StartTime)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return await db.query(sql, reservationData);
};

// Update table status to reserved
const updateTableStatus = async (tableId) => {
    const sql = `
        UPDATE RestaurantTable
        SET table_status = 'reserved'
        WHERE TableID = ?
    `;
    return await db.query(sql, [tableId]);
};

// Fetch menu items with optional filters
const getMenuItems = async (categoryFilter, sortBy) => {
    let sql = "SELECT * FROM Menu";
    const queryParams = [];

    // Apply category filter if provided
    if (categoryFilter && categoryFilter !== "All") {
        sql += " WHERE Category = ?";
        queryParams.push(categoryFilter);
    }

    // Apply sorting
    switch (sortBy) {
        case "PriceAsc":
            sql += " ORDER BY Price ASC";
            break;
        case "PriceDesc":
            sql += " ORDER BY Price DESC";
            break;
        default:
            sql += " ORDER BY Name ASC";
    }

    // Execute and return query results
    return await db.query(sql, queryParams);
};

const getUserReservations = async (userId) => {
    const sql = `
        SELECT r.ReservationID AS reservation_id, 
               r.Date, 
               r.StartTime, 
               r.Number_of_guests, 
               r.Allergies, 
               r.name
        FROM Reservation r
        WHERE r.UserID = ?
        ORDER BY r.Date ASC, r.StartTime ASC
    `;

    const reservations = await db.query(sql, [userId]);
    return Array.isArray(reservations) ? reservations : (reservations ? [reservations] : []);
};

// Fetch reservation by ID and User
const getReservationById = async (reservationId, userId) => {
    const result = await db.query(`
        SELECT TableID FROM Reservation 
        WHERE ReservationID = ? AND UserID = ?
    `, [reservationId, userId]);

    return result[0];  // Return the reservation or undefined
};

// Cancel reservation
const cancelReservation = async (reservationId, userId) => {
    const result = await db.query(`
        DELETE FROM Reservation 
        WHERE ReservationID = ? AND UserID = ?
    `, [reservationId, userId]);
    return result;
};

// Update table status to 'Available'
const updateTableStatuscancel = async (tableId) => {
    const result = await db.query(`
        UPDATE RestaurantTable
        SET table_status = 'Available'
        WHERE TableID = ?
    `, [tableId]);
    return result;
};





module.exports = { 
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
};

module.exports.getExactMatchSlot = getExactMatchSlot;
