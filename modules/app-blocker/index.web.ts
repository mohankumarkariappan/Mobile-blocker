// Browser mock of the native module so the whole UI can be tested without Android.
import type {
  FinishedSession, FocusStatus, InstalledApp, PermissionStatus, PermissionType, StartFocusOptions,
} from './src/AppBlocker.types';

export * from './src/AppBlocker.types';

const KEY = 'focusday.mock.focus';
const FIN = 'focusday.mock.finished';
const PERM = 'focusday.mock.perms';

const APPS: InstalledApp[] = [
  ['Instagram', 'com.instagram.android'], ['YouTube', 'com.google.android.youtube'],
  ['WhatsApp', 'com.whatsapp'], ['Facebook', 'com.facebook.katana'], ['X', 'com.twitter.android'],
  ['Reddit', 'com.reddit.frontpage'], ['TikTok', 'com.zhiliaoapp.musically'], ['Netflix', 'com.netflix.mediaclient'],
  ['Snapchat', 'com.snapchat.android'], ['Chrome', 'com.android.chrome'], ['Spotify', 'com.spotify.music'],
  ['Telegram', 'org.telegram.messenger'],
].map(([name, packageName]) => ({ name, packageName, icon: null }));

type Stored = { goal: string; endTime: number; startTime: number; blockedPackages: string[] } | null;

const load = <T,>(k: string, d: T): T => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; }
};
const save = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));

function pushFinished(f: FinishedSession) {
  save(FIN, [...load<FinishedSession[]>(FIN, []), f]);
}

/** Ends an expired session, recording it as completed (what the native service does). */
function settle() {
  const s = load<Stored>(KEY, null);
  if (s && Date.now() >= s.endTime) {
    pushFinished({
      id: String(s.startTime), goal: s.goal, startTime: s.startTime, endTime: s.endTime,
      plannedMs: s.endTime - s.startTime, actualMs: s.endTime - s.startTime, status: 'completed', reason: null,
    });
    localStorage.removeItem(KEY);
    return null;
  }
  return s;
}

const AppBlocker = {
  async getInstalledApps() { return APPS; },

  async startFocus(o: StartFocusOptions) {
    save(KEY, { goal: o.goal, endTime: o.endTime, startTime: Date.now(), blockedPackages: o.blockedPackages });
  },

  async stopFocus(reason?: string) {
    const s = load<Stored>(KEY, null);
    if (!s) return;
    const now = Date.now();
    pushFinished({
      id: String(s.startTime), goal: s.goal, startTime: s.startTime, endTime: now,
      plannedMs: s.endTime - s.startTime, actualMs: now - s.startTime, status: 'broken', reason: reason || null,
    });
    localStorage.removeItem(KEY);
  },

  async getFocusStatus(): Promise<FocusStatus> {
    const s = settle();
    if (!s) return { active: false, goal: '', remainingMs: 0, endTime: 0, startTime: 0, blockedPackages: [] };
    return { active: true, goal: s.goal, remainingMs: s.endTime - Date.now(), endTime: s.endTime, startTime: s.startTime, blockedPackages: s.blockedPackages };
  },

  async checkPermissions(): Promise<PermissionStatus> {
    const p = load<Partial<Record<PermissionType, boolean>>>(PERM, {});
    return {
      accessibility: !!p.accessibility, overlay: !!p.overlay, notifications: !!p.notifications,
      battery: !!p.battery, autostart: !!p.autostart, autostartSupported: true, manufacturer: 'browser-mock',
    };
  },

  /** In the browser there is no system settings screen, so "opening" it just grants the permission. */
  async openPermissionSettings(type: PermissionType) {
    save(PERM, { ...load(PERM, {}), [type]: true });
  },

  async consumeFinishedSessions() {
    settle();
    const f = load<FinishedSession[]>(FIN, []);
    localStorage.removeItem(FIN);
    return f;
  },
};

export default AppBlocker;
