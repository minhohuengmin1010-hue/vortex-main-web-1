export const DEFAULTS = Object.freeze({ name: 'Vortex', prefix: '.', ownerNumber: '2349016077157', ownerName: 'minhohuengmin' });
export const GROUP_LINKS = Object.freeze(['https://chat.whatsapp.com/ESYBTaMZMbY06I9zW8fn6L', 'https://chat.whatsapp.com/BNlp73cOTzjEyTGCum4Fa7']);

export function phoneDigits(value) {
  if (typeof value !== 'string' || !/^\+?[1-9]\d{7,14}$/.test(value)) throw new Error('Enter an international phone number with country code.');
  return value.replace(/^\+/, '');
}

export function loadConfig(env = process.env) {
  const key = env.AUTH_ENCRYPTION_KEY;
  if (!key || key.length < 32) throw new Error('Set AUTH_ENCRYPTION_KEY in Render before starting the service.');
  const origin = new URL(env.PAIRING_SITE_ORIGIN ?? 'http://localhost:8080').origin;
  const allowedPhones = new Set((env.ALLOWED_PAIR_NUMBERS ?? DEFAULTS.ownerNumber).split(',').filter(Boolean).map(n => phoneDigits(n.trim())));
  const groups = new Set((env.ALLOWED_GROUP_JIDS ?? '').split(',').map(n => n.trim()).filter(Boolean));
  for (const jid of groups) if (!/^\d+(-\d+)?@g\.us$/.test(jid)) throw new Error('ALLOWED_GROUP_JIDS must contain WhatsApp group IDs.');
  return { ...DEFAULTS, encryptionKey: key, origin, allowedPhones, groups, dataDir: env.DATA_DIR ?? '/var/data/vortex', port: Number(env.PORT ?? 10000), sessionId: env.SESSION_ID };
}

export function canPair(config, phone) { return config.allowedPhones.has(phone); }
export function isOwner(jid) { return typeof jid === 'string' && jid.replace(/:\d+(?=@)/, '') === `${DEFAULTS.ownerNumber}@s.whatsapp.net`; }
export function permittedChat(config, jid) { return config.groups.has(jid) || isOwner(jid); }