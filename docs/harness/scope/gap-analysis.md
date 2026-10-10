# Gap analysis

Reasoning for each harness feature id. Status lives in
[features.json](./features.json) and **must not** be restated
here in prose, or the two will drift.

Headings are the exception, and they are checked: `npm run lint:docs` requires
a `### H-id` heading to carry ✅ exactly when `features.json` says that id
passes.

## Format

```markdown
### Hnn <short name>

**Quadrant.** Which of the four cells this fills.
**Symptom.** What went wrong, or what would go unnoticed without it.
**Control.** What was added, at which stage.
**Cost.** How long it takes to run, and who pays that.
```

Ranked by what an escaped defect would cost, not by what is easiest to build.

### H01 ✅ Docs path sensor

**Quadrant.** Computational sensor.
**Symptom.** A document names a path that does not exist, and every later session follows it.
**Control.** `scripts/check-docs.mjs`, run by `npm run lint:docs`, the pre-commit hook, and CI.
**Cost.** Under a second, on every commit that stages Markdown.

### H02 A named `test` gate

**Quadrant.** Computational sensor.
**Symptom.** The project's own checks run only when someone remembers the command, so neither the hook nor CI ever runs them.
**Control.** A `test` script in the root `package.json` wrapping the real command, listed in the Sensors section of `/AGENTS.md`.
**Cost.** Whatever the suite takes. If that is minutes, it stays out of the pre-commit hook.
