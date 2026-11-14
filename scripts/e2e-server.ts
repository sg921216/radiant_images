import './test-setup';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { localImageServer } from './local-image-server';
if (process.exitCode) throw new Error('Synthetic migrations failed');
const decoder = localImageServer();
await new Promise<void>((resolve, reject) => {
  decoder.once('error', reject);
  decoder.listen(8790, '127.0.0.1', resolve);
});
const child = spawn(
  process.execPath,
  [
    resolve('node_modules/wrangler/bin/wrangler.js'),
    'dev',
    '--config',
    'e2e/wrangler.toml',
    '--persist-to',
    resolve('.wrangler/e2e'),
    '--ip',
    '127.0.0.1',
    '--port',
    '8787',
    '--log-level',
    'error',
  ],
  { stdio: 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } },
);
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    child.kill(signal);
    decoder.close();
  });
child.on('exit', (code) => {
  decoder.close();
  process.exitCode = code ?? 1;
});
