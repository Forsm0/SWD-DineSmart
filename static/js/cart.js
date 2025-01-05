class CartItem {
    constructor(id, name, price, imagePath, quantity = 1) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.imagePath = imagePath;
        this.quantity = quantity; // Ensure quantity is 1 if not passed
    }
}

var cartItems = [];

// Add items to cart from product page
document.addEventListener("DOMContentLoaded", () => {
    const cartButtons = document.querySelectorAll(".add-to-cart-button");
    var cartIds = [];
    
    cartButtons.forEach(button => {
        button.addEventListener("click", () => {
            const id = button.getAttribute("data-id");
            const name = button.getAttribute("data-name");
            const price = button.getAttribute("data-price");
            const imagePath = button.getAttribute("data-image");

            if (!cartIds.includes(id)) {
                cartIds.push(id);
                cartItems.push(new CartItem(id, name, price, imagePath));
                button.innerHTML = "Added";
            }

            // Storing cart items in cookies after adding
            document.cookie = `cartItems=${JSON.stringify(cartItems)}; path=/;`;
        });
    });
});

// Handle cart page loading and quantity initialization
document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("go-to-cart")) {
            // Store cart items in cookie when going to cart
            document.cookie = `cartItems=${JSON.stringify(cartItems)}; path=/;`;
            window.location.href = "/cart"; // Redirect to cart page
        }
    });
});

// Increment and decrement cart items
let currentCartItems = [];

// Load cart items from cookie
document.addEventListener("DOMContentLoaded", () => {
    // Retrieve cart items from cookies
    const cartCookie = document.cookie.split('; ').find(row => row.startsWith('cartItems='));
    if (cartCookie) {
        currentCartItems = JSON.parse(cartCookie.split('=')[1]);

        // Initialize cart UI based on the cookie
        currentCartItems.forEach(item => updateCartUI(item.id));
    }

    const incrementButtons = document.querySelectorAll(".increment-button");
    const decrementButtons = document.querySelectorAll(".decrement-button");

    incrementButtons.forEach(button => {
        button.addEventListener("click", () => {
            const itemId = button.getAttribute("data-id");

            const itemIndex = currentCartItems.findIndex(cartItem => cartItem.id === itemId);
            if (itemIndex !== -1) {
                currentCartItems[itemIndex].quantity += 1;
            }

            updateCartUI(itemId);
        });
    });

    decrementButtons.forEach(button => {
        button.addEventListener("click", () => {
            const itemId = button.getAttribute("data-id");

            const itemIndex = currentCartItems.findIndex(cartItem => cartItem.id === itemId);
            if (itemIndex !== -1) {
                // Set quantity to zero but do not remove the item
                currentCartItems[itemIndex].quantity = Math.max(0, currentCartItems[itemIndex].quantity - 1);
            }

            updateCartUI(itemId);
        });
    });

    function updateCartUI(itemId) {
        const cartItem = currentCartItems.find(cartItem => cartItem.id === itemId);
        const quantitySpan = document.getElementById(`quantity-${itemId}`);
        const totalPriceElement = document.getElementById(`total-${itemId}`);
        const totalSumElement = document.getElementById("total-sum");

        if (quantitySpan) {
            quantitySpan.textContent = cartItem ? cartItem.quantity : 0;
        }

        if (totalPriceElement) {
            const totalPrice = cartItem ? cartItem.quantity * cartItem.price : 0;
            totalPriceElement.textContent = `£${totalPrice.toFixed(2)}`;
        }

        if (totalSumElement) {
            const totalSum = currentCartItems.reduce((sum, cartItem) => sum + cartItem.quantity * cartItem.price, 0);
            totalSumElement.textContent = `£${totalSum.toFixed(2)}`;
        }

        // Update cookies after updating the UI
        document.cookie = `cartItems=${JSON.stringify(currentCartItems)}; path=/;`;
    }
});

// Handle proceeding to payment
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("proceed-to-payment").addEventListener("click", async () => {
        try {
            const cartDetails = currentCartItems.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.quantity * item.price,
            }));
            const totalSum = document.getElementById("total-sum").textContent.replace("£", "");

            const emailPayload = {
                cartDetails,
                totalSum,
                customerEmail: prompt("Enter your email address to receive the details:"),
            };

            const response = await fetch("/send-cart-details", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(emailPayload),
            });

            if (response.ok) {
                alert("Cart details sent successfully!");
            } else {
                alert("Failed to send cart details. Please try again.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred while sending the email.");
        }
    });
});
