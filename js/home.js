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
// Top 10 Favorites Carousel - Swiper
// ========================================
const swiper = new Swiper('.swiper', {
  effect: 'coverflow',
  grabCursor: true,
  centeredSlides: true,
  slidesPerView: 3,
  spaceBetween: 20,
  loop: true,
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
    // when window width is >= 1024px
    1024: {
      slidesPerView: 3,
      spaceBetween: 24
    },
    // tablets
    768: {
      slidesPerView: 1.4,
      spaceBetween: 16
    },
    // mobile
    0: {
      slidesPerView: 1.05,
      spaceBetween: 8
    }
  }
});


