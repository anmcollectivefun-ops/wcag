import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4173);
const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.webmanifest', 'application/manifest+json'],
  ['.json', 'application/json; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.woff2', 'font/woff2'],
  ['.woff', 'font/woff']
]);

function resolveResource(requestUrl) {
  let pathname;
  try { pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname); }
  catch { return null; }
  if (pathname === '/') pathname = '/index.html';
  const resolved = path.resolve(root, `.${pathname}`);
  if (!resolved.startsWith(`${root}${path.sep}`) || !contentTypes.has(path.extname(resolved))) return null;
  return resolved;
}

export const server = http.createServer(async (req, res) => {
  const headers = {
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store'
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { ...headers, Allow: 'GET, HEAD' }); res.end('Method not allowed'); return;
  }
  const resource = resolveResource(req.url || '/');
  if (!resource) { res.writeHead(404, headers); res.end('Not found'); return; }
  try {
    const info = await stat(resource);
    if (!info.isFile()) throw new Error('Not a file');
    const body = await readFile(resource);
    res.writeHead(200, { ...headers, 'Content-Type': contentTypes.get(path.extname(resource)) });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404, headers); res.end('Not found');
  }
});

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  server.listen(port, host, () => console.log(`ANM Access: http://${host}:${port}`));
}
