// FDSE live-coding stub: Rolling Unique Users in last 5 minutes
// Window semantics: (now - windowSeconds, now]  (lower bound exclusive, upper bound inclusive)
// Timestamps across ALL ops are non-decreasing.

class EventCounter {
  /**
   * @param {number} windowSeconds
   */
  constructor(windowSeconds = 300) {
    this.window = windowSeconds;
  }

  /**
   * Remove expired events: ts <= now - this.window
   * @param {number} now
   */
  _evict(now) {
  }

  /**
   * Record an event
   * @param {string} userId
   * @param {number} ts
   */
  ingest(userId, ts) {
  }

  /**
   * Distinct users in (now - window, now]
   * @param {number} now
   * @returns {number}
   */
  count(now) {
    return 0;
  }
}

// --- tiny sanity usage (delete if you want) ---
const ec = new EventCounter();
ec.ingest("u1", 100);
ec.ingest("u1", 200);
console.log(ec.count(300)); // expect 1

ec.ingest("u2", 560);
ec.ingest("u1", 580);
console.log(ec.count(600)); // expect 2
console.log(ec.count(860)); // expect 1