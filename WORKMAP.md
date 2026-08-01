ইতিমধ্যে সম্পন্ন -
✅ MongoDB + Mongoose setup
✅ Better Auth email/password login
✅ Cookie-based sessions
✅ Role system: STUDENT, INSTRUCTOR, ADMIN
✅ requireAuth / requireRole middleware
✅ Course create, update, delete
✅ Course publish/reject status flow
✅ Public course list, filter, search, pagination
✅ Course details by slug
✅ Enrollment create
✅ Duplicate enrollment protection
✅ My courses
✅ My enrollments (যোগ করার পর)

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


Backend Roadmap
## Course Management
Instructor course edit policy tighten করা, PENDING_REVIEW বা PUBLISHED course instructor edit করলে আবার DRAFT হবে কি না define করা

Admin review queue: GET /api/admin/courses/pending

Admin reject reason যোগ করা

Instructor নিজের rejected course-এর rejection reason দেখতে পারা

Instructor course thumbnail upload

Course preview / featured course flag

Course category model বা controlled category list

Instructor public profile এবং instructor-এর courses endpoint

Course ratings summary: average rating, review count

## Course Content
এটাই next বড় backend module হওয়া উচিত।

Section model, যেমন “Introduction”, “TypeScript Basics”

Lesson model, যেমন video, article, quiz

Course → sections → lessons relation

Instructor section create/update/delete/reorder

Instructor lesson create/update/delete/reorder

Video URL/file metadata, duration, preview/free lesson flag

Lesson types: VIDEO, ARTICLE, QUIZ, RESOURCE

Course content read endpoint

Student কেবল enrolled হলে locked lessons access করতে পারবে

Public user শুধু preview lessons দেখতে পারবে

## Learning Progress
Lesson complete endpoint

Student-wise lesson progress model

Enrollment progressPercentage auto-calculate

Continue-learning endpoint

Course completion detection

completedAt set করা

Completion certificate eligibility

Course progress timeline / last watched lesson

## Student Dashboard
GET /api/enrollments/my-enrollments-এ course info ও progress

GET /api/dashboard/student/continue-learning

Completed courses list

Cancel enrollment rule

Wishlist/bookmark model ও APIs

Recently viewed courses

## Instructor Dashboard
Instructor dashboard stats: total courses, students, enrollments

Course-wise enrollment count

Course performance / completion stats

Instructor student list per course

Revenue stats—payment যোগ হলে

Submission/review queue—assignment যোগ হলে

## Admin Dashboard
Pending review course list

Publish course endpoint

Reject course + required reason

Admin user list with pagination/search

Change user role—strict security সহ

Suspend/ban user

Admin dashboard analytics

Featured course management

Reported review/content moderation

## Reviews and Ratings
Review model: studentId, courseId, rating, comment

শুধু enrolled student review দিতে পারবে

এক user এক course-এ এক review

Review create/edit/delete

Rating average ও count update

Instructor নিজের course review delete করতে পারবে না

Admin moderation for inappropriate reviews

## Assignment System
যদি তোমার platform-এ practical coding/design/learning assignment থাকে:

Assignment model

Instructor assignment create/edit/delete

Student submission model

File/link/text submission

Deadline handling

Instructor grade ও feedback

Student submission status

Assignment grade dashboard

## Quiz System
Quiz model

Question model: MCQ, true/false, short answer

Question options এবং correct answer secure রাখা

Quiz attempt model

Attempt limit ও passing score

Auto grading for objective questions

Quiz result API

Quiz completion progress update

## Payments
শুরুতে free courses দিয়ে frontend তৈরি করো। Payment module পরে যোগ করাই practical।

Payment provider নির্বাচন: Stripe / SSLCommerz / Paddle

Checkout session creation

Payment transaction model

Webhook signature verification

Payment success হলে enrollment create

Failed/cancelled payment handling

Refund workflow

Coupon/discount code

Invoice/receipt

Payment কখনো শুধু frontend response বিশ্বাস করে verify করবে না

## File Uploads
Cloudinary / S3 / UploadThing setup

Secure backend upload route বা signed upload

Thumbnail upload

Instructor profile image

Assignment submission file

File type, MIME type এবং size validation

Unauthorized user যেন অন্যের file access না পায়

Stored file delete/replace handling

## Notifications
Notification model

Course published/rejected notification

Enrollment confirmation

Assignment deadline reminder

Grade published notification

In-app notifications read/unread

Email notifications—Resend, Nodemailer, বা অন্য provider

Optional real-time notification with Socket.IO

## Email Features
Email verification

Forgot password

Reset password

Welcome email

Course enrollment email

Course approval/rejection email

Email templates

Production email provider configuration

## API Quality
Centralized global error middleware

Consistent API response helper

Custom AppError class

Mongoose duplicate-key, cast, validation error formatter

404 route handler

Request validation middleware—Zod reusable করা

API versioning, যেমন /api/v1/courses

Request ID / structured logger

API documentation with Swagger/OpenAPI

## Security
helmet

Rate limiting, বিশেষ করে auth এবং enrollment routes

Request size limit

CORS production configuration

Environment variable validation complete করা

Secure cookie settings for production

Password reset/email verification token expiry

Input sanitization

Audit logs for admin actions

Never return session tokens in application API responses

## Testing
Unit test: validators, helper functions, permission rules

Integration test: course create/publish/enroll flow

Test unauthenticated requests return 401

Test wrong role returns 403

Test non-owner cannot edit/delete a course

Test duplicate enrollment returns 409

Test invalid query/body returns 400

Seed script: demo users, courses, sections, lessons

## Deployment
Production MongoDB Atlas database

Backend deploy: Railway, Render, Fly.io, or VPS

Frontend deploy: Vercel

Production environment variables

Custom domain

CORS with real frontend domain

MongoDB backup strategy

Logging/error monitoring, such as Sentry

Health-check endpoint

CI/CD pipeline with GitHub Actions

## Recommended Order
তোমার জন্য এই sequence সবচেয়ে practical:

1. Frontend public pages + auth UI
2. Course content: sections and lessons
3. Student learning player + lesson progress
4. Instructor dashboard + course builder
5. Admin review dashboard
6. Reviews and ratings
7. Upload system
8. Payment system
9. Quiz and assignments
10. Notifications, testing, deployment
