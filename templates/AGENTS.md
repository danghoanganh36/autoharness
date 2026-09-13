# AGENTS.md — {{PROJECT_NAME}}

Commands, not explanations. This file is loaded into **every** session, so it
holds what you must do; the reasoning lives in files you open only when you
need it. Before arguing with a rule here, read
`docs/harness/instructions/README.md` (how each rule is enforced) and
`docs/harness/state/decisions.md` (why past choices were made).

Keep this file under 150 lines. It is a routing table, not a manual.

## What this product is

{{PRODUCT_SUMMARY}}

## Session protocol

1. Run `{{RUN}} init`. Do not start coding without it.
2. Pick **ONE** feature from `docs/harness/scope/features.json` not yet
   `passing`. Set it `active`.
3. **WIP = 1.** No second feature until the first one's `verification` exits 0.
   No "while I'm here" refactors.
4. Set `passing` **only** when that feature's own `verification` command passes.
   `passing` is irreversible. Blocked by a dependency → `blocked`, with the
   reason.
5. Before ending: update `docs/harness/state/progress.md` and
   `docs/harness/scope/features.json`, then clear the exit checklist below.

Map of the harness: `docs/harness/README.md`.

## Hard rules

| # | Rule | Check |
|---|---|---|
| 1 | No secret in a tracked file. Never `cat` a `.env*`, `.pem`, or keystore | `scripts/hooks/pre-commit` |
| 2 | Every document names only paths that exist | `{{RUN}} lint:docs` |
{{#if GATE_TYPECHECK}}
| 3 | No `any`, no bare `@ts-ignore` | `{{RUN}} lint` |
{{/if GATE_TYPECHECK}}
| 4 | A feature is `passing` only when its own verification command exits 0 | you, then `{{RUN}} lint:docs` |
| 5 | Ask before destructive ops: deleting files, `git reset --hard`, rotating credentials, touching production | you |

Add a rule here only when the same mistake has happened three times, and give
it a check command. A rule with no check is advice, and advice gets skipped.

## Sensors

{{SENSORS_TABLE}}

Run them cheapest first and stop at the first failure:

```
{{GATE_ORDER}}
```

Every gate this repository owns must appear in the table above —
`{{RUN}} lint:docs` fails if one is missing, because an agent runs what it is
told about.

## Repository map

{{REPO_MAP}}

## Skills — open the one matching the task, not all of them

Task guides live in `docs/skills/`. Each is opened on demand; none of them are
loaded here. Ground truth about what actually runs lives in `docs/reference/`.

## Exit checklist

Before ending a session, all of these or say in `progress.md` why not:

- [ ] The gates the change can reach are green, by name
- [ ] `docs/harness/scope/features.json` reflects reality
- [ ] `docs/harness/state/progress.md` has a new entry: done, found, blocked, next
- [ ] Any decision that a later session might undo is in `docs/harness/state/decisions.md`
- [ ] No debug residue left behind
- [ ] Either committed, or deliberately dirty with the reason written down
