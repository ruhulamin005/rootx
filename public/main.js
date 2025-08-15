// Smooth scroll
// document.querySelectorAll('a[href^="#"]').forEach(anchor => {
//   anchor.addEventListener("click", function (e) {
//     e.preventDefault();
//     document.querySelector(this.getAttribute("href")).scrollIntoView({
//       behavior: "smooth",
//     });
//   });
// });
//
// // Form success alert
// document.getElementById('quoteForm').addEventListener('submit', function(e) {
//   alert("Your request has been sent! We'll contact you soon.");
// });

// /public/main.js
const form = document.getElementById('quoteForm');
const msg  = document.getElementById('formMsg');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        msg.textContent = '';
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;

        try {
            const res = await fetch(form.action, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: new FormData(form)
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                msg.style.color = 'green';
                msg.textContent = data.message || 'Thanks! Your request has been sent.';
                form.reset();
            } else {
                msg.style.color = 'crimson';
                msg.textContent = data.message || 'Sorry, something went wrong.';
            }
        } catch (err) {
            msg.style.color = 'crimson';
            msg.textContent = 'Network error. Please try again.';
        } finally {
            btn.disabled = false;
        }
    });
}
