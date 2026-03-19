import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useToastStore } from '../store';
import { Btn, Input } from '../components/ui';

const Wrap = ({ title, sub, children }) => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--bg)' }}>
    <div style={{ width: '100%', maxWidth: 400 }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <Link to="/" style={{ fontSize: 22, fontWeight: 700, color: 'var(--blue-btn)' }}>Booknverse</Link>
        <h1 className="h2" style={{ marginTop: 18 }}>{title}</h1>
        <p style={{ color: 'var(--text-2)', marginTop: 5, fontSize: 14 }}>{sub}</p>
      </div>
      <div className="card" style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);
  const { login }       = useAuthStore();
  const { add }         = useToastStore();
  const navigate        = useNavigate();
  const location        = useLocation();
  const from            = location.state?.from?.pathname || '/';

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await login(form.email, form.password);
      add('Welcome back!');
      navigate(from, { replace: true });
    } catch (e) { setErr(e.response?.data?.message || 'Login failed.'); }
    finally { setBusy(false); }
  };

  return (
    <Wrap title="Welcome back" sub="Log in to your account">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Email" type="email" placeholder="you@example.com"
          value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
        <Input label="Password" type="password" placeholder="••••••••"
          value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
        {err && <p style={{ color: 'var(--rose-800)', fontSize: 13 }}>{err}</p>}
        <Btn variant="primary" full type="submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</Btn>
      </form>
      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-2)' }}>
        No account? <Link to="/register" style={{ color: 'var(--blue-text)', fontWeight: 500 }}>Sign up</Link>
      </p>
    </Wrap>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);
  const { register }    = useAuthStore();
  const { add }         = useToastStore();
  const navigate        = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await register(form.username, form.email, form.password);
      add('Welcome to Booknverse!');
      navigate('/');
    } catch (e) { setErr(e.response?.data?.message || 'Registration failed.'); }
    finally { setBusy(false); }
  };

  return (
    <Wrap title="Create account" sub="Join the reading community">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Username" placeholder="readerlover42"
          value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required />
        <Input label="Email" type="email" placeholder="you@example.com"
          value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
        <Input label="Password" type="password" placeholder="At least 6 characters"
          value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
        {err && <p style={{ color: 'var(--rose-800)', fontSize: 13 }}>{err}</p>}
        <Btn variant="primary" full type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</Btn>
      </form>
      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-2)' }}>
        Have an account? <Link to="/login" style={{ color: 'var(--blue-text)', fontWeight: 500 }}>Log in</Link>
      </p>
    </Wrap>
  );
}
