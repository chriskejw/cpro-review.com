// =========================
// CONFIG (production keys/ids)
// =========================
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwGvCZuDpuV7T60mUMcePUt0SN5d7MUhQ9xQ3Lmmivj33lSKo6Csn9xv1IPhOOVT4li/exec";
const EMAILJS_PUBLIC_KEY     = "Ow9sGUE6hSO-EpF_T";
const EMAILJS_SERVICE_ID     = "service_8fe6yij";
const EMAILJS_TEMPLATE_ID    = "template_wxvjwg9";
const UTTERANCES_REPO        = "chriskejw/cpro-review.com";

const POSTS_PER_PAGE  = 9;
const VIDEOS_PER_PAGE = 9;

// HOME LIMITS (homepage shows newest 6 each)
const HOME_POSTS_LIMIT  = 6;
const HOME_VIDEOS_LIMIT = 6;
const THEME_KEY = "cproreview-theme";

// State
let ALL_CARDS = [];  // posts
let ALL_VIDS  = [];  // videos

let POSTS_STATE  = { page: 1, category: "all",  query: "", categories: [] };
let VIDEOS_STATE = { page: 1, category: "all",  query: "", categories: [] };

applyInitialTheme();

function getPreferredTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {}
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyInitialTheme() {
  document.documentElement.dataset.theme = getPreferredTheme();
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
  updateThemeToggle(theme);
}

function updateThemeToggle(theme = document.documentElement.dataset.theme) {
  const isDark = theme === "dark";
  document.querySelectorAll(".js-theme-toggle").forEach(btn => {
    btn.setAttribute("aria-pressed", String(isDark));
    btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    btn.innerHTML = `<i class="fa-solid ${isDark ? "fa-sun" : "fa-moon"}" aria-hidden="true"></i>`;
  });
}

function initThemeToggle() {
  const buttons = document.querySelectorAll(".js-theme-toggle");
  if (!buttons.length) return;
  updateThemeToggle();
  buttons.forEach(btn => btn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(next);
  }));
}

// =========================
/* BOOT */
// =========================
document.addEventListener("DOMContentLoaded", async () => {
  await loadIncludes();
  initThemeToggle();

  // Enable search only on these pages
  const allowedSearchPages = ["index.html", "posts.html", "videos.html"];
  const path = window.location.pathname;
  const page = path.substring(path.lastIndexOf("/") + 1) || "index.html";
  if (allowedSearchPages.includes(page)) {
    document.body.classList.add("search-enabled");
  }

  // Run search-related features ONLY when search is enabled
  if (document.body.classList.contains("search-enabled")) {
    enhanceSearchClear();         // universal clear (❌)
    wireGlobalSearchNavigation(); // Enter-to-search -> posts.html?q=
  }

  // Footer year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Third-party init
  if (window.emailjs && EMAILJS_PUBLIC_KEY) emailjs.init(EMAILJS_PUBLIC_KEY);

  initHome();
  initPostsPage();
  initVideosPage();

  initNewsletter();
  initComments();
  initBackToTop();

  setActiveNav();
  enableSmoothScroll();

  // pause on hover/tap & resume later for the featured carousel
  enableCarouselTapPause();

  // update post detail meta (time-ago on post pages)
  initPostDetailMeta();
  initRelatedPosts();
});

// =========================
/* INCLUDES */
// =========================
async function loadIncludes() {
  const include = async (id, file) => {
    const host = document.getElementById(id);
    if (!host) return;
    try {
      const res = await fetch(file, { cache: "no-cache" });
      if (!res.ok) throw new Error(`Include not found: ${file}`);
      host.innerHTML = await res.text();
    } catch (e) { console.error(e); }
  };
  await include("header-include", "header.html");
  await include("footer-include", "footer.html");
}

// =========================
/* URL HELPERS */
// =========================
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || "";
}
function getCurrentPage() {
  const path = window.location.pathname;
  return path.substring(path.lastIndexOf("/") + 1) || "index.html";
}
function setQueryParam(name, value, targetUrl = null) {
  const url = targetUrl ? new URL(targetUrl, window.location.href) : new URL(window.location.href);
  if (value) url.searchParams.set(name, value);
  else url.searchParams.delete(name);
  return url.toString();
}

async function fetchJson(file) {
  const res = await fetch(file, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${file} returned ${res.status}`);
  return res.json();
}

function showLoadError(container, message) {
  if (!container) return;
  container.innerHTML = `<div class="col-12"><p class="text-muted mb-0">${escapeHtml(message)}</p></div>`;
}

// Navbar search routes to the relevant library and supports both Enter and button submit.
function wireGlobalSearchNavigation() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  const form = input.closest("form");
  const goToSearch = () => {
    const q = (input.value || "").trim();
    const page = getCurrentPage();
    const target = page === "videos.html" ? "videos.html" : "posts.html";
    const url = setQueryParam("q", q, new URL(target, window.location.href));
    window.location.href = url;
  };

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      goToSearch();
    });
  }

  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    goToSearch();
  });
}

// =========================
/* DATE UTILS */
// =========================
function parseDateSafe(s) {
  if (!s || typeof s !== "string") return new Date(0);
  const clean = s.replace(/\s+/g, " ").trim().replace(/,\s*/g, ", ");
  const t = Date.parse(clean);
  return isNaN(t) ? new Date(0) : new Date(t);
}
function sortByNewest(arr, dateKey = "date") {
  arr.forEach(x => (x._d = parseDateSafe(x[dateKey])));
  arr.sort((a, b) => b._d - a._d);
  return arr;
}

/**
 * Time-ago with explicit ranges:
 * minutes (1–59), hours (1–23), days (1–13), weeks (2–3), months (1–11), years (1–99)
 */
function timeAgoLimited(dateStr) {
  const d = parseDateSafe(dateStr);
  if (!(d instanceof Date) || isNaN(d.getTime())) return dateStr || "";

  const now = new Date();
  let diffMs = now - d;
  if (diffMs < 0) diffMs = 0; // future-proof

  const M = 60 * 1000;       // minute
  const H = 60 * M;          // hour
  const D = 24 * H;          // day

  // Minutes (1–59)
  const minutes = Math.floor(diffMs / M);
  if (minutes < 60) {
    const m = Math.max(1, minutes); // clamp 1..59
    return `${m} minute${m === 1 ? "" : "s"} ago`;
  }

  // Hours (1–23)
  const hours = Math.floor(diffMs / H);
  if (hours < 24) {
    const h = Math.max(1, hours); // clamp 1..23
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }

  // Days (1–13)
  const days = Math.floor(diffMs / D);
  if (days <= 13) {
    const dNum = Math.max(1, days);
    return `${dNum} day${dNum === 1 ? "" : "s"} ago`;
  }

  // Weeks (2–3) for 14–27 days
  if (days < 28) {
    const w = Math.max(2, Math.min(3, Math.floor(days / 7)));
    return `${w} week${w === 1 ? "" : "s"} ago`;
  }

  // Months (1–11) — approx by 30-day months for < 1 year
  if (days < 365) {
    let m = Math.floor(days / 30);
    m = Math.max(1, Math.min(11, m));
    return `${m} month${m === 1 ? "" : "s"} ago`;
  }

  // Years (1–99)
  let y = Math.floor(days / 365);
  y = Math.max(1, Math.min(99, y));
  return `${y} year${y === 1 ? "" : "s"} ago`;
}

// =========================
/* HOME */
// =========================
function initHome() {
  const postGrid        = document.querySelector(".card-grid");
  const featuredPrimary = document.getElementById("featured-primary");
  const featuredSecondary = document.getElementById("featured-secondary");
  const homeCategoryLinks = document.getElementById("homeCategoryLinks");

  const noResults       = document.getElementById("noResults");
  const searchInput     = document.getElementById("searchInput");

  // Build Featured Posts carousel & Latest Posts grid
  if (featuredPrimary || featuredSecondary || postGrid || homeCategoryLinks) {
    if (featuredPrimary) featuredPrimary.innerHTML = `<p class="text-muted mb-0">Loading featured posts...</p>`;
    fetchJson("posts.json")
      .then(cards => {
        sortByNewest(cards);
        ALL_CARDS = cards;

        renderFeaturedPosts(cards, featuredPrimary, featuredSecondary);
        renderHomeCategoryTiles(homeCategoryLinks);

        // Latest posts grid on home — limit to 6
        if (postGrid) {
          renderCompactPostCards(cards.slice(0, HOME_POSTS_LIMIT), postGrid);

          if (searchInput) {
            const doFilter = () => {
              const q = (searchInput.value || "").toLowerCase().trim();
              const filtered = q
                ? filterItems(ALL_CARDS, q, "all").slice(0, HOME_POSTS_LIMIT)
                : ALL_CARDS.slice(0, HOME_POSTS_LIMIT);
              renderCompactPostCards(filtered, postGrid);
              if (noResults) noResults.style.display = filtered.length ? "none" : "block";
            };
            searchInput.addEventListener("input", doFilter, { passive: true });
          }
        }

        initReveal();
      })
      .catch(err => {
        console.error("posts.json error:", err);
        showLoadError(postGrid, "Posts could not be loaded right now.");
        showLoadError(featuredPrimary, "Featured posts could not be loaded right now.");
        if (featuredSecondary) featuredSecondary.innerHTML = "";
      });
  }

  // Latest Videos grid on home — limit to 6
  const homeVideoGrid = document.getElementById("videoGrid");
  const noVideoResults = document.getElementById("noVideoResults");

  if (homeVideoGrid) {
    homeVideoGrid.innerHTML = `<div class="col"><div class="text-muted py-4">Loading videos...</div></div>`;
    fetchJson("videos.json")
      .then(videos => {
        sortByNewest(videos);
        ALL_VIDS = videos;

        // show newest 6 on home
        const items = videos.slice(0, HOME_VIDEOS_LIMIT);

        if (!items.length) {
          if (noVideoResults) noVideoResults.style.display = "block";
        } else {
          if (noVideoResults) noVideoResults.style.display = "none";
          renderVideoCards(items, homeVideoGrid);
        }

        setupVideoModal();
        initReveal();
      })
      .catch(err => {
        console.error("videos.json error:", err);
        showLoadError(homeVideoGrid, "Videos could not be loaded right now.");
      });
  }
}

// =========================
/* POSTS PAGE */
// =========================
function initPostsPage() {
  const grid        = document.getElementById("postsGrid");
  const searchInput = document.getElementById("searchInput");
  const noResults   = document.getElementById("noResults");
  const catSelect   = document.getElementById("categoryFilter");
  const pager       = document.getElementById("postsPagination");
  if (!grid || !pager || !catSelect) return;

  const seedQ = getQueryParam("q");
  if (seedQ && searchInput) searchInput.value = seedQ;

  fetchJson("posts.json")
    .then(cards => {
      sortByNewest(cards);
      ALL_CARDS = cards;

      const set = new Set(["all"]);
      cards.forEach(c => set.add((c.category || "General").trim()));
      POSTS_STATE.categories = Array.from(set);
      populateSelect(catSelect, POSTS_STATE.categories);
      renderCategoryChips(document.getElementById("postCategoryChips"), POSTS_STATE.categories.filter(c => c !== "all"), "posts.html");

      const seedCategory = getQueryParam("category");
      if (seedCategory && POSTS_STATE.categories.includes(seedCategory)) {
        POSTS_STATE.category = seedCategory;
        catSelect.value = seedCategory;
      }

      const applyAndRender = () => {
        POSTS_STATE.query = (searchInput?.value || "").toLowerCase().trim();
        const filtered = filterItems(cards, POSTS_STATE.query, POSTS_STATE.category);
        renderPostsPage(grid, pager, filtered, noResults);
      };

      catSelect.addEventListener("change", (e) => {
        POSTS_STATE.category = e.target.value;
        POSTS_STATE.page = 1;
        const newUrl = setQueryParam("category", POSTS_STATE.category === "all" ? "" : POSTS_STATE.category);
        window.history.replaceState({}, "", newUrl);
        applyAndRender();
      });

      if (searchInput) {
        searchInput.addEventListener("input", () => {
          POSTS_STATE.page = 1;
          const newUrl = setQueryParam("q", searchInput.value.trim());
          window.history.replaceState({}, "", newUrl);
          applyAndRender();
        }, { passive: true });
      }

      applyAndRender();
    })
    .catch(err => {
      console.error("posts.json error:", err);
      showLoadError(grid, "Posts could not be loaded right now.");
      if (pager) pager.innerHTML = "";
    });
}

function renderPostsPage(grid, pager, items, noResults) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const current = Math.min(POSTS_STATE.page, pages);

  const start = (current - 1) * POSTS_PER_PAGE;
  const end   = start + POSTS_PER_PAGE;
  const pageItems = items.slice(start, end);

  grid.innerHTML = "";
  if (!pageItems.length) {
    if (noResults) noResults.style.display = "block";
  } else {
    if (noResults) noResults.style.display = "none";
    renderPostCards(pageItems, grid);
    // ensure reveal items become visible after dynamic render
    initReveal();
  }

  renderPagination(pager, current, pages, (p) => {
    POSTS_STATE.page = p;
    renderPostsPage(grid, pager, items, noResults);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// =========================
/* VIDEOS PAGE */
// =========================
function initVideosPage() {
  const grid        = document.getElementById("videosGrid");
  const searchInput = document.getElementById("searchInput");
  const noResults   = document.getElementById("noVideoResults");
  const catSelect   = document.getElementById("videoCategoryFilter");
  const pager       = document.getElementById("videosPagination");
  if (!grid || !pager || !catSelect) return;

  const seedQ = getQueryParam("q");
  if (seedQ && searchInput) searchInput.value = seedQ;

  fetchJson("videos.json")
    .then(videos => {
      sortByNewest(videos);
      ALL_VIDS = videos;

      const set = new Set(["all"]);
      videos.forEach(v => set.add((v.category || "General").trim()));
      VIDEOS_STATE.categories = Array.from(set);
      populateSelect(catSelect, VIDEOS_STATE.categories);
      renderCategoryChips(document.getElementById("videoCategoryChips"), VIDEOS_STATE.categories.filter(c => c !== "all"), "videos.html");

      const seedCategory = getQueryParam("category");
      if (seedCategory && VIDEOS_STATE.categories.includes(seedCategory)) {
        VIDEOS_STATE.category = seedCategory;
        catSelect.value = seedCategory;
      }

      const applyAndRender = () => {
        VIDEOS_STATE.query = (searchInput?.value || "").toLowerCase().trim();
        const filtered = filterItems(videos, VIDEOS_STATE.query, VIDEOS_STATE.category);
        renderVideosPage(grid, pager, filtered, noResults);
      };

      catSelect.addEventListener("change", (e) => {
        VIDEOS_STATE.category = e.target.value;
        VIDEOS_STATE.page = 1;
        const newUrl = setQueryParam("category", VIDEOS_STATE.category === "all" ? "" : VIDEOS_STATE.category);
        window.history.replaceState({}, "", newUrl);
        applyAndRender();
      });

      if (searchInput) {
        searchInput.addEventListener("input", () => {
          VIDEOS_STATE.page = 1;
          const newUrl = setQueryParam("q", searchInput.value.trim());
          window.history.replaceState({}, "", newUrl);
          applyAndRender();
        }, { passive: true });
      }

      applyAndRender();
      setupVideoModal();
    })
    .catch(err => {
      console.error("videos.json error:", err);
      showLoadError(grid, "Videos could not be loaded right now.");
      if (pager) pager.innerHTML = "";
    });
}

function renderVideosPage(grid, pager, items, noResults) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / VIDEOS_PER_PAGE));
  const current = Math.min(VIDEOS_STATE.page, pages);

  const start = (current - 1) * VIDEOS_PER_PAGE;
  const end   = start + VIDEOS_PER_PAGE;
  const pageItems = items.slice(start, end);

  grid.innerHTML = "";
  if (!pageItems.length) {
    if (noResults) noResults.style.display = "block";
  } else {
    if (noResults) noResults.style.display = "none";
    renderVideoCards(pageItems, grid);
    // ensure reveal items become visible after dynamic render
    initReveal();
  }

  renderPagination(pager, current, pages, (p) => {
    VIDEOS_STATE.page = p;
    renderVideosPage(grid, pager, items, noResults);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// =========================
/* RENDER HELPERS (with category pill + time-ago) */
// =========================
function getCategories(items) {
  return Array.from(new Set(items.map(i => (i.category || "General").trim()))).sort((a, b) => a.localeCompare(b));
}

function renderCategoryChips(container, categories, targetPage) {
  if (!container) return;
  const chips = categories.map(cat => {
    const url = setQueryParam("category", cat, new URL(targetPage, window.location.href));
    return `<a class="category-chip" href="${url}">${escapeHtml(cat)}</a>`;
  }).join("");
  container.innerHTML = `<a class="category-chip active" href="${targetPage}">All</a>${chips}`;
}

function renderHomeCategoryTiles(container) {
  if (!container) return;
  const tiles = [
    ["Audio", "fa-headphones", "40+ reviews"],
    ["Laptops", "fa-laptop", "Buying guides"],
    ["Cameras", "fa-camera", "Field tested"],
    ["Smart Home", "fa-house", "Useful upgrades"],
    ["Networking", "fa-wifi", "Routers & mesh"],
    ["Wearables", "fa-mobile-screen-button", "Daily tech"],
    ["Accessories", "fa-keyboard", "Desk essentials"],
    ["Office", "fa-briefcase", "Work setup"]
  ];

  container.innerHTML = tiles.map(([label, icon, meta]) => {
    const category = label === "Audio" || label === "Laptops" || label === "Cameras" || label === "Smart Home" || label === "Networking" || label === "Wearables" || label === "Office"
      ? "Reviews"
      : label;
    const url = setQueryParam("category", category, new URL("posts.html", window.location.href));
    return `
      <a class="category-tile" href="${url}">
        <span><i class="fa-solid ${icon}"></i></span>
        <strong>${escapeHtml(label)}</strong>
        <small>${escapeHtml(meta)}</small>
      </a>
    `;
  }).join("");
}

function renderFeaturedPosts(cards, primaryEl, secondaryEl) {
  if (!primaryEl && !secondaryEl) return;
  const featured = cards.filter(c => c.featured);
  const items = (featured.length >= 4 ? featured : cards).slice(0, 4);
  const [primary, ...secondary] = items;

  if (primaryEl && primary) {
    primaryEl.innerHTML = `
      <a class="featured-primary-card card-link" href="${primary.link}" aria-label="Read review: ${escapeHtml(primary.title)}">
        <img src="${primary.image || 'assets/images/post1.jpg'}" alt="${escapeHtml(primary.title)}">
        <div class="featured-primary-body">
          <div class="review-card-topline">
            <span class="badge rounded-pill bg-danger category-pill">${escapeHtml(primary.category || "Review")}</span>
            <span class="score-badge">9.4</span>
          </div>
          <h3>${escapeHtml(primary.title)}</h3>
          <p>${escapeHtml(primary.description || "")}</p>
          <div class="stars" aria-label="Rating 4.5 out of 5">★★★★★</div>
          <span class="card-action">Read Review <span aria-hidden="true">→</span></span>
        </div>
      </a>
    `;
  }

  if (secondaryEl) {
    secondaryEl.innerHTML = secondary.map(item => `
      <a class="featured-secondary-card card-link" href="${item.link}" aria-label="Read review: ${escapeHtml(item.title)}">
        <img src="${item.image || 'assets/images/post1.jpg'}" alt="${escapeHtml(item.title)}">
        <div>
          <div class="review-card-topline">
            <span class="badge rounded-pill bg-danger category-pill">${escapeHtml(item.category || "Review")}</span>
            <span class="score-badge small-score">9.1</span>
          </div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description || "")}</p>
          <span class="card-action">Read Review <span aria-hidden="true">→</span></span>
        </div>
      </a>
    `).join("");
  }
}

function renderCompactPostCards(items, container) {
  container.innerHTML = "";
  items.forEach(card => {
    const item = document.createElement("a");
    item.className = "compact-post-card reveal";
    item.href = card.link;
    item.setAttribute("aria-label", `Read post: ${card.title || "Post"}`);
    const ago = timeAgoLimited(card.date);
    item.innerHTML = `
      <img src="${card.image || 'assets/images/post1.jpg'}" alt="${escapeHtml(card.title)}" loading="lazy">
      <div>
        <div class="card-meta">
          <span>${escapeHtml(card.category || "Post")}</span>
          <span aria-hidden="true">•</span>
          <span title="${escapeHtml(card.date || "")}">${escapeHtml(ago)}</span>
        </div>
        <h3>${escapeHtml(card.title)}</h3>
        <p>${escapeHtml(card.description || "")}</p>
        <span class="card-action">Read Post <span aria-hidden="true">→</span></span>
      </div>
    `;
    container.appendChild(item);
  });
}

function renderPostCards(items, container) {
  container.innerHTML = "";
  items.forEach(card => {
    const col = document.createElement("div");
    col.className = "col reveal";

    const categoryPill = card.category
      ? `<span class="badge rounded-pill bg-danger category-pill">${escapeHtml(card.category)}</span>`
      : "";

    const ago = timeAgoLimited(card.date);
    const readTime = card.readTime || estimateReadTime(`${card.title || ""} ${card.description || ""}`);

    col.innerHTML = `
      <article class="card h-100 shadow-sm border-0 clickable-card post-card-modern">
        <div class="card-media">
          <img src="${card.image || 'assets/images/post1.jpg'}" class="card-img-top" alt="${escapeHtml(card.title)}" loading="lazy">
          ${categoryPill}
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span title="${escapeHtml(card.date || '')}">${escapeHtml(ago)}</span>
            <span aria-hidden="true">•</span>
            <span>${escapeHtml(readTime)}</span>
          </div>
          <h5 class="card-title">${escapeHtml(card.title)}</h5>
          <p class="card-text" title="${escapeHtml(card.description || '')}">
            ${escapeHtml(card.description || "")}
          </p>

          <!-- Full-card link -->
          <a href="${card.link}" class="stretched-link" aria-label="Open post: ${escapeHtml(card.title)}"></a>

          <!-- CTA pinned bottom (CSS .card-cta) -->
          <span class="card-cta">Read More <span aria-hidden="true">→</span></span>
        </div>
      </article>`;
    container.appendChild(col);
  });
}

function renderVideoCards(items, container) {
  container.innerHTML = "";
  items.forEach(v => {
    const id = getYouTubeId(v.embed);
    const thumb = v.thumbnail && v.thumbnail.trim() ? v.thumbnail : youTubeThumb(id, "hqdefault");

    const categoryPill = v.category
      ? `<span class="badge rounded-pill bg-danger category-pill">${escapeHtml(v.category)}</span>`
      : "";
    const durationBadge = v.duration
      ? `<span class="video-duration">${escapeHtml(v.duration)}</span>`
      : "";

    const ago = timeAgoLimited(v.date);

    const col = document.createElement("div");
    col.className = "col reveal";
    col.innerHTML = `
      <article class="card h-100 shadow-sm border-0 video-card"
           data-video-id="${id}"
           data-video-title="${escapeHtml(v.title)}"
           role="button" tabindex="0"
           aria-label="Play video: ${escapeHtml(v.title)}">
        <div class="thumb-wrap">
          <img src="${thumb}" alt="${escapeHtml(v.title)}" class="card-img-top" loading="lazy">
          ${categoryPill}
          ${durationBadge}
          <button type="button" class="play-btn btn btn-primary rounded-circle" aria-hidden="true">
            <i class="fa-solid fa-play"></i>
          </button>
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span title="${escapeHtml(v.date || '')}">${escapeHtml(ago)}</span>
            <span aria-hidden="true">•</span>
            <span>Video</span>
          </div>
          <h5 class="card-title">${escapeHtml(v.title)}</h5>
          <p class="card-text">${escapeHtml(v.description || "")}</p>
        </div>
      </article>`;
    container.appendChild(col);
  });
}

// Reusable modal hookup for home (#videoGrid) and videos page (#videosGrid)
function setupVideoModal() {
  const grids = ["videosGrid", "videoGrid"]
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const modalEl = document.getElementById("videoPlayerModal");
  const frame   = document.getElementById("videoPlayerFrame");
  const titleEl = document.getElementById("videoPlayerTitle");
  if (!grids.length || !modalEl || !frame) return;

  const openFromCard = (card) => {
    const id    = card.getAttribute("data-video-id");
    const title = card.getAttribute("data-video-title") || "Video";
    if (!id) return;
    frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    if (titleEl) titleEl.textContent = title;
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  };

  grids.forEach(grid => {
    grid.addEventListener("click", (e) => {
      const card = e.target.closest("[data-video-id]");
      if (card) openFromCard(card);
    });
    grid.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest("[data-video-id]");
      if (card) {
        e.preventDefault();
        openFromCard(card);
      }
    });
  });

  modalEl.addEventListener("hidden.bs.modal", () => {
    frame.src = "";
    if (titleEl) titleEl.textContent = "";
  });
}

// Pause on hover/tap and resume later for the Featured Posts carousel
function enableCarouselTapPause() {
  const el = document.getElementById("featuredCarousel");
  if (!el || typeof bootstrap === "undefined") return;

  const carousel = bootstrap.Carousel.getOrCreateInstance(el, {
    interval: 6000,
    pause: "hover"
  });

  let resumeTimer = null;
  const RESUME_DELAY_MS = 8000;

  const pause = () => {
    clearTimeout(resumeTimer);
    try { carousel.pause(); } catch {}
  };
  const scheduleResume = () => {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      try { carousel.cycle(); } catch {}
    }, RESUME_DELAY_MS);
  };

  // mobile tap = pause; resume after delay
  el.addEventListener("touchstart", pause, { passive: true });
  el.addEventListener("touchend", scheduleResume, { passive: true });

  // keyboard focus also pauses; resume when focus leaves
  el.addEventListener("focusin", pause);
  el.addEventListener("focusout", scheduleResume);
}

// =========================
/* FILTERS & PAGINATION HELPERS */
// =========================
function populateSelect(selectEl, categories) {
  selectEl.querySelectorAll("option:not([value='all'])").forEach(o => o.remove());
  categories
    .filter(c => c !== "all")
    .sort((a, b) => a.localeCompare(b))
    .forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      selectEl.appendChild(opt);
    });
}

function filterItems(items, query, category) {
  return items.filter(i => {
    const inCat = category === "all" || (i.category || "General") === category;
    if (!query) return inCat;
    const haystack = [
      i.title,
      i.description,
      i.category,
      i.date,
      i.duration,
      i.embed
    ].filter(Boolean).join(" ").toLowerCase();
    return inCat && haystack.includes(query);
  });
}

function renderPagination(pager, current, pages, onGo) {
  pager.innerHTML = "";
  pager.appendChild(pagerButton("Prev", current === 1, () => onGo(current - 1)));

  const windowSize = 7;
  const half = Math.floor(windowSize / 2);
  let from = Math.max(1, current - half);
  let to   = Math.min(pages, from + windowSize - 1);
  from = Math.max(1, to - windowSize + 1);

  for (let p = from; p <= to; p++) {
    pager.appendChild(pagerNumber(p, p === current, () => onGo(p)));
  }
  pager.appendChild(pagerButton("Next", current === pages, () => onGo(current + 1)));
}

function pagerButton(label, disabled, onClick) {
  const li = document.createElement("li");
  li.className = `page-item ${disabled ? "disabled" : ""}`;
  li.innerHTML = `<button class="page-link">${label}</button>`;
  if (!disabled) li.querySelector("button").addEventListener("click", onClick);
  return li;
}
function pagerNumber(num, active, onClick) {
  const li = document.createElement("li");
  li.className = `page-item ${active ? "active" : ""}`;
  li.innerHTML = `<button class="page-link">${num}</button>`;
  if (!active) li.querySelector("button").addEventListener("click", onClick);
  return li;
}

// =========================
/* MISC UTILS */
// =========================
function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
}
function getYouTubeId(url) {
  if (!url) return "";
  const patterns = [
    /youtu\.be\/([^?&#/]+)/i,
    /youtube\.com\/watch\?[^#]*v=([^?&#/]+)/i,
    /youtube\.com\/embed\/([^?&#/]+)/i,
    /youtube\.com\/shorts\/([^?&#/]+)/i
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  if (/^[\w-]{11}$/.test(url)) return url;
  return "";
}
function youTubeThumb(id, quality="hqdefault") {
  return id ? `https://img.youtube.com/vi/${id}/${quality}.jpg` : "assets/images/post1.jpg";
}

function estimateReadTime(text) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 180))} min read`;
}

function initReveal() {
  const els = document.querySelectorAll(".reveal");
  const obs = new IntersectionObserver((entries, observer) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
}

function initBackToTop() {
  const btn = document.getElementById("backToTop");
  if (!btn) return;
  window.addEventListener("scroll", () => {
    btn.style.display = window.scrollY > 200 ? "flex" : "none";
  });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function setActiveNav() {
  const path = location.pathname.split("/").pop();
  document.querySelectorAll(".nav-link").forEach(a => {
    const href = a.getAttribute("href");
    if (href && path === href) a.classList.add("active", "text-danger");
    else a.classList.remove("active", "text-danger");
  });
}

function enableSmoothScroll() {
  document.querySelectorAll("a[href^='#']").forEach(a => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href").substring(1);
      const t = document.getElementById(id);
      if (t) {
        e.preventDefault();
        t.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

// =========================
/* FORMS */
// =========================
function initNewsletter() {
  // (home hero)
  const formIndex = document.getElementById("newsletterFormIndex");
  const setSubmitting = (form, isSubmitting) => {
    const btn = form?.querySelector("button[type='submit']");
    const input = form?.querySelector("input[type='email']");
    if (btn) {
      if (!btn.dataset.defaultText) btn.dataset.defaultText = btn.textContent;
      btn.disabled = isSubmitting;
      btn.textContent = isSubmitting ? "Subscribing..." : btn.dataset.defaultText;
    }
    if (input) input.disabled = isSubmitting;
  };
  const send = async (name, email, msgEl) => {
    await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`
    });
    if (!window.emailjs) throw new Error("EmailJS is not available");
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { name, email });
    if (msgEl) {
      msgEl.className = "mt-2 text-white-75";
      msgEl.innerHTML = `You're in! Check your inbox, then grab your <a class="text-white fw-bold" href="bonus.html">subscriber bonuses</a>.`;
    }
  };

  if (formIndex) {
    formIndex.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name  = "";
      const email = formIndex.querySelector("[name='email']")?.value?.trim() || "";
      if (!email) return alert("Please enter an email");
      try {
        setSubmitting(formIndex, true);
        await send(name, email, document.getElementById("msgIndex"));
        formIndex.reset();
      } catch (err) {
        console.error("Newsletter error:", err);
        alert("Subscription failed. Please try again in a moment.");
      } finally {
        setSubmitting(formIndex, false);
      }
    });
  }

  // (newsletter.html page)
  const form = document.getElementById("newsletterForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name  = form.querySelector("[name='name']")?.value?.trim() || "";
    const email = form.querySelector("[name='email']")?.value?.trim() || "";
    if (!email) return alert("Please enter an email");
    try {
      setSubmitting(form, true);
      await send(name, email, document.getElementById("msg"));
      form.reset();
    } catch (err) {
      console.error("Newsletter error:", err);
      alert("Subscription failed. Please try again in a moment.");
    } finally {
      setSubmitting(form, false);
    }
  });
}

function initComments() {
  const container = document.getElementById("comments");
  if (!container || !UTTERANCES_REPO) return;
  const script = document.createElement("script");
  script.src = "https://utteranc.es/client.js";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.setAttribute("repo", UTTERANCES_REPO);
  script.setAttribute("issue-term", "pathname");
  script.setAttribute("theme", "github-light");
  container.appendChild(script);
}

/* =========================
   Universal Search Clear (❌)
   ========================= */
function enhanceSearchClear() {
  const inputs = Array.from(document.querySelectorAll('input[type="search"]'));

  inputs.forEach((input) => {
    if (input.dataset.clearEnhanced === "1") return; // idempotent
    input.dataset.clearEnhanced = "1";

    // Wrap the input so we can absolutely-position the clear button
    const wrapper = document.createElement("div");
    wrapper.className = "search-wrapper";
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    // Create the clear button
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "search-clear";
    btn.setAttribute("aria-label", "Clear search");
    btn.innerHTML = "&times;"; // × glyph
    wrapper.appendChild(btn);

    const toggle = () => {
      btn.style.display = input.value ? "inline-flex" : "none";
    };
    toggle();

    input.addEventListener("input", toggle, { passive: true });

    btn.addEventListener("click", () => {
      input.value = "";
      input.dispatchEvent(new Event("input"));
      input.focus();
      toggle();
    });

    // Keyboard support on the button
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btn.click();
      }
    });
  });
}

/* =========================
   Post Details
   ========================= */
function initPostDetailMeta() {
  const t = document.getElementById("publishedTime");
  const agoEl = document.getElementById("publishedAgo");
  if (!t || !agoEl || typeof timeAgoLimited !== "function") return;

  const raw = t.getAttribute("data-published") || t.textContent || "";
  const ago = timeAgoLimited(raw);
  // agoEl.textContent = `• ${ago}`;
  agoEl.textContent = `${ago}`;
  agoEl.title = raw;
}

function initRelatedPosts() {
  const container = document.getElementById("relatedPosts");
  if (!container) return;
  const current = container.dataset.current || "";
  const category = container.dataset.category || "";

  fetchJson("posts.json")
    .then(cards => {
      sortByNewest(cards);
      const related = cards
        .filter(card => card.link !== current)
        .sort((a, b) => {
          const ac = (a.category || "") === category ? 0 : 1;
          const bc = (b.category || "") === category ? 0 : 1;
          return ac - bc;
        })
        .slice(0, 3);

      if (!related.length) {
        container.innerHTML = "";
        return;
      }

      container.innerHTML = `
        <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-3">
          <h2 class="mb-2 mb-md-0">Related Posts</h2>
          <a href="posts.html" class="btn btn-outline-primary btn-sm">All Posts</a>
        </div>
        <div class="row row-cols-1 row-cols-md-3 g-4 card-grid related-grid"></div>
      `;
      renderPostCards(related, container.querySelector(".related-grid"));
      initReveal();
    })
    .catch(err => {
      console.error("related posts error:", err);
      container.innerHTML = "";
    });
}
