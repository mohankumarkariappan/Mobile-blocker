// Expo config plugin for the app-blocker module (plain JS so it needs no build step).
// On `expo prebuild` it adds permissions + the AccessibilityService, foreground service and block screen
// to the generated AndroidManifest.xml.
const { withAndroidManifest, createRunOncePlugin } = require('@expo/config-plugins');

const PKG = 'expo.modules.appblocker';

const PERMISSIONS = [
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.WAKE_LOCK',
  'android.permission.QUERY_ALL_PACKAGES',
];

function upsert(list, matchKey, matchVal, node) {
  const i = list.findIndex((x) => x.$ && x.$[matchKey] === matchVal);
  if (i >= 0) list[i] = node; else list.push(node);
}

function withAppBlocker(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    manifest['uses-permission'] = manifest['uses-permission'] || [];
    for (const name of PERMISSIONS) {
      if (!manifest['uses-permission'].some((p) => p.$['android:name'] === name)) {
        manifest['uses-permission'].push({ $: { 'android:name': name } });
      }
    }

    const app = manifest.application[0];
    app.service = app.service || [];
    app.activity = app.activity || [];

    // Accessibility service: detects which app is in the foreground.
    upsert(app.service, 'android:name', `${PKG}.BlockAccessibilityService`, {
      $: {
        'android:name': `${PKG}.BlockAccessibilityService`,
        'android:exported': 'true',
        'android:label': 'FocusDay app blocker',
        'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
      },
      'intent-filter': [{ action: [{ $: { 'android:name': 'android.accessibilityservice.AccessibilityService' } }] }],
      'meta-data': [{ $: { 'android:name': 'android.accessibilityservice', 'android:resource': '@xml/focusday_accessibility_service' } }],
    });

    // Foreground service: countdown notification + ends the session on time.
    upsert(app.service, 'android:name', `${PKG}.FocusForegroundService`, {
      $: {
        'android:name': `${PKG}.FocusForegroundService`,
        'android:exported': 'false',
        'android:foregroundServiceType': 'specialUse',
      },
      property: [{ $: { 'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE', 'android:value': 'focus_timer' } }],
    });

    // Full-screen native block screen. Own task so it shows even if the RN app is closed.
    upsert(app.activity, 'android:name', `${PKG}.BlockActivity`, {
      $: {
        'android:name': `${PKG}.BlockActivity`,
        'android:exported': 'false',
        'android:launchMode': 'singleTask',
        'android:excludeFromRecents': 'true',
        'android:taskAffinity': 'com.focusday.block',
        'android:showWhenLocked': 'true',
        'android:theme': '@android:style/Theme.Material.NoActionBar',
      },
    });

    return cfg;
  });
}

module.exports = createRunOncePlugin(withAppBlocker, 'app-blocker', '1.0.0');
