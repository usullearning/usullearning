# /implementation-report — Post-Change Report

Produce the standard UCS report for the changes just made in this session. Be exhaustive and honest — this report is what the founder uses to decide whether to commit.

## Report structure

### 1. Files changed
Full list. For each file: path, one line on what changed, and roughly how many lines.

### 2. What changed
Plain-language explanation of the change as a whole — what behavior/content is different now, and why. Written for the founder, not for a developer log.

### 3. Intentionally left unchanged
Everything you noticed but deliberately did not touch (related bugs, style inconsistencies, refactor opportunities, adjacent copy issues), with a one-line reason each. An empty section means you attest there was nothing.

### 4. Commands/tests run
Every command executed, with its actual outcome. Report failures and warnings verbatim — never smooth them over. If no tests exist or none could run, state that explicitly.

### 5. Risks
- What could break, and where to look if it does.
- Edge cases not covered.
- Any wording that needs `[REQUIRES LAWYER/CA REVIEW]` or `[SHARIA-SENSITIVE — founder/scholar review required]` flags.
- Any public/private boundary concerns.

### 6. Founder decisions
Numbered list of decisions only the founder can make (approve commit, approve wording, choose between options, accept a risk). If none besides commit approval, say so.

### 7. Commit command
Provide the exact command, ready to copy:

```bash
git add <files> && git commit -m "<concise message>"
```

**Only after founder approval.** Do not run it yourself. Never push.
