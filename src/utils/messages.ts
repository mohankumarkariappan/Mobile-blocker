const done = [
  'Nice work — one more thing off your plate.',
  'Look at you go! Keep that calm momentum.',
  'Done and dusted. You are doing great.',
  'Small steps add up. Well done!',
  'That felt good, didn’t it?',
];
const all = [
  'All done for today — enjoy the rest.',
  'Every task complete. That is a win worth celebrating!',
];
const focus = [
  'Session complete. Deep work is a superpower.',
  'You stayed with it — that is real discipline.',
];
const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];
export const taskDoneMessage = () => pick(done);
export const allDoneMessage = () => pick(all);
export const focusDoneMessage = () => pick(focus);

export function greeting(pct: number, total: number) {
  if (total === 0) return 'A clear day. Add something small to begin.';
  if (pct === 1) return 'Everything done. Beautiful.';
  if (pct >= 0.5) return 'Over halfway there — keep going.';
  if (pct > 0) return 'Good start. One at a time.';
  return 'Ready when you are.';
}
