import { stripe } from './stripe';
import { logger } from './logger';
import Stripe from 'stripe';
import { getBaseUrl } from '@/utils/url';

// Define the event types we want to subscribe to
export const STRIPE_EVENT_TYPES: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
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

/**
 * Registers a webhook endpoint with Stripe if not in localhost environment
 * @returns Promise<void>
 */
export async function registerWebhookEndpoint(): Promise<void> {
  const baseUrl = await getBaseUrl();
  
  // Skip registration if we're in localhost
  if (baseUrl.includes('localhost')) {
    logger.warn('Skipping Stripe webhook registration in localhost environment');
    return;
  }

  try {
    // Get existing webhook endpoints
    const webhooks = await stripe.webhookEndpoints.list();
    
    // Check if we already have a webhook endpoint for this URL
    const existingWebhook = webhooks.data.find(
      webhook => webhook.url === `${baseUrl}/api/webhooks/stripe`
    );

    if (existingWebhook) {
      logger.info('Stripe webhook endpoint already exists', {
        webhookId: existingWebhook.id,
        url: existingWebhook.url
      });
      return;
    }

    // Create new webhook endpoint
    const webhook = await stripe.webhookEndpoints.create({
      url: `${baseUrl}/api/webhooks/stripe`,
      enabled_events: STRIPE_EVENT_TYPES,
      description: 'CarePlan Studio webhook endpoint'
    });

    logger.info('Successfully registered Stripe webhook endpoint', {
      webhookId: webhook.id,
      url: webhook.url,
      events: webhook.enabled_events
    });
  } catch (error) {
    logger.error('Failed to register Stripe webhook endpoint', { error });
    throw error;
  }
} 