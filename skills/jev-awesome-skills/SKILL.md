---
name: jev-awesome-skills
description: >
  Use when a coding agent must make a closed choice, noul (yes/no), or score
  judgment with TypeSafe Jev instead of guessing. Load it to proceed, ask, or
  stop; to route a skill; to guard a command; to verify a claim; to triage a
  record; to review a diff; or to pick the next legal action. Jev returns
  probabilities only. The host still writes the code and checks the result.
  Skip it for open-ended writing, or when one file or one command already
  answers the question.
---

# Jev awesome skills

Jev answers a closed question. It does not edit the repo, invent a plan, or replace a test. You write the code and check the result.

Every skill in this package runs `@aitofy/jev-awesome-skills`. Do not write a second client.

## Catalog

| Job | Skill | Use it when |
| --- | --- | --- |
| Policy | jev-awesome-skills | You need the cutoff rules below |
| Gate | jev-gate | A closed choice may already be determined by the repo |
| Route | jev-route | More than one installed skill could handle the turn |
| Guard | jev-guard | A command might destroy data, leak a secret, or leave the task |
| Verify | jev-verify | You are about to report a claim or "done" |
| Triage | jev-triage | A record needs one label |
| Review | jev-review | A diff needs ship, fix, or a person |
| Act | jev-act | The next step must be one of the actions you already listed |

## Ask

```
jev questions gate --option pnpm="pnpm-lock.yaml is present" --option ask_user="not determined"
jev --dry-run --file request.json
jev --file request.json
jev --fixture examples/gate.response.json
```

Dry-run and `--fixture` do not open a socket. A live call reads the API key from the environment variable `TYPESAFE_API_KEY`. Never print the key. Never commit it. Never ask the user to paste it into chat.

## Fail open

If the key is missing, the transport throws, or the body is not Jev answers, the command returns `"source": "fallback"` and no answer probabilities. Fail open: do not invent a probability and call it Jev. Decide yourself, or ask the user.

## Proceed, ask, or stop

Read `branch` when the answers include `pick`, `determined`, and `harm`.

- **stop** when `harm.score` is at or above **1.5**. That is the midpoint between "changes behavior but is testable" and "may destroy data, leak a secret, or go beyond the task". Stop wins. Ask the user before any command that can do that, even if the other probabilities are high.
- **proceed** when harm is below 1.5, the probability of the chosen `pick` label is at or above **0.9**, and `determined.noul` is at or above **0.9**. The context already determines the answer. Do not ask the user. Tell them what you inferred in one line.
- **ask** otherwise. The question is undetermined.

Use the probability of the chosen label, not `confidence`.

If one file or one command already answers it, proceed without calling Jev and without asking. If you already know the command can destroy data, leak a secret, or leave the task, stop for confirmation even before calling Jev.

A proceed branch is not a passing test. You still write the change and run the checks.
