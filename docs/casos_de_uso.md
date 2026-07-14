# Casos de Uso - Sistema POS

Fecha: 2026-07-09

Este documento describe los casos de uso principales para los actores `Vendedor` y `Administrador`. Cada caso de uso incluye actor, precondición, flujo principal, flujos alternos y postcondición.

## Convenciones
- `Usuario`: cuenta autenticada en el sistema.
- `Vendedor`: usuario con rol `Vendedor`.
- `Administrador`: usuario con rol `Administrador`.

---

### CU-01 Iniciar sesión
- Actor: Usuario (Vendedor o Administrador)
- Precondición: El usuario está registrado y activo.
- Flujo principal:
  1. Usuario abre la aplicación y accede a la pantalla de login.
 2. Ingresa correo/usuario y contraseña.
 3. El sistema valida credenciales vía Supabase Auth.
 4. Si es válido, el sistema crea una sesión válida por 12 horas y redirige según rol (pantalla ventas para vendedor, dashboard para admin).
- Flujos alternos:
  - 3a. Credenciales inválidas: mostrar mensaje de error y ofrecer reintento.
  - 3b. Cuenta inactiva: informar y solicitar contacto con administrador.
- Postcondición: Usuario autenticado con sesión activa durante 12 horas.

---

### CU-02 Buscar producto
- Actor: Vendedor
- Precondición: Usuario autenticado y en la pantalla de ventas.
- Flujo principal:
  1. Vendedor usa la barra de búsqueda o filtros por categoría.
  2. El sistema realiza consulta (Edge Function) y muestra resultados coincidentes con nombre, precio e imagen.
  3. Vendedor selecciona producto para agregar al carrito o ver detalles.
- Flujos alternos:
  - 2a. No hay coincidencias: mostrar "Producto no encontrado" y sugerir crear nuevo (solo admin).
- Postcondición: Lista de productos filtrada y opcional selección agregada al carrito.

---

### CU-03 Agregar producto al carrito
- Actor: Vendedor
- Precondición: Producto visible en catalogo y usuario autenticado.
- Flujo principal:
  1. Vendedor selecciona producto y pulsa "Agregar".
  2. El sistema añade el producto al carrito con cantidad por defecto 1 y calcula subtotal.
  3. Mostrar total acumulado del carrito.
- Flujos alternos:
  - 1a. Producto inactivo: mostrar aviso y no permitir agregar.
- Postcondición: Producto incluido en el carrito del vendedor en la sesión actual.

---

### CU-04 Modificar cantidad
- Actor: Vendedor
- Precondición: Producto presente en el carrito.
- Flujo principal:
  1. Vendedor incrementa o decrementa la cantidad de un item en el carrito.
  2. El sistema valida cantidad (>=1) y actualiza subtotal y total.
  3. Mostrar total actualizado.
- Flujos alternos:
  - 1a. Si la cantidad se reduce a 0, confirmar eliminación del item.
- Postcondición: Cantidad actualizada en el carrito.

---

### CU-05 Eliminar producto del carrito
- Actor: Vendedor
- Precondición: Producto presente en el carrito.
- Flujo principal:
  1. Vendedor pulsa "Eliminar" en un item.
  2. El sistema solicita confirmación.
  3. Tras confirmar, el sistema elimina el item y actualiza el total.
- Postcondición: Item removido del carrito.

---

### CU-06 Seleccionar método de pago
- Actor: Vendedor
- Precondición: Carrito con al menos un item.
- Flujo principal:
  1. Vendedor pulsa "Pagar" o "Finalizar venta".
  2. El sistema muestra opciones: Efectivo, Tarjeta, Transferencia.
  3. Vendedor selecciona método y confirma.
- Flujos alternos:
  - 2a. Método de pago no disponible (p.ej. integración externa caída): permitir marcar como pendiente o seleccionar otra opción.
- Postcondición: Método de pago seleccionado para la venta.

---

### CU-07 Confirmar venta
- Actor: Vendedor
- Precondición: Carrito con items y método de pago seleccionado.
- Flujo principal:
  1. Vendedor confirma la venta.
  2. El sistema ejecuta una Edge Function que:
     - Valida stock y estado de productos (si aplica).
     - Crea registro en `ventas` con fecha/hora, usuario, total y método de pago.
     - Crea registros en `detalle_venta` por cada item (producto, cantidad, precio_unitario).
     - Registra auditoría de la operación.
  3. El sistema muestra pantalla de confirmación con recibo y reinicia carrito.
- Flujos alternos:
  - 2a. Error al guardar (fallo DB): mostrar error y mantener carrito para reintento.
  - 2b. Producto inactivo durante operación: informar al vendedor y permitir ajustar carrito.
- Postcondición: Venta registrada y carrito vacío.

---

### CU-08 Registrar gasto
- Actor: Vendedor o Administrador
- Precondición: Usuario autenticado.
- Flujo principal:
  1. Usuario abre formulario de gasto.
  2. Ingresa título, monto, comentario (opcional) y confirma.
  3. El sistema crea registro en `gastos` con usuario y fecha/hora y registra auditoría.
  4. Mostrar confirmación y listado actualizado de gastos del día.
- Flujos alternos:
  - 2a. Monto inválido: mostrar validación y pedir corrección.
- Postcondición: Gasto registrado en la base de datos.

---

### CU-09 Cerrar sesión
- Actor: Vendedor o Administrador
- Precondición: Usuario autenticado.
- Flujo principal:
  1. Usuario selecciona "Cerrar sesión".
  2. El sistema invalida la sesión y redirige a la pantalla de login.
- Postcondición: Sesión del usuario terminada.

---

### CU-10 Crear usuario
- Actor: Administrador
- Precondición: Administrador autenticado.
- Flujo principal:
  1. Administrador abre formulario de creación de usuario.
  2. Ingresa datos: nombre, email, rol, estado (activo/inactivo) y define contraseña temporal o envía enlace de registro.
  3. El sistema crea el usuario en `usuarios` (Auth en Supabase + tabla `usuarios`) y registra auditoría.
  4. Enviar notificación o instrucción para establecer contraseña.
- Flujos alternos:
  - 2a. Email ya en uso: rechazar y solicitar otro email.
- Postcondición: Usuario creado y activo o pendiente según flujo.

---

### CU-11 Modificar usuario
- Actor: Administrador
- Precondición: Administrador autenticado y usuario objetivo existente.
- Flujo principal:
  1. Administrador carga la ficha del usuario.
  2. Modifica campos permitidos (nombre, rol, estado) y guarda.
  3. El sistema actualiza registro y guarda auditoría con datos previos y nuevos.
- Postcondición: Usuario actualizado.

---

### CU-12 Restablecer contraseña
- Actor: Administrador
- Precondición: Administrador autenticado.
- Flujo principal:
  1. Administrador solicita restablecer contraseña para un usuario.
  2. El sistema envía enlace de restablecimiento o establece contraseña temporal (según políticas) y registra auditoría.
- Flujos alternos:
  - 2a. Usuario inactivo: confirmar acción antes de restablecer.
- Postcondición: Usuario recibe medio para restablecer contraseña.

---

### CU-13 Desactivar usuario
- Actor: Administrador
- Precondición: Administrador autenticado y usuario existente.
- Flujo principal:
  1. Administrador marca usuario como `activo = false`.
  2. El sistema registra la acción en `auditoria` y evita futuros inicios de sesión.
- Postcondición: Usuario desactivado y no puede iniciar sesión.

---

### CU-14 Crear producto
- Actor: Administrador
- Precondición: Administrador autenticado.
- Flujo principal:
  1. Administrador abre formulario de producto y completa nombre, descripción, precio, categoría y carga imagen (opcional).
  2. El sistema almacena la imagen en Supabase Storage, guarda ruta en `productos` y registra auditoría.
- Flujos alternos:
  - 1a. Categoría inexistente: ofrecer crear nueva categoría.
- Postcondición: Producto creado y disponible (si `activo=true`).

---

### CU-15 Editar producto
- Actor: Administrador
- Precondición: Administrador autenticado y producto existente.
- Flujo principal:
  1. Administrador modifica campos (nombre, precio, categoría, imagen) y guarda.
  2. El sistema actualiza `productos`, maneja reemplazo de imagen en Storage y registra auditoría con datos previos y nuevos.
- Postcondición: Producto actualizado.

---

### CU-16 Desactivar producto
- Actor: Administrador
- Precondición: Producto existente.
- Flujo principal:
  1. Administrador marca `activo=false` para el producto.
  2. El sistema evita que aparezca en búsquedas y ventas (a no ser que se requiera histórico) y registra auditoría.
- Postcondición: Producto inactivo.

---

### CU-17 Crear categoría
- Actor: Administrador
- Precondición: Administrador autenticado.
- Flujo principal:
  1. Administrador crea nueva categoría con nombre y estado activo.
  2. El sistema guarda en `categorias` y registra auditoría.
- Postcondición: Categoría disponible para asignar a productos.

---

### CU-18 Editar categoría
- Actor: Administrador
- Precondición: Categoría existente.
- Flujo principal:
  1. Administrador edita el nombre y guarda.
  2. El sistema actualiza `categorias` y registra auditoría.
- Postcondición: Nombre de categoría actualizado.

---

### CU-19 Desactivar categoría
- Actor: Administrador
- Precondición: Categoría existente.
- Flujo principal:
  1. Administrador marca `activo=false` para la categoría.
  2. El sistema evita su visibilidad en nuevas asignaciones y registra auditoría.
- Postcondición: Categoría inactiva.

---

### CU-20 Consultar reportes (ventas)
- Actor: Administrador
- Precondición: Administrador autenticado.
- Flujo principal:
  1. Administrador selecciona rango (día, semana, mes o personalizado).
  2. El sistema consulta datos agregados (via Edge Functions) y muestra: total vendido, total de gastos, utilidad estimada, cantidad de ventas, métodos de pago y productos más vendidos.
- Flujos alternos:
  - 2a. Rango sin datos: mostrar mensaje y permitir exportar vacío.
- Postcondición: Reporte mostrado y opcional exportación (CSV/PDF).

---

### CU-21 Consultar dashboard
- Actor: Administrador
- Precondición: Administrador autenticado.
- Flujo principal:
  1. Administrador abre el dashboard.
  2. El sistema muestra KPIs: ventas del día, gastos del día, utilidad, productos top y reparto por método de pago (datos agregados en tiempo real o con pequeña latencia).
- Postcondición: Dashboard visible con KPIs actualizados.

---

### CU-22 Administrar fotografías
- Actor: Administrador
- Precondición: Administrador autenticado.
- Flujo principal:
  1. Administrador sube o reemplaza la foto de un producto.
  2. El sistema sube la imagen a Supabase Storage, actualiza `imagen_path` y registra auditoría.
- Flujos alternos:
  - 2a. Imagen inválida o demasiado grande: rechazar y mostrar restricciones (formatos permitidos y tamaño máximo).
- Postcondición: Fotografía actualizada en el producto.

---

## Notas sobre auditoría
- Todas las acciones que crean, editan o desactivan entidades críticas (usuarios, productos, precios, ventas y gastos) deben registrar entradas en `auditoria` indicando: entidad, entidad_id, acción, usuario_id, datos_previos, datos_nuevos y fecha_hora.

## Criterios de aceptación por caso
- Cada caso de uso debe estar cubierto por pruebas manuales/automatizadas que verifiquen el flujo principal y al menos los flujos alternos críticos (credenciales inválidas, errores de persistencia, validaciones de campo).
