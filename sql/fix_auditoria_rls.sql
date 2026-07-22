-- ==============================================================================
-- SCRIPT DE CORRECCIÓN PARA TABLA DE AUDITORÍA Y POLÍTICAS RLS
-- Soluciona el error: "new row violates row-level security policy for table auditoria"
-- ==============================================================================

-- 1. Habilitar RLS en la tabla auditoria y permitir inserción/lectura para usuarios autenticados
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS auditoria_insert_policy ON public.auditoria;
CREATE POLICY auditoria_insert_policy ON public.auditoria 
FOR INSERT TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS auditoria_select_policy ON public.auditoria;
CREATE POLICY auditoria_select_policy ON public.auditoria 
FOR SELECT TO authenticated 
USING (true);

-- 2. Asegurar que la función de auditoría se ejecute con privilegios SECURITY DEFINER
CREATE OR REPLACE FUNCTION func_auditar() RETURNS trigger 
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid := NULL;
BEGIN
  BEGIN
    current_user_id := current_setting('app.current_user_id', true)::uuid;
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;

  IF current_user_id IS NULL THEN
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
