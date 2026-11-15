import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { privateText, archiveTexts } from './privacy-gates';
const artifacts = process.argv.includes('--artifacts');
let checked = 0,
  failed = 0;
function check(file: string) {
  if (!existsSync(file)) return;
  const bytes = readFileSync(file);
  if (/\.(png|jpg|jpeg|webp|pdf|woff2?)$/i.test(file)) return;
  if (artifacts && /\.zip$/i.test(file)) {
    failed++;
    console.error('Blocked unsanitized binary diagnostic archive.');
    return;
  }
  const text = bytes.toString('utf-8');
  checked++;
  // Encoded fonts/images can accidentally contain URL-like byte sequences. The report ZIP
  // is decoded and checked below; trace ZIPs are rejected, and screenshots are synthetic-only.
  let unsafe = privateText(
    text.replace(/data:[\w.+/-]+;base64,[A-Za-z0-9+/=]+/g, '[binary asset]'),
  );
  for (const match of text.matchAll(
    /(?:data:application\/zip;base64,|playwrightReportBase64\s*=\s*["'])([A-Za-z0-9+/=]+)/g,
  )) {
    try {
      unsafe ||= archiveTexts(Buffer.from(match[1]!, 'base64')).some(privateText);
    } catch {
      unsafe = true;
    }
  }
  if (unsafe) {
    failed++;
    console.error(
      artifacts
        ? 'Private data detected in diagnostic artifacts.'
        : `Secret pattern detected in ${file}.`,
    );
  }
}
function walk(path: string) {
  if (!existsSync(path)) return;
  for (const item of readdirSync(path, { withFileTypes: true })) {
    const file = join(path, item.name);
    if (item.isDirectory()) walk(file);
    else check(file);
  }
}
if (artifacts) {
  walk('test-results');
  walk('playwright-report');
} else {
  const files = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { encoding: 'utf-8' },
  )
    .split('\0')
    .filter(Boolean);
  for (const file of files) check(file);
}
console.log(`Privacy gate checked ${checked} files; ${failed} blocked.`);
process.exitCode = failed ? 1 : 0;
