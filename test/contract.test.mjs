import assert from 'node:assert/strict'
import test from 'node:test'
import { branchFromAnswers, buildRequest, decideFixture, defaults, judge, parseAnswers, questionsFor, redactState } from '../dist/index.js'

globalThis.fetch = () => {
  throw new Error('network')
}

const gate = questionsFor('gate', { pnpm: 'lockfile', npm: null, ask_user: 'undetermined' })

test('builds choice, noul, and score without calling the network', () => {
  const built = buildRequest({ state: 'pnpm-lock.yaml is present', questions: gate })
  assert.equal(built.ok, true)
  assert.equal(built.body.model, defaults.model)
  assert.equal(built.body.questions.pick.type, 'choice')
  assert.equal(built.body.questions.determined.type, 'noul')
  assert.equal(built.body.questions.harm.type, 'score')
  assert.equal(built.body.questions.harm.criteria.length, 3)
})

test('rejects a question that is not choice, noul, or score', () => {
  const built = buildRequest({
    state: 'ticket',
    questions: { rank: { type: 'rank', instructions: 'Rank this' } },
  })
  assert.equal(built.ok, false)
  assert.match(built.error, /choice, noul, or score/)
  assert.equal(Object.hasOwn(built, 'body'), false)
})

test('rejects a question that omits instructions or choice criteria', () => {
  const missing = buildRequest({
    state: 'ticket',
    questions: { pick: { type: 'choice', criteria: { a: 'b' } } },
  })
  assert.equal(missing.ok, false)
  assert.match(missing.error, /missing instructions/)
  const bare = buildRequest({
    state: 'ticket',
    questions: { pick: { type: 'choice', instructions: 'Which?' } },
  })
  assert.equal(bare.ok, false)
  assert.match(bare.error, /criteria object/)
  const short = buildRequest({
    state: 'ticket',
    questions: { harm: { type: 'score', instructions: 'How bad?', criteria: ['only one'] } },
  })
  assert.equal(short.ok, false)
  assert.match(short.error, /2 to 10/)
})

test('parses choice, noul, and score under the same ids', () => {
  const parsed = parseAnswers(fixtureBody())
  assert.equal(parsed.ok, true)
  assert.equal(parsed.answers.pick.choice, 'pnpm')
  assert.equal(parsed.answers.pick.probabilities.pnpm, 0.97)
  assert.equal(parsed.answers.determined.noul, 0.95)
  assert.equal(parsed.answers.harm.score, 0.2)
  assert.equal(parsed.answers.harm.legend['2'], 'high')
})

test('rejects an answer that is not a Jev answer', () => {
  const parsed = parseAnswers({ model: 'jev-latest', answers: { note: { type: 'essay', text: 'hi' } } })
  assert.equal(parsed.ok, false)
  assert.match(parsed.error, /not choice, noul, or score/)
  const range = parseAnswers({ model: 'jev-latest', answers: { determined: { type: 'noul', noul: 1.2 } } })
  assert.equal(range.ok, false)
  assert.match(range.error, /0 to 1/)
})

test('redacts a secret-shaped state field before the outbound body exists', () => {
  const secret = ['s', 'k-'].join('') + 'abcdefghijklmnop'
  const live = ['jv', '_live_'].join('') + 'abcdefghijklmnop'
  const assignment = ['TYPESAFE_', 'API_KEY='].join('') + 'super-secret'
  const state = {
    note: `prefix ${secret} ${live} ${assignment} suffix`,
    apiKey: 'shown-if-not-redacted',
    nested: { password: 'shown-if-not-redacted' },
  }
  const built = buildRequest({ state, questions: questionsFor('guard') })
  assert.equal(built.ok, true)
  const encoded = JSON.stringify(built.body)
  assert.equal(encoded.includes(secret), false)
  assert.equal(encoded.includes(live), false)
  assert.equal(encoded.includes('super-secret'), false)
  assert.equal(encoded.includes('shown-if-not-redacted'), false)
  assert.match(encoded, /\[redacted\]/)
  assert.equal(state.apiKey, 'shown-if-not-redacted')
  const direct = redactState(state)
  assert.ok(direct.redactions >= 3)
})

test('branches at the skill cutoffs', () => {
  const { choiceMin, determinedMin, riskStopAt } = defaults
  assert.equal(branchFromAnswers(policy({ choiceP: choiceMin, noul: determinedMin, score: 0 })), 'proceed')
  assert.equal(branchFromAnswers(policy({ choiceP: choiceMin - 0.01, noul: determinedMin, score: 0 })), 'ask')
  assert.equal(branchFromAnswers(policy({ choiceP: choiceMin, noul: determinedMin - 0.01, score: 0 })), 'ask')
  assert.equal(branchFromAnswers(policy({ choiceP: 1, noul: 1, score: riskStopAt })), 'stop')
  assert.equal(branchFromAnswers(policy({ choiceP: 1, noul: 1, score: riskStopAt - 0.01 })), 'proceed')
})

test('fails open when the key is missing and does not call transport', async () => {
  let called = false
  const result = await judge(
    { state: 'ticket', questions: gate },
    { env: {}, transport: async () => { called = true; return fixtureBody() } },
  )
  assert.equal(called, false)
  assert.equal(result.ok, false)
  assert.equal(result.source, 'fallback')
  assert.equal(result.reason, 'missing_api_key')
  assert.equal(Object.hasOwn(result, 'answers'), false)
  assert.equal(JSON.stringify(result).includes('probabilities'), false)
})

test('fails open when transport throws', async () => {
  const result = await judge(
    { state: 'ticket', questions: gate },
    { env: keyEnv(), transport: async () => { throw new Error('socket hang up ' + keyEnv()[keyName()]) } },
  )
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'transport_failure')
  assert.equal(Object.hasOwn(result, 'answers'), false)
  assert.equal(JSON.stringify(result).includes(keyEnv()[keyName()]), false)
})

test('fails open when the body is not Jev answers', async () => {
  const result = await judge(
    { state: 'ticket', questions: gate },
    { env: keyEnv(), transport: async () => ({ hello: 'world' }) },
  )
  assert.equal(result.ok, false)
  assert.equal(result.source, 'fallback')
  assert.equal(result.reason, 'not_jev_answers')
  assert.equal(Object.hasOwn(result, 'answers'), false)
})

test('a bad question fails at the boundary before transport', async () => {
  let called = false
  await assert.rejects(
    () => judge(
      { state: 'ticket', questions: { rank: { type: 'rank', instructions: 'nope' } } },
      { env: keyEnv(), transport: async () => { called = true; return {} } },
    ),
    /choice, noul, or score/,
  )
  assert.equal(called, false)
})

test('decideFixture returns the fixture choice, noul, score, and branch', () => {
  const decision = decideFixture(fixtureBody())
  assert.equal(decision.ok, true)
  assert.equal(decision.source, 'jev')
  assert.equal(decision.answers.pick.choice, 'pnpm')
  assert.equal(decision.answers.determined.noul, 0.95)
  assert.equal(decision.answers.harm.score, 0.2)
  assert.equal(decision.branch, 'proceed')
})

function fixtureBody() {
  return {
    model: 'fixture-offline',
    answers: {
      pick: { type: 'choice', choice: 'pnpm', probabilities: { pnpm: 0.97, npm: 0.02, ask_user: 0.01 } },
      determined: { type: 'noul', noul: 0.95 },
      harm: {
        type: 'score',
        score: 0.2,
        legend: { 0: 'low', 1: 'mid', 2: 'high' },
        probabilities: { 0: 0.8, 1: 0.2, 2: 0 },
      },
    },
  }
}

function policy({ choiceP, noul, score }) {
  return {
    pick: { type: 'choice', choice: 'pnpm', probabilities: { pnpm: choiceP, npm: 1 - choiceP } },
    determined: { type: 'noul', noul },
    harm: { type: 'score', score, legend: { 0: 'low', 1: 'mid', 2: 'high' }, probabilities: { 0: 1 } },
  }
}

function keyName() {
  return 'TYPESAFE_' + 'API_KEY'
}

function keyEnv() {
  return { [keyName()]: 'fixture-key-not-printed' }
}
