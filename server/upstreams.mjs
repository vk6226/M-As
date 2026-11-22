/**
 * Server-side upstream proxies for live market data.
 *
 * Shared by:
 *   - vite.config.ts      (npm run dev / npm run preview)
 *   - server/index.mjs    (production Node server, used by the Dockerfile)
 *   - lambda/data_proxy.mjs (AWS Lambda behind CloudFront)
 *
 * SEC EDGAR: needs a User-Agent with a contact email; sends no CORS headers.
 * NSE India: needs browser-like headers and session cookies obtained by first
 *            loading an NSE page. NSE moved its site from nseindia.com to
 *            nseindia.in in 2026; the host is configurable via NSE_HOST.
 *
 * Only allow-listed hosts and paths are reachable, so this is not an open proxy.
 */

const SEC_ROUTES = [
  { prefix: '/api/sec/data/', origin: 'https://data.sec.gov/', ttl: 600 },
  { prefix: '/api/sec/efts/', origin: 'https://efts.sec.gov/', ttl: 300 },
  { prefix: '/api/sec/www/files/', origin: 'https://www.sec.gov/files/', ttl: 86400 },
];

const NSE_ALLOWED = /^\/(NextApi\/(apiClient\/GetQuoteApi|globalSearch\/[a-z]+)|results-comparision|corporate-share-holdings-master|corporate-announcements|corporate-board-meetings|corporates-financial-results|integrated-filing-results|annual-reports|corporates-corporateActions|event-calendar|equity-stockIndices)$/;

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';

/* ---------------- NSE session (cookie jar) ---------------- */
const nse = { cookies: '', fetchedAt: 0, priming: null };

function nseOrigin() {
  return process.env.NSE_ORIGIN || `https://${process.env.NSE_HOST || 'www.nseindia.in'}`;
}

function nseHeaders(extra = {}) {
  const origin = nseOrigin();
  return {
    'User-Agent': BROWSER_UA,
    Accept: '*/*',
    'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
    Referer: `${origin}/get-quotes/equity?symbol=SBIN`,
    'X-Requested-With': 'XMLHttpRequest',
    ...extra,
  };
}

async function primeNseSession(force = false) {
  const fresh = Date.now() - nse.fetchedAt < 4 * 60 * 1000;
  if (!force && nse.cookies && fresh) return;
  if (nse.priming) return nse.priming;
  nse.priming = (async () => {
    const res = await fetch(`${nseOrigin()}/get-quotes/equity?symbol=SBIN`, {
      headers: nseHeaders({ Accept: 'text/html,application/xhtml+xml' }),
      redirect: 'follow',
    });
    const set = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
    if (set.length) {
      nse.cookies = set.map((c) => c.split(';')[0]).join('; ');
      nse.fetchedAt = Date.now();
    }
    await res.arrayBuffer().catch(() => undefined);
  })().finally(() => {
    nse.priming = null;
  });
  return nse.priming;
}

async function fetchNse(apiPath, query) {
  if (!NSE_ALLOWED.test(apiPath)) return { status: 404, body: JSON.stringify({ error: 'Endpoint not allowed' }), type: 'application/json' };
  const url = `${nseOrigin()}/api${apiPath}${query ? `?${query}` : ''}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    await primeNseSession(attempt > 0);
    const res = await fetch(url, { headers: nseHeaders({ Cookie: nse.cookies }) });
    const body = await res.text();
    const type = res.headers.get('content-type') ?? '';
    // NSE answers blocked or cookie-less requests with 401/403 or an HTML page.
    if ((res.status === 401 || res.status === 403 || !type.includes('json')) && attempt === 0) {
      nse.fetchedAt = 0;
      continue;
    }
    if (!type.includes('json')) {
      return {
        status: 502,
        type: 'application/json',
        body: JSON.stringify({ error: 'NSE refused the request. NSE often blocks cloud/datacenter IP addresses; run the proxy from an Indian ISP or residential/office network, or use a licensed data feed.' }),
      };
    }
    return { status: res.status, body, type: 'application/json', ttl: 300 };
  }
}

async function fetchSec(path, query) {
  const route = SEC_ROUTES.find((r) => path.startsWith(r.prefix));
  if (!route) return null;
  const url = route.origin + path.slice(route.prefix.length) + (query ? `?${query}` : '');
  const res = await fetch(url, {
    headers: { 'User-Agent': process.env.SEC_USER_AGENT || 'AURA M&A Platform admin@example.com', Accept: 'application/json' },
  });
  return { status: res.status, body: await res.text(), type: res.headers.get('content-type') ?? 'application/json', ttl: route.ttl };
}

/** Returns a response for /api/sec/* and /api/nse/* paths, or null if the path is not handled. */
export async function handleDataRequest(pathname, query) {
  try {
    if (pathname.startsWith('/api/sec/')) return await fetchSec(pathname, query);
    if (pathname.startsWith('/api/nse/')) return await fetchNse(pathname.slice('/api/nse'.length), query);
    return null;
  } catch (e) {
    return { status: 502, type: 'application/json', body: JSON.stringify({ error: `Upstream unreachable: ${e?.message ?? e}` }) };
  }
}

/** Connect/Express-style middleware (used by Vite and the Node server). */
export function dataMiddleware() {
  return async (req, res, next) => {
    if (!req.url?.startsWith('/api/sec/') && !req.url?.startsWith('/api/nse/')) return next();
    if (req.method !== 'GET') {
      res.statusCode = 405;
      return res.end('Method not allowed');
    }
    const [pathname, query = ''] = req.url.split('?');
    const out = await handleDataRequest(pathname, query);
    if (!out) return next();
    res.statusCode = out.status;
    res.setHeader('Content-Type', out.type);
    res.setHeader('Cache-Control', out.status < 400 && out.ttl ? `public, max-age=${out.ttl}` : 'no-store');
    res.end(out.body);
  };
}
