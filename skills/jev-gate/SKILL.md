---
name: jev-gate
description: >
  Use when a closed choice may already be determined by the repo, such as
  package manager, test runner, or file location, and you must proceed, ask
  the user, or stop. Runs @aitofy/jev-awesome-skills. Not for open-ended design.
---

# Gate

You own the options. Jev only says which listed option the context supports.

1. Read the files that could decide the choice. If one of them already settles it, proceed and do not call Jev.
2. Otherwise build the question with every real option plus `ask_user`:

```
jev questions gate --option pnpm="pnpm-lock.yaml is present" --option ask_user="the lockfile does not decide"
```

3. Put the evidence in `state`. Run `jev --dry-run --file request.json`, then `jev --file request.json` from `@aitofy/jev-awesome-skills`. Do not write a second client.
4. Apply `branch`. Stop when `harm.score` is at or above 1.5. Proceed when the chosen label's probability is at or above 0.9 and `determined.noul` is at or above 0.9. Otherwise ask. Stop wins.
5. On `"source": "fallback"`, fail open. Do not invent a probability.

Template: `examples/gate.request.json`. Offline sample: `examples/gate.response.json` returns proceed for pnpm.
