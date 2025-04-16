-- Check if plans table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    featured_document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster lookups if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_plans_user_id') THEN
        CREATE INDEX idx_plans_user_id ON plans(user_id);
    END IF;
END $$;

-- Enable Row Level Security if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'plans' AND rowsecurity = true) THEN
        ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plans' AND policyname = 'Users can view their own plans') THEN
        CREATE POLICY "Users can view their own plans"
            ON plans FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plans' AND policyname = 'Users can insert their own plans') THEN
        CREATE POLICY "Users can insert their own plans"
            ON plans FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plans' AND policyname = 'Users can update their own plans') THEN
        CREATE POLICY "Users can update their own plans"
            ON plans FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plans' AND policyname = 'Users can delete their own plans') THEN
        CREATE POLICY "Users can delete their own plans"
            ON plans FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_plans_updated_at') THEN
        CREATE TRIGGER update_plans_updated_at
            BEFORE UPDATE ON plans
            FOR EACH ROW EXECUTE FUNCTION update_plans_updated_at();
    END IF;
END $$;

-- Add a comment to the table
COMMENT ON TABLE plans IS 'Stores user plans';

-- Check if policy_documents table exists and create it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'policy_documents') THEN
        -- Create policy_documents table
        CREATE TABLE policy_documents (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            plan_id UUID REFERENCES plans(id),
            user_id UUID REFERENCES auth.users(id) NOT NULL,
            file_id UUID NOT NULL,
            original_path TEXT NOT NULL,
            processed_path TEXT NOT NULL,
            file_type TEXT NOT NULL,
            original_name TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Create indexes for faster lookups
        CREATE INDEX idx_policy_documents_plan_id ON policy_documents(plan_id);
        CREATE INDEX idx_policy_documents_user_id ON policy_documents(user_id);
        CREATE INDEX idx_policy_documents_file_id ON policy_documents(file_id);

        -- Enable Row Level Security
        ALTER TABLE policy_documents ENABLE ROW LEVEL SECURITY;

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

        -- Create function to update updated_at timestamp
        CREATE OR REPLACE FUNCTION update_policy_documents_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = TIMEZONE('utc'::text, NOW());
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create trigger for updating updated_at
        CREATE TRIGGER update_policy_documents_updated_at
            BEFORE UPDATE ON policy_documents
            FOR EACH ROW EXECUTE FUNCTION update_policy_documents_updated_at();

        -- Add a comment to the table
        COMMENT ON TABLE policy_documents IS 'Stores information about policy documents uploaded by users';
    END IF;
END $$;

-- Add a policy for service role to bypass RLS if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'policy_documents' AND policyname = 'Service role can do everything') THEN
        ALTER TABLE policy_documents FORCE ROW LEVEL SECURITY;
        CREATE POLICY "Service role can do everything"
            ON policy_documents
            USING (true)
            WITH CHECK (true);
    END IF;
END $$; 