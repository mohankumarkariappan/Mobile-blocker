import { requireNativeModule } from 'expo';
import type {
  FinishedSession, FocusStatus, InstalledApp, PermissionStatus, PermissionType, StartFocusOptions,
} from './src/AppBlocker.types';

export * from './src/AppBlocker.types';

type Native = {
  getInstalledApps(): Promise<InstalledApp[]>;
  startFocus(opts: StartFocusOptions): Promise<void>;
  stopFocus(reason?: string): Promise<void>;
  getFocusStatus(): Promise<FocusStatus>;
  checkPermissions(): Promise<PermissionStatus>;
  openPermissionSettings(type: PermissionType): Promise<void>;
  consumeFinishedSessions(): Promise<FinishedSession[]>;
};

const native = requireNativeModule<Native>('AppBlocker');

/** Clean TypeScript API over the Kotlin module. */
const AppBlocker = {
  getInstalledApps: () => native.getInstalledApps(),
  startFocus: (opts: StartFocusOptions) => native.startFocus(opts),
  stopFocus: (reason?: string) => native.stopFocus(reason ?? ''),
  getFocusStatus: () => native.getFocusStatus(),
  checkPermissions: () => native.checkPermissions(),
  openPermissionSettings: (type: PermissionType) => native.openPermissionSettings(type),
  consumeFinishedSessions: () => native.consumeFinishedSessions(),
};

export default AppBlocker;
