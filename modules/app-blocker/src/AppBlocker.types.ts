export type InstalledApp = {
  name: string;
  packageName: string;
  /** base64 PNG (no data: prefix), or null when unavailable */
  icon: string | null;
};

export type StartFocusOptions = {
  goal: string;
  blockedPackages: string[];
  /** epoch milliseconds when the session ends */
  endTime: number;
};

export type FocusStatus = {
  active: boolean;
  goal: string;
  remainingMs: number;
  endTime: number;
  startTime: number;
  blockedPackages: string[];
};

export type PermissionType =
  | 'accessibility'
  | 'overlay'
  | 'notifications'
  | 'battery'
  | 'autostart';

export type PermissionStatus = {
  accessibility: boolean;
  overlay: boolean;
  notifications: boolean;
  battery: boolean;
  /** Autostart cannot be detected on Android; always false, user confirms manually. */
  autostart: boolean;
  /** Xiaomi / Oppo / Vivo etc. where an autostart screen exists */
  autostartSupported: boolean;
  manufacturer: string;
};

/** A session that ended natively (timer finished or emergency unlock) while JS may not have been running. */
export type FinishedSession = {
  id: string;
  goal: string;
  startTime: number;
  endTime: number;
  plannedMs: number;
  actualMs: number;
  status: 'completed' | 'broken';
  reason: string | null;
};
