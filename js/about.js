/* ==================================================
   about.js
   - Fetches counts from configured sheets and animates statistics
     on the About page. Also wires CTA/email forms.
   - Uses shared CSV parser from utils.js.
   ================================================== */

// About page: live counts + animated counters

const categoryMount = document.getElementById("categoryStatsMount");
const totalMoviesEl = document.getElementById("totalMoviesCount");
const lastUpdatedEl = document.getElementById("lastUpdated");
const totalWebSeriesEl = document.getElementById("totalWebSeriesCount");
const webSeriesUpdatedEl = document.getElementById("webSeriesUpdated");
const aboutStatTemplate = document.getElementById("aboutStatTemplate");

// CSV parser and safeMovieCountFromRows are provided by shared utils.js

// -----------------------------
// Counter animation
// -----------------------------
function animateNumber(el, toValue, opts = {}) {
  const duration = opts.duration ?? 900;
  const fromValue = Number(el.dataset.count || "0") || 0;
  const start = performance.now();

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = easeOutCubic(t);
    const current = Math.round(fromValue + (toValue - fromValue) * eased);

    el.textContent = current.toLocaleString();
    if (t < 1) requestAnimationFrame(frame);
    else el.dataset.count = String(toValue);
  }

  requestAnimationFrame(frame);
}

// -----------------------------
// Build cards + fetch counts
// -----------------------------
function makeCategoryCard({ key, name }) {
  if (!aboutStatTemplate) return null;

  const fragment = aboutStatTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".about-stat-card");
  if (!card) return null;

  card.dataset.key = key;

  const iconLetter = (name || "?").trim().charAt(0).toUpperCase();

  const iconEl = card.querySelector(".about-stat-icon");
  const titleEl = card.querySelector(".about-stat-title");
  const linkEl = card.querySelector(".about-stat-open");

  if (iconEl) iconEl.textContent = iconLetter;
  if (titleEl) titleEl.textContent = name || "";
  if (linkEl) linkEl.href = `movies.html?category=${key}`;

  return card;
}

function ensureCards() {
  if (!categoryMount || !aboutStatTemplate || typeof SHEETS === "undefined") return;

  categoryMount.innerHTML = "";

  Object.entries(SHEETS)
    .filter(([key]) => key !== "must_watch" && key !== "watchlist" && key !== "web_series" && key !== "recently_watched")
    .forEach(([key, sheet]) => {
      const card = makeCategoryCard({ key, name: sheet.name });
      if (card) categoryMount.appendChild(card);
    });
}

async function fetchCategoryCount(gid) {
  const res = await fetch(BASE_URL + gid);
  const text = await res.text();
  const rows = parseCSV(text);
  return safeMovieCountFromRows(rows);
}

async function refreshCounts() {
  if (typeof SHEETS === "undefined" || typeof BASE_URL === "undefined") return;

  if (lastUpdatedEl) lastUpdatedEl.textContent = "Updating…";

  const entries = Object.entries(SHEETS).filter(
    ([key]) => key !== "must_watch" && key !== "watchlist" && key !== "web_series" && key !== "recently_watched"
  );

  const results = await Promise.allSettled(
    entries.map(([key, sheet]) =>
      fetchCategoryCount(sheet.gid).then(count => ({ key, count }))
    )
  );

  let total = 0;

  results.forEach(r => {
    if (r.status !== "fulfilled") return;
    const { key, count } = r.value;
    total += count;

    const card = categoryMount && categoryMount.querySelector(`[data-key="${key}"]`);
    const valueEl = card && card.querySelector(".about-stat-value");
    if (valueEl) animateNumber(valueEl, count, { duration: 850 });
  });

  if (totalMoviesEl) animateNumber(totalMoviesEl, total, { duration: 1000 });

  const now = new Date();
  if (lastUpdatedEl) {
    lastUpdatedEl.textContent = `Updated ${now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })}`;
  }
}

async function refreshWebSeriesCount() {
  if (typeof SHEETS === "undefined" || typeof BASE_URL === "undefined") return;
  if (!SHEETS.web_series) return;

  if (webSeriesUpdatedEl) webSeriesUpdatedEl.textContent = "Updating…";

  try {
    const count = await fetchCategoryCount(SHEETS.web_series.gid);

    if (totalWebSeriesEl) {
      animateNumber(totalWebSeriesEl, count, { duration: 900 });
    }

    const now = new Date();
    if (webSeriesUpdatedEl) {
      webSeriesUpdatedEl.textContent = `Updated ${now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })}`;
    }
  } catch (err) {
    if (webSeriesUpdatedEl) webSeriesUpdatedEl.textContent = "Update failed";
  }
}

// Init
ensureCards();
refreshCounts();
refreshWebSeriesCount();

window.setInterval(() => {
  refreshCounts();
  refreshWebSeriesCount();
}, 60 * 1000);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    refreshCounts();
    refreshWebSeriesCount();
  }
});

// -----------------------------
// Footer dynamic year
// -----------------------------
document.querySelectorAll("[data-footer-year]").forEach(el => {
  el.textContent = String(new Date().getFullYear());
});

// -----------------------------
// CTA toggles + EmailJS sending
// -----------------------------
(function initAboutCta() {
  const ctaSection = document.querySelector(".about-cta");
  if (!ctaSection) return;

  const optionButtons = Array.from(ctaSection.querySelectorAll(".about-cta-option"));
  const wraps = Array.from(ctaSection.querySelectorAll(".about-cta-form-wrap"));

  const recommendWrap = ctaSection.querySelector('[data-form-wrap="recommend"]');
  const improveWrap = ctaSection.querySelector('[data-form-wrap="improve"]');

  const recommendForm = document.getElementById("aboutRecommendForm");
  const improveForm = document.getElementById("aboutImproveForm");

  const SERVICE_ID = "service_c41en5g";
  const TEMPLATE_ID_RECOMMEND = "template_w1pnw7s";
  const TEMPLATE_ID_IMPROVE = "template_gwyra6j";
  const PUBLIC_KEY = "XjDW8AH_ls1a6wpZ3";

  const emailjsAvailable = typeof window !== "undefined" && window.emailjs;

  if (emailjsAvailable) {
    try {
      window.emailjs.init({ publicKey: PUBLIC_KEY });
    } catch (_) {}
  }

  function setStatus(formEl, kind, message) {
    const statusEl = formEl && formEl.querySelector(".about-cta-status");
    if (!statusEl) return;

    statusEl.classList.remove("is-success", "is-error");
    if (kind) statusEl.classList.add(kind === "success" ? "is-success" : "is-error");
    statusEl.textContent = message || "";
  }

  function setOpen(target) {
    wraps.forEach(w => {
      const open = w.dataset.formWrap === target;
      w.classList.toggle("is-open", open);
      w.setAttribute("aria-hidden", open ? "false" : "true");
    });

    optionButtons.forEach(btn => {
      const active = btn.dataset.form === target;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-expanded", active ? "true" : "false");
    });

    if (target === "recommend" && recommendForm) setStatus(recommendForm, null, "");
    if (target === "improve" && improveForm) setStatus(improveForm, null, "");
  }

  function closeAll() {
    wraps.forEach(w => {
      w.classList.remove("is-open");
      w.setAttribute("aria-hidden", "true");
    });

    optionButtons.forEach(btn => {
      btn.classList.remove("is-active");
      btn.setAttribute("aria-expanded", "false");
    });
  }

  optionButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.form;
      const alreadyActive = btn.classList.contains("is-active");
      if (alreadyActive) closeAll();
      else setOpen(target);
    });
  });

  async function sendWithEmailJs({ templateId, name, message, typeLabel }) {
    if (!emailjsAvailable) throw new Error("EmailJS not loaded");

    return window.emailjs.send(SERVICE_ID, templateId, {
      user_name: name,
      user_message: message,
      message_type: typeLabel
    });
  }

  function wireForm(formEl, templateId, typeLabel) {
    if (!formEl) return;

    formEl.addEventListener("submit", async e => {
      e.preventDefault();

      const nameEl = formEl.querySelector('input[name="name"]');
      const msgEl = formEl.querySelector('textarea[name="message"]');
      const submitBtn = formEl.querySelector('button[type="submit"]');

      const name = (nameEl && nameEl.value || "").trim();
      const message = (msgEl && msgEl.value || "").trim();

      if (!name || !message) {
        setStatus(formEl, "error", "Please fill in your name and your message.");
        return;
      }

      setStatus(formEl, null, "Sending…");
      if (submitBtn) submitBtn.disabled = true;

      try {
        await sendWithEmailJs({ templateId, name, message, typeLabel });
        setStatus(formEl, "success", "Sent! Thanks for your feedback.");
        formEl.reset();

        window.setTimeout(() => {
          closeAll();
          setStatus(formEl, null, "");
        }, 1200);
      } catch (err) {
        setStatus(formEl, "error", "Couldn’t send right now. Please try again in a moment.");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  wireForm(recommendForm, TEMPLATE_ID_RECOMMEND, "recommendation");
  wireForm(improveForm, TEMPLATE_ID_IMPROVE, "improvement");

  closeAll();

  ctaSection.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    closeAll();
  });
})();