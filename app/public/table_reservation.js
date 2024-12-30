document.addEventListener('DOMContentLoaded', () => {
    const timeButtons = document.querySelectorAll('.time-slot'); // Time slot buttons
    const confirmButton = document.querySelector('.select-container button'); // Confirm button
    let selectedTime = null; // To store the selected time button

    // Handle time slot button click
    timeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove 'selected' class from previously selected button
            if (selectedTime) {
                selectedTime.classList.remove('selected');
            }
            // Mark the clicked button as selected
            button.classList.add('selected');
            selectedTime = button;
        });
    });

    // Handle confirm button click
    confirmButton.addEventListener('click', async () => {
        if (!selectedTime) {
            alert('Please select a time before confirming.');
            return;
        }

        // Get the selected time and date from the selected button's dataset
        const selectedTimeValue = selectedTime.dataset.time; // Selected time
        const selectedDate = selectedTime.dataset.date; // Selected date

        try {
            // Fetch table ID based on selected date and time
            const response = await fetch(`/getTableId?date=${selectedDate}&time=${selectedTimeValue}`);
            const data = await response.json();

            if (response.ok && data.tableId && data.tableNumber) {
                // Redirect to reservation form with table details
                const reservationUrl = `/reservation-form?tableId=${data.tableId}&tableNumber=${data.tableNumber}`;
                console.log("Redirecting to:", reservationUrl); // Debugging the URL
                window.location.href = reservationUrl;
            } else {
                alert(data.error || 'Error fetching table details.');
            }
        } catch (error) {
            console.error('Error fetching table ID:', error);
            alert('Something went wrong. Please try again.');
        }
    });
});
