---
name: jev-review
description: >
  Use when a diff should be marked ship, fix, or ask a person, including when
  a change weakens a test or misses the task. Jev does not merge and does not
  replace CI. Runs @aitofy/jev-awesome-skills.
---

# Review

Read the diff and the test receipt yourself. Linters and tests stay in charge of syntax and exit codes. Jev only judges the closed question: ship, fix, or ask a person.

```
jev questions review
```

Put the goal, the relevant hunk, and what was actually run in `state`. Run `jev` from `@aitofy/jev-awesome-skills`. Do not write a second client. Do not merge, push, or dismiss a review because a probability is high.

Stop when `harm.score` is at or above 1.5. Proceed when the chosen label's probability is at or above 0.9 and `determined.noul` is at or above 0.9. Otherwise ask. Stop wins.

`ship` means you may say the change looks acceptable. `fix` means request a code change. Neither one is a green CI check.

On `"source": "fallback"`, fail open and review it yourself. Do not invent a probability.

Template: `examples/review.request.json`.
