import { createServer } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertLocalTarget } from './local-target';
const gmailScopes = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
];
const incompleteConsent =
  'Grant both requested Gmail permissions (gmail.send and gmail.settings.basic), then restart the local tool.';
export async function saveConsentToken(
  data: { refresh_token?: unknown; scope?: unknown },
  output: string,
): Promise<void> {
  const granted = new Set(typeof data.scope === 'string' ? data.scope.split(/\s+/) : []);
  if (!gmailScopes.every((scope) => granted.has(scope))) throw new Error(incompleteConsent);
  if (typeof data.refresh_token !== 'string' || !data.refresh_token)
    throw new Error('Consent did not return a refresh token.');
  await writeFile(output, data.refresh_token + '\n', {
    encoding: 'utf8',
    flag: 'wx',
    mode: 0o600,
  });
}
export function consentUrl(
  clientId: string,
  redirect: string,
  state: string,
  challenge: string,
): string {
  assertLocalTarget(redirect);
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirect,
    response_type: 'code',
    scope: gmailScopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  }).toString();
  return url.href;
}
async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret)
    throw new Error(
      'Set server-only GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET before running consent.',
    );
  const redirect = 'http://127.0.0.1:8085/callback';
  const state = randomBytes(32).toString('base64url');
  const verifier = randomBytes(32).toString('base64url');
  const url = consentUrl(
    clientId,
    redirect,
    state,
    createHash('sha256').update(verifier).digest('base64url'),
  );
  const output = resolve('.gmail-refresh-token.secret');
  const server = createServer((request, response) => {
    void (async () => {
      const incoming = new URL(request.url ?? '/', redirect);
      if (
        incoming.pathname !== '/callback' ||
        incoming.searchParams.get('state') !== state ||
        !incoming.searchParams.get('code')
      ) {
        response.writeHead(400, { 'Content-Type': 'text/plain' });
        response.end('Invalid consent callback.');
        return;
      }
      const result = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: incoming.searchParams.get('code')!,
          redirect_uri: redirect,
          grant_type: 'authorization_code',
          code_verifier: verifier,
        }),
        signal: AbortSignal.timeout(10000),
      });
      const data = (await result.json()) as { refresh_token?: unknown; scope?: unknown };
      if (!result.ok || !data.refresh_token)
        throw new Error('Consent did not return a refresh token.');
      await saveConsentToken(data, output);
      response.writeHead(200, {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
      });
      response.end('Consent complete. You can close this tab.');
      console.log(
        'Refresh token saved to the ignored .gmail-refresh-token.secret file. Store it as a Worker secret, then remove this local file.',
      );
      server.close();
    })().catch((error: unknown) => {
      const partial = error instanceof Error && error.message === incompleteConsent;
      response.writeHead(partial ? 400 : 500, {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
      });
      response.end(
        partial
          ? `Consent incomplete. ${incompleteConsent}`
          : 'Consent failed. Restart the local tool.',
      );
      console.error(
        partial
          ? incompleteConsent
          : 'Consent failed; credentials and provider responses were not logged.',
      );
      server.close();
    });
  });
  server.listen(8085, '127.0.0.1', () =>
    console.log(`Open this consent URL in your browser:\n${url}`),
  );
  server.setTimeout(10000);
  const timeout = setTimeout(() => server.close(), 10 * 60 * 1000);
  timeout.unref();
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  void main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Consent failed.');
    process.exitCode = 1;
  });
