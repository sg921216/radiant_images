import { ulid } from 'ulid';
import { templateListSchema, PLACEHOLDERS, type EmailTemplate } from '@radiant/shared';
import { useMaster, MasterFrame, OrderControls } from '../../components/MasterEditor';
import { AdminLayout } from '../../components/AdminLayout';
export function TemplatesEditor() {
  const origin = typeof window === 'undefined' ? 'https://example.invalid' : window.location.origin;
  const master = useMaster<EmailTemplate>(
    '/admin/templates',
    templateListSchema(origin),
    'Templates saved.',
  );
  return (
    <MasterFrame
      title="Email templates"
      description={
        <>
          <p>Use these placeholders: {PLACEHOLDERS.map((value) => `{{${value}}}`).join(', ')}.</p>
          <p>
            Use the questionnaireLink placeholder for a fresh private invitation. Preview keeps the
            placeholder; sent history omits the usable link. A missing session date reads “Not
            scheduled”.
          </p>
        </>
      }
      status={master.status}
      disabled={master.busy || !master.loaded}
    >
      {master.loaded && master.items.length === 0 && <p>No templates yet.</p>}
      {master.items.map((item, index) => (
        <fieldset key={item.id}>
          <legend>Template {index + 1}</legend>
          {(['name', 'subject', 'body'] as const).map((key) => (
            <div className="field" key={key}>
              <label htmlFor={`${item.id}-${key}`}>
                Template {index + 1} {key}
              </label>
              {key === 'body' ? (
                <textarea
                  id={`${item.id}-${key}`}
                  value={item[key]}
                  maxLength={10000}
                  rows={6}
                  onChange={(event) => master.edit(item.id, { [key]: event.target.value })}
                />
              ) : (
                <input
                  id={`${item.id}-${key}`}
                  value={item[key]}
                  maxLength={key === 'name' ? 80 : 200}
                  onChange={(event) => master.edit(item.id, { [key]: event.target.value })}
                />
              )}
            </div>
          ))}
          <OrderControls
            name="template"
            index={index}
            count={master.items.length}
            move={master.move}
            remove={() => master.remove(item.id)}
          />
        </fieldset>
      ))}
      <div className="stack">
        <button
          className="secondary"
          disabled={master.items.length >= 50}
          onClick={() =>
            master.setItems((old) => [
              ...old,
              { id: ulid(), name: '', subject: '', body: '', sortOrder: old.length },
            ])
          }
        >
          Add template
        </button>
        <button onClick={() => void master.save()}>Save templates</button>
      </div>
    </MasterFrame>
  );
}
export default function Templates() {
  return (
    <AdminLayout>
      <TemplatesEditor />
    </AdminLayout>
  );
}
