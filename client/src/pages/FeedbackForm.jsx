import { useState } from 'react';
import { api } from '../api.js';
import { useAsync } from '../hooks.js';
import Notice from '../components/Notice.jsx';
import StarRating from '../components/StarRating.jsx';

const QUESTIONS = [
  { key: 'ratingTeaching', title: 'Teaching quality', hint: 'How clearly and effectively were the topics taught?' },
  { key: 'ratingContent', title: 'Course content', hint: 'Was the syllabus relevant, up to date and well organised?' },
  { key: 'ratingInteraction', title: 'Interaction and support', hint: 'Did the faculty encourage questions and clear your doubts?' },
  { key: 'ratingOverall', title: 'Overall experience', hint: 'Your overall rating for this course.' },
];
const MAX_COMMENT = 1000;

export default function FeedbackForm({ courseId }) {
  const { data: courses, loading, error } = useAsync(() => api.get('/courses/mine'));
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [showMissing, setShowMissing] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const course = (courses || []).find((c) => String(c.id) === String(courseId));
  const missing = QUESTIONS.filter((q) => !ratings[q.key]);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    if (missing.length > 0) {
      setShowMissing(true);
      return;
    }
    setBusy(true);
    try {
      await api.post('/feedback', { courseId: course.id, ...ratings, comments, anonymous });
      setDone(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <section className="container page"><p className="muted">Loading…</p></section>;
  if (error) return <section className="container page"><Notice>{error}</Notice></section>;

  if (!course) {
    return (
      <section className="container page">
        <Notice>This course is not in your selected list. Select it first, then come back.</Notice>
        <a className="btn secondary" href="#/courses">Go to course selection</a>
      </section>
    );
  }

  if (done || course.feedback_given) {
    return (
      <section className="container page narrow">
        <div className="success-panel">
          <h1>{done ? 'Feedback submitted' : 'Already submitted'}</h1>
          <p>
            {done
              ? `Thank you. Your feedback for ${course.code} ${course.title} has been recorded.`
              : `You have already given feedback for ${course.code} ${course.title}.`}
          </p>
          <a className="btn primary" href="#/feedback">Back to my feedback</a>
        </div>
      </section>
    );
  }

  return (
    <section className="container page narrow">
      <a className="back" href="#/feedback">Back to my feedback</a>
      <div className="page-head">
        <h1>{course.title}</h1>
        <p className="muted">{course.code}, {course.faculty_name}, semester {course.semester}</p>
      </div>

      <form className="feedback-form" onSubmit={onSubmit} noValidate>
        {QUESTIONS.map((q) => (
          <fieldset key={q.key} className={showMissing && !ratings[q.key] ? 'q has-error' : 'q'}>
            <legend id={`lbl-${q.key}`}>{q.title}</legend>
            <p className="hint">{q.hint}</p>
            <StarRating
              labelledBy={`lbl-${q.key}`}
              value={ratings[q.key] || 0}
              onChange={(n) => setRatings({ ...ratings, [q.key]: n })}
            />
            {showMissing && !ratings[q.key] && <p className="field-error">Choose a rating for this question.</p>}
          </fieldset>
        ))}

        <div className="q">
          <label htmlFor="comments" className="legend-like">Comments <span className="muted">(optional)</span></label>
          <p className="hint">What worked well, and what should change? Be specific so the faculty can act on it.</p>
          <textarea
            id="comments"
            rows="5"
            maxLength={MAX_COMMENT}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="For example: the live-coding sessions helped, but I would like more practice problems before tests."
          />
          <div className="counter">{comments.length}/{MAX_COMMENT}</div>
        </div>

        <label className="check">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          <span>
            Hide my name from the faculty
            <small>Faculty will see your ratings and comments but not who wrote them.</small>
          </span>
        </label>

        {showMissing && missing.length > 0 && (
          <Notice>{`Rate ${missing.length === 1 ? 'the remaining question' : `the ${missing.length} remaining questions`} before submitting.`}</Notice>
        )}
        <Notice>{submitError}</Notice>

        <div className="form-actions">
          <button className="btn primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit feedback'}</button>
          <a className="btn secondary" href="#/feedback">Cancel</a>
        </div>
      </form>
    </section>
  );
}
