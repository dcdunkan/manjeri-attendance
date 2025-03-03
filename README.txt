====== ATTENDANCE SYSTEM

As per the request from students of Govt. Medical College of Manjeri.
This SvelteKit app serves as an interface for students to view their
attendance and student representatives to mark others' attendance, as
they currently do not have a digital attendance system.

====== DEVELOPMENT NOTES

BATCH NAME = BATCH YEAR
This was a mistake made, try to interpret these two.
This warning will be removed once this is resolved internally.

> Roadmap (28/28)

[x] Authorization
    [x] Login & logout
[x] Batches
    [x] Create batch
    [x] Edit batch name (To be removed)
    [x] Add subjects
    [x] Destroy batch
[x] Students
    [x] Register batch student
    [x] Edit student
    [x] Delete student from batch
[x] Subjects
    [x] Edit subject details
    [x] Delist students
    [x] Destroy subject
[x] Representations
    [x] Promote / demote
    [x] See history and overview
    [x] Mark attendance
    [x] Edit period & attendance
    [x] Delete period
[x] Subject / enrollment list
    [x] Subject name editor dialog
    [x] Make it reactive
    [x] Delist the student
    [x] Overall attendance statistics
    [x] Enroll students from batch
[x] Viewing attendance
    [x] Calculate attendance
    [x] Show total in dashboard
    [x] Calendar wise view
    [x] Subject wise view
    [x] Show total in attendance view sections
[x] Account settings
    [x] Modify password
    [x] Sessions and devices

> Refinements to be considered (8/23):

[ ] Take values from session (like studentId) instead of passing.
[x] block newly logged in devices from logging out other devices for 30 minutes (was changed to 24 hours)
[x] Recommend changing passwords in dashboard
[ ] Limit sessions. Limit admin to 1. Limit student to ??
[x] Make sure lastActive renewal period is considerably enough.
[ ] Change references of batch name to batch year everywhere.
[x] remove references of the internal IDs in UI
[x] Lock mechanism in auto-generating passwords
[ ] creations & updations datetimes
[ ] algorithm for display name
[ ] track who & when attendance marked (attendance history schema)
[x] figure out loading spinners in forms after submission.
[x] redo navigation bar
[ ] redis integration
[x] add head-titles
[ ] use global stores for global data
[ ] switch to data tables instead of normal tables
[ ] extra verifications for auth in server routes
[ ] verify if the attendance is marked/edited/deleted within the allowed time period (last 7 days)
[ ] drizzle transactions / batch operations
[ ] Make all the DB transactions abstractions & repositories
[ ] Confirm whether form validations are enough
[ ] Errors 404, 500