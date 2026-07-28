-- ==============================================================================
-- CORRECCION RLS PARA PRODUCTOS
-- Fecha: 2026-07-28
--
-- Problema que corrige:
--   "new row violates row-level security policy for table 'productos'"
--
-- Causa probable:
--   La policy actual de productos depende de consultar public.usuarios/public.roles
--   desde otra policy RLS. Si la relacion auth.users -> public.usuarios no esta
--   perfectamente alineada, o si el email no coincide exactamente, el usuario puede
--   entrar a la UI como admin pero fallar al actualizar productos.
--
-- Solucion:
--   1. Crear una funcion SECURITY DEFINER que valide si el usuario autenticado es admin.
--   2. Reemplazar las policies de INSERT/UPDATE en productos para usar esa funcion.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    JOIN public.roles r ON r.id = u.role_id
    WHERE u.activo = true
      AND r.nombre = 'Administrador'
      AND (
        u.id = auth.uid()
        OR lower(u.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS productos_select ON public.productos;
CREATE POLICY productos_select ON public.productos
FOR SELECT
USING (activo = true OR public.is_current_user_admin());

DROP POLICY IF EXISTS productos_admin_write ON public.productos;
CREATE POLICY productos_admin_write ON public.productos
FOR INSERT TO authenticated
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS productos_admin_update ON public.productos;
CREATE POLICY productos_admin_update ON public.productos
FOR UPDATE TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Verificacion sugerida:
-- SELECT auth.uid();
-- SELECT public.is_current_user_admin();
