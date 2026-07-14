# Mejoras Futuras - Sistema POS

## Descripción

Este documento lista posibles mejoras y features adicionales que pueden implementarse en futuras versiones del sistema POS Lokitos.

---

## 1. Gestión de Inventario

### 1.1 Stock de Productos
**Descripción**: Controlar cantidad disponible de cada producto

**Beneficio**: Prevenir sobreventa, alertas de reorden

**Implementación**:
- [ ] Agregar columna `stock` a tabla `productos`
- [ ] Restar stock en cada venta (trigger)
- [ ] Vista de alertas de bajo stock
- [ ] Movimientos de inventario (entrada/salida manual)
- [ ] Reporte de productos agotados

**Estimación**: 8-10 horas

---

### 1.2 Entrada de Mercancía
**Descripción**: Registrar compras a proveedores

**Columnas BD**:
```sql
CREATE TABLE entradas_inventario (
  id UUID PRIMARY KEY,
  producto_id UUID REFERENCES productos,
  cantidad INT,
  proveedor_id UUID REFERENCES proveedores,
  costo_unitario DECIMAL,
  fecha_hora TIMESTAMP,
  usuario_id UUID REFERENCES usuarios
)
```

---

## 2. Multi-sucursal

### 2.1 Gestión de Sucursales
**Descripción**: Soportar múltiples ubicaciones/negocios

**Tablas BD**:
```sql
CREATE TABLE sucursales (
  id UUID PRIMARY KEY,
  nombre VARCHAR,
  ciudad VARCHAR,
  direccion TEXT
)

-- Agregar sucursal_id a: usuarios, ventas, gastos, productos
```

**Impacto**: Ajustar RLS, reportes por sucursal

**Estimación**: 15-20 horas

---

### 2.2 Dashboard Multi-sucursal
**Descripción**: Reportes consolidados de todas las sucursales

**Vistas**:
- Total vendido (todas las sucursales)
- Desglose por sucursal
- Comparativa sucursal 1 vs sucursal 2

---

## 3. Recibos y Ticketing

### 3.1 Generación de Recibos
**Descripción**: Imprimir/PDF de recibo de venta

**Features**:
- Encabezado con datos empresa
- Número de venta correlativo
- Detalle de productos
- Total por método de pago
- Código QR (opcional)

**Implementación**:
- [ ] Usar librería `react-to-print` o `html2pdf`
- [ ] Crear componente Receipt
- [ ] Endpoint de Edge Function para generar PDF

**Estimación**: 6-8 horas

---

### 3.2 Impresora Térmica
**Descripción**: Soporte para impresoras de 58mm (tickets)

**Librerías**:
- `escapepos` (TypeScript para protocolo thermal)
- Conexión vía WiFi/USB

**Estimación**: 10-12 horas

---

## 4. Métodos de Pago Avanzados

### 4.1 Integración Mercado Pago
**Descripción**: Procesar pagos con tarjeta

**Features**:
- Checkout embebido
- Webhooks de confirmación
- Reconciliación automática

**Estimación**: 15-20 horas

---

### 4.2 QR Payments
**Descripción**: Pago mediante códigos QR (Yape, Plin, etc.)

**Pasos**:
1. Generar QR con monto
2. Esperar confirmación
3. Registrar transacción

---

## 5. Reportes Avanzados

### 5.1 Exportar a Excel
**Descripción**: Reportes en formato XLSX

**Librerías**:
- `xlsx` o `exceljs`

**Features**:
- Gráficos
- Múltiples pestañas (resumen, detalle, productos top)

**Estimación**: 4-6 horas

---

### 5.2 Gráficos Interactivos
**Descripción**: Visualización de datos

**Librerías**:
- `recharts` o `chart.js`

**Gráficos**:
- Ventas por día (línea)
- Productos más vendidos (barras)
- Métodos de pago (pie/donut)
- Gastos vs Ingresos (área)

**Estimación**: 8-10 horas

---

### 5.3 Reportes por Email
**Descripción**: Enviar resumen diario automáticamente

**Implementación**:
- Usar Supabase `pg_cron` (scheduler)
- Llamar Edge Function cada 18:00
- Enviar email con resumen

**Estimación**: 6-8 horas

---

## 6. Usuarios y Permisos

### 6.1 Roles Granulares
**Descripción**: Más control sobre permisos

**Roles propuestos**:
- Administrador (acceso total)
- Gerente (reportes, no editar productos)
- Vendedor (solo ventas)
- Contador (solo reportes)
- Repartidor (visible solo en móvil)

**Implementación**:
- Tabla de permisos por rol
- RLS más granular

**Estimación**: 12-15 horas

---

### 6.2 Auditoría Mejorada
**Descripción**: Logs más detallados

**Fields adicionales**:
- IP del usuario
- User agent
- Diferencias antes/después (diff)
- Acciones correlacionadas

---

## 7. Punto de Venta Mobile

### 7.1 App React Native
**Descripción**: Aplicación nativa para Android/iOS

**Stack**:
- React Native
- Expo
- NativeWind (Tailwind para React Native)
- Supabase JS client

**Features core**:
- Venta rápida (igual que web)
- Offline mode con sincronización
- Escaneo de código de barras

**Estimación**: 30-40 horas (MVP)

---

### 7.2 Cámara para Fotos de Productos
**Descripción**: Tomar fotos con cámara del teléfono

**Librerías**:
- `react-native-camera` o `expo-camera`

---

## 8. Códigos de Barras

### 8.1 Lectura de Códigos
**Descripción**: Escanear barcode con cámara/lector

**Librerías**:
- `quagga.js` (navegador)
- `react-barcode-reader`

**Features**:
- Buscar producto automáticamente
- Agregar al carrito con cantidad 1
- Lectura múltiple rápida

**Estimación**: 8-10 horas

---

### 8.2 Generación de Códigos
**Descripción**: Imprimir etiquetas con códigos

**Flujo**:
1. Seleccionar productos
2. Generar PDF con códigos
3. Imprimir etiquetas

**Librerías**:
- `jsbarcode`

---

## 9. Mensajería y Notificaciones

### 9.1 WhatsApp Integration
**Descripción**: Enviar confirmaciones por WhatsApp

**Implementación**:
- API Twilio o similar
- Trigger: Venta completada
- Mensaje: "Compra #123 realizada por $50.00"

**Estimación**: 10-12 horas

---

### 9.2 Push Notifications
**Descripción**: Notificaciones en la app

**Casos de uso**:
- Bajo stock
- Nueva venta registrada
- Cierre de turno

**Librerías**:
- `firebase-messaging` (FCM)

---

## 10. Sistema de Promociones

### 10.1 Descuentos
**Descripción**: Aplicar descuentos en productos

**Tipos**:
- Porcentaje (20% off)
- Monto fijo ($10 off)
- Por cantidad (Compra 3, paga 2)
- Por método de pago (5% con Efectivo)

**Tabla BD**:
```sql
CREATE TABLE promociones (
  id UUID,
  nombre VARCHAR,
  tipo VARCHAR, -- 'percentage', 'fixed', 'quantity'
  valor DECIMAL,
  fecha_inicio DATE,
  fecha_fin DATE,
  activa BOOLEAN
)

CREATE TABLE promocion_productos (
  promocion_id UUID,
  producto_id UUID
)
```

**Estimación**: 12-15 horas

---

### 10.2 Cupones
**Descripción**: Códigos de descuento únicos

**Tabla**:
```sql
CREATE TABLE cupones (
  id UUID,
  codigo VARCHAR UNIQUE,
  descuento DECIMAL,
  usos_maximos INT,
  usos_realizados INT,
  valido_hasta DATE
)
```

---

## 11. Clientes y CRM

### 11.1 Base de Clientes
**Descripción**: Registrar y trackear clientes

**Tabla**:
```sql
CREATE TABLE clientes (
  id UUID PRIMARY KEY,
  nombre VARCHAR,
  email VARCHAR,
  telefono VARCHAR,
  direccion TEXT,
  fecha_registro TIMESTAMP,
  total_gastado DECIMAL
)

-- Agregar cliente_id a ventas
```

**Features**:
- Historial de compras
- Total gastado
- Última compra

---

### 11.2 Programa de Lealtad
**Descripción**: Puntos o cashback

**Tabla**:
```sql
CREATE TABLE puntos_cliente (
  cliente_id UUID,
  puntos INT,
  fecha_actualizacion TIMESTAMP
)
```

**Lógica**:
- 1 punto por cada $10 gastados
- 100 puntos = $5 descuento

---

## 12. Administración de Gastos

### 12.1 Categorías de Gastos
**Descripción**: Clasificar gastos

**Categorías**:
- Compras (mercancía)
- Servicios (luz, agua)
- Personal (salarios)
- Mantenimiento
- Otros

**Tabla**:
```sql
CREATE TABLE categoria_gastos (
  id UUID,
  nombre VARCHAR
)

-- Agregar categoria_gasto_id a gastos
```

---

### 12.2 Presupuestos
**Descripción**: Alertas cuando se excede presupuesto

**Tabla**:
```sql
CREATE TABLE presupuestos (
  id UUID,
  categoria VARCHAR,
  monto_mensual DECIMAL,
  mes INT,
  ano INT
)
```

---

## 13. Turnos y Cierre de Caja

### 13.1 Gestión de Turnos
**Descripción**: Registrar inicio/fin de turno

**Tabla**:
```sql
CREATE TABLE turnos (
  id UUID,
  usuario_id UUID,
  fecha DATE,
  hora_inicio TIME,
  hora_fin TIME,
  efectivo_inicial DECIMAL,
  efectivo_final DECIMAL,
  diferencia DECIMAL
)
```

---

### 13.2 Cierre de Caja
**Descripción**: Reconciliación de efectivo

**Proceso**:
1. Listar todas las ventas del día
2. Ingresar efectivo contado
3. Comparar con sistema
4. Reportar diferencias

---

## 14. Configuración Avanzada

### 14.1 Configuración por Empresa
**Descripción**: Personalizables según negocio

**Settings**:
- Nombre empresa
- Logo
- RUC
- Dirección
- Teléfono
- Email
- Moneda ($ vs S/)

**Tabla**:
```sql
CREATE TABLE configuracion (
  clave VARCHAR PRIMARY KEY,
  valor VARCHAR
)
```

---

### 14.2 Plantillas de Recibo
**Descripción**: Diseño personalizable

**Opciones**:
- Ancho (80mm vs 58mm)
- Datos a mostrar
- Pie de página
- Mensajes promocionales

---

## 15. Seguridad y Compliance

### 15.1 Two-Factor Authentication (2FA)
**Descripción**: Autenticación adicional

**Métodos**:
- TOTP (Google Authenticator)
- SMS OTP

**Implementación**:
- Usar librería `speakeasy` o `authenticator`

---

### 15.2 Encriptación de Datos Sensibles
**Descripción**: Encriptar números de tarjeta, etc.

**Librerías**:
- `crypto-js`

---

### 15.3 Cumplimiento GDPR
**Descripción**: Derecho al olvido, exportación de datos

**Features**:
- Exportar datos personales de cliente
- Eliminar cliente y todos sus datos
- Consentimiento cookies

---

## Matriz de Prioridad

| Feature | Complejidad | Impacto | Prioridad |
|---------|-------------|--------|-----------|
| Stock de Productos | Media | Alto | 🔴 Crítica |
| Recibos/Tickets | Baja | Alto | 🔴 Crítica |
| Reportes en Excel | Baja | Alto | 🟠 Alta |
| Gráficos | Media | Medio | 🟠 Alta |
| Multi-sucursal | Alta | Medio | 🟡 Media |
| Mobile App | Muy Alta | Medio | 🟡 Media |
| Códigos de Barras | Media | Bajo | 🟡 Media |
| Promociones | Media | Bajo | 🟢 Baja |
| CRM | Media | Bajo | 🟢 Baja |

---

## Roadmap Sugerido (12 meses)

### Q1: MVP Mejorado
- Stock de productos
- Recibos/Tickets
- Exportación Excel

### Q2: Reportería Avanzada
- Gráficos interactivos
- Reportes por email
- Auditoría mejorada

### Q3: Expansión
- Multi-sucursal
- Códigos de barras
- Préstamos/Fiado

### Q4: Mobile + Integraciones
- App React Native
- WhatsApp
- Mercado Pago

---

## Próximos Pasos

1. **Priorizar**: ¿Cuál es el feature más urgente para el negocio?
2. **Estimar**: Ajustar horas según equipo disponible
3. **Planificar**: Sprints de 2 semanas
4. **Implementar**: Siguiendo buenas prácticas (tests, code review)
5. **Desplegar**: Incrementalmente a producción

---

**Contacto**: Para discutir prioridades, contactar al equipo de desarrollo.

**Fecha de última actualización**: 2025-01-15

**Próxima revisión**: 2025-04-01
