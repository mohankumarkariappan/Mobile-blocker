// Browser fallback (localStorage) so the app can be checked without Android.
import type { Session, Task } from './types';

const T = 'focusday.tasks';
const S = 'focusday.sessions';

function read<A>(key: string): A[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
const write = (key: string, v: unknown) => localStorage.setItem(key, JSON.stringify(v));

export async function getAllTasks(): Promise<Task[]> { return read<Task>(T); }

export async function upsertTask(t: Task) {
  const all = read<Task>(T);
  const i = all.findIndex((x) => x.id === t.id);
  if (i >= 0) all[i] = t; else all.push(t);
  write(T, all);
}

export async function deleteTask(id: string) {
  write(T, read<Task>(T).filter((x) => x.id !== id));
}

export async function rollForward(today: string): Promise<number> {
  let n = 0;
  const all = read<Task>(T).map((t) => {
    if (!t.done && t.date < today) { n++; return { ...t, carriedFrom: t.carriedFrom ?? t.date, date: today }; }
    return t;
  });
  write(T, all);
  return n;
}

export async function getSessions(): Promise<Session[]> {
  return read<Session>(S).sort((a, b) => b.startedAt - a.startedAt);
}

export async function addSession(s: Session) {
  const all = read<Session>(S).filter((x) => x.id !== s.id);
  all.push(s);
  write(S, all);
}

export async function clearSessions() { write(S, []); }
