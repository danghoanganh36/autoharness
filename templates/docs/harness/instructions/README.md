# 📋 Instructions — the feedforward layer

Subsystem 1. Everything an agent is told **before** it acts. The test of a
guide is not how well written it is but whether a script can prove it was
followed. An unverifiable guide is advice, and advice gets skipped.

## Inventory

| Guide | Location | Kind | Verified by |
|---|---|---|---|
| Router + hard rules | `/AGENTS.md` | Computational + Inferential | Per-rule, see below |
| Task skills | `docs/skills/*/SKILL.md` | Inferential | Human review of the diff |
| Ground truth | `docs/reference/` | Inferential | Reality on the host |

Add a row whenever a new guide appears. A guide nobody knows about is a guide
nobody reads.

## How each hard rule in AGENTS.md is checked

| Rule | Check | Status |
|---|---|---|
| No secrets in tracked files | `scripts/hooks/pre-commit` | **Automatic** — blocks an assignment with a real-looking value, and any `.env`/`.pem`/keystore file |
| Documents name only paths that exist | `scripts/check-docs.mjs` | **Automatic** |
{{#if GATE_TYPECHECK}}
| No `any`, no bare `@ts-ignore` | `{{RUN}} lint` | **Automatic** — and the pre-commit hook runs it |
{{/if GATE_TYPECHECK}}
| A feature is `passing` only on a green command | — | **Unenforceable by script** — human discipline, visible in `evidence` |
| Confirm destructive ops | Tool permission prompts | Enforced by the agent host |

Keep this table honest. A rule listed as automatic that no script actually runs
is worse than a rule listed as manual, because nobody checks it by hand either.

One caveat worth carrying: **any check that can silently go green when its own
tooling is missing needs an explicit `command -v` guard.** The pre-commit hook
has one. A hook that shells out to a binary that is not installed, in a
pipeline that swallows the error, reports success for a check it never ran.

## Writing a good guide

Compare:

| Weak | Strong |
|---|---|
| "Write accessible components." | "Every interactive control needs a label and a keyboard handler. A state change the user must know about emits an event; it does not only change a CSS class." |
| "Keep it efficient." | "Low-priority work is throttled to one per 1500 ms. Changing that constant requires a test showing the burst behaviour." |
| "Don't hardcode config." | "Credentials come from `process.env` only. The checked-in example file is not what production reads." |

The strong column names a file, a constant, or a command. That is the bar.

## Progressive disclosure

`/AGENTS.md` is capped at 150 lines on purpose. It is a routing table, not a
manual. Detail belongs in a skill that an agent opens only when the task calls
for it.

The failure this prevents: a 1,500-line instruction file sits in every request,
costs tokens on every turn, and — because of attention decay in the middle of a
long context — gets partially ignored anyway. A short router plus on-demand
skills keeps the instructions that are actually loaded relevant to the task.

## Guides that should exist but do not

Track them in [gap-analysis.md](../scope/gap-analysis.md), not here. This
page describes what is in place.
