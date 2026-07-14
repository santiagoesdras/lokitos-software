-- Políticas RLS de ejemplo para Supabase/Postgres
-- Habilitar RLS y políticas según las variables de sesión establecidas por Edge Functions

-- Ejemplo: habilitar RLS en tablas críticas
-- ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Políticas de ejemplo (ajustar según necesidades):
-- Asume que las Edge Functions ejecutan: SELECT set_config('app.current_user_id', '<uuid>', true);
-- y set_config('app.current_user_role', 'Administrador'|'Vendedor', true);

-- Permitir inserciones de ventas por vendedores y administradores
-- CREATE POLICY ventas_insert ON ventas FOR INSERT
--   WITH CHECK (
--     current_setting('app.current_user_role', true) IN ('Vendedor','Administrador')
--   );

-- Permitir selección de ventas para administradores y para vendedores solo las suyas
-- CREATE POLICY ventas_select_admin ON ventas FOR SELECT TO PUBLIC USING (
--   current_setting('app.current_user_role', true) = 'Administrador'
-- );

-- CREATE POLICY ventas_select_vendedor ON ventas FOR SELECT TO PUBLIC USING (
--   current_setting('app.current_user_role', true) = 'Vendedor' AND usuario_id = current_setting('app.current_user_id', true)::uuid
-- );

-- Política para productos: todos los roles pueden leer, solo admin puede insertar/actualizar/desactivar
-- ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY productos_select ON productos FOR SELECT USING (true);
-- CREATE POLICY productos_admin_write ON productos FOR INSERT, UPDATE, DELETE USING (
--   current_setting('app.current_user_role', true) = 'Administrador'
-- );

-- NOTA: Antes de aplicar, ejecutar en una sesión con privilegios de administrador y ajustar nombres de roles y condiciones.
