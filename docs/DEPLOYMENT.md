# 🚀 Guía de Despliegue Completa - Sistema POS Lokitos

Este documento proporciona una guía paso a paso y 100% funcional para desplegar el Sistema POS en **Supabase** (Base de datos, Autenticación, Edge Functions y Storage) y en **Vercel** (Frontend en React).

---

## 1. Configuración de la Base de Datos y Seguridad (Supabase)

### 1.1. Crear un proyecto en Supabase
1. Ingresa a [Supabase](https://supabase.com) y crea un nuevo proyecto.
2. Define el nombre del proyecto, la contraseña de la base de datos y selecciona la región más cercana a tus usuarios.
3. Espera a que la base de datos termine de aprovisionarse.

### 1.2. Inicializar el Esquema SQL
1. En el menú lateral izquierdo de Supabase, navega a **SQL Editor**.
2. Haz clic en **New query** para abrir un editor vacío.
3. Copia el contenido completo de [schema.sql](file:///C:/Users/edsantiago/Desktop/Repositorio/lokitos-software/sql/schema.sql) y pégalo en el editor.
4. Haz clic en **Run** (Ejecutar). Esto creará las tablas (`roles`, `usuarios`, `categorias`, `productos`, `ventas`, `detalle_venta`, `gastos`, `metodos_pago` y `auditoria`) e inicializará los triggers automáticos de auditoría y los registros base.

### 1.3. Aplicar las Políticas de Seguridad (RLS)
1. Abre una nueva pestaña en el **SQL Editor** (**New query**).
2. Copia el contenido completo de [rls_complete.sql](file:///C:/Users/edsantiago/Desktop/Repositorio/lokitos-software/sql/rls_complete.sql) y pégalo en el editor.
3. Haz clic en **Run** (Ejecutar). Esto activará la seguridad de nivel de fila (Row Level Security) en todas las tablas críticas, asegurando que los vendedores no accedan a los datos administrativos y que todas las acciones queden debidamente registradas en la tabla `auditoria`.

---

## 2. Configuración de Almacenamiento (Supabase Storage)

El POS requiere almacenar y mostrar imágenes de los productos alimenticios.
1. En el menú lateral izquierdo de Supabase, navega a **Storage**.
2. Haz clic en **New Bucket**.
3. Nombra el bucket exactamente como: `product-images`.
4. Marca la opción **Public** (Público). Esto permite que el frontend pueda obtener las URLs de las imágenes sin necesidad de generar firmas de token temporales.
5. Haz clic en **Save** (Guardar).
6. **Configurar políticas de Storage**:
   - Haz clic en **Policies** (Políticas) en la sección de Storage de Supabase.
   - En la sección del bucket `product-images`, haz clic en **New Policy** para crear una regla de inserción.
   - Crea una política que permita **INSERT**, **UPDATE** y **SELECT** a usuarios autenticados con rol de Administrador. (Para simplificar las pruebas, puedes seleccionar la plantilla que permite lectura pública a todos, e inserción a usuarios autenticados).

---

## 3. Despliegue de Edge Functions (Supabase Functions)

El POS cuenta con 4 Edge Functions críticas para realizar cálculos de reportes, cobros y administración de usuarios sin exponer credenciales sensibles en el navegador del cliente.

### 3.1. Preparar la CLI de Supabase
1. Asegúrate de tener instalada la CLI de Supabase en tu computadora. Si no la tienes, instálala globalmente usando npm:
   ```bash
   npm install -g supabase
   ```
2. Inicia sesión en tu cuenta de Supabase desde la terminal:
   ```bash
   supabase login
   ```
3. Vincula tu proyecto local de desarrollo con tu proyecto en la nube. Ve a la configuración de tu proyecto en Supabase (**Project Settings > General**) y copia el **Reference ID** (ID de referencia del proyecto). Luego, corre en la terminal de tu computadora en la raíz del proyecto:
   ```bash
   supabase link --project-ref TU_PROJECT_REFERENCE_ID
   ```

### 3.2. Desplegar las Edge Functions
Despliega cada una de las 4 funciones ejecutando los siguientes comandos en tu terminal en la raíz del proyecto:

```bash
# 1. Función para registrar ventas
supabase functions deploy register-sale

# 2. Función para registrar gastos
supabase functions deploy register-expense

# 3. Función para generar reportes y KPIs diarios
supabase functions deploy get-reports

# 4. Función para crear, editar y cambiar contraseñas de usuarios de manera administrativa
supabase functions deploy manage-users
```

> [!NOTE]
> Las Edge Functions de Supabase inyectan automáticamente las variables de entorno `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE` en su entorno de ejecución cuando se despliegan a la nube. No es necesario configurarlas manualmente en el dashboard de Supabase para las funciones.

---

## 4. Crear el Usuario Administrador Inicial

Para poder ingresar al sistema por primera vez, necesitas crear una cuenta de autenticación en Supabase Auth y vincularla a tu tabla `usuarios` con el rol de Administrador.

### 4.1. Crear la cuenta en Supabase Auth
1. En tu panel de Supabase, navega a **Authentication > Users**.
2. Haz clic en **Add User** y selecciona **Create User**.
3. Introduce el correo y una contraseña (por ejemplo, `admin@lokitos.com` y una contraseña segura).
4. Desmarca la casilla "Auto-confirm User" (o si la dejas marcada, se confirmará automáticamente; se recomienda marcarla para que no requiera confirmación por email).
5. Copia el **User ID** (es un UUID largo) que Supabase genera para el usuario recién creado.

### 4.2. Vincular el usuario en la tabla `usuarios`
1. Navega a **SQL Editor** y abre una **New query**.
2. Ejecuta la siguiente consulta SQL (reemplazando `'TU_UUID_AQUI'` con el ID que copiaste en el paso anterior):

```sql
-- Insertar el perfil de administrador vinculando el UUID de auth
INSERT INTO usuarios (id, email, nombre, role_id, activo)
VALUES (
  'TU_UUID_AQUI', -- Pega aquí el UUID de Supabase Auth
  'admin@lokitos.com', 
  'Administrador Principal', 
  (SELECT id FROM roles WHERE nombre = 'Administrador'), 
  true
);
```

3. ¡Listo! Ahora podrás usar esas credenciales para ingresar a la aplicación y tendrás acceso total de Administrador.

---

## 5. Despliegue del Frontend (Vercel)

### 5.1. Conectar tu repositorio a Vercel
1. Sube tu código a un repositorio privado o público en GitHub, GitLab o Bitbucket.
2. Ve a [Vercel](https://vercel.com) e inicia sesión.
3. Haz clic en **Add New** y luego selecciona **Project**.
4. Importa tu repositorio `lokitos-software`.

### 5.2. Configurar el Entorno de Compilación
En la pantalla de configuración del proyecto en Vercel, ajusta los siguientes campos:
* **Framework Preset**: Vite (se autodetectará).
* **Build Command**: `npm run build`
* **Output Directory**: `dist`

### 5.3. Configurar Variables de Entorno en Vercel
Despliega la sección **Environment Variables** en Vercel y añade las siguientes dos variables:
1. `VITE_SUPABASE_URL`: La URL de tu proyecto de Supabase (ej. `https://xxx.supabase.co`).
2. `VITE_SUPABASE_ANON_KEY`: La clave de API pública y anónima de tu proyecto (disponible en **Project Settings > API**).

### 5.4. Desplegar
Haz clic en el botón **Deploy**. Vercel compilará la aplicación en React en pocos segundos y te proporcionará una URL pública de producción (ej. `https://lokitos-pos.vercel.app`).

---

## 6. Configuración de URLs de Redirección (Supabase Auth)

Para garantizar la seguridad de los flujos de inicio y cierre de sesión, debes registrar tu dominio de Vercel en la configuración de autenticación de Supabase.
1. En tu panel de Supabase, navega a **Authentication > URL Configuration**.
2. En la sección **Redirect URLs**, añade:
   - La URL provista por Vercel (ej. `https://lokitos-pos.vercel.app/`).
   - La URL local si deseas hacer pruebas (ej. `http://localhost:5173/`).

---

## 7. Pruebas de Funcionamiento

### 7.1. Flujo de Administrador (Prueba)
1. Accede a tu URL de Vercel e ingresa con el correo `admin@lokitos.com` y la contraseña elegida.
2. Deberías ver en el menú superior el enlace a **Admin**.
3. Navega a **Admin > Categorías** y crea una categoría (ej. "Bebidas").
4. Navega a **Admin > Productos** y añade un producto (ej. "Refresco de Cola", precio: $35.00, asigna la categoría "Bebidas" y sube una foto).
5. Navega a **Admin > Usuarios** y crea un nuevo usuario con rol de **Vendedor** (ej. correo: `cajero@lokitos.com`, contraseña: `vendedor123`).

### 7.2. Flujo de Vendedor (Prueba)
1. Cierra sesión del administrador haciendo clic en **Salir**.
2. Inicia sesión con las credenciales de vendedor (`cajero@lokitos.com` / `vendedor123`).
3. Comprueba que el vendedor **no visualiza** el enlace a **Admin** en la cabecera (por RLS y enrutamiento dinámico).
4. Agrega el "Refresco de Cola" al carrito, modifica su cantidad y selecciona un método de pago.
5. Haz clic en **Finalizar Venta**. Verifica que se despliega el ticket simulado y el carrito se reinicia.
6. Ve a la sección **Gastos**, registra un gasto diario (ej. "Compra de Hielo", monto: $40.00).
7. Cierra sesión.

---

## 8. Verificación de Auditoría en Producción
Para comprobar que la base de datos está auditando de forma correcta las ventas, productos y usuarios creados por el personal:
1. En Supabase, ve al **SQL Editor**.
2. Ejecuta:
   ```sql
   SELECT * FROM auditoria ORDER BY fecha_hora DESC;
   ```
3. Deberás ver las tuplas con acciones `INSERT` y `UPDATE` de los productos agregados, la venta confirmada y el gasto ingresado.
