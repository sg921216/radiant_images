import { SHOOT_TYPES, type Client } from '@radiant/shared';
export const emptyClient = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  shootType: 'family',
  sessionDate: '',
  notes: '',
};
export type ClientDraft = typeof emptyClient;
export function clientDraft(client: Client): ClientDraft {
  return {
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email,
    phone: client.phone ?? '',
    shootType: client.shootType,
    sessionDate: client.sessionDate ?? '',
    notes: client.notes,
  };
}
export function ClientFields({
  draft,
  onChange,
}: {
  draft: ClientDraft;
  onChange: (draft: ClientDraft) => void;
}) {
  const labels = {
    firstName: 'Client first name',
    lastName: 'Client last name',
    email: 'Client email',
    phone: 'Client phone (optional)',
    shootType: 'Session type',
    sessionDate: 'Session date (optional)',
    notes: 'Client notes',
  };
  return (
    <div className="form-grid">
      {(Object.keys(labels) as (keyof ClientDraft)[]).map((key) => (
        <div className={`field ${key === 'notes' ? 'full-width' : ''}`} key={key}>
          <label htmlFor={`client-${key}`}>{labels[key]}</label>
          {key === 'shootType' ? (
            <select
              id={`client-${key}`}
              value={draft[key]}
              onChange={(event) => onChange({ ...draft, [key]: event.target.value })}
            >
              {SHOOT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          ) : key === 'notes' ? (
            <textarea
              id={`client-${key}`}
              value={draft[key]}
              maxLength={4000}
              onChange={(event) => onChange({ ...draft, [key]: event.target.value })}
            />
          ) : (
            <input
              id={`client-${key}`}
              type={
                key === 'email'
                  ? 'email'
                  : key === 'sessionDate'
                    ? 'date'
                    : key === 'phone'
                      ? 'tel'
                      : 'text'
              }
              maxLength={key === 'email' ? 254 : key === 'phone' ? 20 : 80}
              value={draft[key]}
              onChange={(event) => onChange({ ...draft, [key]: event.target.value })}
            />
          )}
        </div>
      ))}
    </div>
  );
}
