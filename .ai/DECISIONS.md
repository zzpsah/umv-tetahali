# Decisions

## 2026-09-13 — Adopt DevOS portable project memory
- Keep durable project context inside this repository under `.ai/`.
- Preserve application source and existing project knowledge during onboarding.
- Use repository evidence and Git history as authority; chat memory remains supplementary.
- Automatically refresh repository-derived context on pushes to `main`/`master`.
