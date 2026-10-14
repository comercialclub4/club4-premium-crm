'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError('E-mail ou senha inválidos.');
      setLoading(false);
      return;
    }

    window.location.href = '/';
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-mark">C4</div>
        <p className="eyebrow">Club4 Premium</p>
        <h1>Acesse seu CRM</h1>
        <p className="muted">Entre para acompanhar leads, clientes e atividades comerciais.</p>

        <form onSubmit={handleSubmit} className="form-stack">
          <label>
            E-mail
            <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@empresa.com" />
          </label>
          <label>
            Senha
            <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" disabled={loading}>{loading ? 'Entrando…' : 'Entrar no CRM'}</button>
        </form>
      </section>
    </main>
  );
}
