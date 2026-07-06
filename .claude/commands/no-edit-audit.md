# /no-edit-audit — Strict Read-Only Audit

Perform the requested review in **strict audit-only mode**.

## Hard rules — no exceptions

- **Do not edit any files.** Not even typo fixes, formatting, or "obvious" corrections.
- **Do not commit.** Do not stage, do not prepare-and-run — nothing touches git state.
- **Do not run destructive or state-changing commands.** No deletes, migrations, seeds, installs, builds that write artifacts, restarts, or network calls that change anything. Read-only commands (`git status`, `git log`, `ls`, `grep`, reading files) are fine.
- **Do not read `.env` files or secrets** (keys, tokens, credentials, secret configs). If a finding depends on an env value, mark it NOT VERIFIED and say which variable matters and why.

If the requested review seems to require breaking any rule above, stop and report the conflict instead.

## Verification honesty

Mark every finding with exactly one status:

- **PASS** — you personally verified it by reading the actual code/content/output.
- **FAIL** — you personally verified it is broken/wrong, with file:line evidence.
- **NOT VERIFIED** — you could not confirm it within these constraints. Say what would be needed to verify.

Never infer PASS from convention, naming, or documentation. If you didn't see it, it's NOT VERIFIED.

## Output format

1. **Scope** — what was audited and what was out of scope.
2. **Findings table** — Item | Status (PASS / FAIL / NOT VERIFIED) | Evidence (file:line) | Notes.
3. **NOT VERIFIED list** — with what verification would require.
4. **Recommendations** — described only; nothing implemented.
5. Confirmation line: `Audit complete. No files edited, nothing committed, no destructive commands run, no secrets read.`
