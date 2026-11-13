import React, { useState, useEffect, useMemo } from 'react';
import { Reporte, EstadoReporte } from '../types';
import { dataStore } from '../services/store';
import { OpenStreetMap } from './OpenStreetMap';
import {
  analyzeReportsUrgency,
  URGENCY_RADIUS_METERS,
  URGENCY_MIN_DISTINCT_USERS,
} from '../utils/urgencyDetector';

const ITEMS_PER_PAGE = 6;

export const AdminView: React.FC = () => {
  const [allReportes, setAllReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterEstado, setFilterEstado] = useState<EstadoReporte | 'todos' | 'urgentes'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal de Gestión de Reporte
  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);
  const [editEstado, setEditEstado] = useState<EstadoReporte>('pendiente');
  const [editRespuestaAdmin, setEditRespuestaAdmin] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

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

  // Detección automática de Urgencia por proximidad (<= 10m, >= 3 usuarios distintos, no solucionados)
  const urgencyMap = useMemo(() => analyzeReportsUrgency(allReportes), [allReportes]);

  // Filtrado por estado, urgencia y búsqueda, ordenando urgentes primero
  const filteredReportes = useMemo(() => {
    const filtered = allReportes.filter((r) => {
      const isUrgent = Boolean(urgencyMap[r.id]?.isUrgent);
      const matchesEstado =
        filterEstado === 'todos'
          ? true
          : filterEstado === 'urgentes'
          ? isUrgent
          : r.estado === filterEstado;
      const matchesSearch =
        r.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.descripcion && r.descripcion.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.usuario_nombre && r.usuario_nombre.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesEstado && matchesSearch;
    });

    // Priorizar los reportes urgentes arriba en la bandeja del administrador
    return filtered.sort((a, b) => {
      const urgentA = urgencyMap[a.id]?.isUrgent ? 1 : 0;
      const urgentB = urgencyMap[b.id]?.isUrgent ? 1 : 0;
      if (urgentA !== urgentB) return urgentB - urgentA;
      return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
    });
  }, [allReportes, urgencyMap, filterEstado, searchQuery]);

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
    } catch {
      setSaveFeedback('Error al actualizar el reporte.');
    } finally {
      setSaving(false);
    }
  };

  // Contadores para métricas de estado y urgencia
  const countByState = {
    total: allReportes.length,
    urgentes: allReportes.filter((r) => Boolean(urgencyMap[r.id]?.isUrgent)).length,
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
      {/* Encabezado */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Consola Municipal de Incidencias
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Supervisión territorial con OpenStreetMap y gestión del ciclo de vida de reportes urbanos.
          </p>
        </div>
      </div>

      {/* Alerta automática de Focos Urgentes en radio <= 10m */}
      {countByState.urgentes > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-red-300 bg-red-50/90 p-4 shadow-xs dark:border-red-800/80 dark:bg-red-950/35">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-600 text-sm text-white shadow-xs">
              🚨
            </span>
            <div>
              <h2 className="text-sm font-bold text-red-950 dark:text-red-200">
                Alerta de Prioridad Urgente Detectada ({countByState.urgentes} reportes en foco crítico)
              </h2>
              <p className="mt-0.5 text-xs text-red-800 dark:text-red-300">
                Se detectaron <strong>{URGENCY_MIN_DISTINCT_USERS} o más reportes de distintos usuarios</strong> aún no solucionados concentrados en un <strong>radio menor o igual a {URGENCY_RADIUS_METERS} metros</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setFilterEstado(filterEstado === 'urgentes' ? 'todos' : 'urgentes');
              setCurrentPage(1);
            }}
            className="shrink-0 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition-colors cursor-pointer"
          >
            {filterEstado === 'urgentes' ? 'Ver Todos los Reportes' : `Filtrar Urgentes (${countByState.urgentes})`}
          </button>
        </div>
      )}

      {/* Mapa Interactivo Global OpenStreetMap */}
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
            urgencyMap={urgencyMap}
            onSelectReport={(rep) => openManageModal(rep)}
            className="h-full w-full shadow-sm"
          />
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
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
                setFilterEstado(e.target.value as EstadoReporte | 'todos' | 'urgentes');
                setCurrentPage(1);
              }}
              className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 py-2 pl-3.5 pr-9 text-xs font-semibold text-slate-800 shadow-2xs transition-colors hover:border-slate-400 focus:border-sky-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <option value="todos">📋 Todos los reportes ({countByState.total})</option>
              <option value="urgentes">🚨 Urgentes en ≤{URGENCY_RADIUS_METERS}m ({countByState.urgentes})</option>
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

      {/* Lista Global de Reportes */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Cargando incidencias globales...</div>
          ) : paginatedReportes.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No hay reportes registrados con los filtros seleccionados.
            </div>
          ) : (
            paginatedReportes.map((report) => {
              const urgency = urgencyMap[report.id];
              const isUrgent = Boolean(urgency?.isUrgent);

              return (
                <div
                  key={report.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 transition-colors ${
                    isUrgent
                      ? 'border-l-4 border-l-red-600 bg-red-50/40 hover:bg-red-50/70 dark:bg-red-950/20 dark:hover:bg-red-950/30'
                      : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {report.foto_url && (
                      <img
                        src={report.foto_url}
                        alt={report.titulo}
                        className={`h-16 w-16 shrink-0 rounded-lg object-cover border bg-slate-100 ${
                          isUrgent
                            ? 'border-red-300 ring-2 ring-red-500/30 dark:border-red-700'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      />
                    )}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {isUrgent && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-600 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-2xs">
                            🚨 URGENTE · {urgency.distinctUsersCount} vecinos en ≤{URGENCY_RADIUS_METERS}m
                          </span>
                        )}
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
                        {isUrgent && urgency.minDistanceMeters !== null && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              📏 A {urgency.minDistanceMeters}m de otro reporte activo
                            </span>
                          </>
                        )}
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
                      className={`w-full sm:w-auto rounded-lg px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer ${
                        isUrgent
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-sky-800 hover:bg-sky-700'
                      }`}
                    >
                      {isUrgent ? '🚨 Atender Urgente' : 'Gestionar Incidencia'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Paginación */}
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

      {/* Modal de Gestión de Reporte */}
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

              {urgencyMap[selectedReporte.id]?.isUrgent && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                  <div className="font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                    <span>🚨</span>
                    <span>Incidencia Marcada como URGENTE</span>
                  </div>
                  <p className="mt-1 text-[11px] text-red-800 dark:text-red-300">
                    Este reporte forma parte de un foco con{' '}
                    <strong>{urgencyMap[selectedReporte.id].distinctUsersCount} ciudadanos distintos</strong>{' '}
                    que registraron incidencias aún no solucionadas dentro de un radio de{' '}
                    <strong>≤ {URGENCY_RADIUS_METERS} metros</strong>.
                  </p>
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

              {/* Actualizar Estado */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Nuevo Estado de la Incidencia
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

              {/* Adjuntar respuesta_admin */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Respuesta Oficial de la Administración
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
