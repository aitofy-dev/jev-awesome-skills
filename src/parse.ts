import { isRecord } from './guard.js'
import type { Answer, ChoiceAnswer, NoulAnswer, ParseResult, ScoreAnswer } from './types.js'

export function parseAnswers(payload: unknown): ParseResult {
  if (!isRecord(payload)) {
    return fail('Response must be a JSON object with model and answers.')
  }
  if (typeof payload.model !== 'string' || payload.model.length === 0) {
    return fail('Response is missing model. Expected a Jev model id string.')
  }
  if (!isRecord(payload.answers)) {
    return fail('Response is missing answers. Expected a map of question id to choice, noul, or score.')
  }
  const answers: Record<string, Answer> = {}
  for (const id of Object.keys(payload.answers)) {
    const parsed = parseAnswer(id, payload.answers[id])
    if (!parsed.ok) return parsed
    answers[id] = parsed.answer
  }
  if (Object.keys(answers).length === 0) {
    return fail('Response answers are empty. Expected at least one choice, noul, or score.')
  }
  return { ok: true, model: payload.model, answers }
}

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error }
}

function parseAnswer(
  id: string,
  raw: unknown,
): { ok: true; answer: Answer } | { ok: false; error: string } {
  if (!isRecord(raw)) return fail(`Answer "${id}" must be an object.`)
  if (raw.type === 'choice') return parseChoice(id, raw)
  if (raw.type === 'noul') return parseNoul(id, raw)
  if (raw.type === 'score') return parseScore(id, raw)
  return fail(`Answer "${id}" has type "${String(raw.type)}", which is not choice, noul, or score.`)
}

function parseChoice(
  id: string,
  raw: Record<string, unknown>,
): { ok: true; answer: ChoiceAnswer } | { ok: false; error: string } {
  if (typeof raw.choice !== 'string' || raw.choice.length === 0) {
    return fail(`Answer "${id}" is a choice and needs a choice string.`)
  }
  const probabilities = numberMap(id, raw.probabilities)
  if (typeof probabilities === 'string') return fail(probabilities)
  const answer: ChoiceAnswer = { type: 'choice', choice: raw.choice, probabilities }
  if (typeof raw.confidence === 'number') answer.confidence = raw.confidence
  return { ok: true, answer }
}

function parseNoul(
  id: string,
  raw: Record<string, unknown>,
): { ok: true; answer: NoulAnswer } | { ok: false; error: string } {
  if (typeof raw.noul !== 'number' || !Number.isFinite(raw.noul) || raw.noul < 0 || raw.noul > 1) {
    return fail(`Answer "${id}" is a noul and needs a probability from 0 to 1.`)
  }
  return { ok: true, answer: { type: 'noul', noul: raw.noul } }
}

function parseScore(
  id: string,
  raw: Record<string, unknown>,
): { ok: true; answer: ScoreAnswer } | { ok: false; error: string } {
  if (typeof raw.score !== 'number' || !Number.isFinite(raw.score)) {
    return fail(`Answer "${id}" is a score and needs a numeric score.`)
  }
  const legend = stringMap(id, raw.legend)
  if (typeof legend === 'string') return fail(legend)
  const probabilities = numberMap(id, raw.probabilities)
  if (typeof probabilities === 'string') return fail(probabilities)
  const answer: ScoreAnswer = { type: 'score', score: raw.score, legend, probabilities }
  if (typeof raw.confidence === 'number') answer.confidence = raw.confidence
  return { ok: true, answer }
}

function numberMap(id: string, raw: unknown): Record<string, number> | string {
  if (!isRecord(raw)) return `Answer "${id}" needs a probabilities object.`
  const next: Record<string, number> = {}
  for (const key of Object.keys(raw)) {
    const value = raw[key]
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return `Answer "${id}" probability "${key}" must be a finite number.`
    }
    next[key] = value
  }
  return next
}

function stringMap(id: string, raw: unknown): Record<string, string> | string {
  if (!isRecord(raw)) return `Answer "${id}" needs a legend object.`
  const next: Record<string, string> = {}
  for (const key of Object.keys(raw)) {
    const value = raw[key]
    if (typeof value !== 'string') return `Answer "${id}" legend "${key}" must be a string.`
    next[key] = value
  }
  return next
}
