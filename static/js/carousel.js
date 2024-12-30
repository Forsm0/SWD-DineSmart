document.addEventListener('DOMContentLoaded', () => {
    const carouselContainer = document.querySelector('.carousel-container'); // Container holding all carousel items
    const carouselItems = document.querySelectorAll('.carousel-item'); // All carousel items
    const totalItems = carouselItems.length; // Total number of items
    let currentIndex = 0; // Start with the first item

    // Function to automatically show the next image
    function showNextImage() {
        currentIndex = (currentIndex + 1) % totalItems; // Loop back to the first image if at the end
        const translateX = -currentIndex * 100; // Calculate the position for the current image
        carouselContainer.style.transform = `translateX(${translateX}%)`; // Slide to the correct position
    }

    // Automatically switch images every 5 seconds
    setInterval(showNextImage, 5000);

    // Initialize the carousel by showing the first image
    showNextImage();
});


// table time  selector 
