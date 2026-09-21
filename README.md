# @aitofy/jev-awesome-skills

[![CI](https://github.com/aitofy-dev/jev-awesome-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/aitofy-dev/jev-awesome-skills/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Jev skills for coding agents. One client decides when to proceed, when to ask you, and when to stop — then uses that same judgment to route a skill, guard a command, verify a claim, triage a record, review a diff, or pick the next legal action.

Jev (TypeSafe System One) returns probabilities for a closed `choice`, `noul`, or `score`. It does not write the code. This package is the open-source catalog agents run, instead of a hand-rolled script per job.

## Install

```bash
npm i @aitofy/jev-awesome-skills
```

Node 20+. ESM. No runtime dependencies. The API key stays in the environment variable `TYPESAFE_API_KEY`. The CLI never prints it. Dry-run and `--fixture` need no key.

Copy the skill folders into the directory your agent already reads. Claude Code uses `~/.claude/skills/`.

```bash
cp -R skills/jev-awesome-skills skills/jev-gate skills/jev-route skills/jev-guard \
  skills/jev-verify skills/jev-triage skills/jev-review skills/jev-act \
  ~/.claude/skills/
```

Prompt you can give the agent:

```text
Install the skills in github.com/aitofy-dev/jev-awesome-skills.
Use npx @aitofy/jev-awesome-skills for every judgment. Do not write a second HTTP client.
Dry-run first. Do not call the network until I confirm.
Read the API key only from the environment. Never print it or ask me to paste it.
```

## 30 seconds, no key

```js
import { decideFixture } from '@aitofy/jev-awesome-skills'

const decision = decideFixture({
  model: 'fixture-offline',
  answers: {
    pick: { type: 'choice', choice: 'pnpm', probabilities: { pnpm: 0.97, npm: 0.03 } },
    determined: { type: 'noul', noul: 0.95 },
    harm: {
      type: 'score',
      score: 0.2,
      legend: { 0: 'reversible', 2: 'destructive' },
      probabilities: { 0: 0.8, 2: 0 },
    },
  },
})

console.log(decision.branch) // proceed
```

From a clone, after `npm run build`:

```bash
node examples/decide.mjs
jev --fixture examples/guard.response.json
```

`guard` is a stop. `route` is an ask. `gate` is a proceed. Same cutoffs, three jobs.

## How this differs

| | Chat model decides | Ad-hoc Jev script | Official TypeSafe skill | This package |
| --- | --- | --- | --- | --- |
| What you get | Prose | One curl per task | How to write a call | Seven jobs one CLI can run |
| Proceed / ask / stop | Vibes | You invent the numbers | You invent the numbers | 0.9 / 0.9 / 1.5, stop wins |
| Missing key or a bad body | n/a | Crash, or a made-up number | n/a | `source: "fallback"`, no fake probability |
| Secrets in state | Sent along | Easy to send | Your problem | Redacted before the body exists |
| Who writes code | The agent | You | The agent | The agent. Jev only returns probabilities |

## Catalog

| Skill | Job | Template |
| --- | --- | --- |
| [jev-awesome-skills](skills/jev-awesome-skills/SKILL.md) | When to call, fail open, cutoffs | — |
| [jev-gate](skills/jev-gate/SKILL.md) | The repo may already decide the choice | [gate.request.json](examples/gate.request.json) |
| [jev-route](skills/jev-route/SKILL.md) | Which installed skill to load, or none | [route.request.json](examples/route.request.json) |
| [jev-guard](skills/jev-guard/SKILL.md) | Before a command that might destroy data or leak a secret | [guard.request.json](examples/guard.request.json) |
| [jev-verify](skills/jev-verify/SKILL.md) | Before you report a claim or "done" | [verify.request.json](examples/verify.request.json) |
| [jev-triage](skills/jev-triage/SKILL.md) | One label for a record you already have | [triage.request.json](examples/triage.request.json) |
| [jev-review](skills/jev-review/SKILL.md) | Ship, fix, or ask a person. Not a merge button | [review.request.json](examples/review.request.json) |
| [jev-act](skills/jev-act/SKILL.md) | Next action from a list you observed. No invented clicks | [act.request.json](examples/act.request.json) |

`route` is how this integrates with skills you already installed. Pass their names as `--option`. This repo does not vendor them.

```bash
jev --dry-run --file examples/gate.request.json
jev questions triage
jev --file request.json
```

Live calls go to `POST https://api.typesafe.ai/v1/systemone` with model `jev-latest`. Questions in one request share one state. The host still runs tools and checks results.

## Cutoffs

Stop when `harm.score` is at or above **1.5**. Proceed when the chosen label's probability is at or above **0.9** and `determined.noul` is at or above **0.9**. Otherwise ask. Stop wins. The numbers live in one object and in [the policy skill](skills/jev-awesome-skills/SKILL.md).

Harm levels are: read-only or reversible, testable change, may destroy data or leak a secret or leave the task.

## In the wild

Other public Jev work, listed so you can see the jobs. A link is not an endorsement, a benchmark, or a star count. We have not run these repos.

| Project | What it is |
| --- | --- |
| [typesafe-ai/skills](https://github.com/typesafe-ai/skills) | Official skill for writing Jev calls |
| [wuyoscar/jev-skill](https://github.com/wuyoscar/jev-skill) | Large scenario collection for agents |
| [browser-use/jev-ultrafast](https://github.com/browser-use/jev-ultrafast) | Browser agent, Jev picks the action |
| [tamaratran/fast-jev-compaction](https://github.com/tamaratran/fast-jev-compaction) | Keep or delete history without rewriting it |
| [devagrawal09/jev-review](https://github.com/devagrawal09/jev-review) | Staged code review |
| [DevMortimer/pi-warden](https://github.com/DevMortimer/pi-warden) | Drift and unsupported "done" |
| [Dicklesworthstone/skillranker](https://github.com/Dicklesworthstone/skillranker) | Rank installed skills |
| [ShivamPansuriya/jev-skill-gate](https://github.com/ShivamPansuriya/jev-skill-gate) | Hide skills that do not fit the turn |
| [jkudish/jev-mcp](https://github.com/jkudish/jev-mcp) | Jev as MCP tools |
| [dbreunig/building-with-jev-skill](https://github.com/dbreunig/building-with-jev-skill) | Skill for designing questions |
| [Anil-matcha/awesome-jev-by-typesafe](https://github.com/Anil-matcha/awesome-jev-by-typesafe) | Project directory |

## Development

```bash
npm install
node --run test
```

MIT. No telemetry.
