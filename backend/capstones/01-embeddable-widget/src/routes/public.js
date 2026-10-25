const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { z } = require('zod');
const pool = require('../db/pool');
const { validateBody } = require('../middleware/validate');
const { submissionLimiter } = require('../middleware/rateLimit');
const { enrichIp } = require('../services/geo');
const { notifySafely } = require('../services/notify');

const router = express.Router();

// This is a product other people's websites embed — any origin must be
// allowed to load the config and post a submission. That's not a gap, it's
// the point; abuse is handled by rate limiting + spam control below, not
// by trying to allowlist the whole public internet.
const publicCors = cors({ origin: true, methods: ['GET', 'POST', 'OPTIONS'] });
router.use(publicCors);
router.options('*', publicCors);

function getClientIp(req) {
  // Trust X-Forwarded-For only if you also set `app.set('trust proxy', ...)`
  // deliberately in index.js — otherwise req.ip is already correct.
  return req.ip;
}

// --- Versioned widget bundle -------------------------------------------
// Long cache lifetime: the URL only changes when the query-string version
// changes, so it's safe to cache "forever" until then.
router.get('/widget.js', (req, res) => {
  const bundle = fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'widget.js'), 'utf8');
  res.set('Content-Type', 'application/javascript');
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(bundle);
});

// --- Public widget config ------------------------------------------------
// Short cache lifetime: reflects edits reasonably quickly without hammering
// the DB on every page load.
router.get('/widgets/:id/config', async (req, res) => {
  const result = await pool.query(
    'SELECT id, type, title, description, fields, button_text, display, bundle_version, is_active FROM widgets WHERE id = $1',
    [req.params.id]
  );
  if (result.rows.length === 0 || !result.rows[0].is_active) {
    return res.status(404).json({ error: 'Widget not found' });
  }
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ widget: result.rows[0] });
});

// --- Submission ------------------------------------------------------------
const submissionSchema = z.object({
  widgetId: z.string().uuid(),
  data: z.record(z.string().max(5000)).refine((obj) => Object.keys(obj).length <= 30, {
    message: 'Too many fields',
  }),
  // Hidden field real users never fill. A bot that fills every input trips
  // this and gets silently dropped — no error that teaches it to adapt.
  website: z.string().max(200).optional(),
});

router.post(
  '/submissions',
  express.json({ limit: '20kb' }), // oversized payloads rejected before they even reach validation
  submissionLimiter,
  validateBody(submissionSchema),
  async (req, res) => {
    const { widgetId, data, website } = req.validatedBody;

    // Honeypot: a filled decoy field means "not human". Respond as if it
    // worked so the bot gets no signal to adjust its behavior.
    if (website && website.trim().length > 0) {
      console.warn(`[spam] honeypot triggered for widget ${widgetId}`);
      return res.status(202).json({ status: 'received' });
    }

    const widgetResult = await pool.query('SELECT * FROM widgets WHERE id = $1 AND is_active = true', [widgetId]);
    if (widgetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    const widget = widgetResult.rows[0];

    // Validate submitted field names against the widget's own field
    // definitions — the server decides what's acceptable, not the client.
    const allowedFields = new Set(widget.fields.map((f) => f.name));
    for (const key of Object.keys(data)) {
      if (!allowedFields.has(key)) {
        return res.status(400).json({ error: `Unexpected field: ${key}` });
      }
    }
    for (const field of widget.fields) {
      if (field.required && !data[field.name]) {
        return res.status(400).json({ error: `Missing required field: ${field.name}` });
      }
    }

    const ip = getClientIp(req);
    // Enrichment can never fail this request — enrichIp already swallows
    // its own errors and returns a "no geo" shape instead of throwing.
    const geo = await enrichIp(ip);

    const insertResult = await pool.query(
      `INSERT INTO submissions (widget_id, tenant_id, data, ip_address, geo_country, geo_city, geo_provider)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [widget.id, widget.tenant_id, JSON.stringify(data), ip, geo.country, geo.city, geo.provider]
    );
    const submission = insertResult.rows[0];

    // Safe side effect: runs after the row is already committed, and its
    // outcome is recorded but never allowed to change the HTTP response.
    const notifyStatus = await notifySafely(submission, widget);
    await pool.query('UPDATE submissions SET notify_status = $1 WHERE id = $2', [notifyStatus, submission.id]);

    res.status(201).json({ status: 'stored', id: submission.id });
  }
);

module.exports = router;
