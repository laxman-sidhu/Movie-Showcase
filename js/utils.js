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

/**
 * Split a single CSV line into trimmed, unquoted cell values.
 */
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out.map(v => v.replace(/^"|"$/g, "").trim());
}

/**
 * Parse a movie sheet (CSV) into objects, mapped by COLUMN NAME.
 * Recognised headers (case-insensitive): Name, Year, Genre, Poster Link.
 * A few aliases are accepted, and if the headers aren't recognised it
 * falls back to the positional order [Name, Year, Genre, Poster Link].
 * Row order is always preserved.
 *
 * @param {string} text - Raw CSV text
 * @returns {Array<{movie:string, year:string, genre:string, poster:string}>}
 */
function parseMovies(text) {
  const lines = (text || "").replace(/\r/g, "").trim().split("\n");
  if (!lines.length || (lines.length === 1 && !lines[0])) return [];

  const header = splitCsvLine(lines[0]).map(h => h.toLowerCase());
  const findCol = (aliases, fallbackIdx) => {
    for (const a of aliases) {
      const i = header.indexOf(a);
      if (i !== -1) return i;
    }
    return fallbackIdx;
  };

  const idxName = findCol(["name", "movie", "title"], 0);
  const idxYear = findCol(["year"], 1);
  const idxGenre = findCol(["genre", "category"], 2);
  const idxPoster = findCol(
    ["poster link", "poster", "poster url", "poster_link", "image", "image link", "image url"],
    3
  );

  return lines
    .slice(1)
    .map(line => {
      const c = splitCsvLine(line);
      return {
        movie: (c[idxName] || "").trim(),
        year: (c[idxYear] || "").trim(),
        genre: (c[idxGenre] || "").trim(),
        poster: (c[idxPoster] || "").trim(),
      };
    })
    .filter(m => m.movie);
}
