import React, { useState } from 'react';
import { Usuario } from '../types';
import { dataStore, DEMO_CIUDADANO, DEMO_ADMIN } from '../services/store';

interface LoginViewProps {
  onLoginSuccess: (user: Usuario) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Por favor ingresa tu correo electrónico y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const result = await dataStore.loginUser(email, password);
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.user) {
        onLoginSuccess(result.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || !email.trim() || !password) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    setLoading(true);
    try {
      const result = await dataStore.registerUser(nombre, email, password);
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.user) {
        onLoginSuccess(result.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (targetEmail: string, targetPass: string) => {
    setMode('login');
    setError(null);
    setEmail(targetEmail);
    setPassword(targetPass);
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50 dark:bg-slate-950">
      {/* Barra superior minimalista */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-800 font-bold text-white shadow-sm">
              RU
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                ReporteUrbano
              </span>
              <span className="ml-2 hidden rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 sm:inline-block dark:bg-slate-800 dark:text-slate-400">
                Gestión de Incidencias Urbanas
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenedor central de autenticación */}
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {mode === 'login' ? 'Iniciar Sesión' : 'Registro Ciudadano'}
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {mode === 'login'
                ? 'Ingresa con tu cuenta de Ciudadano o de Administración Municipal'
                : 'Crea una cuenta para reportar y dar seguimiento a incidencias en tu ciudad'}
            </p>
          </div>

          {/* Selector Login / Registro */}
          <div className="mt-6 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-white text-sky-800 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-white text-sky-800 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              ⚠️ {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@correo.com"
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-sky-800 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Ingresar al Sistema'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Ana Gómez"
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ana@correo.com"
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Contraseña (mín. 6 caracteres)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                ℹ️ Se asignará automáticamente el perfil de <strong>Ciudadano</strong>.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-sky-800 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Creando cuenta...' : 'Registrarme e Ingresar'}
              </button>
            </form>
          )}
        </div>

        {/* Pequeña tarjeta con usuario y contraseña para pruebas */}
        <div className="mt-4 rounded-xl border border-slate-200/90 bg-white/80 p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              🔑 Credenciales de Acceso (Click para autocompletar)
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                fillCredentials(DEMO_CIUDADANO.email, DEMO_CIUDADANO.password_hash || 'ciudadano123')
              }
              className="flex flex-col rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 text-left transition-colors hover:border-sky-600 hover:bg-sky-50/50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-sky-500 cursor-pointer"
            >
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                👤 Rol Ciudadano
              </span>
              <span className="mt-1 font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">
                {DEMO_CIUDADANO.email}
              </span>
              <span className="font-mono text-[11px] font-semibold text-sky-800 dark:text-sky-400">
                Clave: {DEMO_CIUDADANO.password_hash}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                fillCredentials(DEMO_ADMIN.email, DEMO_ADMIN.password_hash || 'admin123')
              }
              className="flex flex-col rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 text-left transition-colors hover:border-sky-600 hover:bg-sky-50/50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-sky-500 cursor-pointer"
            >
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                🏛️ Rol Administrador
              </span>
              <span className="mt-1 font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">
                {DEMO_ADMIN.email}
              </span>
              <span className="font-mono text-[11px] font-semibold text-sky-800 dark:text-sky-400">
                Clave: {DEMO_ADMIN.password_hash}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pie de página */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        <strong>ReporteUrbano</strong> · Plataforma Cívica de Gestión de Incidencias Urbanas
      </footer>
    </div>
  );
};
