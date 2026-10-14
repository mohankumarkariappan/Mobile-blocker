package expo.modules.appblocker

import android.Manifest
import android.app.NotificationManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings

object PermissionHelper {
  private val AUTOSTART_BRANDS = setOf("xiaomi", "redmi", "poco", "oppo", "realme", "oneplus", "vivo", "iqoo", "huawei", "honor")

  /** Known OEM "autostart / background start" screens. First one that resolves wins. */
  private val AUTOSTART_INTENTS = listOf(
    "com.miui.securitycenter" to "com.miui.permcenter.autostart.AutoStartManagementActivity",
    "com.coloros.safecenter" to "com.coloros.safecenter.permission.startup.StartupAppListActivity",
    "com.coloros.safecenter" to "com.coloros.safecenter.startupapp.StartupAppListActivity",
    "com.oppo.safe" to "com.oppo.safe.permission.startup.StartupAppListActivity",
    "com.coloros.oppoguardelf" to "com.coloros.powermanager.fuelgaue.PowerUsageModelActivity",
    "com.vivo.permissionmanager" to "com.vivo.permissionmanager.activity.BgStartUpManagerActivity",
    "com.iqoo.secure" to "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity",
    "com.iqoo.secure" to "com.iqoo.secure.ui.phoneoptimize.BgStartUpManager",
    "com.huawei.systemmanager" to "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity",
    "com.oneplus.security" to "com.oneplus.security.chainlaunch.view.ChainLaunchAppListActivity",
  )

  fun accessibilityEnabled(ctx: Context): Boolean {
    val enabled = Settings.Secure.getString(ctx.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: return false
    val me = ComponentName(ctx, BlockAccessibilityService::class.java)
    return enabled.split(':').any {
      val c = ComponentName.unflattenFromString(it)
      c != null && c == me
    }
  }

  fun overlayGranted(ctx: Context) = Settings.canDrawOverlays(ctx)

  fun notificationsGranted(ctx: Context): Boolean {
    if (Build.VERSION.SDK_INT >= 33 &&
      ctx.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
    ) return false
    return (ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).areNotificationsEnabled()
  }

  fun batteryUnrestricted(ctx: Context) =
    (ctx.getSystemService(Context.POWER_SERVICE) as PowerManager).isIgnoringBatteryOptimizations(ctx.packageName)

  fun autostartSupported() = Build.MANUFACTURER.lowercase() in AUTOSTART_BRANDS

  fun open(ctx: Context, type: String) {
    val intent = when (type) {
      "accessibility" -> Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
      "overlay" -> Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${ctx.packageName}"))
      "notifications" -> Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, ctx.packageName)
      "battery" -> Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:${ctx.packageName}"))
      "autostart" -> autostartIntent(ctx)
      else -> throw IllegalArgumentException("Unknown permission type: $type")
    }
    start(ctx, intent, fallback = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${ctx.packageName}")))
  }

  private fun autostartIntent(ctx: Context): Intent {
    for ((pkg, cls) in AUTOSTART_INTENTS) {
      val i = Intent().setComponent(ComponentName(pkg, cls))
      if (ctx.packageManager.resolveActivity(i, 0) != null) return i
    }
    return Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${ctx.packageName}"))
  }

  private fun start(ctx: Context, intent: Intent, fallback: Intent) {
    try {
      ctx.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    } catch (e: Exception) {
      ctx.startActivity(fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
  }
}
