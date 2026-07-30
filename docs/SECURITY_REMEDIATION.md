# Remediacion de Seguridad

Fecha: 2026-07-29

## Objetivo

Aplicar en produccion las correcciones implementadas para los hallazgos del archivo `auditoria.md`.

## Cambios incluidos en el repo

- Endurecimiento de Edge Functions:
  - `get-reports` ahora exige sesion valida y rol `Administrador`.
  - `register-sale` ahora exige sesion valida y rol `Vendedor` o `Administrador`.
  - `register-expense` ahora exige sesion valida y rol `Vendedor` o `Administrador`.
  - `manage-users` ahora exige sesion valida y rol `Administrador`.
- El actor ya no se acepta desde el JSON del cliente en ventas o gastos.
- La venta calcula total y precios en servidor usando productos activos.
- El frontend expulsa sesiones sin perfil interno activo o sin rol autorizado.
- La ruta `/` ahora exige rol `Vendedor` o `Administrador`.
- Se agregaron cabeceras defensivas en `vercel.json`.
- Se agregaron `robots.txt`, `security.txt` y una politica de divulgacion simple.
- Se agrego `sql/security_lockdown.sql` para cerrar acceso anonimo y endurecer RLS.

## Pasos obligatorios en produccion

### 1. Aplicar SQL de endurecimiento

Ejecutar en Supabase SQL Editor:

- `sql/security_lockdown.sql`

Si aun no se han aplicado las correcciones previas relacionadas con storage y productos, revisar tambien:

- `sql/fix_productos_rls.sql`
- `sql/fix_storage_permissions.sql`

### 2. Desplegar Edge Functions

Desplegar nuevamente:

- `get-reports`
- `register-sale`
- `register-expense`
- `manage-users`

Ejemplo:

```bash
supabase functions deploy get-reports
supabase functions deploy register-sale
supabase functions deploy register-expense
supabase functions deploy manage-users
```

### 3. Ajustar Auth en Supabase

En produccion, confirmar que Auth quede asi:

- `Allow new users to sign up`: deshabilitado
- `Email signups`: deshabilitado si el POS es privado
- `Session timebox`: 12 horas
- `Inactivity timeout`: 2 horas

Nota:
- `supabase/config.toml` ya refleja esta configuracion deseada, pero en Supabase Cloud debes verificarla o aplicarla en el proyecto remoto.

### 4. Redeploy del frontend

Volver a desplegar la web para publicar:

- nuevas guardas de rol;
- manejo real de errores de Edge Functions;
- cabeceras de seguridad;
- archivos publicos `security.txt` y `robots.txt`.

## Verificacion esperada

Tras desplegar:

- `get-reports` debe devolver `401` o `403` sin JWT/rol admin.
- `register-sale` y `register-expense` deben devolver `401` o `403` antes de procesar carga si no hay sesion valida.
- `anon` no debe poder listar `usuarios`, `roles`, `productos`, `categorias` ni `metodos_pago`.
- una cuenta sin perfil interno activo no debe entrar a `/`, `/gastos` ni admin.
- un vendedor no debe poder consultar reportes ni administrar usuarios.
- un administrador debe conservar funciones autorizadas.
- la respuesta HTTP debe incluir CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy` y `Permissions-Policy`.
