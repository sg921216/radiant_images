import type { Runtime } from './runtime';
// The deadline includes consuming the response body, not just receiving headers.
export async function providerJson(
  runtime: Runtime,
  url: string,
  init: RequestInit,
  deadline = performance.now() + 4000,
): Promise<{ status: number; data: Record<string, unknown> }> {
  const remaining = Math.min(2000, deadline - performance.now());
  if (remaining <= 0) throw new Error('provider_deadline');
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        const response = await runtime.fetch(url, { ...init, signal: controller.signal });
        let data: Record<string, unknown> = {};
        try {
          data = (await response.json()) as Record<string, unknown>;
        } catch {
          if (response.ok) throw new Error('invalid_provider_response');
        }
        return { status: response.status, data };
      })(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error('provider_deadline'));
        }, remaining);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
