<div align="center">
  <h1> SkillSphere</h1>
  <p><strong>Balanced; learning, portfolio quality, TypeScript এবং full-stack architecture </strong></p>

  [![Live Demo](https://img.shields.io/badge/Live_Demo-FF7E36?style=for-the-badge&logo=vercel&logoColor=white)](https://najimul.com)
  [![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/najimhaq/skillsphere-frontend)
  [![Next.js](https://img.shields.io/badge/Next.js-16.2.4-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.2.4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
<div/>
---

## 📖 About The Project

**SkillSphere**


## 🛠️ Built With

### Core Technologies

<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,react,tailwind,js,mongodb" />
</p>

| Technology                                                | Version | Purpose                            |
| --------------------------------------------------------- | ------- | ---------------------------------- |
| [Next.js](https://nextjs.org/)                            | 16.2.10 | React framework with SSR & routing |
| [React](https://reactjs.org/)                             | 18.3.1  | UI library                         |
| [Tailwind CSS](https://tailwindcss.com/)                  | 4.2.4   | Utility-first CSS framework        |
| [daisy UI](https://daisyui.com/)                          | 5.5.19  | Utility-first CSS framework        |
| [Mongoose](https://mongoosejs.com/docs/guide.html)                          | 9.8.1   | ORM                                |
| [MongoDB](https://www.mongodb.com/)                 | 8.3   | Database                           |
| [BetterAuth](https://better-auth.com/)                    | 1.6.9   | Authentication solution            |
| [Framer Motion](https://motion.dev/examples)              | 12.42.2 | Animation library                  |
| [React Icons](https://react-icons.github.io/react-icons/) | 5.6.0   | Icon library                       |

---
## Core Features

# Public side
-Landing page
-Course catalog
-Search, category, skill level ও price filter
-Course detail page
-Instructor public profile
-Free preview lessons
-Cohort start date ও available seat count

# Student dashboard
-My learning overview
-Enrolled courses
-Lesson completion tracking
-Assignment submit: GitHub repository, live URL, text answer, optional file
-Mentor feedback ও score
-Certificate eligibility
-Payment/enrolment history

# Instructor dashboard
-Course/cohort create, update, publish
-Module ও lesson management
-Cohort capacity এবং start/end date
-Enrolled student list
-Assignment review queue
-Submission feedback, score ও status update
-Course analytics: enrolment, completion, pending review

# Admin dashboard
-User management
-Course approval/moderation
-Instructor verification
-Payment/enrolment monitor
-Reported content handling
-Platform statistics


## 📖 Project Vision
Instructor creates course
        ↓
Admin reviews and publishes
        ↓
Instructor creates cohort
        ↓
Student enrols
        ↓
Student watches lessons
        ↓
Student submits assignment
        ↓
Instructor reviews and gives feedback
        ↓
Student tracks progress and earns certificate


##  Workflow
Instructor creates course
        ↓
Admin approves course
        ↓
Instructor opens a cohort with start date and seat limit
        ↓
Student pays / enrols
        ↓
Student gets course access
        ↓
Student completes lessons
        ↓
Student submits assignment
        ↓
Instructor reviews and gives feedback
        ↓
Student sees feedback and progress
        ↓
Completion condition fulfilled → certificate becomes available


## 📖 Frontend - Backend
Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS
- Shadcn UI
- TanStack Query
- React Hook Form
- Zod
- Axios

Backend
- Node.js
- Express.js
- TypeScript
- MongoDB Atlas/Compass
- Mongoose
- Better Auth
- Zod
- Cloudinary

Later / Optional
- Stripe
- Resend
- Socket.IO

skillsphere/
├── skillsphere-frontend/
└── skillsphere-backend/


## 📖 Model Relation
User
 ├── creates → Course
 ├── owns → Cohort
 ├── enrols → Enrollment
 └── submits → Submission

Course
 ├── has → Cohort
 ├── has → Module
 └── has → Assignment

Enrollment
 ├── belongs to → Student
 └── belongs to → Cohort

Submission
 ├── belongs to → Student
 ├── belongs to → Assignment
 └── has → Review


## Database Collections
users                 ← Better Auth user data + role
sessions              ← Better Auth session data
accounts              ← OAuth account data, if added later

courses
cohorts
enrollments
lessons
assignments
submissions
reviews
payments
notifications
certificates


