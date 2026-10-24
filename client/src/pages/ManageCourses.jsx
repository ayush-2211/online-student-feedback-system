import { useState } from 'react';
import { api } from '../api.js';
import { useAsync } from '../hooks.js';
import Notice from '../components/Notice.jsx';

const EMPTY = { code: '', title: '', semester: '3', credits: '3', facultyId: '', description: '' };

// Admin-only: add and remove courses
export default function ManageCourses() {
  const courses = useAsync(() => api.get('/courses'));
  const faculty = useAsync(() => api.get('/courses/faculty'));
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState({ kind: 'error', text: '' });
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function onAdd(e) {
    e.preventDefault();
    setMessage({ kind: 'error', text: '' });
    setBusy(true);
    try {
      await api.post('/courses', form);
      setMessage({ kind: 'success', text: `${form.code.toUpperCase()} added to the course list.` });
      setForm(EMPTY);
      await courses.reload();
    } catch (err) {
      setMessage({ kind: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(course) {
    const ok = window.confirm(`Delete ${course.code}? Its enrolments and all feedback for it will also be deleted.`);
    if (!ok) return;
    setMessage({ kind: 'error', text: '' });
    try {
      await api.del(`/courses/${course.id}`);
      setMessage({ kind: 'success', text: `${course.code} deleted.` });
      await courses.reload();
    } catch (err) {
      setMessage({ kind: 'error', text: err.message });
    }
  }

  return (
    <section className="container page">
      <div className="page-head">
        <h1>Manage courses</h1>
        <p className="muted">Add the courses students can select, and assign each one to a faculty member.</p>
      </div>

      <Notice kind={message.kind}>{message.text || courses.error || faculty.error}</Notice>

      <form className="panel add-course" onSubmit={onAdd} noValidate>
        <h2>Add a course</h2>
        <div className="grid-3">
          <div>
            <label htmlFor="code">Course code</label>
            <input id="code" value={form.code} onChange={set('code')} placeholder="MMCA317" />
          </div>
          <div className="span-2">
            <label htmlFor="title">Course title</label>
            <input id="title" value={form.title} onChange={set('title')} placeholder="Data Visualisation" />
          </div>
          <div>
            <label htmlFor="semester">Semester</label>
            <input id="semester" type="number" min="1" max="8" value={form.semester} onChange={set('semester')} />
          </div>
          <div>
            <label htmlFor="credits">Credits</label>
            <input id="credits" type="number" min="1" max="6" value={form.credits} onChange={set('credits')} />
          </div>
          <div>
            <label htmlFor="facultyId">Faculty</label>
            <select id="facultyId" value={form.facultyId} onChange={set('facultyId')}>
              <option value="">Choose faculty</option>
              {(faculty.data || []).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>
        <label htmlFor="description">Short description <span className="muted">(optional)</span></label>
        <input id="description" value={form.description} onChange={set('description')} maxLength={300} />
        <button className="btn primary" disabled={busy}>{busy ? 'Adding…' : 'Add course'}</button>
      </form>

      <h2 className="section-title">All courses</h2>
      {courses.data && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Course</th><th>Faculty</th><th>Semester</th><th>Students</th><th><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {courses.data.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.title}</strong><div className="muted small-text">{c.code}, {c.credits} credits</div></td>
                  <td>{c.faculty_name}</td>
                  <td>{c.semester}</td>
                  <td>{c.enrolled_count}</td>
                  <td className="right"><button className="btn danger small" onClick={() => onDelete(c)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
