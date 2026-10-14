package expo.modules.appblocker

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Focus state lives in SharedPreferences so blocking works with the React Native app closed.
 * Everything that ends a session goes through [finish], which also queues it for JS to import into SQLite.
 */
class FocusStateStore(context: Context) {
  private val prefs = context.applicationContext.getSharedPreferences("focusday_blocker", Context.MODE_PRIVATE)

  data class State(
    val active: Boolean,
    val goal: String,
    val startTime: Long,
    val endTime: Long,
    val blocked: Set<String>,
  ) {
    val remainingMs: Long get() = if (active) maxOf(0L, endTime - System.currentTimeMillis()) else 0L
  }

  @Synchronized
  fun start(goal: String, blocked: List<String>, endTime: Long) {
    prefs.edit()
      .putBoolean("active", true)
      .putString("goal", goal)
      .putLong("startTime", System.currentTimeMillis())
      .putLong("endTime", endTime)
      .putStringSet("blocked", blocked.toSet())
      .apply()
  }

  /** Current state. Ends the session as "completed" first if its time is up. */
  @Synchronized
  fun get(): State {
    expireIfNeeded()
    return read()
  }

  private fun read() = State(
    active = prefs.getBoolean("active", false),
    goal = prefs.getString("goal", "") ?: "",
    startTime = prefs.getLong("startTime", 0L),
    endTime = prefs.getLong("endTime", 0L),
    blocked = prefs.getStringSet("blocked", emptySet()) ?: emptySet(),
  )

  @Synchronized
  fun expireIfNeeded(): Boolean {
    val s = read()
    if (s.active && System.currentTimeMillis() >= s.endTime) {
      finish("completed", null)
      return true
    }
    return false
  }

  @Synchronized
  fun finish(status: String, reason: String?) {
    val s = read()
    if (!s.active) return
    val now = System.currentTimeMillis()
    val end = if (status == "completed") s.endTime else now
    val item = JSONObject()
      .put("id", s.startTime.toString())
      .put("goal", s.goal)
      .put("startTime", s.startTime)
      .put("endTime", end)
      .put("plannedMs", s.endTime - s.startTime)
      .put("actualMs", end - s.startTime)
      .put("status", status)
      .put("reason", reason ?: JSONObject.NULL)
    val list = JSONArray(prefs.getString("finished", "[]"))
    list.put(item)
    prefs.edit().putString("finished", list.toString()).putBoolean("active", false).apply()
  }

  /** Returns and clears sessions that ended natively. */
  @Synchronized
  fun consumeFinished(): List<Map<String, Any?>> {
    expireIfNeeded()
    val list = JSONArray(prefs.getString("finished", "[]"))
    prefs.edit().putString("finished", "[]").apply()
    return (0 until list.length()).map { i ->
      val o = list.getJSONObject(i)
      mapOf(
        "id" to o.getString("id"),
        "goal" to o.getString("goal"),
        "startTime" to o.getLong("startTime").toDouble(),
        "endTime" to o.getLong("endTime").toDouble(),
        "plannedMs" to o.getLong("plannedMs").toDouble(),
        "actualMs" to o.getLong("actualMs").toDouble(),
        "status" to o.getString("status"),
        "reason" to (if (o.isNull("reason")) null else o.getString("reason")),
      )
    }
  }
}
