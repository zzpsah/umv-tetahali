# Form SO3 / UDISE

## Purpose

Format to update details of an **Active Student**. The form is filled by the current school and submitted to the Block/District Education Officer or equivalent.

## Submitted-by / identification fields

- UDISE Code
- Academic Year
- School Name
- State
- District
- Block
- Student PEN
- Student Name
- Mobile Number

## Existing details in UDISE+

- Name
- Date of Birth
- Gender
- Aadhaar Number
- Name as per Aadhaar
- Class & Section
- Mother's Name
- Father's Name

## Details to be updated in UDISE+

The same demographic fields are repeated for the corrected/new values:

- Name
- Date of Birth
- Gender
- Aadhaar Number
- Name as per Aadhaar
- Class & Section
- Mother's Name
- Father's Name

## Supporting documents

The form includes document checkboxes for:

- Copy of School Register
- Copy of Birth Certificate

## Undertakings

### School undertaking
The school declares that the filled information and documents are correct to the best of its knowledge and belief.

### Block/District level undertaking
The officer confirms that a copy of required documents for the requested changes is kept in the office file for record.

Sign-off blocks are provided for:

- Head of School — name, designation, signature, seal
- State/District/Block Education Officer or equivalent — name, designation, signature, seal

## Automation implication

The staging dashboard should display **Existing Source Value → Proposed Updated Value** side-by-side, preserve provenance, show conflicts, require manual review for sensitive demographic changes, and never overwrite source snapshots. Any future portal update must remain approval-gated.
