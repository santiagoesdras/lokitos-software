# Documento de Requerimientos

## Proyecto
Sistema POS Web para negocio de venta de alimentos y bebidas.

## Resumen
Este documento reúne los requerimientos funcionales (RF) y no funcionales (RNF) para el desarrollo de un sistema POS web que reemplace el registro manual en hojas de cálculo. El sistema permitirá registrar ventas, gastos, administrar catálogo de productos, usuarios y generar reportes y un dashboard para el administrador.

## Alcance
- Interfaz web responsiva para vendedores y administradores.
- Backend serverless mediante Supabase Edge Functions y PostgreSQL.
- Autenticación y autorización con Supabase Auth y roles (Administrador, Vendedor).
- Almacenamiento de imágenes en Supabase Storage.
- Despliegue: Frontend en Vercel; Base de datos y Edge Functions en Supabase.

## Actores
- Administrador
- Vendedor

## Requerimientos Funcionales (RF)

RF-01 Inicio de sesión
- El sistema permitirá autenticarse mediante usuario y contraseña.
- La sesión permanecerá activa durante 12 horas.
- Requisitos de aceptación: inicio de sesión exitoso, expiración de sesión después de 12 horas.

RF-02 Roles
- Existirán dos roles: `Administrador` y `Vendedor`.

RF-03 Permisos del vendedor
- El vendedor solo podrá: iniciar venta, registrar gastos y cerrar sesión.
- No tendrá acceso a configuraciones ni reportes.

RF-04 Iniciar venta (pantalla principal)
- Mostrar productos por categorías, buscador, carrito y total acumulado.
- Cada producto mostrará nombre, precio e imagen opcional.
- El vendedor podrá agregar productos, modificar cantidades y eliminar items del carrito.

RF-05 Categorías
- Inicialmente: Bebidas, Comestibles.
- El administrador podrá crear, editar y desactivar categorías.

RF-06 Registro de venta
- Al finalizar, solicitar método de pago: Efectivo, Tarjeta, Transferencia.
- Guardar: fecha, hora, usuario, productos, cantidades, total y método de pago.

RF-07 Registro de gastos
- Usuarios podrán registrar gastos con: título, monto, comentario (opcional), usuario y fecha.

RF-08 Administración de usuarios
- El administrador podrá: crear, editar, desactivar usuarios, restablecer contraseñas y cambiar roles.
- No se eliminarán usuarios físicamente.

RF-09 Administración de productos
- El administrador podrá: crear, editar, desactivar productos; cambiar precio, fotografía y categoría.
- No se eliminarán productos físicamente.

RF-10 Administración de categorías
- El administrador podrá crear, editar nombre y desactivar categorías.

RF-11 Reportes
- Consultar ventas del día, semana, mes y rango personalizado.
- Cada reporte mostrará: total vendido, total de gastos, utilidad estimada, cantidad de ventas, distribución por métodos de pago y productos más vendidos.

RF-12 Dashboard
- Panel para administrador con: ventas del día, gastos del día, utilidad, productos top y ventas por método de pago.

## Requerimientos No Funcionales (RNF)

RNF-01 Usabilidad
- Interfaz sencilla y rápida optimizada para flujo de caja; botones grandes y búsqueda inmediata.

RNF-02 Responsividad
- Diseño responsive para computadoras y tabletas.

RNF-03 Rendimiento
- Tiempo de carga menor a 2 segundos en conexiones típicas.

RNF-04 Arquitectura
- Backend serverless con Supabase Edge Functions; todas las operaciones CRUD expuestas mediante funciones.

RNF-05 Base de datos
- PostgreSQL en Supabase; uso de Row Level Security (RLS) para control de acceso por rol.

RNF-06 Seguridad
- Autenticación con Supabase Auth; nunca exponer claves de servicio en el cliente.
- Auditoría de operaciones críticas (creación/edición/desactivación de usuarios, cambios de precios, cierre de venta).

RNF-07 Almacenamiento de imágenes
- Imágenes en Supabase Storage con política de acceso controlada.

RNF-08 Calidad del código
- Código organizado por componentes, modular y con convenciones claras en frontend (React + Vite).

RNF-09 Disponibilidad
- El sistema estará dirigido a uso interno; se apunta a alta disponibilidad según SLA de Supabase y Vercel.

RNF-10 Operación y despliegue
- Preparar scripts y documentación para despliegue en Vercel y configuración de Edge Functions en Supabase.

## Modelo de datos mínimo (lista de tablas)
- usuarios (id, email, nombre, role_id, activo, creado_en, actualizado_en)
- roles (id, nombre)
- categorias (id, nombre, activo, creado_en, actualizado_en)
- productos (id, nombre, descripcion, precio, categoria_id, imagen_path, activo, creado_en, actualizado_en)
- ventas (id, usuario_id, total, metodo_pago_id, fecha_hora, creado_en)
- detalle_venta (id, venta_id, producto_id, cantidad, precio_unitario)
- gastos (id, titulo, monto, comentario, usuario_id, fecha_hora, creado_en)
- metodos_pago (id, nombre)
- auditoria (id, entidad, entidad_id, accion, usuario_id, datos_previos, datos_nuevos, fecha_hora)

## Restricciones y consideraciones
- No realizar eliminaciones físicas; usar campo `activo` para conservar historial.
- Todas las operaciones sensibles deben ejecutarse mediante Edge Functions para no exponer credenciales.
- Preparar la base para futuras extensiones: inventario, impresión de tickets, lector de códigos de barras y multi-sucursal.

## Entregables
1. Documento de requerimientos (este archivo).
2. Casos de uso completos (por entregar).
3. Modelo entidad-relación (ER) (por entregar).
4. Script SQL para PostgreSQL (por entregar).
5. Diseño de arquitectura (Diagrama y explicación) (por entregar).
6. Mockups de la interfaz (pantalla de ventas y administración) (por entregar).
7. Estructura inicial del proyecto React + Vite + Supabase (por entregar).
8. Implementación inicial de autenticación y autorización (por entregar).

## Criterios de aceptación generales
- Todas las pantallas deben respetar roles y permisos.
- Las operaciones de creación/edición/desactivación quedan registradas en la tabla `auditoria`.
- Pruebas básicas de flujo de venta: búsqueda, agregado al carrito, cierre de venta y registro en `ventas` y `detalle_venta`.

## Suposiciones
- El negocio proporcionará acceso a una cuenta de Supabase y dominio/hosting en Vercel.
- El volumen inicial de productos es moderado (decenas a pocos cientos), sin requerimientos inmediatos de escalado horizontal complejo.

## Próximos pasos
1. Redactar casos de uso completos (actor, precondición, flujo principal, flujos alternos, postcondición).
2. Diseñar ER y generar script SQL.
3. Scaffold del proyecto React + Vite + conectores a Supabase.

---

Fecha: 2026-07-09
