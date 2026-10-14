import { useEffect, useState } from 'react';

/** Remaining ms until endTime, ticking every second. */
export function useCountdown(endTime: number, active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active, endTime]);
  return active ? Math.max(0, endTime - now) : 0;
}
