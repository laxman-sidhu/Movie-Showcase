/* ==================================================
   movies.js
   - Loads a category's sheet, parses CSV (via utils.js), renders movie grid,
     provides filtering, and manages movie detail modal.
   - Uses `config.js` for sheet mapping and `BASE_URL`.
   ================================================== */

// -----------------------------
// URL PARAMS & SHEET SETUP
// -----------------------------
const params = new URLSearchParams(window.location.search);
const categoryKey = params.get("category");
const sheet = SHEETS[categoryKey];

if (!sheet) {
  // If category is missing or invalid, just send user home without an annoying alert
  window.location.href = "index.html";
}

// -----------------------------
// DOM ELEMENTS
// -----------------------------
const grid = document.getElementById("movieGrid");
const title = document.getElementById("pageTitle");
const searchInput = document.getElementById("searchInput");
const genreFilter = document.getElementById("genreFilter");
const emptyMessage = document.getElementById("moviesEmptyMessage");
const errorMessage = document.getElementById("moviesErrorMessage");
const movieCardTemplate = document.getElementById("movieCardTemplate");
const movieModalTemplate = document.getElementById("movieModalTemplate");

title.textContent = sheet.name;

let allMovies = [];

// CSV parser is provided by shared utils.js

// -----------------------------
// FETCH GOOGLE SHEET
// -----------------------------
fetch(BASE_URL + sheet.gid)
  .then(res => res.text())
  .then(text => {
    const rows = parseCSV(text);

    allMovies = rows
      .map(cols => {
        const [movie, year, genre, poster] = cols;
        return { movie, year, genre, poster };
      })
      .filter(m => m.movie);

    buildGenreFilter(allMovies);
    renderMovies(allMovies);
  })
  .catch(err => {
    console.error("Sheet load error:", err);
    grid.innerHTML = "";
    if (emptyMessage) emptyMessage.hidden = true;
    if (errorMessage) {
      errorMessage.hidden = false;
    }
  });

// -----------------------------
// RENDER MOVIES
// -----------------------------
function renderMovies(list) {
  if (!grid) return;

  grid.innerHTML = "";

  if (!list.length) {
    if (errorMessage) errorMessage.hidden = true;
    if (emptyMessage) emptyMessage.hidden = false;
    return;
  }

  if (emptyMessage) emptyMessage.hidden = true;
  if (!movieCardTemplate) return;

  list.forEach(m => {
    const fragment = movieCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".card");
    const imgEl = fragment.querySelector(".card-poster-img");
    const fallbackSpan = fragment.querySelector(".card-poster-fallback");
    const titleEl = fragment.querySelector(".card-title");
    const yearEl = fragment.querySelector(".card-year");

    if (titleEl) titleEl.textContent = m.movie || "";
    if (yearEl) yearEl.textContent = m.year || "";

    if (imgEl && fallbackSpan) {
      if (m.poster) {
        imgEl.src = m.poster;
        imgEl.alt = m.movie || "";
        imgEl.onload = () => {
          imgEl.classList.add("loaded");
          fallbackSpan.style.display = "none";
        };
        imgEl.onerror = () => {
          imgEl.style.display = "none";
          fallbackSpan.textContent = m.movie || "";
        };
      } else {
        imgEl.style.display = "none";
        fallbackSpan.textContent = m.movie || "";
      }
    }

    if (card) {
      card.onclick = () =>
        openModal(m.movie, m.year, m.genre, m.poster);
      grid.appendChild(card);
    }
  });
}

// -----------------------------
// FILTERS (SEARCH + GENRE)
// -----------------------------
function applyFilters() {
  let value = "";
  if (searchInput) {
    value = searchInput.value.toLowerCase();
  }

  const selectedGenre =
    genreFilter && genreFilter.value && genreFilter.value !== "all"
      ? genreFilter.value
      : null;

  const filtered = allMovies.filter(m => {
    const matchesSearch = m.movie.toLowerCase().includes(value);
    const matchesGenre = selectedGenre
      ? (m.genre || "").toLowerCase() === selectedGenre.toLowerCase()
      : true;
    return matchesSearch && matchesGenre;
  });

  renderMovies(filtered);
}

if (searchInput) {
  searchInput.addEventListener("input", applyFilters);
}

if (genreFilter) {
  genreFilter.addEventListener("change", applyFilters);
}

// Build dynamic genre list from sheet data
function buildGenreFilter(movies) {
  if (!genreFilter) return;

  const genres = new Set();
  movies.forEach(m => {
    if (m.genre) {
      genres.add(m.genre.trim());
    }
  });

  // reset existing options (keep "All categories" as first)
  genreFilter.innerHTML = '<option value="all">All categories</option>';

  Array.from(genres)
    .sort((a, b) => a.localeCompare(b))
    .forEach(g => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      genreFilter.appendChild(opt);
    });
}

// -----------------------------
// MODAL
// -----------------------------
function openModal(movie, year, genre, poster) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalContent");
  if (!modal || !content || !movieModalTemplate) return;

  const fragment = movieModalTemplate.content.cloneNode(true);
  const imgEl = fragment.querySelector(".movie-modal-img");
  const titleEl = fragment.querySelector(".movie-modal-title");
  const yearEl = fragment.querySelector(".movie-modal-year");
  const genreEl = fragment.querySelector(".movie-modal-genre");
  const sepEl = fragment.querySelector(".movie-modal-separator");

  if (titleEl) titleEl.textContent = movie || "";

  if (imgEl) {
    if (poster) {
      imgEl.src = poster;
      imgEl.alt = movie || "";
      imgEl.onload = () => {
        imgEl.classList.add("loaded");
      };
      imgEl.onerror = () => {
        imgEl.style.display = "none";
      };
    } else {
      imgEl.style.display = "none";
    }
  }

  const hasYear = Boolean(year);
  const hasGenre = Boolean(genre);

  if (yearEl) {
    if (hasYear) {
      yearEl.textContent = year;
      yearEl.hidden = false;
    } else {
      yearEl.hidden = true;
    }
  }

  if (genreEl) {
    if (hasGenre) {
      genreEl.textContent = genre;
      genreEl.hidden = false;
    } else {
      genreEl.hidden = true;
    }
  }

  if (sepEl) {
    sepEl.hidden = !(hasYear && hasGenre);
  }

  content.innerHTML = "";
  content.appendChild(fragment);
  
  // Add active class for animation
  modal.classList.add("active");
  
  // Prevent scrolling on body when modal is open
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.getElementById("modal");
  modal.classList.remove("active");
  
  // Re-enable scrolling after transition
  setTimeout(() => {
    document.body.style.overflow = "";
  }, 300);
}

// Initialize modal interactions when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  if (modal) {
    // Close modal when clicking outside the modal content
    modal.addEventListener("click", (e) => {
      // Only close if clicking on the modal background, not the content
      if (e.target === modal) {
        closeModal();
      }
    });
  }
  
  // Close modal with Escape key for better UX
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("active")) {
      closeModal();
    }
  });
});
