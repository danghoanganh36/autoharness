# Decisions

Why a choice was made, and what was rejected. Append only. A decision is never
silently reversed: disagree with an entry by adding a new dated one that
overturns it, and leave the old reasoning readable.

Each entry answers four questions: what was decided, what was rejected, why,
and what would make this worth revisiting.

## {{TODAY}} — adopt a harness

**Decided.** Scaffold the six-subsystem harness into this repository:
instructions, state, verification, scope, lifecycle, and the steering loop that
maintains them.

**Rejected.** Keeping guidance in prose in the README, and relying on each
session to remember the conventions.

**Why.** A guide a script cannot check is advice. Prose conventions decay
silently, and every session that reads a stale one inherits the error.

**Revisit if.** The gates become slow enough that people start using
`--no-verify`. A bypassed gate is worse than an honest manual step.
