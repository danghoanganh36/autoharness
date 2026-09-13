# 🔄 Lifecycle — how a session starts and ends

Subsystem 5. Initialisation and implementation are different jobs; mixing them
means doing both badly. A session that starts by writing code in a broken
environment produces code that was never verified.

## Start: `{{RUN}} init`

[`scripts/init.sh`](../../../scripts/init.sh) is the bootstrap contract. It is
complete when four things hold, and it runs them in that order:

| Stage | Proves |
|---|---|
| 1 — install dependencies | **Can start** |
| 2 — the fast gates | **Can verify** — every cheap gate is green before anything is built on top of it |
| 3 — open features from `docs/harness/scope/features.json` | **Can see progress** |
| 4 — the top of `docs/harness/state/progress.md`, plus `git log -10` | **Can pick up next steps** |

Builds and anything needing a live service stay out: they take minutes. They
are per-task gates — see [../verification/README.md](../verification/README.md)
for the full order. A bootstrap that takes minutes gets skipped, and a skipped
bootstrap is no bootstrap.

## End: the exit checklist

The checklist lives at the bottom of `/AGENTS.md`, not here, because it has to
be in context when the session is ending. This page explains why it is what it
is.

Session completion is **not** "the feature works". It is the feature works
**and** the repository is in a state the next session can resume from:

- **Gates green** — whichever gates the change can reach. A gate you skipped is
  named in `progress.md`, with the reason.
- **State written** — `docs/harness/scope/features.json` and
  `docs/harness/state/progress.md` updated while the work is still fresh.
- **No debug residue** — a stray log line is noise the next session has to
  decide about.
- **A clean restart path** — either committed, or deliberately dirty with
  `progress.md` saying which files and why.

## Why this matters more than it looks

Entropy is the default. Without a cleanup step, build and test pass rates decay
over a project's life and session startup time climbs, until the first twenty
minutes of every session are spent rebuilding a working environment. The exit
checklist costs about a minute and is what keeps `{{RUN}} init` at seconds.
