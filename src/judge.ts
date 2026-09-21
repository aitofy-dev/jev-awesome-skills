import { branchFromAnswers } from './branch.js'
import { buildRequest } from './build.js'
import { defaults } from './defaults.js'
import { parseAnswers } from './parse.js'
import type { Answer, Branch, Json, Judgment, SystemOneRequest } from './types.js'

export type Transport = (request: {
  url: string
  body: SystemOneRequest
  apiKey: string
}) => Promise<unknown>

const ENV_KEY = 'TYPESAFE_' + 'API_KEY'

export function readApiKey(env: Record<string, string | undefined>): string | undefined {
  const value = env[ENV_KEY]
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export async function judge(
  input: { state: Json; questions: Record<string, unknown>; model?: string },
  options?: { transport?: Transport; env?: Record<string, string | undefined> },
): Promise<Judgment> {
  const built = buildRequest(input)
  if (!built.ok) throw new Error(built.error)
  const env = options?.env ?? process.env
  const apiKey = readApiKey(env)
  if (!apiKey) {
    return fallback(
      'missing_api_key',
      'API key is missing. Export it in the environment to call Jev, or continue without a Jev answer.',
    )
  }
  const transport = options?.transport ?? postSystemOne
  try {
    const payload = await transport({ url: defaults.endpoint, body: built.body, apiKey })
    return judgmentFromPayload(payload)
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'transport error'
    return fallback('transport_failure', `Jev request failed (${scrub(detail, apiKey)}). Continue without a Jev answer.`)
  }
}

export function decideFixture(payload: unknown): Judgment {
  return judgmentFromPayload(payload)
}

export async function postSystemOne(request: {
  url: string
  body: SystemOneRequest
  apiKey: string
}): Promise<unknown> {
  const response = await fetch(request.url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${request.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(request.body),
  })
  return readBody(response)
}

function judgmentFromPayload(payload: unknown): Judgment {
  const parsed = parseAnswers(payload)
  if (!parsed.ok) {
    return fallback('not_jev_answers', `Response is not Jev answers (${parsed.error}). Continue without a Jev answer.`)
  }
  return {
    ok: true,
    source: 'jev',
    model: parsed.model,
    answers: parsed.answers,
    branch: policyBranch(parsed.answers),
  }
}

function policyBranch(answers: Record<string, Answer>): Branch | null {
  const pick = answers[defaults.ids.pick]
  const determined = answers[defaults.ids.determined]
  const harm = answers[defaults.ids.harm]
  if (!pick || !determined || !harm) return null
  if (pick.type !== 'choice' || determined.type !== 'noul' || harm.type !== 'score') return null
  return branchFromAnswers(answers)
}

function fallback(
  reason: 'missing_api_key' | 'transport_failure' | 'not_jev_answers',
  message: string,
): Judgment {
  return { ok: false, source: 'fallback', reason, message }
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (text.trim() === '') return { status: response.status }
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { status: response.status }
  }
}

function scrub(text: string, secret: string): string {
  return text.split(secret).join(defaults.redacted)
}
