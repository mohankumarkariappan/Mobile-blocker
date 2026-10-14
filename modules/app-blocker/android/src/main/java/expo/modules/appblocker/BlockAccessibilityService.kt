package expo.modules.appblocker

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent

/**
 * Runs inside the system, independent of the React Native app. Whenever a window of a blocked app comes to
 * the foreground during an active focus session, the native block screen is shown on top.
 */
class BlockAccessibilityService : AccessibilityService() {
  private lateinit var store: FocusStateStore

  override fun onServiceConnected() {
    super.onServiceConnected()
    store = FocusStateStore(this)
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
    val pkg = event.packageName?.toString() ?: return
    if (pkg == packageName) return // never block ourselves (includes the block screen)

    val state = store.get()
    if (!state.active || pkg !in state.blocked) return

    val intent = Intent(this, BlockActivity::class.java).addFlags(
      Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NO_ANIMATION,
    )
    startActivity(intent)
  }

  override fun onInterrupt() {}
}
