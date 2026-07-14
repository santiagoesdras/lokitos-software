# API Reference - Edge Functions

## Descripción general

Las Edge Functions son funciones serverless (Deno) que procesan las operaciones críticas del sistema. Se invocan desde el frontend React mediante Supabase client.

---

## 1. register-sale

**Propósito**: Registrar una venta completa (encabezado + detalle + auditoría)

**Ubicación**: `supabase/functions/register-sale/index.ts`

### Endpoint
```
POST /functions/v1/register-sale
```

### Autenticación
- Requiere JWT válido de Supabase Auth
- Usuario debe tener rol "Vendedor" o "Administrador"

### Request

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body**:
```typescript
{
  user_id: string;              // UUID del usuario vendedor
  items: {
    producto_id: string;        // UUID del producto
    cantidad: number;           // Cantidad vendida
    precio_unitario: number;    // Precio en el momento de la venta
  }[];
  total: number;                // Total de la venta (suma de items)
  metodo_pago_id: string;       // UUID del método de pago
}
```

### Ejemplo de request
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/register-sale" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "items": [
      {
        "producto_id": "550e8400-e29b-41d4-a716-446655440001",
        "cantidad": 2,
        "precio_unitario": 50.00
      },
      {
        "producto_id": "550e8400-e29b-41d4-a716-446655440002",
        "cantidad": 1,
        "precio_unitario": 150.00
      }
    ],
    "total": 250.00,
    "metodo_pago_id": "550e8400-e29b-41d4-a716-446655440003"
  }'
```

### Response

**Éxito (200 OK)**:
```json
{
  "venta_id": "550e8400-e29b-41d4-a716-446655440100",
  "status": "success",
  "message": "Venta registrada correctamente",
  "items_count": 2,
  "total": 250.00
}
```

**Error (400 Bad Request)**:
```json
{
  "error": "Items array cannot be empty",
  "status": "error"
}
```

**Error (401 Unauthorized)**:
```json
{
  "error": "Unauthorized",
  "status": "error"
}
```

### Lógica interna

1. Valida que items no esté vacío
2. Valida que total sea mayor a 0
3. Inserta registro en tabla `ventas`
4. Inserta cada item en tabla `detalle_venta`
5. Registra operación en tabla `auditoria`
6. Retorna `venta_id` generada

### Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| Items array cannot be empty | No hay productos en la venta | Agregar al menos 1 producto |
| Invalid total | Total <= 0 | Verificar cálculo de total |
| User not found | usuario_id no existe | Verificar UUID correcto |
| RLS policy violation | Usuario no autorizado | Verificar rol en tabla `usuarios` |

---

## 2. register-expense

**Propósito**: Registrar un gasto (operacional, compras, etc.)

**Ubicación**: `supabase/functions/register-expense/index.ts`

### Endpoint
```
POST /functions/v1/register-expense
```

### Autenticación
- Requiere JWT válido
- Usuario debe tener rol "Vendedor" o "Administrador"

### Request

**Body**:
```typescript
{
  usuario_id: string;           // UUID del usuario que registra el gasto
  titulo: string;               // Descripción del gasto (ej: "Compra de refresco")
  monto: number;                // Monto en pesos (ej: 500.00)
  comentario?: string;          // Comentario adicional (opcional)
}
```

### Ejemplo
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/register-expense" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": "550e8400-e29b-41d4-a716-446655440000",
    "titulo": "Compra de jarabe para bebidas",
    "monto": 500.00,
    "comentario": "Proveedor Juan González"
  }'
```

### Response

**Éxito (200 OK)**:
```json
{
  "gasto_id": "550e8400-e29b-41d4-a716-446655440200",
  "status": "success",
  "message": "Gasto registrado correctamente",
  "titulo": "Compra de jarabe para bebidas",
  "monto": 500.00
}
```

**Error (400 Bad Request)**:
```json
{
  "error": "Monto must be greater than 0",
  "status": "error"
}
```

### Validaciones

- `titulo`: No vacío, máx 200 caracteres
- `monto`: Mayor a 0, máx 2 decimales
- `usuario_id`: UUID válido, existe en tabla `usuarios`

### Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| Monto must be greater than 0 | Monto es 0 o negativo | Ingresar monto válido |
| Titulo is required | Título vacío | Escribir descripción |
| Invalid UUID | usuario_id no es UUID | Verificar formato UUID |

---

## 3. get-reports

**Propósito**: Generar reportes de ventas y gastos en rango de fechas

**Ubicación**: `supabase/functions/get-reports/index.ts`

### Endpoint
```
POST /functions/v1/get-reports
```

### Autenticación
- Requiere JWT válido
- Usuario debe tener rol "Administrador"

### Request

**Body**:
```typescript
{
  from?: string;    // Fecha inicio (ISO 8601, ej: "2025-01-15T00:00:00Z")
                    // Default: Hoy a las 00:00
  to?: string;      // Fecha fin (ISO 8601, ej: "2025-01-15T23:59:59Z")
                    // Default: Ahora (now())
}
```

### Ejemplo

**Hoy**:
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/get-reports" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Rango personalizado**:
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/get-reports" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "2025-01-01T00:00:00Z",
    "to": "2025-01-31T23:59:59Z"
  }'
```

### Response

**Éxito (200 OK)**:
```json
{
  "status": "success",
  "data": {
    "periodo": {
      "from": "2025-01-15T00:00:00Z",
      "to": "2025-01-15T23:59:59Z"
    },
    "resumen": {
      "totalVendido": 2500.00,
      "cantidadVentas": 12,
      "totalGastos": 800.00,
      "utilidadEstim": 1700.00
    },
    "metodos_pago": [
      {
        "metodo": "Efectivo",
        "cantidad": 8,
        "monto": 1500.00
      },
      {
        "metodo": "Tarjeta Débito",
        "cantidad": 4,
        "monto": 1000.00
      }
    ],
    "productos_top": [
      {
        "nombre": "Café",
        "cantidad": 25,
        "monto": 1250.00
      },
      {
        "nombre": "Sándwich",
        "cantidad": 10,
        "monto": 1500.00
      }
    ],
    "gastos_detalle": [
      {
        "titulo": "Compra de café",
        "monto": 500.00,
        "fecha": "2025-01-15T10:30:00Z"
      },
      {
        "titulo": "Gasolina",
        "monto": 300.00,
        "fecha": "2025-01-15T15:45:00Z"
      }
    ]
  }
}
```

**Error (403 Forbidden)** - No es Administrador:
```json
{
  "error": "Only administrators can access reports",
  "status": "error"
}
```

### Campos del reporte

| Campo | Tipo | Descripción |
|-------|------|-----------|
| `totalVendido` | number | Suma de todas las ventas en el período |
| `cantidadVentas` | number | Cantidad de transacciones |
| `totalGastos` | number | Suma de todos los gastos |
| `utilidadEstim` | number | totalVendido - totalGastos |
| `metodos_pago` | array | Desglose de ventas por método de pago |
| `productos_top` | array | Productos más vendidos (ordenados por monto) |
| `gastos_detalle` | array | Lista de gastos con fecha |

---

## Uso desde React

### Ejemplo: Llamar register-sale desde Ventas.jsx

```javascript
import { supabase } from '../lib/supabase'

async function handleCheckout(cartItems, totalAmount, paymentMethodId) {
  try {
    const { data, error } = await supabase.functions.invoke('register-sale', {
      body: {
        user_id: userProfile.id,
        items: cartItems.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio
        })),
        total: totalAmount,
        metodo_pago_id: paymentMethodId
      }
    })

    if (error) throw error
    
    console.log('Venta registrada:', data.venta_id)
    // Limpiar carrito, mostrar confirmación, etc.
  } catch (err) {
    console.error('Error en venta:', err.message)
  }
}
```

### Ejemplo: Llamar get-reports desde Reportes.jsx

```javascript
async function generateReport(fromDate, toDate) {
  try {
    const { data, error } = await supabase.functions.invoke('get-reports', {
      body: {
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      }
    })

    if (error) throw error
    
    console.log('Reporte:', data)
    setReportData(data.data)
  } catch (err) {
    console.error('Error generando reporte:', err.message)
  }
}
```

---

## Troubleshooting

### "Function not found"
- Verificar que Edge Function está desplegada: `supabase functions list`
- Verificar que nombre es correcto (minúsculas)

### "Unauthorized"
- Verificar que JWT es válido
- Verificar que usuario existe en `usuarios`
- Verificar que usuario tiene rol asignado

### "Internal Server Error (500)"
- Ver logs: `supabase functions logs [nombre-funcion]`
- Verificar sintaxis TypeScript
- Verificar permisos de base de datos

### "Request timeout"
- Función tarda más de 60 segundos
- Optimizar queries de base de datos
- Agregar índices si es necesario

---

## Documentación adicional

- [Supabase Functions docs](https://supabase.com/docs/guides/functions)
- [Edge Functions TypeScript examples](https://supabase.com/docs/guides/functions/typescript-support)
- [RLS policies](./RLS_AUDIT_SETUP.md)
