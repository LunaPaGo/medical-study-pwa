import { FormEvent, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Github, KeyRound, LogIn, MailPlus } from 'lucide-react';
import { env } from '../config/env';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { authSchema, resetPasswordSchema } from '../validation/auth';

type AuthMode = 'login' | 'register' | 'reset';

export function AuthPage() {
  const { session } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setError('');
    setMessage('');
  }, [mode]);

  if (session) {
    return <Navigate to="/" replace />;
  }

  const title =
    mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Crear cuenta' : 'Recuperar contraseña';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    const validation = mode === 'reset' ? resetPasswordSchema.safeParse({ email }) : authSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Revisá los datos ingresados.');
      return;
    }

    if (!env.isSupabaseConfigured) {
      setError('Configurá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local para conectar Supabase.');
      return;
    }

    setIsSubmitting(true);

    const redirectTo = `${window.location.origin}/`;
    const result =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : mode === 'register'
          ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } })
          : await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setMessage(
      mode === 'reset'
        ? 'Te enviamos un correo para restablecer la contraseña.'
        : mode === 'register'
          ? 'Cuenta creada. Si Supabase pide confirmación, revisá tu correo.'
          : 'Sesión iniciada.'
    );
  }

  async function signInWithGithub() {
    setError('');

    if (!env.isSupabaseConfigured) {
      setError('Configurá Supabase antes de usar GitHub.');
      return;
    }

    const { error: githubError } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/` }
    });

    if (githubError) {
      setError(githubError.message);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-brand">
          <div className="brand-mark">+</div>
          <div>
            <span>Estudio Médico</span>
            <strong>Tu biblioteca clínica, lista para crecer.</strong>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h1 id="auth-title">{title}</h1>
          <p>Ingresá con tu cuenta para mantener los datos sincronizados entre Windows, Android y la nube.</p>

          {!env.isSupabaseConfigured && (
            <div className="notice warning">Falta configurar Supabase en el archivo .env.local.</div>
          )}

          <label>
            Email
            <input
              autoComplete="email"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              type="email"
              value={email}
            />
          </label>

          {mode !== 'reset' && (
            <label>
              Contraseña
              <input
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 6 caracteres"
                type="password"
                value={password}
              />
            </label>
          )}

          {error && <div className="notice error">{error}</div>}
          {message && <div className="notice success">{message}</div>}

          <button className="primary-button" disabled={isSubmitting} type="submit">
            {mode === 'login' && <LogIn size={18} aria-hidden="true" />}
            {mode === 'register' && <MailPlus size={18} aria-hidden="true" />}
            {mode === 'reset' && <KeyRound size={18} aria-hidden="true" />}
            {isSubmitting ? 'Procesando...' : title}
          </button>
        </form>

        <div className="auth-actions">
          <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Crear cuenta nueva' : 'Ya tengo cuenta'}
          </button>
          <button type="button" onClick={() => setMode('reset')}>
            Recuperar contraseña
          </button>
          <button type="button" onClick={signInWithGithub}>
            <Github size={18} aria-hidden="true" />
            Continuar con GitHub
          </button>
        </div>
      </section>
    </main>
  );
}
