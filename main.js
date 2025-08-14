// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});

// Form success alert
document.getElementById('quoteForm').addEventListener('submit', function(e) {
  alert("Your request has been sent! We'll contact you soon.");
});
