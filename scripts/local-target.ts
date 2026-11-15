export function assertLocalTarget(target: string): void {
  const url = new URL(target);
  if (
    url.protocol !== 'http:' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    url.username ||
    url.password
  )
    throw new Error('Test setup requires an explicit HTTP loopback origin');
}
