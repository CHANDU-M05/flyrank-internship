// IP -> geo enrichment with a two-provider fallback chain. This function
// NEVER throws — a submission must be storable even if both providers are
// down. It returns { country, city, provider } or { country: null, city:
// null, provider: null } on total failure.

const TIMEOUT_MS = 2500;

async function fetchWithTimeout(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function tryProviderA(ip) {
  if (process.env.MOCK_GEO_A_DOWN === 'true' || process.env.MOCK_GEO_ALL_DOWN === 'true') {
    throw new Error('provider A mocked down');
  }
  const base = process.env.GEO_PROVIDER_A_URL || 'http://ip-api.com/json';
  const res = await fetchWithTimeout(`${base}/${ip}`);
  if (!res.ok) throw new Error(`provider A HTTP ${res.status}`);
  const body = await res.json();
  if (body.status === 'fail') throw new Error(`provider A: ${body.message}`);
  return { country: body.country || null, city: body.city || null, provider: 'A' };
}

async function tryProviderB(ip) {
  if (process.env.MOCK_GEO_ALL_DOWN === 'true') {
    throw new Error('provider B mocked down');
  }
  const base = process.env.GEO_PROVIDER_B_URL || 'https://ipapi.co';
  const res = await fetchWithTimeout(`${base}/${ip}/json/`);
  if (!res.ok) throw new Error(`provider B HTTP ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(`provider B: ${body.reason}`);
  return { country: body.country_name || null, city: body.city || null, provider: 'B' };
}

async function enrichIp(ip) {
  // Skip enrichment for loopback/private addresses during local dev so we
  // don't waste calls on 127.0.0.1 — treat it as "no geo data", not a failure.
  if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('::ffff:127.')) {
    return { country: null, city: null, provider: null };
  }

  try {
    return await tryProviderA(ip);
  } catch (errA) {
    console.warn('[geo] provider A failed, falling back to B:', errA.message);
    try {
      return await tryProviderB(ip);
    } catch (errB) {
      console.warn('[geo] provider B also failed, storing without geo:', errB.message);
      return { country: null, city: null, provider: null };
    }
  }
}

module.exports = { enrichIp };
