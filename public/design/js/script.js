// script.js
// Handle scroll event to change navbar style
window.addEventListener('scroll', function() {
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  
  if (window.scrollY > 200) { // Adjust threshold as needed
      navbar.classList.add('scrolled');
      navLinks.forEach(navLink => {
        navLink.classList.add('text-light');
      });
  } else {
      navbar.classList.remove('scrolled');
      navLinks.forEach(navLink => {
        navLink.classList.remove('text-light');
      });
  }
});

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);



  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);




  // Function to initialize the Owl Carousel
  function initializeCarousel() {
      const owl = document.querySelector('.owl-carousel');

      // Initialize the carousel with custom options
      $(owl).owlCarousel({
          items: 1,
          loop: true,
          autoplay: true,
          autoplayTimeout: 5000, // Auto-scroll after 4 seconds
          autoplayHoverPause: true, // Pause on hover
          dots: false, // Enable dots for navigation
          nav: false // Disable default navigation buttons
      });
  }


  // Initialize everything on window load
  window.addEventListener('load', function() {
      initializeCarousel();
  });





  document.addEventListener("DOMContentLoaded", () => {
    const emailList = document.querySelector(".email-list");
    const emailItems = document.querySelectorAll(".email-item");
    let currentIndex = 0;

    function updateFocus() {
      // Reset opacity and blur on all items
      emailItems.forEach(item => item.classList.remove("focused"));

      // Add focus to the current item
      emailItems[currentIndex].classList.add("focused");

      // Move the list up to show the current item in focus
      const offset = -currentIndex * 50; // Adjust based on item height
      emailList.style.transform = `translateY(${offset}px)`;

      // Update the index, looping back to start
      currentIndex = (currentIndex + 1) % emailItems.length;
    }

    // Initialize the first focus
    updateFocus();

    // Set interval to change focus every 4 seconds
    setInterval(updateFocus, 4000);
  });



// Slide-in, slide-out, and auto-remove logic
document.querySelectorAll('.message').forEach((message, index) => {
  // Add slide-in effect
  setTimeout(() => {
      message.classList.add('show'); // Add 'show' class for animation

      // Auto-remove after 3 seconds
      setTimeout(() => {
          message.classList.add('remove'); // Slide out
          setTimeout(() => {
              message.style.display = 'none'; // Hide the element
          }, 500); // Match remove animation duration
      }, 3000);
  }, index * 1000); // Stagger animations

  // Close button functionality
  const closeButton = message.querySelector('.close-btn');
  if (closeButton) {
      closeButton.addEventListener('click', () => {
          message.classList.add('remove'); // Slide out immediately
          setTimeout(() => {
              message.style.display = 'none'; // Hide element
          }, 500); // Match remove animation duration
      });
  }
});
