-- Create a function to generate a human-readable log of the user_stripe_history table
CREATE OR REPLACE FUNCTION get_stripe_history_log(p_user_email TEXT DEFAULT NULL)
RETURNS TABLE (
    log_entry TEXT
) AS $$
DECLARE
    v_query TEXT;
    v_result RECORD;
BEGIN
    -- Build the query based on whether a user email filter is provided
    IF p_user_email IS NULL THEN
        v_query := '
            SELECT 
                ush.id,
                ush.user_id,
                p.email AS user_email,
                p.full_name AS user_name,
                ush.stripe_customer_id,
                ush.stripe_event_id,
                ush.stripe_event_type,
                ush.stripe_subscription_id,
                ush.stripe_invoice_id,
                ush.stripe_payment_intent_id,
                ush.stripe_charge_id,
                ush.amount,
                ush.currency,
                ush.status,
                ush.metadata,
                ush.created_at
            FROM 
                user_stripe_history ush
            JOIN 
                profiles p ON ush.user_id = p.id
            ORDER BY 
                ush.created_at DESC
        ';
    ELSE
        v_query := '
            SELECT 
                ush.id,
                ush.user_id,
                p.email AS user_email,
                p.full_name AS user_name,
                ush.stripe_customer_id,
                ush.stripe_event_id,
                ush.stripe_event_type,
                ush.stripe_subscription_id,
                ush.stripe_invoice_id,
                ush.stripe_payment_intent_id,
                ush.stripe_charge_id,
                ush.amount,
                ush.currency,
                ush.status,
                ush.metadata,
                ush.created_at
            FROM 
                user_stripe_history ush
            JOIN 
                profiles p ON ush.user_id = p.id
            WHERE 
                p.email = $1
            ORDER BY 
                ush.created_at DESC
        ';
    END IF;

    -- Execute the query and format the results
    FOR v_result IN EXECUTE v_query USING p_user_email
    LOOP
        -- Format the log entry
        log_entry := format(
            '%s | %s (%s) | %s | Amount: %s %s | Status: %s | %s | %s | %s | %s | %s | Metadata: %s',
            to_char(v_result.created_at, 'YYYY-MM-DD HH24:MI:SS'),
            v_result.user_name,
            v_result.user_email,
            v_result.stripe_event_type,
            COALESCE(v_result.amount::TEXT, 'N/A'),
            COALESCE(v_result.currency, 'N/A'),
            COALESCE(v_result.status, 'N/A'),
            COALESCE(v_result.stripe_customer_id, 'N/A'),
            COALESCE(v_result.stripe_subscription_id, 'N/A'),
            COALESCE(v_result.stripe_invoice_id, 'N/A'),
            COALESCE(v_result.stripe_payment_intent_id, 'N/A'),
            COALESCE(v_result.stripe_charge_id, 'N/A'),
            COALESCE(v_result.metadata::TEXT, '{}')
        );
        
        -- Return the formatted log entry
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a comment to the function
COMMENT ON FUNCTION get_stripe_history_log IS 'Generates a human-readable log of the user_stripe_history table with an optional user_email filter';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_stripe_history_log TO authenticated; 