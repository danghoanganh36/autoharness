# Progress log

Newest entry first. Written before a session ends, not from memory afterwards.
`npm run init` prints the top of this file, so the first heading below is what
the next session reads first.

## 2026-10-03 — harness installed

**Done.** `autoharness init` scaffolded the five harness subsystems, the docs
sensor, the pre-commit hook and the CI workflow. The product summary and the
repository map in `/AGENTS.md` are filled in, `docs/harness/scope/features.json`
holds real entries, and git is pointed at `scripts/hooks`.

**Found.** Installing into twelve repositories surfaced three template defects, all fixed in `templates/`: the docs sensor crashed on a dangling symlink, treated a Docker image tag as a path, and the gap-analysis example used a real feature id.

**Verified.** `npm run init` exits 0, which includes `npm run lint:docs`.

**Not verified.** The CI workflow has not run: nothing is committed or pushed.
The pre-commit hook has not been exercised by a real commit.

**Next.** H02 in `docs/harness/scope/features.json`.
