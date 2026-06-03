/* ==================================================
   SHARED UTILITIES
   - Common functions used across pages (CSV parser, etc.)
   - Keeps code DRY and maintainable
   ================================================== */

/**
 * Parses CSV text into a 2D array of values.
 * Handles quoted fields with commas inside them.
 * Skips the header row (first row).
 * 
 * @param {string} text - Raw CSV text
 * @returns {Array<Array<string>>} Array of rows, each row is an array of column values
 */
function parseCSV(text) {
  const lines = text
    .trim()
    .replace(/\r/g, "")
    .split("\n");

  // Remove header row
  lines.shift();

  return lines.map(line => {
    const values = [];
    let current = "";
    let insideQuotes = false;

    for (let char of line) {
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    values.push(current);

    return values.map(v =>
      v.replace(/^"|"$/g, "").trim()
    );
  });
}

/**
 * Counts valid movie entries from parsed CSV rows.
 * A row is valid if it has a non-empty movie name (first column).
 * 
 * @param {Array<Array<string>>} rows - Array of CSV rows
 * @returns {number} Count of valid movie entries
 */
function safeMovieCountFromRows(rows) {
  let count = 0;
  for (const cols of rows) {
    const movie = (cols[0] || "").trim();
    if (movie) count += 1;
  }
  return count;
}
