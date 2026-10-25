import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, writeFile, rm, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export function encrypt(value, secret) {
  const iv = randomBytes(12);
  const key = createHash('sha256').update(secret).digest();
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return JSON.stringify({ v: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: data.toString('base64') });
}
export function decrypt(value, secret) {
  const data = JSON.parse(value);
  const decipher = createDecipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), Buffer.from(data.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(data.tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(data.data, 'base64')), decipher.final()]).toString('utf8');
}
export class PrivateStore {
  constructor(root, key) { this.root = root; this.key = key; this.writes = new Map(); }
  path(account, name) {
    if (!/^[1-9]\d{7,14}$/.test(account)) throw new Error('Invalid account.');
    return join(this.root, account, `${createHash('sha256').update(name).digest('hex')}.enc`);
  }
  async read(account, name) {
    try { return decrypt(await readFile(this.path(account, name), 'utf8'), this.key); }
    catch (e) { if (e.code === 'ENOENT') return null; throw new Error('Stored credentials could not be read; check the encryption key.'); }
  }
  async write(account, name, value) {
    const path = this.path(account, name);
    const previous = this.writes.get(path) ?? Promise.resolve();
    const work = previous.catch(() => {}).then(async () => {
      await mkdir(join(this.root, account), { recursive: true, mode: 0o700 });
      if (value === null) { await rm(path, { force: true }); return; }
      const tmp = `${path}.${randomBytes(8).toString('hex')}.tmp`;
      await writeFile(tmp, encrypt(value, this.key), { mode: 0o600 });
      await rename(tmp, path);
    });
    this.writes.set(path, work);
    try { await work; } finally { if (this.writes.get(path) === work) this.writes.delete(path); }
  }
  async accounts() { try { return (await readdir(this.root)).filter(n => /^[1-9]\d{7,14}$/.test(n)); } catch(e) { if (e.code === 'ENOENT') return []; throw e; } }
  async remove(account) { this.path(account, 'check'); await Promise.all([...this.writes.values()]); await rm(join(this.root, account), { recursive: true, force: true }); }
}