import React, { useState, useEffect } from 'react';
import { Reporte, EstadoReporte } from '../types';
import { dataStore } from '../services/store';
import { OpenStreetMap } from './OpenStreetMap';

interface AdminViewProps {
  onOpenSupabaseConfig: () => void;
}

const ITEMS_PER_PAGE = 6; // RNF-2 Paginación para eficiencia de red

export const AdminView: React.FC<AdminViewProps> = ({ onOpenSupabaseConfig }) => {
  const [allReportes, setAllReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterEstado, setFilterEstado] = useState<EstadoReporte | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal de Gestión de Reporte (RF-3.4 y RF-3.5)
  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);
  const [editEstado, setEditEstado] = useState<EstadoReporte>('pendiente');
  const [editRespuestaAdmin, setEditRespuestaAdmin] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Cargar lista global (RF-3.1)
  const loadReports = async () => {
    setLoading(true);
    const reports = await dataStore.getReportes();
    setAllReportes(reports);
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
    const unsubscribe = dataStore.subscribe(() => {
      loadReports();
    });
    return unsubscribe;
  }, []);

  // RF-3.3 Filtrado por estado y búsqueda
  const filteredReportes = allReportes.filter((r) => {
    const matchesEstado = filterEstado === 'todos' || r.estado === filterEstado;
    const matchesSearch =
      r.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.descripcion && r.descripcion.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.usuario_nombre && r.usuario_nombre.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesEstado && matchesSearch;
  });

  // RNF-2 Paginación
  const totalPages = Math.ceil(filteredReportes.length / ITEMS_PER_PAGE) || 1;
  const paginatedReportes = filteredReportes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const openManageModal = (report: Reporte) => {
    setSelectedReporte(report);
    setEditEstado(report.estado);
    setEditRespuestaAdmin(report.respuesta_admin || '');
    setSaveFeedback(null);
  };

  const handleSaveResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReporte) return;

    setSaving(true);
    try {
      // RF-3.4 Actualizar estado & RF-3.5 Adjuntar respuesta oficial
      await dataStore.updateEstadoReporte(
        selectedReporte.id,
        editEstado,
        editRespuestaAdmin.trim() || null
      );
      setSaveFeedback('¡Estado y respuesta oficial actualizados con éxito!');
      setTimeout(() => {
        setSelectedReporte(null);
        setSaveFeedback(null);
      }, 1000);
    } catch (err: any) {
      setSaveFeedback('Error al actualizar el reporte.');
    } finally {
      setSaving(false);
    }
  };

  // Contadores para métricas de estado
  const countByState = {
    total: allReportes.length,
    pendiente: allReportes.filter((r) => r.estado === 'pendiente').length,
    revisado: allReportes.filter((r) => r.estado === 'revisado').length,
    en_proceso: allReportes.filter((r) => r.estado === 'en_proceso').length,
    solucionado: allReportes.filter((r) => r.estado === 'solucionado').length,
  };

  const getStatusBadge = (estado: EstadoReporte) => {
    const styles: Record<EstadoReporte, string> = {
      pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200',
      revisado: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200',
      en_proceso: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200',
      solucionado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[estado]}`}>
        ● {estado.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Encabezado y Métricas */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Consola Municipal de Incidencias
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Supervisión territorial con OpenStreetMap y gestión del ciclo de vida de reportes urbanos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSupabaseConfig}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
              <span>Configurar Supabase</span>
            </button>
          <button
            onClick={() => dataStore.resetDemoData()}
            title="Restablecer datos demo iniciales"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <span>↻ Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Franja de Métricas de Incidencias (Anti-slop, datos limpios tabulares) */}
      {/*
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-medium text-slate-500">Total Reportes</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {countByState.total}
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="text-xs font-medium text-amber-700 dark:text-amber-400">Pendientes</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-amber-800 dark:text-amber-300">
            {countByState.pendiente}
          </div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="text-xs font-medium text-blue-700 dark:text-blue-400">Revisados</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-blue-800 dark:text-blue-300">
            {countByState.revisado}
          </div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <div className="text-xs font-medium text-indigo-700 dark:text-indigo-400">En Proceso</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-indigo-800 dark:text-indigo-300">
            {countByState.en_proceso}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Solucionados</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-emerald-800 dark:text-emerald-300">
            {countByState.solucionado}
          </div>
        </div>
      </div>

      */}
      
      {/* RF-3.2: Mapa Interactivo Global OpenStreetMap */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Mapa Global de Incidencias (OpenStreetMap)
          </h2>
          <span className="text-xs text-slate-500">
            Mostrando {filteredReportes.length} pines en el mapa
          </span>
        </div>
        <div className="h-[420px] w-full">
          <OpenStreetMap
            mode="viewer"
            reports={filteredReportes}
            onSelectReport={(rep) => openManageModal(rep)}
            className="h-full w-full shadow-sm"
          />
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda (RF-3.3) */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {/* Combobox / Selector Desplegable de Estado */}
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="filtro-estado-combobox"
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
          >
            <svg className="h-4 w-4 text-sky-700 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filtrar por estado:</span>
          </label>

          <div className="relative min-w-[230px]">
            <select
              id="filtro-estado-combobox"
              value={filterEstado}
              onChange={(e) => {
                setFilterEstado(e.target.value as EstadoReporte | 'todos');
                setCurrentPage(1);
              }}
              className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 py-2 pl-3.5 pr-9 text-xs font-semibold text-slate-800 shadow-2xs transition-colors hover:border-slate-400 focus:border-sky-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <option value="todos">📋 Todos los reportes ({countByState.total})</option>
              <option value="pendiente">🟡 Pendientes ({countByState.pendiente})</option>
              <option value="revisado">🔵 Revisados ({countByState.revisado})</option>
              <option value="en_proceso">🟣 En Proceso ({countByState.en_proceso})</option>
              <option value="solucionado">🟢 Solucionados ({countByState.solucionado})</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {filterEstado !== 'todos' && (
            <button
              type="button"
              onClick={() => {
                setFilterEstado('todos');
                setCurrentPage(1);
              }}
              className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
            >
              ✕ Limpiar filtro
            </button>
          )}
        </div>

        {/* Input de Búsqueda */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por título, lugar o vecino..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs focus:border-sky-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* RF-3.1: Lista Global de Reportes */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Cargando incidencias globales...</div>
          ) : paginatedReportes.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No se encontraron reportes con los filtros seleccionados.
            </div>
          ) : (
            paginatedReportes.map((report) => (
              <div
                key={report.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {report.foto_url && (
                    <img
                      src={report.foto_url}
                      alt={report.titulo}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover border border-slate-200 dark:border-slate-700 bg-slate-100"
                    />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {report.titulo}
                      </span>
                      {getStatusBadge(report.estado)}
                    </div>
                    {report.descripcion && (
                      <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                        {report.descripcion}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>👤 {report.usuario_nombre || 'Ciudadano'}</span>
                      <span>·</span>
                      <span>📍 {report.latitud.toFixed(5)}, {report.longitud.toFixed(5)}</span>
                      <span>·</span>
                      <span>📅 {new Date(report.fecha_creacion).toLocaleDateString()}</span>
                    </div>
                    {report.respuesta_admin && (
                      <div className="text-[11px] text-sky-800 dark:text-sky-300 font-medium">
                        Respuesta: "{report.respuesta_admin}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => openManageModal(report)}
                    className="w-full sm:w-auto rounded-lg bg-sky-800 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700 transition-colors"
                  >
                    Gestionar Incidencia
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* RNF-2 Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="text-xs text-slate-500">
              Página <span className="font-semibold">{currentPage}</span> de{' '}
              <span className="font-semibold">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Anterior
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Gestión de Reporte (RF-3.4 y RF-3.5) */}
      {selectedReporte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Gestión de Incidencia Urbana
              </h3>
              <button
                onClick={() => setSelectedReporte(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResolution} className="mt-4 space-y-4">
              {saveFeedback && (
                <div className="rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {saveFeedback}
                </div>
              )}

              <div>
                <div className="text-xs text-slate-400">Título reportado por el ciudadano</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedReporte.titulo}
                </div>
                {selectedReporte.descripcion && (
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {selectedReporte.descripcion}
                  </p>
                )}
              </div>

              {selectedReporte.foto_url && (
                <div>
                  <div className="text-xs text-slate-400 mb-1">Evidencia Fotográfica</div>
                  <img
                    src={selectedReporte.foto_url}
                    alt={selectedReporte.titulo}
                    className="max-h-52 w-full rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                  />
                </div>
              )}

              <div className="rounded-lg bg-slate-50 p-2.5 text-xs font-mono text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                📍 Coordenadas: {selectedReporte.latitud.toFixed(6)}, {selectedReporte.longitud.toFixed(6)}
              </div>

              {/* RF-3.4 Actualizar Estado */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Nuevo Estado de la Incidencia (RF-3.4 / RNF-4)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['pendiente', 'revisado', 'en_proceso', 'solucionado'] as const).map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setEditEstado(st)}
                      className={`rounded-lg border p-2.5 text-left text-xs font-semibold capitalize transition-all ${
                        editEstado === st
                          ? 'border-sky-700 bg-sky-50 text-sky-900 dark:border-sky-500 dark:bg-sky-950/40 dark:text-white ring-1 ring-sky-600'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      ● {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* RF-3.5 Adjuntar respuesta_admin */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Respuesta Oficial de la Administración (RF-3.5)
                </label>
                <textarea
                  value={editRespuestaAdmin}
                  onChange={(e) => setEditRespuestaAdmin(e.target.value)}
                  rows={3}
                  placeholder="Redacta la respuesta oficial para el ciudadano (ej: cuadrilla programada para hoy, obra finalizada, etc.)..."
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReporte(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-sky-800 px-5 py-2 text-xs font-bold text-white shadow hover:bg-sky-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Resolución y Notificar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
