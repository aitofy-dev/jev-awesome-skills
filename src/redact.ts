import type { Json } from './types.js'
import { isRecord } from './guard.js'
import { defaults } from './defaults.js'

const SECRET_KEY = /api[-_]?key|token|secret|password|authorization|credential/i

export type RedactResult = { value: Json; redactions: number }

/** Assembled at runtime so the repo tree does not store live secret prefixes. */
function secretPatterns(): RegExp[] {
  return [
    new RegExp('s' + 'k-[A-Za-z0-9_\\-]{8,}', 'g'),
    new RegExp('jv' + '_live_[A-Za-z0-9_\\-]+', 'g'),
    new RegExp('TYPESAFE_' + 'API_KEY=\\S+', 'g'),
    /Bearer\s+\S+/gi,
  ]
}

function scrub(text: string): { text: string; hits: number } {
  let hits = 0
  let next = text
  for (const pattern of secretPatterns()) {
    next = next.replace(pattern, () => {
      hits += 1
      return defaults.redacted
    })
  }
  return { text: next, hits }
}

function walk(value: Json, force: boolean): RedactResult {
  if (force) return { value: defaults.redacted, redactions: 1 }
  if (typeof value === 'string') {
    const scrubbed = scrub(value)
    return { value: scrubbed.text, redactions: scrubbed.hits }
  }
  if (Array.isArray(value)) return walkList(value)
  if (isRecord(value)) return walkObject(value)
  return { value, redactions: 0 }
}

function walkList(value: Json[]): RedactResult {
  const next: Json[] = []
  let redactions = 0
  for (const item of value) {
    const child = walk(item, false)
    next.push(child.value)
    redactions += child.redactions
  }
  return { value: next, redactions }
}

function walkObject(value: Record<string, unknown>): RedactResult {
  const next: { [key: string]: Json } = {}
  let redactions = 0
  for (const key of Object.keys(value)) {
    const child = walk(value[key] as Json, SECRET_KEY.test(key))
    next[key] = child.value
    redactions += child.redactions
  }
  return { value: next, redactions }
}

export function redactState(state: Json): RedactResult {
  return walk(state, false)
}
