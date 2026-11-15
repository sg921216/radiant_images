import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { apiRequest, APIError } from '../lib/api';
import { signOut } from '../lib/auth';
export function AdminLayout({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    const end = () => navigate('/admin/login', { replace: true });
    window.addEventListener('owner-session-ended', end);
    void apiRequest('/auth/session', { auth: true })
      .then(() => {
        if (active) setStatus('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof APIError && [401, 403].includes(error.status)) end();
        else setStatus('error');
      });
    return () => {
      active = false;
      window.removeEventListener('owner-session-ended', end);
    };
  }, [navigate]);
  return (
    <>
      <header className="admin-header">
        <Link to="/admin">Radiant Images · Owner</Link>
        <button
          onClick={() => void signOut().then(() => navigate('/admin/login', { replace: true }))}
        >
          Sign out
        </button>
      </header>
      <main id="main">
        {status === 'checking' ? (
          <p role="status">Checking your session…</p>
        ) : status === 'error' ? (
          <p role="alert">The owner area is unavailable. Reload this page to try again.</p>
        ) : (
          children
        )}
      </main>
    </>
  );
}
