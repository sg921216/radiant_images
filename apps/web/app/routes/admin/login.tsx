import { API_ORIGIN } from '../../lib/api';
export default function Login() {
  return (
    <main id="main">
      <h1>Owner sign-in</h1>
      <p>Use your approved Google account to manage Radiant Images.</p>
      <a className="button" href={`${API_ORIGIN}/auth/google/start`}>
        Sign in with Google
      </a>
    </main>
  );
}
