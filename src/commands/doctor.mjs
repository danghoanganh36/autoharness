/**
 * doctor — report which harness controls are present and wired.
 *
 * A harness decays the same way documentation does: quietly. A file gets
 * deleted, a hook stops being installed after a fresh clone, a gate is added
 * to package.json and never reaches AGENTS.md. None of that fails anything,
 * which is exactly why it needs a command that looks.
 *
 * It reports. It does not fix: a tool that silently repairs a harness teaches
 * nobody why the harness was broken.
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { readJson } from '../fsutil.mjs'

const SUBSYSTEMS = [
  ['📋 Instructions', 'AGENTS.md'],
  ['📋 Instructions', 'docs/harness/instructions/README.md'],
  ['💾 State', 'docs/harness/state/progress.md'],
  ['💾 State', 'docs/harness/state/decisions.md'],
  ['✅ Verification', 'docs/harness/verification/README.md'],
  ['✅ Verification', 'scripts/check-docs.mjs'],
  ['🎯 Scope', 'docs/harness/scope/features.json'],
  ['🔄 Lifecycle', 'scripts/init.sh'],
  ['🔁 Steering', 'docs/harness/steering/README.md']
]

const GATE = /^(typecheck|lint|test|build|format)(:[a-z0-9-]+)?$/

export async function run() {
  const root = process.cwd()
  const problems = []
  const notes = []

  console.log(`\nautoharness doctor — ${root}\n`)

  console.log('  Subsystems')
  for (const [subsystem, rel] of SUBSYSTEMS) {
    const ok = existsSync(join(root, rel))
    if (!ok) problems.push(`missing ${rel} — ${subsystem} is not installed`)
    console.log(`    ${ok ? '✓' : '✗'} ${subsystem.padEnd(18)} ${rel}`)
  }

  console.log('\n  Hooks')
  const hook = join(root, 'scripts/hooks/pre-commit')
  if (!existsSync(hook)) {
    problems.push('scripts/hooks/pre-commit is missing')
    console.log('    ✗ pre-commit hook file')
  } else {
    console.log('    ✓ pre-commit hook file')
    // 0644 is the default writeFileSync mode, and a hook without the execute
    // bit does not run — silently. That is the worst kind of missing gate.
    const executable = Boolean(statSync(hook).mode & 0o111)
    console.log(`    ${executable ? '✓' : '✗'} executable`)
    if (!executable) problems.push('scripts/hooks/pre-commit is not executable — chmod +x it')
  }

  const configured = spawnSync('git', ['config', '--get', 'core.hooksPath'], {
    cwd: root,
    encoding: 'utf8'
  })
  const path = configured.stdout.trim()
  const wired = path === 'scripts/hooks'
  console.log(`    ${wired ? '✓' : '✗'} core.hooksPath${path ? ` = ${path}` : ' is not set'}`)
  if (!wired) problems.push('git is not using scripts/hooks — run the hooks:install script')

  console.log('\n  Gates')
  const pkg = readJson(join(root, 'package.json'), {})
  const scripts = pkg.scripts ?? {}
  const gates = Object.keys(scripts).filter((n) => GATE.test(n))
  if (!gates.length) notes.push('no gate scripts in package.json — every sensor here is manual')

  const agents = existsSync(join(root, 'AGENTS.md'))
    ? readFileSync(join(root, 'AGENTS.md'), 'utf8')
    : ''
  const from = agents.indexOf('## Sensors')
  const section = from === -1 ? '' : agents.slice(from, indexAfter(agents, from))

  for (const name of gates) {
    const documented = section.includes(` ${name}\``)
    console.log(`    ${documented ? '✓' : '✗'} ${name}`)
    if (!documented) {
      problems.push(
        `gate \`${name}\` is in package.json but not in the Sensors section of AGENTS.md — ` +
          `an agent runs what it is told about`
      )
    }
  }
  if (from === -1 && agents) problems.push('AGENTS.md has no "## Sensors" section')

  console.log('\n  Scope')
  const features = readJson(join(root, 'docs/harness/scope/features.json'))
  if (!features) {
    console.log('    ✗ features.json unreadable or missing')
  } else {
    const list = features.features ?? []
    const active = list.filter((f) => f.state === 'active')
    const open = list.filter((f) => f.state !== 'passing')
    console.log(`    ${list.length} entries, ${open.length} open, ${active.length} active`)
    if (active.length > 1) {
      problems.push(`WIP = 1 is violated: ${active.map((f) => f.id).join(', ')} are all active`)
    }
    for (const f of list) {
      if (f.state === 'passing' && !f.evidence) {
        problems.push(`${f.id} is passing with no evidence — passing means a command was green`)
      }
    }
  }

  if (notes.length) {
    console.log('\n  Notes')
    for (const n of notes) console.log(`    · ${n}`)
  }

  if (!problems.length) {
    console.log('\n  No problems found.\n')
    return
  }

  console.log(`\n[DOCTOR] ${problems.length} problem${problems.length > 1 ? 's' : ''}\n`)
  for (const p of problems) console.log('  ' + p)
  console.log('')
  process.exitCode = 1
}

function indexAfter(text, from) {
  const next = text.indexOf('\n## ', from + 1)
  return next === -1 ? undefined : next
}
