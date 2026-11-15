import { bootstrapSchema, type PublicBootstrap } from '@radiant/shared';
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { apiRequest } from './api';
type State = { data: PublicBootstrap | null; error: string; refresh: () => Promise<void> };
const Context = createContext<State>({ data: null, error: '', refresh: async () => {} });
declare global {
  var __radiantBootstrap: Promise<unknown> | undefined;
}
export function PublicContentProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PublicBootstrap | null>(null);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const active = useRef(false);
  const refresh = useCallback(async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const started = globalThis.__radiantBootstrap;
      globalThis.__radiantBootstrap = undefined;
      const initial = started ? await started : null;
      const value = bootstrapSchema.parse(
        initial ?? (await apiRequest('/public/bootstrap', { signal: controller.signal })),
      );
      if (active.current && !controller.signal.aborted) {
        setData(value);
        setError('');
      }
    } catch {
      if (active.current) setError('Some content could not be refreshed. Please try again.');
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) request.current = null;
    }
  }, []);
  useEffect(() => {
    active.current = true;
    void refresh();
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 25000);
    const resume = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('focus', resume);
    return () => {
      active.current = false;
      clearInterval(timer);
      request.current?.abort();
      request.current = null;
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('focus', resume);
    };
  }, [refresh]);
  return createElement(Context.Provider, { value: { data, error, refresh } }, children);
}
export function usePublicContent() {
  return useContext(Context);
}
