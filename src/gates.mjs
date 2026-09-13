/**
 * The gate catalogue. One place that knows a gate's script name, what it
 * catches, and where it is cheap enough to run — so AGENTS.md, the CI
 * workflow, the pre-commit hook and init.sh cannot disagree about the list.
 *
 * Ordered cheapest first. That order is the gate order printed in AGENTS.md,
 * and there is no value in building a bundle from code that does not typecheck.
 */
export const GATES = [
  {
    key: 'GATE_TYPECHECK',
    script: 'typecheck',
    catches: 'Type errors',
    fast: true,
    hook: false,
    question: 'Has a typecheck gate?'
  },
  {
    key: 'GATE_LINT',
    script: 'lint',
    catches: 'Style and correctness rules the type system cannot hold',
    fast: true,
    hook: true,
    question: 'Has a lint gate?'
  },
  {
    key: 'GATE_FORMAT',
    script: 'format:check',
    catches: 'Formatting drift',
    fast: true,
    hook: true,
    hookNote: 'formatting: run the formatter, then stage the result',
    question: 'Has a format:check gate?'
  },
  {
    key: 'GATE_ARCH',
    script: 'lint:arch',
    catches: 'Module boundary violations and cycles',
    fast: true,
    hook: true,
    question: 'Has an architecture gate (dependency-cruiser)?'
  },
  {
    // Always installed: autoharness brings the sensor with it.
    key: 'GATE_DOCS',
    script: 'lint:docs',
    catches: 'A document naming a path, gate, or capability that does not exist',
    fast: true,
    hook: false,
    always: true
  },
  {
    key: 'GATE_TEST',
    script: 'test',
    catches: 'Behaviour regressions',
    fast: true,
    hook: true,
    question: 'Has a unit test gate?'
  },
  {
    key: 'GATE_COVERAGE',
    script: 'test:coverage',
    catches: 'Coverage falling below the recorded floor',
    fast: false,
    hook: false,
    question: 'Has a coverage ratchet?'
  },
  {
    key: 'GATE_BUILD',
    script: 'build',
    catches: 'A bundle that does not build',
    fast: false,
    hook: false,
    question: 'Has a build gate?'
  },
  {
    key: 'GATE_E2E',
    script: 'test:e2e',
    catches: 'What a user actually receives, against the real stack',
    fast: false,
    hook: false,
    slow: true,
    question: 'Has an end-to-end suite?'
  }
]

export const selected = (answers) => GATES.filter((g) => g.always || answers[g.key])
