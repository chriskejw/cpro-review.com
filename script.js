// =========================
// CONFIG (production keys/ids)
// =========================
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwGvCZuDpuV7T60mUMcePUt0SN5d7MUhQ9xQ3Lmmivj33lSKo6Csn9xv1IPhOOVT4li/exec";
const EMAILJS_PUBLIC_KEY     = "Ow9sGUE6hSO-EpF_T";
const EMAILJS_SERVICE_ID     = "service_8fe6yij";
const EMAILJS_TEMPLATE_ID    = "template_wxvjwg9";
const UTTERANCES_REPO        = "chriskejw/cpro-review.com";

const POSTS_PER_PAGE  = 9;
const VIDEOS_PER_PAGE = 6;

// State
let ALL_CARDS = [];  // posts
let ALL_VIDS  = [];  // videos

let POSTS_STATE = { page: 1, category: "all", query: "", categories: [] };
let VIDEOS_STATE = { page: 1, category: "all", query: "", categories: [] };

// =========================
// BOOT
// =========================
document.addEventListener("DOMContentLoaded", async () => {
  await loadIncludes();

  // Footer year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Third-party init
  if (window.emailjs && EMAILJS_PUBLIC_KEY) emailjs.init(EMAILJS_PUBLIC_KEY);

  initTheme();
  initThemeToggle();
  wireThemeToggle();
  wireGlobalSearchNavigation();

  initHome();
  initPostsPage();
  initVideosPage();

  initNewsletter();
  initComments();
  initBackToTop();

  setActiveNav();
  enableSmoothScroll();
});

// =========================
// INCLUDES
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
/* THEME */
// =========================
function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
}

function initThemeToggle() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  // restore saved theme
  if (localStorage.getItem("theme")) {
    document.documentElement.setAttribute("data-theme", localStorage.getItem("theme"));
  }

  btn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const newTheme = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    btn.textContent = newTheme === "dark" ? "☀️" : "🌙";
  });
}

function wireThemeToggle() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  const setIcon = () => {
    const cur = document.documentElement.getAttribute("data-theme");
    btn.textContent = cur === "dark" ? "🌞" : "🌙";
  };
  setIcon();
  btn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    setIcon();
  });
}

// =========================
/* URL HELPERS */
// =========================
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || "";
}
function setQueryParam(name, value, targetUrl = null) {
  const url = new URL(targetUrl || window.location.href);
  if (value) url.searchParams.set(name, value);
  else url.searchParams.delete(name);
  return url.toString();
}

// Navbar search → posts.html?q=
function wireGlobalSearchNavigation() {
  const input = document.getElementById("searchInput");
  if (!input) return;
  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const q = (input.value || "").trim();
    const url = setQueryParam("q", q, new URL("posts.html", window.location.href));
    window.location.href = url;
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

// =========================
/* HOME */
// =========================
function initHome() {
  const cardGrid     = document.querySelector(".card-grid");
  const indicatorsEl = document.getElementById("featured-indicators");
  const innerEl      = document.getElementById("featured-inner");
  const noResults    = document.getElementById("noResults");
  const searchInput  = document.getElementById("searchInput");

  if (!cardGrid || !indicatorsEl || !innerEl) return;

  fetch("cards.json", { cache: "no-cache" })
    .then(r => r.json())
    .then(cards => {
      sortByNewest(cards);
      ALL_CARDS = cards;

      const featured = cards.filter(c => c.featured);
      const slides = (featured.length >= 3 ? featured : cards).slice(0, 3);

      indicatorsEl.innerHTML = "";
      innerEl.innerHTML = "";

      slides.forEach((c, i) => {
        const active = i === 0 ? "active" : "";
        const li = document.createElement("button");
        li.type = "button";
        li.setAttribute("data-bs-target", "#featuredCarousel");
        li.setAttribute("data-bs-slide-to", String(i));
        li.className = active;
        li.setAttribute("aria-label", `Slide ${i + 1}`);
        if (i === 0) li.setAttribute("aria-current", "true");
        indicatorsEl.appendChild(li);

        const item = document.createElement("div");
        item.className = `carousel-item ${active}`;
        item.innerHTML = `
          <img src="${c.image || 'assets/images/post1.jpg'}" class="d-block w-100 featured-img" alt="${escapeHtml(c.title)}">
          <div class="carousel-caption text-start">
            <h2 class="fw-bold text-white">${escapeHtml(c.title)}</h2>
            <p class="lead d-none d-md-block">${escapeHtml(c.description || "")}</p>
            <a class="btn btn-primary btn-lg mt-2" href="${c.link}">Read More →</a>
          </div>
        `;
        innerEl.appendChild(item);
      });

      renderPostCards(cards, cardGrid);

      if (searchInput) {
        const doFilter = () => {
          const q = (searchInput.value || "").toLowerCase().trim();
          const filtered = q
            ? ALL_CARDS.filter(c =>
                (c.title && c.title.toLowerCase().includes(q)) ||
                (c.description && c.description.toLowerCase().includes(q))
              )
            : ALL_CARDS.slice();
          renderPostCards(filtered, cardGrid);
          if (noResults) noResults.style.display = filtered.length ? "none" : "block";
        };
        searchInput.addEventListener("input", doFilter, { passive: true });
      }

      initReveal();
    })
    .catch(err => console.error("cards.json error:", err));
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

  fetch("cards.json", { cache: "no-cache" })
    .then(r => r.json())
    .then(cards => {
      sortByNewest(cards);
      ALL_CARDS = cards;

      const set = new Set(["all"]);
      cards.forEach(c => set.add((c.category || "General").trim()));
      POSTS_STATE.categories = Array.from(set);
      populateSelect(catSelect, POSTS_STATE.categories);

      const applyAndRender = () => {
        POSTS_STATE.query = (searchInput?.value || "").toLowerCase().trim();
        const filtered = filterItems(cards, POSTS_STATE.query, POSTS_STATE.category);
        renderPostsPage(grid, pager, filtered, noResults);
      };

      catSelect.addEventListener("change", (e) => {
        POSTS_STATE.category = e.target.value;
        POSTS_STATE.page = 1;
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
    .catch(err => console.error("cards.json error:", err));
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

  fetch("videos.json", { cache: "no-cache" })
    .then(r => r.json())
    .then(videos => {
      sortByNewest(videos);
      ALL_VIDS = videos;

      const set = new Set(["all"]);
      videos.forEach(v => set.add((v.category || "General").trim()));
      VIDEOS_STATE.categories = Array.from(set);
      populateSelect(catSelect, VIDEOS_STATE.categories);

      const applyAndRender = () => {
        VIDEOS_STATE.query = (searchInput?.value || "").toLowerCase().trim();
        const filtered = filterItems(videos, VIDEOS_STATE.query, VIDEOS_STATE.category);
        renderVideosPage(grid, pager, filtered, noResults);
      };

      catSelect.addEventListener("change", (e) => {
        VIDEOS_STATE.category = e.target.value;
        VIDEOS_STATE.page = 1;
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
    .catch(err => console.error("videos.json error:", err));
}

// =========================
/* RENDER HELPERS */
// =========================
function renderPostCards(items, container) {
  container.innerHTML = "";
  items.forEach(card => {
    const col = document.createElement("div");
    col.className = "col reveal";
    col.innerHTML = `
      <div class="card h-100 shadow-sm border-0">
        <img src="${card.image || 'assets/images/post1.jpg'}" class="card-img-top" alt="${escapeHtml(card.title)}">
        <div class="card-body">
          <h5 class="card-title"><a href="${card.link}" class="text-decoration-none">${escapeHtml(card.title)}</a></h5>
          <h6 class="card-subtitle mb-2 text-muted">${escapeHtml(card.date || "")}${card.category ? ` • ${escapeHtml(card.category)}` : ""}</h6>
          <p class="card-text">${escapeHtml(card.description || "")}</p>
          <a href="${card.link}" class="btn btn-outline-primary btn-sm">Read More →</a>
        </div>
      </div>`;
    container.appendChild(col);
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
  }

  renderPagination(pager, current, pages, (p) => {
    VIDEOS_STATE.page = p;
    renderVideosPage(grid, pager, items, noResults);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function renderVideoCards(items, container) {
  container.innerHTML = "";
  items.forEach(v => {
    const id = getYouTubeId(v.embed);
    const thumb = v.thumbnail && v.thumbnail.trim() ? v.thumbnail : youTubeThumb(id, "hqdefault");
    const col = document.createElement("div");
    col.className = "col reveal";
    col.innerHTML = `
      <div class="card h-100 shadow-sm border-0 video-card" data-video-id="${id}" data-video-title="${escapeHtml(v.title)}">
        <div class="thumb-wrap">
          <img src="${thumb}" alt="${escapeHtml(v.title)}" class="card-img-top" loading="lazy">
          <button type="button" class="play-btn btn btn-primary rounded-circle" aria-label="Play video">▶</button>
        </div>
        <div class="card-body">
          <h5 class="card-title">${escapeHtml(v.title)}</h5>
          <h6 class="card-subtitle mb-2 text-muted">${escapeHtml(v.date || "")}${v.category ? ` • ${escapeHtml(v.category)}` : ""}</h6>
          <p class="card-text">${escapeHtml(v.description || "")}</p>
        </div>
      </div>`;
    container.appendChild(col);
  });
}

function setupVideoModal() {
  const grid = document.getElementById("videosGrid");
  const modalEl = document.getElementById("videoPlayerModal");
  const frame = document.getElementById("videoPlayerFrame");
  const titleEl = document.getElementById("videoPlayerTitle");
  if (!grid || !modalEl || !frame) return;

  grid.addEventListener("click", (e) => {
    const card = e.target.closest("[data-video-id]");
    if (!card) return;

    const id = card.getAttribute("data-video-id");
    const title = card.getAttribute("data-video-title") || "Video";
    frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    if (titleEl) titleEl.textContent = title;

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  });

  modalEl.addEventListener("hidden.bs.modal", () => {
    frame.src = "";
    if (titleEl) titleEl.textContent = "";
  });
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
    const t = (i.title || "").toLowerCase();
    const d = (i.description || "").toLowerCase();
    return inCat && (t.includes(query) || d.includes(query));
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
  const m = url.match(/(?:youtube\.com.*(?:\\?|&)v=|youtu\.be\/)([^&#]+)/);
  return m ? m[1] : url;
}
function youTubeThumb(id, quality="hqdefault") {
  return id ? `https://img.youtube.com/vi/${id}/${quality}.jpg` : "assets/images/video-thumb.jpg";
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
  const form = document.getElementById("newsletterForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name  = form.querySelector("[name='name']").value.trim();
    const email = form.querySelector("[name='email']").value.trim();
    if (!email) return alert("Please enter an email");

    try {
      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`
      });

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { name, email });
      // After successful submission
      if (msgEl) {
        msgEl.className = "mt-2 text-white-75";
        msgEl.textContent = "You're in! 🎉 Check your inbox for a confirmation.";
      }

      form.reset();
    } catch (err) {
      console.error("Newsletter error:", err);
      alert("Subscription failed.");
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
