import { Link } from 'react-router';
export default function Denied() {
  return (
    <main id="main">
      <h1>Account not authorized</h1>
      <p>This Google account cannot access the owner area.</p>
      <Link to="/admin/login">Use another account</Link>
    </main>
  );
}
