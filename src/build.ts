import { defaults } from './defaults.js'
import { isRecord } from './guard.js'
import { redactState } from './redact.js'
import type { BuildResult, Json, Question } from './types.js'

export function buildRequest(input: {
  state: Json
  questions: Record<string, unknown>
  model?: string
}): BuildResult {
  const stateError = validateState(input.state)
  if (stateError) return { ok: false, error: stateError }
  const questions = validateQuestions(input.questions)
  if (!questions.ok) return questions
  const redacted = redactState(input.state)
  return {
    ok: true,
    body: {
      state: redacted.value,
      model: input.model ?? defaults.model,
      questions: questions.questions,
    },
  }
}

function validateState(state: Json): string | null {
  if (typeof state === 'string' || Array.isArray(state) || isRecord(state)) return null
  return 'State must be a string, object, or array. Jev does not accept a bare number or boolean.'
}

function validateQuestions(
  raw: Record<string, unknown>,
): { ok: true; questions: Record<string, Question> } | { ok: false; error: string } {
  if (!isRecord(raw) || Array.isArray(raw)) {
    return { ok: false, error: 'Questions must be an object keyed by the id you want back in answers.' }
  }
  const ids = Object.keys(raw)
  if (ids.length === 0) {
    return { ok: false, error: 'Questions is empty. Add at least one choice, noul, or score.' }
  }
  const questions: Record<string, Question> = {}
  for (const id of ids) {
    const parsed = validateQuestion(id, raw[id])
    if (!parsed.ok) return parsed
    questions[id] = parsed.question
  }
  return { ok: true, questions }
}

function validateQuestion(
  id: string,
  raw: unknown,
): { ok: true; question: Question } | { ok: false; error: string } {
  if (!isRecord(raw)) {
    return { ok: false, error: `Question "${id}" must be an object with type and instructions.` }
  }
  const type = raw.type
  if (type !== 'choice' && type !== 'noul' && type !== 'score') {
    return {
      ok: false,
      error: `Question "${id}" has type "${String(type)}", which is not choice, noul, or score. Use one of those three.`,
    }
  }
  const instructions = instructionsOf(id, raw.instructions)
  if (!instructions.ok) return instructions
  if (type === 'choice') return validateChoice(id, raw, instructions.value)
  if (type === 'score') return validateScore(id, raw, instructions.value)
  return { ok: true, question: { type: 'noul', instructions: instructions.value } }
}

function instructionsOf(
  id: string,
  value: unknown,
): { ok: true; value: Json } | { ok: false; error: string } {
  if (typeof value === 'string' && value.trim().length > 0) return { ok: true, value }
  if (Array.isArray(value) && value.length > 0) return { ok: true, value: value as Json }
  if (isRecord(value) && Object.keys(value).length > 0) return { ok: true, value: value as Json }
  return {
    ok: false,
    error: `Question "${id}" is missing instructions. Add an instructions string, object, or array.`,
  }
}

function validateChoice(
  id: string,
  raw: Record<string, unknown>,
  instructions: Json,
): { ok: true; question: Question } | { ok: false; error: string } {
  if (!isRecord(raw.criteria) || Object.keys(raw.criteria).length === 0) {
    return {
      ok: false,
      error: `Question "${id}" is a choice and needs a criteria object with at least one option.`,
    }
  }
  const criteria: Record<string, string | null> = {}
  for (const key of Object.keys(raw.criteria)) {
    const value = raw.criteria[key]
    if (value !== null && typeof value !== 'string') {
      return { ok: false, error: `Question "${id}" option "${key}" must be a string or null.` }
    }
    criteria[key] = value
  }
  return { ok: true, question: { type: 'choice', instructions, criteria } }
}

function validateScore(
  id: string,
  raw: Record<string, unknown>,
  instructions: Json,
): { ok: true; question: Question } | { ok: false; error: string } {
  const criteria = raw.criteria
  if (!Array.isArray(criteria) || criteria.length < 2 || criteria.length > 10) {
    return {
      ok: false,
      error: `Question "${id}" is a score and needs a criteria array of 2 to 10 level descriptions.`,
    }
  }
  const levels: string[] = []
  for (const level of criteria) {
    if (typeof level !== 'string' || level.length === 0) {
      return { ok: false, error: `Question "${id}" score levels must be non-empty strings.` }
    }
    levels.push(level)
  }
  return { ok: true, question: { type: 'score', instructions, criteria: levels } }
}
