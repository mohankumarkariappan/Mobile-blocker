package expo.modules.appblocker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper

/**
 * Keeps the process alive during a session and shows the live countdown notification
 * (the system renders the chronometer, so no per-second updates are needed).
 * Ends the session as "completed" when the time is up.
 */
class FocusForegroundService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private lateinit var store: FocusStateStore

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    store = FocusStateStore(this)
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.createNotificationChannel(NotificationChannel(CHANNEL, "Focus session", NotificationManager.IMPORTANCE_LOW))
    nm.createNotificationChannel(NotificationChannel(DONE_CHANNEL, "Focus finished", NotificationManager.IMPORTANCE_DEFAULT))
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val state = store.get()
    if (!state.active) {
      // Restarted by the system after the session already ended.
      startForegroundCompat(buildNotification("Focus ended", 0L))
      stopForegroundCompat()
      stopSelf()
      return START_NOT_STICKY
    }

    startForegroundCompat(buildNotification(state.goal, state.endTime))
    handler.removeCallbacksAndMessages(null)
    handler.postDelayed({ finishIfDone() }, (state.endTime - System.currentTimeMillis()).coerceAtLeast(0) + 300)
    return START_STICKY
  }

  private fun finishIfDone() {
    if (store.get().active) { // not finished yet (clock drift) – check again shortly
      handler.postDelayed({ finishIfDone() }, 1000); return
    }
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val done = Notification.Builder(this, DONE_CHANNEL)
      .setSmallIcon(applicationInfo.icon)
      .setContentTitle("Focus session complete 🎉")
      .setContentText("Nice work — your apps are unblocked.")
      .setContentIntent(openAppIntent())
      .setAutoCancel(true)
      .build()
    // An emergency unlock / stopFocus stops this service first, so this only runs for completed sessions.
    nm.notify(DONE_ID, done)
    stopForegroundCompat()
    stopSelf()
  }

  private fun openAppIntent(): PendingIntent {
    val launch = packageManager.getLaunchIntentForPackage(packageName)
    return PendingIntent.getActivity(this, 0, launch, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
  }

  private fun buildNotification(goal: String, endTime: Long): Notification {
    val b = Notification.Builder(this, CHANNEL)
      .setSmallIcon(applicationInfo.icon)
      .setContentTitle("Focus: $goal")
      .setContentIntent(openAppIntent())
      .setOngoing(true)
      .setOnlyAlertOnce(true)
    if (endTime > 0) {
      b.setContentText("Time remaining").setWhen(endTime).setShowWhen(true)
        .setUsesChronometer(true).setChronometerCountDown(true)
    }
    return b.build()
  }

  private fun startForegroundCompat(n: Notification) {
    if (Build.VERSION.SDK_INT >= 34) {
      startForeground(ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(ID, n)
    }
  }

  private fun stopForegroundCompat() {
    if (Build.VERSION.SDK_INT >= 24) stopForeground(STOP_FOREGROUND_REMOVE)
    else @Suppress("DEPRECATION") stopForeground(true)
  }

  override fun onDestroy() { handler.removeCallbacksAndMessages(null); super.onDestroy() }

  companion object {
    const val CHANNEL = "focusday_session"
    const val DONE_CHANNEL = "focusday_done"
    const val ID = 4201
    const val DONE_ID = 4202
  }
}
