// Wait for the DOM (HTML content) to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", () => {
    // Select all buttons with the class "add-to-cart-button"
    const cartButtons = document.querySelectorAll(".add-to-cart-button");

    // Loop through each button and attach a click event listener
    cartButtons.forEach(button => {
        // Add a click event listener to the current button
        button.addEventListener("click", () => {
            // Retrieve the item's details from the button's data attributes
            const id = button.getAttribute("data-id"); // Get the item's unique ID
            const name = button.getAttribute("data-name"); // Get the item's name
            const price = button.getAttribute("data-price"); // Get the item's price

            // Send the item's data to the server using a POST request
            fetch("/cart/add", {
                method: "POST", // Use the POST HTTP method to send data
                headers: {
                    "Content-Type": "application/json", // Specify the request body format as JSON
                },
                // Convert the item's data into a JSON string to send in the request body
                body: JSON.stringify({ id, name, price, quantity: 1 }),
            })
            .then(response => {
                // Check if the server responded with a success status (200–299)
                if (response.ok) {
                    // Notify the user that the item has been added to the cart
                    alert(`${name} has been added to your cart!`);
                } else {
                    // Notify the user if the request failed for some reason
                    alert("Failed to add item to cart. Please try again.");
                }
            })
            .catch(error => {
                // Log any network or request errors to the console for debugging
                console.error("Error adding item to cart:", error);
            });
        });
    });
});
