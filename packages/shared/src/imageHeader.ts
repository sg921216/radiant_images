import { LIMITS } from './constants';
export interface ImageHeader {
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
  width: number;
  height: number;
  animated: boolean;
  hasMetadata: boolean;
}
// Bounded preflight only. Publication also requires a complete authoritative decode.
export function imageHeader(bytes: Uint8Array): ImageHeader {
  if (bytes.length < 12 || bytes.length > LIMITS.originalBytes)
    throw new Error('Invalid image size.');
  const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (at: number, length: number) =>
    String.fromCharCode(...bytes.subarray(at, at + length));
  let mime: ImageHeader['mime'];
  let width = 0,
    height = 0,
    animated = false,
    hasMetadata = false;
  if (
    bytes[0] === 137 &&
    ascii(1, 3) === 'PNG' &&
    bytes[4] === 13 &&
    bytes[5] === 10 &&
    bytes[6] === 26 &&
    bytes[7] === 10
  ) {
    mime = 'image/png';
    if (bytes.length < 33 || ascii(12, 4) !== 'IHDR' || data.getUint32(8) !== 13)
      throw new Error('Invalid PNG header.');
    width = data.getUint32(16);
    height = data.getUint32(20);
    for (let at = 8; at < bytes.length;) {
      if (at + 12 > bytes.length) throw new Error('Truncated PNG.');
      const size = data.getUint32(at);
      if (at + 12 + size > bytes.length) throw new Error('Truncated PNG chunk.');
      const type = ascii(at + 4, 4);
      if (['acTL', 'fcTL', 'fdAT'].includes(type)) animated = true;
      if (['eXIf', 'iCCP', 'iTXt', 'tEXt', 'zTXt'].includes(type)) hasMetadata = true;
      at += 12 + size;
    }
  } else if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    mime = 'image/webp';
    if (data.getUint32(4, true) + 8 !== bytes.length) throw new Error('Invalid WebP length.');
    for (let at = 12; at < bytes.length;) {
      if (at + 8 > bytes.length) throw new Error('Truncated WebP.');
      const size = data.getUint32(at + 4, true),
        start = at + 8;
      if (start + size > bytes.length) throw new Error('Truncated WebP chunk.');
      const type = ascii(at, 4);
      if (type === 'VP8X') {
        if (size < 10) throw new Error('Invalid WebP header.');
        const u24 = (n: number) => bytes[n]! | (bytes[n + 1]! << 8) | (bytes[n + 2]! << 16);
        width = u24(start + 4) + 1;
        height = u24(start + 7) + 1;
        animated = Boolean(bytes[start]! & 2);
        hasMetadata = Boolean(bytes[start]! & 0x2c);
      } else if (type === 'VP8 ' && !width) {
        if (
          size < 10 ||
          bytes[start + 3] !== 157 ||
          bytes[start + 4] !== 1 ||
          bytes[start + 5] !== 42
        )
          throw new Error('Invalid WebP frame.');
        width = data.getUint16(start + 6, true) & 0x3fff;
        height = data.getUint16(start + 8, true) & 0x3fff;
      } else if (type === 'VP8L' && !width) {
        if (size < 5 || bytes[start] !== 47) throw new Error('Invalid WebP lossless frame.');
        const bits = data.getUint32(start + 1, true);
        width = (bits & 0x3fff) + 1;
        height = ((bits >>> 14) & 0x3fff) + 1;
      }
      if (['EXIF', 'XMP ', 'ICCP'].includes(type)) hasMetadata = true;
      if (['ANIM', 'ANMF'].includes(type)) animated = true;
      at = start + size + (size % 2);
    }
  } else if (bytes[0] === 255 && bytes[1] === 216) {
    mime = 'image/jpeg';
    for (let at = 2; at < bytes.length;) {
      if (bytes[at] !== 255) throw new Error('Invalid JPEG marker.');
      while (bytes[at] === 255) at++;
      const marker = bytes[at++]!;
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      if (at + 2 > bytes.length) throw new Error('Truncated JPEG.');
      const size = data.getUint16(at);
      if (size < 2 || at + size > bytes.length) throw new Error('Truncated JPEG segment.');
      if (marker === 225 || marker === 226) hasMetadata = true;
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) {
        if (size < 7) throw new Error('Invalid JPEG dimensions.');
        height = data.getUint16(at + 3);
        width = data.getUint16(at + 5);
      }
      at += size;
    }
  } else throw new Error('Choose a JPEG, PNG, or WebP image.');
  if (
    width < 1 ||
    height < 1 ||
    width > LIMITS.originalAxis ||
    height > LIMITS.originalAxis ||
    width * height > LIMITS.originalPixels
  )
    throw new Error('Image exceeds the 40-megapixel or 16384-pixel limit.');
  return { mime, width, height, animated, hasMetadata };
}
