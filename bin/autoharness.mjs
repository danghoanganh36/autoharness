#!/usr/bin/env node
/**
 * autoharness — installs a harness into a repository.
 *
 * Zero dependencies on purpose. The pre-commit hook this tool installs refuses
 * to run a check whose tooling is missing; a scaffolder that needed its own
 * dependency tree to start would hold a lower standard than what it ships.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { argv, exit } from 'node:process'

const COMMANDS = {
  init: () => import('../src/commands/init.mjs'),
  doctor: () => import('../src/commands/doctor.mjs')
}

const USAGE = `
autoharness — harness engineering scaffolding

  autoharness init     install the harness into the current directory
  autoharness doctor   report which harness controls are present and wired

Options
  --yes        accept every default, ask nothing
  --dry-run    print what would be written, write nothing
  --force      overwrite files that already exist
  --version    print the version
`

const [, , name = '', ...rest] = argv

if (name === '--version' || name === '-v') {
  const pkg = fileURLToPath(new URL('../package.json', import.meta.url))
  console.log(JSON.parse(readFileSync(pkg, 'utf8')).version)
  exit(0)
}

if (!COMMANDS[name]) {
  console.error(USAGE)
  exit(name ? 1 : 0)
}

try {
  const mod = await COMMANDS[name]()
  await mod.run(rest)
} catch (err) {
  console.error(`\n[autoharness] ${err.message}\n`)
  exit(1)
}
