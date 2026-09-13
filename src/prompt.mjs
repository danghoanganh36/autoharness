/**
 * Question and answer over node:readline. No dependency, and no cleverness:
 * a prompt library is the wrong place to spend a dependency budget that the
 * generated pre-commit hook is then told to hold.
 */
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

export async function ask(questions, { yes = false } = {}) {
  const answers = {}

  if (yes || !stdin.isTTY) {
    for (const q of questions) answers[q.key] = q.default
    return answers
  }

  const rl = createInterface({ input: stdin, output: stdout })
  try {
    for (const q of questions) {
      if (q.when && !q.when(answers)) {
        answers[q.key] = q.default
        continue
      }

      if (q.type === 'confirm') {
        const raw = (await rl.question(`  ${q.message} ${q.default ? '[Y/n] ' : '[y/N] '}`)).trim()
        answers[q.key] = raw === '' ? q.default : /^y(es)?$/i.test(raw)
        continue
      }

      const shown = q.default ? ` (${q.default})` : ''
      const raw = (await rl.question(`  ${q.message}${shown} `)).trim()
      answers[q.key] = raw || q.default
    }
  } finally {
    rl.close()
  }
  return answers
}
