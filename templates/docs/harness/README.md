# The harness for this repository

A harness is the deterministic scaffolding around a probabilistic model. It has
exactly five parts, one folder each. The folders hold the harness's
documentation; the controls themselves live next to the code they govern.

| # | Subsystem | Folder | Job | Key files |
| --- | --- | --- | --- | --- |
| 1 | 📋 **Instructions** | [instructions/](./instructions/) | Tell the agent what to do, in what order, what to read first | `/AGENTS.md`, `docs/skills/`, `docs/reference/` |
| 2 | 💾 **State** | [state/](./state/) | Track what's done, in-progress, and next. Persisted to disk so the next session picks up exactly where the last left off | `state/progress.md`, `state/decisions.md`, `git log` |
| 3 | ✅ **Verification** | [verification/](./verification/) | Only passing tests count as evidence. Agent cannot declare victory without proof | the gates in `package.json`, `scripts/hooks/pre-commit`, `scripts/check-docs.mjs` |
| 4 | 🎯 **Scope** | [scope/](./scope/) | Constrain agent to ONE feature at a time. No overreach. No half-finishing three things | `scope/features.json`, `scope/sprint-contract.md` |
| 5 | 🔄 **Session Lifecycle** | [lifecycle/](./lifecycle/) | Initialize at start. Clean up at end. Leave a clean restart path | `{{RUN}} init`, the `/AGENTS.md` exit checklist, clean commits |

There is no sixth part. When a defect escapes, the fix is a new control in one
of these five — see [verification/README.md](./verification/README.md#when-a-defect-escapes).
