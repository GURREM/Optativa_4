/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Usuario } from './types';
import { dataStore } from './services/store';
import { Navbar } from './components/Navbar';
import { CitizenView } from './components/CitizenView';
import { AdminView } from './components/AdminView';
import { AuthModal } from './components/AuthModal';
import { LoginView } from './components/LoginView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(dataStore.getCurrentUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setCurrentUser(dataStore.getCurrentUser());
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    dataStore.logout();
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginView onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* Barra de Navegación */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Contenido Principal según el rol autenticado */}
      <main className="flex-1">
        {currentUser.rol === 'admin' ? (
          <AdminView />
        ) : (
          <CitizenView currentUser={currentUser} />
        )}
      </main>

      {/* Modal de Perfil */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Pie de Página Cívico */}
      <footer className="border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 text-xs text-slate-500">
          <div>
            <strong>ReporteUrbano</strong> · Plataforma Cívica de Gestión de Incidencias Urbanas
          </div>
          <div className="flex items-center gap-4">
            <span>Cartografía OpenStreetMap</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
