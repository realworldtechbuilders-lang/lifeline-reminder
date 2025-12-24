// services/storage.js
// Handles user memory and state (Week 2+)
const db = require('../config/database');

/**
 * Read user's memory (safe, structured)
 * @param {string} userId - WhatsApp ID
 * @returns {Object} { preferences: {}, habits: [], context: {} }
 */
function readMemory(userId) {
  try {
    const row = db.prepare("SELECT memory FROM users WHERE whatsapp = ?").get(userId);
    if (row?.memory) {
      const parsed = JSON.parse(row.memory);
      // Ensure structure matches spec
      return {
        preferences: parsed.preferences || {},
        habits: Array.isArray(parsed.habits) ? parsed.habits : [],
        context: parsed.context || {}
      };
    }
  } catch (err) {
    console.error(`⚠️ Memory read error for ${userId}:`, err.message);
  }
  // Default structure
  return { preferences: {}, habits: [], context: {} };
}

/**
 * Update memory with a patch (shallow merge)
 * @param {string} userId
 * @param {Object} patch - e.g., { context: { persona: "new_parent" } }
 */
function updateMemory(userId, patch) {
  if (!patch || typeof patch !== 'object') return;

  const current = readMemory(userId);
  const updated = { ...current };

  // Merge top-level keys only
  if (patch.preferences) updated.preferences = { ...updated.preferences, ...patch.preferences };
  if (patch.habits && Array.isArray(patch.habits)) updated.habits = patch.habits;
  if (patch.context) updated.context = { ...updated.context, ...patch.context };

  try {
    db.prepare("UPDATE users SET memory = ? WHERE whatsapp = ?")
      .run(JSON.stringify(updated), userId);
  } catch (err) {
    console.error(`❌ Memory update failed for ${userId}:`, err.message);
  }
}

/**
 * Update onboarding day
 * @param {string} userId
 * @param {number} day (0-7)
 */
function updateOnboardingDay(userId, day) {
  try {
    db.prepare("UPDATE users SET onboarding_day = ? WHERE whatsapp = ?")
      .run(Math.max(0, Math.min(7, day)), userId);
  } catch (err) {
    console.error(`❌ Onboarding update failed for ${userId}:`, err.message);
  }
}

module.exports = { readMemory, updateMemory, updateOnboardingDay };