-- Drop all existing policies on plans table
DO $$
BEGIN
    -- Drop all existing policies
    DROP POLICY IF EXISTS "Users can view their own plans" ON plans;
    DROP POLICY IF EXISTS "Users can insert their own plans" ON plans;
    DROP POLICY IF EXISTS "Users can update their own plans" ON plans;
    DROP POLICY IF EXISTS "Users can delete their own plans" ON plans;
    DROP POLICY IF EXISTS "Service role can do everything" ON plans;
END $$;

-- Recreate policies with proper permissions
-- First, ensure RLS is enabled
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows the service role to do everything
CREATE POLICY "Service role can do everything"
    ON plans
    USING (true)
    WITH CHECK (true);

-- Create policies for authenticated users
CREATE POLICY "Users can view their own plans"
    ON plans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans"
    ON plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans"
    ON plans FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans"
    ON plans FOR DELETE
    USING (auth.uid() = user_id);

-- Force RLS to ensure it's enforced
ALTER TABLE plans FORCE ROW LEVEL SECURITY; 