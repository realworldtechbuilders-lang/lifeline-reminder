// services/commandDetector.js

/**
 * Detects user commands that override all other logic.
 * @param {string} cleanText - Normalized (emoji-stripped) text
 * @returns {'PAUSE' | 'RESUME' | null}
 */
function detectCommand(cleanText) {
  const words = cleanText.split(/\s+/);

  // Check for pause/stop/unsubscribe (whole word match)
  const pauseKeywords = ['stop', 'pause', 'unsubscribe', 'cancel', 'quit', 'exit'];
  if (words.some(word => pauseKeywords.includes(word))) {
    return 'PAUSE';
  }

  // Check for resume/start
  const resumeKeywords = ['start', 'resume', 'reactivate', 'come back', 'hi again'];
  if (words.some(word => resumeKeywords.includes(word))) {
    return 'RESUME';
  }

  return null;
}

module.exports = { detectCommand };