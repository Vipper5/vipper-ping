import { useCallback, useEffect, useState } from 'react';
import type { User, Project, Task, AgendaEvent, TimeEntry } from '../mocks/data';
import {
  fetchUsers,
  fetchProjects,
  fetchProject,
  fetchTasks,
  fetchTask,
  fetchEvents,
  fetchTimeEntries,
} from './api';

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

function useAsync<T>(fn: () => Promise<T>, initial: T, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    run()
      .then((res) => {
        if (active) {
          setData(res);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [run]);

  const [nonce, setNonce] = useState(0);
  useEffect(() => load(), [load, nonce]);

  return { data, loading, error, reload: () => setNonce((n) => n + 1) };
}

export function useUsers() {
  return useAsync<User[]>(fetchUsers, [], []);
}

export function useProjects() {
  return useAsync<Project[]>(fetchProjects, [], []);
}

export function useProject(id: string | undefined) {
  return useAsync<Project | null>(() => (id ? fetchProject(id) : Promise.resolve(null)), null, [id]);
}

export function useTasks() {
  return useAsync<Task[]>(fetchTasks, [], []);
}

export function useTask(id: string | undefined) {
  return useAsync<Task | null>(() => (id ? fetchTask(id) : Promise.resolve(null)), null, [id]);
}

export function useEvents() {
  return useAsync<AgendaEvent[]>(fetchEvents, [], []);
}

export function useTimeEntries(profileId: string | undefined) {
  return useAsync<TimeEntry[]>(
    () => (profileId ? fetchTimeEntries(profileId) : Promise.resolve([])),
    [],
    [profileId],
  );
}
