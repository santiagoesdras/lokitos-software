# Guía de Testing - Sistema POS

## Descripción

Este documento describe los procedimientos de testing manual para validar todas las funcionalidades del sistema POS antes de producción.

---

## Preparación

### Requerimientos
- Servidor local corriendo: `npm run dev` (puerto 5173)
- Base de datos Supabase configurada con datos iniciales
- 2 usuarios creados: admin@lokitos.com y vendedor@lokitos.com
- Imágenes de prueba disponibles

### Usuarios de prueba
| Email | Rol | Contraseña |
|-------|-----|-----------|
| admin@lokitos.com | Administrador | (tu_contraseña) |
| vendedor@lokitos.com | Vendedor | (tu_contraseña) |

---

## 1. Testing de Autenticación

### Caso 1.1: Login exitoso
**Precondiciones**: Usuario existe en Auth y tabla `usuarios`

**Pasos**:
1. Ir a http://localhost:5173/login
2. Ingresar email: `admin@lokitos.com`
3. Ingresar contraseña correcta
4. Clic en "Ingresar"

**Resultado esperado**:
- [ ] Redirecciona a página principal (`/`)
- [ ] Header muestra "Bienvenido, Admin"
- [ ] Botón "Cerrar sesión" visible

**Prueba adicional**:
- [ ] Refrescar página (F5)
- [ ] Session persiste (no redirige a login)

---

### Caso 1.2: Login fallido - contraseña incorrecta
**Pasos**:
1. Ir a http://localhost:5173/login
2. Ingresar email: `admin@lokitos.com`
3. Ingresar contraseña incorrecta
4. Clic en "Ingresar"

**Resultado esperado**:
- [ ] Muestra mensaje de error: "Email o contraseña incorrectos"
- [ ] No redirecciona
- [ ] Permanece en página de login

---

### Caso 1.3: Logout
**Precondiciones**: Usuario autenticado

**Pasos**:
1. Clic en botón "Cerrar sesión" (en header)

**Resultado esperado**:
- [ ] Redirecciona a `/login`
- [ ] Session se limpia
- [ ] Refrescar página muestra login nuevamente

---

## 2. Testing de Autorización

### Caso 2.1: Admin accede a productos
**Precondiciones**: Logeado como admin

**Pasos**:
1. Clic en "Admin" (en header)
2. Clic en "Productos"

**Resultado esperado**:
- [ ] Accede a página `/admin/products`
- [ ] Ve tabla de productos
- [ ] Botones "Editar" y "Deactivar" visibles

---

### Caso 2.2: Vendedor NO accede a productos
**Precondiciones**: Logeado como vendedor

**Pasos**:
1. Intentar ir a http://localhost:5173/admin/products

**Resultado esperado**:
- [ ] Muestra "No autorizado"
- [ ] No puede ver tabla de productos

---

### Caso 2.3: Verificar roles en página admin
**Precondiciones**: Logeado como admin

**Pasos**:
1. Ir a `/admin`
2. Ver información mostrada

**Resultado esperado**:
- [ ] Dice "Tu rol es: Administrador"
- [ ] Muestra 3 botones: Productos, Dashboard, Reportes

---

## 3. Testing de Catálogo de Productos

### Caso 3.1: Crear producto nuevo
**Precondiciones**: Logeado como admin en `/admin/products`

**Pasos**:
1. Clic en botón "Nuevo Producto"
2. Nombre: "Jugo Natural"
3. Precio: "65.00"
4. Categoría: Seleccionar "Bebidas"
5. Descripción: "Jugo recién exprimido"
6. Subir imagen (seleccionar archivo PNG/JPG)
7. Clic en "Guardar"

**Resultado esperado**:
- [ ] Muestra confirmación: "Producto guardado"
- [ ] Producto aparece en tabla
- [ ] Imagen se ve en tabla
- [ ] Producto activo = true

**Validación en BD**:
```sql
SELECT nombre, precio, categoria_id, activo FROM productos WHERE nombre='Jugo Natural';
```
- [ ] Registro existe
- [ ] `activo` = true

---

### Caso 3.2: Editar producto existente
**Precondiciones**: Existe producto en tabla

**Pasos**:
1. En tabla productos, clic en "Editar" del primer producto
2. Cambiar precio: +10
3. Clic en "Guardar"

**Resultado esperado**:
- [ ] Precio actualiza en tabla
- [ ] Confirmación muestra "Producto actualizado"

---

### Caso 3.3: Deactivar producto
**Precondiciones**: Existe producto activo

**Pasos**:
1. Clic en "Deactivar" en tabla de productos
2. Confirmar en diálogo

**Resultado esperado**:
- [ ] Producto desaparece de tabla de productos
- [ ] En base de datos: `activo` = false
- [ ] Verificar con SQL:
```sql
SELECT * FROM productos WHERE activo=false LIMIT 5;
```

---

### Caso 3.4: Listar solo productos activos en Ventas
**Precondiciones**: Algunos productos activos, algunos inactivos

**Pasos**:
1. Ir a página principal (`/`)
2. Ver grilla de productos

**Resultado esperado**:
- [ ] Solo muestra productos con `activo = true`
- [ ] Productos deactivados NO aparecen
- [ ] Cantidad = cantidad de filas en query: `SELECT COUNT(*) FROM productos WHERE activo=true;`

---

## 4. Testing del Módulo de Ventas

### Caso 4.1: Agregar productos al carrito
**Precondiciones**: Logeado como vendedor en `/`

**Pasos**:
1. Ver grilla de productos activos
2. Agregar al carrito: 2x Café
3. Agregar al carrito: 1x Sándwich
4. Ver carrito en panel derecho

**Resultado esperado**:
- [ ] Carrito muestra 2 items
- [ ] Cantidades correctas (2, 1)
- [ ] Total se calcula: (Café * 2) + (Sándwich * 1)

---

### Caso 4.2: Actualizar cantidad en carrito
**Precondiciones**: Producto en carrito

**Pasos**:
1. En carrito, cantidad Café: cambiar de 2 a 3
2. Verificar total

**Resultado esperado**:
- [ ] Cantidad actualiza
- [ ] Total recalcula automáticamente
- [ ] Café (3 unidades) visible

---

### Caso 4.3: Remover producto del carrito
**Precondiciones**: 2+ productos en carrito

**Pasos**:
1. Clic en botón X o "Remover" en primer producto
2. Confirmar

**Resultado esperado**:
- [ ] Producto se elimina del carrito
- [ ] Total recalcula
- [ ] Cantidad de items baja

---

### Caso 4.4: Cerrar venta exitosa
**Precondiciones**: Carrito con 2+ productos

**Pasos**:
1. Seleccionar método de pago: "Efectivo"
2. Clic en "Cerrar Venta"
3. Confirmar en diálogo

**Resultado esperado**:
- [ ] Muestra: "¡Venta registrada exitosamente!"
- [ ] Carrito se limpia
- [ ] Venta se registra en BD

**Validación en BD**:
```sql
SELECT id, usuario_id, total FROM ventas ORDER BY fecha_hora DESC LIMIT 1;
```
- [ ] Nueva venta aparece
- [ ] `usuario_id` = ID del vendedor logeado
- [ ] `total` = total mostrado

**Verificar detalle:**
```sql
SELECT * FROM detalle_venta ORDER BY fecha_hora DESC LIMIT 3;
```
- [ ] Items de la venta aparecen

---

### Caso 4.5: Cerrar venta sin productos
**Precondiciones**: Carrito vacío

**Pasos**:
1. Intentar clic en "Cerrar Venta"

**Resultado esperado**:
- [ ] Botón deshabilitado o muestra error
- [ ] No permite cerrar venta vacía

---

## 5. Testing de Gastos

### Caso 5.1: Registrar gasto nuevo
**Precondiciones**: Logeado en `/gastos`

**Pasos**:
1. Título: "Compra de servilletas"
2. Monto: "200.50"
3. Comentario: "Proveedor López"
4. Clic en "Guardar Gasto"

**Resultado esperado**:
- [ ] Muestra "Gasto guardado"
- [ ] Gasto aparece en lista
- [ ] Fecha/hora actualizada

**Validación en BD**:
```sql
SELECT * FROM gastos ORDER BY fecha_hora DESC LIMIT 1;
```

---

### Caso 5.2: Listar gastos del usuario
**Precondiciones**: Vendedor tiene 3+ gastos registrados

**Pasos**:
1. Ir a `/gastos`

**Resultado esperado**:
- [ ] Muestra lista de gastos del vendedor
- [ ] Ordenados por fecha descendente
- [ ] Máximo 50 mostrados

---

### Caso 5.3: Vendedor solo ve sus gastos (RLS)
**Precondiciones**: 2 vendedores con gastos diferentes

**Pasos**:
1. Logearse como vendedor1
2. Ir a `/gastos`
3. Notar cantidad de gastos
4. Logout
5. Logearse como vendedor2
6. Ir a `/gastos`

**Resultado esperado**:
- [ ] Vendedor1 solo ve sus gastos
- [ ] Vendedor2 solo ve sus gastos
- [ ] Las listas son diferentes

---

## 6. Testing de Reportes

### Caso 6.1: Dashboard - hoy
**Precondiciones**: Logeado como admin, hay ventas/gastos de hoy

**Pasos**:
1. Ir a `/admin/dashboard`

**Resultado esperado**:
- [ ] Muestra 3 KPI: Ventas, Gastos, Utilidad
- [ ] Ventas = SUM(ventas.total) de hoy
- [ ] Gastos = SUM(gastos.monto) de hoy
- [ ] Utilidad = Ventas - Gastos

**Validación**:
```sql
SELECT 
  SUM(total) as total_vendido 
FROM ventas 
WHERE DATE(fecha_hora) = TODAY();

SELECT 
  SUM(monto) as total_gastos 
FROM gastos 
WHERE DATE(fecha_hora) = TODAY();
```

---

### Caso 6.2: Reportes - rango personalizado
**Precondiciones**: Logeado como admin en `/admin/reportes`

**Pasos**:
1. Seleccionar fecha inicio: 2025-01-01
2. Seleccionar fecha fin: 2025-01-31
3. Clic en "Generar Reportes"

**Resultado esperado**:
- [ ] Muestra resumen del mes
- [ ] Tabla de métodos de pago con cantidades
- [ ] Tabla de productos top
- [ ] Calcula utilidad estimada

---

### Caso 6.3: Reportes - hoy vs mes
**Precondiciones**: Múltiples ventas en diferentes días

**Pasos**:
1. Dashboard (hoy)
2. Ir a reportes
3. Seleccionar rango mensual
4. Comparar totales

**Resultado esperado**:
- [ ] Total del mes > Total de hoy
- [ ] Datos coherentes

---

## 7. Testing de Seguridad y RLS

### Caso 7.1: Verificar RLS en tabla productos
**Precondiciones**: Usuarios con diferentes roles

**Pasos (como Admin)**:
1. Abrir DevTools (F12)
2. Ir a Console
3. Ejecutar:
```javascript
import { supabase } from './src/lib/supabase'
const { data, count } = await supabase.from('productos').select('*', { count: 'exact' })
console.log('Total productos:', count)
```

**Pasos (como Vendedor)**:
4. Logout y login como vendedor
5. Repetir query

**Resultado esperado**:
- [ ] Admin ve todos los productos (activos e inactivos)
- [ ] Vendedor solo ve activos

---

### Caso 7.2: Verificar auditoría
**Precondiciones**: Acciones realizadas (crear, editar, eliminar)

**Pasos (como Admin)**:
1. DevTools Console:
```javascript
const { data } = await supabase.from('auditoria')
  .select('*')
  .order('fecha_hora', { ascending: false })
  .limit(10)
console.log(data)
```

**Resultado esperado**:
- [ ] Registra INSERT (crear producto)
- [ ] Registra UPDATE (editar precio)
- [ ] Registra DELETE (deactivar)
- [ ] `usuario_id` = ID del usuario que hizo acción

---

### Caso 7.3: Intentar acceso directo a tabla sin RLS
**Pasos**:
1. DevTools Console (logeado como vendedor):
```javascript
const { data, error } = await supabase.from('usuarios').select('*')
if (error) console.log('Error:', error.message)
```

**Resultado esperado**:
- [ ] Error: RLS policy violation
- [ ] No puede listar todos los usuarios

---

## 8. Testing de Imágenes (Storage)

### Caso 8.1: Subir imagen de producto
**Precondiciones**: Crear nuevo producto

**Pasos**:
1. Seleccionar imagen (PNG/JPG pequeño, <2MB)
2. Guardar producto
3. Verificar en Supabase Storage

**Validación**:
- Ir a Supabase Dashboard > Storage > product-images
- [ ] Archivo aparece en lista
- [ ] URL es válida

---

### Caso 8.2: Imagen se muestra en tabla
**Precondiciones**: Producto con imagen guardada

**Pasos**:
1. Ir a `/admin/products`
2. Ver tabla

**Resultado esperado**:
- [ ] Imagen visible en columna
- [ ] No hay errores en console

---

## 9. Testing de Performance

### Caso 9.1: Tiempo de carga inicial
**Pasos**:
1. DevTools > Lighthouse
2. Run Lighthouse (Desktop)

**Resultado esperado**:
- [ ] Performance > 75
- [ ] First Contentful Paint < 3s

---

### Caso 9.2: Operación de venta rápida
**Pasos**:
1. Agregar 5 productos
2. Cerrar venta
3. Medir tiempo

**Resultado esperado**:
- [ ] Cerrar venta < 2 segundos
- [ ] Confirmación inmediata

---

## 10. Testing Edge Cases

### Caso 10.1: Cantidad = 0
**Pasos**:
1. En carrito, cambiar cantidad a 0
2. Intentar actualizar

**Resultado esperado**:
- [ ] Producto se elimina del carrito
- [ ] O muestra error

---

### Caso 10.2: Monto de gasto = 0
**Pasos**:
1. Registrar gasto con monto 0

**Resultado esperado**:
- [ ] Muestra error
- [ ] No guarda

---

### Caso 10.3: Producto sin stock
**Precondiciones**: Inventario implementado (futuro)

**Pasos**:
1. Intentar vender cantidad > stock

**Resultado esperado**:
- [ ] Muestra error
- [ ] No permite vender

---

## Checklist Final

Antes de certificar como "Listo para Producción":

- [ ] Todos los tests pasados (marcar cada uno)
- [ ] No hay errores en console (F12)
- [ ] RLS funciona correctamente
- [ ] Auditoría registra todas las operaciones
- [ ] Imágenes se cargan correctamente
- [ ] Performance aceptable
- [ ] Navegación funciona en todos los navegadores
- [ ] Responsive en mobile/tablet/desktop
- [ ] Logout limpia correctamente session

---

## Navegadores testeados

- [ ] Chrome (versión: ___)
- [ ] Firefox (versión: ___)
- [ ] Safari (versión: ___)
- [ ] Edge (versión: ___)

---

**Fecha de testing**: ________________

**Tester**: ________________

**Observaciones finales**:
```
[Escribir aquí]
```

---

**Siguiente paso**: Si todo pasó, revisar [VALIDATION_CHECKLIST.md](./VALIDATION_CHECKLIST.md) pre-producción.
