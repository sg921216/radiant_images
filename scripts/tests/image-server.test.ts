import { expect, test } from 'vitest';
import { localImageServer } from '../local-image-server';
import fixtures from '../../e2e/fixtures/images/fixtures.json';
test('loopback decoder returns validated derivatives and rejects corrupt input', async () => {
  const server = localImageServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback address');
  const url = `http://127.0.0.1:${address.port}/validate`;
  try {
    const form = () => {
      const body = new FormData();
      for (const name of ['original', 'full', 'card', 'thumb'])
        body.set(
          name,
          new Blob([
            Buffer.from(name === 'original' ? fixtures.original : fixtures.webp, 'base64'),
          ]),
          `${name}.webp`,
        );
      return body;
    };
    const response = await fetch(url, { method: 'POST', body: form() });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      original: { mime: 'image/png', width: 60, height: 40 },
      full: { width: 60, height: 40, base64: expect.any(String) },
    });
    const invalid = form();
    invalid.set('original', new Blob(['broken']), 'bad.png');
    expect((await fetch(url, { method: 'POST', body: invalid })).status).toBe(400);
    expect((await fetch(url)).status).toBe(405);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
