import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { finishSignIn, signOut, TOKEN_KEY } from '../app/lib/auth';
import { apiRequest } from '../app/lib/api';
import Callback from '../app/routes/admin/callback';
beforeEach(() => {
  sessionStorage.clear();
  history.replaceState(null, '', '/admin/callback#code=synthetic-code');
});
afterEach(() => vi.unstubAllGlobals());
test('callback removes fragment before its one exchange and keeps bearer only in session storage', async () => {
  const fetcher = vi.fn(async () => {
    expect(location.hash).toBe('');
    return Response.json({
      token: 't'.repeat(43),
      session: { email: 'owner@example.invalid', expiresAt: '2026-11-14T12:00:00Z' },
    });
  });
  vi.stubGlobal('fetch', fetcher);
  await finishSignIn();
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(sessionStorage.getItem(TOKEN_KEY)?.length).toBe(43);
  expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
});
test('lost exchange response clears state and never automatically retries', async () => {
  const fetcher = vi.fn(async () => {
    throw new Error('connection lost');
  });
  vi.stubGlobal('fetch', fetcher);
  await expect(finishSignIn()).rejects.toThrow();
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(location.hash).toBe('');
  expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
});
test('API expiry removes the stored token and logout clears locally even during an outage', async () => {
  sessionStorage.setItem(TOKEN_KEY, 't'.repeat(43));
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      Response.json(
        { error: { code: 'session_expired', message: 'Sign in again' } },
        { status: 401 },
      ),
    ),
  );
  await expect(apiRequest('/auth/session', { auth: true })).rejects.toThrow();
  expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
  sessionStorage.setItem(TOKEN_KEY, 't'.repeat(43));
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('offline');
    }),
  );
  await signOut();
  expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
});
test('callback failure presents fresh Google sign-in without an exchange retry control', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('lost');
    }),
  );
  render(
    <MemoryRouter>
      <Callback />
    </MemoryRouter>,
  );
  await waitFor(() =>
    expect(screen.getByRole('link', { name: 'Sign in with Google' })).toBeVisible(),
  );
  expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
});
