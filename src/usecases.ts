import { defaults, harmRubric, type UseCaseName } from './defaults.js'
import type { Question } from './types.js'

const copy: Record<UseCaseName, { pick: string; determined: string; harm: string }> = {
  gate: {
    pick: 'Which option does the context already support?',
    determined:
      'Does the context already determine a single answer, so the host can proceed without asking the user?',
    harm: 'How much harm could following the chosen option cause?',
  },
  route: {
    pick: 'Which listed skill should handle this request?',
    determined:
      'Does the request already determine one listed skill, so the host can load it without asking the user?',
    harm: 'How much harm could loading the chosen skill cause?',
  },
  guard: {
    pick: 'What should the host do with this command?',
    determined:
      'Does the context already determine whether this command is safe to run without asking the user?',
    harm: 'How much harm could running this command cause?',
  },
  verify: {
    pick: 'Is the claim supported by the evidence?',
    determined:
      'Does the evidence already determine whether the claim is true, so the host can report it without asking the user?',
    harm: 'How much harm could reporting this claim cause if it is wrong?',
  },
  triage: {
    pick: 'Which label fits this record?',
    determined: 'Does the record already determine one label, so the host can apply it without asking the user?',
    harm: 'How much harm could applying the wrong label cause?',
  },
  review: {
    pick: 'What should happen to this change?',
    determined:
      'Does the diff and the test evidence already determine that the change is acceptable, so the host can proceed without asking the user?',
    harm: 'How much harm could accepting this change cause?',
  },
  act: {
    pick: 'Which listed action should happen next?',
    determined:
      'Does the observation already determine the next legal action, so the host can take it without asking the user?',
    harm: 'How much harm could taking the chosen action cause?',
  },
}

const presets: Record<Exclude<UseCaseName, 'gate'>, Record<string, string>> = {
  route: {
    none: 'No listed skill fits',
    ask_user: 'A person should pick the skill',
  },
  guard: {
    allow: 'The command is in scope and reversible',
    ask_user: 'A person should confirm before the command runs',
    refuse: 'The command may destroy data, leak a secret, or leave the task',
  },
  verify: {
    supported: 'The evidence shows the claim',
    unsupported: 'The evidence contradicts the claim or is missing',
    ask_user: 'A person should decide what the evidence means',
  },
  triage: {
    billing: 'Payment, invoice, refund, or subscription',
    bug: 'Something is broken',
    how_to: 'A question about how to use the product',
    other: 'Does not fit the other labels',
    ask_user: 'A person should label this record',
  },
  review: {
    ship: 'The evidence supports the change as it is',
    fix: 'The change needs a code fix before it is done',
    ask_user: 'A person should review this change',
  },
  act: {
    abstain: 'Stop and ask. Do not invent an action that was not listed.',
    reobserve: 'Look again and change nothing.',
  },
}

export function defaultCriteria(useCase: UseCaseName): Record<string, string | null> | null {
  if (useCase === 'gate') return null
  return { ...presets[useCase] }
}

export function questionsFor(
  useCase: UseCaseName,
  criteria?: Record<string, string | null>,
): Record<string, Question> {
  const labels = { ...(defaultCriteria(useCase) ?? {}), ...criteria }
  if (Object.keys(labels).length === 0) {
    throw new Error(`Use case "${useCase}" needs choice criteria. Pass at least one --option key=value.`)
  }
  const text = copy[useCase]
  return {
    [defaults.ids.pick]: { type: 'choice', instructions: text.pick, criteria: labels },
    [defaults.ids.determined]: { type: 'noul', instructions: text.determined },
    [defaults.ids.harm]: { type: 'score', instructions: text.harm, criteria: [...harmRubric] },
  }
}
