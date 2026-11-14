import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { finishSignIn } from '../../lib/auth';
import { API_ORIGIN } from '../../lib/api';
export default function Callback() {
  const started = useRef(false);
  const [failed, setFailed] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void finishSignIn()
      .then(() => navigate('/admin', { replace: true }))
      .catch(() => setFailed(true));
  }, [navigate]);
  return (
    <main id="main">
      <h1>Owner sign-in</h1>
      {failed ? (
        <>
          <p role="alert">Sign-in could not be completed. Start a fresh sign-in to continue.</p>
          <a href={`${API_ORIGIN}/auth/google/start`}>Sign in with Google</a>
        </>
      ) : (
        <p role="status">Completing sign-in…</p>
      )}
    </main>
  );
}
