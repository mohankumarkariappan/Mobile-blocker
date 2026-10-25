package expo.modules.appblocker

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import android.view.accessibility.AccessibilityEvent

/**
 * Runs inside the system, independent of the React Native app. Whenever a window of a blocked app comes to
 * the foreground during an active focus session, the native block screen is shown on top.
 */
class BlockAccessibilityService : AccessibilityService() {
  private lateinit var store: FocusStateStore
  private val handler = Handler(Looper.getMainLooper())
  private var lastBlockAt = 0L

  override fun onServiceConnected() {
    super.onServiceConnected()
    store = FocusStateStore(this)
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
    val pkg = event.packageName?.toString() ?: return
    if (pkg == packageName) return // never block ourselves (includes the block screen)

    val state = store.get()
    if (!state.active || pkg !in state.blocked) return

    // Several events fire while an app opens; react once.
    val now = SystemClock.uptimeMillis()
    if (now - lastBlockAt < 700) return
    lastBlockAt = now

    // Push the blocked app away first so it is hidden even if the block screen is slow to appear.
    performGlobalAction(GLOBAL_ACTION_HOME)
    handler.postDelayed({
      try {
        startActivity(
          Intent(this, BlockActivity::class.java).addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NO_ANIMATION,
          ),
        )
      } catch (e: Exception) {
        Log.e("FocusDay", "Could not show block screen", e)
      }
    }, 120)
  }

  override fun onInterrupt() {}
}
