import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

const STORAGE_KEY_URL = 'urbano_supabase_url';
const STORAGE_KEY_KEY = 'urbano_supabase_key';

let cachedClient: SupabaseClient | null = null;

export const SUPABASE_SQL_SCHEMA = `-- 1. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'ciudadano' CHECK (rol IN ('ciudadano', 'admin')),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Reportes
CREATE TABLE IF NOT EXISTS reportes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    latitud NUMERIC(10,8) NOT NULL,
    longitud NUMERIC(11,8) NOT NULL,
    foto_url TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'revisado', 'en_proceso', 'solucionado')),
    respuesta_admin TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Habilitar Row Level Security (RNF-5)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura y escritura para pruebas / producción
CREATE POLICY "Lectura publica reportes" ON reportes FOR SELECT USING (true);
CREATE POLICY "Insercion de reportes" ON reportes FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizacion admin de reportes" ON reportes FOR UPDATE USING (true);
`;

const DEFAULT_SUPABASE_URL = 'https://yonwsgwgmgqrwfwiajzo.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_Rul0p7dBsWHydOyzRt9kbg_KO0EBVnC';

export function getSavedSupabaseConfig(): SupabaseConfig {
  const env = (import.meta as any).env || {};
  const envUrl = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const envKey =
    env.VITE_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_KEY;

  const storedUrl = localStorage.getItem(STORAGE_KEY_URL) || envUrl;
  const storedKey = localStorage.getItem(STORAGE_KEY_KEY) || envKey;

  return {
    url: storedUrl,
    anonKey: storedKey,
    connected: Boolean(storedUrl && storedKey),
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (url && anonKey) {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
    cachedClient = null; // reset cached client
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
    cachedClient = null;
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getSavedSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('Error al inicializar cliente de Supabase:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url.startsWith('https://')) {
      return { success: false, message: 'La URL de Supabase debe comenzar con https://' };
    }
    const tempClient = createClient(url, anonKey);
    // Verificar conexión ejecutando una consulta ligera
    const { error } = await tempClient.from('reportes').select('id').limit(1);
    
    if (error && error.code === '42P01') {
      // Tabla no existe pero la conexión y autenticación fue exitosa
      return {
        success: true,
        message: '¡Conexión exitosa con Supabase! (Recuerda ejecutar el script SQL para crear las tablas reportes y usuarios)',
      };
    } else if (error) {
      return { success: false, message: `Error de Supabase: ${error.message}` };
    }

    return { success: true, message: '¡Conexión y tablas verificadas exitosamente con Supabase!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'No se pudo conectar con Supabase' };
  }
}
