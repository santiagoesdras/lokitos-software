-- SQL schema para PostgreSQL - Sistema POS
-- Fecha: 2026-07-09
-- Notas: usa UUIDs, función de auditoría y datos iniciales (roles, métodos de pago, categorías).

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Roles
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE
);

-- Usuarios
CREATE TABLE usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  nombre text,
  role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

-- Categorías
CREATE TABLE categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

-- Productos
CREATE TABLE productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  precio numeric(12,2) NOT NULL DEFAULT 0,
  categoria_id uuid REFERENCES categorias(id) ON DELETE SET NULL,
  imagen_path text,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

-- Métodos de pago
CREATE TABLE metodos_pago (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE
);

-- Ventas
CREATE TABLE ventas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  total numeric(12,2) NOT NULL,
  metodo_pago_id uuid REFERENCES metodos_pago(id) ON DELETE SET NULL,
  fecha_hora timestamptz NOT NULL DEFAULT now(),
  creado_en timestamptz NOT NULL DEFAULT now()
);

-- Detalle de venta
CREATE TABLE detalle_venta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id uuid REFERENCES productos(id) ON DELETE SET NULL,
  cantidad integer NOT NULL DEFAULT 1,
  precio_unitario numeric(12,2) NOT NULL
);

-- Gastos
CREATE TABLE gastos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  monto numeric(12,2) NOT NULL,
  comentario text,
  usuario_id uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_hora timestamptz NOT NULL DEFAULT now(),
  creado_en timestamptz NOT NULL DEFAULT now()
);

-- Auditoría
CREATE TABLE auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entidad text NOT NULL,
  entidad_id uuid,
  accion text NOT NULL,
  usuario_id uuid,
  datos_previos jsonb,
  datos_nuevos jsonb,
  fecha_hora timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX ON usuarios(role_id);
CREATE INDEX ON productos(categoria_id);
CREATE INDEX ON ventas(usuario_id);
CREATE INDEX ON ventas(metodo_pago_id);
CREATE INDEX ON detalle_venta(venta_id);
CREATE INDEX ON detalle_venta(producto_id);
CREATE INDEX ON gastos(usuario_id);

-- Función y trigger de auditoría
CREATE OR REPLACE FUNCTION func_auditar() RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO auditoria(entidad, entidad_id, accion, usuario_id, datos_previos, datos_nuevos, fecha_hora)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', current_setting('app.current_user_id', true)::uuid, NULL, to_jsonb(NEW), now());
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO auditoria(entidad, entidad_id, accion, usuario_id, datos_previos, datos_nuevos, fecha_hora)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', current_setting('app.current_user_id', true)::uuid, to_jsonb(OLD), to_jsonb(NEW), now());
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO auditoria(entidad, entidad_id, accion, usuario_id, datos_previos, datos_nuevos, fecha_hora)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', current_setting('app.current_user_id', true)::uuid, to_jsonb(OLD), NULL, now());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Agregar triggers a tablas críticas
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

-- Datos iniciales (roles, métodos de pago, categorías básicas)
INSERT INTO roles (nombre) VALUES ('Administrador') ON CONFLICT DO NOTHING;
INSERT INTO roles (nombre) VALUES ('Vendedor') ON CONFLICT DO NOTHING;

INSERT INTO metodos_pago (nombre) VALUES ('Efectivo') ON CONFLICT DO NOTHING;
INSERT INTO metodos_pago (nombre) VALUES ('Tarjeta') ON CONFLICT DO NOTHING;
INSERT INTO metodos_pago (nombre) VALUES ('Transferencia') ON CONFLICT DO NOTHING;

INSERT INTO categorias (nombre) VALUES ('Bebidas') ON CONFLICT DO NOTHING;
INSERT INTO categorias (nombre) VALUES ('Comestibles') ON CONFLICT DO NOTHING;

-- Ejemplo: cómo establecer la variable de sesión para auditoría desde una Edge Function
-- SELECT set_config('app.current_user_id', 'uuid-del-usuario', true);

-- Recomendación RLS (ejemplos - habilitar y ajustar según políticas):
-- ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "ventas_vendedor_insert" ON ventas FOR INSERT USING (true) WITH CHECK (current_setting('app.current_user_role', true) = 'Vendedor' OR current_setting('app.current_user_role', true) = 'Administrador');

-- NOTA: ajustar y habilitar políticas RLS según requerimientos y pruebas.
