package expo.modules.appblocker

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Full-screen native block screen. Built in code (no layout XML) and independent of React Native,
 * so it works when the app process is not running.
 */
class BlockActivity : Activity() {
  private val handler = Handler(Looper.getMainLooper())
  private lateinit var store: FocusStateStore
  private lateinit var remainingView: TextView
  private lateinit var goalView: TextView
  private lateinit var unlockPanel: LinearLayout
  private lateinit var unlockStatus: TextView
  private lateinit var unlockButton: Button
  private lateinit var reasonInput: EditText
  private var unlockSecondsLeft = 0
  private var unlockRunning = false

  private val tick = object : Runnable {
    override fun run() {
      val s = store.get()
      if (!s.active) { finish(); return }
      remainingView.text = format(s.remainingMs)
      handler.postDelayed(this, 1000)
    }
  }

  private val unlockTick = object : Runnable {
    override fun run() {
      if (unlockSecondsLeft > 0) unlockSecondsLeft--
      refreshUnlock()
      if (unlockSecondsLeft > 0) handler.postDelayed(this, 1000)
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    store = FocusStateStore(this)
    val s = store.get()
    if (!s.active) { finish(); return }
    setShowWhenLocked(true)
    buildUi(s)
  }

  private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

  private fun pill(color: Int) = GradientDrawable().apply { setColor(color); cornerRadius = dp(28).toFloat() }

  private fun buildUi(s: FocusStateStore.State) {
    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      setBackgroundColor(Color.parseColor("#F5F7FA"))
      setPadding(dp(28), dp(72), dp(28), dp(36))
    }

    fun text(t: String, size: Float, color: String, bold: Boolean = false) = TextView(this).apply {
      this.text = t; textSize = size; setTextColor(Color.parseColor(color)); gravity = Gravity.CENTER
      if (bold) setTypeface(typeface, Typeface.BOLD)
    }

    root.addView(text("🛡️", 56f, "#000000"))
    root.addView(text("THIS APP IS BLOCKED", 13f, "#6B7785", true).apply { setPadding(0, dp(12), 0, dp(10)); letterSpacing = 0.1f })

    goalView = text(s.goal, 26f, "#1F2A37", true)
    root.addView(goalView)

    remainingView = text(format(s.remainingMs), 52f, "#6C8EF5", true).apply { setPadding(0, dp(18), 0, dp(4)) }
    root.addView(remainingView)
    root.addView(text("remaining. You’re doing great — keep going.", 14f, "#6B7785"))

    root.addView(View(this), LinearLayout.LayoutParams(0, 0, 1f))

    val back = Button(this).apply {
      this.text = "Back to work"; isAllCaps = false; textSize = 16f; setTextColor(Color.WHITE)
      setTypeface(typeface, Typeface.BOLD); background = pill(Color.parseColor("#6C8EF5"))
      setOnClickListener { goHome() }
    }
    root.addView(back, LinearLayout.LayoutParams(-1, dp(56)))

    val emergency = Button(this).apply {
      this.text = "Emergency unlock"; isAllCaps = false; textSize = 14f
      setTextColor(Color.parseColor("#6B7785")); setBackgroundColor(Color.TRANSPARENT)
      setOnClickListener { startUnlockFlow() }
    }
    root.addView(emergency, LinearLayout.LayoutParams(-1, dp(52)).apply { topMargin = dp(8) })

    unlockPanel = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      visibility = View.GONE
      background = GradientDrawable().apply { setColor(Color.WHITE); cornerRadius = dp(20).toFloat() }
      setPadding(dp(16), dp(16), dp(16), dp(16))
    }
    unlockPanel.addView(text("Breaking focus is saved in your history. Is this really needed?", 14f, "#1F2A37"))
    reasonInput = EditText(this).apply {
      hint = "Why do you need to stop? (min 5 characters)"
      inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_MULTI_LINE
      minLines = 2
      addTextChangedListener(object : TextWatcher {
        override fun afterTextChanged(e: Editable?) = refreshUnlock()
        override fun beforeTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
        override fun onTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
      })
    }
    unlockPanel.addView(reasonInput)
    unlockStatus = text("", 13f, "#F2B25C", true).apply { setPadding(0, dp(8), 0, dp(8)) }
    unlockPanel.addView(unlockStatus)
    unlockButton = Button(this).apply {
      this.text = "Unlock"; isAllCaps = false; setTextColor(Color.parseColor("#E87C7C"))
      background = pill(Color.parseColor("#FBE7E7")); isEnabled = false
      setOnClickListener { doUnlock() }
    }
    unlockPanel.addView(unlockButton, LinearLayout.LayoutParams(-1, dp(48)))
    root.addView(unlockPanel, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(10) })

    setContentView(root)
  }

  private fun startUnlockFlow() {
    unlockPanel.visibility = View.VISIBLE
    if (unlockRunning) return
    unlockRunning = true
    unlockSecondsLeft = 30
    refreshUnlock()
    handler.postDelayed(unlockTick, 1000)
  }

  private fun refreshUnlock() {
    val reasonOk = reasonInput.text.toString().trim().length >= 5
    val ready = unlockSecondsLeft == 0 && reasonOk
    unlockStatus.text = when {
      unlockSecondsLeft > 0 -> "Please wait ${unlockSecondsLeft}s…"
      reasonOk -> "You can unlock now."
      else -> "Now type your reason."
    }
    unlockButton.isEnabled = ready
    unlockButton.alpha = if (ready) 1f else 0.45f
  }

  private fun doUnlock() {
    store.finish("broken", reasonInput.text.toString().trim())
    stopService(Intent(this, FocusForegroundService::class.java))
    finishAndRemoveTask()
  }

  private fun goHome() {
    startActivity(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    finish()
  }

  private fun format(ms: Long): String {
    val t = (ms / 1000).coerceAtLeast(0)
    val h = t / 3600; val m = (t % 3600) / 60; val sec = t % 60
    return if (h > 0) "%d:%02d:%02d".format(h, m, sec) else "%02d:%02d".format(m, sec)
  }

  override fun onResume() { super.onResume(); handler.removeCallbacks(tick); handler.post(tick) }
  override fun onPause() { super.onPause(); handler.removeCallbacks(tick) }
  override fun onDestroy() { handler.removeCallbacksAndMessages(null); super.onDestroy() }

  // Back button must not reveal the blocked app.
  @Deprecated("Deprecated in Java")
  override fun onBackPressed() = goHome()
}
