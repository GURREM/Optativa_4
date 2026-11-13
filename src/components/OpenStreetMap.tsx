import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Reporte, EstadoReporte } from '../types';
import { ReportUrgencyInfo, URGENCY_RADIUS_METERS } from '../utils/urgencyDetector';

interface OpenStreetMapProps {
  mode: 'picker' | 'viewer';
  reports?: Reporte[];
  urgencyMap?: Record<string, ReportUrgencyInfo>;
  selectedLocation?: { lat: number; lng: number };
  onLocationSelect?: (lat: number, lng: number) => void;
  onSelectReport?: (report: Reporte) => void;
  className?: string;
  zoom?: number;
  center?: [number, number];
}

const STATUS_COLORS: Record<EstadoReporte, string> = {
  pendiente: '#D97706', // amber
  revisado: '#2563EB',  // blue
  en_proceso: '#6366F1', // indigo
  solucionado: '#059669', // emerald
};

const STATUS_LABELS: Record<EstadoReporte, string> = {
  pendiente: 'Pendiente',
  revisado: 'Revisado',
  en_proceso: 'En Proceso',
  solucionado: 'Solucionado',
};

export const OpenStreetMap: React.FC<OpenStreetMapProps> = ({
  mode,
  reports = [],
  urgencyMap,
  selectedLocation,
  onLocationSelect,
  onSelectReport,
  className = 'h-96 w-full',
  zoom = 14,
  center = [-16.505, -68.132],
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter = selectedLocation ? ([selectedLocation.lat, selectedLocation.lng] as [number, number]) : center;
      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom,
        zoomControl: true,
      });

      // Capa base oficial OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> colaboradores',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Evento de selección de coordenadas en modo picker
      if (mode === 'picker') {
        map.on('click', (e: L.LeafletMouseEvent) => {
          if (onLocationSelect) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
          }
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Manejar modo picker: actualizar marcador de selección
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || mode !== 'picker') return;

    if (selectedLocation) {
      const { lat, lng } = selectedLocation;
      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.setLatLng([lat, lng]);
      } else {
        const pickerIcon = L.divIcon({
          className: 'custom-picker-pin',
          html: `<div style="
            background-color: #0F4C81;
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          ">
            <div style="width: 10px; height: 10px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });

        const marker = L.marker([lat, lng], { icon: pickerIcon, draggable: true }).addTo(map);
        marker.on('dragend', (event) => {
          const newPos = event.target.getLatLng();
          if (onLocationSelect) {
            onLocationSelect(newPos.lat, newPos.lng);
          }
        });
        pickerMarkerRef.current = marker;
      }

      map.panTo([lat, lng], { animate: true });
    }
  }, [selectedLocation, mode, onLocationSelect]);

  // Manejar modo viewer: renderizar marcadores de reportes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup || mode !== 'viewer') return;

    markersGroup.clearLayers();

    if (reports.length === 0) return;

    const latLngs: L.LatLngExpression[] = [];

    reports.forEach((rep) => {
      const urgency = urgencyMap?.[rep.id];
      const isUrgent = Boolean(urgency?.isUrgent);
      const color = isUrgent ? '#DC2626' : STATUS_COLORS[rep.estado] || '#64748B';
      const statusLabel = STATUS_LABELS[rep.estado] || rep.estado;

      // Si es urgente, dibujar el círculo real de 10 metros en el mapa para el Administrador
      if (isUrgent) {
        const radiusCircle = L.circle([rep.latitud, rep.longitud], {
          radius: URGENCY_RADIUS_METERS,
          color: '#DC2626',
          weight: 2,
          dashArray: '4 4',
          fillColor: '#EF4444',
          fillOpacity: 0.2,
        });
        markersGroup.addLayer(radiusCircle);
      }

      const markerHtml = isUrgent
        ? `
        <div style="
          background-color: #DC2626;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 3px solid #FEF2F2;
          box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.35), 0 4px 10px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 13px;
          cursor: pointer;
        ">
          <span>🚨</span>
        </div>
      `
        : `
        <div style="
          background-color: ${color};
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2.5px solid #ffffff;
          box-shadow: 0 4px 8px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 11px;
          cursor: pointer;
          transition: transform 0.15s ease;
        ">
          <span style="display:block; transform: scale(1.1); font-family: system-ui;">●</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-report-pin',
        html: markerHtml,
        iconSize: isUrgent ? [34, 34] : [28, 28],
        iconAnchor: isUrgent ? [17, 17] : [14, 14],
        popupAnchor: [0, isUrgent ? -17 : -14],
      });

      const marker = L.marker([rep.latitud, rep.longitud], { icon: customIcon });

      const popupContent = document.createElement('div');
      popupContent.className = 'text-left min-w-[200px] max-w-[260px]';
      popupContent.innerHTML = `
        ${
          isUrgent
            ? `<div style="background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; font-size: 10px; font-weight: 800; padding: 3px 6px; border-radius: 4px; margin-bottom: 5px; text-transform: uppercase;">
                🚨 URGENTE · ${urgency?.distinctUsersCount} vecinos en ≤${URGENCY_RADIUS_METERS}m
              </div>`
            : ''
        }
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${
          STATUS_COLORS[rep.estado] || '#64748B'
        }; margin-bottom: 2px;">
          ${statusLabel}
        </div>
        <div style="font-weight: 600; font-size: 13px; color: #0F172A; margin-bottom: 4px; line-height: 1.25;">
          ${rep.titulo}
        </div>
        <div style="font-size: 11px; color: #64748B; margin-bottom: 8px;">
          👤 ${rep.usuario_nombre || 'Ciudadano'}<br/>
          Lat: ${rep.latitud.toFixed(5)} · Lng: ${rep.longitud.toFixed(5)}
        </div>
        ${
          rep.foto_url
            ? `<div style="width: 100%; height: 90px; border-radius: 6px; overflow: hidden; margin-bottom: 8px; background: #E2E8F0;">
                <img src="${rep.foto_url}" alt="${rep.titulo}" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>`
            : ''
        }
        <button id="btn-inspect-${rep.id}" style="
          width: 100%;
          background: ${isUrgent ? '#DC2626' : '#0F172A'};
          color: #ffffff;
          font-size: 11px;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
        ">
          Gestionar Reporte
        </button>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-inspect-${rep.id}`);
        if (btn && onSelectReport) {
          btn.onclick = () => {
            onSelectReport(rep);
            map.closePopup();
          };
        }
      });

      markersGroup.addLayer(marker);
      latLngs.push([rep.latitud, rep.longitud]);
    });

    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [reports, urgencyMap, mode, onSelectReport]);

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full" />
      {mode === 'picker' && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[400] rounded-lg bg-slate-900/85 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
          📍 Haz clic o arrastra el marcador en el mapa para fijar coordenadas
        </div>
      )}
    </div>
  );
};
