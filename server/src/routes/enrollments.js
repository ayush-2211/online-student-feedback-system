const express = require('express');
const pool = require('../db');
const { authenticate, authorize, asyncHandler } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, authorize('student'));

// POST /api/enrollments  { courseId }  -> student selects a course
router.post('/', asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  if (!courseId) return res.status(400).json({ message: 'courseId is required.' });

  const [course] = await pool.execute('SELECT id FROM courses WHERE id = ?', [courseId]);
  if (!course[0]) return res.status(404).json({ message: 'Course not found.' });

  try {
    await pool.execute('INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)', [req.user.id, courseId]);
    res.status(201).json({ message: 'Course selected.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'You have already selected this course.' });
    }
    throw err;
  }
}));

// DELETE /api/enrollments/:courseId  -> student drops a course (only if no feedback was submitted for it)
router.delete('/:courseId', asyncHandler(async (req, res) => {
  const [fb] = await pool.execute(
    'SELECT COUNT(*) AS n FROM feedback WHERE student_id = ? AND course_id = ?',
    [req.user.id, req.params.courseId]
  );
  if (Number(fb[0].n) > 0) {
    return res.status(400).json({ message: 'You have already submitted feedback for this course, so it cannot be removed.' });
  }

  const [result] = await pool.execute(
    'DELETE FROM enrollments WHERE student_id = ? AND course_id = ?',
    [req.user.id, req.params.courseId]
  );
  if (result.affectedRows === 0) return res.status(404).json({ message: 'You have not selected this course.' });
  res.json({ message: 'Course removed.' });
}));

module.exports = router;
