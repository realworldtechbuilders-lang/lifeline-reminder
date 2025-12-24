// services/intentDetector.js

function detectIntent(message) {
  const lower = message.toLowerCase().trim();

  // REMINDER
  if (lower.startsWith("remind me to ")) {
    return "REMINDER";
  }

  // GREETING & PRESENCE
  if (
    ["hi", "hello", "hey"].some(g => lower === g) ||
    lower.includes("are you there")
  ) {
    return "GREETING";
  }

  // CHECK_IN
  if (
    lower.includes("tired") ||
    lower.includes("overwhelmed") ||
    lower.includes("stressed") ||
    lower.includes("anxious") ||
    lower.includes("sad") ||
    lower.includes("exhausting") ||   // ✅
    lower.includes("drained") ||      // ✅
    lower.includes("burned out") ||   // ✅
    lower.includes("too much") ||     // ✅
    lower.includes("feeling") ||
    lower.includes("it's been a lot") ||
    lower.includes("not good") ||
    lower.includes("struggling")
  ) {
    return "CHECK_IN";
  }

  // QUESTION
  if (/^(did|do|what|how|when|can)/.test(lower)) {
    return "QUESTION";
  }

  return "UNKNOWN";
}

module.exports = { detectIntent };
