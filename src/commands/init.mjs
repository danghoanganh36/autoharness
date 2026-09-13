import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ask } from '../prompt.mjs'
import { render } from '../render.mjs'
import { walk, writeFile, readJson } from '../fsutil.mjs'
import { GATES, selected } from '../gates.mjs'

const TEMPLATES = fileURLToPath(new URL('../../templates/', import.meta.url))

/** Files that must be executable, or they are a gate that silently never runs. */
const EXECUTABLE = new Set(['scripts/init.sh', 'scripts/hooks/pre-commit'])

const RUNNERS = {
  npm: { run: 'npm run', install: 'npm install --no-audit --no-fund', ci: 'npm ci', cache: 'npm' },
  pnpm: {
    run: 'pnpm',
    install: 'pnpm install',
    ci: 'pnpm install --frozen-lockfile',
    cache: 'pnpm'
  },
  yarn: {
    run: 'yarn',
    install: 'yarn install',
    ci: 'yarn install --frozen-lockfile',
    cache: 'yarn'
  }
}

export async function run(args) {
  const flags = new Set(args)
  const dryRun = flags.has('--dry-run')
  const force = flags.has('--force')
  const cwd = process.cwd()

  const pkgPath = join(cwd, 'package.json')
  const pkg = readJson(pkgPath)
  const existing = pkg?.scripts ?? {}

  console.log(`\nautoharness — installing into ${cwd}\n`)
  if (!pkg) {
    console.log('  No package.json here. The harness will still install, but\n' +
      '  scripts/init.sh and the pre-commit hook expect one.\n')
  }

  const answers = await ask(questions(pkg, existing), { yes: flags.has('--yes') })
  const runner = RUNNERS[answers.PKG_MANAGER] ?? RUNNERS.npm
  const gates = selected(answers)

  const vars = {
    ...answers,
    TODAY: new Date().toISOString().slice(0, 10),
    RUN: runner.run,
    INSTALL: runner.install,
    CI_INSTALL: runner.ci,
    CACHE_KEY: runner.cache,
    NODE_VERSION: answers.NODE_VERSION,
    SENSORS_TABLE: sensorsTable(gates, runner),
    SENSOR_INVENTORY: sensorInventory(gates, runner),
    GATE_ORDER: gateOrder(gates),
    INIT_GATE_LINES: initGateLines(gates, runner),
    HOOK_CODE_GATES: hookGates(gates, runner),
    CI_GATE_STEPS: ciGateSteps(gates, runner),
    REPO_MAP: repoMap(cwd)
  }

  const plan = []
  for (const rel of walk(TEMPLATES)) {
    if (rel.startsWith('.github/') && !answers.CI) continue
    const target = join(cwd, rel)
    if (existsSync(target) && !force) {
      plan.push({ rel, target, skipped: 'exists — pass --force to overwrite' })
      continue
    }
    const source = readFileSync(join(TEMPLATES, rel), 'utf8')
    const body = rel.endsWith('.mjs') ? source : render(source, vars)
    plan.push({ rel, target, body, mode: EXECUTABLE.has(rel) ? 0o755 : undefined })
  }

  const scriptPlan = pkg ? mergeScripts(pkg, runner) : null

  report(plan, scriptPlan, dryRun)
  if (dryRun) return

  for (const item of plan) {
    if (item.skipped) continue
    writeFile(item.target, item.body, item.mode)
  }
  if (scriptPlan?.added.length) {
    writeFile(pkgPath, JSON.stringify(scriptPlan.next, null, 2) + '\n')
  }

  console.log(`
Next:
  1. ${runner.run} hooks:install          — point git at scripts/hooks
  2. open AGENTS.md and fill in the product summary and the repository map
  3. replace the placeholder in docs/harness/scope/features.json
  4. ${runner.run} lint:docs              — the sensor now checks your answers
  5. ${runner.run} init                   — the bootstrap contract
`)
}

function questions(pkg, existing) {
  const has = (name) => Boolean(existing[name])
  const gateQuestions = GATES.filter((g) => g.question).map((g) => ({
    key: g.key,
    type: 'confirm',
    message: g.question,
    // Default to what the repository already has. A prompt that argues with
    // package.json gets answered wrong, fast.
    default: g.script === 'build' ? has('build') || has('build:web') : has(g.script)
  }))

  return [
    { key: 'PROJECT_NAME', message: 'Project name?', default: pkg?.name ?? 'this repository' },
    {
      key: 'PRODUCT_SUMMARY',
      message: 'One line: what this product is (and is not)?',
      default: 'TODO: what this is, who it is for, and what it is deliberately not.'
    },
    { key: 'PKG_MANAGER', message: 'Package manager (npm/pnpm/yarn)?', default: 'npm' },
    { key: 'NODE_VERSION', message: 'Node version for CI?', default: '22' },
    ...gateQuestions,
    { key: 'CI', type: 'confirm', message: 'Write .github/workflows/gates.yml?', default: true }
  ]
}

function sensorsTable(gates, runner) {
  const rows = gates.map((g) => `| \`${runner.run} ${g.script}\` | ${g.catches} |`)
  rows.push('| `scripts/hooks/pre-commit` | Secrets, credential files, and the fast gates |')
  return ['| Gate | Catches |', '|---|---|', ...rows].join('\n')
}

function sensorInventory(gates, runner) {
  const rows = gates.map(
    (g) =>
      `| \`${runner.run} ${g.script}\` | Computational | ${g.catches} | ` +
      `${g.slow ? 'Minutes, on demand' : 'Fast'} |`
  )
  rows.push(
    '| `scripts/hooks/pre-commit` | Computational | Secrets, credential files, the fast gates | Seconds |'
  )
  rows.push(
    '| Dual-model review | Inferential | **Not a gate** — a citable report for a human | Minutes, costs money |'
  )
  rows.push('| Human review | Inferential | Reviewer judgment | — |')
  return ['| Sensor | Layer | Catches | Runtime |', '|---|---|---|---|', ...rows].join('\n')
}

function gateOrder(gates) {
  return gates.map((g) => g.script).join(' → ') + ' → human review'
}

function initGateLines(gates, runner) {
  return gates
    .filter((g) => g.fast)
    .map((g) => `${runner.run} ${g.script}`)
    .join('\n')
}

function hookGates(gates, runner) {
  const lines = gates
    .filter((g) => g.hook)
    .map((g) => {
      const note = g.hookNote ?? `${runner.run} ${g.script} failed`
      return `  ${runner.run} --silent ${g.script} > /dev/null || { say "${note}"; fail=1; }`
    })
  // A hook body that is empty is a syntax error inside the `if` block above it.
  return lines.length ? lines.join('\n') : '  :'
}

function ciGateSteps(gates, runner) {
  return gates
    .map((g) => `      - run: ${runner.run} ${g.script}\n        if: '!cancelled()'`)
    .join('\n')
}

/**
 * The top-level directories that exist, as a table an agent can read. Only
 * what is really there: every row is a path claim the docs sensor will check.
 */
function repoMap(cwd) {
  const skip = new Set(['node_modules', '.git', '.github', 'dist', 'build', 'out', 'coverage'])
  const present = readdirSync(cwd)
    .filter((n) => !n.startsWith('.') && !skip.has(n))
    .filter((n) => statSync(resolve(cwd, n)).isDirectory())
  // docs/ and scripts/ are created by this run, so they are not on disk yet
  // when the map is built — and a map missing them would be wrong the moment
  // it is written.
  const dirs = [...new Set([...present, 'docs', 'scripts'])].sort()

  const known = {
    docs: '`docs/README.md` is the map. `docs/reference/` is ground truth; `docs/harness/` is this harness.',
    scripts: 'Bootstrap, sensors, and git hooks.',
    src: 'TODO: what lives here.',
    apps: 'TODO: one line per app.',
    packages: 'TODO: one line per package.',
    tests: 'TODO: which suite, against what.',
    infra: 'TODO: what it brings up, and whether it is production.'
  }

  const rows = dirs.map((d) => `| \`${d}/\` | ${known[d] ?? 'TODO: what this is.'} |`)
  return ['| Path | What it is |', '|---|---|', ...rows].join('\n')
}

/** Add only the harness's own scripts. Never overwrite one that already exists. */
function mergeScripts(pkg, runner) {
  const wanted = {
    init: 'bash scripts/init.sh',
    'hooks:install':
      'git config core.hooksPath scripts/hooks && echo "hooks installed from scripts/hooks"',
    'lint:docs': 'node scripts/check-docs.mjs'
  }
  const next = { ...pkg, scripts: { ...(pkg.scripts ?? {}) } }
  const added = []
  const kept = []
  for (const [name, cmd] of Object.entries(wanted)) {
    if (next.scripts[name] && next.scripts[name] !== cmd) {
      kept.push(name)
      continue
    }
    if (next.scripts[name] === cmd) continue
    next.scripts[name] = cmd
    added.push(name)
  }
  return { next, added, kept, runner }
}

function report(plan, scriptPlan, dryRun) {
  const verb = dryRun ? 'would write' : 'writing'
  for (const item of plan) {
    if (item.skipped) console.log(`  skip   ${item.rel}  (${item.skipped})`)
    else console.log(`  ${verb.padEnd(6)} ${item.rel}`)
  }
  if (scriptPlan) {
    for (const name of scriptPlan.added) console.log(`  ${verb.padEnd(6)} package.json → scripts.${name}`)
    for (const name of scriptPlan.kept) {
      console.log(
        `  skip   package.json → scripts.${name} (already set to something else; left alone)`
      )
    }
  }
  console.log('')
}
