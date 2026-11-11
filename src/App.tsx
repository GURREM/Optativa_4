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
import { SupabaseConfigModal } from './components/SupabaseConfigModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Usuario>(dataStore.getCurrentUser());
  const [activeView, setActiveView] = useState<'ciudadano' | 'admin'>(
    currentUser.rol === 'admin' ? 'admin' : 'ciudadano'
  );
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      const updatedUser = dataStore.getCurrentUser();
      setCurrentUser(updatedUser);
    });
    return unsubscribe;
  }, []);

  const handleRoleViewChange = (view: 'ciudadano' | 'admin') => {
    setActiveView(view);
    // Cambiar dinámicamente el usuario demo correspondiente para conveniencia del evaluador
    if (view === 'admin' && currentUser.rol !== 'admin') {
      dataStore.switchRole('admin');
    } else if (view === 'ciudadano' && currentUser.rol !== 'ciudadano') {
      dataStore.switchRole('ciudadano');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* Barra de Navegación Contractual */}
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        onViewChange={handleRoleViewChange}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenSupabaseConfig={() => setSupabaseModalOpen(true)}
      />

      {/* Contenido Principal */}
      <main className="flex-1">
        {activeView === 'ciudadano' ? (
          <CitizenView currentUser={currentUser} />
        ) : (
          <AdminView onOpenSupabaseConfig={() => setSupabaseModalOpen(true)} />
        )}
      </main>

      {/* Modales de Control */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={(newUser) => {
          setCurrentUser(newUser);
          if (newUser.rol === 'admin') {
            setActiveView('admin');
          } else {
            setActiveView('ciudadano');
          }
        }}
      />

      <SupabaseConfigModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />

      {/* Pie de Página Cívico */}
      <footer className="border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 text-xs text-slate-500">
          <div>
            {/* <strong>UrbanoAlert</strong> · Plataforma Cívica Descentralizada de Incidencias Urbanas */}
          </div>
          <div className="flex items-center gap-4">
            {/*<span>Mapas provistos por OpenStreetMap</span>*/}
            <span>·</span>
            {/*<span>Compatible con Supabase BaaS</span>*/}
          </div>
        </div>
      </footer>
    </div>
  );
}
