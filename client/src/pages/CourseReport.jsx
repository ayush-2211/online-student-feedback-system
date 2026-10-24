import { useState } from 'react';
import { api } from '../api.js';
import { useAsync, formatDate } from '../hooks.js';
import Notice from '../components/Notice.jsx';
import Stars from '../components/Stars.jsx';

const FILTERS = [
  { id: 'all', label: 'All feedback' },
  { id: 'high', label: '4 to 5 stars' },
  { id: 'low', label: '1 to 3 stars' },
];

export default function CourseReport({ courseId }) {
  const { data, loading, error } = useAsync(() => api.get(`/reports/course/${courseId}`), [courseId]);
  const [filter, setFilter] = useState('all');

  if (loading) return <section className="container page"><p className="muted">Loading report…</p></section>;
  if (error) {
    return (
      <section className="container page">
        <Notice>{error}</Notice>
        <a className="btn secondary" href="#/dashboard">Back to overview</a>
      </section>
    );
  }

  const { course, stats, distribution, feedback } = data;
  const maxCount = Math.max(1, ...distribution.map((d) => d.count));
  const shown = feedback.filter((f) =>
    filter === 'all' ? true : filter === 'high' ? f.rating_overall >= 4 : f.rating_overall <= 3
  );
  const criteria = [
    ['Teaching quality', stats.teaching],
    ['Course content', stats.content],
    ['Interaction and support', stats.interaction],
  ];

  return (
    <section className="container page">
      <a className="back" href="#/dashboard">Back to overview</a>
      <div className="page-head">
        <h1>{course.title}</h1>
        <p className="muted">{course.code}, {course.faculty_name}, semester {course.semester}</p>
      </div>

      {stats.responses === 0 ? (
        <div className="empty"><p>No feedback has been submitted for this course yet.</p></div>
      ) : (
        <>
          <div className="report-grid">
            <div className="panel">
              <h2>Overall rating</h2>
              <div className="big-rating">
                <span className="big-number">{stats.overall.toFixed(1)}</span>
                <div>
                  <Stars value={stats.overall} />
                  <div className="muted small-text">{stats.responses} responses</div>
                </div>
              </div>
              <ul className="dist">
                {distribution.map((d) => (
                  <li key={d.rating}>
                    <span className="dist-label">{d.rating} star{d.rating > 1 ? 's' : ''}</span>
                    <span className="bar-track"><span className="bar-fill" style={{ width: `${(d.count / maxCount) * 100}%` }} /></span>
                    <span className="dist-count">{d.count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel">
              <h2>Average by question</h2>
              <ul className="criteria">
                {criteria.map(([label, value]) => (
                  <li key={label}>
                    <div className="criteria-top"><span>{label}</span><b>{value.toFixed(1)}</b></div>
                    <span className="bar-track"><span className="bar-fill" style={{ width: `${(value / 5) * 100}%` }} /></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="comments-head">
            <h2 className="section-title">Student comments</h2>
            <div className="chips" role="group" aria-label="Filter feedback">
              {FILTERS.map((f) => (
                <button key={f.id} className={`chip ${filter === f.id ? 'active' : ''}`} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <ul className="comments">
            {shown.map((f) => (
              <li key={f.id}>
                <div className="comment-top">
                  <Stars value={f.rating_overall} />
                  <span className="who">
                    {f.student_name}{f.usn ? `, ${f.usn}` : ''}
                    {f.anonymous && f.usn && <span className="tag">anonymous to faculty</span>}
                  </span>
                  <span className="muted">{formatDate(f.created_at)}</span>
                </div>
                <p className="scores muted">
                  Teaching {f.rating_teaching}, content {f.rating_content}, interaction {f.rating_interaction}
                </p>
                {f.comments ? <p className="quote">{f.comments}</p> : <p className="muted italic">No written comment.</p>}
              </li>
            ))}
            {shown.length === 0 && <li className="muted">No feedback matches this filter.</li>}
          </ul>
        </>
      )}
    </section>
  );
}
