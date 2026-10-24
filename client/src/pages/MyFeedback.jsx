import { api } from '../api.js';
import { useAsync, formatDate } from '../hooks.js';
import { navigate } from '../router.js';
import Notice from '../components/Notice.jsx';
import Stars from '../components/Stars.jsx';

// Student home: which selected courses still need feedback, plus everything already submitted
export default function MyFeedback() {
  const mine = useAsync(() => api.get('/courses/mine'));
  const history = useAsync(() => api.get('/feedback/mine'));

  const courses = mine.data || [];
  const pending = courses.filter((c) => !c.feedback_given).length;

  return (
    <section className="container page">
      <div className="page-head">
        <h1>My feedback</h1>
        <p className="muted">
          {mine.data
            ? pending > 0
              ? `${pending} ${pending === 1 ? 'course is' : 'courses are'} waiting for your feedback.`
              : courses.length ? 'You have given feedback for all your courses. Thank you.' : ''
            : ''}
        </p>
      </div>

      <Notice>{mine.error || history.error}</Notice>

      {mine.data && courses.length === 0 && (
        <div className="empty">
          <p>You have not selected any courses yet.</p>
          <a className="btn primary" href="#/courses">Select courses</a>
        </div>
      )}

      {courses.length > 0 && (
        <ul className="list">
          {courses.map((c) => (
            <li key={c.id} className="row">
              <span className="code">{c.code}</span>
              <div className="row-main">
                <strong>{c.title}</strong>
                <span className="muted">{c.faculty_name}</span>
              </div>
              <span className={`badge ${c.feedback_given ? 'done' : 'pending'}`}>
                {c.feedback_given ? 'Submitted' : 'Pending'}
              </span>
              {c.feedback_given ? (
                <span className="btn-spacer" />
              ) : (
                <button className="btn primary small" onClick={() => navigate(`/feedback/${c.id}`)}>Give feedback</button>
              )}
            </li>
          ))}
        </ul>
      )}

      {history.data && history.data.length > 0 && (
        <>
          <h2 className="section-title">Submitted so far</h2>
          <ul className="history">
            {history.data.map((f) => (
              <li key={f.id}>
                <div className="history-top">
                  <strong>{f.code} {f.title}</strong>
                  <span className="muted">{formatDate(f.created_at)}</span>
                </div>
                <div className="history-rating">
                  <Stars value={f.rating_overall} />
                  <span className="muted">{f.is_anonymous ? 'Sent anonymously' : 'Sent with your name'}</span>
                </div>
                {f.comments && <p className="quote">{f.comments}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
