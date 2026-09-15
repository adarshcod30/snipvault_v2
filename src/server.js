/**
 * Render / local entry point: a long-lived HTTP server.
 * Vercel uses api/index.js instead, which exports the same app as a handler.
 */
import { app } from './app.js';
import { config } from './config.js';

app.listen(config.port, () => {
  process.stdout.write(`SnipVault listening on http://localhost:${config.port}\n`);
});
