---
name: jev-verify
description: >
  Use before reporting a claim, a fix, or "done". Jev judges whether the
  evidence you supply supports the claim. It does not run the tests for you.
  Runs @aitofy/jev-awesome-skills.
---

# Verify

Collect the receipts first: failing test before, passing test after, command, exit code. If you have no receipt, do not claim the work is done and do not call Jev to bless the sentence.

Put the claim and the receipts in `state`. Run `jev questions verify`, then `jev --file request.json` from `@aitofy/jev-awesome-skills`. Do not write a second client.

Labels are `supported`, `unsupported`, and `ask_user`. Stop when `harm.score` is at or above 1.5. Proceed when the chosen label's probability is at or above 0.9 and `determined.noul` is at or above 0.9. Otherwise ask. Stop wins.

Proceed with `supported` means you may report the claim. It is not a substitute for the test you already ran. `unsupported` means say what is missing.

On `"source": "fallback"`, fail open. Report the receipts you have, or say you do not know. Do not invent a probability.

Template: `examples/verify.request.json`.
