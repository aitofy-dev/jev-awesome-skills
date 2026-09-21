# Changelog

## 0.1.0

First public release of the Jev skill catalog for coding agents.

- Build and parse `choice`, `noul`, and `score` requests for TypeSafe System One.
- Redact secret-shaped state before a request body exists.
- Fail open, with no invented probability, when the API key is missing, the transport throws, or the body is not Jev answers.
- One proceed / ask / stop policy, shared by gate, route, guard, verify, triage, review, and act.
- Offline `--dry-run` and `--fixture`. The API key is read only from the environment.
