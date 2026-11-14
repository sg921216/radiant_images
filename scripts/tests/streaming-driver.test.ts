import { expect, test, vi } from 'vitest';
import driver from '../cloudflare-gallery-rehearsal/streaming-driver';

test('remote diagnostic pacing depends on bytes rather than provider chunk boundaries', async () => {
  vi.useFakeTimers();
  try {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < 96; i++) controller.enqueue(new Uint8Array(1024));
        controller.close();
      },
    });
    const init: RequestInit & { duplex: 'half' } = { method: 'POST', body, duplex: 'half' };
    let finished = false;
    const pending = driver.fetch(new Request('https://synthetic.invalid/admin/gallery', init), {
      TARGET: {
        fetch: async (input) => {
          const request = input as Request;
          expect((await request.arrayBuffer()).byteLength).toBe(96 * 1024);
          finished = true;
          return new Response(null, { status: 201 });
        },
      },
    });
    await vi.advanceTimersByTimeAsync(300);
    expect(finished).toBe(true);
    expect((await pending).status).toBe(201);
  } finally {
    vi.useRealTimers();
  }
});
