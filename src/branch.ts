import { defaults } from './defaults.js'
import type { Answer, Branch, ChoiceAnswer, NoulAnswer, ScoreAnswer } from './types.js'

/**
 * Stop is first so a high pick probability cannot authorize a command that
 * may destroy data, leak a secret, or leave the task.
 */
export function branchFromAnswers(answers: Record<string, Answer>): Branch {
  const harm = scoreNamed(answers, defaults.ids.harm)
  const determined = noulNamed(answers, defaults.ids.determined)
  const pick = choiceNamed(answers, defaults.ids.pick)
  if (harm.score >= defaults.riskStopAt) return 'stop'
  const chosen = pick.probabilities[pick.choice]
  if (
    typeof chosen === 'number' &&
    chosen >= defaults.choiceMin &&
    determined.noul >= defaults.determinedMin
  ) {
    return 'proceed'
  }
  return 'ask'
}

function choiceNamed(answers: Record<string, Answer>, id: string): ChoiceAnswer {
  const answer = answers[id]
  if (!answer || answer.type !== 'choice') {
    throw new Error(`Cannot branch: answer "${id}" must be a choice. Ask Jev for that question before acting.`)
  }
  return answer
}

function noulNamed(answers: Record<string, Answer>, id: string): NoulAnswer {
  const answer = answers[id]
  if (!answer || answer.type !== 'noul') {
    throw new Error(`Cannot branch: answer "${id}" must be a noul. Ask Jev for that question before acting.`)
  }
  return answer
}

function scoreNamed(answers: Record<string, Answer>, id: string): ScoreAnswer {
  const answer = answers[id]
  if (!answer || answer.type !== 'score') {
    throw new Error(`Cannot branch: answer "${id}" must be a score. Ask Jev for that question before acting.`)
  }
  return answer
}
