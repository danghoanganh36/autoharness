# The harness for this repository

A harness is the deterministic scaffolding around a probabilistic model: the
guides that steer an agent before it acts, the sensors that judge what it
produced, and the loop that turns each escaped defect into a new rule.

## One folder per subsystem

| # | Subsystem | Folder | Job | Where it physically lives |
|---|---|---|---|---|
| 1 | 📋 Instructions | [instructions/](./instructions/) | Tell the agent what to do, in what order, what to read first | `/AGENTS.md`, `docs/skills/`, `docs/reference/` |
| 2 | 💾 State | [state/](./state/) | What is done, in progress, blocked — and why past choices were made | `state/progress.md`, `state/decisions.md`, `git log` |
| 3 | ✅ Verification | [verification/](./verification/) | Only a passing command counts as evidence | the gates in `package.json` |
| 4 | 🎯 Scope | [scope/](./scope/) | One feature at a time, each with its own verification command | `scope/features.json` |
| 5 | 🔄 Lifecycle | [lifecycle/](./lifecycle/) | Initialise at the start, leave a clean restart path at the end | `{{RUN}} init`, the `/AGENTS.md` exit checklist |
| — | 🔁 Steering | [steering/](./steering/) | Turn every escaped defect into a new control | `steering/README.md`, `steering/gap-analysis.md` |

The folders hold the harness's own documentation. The controls themselves live
next to the code they govern — that column exists so nobody goes looking for
`AGENTS.md` inside `instructions/`.

Steering is not one of the five. It is the loop that maintains the other five,
and it is the reason this directory does not rot: see
[steering/README.md](./steering/README.md).

## The four quadrants

|  | **Feedforward** (before the agent acts) | **Feedback** (after it produces output) |
|---|---|---|
| **Computational** (deterministic, ~free) | `/AGENTS.md` hard rules; type contracts; lint rules; anything the language itself can make unrepresentable | The gates listed in [verification/README.md](./verification/README.md), plus `scripts/hooks/pre-commit` and CI running them unattended |
| **Inferential** (LLM, costly, fallible) | Skill files under `docs/skills/` that convey intent and trade-offs rather than syntax | Human review, and the dual-model report described in [verification/review-rubric.md](./verification/review-rubric.md) — which decides nothing and hands a person citations |

A cell with nothing in it is a gap, not a style. Rank what is left in
[steering/gap-analysis.md](./steering/gap-analysis.md).

## The three control targets

Easiest first:

1. **Maintainability** — complexity, duplication, dead code, style. The
   cheapest to guard and the least valuable to guard; a linter holds most of it.
2. **Architecture** — fitness functions that hold structural invariants over
   time. Module boundaries, exhaustive mappings, anything where adding a case
   without handling it should fail the build.
3. **Behaviour** — the hardest, and the only one a user notices. Tests that
   exercise the path that ships, not a mock of it.

## Keep quality left

Push each rule to the cheapest stage that can enforce it.

| Stage | What runs here | Cost |
|---|---|---|
| Pre-commit | `scripts/hooks/pre-commit`: secret scan, credential files, the fast gates | Seconds |
| Pre-merge | The full gate list in [verification/README.md](./verification/README.md) | Seconds to a minute |
| On demand | Anything needing a live service or a real browser | Minutes |
| Continuous | CI on every push and pull request | Varies |

When an agent breaks the same rule three times, the fix is not a stricter
prompt. It is a new line in `/AGENTS.md`, or better, a new sensor.

## What the harness deliberately does not do

It does not rewrite the agent's loop, and it does not encode business judgment.
A decision with real consequences for a user stays with a human; the harness
only guarantees the decision is recorded, typed, and testable.
