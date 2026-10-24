import { useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import Notice from '../components/Notice.jsx';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={onSubmit} noValidate>
        <h1>Log in</h1>
        <p className="muted">Use your college email to give feedback or view results.</p>

        <Notice>{error}</Notice>

        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="username" value={form.email} onChange={set('email')} placeholder="name@dsce.edu.in" required />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="current-password" value={form.password} onChange={set('password')} required />

        <button className="btn primary block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>

        <p className="auth-switch">New student? <a href="#/register">Create an account</a></p>

        <dl className="demo-box">
          <dt>Demo accounts</dt>
          <dd><b>Student</b> ananya.sharma@dsce.edu.in / Student@123</dd>
          <dd><b>Faculty</b> anitha.rao@dsce.edu.in / Faculty@123</dd>
          <dd><b>Admin</b> admin@dsce.edu.in / Admin@123</dd>
        </dl>
      </form>
    </div>
  );
}
