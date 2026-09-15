# Effectiveness — what each control has actually caught

A control that has never fired is either protecting something that never
happens, or checking nothing. This file is how you tell the difference.

Measure it, do not estimate it. Re-measure when the harness changes shape.

## Controls and their catch record

| Control | Stage | Times fired | Last real catch | Verdict |
|---|---|---|---|---|
| `scripts/hooks/pre-commit` — secret scan | Pre-commit | — | — | not yet measured |
| `{{RUN}} lint:docs` | Pre-commit, CI | — | — | not yet measured |

A control with a long run of zero and no plausible defect it would catch is a
candidate for deletion. Say so in the verdict column rather than leaving it
there out of politeness.

## Escapes

Defects found in review that a sensor should have caught. Each one is a missing
control, and each row should end either in a new control or in an explicit
decision that no gate can hold it.

| Date | Escape | Which sensor should have caught it | What was added |
|---|---|---|---|

## Repeats

The same class of defect appearing again after a rule was added. A non-zero
repeat rate means the rule sits too far right in the pipeline, or is
unverifiable.

| Date | Defect class | Rule that failed to hold it | What replaced it |
|---|---|---|---|
