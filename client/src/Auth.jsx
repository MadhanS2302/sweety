import { useState } from 'react';
import { api, setToken } from './api';

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api(`/auth/${mode}`, { method: 'POST', body: form });
      setToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card auth" onSubmit={submit}>
      <h2>{mode === 'login' ? 'Log in' : 'Create your account'}</h2>
      {mode === 'register' && (
        <label>Name<input name="name" value={form.name} onChange={update} autoComplete="name" /></label>
      )}
      <label>Email<input name="email" type="email" value={form.email} onChange={update} autoComplete="email" /></label>
      <label>Password
        <input name="password" type="password" value={form.password} onChange={update}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" disabled={loading}>{loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}</button>
      <p className="switch">
        {mode === 'login' ? "New here? " : 'Already have an account? '}
        <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? 'Sign up' : 'Log in'}
        </button>
      </p>
    </form>
  );
}
