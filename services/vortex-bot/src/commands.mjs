import { DEFAULTS, GROUP_LINKS, isOwner } from './config.mjs';

// Only implemented handlers belong here; the dashboard's larger reference menu is not a runtime registry.
export const COMMANDS = Object.freeze(['menu', 'help', 'ping', 'alive', 'info', 'owner', 'support', 'rules', 'groupid']);
export function parseCommand(text) {
  if (typeof text !== 'string' || !text.startsWith(DEFAULTS.prefix)) return null;
  const [name, ...args] = text.slice(DEFAULTS.prefix.length).trim().split(/\s+/);
  return name ? { name: name.toLowerCase(), args } : null;
}
export function commandReply(text, { sender, groupJid, connected }) {
  const command = parseCommand(text);
  if (!command) return null;
  switch (command.name) {
    case 'menu': case 'help': return `${DEFAULTS.name}\n${COMMANDS.map(n => `${DEFAULTS.prefix}${n}`).join('\n')}`;
    case 'ping': return 'Pong!';
    case 'alive': return connected ? 'Vortex is connected to WhatsApp.' : 'Vortex is reconnecting.';
    case 'info': return `Vortex · Node.js\nOwner: ${DEFAULTS.ownerName}\nPrefix: ${DEFAULTS.prefix}`;
    case 'owner': return `Owner: ${DEFAULTS.ownerName}\nhttps://wa.me/${DEFAULTS.ownerNumber}`;
    case 'support': return GROUP_LINKS.join('\n');
    case 'rules': return 'Use your own account only. No spam, harassment, or unsolicited messages. You can unlink Vortex in WhatsApp → Linked devices.';
    case 'groupid': return isOwner(sender) ? (groupJid ?? 'Run this command inside your group.') : 'This command is owner-only.';
    default: return null;
  }
}