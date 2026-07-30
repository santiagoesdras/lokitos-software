-- ==============================================================================
-- REMEDIACION DE SEGURIDAD - LOKITOS POS
-- Fecha: 2026-07-29
--
-- Objetivo:
--   Reducir la superficie expuesta al rol anon, endurecer las politicas RLS
--   para usuarios autenticados y mantener operativos los flujos actuales de
--   administrador y vendedor.
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

CREATE OR REPLACE FUNCTION public.is_current_user_staff()
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
      AND r.nombre IN ('Administrador', 'Vendedor')
      AND (
        u.id = auth.uid()
        OR lower(u.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_current_user_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_staff() TO authenticated;

REVOKE ALL ON public.roles FROM anon;
REVOKE ALL ON public.usuarios FROM anon;
REVOKE ALL ON public.productos FROM anon;
REVOKE ALL ON public.categorias FROM anon;
REVOKE ALL ON public.metodos_pago FROM anon;
REVOKE ALL ON public.gastos FROM anon;
REVOKE ALL ON public.ventas FROM anon;
REVOKE ALL ON public.detalle_venta FROM anon;
REVOKE ALL ON public.auditoria FROM anon;

GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.usuarios TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.productos TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.categorias TO authenticated;
GRANT SELECT ON public.metodos_pago TO authenticated;
GRANT SELECT ON public.gastos TO authenticated;
GRANT SELECT ON public.ventas TO authenticated;
GRANT SELECT ON public.detalle_venta TO authenticated;
GRANT SELECT ON public.auditoria TO authenticated;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metodos_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_select_policy ON public.roles;
DROP POLICY IF EXISTS roles_select_authenticated ON public.roles;

DROP POLICY IF EXISTS usuarios_select_policy ON public.usuarios;
DROP POLICY IF EXISTS usuarios_admin_select ON public.usuarios;
DROP POLICY IF EXISTS usuarios_admin_insert ON public.usuarios;
DROP POLICY IF EXISTS usuarios_admin_update ON public.usuarios;
DROP POLICY IF EXISTS usuarios_self_select ON public.usuarios;
DROP POLICY IF EXISTS usuarios_staff_select ON public.usuarios;

DROP POLICY IF EXISTS productos_select ON public.productos;
DROP POLICY IF EXISTS productos_admin_write ON public.productos;
DROP POLICY IF EXISTS productos_admin_update ON public.productos;

DROP POLICY IF EXISTS categorias_select ON public.categorias;
DROP POLICY IF EXISTS categorias_admin_write ON public.categorias;
DROP POLICY IF EXISTS categorias_admin_update ON public.categorias;

DROP POLICY IF EXISTS metodos_pago_select ON public.metodos_pago;
DROP POLICY IF EXISTS metodos_pago_select_authenticated ON public.metodos_pago;

DROP POLICY IF EXISTS gastos_admin_select ON public.gastos;
DROP POLICY IF EXISTS gastos_vendedor_select ON public.gastos;
DROP POLICY IF EXISTS gastos_staff_select ON public.gastos;

DROP POLICY IF EXISTS ventas_admin_select ON public.ventas;
DROP POLICY IF EXISTS ventas_vendedor_select ON public.ventas;
DROP POLICY IF EXISTS ventas_staff_select ON public.ventas;

DROP POLICY IF EXISTS detalle_venta_select ON public.detalle_venta;
DROP POLICY IF EXISTS detalle_venta_admin_select ON public.detalle_venta;
DROP POLICY IF EXISTS detalle_venta_vendedor_select ON public.detalle_venta;

DROP POLICY IF EXISTS auditoria_admin_select ON public.auditoria;
DROP POLICY IF EXISTS auditoria_self_select ON public.auditoria;

CREATE POLICY roles_select_authenticated
ON public.roles
FOR SELECT
TO authenticated
USING (public.is_current_user_staff());

CREATE POLICY usuarios_self_select
ON public.usuarios
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
);

CREATE POLICY usuarios_admin_select
ON public.usuarios
FOR SELECT
TO authenticated
USING (public.is_current_user_admin());

CREATE POLICY productos_select_authenticated
ON public.productos
FOR SELECT
TO authenticated
USING (
  public.is_current_user_admin()
  OR (public.is_current_user_staff() AND activo = true)
);

CREATE POLICY productos_admin_insert
ON public.productos
FOR INSERT
TO authenticated
WITH CHECK (public.is_current_user_admin());

CREATE POLICY productos_admin_update
ON public.productos
FOR UPDATE
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY categorias_select_authenticated
ON public.categorias
FOR SELECT
TO authenticated
USING (
  public.is_current_user_admin()
  OR (public.is_current_user_staff() AND activo = true)
);

CREATE POLICY categorias_admin_insert
ON public.categorias
FOR INSERT
TO authenticated
WITH CHECK (public.is_current_user_admin());

CREATE POLICY categorias_admin_update
ON public.categorias
FOR UPDATE
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY metodos_pago_select_authenticated
ON public.metodos_pago
FOR SELECT
TO authenticated
USING (public.is_current_user_staff());

CREATE POLICY gastos_staff_select
ON public.gastos
FOR SELECT
TO authenticated
USING (public.is_current_user_staff());

CREATE POLICY ventas_admin_select
ON public.ventas
FOR SELECT
TO authenticated
USING (public.is_current_user_admin());

CREATE POLICY ventas_vendedor_select
ON public.ventas
FOR SELECT
TO authenticated
USING (
  public.is_current_user_staff()
  AND usuario_id = auth.uid()
);

CREATE POLICY detalle_venta_admin_select
ON public.detalle_venta
FOR SELECT
TO authenticated
USING (
  public.is_current_user_admin()
  AND EXISTS (
    SELECT 1
    FROM public.ventas v
    WHERE v.id = detalle_venta.venta_id
  )
);

CREATE POLICY detalle_venta_vendedor_select
ON public.detalle_venta
FOR SELECT
TO authenticated
USING (
  public.is_current_user_staff()
  AND EXISTS (
    SELECT 1
    FROM public.ventas v
    WHERE v.id = detalle_venta.venta_id
      AND v.usuario_id = auth.uid()
  )
);

CREATE POLICY auditoria_admin_select
ON public.auditoria
FOR SELECT
TO authenticated
USING (public.is_current_user_admin());

-- Verificaciones sugeridas:
-- SELECT auth.uid();
-- SELECT auth.jwt() ->> 'email';
-- SELECT public.is_current_user_staff();
-- SELECT public.is_current_user_admin();
