# UDISE+ Reference Pack

This folder stores durable project notes derived from the uploaded UDISE+ reference documents. These references are intended to guide future dashboard, staging, form-fill, and portal-navigation work.

## Included references

- `FORM-SO2.md` — structure and usage of Form SO2/UDISE+ for adding a student profile (Classes 2–12) when the student is not available in UDISE+ SDMS.
- `FORM-SO3.md` — structure and usage of Form SO3/UDISE for updating demographic details of an active student.
- `FUNCTIONALITY-GUIDE.md` — school-user SDMS navigation/workflow guide covering dashboard, student profile, release requests, APAAR, progression, import, Dropbox, Global Student Search, etc.
- `AGE-MATRIX.md` — age/class matrix reference for UDISE+ SDMS.

## Project use

1. Treat these notes as reference/navigation guidance, not as a substitute for live portal inspection.
2. For automation, prefer read-only observation first and require explicit approval before any portal mutation.
3. Preserve source snapshots and form mapping versions.
4. Keep SO2/SO3 staging flexible: source values may come from UDISE, e-Shiksha Kosh, OFSS, Siwan Dropbox, or manual correction/review.
5. When a required form value conflicts across sources, show `CONFLICT` / `MANUAL_REVIEW`; do not silently overwrite the source.
6. Never store credentials, OTPs, session cookies, Aadhaar numbers, PEN lists, or private student records in this repository.

## Original uploads

The original PDFs were supplied in ChatGPT for project reference. The current GitHub connector supports text-file commits but not direct binary PDF upload, so the durable repository copy here is a structured extraction/guide. Keep the original PDFs in the project file store as the source document.
