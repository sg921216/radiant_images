import { ulid } from 'ulid';
import { checklistSchema, type ChecklistItem } from '@radiant/shared';
import { useMaster, MasterFrame, OrderControls } from '../../components/MasterEditor';
import { AdminLayout } from '../../components/AdminLayout';
export function ChecklistEditor() {
  const master = useMaster<ChecklistItem>('/admin/checklist', checklistSchema, 'Checklist saved.');
  return (
    <MasterFrame
      title="Master checklist"
      description={
        <p>
          Changes apply to every client. Added items start incomplete; renaming and reordering
          preserve each client’s progress. Removed items and their progress are deleted when you
          save.
        </p>
      }
      status={master.status}
      disabled={master.busy || !master.loaded}
    >
      {master.loaded && master.items.length === 0 && <p>No checklist items yet.</p>}
      {master.items.map((item, index) => (
        <fieldset key={item.id}>
          <legend>Item {index + 1}</legend>
          <div className="field">
            <label htmlFor={`${item.id}-label`}>Item {index + 1} label</label>
            <input
              id={`${item.id}-label`}
              value={item.label}
              maxLength={120}
              onChange={(event) => master.edit(item.id, { label: event.target.value })}
            />
          </div>
          <OrderControls
            name="item"
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
          disabled={master.items.length >= 60}
          onClick={() =>
            master.setItems((old) => [...old, { id: ulid(), label: '', sortOrder: old.length }])
          }
        >
          Add item
        </button>
        <button onClick={() => void master.save()}>Save checklist</button>
      </div>
    </MasterFrame>
  );
}
export default function Checklist() {
  return (
    <AdminLayout>
      <ChecklistEditor />
    </AdminLayout>
  );
}
