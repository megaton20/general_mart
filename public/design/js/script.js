const navToggle = document.getElementById('my-navToggle');
const navLinks = document.getElementById('my-navLinks');
const closeBtn = document.getElementById('my-closeBtn');

// Sidebar toggle open function
navToggle.addEventListener('click', () => {
  navLinks.style.transform = 'translateX(300px)';
});

// Sidebar close function
closeBtn.addEventListener('click', () => {
  navLinks.style.transform = 'translateX(-350px)';
});
