
import React, { useState } from 'react';
import {
  ArrowRight,
  LockKeyhole,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';
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
      const { data } = await api.post(
        setup ? '/auth/setup-admin' : '/auth/login',
        payload
      );

      if (data.user?.role !== 'admin') {
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

  function toggleMode() {
    setSetup((current) => !current);
    setError('');
  }

  return (
    <main className="fashion-auth">
      <header className="fashion-auth-header">
        <a className="fashion-auth-brand" href="/" aria-label="Fashion Store">
          <span className="fashion-auth-logo">
            <ShoppingBag size={19} strokeWidth={1.8} />
          </span>
          <span>
            <strong>FASHION STORE</strong>
            <small>ADMINISTRATION</small>
          </span>
        </a>
        <span className="fashion-auth-secure">
          <ShieldCheck size={15} />
          Secure admin access
        </span>
      </header>

      <section className="fashion-auth-content">
        <div className="fashion-auth-card">
          <div className="fashion-auth-icon">
            <LockKeyhole size={22} strokeWidth={1.7} />
          </div>

          <p className="fashion-auth-eyebrow">
            {setup ? 'FIRST-TIME CONFIGURATION' : 'ADMIN WORKSPACE'}
          </p>

          <h1>
            {setup ? 'Create your admin' : 'Welcome back'}
          </h1>

          <p className="fashion-auth-description">
            {setup
              ? 'Set up your administrator account to manage your store.'
              : 'Sign in to manage products, orders and your store.'}
          </p>

          <form className="fashion-auth-form" onSubmit={submit}>
            {setup && (
              <Field
                label="Full name"
                name="name"
                placeholder="Enter your full name"
                required
                minLength={2}
                autoComplete="name"
              />
            )}

            <Field
              label="Email address"
              name="email"
              type="email"
              placeholder="you@yourstore.com"
              required
              autoComplete="username"
            />

            <Field
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              minLength={setup ? 10 : undefined}
              autoComplete={setup ? 'new-password' : 'current-password'}
            />

            {setup && (
              <Field
                label="One-time setup key"
                name="setupKey"
                type="password"
                placeholder="Enter your setup key"
                required
                autoComplete="off"
              />
            )}

            {error && (
              <p className="fashion-auth-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="fashion-auth-submit"
              type="submit"
              disabled={busy}
            >
              {busy ? (
                <span className="fashion-auth-spinner" />
              ) : (
                <>
                  {setup ? 'Create administrator' : 'Sign in to dashboard'}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className="fashion-auth-switch">
            <span>
              {setup ? 'Already configured?' : 'First time here?'}
            </span>
            <button type="button" onClick={toggleMode}>
              {setup ? 'Sign in' : 'Set up administrator'}
            </button>
          </div>

          <div className="fashion-auth-divider" />

          <p className="fashion-auth-footnote">
            <ShieldCheck size={14} />
            Protected with secure, role-based access
          </p>
        </div>

        <p className="fashion-auth-copyright">
          © {new Date().getFullYear()} Fashion Store. All rights reserved.
        </p>
      </section>
    </main>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="fashion-auth-field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}