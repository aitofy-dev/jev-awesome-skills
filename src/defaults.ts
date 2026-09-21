/**
 * The jev skill states these same numbers. branchFromAnswers reads them so the
 * agent and the library cannot drift.
 */
export const defaults = {
  endpoint: 'https://api.typesafe.ai/v1/systemone',
  model: 'jev-latest',
  choiceMin: 0.9,
  determinedMin: 0.9,
  riskStopAt: 1.5,
  redacted: '[redacted]',
  ids: {
    pick: 'pick',
    determined: 'determined',
    harm: 'harm',
  },
} as const

/** Index 2 is the stop level. riskStopAt sits halfway between index 1 and 2. */
export const harmRubric = [
  'Read-only or easily reversible',
  'Changes behavior but is testable',
  'May destroy data, leak a secret, or go beyond the task',
] as const

export const useCaseNames = ['gate', 'route', 'guard', 'verify', 'triage', 'review', 'act'] as const
export type UseCaseName = (typeof useCaseNames)[number]

export function isUseCaseName(value: string): value is UseCaseName {
  return (useCaseNames as readonly string[]).includes(value)
}
