// services/intentDetector.js

function detectIntent(message) {
  const lower = message.toLowerCase().trim();

  // 1️⃣ REMINDER (must be first)
  if (lower.startsWith("remind me to ")) {
    return "REMINDER";
  }

  // 2️⃣ CHECK_IN (care beats greeting)
  if (
    lower.includes("tired") ||
    lower.includes("overwhelmed") ||
    lower.includes("stressed") ||
    lower.includes("anxious") ||
    lower.includes("sad") ||
    lower.includes("exhausting") ||
    lower.includes("drained") ||
    lower.includes("burned out") ||
    lower.includes("too much") ||
    lower.includes("feeling") ||
    lower.includes("it's been a lot") ||
    lower.includes("not good") ||
    lower.includes("struggling")
  ) {
    return "CHECK_IN";
  }

  // 3️⃣ GREETING & PRESENCE (safe phrase matching)
  const greetingWords = ["hi", "hello", "hey"];
  const greetingPhrases = [
    "good morning",
    "morning",
    "good afternoon",
    "afternoon",
    "good evening",
    "evening",
    "are you there"
  ];

  // Phrase match with punctuation safety
  if (greetingPhrases.some(phrase => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped}(\\W|$)`);
    return regex.test(lower);
  })) {
    return "GREETING";
  }

  // Whole-word greeting match ("hi" but not "this")
  if (greetingWords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`);
    return regex.test(lower);
  })) {
    return "GREETING";
  }

  // 4️⃣ QUESTION
  if (/^(did|do|what|how|when|can)/.test(lower)) {
    return "QUESTION";
  }

  return "UNKNOWN";
}

module.exports = { detectIntent };
