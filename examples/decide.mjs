import { readFileSync } from 'node:fs'
import { decideFixture } from '../dist/index.js'

const payload = JSON.parse(readFileSync(new URL('./gate.response.json', import.meta.url), 'utf8'))
const decision = decideFixture(payload)
if (!decision.ok) {
  process.stderr.write(`${decision.message}\n`)
  process.exit(1)
}
process.stdout.write(
  `${decision.answers.pick.choice} ${decision.answers.determined.noul} ${decision.answers.harm.score} ${decision.branch}\n`,
)
