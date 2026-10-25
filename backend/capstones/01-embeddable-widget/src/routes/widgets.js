const express = require('express');
const { z } = require('zod');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { buildEmbedSnippet } = require('../utils/snippet');

const router = express.Router();
router.use(requireAuth);

const fieldSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'email', 'tel', 'textarea']).default('text'),
  required: z.boolean().default(false),
});

const widgetSchema = z.object({
  type: z.enum(['signup_form', 'cta_popover', 'contact_form']),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  fields: z.array(fieldSchema).min(1).max(20),
  button_text: z.string().min(1).max(50).default('Submit'),
  display: z.record(z.any()).default({}),
});

// Every query below is scoped with `WHERE tenant_id = req.tenantId` — that
// single clause, applied consistently, IS the multi-tenant isolation
// boundary. There is no other place isolation could silently leak.

router.get('/', async (req, res) => {
  const result = await pool.query(
    'SELECT id, type, title, description, button_text, is_active, bundle_version, created_at FROM widgets WHERE tenant_id = $1 ORDER BY created_at DESC',
    [req.tenantId]
  );
  res.json({ widgets: result.rows });
});

router.post('/', validateBody(widgetSchema), async (req, res) => {
  const { type, title, description, fields, button_text, display } = req.validatedBody;
  const result = await pool.query(
    `INSERT INTO widgets (tenant_id, type, title, description, fields, button_text, display)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [req.tenantId, type, title, description || null, JSON.stringify(fields), button_text, JSON.stringify(display)]
  );
  const widget = result.rows[0];
  res.status(201).json({ widget, embed_snippet: buildEmbedSnippet(widget.id) });
});

router.get('/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM widgets WHERE id = $1 AND tenant_id = $2', [
    req.params.id,
    req.tenantId,
  ]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Widget not found' });
  const widget = result.rows[0];
  res.json({ widget, embed_snippet: buildEmbedSnippet(widget.id) });
});

router.put('/:id', validateBody(widgetSchema), async (req, res) => {
  const { type, title, description, fields, button_text, display } = req.validatedBody;
  const result = await pool.query(
    `UPDATE widgets
     SET type = $1, title = $2, description = $3, fields = $4, button_text = $5,
         display = $6, bundle_version = bundle_version + 1, updated_at = now()
     WHERE id = $7 AND tenant_id = $8
     RETURNING *`,
    [type, title, description || null, JSON.stringify(fields), button_text, JSON.stringify(display), req.params.id, req.tenantId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Widget not found' });
  res.json({ widget: result.rows[0] });
});

router.delete('/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM widgets WHERE id = $1 AND tenant_id = $2 RETURNING id', [
    req.params.id,
    req.tenantId,
  ]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Widget not found' });
  res.status(204).send();
});

module.exports = router;
