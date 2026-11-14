import { expect, test } from 'vitest';
import { deflateRawSync } from 'node:zlib';
import { privateText, archiveTexts } from '../privacy-gates';
test('artifact and secret checks recognize raw, escaped and URL-encoded access tokens without emitting them', () => {
  const token = 'a'.repeat(43);
  for (const text of [
    `/q/${token}`,
    `/questionnaire/${token}`,
    `/admin/callback#code=${token}`,
    `Bearer ${token}`,
    encodeURIComponent(`/q/${token}`),
    `/q\\/${token}`,
    ['-----BEGIN ', 'PRIVATE KEY-----'].join(''),
    ['GMAIL_REFRESH_', 'TOKEN="1//actualcredentialvalue"'].join(''),
  ])
    expect(privateText(text)).toBe(true);
  expect(
    privateText('GMAIL_REFRESH_TOKEN="synthetic-refresh"\n/q/[redacted]\nBearer [redacted]'),
  ).toBe(false);
});
test('artifact checks inspect compressed HTML-report ZIP entries and reject unsupported binary traces', () => {
  const content = Buffer.from('/q/' + 'b'.repeat(43)),
    compressed = deflateRawSync(content),
    name = Buffer.from('result.json');
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(8, 8);
  header.writeUInt32LE(compressed.length, 18);
  header.writeUInt32LE(content.length, 22);
  header.writeUInt16LE(name.length, 26);
  const zip = Buffer.concat([header, name, compressed]);
  expect(archiveTexts(zip).some(privateText)).toBe(true);
  header.writeUInt16LE(99, 8);
  expect(() => archiveTexts(Buffer.concat([header, name, compressed]))).toThrow();
});
