-- SQL: Configuración completa de RLS y Auditoría para Supabase
-- Fecha: 2026-07-09
-- NOTA: Ejecutar como admin en Supabase SQL Editor

-- 1. Habilitar RLS en tablas críticas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metodos_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para tabla USUARIOS
-- Administrador puede ver, insertar, actualizar y desactivar usuarios
CREATE POLICY usuarios_admin_select ON usuarios FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.email = auth.jwt() ->> 'email'
        AND u.role_id IN (SELECT id FROM roles WHERE nombre = 'Administrador')
    )
  );

CREATE POLICY usuarios_admin_insert ON usuarios FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.email = auth.jwt() ->> 'email'
        AND u.role_id IN (SELECT id FROM roles WHERE nombre = 'Administrador')
    )
  );

CREATE POLICY usuarios_admin_update ON usuarios FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.email = auth.jwt() ->> 'email'
        AND u.role_id IN (SELECT id FROM roles WHERE nombre = 'Administrador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.email = auth.jwt() ->> 'email'
        AND u.role_id IN (SELECT id FROM roles WHERE nombre = 'Administrador')
    )
  );

-- Cada usuario puede ver su propio perfil
CREATE POLICY usuarios_self_select ON usuarios FOR SELECT TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- 3. Políticas para tabla PRODUCTOS
-- Todos pueden leer productos activos
CREATE POLICY productos_select ON productos FOR SELECT USING (activo = true);

-- Solo administrador puede insertar, actualizar y desactivar
CREATE POLICY productos_admin_write ON productos FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.email = auth.jwt() ->> 'email'
        AND u.role_id IN (SELECT id FROM roles WHERE nombre = 'Administrador')
    )
  );

CREATE POLICY productos_admin_update ON productos FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.email = auth.jwt() ->> 'email'
        AND u.role_id IN (SELECT id FROM roles WHERE nombre = 'Administrador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.email = auth.jwt() ->> 'email'
        AND u.role_id IN (SELECT id FROM roles WHERE nombre = 'Administrador')
    )
  );

-- 4. Políticas para tabla CATEGORIAS
CREATE POLICY categorias_select ON categorias FOR SELECT USING (activo = true);

CREATE POLICY categorias_admin_write ON categorias FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.email = auth.jwt() ->> 'email'
        AND u.role_id IN (SELECT id FROM roles WHERE nombre = 'Administrador')
    )
  );

CREATE POLICY categorias_admin_update ON categorias FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.email = auth.jwt() ->> 'email'
        AND u.role_id IN (SELECT id FROM roles WHERE nombre = 'Administrador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.email = auth.jwt() ->> 'email'
        AND u.role_id IN (SELECT id FROM roles WHERE nombre = 'Administrador')
    )
  );

-- 5. Políticas para tabla VENTAS
-- Edge Functions crean ventas: permitir con context app.current_user_id
-- Administrador ve todas; vendedor ve solo las suyas
CREATE POLICY ventas_admin_select ON ventas FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.email = auth.jwt() ->> 'email'
        AND u.role_id IN (SELECT id FROM roles WHERE nombre = 'Administrador')
    )
  );

CREATE POLICY ventas_vendedor_select ON ventas FOR SELECT TO authenticated
  USING (
    usuario_id IN (
      SELECT id
      FROM usuarios
      WHERE email = auth.jwt() ->> 'email'
    )
    AND EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.email = auth.jwt() ->> 'email'
        AND u.role_id IN (SELECT id FROM roles WHERE nombre = 'Vendedor')
    )
  );

-- Edge Function inserta con contexto de admin/edge
-- No restringir INSERT desde la aplicación (Edge Functions usan service role)

-- 6. Políticas para tabla DETALLE_VENTA
CREATE POLICY detalle_venta_select ON detalle_venta FOR SELECT TO authenticated
  USING (
    venta_id IN (
      SELECT id
      FROM ventas
      WHERE usuario_id IN (
        SELECT id FROM usuarios WHERE email = auth.jwt() ->> 'email'
      )
      OR EXISTS (
        SELECT 1
        FROM usuarios u
        WHERE u.email = auth.jwt() ->> 'email'
          AND u.role_id IN (SELECT id FROM roles WHERE nombre = 'Administrador')
      )
    )
  );

-- 7. Políticas para tabla GASTOS
CREATE POLICY gastos_admin_select ON gastos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.email = auth.jwt() ->> 'email'
        AND u.role_id IN (SELECT id FROM roles WHERE nombre = 'Administrador')
    )
  );

CREATE POLICY gastos_vendedor_select ON gastos FOR SELECT TO authenticated
  USING (
    usuario_id IN (
      SELECT id
      FROM usuarios
      WHERE email = auth.jwt() ->> 'email'
    )
    AND EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.email = auth.jwt() ->> 'email'
        AND u.role_id IN (SELECT id FROM roles WHERE nombre = 'Vendedor')
    )
  );

-- 8. Políticas para tabla AUDITORIA
-- Solo administrador puede ver auditoría completa
CREATE POLICY auditoria_admin_select ON auditoria FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.email = auth.jwt() ->> 'email'
        AND u.role_id IN (SELECT id FROM roles WHERE nombre = 'Administrador')
    )
  );

-- Usuarios pueden ver auditoría sobre sus propias operaciones
CREATE POLICY auditoria_self_select ON auditoria FOR SELECT TO authenticated
  USING (
    usuario_id IN (
      SELECT id
      FROM usuarios
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- 9. Política para tabla METODOS_PAGO
CREATE POLICY metodos_pago_select ON metodos_pago FOR SELECT USING (true);

-- 10. Mejora: función de auditoría con manejo de usuario actual
-- Reemplazar función existente func_auditar con versión mejorada
DROP FUNCTION IF EXISTS func_auditar CASCADE;

CREATE OR REPLACE FUNCTION func_auditar() RETURNS trigger AS $$
DECLARE
  current_user_id uuid := NULL;
BEGIN
  -- Intentar obtener usuario actual desde context (Edge Functions lo establece)
  current_user_id := current_setting('app.current_user_id', true)::uuid;
  IF current_user_id IS NULL THEN
    -- Fallback a auth.uid() si está disponible
    current_user_id := auth.uid();
  END IF;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO auditoria(entidad, entidad_id, accion, usuario_id, datos_previos, datos_nuevos, fecha_hora)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', current_user_id, NULL, to_jsonb(NEW), now());
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO auditoria(entidad, entidad_id, accion, usuario_id, datos_previos, datos_nuevos, fecha_hora)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', current_user_id, to_jsonb(OLD), to_jsonb(NEW), now());
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO auditoria(entidad, entidad_id, accion, usuario_id, datos_previos, datos_nuevos, fecha_hora)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', current_user_id, to_jsonb(OLD), NULL, now());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Re-crear triggers si fue necesario ejecutar DROP
CREATE TRIGGER trg_auditar_usuarios AFTER INSERT OR UPDATE OR DELETE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION func_auditar();

CREATE TRIGGER trg_auditar_productos AFTER INSERT OR UPDATE OR DELETE ON productos
  FOR EACH ROW EXECUTE FUNCTION func_auditar();

CREATE TRIGGER trg_auditar_categorias AFTER INSERT OR UPDATE OR DELETE ON categorias
  FOR EACH ROW EXECUTE FUNCTION func_auditar();

CREATE TRIGGER trg_auditar_ventas AFTER INSERT OR UPDATE OR DELETE ON ventas
  FOR EACH ROW EXECUTE FUNCTION func_auditar();

CREATE TRIGGER trg_auditar_gastos AFTER INSERT OR UPDATE OR DELETE ON gastos
  FOR EACH ROW EXECUTE FUNCTION func_auditar();

-- 11. Consideraciones finales y notas de configuración:
-- - Las Edge Functions DEBEN ejecutar: SELECT set_config('app.current_user_id', '<user_id_uuid>', true)
--   antes de insertar/actualizar para que la auditoría registre el usuario correcto.
-- - Supabase Auth proporciona token JWT con claims; RLS usa auth.uid() automáticamente.
-- - Para producción, revisar y ajustar políticas según necesidades específicas.
-- - Probar RLS en Supabase Dashboard antes de desplegar a producción.
