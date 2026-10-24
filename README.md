# Online Student Feedback System

A full-stack web application where students rate and comment on the courses they study, and faculty and the department office view the results.

Built for **MMCA314D, Web Development Using Full Stack Open** (AAT-I), Department of MCA, Dayananda Sagar College of Engineering.

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 19 (Vite), hooks, Context API     |
| Backend   | Node.js, Express 4, JWT, bcrypt         |
| Database  | MySQL 8                                 |

## Features

- **Student authentication**: register with college email and USN, log in with a JWT session (passwords stored as bcrypt hashes).
- **Course selection**: students pick the courses they are taking; they can only review courses they selected.
- **Feedback form**: four 1 to 5 star ratings (teaching quality, course content, interaction and support, overall) with validation.
- **Comments**: optional written feedback (up to 1000 characters) with an option to hide the student's name from faculty.
- **Submission rules**: one submission per student per course, enforced in the API and by a unique key in MySQL.
- **Faculty view**: results for the courses they teach: average rating, rating distribution, per-question averages and every comment.
- **Admin view**: results for all courses, student identities for moderation, and add or delete courses.
- **Role-based access**: `student`, `faculty` and `admin` roles are checked on every API route and on every page.

## Project structure

```
online-student-feedback-system/
├── client/                 React frontend (Vite)
│   └── src/
│       ├── components/     Navbar, Stars, StarRating, Notice
│       ├── pages/          Login, Register, Courses, MyFeedback, FeedbackForm,
│       │                   Dashboard, CourseReport, ManageCourses
│       ├── AuthContext.jsx login state shared across the app
│       ├── api.js          fetch wrapper that attaches the JWT
│       └── router.js       small hash router built with hooks
├── server/                 Express REST API
│   └── src/
│       ├── routes/         auth, courses, enrollments, feedback, reports
│       ├── middleware/     authenticate, authorize(role), asyncHandler
│       ├── db.js           MySQL connection pool
│       └── seed.js         sample users, courses and feedback
│   └── tests/apitest.js    API checks (status codes and messages)
├── database/schema.sql     MySQL tables, keys and constraints
└── docs/                   API reference
```

## Getting started

**Prerequisites:** Node.js 20.19+ (or 22+) and MySQL 8.

```bash
# 1. Create the database and tables
mysql -u root -p < database/schema.sql

# 2. Start the API
cd server
cp .env.example .env          # then put your MySQL password and a JWT secret in .env
npm install
npm run seed                  # loads sample data
npm run dev                   # http://localhost:5000

# 3. Start the React app (new terminal)
cd client
npm install
npm run dev                   # http://localhost:5173
```

### Run the API checks (optional)

With the API running on a freshly seeded database (`npm run seed`), run `npm run test:api` inside `server/`. It calls the live endpoints and prints the HTTP status for 29 checks, including wrong passwords, duplicate submissions and role restrictions.

### Demo accounts (created by `npm run seed`)

| Role    | Email                        | Password     |
|---------|------------------------------|--------------|
| Student | ayush.@dsce.edu.in    | Student@123  |
| Faculty | alamma.bh@dsce.edu.in       | Faculty@123  |
| Admin   | admin@dsce.edu.in            | Admin@123    |

## API overview

See [docs/API.md](docs/API.md) for request and response details.

| Method | Endpoint                      | Who             | Purpose                              |
|--------|-------------------------------|-----------------|--------------------------------------|
| POST   | `/api/auth/register`          | public          | Student sign-up                      |
| POST   | `/api/auth/login`             | public          | Log in, returns JWT                  |
| GET    | `/api/courses`                | any user        | All courses (flagged if selected)    |
| GET    | `/api/courses/mine`           | student         | Selected courses + feedback status   |
| POST   | `/api/enrollments`            | student         | Select a course                      |
| DELETE | `/api/enrollments/:courseId`  | student         | Remove a course                      |
| POST   | `/api/feedback`               | student         | Submit the feedback form             |
| GET    | `/api/reports/summary`        | faculty, admin  | Per-course averages and totals       |
| GET    | `/api/reports/course/:id`     | faculty, admin  | Distribution, averages and comments  |
| POST   | `/api/courses`                | admin           | Add a course                         |
| DELETE | `/api/courses/:id`            | admin           | Delete a course                      |

## Git workflow used in this project

- `main` always holds working code.
- New work happens on a `feature/<name>` branch and is merged through a pull request that closes its issue (for example `Closes #1`).
- Commit messages follow the pattern `type(scope): summary`, such as `feat(server): add feedback route`.
