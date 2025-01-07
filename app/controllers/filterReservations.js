function filterReservations(reservations) {
    const today = new Date();
    // Force today to use UTC without time component
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const todayDateString = todayUTC.toISOString().split('T')[0];  // 'YYYY-MM-DD'

    const upcomingReservations = [];
    const pastReservations = [];

    reservations.forEach(reservation => {
        // Extract date-only string from reservation date
        const reservationDate = new Date(reservation.Date);
        const reservationDateString = reservationDate.toISOString().split('T')[0];  // 'YYYY-MM-DD'

        console.log('Raw Reservation Date:', reservation.Date);
        console.log('Parsed Reservation Date:', reservationDateString);
        console.log('Today (Date-only UTC):', todayDateString);

        // **Inclusive Comparison**: >= to allow today's reservations
        if (reservationDateString >= todayDateString) {
            console.log(`--> ${reservation.name} is UPCOMING`);
            upcomingReservations.push(reservation);
        } else {
            console.log(`--> ${reservation.name} is PAST`);
            pastReservations.push(reservation);
        }
    });

    return { upcomingReservations, pastReservations };
}





//  exporting the function
module.exports = filterReservations;