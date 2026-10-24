import { api } from '../api.js';
import { useAsync } from '../hooks.js';
import { useAuth } from '../AuthContext.jsx';
import { navigate } from '../router.js';
import Notice from '../components/Notice.jsx';
import Stars from '../components/Stars.jsx';

// Faculty see their own courses; the admin office sees every course
export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(() => api.get('/reports/summary'));
  const isAdmin = user.role === 'admin';

  return (
    <section className="container page">
      <div className="page-head">
        <h1>Feedback overview</h1>
        <p className="muted">
          {isAdmin ? 'Results for every course in the department.' : 'Results for the courses you teach.'}
        </p>
      </div>

      <Notice>{error}</Notice>
      {loading && <p className="muted">Loading results…</p>}

      {data && (
        <>
          <dl className="totals">
            <div><dt>Courses</dt><dd>{data.totals.courses}</dd></div>
            <div><dt>Responses</dt><dd>{data.totals.responses}</dd></div>
            <div><dt>Response rate</dt><dd>{data.totals.responseRate}%</dd></div>
            <div><dt>Average rating</dt><dd>{data.totals.avgRating ?? '-'}<span className="of">/5</span></dd></div>
          </dl>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  {isAdmin && <th>Faculty</th>}
                  <th>Responses</th>
                  <th>Average rating</th>
                </tr>
              </thead>
              <tbody>
                {data.courses.map((c) => {
                  const pct = c.enrolled ? Math.round((c.responses / c.enrolled) * 100) : 0;
                  return (
                    <tr key={c.id} className="clickable" tabIndex={0}
                        onClick={() => navigate(`/dashboard/${c.id}`)}
                        onKeyDown={(e) => e.key === 'Enter' && navigate(`/dashboard/${c.id}`)}>
                      <td>
                        <a href={`#/dashboard/${c.id}`} onClick={(e) => e.stopPropagation()}><strong>{c.title}</strong></a>
                        <div className="muted small-text">{c.code}, semester {c.semester}</div>
                      </td>
                      {isAdmin && <td>{c.faculty_name}</td>}
                      <td>
                        <div className="bar-cell">
                          <span className="bar-track"><span className="bar-fill" style={{ width: `${pct}%` }} /></span>
                          <span className="nowrap">{c.responses} of {c.enrolled}</span>
                        </div>
                      </td>
                      <td>
                        {c.avg_overall === null ? <span className="muted">No feedback yet</span> : (
                          <span className="rating-cell"><Stars value={c.avg_overall} /> <b>{c.avg_overall.toFixed(1)}</b></span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
