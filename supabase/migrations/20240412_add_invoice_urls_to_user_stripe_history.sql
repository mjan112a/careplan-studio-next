-- Add hosted_invoice_url and invoice_pdf fields to user_stripe_history table
ALTER TABLE user_stripe_history
ADD COLUMN hosted_invoice_url TEXT,
ADD COLUMN invoice_pdf TEXT;

-- Update the insert_stripe_event function to include the new fields
CREATE OR REPLACE FUNCTION insert_stripe_event(
  p_user_id UUID,
  p_stripe_customer_id TEXT,
  p_stripe_event_id TEXT,
  p_stripe_event_type TEXT,
  p_stripe_subscription_id TEXT,
  p_stripe_invoice_id TEXT,
  p_stripe_payment_intent_id TEXT,
  p_stripe_charge_id TEXT,
  p_amount NUMERIC,
  p_currency TEXT,
  p_status TEXT,
  p_description TEXT,
  p_metadata JSONB,
  p_hosted_invoice_url TEXT DEFAULT NULL,
  p_invoice_pdf TEXT DEFAULT NULL
) RETURNS UUID AS $$
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
    metadata,
    hosted_invoice_url,
    invoice_pdf
  ) VALUES (
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
    p_metadata,
    p_hosted_invoice_url,
    p_invoice_pdf
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 