import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

test('a clean install with no dist builds, imports the fixture, and runs jev', { timeout: 180000 }, () => {
  const pack = mkdtempSync(`${tmpdir()}/jev-pack-`)
  const consumer = mkdtempSync(`${tmpdir()}/jev-consumer-`)
  cpSync(root, pack, {
    recursive: true,
    filter: (source) => {
      const parts = source.split('/')
      return !parts.includes('node_modules') && !parts.includes('dist') && !parts.includes('.git')
    },
  })
  assert.throws(() => statSync(`${pack}/dist/index.js`))
  const init = spawnSync('git', ['init'], { cwd: pack, encoding: 'utf8' })
  assert.equal(init.status, 0, init.stderr)
  spawnSync('git', ['config', 'user.email', 'jev-install@example.com'], { cwd: pack })
  spawnSync('git', ['config', 'user.name', 'jev-install'], { cwd: pack })
  spawnSync('git', ['add', '-A'], { cwd: pack })
  const committed = spawnSync('git', ['commit', '-m', 'pack'], { cwd: pack, encoding: 'utf8' })
  assert.equal(committed.status, 0, committed.stderr)
  writeFileSync(`${consumer}/package.json`, JSON.stringify({ name: 'clean-consumer', private: true, type: 'module' }))
  const installed = spawnSync('npm', ['install', `git+file://${pack}`], {
    cwd: consumer,
    encoding: 'utf8',
  })
  assert.equal(installed.status, 0, installed.stderr)
  const fixture = `${consumer}/node_modules/@aitofy/jev-awesome-skills/examples/gate.response.json`
  const imported = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import { readFileSync } from 'node:fs'
    import { decideFixture } from '@aitofy/jev-awesome-skills'
    const decision = decideFixture(JSON.parse(readFileSync(${JSON.stringify(fixture)}, 'utf8')))
    if (!decision.ok) process.exit(1)
    const pick = decision.answers.pick
    const determined = decision.answers.determined
    const harm = decision.answers.harm
    if (pick.choice !== 'pnpm' || pick.probabilities.pnpm !== 0.97) process.exit(2)
    if (determined.noul !== 0.95) process.exit(3)
    if (harm.score !== 0.2) process.exit(4)
    process.stdout.write(pick.choice + ' ' + determined.noul + ' ' + harm.score + ' ' + decision.branch + '\\n')
  `], { cwd: consumer, encoding: 'utf8' })
  assert.equal(imported.status, 0, imported.stderr)
  assert.equal(imported.stdout.trim(), 'pnpm 0.95 0.2 proceed')
  const cli = spawnSync(`${consumer}/node_modules/.bin/jev`, ['--fixture', fixture], {
    cwd: consumer,
    encoding: 'utf8',
  })
  assert.equal(cli.status, 0, cli.stderr)
  assert.match(cli.stdout, /"choice": "pnpm"/)
  assert.match(cli.stdout, /"noul": 0.95/)
  assert.match(cli.stdout, /"score": 0.2/)
  assert.match(cli.stdout, /"branch": "proceed"/)
  rmSync(pack, { recursive: true, force: true })
  rmSync(consumer, { recursive: true, force: true })
})
