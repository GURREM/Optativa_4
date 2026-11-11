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
import { SupabaseConfigModal } from './components/SupabaseConfigModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(dataStore.getCurrentUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);

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
    return (
      <>
        <LoginView
          onLoginSuccess={(user) => setCurrentUser(user)}
          onOpenSupabaseConfig={() => setSupabaseModalOpen(true)}
        />
        <SupabaseConfigModal
          isOpen={supabaseModalOpen}
          onClose={() => setSupabaseModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* Barra de Navegación */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenSupabaseConfig={() => setSupabaseModalOpen(true)}
      />

      {/* Contenido Principal según el rol autenticado */}
      <main className="flex-1">
        {currentUser.rol === 'admin' ? (
          <AdminView onOpenSupabaseConfig={() => setSupabaseModalOpen(true)} />
        ) : (
          <CitizenView currentUser={currentUser} />
        )}
      </main>

      {/* Modales de Control */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <SupabaseConfigModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />

      {/* Pie de Página Cívico */}
      <footer className="border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 text-xs text-slate-500">
          <div>
            <strong>UrbanoAlert</strong> · Plataforma Cívica Descentralizada de Incidencias Urbanas
          </div>
          <div className="flex items-center gap-4">
            <span>Mapas provistos por OpenStreetMap</span>
            <span>·</span>
            <span>Compatible con Supabase BaaS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
