# Database design

MySQL 8, database `student_feedback`. Created by `database/schema.sql`.

| Table         | Purpose                                              | Key columns                                                        |
|---------------|------------------------------------------------------|--------------------------------------------------------------------|
| `users`       | Students, faculty and admin (one table, `role` column) | `email` (unique), `usn` (unique, students only), `password_hash`   |
| `courses`     | Courses students can select                          | `code` (unique), `faculty_id` references `users`                   |
| `enrollments` | Which student selected which course                  | unique `(student_id, course_id)`                                   |
| `feedback`    | One feedback form per student per course             | four ratings (1 to 5), `comments`, `is_anonymous`, unique `(student_id, course_id)` |

## Rules enforced by the database

- A student cannot select the same course twice, or review a course twice (unique keys).
- Ratings must be between 1 and 5 (`CHECK` constraints).
- Deleting a course also deletes its enrolments and feedback (`ON DELETE CASCADE`).
- A faculty member who still teaches a course cannot be deleted (`ON DELETE RESTRICT`).
