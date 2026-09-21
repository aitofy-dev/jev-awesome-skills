---
name: jev-triage
description: >
  Use when a support message, bug report, or other record needs one label
  such as billing, bug, or how-to, plus a harm score for a wrong label.
  Runs @aitofy/jev-awesome-skills. Do not send a mailbox or delete messages.
---

# Triage

Judge records you already have. Do not connect to a mailbox, delete, reply, or move messages as part of this skill.

Preset labels are `billing`, `bug`, `how_to`, `other`, and `ask_user`. Replace them with the labels you and the user agreed, and keep `ask_user`. One record per request. Put the record text in `state` and run:

```
jev questions triage
jev --dry-run --file request.json
```

Show the dry-run before a live call when the text is private. The package is `@aitofy/jev-awesome-skills`. Do not write a second client.

Stop when `harm.score` is at or above 1.5. Proceed when the chosen label's probability is at or above 0.9 and `determined.noul` is at or above 0.9. Otherwise ask. Stop wins. Proceed means apply the label in your tracker. Ask means leave it for a person.

On `"source": "fallback"`, fail open and leave the record unlabeled. Do not invent a probability.

Template: `examples/triage.request.json`.
