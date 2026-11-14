import { getPlatformProxy } from 'wrangler';
import { resolve } from 'node:path';
import type { Env } from '../apps/api/src/env';
import { operationsCommand } from './operations-command';
import { createBackup, restoreBackup, reopenAfterRestore } from '../apps/api/src/services/backup';
import { allObjects } from '../apps/api/src/services/mediaRecovery';
import { maintain } from '../apps/api/src/scheduled';
const command = operationsCommand(process.argv.slice(2));
// Fixed synthetic bindings, no CLI-configured account, remote flag, secret file or state directory.
const proxy = await getPlatformProxy<Env>({
  configPath: resolve('e2e/wrangler.toml'),
  envFiles: [],
  remoteBindings: false,
  persist: { path: resolve('.wrangler/e2e/v3') },
});
try {
  const now = new Date();
  if (command.action === 'backup') console.log(await createBackup(proxy.env, now));
  else if (command.action === 'list')
    console.log(
      JSON.stringify(
        (await allObjects(proxy.env.RECOVERY, 'backups/')).map((row) => ({
          key: row.key,
          expiresAt: row.customMetadata?.expiresAt,
        })),
      ),
    );
  else if (command.action === 'restore') await restoreBackup(proxy.env, command.key!, now);
  else if (command.action === 'reopen') await reopenAfterRestore(proxy.env);
  else
    await maintain(proxy.env, {
      now: () => now,
      fetch: async () => new Response('', { status: 503 }),
    });
  if (command.action !== 'list' && command.action !== 'backup')
    console.log(`Local ${command.action} completed.`);
} catch {
  // Never print recovery payloads, SQL values, tokens, addresses or underlying provider errors.
  console.error(
    'Local operation failed. Restore access remains closed until a successful restore and explicit reopen.',
  );
  process.exitCode = 1;
} finally {
  await proxy.dispose();
}
