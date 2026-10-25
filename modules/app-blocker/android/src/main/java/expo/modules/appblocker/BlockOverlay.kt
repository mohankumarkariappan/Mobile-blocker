package expo.modules.appblocker

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

internal fun formatRemaining(ms: Long): String {
  val t = (ms / 1000).coerceAtLeast(0)
  val h = t / 3600; val m = (t % 3600) / 60; val s = t % 60
  return if (h > 0) "%d:%02d:%02d".format(h, m, s) else "%02d:%02d".format(m, s)
}

/**
 * Full-screen block screen drawn by the accessibility service itself (TYPE_ACCESSIBILITY_OVERLAY).
 * Unlike starting an activity from the background, this needs no extra permission and is not
 * blocked by manufacturer "background pop-up" restrictions (Realme / Oppo / Xiaomi / Vivo).
 */
class BlockOverlay(private val service: AccessibilityService, private val store: FocusStateStore) {
  private val wm = service.getSystemService(Context.WINDOW_SERVICE) as WindowManager
  private val handler = Handler(Looper.getMainLooper())
  private var root: View? = null
  private var timeView: TextView? = null

  val showing: Boolean get() = root != null

  private val tick = object : Runnable {
    override fun run() {
      val s = store.get()
      if (!s.active) { hide(); return }
      timeView?.text = formatRemaining(s.remainingMs)
      handler.postDelayed(this, 1000)
    }
  }

  private fun dp(v: Int) = (v * service.resources.displayMetrics.density).toInt()

  private fun label(t: String, size: Float, color: String, bold: Boolean = false) = TextView(service).apply {
    text = t; textSize = size; setTextColor(Color.parseColor(color)); gravity = Gravity.CENTER
    if (bold) setTypeface(typeface, Typeface.BOLD)
  }

  /** Returns false if the window could not be added (caller falls back to the activity). */
  fun show(state: FocusStateStore.State, onBackToWork: () -> Unit): Boolean {
    if (root != null) return true
    val layout = LinearLayout(service).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      setBackgroundColor(Color.parseColor("#F5F7FA"))
      setPadding(dp(28), dp(96), dp(28), dp(48))
      isClickable = true // swallow touches so the app underneath cannot be used
    }
    layout.addView(label("THIS APP IS BLOCKED", 13f, "#6B7785", true).apply { setPadding(0, dp(12), 0, dp(10)); letterSpacing = 0.1f })
    layout.addView(label(state.goal, 26f, "#1F2A37", true))
    timeView = label(formatRemaining(state.remainingMs), 52f, "#5B5BD6", true).apply { setPadding(0, dp(18), 0, dp(4)) }
    layout.addView(timeView)
    layout.addView(label("remaining. You’re doing great, keep going.", 14f, "#6B7785"))
    layout.addView(View(service), LinearLayout.LayoutParams(0, 0, 1f))

    val back = Button(service).apply {
      text = "Back to work"; isAllCaps = false; textSize = 16f; setTextColor(Color.WHITE)
      setTypeface(typeface, Typeface.BOLD)
      background = GradientDrawable().apply { setColor(Color.parseColor("#5B5BD6")); cornerRadius = dp(28).toFloat() }
      setOnClickListener { hide(); onBackToWork() }
    }
    layout.addView(back, LinearLayout.LayoutParams(-1, dp(56)))

    val emergency = Button(service).apply {
      text = "Emergency unlock"; isAllCaps = false; textSize = 14f
      setTextColor(Color.parseColor("#6B7785")); setBackgroundColor(Color.TRANSPARENT)
      setOnClickListener {
        hide()
        service.startActivity(
          Intent(service, BlockActivity::class.java)
            .putExtra("unlock", true)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
        )
      }
    }
    layout.addView(emergency, LinearLayout.LayoutParams(-1, dp(52)).apply { topMargin = dp(8) })

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
      WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
      PixelFormat.OPAQUE,
    )
    return try {
      wm.addView(layout, params)
      root = layout
      handler.removeCallbacks(tick)
      handler.postDelayed(tick, 1000)
      true
    } catch (e: Exception) {
      timeView = null
      false
    }
  }

  fun hide() {
    handler.removeCallbacks(tick)
    root?.let { try { wm.removeView(it) } catch (e: Exception) { /* already gone */ } }
    root = null
    timeView = null
  }
}

/**
 * Small always-on-top countdown pill so the remaining time stays visible over every screen
 * while a session runs. Needs the "Display over other apps" permission; silently skipped without it.
 */
class TimerChip(private val context: Context, private val store: FocusStateStore) {
  private val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
  private val handler = Handler(Looper.getMainLooper())
  private var view: TextView? = null

  private val tick = object : Runnable {
    override fun run() {
      val s = store.get()
      if (!s.active) { hide(); return }
      view?.text = "⏱ ${formatRemaining(s.remainingMs)}"
      handler.postDelayed(this, 1000)
    }
  }

  fun show() {
    if (view != null || !Settings.canDrawOverlays(context)) return
    val s = store.get()
    if (!s.active) return
    val d = context.resources.displayMetrics.density
    val chip = TextView(context).apply {
      text = "⏱ ${formatRemaining(s.remainingMs)}"
      textSize = 13f; setTextColor(Color.WHITE); setTypeface(typeface, Typeface.BOLD)
      setPadding((12 * d).toInt(), (5 * d).toInt(), (12 * d).toInt(), (5 * d).toInt())
      background = GradientDrawable().apply { setColor(Color.parseColor("#CC5B5BD6")); cornerRadius = 20 * d }
    }
    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
      PixelFormat.TRANSLUCENT,
    ).apply { gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL; y = (36 * d).toInt() }
    try {
      wm.addView(chip, params)
      view = chip
      handler.removeCallbacks(tick)
      handler.postDelayed(tick, 1000)
    } catch (e: Exception) { /* overlay not allowed; the notification still shows the time */ }
  }

  fun hide() {
    handler.removeCallbacks(tick)
    view?.let { try { wm.removeView(it) } catch (e: Exception) { /* already gone */ } }
    view = null
  }
}
