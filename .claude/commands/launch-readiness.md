# /launch-readiness — Website/App Launch Audit

Audit this website or app for launch readiness. This is an **audit**: report only; do not change files.

## Checks

1. **Broken flows** — Walk every primary user journey in the code (navigation, forms, signup/login, checkout/enquiry, downloads). List anything that dead-ends, errors, or was left half-built.
2. **Mobile usability** — Viewport meta, responsive layout, tap-target sizing, overflow, fixed-width elements, images without constraints.
3. **Pricing/payment truth** — Every displayed price, plan, or payment statement must match the actual implementation. No stale amounts, no "free" that isn't, no live payment wording on a test-mode integration. Payment/refund wording is `[REQUIRES LAWYER/CA REVIEW]`.
4. **Privacy/refund/contact clarity** — Privacy policy present and linked? Refund/cancellation terms stated where money is taken? Working contact method (email/phone/form) findable within two clicks?
5. **SEO basics** — Title tags, meta descriptions, one H1 per page, semantic headings, alt text, sitemap/robots.txt, canonical URLs, no `noindex` left on by accident, sane URLs.
6. **Internal leaks** — Scan public pages, source comments, bundled JS, and metadata for internal material: College Programme, associate model, commissions, internal tracker, private workflows, internal notes, TODO/FIXME with sensitive content, exposed admin routes.
7. **Build/deployment readiness** — Build passes cleanly? Console errors? Hardcoded localhost/dev URLs? Debug flags on? Env-dependent config that will break outside the build machine? Missing 404 page?

## Rules

- Do not edit, commit, or run destructive commands. Do not read `.env`/secrets (checking that env *handling* is correct is fine; reading values is not).
- Mark anything you could not actually verify as **NEEDS REVIEW**, not PASS.

## Output format

End with a summary table:

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | Broken flows | PASS / FAIL / NEEDS REVIEW | ... |
| 2 | Mobile usability | ... | ... |
| 3 | Pricing/payment truth | ... | ... |
| 4 | Privacy/refund/contact | ... | ... |
| 5 | SEO basics | ... | ... |
| 6 | Internal leaks | ... | ... |
| 7 | Build/deployment | ... | ... |

Then: **Blockers** (must fix before launch), **Should fix soon**, and **Founder decisions needed**.
