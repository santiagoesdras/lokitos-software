# Arquitectura Serverless - Sistema POS

Fecha: 2026-07-09

Este documento describe la arquitectura propuesta basada en servicios serverless: Frontend desplegado en Vercel (React + Vite) y Backend gestionado por Supabase (Postgres, Auth, Storage y Edge Functions).

## Componentes principales
- Cliente (navegador en PC/Tablet): interfaz React (Vite).
- Vercel: hosting del frontend estático; CDN y entrega rápida.
- Supabase Auth: autenticación y manejo de sesiones.
- Supabase Postgres: base de datos principal con RLS.
- Supabase Storage: almacenamiento de imágenes y recursos estáticos.
- Supabase Edge Functions: lógica serverless para todas las operaciones CRUD y procesos sensibles (evitan exponer claves al cliente).
- Auditoría: tabla `auditoria` y triggers en la base de datos; Edge Functions establecerán contexto (usuario) para auditoría.

## Flujo de datos (resumen)
1. El usuario (vendedor/administrador) accede al frontend en el navegador.
2. Frontend se autentica contra Supabase Auth; obtiene JWT para llamadas.
3. Para operaciones sensibles (crear/editar/desactivar, cierre de venta, reportes) el frontend llama a Supabase Edge Functions.
4. Edge Functions validan permisos (según rol), usan claves del servidor y realizan operaciones en Postgres y Storage.
5. Postgres aplica RLS para reforzar restricciones por rol; triggers registran auditoría.
6. Frontend muestra resultados y actualiza UI en tiempo real o por polling/WS según se implemente.

## Diagrama (Mermaid)

```mermaid
flowchart LR
  Browser[Cliente - Navegador (React + Vite)] -->|Auth| SupabaseAuth[Supabase Auth]
  Browser -->|Solicita datos / acciones| Vercel[Vercel CDN/Host]
  Vercel --> Browser
  Browser -->|Llamadas API| EdgeFuncs[Supabase Edge Functions]
  EdgeFuncs -->|SQL| Postgres[Supabase PostgreSQL]
  EdgeFuncs -->|Storage API| Storage[Supabase Storage]
  Postgres -->|Triggers| Auditoria[AUDITORIA]
  Postgres -->|RLS| Postgres
  subgraph Supabase
    SupabaseAuth
    EdgeFuncs
    Postgres
    Storage
  end

  note right of EdgeFuncs
    Edge Functions ejecutan la lógica de negocio,
    validan roles, y usan las claves seguras
  end

  note left of Browser
    Interfaz optimizada para flujo de caja;
    llamadas directas a Edge Functions para seguridad.
  end
```

## Consideraciones de seguridad
- No exponer claves de servicio en el cliente: usar exclusivamente Edge Functions para operaciones sensibles.
- Usar Row Level Security (RLS) en Postgres para aplicar reglas por rol.
- Edge Functions deberán establecer variables de sesión (`set_config('app.current_user_id', ...)`) para que triggers de auditoría registren el usuario responsable.
- Habilitar HTTPS y políticas CORS restrictivas en funciones y frontend.

## High-availability y rendimiento
- Vercel ofrece CDN para recursos estáticos; supabase presta alta disponibilidad según su SLA.
- Minimizar latencia: cachear catálogos de productos (con TTL corto) y usar listados paginados.

## Operación y despliegue
- Frontend: desplegar a Vercel con variables de entorno: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Backend: desplegar Edge Functions en Supabase; mantener archivos de despliegue en `supabase/functions`.
- Base de datos: ejecutar `sql/schema.sql` en el proyecto Supabase para crear tablas, triggers y datos semilla.

## Extensiones futuras
- Integración con lectores de código de barras (hardware).
- Integración con impresoras de ticket (API o servicios externos).
- Multi-sucursal: separar datos por `sucursal_id` y ajustar RLS.

---

Archivo relacionado: [docs/er.md](er.md)
