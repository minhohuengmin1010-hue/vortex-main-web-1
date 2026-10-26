import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { phoneDigits, canPair } from './config.mjs';

export function createBotServer(config, accounts) {
  return createServer(async (req, res) => {
    const send = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify(data));
    };
    if (req.method === 'GET' && req.url === '/health') return send(200, { status: 'ok', service: 'vortex-bot' });
    if (!['/pair', '/status', '/unlink'].includes(req.url) || req.method !== 'POST') return send(404, { error: 'Not found' });
    if (req.headers.origin && req.headers.origin !== config.origin) return send(403, { error: 'Origin is not allowed' });
    const provided = Buffer.from(req.headers.authorization ?? '');
    const expected = Buffer.from(`Bearer ${config.accessToken}`);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return send(401, { error: 'Authorization required' });
    if (!req.headers['content-type']?.startsWith('application/json')) return send(415, { error: 'Send JSON' });
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 4096) return send(413, { error: 'Request is too large' });
        chunks.push(chunk);
      }
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return send(400, { error: 'Invalid JSON' }); }
      const phone = phoneDigits(body?.phone);
      if (!canPair(config, phone)) return send(403, { error: 'Account is not approved' });
      if (req.url === '/status') return send(200, { status: accounts.status(phone) });
      if (req.url === '/unlink') { await accounts.unlink(phone); return send(200, { status: 'unlinked' }); }
      if (body.consent !== true) return send(400, { error: 'Confirm that you own this account and consent to linking it' });
      return send(200, await accounts.pair(phone));
    } catch (error) {
      const validation = error.message === 'Enter an international phone number with country code.';
      send(validation ? 400 : 503, { error: validation ? error.message : 'Pairing service unavailable. Check account status or try again later.' });
    }
  });
}