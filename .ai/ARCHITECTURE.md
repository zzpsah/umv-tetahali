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

1. Exact stable external identifier linkage when a trusted mapping already exists.
2. Exact normalized student name + exact normalized father name + exact DOB when all are available.
3. Minor student-name spelling variation + father name match + DOB match.
4. Exact student name + minor father-name spelling variation + DOB match.
5. Minor spelling variation in both student and father names + exact DOB, only when the candidate is otherwise unique.
6. If DOB is unavailable in one source, require stronger agreement on student name + father name and uniqueness before automatic linking.
7. Name-only matching must not be sufficient for automatic identity creation when multiple candidates exist.
8. If father name and DOB both conflict, do not auto-link; send the record for review.

### Normalization and spelling tolerance

Before comparison, normalize case, whitespace, punctuation, and harmless formatting differences. Minor spelling differences must be treated as possible data-entry variation rather than immediate mismatch.

Example pattern:

```text
TABBU KHATOON  ↔  TABBU KHATON
Father: ABDUL KHALIK ↔ ABDUL KHALIK
DOB: same
```

This is a valid candidate for the same student because the spelling difference is minor and the corroborating fields agree.

### Ambiguity handling

If a student name occurs more than once, use father name and DOB to disambiguate. Do not merge two same-name students solely because the names match.

When evidence is incomplete or conflicting, preserve both source records and mark the linkage as unresolved rather than forcing a merge.

### Auditability

Every cross-source link should retain its source, matching method, and whether it was automatically or manually verified. Reconciliation must remain reversible and should never overwrite original source snapshots.
