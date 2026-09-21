import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { buildRequest, decideFixture, defaults, questionsFor, useCaseNames } from '../dist/index.js'

const root = fileURLToPath(new URL('..', import.meta.url))

test('every catalog job builds choice, noul, and score from the shipped questions', () => {
  for (const name of useCaseNames) {
    const criteria = name === 'gate' ? { pnpm: 'lockfile', ask_user: 'undetermined' } : undefined
    const questions = questionsFor(name, criteria)
    const built = buildRequest({ state: { job: name }, questions })
    assert.equal(built.ok, true, name)
    assert.equal(built.body.questions.pick.type, 'choice')
    assert.equal(built.body.questions.determined.type, 'noul')
    assert.equal(built.body.questions.harm.type, 'score')
    const example = JSON.parse(readFileSync(`${root}/examples/${name}.request.json`, 'utf8'))
    assert.deepEqual(questionsFor(name, example.questions.pick.criteria), example.questions)
    const skill = readFileSync(`${root}/skills/jev-${name}/SKILL.md`, 'utf8')
    assert.match(skill, new RegExp(`name: jev-${name}`))
    assert.match(skill, /@aitofy\/jev-awesome-skills/)
    assert.equal(skill.includes('api.typesafe.ai'), false)
  }
})

test('the jev skill states when to use Jev, fail-open, and the same cutoffs', () => {
  const skill = readFileSync(`${root}/skills/jev-awesome-skills/SKILL.md`, 'utf8')
  assert.match(skill, /^---\nname: jev-awesome-skills\n/)
  assert.match(skill, /description:[\s\S]*Use when[\s\S]*choice[\s\S]*noul[\s\S]*score/)
  assert.match(skill, /fail open/i)
  assert.match(skill, /proceed/)
  assert.match(skill, /ask/)
  assert.match(skill, /stop/)
  assert.match(skill, /writes the code|write the code/)
  assert.match(skill, /@aitofy\/jev-awesome-skills/)
  assert.match(skill, /second client|your own (HTTP )?client/)
  assert.ok(skill.includes(String(defaults.choiceMin)))
  assert.ok(skill.includes(String(defaults.determinedMin)))
  assert.ok(skill.includes(String(defaults.riskStopAt)))
  for (const entry of readdirSync(`${root}/skills`)) {
    const text = readFileSync(`${root}/skills/${entry}/SKILL.md`, 'utf8')
    if (text.includes(String(defaults.riskStopAt)) || text.includes(String(defaults.choiceMin))) {
      assert.ok(text.includes(String(defaults.choiceMin)), entry)
      assert.ok(text.includes(String(defaults.determinedMin)), entry)
      assert.ok(text.includes(String(defaults.riskStopAt)), entry)
    }
  }
})

test('the real CLI prints the same three question types twice and no credential', () => {
  const cli = `${root}/dist/cli.js`
  const request = `${root}/examples/gate.request.json`
  const key = 'fixture-key-not-printed'
  const run = () => spawnSync(process.execPath, [cli, '--dry-run', '--file', request], {
    encoding: 'utf8',
    env: { [keyName()]: key },
  })
  const first = run()
  const second = run()
  assert.equal(first.status, 0)
  assert.equal(second.status, 0)
  assert.equal(first.stdout, second.stdout)
  assert.match(first.stdout, /"choice"/)
  assert.match(first.stdout, /"noul"/)
  assert.match(first.stdout, /"score"/)
  assert.equal(first.stdout.includes(key), false)
  assert.equal(second.stdout.includes(key), false)
  assert.equal(first.stderr.includes(key), false)
})

test('shipped fixtures are proceed, ask, and stop', () => {
  const gate = decideFixture(readJson('gate.response.json'))
  assert.equal(gate.ok, true)
  assert.equal(gate.answers.pick.choice, 'pnpm')
  assert.equal(gate.answers.pick.probabilities.pnpm, 0.97)
  assert.equal(gate.answers.determined.noul, 0.95)
  assert.equal(gate.answers.harm.score, 0.2)
  assert.equal(gate.branch, 'proceed')
  assert.equal(decideFixture(readJson('route.response.json')).branch, 'ask')
  assert.equal(decideFixture(readJson('guard.response.json')).branch, 'stop')
})

test('llms.txt indexes every skill and llms-full contains the skill text', () => {
  const index = readFileSync(`${root}/llms.txt`, 'utf8')
  const full = readFileSync(`${root}/llms-full.txt`, 'utf8')
  const names = ['jev-awesome-skills', ...useCaseNames.map((name) => `jev-${name}`)]
  for (const name of names) {
    assert.match(index, new RegExp(`skills/${name}/SKILL.md`))
    const body = readFileSync(`${root}/skills/${name}/SKILL.md`, 'utf8').trim()
    assert.ok(full.includes(body.slice(0, 120)), name)
  }
  assert.match(index, /llms-full\.txt/)
  assert.match(index, /choice/)
  assert.match(index, /noul/)
  assert.match(index, /score/)
})

function readJson(name) {
  return JSON.parse(readFileSync(`${root}/examples/${name}`, 'utf8'))
}

function keyName() {
  return 'TYPESAFE_' + 'API_KEY'
}
