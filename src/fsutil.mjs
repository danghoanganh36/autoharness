import {
  readdirSync,
  readFileSync,
  statSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  chmodSync
} from 'node:fs'
import { join, dirname, relative } from 'node:path'

/** Every file under `dir`, as paths relative to it. */
export function walk(dir, base = dir, hits = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, base, hits)
    else hits.push(relative(base, full))
  }
  return hits
}

/**
 * Write, creating parents. Mode matters: writeFileSync defaults to 0644, and a
 * pre-commit hook without the execute bit does not run — silently. That is the
 * worst kind of missing gate, so the mode is passed explicitly for scripts.
 */
export function writeFile(path, content, mode) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
  if (mode) chmodSync(path, mode)
}

export function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return fallback
  }
}
