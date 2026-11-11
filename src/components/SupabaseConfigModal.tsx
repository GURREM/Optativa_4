import React, { useState } from 'react';
import {
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  SUPABASE_SQL_SCHEMA,
} from '../services/supabaseClient';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const currentConfig = getSavedSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!url || !anonKey) {
      setTestResult({ success: false, message: 'Ingresa la URL y el Anon Key de Supabase' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(url.trim(), anonKey.trim());
    setTesting(false);
    setTestResult(res);
  };

  const handleSave = () => {
    saveSupabaseConfig(url.trim(), anonKey.trim());
    setTestResult({ success: true, message: 'Configuración guardada en el cliente.' });
    setTimeout(() => {
      onClose();
      window.location.reload(); // Recargar para re-inicializar el store con Supabase
    }, 800);
  };

  const handleClear = () => {
    saveSupabaseConfig('', '');
    setUrl('');
    setAnonKey('');
    setTestResult({ success: true, message: 'Desconectado de Supabase. Operando en modo local.' });
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 800);
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Integración con Supabase (PostgreSQL + Auth + Storage)
            </h3>
            <p className="text-xs text-slate-500">
              Conecta tu proyecto de Supabase o utiliza el almacenamiento demo local.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Formulario de Credenciales */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzabcdefg.supabase.co"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Supabase Anon / Public API Key
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {testResult && (
              <div
                className={`rounded-lg p-2.5 text-xs font-medium ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                }`}
              >
                {testResult.message}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {testing ? 'Verificando...' : '🔍 Probar Conexión'}
              </button>

              <div className="flex items-center gap-2">
                {currentConfig.connected && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300"
                  >
                    Desconectar
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-lg bg-sky-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
                >
                  Guardar y Activar
                </button>
              </div>
            </div>
          </div>

          {/* Script SQL para Supabase SQL Editor */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Script SQL de Base de Datos (PostgreSQL)
              </div>
              <button
                type="button"
                onClick={copySqlToClipboard}
                className="flex items-center gap-1 text-xs font-semibold text-sky-800 hover:underline dark:text-sky-400"
              >
                <span>{copied ? '¡Copiado!' : '📋 Copiar Script SQL'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Pega este código en el <strong>SQL Editor</strong> de tu panel de Supabase para crear las tablas exactas especificadas en el análisis de requerimientos:
            </p>
            <pre className="max-h-48 overflow-y-auto rounded-lg bg-slate-950 p-3 text-[11px] text-slate-200 font-mono leading-relaxed">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
