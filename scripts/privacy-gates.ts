import { inflateRawSync } from 'node:zlib';
export function privateText(value: string): boolean {
  for (let count = 0; count < 3; count++) {
    try {
      value = decodeURIComponent(value);
    } catch {
      break;
    }
  }
  value = value.replaceAll('\\/', '/').replace(/\\u002f/gi, '/');
  if (
    /\/(?:q|questionnaire)\/[A-Za-z0-9_.~-]{16,}|(?:#|[?&])code=[A-Za-z0-9_.~-]{16,}|Bearer\s+[A-Za-z0-9_.~-]{20,}/i.test(
      value,
    )
  )
    return true;
  if (
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{40,}|\bAIza[A-Za-z0-9_-]{30,}/.test(
      value,
    )
  )
    return true;
  for (const match of value.matchAll(
    /(?:GOOGLE_CLIENT_SECRET|GMAIL_REFRESH_TOKEN|TURNSTILE_SECRET|AUTH_KEY|RATE_LIMIT_KEY|CLOUDFLARE_API_TOKEN)\s*[=:]\s*["']([^"'\s]{12,})["']/g,
  ))
    if (!/^(synthetic-|test-only|replace-|your-|example-|<|\$)/.test(match[1]!)) return true;
  return false;
}
export function archiveTexts(bytes: Uint8Array): string[] {
  const data = Buffer.from(bytes),
    texts: string[] = [];
  const read = (offset: number, size: number, method: number, flags: number, name: string) => {
    if (
      flags & 1 ||
      ![0, 8].includes(method) ||
      size > 50 * 1024 * 1024 ||
      offset + 30 > data.length ||
      data.readUInt32LE(offset) !== 0x04034b50
    )
      throw new Error('Unsupported diagnostic archive');
    const start = offset + 30 + data.readUInt16LE(offset + 26) + data.readUInt16LE(offset + 28);
    const compressed = data.subarray(start, start + size);
    const content =
      method === 8 ? inflateRawSync(compressed, { maxOutputLength: 50 * 1024 * 1024 }) : compressed;
    if (/\.(json|txt|md|html|trace|network|log)$/i.test(name))
      texts.push(content.toString('utf-8'));
  };
  let end = -1;
  for (let offset = data.length - 22; offset >= Math.max(0, data.length - 65557); offset--)
    if (data.readUInt32LE(offset) === 0x06054b50) {
      end = offset;
      break;
    }
  if (end >= 0) {
    let offset = data.readUInt32LE(end + 16);
    const count = data.readUInt16LE(end + 10);
    for (let index = 0; index < count; index++) {
      if (offset + 46 > data.length || data.readUInt32LE(offset) !== 0x02014b50)
        throw new Error('Invalid diagnostic archive');
      const length = data.readUInt16LE(offset + 28),
        name = data.toString('utf-8', offset + 46, offset + 46 + length);
      read(
        data.readUInt32LE(offset + 42),
        data.readUInt32LE(offset + 20),
        data.readUInt16LE(offset + 10),
        data.readUInt16LE(offset + 8),
        name,
      );
      offset += 46 + length + data.readUInt16LE(offset + 30) + data.readUInt16LE(offset + 32);
    }
  } else {
    if (data.length < 30) throw new Error('Invalid diagnostic archive');
    read(
      0,
      data.readUInt32LE(18),
      data.readUInt16LE(8),
      data.readUInt16LE(6),
      data.toString('utf-8', 30, 30 + data.readUInt16LE(26)),
    );
  }
  return texts;
}
