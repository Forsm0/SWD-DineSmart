console.log('carts.js is loaded and running');
alert("hi")
// Declare cartItems as an empty array
let cartItems = [];

// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');

    // Select all increment and decrement buttons
    const incrementButtons = document.querySelectorAll('.increment-button');
    const decrementButtons = document.querySelectorAll('.decrement-button');

    console.log('Selected buttons:', incrementButtons, decrementButtons);

    // Add click event listener to each increment button
    incrementButtons.forEach(button => {
        console.log("Increment event added");
        button.addEventListener('click', () => {
            const itemId = button.getAttribute('data-id');
            const itemName = button.getAttribute('data-name');
            const itemPrice = button.getAttribute('data-price');

            const item = {
                id: itemId,
                name: itemName,
                price: parseFloat(itemPrice),
            };

            const existingItemIndex = cartItems.findIndex(cartItem => cartItem.id === item.id);

            if (existingItemIndex !== -1) {
                cartItems[existingItemIndex].quantity += 1;
            } else {
                item.quantity = 1;
                cartItems.push(item);
            }

            updateCartUI(item.id);
        });
    });

    // Add click event listener to each decrement button
    decrementButtons.forEach(button => {
        console.log("Decrement event added");
        button.addEventListener('click', () => {
            const itemId = button.getAttribute('data-id');
            const existingItemIndex = cartItems.findIndex(cartItem => cartItem.id === itemId);

            if (existingItemIndex !== -1) {
                cartItems[existingItemIndex].quantity -= 1;

                if (cartItems[existingItemIndex].quantity <= 0) {
                    cartItems.splice(existingItemIndex, 1);
                }
            }

            updateCartUI(itemId);
        });
    });

    // Function to update the cart UI
    function updateCartUI(itemId) {
        const cartItem = cartItems.find(cartItem => cartItem.id === itemId);
        const quantitySpan = document.getElementById(`quantity-${itemId}`);
        const totalPriceElement = document.getElementById(`total-${itemId}`);
        const totalSumElement = document.getElementById('total-sum');

        if (quantitySpan) {
            quantitySpan.textContent = cartItem ? cartItem.quantity : 0;
        }

        if (totalPriceElement) {
            const totalPrice = cartItem ? cartItem.quantity * cartItem.price : 0;
            totalPriceElement.textContent = `£${totalPrice.toFixed(2)}`;
        }

        // Update the total sum
        if (totalSumElement) {
            const totalSum = cartItems.reduce((sum, cartItem) => sum + cartItem.quantity * cartItem.price, 0);
            totalSumElement.textContent = `£${totalSum.toFixed(2)}`;
        }

        console.log('Updated cart:', cartItems);
    }
});


