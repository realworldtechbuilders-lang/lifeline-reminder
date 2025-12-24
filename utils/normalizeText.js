// utils/normalizeText.js

/**
 * Normalizes text for reliable command/intent matching.
 * - Lowercases
 * - Trims
 * - Collapses multiple spaces
 * @param {string} text - Raw user input
 * @returns {{ original: string, clean: string }}
 */
function normalizeText(text) {
  if (typeof text !== 'string') return { original: '', clean: '' };

  const original = text.trim();
  // Remove emojis & special chars only for matching (not for logging!)
  const clean = original
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  return { original, clean };
}

module.exports = { normalizeText };