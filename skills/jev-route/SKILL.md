---
name: jev-route
description: >
  Use when more than one installed skill or tool could handle the turn and
  you need Jev to pick one, or none, before loading it. Runs
  @aitofy/jev-awesome-skills. Do not load the whole skill roster into context first.
---

# Route

You list the skills that are actually installed. Jev picks one label. You load that skill and do the work.

Keep `none` and `ask_user` in the criteria. Add each real skill with its one-line description:

```
jev questions route --option repo-review="Inspect the diff and report file-backed findings"
```

Presets already include `none` and `ask_user`. Put the user request and the installed names in `state`. Run `jev` from `@aitofy/jev-awesome-skills`. Do not write a second client.

Stop when `harm.score` is at or above 1.5. Proceed when the chosen label's probability is at or above 0.9 and `determined.noul` is at or above 0.9. Otherwise ask. Stop wins. `none` means answer directly. Do not load a skill the user did not install.

On `"source": "fallback"`, fail open and pick with your own judgment. Do not invent a probability.

Template: `examples/route.request.json`.
