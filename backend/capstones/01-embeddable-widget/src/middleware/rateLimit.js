const rateLimit = require('express-rate-limit');

// Keyed by IP + widget id so one abusive visitor can't exhaust another
// widget's quota, and a burst against widget A doesn't throttle widget B.
const submissionLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  max: Number(process.env.RATE_LIMIT_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${req.query.id || req.body?.widgetId || 'unknown'}`,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many submissions. Please try again shortly.' });
  },
});

module.exports = { submissionLimiter };
