# Reference — ground truth

What actually runs, as opposed to what was once planned. An agent reading this
directory should be able to trust every sentence in it.

That is a strong claim, and it is the reason for the split:

- **`docs/reference/`** — the system as it is. Verifiable against the running
  host or the source tree.
- **`docs/vision/`** — designs for software that does not exist yet. If you
  create this directory, put a warning banner at the top of every file in it.
  `{{RUN}} lint:docs` skips it for exactly that reason.

The failure this split prevents: a confidently wrong architecture document.
A missing guide leaves an agent uninformed, which is recoverable. A guide
describing components that were never built sends it in a direction the
codebase cannot support, and every downstream decision inherits the error.

The moment a file here stops being true, fix it or move it. Letting this
directory drift is the defect
[../harness/steering/README.md](../harness/steering/README.md) exists to
prevent.

## Suggested contents

| File | Holds |
|---|---|
| `architecture.md` | The components that exist, how they talk, and what runs where |
| `environments.md` | Local, staging, production: what differs and which values come from where |
| `runbook.md` | How to start it, how to see whether it is healthy, what to do when it is not |
