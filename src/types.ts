export type RolUsuario = 'ciudadano' | 'admin';

export type EstadoReporte = 'pendiente' | 'revisado' | 'en_proceso' | 'solucionado';

export interface Usuario {
  id: string; // UUID
  nombre: string;
  email: string;
  password_hash?: string;
  rol: RolUsuario;
  fecha_registro: string;
}

export interface Reporte {
  id: string; // UUID
  usuario_id: string;
  usuario_nombre?: string;
  titulo: string;
  descripcion?: string;
  latitud: number;
  longitud: number;
  foto_url: string;
  estado: EstadoReporte;
  respuesta_admin?: string | null;
  fecha_creacion: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
}

export interface ImageCompressionResult {
  file: File;
  dataUrl: string;
  originalSizeKB: number;
  compressedSizeKB: number;
  compressionRatioPercent: number;
}
