/* ==================================================
   home.js
================================================== */

const container = document.getElementById("categoryContainer");
const heroContent = document.getElementById("heroContent");
const exploreBtn = document.getElementById("exploreBtn");

// -----------------------------
// Hero animation + CTA behavior
// -----------------------------
if (heroContent) {
  window.setTimeout(() => {
    heroContent.classList.add("hero-visible");
  }, 140);
}

if (exploreBtn) {
  exploreBtn.addEventListener("click", () => {
    if (container) {
      container.scrollIntoView({ behavior: "smooth" });
    }
  });
}

// -----------------------------
// Category cards (industries)
// -----------------------------
const categoryTemplate = document.getElementById("categoryCardTemplate");

const topRow = document.getElementById("topRow");
const bottomRow = document.getElementById("bottomRow");

function createCard(key, sheet) {
  const fragment = categoryTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".category-card");
  const imageEl = fragment.querySelector(".category-image");
  const titleEl = fragment.querySelector(".category-title");

  const firstLetter = sheet.name?.charAt(0)?.toUpperCase() || "?";

  if (imageEl) {
    if (sheet.thumbnail) {
      imageEl.style.backgroundImage = `url(${sheet.thumbnail})`;
      imageEl.classList.add("category-image-has-thumbnail");
    } else {
      imageEl.textContent = firstLetter;
    }
  }

  if (titleEl) titleEl.textContent = sheet.name || "";

  if (card) {
    card.onclick = () => {
      window.location.href = `movies.html?category=${key}`;
    };
  }

  return card;
}

/* ========================================
   AUTO RENDER BASED ON CONFIG (🔥 FLEXIBLE)
   ======================================== */

Object.entries(SHEETS).forEach(([key, sheet]) => {
  const card = createCard(key, sheet);

  if (sheet.row === "bottom") {
    bottomRow.appendChild(card);
  } else {
    // default → top row
    topRow.appendChild(card);
  }
});

/* ========================================
   FOOTER YEAR
   ======================================== */

document.querySelectorAll("[data-footer-year]").forEach(el => {
  el.textContent = String(new Date().getFullYear());
});




// ========================================
// My Favourites Carousel — data from the dedicated "favourites" sheet tab.
// Shows however many rows exist (not capped at 10), in the sheet's own order.
// ========================================
function buildSwiper(slideCount) {
  // Looping needs a comfortable number of slides; turn it off for small sets.
  const loop = slideCount >= 5;

  return new Swiper('.swiper', {
    effect: 'coverflow',
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: 3,
    spaceBetween: 20,
    loop: loop,
    coverflowEffect: {
      rotate: 8,
      stretch: -20,
      depth: 120,
      modifier: 1.5,
      slideShadows: false,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    breakpoints: {
      1024: { slidesPerView: 3, spaceBetween: 24 },
      768: { slidesPerView: 1.4, spaceBetween: 16 },
      0: { slidesPerView: 1.05, spaceBetween: 8 },
    },
  });
}

function initFavouritesCarousel() {
  const wrapper = document.querySelector('.swiper-wrapper');
  const section = document.querySelector('.movie-section');
  if (!wrapper || typeof BASE_URL === 'undefined' || typeof FAVOURITES_GID === 'undefined') {
    return;
  }

  fetch(BASE_URL + FAVOURITES_GID)
    .then(res => res.text())
    .then(text => {
      const favourites = (typeof parseMovies === 'function' ? parseMovies(text) : [])
        .filter(m => m.poster); // a poster is required for a slide

      if (!favourites.length) {
        if (section) section.hidden = true; // nothing to show — hide the section
        return;
      }

      wrapper.innerHTML = favourites
        .map(m => {
          const alt = (m.movie || 'Favourite').replace(/"/g, '&quot;');
          const src = m.poster.replace(/"/g, '&quot;');
          return `<div class="swiper-slide"><img src="${src}" alt="${alt}" loading="lazy"></div>`;
        })
        .join('');

      buildSwiper(favourites.length);
    })
    .catch(err => {
      console.error('Favourites carousel load error:', err);
      if (section) section.hidden = true;
    });
}

initFavouritesCarousel();


