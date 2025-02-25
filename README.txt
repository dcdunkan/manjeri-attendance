====== ATTENDANCE SYSTEM

As per the request from students of Govt. Medical College of Manjeri.
This SvelteKit app serves as an interface for students to view their
attendance and student representatives to mark others' attendance, as
they currently do not have a digital attendance system.

====== DEVELOPMENT NOTES

> Roadmap (21/27)

[x] Authorization
    [x] Login & logout
[ ] Batches
    [x] Create batch
    [ ] Edit batch
    [ ] Destroy batch
[ ] Students
    [x] Register batch student
    [ ] Edit student
    [ ] Delete student from batch
[ ] Subjects
    [x] Edit subject details
    [x] Delist students
    [ ] Destroy subject
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
[ ] Account settings
    [x] Modify password
    [ ] Sessions and devices

> Refinements to be considered:

[ ] track who & when attendance marked (attendance history schema)
[ ] figure out loading spinners in forms after submission. (submit state visualization)
[ ] redo navigation bar (fix it and make it sticky, simplify it. try to include it in layouts)
[ ] redis integration
[ ] add head-titles
[ ] use global stores for global data
[ ] switch to data tables instead of normal tables
[ ] extra verifications for auth in server routes
[ ] verify if the attendance is marked/edited/deleted within the allowed time period (last 7 days)
[ ] drizzle transactions / batch operations
