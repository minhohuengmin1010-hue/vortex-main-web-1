import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import { loadConfig, DEFAULTS, isOwner, permittedChat } from '../src/config.mjs';
import { commandReply, parseCommand } from '../src/commands.mjs';
import { PrivateStore } from '../src/store.mjs';
import { Accounts } from '../src/accounts.mjs';
import { createBotServer } from '../src/http.mjs';

const config = () => loadConfig({ AUTH_ENCRYPTION_KEY: 'test-encryption-key-32-characters-long', PAIRING_ACCESS_TOKEN: 'test-private-token-32-characters-long', ALLOWED_GROUP_JIDS: '123456789@g.us' });

test('Vortex uses the requested name, owner identity and dot prefix', () => {
  assert.equal(DEFAULTS.name, 'Vortex');
  assert.equal(DEFAULTS.ownerName, 'minhohuengmin');
  assert.equal(DEFAULTS.ownerNumber, '2349016077157');
  assert.equal(DEFAULTS.prefix, '.');
  assert.deepEqual(parseCommand('.ping'), { name: 'ping', args: [] });
  assert.equal(parseCommand('!ping'), null);
  assert.equal(commandReply('.ping', {}), 'Pong!');
});
test('owner commands fail closed for other numbers and unresolved LIDs', () => {
  assert.equal(isOwner('2349016077157:2@s.whatsapp.net'), true);
  assert.equal(isOwner('2349016077157@lid'), false);
  assert.equal(commandReply('.groupid', { sender: '11111111@s.whatsapp.net', groupJid: '123456789@g.us' }), 'This command is owner-only.');
  assert.equal(commandReply('.groupid', { sender: '2349016077157@s.whatsapp.net', groupJid: '123456789@g.us' }), '123456789@g.us');
});
test('bot replies only in approved groups or the owner chat', () => {
  assert.equal(permittedChat(config(), '123456789@g.us'), true);
  assert.equal(permittedChat(config(), '987654321@g.us'), false);
  assert.equal(permittedChat(config(), '11111111@s.whatsapp.net'), false);
});
test('sessions are encrypted and survive reopening the store', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'vortex-test-'));
  try {
    const first = new PrivateStore(dir, config().encryptionKey);
    await first.write(DEFAULTS.ownerNumber, 'creds', 'private-test-credentials');
    assert.ok(!(await readFile(first.path(DEFAULTS.ownerNumber, 'creds'), 'utf8')).includes('private-test-credentials'));
    const second = new PrivateStore(dir, config().encryptionKey);
    assert.equal(await second.read(DEFAULTS.ownerNumber, 'creds'), 'private-test-credentials');
    await second.remove(DEFAULTS.ownerNumber);
    assert.equal(await second.read(DEFAULTS.ownerNumber, 'creds'), null);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('pairing requires authorization, consent and an owner-approved number', async () => {
  const accounts = { status: () => 'not_paired', pair: async () => ({ status: 'pairing', code: 'TEST-CODE' }), unlink: async () => {} };
  const cfg = config();
  const server = createBotServer(cfg, accounts);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (body, token = cfg.accessToken) => fetch(`${base}/pair`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  try {
    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: 'ok', service: 'vortex-bot' });
    assert.equal((await post({ phone: DEFAULTS.ownerNumber, consent: true }, 'incorrect')).status, 401);
    assert.equal((await post({ phone: '2349016077158', consent: true })).status, 403);
    assert.equal((await post({ phone: DEFAULTS.ownerNumber })).status, 400);
    const paired = await post({ phone: DEFAULTS.ownerNumber, consent: true });
    assert.equal(paired.status, 200);
    assert.deepEqual(await paired.json(), { status: 'pairing', code: 'TEST-CODE' });
  } finally { await new Promise(resolve => server.close(resolve)); }
});
test('socket handles fresh commands and never replays history or unapproved chats', async () => {
  const ev = new EventEmitter();
  const sent = [];
  const store = { read: async () => null, write: async () => {}, remove: async () => {} };
  const accounts = new Accounts(config(), store, () => ({ ev, sendMessage: async (...args) => sent.push(args), requestPairingCode: async () => 'TEST-CODE', end: () => {} }));
  await accounts.connect(DEFAULTS.ownerNumber);
  ev.emit('connection.update', { qr: 'test' });
  assert.deepEqual(await accounts.pair(DEFAULTS.ownerNumber), { status: 'pairing', code: 'TEST-CODE' });
  ev.emit('connection.update', { connection: 'open' });
  const message = (id, jid) => ({ key: { id, remoteJid: jid, participant: '2349016077157@s.whatsapp.net' }, message: { conversation: '.ping' } });
  ev.emit('messages.upsert', { type: 'append', messages: [message('old', '123456789@g.us')] });
  ev.emit('messages.upsert', { type: 'notify', messages: [message('blocked', '987654321@g.us')] });
  ev.emit('messages.upsert', { type: 'notify', messages: [message('new', '123456789@g.us')] });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(sent, [['123456789@g.us', { text: 'Pong!' }]]);
  assert.equal(accounts.status(DEFAULTS.ownerNumber), 'connected');
  accounts.stop();
});