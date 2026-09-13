# Sprint contract — for changes too large for one feature entry

Most work needs nothing more than an entry in
[features.json](./features.json): a behaviour, a command, a state. A sprint
contract is for the exception — a change that touches several files, where the
expensive failure is not a bug but the agent quietly redefining the task while
working.

Write one **before** starting. Put it in the pull request, or in
[../state/progress.md](../state/progress.md) for uncommitted work.

## Template

```markdown
# Sprint contract: <name>

## Scope — what this change touches
- <file or area, and what changes about it>

## Exclusions — what it deliberately does not touch
- <the thing an agent would plausibly "also fix" on the way>

## Definition of done
- <observable behaviour, not "it works">
- <the gates that must be green, named>

## Risks
- <what could break that no gate would catch>
```

## Why exclusions matter more than scope

Scope is the easy half; every task has one. The exclusions are what stop the
change from growing while nobody is looking — "NOT reformatting the files it
touches", "NOT changing the public API", "NOT upgrading the framework". An
agent that finds an unrelated flaw mid-task records it as a new entry in
`features.json` and leaves it alone.

## The last line of a good contract

A contract that claims every risk is covered by a gate is usually wrong about
at least one of them. Name the risk no gate covers, and say who checks it.
