# Contributing

This repo is currently maintained as a small static website. Keep changes simple, readable, and compatible with GitHub Pages.

## Local Workflow

1. Start a local server:

   ```powershell
   python -m http.server 8000 --bind 127.0.0.1
   ```

2. Open:

   ```text
   http://127.0.0.1:8000/
   ```

3. Test pages affected by your change.

4. Before committing JavaScript changes, run:

   ```powershell
   node --check script.js
   ```

## Coding Guidelines

- Prefer plain HTML, CSS, and JavaScript.
- Do not add a build system unless there is a clear need.
- Keep GitHub Pages compatibility in mind.
- Keep shared header/footer behavior in `header.html`, `footer.html`, and `script.js`.
- Use CSS variables in `style.css` for theme colors.
- Avoid one-off hardcoded colors unless the component truly needs them.

## Content Guidelines

- Add post metadata to `posts.json`.
- Add video metadata to `videos.json`.
- Keep category values plural.
- Keep small badge labels singular.
- Keep post pages, JSON entries, related-post metadata, and SEO metadata aligned.

See [docs/content-guide.md](docs/content-guide.md) for more detail.

## Commit Style

Use short, action-focused commit messages, for example:

```text
Add global search page
Improve dark mode contrast
Update newsletter CTA styling
```

## Files To Avoid Touching Casually

- `CNAME`
- `robots.txt`
- `sitemap.xml`

Only update these when the domain, routes, or indexing strategy changes.
