const express = require('express');
const pool = require('../db');
const { authenticate, authorize, asyncHandler } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, authorize('student'));

const isRating = (n) => Number.isInteger(n) && n >= 1 && n <= 5;

// POST /api/feedback  -> submit the feedback form for a selected course (one per course)
router.post('/', asyncHandler(async (req, res) => {
  const { courseId, ratingTeaching, ratingContent, ratingInteraction, ratingOverall, comments, anonymous } = req.body;

  const ratings = [ratingTeaching, ratingContent, ratingInteraction, ratingOverall].map(Number);
  if (!courseId || !ratings.every(isRating)) {
    return res.status(400).json({ message: 'Please give every question a rating from 1 to 5.' });
  }
  const text = (comments || '').trim();
  if (text.length > 1000) {
    return res.status(400).json({ message: 'Comments can be at most 1000 characters.' });
  }

  // A student can only review a course they have selected
  const [enrolled] = await pool.execute(
    'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
    [req.user.id, courseId]
  );
  if (!enrolled[0]) return res.status(403).json({ message: 'Select this course before giving feedback.' });

  try {
    await pool.execute(
      `INSERT INTO feedback
         (student_id, course_id, rating_teaching, rating_content, rating_interaction, rating_overall, comments, is_anonymous)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, courseId, ...ratings, text || null, anonymous ? 1 : 0]
    );
    res.status(201).json({ message: 'Thank you! Your feedback has been submitted.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'You have already submitted feedback for this course.' });
    }
    throw err;
  }
}));

// GET /api/feedback/mine  -> the student's own submissions
router.get('/mine', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT f.id, f.rating_teaching, f.rating_content, f.rating_interaction, f.rating_overall,
            f.comments, f.is_anonymous, f.created_at, c.code, c.title
       FROM feedback f
       JOIN courses c ON c.id = f.course_id
      WHERE f.student_id = ?
      ORDER BY f.created_at DESC, f.id DESC`,
    [req.user.id]
  );
  res.json(rows);
}));

module.exports = router;
