---
name: jev-guard
description: >
  Use before running a shell command that might delete data, print a secret,
  force-push, or do something the user did not ask for. Jev scores the harm.
  You still decide whether to run it. Runs @aitofy/jev-awesome-skills.
---

# Guard

If you already know the command can destroy data, leak a secret, or leave the task, stop and ask the user. Do not use Jev to talk yourself into it.

Otherwise put the exact command, cwd, and task in `state` and run:

```
jev questions guard
jev --file request.json
```

The package is `@aitofy/jev-awesome-skills`. Do not write a second client. Preset labels are `allow`, `ask_user`, and `refuse`.

Stop when `harm.score` is at or above 1.5. Proceed when the chosen label's probability is at or above 0.9 and `determined.noul` is at or above 0.9. Otherwise ask. Stop wins. Proceed means you may run that exact command, then check the result. It does not permit a second command.

On `"source": "fallback"`, fail open: ask the user before anything hard to undo. Do not invent a probability.

Template: `examples/guard.request.json`. Offline sample: `examples/guard.response.json` returns stop.
