const encoder = new TextEncoder();
function hex(value: ArrayBuffer) {
  return Array.from(new Uint8Array(value), (n) => n.toString(16).padStart(2, '0')).join('');
}
export async function sha256(value: string) {
  return hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}
export async function hmac(secret: string, value: string) {
  if (!secret) throw new Error('Missing cryptographic key');
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}
