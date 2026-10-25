require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function run() {
  const email = 'demo@flyrank.test';
  const password = 'demo1234';
  const passwordHash = await bcrypt.hash(password, 10);

  const tenantResult = await pool.query(
    `INSERT INTO tenants (email, password_hash, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [email, passwordHash, 'Demo Tenant']
  );
  const tenantId = tenantResult.rows[0].id;

  const widgetResult = await pool.query(
    `INSERT INTO widgets (tenant_id, type, title, description, fields, button_text)
     VALUES ($1, 'signup_form', 'Newsletter Signup', 'Get product updates', $2, 'Sign me up')
     RETURNING id`,
    [
      tenantId,
      JSON.stringify([
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'name', label: 'Name', type: 'text', required: false },
      ]),
    ]
  );
  const widgetId = widgetResult.rows[0].id;

  console.log('[seed] done');
  console.log(`[seed] tenant login -> email: ${email}  password: ${password}`);
  console.log(`[seed] widget id    -> ${widgetId}`);
  console.log(`[seed] embed snippet -> <script src="http://localhost:${process.env.PORT || 3000}/widget.js?id=${widgetId}"></script>`);

  await pool.end();
}

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
