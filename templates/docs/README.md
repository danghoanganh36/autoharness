# Documentation map

Four directories, and the difference between them is the whole point.

| Directory | Holds | Trust it? |
|---|---|---|
| [harness/](./harness/) | The harness itself: instructions, state, verification, scope, lifecycle | Yes — `{{RUN}} lint:docs` checks its paths |
| [reference/](./reference/) | The system as it actually is | Yes — and fix it the moment it stops being true |
| [skills/](./skills/) | Task guides, opened on demand, one per area | Yes, as intent. Verify specifics against the code |
| `vision/` | Designs for software that does not exist yet. Create it only if you need it, and put a warning banner on every file | **No.** Nothing here describes what runs |

The split exists because a confidently wrong document is worse than a missing
one. A missing guide leaves an agent uninformed, which is recoverable. A guide
describing components that were never built sends it in a direction the
codebase cannot support, and every downstream decision inherits the error.

Start at [harness/README.md](./harness/README.md).
