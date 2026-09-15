#!/usr/bin/env node
/**
 * Docs path sensor.
 *
 * Every repository path a document points at must exist. A guide naming a file
 * that is not there sends every later session the wrong way.
 *
 * Deliberately narrow. A sensor that mostly cries wolf gets ignored, which is
 * worse than no sensor. So a backticked token is treated as a path claim only
 * when it contains a slash and looks like a file or a directory; bare
 * filenames like `index.ts` are skipped, because they name a symbol as often
 * as a location. Each token is resolved against the document's own directory
 * first, then the repository root.
 *
 * A document whose paths are relative to a workspace declares it once, at the
 * top:  <!-- paths-relative-to: apps/web, apps/web/src -->
 *
 * It also checks three claims that prose makes about the repository's own
 * tooling — see checkGateCoverage, checkDeniedCapabilities and
 * checkPendingClaims. Those exist because a path check verifies that files
 * exist, not that a sentence about the repository is still true, and a stale
 * sentence in AGENTS.md is read by every session.
 *
 * Skipped: anything under SKIP_DOC, anything in a generated directory, and any
 * path git ignores. That last one matters: a gitignored path is not a claim
 * about what the repository contains, so checking it against a clean checkout
 * is checking the wrong thing — and running only where those files happen to
 * exist is how the gap goes unnoticed until CI runs somewhere clean.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve, relative } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')

/** Directories never walked for documents. */
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'out',
  'build',
  'release',
  'coverage',
  'playwright-report',
  'test-results'
])

/**
 * Documents exempt from the path check. Aspirational designs and quoted
 * outside material describe repositories that are not this one.
 */
const SKIP_DOC = (rel) =>
  rel.startsWith('docs/vision/') ||
  rel.startsWith('docs/research/') ||
  rel === 'docs/harness/verification/review.md' ||
  /Guide\.md$/.test(rel)

/** Directories whose contents are generated, so a path into them proves nothing. */
const GENERATED =
  /^(\.\.\/)?(node_modules|out|dist|build|release|coverage|test-results|playwright-report|\.next)\//

function walk(dir, hits = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, hits)
    else if (name.endsWith('.md')) hits.push(full)
  }
  return hits
}

function isPathClaim(token) {
  if (!token.includes('/')) return false // bare filename: ambiguous, skip
  if (token.startsWith('/')) return false // an HTTP route, not a repo path
  if (/\s|[*?<>|$(){}[\]…]/.test(token)) return false
  if (/:\/\/|^https?:|^@|^ws:|^wss:|^file:/.test(token)) return false
  if (/^\.\/[^/]+$/.test(token)) return false // `./certs` — compose mount syntax
  if (GENERATED.test(token) || token.includes('/node_modules/')) return false
  // Must look like a file or a directory. `library/image-name` is a Docker
  // image, not a path, and has neither an extension nor a trailing slash.
  if (!/\.[A-Za-z0-9]+$/.test(token) && !token.endsWith('/')) return false
  return true
}

/** `<!-- paths-relative-to: a, b -->` at the top of a document. */
function basesFor(text) {
  const m = text.match(/<!--\s*paths-relative-to:\s*([^>]+?)\s*-->/)
  return m
    ? m[1]
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
    : []
}

const files = walk(root)
const candidates = []

for (const file of files) {
  const rel = relative(root, file)
  if (SKIP_DOC(rel)) continue
  const text = readFileSync(file, 'utf8')
  const here = dirname(file)
  const bases = basesFor(text)

  for (const m of text.matchAll(/\]\(((?:\.\/|\.\.\/)[^)#\s]+)(#[^)]*)?\)/g)) {
    if (!existsSync(resolve(here, m[1]))) {
      candidates.push({
        path: relative(root, resolve(here, m[1])),
        message: `${rel}: link -> ${m[1]}`
      })
    }
  }

  for (const m of text.matchAll(/`([^`\n]+)`/g)) {
    const token = m[1].replace(/[.,;:]$/, '').replace(/\/$/, '')
    if (!isPathClaim(token)) continue
    if (existsSync(resolve(here, token))) continue // relative to the document
    if (existsSync(join(root, token))) continue // relative to the repo root
    if (bases.some((b) => existsSync(join(root, b, token)))) continue
    candidates.push({ path: token, message: `${rel}: path -> ${m[1]}` })
  }
}

/**
 * Drop anything git ignores. One batch call: `git check-ignore` exits 1 when
 * nothing matches, which is a normal answer here, not an error.
 */
function withoutIgnored(entries) {
  if (!entries.length) return entries
  const out = spawnSync('git', ['check-ignore', '--stdin'], {
    cwd: root,
    input: entries.map((e) => e.path).join('\n'),
    encoding: 'utf8'
  })
  if (out.error) return entries // no git available: report everything
  const ignored = new Set(
    out.stdout
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
  )
  return entries.filter((e) => !ignored.has(e.path))
}

/**
 * A "gate" is a script with at most one colon: typecheck, lint, lint:arch,
 * test:e2e. Deeper names (test:e2e:report) are helpers, not gates, and
 * demanding they be documented would be the noise that gets a check disabled.
 */
const GATE = /^(typecheck|lint|test|build|format)(:[a-z0-9-]+)?$/

function scripts() {
  return JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts ?? {}
}
function hasScript(name) {
  return Boolean(scripts()[name])
}

/** Every gate must be named in the Sensors section of AGENTS.md. */
function checkGateCoverage() {
  const found = []
  const agentsPath = join(root, 'AGENTS.md')
  if (!existsSync(agentsPath)) return found
  const agents = readFileSync(agentsPath, 'utf8')
  const from = agents.indexOf('## Sensors')
  if (from === -1) {
    return [
      { path: 'AGENTS.md', message: 'AGENTS.md: no "## Sensors" section to check gates against' }
    ]
  }
  const next = agents.indexOf('\n## ', from + 1)
  const section = agents.slice(from, next === -1 ? undefined : next)

  for (const name of Object.keys(scripts()).filter((n) => GATE.test(n))) {
    const mentioned = /(npm run|pnpm|yarn|npm) /.test(section) && section.includes(` ${name}\``)
    if (!mentioned) {
      found.push({
        path: 'AGENTS.md',
        message:
          `AGENTS.md: gate \`${name}\` exists in package.json but is not in the Sensors ` +
          `section. An agent runs what it is told about.`
      })
    }
  }
  return found
}

/**
 * Prose that denies a capability the repository actually has. Deliberately a
 * short hand-written map rather than a clever regex: a loose one would fire on
 * every past-tense sentence in the repository.
 *
 * Only files that describe the present are checked. state/, gap-analysis.md and
 * effectiveness.md are logs and changelogs — "there was no formatter" is true there and must stay
 * sayable.
 */
const CAPABILITY_CLAIMS = [
  ['formatter', () => hasScript('format') || hasScript('format:check')],
  ['linter', () => hasScript('lint')],
  ['coverage gate', () => hasScript('test:coverage')],
  ['unit test runner', () => hasScript('test')],
  ['architecture policy', () => hasScript('lint:arch')],
  ['secret scanner', () => existsSync(join(root, 'scripts/hooks/pre-commit'))]
]

const PRESENT_TENSE_DOCS = [
  'AGENTS.md',
  'docs/harness/README.md',
  'docs/harness/instructions/README.md',
  'docs/harness/verification/README.md'
]

function checkDeniedCapabilities() {
  const found = []
  for (const rel of PRESENT_TENSE_DOCS) {
    const file = join(root, rel)
    if (!existsSync(file)) continue
    // Code spans are quotation, not assertion. A doc must be able to record
    // that AGENTS.md once said `there is no formatter` without being accused
    // of saying it — otherwise the only way to document a stale claim is to
    // paraphrase it, and the record gets worse to protect the checker.
    const text = readFileSync(file, 'utf8').replace(/`[^`]*`/g, ' ')
    for (const [phrase, exists] of CAPABILITY_CLAIMS) {
      if (!exists()) continue
      const denial = new RegExp(`\\b(no|not present|without)\\b[^.\n]{0,60}\\b${phrase}\\b`, 'i')
      if (denial.test(text)) {
        found.push({
          path: rel,
          message: `${rel}: says there is no ${phrase}, but the repo has one. Update the sentence.`
        })
      }
    }
  }
  return found
}

/**
 * A present-tense doc calling a feature id pending when features.json says it
 * passes. Narrow on purpose: the line must both name the id and carry a
 * pending word, so a sentence that merely mentions H04 is left alone.
 */
const PENDING_WORD = /\b(yet|target for|planned|deferred|missing|would be|nothing)\b/i
const FEATURES = join(root, 'docs/harness/scope/features.json')

function checkPendingClaims() {
  const found = []
  if (!existsSync(FEATURES)) return found
  const { features } = JSON.parse(readFileSync(FEATURES, 'utf8'))
  const passing = new Set(features.filter((f) => f.state === 'passing').map((f) => f.id))

  for (const rel of PRESENT_TENSE_DOCS) {
    const file = join(root, rel)
    if (!existsSync(file)) continue
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((rawLine, i) => {
        const line = rawLine.replace(/`[^`]*`/g, ' ')
        const ids = line.match(/\bH\d{2}\b/g)
        if (!ids || !PENDING_WORD.test(line)) return
        for (const id of ids) {
          if (passing.has(id)) {
            found.push({
              path: rel,
              message: `${rel}:${i + 1}: describes ${id} as pending, but features.json says it passes`
            })
          }
        }
      })
  }
  return found
}

/**
 * gap-analysis.md holds the reasoning for each feature id; features.json holds
 * the state. Headings there are present-tense claims sitting in a file
 * otherwise full of history, so the headings, and only the headings, are
 * checked: a passing id must carry a tick. The prose below each heading stays
 * free to describe what was wrong.
 */
function checkGapAnalysisHeadings() {
  const found = []
  const rel = 'docs/harness/scope/gap-analysis.md'
  const file = join(root, rel)
  if (!existsSync(file) || !existsSync(FEATURES)) return found

  const { features } = JSON.parse(readFileSync(FEATURES, 'utf8'))
  const state = new Map(features.map((f) => [f.id, f.state]))

  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      const m = line.match(/^### (H\d{2})\b(.*)$/)
      if (!m) return
      const [, id, rest] = m
      const passes = state.get(id) === 'passing'
      const ticked = rest.includes('✅')
      if (passes && !ticked) {
        found.push(
          `${rel}:${i + 1}: ${id} passes in features.json but its heading still reads as open`
        )
      }
      if (!passes && ticked) {
        found.push(
          `${rel}:${i + 1}: ${id} is ticked here but features.json says ${state.get(id) ?? 'nothing'}`
        )
      }
    })
  return found
}

const problems = [
  ...withoutIgnored(candidates).map((c) => c.message),
  ...checkGapAnalysisHeadings(),
  ...checkGateCoverage().map((c) => c.message),
  ...checkDeniedCapabilities().map((c) => c.message),
  ...checkPendingClaims().map((c) => c.message)
]

if (problems.length) {
  console.error(`[SENSOR] docs paths — ${problems.length} broken\n`)
  for (const p of problems) console.error('  ' + p)
  console.error('\nFIX: update the document — or the path, gate, or capability it')
  console.error('     names. A document that describes a repo it no longer matches')
  console.error('     sends every later session the wrong way.')
  process.exit(1)
}
console.log(`docs paths OK — ${files.length} markdown files scanned`)
