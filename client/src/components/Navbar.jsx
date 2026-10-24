import { useAuth } from '../AuthContext.jsx';
import { navigate } from '../router.js';

const LINKS = {
  student: [
    { to: '/feedback', label: 'My feedback' },
    { to: '/courses', label: 'Select courses' },
  ],
  faculty: [{ to: '/dashboard', label: 'Dashboard' }],
  admin: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/manage', label: 'Manage courses' },
  ],
};

export default function Navbar({ path }) {
  const { user, logout } = useAuth();
  const links = user ? LINKS[user.role] : [];

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <a className="brand" href="#/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          <span className="brand-mark" aria-hidden="true">★</span>
          <span>
            Course Feedback
            <small>DSCE, Department of MCA</small>
          </span>
        </a>

        {user && (
          <>
            <nav className="nav" aria-label="Main">
              {links.map((l) => (
                <a key={l.to} href={`#${l.to}`} className={path === l.to || path.startsWith(`${l.to}/`) ? 'active' : ''}>
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="user-chip">
              <span>
                {user.name}
                <small>{user.role === 'student' ? user.usn : user.role}</small>
              </span>
              <button className="btn secondary small" onClick={logout}>Log out</button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
