// Wait for the DOM (HTML content) to be fully loaded before running the script

class CartItem {

    constructor(id,name,price,imagePath){
        this.id = id
        this.name = name
        this.price = price
        this.imagePath = imagePath
    }
}
var cartItems = []

document.addEventListener("DOMContentLoaded", () => {
    // Select all buttons with the class "add-to-cart-button"
    const cartButtons = document.querySelectorAll(".add-to-cart-button");
    var cartIds = []
    // Loop through each button and attach a click event listener
    cartButtons.forEach(button => {
        // Add a click event listener to the current button
        button.addEventListener("click", () => {
            // Retrieve the item's details from the button's data attributes
            const id = button.getAttribute("data-id"); // Get the item's unique ID
            const name = button.getAttribute("data-name"); // Get the item's name
            const price = button.getAttribute("data-price"); // Get the item's price
            const imagePath = button.getAttribute("data-image")
         if (!cartIds.includes(id)) {
            cartIds.push(id)
            cartItems.push(new CartItem(id,name,price,imagePath))
            button.innerHTML = "Added";
         }
        for( const cartItem of cartItems ){
            alert(cartItem.name)
        }
            // Send the item's data to the server using a POST request
         
        });
    });



   
});

document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("go-to-cart")) {
            document.cookie = `cartItems=${JSON.stringify(cartItems)}; path=/;`;
            alert(cartItems);
            alert(`cartItems=${JSON.stringify(cartItems)}; path=/;`);
            window.location.href = "/cart";
        }
    });
});

let currentCartItems = [];
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

            const existingItemIndex = currentCartItems.findIndex(cartItem => cartItem.id === item.id);

            if (existingItemIndex !== -1) {
                currentCartItems[existingItemIndex].quantity += 1;
            } else {
                item.quantity = 1;
                currentCartItems.push(item);
            }

            updateCartUI(item.id);
        });
    });

    // Add click event listener to each decrement button
    decrementButtons.forEach(button => {
        console.log("Decrement event added");
        button.addEventListener('click', () => {
            const itemId = button.getAttribute('data-id');
            const existingItemIndex = currentCartItems.findIndex(cartItem => cartItem.id === itemId);

            if (existingItemIndex !== -1) {
                currentCartItems[existingItemIndex].quantity -= 1;

                if (currentCartItems[existingItemIndex].quantity <= 0) {
                    currentCartItems.splice(existingItemIndex, 1);
                }
            }

            updateCartUI(itemId);
        });
    });

    // Function to update the cart UI
    function updateCartUI(itemId) {
        const cartItem = currentCartItems.find(cartItem => cartItem.id === itemId);
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
            const totalSum = currentCartItems.reduce((sum, cartItem) => sum + cartItem.quantity * cartItem.price, 0);
            totalSumElement.textContent = `£${totalSum.toFixed(2)}`;
        }

        console.log('Updated cart:', currentCartItems);
    }
});


