# 🔁 Steering — turning failures into rules

A defect that reaches review is information about the harness, not just about
the change. The loop below converts it into a control so the same defect cannot
recur.

## The four steps

1. **Detect.** A sensor fires, or a human catches something no sensor was
   watching. Record the concrete symptom, not a feeling.
2. **Triage.** Real defect, or false positive? A sensor that cries wolf gets
   ignored, which is worse than having no sensor.
3. **Upgrade.** Add the missing control at the cheapest stage that can hold it.
4. **Verify.** Re-run the task and show the new control catches the old defect.
   An unverified rule is a guess.

## Where to put the fix

| Symptom | Put the fix here |
|---|---|
| Agent repeats a mechanical mistake (3rd time) | A hard rule in `/AGENTS.md`, with its check command |
| Agent lacked domain context | The relevant `docs/skills/*/SKILL.md` |
| Agent believed something untrue about the system | `docs/reference/` — and find out why it was wrong there |
| Structural invariant was broken | A type contract, or a new automated check |
| Behaviour regressed silently | A test |
| Judgment call went badly | A human gate. Do not automate a decision with real consequences. |

Prefer the lowest row that actually holds. A rule in prose is the weakest form;
a type error is the strongest.

## Metrics worth tracking

Record them in [effectiveness.md](./effectiveness.md), with what each control
has actually caught.

- **Escape rate** — defects found in review that a sensor should have caught.
  Each one is a missing control.
- **Repeat rate** — the same class of defect appearing again after a rule was
  added. Non-zero means the rule sits too far right, or is unverifiable.
- **Gate latency** — how long the pre-merge gates take. When they get slow,
  agents and humans start skipping them, and a skipped gate is no gate.

## Knowing when to stop

A harness that blocks everything is as useless as one that blocks nothing. The
goal is that a defect reaching production is rare *and* that a correct change
passes without argument. When a control fires mostly on false positives, delete
it. When a control has never fired, ask whether it is checking anything.

## Anti-patterns

- **Tightening the prompt instead of adding a check.** If three rephrasings did
  not fix it, wording is not the problem.
- **Trusting an LLM reviewer as the only gate.** It fails the same way the
  agent does. Keep a human at the decision points that matter.
- **Sensors that only log.** A failure nobody is forced to resolve is a failure
  that ships.
- **Letting `docs/reference/` drift.** The moment it lies, every agent reading
  it inherits the lie — that is the defect this whole page exists to prevent.
