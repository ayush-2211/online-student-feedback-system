import { useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useHashPath, match, navigate } from './router.js';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Courses from './pages/Courses.jsx';
import MyFeedback from './pages/MyFeedback.jsx';
import FeedbackForm from './pages/FeedbackForm.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CourseReport from './pages/CourseReport.jsx';
import ManageCourses from './pages/ManageCourses.jsx';

const HOME = { student: '/feedback', faculty: '/dashboard', admin: '/dashboard' };

// pattern, who may open it (null = public pages), and what to render
const ROUTES = [
  { pattern: '/login', roles: null, render: () => <Login /> },
  { pattern: '/register', roles: null, render: () => <Register /> },
  { pattern: '/courses', roles: ['student'], render: () => <Courses /> },
  { pattern: '/feedback', roles: ['student'], render: () => <MyFeedback /> },
  { pattern: '/feedback/:courseId', roles: ['student'], render: (p) => <FeedbackForm courseId={p.courseId} /> },
  { pattern: '/dashboard', roles: ['faculty', 'admin'], render: () => <Dashboard /> },
  { pattern: '/dashboard/:courseId', roles: ['faculty', 'admin'], render: (p) => <CourseReport courseId={p.courseId} /> },
  { pattern: '/manage', roles: ['admin'], render: () => <ManageCourses /> },
];

export default function App() {
  const { user, loading } = useAuth();
  const path = useHashPath();

  let found = null;
  for (const r of ROUTES) {
    const params = match(r.pattern, path);
    if (params) { found = { route: r, params }; break; }
  }

  // Work out where this visitor should really be (guards for login state and role)
  let redirect = null;
  if (!loading) {
    if (!user) {
      if (!found || found.route.roles) redirect = '/login';
    } else if (!found || !found.route.roles || !found.route.roles.includes(user.role)) {
      redirect = HOME[user.role];
    }
  }

  useEffect(() => {
    if (redirect && redirect !== path) navigate(redirect);
  }, [redirect, path]);

  return (
    <>
      <Navbar path={path} />
      <main>
        {loading || redirect ? null : found.route.render(found.params)}
      </main>
    </>
  );
}
