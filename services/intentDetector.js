// services/intentDetector.js

function detectIntent(message) {
  const lower = message.toLowerCase().trim();

  // REMINDER: Only if starts with "remind me to"
  if (lower.startsWith("remind me to ")) {
    return "REMINDER";
  }

  // GREETING
  if (["hi", "hello", "hey", "good morning", "good evening"].some(g => lower.includes(g))) {
    return "GREETING";
  }

  // CHECK_IN: Emotional or state-sharing phrases
  if (
    lower.includes("tired") ||
    lower.includes("overwhelmed") ||
    lower.includes("stressed") ||
    lower.includes("anxious") ||
    lower.includes("sad") ||
    lower.includes("feeling") ||
    lower.includes("it's been a lot") ||
    lower.includes("not good") ||
    lower.includes("struggling")
  ) {
    return "CHECK_IN";
  }

  // QUESTION: Starts with common query words
  if (/^(did|do|what|how|when|can)/.test(lower)) {
    return "QUESTION";
  }

  // Everything else
  return "UNKNOWN";
}

module.exports = { detectIntent };