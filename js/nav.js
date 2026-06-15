/* ==================================================
   nav.js
   - Shared navbar "Categories" dropdown behavior.
   - Loaded on index.html, movies.html and about.html.
   - Opens on hover (desktop) via CSS; this handles tap-to-open
     on touch devices, plus outside-click / Escape to close, and
     highlights the active category on the movies page.
   ================================================== */
(function () {
  function closeAll(dropdowns, except) {
    dropdowns.forEach((dd) => {
      if (dd === except) return;
      dd.classList.remove("open");
      const t = dd.querySelector(".nav-dropdown-toggle");
      if (t) t.setAttribute("aria-expanded", "false");
    });
  }

  function initDropdowns() {
    const dropdowns = Array.from(document.querySelectorAll(".nav-dropdown"));
    if (!dropdowns.length) return;

    dropdowns.forEach((dd) => {
      const toggle = dd.querySelector(".nav-dropdown-toggle");
      if (!toggle) return;
      toggle.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const willOpen = !dd.classList.contains("open");
        closeAll(dropdowns, dd);
        dd.classList.toggle("open", willOpen);
        toggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
      });
    });

    // Close when clicking anywhere outside an open dropdown.
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".nav-dropdown")) closeAll(dropdowns);
    });

    // Close on Escape.
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll(dropdowns);
    });
  }

  function highlightActiveCategory() {
    const category = new URLSearchParams(location.search).get("category");
    if (!category) return;
    const item = document.querySelector(
      '.nav-dropdown-item[data-category="' + category + '"]'
    );
    if (!item) return;
    item.classList.add("nav-dropdown-item-active");
    const dd = item.closest(".nav-dropdown");
    const toggle = dd && dd.querySelector(".nav-dropdown-toggle");
    if (toggle) toggle.classList.add("nav-link-active");
  }

  function init() {
    initDropdowns();
    highlightActiveCategory();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
