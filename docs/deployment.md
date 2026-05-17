# Deployment

CProReview is deployed with GitHub Pages from the `main` branch.

Live domain:

```text
https://cpro-review.com/
```

The custom domain is configured in:

```text
CNAME
```

Current value:

```text
cpro-review.com
```

## Deploy Process

1. Make changes locally.
2. Preview with a local server:

   ```powershell
   python -m http.server 8000 --bind 127.0.0.1
   ```

3. Check affected pages locally.
4. Run JavaScript syntax check if `script.js` changed:

   ```powershell
   node --check script.js
   ```

5. Commit changes.
6. Push to `main`:

   ```powershell
   git push origin main
   ```

GitHub Pages should publish automatically after the push.

## Post-Deploy Checks

After GitHub Pages updates, check:

- homepage loads
- header navigation works
- dark/light toggle works
- global search works
- `posts.html` filters work
- `videos.html` filters work
- newsletter forms render correctly
- images load
- custom domain still resolves

If old styling appears, hard refresh the browser:

```text
Ctrl + F5
```

## SEO Files

Keep these files updated when routes change:

- `sitemap.xml`
- `robots.txt`
- page-level canonical URLs
- Open Graph URLs

When adding a new public page, consider adding it to `sitemap.xml`.

## GitHub Pages Notes

- Avoid server-only features.
- Avoid build-only assumptions.
- Use relative links like `posts.html`, `assets/images/...`, and `posts.json`.
- Shared header/footer are loaded with JavaScript, so local preview should use a web server.
