import { isIP } from 'node:net';
function publicDomain(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host.includes('.') &&
    !isIP(host) &&
    !/[[\]:]/.test(host) &&
    !/(^|\.)(localhost|local|invalid|test|example|example\.(com|net|org))$/.test(host)
  );
}
export function releaseGate(tasks: string, values: Record<string, string | undefined>): void {
  if (!/^- \[[xX]\] T001\b/m.test(tasks) || /^- \[ \] T\d+/m.test(tasks))
    throw new Error(
      'Release blocked: implementation, feasibility or acceptance tasks remain open.',
    );
  for (const name of ['WEB_ORIGIN', 'API_ORIGIN']) {
    const value = values[name] ?? '',
      url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.origin !== value ||
      url.username ||
      url.password ||
      !publicDomain(url.hostname)
    )
      throw new Error('Release requires exact public HTTPS origins.');
  }
  const email = values.PUBLIC_CONTACT_EMAIL ?? '',
    siteKey = values.TURNSTILE_SITE_KEY ?? '';
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !publicDomain(email.split('@')[1] ?? '') ||
    /synthetic|replace-/i.test(email)
  )
    throw new Error('Release requires the approved monitored contact address.');
  if (siteKey.length < 10 || /0000000000|synthetic|replace-/i.test(siteKey))
    throw new Error('Release requires the configured public CAPTCHA key.');
}
