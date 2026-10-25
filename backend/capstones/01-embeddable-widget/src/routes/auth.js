const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const pool = require('../db/pool');
const { signToken } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(200),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', validateBody(registerSchema), async (req, res) => {
  const { email, password, name } = req.validatedBody;
  const existing = await pool.query('SELECT id FROM tenants WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'An account with that email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO tenants (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
    [email, passwordHash, name]
  );
  const tenant = result.rows[0];
  res.status(201).json({ tenant, token: signToken(tenant) });
});

router.post('/login', validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.validatedBody;
  const result = await pool.query('SELECT id, email, name, password_hash FROM tenants WHERE email = $1', [email]);
  const tenant = result.rows[0];

  if (!tenant || !(await bcrypt.compare(password, tenant.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({
    tenant: { id: tenant.id, email: tenant.email, name: tenant.name },
    token: signToken(tenant),
  });
});

module.exports = router;
