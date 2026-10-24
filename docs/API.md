# REST API reference

Base URL: `http://localhost:5000/api`. Send `Authorization: Bearer <token>` on every route except register and login.
All bodies are JSON. Errors look like `{ "message": "Human readable explanation" }`.

## Authentication

### POST /auth/register
Body: `{ "name", "email", "usn", "password" }` (password at least 6 characters)
`201` returns `{ token, user }`. `400` for missing fields, `409` if the email or USN already exists.

### POST /auth/login
Body: `{ "email", "password" }`
`200` returns `{ token, user }`. `401` for wrong credentials.

### GET /auth/me
Returns the logged-in user. Used by the client to restore a session after a page refresh.

## Courses and selection (students)

### GET /courses
Every course with `faculty_name`, `enrolled_count` and `selected` (true when the student has chosen it).

### GET /courses/mine
The student's selected courses with `feedback_given` (true or false).

### POST /enrollments
Body: `{ "courseId" }`. `201` on success, `409` if already selected.

### DELETE /enrollments/:courseId
`200` on success. `400` if feedback was already submitted for the course.

## Feedback (students)

### POST /feedback
Body:
```json
{
  "courseId": 4,
  "ratingTeaching": 5,
  "ratingContent": 4,
  "ratingInteraction": 5,
  "ratingOverall": 5,
  "comments": "Optional text, up to 1000 characters",
  "anonymous": true
}
```
`201` on success. `400` when a rating is missing or outside 1 to 5. `403` if the course was not selected. `409` if feedback was already submitted.

### GET /feedback/mine
The student's own submissions, newest first.

## Reports (faculty and admin)

### GET /reports/summary
Totals (`courses`, `responses`, `responseRate`, `avgRating`) and one row per course.
Faculty only receive the courses they teach.

### GET /reports/course/:id
Course details, `stats` (overall and per-question averages), `distribution` (count for 5 to 1 stars) and every `feedback` entry.
Faculty get `403` for courses they do not teach. Anonymous authors are hidden from faculty and visible to admin.

## Course management (admin)

### GET /courses/faculty
Faculty members for the "add course" form.

### POST /courses
Body: `{ "code", "title", "semester", "credits", "facultyId", "description" }`. `409` if the code exists.

### DELETE /courses/:id
Deletes the course; its enrolments and feedback are removed by `ON DELETE CASCADE`.

Last reviewed: October 2026.