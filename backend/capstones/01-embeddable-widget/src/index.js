require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const widgetRoutes = require('./routes/widgets');
const publicRoutes = require('./routes/public');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// The admin surface (auth, widget CRUD, dashboard) is restricted to a
// known set of origins — unlike the public widget/submission API, which
// deliberately accepts any origin (see routes/public.js).
const adminAllowedOrigins = (process.env.PUBLIC_ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  ['/auth', '/widgets', '/dashboard'],
  cors({
    origin: adminAllowedOrigins.length > 0 ? adminAllowedOrigins : true,
  }),
  express.json({ limit: '1mb' })
);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Public routes MUST mount before the admin /widgets router. Both define
// paths under /widgets/*, and Express matches in mount order — mounting
// admin first would catch GET /widgets/:id/config with requireAuth and
// return a false 401 on a route that's supposed to be public.
app.use('/', publicRoutes); // /widget.js, /widgets/:id/config, /submissions

app.use('/auth', authRoutes);
app.use('/widgets', widgetRoutes);
app.use('/dashboard', dashboardRoutes);

// Central error handler: anything that slips past route-level handling
// becomes a clean JSON 4xx/5xx, never an unhandled crash or an HTML stack
// trace leaking to the internet.
app.use((err, req, res, next) => {
  console.error('[error]', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.expose ? err.message : 'Internal server error' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
});
