# Usul Learning — Security Guide
**Current architecture, what's protected, and what you need to do.**

---

## Architecture overview

| Component | Technology | How it's secured |
|---|---|---|
| Static site | Cloudflare Pages | HTTPS enforced, security headers via `_headers` |
| Contact form | Web3Forms (browser-direct) | No secrets exposed — access key is safe client-side per Web3Forms docs |
| Subscribe form | Cloudflare Worker → Brevo | `BREVO_KEY` stored as Worker secret, never in client code |
| DNS & edge | Cloudflare | WAF, DDoS, Bot Fight Mode, CSP |

---

## HTTP security headers (`_headers`)

Every page response carries these headers, enforced by Cloudflare Pages.

| Header | What it does |
|---|---|
| `Strict-Transport-Security` | Forces HTTPS for 1 year — users can never visit over HTTP |
| `X-Frame-Options: DENY` | Prevents your pages being embedded in iframes (clickjacking) |
| `X-Content-Type-Options` | Stops browsers guessing file types — prevents MIME confusion attacks |
| `Referrer-Policy` | Doesn't leak your URLs when users click external links |
| `Permissions-Policy` | Disables camera, microphone, geolocation — features the site never uses |
| `Content-Security-Policy` | Browser-enforced allowlist — see below |
| `Cross-Origin-Opener-Policy` | Isolates your browsing context from external windows |
| `Cross-Origin-Resource-Policy` | Prevents other sites embedding your resources |

---

## Content Security Policy (CSP)

The CSP is a browser-enforced allowlist. Anything not listed is blocked — including injected scripts from XSS attacks.

**Current allowlist:**

| Directive | Allowed sources | Reason |
|---|---|---|
| `script-src` | `'self'` · `static.cloudflareinsights.com` | `main.js` + Cloudflare Web Analytics beacon (injected at edge) |
| `style-src` | `'self'` · `fonts.googleapis.com` | `styles.css` + Google Fonts CSS |
| `font-src` | `fonts.gstatic.com` | Google Fonts files |
| `img-src` | `'self'` · `data:` | Local assets + inline SVGs |
| `connect-src` | `'self'` · `api.web3forms.com` · `cloudflareinsights.com` | Subscribe Worker + contact form + analytics beacon reporting |
| `form-action` | `'self'` · `api.web3forms.com` | Form submission targets |
| `frame-ancestors` | `'none'` | Belt-and-suspenders clickjacking protection |
| `base-uri` | `'self'` | Prevents base-tag injection attacks |

> **Note on `static.cloudflareinsights.com`:** Cloudflare automatically injects its Web Analytics beacon script at the edge. It must be in `script-src` or browsers will block it and log a CSP violation. This is expected behaviour, not a security risk — it is Cloudflare's own first-party script.

---

## Form security

### Contact form
- Submits **directly from the browser** to `https://api.web3forms.com/submit`
- The Web3Forms access key is a client-side constant in `main.js` — this is correct and safe per Web3Forms' own documentation. The key only allows form submissions to your inbox; it cannot access account settings or other forms
- Honeypot field (`_gotcha`) silently drops bot submissions that fill all fields
- Client-side rate limiting: 30-second cooldown between submissions

### Subscribe form
- POSTs to `/api/subscribe` → routed by Cloudflare to the `usul-proxy` Worker
- The Worker proxies to Brevo using `BREVO_KEY` stored as a **Worker secret** (never in client code)
- `updateEnabled: true` handles re-subscribes cleanly without errors
- Client-side rate limiting: 10-second cooldown per input field

---

## Worker secrets

The `usul-proxy` Worker uses these secrets, set in Cloudflare Dashboard → Workers & Pages → `usul-proxy` → Settings → Variables and Secrets:

| Secret | Purpose | Exposure risk |
|---|---|---|
| `ALLOWED_ORIGIN` | CORS origin check — rejects requests from other domains | None — not sensitive |
| `BREVO_KEY` | Brevo contacts API write access | Server-side only — never reaches the browser |
| `BREVO_LIST_ID` | Target list ID (2) | Low — numeric, not a credential |

`WEB3FORMS_KEY` is **not** a Worker secret. It is intentionally client-side in `main.js`. Web3Forms explicitly states that access keys are safe to expose in browser code.

---

## What you need to do (one-time setup)

### Confirm Worker route is active ← most important
Without this, subscribe form POSTs return 405 from Pages instead of reaching the Worker.

1. Cloudflare Dashboard → Workers & Pages → `usul-proxy` → Settings → Triggers → Routes
2. Confirm `usullearning.com/api/*` is listed
3. If missing: Add route → `usullearning.com/api/*` → zone: `usullearning.com`

### Enable Cloudflare WAF (Free tier)
Edge-level rate limiting and bot protection — much stronger than client-side guards.

1. Cloudflare Dashboard → your domain → Security → WAF
2. Enable "Managed Rules" — the free OWASP ruleset
3. Rate Limiting Rules → Create Rule:
   - Path: `/api/*`
   - Requests: more than 20 per minute per IP → Block for 1 minute

### Enable Cloudflare Bot Fight Mode
Dashboard → Security → Bots → Bot Fight Mode → On

### Enable Cloudflare Email Obfuscation
Protects `contact@usullearning.com` from email scrapers.
Dashboard → Scrape Shield → Email Address Obfuscation → On

### Enable Brevo double opt-in (recommended)
Satisfies GDPR/DPDPA consent requirements and filters fake subscribers.
1. Brevo → Contacts → Lists → your list → Settings
2. Enable "Double opt-in" → set a confirmation email template

---

## Security posture summary

| Area | Status | Notes |
|---|---|---|
| HTTPS enforced (HSTS) | ✅ | Via `_headers` |
| Clickjacking protection | ✅ | `X-Frame-Options` + `frame-ancestors 'none'` |
| XSS mitigation (CSP) | ✅ | Strict allowlist via `_headers` |
| MIME sniffing protection | ✅ | Via `_headers` |
| Cross-origin isolation | ✅ | `COOP` + `CORP` headers |
| External links (`noopener`) | ✅ | Already present on all social links |
| Contact form honeypot | ✅ | `_gotcha` field |
| Client-side rate limiting | ✅ | 30s contact / 10s subscribe |
| BREVO_KEY exposure | ✅ | Server-side Worker secret only |
| Web3Forms key exposure | ✅ | Intentionally client-side — safe by design |
| Cloudflare Web Analytics CSP | ✅ | `static.cloudflareinsights.com` in `script-src` |
| Worker route active | ⚠️ | Confirm `usullearning.com/api/*` in Dashboard |
| Server-side rate limiting | ⚠️ | Enable Cloudflare WAF (free) |
| Email obfuscation | ⚠️ | Enable in Cloudflare Scrape Shield |
| Bot protection | ⚠️ | Enable Cloudflare Bot Fight Mode |
| Brevo double opt-in | ⚠️ | Recommended for GDPR/DPDPA compliance |

The four ⚠️ items (excluding Worker route) are free Cloudflare dashboard toggles — no code changes needed.

---

## What this site does NOT need

- **SSL certificate management** — Cloudflare handles this automatically
- **Database security** — no database
- **Authentication or session security** — no user accounts
- **Server-side input sanitisation** — Web3Forms and Brevo handle this on their end
- **DDoS protection** — Cloudflare free tier covers this

---

## What was changed in previous releases

| Release | Change |
|---|---|
| Initial | `_headers` file with HSTS, CSP, clickjacking, MIME, referrer, permissions headers |
| Initial | Client-side rate limiting (30s contact, 10s subscribe) |
| Initial | Honeypot field on contact form |
| Audit fixes | Removed Pages Functions stubs that conflicted with Worker routing |
| Audit fixes | Fixed `corsResponse` — was setting `'null'` string instead of omitting header |
| Audit fixes | Worker now normalises `www.` origin to apex before comparison |
| Audit fixes | Brevo success check extended to include HTTP 200 alongside 201/204 |
| Audit fixes | Removed `upgrade-insecure-requests` (redundant with Cloudflare HTTPS) |
| Audit fixes | Inline `onclick` attributes replaced with `addEventListener` (CSP compliance) |
| Audit fixes | `robots.txt` updated with `Disallow: /api/` |
| Form fix | `redirect: 'false'` string removed from Web3Forms payload (caused HTML response instead of JSON) |
| Form fix | `BREVO_LIST_ID` fallback hardcoded to `2` so missing secret doesn't break subscriptions |
| Architecture | Contact form moved from Worker proxy to browser-direct (Web3Forms free plan limitation) |
| Architecture | `handleContact` removed from Worker — Worker now handles `/api/subscribe` only |
| CSP | `api.web3forms.com` added to `connect-src` and `form-action` |
| CSP | `static.cloudflareinsights.com` added to `script-src` (Cloudflare beacon) |
| CSP | `cloudflareinsights.com` added to `connect-src` (beacon reporting) |

*Jazakumullahu Khayran — may Allah protect this work.*
