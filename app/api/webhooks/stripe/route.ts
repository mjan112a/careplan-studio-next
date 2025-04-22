import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { logger } from '@/lib/logging';
import { supabase } from '@/utils/supabase';

// This is your Stripe webhook secret for testing your endpoint locally.
// You'll get this when you run the stripe listen command
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Define the event types we handle
const LOGGED_EVENT_TYPES = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
  'charge.succeeded',
  'charge.failed',
  'customer.created',
  'customer.updated',
  'invoice.created',
  'invoice.finalized',
  'customer.subscription.created'
];

export async function POST(req: Request) {
  // Get the raw body as text
  const body = await req.text();
  
  // Get the signature from headers
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');
  
  // Log webhook receipt at INFO level
  logger.info('Webhook received', {
    signature: sig ? 'Present' : 'Missing',
    secret: endpointSecret ? 'Present' : 'Missing'
  });
  
  if (!sig || !endpointSecret) {
    logger.error('Missing stripe signature or webhook secret');
    return NextResponse.json(
      { error: 'Missing stripe signature or webhook secret' },
      { status: 400 }
    );
  }

  try {
    // Parse the body as JSON
    const event = JSON.parse(body);
    const eventData = event.data.object;
    
    // Safely access subscription_details if it exists
    const subscription = eventData.parent?.subscription_details || null;
    
    // Extract client_reference_id from the event data
    const clientReferenceId = eventData.client_reference_id;
    
    
    // Only log detailed event information for events we handle
    if (LOGGED_EVENT_TYPES.includes(event.type)) {
    // If client_reference_id is blank, log the entire event
      // Log event processing at INFO level

      logger.warn('[][][]   Webhook event received!!', {
        eventType: event.type,
        fullEvent: event,
        eventData: eventData,
        subscription: subscription
      });

    } else {
      // For unhandled events, just log the event type
      logger.debug('[][][]   Received Unlogged webhook event', {
        type: event.type,
        id: event.id
      });
    }
    
    // Determine the user ID from the event data
    let userId = null;
    let stripeCustomerId = null;
    let stripeSubscriptionId = null;
    let stripeInvoiceId = null;
    let stripePaymentIntentId = null;
    let stripeChargeId = null;
    let amount = null;
    let currency = null;
    let status = null;
    let description = null;
    let hostedInvoiceUrl = null;
    let invoicePdf = null;
    
    // Extract data based on event type
    logger.debug('[][][]   Event Start', { eventType: event.type });
    switch (event.type) {
      case 'checkout.session.completed':
        const session = eventData;
        stripeCustomerId = session.customer;
        stripeSubscriptionId = session.subscription;
        stripePaymentIntentId = session.payment_intent;
        status = session.payment_status;
        description = `Checkout completed for ${session.amount_total / 100} ${session.currency.toUpperCase()}`;
        
        // Get user ID from client_reference_id if available
        if (session.client_reference_id) {
          userId = session.client_reference_id;
        } else {
          // Try to find user by Stripe customer ID
          if (stripeCustomerId) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('stripe_customer_id', stripeCustomerId)
              .single();
            
            if (profile) {
              userId = profile.id;
              logger.debug('Found user ID from stripe_customer_id', { userId });
            } else {
              logger.debug('No profile found with stripe_customer_id', { stripeCustomerId });
            }
          } else {
            logger.debug('No stripe_customer_id found in checkout.session.completed event');
          }
        }
        break;
        
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = eventData;
        stripeCustomerId = subscription.customer;
        stripeSubscriptionId = subscription.id;
        status = subscription.status;
        description = `Subscription ${event.type === 'customer.subscription.updated' ? 'updated' : 'deleted'}: ${subscription.plan.nickname || subscription.plan.id}`;
        
        // Try to find user by Stripe customer ID
        if (stripeCustomerId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', stripeCustomerId)
            .single();
          
          if (profile) {
            userId = profile.id;
            logger.debug('Found user ID from stripe_customer_id', { userId });
          } else {
            logger.debug('No profile found with stripe_customer_id', { stripeCustomerId });
          }
        } else {
          logger.debug('No stripe_customer_id found in subscription event');
        }
        break;
        
      case 'invoice.paid':
      case 'invoice.payment_failed':
        const invoice = eventData;
        stripeCustomerId = invoice.customer;
        stripeSubscriptionId = invoice.subscription;
        stripeInvoiceId = invoice.id;
        stripePaymentIntentId = invoice.payment_intent;
        amount = invoice.amount_paid / 100;
        currency = invoice.currency.toUpperCase();
        status = invoice.status;
        description = `Invoice ${event.type === 'invoice.paid' ? 'paid' : 'payment failed'}: ${amount} ${currency}`;
        
        // Extract invoice URLs
        hostedInvoiceUrl = invoice.hosted_invoice_url;
        invoicePdf = invoice.invoice_pdf;
        
        // Log invoice URLs if available
        if (hostedInvoiceUrl || invoicePdf) {
          logger.debug('Invoice URLs found', { 
            hostedInvoiceUrl: hostedInvoiceUrl ? 'Present' : 'Not available',
            invoicePdf: invoicePdf ? 'Present' : 'Not available'
          });
        }
        
        // Try to find user by Stripe customer ID
        if (stripeCustomerId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', stripeCustomerId)
            .single();
          
          if (profile) {
            userId = profile.id;
            logger.debug('Found user ID from stripe_customer_id', { userId });
          } else {
            logger.debug('No profile found with stripe_customer_id', { stripeCustomerId });
          }
        } else {
          logger.debug('No stripe_customer_id found in invoice event');
        }
        break;
        
      case 'charge.succeeded':
      case 'charge.failed':
        const charge = eventData;
        stripeCustomerId = charge.customer;
        stripePaymentIntentId = charge.payment_intent;
        stripeChargeId = charge.id;
        amount = charge.amount / 100;
        currency = charge.currency.toUpperCase();
        status = charge.status;
        description = `Charge ${event.type === 'charge.succeeded' ? 'succeeded' : 'failed'}: ${amount} ${currency}`;
        
        // Try to find user by Stripe customer ID
        if (stripeCustomerId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', stripeCustomerId)
            .single();
          
          if (profile) {
            userId = profile.id;
            logger.debug('Found user ID from stripe_customer_id', { userId });
          } else {
            logger.debug('No profile found with stripe_customer_id', { stripeCustomerId });
          }
        } else {
          logger.debug('No stripe_customer_id found in charge event');
        }
        break;
        
      case 'customer.created':
      case 'customer.updated':
        // For customer events, we need to look up the user by email
        const customer = eventData;
        stripeCustomerId = customer.id;
        
        // Extract additional customer fields
        const customerFields: Record<string, any> = {
          stripe_address_city: customer.address?.city || null,
          stripe_address_country: customer.address?.country || null,
          stripe_address_line1: customer.address?.line1 || null,
          stripe_address_line2: customer.address?.line2 || null,
          stripe_address_postal_code: customer.address?.postal_code || null,
          stripe_address_state: customer.address?.state || null,
          stripe_email: customer.email || null,
          stripe_phone: customer.phone || null,
          stripe_delinquent: customer.delinquent || false,
          stripe_created_date: customer.created ? new Date(customer.created * 1000).toISOString() : null,
          stripe_name: customer.name || null
        };
        
        logger.debug('Extracted Stripe customer fields', { 
          customerId: stripeCustomerId,
          hasEmail: !!customer.email,
          hasAddress: !!customer.address,
          hasPhone: !!customer.phone,
          hasName: !!customer.name
        });
        
        if (customer.email) {
          logger.debug('Looking up user by email', { email: customer.email });
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', customer.email)
            .single();
          
          if (profile) {
            userId = profile.id;
            logger.debug('Found user ID from email', { userId });
            
            // Update the profile with the Stripe customer ID and additional fields
            const { error } = await supabase
              .from('profiles')
              .update({ 
                stripe_customer_id: stripeCustomerId,
                ...customerFields
              })
              .eq('id', userId);
            
            if (error) {
              logger.error('Error updating profile with Stripe customer data', { error });
            } else {
              logger.debug('Updated profile with Stripe customer data', { 
                userId,
                stripeCustomerId,
                fieldsUpdated: Object.keys(customerFields).filter(key => customerFields[key] !== null)
              });
            }
          } else {
            logger.debug('No profile found with email', { email: customer.email });
          }
        } else {
          logger.debug('No email found in customer event');
        }
        break;
        
      default:
        // For unhandled events, just return success without processing
        return NextResponse.json({ received: true });
    }
    logger.debug('[][][]   Event End', { eventType: event.type });

    // Store the event in the database if we have a user ID
    if (userId) {
      try {
        const { data, error } = await supabase.rpc('insert_stripe_event', {
          p_user_id: userId,
          p_stripe_customer_id: stripeCustomerId,
          p_stripe_event_id: event.id,
          p_stripe_event_type: event.type,
          p_stripe_subscription_id: stripeSubscriptionId,
          p_stripe_invoice_id: stripeInvoiceId,
          p_stripe_payment_intent_id: stripePaymentIntentId,
          p_stripe_charge_id: stripeChargeId,
          p_amount: amount,
          p_currency: currency,
          p_status: status,
          p_description: description,
          p_metadata: eventData,
          p_hosted_invoice_url: hostedInvoiceUrl,
          p_invoice_pdf: invoicePdf
        });
        
        if (error) {
          logger.error('Error storing stripe event', { error });
        } else {
          logger.info('Stripe event stored successfully', {
            eventId: event.id,
            userId,
            type: event.type,
            clientReferenceId: clientReferenceId || 'Not set'
          });
        }
      } catch (error) {
        logger.error('Error calling insert_stripe_event', { error });
      }
    } else {
      logger.warn('Could not determine user ID for stripe event', {
        eventId: event.id,
        type: event.type,
        customerId: stripeCustomerId,
        clientReferenceId: clientReferenceId || 'Not set'
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook', { error });
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
} 