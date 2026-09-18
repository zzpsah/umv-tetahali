# Architecture

## Observed structure
The current repository is primarily a static/web portal structure with multiple HTML entry pages and an `assets/` directory.

## Boundary
This document records repository-observed structure plus approved durable project rules. Inspect source before making claims about backend integrations, authentication guarantees, deployment state, or data flows.

## Student identity and cross-source reconciliation

For school datasets such as UDISE, e-Shiksha Kosh, OFSS, and later BSEB, records must be linked through a durable internal student identity rather than relying on one portal's identifier or exact spelling alone.

### Internal identity
Each student should have one durable internal `student_key` in the core data layer. External identifiers such as e-Shiksha `student_code`, UDISE PEN/student ID, OFSS reference number, and future BSEB registration/unique IDs should link to that internal key.

A correction or spelling change in a source system must not create a new internal student when the existing identity is already established.

### Matching priority
Use this order for automatic reconciliation:

1. Stable ID exact match.
2. Exact normalized student name + exact normalized father name + exact DOB.
3. Minor student-name spelling variation + father name exact + DOB exact.
4. Student name exact + minor father-name spelling variation + DOB exact.
5. Minor spelling variation in both student and father names + DOB exact, only when the candidate is otherwise unique.
6. If DOB is unavailable in one source, require stronger agreement on student name + father name and uniqueness before automatic linking.
7. If father name and DOB both conflict, do not auto-match; mark the record for manual verification.

Name-only matching must never be sufficient for automatic identity creation when multiple candidates exist.

### Normalization and spelling tolerance
Before comparison, normalize case, whitespace, punctuation, and harmless formatting differences. Minor spelling differences must be treated as possible data-entry variation rather than immediate mismatch.

Example pattern:

```text
TABBU KHATOON  ↔  TABBU KHATON
Father: ABDUL KHALIK ↔ ABDUL KHALIK
DOB: same
```

This is a valid candidate for the same student because the spelling difference is minor and the corroborating fields agree.

### Mismatch visibility in search and comparison results
Do not remove or hide a record from reconciliation output merely because one or more fields conflict. The comparison result must explicitly show the mismatching fields so a human can verify them.

Required behavior:

- DOB mismatch must be highlighted explicitly in the result.
- Father-name mismatch must be shown explicitly.
- Student-name spelling variation must be shown explicitly when relevant.
- A record with an otherwise strong candidate but a conflicting DOB must remain in the result as `DOB_MISMATCH` or equivalent review status.
- A record with a conflicting father name must remain visible as `FATHER_MISMATCH` or equivalent review status.
- If both father name and DOB conflict, keep the candidate visible but classify it as `DO_NOT_AUTO_MATCH / MANUAL_REVIEW`.
- Search/reconciliation output should distinguish `MATCHED`, `MATCHED_WITH_MINOR_VARIATION`, `DOB_MISMATCH`, `FATHER_MISMATCH`, `MULTIPLE_CANDIDATES`, `NOT_FOUND`, and `MANUAL_REVIEW` where applicable.
- Never convert a mismatch into `NOT_FOUND` simply because an automatic-link threshold failed when a plausible same-name or fuzzy candidate exists.

The purpose of mismatch statuses is verification, not automatic rejection.

### Highlighting rule for final results
Only records with no reliable or plausible identity match across the compared sources should be highlighted as completely unmatched.

Do not highlight the following as completely unmatched when a plausible corresponding student exists:
- minor student-name spelling variation,
- minor father-name spelling variation,
- DOB mismatch with otherwise strong identity agreement,
- father-name mismatch with otherwise strong identity agreement,
- other single-field conflicts that still leave a plausible candidate.

These records must stay visible with a verification note/status, but they remain in the matched/plausible-match group for presentation purposes.

Use `NOT_FOUND` / `UNMATCHED` highlighting only when there is no reliable candidate after applying stable IDs, normalized/fuzzy name comparison, father-name comparison, and DOB comparison.

### Flexible search rule
Search is a candidate-discovery layer, not a rigid yes/no matcher. It must remain tolerant and inspect the full available source masters rather than only an expected class. Search should support stable IDs, exact and partial names, spelling-tolerant names, father name, mother name, DOB, PEN, student code, APAAR and source reference numbers. Candidate results must retain source and match reason. A search similarity score may order candidates but must not by itself redefine identity or silently discard plausible candidates.

Recommended fallback order for OFSS reconciliation is: e-Shiksha Kosh → full UDISE master → Siwan Dropbox → manual review.

### Ambiguity handling
If a student name occurs more than once, use father name and DOB to disambiguate. Do not merge two same-name students solely because the names match.

When evidence is incomplete or conflicting, preserve both source records and mark the linkage as unresolved rather than forcing a merge.

### Auditability
Every cross-source link should retain its source, matching method, and whether it was automatically or manually verified. Reconciliation must remain reversible and should never overwrite original source snapshots.

## Data management dashboard

A staging-first authenticated data-management dashboard is developed under `data-dashboard/`.

- Supabase remains the source of truth.
- Dashboard roles are `admin`, `operator`, and `viewer`.
- Original imported snapshots are immutable from the dashboard.
- Corrections, reconciliation decisions, and generated-form preparation live in separate review/staging layers.
- Dashboard browser access must use only a publishable Supabase key; service-role keys and secrets must never be committed.
- Private student datasets must never be copied into the public GitHub repository.
- Production website deployment still requires explicit approval.

### Student Master
The main internal working surface is `All Students / Student Master`.

- Each row is anchored by `core.student_key`.
- Default columns prioritize identity and operational work: name, father, mother, DOB, category, class/section/stream, PEN, APAAR, student code, mobile, source presence, issues, recommended action and snapshot context.
- Additional columns must remain accessible through a column picker / All Columns mode.
- Student Key opens a profile view containing core details, source presence, field comparison, issues and action context.
- The staging dashboard must use live source-backed data after authentication; realistic hardcoded student examples are not acceptable as live rows.

### Deterministic routing and queues
The dashboard should compute/display action queues from deterministic source evidence rather than AI calls at page load.

Possible actions include:
- `Mapped`
- `SO2 Candidate`
- `SO3 Review`
- `Import from Dropbox`
- `Manual Review`
- `Multiple Candidates`

AI may later assist with difficult ambiguity but must not silently become the identity authority.

### Class XI source priority
For Class XI:
1. OFSS is the primary source for admission details.
2. e-Shiksha Kosh is the secondary source.
3. UDISE is the current enrollment/status reference.
4. Siwan Dropbox is the fallback/history/import reference.

This source priority is used for comparison, action recommendation and form preparation. It does not authorize destructive synchronization.

### SO2 routing
A Class XI student should become an SO2 candidate only when:
- the student is represented by the admission/student sources being reconciled,
- no reliable UDISE record is found,
- no reliable Siwan Dropbox candidate is found.

If a reliable Dropbox record exists, route to import/reconciliation rather than SO2.

SO2 details should be prefilled from OFSS first and e-Shiksha as fallback where data is actually available. Missing source fields remain blank and require human verification.

### SO3 routing
SO3 is for an active UDISE student whose stored details need human-reviewed correction/update preparation.

- Existing Details = UDISE.
- Proposed Details = OFSS first for Class XI, then e-Shiksha fallback/reference.
- Conflicting fields must be visibly highlighted.
- Human review is mandatory before final printing.
- Autofill does not equal approval.
- The form preparation layer must never directly overwrite UDISE source snapshots.

## Snapshot management
Source imports are versioned snapshots.

Dashboard snapshot functionality should expose:
- source,
- academic session,
- stream where applicable,
- snapshot version,
- snapshot date,
- source filename,
- row count,
- current/previous status,
- import history.

New snapshot uploads should follow: upload → preview → validate → duplicate check → confirm → version → mark current → retain old snapshot → re-run reconciliation.

OFSS requires session- and stream-aware snapshot management for Science, Arts and Commerce.

## Audit/reporting
Audit should be human-readable, not only technical logs.

Target fields include:
- date/time,
- actor,
- student/entity,
- action,
- source,
- old value,
- new value,
- reason,
- review outcome.

Filters should support user, source, class, action/status and date.

## SO2 / SO3 staging
SO2 and SO3 are form-generation workflows, not source-of-truth datasets. The staging pipeline is:

inspect official/sample form → define fields → map source fields → transform → validate missing/conflicting values → human review/audited override → preview/output.

Official/reference SO2 and SO3 forms have now been inspected and their structured reference documentation exists in the repository. Mapping definitions should remain versioned.
