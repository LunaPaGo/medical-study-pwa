import { FormEvent, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Github, KeyRound, LogIn, LogOut, MailPlus } from 'lucide-react';
import { env } from '../config/env';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { useAuth } from '../hooks/useAuth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { supabase } from '../services/supabase';
import { authSchema, resetPasswordSchema } from '../validation/auth';

type AuthMode = 'login' | 'register' | 'reset';

export function AuthPage() {
  const { session, profileStatus, profileError, isLoading, bootStep, signOut } = useAuth();
  const isOnline = useOnlineStatus();
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

  if (session && profileStatus === 'approved') {
    return <Navigate to="/" replace />;
  }

  if (session && isLoading) {
    return <LoadingScreen message={bootStep || 'Comprobando aprobación...'} />;
  }

  if (session && profileError) {
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
          <h1 id="auth-title">No se pudo comprobar la cuenta</h1>
          <div className="notice error">{profileError}</div>
          <button className="primary-button" type="button" onClick={signOut}>
            <LogOut size={18} aria-hidden="true" />
            Cerrar sesión
          </button>
        </section>
      </main>
    );
  }

  if (session && profileStatus === 'pending') {
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
          <h1 id="auth-title">Cuenta pendiente</h1>
          <div className="notice warning">
            Tu cuenta fue creada correctamente, pero está pendiente de aprobación por el administrador.
          </div>
          <button className="primary-button" type="button" onClick={signOut}>
            <LogOut size={18} aria-hidden="true" />
            Cerrar sesión
          </button>
        </section>
      </main>
    );
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
          ? 'Tu cuenta fue creada correctamente, pero está pendiente de aprobación por el administrador.'
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
          {!session && !isOnline && (
            <div className="notice warning">Necesitás conexión a Internet para iniciar sesión y validar tu cuenta.</div>
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

          <button className="primary-button" disabled={isSubmitting || !isOnline} type="submit">
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
          <button type="button" onClick={signInWithGithub} disabled={!isOnline}>
            <Github size={18} aria-hidden="true" />
            Continuar con GitHub
          </button>
        </div>
      </section>
    </main>
  );
}
