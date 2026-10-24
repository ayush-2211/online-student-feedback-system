import { useState } from 'react';
import { api } from '../api.js';
import { useAsync } from '../hooks.js';
import Notice from '../components/Notice.jsx';

// Course selection: the student picks the courses they are studying this semester
export default function Courses() {
  const { data: courses, loading, error, reload } = useAsync(() => api.get('/courses'));
  const [message, setMessage] = useState({ kind: 'error', text: '' });
  const [busyId, setBusyId] = useState(null);

  async function toggle(course) {
    setBusyId(course.id);
    setMessage({ kind: 'error', text: '' });
    try {
      if (course.selected) await api.del(`/enrollments/${course.id}`);
      else await api.post('/enrollments', { courseId: course.id });
      await reload();
    } catch (err) {
      setMessage({ kind: 'error', text: err.message });
    } finally {
      setBusyId(null);
    }
  }

  const selectedCount = (courses || []).filter((c) => c.selected).length;

  return (
    <section className="container page">
      <div className="page-head">
        <h1>Select your courses</h1>
        <p className="muted">Pick the courses you are taking this semester. You can only give feedback on courses you have selected.</p>
      </div>

      <Notice kind={message.kind}>{message.text || error}</Notice>
      {loading && !courses && <p className="muted">Loading courses…</p>}

      {courses && (
        <>
          <p className="count-line">{selectedCount} of {courses.length} courses selected</p>
          <ul className="list">
            {courses.map((c) => (
              <li key={c.id} className={`row ${c.selected ? 'is-selected' : ''}`}>
                <span className="code">{c.code}</span>
                <div className="row-main">
                  <strong>{c.title}</strong>
                  <span className="muted">{c.faculty_name}, semester {c.semester}, {c.credits} credits</span>
                  {c.description && <span className="desc">{c.description}</span>}
                </div>
                <span className="muted nowrap">{c.enrolled_count} students</span>
                <button
                  className={`btn small ${c.selected ? 'secondary' : 'primary'}`}
                  disabled={busyId === c.id}
                  onClick={() => toggle(c)}
                >
                  {c.selected ? 'Remove' : 'Select'}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
