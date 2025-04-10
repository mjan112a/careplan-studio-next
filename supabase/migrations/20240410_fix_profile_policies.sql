-- Add INSERT policy for profiles
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Add a policy for service role to bypass RLS
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
CREATE POLICY "Service role can do everything"
    ON profiles
    USING (true)
    WITH CHECK (true); 