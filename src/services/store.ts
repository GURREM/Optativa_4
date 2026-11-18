import { Reporte, Usuario, EstadoReporte } from '../types';
import { getSupabaseClient } from './supabaseClient';

const STORAGE_KEY_REPORTES = 'urbano_reportes_real_v1';
const STORAGE_KEY_CURRENT_USER = 'urbano_current_user_v2';
const STORAGE_KEY_USERS = 'urbano_users_v2';

// Usuarios preconfigurados del sistema para las tarjetas de acceso rápido
export const DEMO_CIUDADANO: Usuario = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  nombre: 'Carlos Méndez',
  email: 'ciudadano@urbanoalert.com',
  password_hash: 'ciudadano123',
  rol: 'ciudadano',
  fecha_registro: '2026-02-15T10:30:00Z',
};

export const DEMO_ADMIN: Usuario = {
  id: 'b1ffcd88-8b1a-4de7-aa5c-5aa8ac270b22',
  nombre: 'Ing. Patricia Ramos (Administración Municipal)',
  email: 'admin@municipio.gob',
  password_hash: 'admin123',
  rol: 'admin',
  fecha_registro: '2026-01-10T08:00:00Z',
};

export class AppDataStore {
  private reportes: Reporte[] = [];
  private users: Usuario[] = [];
  private currentUser: Usuario | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (
          e.key === STORAGE_KEY_REPORTES ||
          e.key === STORAGE_KEY_USERS ||
          e.key === STORAGE_KEY_CURRENT_USER
        ) {
          this.loadFromStorage();
          this.notify();
        }
      });
    }
  }

  private loadFromStorage(): void {
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

    try {
      const storedCurrent = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      this.currentUser = storedCurrent ? JSON.parse(storedCurrent) : null;
    } catch {
      this.currentUser = null;
    }

    try {
      const storedReportes = localStorage.getItem(STORAGE_KEY_REPORTES);
      this.reportes = storedReportes ? JSON.parse(storedReportes) : [];
    } catch {
      this.reportes = [];
    }
  }

  private persistReportesToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY_REPORTES, JSON.stringify(this.reportes));
    } catch (err) {
      console.warn('Error al guardar reportes en localStorage', err);
    }
  }

  private saveReportes(): void {
    this.persistReportesToStorage();
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

  public getCurrentUser(): Usuario | null {
    return this.currentUser;
  }

  public setCurrentUser(user: Usuario | null): void {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
    this.notify();
  }

  public logout(): void {
    this.setCurrentUser(null);
  }

  public async getReportes(): Promise<Reporte[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const [{ data: repData, error: repError }, { data: usrData }] = await Promise.all([
          supabase.from('reportes').select('*').order('fecha_creacion', { ascending: false }),
          supabase.from('usuarios').select('id, nombre'),
        ]);

        const userNameMap: Record<string, string> = {};
        for (const u of this.users) {
          userNameMap[u.id] = u.nombre;
        }
        if (usrData) {
          for (const u of usrData as any[]) {
            if (u.id && u.nombre) {
              userNameMap[u.id] = u.nombre;
            }
          }
        }

        if (!repError && repData) {
          this.reportes = repData.map((d: any) => ({
            id: d.id,
            usuario_id: d.usuario_id,
            usuario_nombre: d.usuario_nombre || userNameMap[d.usuario_id] || 'Ciudadano',
            titulo: d.titulo,
            descripcion: d.descripcion,
            latitud: Number(d.latitud),
            longitud: Number(d.longitud),
            foto_url: d.foto_url,
            estado: d.estado as EstadoReporte,
            respuesta_admin: d.respuesta_admin,
            fecha_creacion: d.fecha_creacion,
          }));
          this.persistReportesToStorage();
        }
      } catch (err) {
        console.warn('Error consultando Supabase, usando respaldo local:', err);
      }
    } else {
      try {
        const storedReportes = localStorage.getItem(STORAGE_KEY_REPORTES);
        if (storedReportes) {
          this.reportes = JSON.parse(storedReportes);
        }
      } catch {
        // Mantener copia en memoria si falla el parseo
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
    if (!this.currentUser) {
      throw new Error('Debes iniciar sesión para registrar un reporte.');
    }

    const newReporte: Reporte = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      usuario_id: this.currentUser.id,
      usuario_nombre: this.currentUser.nombre,
      titulo: newReporteData.titulo.trim(),
      descripcion: newReporteData.descripcion?.trim() || '',
      latitud: Number(newReporteData.latitud.toFixed(8)),
      longitud: Number(newReporteData.longitud.toFixed(8)),
      foto_url: newReporteData.foto_url,
      estado: 'pendiente',
      respuesta_admin: null,
      fecha_creacion: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('usuarios').upsert(
          [
            {
              id: this.currentUser.id,
              nombre: this.currentUser.nombre,
              email: this.currentUser.email,
              password_hash: this.currentUser.password_hash || 'ciudadano123',
              rol: this.currentUser.rol,
            },
          ],
          { onConflict: 'id', ignoreDuplicates: true }
        );

        const { error: insertErr } = await supabase.from('reportes').insert([
          {
            id: newReporte.id,
            usuario_id: newReporte.usuario_id,
            usuario_nombre: newReporte.usuario_nombre,
            titulo: newReporte.titulo,
            descripcion: newReporte.descripcion,
            latitud: newReporte.latitud,
            longitud: newReporte.longitud,
            foto_url: newReporte.foto_url,
            estado: newReporte.estado,
            fecha_creacion: newReporte.fecha_creacion,
          },
        ]);

        if (insertErr) {
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
        }
      } catch (err) {
        console.warn('No se pudo insertar directamente en Supabase, guardado localmente:', err);
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
    if (index !== -1) {
      this.reportes[index] = {
        ...this.reportes[index],
        estado: nuevoEstado,
        ...(respuestaAdmin !== undefined ? { respuesta_admin: respuestaAdmin } : {}),
      };
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
        console.warn('No se pudo actualizar en Supabase, actualizado localmente:', err);
      }
    }

    this.saveReportes();
    return true;
  }

  public async registerUser(
    nombre: string,
    email: string,
    password_hash: string
  ): Promise<{ user?: Usuario; error?: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    if (password_hash.length < 6) {
      return { error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: existingRemote } = await supabase
          .from('usuarios')
          .select('id')
          .ilike('email', normalizedEmail)
          .maybeSingle();

        if (existingRemote) {
          return { error: 'Este correo electrónico ya está registrado. Por favor inicia sesión.' };
        }
      } catch (err) {
        console.warn('Aviso al verificar correo en Supabase:', err);
      }
    }

    const existingLocal = this.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existingLocal) {
      return { error: 'Este correo electrónico ya está registrado. Por favor inicia sesión.' };
    }

    const newUser: Usuario = {
      id: crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`,
      nombre: nombre.trim(),
      email: normalizedEmail,
      password_hash,
      rol: 'ciudadano',
      fecha_registro: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { error } = await supabase.from('usuarios').insert([
          {
            id: newUser.id,
            nombre: newUser.nombre,
            email: newUser.email,
            password_hash: newUser.password_hash,
            rol: newUser.rol,
            fecha_registro: newUser.fecha_registro,
          },
        ]);
        if (error) {
          console.warn('Aviso al sincronizar usuario en Supabase:', error.message);
        }
      } catch (err) {
        console.warn('Error al registrar usuario en Supabase:', err);
      }
    }

    this.users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
    this.setCurrentUser(newUser);

    return { user: newUser };
  }

  public async loginUser(
    email: string,
    password: string
  ): Promise<{ user?: Usuario; error?: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: remoteUser } = await supabase
          .from('usuarios')
          .select('*')
          .ilike('email', normalizedEmail)
          .maybeSingle();

        if (remoteUser) {
          if (remoteUser.password_hash && remoteUser.password_hash !== password) {
            return { error: 'Contraseña incorrecta. Verifica tus credenciales e intenta nuevamente.' };
          }

          const loggedUser: Usuario = {
            id: remoteUser.id,
            nombre: remoteUser.nombre,
            email: remoteUser.email,
            password_hash: remoteUser.password_hash,
            rol: remoteUser.rol,
            fecha_registro: remoteUser.fecha_registro,
          };

          const localIdx = this.users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);
          if (localIdx >= 0) {
            this.users[localIdx] = loggedUser;
          } else {
            this.users.push(loggedUser);
          }
          localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
          this.setCurrentUser(loggedUser);
          return { user: loggedUser };
        }
      } catch (err) {
        console.warn('Aviso al consultar usuario en Supabase, verificando localmente:', err);
      }
    }

    const found = this.users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!found) {
      return { error: 'No existe ninguna cuenta registrada con este correo electrónico.' };
    }

    if (found.password_hash && found.password_hash !== password) {
      return { error: 'Contraseña incorrecta. Verifica tus credenciales e intenta nuevamente.' };
    }

    // Si es una cuenta base preconfigurada y aún no estaba en Supabase, sincronizarla
    if (supabase) {
      supabase
        .from('usuarios')
        .upsert(
          [
            {
              id: found.id,
              nombre: found.nombre,
              email: found.email,
              password_hash: found.password_hash || password,
              rol: found.rol,
            },
          ],
          { onConflict: 'id', ignoreDuplicates: true }
        )
        .then(() => {});
    }

    this.setCurrentUser(found);
    return { user: found };
  }
}

export const dataStore = new AppDataStore();
