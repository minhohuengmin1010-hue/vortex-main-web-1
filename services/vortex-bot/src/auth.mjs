import { BufferJSON, initAuthCreds, proto } from '@whiskeysockets/baileys';

export async function authState(store, phone) {
  const saved = await store.read(phone, 'creds');
  const creds = saved ? JSON.parse(saved, BufferJSON.reviver) : initAuthCreds();
  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const result = {};
          await Promise.all(ids.map(async id => {
            const raw = await store.read(phone, `${type}:${id}`);
            if (!raw) return;
            let value = JSON.parse(raw, BufferJSON.reviver);
            if (type === 'app-state-sync-key') value = proto.Message.AppStateSyncKeyData.fromObject(value);
            result[id] = value;
          }));
          return result;
        },
        set: async data => { await Promise.all(Object.entries(data).flatMap(([type, entries]) => Object.entries(entries).map(([id, value]) => store.write(phone, `${type}:${id}`, value ? JSON.stringify(value, BufferJSON.replacer) : null)))); },
      },
    },
    saveCreds: () => store.write(phone, 'creds', JSON.stringify(creds, BufferJSON.replacer)),
  };
}

export async function importSession(store, phone, value) {
  if (!value) return;
  if (await store.read(phone, 'creds')) return;
  // Intentionally refuse undocumented third-party formats and never print session data.
  if (!value.startsWith('Vortex~') || value.length > 2_000_000) throw new Error('SESSION_ID format is unsupported. Pair a fresh account through Vortex instead.');
  let bundle;
  try { bundle = JSON.parse(Buffer.from(value.slice(7), 'base64').toString('utf8')); } catch { throw new Error('SESSION_ID is invalid. Pair a fresh account.'); }
  if (bundle.version !== 1 || bundle.phone !== phone || !bundle.files || typeof bundle.files !== 'object') throw new Error('SESSION_ID does not match the owner account.');
  const entries = Object.entries(bundle.files);
  const creds = bundle.files.creds;
  if (typeof creds !== 'string' || !JSON.parse(creds, BufferJSON.reviver).registered || entries.length > 10000) throw new Error('SESSION_ID has no registered credentials.');
  for (const [name, contents] of entries) {
    if (typeof contents !== 'string' || contents.length > 1_000_000 || name.length > 300) throw new Error('SESSION_ID contains invalid credential data.');
  }
  for (const [name, contents] of entries) await store.write(phone, name, contents);
}