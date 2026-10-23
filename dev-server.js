const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const letter = require('./api/letter');

const root = __dirname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.gif': 'image/gif', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ics': 'text/calendar' };

http.createServer(async (req, res) => {
  if (req.url.split('?')[0] === '/api/letter') {
    res.status = code => { res.statusCode = code; return res; };
    res.json = value => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(value)); };
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 4096) throw new Error('Request too large');
      }
      req.body = body ? JSON.parse(body) : {};
      await letter(req, res);
    } catch (_) { res.status(400).json({ error: 'Invalid request' }); }
    return;
  }
  const pathname = decodeURIComponent(req.url.split('?')[0]);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || file.includes(`${path.sep}.`)) { res.writeHead(403).end(); return; }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', (types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8');
    fs.createReadStream(file).pipe(res);
  });
}).listen(3000, '127.0.0.1', () => console.log('http://127.0.0.1:3000'));
