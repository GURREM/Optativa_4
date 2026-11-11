import React, { useState } from 'react';
import { Usuario } from '../types';
import { dataStore, DEMO_CIUDADANO, DEMO_ADMIN } from '../services/store';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Usuario;
  onUserChange: (user: Usuario) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
}) => {
  const [tab, setTab] = useState<'perfil' | 'login' | 'register'>('perfil');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    const user = dataStore.loginUser(email, password);
    if (user) {
      onUserChange(user);
      setSuccess('Sesión iniciada correctamente');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 700);
    } else {
      setError('Credenciales inválidas');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nombre || !email || !password) {
      setError('Por favor ingresa nombre, correo y contraseña');
      return;
    }

    // RF-1.3 Asignación automática obligatoria de rol 'ciudadano'
    const newUser = dataStore.registerUser(nombre, email, password);
    onUserChange(newUser);
    setSuccess('¡Cuenta de Ciudadano creada exitosamente! Sesión persistida.');
    setTimeout(() => {
      onClose();
      setSuccess(null);
    }, 900);
  };

  const selectPreset = (user: Usuario) => {
    dataStore.setCurrentUser(user);
    onUserChange(user);
    setSuccess(`Cambiado a perfil: ${user.nombre}`);
    setTimeout(() => {
      onClose();
      setSuccess(null);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:border dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Autenticación y Usuario
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="mt-4 flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setTab('perfil')}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
              tab === 'perfil'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Sesión Actual
          </button>
          <button
            onClick={() => setTab('login')}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
              tab === 'login'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
              tab === 'register'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Registro
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-3 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {success}
          </div>
        )}

        {/* Perfil Actual y Demo Switcher */}
        {tab === 'perfil' && (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="text-xs text-slate-500">Sesión persistente en el dispositivo</div>
              <div className="mt-1 font-semibold text-slate-900 dark:text-white text-base">
                {currentUser.nombre}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                {currentUser.email}
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 capitalize">
                Rol: {currentUser.rol}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Cambio rápido para evaluación:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => selectPreset(DEMO_CIUDADANO)}
                  className={`rounded-lg border p-2.5 text-left text-xs transition-colors ${
                    currentUser.id === DEMO_CIUDADANO.id
                      ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-500'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold text-slate-900 dark:text-white">Ciudadano</div>
                  <div className="text-[11px] text-slate-500 truncate">Carlos Méndez</div>
                </button>
                <button
                  type="button"
                  onClick={() => selectPreset(DEMO_ADMIN)}
                  className={`rounded-lg border p-2.5 text-left text-xs transition-colors ${
                    currentUser.id === DEMO_ADMIN.id
                      ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-500'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold text-slate-900 dark:text-white">Administrador</div>
                  <div className="text-[11px] text-slate-500 truncate">Ing. Patricia Ramos</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de Login (RF-1.2) */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-sky-800 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors"
            >
              Iniciar Sesión
            </button>
          </form>
        )}

        {/* Formulario de Registro (RF-1.1, RF-1.3) */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Nombre Completo
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Juan Pérez"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@correo.com"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="rounded-md bg-slate-50 p-2 text-[11px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              ℹ️ Según requerimiento RF-1.3, toda nueva cuenta recibe automáticamente el rol de <strong>ciudadano</strong>.
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-sky-800 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors"
            >
              Crear Cuenta Ciudadana
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
