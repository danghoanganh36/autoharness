# AGENTS.md — autoharness

Commands, not explanations. This file is loaded into **every** session, so it
holds what you must do; the reasoning lives in files you open only when you
need it. Before arguing with a rule here, read
`docs/harness/instructions/README.md` (how each rule is enforced) and
`docs/harness/state/decisions.md` (why past choices were made).

Keep this file under 150 lines. It is a routing table, not a manual.

## What this product is

A zero-dependency CLI that scaffolds a harness-engineering setup into a repository and reports on it. It is not a linter or a test runner: it installs the guides and wiring around the gates a project already has.

## Session protocol

1. Run `npm run init`. Do not start coding without it.
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
| 2 | Every document names only paths that exist | `npm run lint:docs` |
| 4 | A feature is `passing` only when its own verification command exits 0 | you, then `npm run lint:docs` |
| 5 | Ask before destructive ops: deleting files, `git reset --hard`, rotating credentials, touching production | you |

Add a rule here only when the same mistake has happened three times, and give
it a check command. A rule with no check is advice, and advice gets skipped.

## Sensors

| Gate | Catches |
|---|---|
| `npm run lint:docs` | A document naming a path, gate, or capability that does not exist |
| `scripts/hooks/pre-commit` | Secrets, credential files, and the fast gates |

Run them cheapest first and stop at the first failure:

```
lint:docs → human review
```

Every gate this repository owns must appear in the table above —
`npm run lint:docs` fails if one is missing, because an agent runs what it is
told about.

## Repository map

| Path | What it is |
|---|---|
| `bin/` | The CLI entry point. |
| `docs/` | `docs/README.md` is the map. `docs/reference/` is ground truth; `docs/harness/` is this harness. |
| `scripts/` | Bootstrap, sensors, and git hooks. |
| `src/` | Commands (`init`, `doctor`), the gate catalogue, and the template renderer. |
| `templates/` | The files `init` writes into a target repository. They contain placeholders and are not documentation of this repository. |

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
