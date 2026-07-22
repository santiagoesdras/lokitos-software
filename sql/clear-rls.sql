-- SQL para limpiar todas las políticas RLS existentes
-- Ejecutar este script antes de aplicar las nuevas políticas

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename IN (
              'usuarios', 'productos', 'categorias', 'ventas', 'detalle_venta', 'gastos', 'metodos_pago', 'auditoria'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 'usuarios_admin_select', 'public', 'usuarios');
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 'usuarios_admin_insert', 'public', 'usuarios');
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 'usuarios_admin_update', 'public', 'usuarios');
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 'usuarios_self_select', 'public', 'usuarios');

        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 'productos_select', 'public', 'productos');
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 'productos_admin_write', 'public', 'productos');
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 'productos_admin_update', 'public', 'productos');

        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 'categorias_select', 'public', 'categorias');
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 'categorias_admin_write', 'public', 'categorias');
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 'categorias_admin_update', 'public', 'categorias');

        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 'ventas_admin_select', 'public', 'ventas');
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 'ventas_vendedor_select', 'public', 'ventas');

        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 'detalle_venta_select', 'public', 'detalle_venta');

        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 'gastos_admin_select', 'public', 'gastos');
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 'gastos_vendedor_select', 'public', 'gastos');

        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 'auditoria_admin_select', 'public', 'auditoria');
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 'auditoria_self_select', 'public', 'auditoria');

        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 'metodos_pago_select', 'public', 'metodos_pago');
    END LOOP;
END $$;

-- Opcional: deshabilitar RLS en tablas si se desea volver a crear desde cero
-- ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE productos DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE ventas DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE detalle_venta DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE gastos DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE metodos_pago DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE auditoria DISABLE ROW LEVEL SECURITY;
