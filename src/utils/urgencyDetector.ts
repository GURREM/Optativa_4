import { Reporte } from '../types';

export const URGENCY_RADIUS_METERS = 10;
export const URGENCY_MIN_DISTINCT_USERS = 3;

export interface ReportUrgencyInfo {
  isUrgent: boolean;
  distinctUsersCount: number;
  nearbyReportIds: string[];
  minDistanceMeters: number | null;
}

/**
 * Calcula la distancia geodésica en metros entre dos coordenadas GPS
 * utilizando la fórmula de Haversine.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radio medio de la Tierra en metros
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Analiza todos los reportes y detecta cuáles son URGENTES para el Administrador.
 * Reglas de negocio:
 * 1. Solo participan reportes NO solucionados (estado !== 'solucionado').
 * 2. Se buscan reportes activos dentro de un radio <= 10 metros.
 * 3. Se cuentan únicamente reportes de DISTINTOS usuarios (usuario_id únicos).
 * 4. Es URGENTE a partir de 3 o más reportes de distintos usuarios en ese radio de 10m.
 */
export function analyzeReportsUrgency(
  reportes: Reporte[],
  radiusMeters: number = URGENCY_RADIUS_METERS,
  minDistinctUsers: number = URGENCY_MIN_DISTINCT_USERS
): Record<string, ReportUrgencyInfo> {
  const result: Record<string, ReportUrgencyInfo> = {};

  for (const r of reportes) {
    result[r.id] = {
      isUrgent: false,
      distinctUsersCount: r.estado === 'solucionado' ? 0 : 1,
      nearbyReportIds: r.estado === 'solucionado' ? [] : [r.id],
      minDistanceMeters: null,
    };
  }

  const activeReports = reportes.filter((r) => r.estado !== 'solucionado');

  for (const current of activeReports) {
    const nearbyActive: Reporte[] = [];
    let closestOtherDist: number | null = null;

    for (const candidate of activeReports) {
      const dist = calculateDistanceMeters(
        current.latitud,
        current.longitud,
        candidate.latitud,
        candidate.longitud
      );

      if (dist <= radiusMeters) {
        nearbyActive.push(candidate);
        if (candidate.id !== current.id) {
          if (closestOtherDist === null || dist < closestOtherDist) {
            closestOtherDist = dist;
          }
        }
      }
    }

    const uniqueUserIds = new Set(nearbyActive.map((r) => r.usuario_id));
    const distinctUsersCount = uniqueUserIds.size;

    result[current.id] = {
      isUrgent: distinctUsersCount >= minDistinctUsers,
      distinctUsersCount,
      nearbyReportIds: nearbyActive.map((r) => r.id),
      minDistanceMeters: closestOtherDist !== null ? Number(closestOtherDist.toFixed(1)) : null,
    };
  }

  // Asegurar que todos los reportes dentro de un foco urgente de 10m compartan el estado urgente
  const baseSnapshot = { ...result };
  for (const current of activeReports) {
    const info = baseSnapshot[current.id];
    if (info && info.isUrgent) {
      for (const neighborId of info.nearbyReportIds) {
        if (result[neighborId] && !result[neighborId].isUrgent) {
          result[neighborId] = {
            ...result[neighborId],
            isUrgent: true,
            distinctUsersCount: Math.max(
              result[neighborId].distinctUsersCount,
              info.distinctUsersCount
            ),
            nearbyReportIds: Array.from(
              new Set([...result[neighborId].nearbyReportIds, ...info.nearbyReportIds])
            ),
          };
        }
      }
    }
  }

  return result;
}
