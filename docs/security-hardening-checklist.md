# Security Hardening Checklist

## In Repo (already implemented)
- CDN assets pinned to exact versions with SRI (`integrity`) and `crossorigin`.
- Signup flow depends on Apps Script only (no EmailJS dependency).
- Turnstile client challenge + server-side verification.
- Duplicate-email prevention, daily cap, and signup security logs in Apps Script template.
- Dependabot enabled for npm dependencies.

## GitHub Settings (manual)
1. Enable branch protection for `main`:
   - Require pull request before merging
   - Require at least 1 approval
   - Require status checks to pass
2. Enable:
   - Dependabot alerts
   - Dependabot security updates
   - Secret scanning (if available on your plan)

## Apps Script (manual)
1. Keep only the current active web app deployment.
2. Ensure script properties exist and are correct:
   - `TURNSTILE_SECRET_KEY`
   - `SHEET_ID`
   - `SHEET_TAB`
   - `LOG_TAB`
   - `MAX_SIGNUPS_PER_DAY`
3. Rotate `TURNSTILE_SECRET_KEY` if it was ever exposed.

## Cloudflare (manual, if using Cloudflare in front of site)
Set response header rules:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Content-Security-Policy tuned for your domains/CDNs.

