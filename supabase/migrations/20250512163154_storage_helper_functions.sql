-- Add a helper function to safely access storage.objects metadata
-- Create this function in the public schema so we can access it with RPC
CREATE OR REPLACE FUNCTION public.get_storage_object_size(file_path TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  file_size BIGINT;
BEGIN
  -- Access the storage.objects table directly
  SELECT ((metadata->>'size')::BIGINT) INTO file_size
  FROM storage.objects
  WHERE name = file_path
  LIMIT 1;
  
  RETURN file_size;
END;
$$;

-- Add appropriate comment
COMMENT ON FUNCTION public.get_storage_object_size IS 'Gets the size of a storage object by path';

-- Add a function to get the full metadata including bucket info
-- This is more comprehensive than the get_storage_object_size function
CREATE OR REPLACE FUNCTION public.get_storage_object_metadata(file_path TEXT, bucket_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  metadata_json JSONB;
  bucket_id_alias ALIAS FOR bucket_id;
BEGIN
  -- Access the storage.objects table directly with optional bucket filtering
  IF bucket_id_alias IS NULL THEN
    SELECT JSONB_BUILD_OBJECT(
      'id', id,
      'name', name,
      'bucket_id', bucket_id,
      'owner', owner,
      'created_at', created_at,
      'updated_at', updated_at,
      'last_accessed_at', last_accessed_at,
      'metadata', metadata,
      'size', CASE WHEN metadata->>'size' IS NOT NULL THEN (metadata->>'size')::BIGINT ELSE NULL END
    ) INTO metadata_json
    FROM storage.objects
    WHERE name = file_path
    LIMIT 1;
  ELSE
    SELECT JSONB_BUILD_OBJECT(
      'id', id,
      'name', name,
      'bucket_id', bucket_id,
      'owner', owner,
      'created_at', created_at,
      'updated_at', updated_at,
      'last_accessed_at', last_accessed_at,
      'metadata', metadata,
      'size', CASE WHEN metadata->>'size' IS NOT NULL THEN (metadata->>'size')::BIGINT ELSE NULL END
    ) INTO metadata_json
    FROM storage.objects
    WHERE name = file_path AND bucket_id = bucket_id_alias
    LIMIT 1;
  END IF;
  
  RETURN metadata_json;
END;
$$;

-- Add appropriate comment
COMMENT ON FUNCTION public.get_storage_object_metadata IS 'Gets the full metadata of a storage object by path and optional bucket_id'; 