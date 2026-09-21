export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json }

export type ChoiceQuestion = {
  type: 'choice'
  instructions: Json
  criteria: Record<string, string | null>
}

export type NoulQuestion = {
  type: 'noul'
  instructions: Json
}

export type ScoreQuestion = {
  type: 'score'
  instructions: Json
  criteria: string[]
}

export type Question = ChoiceQuestion | NoulQuestion | ScoreQuestion

export type SystemOneRequest = {
  state: Json
  model: string
  questions: Record<string, Question>
}

export type ChoiceAnswer = {
  type: 'choice'
  choice: string
  probabilities: Record<string, number>
  confidence?: number
}

export type NoulAnswer = {
  type: 'noul'
  noul: number
}

export type ScoreAnswer = {
  type: 'score'
  score: number
  legend: Record<string, string>
  probabilities: Record<string, number>
  confidence?: number
}

export type Answer = ChoiceAnswer | NoulAnswer | ScoreAnswer

export type Branch = 'proceed' | 'ask' | 'stop'

export type FallbackReason = 'missing_api_key' | 'transport_failure' | 'not_jev_answers'

export type Judgment =
  | {
      ok: true
      source: 'jev'
      model: string
      answers: Record<string, Answer>
      branch: Branch | null
    }
  | {
      ok: false
      source: 'fallback'
      reason: FallbackReason
      message: string
    }

export type BuildSuccess = { ok: true; body: SystemOneRequest }
export type BuildFailure = { ok: false; error: string }
export type BuildResult = BuildSuccess | BuildFailure

export type ParseSuccess = { ok: true; model: string; answers: Record<string, Answer> }
export type ParseFailure = { ok: false; error: string }
export type ParseResult = ParseSuccess | ParseFailure
