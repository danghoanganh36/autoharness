# 💾 State — what survives between sessions

Subsystem 2. An agent's memory dies when the session ends; these files do not.
Everything here is written so that session N+1 can reach a working state
without re-deriving what session N already knew.

| File | Holds | Read it |
|---|---|---|
| [progress.md](./progress.md) | What was done, found, blocked, and what to pick up next. Newest entry first | At the start of every session — `{{RUN}} init` prints the top of it |
| [decisions.md](./decisions.md) | Why a choice was made, and what was rejected | Before overturning anything that looks odd |

Git history is the third state artifact: commits are the checkpoints, and
`{{RUN}} init` prints the last ten.

## Rules

- **Write `progress.md` before the session ends, not from memory afterwards.**
  An entry written after the fact records what you meant to do.
- **State what was verified and what was not.** "Not run: the desktop build" is
  more useful than silence, because the next session can decide whether it
  matters.
- **A decision is never silently reversed.** Disagree with an entry in
  `decisions.md` by adding a new dated entry that overturns it. The old
  reasoning stays readable — that is the whole point of the file.
- **Record blockers with the reason,** not just the fact. "Blocked: Docker not
  running" tells the next session exactly what to try first.
