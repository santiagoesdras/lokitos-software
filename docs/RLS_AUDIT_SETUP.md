# Configuración de RLS y Auditoría en Supabase

## Archivos relacionados
- `sql/schema.sql` - Schema base con tablas y triggers de auditoría
- `sql/rls_complete.sql` - Políticas RLS y función de auditoría mejorada

## Pasos para aplicar RLS en Supabase

### 1. Acceder a Supabase SQL Editor
- Ingresa a [Supabase Dashboard](https://supabase.com)
- Selecciona tu proyecto
- Ve a `SQL Editor`

### 2. Ejecutar schema.sql (primera vez)
- Abre `sql/schema.sql`
- Copia el contenido completo
- Pégalo en el SQL Editor de Supabase
- Ejecuta (botón Run o Ctrl+Enter)

### 3. Ejecutar rls_complete.sql
- Abre `sql/rls_complete.sql`
- Copia el contenido
- Pégalo en el SQL Editor
- Ejecuta

**IMPORTANTE:** Si hay errores sobre triggers existentes, el script maneja el DROP automático.

### 4. Crear bucket para imágenes
- Ve a Storage en Supabase Dashboard
- Crea un bucket llamado `product-images`
- Configura políticas públicas de lectura si es necesario (para CDN de imágenes)

## Políticas RLS implementadas

| Tabla | Administrador | Vendedor | Comentario |
|-------|---------------|----------|-----------|
| usuarios | CRUD completo | Lee su propio perfil | Restricción por rol |
| productos | CRUD completo | Lee solo activos | Público para lectura |
| categorias | CRUD completo | Lee solo activas | Público para lectura |
| ventas | Lee todas | Lee solo las suyas | Restringido por usuario_id |
| detalle_venta | Lee todas | Lee de sus ventas | Dependiente de ventas |
| gastos | Lee todas | Lee solo las suyas | Restringido por usuario_id |
| auditoria | Lee completa | Lee sus operaciones | Auditoría de cambios |
| metodos_pago | Lee todo | Lee todo | Público |

## Edge Functions y Auditoría

### Establecer contexto en Edge Functions
Antes de insertar/actualizar, las Edge Functions deben ejecutar:

```typescript
await sb.rpc('set_config', {
  name: 'app.current_user_id',
  value: userId,
  is_local: true
})
// O ejecutar SQL directamente:
await sb.from('_set_config').insert({ key: 'app.current_user_id', value: userId })
```

Alternativamente, en Deno/TypeScript:
```typescript
import { createClient } from '@supabase/supabase-js'
const sb = createClient(url, serviceRoleKey)
// Los triggers de auditoría registrarán usuario_id via auth.uid() o context
```

## Próximas optimizaciones

1. **Políticas adicionales**: Agregar REVOKE para operaciones DELETE si no se permite soft-delete físico.
2. **Índices RLS**: Supabase optimiza automáticamente, pero revisar consultas lentas.
3. **Pruebas de seguridad**: Usar diferentes roles (admin, vendedor) y verificar que RLS funciona.
4. **Rate limiting**: Implementar en Edge Functions para prevenir abuso.

## Validación post-implementación

Desde la aplicación React:
1. Autenticarse como Administrador
2. Intentar crear/editar producto → debe funcionar
3. Cambiar a Vendedor → no debe poder editar productos
4. Verificar que las ventas solo muestren historial personal en rol Vendedor
5. Revisar tabla `auditoria` para ver registros de cambios

## Troubleshooting

**Error: "RLS policy X violates..."**
- Verificar que el usuario tiene un rol asignado en tabla `usuarios`
- Verificar que el rol existe en tabla `roles`
- Revisar la política específica en SQL Editor

**Auditoría sin usuario registrado**
- Verificar que Edge Function ejecuta `set_config('app.current_user_id', ...)`
- Si no, el trigger usará `auth.uid()` como fallback (recomendado)

**Performance lenta**
- Agregar índices en `usuario_id`, `activo`, `fecha_hora` si es necesario
- Verificar planes WHERE en queries
