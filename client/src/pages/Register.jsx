import { useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import Notice from '../components/Notice.jsx';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', usn: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('The two passwords do not match.');

    setBusy(true);
    try {
      await register({ name: form.name, email: form.email, usn: form.usn, password: form.password });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={onSubmit} noValidate>
        <h1>Create your account</h1>
        <p className="muted">For students. Faculty and admin accounts are created by the department office.</p>

        <Notice>{error}</Notice>

        <label htmlFor="name">Full name</label>
        <input id="name" value={form.name} onChange={set('name')} autoComplete="name" />

        <label htmlFor="email">College email</label>
        <input id="email" type="email" value={form.email} onChange={set('email')} placeholder="name@dsce.edu.in" autoComplete="email" />

        <label htmlFor="usn">USN</label>
        <input id="usn" value={form.usn} onChange={set('usn')} placeholder="1DS24MC001" />

        <div className="two-col">
          <div>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="confirm">Confirm password</label>
            <input id="confirm" type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
          </div>
        </div>

        <button className="btn primary block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="auth-switch">Already registered? <a href="#/login">Log in</a></p>
      </form>
    </div>
  );
}
