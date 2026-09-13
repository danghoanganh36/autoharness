#!/usr/bin/env node
/**
 * Smoke test: install the harness into a throwaway repository and check that
 * what lands there actually holds together.
 *
 * The three things that have to be true, and that a template edit can silently
 * break: every placeholder is rendered, the generated docs sensor passes on
 * the files the generator itself wrote, and the hook is executable.
 *
 * The second one is the interesting one. The sensor checks that no document
 * names a path that does not exist — so running it against a fresh install is
 * the templates grading themselves.
 */
import { mkdtempSync, writeFileSync, statSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { walk } from '../src/fsutil.mjs'

const cli = fileURLToPath(new URL('../bin/autoharness.mjs', import.meta.url))
const dir = mkdtempSync(join(tmpdir(), 'autoharness-smoke-'))
let failures = 0

const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures++
}

try {
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: 'smoke-subject', version: '0.0.0', scripts: { lint: 'true' } }, null, 2)
  )
  spawnSync('git', ['init', '-b', 'main', '-q'], { cwd: dir })

  const init = spawnSync('node', [cli, 'init', '--yes'], { cwd: dir, encoding: 'utf8' })
  check('init exits 0', init.status === 0, init.stderr.trim())

  const files = walk(dir).filter((f) => !f.startsWith('.git/'))
  check('files written', files.length > 15, `${files.length} files`)

  const unrendered = files
    .filter((f) => /\.(md|json|sh|yml)$/.test(f))
    .filter((f) => /\{\{[^}\n]+\}\}/.test(readFileSync(join(dir, f), 'utf8')))
  check('no unrendered placeholders', unrendered.length === 0, unrendered.join(', '))

  const mode = statSync(join(dir, 'scripts/hooks/pre-commit')).mode
  check('pre-commit is executable', Boolean(mode & 0o111), (mode & 0o777).toString(8))

  const hookSyntax = spawnSync('bash', ['-n', join(dir, 'scripts/hooks/pre-commit')], {
    encoding: 'utf8'
  })
  check('pre-commit parses', hookSyntax.status === 0, hookSyntax.stderr.trim())

  const initSyntax = spawnSync('bash', ['-n', join(dir, 'scripts/init.sh')], { encoding: 'utf8' })
  check('init.sh parses', initSyntax.status === 0, initSyntax.stderr.trim())

  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  check('harness scripts merged', Boolean(pkg.scripts['lint:docs'] && pkg.scripts.init))
  check('existing script untouched', pkg.scripts.lint === 'true')

  // The templates grading themselves: every path any generated document names
  // must exist in the repository the generator just produced.
  const sensor = spawnSync('node', ['scripts/check-docs.mjs'], { cwd: dir, encoding: 'utf8' })
  check('generated docs sensor passes', sensor.status === 0, sensor.stderr.trim())

  const doctor = spawnSync('node', [cli, 'doctor'], { cwd: dir, encoding: 'utf8' })
  // hooks:install has not been run, so doctor is expected to complain about
  // exactly that and nothing else. The first line after the banner is the
  // count, so the problems themselves start at index 1.
  const complaints = (doctor.stdout.split('[DOCTOR]')[1] ?? '')
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(1)
  check(
    'doctor finds only the uninstalled hook',
    complaints.length === 1 && complaints[0].includes('core.hooksPath') === false &&
      complaints[0].includes('scripts/hooks'),
    complaints.join(' | ')
  )

  const second = spawnSync('node', [cli, 'init', '--yes'], { cwd: dir, encoding: 'utf8' })
  check('re-running init overwrites nothing', !second.stdout.includes('writing '), second.stderr)
} finally {
  rmSync(dir, { recursive: true, force: true })
}

console.log(failures ? `\n${failures} failed\n` : '\nall good\n')
process.exit(failures ? 1 : 0)
