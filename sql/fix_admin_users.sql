-- ==============================================================================
-- SCRIPT DEFINITIVO DE CORRECCIÓN DE POLÍTICAS Y VINCULACIÓN DIRECTA DE ADMINS
-- ==============================================================================

-- 1. Eliminar TODAS las políticas RLS existentes en 'usuarios' y 'roles' (elimina recursiones infinitas previas)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'usuarios'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.usuarios', pol.policyname);
    END LOOP;

    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'roles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.roles', pol.policyname);
    END LOOP;
END $$;

-- 2. Crear los roles requeridos en la tabla public.roles
INSERT INTO public.roles (nombre) 
VALUES ('Administrador'), ('Vendedor') 
ON CONFLICT (nombre) DO NOTHING;

-- 3. Deshabilitar RLS temporalmente
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- 4. Insertar/Actualizar directamente el usuario específico de tu diagnóstico
INSERT INTO public.usuarios (id, email, nombre, role_id, activo)
VALUES (
  '953291f1-5bdc-4837-bcde-f7e73df7441a',
  'edsantiago@url.edu.gt',
  'Administrador Santiago',
  (SELECT id FROM public.roles WHERE nombre = 'Administrador' LIMIT 1),
  true
)
ON CONFLICT (email) DO UPDATE 
SET id = '953291f1-5bdc-4837-bcde-f7e73df7441a',
    role_id = EXCLUDED.role_id,
    activo = true;

-- 5. Vincular AUTOMÁTICAMENTE a todos los demás usuarios de auth.users como Administrador
INSERT INTO public.usuarios (id, email, nombre, role_id, activo)
SELECT 
  au.id, 
  au.email, 
  COALESCE(au.raw_user_meta_data->>'nombre', split_part(au.email, '@', 1)) AS nombre,
  (SELECT id FROM public.roles WHERE nombre = 'Administrador' LIMIT 1) AS role_id,
  true AS activo
FROM auth.users au
ON CONFLICT (email) DO UPDATE 
SET role_id = EXCLUDED.role_id,
    id = EXCLUDED.id,
    activo = true;

-- 6. Habilitar RLS e insertar Políticas de Lectura totalmente limpias y no-recursivas
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY roles_select_policy ON public.roles FOR SELECT USING (true);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY usuarios_select_policy ON public.usuarios FOR SELECT USING (true);

-- 7. Comprobación final
SELECT 
  u.id, 
  u.email, 
  u.nombre, 
  r.nombre AS rol, 
  u.activo
FROM public.usuarios u
LEFT JOIN public.roles r ON u.role_id = r.id;
