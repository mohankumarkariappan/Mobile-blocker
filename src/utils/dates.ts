import { addDays, format, parseISO } from 'date-fns';

export const toKey = (d: Date) => format(d, 'yyyy-MM-dd');
export const todayKey = () => toKey(new Date());
export const fromKey = (k: string) => parseISO(k);
export const shiftKey = (k: string, n: number) => toKey(addDays(fromKey(k), n));

export function fmtDuration(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

export function fmtMinutes(ms: number) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}
