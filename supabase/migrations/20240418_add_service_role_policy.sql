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