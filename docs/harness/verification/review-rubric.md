# Dual-model review — the rubric

The inferential feedback cell of the harness, and the only one a machine cannot
hold. Two different models read the same diff independently; a person reads
what they produce and decides. **No model decides anything here.**

## Why two *different* models

Running one model twice does not produce two opinions, it produces the same
opinion twice. If the author misread the requirement, a reviewer with the same
weights and the same context misreads it the same way — the failures correlate
exactly where you most need them not to.

Two models from the same family are not independent either: overlapping
training, similar blind spots. But they are **less** correlated than a model
with itself, and that is the whole of what this buys.

| Outcome | What it means |
|---|---|
| The two **disagree** | Ambiguity. Read this first — it is the only part carrying new information |
| The two **agree** | Nothing proven. They can be wrong together |

Read the disagreements. Treat agreement as a prompt to look, never as a pass.

## Scope — the rules no gate can hold, and nothing else

List them here, by number, from `/AGENTS.md`. Everything already held by a gate
is **out of scope**: formatting, types, lint rules, module boundaries,
behaviour covered by tests. A reviewer that repeats what a gate already said is
noise, and noise is how a review stage gets switched off.

## Three hard constraints on a finding

1. **Quote the line.** A finding names `file:line` and quotes the actual code.
   If it cannot be quoted, it is not a finding — it is an impression. This is
   what lets a reader verify in seconds instead of re-investigating.
2. **Name the rule.** `[rule 3]`, `[rule 5]`. No free-form concerns.
3. **Never rule on a judgment call.** A decision with real consequences for a
   user belongs to a human. A model may state a fact about it; it may not
   recommend a change to it.

"No findings" is a valid and expected result. A reviewer that always finds
something is measuring its own helpfulness, not the diff.

## Procedure

1. Stage or otherwise fix the diff under review. Record its range.
2. Run the same prompt twice, on two **different** models, with no shared
   context between them and no access to the reasoning that produced the code —
   only the diff and `/AGENTS.md`. Cutting the author's rationale out is most
   of what decorrelates the two passes.
3. Write both results to `review.md` in this directory, disagreements first.
   The file is **overwritten every run** and is gitignored: it is per-run
   evidence, not documentation.
4. A person reads it and decides whether to commit.

## What this is not

It is not a gate, and it is not a substitute for the computational gates. Two
model passes take minutes and cost money; a slow gate gets bypassed with
`--no-verify`, and a bypassed gate is worse than an honest manual step.
