# Usul Learning — Security Guide
**What was fixed, what you need to do, and why it matters.**

---

## What's been fixed in this release

### 1. `_headers` file — HTTP Security Headers
The most impactful security addition. This file tells Cloudflare to attach
security headers to every page response. Browsers enforce these.

| Header | What it does |
|---|---|
| `Strict-Transport-Security` | Forces HTTPS for 1 year — users can never accidentally visit over HTTP |
| `X-Frame-Options: DENY` | Prevents your pages from being embedded in iframes (clickjacking attacks) |
| `X-Content-Type-Options` | Stops browsers guessing file types — prevents MIME confusion attacks |
| `Referrer-Policy` | Users' privacy: doesn't leak your URLs to external sites they click to |
| `Permissions-Policy` | Disables camera, microphone, geolocation — features the site never uses |
| `Content-Security-Policy` | The big one — see below |
| `Cross-Origin-Opener-Policy` | Isolates your browsing context from external scripts |

### 2. Content Security Policy (CSP)
This is a browser-enforced allowlist of every source the site is permitted to
load from. Anything not on the list is blocked — including injected scripts
from XSS attacks.

**What's allowed:**
- Scripts: only `main.js` from your own domain
- Styles: your `styles.css` + Google Fonts CSS
- Fonts: Google Fonts files (gstatic.com)
- Images: your own assets + inline `data:` SVGs
- Fetch/API: Web3Forms and Brevo only
- Frames: nobody (frame-ancestors 'none')

### 3. Client-side rate limiting
The contact form now enforces a 30-second cooldown between submissions.
The subscription form enforces a 10-second cooldown. This reduces casual spam.

### 4. Honeypot field on contact form
A hidden input that real users never fill in. Bots that blindly fill all
fields get silently dropped.

---

## What you need to do (one-time setup)

### Deploy the `_headers` file
If you're on **Cloudflare Pages**: just deploy `_headers` in your site root —
Cloudflare reads it automatically.

If you're on **Cloudflare with a separate host**: go to your Cloudflare
dashboard → your domain → Rules → Transform Rules → Response Headers →
add each header manually. Takes 10 minutes, lasts forever.

### Enable Cloudflare WAF (Free tier)
Cloudflare's Web Application Firewall provides real rate limiting and bot
protection at the edge — much more robust than client-side guards.

1. Cloudflare Dashboard → your domain → Security → WAF
2. Enable "Managed Rules" — the free OWASP ruleset
3. Under "Rate Limiting Rules" → Create Rule:
   - Path: `/` (all pages)
   - Requests: more than 100 per minute per IP → Block for 1 minute
   - This stops automated form spam and crawlers

### Enable Cloudflare Email Obfuscation
Protects `contact@usullearning.com` from email scrapers.
Dashboard → Scrape Shield → Email Address Obfuscation → On

### Enable Cloudflare Bot Fight Mode
Dashboard → Security → Bots → Bot Fight Mode → On
Free and effective against basic scrapers.

---

## The Brevo API key situation

The Brevo API key lives in `main.js` (client-side JavaScript). This means
a technical user could find it by viewing source. With it, they could
**add contacts to your list** — but NOT delete contacts, NOT send emails,
NOT access your account settings.

**For Usul Learning's scale: this is acceptable.** The worst case is someone
adds a fake email to your list, which Brevo's double opt-in (if enabled)
would catch anyway.

**To enable Brevo double opt-in** (recommended):
1. Brevo → Contacts → Lists → your list → Settings
2. Enable "Double opt-in" → choose a confirmation email template
Now every subscriber must click a confirmation link before being added.
This also satisfies GDPR and DPDPA consent requirements more robustly.

**If you later want to fully hide the key:**
A Cloudflare Worker (free, 5-minute setup) can proxy the Brevo API call
server-side. Just ask and I'll add it.

---

## Security posture summary

| Area | Status |
|---|---|
| HTTPS enforced (HSTS) | ✅ Via `_headers` |
| Clickjacking protection | ✅ Via `_headers` |
| XSS mitigation (CSP) | ✅ Via `_headers` |
| MIME sniffing protection | ✅ Via `_headers` |
| External links (noopener) | ✅ Already present |
| Form honeypot | ✅ On contact form |
| Client-side rate limiting | ✅ 30s / 10s cooldowns |
| No exposed credentials | ✅ No passwords/tokens in HTML |
| Brevo API key exposure | ⚠️ Acceptable — add double opt-in |
| Server-side rate limiting | ⚠️ Enable Cloudflare WAF (free) |
| Email obfuscation | ⚠️ Enable in Cloudflare dashboard |
| Bot protection | ⚠️ Enable Cloudflare Bot Fight Mode |
| Subresource Integrity (SRI) | ℹ️ Not applicable — no CDN scripts loaded |

The three ⚠️ items are all free Cloudflare dashboard toggles —
no code changes needed.

---

## What this site does NOT need

- **SSL certificate management** — Cloudflare handles this automatically
- **Database security** — no database
- **Authentication/session security** — no user accounts
- **Input sanitisation on the server** — no server; Web3Forms and Brevo
  handle this on their end
- **DDoS protection** — Cloudflare's free tier covers this

*Jazakumullahu Khayran — may Allah protect this work.*
