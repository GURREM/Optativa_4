import { Reporte, Usuario, EstadoReporte } from '../types';
import { getSupabaseClient } from './supabaseClient';

const STORAGE_KEY_REPORTES = 'urbano_reportes_v1';
const STORAGE_KEY_CURRENT_USER = 'urbano_current_user_v1';
const STORAGE_KEY_USERS = 'urbano_users_v1';

// Usuarios de demostración
export const DEMO_CIUDADANO: Usuario = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  nombre: 'Carlos Méndez',
  email: 'ciudadano@urbanoalert.com',
  rol: 'ciudadano',
  fecha_registro: '2026-02-15T10:30:00Z',
};

export const DEMO_ADMIN: Usuario = {
  id: 'b1ffcd88-8b1a-4de7-aa5c-5aa8ac270b22',
  nombre: 'Ing. Patricia Ramos (Administración Municipal)',
  email: 'admin@municipio.gob',
  rol: 'admin',
  fecha_registro: '2026-01-10T08:00:00Z',
};

// Generador de imágenes SVG elegantes y realistas para incidentes urbanos de muestra
function createIncidentIllustration(type: 'bache' | 'luminaria' | 'semaforo' | 'basura' | 'acera'): string {
  const configs = {
    bache: {
      bg: '#334155',
      accent: '#E2E8F0',
      icon: '<path d="M20 70 Q 50 50, 90 65 T 160 60 Q 180 80, 150 90 T 70 85 Z" fill="#1E293B" stroke="#64748B" stroke-width="4"/><circle cx="100" cy="72" r="14" fill="#0F172A"/><path d="M40 30 L80 30" stroke="#F59E0B" stroke-width="6" stroke-linecap="round"/>',
      text: 'BACHE EN ASFALTO',
      sub: 'Calle Los Álamos 450'
    },
    luminaria: {
      bg: '#1E293B',
      accent: '#FDE047',
      icon: '<path d="M100 110 L100 30 Q 100 15, 120 15 L130 15" fill="none" stroke="#94A3B8" stroke-width="6"/><circle cx="130" cy="22" r="12" fill="#FACC15"/><path d="M110 35 L150 85 L90 85 Z" fill="#FEF08A" opacity="0.4"/>',
      text: 'LUMINARIA APAGADA',
      sub: 'Av. Libertador c/ Potosí'
    },
    semaforo: {
      bg: '#0F172A',
      accent: '#EF4444',
      icon: '<rect x="80" y="20" width="40" height="85" rx="8" fill="#1E293B" stroke="#475569" stroke-width="4"/><circle cx="100" cy="38" r="9" fill="#EF4444"/><circle cx="100" cy="62" r="9" fill="#F59E0B" opacity="0.3"/><circle cx="100" cy="86" r="9" fill="#10B981" opacity="0.3"/><rect x="96" y="105" width="8" height="20" fill="#64748B"/>',
      text: 'SEMÁFORO INTERMITENTE',
      sub: 'Cruce Av. 6 de Agosto'
    },
    basura: {
      bg: '#334155',
      accent: '#10B981',
      icon: '<path d="M60 45 L140 45 L130 100 L70 100 Z" fill="#475569" stroke="#64748B" stroke-width="4"/><path d="M75 45 L80 25 L120 25 L125 45" fill="none" stroke="#94A3B8" stroke-width="4"/><line x1="85" y1="55" x2="85" y2="90" stroke="#CBD5E1" stroke-width="3"/><line x1="100" y1="55" x2="100" y2="90" stroke="#CBD5E1" stroke-width="3"/><line x1="115" y1="55" x2="115" y2="90" stroke="#CBD5E1" stroke-width="3"/>',
      text: 'RESIDUOS ACUMULADOS',
      sub: 'Plaza 25 de Mayo'
    },
    acera: {
      bg: '#475569',
      accent: '#CBD5E1',
      icon: '<rect x="30" y="30" width="140" height="65" fill="#334155" stroke="#94A3B8" stroke-width="3"/><line x1="60" y1="30" x2="85" y2="95" stroke="#0F172A" stroke-width="5"/><line x1="85" y1="65" x2="120" y2="50" stroke="#0F172A" stroke-width="4"/><line x1="120" y1="50" x2="140" y2="95" stroke="#0F172A" stroke-width="4"/>',
      text: 'ACERA FRACTURADA',
      sub: 'Pasaje San Alberto 120'
    }
  };

  const item = configs[type];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130" width="100%" height="100%">
    <rect width="200" height="130" fill="${item.bg}"/>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    </pattern>
    <rect width="200" height="130" fill="url(#grid)"/>
    ${item.icon}
    <rect x="0" y="98" width="200" height="32" fill="rgba(15,23,42,0.85)"/>
    <text x="12" y="112" font-family="system-ui, sans-serif" font-weight="700" font-size="9" fill="${item.accent}">${item.text}</text>
    <text x="12" y="123" font-family="system-ui, sans-serif" font-size="8" fill="#94A3B8">${item.sub}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Datos de prueba iniciales georreferenciados en una ciudad (coordenadas cívicas realistas)
const INITIAL_DEMO_REPORTES: Reporte[] = [
  {
    id: 'c1111111-1111-4111-8111-111111111111',
    usuario_id: DEMO_CIUDADANO.id,
    usuario_nombre: DEMO_CIUDADANO.nombre,
    titulo: 'Bache de gran profundidad en carril derecho',
    descripcion: 'Peligro inminente para motocicletas y vehículos ligeros. El bache tiene aproximadamente 15 cm de profundidad tras las últimas lluvias torrenciales.',
    latitud: -16.50345000,
    longitud: -68.13256000,
    foto_url: createIncidentIllustration('bache'),
    estado: 'en_proceso',
    respuesta_admin: 'Inspección técnica realizada el 20/02/2026. Se programó bacheo con mezcla asfáltica en caliente con cuadrilla nocturna.',
    fecha_creacion: '2026-02-18T14:20:00Z',
  },
  {
    id: 'c2222222-2222-4222-8222-222222222222',
    usuario_id: DEMO_CIUDADANO.id,
    usuario_nombre: DEMO_CIUDADANO.nombre,
    titulo: 'Luminaria pública apagada en esquina oscura',
    descripcion: 'Poste metálico con foco LED intermitente y ahora totalmente apagado. Genera inseguridad en las noches al salir de la parada de bus.',
    latitud: -16.50789000,
    longitud: -68.12845000,
    foto_url: createIncidentIllustration('luminaria'),
    estado: 'revisado',
    respuesta_admin: 'Reporte ingresado al sistema de Alumbrado Público. Número de orden de servicio #AL-204.',
    fecha_creacion: '2026-02-22T20:45:00Z',
  },
  {
    id: 'c3333333-3333-4333-8333-333333333333',
    usuario_id: 'a9999999-9999-4999-8999-999999999999',
    usuario_nombre: 'Mariana Flores (Vecina)',
    titulo: 'Semáforo peatonal no cambia a luz verde',
    descripcion: 'El semáforo frente al colegio permanece siempre en rojo para peatones, obligando a niños y ancianos a cruzar con riesgo.',
    latitud: -16.51230000,
    longitud: -68.13670000,
    foto_url: createIncidentIllustration('semaforo'),
    estado: 'pendiente',
    respuesta_admin: null,
    fecha_creacion: '2026-02-25T09:15:00Z',
  },
  {
    id: 'c4444444-4444-4444-8444-444444444444',
    usuario_id: DEMO_CIUDADANO.id,
    usuario_nombre: DEMO_CIUDADANO.nombre,
    titulo: 'Acera levantada por raíces de árbol',
    descripcion: 'Las baldosas se encuentran totalmente partidas y levantadas 10 cm, imposibilitando el tránsito de sillas de ruedas o coches de bebé.',
    latitud: -16.49870000,
    longitud: -68.13990000,
    foto_url: createIncidentIllustration('acera'),
    estado: 'solucionado',
    respuesta_admin: 'Cuadrilla de Obras Públicas niveló la acera y reparó el alcorque del árbol el 24/02/2026. Trabajo concluido.',
    fecha_creacion: '2026-02-12T11:00:00Z',
  },
  {
    id: 'c5555555-5555-4555-8555-555555555555',
    usuario_id: 'a8888888-8888-4888-8888-888888888888',
    usuario_nombre: 'Rodrigo Morales',
    titulo: 'Contenedor desbordado y escombros',
    descripcion: 'Acumulación de bolsas plásticas y escombros de construcción fuera del contenedor asignado.',
    latitud: -16.51650000,
    longitud: -68.12510000,
    foto_url: createIncidentIllustration('basura'),
    estado: 'pendiente',
    respuesta_admin: null,
    fecha_creacion: '2026-02-26T07:30:00Z',
  },
];

export class AppDataStore {
  private reportes: Reporte[] = [];
  private users: Usuario[] = [];
  private currentUser: Usuario = DEMO_CIUDADANO;
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    // Cargar usuarios
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEY_USERS);
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      } else {
        this.users = [DEMO_CIUDADANO, DEMO_ADMIN];
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
      }
    } catch {
      this.users = [DEMO_CIUDADANO, DEMO_ADMIN];
    }

    // Cargar usuario actual
    try {
      const storedCurrent = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (storedCurrent) {
        this.currentUser = JSON.parse(storedCurrent);
      } else {
        this.currentUser = DEMO_CIUDADANO;
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(this.currentUser));
      }
    } catch {
      this.currentUser = DEMO_CIUDADANO;
    }

    // Cargar reportes
    try {
      const storedReportes = localStorage.getItem(STORAGE_KEY_REPORTES);
      if (storedReportes) {
        this.reportes = JSON.parse(storedReportes);
      } else {
        this.reportes = INITIAL_DEMO_REPORTES;
        localStorage.setItem(STORAGE_KEY_REPORTES, JSON.stringify(this.reportes));
      }
    } catch {
      this.reportes = INITIAL_DEMO_REPORTES;
    }
  }

  private saveReportes(): void {
    try {
      localStorage.setItem(STORAGE_KEY_REPORTES, JSON.stringify(this.reportes));
    } catch (err) {
      console.warn('Error al guardar reportes en localStorage', err);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public getCurrentUser(): Usuario {
    return this.currentUser;
  }

  public setCurrentUser(user: Usuario): void {
    this.currentUser = user;
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
    this.notify();
  }

  public switchRole(role: 'ciudadano' | 'admin'): void {
    if (role === 'admin') {
      this.setCurrentUser(DEMO_ADMIN);
    } else {
      this.setCurrentUser(DEMO_CIUDADANO);
    }
  }

  public async getReportes(): Promise<Reporte[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('reportes')
          .select('*')
          .order('fecha_creacion', { ascending: false });

        if (!error && data && data.length > 0) {
          this.reportes = data.map((d: any) => ({
            id: d.id,
            usuario_id: d.usuario_id,
            usuario_nombre: d.usuario_nombre || 'Usuario Ciudadano',
            titulo: d.titulo,
            descripcion: d.descripcion,
            latitud: Number(d.latitud),
            longitud: Number(d.longitud),
            foto_url: d.foto_url,
            estado: d.estado as EstadoReporte,
            respuesta_admin: d.respuesta_admin,
            fecha_creacion: d.fecha_creacion,
          }));
          this.saveReportes();
        }
      } catch (err) {
        console.warn('Error fetching from Supabase, using local fallback:', err);
      }
    }

    return [...this.reportes];
  }

  public async getReportesByUsuario(usuarioId: string): Promise<Reporte[]> {
    const all = await this.getReportes();
    return all.filter((r) => r.usuario_id === usuarioId);
  }

  public async addReporte(newReporteData: {
    titulo: string;
    descripcion?: string;
    latitud: number;
    longitud: number;
    foto_url: string;
  }): Promise<Reporte> {
    const newReporte: Reporte = {
      id: crypto.randomUUID ? crypto.randomUUID() : `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      usuario_id: this.currentUser.id,
      usuario_nombre: this.currentUser.nombre,
      titulo: newReporteData.titulo.trim(),
      descripcion: newReporteData.descripcion?.trim() || '',
      latitud: Number(newReporteData.latitud.toFixed(8)),
      longitud: Number(newReporteData.longitud.toFixed(8)),
      foto_url: newReporteData.foto_url,
      estado: 'pendiente', // RF-2.5 estado inicial obligatorio
      respuesta_admin: null,
      fecha_creacion: new Date().toISOString(),
    };

    // Intentar sincronizar con Supabase si está disponible
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('reportes').insert([
          {
            id: newReporte.id,
            usuario_id: newReporte.usuario_id,
            titulo: newReporte.titulo,
            descripcion: newReporte.descripcion,
            latitud: newReporte.latitud,
            longitud: newReporte.longitud,
            foto_url: newReporte.foto_url,
            estado: newReporte.estado,
            fecha_creacion: newReporte.fecha_creacion,
          },
        ]);
      } catch (err) {
        console.warn('Could not insert directly to Supabase, saved locally:', err);
      }
    }

    this.reportes.unshift(newReporte);
    this.saveReportes();
    return newReporte;
  }

  public async updateEstadoReporte(
    reporteId: string,
    nuevoEstado: EstadoReporte,
    respuestaAdmin?: string | null
  ): Promise<boolean> {
    const index = this.reportes.findIndex((r) => r.id === reporteId);
    if (index === -1) return false;

    this.reportes[index].estado = nuevoEstado;
    if (respuestaAdmin !== undefined) {
      this.reportes[index].respuesta_admin = respuestaAdmin;
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('reportes')
          .update({
            estado: nuevoEstado,
            respuesta_admin: respuestaAdmin ?? null,
          })
          .eq('id', reporteId);
      } catch (err) {
        console.warn('Could not update directly to Supabase, updated locally:', err);
      }
    }

    this.saveReportes();
    return true;
  }

  public registerUser(nombre: string, email: string, password_hash: string): Usuario {
    const newUser: Usuario = {
      id: crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`,
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      rol: 'ciudadano', // RF-1.3 Asignación automática obligatoria de rol ciudadano
      fecha_registro: new Date().toISOString(),
    };

    this.users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
    this.setCurrentUser(newUser);
    return newUser;
  }

  public loginUser(email: string, _password?: string): Usuario | null {
    const found = this.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (found) {
      this.setCurrentUser(found);
      return found;
    }
    // Si no existe, crear uno rápido para facilitar pruebas fluidas
    return this.registerUser(email.split('@')[0], email, 'hashed');
  }

  public resetDemoData(): void {
    this.reportes = [...INITIAL_DEMO_REPORTES];
    this.saveReportes();
  }
}

export const dataStore = new AppDataStore();
