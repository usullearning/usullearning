# Usul Learning — Security

**A production-grade static site with Cloudflare-enforced security, strict content policies, and no server-side exposure.**

---

## Reporting Security Issues

For responsible disclosure of vulnerabilities or security concerns, please contact:

**contact@usullearning.com**

We aim to respond within 72 hours. There is no bug bounty programme at this time, but responsible disclosures are acknowledged and taken seriously.

---

## Architecture Overview

| Component | Technology | Security posture |
|:---|:---|:---|
| Static site | Cloudflare Pages | HTTPS enforced, comprehensive security headers |
| Contact form | Web3Forms | No server secrets — browser-direct by design |
| Subscribe form | Cloudflare Worker → Brevo | API credentials stored as encrypted Worker secrets |
| DNS & edge | Cloudflare | WAF, DDoS mitigation, Bot Fight Mode, email obfuscation |
| Analytics | Cloudflare Web Analytics | Cookie-free, no user tracking, edge-injected |

---

## HTTP Security Headers

All responses carry the following headers, enforced at the edge via Cloudflare Pages `_headers`.

| Header | Protection |
|:---|:---|
| `Strict-Transport-Security` | HTTPS enforced for 1 year — no HTTP fallback |
| `X-Frame-Options: DENY` | Clickjacking prevention |
| `X-Content-Type-Options` | MIME-type confusion protection |
| `Referrer-Policy` | Referrer data withheld from external navigation |
| `Permissions-Policy` | Camera, microphone, geolocation disabled at browser level |
| `Content-Security-Policy` | Strict script, style, font, and connection allowlist |
| `Cross-Origin-Opener-Policy` | Browsing context isolation |
| `Cross-Origin-Resource-Policy` | Prevents cross-origin resource embedding |

---

## Content Security Policy

A strict browser-enforced allowlist blocks anything not explicitly permitted — including injected scripts.

| Directive | Permitted sources |
|:---|:---|
| `script-src` | Same-origin · Cloudflare Web Analytics beacon |
| `style-src` | Same-origin · Google Fonts CSS |
| `font-src` | Google Fonts static files |
| `img-src` | Same-origin · inline data URIs |
| `connect-src` | Same-origin · Web3Forms API · Cloudflare Analytics |
| `form-action` | Same-origin · Web3Forms API |
| `frame-ancestors` | None — clickjacking blocked at policy level |
| `base-uri` | Same-origin — base-tag injection prevented |

> Cloudflare Web Analytics is injected at the edge by Cloudflare's own infrastructure. Its beacon domain is explicitly permitted in `script-src` to prevent CSP violations.

---

## Form Security

### Contact Form
- Submits directly from the browser — no server-side proxying
- Access key is intentionally client-side; scoped to form submissions only with no account access
- Honeypot field silently discards automated submissions
- Client-side rate limiting: 30-second cooldown between submissions
- Successful submission redirects to a confirmation page

### Subscribe Form
- Routed through a Cloudflare Worker — the client never interacts with the email provider directly
- API credentials stored as encrypted Worker secrets — never present in client code
- Re-subscription handled gracefully without errors
- Client-side rate limiting: 10-second cooldown per field interaction

---

## Credential Management

All sensitive values are stored as encrypted Cloudflare Worker secrets, configured through the Cloudflare Dashboard. No credentials appear in source code, environment files, or this repository.

| Type | Storage | Client exposure |
|:---|:---|:---|
| Email provider API key | Worker secret (encrypted) | None |
| Subscriber list identifier | Worker secret | None |
| Origin validation value | Worker secret | None |
| Web3Forms access key | Client-side JS | By design — submission-scoped only |

---

## Edge & Infrastructure Protections

| Protection | Status |
|:---|:---|
| HTTPS enforced (HSTS) | ✅ Active |
| www → apex redirect (301) | ✅ Active |
| Cloudflare DDoS mitigation | ✅ Active |
| Email address obfuscation | ✅ Active — Cloudflare Scrape Shield |
| Cloudflare Web Analytics | ✅ Active — privacy-first |
| Bot Fight Mode | ⚠️ Recommended — enable in Security → Bots |
| WAF Managed Rules (OWASP) | ⚠️ Recommended — enable in Security → WAF |
| Brevo double opt-in | ⚠️ Recommended — reduces spam and satisfies DPDPA consent requirements |

---

## Security Posture Summary

| Control | Status |
|:---|:---|
| HTTPS / HSTS | ✅ |
| Clickjacking (X-Frame + CSP) | ✅ |
| XSS mitigation (CSP) | ✅ |
| MIME sniffing protection | ✅ |
| Cross-origin isolation (COOP + CORP) | ✅ |
| External link protection (`noopener`) | ✅ |
| Form honeypot | ✅ |
| Client-side rate limiting | ✅ |
| API credential isolation | ✅ |
| Email obfuscation | ✅ |
| Bot protection | ⚠️ Pending — dashboard toggle |
| WAF / server-side rate limiting | ⚠️ Pending — dashboard toggle |
| Subscriber double opt-in | ⚠️ Pending — recommended |

---

## Reduced Attack Surface

This site deliberately has no unnecessary complexity. The following are architectural non-requirements:

- **No SSL management** — handled automatically by Cloudflare
- **No database** — static files only
- **No user authentication** — no accounts, no sessions
- **No server-side input handling** — third-party providers handle all validation
- **No server infrastructure to patch** — fully edge-deployed

---

## Sensitive Information Policy

| Item | Status |
|:---|:---|
| Bank account number | Removed from all public pages |
| IFSC code | Removed from all public pages |
| UPI ID | Displayed on support page — UPI IDs are publicly shared by design |
| Udyam registration number | Displayed in footer — required for Indian legal compliance |
| ORCID identifier | Public — academic research identifier |

---

## Change Log

| Category | Change |
|:---|:---|
| Initial | HSTS, CSP, clickjacking, MIME, referrer, and permissions headers via `_headers` |
| Initial | Client-side rate limiting — 30s contact, 10s subscribe |
| Initial | Honeypot field on contact form |
| Audit | Removed Pages Functions stubs conflicting with Worker routing |
| Audit | CORS response fixed — header was incorrectly set to string `'null'` |
| Audit | Worker normalises `www.` origin to apex before validation |
| Audit | Brevo success check extended to cover HTTP 200 alongside 201/204 |
| Audit | Removed `upgrade-insecure-requests` — redundant with Cloudflare HTTPS |
| Audit | Inline `onclick` replaced with `addEventListener` for CSP compliance |
| Audit | `/api/` added to `robots.txt` Disallow |
| Form | Web3Forms payload corrected — `redirect: 'false'` string removed |
| Form | List ID fallback hardcoded to prevent silent subscribe failures |
| Form | Contact form redirects to confirmation page on success |
| Architecture | Contact form moved from Worker proxy to browser-direct |
| Architecture | Worker scope reduced to subscribe endpoint only |
| CSP | Web3Forms API added to `connect-src` and `form-action` |
| CSP | Cloudflare Analytics beacon added to `script-src` and `connect-src` |
| SEO | Nav links standardised to `href="/"` across all pages |
| SEO | `noindex` applied to legal, support, and utility pages |
| SEO | Sitemap cleaned — content pages only |
| SEO | `robots.txt` updated — non-indexable paths disallowed |
| SEO | Meta descriptions updated across all pages |
| SEO | OG image dimensions declared — resolves Facebook preview |
| SEO | JSON-LD Book schema added |
| SEO | Canonical tags verified across all pages |
| Content | Author photo replaced — base64 blob removed |
| Content | Notify Me UX added to books page |
| Content | Post-contact confirmation page created |
| Content | Privacy policy updated to DPDP Act 2023 |
| Content | Privacy policy sections renumbered sequentially |
| Content | CCPA references removed — not applicable jurisdiction |
| Support page | Bank transfer details removed |
| Support page | Payment section redesigned and corrected |
| Support page | Excluded from search indexing and sitemap |
| Infrastructure | www → apex redirect created in Cloudflare |
| Infrastructure | Cloudflare Web Analytics enabled |
| Infrastructure | Legacy Google Sites unpublished |
| Accessibility | Visually-hidden heading bridge added on methodology page |

---

*Jazakumullahu Khayran — may Allah protect this work.*
