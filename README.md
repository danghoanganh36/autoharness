# autoharness

Scaffolds a harness-engineering setup into any repository: the guides that
steer an agent before it acts, the sensors that judge what it produced, and
the loop that turns each escaped defect into a new rule.

Extracted from the harness built for TactiWave HapticLink, with everything
specific to that product removed.

## Use

```bash
cd /path/to/a/project
npx github:danghoanganh36/autoharness init
```

Then, as the command tells you:

```bash
npm run hooks:install   # point git at scripts/hooks
npm run lint:docs       # the docs sensor now checks your answers
npm run init            # the bootstrap contract
```

`init` asks which gates the project has, defaulting to whatever is already in
`package.json`, and generates only the matching parts. It never overwrites an
existing file without `--force`, and it merges its three scripts into
`package.json` rather than replacing what is there.

```
autoharness init     install the harness into the current directory
autoharness doctor   report which harness controls are present and wired

  --yes        accept every default, ask nothing
  --dry-run    print what would be written, write nothing
  --force      overwrite files that already exist
```

## What lands in the project

```
AGENTS.md                        the router: session protocol, hard rules, sensors, exit checklist
docs/README.md                   the documentation map
docs/harness/                    five subsystems, documented
  instructions/                  1 📋  what the agent is told before it acts
  state/                         2 💾  progress.md, decisions.md
  verification/                  3 ✅  the gates, the review rubric, what each control caught
  scope/                         4 🎯  features.json — one feature at a time, WIP=1; gap analysis
  lifecycle/                     5 🔄  how a session starts and ends
docs/reference/                  ground truth: the system as it is
docs/skills/_template/SKILL.md   copy per area of the codebase
scripts/init.sh                  the bootstrap contract, four stages
scripts/check-docs.mjs           the docs sensor
scripts/hooks/pre-commit         secret scan, credential files, the fast gates
.github/workflows/gates.yml      every gate, run without anyone remembering to
```

## The one idea worth keeping

A guide a script cannot check is advice, and advice gets skipped. So the docs
sensor checks three things prose usually gets away with:

1. every repository path a document names exists;
2. every gate in `package.json` appears in the Sensors section of `AGENTS.md`;
3. no present-tense document denies a capability the repository has, or calls
   a finished feature pending.

That third one exists because the source repository's `AGENTS.md` claimed
"there is no formatter, secret scanner, or coverage gate" for 17 commits after
all three were built. A path check cannot catch that: it verifies that files
exist, not that a sentence is still true.

## Develop

```bash
npm run smoke
```

Installs the harness into a throwaway repository and checks that every
placeholder rendered, the hook is executable and parses, the scripts merged
without clobbering, and — the interesting one — that the generated docs sensor
passes on the files the generator itself wrote. That last check is the
templates grading themselves, and it has already caught one real defect.

Zero dependencies, deliberately. The pre-commit hook this tool ships refuses to
run a check whose tooling is missing; a scaffolder that needed its own
dependency tree to start would hold a lower standard than what it installs.
