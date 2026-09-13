# Progress log

Newest entry first. Written before a session ends, not from memory afterwards.
`{{RUN}} init` prints the top of this file, so the first heading below is what
the next session reads first.

## {{TODAY}} — harness installed

**Done.** `autoharness init` scaffolded the six harness subsystems, the docs
sensor, the pre-commit hook{{#if CI}} and the CI workflow{{/if CI}}.

**Found.** Nothing yet.

**Not verified.** Nothing has been run against this harness yet.

**Next.** Fill in `/AGENTS.md` — the product summary, the repository map, and
any hard rule this project actually needs. Then replace the placeholder entry
in `docs/harness/scope/features.json` with a real one and run `{{RUN}} init`.
