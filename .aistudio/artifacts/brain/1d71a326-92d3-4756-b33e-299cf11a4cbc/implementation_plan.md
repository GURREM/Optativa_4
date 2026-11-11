# UrbanoAlert - Sistema de Gestión de Incidencias Urbanas

Plataforma integral para el reporte ciudadano y la administración municipal de incidencias urbanas (baches, luminarias, semáforos, áreas verdes) con geolocalización GPS, mapas OpenStreetMap, compresión de fotografías en cliente y arquitectura conectable a Supabase (PostgreSQL + Auth + Storage).

## Decisiones Críticas y Preferencias Confirmadas

> [!IMPORTANT]
> Decisiones confirmadas por el usuario para la implementación:
> - **Visualización y Roles**: Diseño híbrido con selector ágil de rol entre **Ciudadano** (experiencia móvil ergonómica para registro y reporte) y **Administrador** (consola de gestión municipal con mapa global y filtros).
> - **Persistencia y Backend**: Conector para **Supabase** (PostgreSQL, Auth y Storage), con capa de datos reactiva offline-first y asistente de configuración SQL integrado para vincular credenciales en cualquier momento.
> - **Datos Iniciales**: Inclusión de incidencias urbanas precargadas con coordenadas GPS reales en mapa y fotografías de muestra para pruebas inmediatas.

---

## 1. Visión General del Producto

### ¿Qué resuelve el sistema?
Permite cerrar la brecha de comunicación entre los ciudadanos y la administración pública municipal. Un ciudadano detecta un problema en la vía pública (ej. un bache peligroso o un semáforo descompuesto), toma una fotografía, el sistema captura las coordenadas GPS exactas mediante OpenStreetMap y lo envía. El administrador municipal visualiza en tiempo real todos los reportes sobre el mapa interactivo, filtra por estado (`pendiente`, `revisado`, `en_proceso`, `solucionado`), actualiza el ciclo de vida de la incidencia y emite una respuesta oficial visible inmediatamente para el ciudadano.

### Audiencia Objetivo
1. **Ciudadano**: Interfaz ágil, táctil y libre de fricciones para fotografiar, geolocalizar y enviar reportes en segundos, con seguimiento transparente de sus propios reportes.
2. **Administrador Municipal / Operaciones**: Tablero analítico con mapa interactivo en pantalla completa, filtros por estado, vista previa de fotos en alta resolución y formulario para redactar respuestas oficiales.

---

## 2. Experiencia de Usuario y Diseño Visual

### Identidad Visual y Estilo
- **Dirección Estética**: Cívica, contemporánea, limpia y utilitaria, inspirada en las mejores plataformas cívicas y sistemas de diseño municipal modernos (GovTech europeo y latinoamericano).
- **Paleta de Colores**:
  - *Lienzo y Superficie*: Blanco nítido y gris suave (`#F8FAFC` / `#FFFFFF`), con modo oscuro refinado (`#0F172A` / `#1E293B`).
  - *Color Primario*: Azul marino cívico institucional (`#0F4C81` / `#1E40AF`) que transmite seriedad y confianza ciudadana.
  - *Acentos Semánticos para Estados*:
    - **Pendiente**: Ámbar cálido (`#D97706`).
    - **Revisado**: Azul informativo (`#2563EB`).
    - **En Proceso**: Índigo / Violeta activo (`#6366F1`).
    - **Solucionado**: Verde esmeralda resolutivo (`#059669`).
- **Tipografía**:
  - *Encabezados*: `Plus Jakarta Sans` para títulos claros y legibles.
  - *Cuerpo y Formularios*: `DM Sans` para óptima legibilidad en pantallas móviles y de escritorio.
  - *Coordenadas y Tiempos*: `IBM Plex Mono` / `tabular-nums` para latitud, longitud y fechas.

### Flujos Clave de Usuario

```
[ CIUDADANO ]
  1. Login / Registro rápido (rol 'ciudadano' por defecto)
  2. Vista "Nuevo Reporte":
     - Detección automática GPS / selección de punto en OpenStreetMap
     - Captura de foto con compresión automática en cliente (calidad 50-60%)
     - Ingreso de título y descripción
  3. "Mis Reportes": Historial exclusivo con estado actual y respuesta oficial del admin

[ ADMINISTRADOR ]
  1. Consola Global con Mapa OpenStreetMap interactivo
  2. Marcadores clasificados por estado con popups de detalle
  3. Filtros rápidos (Todos, Pendiente, Revisado, En Proceso, Solucionado)
  4. Modal de Gestión: Cambio de estado + redacción de "respuesta_admin"
  5. Tabla y tarjetas paginadas con búsqueda instantánea
```

---

## 3. Decisiones de Producto y Arquitectura

1. **Soporte de Mapas OpenStreetMap**:
   - *Elección*: Integración con **Leaflet** y mosaicos de **OpenStreetMap** (Standard tiles `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
   - *Por qué*: Es 100% código abierto, no requiere API Keys con tarjetas de crédito, cumple estrictamente con el requerimiento del documento y proporciona renderizado fluido tanto en móvil como en escritorio.

2. **Compresión de Imágenes en Cliente (RNF-1)**:
   - *Elección*: Utilidad en Canvas HTML5 (`image-compressor`) que escala y comprime imágenes al 50%-60% de calidad JPEG antes del almacenamiento.
   - *Beneficio*: Reduce el tamaño de imágenes de 4–8 MB a menos de 200–400 KB, garantizando una carga veloz y cumpliendo el requerimiento no funcional RNF-1.

3. **Capa de Persistencia Híbrida (Supabase Ready + Offline Demo)**:
   - *Elección*: Servicio `storageService` que utiliza `@supabase/supabase-js` cuando se configuran las credenciales del proyecto (URL y Anon Key) y recurre a un almacén reactivo en `localStorage` con datos de muestra realistas de una ciudad cuando no hay credenciales activas.
   - *Herramienta Adicional*: Modal con el script SQL exacto listo para copiar y pegar en el SQL Editor de Supabase (tablas `usuarios`, `reportes`, triggers, RLS y bucket de storage).

---

## 4. Arquitectura Técnica y Diagrama de Componentes

```
┌────────────────────────────────────────────────────────────────────────┐
│                        UrbanoAlert Web App                             │
├────────────────────────────────────────────────────────────────────────┤
│  Top Bar: Identidad Cívica · Selector de Rol (Ciudadano/Admin) · Auth  │
├───────────────────────────────────┬────────────────────────────────────┤
│           VISTA CIUDADANO         │          VISTA ADMINISTRADOR       │
│  ┌─────────────────────────────┐  │  ┌──────────────────────────────┐  │
│  │ Formulario Nuevo Reporte    │  │  │ Mapa Global OpenStreetMap    │  │
│  │ - GPS + Mini-Mapa Picker    │  │  │ - Pines coloreados por estado│  │
│  │ - Compresor Canvas de Fotos │  │  │ - Popups interactivos        │  │
│  │ - Título & Descripción      │  │  └──────────────────────────────┘  │
│  └─────────────────────────────┘  │  ┌──────────────────────────────┐  │
│  ┌─────────────────────────────┐  │  │ Filtros por Estado           │  │
│  │ "Mis Reportes" Historial    │  │  │ Modal Cambio de Estado       │  │
│  │ - Estado & Respuesta Admin  │  │  │ Campo "respuesta_admin"      │  │
│  └─────────────────────────────┘  │  └──────────────────────────────┘  │
├───────────────────────────────────┴────────────────────────────────────┤
│                       Capa de Estado & Servicios                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ • SupabaseClient (Auth, Database Postgres, Storage Bucket)       │  │
│  │ • DataStore (Dual: Live Supabase / Local Demo Seed Data)         │  │
│  │ • ImageCompressor (Canvas JPEG 50-60%)                           │  │
│  │ • GeoLocationService (Browser Geolocation API + Nominatim/OSM)   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Modelo de Datos (PostgreSQL / Supabase)
- **usuarios**: `id (UUID)`, `nombre`, `email`, `rol ('ciudadano' | 'admin')`, `fecha_registro`
- **reportes**: `id (UUID)`, `usuario_id`, `titulo`, `descripcion`, `latitud (NUMERIC)`, `longitud (NUMERIC)`, `foto_url`, `estado ('pendiente' | 'revisado' | 'en_proceso' | 'solucionado')`, `respuesta_admin`, `fecha_creacion`

---

## 5. Fases de Ejecución Tras la Aprobación

1. **Instalación de Dependencias**:
   - `leaflet` y `@types/leaflet` para el mapa interactivo de OpenStreetMap.
   - `@supabase/supabase-js` para la integración oficial de Supabase.
2. **Capa de Datos y Servicios**:
   - Tipos TypeScript estrictos basados en el esquema SQL del documento.
   - Servicio de compresión de imágenes en Canvas (50-60% JPEG).
   - Servicio de geolocalización e interactividad OpenStreetMap.
   - Adaptador Supabase + motor de persistencia local con datos iniciales precargados.
3. **Módulo de Autenticación & Control de Roles**:
   - Selector intuitivo entre Ciudadano y Administrador.
   - Registro e inicio de sesión persistente.
4. **Módulo Ciudadano**:
   - Captura de fotos desde cámara o archivo con previsualización y compresión.
   - Selector de ubicación en mapa OpenStreetMap o GPS en 1 clic.
   - Formulario de creación de reportes.
   - Lista "Mis Reportes" con insignias de estado y visualizador de respuesta administrativa.
5. **Módulo Administrador**:
   - Panel de control municipal con mapa OpenStreetMap interactivo en vivo.
   - Filtros de estado (`pendiente`, `revisado`, `en_proceso`, `solucionado`).
   - Modal de resolución: actualización de estado + redacción de `respuesta_admin`.
   - Asistente de configuración de Supabase con el script SQL de creación de tablas.
6. **Verificación y Compilación**:
   - Verificación de tipos TypeScript y compilación sin errores.
