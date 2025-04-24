-- Create policy_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS policy_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    file_id UUID NOT NULL,
    original_path TEXT NOT NULL,
    processed_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    original_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for faster lookups if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_policy_documents_client_id') THEN
        CREATE INDEX idx_policy_documents_client_id ON policy_documents(client_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_policy_documents_user_id') THEN
        CREATE INDEX idx_policy_documents_user_id ON policy_documents(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_policy_documents_file_id') THEN
        CREATE INDEX idx_policy_documents_file_id ON policy_documents(file_id);
    END IF;
END $$;

-- Enable Row Level Security if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'policy_documents' AND rowsecurity = true) THEN
        ALTER TABLE policy_documents ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policies if they exist (to avoid conflicts on re-run)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own policy documents" ON policy_documents;
    DROP POLICY IF EXISTS "Users can insert their own policy documents" ON policy_documents;
    DROP POLICY IF EXISTS "Users can update their own policy documents" ON policy_documents;
    DROP POLICY IF EXISTS "Users can delete their own policy documents" ON policy_documents;
    DROP POLICY IF EXISTS "Service role can do everything" ON policy_documents;
EXCEPTION
    WHEN undefined_table THEN
        -- Handle case when table doesn't exist
        RAISE NOTICE 'Table policy_documents does not exist yet. Skipping policy drops.';
    WHEN undefined_object THEN
        -- Handle case when policy doesn't exist
        RAISE NOTICE 'Some policies do not exist yet. Continuing.';
END $$;

-- Create policies
CREATE POLICY "Users can view their own policy documents"
    ON policy_documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own policy documents"
    ON policy_documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own policy documents"
    ON policy_documents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own policy documents"
    ON policy_documents FOR DELETE
    USING (auth.uid() = user_id);

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_policy_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_policy_documents_updated_at') THEN
        CREATE TRIGGER update_policy_documents_updated_at
            BEFORE UPDATE ON policy_documents
            FOR EACH ROW EXECUTE FUNCTION update_policy_documents_updated_at();
    END IF;
END $$;

-- Add a comment to the table
COMMENT ON TABLE policy_documents IS 'Stores information about policy documents uploaded by users';

-- Force RLS and add service role policy
DO $$
BEGIN
    -- Force Row Level Security
    ALTER TABLE policy_documents FORCE ROW LEVEL SECURITY;
    
    -- Create service role policy
    CREATE POLICY "Service role can do everything"
        ON policy_documents
        USING (true)
        WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN
        -- Policy already exists, so update it
        DROP POLICY IF EXISTS "Service role can do everything" ON policy_documents;
        CREATE POLICY "Service role can do everything"
            ON policy_documents
            USING (true)
            WITH CHECK (true);
END $$; 