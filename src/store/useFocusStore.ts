import { create } from 'zustand';
import AppBlocker, { type FocusStatus, type InstalledApp, type PermissionStatus } from '../../modules/app-blocker';
import * as db from '../db';
import { toKey } from '../utils/dates';

const IDLE: FocusStatus = { active: false, goal: '', remainingMs: 0, endTime: 0, startTime: 0, blockedPackages: [] };

type State = {
  status: FocusStatus;
  sessions: Awaited<ReturnType<typeof db.getSessions>>;
  apps: InstalledApp[];
  appsLoaded: boolean;
  perms: PermissionStatus | null;
  /** goal pre-filled from a task ("Start focus for this task") */
  draftGoal: string;
  setDraftGoal: (g: string) => void;
  refresh: () => Promise<void>;
  loadApps: () => Promise<void>;
  refreshPerms: () => Promise<PermissionStatus>;
  start: (goal: string, blocked: string[], durationMs: number) => Promise<void>;
  startUntil: (goal: string, blocked: string[], endTime: number) => Promise<void>;
  stop: (reason: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  /** Set when a session completes while the app is open, so UI can celebrate */
  justCompleted: boolean;
  ackCompleted: () => void;
};

export const useFocusStore = create<State>((set, get) => ({
  status: IDLE,
  sessions: [],
  apps: [],
  appsLoaded: false,
  perms: null,
  draftGoal: '',
  justCompleted: false,

  setDraftGoal: (draftGoal) => set({ draftGoal }),
  ackCompleted: () => set({ justCompleted: false }),

  /** Syncs native state + any sessions that finished while JS was not running into SQLite. */
  refresh: async () => {
    const finished = await AppBlocker.consumeFinishedSessions();
    for (const f of finished) {
      await db.addSession({
        id: f.id, date: toKey(new Date(f.startTime)), goal: f.goal, plannedMs: f.plannedMs,
        actualMs: f.actualMs, status: f.status, reason: f.reason, startedAt: f.startTime,
      });
    }
    const wasActive = get().status.active;
    const status = await AppBlocker.getFocusStatus();
    const completedNow = finished.some((f) => f.status === 'completed') && wasActive;
    set({
      status: status.active ? status : IDLE,
      sessions: await db.getSessions(),
      justCompleted: get().justCompleted || completedNow,
    });
  },

  loadApps: async () => {
    if (get().appsLoaded) return;
    const apps = await AppBlocker.getInstalledApps();
    set({ apps: apps.sort((a, b) => a.name.localeCompare(b.name)), appsLoaded: true });
  },

  refreshPerms: async () => {
    const perms = await AppBlocker.checkPermissions();
    set({ perms });
    return perms;
  },

  start: (goal, blocked, durationMs) => get().startUntil(goal, blocked, Date.now() + durationMs),

  startUntil: async (goal, blocked, endTime) => {
    await AppBlocker.startFocus({ goal, blockedPackages: blocked, endTime });
    await get().refresh();
  },

  stop: async (reason) => {
    await AppBlocker.stopFocus(reason);
    await get().refresh();
  },

  clearHistory: async () => {
    await db.clearSessions();
    await get().refresh();
  },
}));
