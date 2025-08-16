// main.js
const form = document.getElementById('quoteForm');
const msg  = document.getElementById('formMsg');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        msg.textContent = '';
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;

        // turn form fields into a plain object
        const payload = Object.fromEntries(new FormData(form).entries());

        try {
            const res = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => ({}));
            msg.style.color = res.ok ? 'green' : 'crimson';
            msg.textContent = data.message || (res.ok ? 'Thanks! Your request has been sent.' : 'Sorry, something went wrong.');
            if (res.ok) form.reset();
        } catch {
            msg.style.color = 'crimson';
            msg.textContent = 'Network error. Please try again.';
        } finally {
            btn.disabled = false;
        }
    });
}
