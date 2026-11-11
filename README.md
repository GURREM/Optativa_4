# UrbanoAlert - Gestión de Incidencias Urbanas

**UrbanoAlert** es una plataforma web cívica descentralizada para el reporte ciudadano y la gestión municipal de incidencias urbanas (baches, fallas de alumbrado público, semáforos averiados, acumulación de residuos, aceras dañadas, entre otros).

El sistema integra cartografía libre mediante **OpenStreetMap (Leaflet)**, captura de coordenadas GPS en tiempo real, compresión automática de evidencia fotográfica en el cliente, control de acceso basado en roles (**RBAC**) con autenticación de usuarios y arquitectura híbrida con **Supabase (Backend-as-a-Service)** y persistencia local (`localStorage`).

---

## Tabla de Contenidos

1. [Características Principales y Requerimientos](#1-características-principales-y-requerimientos)
2. [Mejoras de Interfaz y Flujo Realista](#2-mejoras-de-interfaz-y-flujo-realista)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Cómo Ejecutar el Proyecto en Otras Máquinas (Paso a Paso)](#5-cómo-ejecutar-el-proyecto-en-otras-máquinas-paso-a-paso)
6. [Scripts Disponibles](#6-scripts-disponibles)
7. [Configuración de Supabase y Base de Datos (SQL)](#7-configuración-de-supabase-y-base-de-datos-sql)
8. [Cuentas de Acceso del Sistema](#8-cuentas-de-acceso-del-sistema)

---

## 1. Características Principales y Requerimientos

### Módulo 1: Autenticación y Gestión de Usuarios (`LoginView` & `Navbar`)
- **RF-1.1 (Registro):** Creación de nuevas cuentas mediante nombre completo, correo electrónico único y contraseña (mínimo 6 caracteres), con sincronización automática a Supabase si está conectado.
- **RF-1.2 (Inicio de sesión):** Pantalla de Login obligatoria (`LoginView.tsx`) con validación real de correo y contraseña contra el almacén de usuarios.
- **RF-1.3 (Rol por defecto y Control de Acceso RBAC):** Asignación automática del rol `ciudadano` a todo nuevo usuario registrado. Separación estricta de vistas: un ciudadano solo puede acceder al Portal Ciudadano y un administrador solo a la Consola Municipal.
- **RF-1.4 (Sesión persistente y Cierre de Sesión):** Almacenamiento seguro del estado de sesión en `localStorage` (`urbano_current_user_v2`) y menú desplegable en la esquina superior izquierda para consultar los detalles de la cuenta o cerrar sesión.

### Módulo 2: Interfaz Ciudadano (`CitizenView`)
- **RF-2.1 (Geolocalización GPS):** Captura automática de latitud y longitud del dispositivo mediante la API de Geolocalización del navegador o selección interactiva en el mapa.
- **RF-2.2 (Evidencia fotográfica):** Carga de fotografía desde cámara o galería con previsualización y métricas de optimización.
- **RF-2.3 (Formulario de reporte):** Registro con título obligatorio (`VARCHAR(100)`) y descripción detallada opcional.
- **RF-2.4 (Historial personal):** Visualización exclusiva de los reportes creados por el ciudadano autenticado.
- **RF-2.5 (Seguimiento en tiempo real):** Consulta del estado actual (`pendiente`, `revisado`, `en_proceso`, `solucionado`) y de la respuesta oficial emitida por la administración municipal (`respuesta_admin`).

### Módulo 3: Interfaz Administrador (`AdminView`)
- **RF-3.1 (Bandeja global):** Tablero de control municipal con listado completo de incidencias reportadas en la ciudad.
- **RF-3.2 (Cartografía OpenStreetMap):** Mapa interactivo global con marcadores diferenciados por color según el estado del reporte e inspección directa al hacer clic en cualquier pin.
- **RF-3.3 (Filtro Combobox y búsqueda):** Selector desplegable (**Combobox**) de estados con contadores en tiempo real (`Todos`, `Pendientes`, `Revisados`, `En Proceso`, `Solucionados`), botón de limpieza rápida de filtro y buscador por título, lugar o vecino.
- **RF-3.4 y RF-3.5 (Gestión del ciclo de vida):** Modal de gestión para actualizar el estado del reporte y registrar la respuesta técnica u orden de servicio municipal (`respuesta_admin`).

### Requerimientos No Funcionales (RNF)
- **RNF-1 (Compresión de imagen):** Toda imagen adjuntada se redimensiona (máximo `1400px`) y comprime en formato JPEG al **55% de calidad** mediante HTML5 Canvas antes de enviarse o almacenarse, reduciendo el consumo de red.
- **RNF-2 (Eficiencia de red y paginación):** Los listados de reportes implementan paginación (`6 reportes por página`).
- **RNF-3 (Integridad relacional):** Eliminación en cascada (`ON DELETE CASCADE`) entre `usuarios` y `reportes`.
- **RNF-4 (Validación de estados):** Restricciones `CHECK` en PostgreSQL para roles (`ciudadano`, `admin`) y estados (`pendiente`, `revisado`, `en_proceso`, `solucionado`).
- **RNF-5 (Seguridad RLS):** Políticas de *Row Level Security* en Supabase para proteger el acceso a las tablas.

---

## 2. Mejoras de Interfaz y Flujo Realista

1. **Pantalla de Login a pantalla completa (`src/components/LoginView.tsx`):**
   - Bloquea el acceso hasta que el usuario inicie sesión o se registre.
   - Incluye una tarjeta inferior de **Credenciales de Acceso** para autocompletar con un clic los datos de **Ciudadano** o **Administrador** durante pruebas y demostraciones.
2. **Menú desplegable de usuario en la esquina superior izquierda (`src/components/Navbar.tsx`):**
   - Muestra el avatar con las iniciales del usuario, su nombre y su rol.
   - Al desplegarse permite ver el correo electrónico, rol activo, abrir el modal **Detalles de la Cuenta** (`AuthModal.tsx`) o ejecutar **Cerrar Sesión**.
3. **Combobox de filtrado con contadores en tiempo real (`src/components/AdminView.tsx`):**
   - Integra las opciones de filtrado de estado en un selector desplegable limpio que muestra cuántos reportes existen en cada estado y permite limpiar el filtro con un clic.

---

## 3. Stack Tecnológico

- **Frontend Framework:** React 19 + TypeScript
- **Bundler / Entorno de Desarrollo:** Vite 8
- **Estilos e Interfaz:** Tailwind CSS v4 + Lucide React
- **Mapas y Geolocalización:** Leaflet (`leaflet` + `@types/leaflet`) con teselas gratuitas de **OpenStreetMap**
- **Backend-as-a-Service (BaaS):** Supabase (`@supabase/supabase-js`) con fallback automático a `localStorage`

---

## 4. Estructura del Proyecto

```text
Optativa_4/
├── public/
│   └── assets/aistudio/
│       └── AnalisisDeRequerimientos.md  # Documento de especificación de requerimientos
├── src/
│   ├── components/
│   │   ├── AdminView.tsx            # Consola municipal, mapa global, combobox de filtros y gestión de estados
│   │   ├── AuthModal.tsx            # Modal de detalles de la cuenta activa y cierre de sesión
│   │   ├── CitizenView.tsx          # Formulario de nuevo reporte ciudadano con GPS/foto e historial personal
│   │   ├── LoginView.tsx            # Pantalla de inicio de sesión, registro ciudadano y tarjeta de credenciales
│   │   ├── Navbar.tsx               # Barra superior con botón desplegable de usuario en esquina superior izquierda
│   │   ├── OpenStreetMap.tsx        # Componente reutilizable de mapa interactivo con Leaflet y OpenStreetMap
│   │   └── SupabaseConfigModal.tsx  # Modal para conectar Supabase en caliente y copiar el esquema SQL
│   ├── services/
│   │   ├── store.ts                 # Almacén reactivo con autenticación real y sincronización (Supabase + localStorage)
│   │   └── supabaseClient.ts        # Inicialización del cliente Supabase, pruebas de conexión y esquema SQL
│   ├── utils/
│   │   └── imageCompressor.ts       # Compresor de imágenes vía Canvas (calidad 55%, máx. 1400px)
│   ├── App.tsx                      # Componente raíz y enrutamiento protegido por rol (RBAC)
│   ├── index.css                    # Estilos globales e importación de Tailwind CSS y Leaflet
│   ├── main.tsx                     # Punto de entrada de React
│   └── types.ts                     # Definiciones de tipos e interfaces TypeScript
├── .env.example                     # Plantilla de variables de entorno
├── index.html                       # Documento HTML principal
├── metadata.json                    # Metadatos del proyecto y permisos requeridos (geolocation)
├── package.json                     # Dependencias y scripts de construcción
├── tsconfig.json                    # Configuración de TypeScript
└── vite.config.ts                   # Configuración de Vite y plugins
```

---

## 5. Cómo Ejecutar el Proyecto en Otras Máquinas (Paso a Paso)

Sigue esta guía para clonar o copiar el proyecto y ejecutarlo en cualquier otra computadora (**Windows, macOS o Linux**):

### 5.1. Requisitos Previos en la Máquina Destino
1. Instalar **Node.js** (versión **20.19+** o **22.12+** LTS recomendada, descargable desde [nodejs.org](https://nodejs.org/)).
2. Verificar en la terminal que Node y npm estén instalados:
   ```bash
   node -v
   npm -v
   ```

### 5.2. Copiar o Clonar el Proyecto
- **Si usas Git:**
  ```bash
  git clone <URL_DEL_REPOSITORIO>
  cd Optativa_4
  ```
- **Si copias la carpeta por USB / ZIP:**
  > **Importante:** Copia el proyecto **sin** la carpeta `node_modules` ni `dist` (así el archivo pesará pocos megabytes y evitarás conflictos de binarios entre distintos sistemas operativos).

### 5.3. Instalar Dependencias
Abre una terminal dentro de la carpeta del proyecto y ejecuta:

```bash
npm install --legacy-peer-deps
```

#### Solución según el Sistema Operativo (Windows / macOS / Linux)
Vite 8 utiliza `rolldown`, el cual requiere un binario nativo para el sistema operativo donde se ejecuta. Si el archivo `package-lock.json` fue generado en otro sistema operativo y al ejecutar `npm run dev` aparece el error `Cannot find native binding` / `Cannot find module '@rolldown/binding-...'`, aplica una de estas dos opciones:

- **Opción A (En Windows x64 - Más rápida):**
  ```bash
  npm install @rolldown/binding-win32-x64-msvc --no-save --legacy-peer-deps
  ```
- **Opción B (En cualquier SO: Windows, macOS o Linux):**
  Borra `node_modules` y `package-lock.json` y vuelve a instalar:
  ```bash
  # En PowerShell (Windows):
  Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
  npm install --legacy-peer-deps

  # En Bash (macOS / Linux):
  rm -rf node_modules package-lock.json
  npm install --legacy-peer-deps
  ```

### 5.4. Variables de Entorno (Opcional)
**No es obligatorio configurar ningún archivo `.env` ni API Key** para ejecutar la aplicación: el proyecto funciona inmediatamente con su base de datos local y permite configurar Supabase desde la interfaz gráfica.

Si deseas dejar preconfigurada la conexión a Supabase en esa máquina, crea un archivo `.env.local` en la raíz del proyecto:
```env
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu-anon-key-publica"
```

### 5.5. Iniciar la Aplicación
Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

La terminal mostrará dos enlaces:
- **En la misma computadora (Local):** `http://localhost:3000/`
- **Desde celulares u otras PCs en la misma red Wi-Fi/LAN (Network):** `http://<IP_LOCAL_DE_LA_MAQUINA>:3000/` (por ejemplo `http://192.168.1.3:3000/`), ya que el script `dev` está configurado con `--host=0.0.0.0`.

---

## 6. Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo de Vite en el puerto `3000` expuesto en red local (`--host=0.0.0.0`). |
| `npm run build` | Compila y empaqueta la aplicación para producción en la carpeta `dist/`. |
| `npm run preview` | Sirve localmente la compilación de producción generada en `dist/`. |
| `npm run lint` | Ejecuta la verificación estática de tipos con TypeScript (`tsc --noEmit`). |
| `npm run clean` | Elimina los artefactos compilados (`dist/`). |

---

## 7. Configuración de Supabase y Base de Datos (SQL)

El sistema puede conectarse a cualquier proyecto de **Supabase** directamente desde la interfaz haciendo clic en el botón **"Base de Datos Local · SQL"** / **"Supabase Conectado"** de la esquina superior derecha.

Para preparar las tablas en Supabase, abre el **SQL Editor** de tu proyecto en Supabase y ejecuta el siguiente script SQL:

```sql
-- 1. Tabla de Usuarios
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

-- Políticas de lectura y escritura
CREATE POLICY "Lectura publica reportes" ON reportes FOR SELECT USING (true);
CREATE POLICY "Insercion de reportes" ON reportes FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizacion admin de reportes" ON reportes FOR UPDATE USING (true);
```

---

## 8. Cuentas de Acceso del Sistema

Al abrir la aplicación se presenta la pantalla de autenticación (`LoginView`), donde puedes registrar una nueva cuenta ciudadana o iniciar sesión con cualquiera de las dos cuentas preconfiguradas (disponibles también en la tarjeta inferior del Login para autocompletar con un clic):

| Rol | Nombre | Correo Electrónico | Contraseña | Permisos y Vista Asignada |
| :--- | :--- | :--- | :--- | :--- |
| **Ciudadano** | Carlos Méndez | `ciudadano@urbanoalert.com` | `ciudadano123` | Acceso exclusivo al **Portal Ciudadano**: crear reportes con foto comprimida y GPS, y consultar el estado y respuesta oficial de sus propios reportes. |
| **Administrador** | Ing. Patricia Ramos | `admin@municipio.gob` | `admin123` | Acceso exclusivo al **Panel Administrador**: visualizar todos los reportes en lista y mapa OpenStreetMap, filtrar mediante combobox por estado, actualizar estados y emitir respuestas oficiales. |
