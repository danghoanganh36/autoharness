# Gap analysis

Reasoning for each harness feature id. Status lives in
[features.json](./features.json) and **must not** be restated
here in prose, or the two will drift.

Headings are the exception, and they are checked: `{{RUN}} lint:docs` requires
a `### H-id` heading to carry ✅ exactly when `features.json` says that id
passes.

## Format

```markdown
### H01 <short name>

**Quadrant.** Which of the four cells this fills.
**Symptom.** What went wrong, or what would go unnoticed without it.
**Control.** What was added, at which stage.
**Cost.** How long it takes to run, and who pays that.
```

Ranked by what an escaped defect would cost, not by what is easiest to build.

<!-- Add a section per feature id as the harness grows. -->
