# Documento de Análisis de Requerimientos y Diseño de Datos

## 1. Descripción General del Sistema

Aplicación móvil (Flutter) apoyada en un Backend as a Service (Supabase) diseñada para la gestión descentralizada de reportes de incidencias urbanas (baches, fallas de iluminación, semáforos, etc.). El sistema permite la captura de evidencia fotográfica y geolocalización, centralizando la información para su revisión y actualización de estado por parte de una entidad administradora. Los mapas integrados en la aplicación utilizarán **OpenStreetMap** como proveedor principal para evitar costos de licenciamiento y mantener un enfoque de código abierto.

## 2. Actores del Sistema

* **Ciudadano (Usuario Estándar):** Genera los reportes, adjunta evidencia fotográfica, coordenadas y monitorea el estado de sus solicitudes.

* **Administrador:** Recibe los reportes globales, visualiza la ubicación en un mapa y gestiona el ciclo de vida del reporte (cambio de estado y respuesta oficial).

## 3. Requerimientos Funcionales (RF)

### Módulo 1: Autenticación y Gestión de Usuarios

* **RF-1.1:** El sistema debe permitir el registro de nuevos usuarios mediante correo electrónico y contraseña.

* **RF-1.2:** El sistema debe permitir el inicio de sesión (Login) validando credenciales cifradas.

* **RF-1.3:** El sistema debe asignar automáticamente el rol `ciudadano` a las nuevas cuentas registradas.

* **RF-1.4:** El sistema debe mantener la sesión activa de forma persistente en el dispositivo móvil utilizando almacenamiento local seguro.

### Módulo 2: Gestión de Reportes - Interfaz Ciudadano

* **RF-2.1:** El sistema debe capturar automáticamente las coordenadas GPS (latitud y longitud) del dispositivo al iniciar un reporte.

* **RF-2.2:** El sistema debe permitir adjuntar una única fotografía capturada desde la cámara o galería.

* **RF-2.3:** El sistema debe registrar un reporte con título (obligatorio) y descripción (opcional).

* **RF-2.4:** El sistema debe mostrar al ciudadano un historial exclusivo de los reportes creados por él mismo.

* **RF-2.5:** El sistema debe mostrar al ciudadano el `estado` actual de su reporte y la `respuesta_admin` (si existe).

### Módulo 3: Gestión de Reportes - Interfaz Administrador

* **RF-3.1:** El sistema debe mostrar al administrador una lista global de todos los reportes generados.

* **RF-3.2:** El sistema debe permitir al administrador renderizar la ubicación exacta de un reporte en un mapa interactivo provisto por **OpenStreetMap** (utilizando el paquete `flutter_map` para renderizado local).

* **RF-3.3:** El sistema debe permitir filtrar los reportes en base a su `estado`.

* **RF-3.4:** El sistema debe permitir al administrador actualizar el campo `estado` de un reporte.

* **RF-3.5:** El sistema debe permitir al administrador adjuntar una `respuesta_admin` de texto al modificar el estado.

## 4. Requerimientos No Funcionales (RNF)

* **RNF-1 (Compresión de Imagen):** La aplicación móvil debe comprimir obligatoriamente las imágenes (ej. calidad al 50-60%) antes de subirlas al Storage para optimizar recursos.

* **RNF-2 (Eficiencia de Red):** Las listas de reportes deben utilizar paginación para minimizar el consumo de datos.

* **RNF-3 (Integridad Relacional):** El sistema debe garantizar que si un usuario es eliminado, sus reportes se eliminen en cascada (`ON DELETE CASCADE`).

* **RNF-4 (Validación de Estados):** La base de datos debe rechazar cualquier transición a un estado no tipificado mediante reglas `CHECK`.

* **RNF-5 (Seguridad RLS):** Se configurarán políticas de Row Level Security para que un ciudadano solo lea sus propios reportes, mientras el admin tiene acceso global.

## 5. Arquitectura de Integración y Tecnologías Externas

| Requerimiento | Servicio / Tecnología | Comportamiento Técnico | 
| ----- | ----- | ----- | 
| **Login / Registro** | Supabase Auth | Maneja el hashing de contraseñas de forma invisible y emite el token JWT. | 
| **Almacenamiento** | Supabase Storage | Recibe la imagen desde Flutter, la almacena y devuelve la URL absoluta para insertarla en la base de datos. | 
| **CRUD de Reportes** | Supabase DB (PostgreSQL) | Recibe las sentencias SQL vía SDK de Flutter para insertar o actualizar reportes. | 
| **Geolocalización** | Supabase DB (NUMERIC) | Almacena latitud/longitud precisas en la base de datos. | 
| **Visualización de Mapas** | **OpenStreetMap** | Provee los tiles (teselas) del mapa de forma gratuita, renderizados en Flutter a través de `flutter_map` sin necesidad de API keys restrictivas. |

## 6. Diseño de Base de Datos (Esquema SQL)

El siguiente script define la estructura física en PostgreSQL, incluyendo las reglas de validación y relaciones.

```sql
-- 1. Tabla de Usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Opcional si se usa íntegramente Supabase Auth
    rol VARCHAR(20) DEFAULT 'ciudadano' CHECK (rol IN ('ciudadano', 'admin')),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Reportes
CREATE TABLE reportes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    latitud NUMERIC(10,8) NOT NULL,
    longitud NUMERIC(11,8) NOT NULL,
    foto_url VARCHAR(255) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'revisado', 'en_proceso', 'solucionado')),
    respuesta_admin TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```