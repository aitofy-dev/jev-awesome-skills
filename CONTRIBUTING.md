# Contributing

```
npm install
npm run typecheck
npm test
```

Node 20 or newer. The tests are offline. Do not add an API key, a token, or a live-call fixture to the repo.

A new catalog job is one entry in `useCaseNames`, one `skills/jev-<job>/SKILL.md` that calls this package, and one `examples/<job>.request.json` produced by `node scripts/sync-examples.mjs`. Use the same proceed / ask / stop cutoffs as `skills/jev-awesome-skills/SKILL.md`.

Bugs need a version, an OS, a Node version, and a minimal command. Feature requests need the judgment the agent cannot make today.
