const express = require('express');
const pool = require('../db');
const { authenticate, authorize, asyncHandler } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/courses  -> every course, flagged with whether the logged-in student has selected it
router.get('/', asyncHandler(async (req, res) => {
  const [courses] = await pool.execute(
    `SELECT c.id, c.code, c.title, c.semester, c.credits, c.description,
            u.name AS faculty_name,
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrolled_count
       FROM courses c
       JOIN users u ON u.id = c.faculty_id
      ORDER BY c.code`
  );

  let selected = new Set();
  if (req.user.role === 'student') {
    const [rows] = await pool.execute('SELECT course_id FROM enrollments WHERE student_id = ?', [req.user.id]);
    selected = new Set(rows.map((r) => r.course_id));
  }

  res.json(courses.map((c) => ({
    ...c,
    enrolled_count: Number(c.enrolled_count),
    selected: selected.has(c.id),
  })));
}));

// GET /api/courses/mine  -> the student's selected courses + whether feedback is already given
router.get('/mine', authorize('student'), asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT c.id, c.code, c.title, c.semester, c.credits, u.name AS faculty_name,
            (SELECT COUNT(*) FROM feedback f WHERE f.course_id = c.id AND f.student_id = ?) AS feedback_count
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       JOIN users u ON u.id = c.faculty_id
      WHERE e.student_id = ?
      ORDER BY c.code`,
    [req.user.id, req.user.id]
  );
  res.json(rows.map((r) => ({ ...r, feedback_given: Number(r.feedback_count) > 0 })));
}));

// GET /api/courses/faculty  -> faculty list for the "add course" form (admin only)
router.get('/faculty', authorize('admin'), asyncHandler(async (req, res) => {
  const [rows] = await pool.execute("SELECT id, name FROM users WHERE role = 'faculty' ORDER BY name");
  res.json(rows);
}));

// POST /api/courses  (admin) -> add a course
router.post('/', authorize('admin'), asyncHandler(async (req, res) => {
  const { code, title, semester, credits, description, facultyId } = req.body;

  if (!code || !title || !semester || !credits || !facultyId) {
    return res.status(400).json({ message: 'Code, title, semester, credits and faculty are required.' });
  }
  const sem = Number(semester);
  const cr = Number(credits);
  if (!Number.isInteger(sem) || sem < 1 || sem > 8) {
    return res.status(400).json({ message: 'Semester must be between 1 and 8.' });
  }
  if (!Number.isInteger(cr) || cr < 1 || cr > 6) {
    return res.status(400).json({ message: 'Credits must be between 1 and 6.' });
  }

  const [faculty] = await pool.execute("SELECT id FROM users WHERE id = ? AND role = 'faculty'", [facultyId]);
  if (!faculty[0]) return res.status(400).json({ message: 'Choose a valid faculty member.' });

  try {
    const [result] = await pool.execute(
      'INSERT INTO courses (code, title, semester, credits, description, faculty_id) VALUES (?, ?, ?, ?, ?, ?)',
      [code.trim().toUpperCase(), title.trim(), sem, cr, (description || '').trim() || null, facultyId]
    );
    res.status(201).json({ id: result.insertId, message: 'Course added.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A course with this code already exists.' });
    }
    throw err;
  }
}));

// DELETE /api/courses/:id  (admin) -> removes the course and (via ON DELETE CASCADE) its enrollments and feedback
router.delete('/:id', authorize('admin'), asyncHandler(async (req, res) => {
  const [result] = await pool.execute('DELETE FROM courses WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ message: 'Course not found.' });
  res.json({ message: 'Course deleted.' });
}));

module.exports = router;
