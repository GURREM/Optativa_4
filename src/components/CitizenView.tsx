import React, { useState, useEffect, useRef } from 'react';
import { Usuario, Reporte, ImageCompressionResult } from '../types';
import { dataStore } from '../services/store';
import { compressImage } from '../utils/imageCompressor';
import { OpenStreetMap } from './OpenStreetMap';

interface CitizenViewProps {
  currentUser: Usuario;
}

export const CitizenView: React.FC<CitizenViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'nuevo' | 'historial'>('nuevo');
  const [misReportes, setMisReportes] = useState<Reporte[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Formulario nuevo reporte
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: -16.505,
    lng: -68.132,
  });
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  // Imagen y compresión (RF-2.2 y RNF-1)
  const [compressionResult, setCompressionResult] = useState<ImageCompressionResult | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado de envío
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Cargar historial exclusivo del ciudadano (RF-2.4)
  const loadReports = async () => {
    setLoadingReports(true);
    const reports = await dataStore.getReportesByUsuario(currentUser.id);
    setMisReportes(reports);
    setLoadingReports(false);
  };

  useEffect(() => {
    loadReports();
    const unsubscribe = dataStore.subscribe(() => {
      loadReports();
    });
    return unsubscribe;
  }, [currentUser.id]);

  // RF-2.1: Captura automática GPS al iniciar
  useEffect(() => {
    handleDetectGPS(false);
  }, []);

  const handleDetectGPS = (showFeedback = true) => {
    if (!navigator.geolocation) {
      if (showFeedback) setGpsMessage('La geolocalización no está soportada en este navegador.');
      return;
    }

    setGpsDetecting(true);
    setGpsMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: Number(pos.coords.latitude.toFixed(8)),
          lng: Number(pos.coords.longitude.toFixed(8)),
        });
        setGpsDetecting(false);
        if (showFeedback) {
          setGpsMessage('Coordenadas GPS actualizadas con precisión de tu dispositivo.');
        }
      },
      (err) => {
        setGpsDetecting(false);
        console.warn('Geolocation error:', err);
        // Si no se puede obtener GPS real (ej. permisos denegados o sandbox), se mantiene la ubicación urbana por defecto
        if (showFeedback) {
          setGpsMessage('Permiso GPS no concedido. Puedes mover el pin en el mapa.');
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // RF-2.2 y RNF-1: Compresión obligatoria al 50-60%
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);
    setCompressing(true);

    try {
      // Compresión obligatoria con calidad 0.55 (55%)
      const result = await compressImage(file, 0.55);
      setCompressionResult(result);
    } catch (err: any) {
      setImageError(err?.message || 'Error al procesar la fotografía.');
    } finally {
      setCompressing(false);
    }
  };

  // RF-2.3: Registrar reporte
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!titulo.trim()) {
      setFormError('El título es obligatorio (RF-2.3).');
      return;
    }

    if (!compressionResult) {
      setFormError('Debes adjuntar una fotografía de evidencia (RF-2.2).');
      return;
    }

    setSubmitting(true);
    try {
      await dataStore.addReporte({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        latitud: coords.lat,
        longitud: coords.lng,
        foto_url: compressionResult.dataUrl,
      });

      setSubmitSuccess('¡Incidencia reportada con éxito! Está en estado Pendiente.');
      setTitulo('');
      setDescripcion('');
      setCompressionResult(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setTimeout(() => {
        setSubmitSuccess(null);
        setActiveTab('historial');
      }, 1500);
    } catch (err: any) {
      setFormError(err?.message || 'Error al enviar el reporte.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (estado: Reporte['estado']) => {
    const map = {
      pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200' },
      revisado: { label: 'Revisado', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200' },
      en_proceso: { label: 'En Proceso', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200' },
      solucionado: { label: 'Solucionado', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200' },
    };
    const s = map[estado];
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.color}`}>
        ● {s.label}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Encabezado Ciudadano */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Portal Ciudadano
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Reporta incidencias en la vía pública con geolocalización y fotografía en tiempo real.
          </p>
        </div>

        {/* Pestañas Ciudadano */}
        <div className="flex rounded-xl bg-slate-200/80 p-1 dark:bg-slate-800">
          <button
            onClick={() => setActiveTab('nuevo')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'nuevo'
                ? 'bg-white text-sky-800 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <span>+ Nuevo Reporte</span>
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'historial'
                ? 'bg-white text-sky-800 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <span>Mis Reportes ({misReportes.length})</span>
          </button>
        </div>
      </div>

      {/* Pestaña 1: Formulario Nuevo Reporte */}
      {activeTab === 'nuevo' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <div className="rounded-xl bg-rose-50 p-3.5 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                ⚠️ {formError}
              </div>
            )}

            {submitSuccess && (
              <div className="rounded-xl bg-emerald-50 p-3.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                ✅ {submitSuccess}
              </div>
            )}

            {/* Título y Descripción (RF-2.3) */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Título de la Incidencia <span className="text-rose-500">* (Obligatorio)</span>
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Bache profundo en cruce vehicular, luminaria caída..."
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Descripción Detallada <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  placeholder="Proporciona detalles que ayuden a la cuadrilla municipal a ubicar o priorizar el problema..."
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Evidencia Fotográfica con Compresión RNF-1 y RF-2.2 */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Fotografía de Evidencia <span className="text-rose-500">* (Cámara o Galería)</span>
              </label>

              <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center dark:border-slate-800">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageFileChange}
                  className="hidden"
                  id="foto-upload"
                />
                <label
                  htmlFor="foto-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{compressionResult ? 'Cambiar Fotografía' : 'Tomar Foto o Subir desde Galería'}</span>
                </label>

                {compressing && (
                  <div className="mt-3 text-xs text-sky-700 dark:text-sky-400 font-medium animate-pulse">
                    Comprimiendo imagen al 55% según requerimiento RNF-1...
                  </div>
                )}

                {imageError && (
                  <div className="mt-2 text-xs text-rose-600">{imageError}</div>
                )}

                {compressionResult && (
                  <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 rounded-xl bg-slate-50 p-3 text-left dark:bg-slate-800/60">
                    <img
                      src={compressionResult.dataUrl}
                      alt="Vista previa"
                      className="h-28 w-28 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div className="space-y-1 text-xs">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        Compresión RNF-1 Completada
                      </div>
                      <div className="text-slate-500 font-mono">
                        Original: <span className="font-semibold text-slate-700 dark:text-slate-300">{compressionResult.originalSizeKB} KB</span>
                      </div>
                      <div className="text-slate-500 font-mono">
                        Comprimido (55%): <span className="font-semibold text-emerald-600">{compressionResult.compressedSizeKB} KB</span>
                      </div>
                      <div className="inline-flex rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        Ahorro de red: -{compressionResult.compressionRatioPercent}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Geolocalización GPS y OpenStreetMap (RF-2.1) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Ubicación GPS (OpenStreetMap) <span className="text-rose-500">* (RF-2.1)</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleDetectGPS(true)}
                  disabled={gpsDetecting}
                  className="flex items-center gap-1.5 text-xs font-semibold text-sky-800 hover:underline dark:text-sky-400"
                >
                  <svg className={`h-3.5 w-3.5 ${gpsDetecting ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{gpsDetecting ? 'Obteniendo GPS...' : 'Actualizar Coordenadas GPS'}</span>
                </button>
              </div>

              {gpsMessage && (
                <div className="text-xs text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 p-2 rounded-lg">
                  {gpsMessage}
                </div>
              )}

              <div className="h-64 w-full">
                <OpenStreetMap
                  mode="picker"
                  selectedLocation={coords}
                  onLocationSelect={(lat, lng) => setCoords({ lat, lng })}
                  className="h-full w-full"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-xs font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <span>Lat: {coords.lat.toFixed(6)}</span>
                <span>Lng: {coords.lng.toFixed(6)}</span>
                <span className="text-[11px] text-slate-400 font-sans">OpenStreetMap</span>
              </div>
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-sky-800 py-3 text-sm font-bold text-white shadow-md hover:bg-sky-700 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {submitting ? 'Enviando Reporte...' : 'Enviar Reporte Ciudadano'}
            </button>
          </form>
        </div>
      )}

      {/* Pestaña 2: Historial Exclusivo Ciudadano (RF-2.4 y RF-2.5) */}
      {activeTab === 'historial' && (
        <div className="space-y-4">
          {loadingReports ? (
            <div className="p-8 text-center text-sm text-slate-500">Cargando tus reportes...</div>
          ) : misReportes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300 mb-3">
                📋
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No tienes reportes registrados aún
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Cuando envíes una incidencia urbana, podrás hacer seguimiento a su ciclo de vida aquí.
              </p>
              <button
                onClick={() => setActiveTab('nuevo')}
                className="mt-4 rounded-xl bg-sky-800 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-sky-700"
              >
                Crear Mi Primer Reporte
              </button>
            </div>
          ) : (
            misReportes.map((report) => (
              <div
                key={report.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="text-xs text-slate-400 font-mono">
                      {new Date(report.fecha_creacion).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div>{getStatusBadge(report.estado)}</div>
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row gap-4">
                    {report.foto_url && (
                      <div className="h-32 w-full sm:w-40 shrink-0 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-100">
                        <img
                          src={report.foto_url}
                          alt={report.titulo}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {report.titulo}
                      </h3>
                      {report.descripcion && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {report.descripcion}
                        </p>
                      )}
                      <div className="text-xs text-slate-400 font-mono">
                        📍 Lat: {report.latitud.toFixed(6)} · Lng: {report.longitud.toFixed(6)}
                      </div>
                    </div>
                  </div>

                  {/* RF-2.5 Respuesta Oficial del Administrador */}
                  <div className="mt-4 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>🏛️ Respuesta Oficial de la Administración:</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {report.respuesta_admin ? (
                        <p className="font-medium text-sky-900 dark:text-sky-200">
                          "{report.respuesta_admin}"
                        </p>
                      ) : (
                        <span className="italic text-slate-400">
                          Pendiente de revisión por parte de la cuadrilla o inspector municipal asignado.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
