
<!--
তুমি ইতিমধ্যে core API তৈরি করেছ:
Authentication
Role-based authorization
Courses CRUD + publish workflow
Public course search/filter/pagination
Enrollment
 -->


| Phase | Frontend কাজ          | Backend দরকার হলে                        |
| ----- | --------------------- | ---------------------------------------- |
| 1     | Public course listing | বর্তমান GET /api/courses যথেষ্ট          |
| 2     | Course details page   | বর্তমান GET /api/courses/:slug যথেষ্ট    |
| 3     | Login/signup UI       | Better Auth already ready                |
| 4     | Student dashboard     | GET /my-enrollments বানাব                |
| 5     | Instructor dashboard  | বর্তমান GET /my-courses, create/edit API |
| 6     | Admin dashboard       | Review queue endpoint যোগ করব            |
| 7     | Learning player       | Lesson/progress backend তৈরি করব         |


/
  → SkillSphere landing page

/courses
  → Searchable, filterable, paginated course list

/courses/[slug]
  → Course details page + Enroll button

/auth/sign-in
/auth/sign-up
  → Real Better Auth forms
