import { vi } from 'vitest';
export function providerDouble(status: number, body: unknown) {
  return vi.fn<typeof fetch>(async () => Response.json(body, { status }));
}
export function fixedClock(iso = '2026-11-13T12:00:00.000Z') {
  let instant = new Date(iso);
  return {
    now: () => new Date(instant),
    advance: (milliseconds: number) => {
      instant = new Date(instant.getTime() + milliseconds);
    },
  };
}
