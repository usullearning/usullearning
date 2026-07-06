# /website-public-trust-audit — Public Trust Audit

Audit this public-facing website (UCS website, Usul Learning, RJ site, MySale, or a client website) for anything that would undermine visitor trust or leak internal material. This is an **audit**: report only; do not change files.

## Checks

1. **Exaggerated claims** — Superlatives, guarantees, invented or unverifiable numbers, "results" without proof. Every unproven claim gets `[NEEDS PROOF — founder to supply or remove]`.
2. **Fake authority** — Implied credentials, certifications, partnerships, media mentions, client logos, or testimonials that cannot be verified. Anything not verifiably real must be flagged.
3. **Pricing clarity** — Are prices (if shown) unambiguous, current, and consistent across pages? Is what's included/excluded clear? Hidden-cost patterns are a FAIL.
4. **Contact/support clarity** — Can a visitor find a real, working contact method within two clicks? Is it clear who is behind the site and how to reach them for problems?
5. **Legal/privacy/refund gaps** — Missing or thin privacy policy, terms, refund/cancellation terms where money is taken. List gaps; wording fixes are `[REQUIRES LAWYER/CA REVIEW]`, not something to draft-and-publish here.
6. **SEO basics** — Titles, meta descriptions, heading structure, alt text, sitemap/robots, canonical URLs, obvious indexing mistakes.
7. **Mobile issues** — Responsive breakage, unreadable text, overflow, broken navigation on small screens (verified from code/markup; mark NOT VERIFIED where a device is genuinely needed).
8. **Broken links** — Internal links to missing pages/anchors/assets; suspicious external links.
9. **Internal/private leaks** — College Programme, associate model, commissions, internal tracker, private intake workflows, internal pricing, staging URLs, admin routes, sensitive comments in HTML/JS. For client sites: any other client's information appearing.
10. **Client confidence** — Read the site as a skeptical prospective client: does anything feel off, inconsistent, template-leftover, or too good to be true? List every such moment.

## Output format

1. **Trust verdict** — one paragraph: would a careful visitor trust this site?
2. **Findings table** — Check | Status (PASS / FAIL / NEEDS REVIEW) | Severity | Evidence.
3. **Flags raised** — all `[NEEDS PROOF]`, `[REQUIRES LAWYER/CA REVIEW]`, leak findings.
4. **Priority fix list** — smallest surgical changes first. Do not implement.
