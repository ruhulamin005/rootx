// api/quote.js
const nodemailer = require('nodemailer');

// Make sure you set these in Vercel → Project → Settings → Environment Variables:
// TO_EMAIL, FROM_EMAIL, FROM_NAME, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

module.exports = async (req, res) => {
    // CORS (safe even if same-origin)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    try {
        // ---- Parse JSON body (serverless doesn't auto-parse reliably) ----
        let body = req.body && typeof req.body === 'object' ? req.body : {};
        if (!Object.keys(body).length) {
            let raw = '';
            for await (const chunk of req) raw += chunk;
            try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
        }

        // Accept either "service" or "project"
        const {
            name,
            email,
            phone = '',
            service = '',
            project = '',
            message = '',
            company = '',
            budget = '',
            honeypot = ''
        } = body;

        // Honeypot / spam trap (treat as success but do nothing)
        if (honeypot || body.company_hidden) {
            return res.status(200).json({ ok: true, message: 'Thanks!' });
        }

        const kind = (project || service || '').toString().trim();

        // ---- Basic validation ----
        const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');
        if (!name || !email || !kind || !message) {
            return res.status(400).json({ message: 'Please fill in all required fields.' });
        }
        if (!isEmail(email)) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }

        // ---- Mail transport ----
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: Number(process.env.SMTP_PORT) === 465, // true for 465 (SSL), false for 587 (STARTTLS)
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });

        // ---- Compose & send ----
        const html = `
      <h2>New Quote Request</h2>
      <p><b>Name:</b> ${escapeHtml(name)}</p>
      <p><b>Email:</b> ${escapeHtml(email)}</p>
      ${phone ? `<p><b>Phone:</b> ${escapeHtml(phone)}</p>` : ''}
      ${company ? `<p><b>Company:</b> ${escapeHtml(company)}</p>` : ''}
      ${budget ? `<p><b>Budget:</b> ${escapeHtml(budget)}</p>` : ''}
      <p><b>Service:</b> ${escapeHtml(kind)}</p>
      <p><b>Message:</b><br>${escapeHtml(String(message)).replace(/\n/g, '<br>')}</p>
      <hr><p><small>Submitted: ${new Date().toLocaleString()}</small></p>
    `;

        await transporter.sendMail({
            from: `"${process.env.FROM_NAME || 'RootXDigital'}" <${process.env.FROM_EMAIL}>`,
            to: process.env.TO_EMAIL,
            replyTo: `${name} <${email}>`,
            subject: `New Quote Request - ${kind}`,
            html
        });

        return res.status(200).json({ ok: true, message: 'Thanks! Your request has been sent.' });
    } catch (err) {
        console.error('quote error:', err);
        return res.status(500).json({ ok: false, message: 'Server error. Please try again later.' });
    }
};

// Ensure Node runtime (not Edge)
module.exports.config = { runtime: 'nodejs18.x' };

// Small HTML escape helper
function escapeHtml(s = '') {
    return String(s).replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
}
