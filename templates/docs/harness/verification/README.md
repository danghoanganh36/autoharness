# ✅ Verification — the feedback layer

Subsystem 3. Everything that judges output **after** the agent produces it. A
sensor is not a log. A log narrates what happened; a sensor returns a
structured verdict plus a fix instruction the agent can act on.

## Inventory

{{SENSOR_INVENTORY}}

Keep this table in step with `package.json`. `{{RUN}} lint:docs` fails when a
gate exists in `package.json` but is absent from the Sensors section of
`/AGENTS.md`, because an agent runs what it is told about.

**Any check that can go green when its own tooling is missing needs an explicit
`command -v` guard.** `scripts/hooks/pre-commit` has one. A hook that shells
out to a binary nobody installed, inside a pipeline that swallows the error,
reports success for a check it never ran.

## The gate order

Run cheapest first and stop at the first failure. There is no value in building
a bundle from code that does not typecheck.

```
{{GATE_ORDER}}
```

### One green command is not verification

Run every gate the change can reach, not the first one that passes. A green
unit test says nothing about whether the bundle builds; a green build says
nothing about whether the behaviour is correct.

Partial evidence is reported as partial. Naming the gates you did not run, and
why, is a result. Implying a full pass from a partial one is the single easiest
way to hand the next session a false starting point.

## Constructive feedback format

When a sensor fails, restate it as a fix instruction before acting. Raw
terminal output is noise; the useful form names the file, the line, the rule,
and the remedy.

```
[SENSOR] typecheck — 1 error
  src/events/priority.ts:10
  Property 'REACTION_RECEIVED' is missing in type EVENT_PRIORITY
FIX: add an entry for the new event type.
     See AGENTS.md hard rule 3.
```

This matters beyond tidiness. The agent's next turn is driven by whatever it
reads; a 400-line stack trace crowds out the constraint that would fix it.

## Tests are checked by mutation, not by passing

A suite that has never been seen to fail is not evidence. When you add
coverage for an invariant, break the invariant on purpose once and record how
many cases failed. That number belongs in the feature's `evidence` field.

## Coverage and complexity are ratchets, not targets

If this repository grows a coverage gate, set every threshold to the floor
measured on the day it is added, rounded down, so the gate fires when coverage
**falls** — the only direction that matters between releases. Chasing a target
produces tests written to move a number; holding a floor produces tests written
because something broke.

Raising a floor when coverage rises is routine. **Lowering one is a decision**
and belongs in [../state/decisions.md](../state/decisions.md) with a reason.

## The docs sensor

`{{RUN}} lint:docs` runs [`scripts/check-docs.mjs`](../../../scripts/check-docs.mjs).
It checks that every repository path a document names actually exists —
markdown links, and backticked tokens that look like paths.

It is deliberately narrow, because a sensor that mostly cries wolf gets ignored
and that is worse than having none. A backticked token counts as a path claim
only when it contains a slash and ends in an extension or a trailing slash, so
`index.ts` and `library/image-name` are skipped. Generated directories are
skipped, and so is any path `git check-ignore` matches — a gitignored path is
not a claim about what the repository contains. A document whose paths are
relative to a workspace declares it at the top:

```
<!-- paths-relative-to: apps/web, apps/web/src -->
```

It also checks three claims prose makes about the repository's own tooling:

1. **Every gate is documented.** A script with at most one colon — `typecheck`,
   `lint:arch`, `test:e2e` — must be named in the Sensors section of
   `/AGENTS.md`. Deeper names (`test:e2e:report`) are helpers, not gates, and
   demanding they be documented would be the noise that gets a check disabled.
2. **No denying something that exists.** A short hand-written map of phrases —
   formatter, linter, coverage gate, secret scanner, unit test runner,
   architecture policy — is flagged when a present-tense document says the
   repository has none and the script or file exists.
3. **No calling a finished feature pending.** A line naming an `H`-id together
   with a pending word ("yet", "planned", "nothing") is flagged when
   `features.json` says that id passes.

Only files that describe the *present* are checked for 2 and 3: `AGENTS.md` and
the harness READMEs. `state/`, `gap-analysis.md` and `effectiveness.md` are logs, where "there was no
formatter" is true and must stay sayable.

These exist because a path check verifies that files exist, not that a sentence
about the repository is still true — and a stale sentence in `AGENTS.md` is
read by every session.

## When a defect escapes

A defect that reaches review means a sensor is missing. Turn it into a control:

1. **Detect** — record the concrete symptom, not a feeling.
2. **Triage** — real defect or false positive? A sensor that cries wolf gets ignored.
3. **Upgrade** — add the control at the cheapest stage that holds it:

| Symptom | Fix goes in |
|---|---|
| Same mechanical mistake, 3rd time | A hard rule in `/AGENTS.md`, with its check command |
| Agent lacked domain context | The matching `docs/skills/*/SKILL.md` |
| Agent believed something untrue | `docs/reference/` — and find out why it was wrong there |
| Structural invariant broken | A type contract or a new automated check |
| Behaviour regressed silently | A test |
| Judgment call went badly | A human gate. Do not automate a decision with real consequences |

4. **Verify** — show the new control catches the old defect. An unverified rule is a guess.

Record what each control has actually caught, with escape and repeat rates, in
[effectiveness.md](./effectiveness.md). A control that has never fired is either
guarding something that never happens, or checking nothing.

## The inferential cell

[review-rubric.md](./review-rubric.md) describes the dual-model review: the one
cell of the four-quadrant table a machine cannot hold. It is **not** a gate. It
does not block a commit, it is not in the pre-commit hook, and it is not in CI.
It produces a report a person reads before deciding to commit.
