const jwt = require('jsonwebtoken');

function signToken(tenant) {
  return jwt.sign({ tenantId: tenant.id, email: tenant.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

// Rejects any request without a valid bearer token. Attaches req.tenantId
// so every downstream query can scope to it — this IS the tenant isolation
// boundary, enforced once, here, not re-implemented per route.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.tenantId = payload.tenantId;
    req.tenantEmail = payload.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { signToken, requireAuth };
