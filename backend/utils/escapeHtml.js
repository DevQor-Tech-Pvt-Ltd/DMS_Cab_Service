/**
 * HTML-escape utility to prevent XSS injection in email templates.
 * Escapes the 5 characters that can introduce HTML/JS injection when
 * interpolated into template literals.
 *
 * @param {string} str - Untrusted user input
 * @returns {string} Safe HTML-escaped string
 */
const escapeHtml = (str) => {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (char) => {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return escapeMap[char];
  });
};

module.exports = escapeHtml;
