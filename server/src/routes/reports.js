const express = require('express');
const pool = require('../db');
const { authenticate, authorize, asyncHandler } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, authorize('faculty', 'admin'));

const round2 = (n) => (n === null || n === undefined ? null : Math.round(Number(n) * 100) / 100);

// GET /api/reports/summary
// Admin sees every course; faculty only sees the courses they teach.
router.get('/summary', asyncHandler(async (req, res) => {
  const onlyMine = req.user.role === 'faculty';
  const params = onlyMine ? [req.user.id] : [];

  const [rows] = await pool.execute(
    `SELECT c.id, c.code, c.title, c.semester, u.name AS faculty_name,
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrolled,
            COUNT(f.id) AS responses,
            AVG(f.rating_overall) AS avg_overall
       FROM courses c
       JOIN users u ON u.id = c.faculty_id
       LEFT JOIN feedback f ON f.course_id = c.id
      ${onlyMine ? 'WHERE c.faculty_id = ?' : ''}
      GROUP BY c.id, c.code, c.title, c.semester, u.name
      ORDER BY c.code`,
    params
  );

  const courses = rows.map((r) => ({
    id: r.id,
    code: r.code,
    title: r.title,
    semester: r.semester,
    faculty_name: r.faculty_name,
    enrolled: Number(r.enrolled),
    responses: Number(r.responses),
    avg_overall: round2(r.avg_overall),
  }));

  const totalResponses = courses.reduce((s, c) => s + c.responses, 0);
  const totalEnrolled = courses.reduce((s, c) => s + c.enrolled, 0);
  const weighted = courses.reduce((s, c) => s + (c.avg_overall || 0) * c.responses, 0);

  res.json({
    totals: {
      courses: courses.length,
      responses: totalResponses,
      responseRate: totalEnrolled ? Math.round((totalResponses / totalEnrolled) * 100) : 0,
      avgRating: totalResponses ? round2(weighted / totalResponses) : null,
    },
    courses,
  });
}));

// GET /api/reports/course/:id  -> criteria averages, rating distribution and every comment
router.get('/course/:id', asyncHandler(async (req, res) => {
  const [courseRows] = await pool.execute(
    `SELECT c.id, c.code, c.title, c.semester, c.credits, c.faculty_id, u.name AS faculty_name
       FROM courses c JOIN users u ON u.id = c.faculty_id
      WHERE c.id = ?`,
    [req.params.id]
  );
  const course = courseRows[0];
  if (!course) return res.status(404).json({ message: 'Course not found.' });
  if (req.user.role === 'faculty' && course.faculty_id !== req.user.id) {
    return res.status(403).json({ message: 'You can only view feedback for your own courses.' });
  }

  const [statRows] = await pool.execute(
    `SELECT COUNT(*) AS responses,
            AVG(rating_teaching) AS teaching, AVG(rating_content) AS content,
            AVG(rating_interaction) AS interaction, AVG(rating_overall) AS overall
       FROM feedback WHERE course_id = ?`,
    [course.id]
  );
  const [distRows] = await pool.execute(
    'SELECT rating_overall AS rating, COUNT(*) AS count FROM feedback WHERE course_id = ? GROUP BY rating_overall',
    [course.id]
  );
  const [feedbackRows] = await pool.execute(
    `SELECT f.id, f.rating_teaching, f.rating_content, f.rating_interaction, f.rating_overall,
            f.comments, f.is_anonymous, f.created_at, s.name AS student_name, s.usn
       FROM feedback f JOIN users s ON s.id = f.student_id
      WHERE f.course_id = ?
      ORDER BY f.created_at DESC, f.id DESC`,
    [course.id]
  );

  const distribution = [5, 4, 3, 2, 1].map((rating) => {
    const hit = distRows.find((d) => Number(d.rating) === rating);
    return { rating, count: hit ? Number(hit.count) : 0 };
  });

  const s = statRows[0];
  const isAdmin = req.user.role === 'admin';
  res.json({
    course,
    stats: {
      responses: Number(s.responses),
      teaching: round2(s.teaching),
      content: round2(s.content),
      interaction: round2(s.interaction),
      overall: round2(s.overall),
    },
    distribution,
    // Faculty never see who wrote an anonymous review; the admin office can (for moderation).
    feedback: feedbackRows.map((f) => {
      const hidden = Boolean(f.is_anonymous) && !isAdmin;
      return {
        id: f.id,
        rating_teaching: f.rating_teaching,
        rating_content: f.rating_content,
        rating_interaction: f.rating_interaction,
        rating_overall: f.rating_overall,
        comments: f.comments,
        anonymous: Boolean(f.is_anonymous),
        created_at: f.created_at,
        student_name: hidden ? 'Anonymous' : f.student_name,
        usn: hidden ? null : f.usn,
      };
    }),
  });
}));

module.exports = router;
