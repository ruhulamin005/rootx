// api/ping.js
module.exports = (req, res) => {
    console.log('PING hit', { method: req.method, ua: req.headers['user-agent'] });
    res.status(200).json({ ok: true, now: Date.now(), method: req.method });
};

// ensure Node runtime (not Edge)
module.exports.config = { runtime: 'nodejs18.x' };
