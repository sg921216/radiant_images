export const TOKEN_KEY = 'radiant.owner';
export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}
export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}
export async function finishSignIn(): Promise<void> {
  const code = new URLSearchParams(location.hash.slice(1)).get('code');
  history.replaceState(null, '', location.pathname + location.search);
  clearToken();
  if (!code) throw new Error('Start a fresh sign-in.');
  const { apiRequest } = await import('./api');
  const result = await apiRequest<{ token: string }>('/auth/exchange', {
    method: 'POST',
    body: { code },
  });
  if (!/^[A-Za-z0-9_-]{43}$/.test(result.token)) throw new Error('Start a fresh sign-in.');
  sessionStorage.setItem(TOKEN_KEY, result.token);
}
export async function signOut(): Promise<void> {
  try {
    const { apiRequest } = await import('./api');
    await apiRequest('/auth/logout', { method: 'POST', auth: true });
  } catch {
    /* Clear locally even when the server is unreachable. */
  } finally {
    clearToken();
  }
}
