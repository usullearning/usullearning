# /payment-safety-audit — Payment & Support Flow Audit

Audit every flow where money can move: Razorpay, UPI, voluntary support, donations, and paid services. This is an **audit**: report only; do not change files, do not read `.env`/secrets (verify *handling*, not values).

## Checks

1. **Amount source of truth** — Where is each payable amount defined? It must come from one authoritative server-side source (config/DB rule), never from client-side input or duplicated constants. Flag any path where the client can influence the amount.
2. **Verification** — Are payments verified server-side (signature verification, order/payment ID matching, amount re-check on callback/webhook)? Is a payment ever marked successful based on client say-so? Is verification idempotent and replay-safe?
3. **Refund wording** — Does displayed refund/cancellation text match what is actually possible and practiced? Any refund promise that isn't operationally real is a FAIL. All refund wording is `[REQUIRES LAWYER/CA REVIEW]`.
4. **GST/CA-sensitive areas** — Invoicing, tax lines, GST numbers, "inclusive of taxes" claims, receipts, business-name-on-payment consistency. Flag every instance `[REQUIRES LAWYER/CA REVIEW]` — do not assess correctness yourself.
5. **Razorpay mode** — Determine from code/config structure whether the integration is test or live mode, and whether live mode could be enabled accidentally (e.g., a single env swap with no other guard). Enabling live mode is founder-approval-only.
6. **UPI wording** — UPI instructions, QR labels, payee names, and amount hints must be accurate and must not misstate who receives the money or what it's for.
7. **Voluntary support vs payment/donation** — Where support is voluntary, it must be presented as voluntary: not as a payment for access, not as a donation with charitable/tax status, not as required. Check that nothing gates content/service on "support." Mismatches here are HIGH severity — trust, legal, and Sharia all at once.
8. **Sharia concerns** — Interest/late-fee language, speculative framing, misleading inducements, unfair terms, unclear consideration (what the payer actually gets). Mark `[SHARIA-SENSITIVE — founder/scholar review required]`.
9. **Live payment blockers** — Explicit list of everything that must be resolved before real money flows: unverified callbacks, missing refund terms, test/live ambiguity, unreviewed legal wording, missing receipts, unclear payee identity.

## Output format

1. **Money-flow map** — each flow: trigger → amount source → gateway/mode → verification → record.
2. **Findings table** — Check | Status (PASS / FAIL / NOT VERIFIED) | Severity | Flag | Evidence (file:line).
3. **Live payment blockers** — numbered; empty only if genuinely none.
4. **Founder decisions needed.**
