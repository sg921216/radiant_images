import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { clientInputSchema, type Client } from '@radiant/shared';
import { apiRequest } from '../../lib/api';
import { AdminLayout } from '../../components/AdminLayout';
import { ClientFields, emptyClient } from '../../components/forms/ClientFields';
export function ClientsEditor() {
  const [clients, setClients] = useState<Client[]>([]),
    [query, setQuery] = useState(''),
    [loaded, setLoaded] = useState(false),
    [draft, setDraft] = useState(emptyClient),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    void apiRequest<Client[]>(`/admin/clients?q=${encodeURIComponent(query)}`, { auth: true })
      .then((value) => {
        if (active) {
          setClients(value);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active) setStatus('Clients could not be loaded. Reload to try again.');
      });
    return () => {
      active = false;
    };
  }, [query]);
  async function create() {
    if (busy) return;
    const parsed = clientInputSchema.safeParse(draft);
    if (!parsed.success) {
      setStatus(
        parsed.error.issues.map((issue) => `${String(issue.path[0])}: ${issue.message}`).join(' '),
      );
      return;
    }
    setBusy(true);
    try {
      const client = await apiRequest<Client>('/admin/clients', {
        method: 'POST',
        auth: true,
        body: parsed.data,
      });
      navigate(`/admin/clients/${client.id}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed. Your entry is still here.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>Clients</h1>
      <p>
        Enter client details manually from an inquiry email or your conversation with the client.
      </p>
      {status && (
        <p role="status" className="status-panel">
          {status}
        </p>
      )}
      <section>
        <h2>Find a client</h2>
        <div className="field">
          <label htmlFor="client-search">Search by name or email</label>
          <input
            id="client-search"
            type="search"
            maxLength={200}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {loaded && clients.length === 0 ? (
          <p>No clients found.</p>
        ) : (
          <ul>
            {clients.map((client) => (
              <li key={client.id}>
                <Link to={`/admin/clients/${client.id}`}>
                  {client.firstName} {client.lastName}
                </Link>{' '}
                — {client.shootType}
                {client.sessionDate ? ` · ${client.sessionDate}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2>Add a client</h2>
        <fieldset disabled={busy}>
          <legend>Client details</legend>
          <ClientFields draft={draft} onChange={setDraft} />
          <button onClick={() => void create()}>Create client</button>
        </fieldset>
      </section>
    </>
  );
}
export default function Clients() {
  return (
    <AdminLayout>
      <ClientsEditor />
    </AdminLayout>
  );
}
