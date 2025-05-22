-- Drop all existing policies on policy_documents table
DO $$
BEGIN
    -- Drop all existing policies
    DROP POLICY IF EXISTS "Users can view their own policy documents" ON policy_documents;
    DROP POLICY IF EXISTS "Users can insert their own policy documents" ON policy_documents;
    DROP POLICY IF EXISTS "Users can update their own policy documents" ON policy_documents;
    DROP POLICY IF EXISTS "Users can delete their own policy documents" ON policy_documents;
    DROP POLICY IF EXISTS "Service role can do everything" ON policy_documents;
END $$;

-- Recreate policies with proper permissions
-- First, ensure RLS is enabled
ALTER TABLE policy_documents ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows the service role to do everything
CREATE POLICY "Service role can do everything"
    ON policy_documents
    USING (true)
    WITH CHECK (true);

-- Create policies for authenticated users
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

-- Force RLS to ensure it's enforced
ALTER TABLE policy_documents FORCE ROW LEVEL SECURITY; 