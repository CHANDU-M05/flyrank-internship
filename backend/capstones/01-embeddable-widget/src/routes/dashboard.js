const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Recent submissions across all of the tenant's widgets.
router.get('/submissions', async (req, res) => {
  const widgetId = req.query.widget_id;
  const params = [req.tenantId];
  let where = 'tenant_id = $1';
  if (widgetId) {
    params.push(widgetId);
    where += ` AND widget_id = $${params.length}`;
  }
  const result = await pool.query(
    `SELECT id, widget_id, data, geo_country, geo_city, notify_status, created_at
     FROM submissions WHERE ${where} ORDER BY created_at DESC LIMIT 100`,
    params
  );
  res.json({ submissions: result.rows });
});

// Counts over time (daily buckets, last 30 days) + per-widget totals + geo breakdown.
router.get('/stats', async (req, res) => {
  const [byDay, byWidget, byGeo] = await Promise.all([
    pool.query(
      `SELECT date_trunc('day', created_at) AS day, count(*)::int AS count
       FROM submissions WHERE tenant_id = $1 AND created_at > now() - interval '30 days'
       GROUP BY 1 ORDER BY 1`,
      [req.tenantId]
    ),
    pool.query(
      `SELECT w.id AS widget_id, w.title, count(s.id)::int AS count
       FROM widgets w LEFT JOIN submissions s ON s.widget_id = w.id
       WHERE w.tenant_id = $1
       GROUP BY w.id, w.title ORDER BY count DESC`,
      [req.tenantId]
    ),
    pool.query(
      `SELECT coalesce(geo_country, 'Unknown') AS country, count(*)::int AS count
       FROM submissions WHERE tenant_id = $1
       GROUP BY 1 ORDER BY count DESC LIMIT 20`,
      [req.tenantId]
    ),
  ]);

  res.json({
    by_day: byDay.rows,
    by_widget: byWidget.rows,
    by_country: byGeo.rows,
  });
});

module.exports = router;
