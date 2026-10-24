-- Online Student Feedback System  |  MySQL 8.x
-- Run:  mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS student_feedback
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE student_feedback;

DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;

-- Students, faculty and the admin office share one table; `role` decides what they can do.
CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(120)  NOT NULL UNIQUE,
  usn           VARCHAR(20)   NULL UNIQUE,            -- only students have a USN
  password_hash VARCHAR(100)  NOT NULL,               -- bcrypt hash, never the plain password
  role          ENUM('student','faculty','admin') NOT NULL DEFAULT 'student',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE courses (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(20)   NOT NULL UNIQUE,
  title       VARCHAR(150)  NOT NULL,
  semester    TINYINT       NOT NULL,
  credits     TINYINT       NOT NULL,
  description VARCHAR(300)  NULL,
  faculty_id  INT UNSIGNED  NOT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_courses_faculty FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Course selection: which student has picked which course
CREATE TABLE enrollments (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id  INT UNSIGNED NOT NULL,
  course_id   INT UNSIGNED NOT NULL,
  enrolled_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_enrollment (student_id, course_id),
  CONSTRAINT fk_enr_student FOREIGN KEY (student_id) REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_enr_course  FOREIGN KEY (course_id)  REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- One feedback form per student per course
CREATE TABLE feedback (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id         INT UNSIGNED NOT NULL,
  course_id          INT UNSIGNED NOT NULL,
  rating_teaching    TINYINT NOT NULL,
  rating_content     TINYINT NOT NULL,
  rating_interaction TINYINT NOT NULL,
  rating_overall     TINYINT NOT NULL,
  comments           TEXT    NULL,
  is_anonymous       TINYINT(1) NOT NULL DEFAULT 0,
  created_at         TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_feedback (student_id, course_id),
  KEY idx_feedback_course (course_id),
  CONSTRAINT fk_fb_student FOREIGN KEY (student_id) REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_fb_course  FOREIGN KEY (course_id)  REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT chk_rating_teaching    CHECK (rating_teaching    BETWEEN 1 AND 5),
  CONSTRAINT chk_rating_content     CHECK (rating_content     BETWEEN 1 AND 5),
  CONSTRAINT chk_rating_interaction CHECK (rating_interaction BETWEEN 1 AND 5),
  CONSTRAINT chk_rating_overall     CHECK (rating_overall     BETWEEN 1 AND 5)
) ENGINE=InnoDB;
