# /safe-implementation — Approved Fix Only

Implement **only the specific fix the founder has approved**. If the approved fix is not clearly identified in this conversation, stop and ask which fix is approved before touching anything.

## Scope rules

- **Implement only the approved fix.** Nothing else — no drive-by improvements.
- **No redesign.** Do not restructure layouts, components, schemas, or architecture beyond what the fix strictly requires.
- **No unrelated refactor.** Do not rename, reformat, reorganize, or "clean up" code the fix doesn't touch. Match the existing style of surrounding code.
- **No env/secrets.** Do not read, edit, or create `.env` files, keys, tokens, or credentials. If the fix seems to need one, stop and report.
- **Smallest viable diff.** If two approaches work, take the one that changes fewer lines and fewer files.
- If, mid-implementation, you discover the approved fix requires wider changes than approved, **stop and report** — do not expand scope on your own.

## Git rules

- **No commit until founder approval.** Do not stage or commit. Prepare the commit command and present it.
- Never push.

## After implementing, report

1. **Files changed** — full list, one line each on what changed and why.
2. **Tests/validation run** — exact commands and honest results (including failures). If nothing could be run, say so and why.
3. **Risks** — what could break, edge cases not covered, anything needing lawyer/CA/Sharia review flags.
4. **Intentionally not done** — related issues noticed but left alone (per scope rules).
5. **Commit command** — ready to copy, e.g.:

   ```bash
   git add <files> && git commit -m "<concise message>"
   ```

   **Do not run it.** Wait for founder approval.
