# Auditoría de seguridad — Lokitos POS

**Objetivo:** `https://lokitos.tulab.dev/login`  
**Fecha:** 28 de julio de 2026  
**Modalidad:** caja negra externa, sin credenciales, no destructiva  
**Riesgo global:** **ALTO**, con posible escalamiento a **CRÍTICO** si las funciones de venta y gasto permiten escritura con credenciales públicas.

## Resumen ejecutivo

La aplicación tiene una base técnica razonable en transporte: HTTPS obligatorio, TLS 1.3, HSTS, certificado válido y método TRACE deshabilitado. Tampoco se encontró una clave `service_role` ni mapas de fuente expuestos.

Sin embargo, la autorización del backend presenta fallas graves:

1. Cualquier persona en Internet puede consultar reportes financieros reales usando únicamente la clave publicable de Supabase incluida —correctamente y por diseño— en el JavaScript del frontend.
2. El rol anónimo puede enumerar perfiles de usuarios y campos como correo, nombre, rol y estado, además de catálogo y métodos de pago.
3. Las funciones `register-sale` y `register-expense` aceptan la clave publicable y llegan a la validación de negocio. No se envió una carga válida para evitar modificar información, por lo que la escritura anónima queda como riesgo alto pendiente de confirmación.
4. El registro público de cuentas está habilitado y el frontend acepta cualquier sesión Supabase en la ruta principal aunque no exista un perfil interno en `public.usuarios`.

La clave publicable no es un secreto y no debe intentarse “ocultar”. La corrección debe hacerse en RLS, en las funciones Edge y en la configuración de Auth.

## Alcance y método

Se realizaron:

- navegación visual de `/login`;
- inspección de respuestas HTTP, redirecciones, TLS y cabeceras;
- análisis estático del bundle JavaScript público;
- consultas anónimas de solo lectura a Supabase REST;
- comprobaciones mínimas de funciones Edge usando la clave publicable;
- un intento de inicio de sesión con una cuenta ficticia `example.invalid`;
- cargas vacías e inválidas a funciones de escritura, sin crear registros.

No se realizó fuerza bruta, creación de cuentas, uso de sesiones existentes, extracción de valores financieros, modificación de datos, pruebas de disponibilidad ni explotación con cargas válidas.

## Hallazgos

### LKT-01 — Reportes financieros accesibles anónimamente

**Severidad: Alta confirmada**

La función Edge `get-reports` rechaza una solicitud sin cabeceras de Supabase con `401`, pero responde `200` cuando se usa únicamente la clave publicable obtenida del bundle.

Para el intervalo de julio de 2026, la respuesta anónima incluyó:

- `totalVendido`
- `totalGastos`
- `utilidadEstim`
- `cantidadVentas`
- `productosTop`
- `metodos`

Se confirmó que había valores numéricos distintos de cero, tres productos destacados y dos métodos de pago. No se conservaron ni se incluyeron los importes o nombres.

**Impacto**

Un atacante sin cuenta puede extraer ventas, gastos, utilidad, cantidad de transacciones, productos más vendidos y distribución por método de pago para intervalos arbitrarios.

**Corrección**

- Exigir una identidad de usuario verificada antes de ejecutar cualquier consulta.
- Autorizar el rol `Administrador` en el servidor; no confiar en la ruta o el rol calculado por React.
- Usar `withSupabase({ auth: "user" })` o una verificación equivalente con `auth.getUser()` y devolver `401/403` antes de consultar datos.
- Mantener `verify_jwt` habilitado cuando la función solo deba aceptar sesiones de usuario.
- Si la función usa una clave secreta o `service_role`, no ejecutar ninguna operación privilegiada hasta validar identidad y rol.
- Registrar accesos y aplicar límites de frecuencia.

Supabase recomienda que las funciones llamadas por usuarios verifiquen un JWT de sesión y apliquen autorización dentro del handler: [Securing Edge Functions](https://supabase.com/docs/guides/functions/auth).

### LKT-02 — Exposición anónima de usuarios y metadatos internos

**Severidad: Alta confirmada**

Con la clave publicable y sin sesión de usuario se obtuvieron respuestas parciales exitosas (`206`) de:

| Recurso | Filas visibles al rol anónimo |
|---|---:|
| `usuarios` | 5 |
| `roles` | 2 |
| `productos` | 34 |
| `metodos_pago` | 4 |
| `categorias` | 2 |

Una consulta `HEAD`, que no devolvió filas, confirmó que el rol anónimo puede seleccionar en `usuarios` los campos `id`, `email`, `nombre`, `role_id` y `activo`.

No se conservaron ni se mostraron valores de ninguna fila. `gastos`, `ventas` y `auditoria` devolvieron cero filas al rol anónimo; esta prueba no permite distinguir entre tablas vacías y políticas RLS que filtran correctamente.

**Impacto**

- exposición de datos personales;
- enumeración de cuentas y roles;
- reconocimiento del catálogo y estructura del negocio;
- mejor preparación para phishing, ingeniería social o ataques dirigidos.

**Corrección**

- Habilitar RLS en todas las tablas expuestas por la API.
- Revocar `SELECT` al rol `anon` en `usuarios` y `roles`.
- Restringir perfiles a `auth.uid() = id`; habilitar lectura global solo a administradores verificados en servidor.
- Si se necesita un directorio público, exponer una vista mínima sin correo, estado ni identificadores internos.
- Auditar políticas `SELECT`, `INSERT`, `UPDATE` y `DELETE` de todas las tablas y buckets, incluyendo vistas y funciones `security definer`.
- Probar las políticas como `anon`, usuario sin perfil, vendedor y administrador.

Supabase distingue los roles Postgres `anon` y `authenticated`; las políticas deben indicar expresamente a quién permiten cada operación: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

### LKT-03 — Funciones de venta y gasto alcanzables con credenciales públicas

**Severidad: Alta, escritura no ejecutada**

Resultados con solicitudes `HEAD`:

| Función | Sin credenciales | Con clave publicable |
|---|---:|---:|
| `register-sale` | 401 | 400 |
| `register-expense` | 401 | 400 |
| `manage-users` | 401 | 401 |

Una carga JSON vacía a `register-sale` y `register-expense` devolvió `400 {"error":"Invalid payload"}`. Esto demuestra que la solicitud anónima llega al handler y a su validación de negocio, en lugar de ser rechazada primero por autenticación.

No se envió una carga válida para evitar crear una venta o gasto. Por ello no se afirma que la escritura anónima esté confirmada; sí existe una ruta de ataque suficientemente seria para tratarla como urgente.

**Corrección**

- Autenticar y autorizar antes de analizar o validar la carga.
- Exigir roles `Vendedor` o `Administrador` en el backend.
- Derivar `user_id` exclusivamente del JWT validado; nunca aceptar el actor desde el JSON del cliente.
- Ejecutar operaciones mediante un cliente limitado por RLS cuando sea posible.
- Añadir validación de esquema, límites de importes/cantidades, idempotencia y auditoría.
- Conservar el comportamiento observado en `manage-users`, que sí rechazó la clave pública.

Las claves `sb_publishable_*` identifican el proyecto, pero no representan a un usuario. Supabase documenta que la sesión del usuario debe viajar como JWT en `Authorization`: [Authorization headers](https://supabase.com/docs/guides/functions/auth-headers).

### LKT-04 — Registro público y guarda incompleta para cuentas sin perfil

**Severidad: Alta, explotación no completada**

El endpoint público de configuración Auth informó:

- `disable_signup: false`
- correo como proveedor habilitado;
- confirmación de correo requerida.

Por tanto, una persona con un correo válido puede registrarse directamente contra la API aunque la interfaz no muestre un botón de registro.

El bundle también muestra que:

- una sesión Supabase válida se acepta aunque no exista fila en `public.usuarios`;
- solo se expulsa una cuenta si existe perfil y `activo === false`;
- la ruta `/` exige sesión, pero no exige rol;
- las rutas de gasto y administración sí incluyen guardas de rol.

Esto permite que una cuenta nueva y verificada alcance el POS principal. El impacto final depende de la autorización de las funciones y políticas RLS; no se creó una cuenta para comprobarlo.

**Corrección**

- Si el POS es privado, desactivar **Allow new users to sign up** y usar invitaciones administrativas.
- Como alternativa, usar un hook **Before User Created** para restringir dominios o una lista permitida.
- Rechazar en el proveedor de autenticación toda sesión sin perfil interno activo.
- Exigir `Vendedor` o `Administrador` también en la ruta `/`.
- Repetir las mismas comprobaciones en funciones Edge y RLS; las guardas de React no son controles de seguridad.

Supabase confirma que desactivar **Allow new users to sign up** deja iniciar sesión solo a usuarios existentes: [General configuration](https://supabase.com/docs/guides/auth/general-configuration).

### LKT-05 — El límite de sesión de 12 horas es manipulable en el cliente

**Severidad: Media**

El frontend guarda `login_time` en `localStorage`. Solo cierra la sesión si esa clave existe y supera 12 horas. Si se elimina o modifica, el control deja de actuar mientras la sesión y el refresh token de Supabase continúen vigentes.

**Impacto**

Una sesión en un equipo compartido puede mantenerse más tiempo del esperado. Además, cualquier XSS ejecutado en el origen puede leer el almacenamiento de sesión.

**Corrección**

- Configurar en Supabase un **Time-box** y un **Inactivity timeout** acordes al riesgo.
- Mantener el control de UI solo como ayuda de experiencia, no como mecanismo de seguridad.
- Para acciones críticas, verificar `session_id`, rol y reautenticación en servidor.
- Reducir el impacto de XSS con una CSP estricta y, si la arquitectura lo permite, evaluar un BFF/cookies `HttpOnly`.

Supabase explica que las sesiones duran indefinidamente por defecto y ofrece límites de vida e inactividad: [User sessions](https://supabase.com/docs/guides/auth/sessions). OWASP advierte que un timeout controlado por valores manipulables en el cliente puede extenderse: [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

### LKT-06 — Faltan cabeceras defensivas del navegador

**Severidad: Media**

En `/login` se observó HSTS, pero no:

- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

**Impacto**

La aplicación puede ser embebida por otros sitios, lo que habilita clickjacking. También pierde defensas en profundidad frente a XSS, MIME sniffing y filtración innecesaria del `Referer`.

**Corrección sugerida**

Probar primero en `Content-Security-Policy-Report-Only` y luego aplicar una política equivalente a:

```text
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://dowcwcbxgwzanxhpvdso.supabase.co;
connect-src 'self' https://dowcwcbxgwzanxhpvdso.supabase.co wss://dowcwcbxgwzanxhpvdso.supabase.co;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

Añadir:

```text
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=()
```

OWASP recomienda `frame-ancestors` para evitar framing y documenta estas cabeceras defensivas: [CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html) y [HTTP Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html).

### LKT-07 — No existe `security.txt`

**Severidad: Informativa**

`/.well-known/security.txt` devuelve el HTML genérico de la SPA con estado `200`, no un archivo de contacto de seguridad. Lo mismo ocurre con `robots.txt`.

**Corrección**

Publicar un `security.txt` real con contacto, política de divulgación y fecha de expiración; para rutas inexistentes que no pertenecen a la SPA, considerar devolver `404`.

## Controles positivos observados

- HTTP redirige a HTTPS con `308`.
- HSTS: `max-age=63072000`.
- TLS 1.3 con certificado válido para `*.tulab.dev`.
- `TRACE` devuelve `405`.
- El mapa `index-CH6DhBPC.js.map` devuelve `403`.
- `.env`, `.git/config` y `package.json` no se expusieron; devolvieron el HTML de la SPA.
- El inicio de sesión inválido respondió de forma genérica: `Invalid login credentials`.
- `manage-users` rechazó la clave publicable con `401`.
- No se encontró una clave `service_role` en el bundle; solo una clave publicable, lo cual es normal en una SPA.

## Criterios de verificación

La remediación debe considerarse completa cuando:

- `get-reports` devuelve `401` con la clave publicable y sin JWT de usuario;
- `register-sale` y `register-expense` devuelven `401` antes de validar datos;
- `usuarios?select=email` no devuelve filas ni metadatos al rol `anon`;
- una cuenta sin perfil activo no puede abrir `/`, `/gastos` ni invocar funciones;
- un vendedor no puede consultar reportes ni administrar usuarios;
- un administrador autenticado conserva las funciones autorizadas;
- `/login` incluye CSP, protección anti-framing, `nosniff`, Referrer Policy y Permissions Policy.

## Limitaciones

Esta fue una auditoría externa acotada. No incluye revisión del repositorio, políticas SQL completas, código fuente de funciones Edge, dependencias, secretos del entorno, red interna ni pruebas autenticadas por rol. Los hallazgos confirmados justifican una revisión de código y RLS inmediata.
