-- Check if clients table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster lookups if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_clients_user_id') THEN
        CREATE INDEX idx_clients_user_id ON clients(user_id);
    END IF;
END $$;

-- Enable Row Level Security if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'clients' AND rowsecurity = true) THEN
        ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policies if they exist (to avoid conflicts on re-run)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
    DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
    DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
    DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;
    DROP POLICY IF EXISTS "Service role can do everything" ON clients;
EXCEPTION
    WHEN undefined_table THEN
        -- Handle case when table doesn't exist
        RAISE NOTICE 'Table clients does not exist yet. Skipping policy drops.';
    WHEN undefined_object THEN
        -- Handle case when policy doesn't exist
        RAISE NOTICE 'Some policies do not exist yet. Continuing.';
END $$;

-- Create policies
CREATE POLICY "Users can view their own clients"
    ON clients FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients"
    ON clients FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
    ON clients FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
    ON clients FOR DELETE
    USING (auth.uid() = user_id);

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clients_updated_at') THEN
        CREATE TRIGGER update_clients_updated_at
            BEFORE UPDATE ON clients
            FOR EACH ROW EXECUTE FUNCTION update_clients_updated_at();
    END IF;
END $$;

-- Add a comment to the table
COMMENT ON TABLE clients IS 'Stores user clients'; 