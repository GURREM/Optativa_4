import React from 'react';
import { Usuario } from '../types';
import { getSavedSupabaseConfig } from '../services/supabaseClient';

interface NavbarProps {
  currentUser: Usuario;
  activeView: 'ciudadano' | 'admin';
  onViewChange: (view: 'ciudadano' | 'admin') => void;
  onOpenAuth: () => void;
  onOpenSupabaseConfig: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeView,
  onViewChange,
  onOpenAuth,
  onOpenSupabaseConfig,
}) => {
  const supabaseConfig = getSavedSupabaseConfig();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand wordmark (single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-800 text-white shadow-sm font-bold text-base">
            RU
          </div>
          <button
            onClick={() => onViewChange('ciudadano')}
            className="text-lg font-bold tracking-tight text-slate-900 transition-colors hover:text-sky-800 dark:text-white whitespace-nowrap shrink-0 text-left cursor-pointer"
          >
            ReporteUrbano
          </button>
        </div>

        {/* Zone 2: Navigation links and role switcher */}
        <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
          {/* Segmented Role Selector */}
          <div className="flex items-center rounded-lg bg-slate-100 p-1 dark:bg-slate-800/80">
            <button
              onClick={() => onViewChange('ciudadano')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeView === 'ciudadano'
                  ? 'bg-white text-sky-800 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Ciudadano</span>
            </button>
            <button
              onClick={() => onViewChange('admin')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeView === 'admin'
                  ? 'bg-white text-sky-800 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Administrador</span>
            </button>
          </div>

          {/* Supabase status and settings button */}
          <button
            onClick={onOpenSupabaseConfig}
            title="Configuración de Backend Supabase y Esquema SQL"
            className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60 whitespace-nowrap shrink-0 transition-colors"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                supabaseConfig.connected ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
            <span>{supabaseConfig.connected ? 'Supabase Conectado' : 'Modo Local / Demo'}</span>
            <span className="text-[10px] text-slate-400">· SQL</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action / User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-all whitespace-nowrap shrink-0"
          >
            <span className="max-w-[130px] truncate">{currentUser.nombre}</span>
            <span className="text-[10px] opacity-75 capitalize">({currentUser.rol})</span>
          </button>
        </div>
      </div>
    </header>
  );
};
