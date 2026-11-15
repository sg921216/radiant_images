import { imageHeader } from './imageHeader';
// For sRGB canvas output only. RIFF chunk layout: https://developers.google.com/speed/webp/docs/riff_container
export function stripWebpMetadata(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const info = imageHeader(bytes);
  if (info.mime !== 'image/webp' || info.animated) throw new Error('Expected a still WebP image.');
  const chunks: Uint8Array[] = [];
  const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let at = 12; at < bytes.length;) {
    const size = data.getUint32(at + 4, true);
    const end = at + 8 + size + (size % 2);
    if (end > bytes.length) throw new Error('Truncated WebP chunk.');
    const name = String.fromCharCode(...bytes.subarray(at, at + 4));
    // A strict allowlist removes unknown ancillary chunks too.
    if (['VP8X', 'ALPH', 'VP8 ', 'VP8L'].includes(name)) {
      const chunk = bytes.slice(at, end);
      if (name === 'VP8X') chunk[8] = chunk[8]! & ~0x2c;
      chunks.push(chunk);
    }
    at = end;
  }
  const result = new Uint8Array(12 + chunks.reduce((size, chunk) => size + chunk.length, 0));
  result.set(bytes.subarray(0, 12));
  new DataView(result.buffer).setUint32(4, result.length - 8, true);
  let offset = 12;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  imageHeader(result);
  return result;
}
