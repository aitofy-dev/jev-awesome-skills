import { writeFileSync } from 'node:fs'
import { questionsFor, defaults } from '../dist/index.js'

const jobs = [
  {
    name: 'gate',
    criteria: {
      pnpm: 'pnpm-lock.yaml is present',
      npm: 'package-lock.json is present',
      ask_user: 'the lockfile does not decide',
    },
    state: {
      task: 'Add a test script',
      evidence: [
        'pnpm-lock.yaml is present',
        'package-lock.json is absent',
        'package.json packageManager is pnpm@9',
      ],
    },
  },
  {
    name: 'route',
    criteria: {
      'repo-review': 'Inspect the diff and report file-backed findings',
      'test-writer': 'Add or fix tests for this change',
    },
    state: {
      request: 'Review the diff for security issues and do not change files',
      installed: ['repo-review', 'test-writer', 'release'],
    },
  },
  {
    name: 'guard',
    state: {
      task: 'Remove the unused cache directory in this workspace',
      command: 'rm -rf .cache',
      cwd: '/workspace/app',
    },
  },
  {
    name: 'verify',
    state: {
      claim: 'The login bug is fixed',
      evidence: ['The login test failed before the patch and passed after'],
      missing: ['No other suite was run'],
    },
  },
  {
    name: 'triage',
    state: {
      record: 'The export button errors for every teammate. We need the monthly report tomorrow.',
    },
  },
  {
    name: 'review',
    state: {
      goal: 'Make the parser accept quoted commas without weakening the regression test',
      diff: 'test_parser.py replaced assert parse(row) == expected with assert True',
      receipt: 'Only the edited test was run',
    },
  },
  {
    name: 'act',
    criteria: {
      click_appearance: 'The Appearance row is visible in the Settings sidebar',
    },
    state: {
      goal: 'Open Settings and select Appearance',
      observed: ['Settings window is open', 'Appearance row is visible'],
      not_observed: ['A click coordinate was not measured by this package'],
    },
  },
]

for (const job of jobs) {
  const questions = questionsFor(job.name, job.criteria)
  const body = { state: job.state, model: defaults.model, questions }
  writeFileSync(new URL(`../examples/${job.name}.request.json`, import.meta.url), `${JSON.stringify(body, null, 2)}\n`)
}
