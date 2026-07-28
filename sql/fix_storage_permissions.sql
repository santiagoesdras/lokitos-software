-- Script para solucionar la subida de imágenes a Supabase Storage
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Asegurar que el bucket 'product-images' exista y sea PÚBLICO
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Habilitar RLS en la tabla de objetos de almacenamiento (si no está activo)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas previas conflictivas si existen
DROP POLICY IF EXISTS "Public Read Access for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow All for product-images" ON storage.objects;

-- 4. Crear política de Lectura Pública (Cualquier usuario o cliente puede ver las imágenes)
CREATE POLICY "Public Read Access for product-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 5. Crear política de Inserción (Permite subir imágenes al bucket 'product-images')
CREATE POLICY "Authenticated Insert for product-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

-- 6. Crear política de Edición (Permite actualizar imágenes)
CREATE POLICY "Authenticated Update for product-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

-- 7. Crear política de Borrado (Permite eliminar imágenes)
CREATE POLICY "Authenticated Delete for product-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');
