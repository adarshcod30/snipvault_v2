/**
 * SnipVault API + UI (v2, hardened).
 *
 * Every defect the v1 assessment surfaced is fixed here, and the attack-payload
 * classes (SQLi / XSS / SSRF / open redirect / broken auth) are closed too:
 *
 *   - helmet sets a CSP and the standard security headers; X-Powered-By is off
 *   - a rate limiter caps requests per IP
 *   - CORS is a single configured origin or same-origin only, never '*'
 *   - secrets come only from the environment (see config.js); none are committed
 *   - the id lookup is integer-only and leaks no query or driver error
 *   - search output is HTML-escaped
 *   - the link-preview endpoint refuses private and metadata hosts
 *   - the share bounce only redirects to same-site paths
 *   - the admin route requires a bearer token and returns no secrets
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { store } from './store.js';
import { PAGE } from './frontend.js';

export const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));

// Security headers + CSP. 'unsafe-inline' is scoped to the bundled inline UI;
// the app pulls no third-party scripts or styles.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
}));

// A single allowed cross-origin, or same-origin only. Never '*', never
// credentials against a wildcard.
app.use(cors(config.corsOrigin
  ? { origin: config.corsOrigin, credentials: true }
  : { origin: false }));

app.use(rateLimit({
  windowMs: 60_000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
}));

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** True for hosts that must never be reachable through a server-side fetch. */
function isPrivateHost(host) {
  const h = host.toLowerCase().replace(/:\d+$/, '');
  if (h === 'localhost' || h.endsWith('.local') || h === 'metadata.google.internal') return true;
  if (h === '169.254.169.254') return true;
  return /^(127\.|10\.|192\.168\.|169\.254\.|::1|fe80:|fc00:|fd00:)/.test(h)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(h);
}

function requireAdmin(req, res, next) {
  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!config.adminToken || token !== config.adminToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

app.get('/', (req, res) => res.type('html').send(PAGE));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'snipvault', version: '2.0.0' }));

app.get('/api/snippets', (req, res) => res.json({ snippets: store.all() }));

app.post('/api/snippets', (req, res) => {
  const { title, code } = req.body ?? {};
  if (typeof title !== 'string' || !title.trim() || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'title and code are required' });
  }
  return res.status(201).json(store.create(req.body));
});

// Integer-only lookup; a missing or malformed id is a clean 404, no leak.
app.get('/api/snippets/:id', (req, res) => {
  const row = store.findById(req.params.id);
  if (!row) return res.status(404).json({ error: 'Snippet not found' });
  return res.json(row);
});

app.delete('/api/snippets/:id', requireAdmin, (req, res) => {
  const ok = store.remove(req.params.id);
  return res.status(ok ? 200 : 404).json({ deleted: ok });
});

// Search output is escaped before it is written into HTML.
app.get('/api/search', (req, res) => {
  const q = String(req.query.q ?? '');
  const results = store.all().filter((s) => s.code.includes(q) || s.title.includes(q));
  res.type('html').send(
    `<h1>Results for ${escapeHtml(q)}</h1><p>${results.length} snippet(s) matched.</p>`,
  );
});

// Admin: bearer-gated, and it returns counts only, never secrets.
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  return res.json({ snippets: store.count(), env: config.env });
});

// Link preview with an SSRF guard: only public http(s) hosts are fetched.
app.get('/api/fetch', (req, res) => {
  const raw = String(req.query.url ?? '');
  let url;
  try { url = new URL(raw); } catch { return res.status(400).json({ error: 'Invalid url' }); }
  if (!/^https?:$/.test(url.protocol)) return res.status(400).json({ error: 'Only http(s) URLs are allowed' });
  if (isPrivateHost(url.host)) return res.status(400).json({ error: 'That host is not allowed' });
  return res.json({ url: raw, ok: true, title: `Preview of ${url.host}`, fetchedAt: new Date().toISOString() });
});

// Share bounce: same-site relative paths only, never an absolute off-site URL.
app.get('/go', (req, res) => {
  const next = String(req.query.next || '/');
  if (!next.startsWith('/') || next.startsWith('//')) {
    return res.status(400).json({ error: 'Only same-site redirects are allowed' });
  }
  return res.redirect(next);
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

export default app;
