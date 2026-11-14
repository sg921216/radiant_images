import { useEffect, useState, type ReactNode } from 'react';
import type { z } from 'zod';
import { apiRequest } from '../lib/api';
type Ordered = { id: string; sortOrder: number };
export function useMaster<T extends Ordered>(
  path: string,
  schema: z.ZodType<T[]>,
  savedMessage: string,
) {
  const [items, setItems] = useState<T[]>([]),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState('');
  useEffect(() => {
    let active = true;
    void apiRequest<T[]>(path, { auth: true })
      .then((value) => {
        if (active) {
          setItems(value);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active) setStatus('This list could not be loaded. Reload to try again.');
      });
    return () => {
      active = false;
    };
  }, [path]);
  function edit(id: string, changes: Partial<T>) {
    setItems((previous) =>
      previous.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }
  function move(index: number, offset: number) {
    setItems((previous) => {
      const next = [...previous];
      [next[index], next[index + offset]] = [next[index + offset]!, next[index]!];
      return next.map((item, sortOrder) => ({ ...item, sortOrder }));
    });
  }
  function remove(id: string) {
    setItems((previous) =>
      previous.filter((item) => item.id !== id).map((item, sortOrder) => ({ ...item, sortOrder })),
    );
  }
  async function save() {
    if (busy || !loaded) return;
    const parsed = schema.safeParse(items.map((item, sortOrder) => ({ ...item, sortOrder })));
    if (!parsed.success) {
      setStatus(
        parsed.error.issues
          .map(
            (issue) =>
              `${typeof issue.path[0] === 'number' ? `Entry ${issue.path[0] + 1}: ` : ''}${issue.message}`,
          )
          .join(' '),
      );
      return;
    }
    setBusy(true);
    try {
      await apiRequest(path, { method: 'PUT', body: parsed.data, auth: true });
      setItems(parsed.data);
      setStatus(savedMessage);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed. Your draft is still here.');
    } finally {
      setBusy(false);
    }
  }
  return { items, setItems, loaded, busy, status, edit, move, remove, save };
}
export function MasterFrame({
  title,
  description,
  status,
  disabled,
  children,
}: {
  title: string;
  description: ReactNode;
  status: string;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <h1>{title}</h1>
      <div>{description}</div>
      {status && (
        <p role="status" className="status-panel">
          {status}
        </p>
      )}
      <fieldset disabled={disabled}>
        <legend>{title}</legend>
        {children}
      </fieldset>
    </>
  );
}
export function OrderControls({
  name,
  index,
  count,
  move,
  remove,
}: {
  name: string;
  index: number;
  count: number;
  move: (index: number, offset: number) => void;
  remove: () => void;
}) {
  return (
    <div className="stack">
      <button className="secondary" disabled={index === 0} onClick={() => move(index, -1)}>
        Move {name} {index + 1} up
      </button>
      <button className="secondary" disabled={index === count - 1} onClick={() => move(index, 1)}>
        Move {name} {index + 1} down
      </button>
      <button className="secondary" onClick={remove}>
        Remove {name} {index + 1}
      </button>
    </div>
  );
}
