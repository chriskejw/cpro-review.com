# Content Guide

This guide keeps CProReview content consistent across pages, cards, filters, and search.

## Category Naming

Stored category values should be plural because they represent filters and collections:

- `Reviews`
- `Guides`
- `Accessories`
- `Setups`
- `Builds`

Small card badges should be singular because they describe one item:

- `Review`
- `Guide`
- `Accessory`
- `Setup`
- `Build`

The display conversion is handled in `script.js` by `displayCategoryLabel()`.

## Posts

Add article metadata to `posts.json`.

Required fields:

```json
{
  "title": "Example Review",
  "date": "August 17, 2025",
  "description": "Short summary for cards and search.",
  "link": "post-example.html",
  "image": "assets/images/example.jpg",
  "featured": false,
  "category": "Reviews"
}
```

Also create or update the matching HTML page.

Post pages should include:

- page title
- meta description
- canonical URL
- Open Graph title and description
- Open Graph image
- JSON-LD article metadata when appropriate
- matching `relatedPosts` category

## Videos

Add video metadata to `videos.json`.

Required fields:

```json
{
  "title": "Example Video",
  "date": "2025-08-17 23:30",
  "description": "Short summary for cards and search.",
  "embed": "https://www.youtube.com/embed/example",
  "thumbnail": "",
  "duration": "10:18",
  "category": "Guides"
}
```

If `thumbnail` is empty, the site derives a YouTube thumbnail from the embed URL.

## Images

Use existing image patterns where possible:

- Post hero and card images live in `assets/images/`.
- Prefer clean product, desk, gadget, or setup imagery.
- Avoid images that are too dark, blurry, or unrelated to the title.
- Keep file sizes reasonable for GitHub Pages.

## Homepage Content

Homepage sections pull content from JSON:

- Featured reviews use featured post entries when available.
- Latest posts use recent `posts.json` entries.
- Latest videos use recent `videos.json` entries.

## Search

Global search lives at:

```text
search.html?q=query
```

Search checks:

- title
- description
- category
- date
- duration
- embed URL

## Copy Style

Keep copy practical, direct, and buyer-focused.

Good:

- "Simple steps to speed up your PC safely."
- "Five accessories that improve daily workflow."

Avoid:

- vague hype
- overlong titles
- unsupported claims
