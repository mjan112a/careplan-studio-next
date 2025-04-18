/**
 * Stripe Integration Module
 * 
 * This module provides a centralized interface for all Stripe-related functionality.
 * It includes client initialization, logging, customer management, subscription handling,
 * webhook registration, and testing utilities.
 * 
 * Key Components:
 * 
 * 1. Stripe Client Initialization
 *    - Creates and configures the Stripe client with proper API version
 *    - Sets up request and response logging with sensitive data sanitization
 * 
 * 2. Customer Management
 *    - checkCustomerSubscriptionStatus: Retrieves and processes a customer's subscription details
 *    - getCustomerIdByEmail: Finds a customer by their email address
 *    - authenticateAndCheckCustomerStatus: Authenticates a customer and checks their subscription status
 * 
 * 3. Subscription Handling
 *    - getStripeSession: Creates a Stripe checkout session for subscriptions
 * 
 * 4. Webhook Management
 *    - STRIPE_EVENT_TYPES: Defines the webhook events to subscribe to
 *    - registerWebhookEndpoint: Registers a webhook endpoint with Stripe
 * 
 * 5. Testing Utilities
 *    - testStripeConnection: Tests the Stripe API connection and event listeners
 * 
 * Usage:
 * - Import the functions and types you need from this module
 * - The Stripe client is automatically initialized and configured
 * - All API requests and responses are automatically logged with sensitive data sanitized
 */

import Stripe from 'stripe';
import { logger } from './logger';
import { getBaseUrl } from '@/utils/url';

// Log environment variables (without exposing the actual key)
logger.debug('stripe: Initializing Stripe client', {
  hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
  apiVersion: '2025-03-31.basil',
  nodeEnv: process.env.NODE_ENV
});

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

// Create a custom request handler to log all requests
const requestHandler = async (request: any) => {
  logger.debug('stripe: API Request', {
    method: request.method,
    path: request.path,
    params: sanitizeParams(request.params),
    options: sanitizeOptions(request.options)
  });
  
  // Continue with the request
  return request;
};

// Create a custom response handler to log all responses
const responseHandler = async (response: any) => {
  try {
    logger.debug('stripe: API Response', {
      method: response?.method || 'unknown',
      path: response?.path || 'unknown',
      status: response?.statusCode || 'unknown',
      response: sanitizeResponse(response?.body)
    });
  } catch (error) {
    logger.error('stripe: Error logging response', {
      error: error instanceof Error ? error.message : 'Unknown error',
      response: response
    });
  }
  
  // Continue with the response
  return response;
};

// Create the Stripe instance with custom request and response handlers
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.basil',
  typescript: true,
  appInfo: {
    name: 'CarePlan Studio',
    version: '1.0.0',
  },
});

// Add request and response handlers
stripe.on('request', requestHandler);
stripe.on('response', responseHandler);

// Helper function to sanitize sensitive data from params
function sanitizeParams(params?: Record<string, any>): Record<string, any> | undefined {
  if (!params) return undefined;

  const sanitized = { ...params };
  const sensitiveFields = ['card', 'number', 'cvc', 'exp_month', 'exp_year'];

  // Remove sensitive card data
  if (sanitized.card) {
    sanitized.card = '[REDACTED]';
  }

  // Remove other sensitive fields
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

// Helper function to sanitize sensitive data from options
function sanitizeOptions(options?: Record<string, any>): Record<string, any> | undefined {
  if (!options) return undefined;

  const sanitized = { ...options };
  // Remove any sensitive options
  delete sanitized.apiKey;
  delete sanitized.idempotencyKey;
  delete sanitized.stripeAccount;
  return sanitized;
}

// Helper function to sanitize sensitive data from response
function sanitizeResponse(response: any): any {
  if (!response) return response;

  const sanitized = { ...response };
  const sensitiveFields = ['number', 'cvc', 'exp_month', 'exp_year'];

  // Remove sensitive card data
  if (sanitized.card) {
    sanitized.card = '[REDACTED]';
  }

  // Remove other sensitive fields
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Interface representing a customer's subscription status
 */
export interface CustomerSubscriptionStatus {
  hasActiveSubscription: boolean;
  isInTrial: boolean;
  trialEndsAt: number | null;
  subscriptionEndsAt: number | null;
  products: {
    [productId: string]: {
      name: string;
      active: boolean;
      trialEndsAt: number | null;
      subscriptionEndsAt: number | null;
    };
  };
  customerId: string | null;
}

/**
 * Checks a customer's standing with Stripe and establishes flags for their subscription status
 * @param customerId - The Stripe customer ID
 * @returns Promise<CustomerSubscriptionStatus> - The customer's subscription status
 */
export async function checkCustomerSubscriptionStatus(
  customerId: string
): Promise<CustomerSubscriptionStatus> {
  try {
    logger.info('stripe: Checking customer subscription status', { customerId });
    
    // Initialize the status object
    const status: CustomerSubscriptionStatus = {
      hasActiveSubscription: false,
      isInTrial: false,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      products: {},
      customerId
    };

    // Retrieve the customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all', // Include all subscription statuses
      expand: ['data.default_payment_method']
    });

    if (subscriptions.data.length === 0) {
      logger.info('stripe: Customer has no subscriptions', { customerId });
      return status;
    }

    // Process each subscription
    for (const subscription of subscriptions.data) {
      const isActive = subscription.status === 'active';
      const isTrialing = subscription.status === 'trialing';
      
      // Update overall status
      if (isActive || isTrialing) {
        status.hasActiveSubscription = true;
      }
      
      if (isTrialing) {
        status.isInTrial = true;
        status.trialEndsAt = subscription.trial_end;
      }
      
      // Use type assertion to access current_period_end
      const currentPeriodEnd = (subscription as any).current_period_end;
      if (currentPeriodEnd) {
        status.subscriptionEndsAt = currentPeriodEnd;
      }

      // Process each subscription item (product)
      for (const item of subscription.items.data) {
        const price = item.price;
        if (!price) continue;
        
        // Get the price ID
        const priceId = typeof price === 'string' ? price : price.id;
        
        // Fetch the price details to get the product ID
        const priceDetails = await stripe.prices.retrieve(priceId, {
          expand: ['product']
        });
        
        // Get the product ID and name
        let productId = 'unknown';
        let productName = 'Unknown Product';
        
        if (priceDetails.product) {
          if (typeof priceDetails.product === 'string') {
            productId = priceDetails.product;
          } else {
            productId = priceDetails.product.id;
            // Use type guard to safely access product name
            if (isActiveProduct(priceDetails.product)) {
              productName = priceDetails.product.name || 'Unknown Product';
            }
          }
        }
        
        // Update product status
        status.products[productId] = {
          name: productName,
          active: isActive || isTrialing,
          trialEndsAt: isTrialing ? subscription.trial_end : null,
          subscriptionEndsAt: currentPeriodEnd || null
        };
      }
    }

    logger.info('stripe: Customer subscription status retrieved', { 
      customerId,
      hasActiveSubscription: status.hasActiveSubscription,
      isInTrial: status.isInTrial,
      products: Object.entries(status.products).map(([id, product]) => ({
        id,
        name: product.name,
        active: product.active
      }))
    });

    return status;
  } catch (error) {
    logger.error('stripe: Error checking customer subscription status', { 
      customerId, 
      error 
    });
    throw error;
  }
}

/**
 * Type guard to check if a product is active
 */
function isActiveProduct(product: any): product is Stripe.Product {
  return product && typeof product === 'object' && 'id' in product;
}

/**
 * Retrieves a customer by their email address
 * @param email - The customer's email address
 * @returns Promise<string | null> - The customer ID if found, null otherwise
 */
export async function getCustomerIdByEmail(email: string): Promise<string | null> {
  try {
    logger.debug('stripe: Looking up customer by email', { email });
    
    const customers = await stripe.customers.list({
      email,
      limit: 1
    });

    if (customers.data.length === 0) {
      logger.debug('stripe: No customer found with email', { email });
      return null;
    }

    logger.debug('stripe: Customer found by email', { 
      email, 
      customerId: customers.data[0].id 
    });
    
    return customers.data[0].id;
  } catch (error) {
    logger.error('stripe: Error retrieving customer by email', { email, error });
    throw error;
  }
}

/**
 * Authenticates a customer and checks their subscription status
 * @param email - The customer's email address
 * @returns Promise<CustomerSubscriptionStatus> - The customer's subscription status
 */
export async function authenticateAndCheckCustomerStatus(
  email: string
): Promise<CustomerSubscriptionStatus> {
  try {
    logger.info('stripe: Authenticating and checking customer status', { email });
    
    // First, try to find the customer by email
    let customerId = await getCustomerIdByEmail(email);
    
    // If customer doesn't exist, create a new one
    if (!customerId) {
      logger.info('stripe: Creating new customer', { email });
      
      const customer = await stripe.customers.create({
        email,
        metadata: {
          source: 'careplan-studio'
        }
      });
      
      customerId = customer.id;
      logger.info('stripe: Created new Stripe customer', { customerId, email });
    }
    
    // Check the customer's subscription status
    return await checkCustomerSubscriptionStatus(customerId);
  } catch (error) {
    logger.error('stripe: Error authenticating and checking customer status', { email, error });
    throw error;
  }
}

/**
 * Creates a Stripe checkout session for subscription
 * @param params - Parameters for creating the checkout session
 * @returns Promise<Stripe.Checkout.Session> - The created checkout session
 */
export const getStripeSession = async (params: {
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) => {
  logger.debug('stripe: Creating checkout session with params:', {
    priceId: params.priceId,
    userId: params.userId,
    successUrl: params.successUrl,
    cancelUrl: params.cancelUrl
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.userId,
  });

  logger.debug('stripe: Checkout session created:', {
    sessionId: session.id,
    clientReferenceId: session.client_reference_id,
    customerId: session.customer,
    subscriptionId: session.subscription
  });

  return session;
};

// Test API call to verify event listeners
if (process.env.NODE_ENV !== 'production') {
  // Only run in development
  (async () => {
    try {
      logger.info('stripe: Testing Stripe API connection');
      // Make a simple API call that should trigger the event listeners
      const balance = await stripe.balance.retrieve();
      logger.info('stripe: Test API call successful', { balance });
    } catch (error) {
      logger.error('stripe: Test API call failed', { error });
    }
  })();
}

/**
 * Function to test Stripe API connection and event listeners
 * This can be called directly to test the Stripe connection
 */
export async function testStripeConnection(): Promise<void> {
  try {
    logger.info('stripe: Testing Stripe API connection');
    
    // Make a simple API call that should trigger the event listeners
    const balance = await stripe.balance.retrieve();
    
    logger.info('stripe: Test API call successful', { balance });
  } catch (error) {
    logger.error('stripe: Test API call failed', { error });
    throw error;
  }
}

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
  // in dev, we should be using the stripe cli to forward events to localhost
  if (baseUrl.includes('localhost')) {
    logger.warn('stripe: Skipping Stripe webhook registration in localhost environment');
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
      logger.info('stripe: Webhook endpoint already exists', {
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

    logger.info('stripe: Successfully registered webhook endpoint', {
      webhookId: webhook.id,
      url: webhook.url,
      events: webhook.enabled_events
    });
  } catch (error) {
    logger.error('stripe: Failed to register webhook endpoint', { error });
    throw error;
  }
} 