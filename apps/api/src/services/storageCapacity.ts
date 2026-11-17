import type { Env } from '../env';

const APPLICATION_BYTES = 6 * 1024 ** 3;
// Leave room for a concurrent bounded backup/media copy and small recovery records.
// This admission check is not an atomic reservation or an account-wide spending cap.
const HEADROOM_BYTES = 32 * 1024 ** 2;

export async function requireStorageCapacity(
  env: Pick<Env, 'MEDIA' | 'RECOVERY'>,
  additionalBytes: number,
): Promise<void> {
  const unavailable = () => new Error('storage_capacity_unavailable');
  if (!Number.isSafeInteger(additionalBytes) || additionalBytes < 0) throw unavailable();
  const ceiling = APPLICATION_BYTES - HEADROOM_BYTES - additionalBytes;
  let bytes = 0;
  const deadline = Date.now() + 30_000;
  try {
    for (const bucket of [env.MEDIA, env.RECOVERY]) {
      let cursor: string | undefined;
      const seen = new Set<string>();
      for (let pageNumber = 0; ; pageNumber++) {
        const timeout = Math.min(8_000, deadline - Date.now());
        if (pageNumber >= 20 || timeout <= 0) throw unavailable();
        let timer: ReturnType<typeof setTimeout> | undefined;
        let page: R2Objects;
        try {
          page = await Promise.race([
            bucket.list({ limit: 1000, ...(cursor ? { cursor } : {}) }),
            new Promise<never>((_, reject) => {
              timer = setTimeout(() => reject(unavailable()), timeout);
            }),
          ]);
        } finally {
          if (timer !== undefined) clearTimeout(timer);
        }
        for (const object of page.objects) {
          if (!Number.isSafeInteger(object.size) || object.size < 0) throw unavailable();
          bytes += object.size;
          if (!Number.isSafeInteger(bytes) || bytes > ceiling) throw unavailable();
        }
        if (!page.truncated) break;
        if (!page.cursor || seen.has(page.cursor)) throw unavailable();
        seen.add(page.cursor);
        cursor = page.cursor;
      }
    }
  } catch {
    throw unavailable();
  }
}
