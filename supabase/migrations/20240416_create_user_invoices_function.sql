-- Create a function to retrieve paid invoices for a user
CREATE OR REPLACE FUNCTION get_user_invoices(p_user_id UUID)
RETURNS TABLE (
    invoice_id TEXT,
    invoice_date TIMESTAMP WITH TIME ZONE,
    amount DECIMAL(10, 2),
    currency TEXT,
    hosted_invoice_url TEXT,
    invoice_pdf TEXT,
    subscription_id TEXT,
    customer_id TEXT,
    payment_intent_id TEXT,
    charge_id TEXT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ush.stripe_invoice_id AS invoice_id,
        ush.created_at AS invoice_date,
        ush.amount,
        ush.currency,
        ush.hosted_invoice_url,
        ush.invoice_pdf,
        ush.stripe_subscription_id AS subscription_id,
        ush.stripe_customer_id AS customer_id,
        ush.stripe_payment_intent_id AS payment_intent_id,
        ush.stripe_charge_id AS charge_id,
        ush.metadata
    FROM 
        user_stripe_history ush
    WHERE 
        ush.user_id = p_user_id
        AND ush.stripe_event_type = 'invoice.paid'
    ORDER BY 
        ush.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a comment to the function
COMMENT ON FUNCTION get_user_invoices IS 'Retrieves paid invoices for a specific user, formatted for display on a profile page';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_invoices TO authenticated;

-- Create a function to retrieve paid invoices by user email
CREATE OR REPLACE FUNCTION get_user_invoices_by_email(p_user_email TEXT)
RETURNS TABLE (
    invoice_id TEXT,
    invoice_date TIMESTAMP WITH TIME ZONE,
    amount DECIMAL(10, 2),
    currency TEXT,
    hosted_invoice_url TEXT,
    invoice_pdf TEXT,
    subscription_id TEXT,
    customer_id TEXT,
    payment_intent_id TEXT,
    charge_id TEXT,
    metadata JSONB
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user ID from the email
    SELECT id INTO v_user_id
    FROM profiles
    WHERE email = p_user_email;
    
    -- If user found, return their invoices
    IF v_user_id IS NOT NULL THEN
        RETURN QUERY
        SELECT * FROM get_user_invoices(v_user_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a comment to the function
COMMENT ON FUNCTION get_user_invoices_by_email IS 'Retrieves paid invoices for a user by their email address';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_invoices_by_email TO authenticated; 