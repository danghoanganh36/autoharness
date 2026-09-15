# 🎯 Scope — one feature at a time

Subsystem 4. [features.json](./features.json) is the only place a feature's
status lives. Prose elsewhere may explain *why* an item matters
([gap-analysis.md](./gap-analysis.md) does exactly that),
but it must not restate status, or the two will drift.

## Every entry is a triple

```json
{
  "id": "H02",
  "behavior": "what is true when this works, stated as observable behaviour",
  "verification": "the command that proves it",
  "state": "not_started | active | passing | blocked",
  "evidence": "what the command printed, or why it is blocked"
}
```

A `behavior` that cannot be checked by a command is not a feature entry, it is
a wish. Write the command first; if you cannot, the item is not ready to start.

## The state machine

```
not_started ──► active ──► passing      (only a green verification command)
                  │
                  └─────► blocked       (with the reason, in `evidence`)
```

`passing` is **irreversible**. If something that was passing breaks, that is a
regression: the fix is a new entry and a note in
[../state/progress.md](../state/progress.md), not a quiet downgrade.

## When one entry is not enough

A change spanning several files gets a [sprint contract](./sprint-contract.md)
written before the work starts: scope, **exclusions**, definition of done,
risks. The exclusions are the part that earns its keep — they are what stops a
change from growing while nobody is looking.

## WIP = 1

Exactly one entry is `active` at a time. The rule is in `/AGENTS.md` because
that is what gets loaded every session; it is enforceable here because each
entry carries its own exit condition.

Granularity: an entry should be completable in one session. "Add a test runner
and cover the throttle and dedupe windows" is right. "Improve testing" is too
broad. "Create a test file" is too narrow to be worth verifying.
