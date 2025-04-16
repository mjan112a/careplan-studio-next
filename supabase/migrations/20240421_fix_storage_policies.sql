-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    -- Drop all existing policies
    DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
    DROP POLICY IF EXISTS "Users can insert their own files" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
    DROP POLICY IF EXISTS "Service role can do everything" ON storage.objects;
END $$;

-- Create a policy that allows the service role to do everything
CREATE POLICY "Service role can do everything"
    ON storage.objects
    USING (true)
    WITH CHECK (true);

-- Create policies for authenticated users
CREATE POLICY "Users can view their own files"
    ON storage.objects FOR SELECT
    USING (auth.uid() = owner);

CREATE POLICY "Users can insert their own files"
    ON storage.objects FOR INSERT
    WITH CHECK (auth.uid() = owner);

CREATE POLICY "Users can update their own files"
    ON storage.objects FOR UPDATE
    USING (auth.uid() = owner);

CREATE POLICY "Users can delete their own files"
    ON storage.objects FOR DELETE
    USING (auth.uid() = owner);

-- Force RLS to ensure it's enforced
ALTER TABLE storage.objects FORCE ROW LEVEL SECURITY;

-- Create or update bucket policies
DO $$
BEGIN
    -- Create policy-documents-original bucket if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'policy-documents-original') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('policy-documents-original', 'policy-documents-original', false);
    END IF;
    
    -- Create policy-documents-processed bucket if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'policy-documents-processed') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('policy-documents-processed', 'policy-documents-processed', false);
    END IF;
END $$; 