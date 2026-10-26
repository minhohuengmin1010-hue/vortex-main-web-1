import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import { authState, importSession } from './auth.mjs';
import { canPair, permittedChat } from './config.mjs';
import { commandReply } from './commands.mjs';

export class Accounts {
  constructor(config, store, socketFactory = makeWASocket) {
    this.config = config;
    this.store = store;
    this.socketFactory = socketFactory;
    this.accounts = new Map();
    this.pending = new Map();
    this.stopped = false;
  }
  async restore() {
    await importSession(this.store, this.config.ownerNumber, this.config.sessionId);
    for (const phone of await this.store.accounts()) {
      if (canPair(this.config, phone) && await this.store.read(phone, 'creds')) {
        await this.connect(phone).catch(() => console.error('An account could not be restored; fresh pairing may be required.'));
      }
    }
  }
  async connect(phone) {
    const existing = this.accounts.get(phone);
    if (existing) return existing;
    const inFlight = this.pending.get(phone);
    if (inFlight) return inFlight;
    const work = this.open(phone);
    this.pending.set(phone, work);
    try { return await work; } finally { this.pending.delete(phone); }
  }
  async open(phone) {
    if (this.stopped || !canPair(this.config, phone)) throw new Error('Account is not approved.');
    const auth = await authState(this.store, phone);
    if (this.stopped) throw new Error('Service is stopping.');
    const socket = this.socketFactory({ auth: auth.state, logger: pino({ level: 'silent' }), printQRInTerminal: false, markOnlineOnConnect: false, syncFullHistory: false, browser: ['Ubuntu', 'Chrome', '22.0'] });
    const account = { socket, auth, status: 'connecting', ready: false, code: null, codeAt: 0, timer: null, pairing: null, seen: new Set() };
    this.accounts.set(phone, account);
    socket.ev.on('creds.update', () => { auth.saveCreds().catch(() => console.error('Credentials could not be saved.')); });
    socket.ev.on('connection.update', update => {
      if (this.accounts.get(phone) !== account) return;
      if (update.qr || update.connection === 'open') account.ready = true;
      if (update.connection === 'open') { account.status = 'connected'; account.code = null; }
      if (update.connection !== 'close') return;
      account.ready = false;
      const reason = update.lastDisconnect?.error?.output?.statusCode;
      const terminal = [DisconnectReason.loggedOut, DisconnectReason.badSession, DisconnectReason.connectionReplaced, DisconnectReason.forbidden, DisconnectReason.multideviceMismatch].includes(reason);
      account.status = terminal ? 'needs_pairing' : 'disconnected';
      account.code = null;
      if (!terminal && !this.stopped && auth.state.creds.registered) {
        account.timer = setTimeout(() => {
          if (this.accounts.get(phone) !== account || this.stopped) return;
          this.accounts.delete(phone);
          this.connect(phone).catch(() => console.error('Reconnect failed; use status before pairing again.'));
        }, 5000);
        account.timer.unref?.();
      }
    });
    socket.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify' || account.status !== 'connected') return;
      for (const message of messages) {
        const jid = message.key?.remoteJid;
        const id = message.key?.id;
        if (!jid || !id || message.key.fromMe || account.seen.has(id) || !permittedChat(this.config, jid)) continue;
        account.seen.add(id);
        if (account.seen.size > 1000) account.seen.delete(account.seen.values().next().value);
        const sender = message.key.participant ?? jid;
        const text = message.message?.conversation ?? message.message?.extendedTextMessage?.text;
        const reply = commandReply(text, { sender, groupJid: jid.endsWith('@g.us') ? jid : undefined, connected: true });
        if (reply) {
          try { await socket.sendMessage(jid, { text: reply }); }
          catch { console.error('A command reply could not be sent.'); }
        }
      }
    });
    return account;
  }
  status(phone) { return this.accounts.get(phone)?.status ?? 'not_paired'; }
  async pair(phone) {
    if (!canPair(this.config, phone)) throw new Error('Account is not approved.');
    let account = this.accounts.get(phone);
    if (account?.status === 'connected') return { status: 'connected' };
    if (account?.status === 'needs_pairing') throw new Error('Unlink the old device before pairing again.');
    if (account?.status === 'disconnected') {
      clearTimeout(account.timer);
      account.socket.end(new Error('Fresh pairing requested'));
      this.accounts.delete(phone);
    }
    account = await this.connect(phone);
    if (account.code && Date.now() - account.codeAt < 60000) return { status: 'pairing', code: account.code };
    if (account.pairing) return account.pairing;
    const work = (async () => {
      const deadline = Date.now() + 20000;
      while (!account.ready) {
        if (this.stopped || ['disconnected', 'needs_pairing'].includes(account.status)) throw new Error('WhatsApp connection closed. Try again later.');
        if (Date.now() > deadline) throw new Error('WhatsApp did not respond. Try again later.');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (account.auth.state.creds.registered) return { status: account.status };
      const code = await Promise.race([
        account.socket.requestPairingCode(phone),
        new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('Pairing request timed out.')), 20000); timer.unref?.(); }),
      ]);
      account.code = code;
      account.codeAt = Date.now();
      return { status: 'pairing', code };
    })();
    account.pairing = work;
    try { return await work; } finally { account.pairing = null; }
  }
  async unlink(phone) {
    const pending = this.pending.get(phone);
    if (pending) await pending.catch(() => {});
    const account = this.accounts.get(phone);
    if (account) {
      clearTimeout(account.timer);
      this.accounts.delete(phone);
      try { await account.socket.logout(); } catch { account.socket.end(new Error('Account unlinked')); }
    }
    await this.store.remove(phone);
  }
  stop() {
    this.stopped = true;
    for (const account of this.accounts.values()) { clearTimeout(account.timer); account.socket.end(new Error('Service stopping')); }
    this.accounts.clear();
  }
}