package expo.modules.appblocker

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent

/**
 * Runs inside the system, independent of the React Native app. Whenever a window of a blocked app comes to
 * the foreground during an active focus session, the block screen is drawn on top of it.
 */
class BlockAccessibilityService : AccessibilityService() {
  private lateinit var store: FocusStateStore
  private lateinit var overlay: BlockOverlay
  private val handler = Handler(Looper.getMainLooper())

  override fun onServiceConnected() {
    super.onServiceConnected()
    store = FocusStateStore(this)
    overlay = BlockOverlay(this, store)
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
    val pkg = event.packageName?.toString() ?: return
    if (pkg == packageName) return // never block ourselves (includes the block screen)

    val state = store.get()
    if (!state.active) { overlay.hide(); return }
    if (pkg !in state.blocked) {
      if (pkg != "com.android.systemui") overlay.hide() // user left the blocked app
      return
    }
    if (overlay.showing) return

    val shown = try {
      overlay.show(state) { performGlobalAction(GLOBAL_ACTION_HOME) }
    } catch (e: Exception) {
      Log.e("FocusDay", "Overlay failed", e)
      false
    }
    if (!shown) {
      // Fallback: push the app away, then try the block activity.
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
  }

  override fun onInterrupt() { if (::overlay.isInitialized) overlay.hide() }

  override fun onDestroy() {
    if (::overlay.isInitialized) overlay.hide()
    super.onDestroy()
  }
}
