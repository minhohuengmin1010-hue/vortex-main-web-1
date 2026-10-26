import { loadConfig } from './config.mjs';
import { PrivateStore } from './store.mjs';
import { Accounts } from './accounts.mjs';
import { createBotServer } from './http.mjs';

const config = loadConfig();
const store = new PrivateStore(config.dataDir, config.encryptionKey);
const accounts = new Accounts(config, store);
const server = createBotServer(config, accounts);
server.requestTimeout = 45000;
server.headersTimeout = 10000;
server.listen(config.port, '0.0.0.0', () => {
  console.log(`Vortex Node.js service listening on port ${config.port}`);
  accounts.restore().catch(() => console.error('Session restoration failed; check configuration or pair a fresh account.'));
});
for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => {
  accounts.stop();
  server.close(() => process.exit(0));
  const timer = setTimeout(() => process.exit(0), 10000);
  timer.unref();
});