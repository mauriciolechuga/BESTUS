/**
 * Replaces {ts} in the template with the current timestamp.
 * @param {string} template
 * @returns {string}
 */
export function uniqueEmail(template) {
  return template.replace('{ts}', Date.now());
}
