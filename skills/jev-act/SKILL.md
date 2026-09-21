---
name: jev-act
description: >
  Use when the next step must be one action from a list you already observed,
  such as a visible control or a legal game move. Jev cannot invent clicks,
  coordinates, or tools. Runs @aitofy/jev-awesome-skills.
---

# Act

Build the list before you call Jev. Every option must be an action you observed or a move your rules allow. Keep the presets `abstain` and `reobserve`.

```
jev questions act --option click_appearance="The Appearance row is visible in Settings"
```

Put the goal and the observation in `state`. Do not send passwords, cookies, payment data, or a raw screenshot. Run `jev` from `@aitofy/jev-awesome-skills`. Do not write a second client.

Stop when `harm.score` is at or above 1.5. Proceed when the chosen label's probability is at or above 0.9 and `determined.noul` is at or above 0.9. Otherwise ask. Stop wins.

Proceed means perform that one listed action, then observe the result yourself. `reobserve` means change nothing. `abstain` means stop and ask. Never derive an action that was not in the criteria.

On `"source": "fallback"`, fail open: reobserve or ask. Do not invent a probability or a click.

Template: `examples/act.request.json`.
