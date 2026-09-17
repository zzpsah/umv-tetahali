# UDISE+ SDMS School Functionality Guide — Navigation Notes

Source guide version: V1_09/07/2026. User role: **School**. Module: **Student Database Management System (SDMS)**.

This is a project navigation guide for future browser automation and dashboard workflows. Always verify the live portal because availability may vary by current privileges and academic cycle.

## A. School Dashboard

Shows the classes available as per School Profile and the number of enrolled students in each class.

## B. School Details

### School Profile
Basic school details, Head of School details, academic session dates, medium of instruction, language group, and vocational education where applicable.

### School Privileges
Use this to check whether a specific functionality is currently available to the school user or admin level.

### Section Management
- Select class and add section.
- Section alias may be used.
- To delete, remove the last created section only after shifting students elsewhere.
- Section alias can be edited.

## C. Add Student

Use only for **new admissions whose records are not available in SDMS**. If the student's record already exists in the portal, use **Import** instead.

Navigation pattern: Dashboard → class → Add → enter required details → verify → Save.

## D. Student Profile

Student details are grouped into:

- General Profile
- Enrolment Profile
- Facilities Profile
- Vocational details

Navigation: open student's name from active-student list / dashboard class selection → fill details → Save → Submit.

## E. Demographic Details Update

- Student Name: through `Student Name Update`; name update is limited and major alteration is not allowed.
- Gender, DOB, Mother's Name, Father's Name, Guardian's Name: editable through General Profile only when Aadhaar is not verified. If Aadhaar is verified, contact Block/District/State admin.
- Aadhaar Number / Name as per Aadhaar: editable if Aadhaar is not verified. If Aadhaar is verified and APAAR generated, Aadhaar Number cannot be changed by the school; contact admin if required.

## F. Student Release Request Management

Used to request release of a student from another school's SDMS record for onboarding into the current school.

### Generate
1. Open Student Release Request Management.
2. Use Within State or Outside State depending on previous school.
3. Enter PEN + DOB (and previous state for outside-state requests).
4. Enter admission details and generate request.

Release request can be generated only if the student is **Active** in the last studied school.

### Approve / Reject incoming request
Open Approve tab → request number → inspect details → Approve or Reject.

When released, the student moves to **Dropbox**, from where the current school can import.

### Rejected request
For within-state rejected requests, an `Escalate to Destination Admin` option may be available once. If admin rejects too, the request closes; a fresh request may be generated.

### Cancel / rollback
If no action has been taken by the destination school, use Cancel in the sent-request view.

## G. Aadhaar MBU

Select class + section → Validate Aadhaar from UIDAI if Aadhaar is available → Revalidate for MBU where applicable. Used to determine mandatory biometric update status and help prevent duplication.

## H. APAAR

Before generation, ensure Aadhaar is verified and profile is complete. Select class + section → Generate.

## I. Class / Section Shift

Select student → choose new class/section → Update.

Guide notes:
- Pre-primary 3/Nursery/KG3 to Class 1: school may modify class and section.
- Classes 2–12: school can modify **section only**; class shift requires Block/District/State admin.

## J. Student Movement and Progression

### Progression Activity
Year-end activity to move students from previous to current academic year. Complete student details, finalize each section, then finalize school progression. A correction button is available after finalization where permitted.

### Import Module
Used to onboard a **Dropbox** student.

Navigation: Student Movement and Progression → Import → Within State / Outside State → search by PEN + DOB → enter Date of Admission, Class and Section → Import.

### Transfer Certificate / Mark Dropout
Search by PEN → fill details → Update. Student is moved to Dropbox.

### Inactivate Student
Choose With PEN / Without PEN → class + section → Inactive → fill details → Update. For `Inactive due to death`, contact admin.

### Dropbox Student List
Search by UDISE code or State → District → Block → School filters → Import required student.

## K. Reporting Module

Reports for monitoring and tracking.

## L. Global Student Search

Search using parameters such as PEN, student name, Aadhaar number, DOB, etc. This should be the preferred verification step before creating a new profile via SO2.

## M. Track Student

Directly track a student using PEN.

## N. Dropbox Student Management

List of All Students → Dropbox Students → search student → tick checkbox → edit sub-status/remarks → Update.

## Definitions

- **PEN**: Permanent Education Number generated by the system.
- **Active**: student profile mapped to a school record.
- **Dropbox**: passive profile not currently mapped to a school record.
- **Inactive**: inactive student profile, not mapped to a school record.
- **Escalate to Destination Admin**: resend a rejected within-state release request to admin for action.
- **Complete Request**: close a request where action cannot be taken because the student is no longer mapped to the destination school.

## DevOS navigation rule

For future browser automation, this guide is navigation guidance only. The agent must re-observe the live page before acting, keep the workflow read-only by default, let the user handle login/OTP/CAPTCHA, and require explicit approval for any mutation/submission.
