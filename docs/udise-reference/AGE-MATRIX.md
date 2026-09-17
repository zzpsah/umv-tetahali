# UDISE+ SDMS Age Matrix Reference

The supplied `Age matrix SDMS.pdf` is a one-page visual matrix titled **Age Matrix for UDISE+ SDMS**.

## Structure

- Age rows: **2 through 22 years**.
- Class columns: **PP3 (-3), PP2 (-2), PP1 (-1), Class 1 through Class 12**.
- Cells are colour-coded in **red, green and yellow/orange** bands.

The supplied page does not include a textual legend explaining the exact meaning of each colour. Therefore the project must **not invent a semantic meaning** for red/green/yellow solely from the chart.

## Project use

- Keep this matrix as an age/class validation reference for UDISE+ SDMS staging.
- Do not hard-block a student solely from inferred colour meaning until the portal/official rule confirms what each colour means.
- When SO2/SO3 or student-import staging is implemented, show age/class validation as a warning/reference first.
- Preserve the student's source DOB and computed age separately; do not rewrite DOB to make the record fit the matrix.
- If the live SDMS portal rejects a class/age combination, record the portal validation message and use that evidence to refine the rule.

## Future implementation

Once the official colour legend / validation rule is confirmed, encode the matrix as structured configuration (not hard-coded UI logic), version it, and attach the rule version to each validation result.
