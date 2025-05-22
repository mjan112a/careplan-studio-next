-- Add Stripe customer fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_address_city TEXT,
ADD COLUMN IF NOT EXISTS stripe_address_country TEXT,
ADD COLUMN IF NOT EXISTS stripe_address_line1 TEXT,
ADD COLUMN IF NOT EXISTS stripe_address_line2 TEXT,
ADD COLUMN IF NOT EXISTS stripe_address_postal_code TEXT,
ADD COLUMN IF NOT EXISTS stripe_address_state TEXT,
ADD COLUMN IF NOT EXISTS stripe_email TEXT,
ADD COLUMN IF NOT EXISTS stripe_phone TEXT,
ADD COLUMN IF NOT EXISTS stripe_delinquent BOOLEAN,
ADD COLUMN IF NOT EXISTS stripe_created_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_name TEXT;

-- Create an index on stripe_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_email ON profiles(stripe_email);

-- Add a comment to the table to document the Stripe fields
COMMENT ON TABLE profiles IS 'User profiles with Stripe customer information'; 