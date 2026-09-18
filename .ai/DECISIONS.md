# Decisions

## 2026-09-18 — Use a unified Student Master as the main internal workspace
- The main working view is `All Students / Student Master`.
- Every consolidated student is anchored by durable `core.student_key`.
- Source-specific pages remain useful for inspection, but the Student Master is the primary daily working surface.
- Student Key is clickable and opens a full student profile/comparison view.
- The default table shows important identity and operational fields; additional source fields are available through a column picker / All Columns mode.

## 2026-09-18 — Deterministic reconciliation first; AI only as optional assistance
- Normal source mapping and issue display must be computed from database rules and persisted source links/statuses.
- The dashboard must not depend on AI calls on page load.
- AI may later assist only with difficult ambiguity, but it must not silently create authoritative identity links.
- Plausible conflicts remain visible and are not converted to `NOT_FOUND` merely because one field differs.

## 2026-09-18 — Class XI source priority
For Class XI:
1. OFSS = primary admission source of truth for admission details.
2. e-Shiksha Kosh = secondary source.
3. UDISE = current enrollment/status reference.
4. Siwan Dropbox = fallback/history/import reference.

This priority is for dashboard reconciliation/form preparation and does not authorize overwriting immutable source snapshots.

## 2026-09-18 — Automatic action queues with human review
- UDISE missing + Siwan Dropbox found → route to `Import from Dropbox`.
- Class XI OFSS-linked student + UDISE missing + Dropbox not found → route to `SO2 Candidate`.
- UDISE present with relevant ambiguity/conflict against OFSS/e-Shiksha → route to `SO3 Review`.
- SO2/SO3 details may be auto-filled, but final review remains human-controlled.
- SO3 must require human verification before final printing.
- Existing UDISE details must remain visible beside proposed updated details.
- No automatic UDISE mutation is allowed from the form-preparation workflow.

## 2026-09-18 — Do not use fabricated student demo rows in the live staging dashboard
- Hardcoded realistic student examples can be mistaken for source-backed records.
- The staging dashboard must display live source-backed rows after authentication.
- If a future mock mode is needed, it must be clearly labeled `DEMO DATA` and must not reuse real-looking unverified student identities.

## 2026-09-13 — Adopt DevOS portable project memory
- Keep durable project context inside this repository under `.ai/`.
- Preserve application source and existing project knowledge during onboarding.
- Use repository evidence and Git history as authority; chat memory remains supplementary.
- Automatically refresh repository-derived context on pushes to `main`/`master`.
