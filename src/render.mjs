/**
 * The whole template language.
 *
 *   {{KEY}}                     substitution
 *   {{#if KEY}} ... {{/if KEY}} keep the block when KEY is truthy
 *
 * It stops there. A template language grows until it is a programming
 * language, and the point of these templates is that a person can read one
 * and see exactly what will land in their repository.
 *
 * An unrendered placeholder is a hard error rather than a stray `{{X}}` in
 * someone's AGENTS.md: a guide that names something that does not exist is
 * the exact failure the docs sensor downstream exists to prevent.
 */
export function render(text, vars) {
  let out = text.replace(
    /\{\{#if ([A-Z0-9_]+)\}\}\n?([\s\S]*?)\{\{\/if \1\}\}\n?/g,
    (_, key, body) => (vars[key] ? body : '')
  )

  out = out.replace(/\{\{([A-Z0-9_]+)\}\}/g, (whole, key) => {
    if (!(key in vars)) throw new Error(`template placeholder ${whole} has no value`)
    return String(vars[key])
  })

  const leftover = out.match(/\{\{[^}\n]+\}\}/)
  if (leftover) throw new Error(`unrendered placeholder ${leftover[0]}`)

  // Conditional blocks leave runs of blank lines behind. Collapse them, so a
  // project that answered "no" to half the gates still gets a readable file.
  return out.replace(/\n{3,}/g, '\n\n')
}
