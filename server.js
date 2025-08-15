// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const validator = require('validator');
const path = require('path');

const multer = require('multer');
const upload = multer();

const app = express();

// --- Security & parsing
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (your index.html, style.css, main.js, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// --- Rate limit (per IP)
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 min
    max: 10,              // 10 requests/min
});
app.use('/api/', limiter);

// --- Email transport (SMTP). Put creds in .env (see below)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for 587/25
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Quick check on startup (won’t crash if it fails)
transporter.verify().then(
    () => console.log('SMTP ready'),
    (err) => console.warn('SMTP verify failed:', err?.message)
);



// --- POST /api/quote
app.post('/api/quote',  upload.none(), async (req, res) => {
    try {
        // Honeypot
        if (req.body?.company) {
            return res.json({ ok: true, message: 'Thanks!' });
        }

        // Collect & sanitize
        const name    = (req.body.name || '').trim();
        const email   = (req.body.email || '').trim();
        const phone   = (req.body.phone || '').trim();
        const service = (req.body.service || '').trim();
        const message = (req.body.message || '').trim();

        // Validate
        if (!name || !email || !service || !message) {
            return res.status(400).json({ ok: false, message: 'Please fill in all required fields.' });
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ ok: false, message: 'Please enter a valid email address.' });
        }

        // Optional service whitelist
        const allowed = [
            'Website Development',
            'Application Development',
            'Cross-Platform App',
            'VoIP System',
            'API/Microservice',
        ];
        if (!allowed.includes(service)) {
            return res.status(400).json({ ok: false, message: 'Invalid service selected.' });
        }

        // Build email
        const subject = `New Quote Request: ${service} — ${name}`;
        const html = `
      <h2>New Quote Request</h2>
      <table cellspacing="0" cellpadding="6" border="0">
        <tr><td><strong>Name</strong></td><td>${validator.escape(name)}</td></tr>
        <tr><td><strong>Email</strong></td><td>${validator.escape(email)}</td></tr>
        <tr><td><strong>Phone</strong></td><td>${validator.escape(phone)}</td></tr>
        <tr><td><strong>Service</strong></td><td>${validator.escape(service)}</td></tr>
        <tr><td valign="top"><strong>Project Details</strong></td><td>${validator.escape(message).replace(/\n/g,'<br>')}</td></tr>
      </table>
      <p style="color:#888;">Sent from RootXDigital website.</p>
    `;
        const text =
            `New Quote Request
Name: ${name}
Email: ${email}
Phone: ${phone}
Service: ${service}
Project Details:
${message}
`;

        // Send email
        await transporter.sendMail({
            from: {
                name: process.env.FROM_NAME || 'RootXDigital Quote Bot',
                address: process.env.FROM_EMAIL, // must be your domain mailbox for best deliverability
            },
            to: process.env.TO_EMAIL,          // where you receive requests
            replyTo: `${name} <${email}>`,     // makes replying easy
            subject,
            text,
            html,
        });

        return res.json({ ok: true, message: 'Thanks! Your request has been sent.' });
    } catch (err) {
        console.error('Mail error:', err);
        return res.status(500).json({
            ok: false,
            message: 'Sorry, we could not send your request. Please try again later.',
        });
    }
});

// Fallback: serve index.html for other routes (optional if SPA)
app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RootXDigital server running on :${PORT}`));
