import { useState } from 'react';
import { ArrowRight, LockKeyhole, ShoppingBag } from 'lucide-react';
import { api, errorMessage } from './api';

export function Login({ onLogin, notify }) {
  const [setup, setSetup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const { data } = await api.post(setup ? '/auth/setup-admin' : '/auth/login', payload);
      if (data.user.role !== 'admin') {
        setError('This account does not have administrator access.');
        return;
      }
      localStorage.setItem('clothes-admin-token', data.token);
      onLogin(data.user);
      notify(setup ? 'Administrator account created.' : 'Welcome back.');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-art" aria-label="Clothes Store administration">
        <div className="login-art-top"><span className="brand-mark"><ShoppingBag size={19} /></span><span>ATELIER / STORE OPS</span></div>
        <div className="login-art-copy">
          <span className="eyebrow">THE DAILY EDIT</span>
          <h1>Good things<br />are in motion.</h1>
          <p>A clear view of your store, from first click to final delivery.</p>
        </div>
        <div className="login-photo-label"><span>COLLECTION 01</span><span>NEW SEASON / 2026</span></div>
      </section>
      <section className="login-panel">
        <div className="login-panel-inner">
          <div className="login-mobile-brand"><span className="brand-mark"><ShoppingBag size={18} /></span> CLOTHES STORE</div>
          <div className="login-icon"><LockKeyhole size={20} /></div>
          <p className="eyebrow">ADMIN WORKSPACE</p>
          <h2>{setup ? 'Create your admin' : 'Welcome back'}</h2>
          <p className="login-subtitle">{setup ? 'Set up the first administrator for this store.' : 'Sign in to manage your store operations.'}</p>
          <form className="login-form" onSubmit={submit}>
            {setup && <Field label="Full name" name="name" placeholder="Your name" required minLength={2} />}
            <Field label="Email address" name="email" type="email" placeholder="you@yourstore.com" required />
            <Field label="Password" name="password" type="password" placeholder="At least 10 characters" required minLength={10} />
            {setup && <Field label="One-time setup key" name="setupKey" type="password" placeholder="From backend/.env" required />}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-dark login-submit" type="submit" disabled={busy}>
              {busy ? <span className="spinner spinner-light" /> : <>{setup ? 'Create administrator' : 'Sign in'} <ArrowRight size={16} /></>}
            </button>
          </form>
          <button className="text-button setup-toggle" type="button" onClick={() => { setSetup(!setup); setError(''); }}>
            {setup ? 'Already configured? Sign in' : 'First time here? Set up your administrator'}
          </button>
          <p className="login-footnote">Protected with secure, role-based access</p>
        </div>
      </section>
    </main>
  );
}

function Field({ label, ...props }) {
  return <label className="field"><span>{label}</span><input {...props} autoComplete={props.type === 'password' ? 'current-password' : 'off'} /></label>;
}