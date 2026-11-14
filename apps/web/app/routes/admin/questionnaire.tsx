import { ulid } from 'ulid';
import { questionsSchema, type Question } from '@radiant/shared';
import { useMaster, MasterFrame, OrderControls } from '../../components/MasterEditor';
import { AdminLayout } from '../../components/AdminLayout';
export function QuestionsEditor() {
  const master = useMaster<Question>('/admin/questionnaire', questionsSchema, 'Questions saved.');
  return (
    <MasterFrame
      title="Questionnaire questions"
      description={
        <p>
          Changes apply to future invitations. Previously sent questionnaires keep their original
          questions and choices. Short answers allow 300 characters and long answers 4000.
        </p>
      }
      status={master.status}
      disabled={master.busy || !master.loaded}
    >
      {master.loaded && master.items.length === 0 && <p>No questions yet.</p>}
      {master.items.map((item, index) => (
        <fieldset key={item.id}>
          <legend>Question {index + 1}</legend>
          <div className="field">
            <label htmlFor={`${item.id}-prompt`}>Question {index + 1} prompt</label>
            <input
              id={`${item.id}-prompt`}
              value={item.prompt}
              maxLength={300}
              onChange={(event) => master.edit(item.id, { prompt: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor={`${item.id}-kind`}>Question {index + 1} type</label>
            <select
              id={`${item.id}-kind`}
              value={item.kind}
              onChange={(event) => {
                const kind = event.target.value as Question['kind'];
                master.edit(item.id, {
                  kind,
                  options: kind === 'single_choice' ? (item.options ?? ['', '']) : null,
                });
              }}
            >
              <option value="short_text">Short text</option>
              <option value="long_text">Long text</option>
              <option value="single_choice">Single choice</option>
            </select>
          </div>
          {item.kind === 'single_choice' && (
            <div className="field">
              <label htmlFor={`${item.id}-options`}>
                Question {index + 1} choices (one per line)
              </label>
              <textarea
                id={`${item.id}-options`}
                value={item.options?.join('\n') ?? ''}
                onChange={(event) =>
                  master.edit(item.id, { options: event.target.value.split('\n') })
                }
              />
            </div>
          )}
          <label>
            <input
              type="checkbox"
              checked={item.required}
              onChange={(event) => master.edit(item.id, { required: event.target.checked })}
            />
            Question {index + 1} is required
          </label>
          <OrderControls
            name="question"
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
          disabled={master.items.length >= 40}
          onClick={() =>
            master.setItems((old) => [
              ...old,
              {
                id: ulid(),
                prompt: '',
                kind: 'short_text',
                options: null,
                required: true,
                sortOrder: old.length,
              },
            ])
          }
        >
          Add question
        </button>
        <button onClick={() => void master.save()}>Save questions</button>
      </div>
    </MasterFrame>
  );
}
export default function Questionnaire() {
  return (
    <AdminLayout>
      <QuestionsEditor />
    </AdminLayout>
  );
}
