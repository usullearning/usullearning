# /founder-audit — Founder Operations Audit

Run a founder-level review of this project/deliverable. This is an **audit**: analyze and report; do not change files unless separately instructed.

Review from the founder's seat — the person accountable for legality, honesty, religious alignment, and client relationships — and check every area below.

## Areas to check

1. **Launch readiness** — Is this actually ready to face users/clients? Broken flows, missing pages, placeholder text, dead links, unfinished features.
2. **Compliance risks** — Legal, tax, GST, payment, refund, privacy, employment, or contract wording that needs lawyer/CA review. Mark each instance `[REQUIRES LAWYER/CA REVIEW]`.
3. **Sharia-sensitive wording** — Riba/interest language, gambling/speculation, prohibited-industry associations, misleading income claims, charity/zakat/support wording, payment fairness. Mark each `[SHARIA-SENSITIVE — founder/scholar review required]`. Do not rule; flag.
4. **Public/private leaks** — Any public-facing surface exposing the College Programme, associate model, commission structures, internal tracker, private intake workflows, internal pricing/margins, or internal SOPs.
5. **Inflated claims** — Guarantees, invented metrics/testimonials/awards/results, superlatives without proof. Mark unproven claims `[NEEDS PROOF]`.
6. **Payment truth** — Does every payment/support/pricing statement match what actually happens (amounts, modes, refund reality, what the payer receives)?
7. **Client trust** — Anything that would make a careful client hesitate: inconsistencies, vagueness about who they're dealing with, unclear contact/support, sloppy errors.
8. **Operational weakness** — Single points of failure, missing backups, undocumented processes, steps only the founder can perform, things that break if one person is unavailable.
9. **Founder decision points** — Every open question that only the founder can answer, listed explicitly.

## Rules

- Do not edit files, do not commit, do not run destructive commands, do not read `.env`/secrets.
- Verify by reading code/content; where you cannot verify, say **NOT VERIFIED** — never guess.

## Output format

1. **Verdict** — one paragraph: ready / not ready / conditionally ready.
2. **Findings table** — Area | Finding | Severity (BLOCKER / HIGH / MEDIUM / LOW) | Flag raised.
3. **Public/private leak scan result** — explicit, even if clean.
4. **Founder decisions needed** — numbered list.
5. **Recommended next steps** — smallest set of surgical fixes, in priority order. Do not implement any of them in this audit.
