-- ==============================================================================
-- CORRECCION DE PERMISOS PARA SUPABASE STORAGE
-- Fecha: 2026-07-28
--
-- Problema que corrige:
--   "new row violates row-level security policy"
--   al subir imagenes al bucket "product-images".
--
-- Causa probable:
--   La policy actual de storage.objects no coincide con la subida que hace el
--   frontend, o fue creada con reglas mas restrictivas de las necesarias.
--
-- Solucion:
--   1. Asegurar bucket publico para lectura.
--   2. Crear una funcion robusta para saber si el usuario autenticado es admin.
--   3. Reemplazar las policies de storage.objects para ese bucket.
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Public Read Access for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow All for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Read for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete for product-images" ON storage.objects;

CREATE POLICY "Public Read Access for product-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Admin Insert for product-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND public.is_current_user_admin()
);

CREATE POLICY "Admin Update for product-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.is_current_user_admin()
)
WITH CHECK (
  bucket_id = 'product-images'
  AND public.is_current_user_admin()
);

CREATE POLICY "Admin Delete for product-images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.is_current_user_admin()
);

-- Verificacion sugerida despues de ejecutar este script:
-- SELECT auth.uid();
-- SELECT auth.jwt() ->> 'email';
-- SELECT public.is_current_user_admin();
--
-- SELECT policyname, cmd, roles, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects';
