<!-- paths-relative-to: . -->
# Skill: <area name>

Copy this directory to `docs/skills/<area>/` and fill it in. One skill per area
of the codebase an agent works in. It is opened on demand — never loaded into
every session — so it can afford detail that `/AGENTS.md` cannot.

Delete any section that has nothing true to say in it. An empty heading is
worse than a missing one: it reads as "nothing to worry about here".

## When to open this

<One sentence. "Changing anything under packages/foo/" is a good answer.>

## What this area is

<What it does, and the one sentence about its purpose someone would otherwise
get wrong.>

## Invariants — do not break these

<The rules that hold regardless of the task. Name the file, constant, or type
that enforces each one, or say plainly that nothing does.>

## Trade-offs already decided

<Choices that look wrong until you know why. Link the entry in
docs/harness/state/decisions.md rather than restating it.>

## How to verify a change here

<The exact commands, in order, and what each one proves. If a change to this
area needs a gate the repository does not have, say so — that is a gap-analysis
entry, not a silent omission.>

## Traps

<The thing that has already gone wrong here, so it goes wrong once.>
