# CProReview

CProReview is a static tech review website for gadget reviews, product recommendations, IT tips, videos, buying guides, and newsletter signups.

Live site: https://cpro-review.com/

## Stack

- Static HTML, CSS, and JavaScript
- Bootstrap 5 from CDN
- Font Awesome from CDN
- GitHub Pages hosting
- Custom domain via `CNAME`
- Content indexes in `posts.json` and `videos.json`

No compile step is required, but we now run two lightweight maintenance steps:

- `npm run assets:version` to bump `style.css` and `script.js` cache-busting query strings in all HTML files.
- `npm run test:visual` to run a Playwright regression check for post-page layout overlap.

## Local Preview

From the repo root:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8000/
```

Use a local server rather than opening HTML files directly, because shared includes and JSON files are loaded with `fetch()`.

## Maintenance Commands

```powershell
npm install
npm run assets:version
npm run test:visual
```

Cloudflare Turnstile is enabled client-side and validated server-side in Apps Script.
Use [docs/apps-script-secure-newsletter.gs](docs/apps-script-secure-newsletter.gs) as the backend template.
That template includes:
- duplicate-email prevention
- daily signup cap (`MAX_SIGNUPS_PER_DAY`)
- security logging (`LOG_TAB`, default `SignupLogs`)

## Main Routes

- `index.html` - homepage
- `posts.html` - combined Reviews & Guides archive
- `videos.html` - video archive
- `search.html` - global search results across posts and videos
- `newsletter.html` - newsletter signup page
- `about.html` - about page
- `bonus.html` - subscriber bonus page
- `404.html` - fallback page

## Content Data

Article cards are powered by `posts.json`.

Video cards are powered by `videos.json`.

When adding content, keep the JSON values stable and make sure every item includes:

- `title`
- `date`
- `description`
- `category`
- image or video data

Post items also need:

- `link`
- `image`
- `featured` when relevant

Video items also need:

- `embed`
- `duration`
- optional `thumbnail`

## Naming Rules

Use plural names for stored category/filter values:

- `Reviews`
- `Guides`
- `Accessories`
- `Setups`
- `Builds`

Use singular labels for small item badges:

- `Review`
- `Guide`
- `Accessory`
- `Setup`
- `Build`

The JavaScript maps plural category values to singular badge labels for display.

## Theme

The site supports light and dark mode.

- Theme state is stored in `localStorage` using `cproreview-theme`.
- If there is no saved preference, the site respects the user's system theme.
- Theme styles are controlled through CSS variables in `style.css`.

## Brand Assets

Header logos and browser icons are stored in theme-specific folders:

- `assets/images/logo/light/`
- `assets/images/logo/dark/`
- `assets/images/favicons/light/`
- `assets/images/favicons/dark/`

Use the wordmark assets for the site header and tile assets for favicon, app icon, social preview, and structured-data logo references.

## Search

The header search is global and routes to:

```text
search.html?q=search-term
```

The search page reads both `posts.json` and `videos.json`.

Archive and search result pages support sorting by:

- newest
- oldest
- A-Z
- Z-A

The Reviews & Guides and Videos archives also show live result counts.

## UI Notes

- Article, video, featured, and compact cards are clickable as whole cards where appropriate.
- Small card badges use singular labels and sit on the image thumbnail.
- Review pages use visual verdict summaries; guide and buying-guide pages use snapshot summaries.
- Header controls, filter controls, newsletter forms, and mobile layouts are styled in `style.css`.

## Deployment

Pushing to `main` updates the GitHub Pages site. The custom domain is:

```text
cpro-review.com
```

See [docs/deployment.md](docs/deployment.md) for deployment checks.

## Maintenance Docs

- [CHANGELOG.md](CHANGELOG.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)
- [docs/content-guide.md](docs/content-guide.md)
- [docs/deployment.md](docs/deployment.md)

## Roadmap

Later improvements worth doing as separate focused passes:

- Curate or replace the placeholder-heavy image set with more consistent tech/product visuals.
- Improve related content logic so post pages prioritize same-category and same-content-type recommendations.
- Refactor category metadata into a single shared map for labels, CTAs, icons, and route behavior.
- Add structured data such as Article, VideoObject, and review schema only when the content model and ratings are stable.
