/**
 * Production server: serves the built app from dist/ and the live data
 * proxies (/api/sec/*, /api/nse/*). Zero dependencies; Node 20+.
 *
 *   npm run build && npm start        # http://localhost:8080
 */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { dataMiddleware } from './upstreams.mjs';

const ROOT = fileURLToPath(new URL('../dist/', import.meta.url));
const PORT = Number(process.env.PORT || 8080);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain' };
const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

const data = dataMiddleware();

async function serveStatic(req, res) {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = normalize(join(ROOT, url));
  if (!file.startsWith(ROOT)) {
    res.writeHead(400);
    return res.end();
  }
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
  } catch {
    file = join(ROOT, 'index.html'); // SPA fallback
  }
  try {
    let body = await readFile(file);
    const type = TYPES[extname(file)] || 'application/octet-stream';
    const headers = { 'Content-Type': type, ...SECURITY };
    headers['Cache-Control'] = file.includes(`${'/'}assets${'/'}`) ? 'public, max-age=31536000, immutable' : 'no-cache';
    if (/gzip/.test(req.headers['accept-encoding'] || '') && /text|javascript|json|svg/.test(type) && body.length > 1024) {
      body = gzipSync(body);
      headers['Content-Encoding'] = 'gzip';
    }
    res.writeHead(200, headers);
    res.end(body);
  } catch {
    res.writeHead(404, SECURITY);
    res.end('Not found');
  }
}

http
  .createServer((req, res) => data(req, res, () => serveStatic(req, res)))
  .listen(PORT, () => console.log(`AURA M&A running on http://localhost:${PORT}`));
