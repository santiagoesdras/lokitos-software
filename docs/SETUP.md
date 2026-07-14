# Guía de Configuración Inicial - Sistema POS

## Requisitos previos

- **Node.js**: v18.0.0 o superior
- **npm**: v9.0.0 o superior
- **Git**: Para clonar el repositorio
- **Cuenta Supabase**: [supabase.com](https://supabase.com)
- **Cuenta Vercel**: [vercel.com](https://vercel.com) (para despliegue en producción)

---

## Paso 1: Clonar el repositorio

```bash
git clone https://github.com/your-org/lokitos-pos.git
cd lokitos-pos
```

---

## Paso 2: Instalar dependencias

```bash
npm install
```

Este comando instala:
- `react` y `react-dom`: Framework UI
- `react-router-dom`: Enrutamiento del cliente
- `@supabase/supabase-js`: Cliente de Supabase
- `vite` y `@vitejs/plugin-react`: Tooling de desarrollo

---

## Paso 3: Crear proyecto en Supabase

### 3.1 Registrarse / Iniciar sesión
1. Ir a [supabase.com](https://supabase.com)
2. Crear cuenta o iniciar sesión
3. Crear nuevo proyecto

### 3.2 Obtener credenciales
1. En Supabase Dashboard, ir a `Project Settings`
2. Bajo `Configuration > API`, encontrar:
   - **URL**: `https://your-project.supabase.co`
   - **Anon Public Key**: Usar para frontend
   - **Service Role Secret**: Usar solo en backend

### 3.3 Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
cp .env.example .env.local

# Editar .env.local con las credenciales de Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Paso 4: Configurar base de datos

### 4.1 Crear tablas y estructura
1. En Supabase Dashboard, ir a `SQL Editor`
2. Ejecutar archivo `sql/schema.sql`:
   - Clic en `New Query`
   - Copiar contenido completo de `sql/schema.sql`
   - Ejecutar (botón `Run` o Ctrl+Enter)

**Esto crea:**
- Extensión `pgcrypto` para UUIDs
- 9 tablas principales
- Triggers de auditoría automática
- Datos iniciales (roles, métodos de pago)

### 4.2 Habilitar Row Level Security (RLS)
1. En SQL Editor, ejecutar archivo `sql/rls_complete.sql`
2. Esto habilita políticas de seguridad por rol

**Resultados:**
- RLS habilitado en 8 tablas
- Políticas específicas para Administrador y Vendedor
- Función de auditoría mejorada

---

## Paso 5: Crear bucket de almacenamiento

1. En Supabase Dashboard, ir a `Storage`
2. Clic en `Create new bucket`
3. Nombre: `product-images`
4. Público: Sí (para CDN de imágenes)
5. Clic en `Create bucket`

---

## Paso 6: Crear usuarios iniciales

### 6.1 Crear usuarios en Supabase Auth
1. En `Authentication > Users`, clic en `Invite`
2. Email: `admin@lokitos.com` → Enviar
3. Email: `vendedor@lokitos.com` → Enviar
4. Los usuarios recibirán emails con link de confirmación

### 6.2 Asignar roles en base de datos
1. En SQL Editor, ejecutar:

```sql
-- Obtener IDs de roles
SELECT id, nombre FROM roles;

-- Insertar usuarios en tabla usuarios
INSERT INTO usuarios (email, nombre, role_id, activo) VALUES
  ('admin@lokitos.com', 'Administrador', (SELECT id FROM roles WHERE nombre = 'Administrador'), true),
  ('vendedor@lokitos.com', 'Vendedor 1', (SELECT id FROM roles WHERE nombre = 'Vendedor'), true);
```

### 6.3 Establecer contraseña
- Acceder a admin panel de Supabase
- Establecer contraseña temporal para usuarios
- O esperar confirmación por email

---

## Paso 7: Desplegar Edge Functions

Edge Functions son funciones serverless que procesan ventas, gastos y reportes.

### 7.1 Instalar Supabase CLI
```bash
npm install -g supabase
```

### 7.2 Autenticarse
```bash
supabase login
```
- Se abrirá navegador para confirmar acceso
- Autorizar en Supabase

### 7.3 Desplegar funciones
```bash
# Reemplazar YOUR-PROJECT-REF con el project ref de tu proyecto de Supabase
supabase functions deploy register-sale --project-ref YOUR-PROJECT-REF
supabase functions deploy register-expense --project-ref YOUR-PROJECT-REF
supabase functions deploy get-reports --project-ref YOUR-PROJECT-REF
```

> El `project ref` es el identificador del proyecto en Supabase, no la URL completa. Normalmente se ve así: `dowcwcbxgwzanxhpvdso`.
> Lo puedes encontrar en la URL del proyecto: `https://<project-ref>.supabase.co`.

### 7.4 Configurar variables de entorno
En Supabase Dashboard:
1. `Project Settings > Configuration > Functions`
2. Agregar secrets:
   - `SUPABASE_URL`: tu URL de proyecto
   - `SUPABASE_SERVICE_ROLE`: tu service role key

O vía CLI:
```bash
supabase secrets set SUPABASE_SERVICE_ROLE=your-key --project-ref YOUR-PROJECT-REF
```

---

## Paso 8: Crear datos iniciales

En Supabase SQL Editor, ejecutar:

```sql
-- Categorías de productos
INSERT INTO categorias (nombre) VALUES 
  ('Bebidas'),
  ('Comestibles'),
  ('Snacks'),
  ('Postres');

-- Productos de ejemplo
INSERT INTO productos (nombre, precio, categoria_id, descripcion, activo) VALUES
  ('Agua embotellada 500ml', 25.00, 1, 'Agua purificada', true),
  ('Café americano', 50.00, 1, 'Café caliente', true),
  ('Sándwich de jamón', 150.00, 2, 'Pan, jamón, queso, lechuga', true),
  ('Papas fritas', 30.00, 3, 'Bolsa pequeña', true),
  ('Brownie', 80.00, 4, 'Chocolate', true);
```

---

## Paso 9: Iniciar servidor de desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5173`

### Probar funcionalidades:

1. **Login**:
   - Email: `admin@lokitos.com`
   - Password: (la que estableciste)

2. **Crear producto** (como Admin):
   - Ir a `/admin/products`
   - Clic en "Nuevo Producto"
   - Subir imagen (seleccionar archivo)
   - Guardar

3. **Vender** (como Vendedor):
   - Ir a `/` (página de ventas)
   - Agregar productos al carrito
   - Seleccionar método de pago
   - Cerrar venta

4. **Registrar gasto**:
   - Ir a `/gastos`
   - Título, monto, comentario
   - Guardar

5. **Ver reportes** (como Admin):
   - Ir a `/admin/dashboard` (hoy)
   - Ir a `/admin/reportes` (rango de fechas)

---

## Paso 10: Verificar RLS y seguridad

### Probar con diferentes roles:

1. **Como Admin**:
   - Acceder a `/admin/products` → debe funcionar
   - Crear producto → debe funcionar

2. **Como Vendedor**:
   - Ir a `/admin/products` → debe mostrar "No autorizado"
   - Ir a `/gastos` → debe funcionar

### Verificar auditoría:
```sql
SELECT * FROM auditoria ORDER BY fecha_hora DESC LIMIT 10;
```

---

## Paso 11: Limpiar para desarrollo

Opcional: Resetear todos los datos:

```sql
-- Eliminar todo
DELETE FROM auditoria;
DELETE FROM detalle_venta;
DELETE FROM ventas;
DELETE FROM gastos;
DELETE FROM productos;
DELETE FROM categorias;

-- Reinsertar categorías y productos iniciales
-- (copiar datos del Paso 8)
```

---

## Problemas Comunes

### ❌ "Invalid API Key"
**Solución**: Verificar que `VITE_SUPABASE_ANON_KEY` en `.env.local` es la clave pública (no service role)

### ❌ "Conexión rechazada a Supabase"
**Solución**: Verificar que `VITE_SUPABASE_URL` es correcto (debe incluir `.supabase.co`)

### ❌ "RLS policy violation"
**Solución**: 
- Verificar que usuario existe en tabla `usuarios` con `role_id` correcto
- Ejecutar: `SELECT * FROM usuarios WHERE email = 'tu@email.com';`

### ❌ "Edge Functions no funciona"
**Solución**:
- Ver logs: `supabase functions logs register-sale --project-id YOUR-ID`
- Verificar que `SUPABASE_SERVICE_ROLE` está configurada

### ❌ "Imágenes no se cargan"
**Solución**:
- Verificar que bucket `product-images` existe
- Verificar que imagen fue subida a Storage correctamente

---

## Siguientes pasos

1. ✅ **Desarrollo local**: Modificar código, agregar features
2. ✅ **Testing**: Ver [TESTING.md](./TESTING.md) para pruebas manuales
3. ✅ **Despliegue**: Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para lanzar a producción

---

**¿Necesitas ayuda?** Revisa:
- [Documentación Supabase](https://supabase.com/docs)
- [Documentación React](https://react.dev)
- [Documentación Vite](https://vitejs.dev)
