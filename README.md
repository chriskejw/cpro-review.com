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

No build step is required. The site should work directly from GitHub Pages.

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

## Search

The header search is global and routes to:

```text
search.html?q=search-term
```

The search page reads both `posts.json` and `videos.json`.

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
