# Modelo Entidad-Relación (ER)

Fecha: 2026-07-09

Este documento describe el modelo entidad-relación mínimo para el sistema POS.

## Tablas principales y atributos

- usuarios: id (PK), email, nombre, role_id (FK), activo, creado_en, actualizado_en
- roles: id (PK), nombre
- categorias: id (PK), nombre, activo, creado_en, actualizado_en
- productos: id (PK), nombre, descripcion, precio, categoria_id (FK), imagen_path, activo, creado_en, actualizado_en
- ventas: id (PK), usuario_id (FK), total, metodo_pago_id (FK), fecha_hora, creado_en
- detalle_venta: id (PK), venta_id (FK), producto_id (FK), cantidad, precio_unitario
- gastos: id (PK), titulo, monto, comentario, usuario_id (FK), fecha_hora, creado_en
- metodos_pago: id (PK), nombre
- auditoria: id (PK), entidad, entidad_id, accion, usuario_id (FK), datos_previos, datos_nuevos, fecha_hora

## Relaciones clave
- `usuarios.role_id` -> `roles.id`
- `productos.categoria_id` -> `categorias.id`
- `ventas.usuario_id` -> `usuarios.id`
- `ventas.metodo_pago_id` -> `metodos_pago.id`
- `detalle_venta.venta_id` -> `ventas.id`
- `detalle_venta.producto_id` -> `productos.id`
- `gastos.usuario_id` -> `usuarios.id`
- `auditoria.usuario_id` -> `usuarios.id`

## Reglas y consideraciones
- No eliminar físicamente: usar `activo` parasoft-delete.
- Auditoría: registrar cambios críticos en `auditoria`.
- RLS: aplicar políticas por rol (vendedor solo puede crear ventas/gastos; administrador puede CRUD completo).

## Diagrama ER (Mermaid)

```mermaid
erDiagram
    ROLES ||--o{ USUARIOS : tiene
    USUARIOS ||--o{ VENTAS : realiza
    USUARIOS ||--o{ GASTOS : registra
    METODOS_PAGO ||--o{ VENTAS : usado_en
    CATEGORIAS ||--o{ PRODUCTOS : contiene
    PRODUCTOS ||--o{ DETALLE_VENTA : es_parte_de
    VENTAS ||--o{ DETALLE_VENTA : contiene
    USUARIOS ||--o{ AUDITORIA : realiza

    ROLES {
      int id PK
      string nombre
    }
    USUARIOS {
      int id PK
      string email
      string nombre
      int role_id FK
      boolean activo
      timestamp creado_en
      timestamp actualizado_en
    }
    CATEGORIAS {
      int id PK
      string nombre
      boolean activo
      timestamp creado_en
      timestamp actualizado_en
    }
    PRODUCTOS {
      int id PK
      string nombre
      string descripcion
      numeric precio
      int categoria_id FK
      string imagen_path
      boolean activo
      timestamp creado_en
      timestamp actualizado_en
    }
    METODOS_PAGO {
      int id PK
      string nombre
    }
    VENTAS {
      int id PK
      int usuario_id FK
      numeric total
      int metodo_pago_id FK
      timestamp fecha_hora
      timestamp creado_en
    }
    DETALLE_VENTA {
      int id PK
      int venta_id FK
      int producto_id FK
      int cantidad
      numeric precio_unitario
    }
    GASTOS {
      int id PK
      string titulo
      numeric monto
      string comentario
      int usuario_id FK
      timestamp fecha_hora
      timestamp creado_en
    }
    AUDITORIA {
      int id PK
      string entidad
      int entidad_id
      string accion
      int usuario_id FK
      json datos_previos
      json datos_nuevos
      timestamp fecha_hora
    }
```

## Siguientes pasos
- Generar el script SQL de creación de las tablas con índices, restricciones FK y triggers básicos para auditoría.
