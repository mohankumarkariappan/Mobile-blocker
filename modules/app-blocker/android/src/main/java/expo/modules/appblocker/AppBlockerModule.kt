package expo.modules.appblocker

import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.os.Build
import android.util.Base64
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.ByteArrayOutputStream

class StartFocusOptions : Record {
  @Field val goal: String = ""
  @Field val blockedPackages: List<String> = emptyList()
  @Field val endTime: Double = 0.0 // epoch ms
}

class AppBlockerModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val store: FocusStateStore
    get() = FocusStateStore(context)

  override fun definition() = ModuleDefinition {
    Name("AppBlocker")

    AsyncFunction("getInstalledApps") {
      val pm = context.packageManager
      val launcher = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      pm.queryIntentActivities(launcher, 0)
        .map { it.activityInfo.applicationInfo }
        .filter { it.packageName != context.packageName }
        // Hide pure system apps (Settings, Camera, ...). Preinstalled apps the user has updated from the
        // Play Store (YouTube, Chrome, Gmail, ...) count as user apps, since those are the ones worth blocking.
        .filter { (it.flags and ApplicationInfo.FLAG_SYSTEM) == 0 || (it.flags and ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0 }
        .distinctBy { it.packageName }
        .map { info ->
          mapOf(
            "name" to pm.getApplicationLabel(info).toString(),
            "packageName" to info.packageName,
            "icon" to iconToBase64(pm.getApplicationIcon(info)),
          )
        }
        .sortedBy { (it["name"] as String).lowercase() }
    }

    AsyncFunction("startFocus") { opts: StartFocusOptions ->
      val end = opts.endTime.toLong()
      if (end <= System.currentTimeMillis()) throw IllegalArgumentException("endTime must be in the future")
      store.start(opts.goal, opts.blockedPackages, end)
      val svc = Intent(context, FocusForegroundService::class.java)
      if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(svc) else context.startService(svc)
    }

    AsyncFunction("stopFocus") { reason: String? ->
      store.finish("broken", reason?.ifBlank { null })
      context.stopService(Intent(context, FocusForegroundService::class.java))
    }

    AsyncFunction("getFocusStatus") {
      val s = store.get()
      mapOf(
        "active" to s.active,
        "goal" to s.goal,
        "remainingMs" to s.remainingMs.toDouble(),
        "endTime" to s.endTime.toDouble(),
        "startTime" to s.startTime.toDouble(),
        "blockedPackages" to s.blocked.toList(),
      )
    }

    AsyncFunction("checkPermissions") {
      mapOf(
        "accessibility" to PermissionHelper.accessibilityEnabled(context),
        "overlay" to PermissionHelper.overlayGranted(context),
        "notifications" to PermissionHelper.notificationsGranted(context),
        "battery" to PermissionHelper.batteryUnrestricted(context),
        "autostart" to false, // Android offers no API to read this
        "autostartSupported" to PermissionHelper.autostartSupported(),
        "manufacturer" to Build.MANUFACTURER,
      )
    }

    AsyncFunction("openPermissionSettings") { type: String ->
      PermissionHelper.open(context, type)
    }

    AsyncFunction("consumeFinishedSessions") {
      store.consumeFinished()
    }
  }

  private fun iconToBase64(d: Drawable): String? = try {
    val size = 96
    val bmp = if (d is BitmapDrawable && d.bitmap != null) {
      Bitmap.createScaledBitmap(d.bitmap, size, size, true)
    } else {
      Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888).also {
        val c = Canvas(it); d.setBounds(0, 0, size, size); d.draw(c)
      }
    }
    val out = ByteArrayOutputStream()
    bmp.compress(Bitmap.CompressFormat.PNG, 90, out)
    Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
  } catch (e: Exception) {
    null
  }
}
