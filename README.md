# UrbanoAlert - Gestión de Incidencias Urbanas

**UrbanoAlert** es una plataforma web cívica descentralizada para el reporte ciudadano y la gestión municipal de incidencias urbanas (baches, fallas de alumbrado público, semáforos averiados, acumulación de residuos, aceras dañadas, entre otros).

El sistema integra cartografía libre mediante **OpenStreetMap (Leaflet)**, captura de coordenadas GPS en tiempo real, compresión automática de evidencia fotográfica en el cliente y arquitectura híbrida con **Supabase (Backend-as-a-Service)** y persistencia local (`localStorage`) para funcionar tanto conectado a la nube como en modo demostración sin configuración previa.

---

## Tabla de Contenidos

1. [Características Principales y Requerimientos](#1-características-principales-y-requerimientos)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Requisitos Previos e Instalación](#4-requisitos-previos-e-instalación)
5. [Scripts Disponibles](#5-scripts-disponibles)
6. [Configuración de Supabase y Base de Datos (SQL)](#6-configuración-de-supabase-y-base-de-datos-sql)
7. [Modo Demostración y Cuentas de Prueba](#7-modo-demostración-y-cuentas-de-prueba)

---

## 1. Características Principales y Requerimientos

### Módulo 1: Autenticación y Gestión de Usuarios
- **RF-1.1 (Registro):** Creación de cuentas mediante nombre, correo electrónico y contraseña.
- **RF-1.2 (Inicio de sesión):** Validación de credenciales y cambio rápido entre perfiles de prueba.
- **RF-1.3 (Rol por defecto):** Asignación automática del rol `ciudadano` a todo nuevo usuario registrado.
- **RF-1.4 (Sesión persistente):** Almacenamiento seguro del estado de sesión en el navegador (`localStorage`).

### Módulo 2: Interfaz Ciudadano (`CitizenView`)
- **RF-2.1 (Geolocalización GPS):** Captura automática de latitud y longitud del dispositivo mediante la API de Geolocalización del navegador o selección interactiva en el mapa.
- **RF-2.2 (Evidencia fotográfica):** Carga de fotografía desde cámara o galería con previsualización y métricas de optimización.
- **RF-2.3 (Formulario de reporte):** Registro con título obligatorio (`VARCHAR(100)`) y descripción detallada opcional.
- **RF-2.4 (Historial personal):** Visualización exclusiva de los reportes creados por el ciudadano autenticado.
- **RF-2.5 (Seguimiento en tiempo real):** Consulta del estado actual (`pendiente`, `revisado`, `en_proceso`, `solucionado`) y de la respuesta oficial emitida por la administración municipal (`respuesta_admin`).

### Módulo 3: Interfaz Administrador (`AdminView`)
- **RF-3.1 (Bandeja global):** Tablero de control con indicadores clave (KPIs) y listado completo de incidencias reportadas en el municipio.
- **RF-3.2 (Cartografía OpenStreetMap):** Mapa interactivo con marcadores diferenciados por color según el estado del reporte e inspección detallada.
- **RF-3.3 (Filtros y búsqueda):** Filtrado rápido por estado de incidencia y búsqueda por texto.
- **RF-3.4 y RF-3.5 (Gestión del ciclo de vida):** Actualización del estado del reporte y registro de la respuesta técnica u orden de servicio municipal (`respuesta_admin`).

### Requerimientos No Funcionales (RNF)
- **RNF-1 (Compresión de imagen):** Toda imagen adjuntada se redimensiona (máximo `1400px`) y comprime en formato JPEG al **55% de calidad** mediante HTML5 Canvas antes de enviarse o almacenarse, reduciendo el consumo de ancho de banda y almacenamiento.
- **RNF-2 (Eficiencia de red y paginación):** Los listados de reportes implementan paginación en cliente/servidor para optimizar la visualización.
- **RNF-3 (Integridad relacional):** Eliminación en cascada (`ON DELETE CASCADE`) entre `usuarios` y `reportes`.
- **RNF-4 (Validación de estados):** Restricciones `CHECK` en PostgreSQL para roles (`ciudadano`, `admin`) y estados (`pendiente`, `revisado`, `en_proceso`, `solucionado`).
- **RNF-5 (Seguridad RLS):** Políticas de *Row Level Security* en Supabase para proteger el acceso a las tablas.

---

## 2. Stack Tecnológico

- **Frontend Framework:** React 19 + TypeScript
- **Bundler / Entorno de Desarrollo:** Vite 8
- **Estilos e Interfaz:** Tailwind CSS v4 + Lucide React (iconografía)
- **Mapas y Geolocalización:** Leaflet (`leaflet` + `@types/leaflet`) con teselas gratuitas de **OpenStreetMap**
- **Backend-as-a-Service (BaaS):** Supabase (`@supabase/supabase-js`) con fallback automático a `localStorage`

---

## 3. Estructura del Proyecto

```text
Optativa_4/
├── public/
│   └── assets/aistudio/
│       └── AnalisisDeRequerimientos.md  # Documento de especificación de requerimientos
├── src/
│   ├── components/
│   │   ├── AdminView.tsx            # Panel de gestión municipal, KPIs, mapa global y actualización de estados
│   │   ├── AuthModal.tsx            # Modal de perfil de sesión activa y cierre de sesión
│   │   ├── CitizenView.tsx          # Formulario de nuevo reporte ciudadano e historial personal
│   │   ├── LoginView.tsx            # Pantalla de inicio de sesión, registro ciudadano y tarjeta de credenciales
│   │   ├── Navbar.tsx               # Barra de navegación superior, indicador de rol y cierre de sesión
│   │   ├── OpenStreetMap.tsx        # Componente reutilizable de mapa interactivo con Leaflet y OpenStreetMap
│   │   └── SupabaseConfigModal.tsx  # Modal para conectar Supabase en caliente y copiar el esquema SQL
│   ├── services/
│   │   ├── store.ts                 # Almacén reactivo de datos con sincronización híbrida (Supabase + localStorage)
│   │   └── supabaseClient.ts        # Inicialización del cliente Supabase, pruebas de conexión y esquema SQL
│   ├── utils/
│   │   └── imageCompressor.ts       # Compresor de imágenes vía Canvas (calidad 55%, máx. 1400px)
│   ├── App.tsx                      # Componente raíz de la aplicación
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

## 4. Requisitos Previos e Instalación

### Requisitos Previos
- **Node.js:** v20.19+ o v22.12+ recomendado (funciona también en v20.x).
- **npm:** v10+

### Pasos de Instalación

1. **Clonar o abrir el directorio del proyecto:**
   ```bash
   cd D:\Optativa_4
   ```

2. **Instalar las dependencias:**
   Debido a las restricciones de versiones peer entre Vite 8 y esbuild, instala las dependencias ejecutando:
   ```bash
   npm install --legacy-peer-deps
   ```
   > **Nota para usuarios de Windows:** Si al ejecutar Vite aparece un error de módulo nativo faltante de `rolldown` (`Cannot find module '@rolldown/binding-win32-x64-msvc'`), ejecuta:
   > ```bash
   > npm install @rolldown/binding-win32-x64-msvc --no-save --legacy-peer-deps
   > ```

3. **Variables de entorno (Opcional):**
   La aplicación **no requiere** configurar variables de entorno ni API Keys para ejecutarse, ya que cuenta con persistencia local y un configurador visual de Supabase dentro de la propia interfaz.
   Si deseas preconfigurar Supabase mediante variables de entorno, puedes crear un archivo `.env.local` en la raíz:
   ```env
   VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
   VITE_SUPABASE_ANON_KEY="tu-anon-key-publica"
   ```

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en: **http://localhost:3000/**

---

## 5. Scripts Disponibles

En el archivo `package.json` se encuentran definidos los siguientes comandos:

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo de Vite en el puerto `3000` (`http://localhost:3000`). |
| `npm run build` | Compila la aplicación para producción en la carpeta `dist/`. |
| `npm run preview` | Sirve localmente la compilación de producción generada en `dist/`. |
| `npm run lint` | Ejecuta la verificación estática de tipos con TypeScript (`tsc --noEmit`). |
| `npm run clean` | Elimina los artefactos compilados (`dist/`). |

---

## 6. Configuración de Supabase y Base de Datos (SQL)

El sistema puede conectarse a cualquier proyecto de **Supabase** directamente desde la interfaz haciendo clic en el botón **"Supabase"** de la barra de navegación superior, o mediante variables de entorno.

Para preparar la base de datos en Supabase, abre el **SQL Editor** de tu proyecto en Supabase y ejecuta el siguiente script SQL:

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

## 7. Modo Demostración y Cuentas de Prueba

Al abrir la aplicación se presenta la pantalla de autenticación (`LoginView`), donde puedes crear una nueva cuenta ciudadana o iniciar sesión con cualquiera de las dos cuentas preconfiguradas del sistema (también disponibles en la tarjeta inferior del Login para autocompletar con un clic):

| Rol | Nombre | Correo Electrónico | Contraseña | Permisos |
| :--- | :--- | :--- | :--- | :--- |
| **Ciudadano** | Carlos Méndez | `ciudadano@urbanoalert.com` | `ciudadano123` | Crear reportes con foto y GPS, consultar su propio historial y ver respuestas municipales. |
| **Administrador** | Ing. Patricia Ramos | `admin@municipio.gob` | `admin123` | Visualizar todos los reportes en lista y mapa OpenStreetMap, filtrar por estado, cambiar estados y emitir respuestas oficiales. |

También puedes restablecer los datos de demostración en cualquier momento desde el panel o el modal de configuración.
