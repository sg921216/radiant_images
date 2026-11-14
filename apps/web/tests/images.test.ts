import { expect, test, vi, afterEach } from 'vitest';
import { prepareImage } from '../app/lib/images';
import fixtures from '../../../e2e/fixtures/images/fixtures.json';
const bytes = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
function file(source = fixtures.original, type = 'image/png') {
  const data = bytes(source);
  const f = new File([data], 'synthetic.png', { type });
  Object.defineProperty(f, 'arrayBuffer', { value: async () => data.buffer });
  return f;
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
test('preparation decodes orientation, scales all variants, strips metadata and preserves private original', async () => {
  const close = vi.fn();
  const decode = vi.fn(async () => ({ width: 3000, height: 4500, close }));
  vi.stubGlobal('createImageBitmap', decode);
  const canvases: HTMLCanvasElement[] = [];
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
    this: HTMLCanvasElement,
  ) {
    canvases.push(this);
    return { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D;
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) =>
    cb(
      Object.assign(new Blob([bytes(fixtures.webp)], { type: 'image/webp' }), {
        arrayBuffer: async () => bytes(fixtures.webp).buffer,
      }),
    ),
  );
  const source = file();
  const form = await prepareImage(source);
  expect(decode).toHaveBeenCalledWith(source, { imageOrientation: 'from-image' });
  expect(close).toHaveBeenCalledOnce();
  expect(form.get('original')).toBe(source);
  expect(form.get('width')).toBe('1333');
  expect(form.get('height')).toBe('2000');
  expect(canvases.map((c) => [c.width, c.height])).toEqual([
    [1333, 2000],
    [533, 800],
    [213, 320],
  ]);
  expect(form.get('originalMime')).toBe('image/png');
  for (const name of ['full', 'card', 'thumb']) expect(form.get(name)).toBeInstanceOf(File);
});
test('invalid headers or MIME are rejected before browser decoding', async () => {
  const decode = vi.fn();
  vi.stubGlobal('createImageBitmap', decode);
  await expect(prepareImage(file(fixtures.original, 'image/jpeg'))).rejects.toThrow(/format/);
  await expect(prepareImage(file('AQID'))).rejects.toThrow();
  expect(decode).not.toHaveBeenCalled();
});
test('decoder and WebP encoder failures produce actionable errors and release bitmap memory', async () => {
  const close = vi.fn();
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({ width: 60, height: 40, close })),
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) =>
    cb(new Blob(['unsupported'], { type: 'image/png' })),
  );
  await expect(prepareImage(file())).rejects.toThrow(/WebP/);
  expect(close).toHaveBeenCalledOnce();
});
