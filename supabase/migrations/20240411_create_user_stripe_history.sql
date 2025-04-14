-- Create user_stripe_history table to track Stripe events
CREATE TABLE user_stripe_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    stripe_customer_id TEXT,
    stripe_event_id TEXT NOT NULL,
    stripe_event_type TEXT NOT NULL,
    stripe_subscription_id TEXT,
    stripe_invoice_id TEXT,
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,
    amount DECIMAL(10, 2),
    currency TEXT,
    status TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster lookups by user_id
CREATE INDEX idx_user_stripe_history_user_id ON user_stripe_history(user_id);

-- Create index for faster lookups by stripe_event_id
CREATE INDEX idx_user_stripe_history_stripe_event_id ON user_stripe_history(stripe_event_id);

-- Create index for faster lookups by stripe_customer_id
CREATE INDEX idx_user_stripe_history_stripe_customer_id ON user_stripe_history(stripe_customer_id);

-- Create index for faster lookups by stripe_subscription_id
CREATE INDEX idx_user_stripe_history_stripe_subscription_id ON user_stripe_history(stripe_subscription_id);

-- Enable Row Level Security
ALTER TABLE user_stripe_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own stripe history"
    ON user_stripe_history FOR SELECT
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
CREATE TRIGGER update_user_stripe_history_updated_at
    BEFORE UPDATE ON user_stripe_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to insert stripe event into history
CREATE OR REPLACE FUNCTION insert_stripe_event(
    p_user_id UUID,
    p_stripe_customer_id TEXT,
    p_stripe_event_id TEXT,
    p_stripe_event_type TEXT,
    p_stripe_subscription_id TEXT,
    p_stripe_invoice_id TEXT,
    p_stripe_payment_intent_id TEXT,
    p_stripe_charge_id TEXT,
    p_amount DECIMAL,
    p_currency TEXT,
    p_status TEXT,
    p_description TEXT,
    p_metadata JSONB
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO user_stripe_history (
        user_id,
        stripe_customer_id,
        stripe_event_id,
        stripe_event_type,
        stripe_subscription_id,
        stripe_invoice_id,
        stripe_payment_intent_id,
        stripe_charge_id,
        amount,
        currency,
        status,
        description,
        metadata
    )
    VALUES (
        p_user_id,
        p_stripe_customer_id,
        p_stripe_event_id,
        p_stripe_event_type,
        p_stripe_subscription_id,
        p_stripe_invoice_id,
        p_stripe_payment_intent_id,
        p_stripe_charge_id,
        p_amount,
        p_currency,
        p_status,
        p_description,
        p_metadata
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 