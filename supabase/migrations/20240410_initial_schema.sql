-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Create enum for subscription levels
CREATE TYPE subscription_level AS ENUM ('free', 'starter', 'pro', 'team');

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    role user_role DEFAULT 'user' NOT NULL,
    full_name TEXT,
    email TEXT,
    company TEXT,
    phone TEXT,
    subscription_level subscription_level DEFAULT 'free' NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Set up email templates directory
CREATE TABLE email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default email templates
INSERT INTO email_templates (name, subject, body) VALUES
    ('verification', 'Verify your email address', 
    '<h1>Welcome to CarePlan Studio!</h1>
    <p>Please verify your email address by clicking the link below:</p>
    <p><a href="{{ .ConfirmationURL }}">Verify Email Address</a></p>
    <p>If you did not create an account, you can safely ignore this email.</p>'),

    ('reset_password', 'Reset your password',
    '<h1>Reset Your Password</h1>
    <p>You have requested to reset your password. Click the link below to proceed:</p>
    <p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
    <p>If you did not request a password reset, you can safely ignore this email.</p>');

-- Note: Session duration should be configured in the Supabase dashboard
-- or through the API, as ALTER SYSTEM cannot be run in a transaction block 