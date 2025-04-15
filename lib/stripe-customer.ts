import { stripe } from './stripe';
import { logger } from './logger';
import Stripe from 'stripe';

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
 * Type guard to check if a product is a Stripe.Product (not a DeletedProduct)
 */
function isActiveProduct(product: Stripe.Product | Stripe.DeletedProduct): product is Stripe.Product {
  return !('deleted' in product);
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
    logger.info('Checking customer subscription status', { customerId });
    
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
    // We'll use a simpler expand parameter to avoid the 4-level limit error
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all', // Include all subscription statuses
      expand: ['data.default_payment_method']
    });

    if (subscriptions.data.length === 0) {
      logger.info('Customer has no subscriptions', { customerId });
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

    logger.info('Customer subscription status retrieved', { 
      customerId,
      hasActiveSubscription: status.hasActiveSubscription,
      isInTrial: status.isInTrial,
      productsCount: Object.keys(status.products).length
    });

    return status;
  } catch (error) {
    logger.error('Error checking customer subscription status', { 
      customerId, 
      error 
    });
    throw error;
  }
}

/**
 * Retrieves a customer by their email address
 * @param email - The customer's email address
 * @returns Promise<string | null> - The customer ID if found, null otherwise
 */
export async function getCustomerIdByEmail(email: string): Promise<string | null> {
  try {
    const customers = await stripe.customers.list({
      email,
      limit: 1
    });

    if (customers.data.length === 0) {
      return null;
    }

    return customers.data[0].id;
  } catch (error) {
    logger.error('Error retrieving customer by email', { email, error });
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
    // First, try to find the customer by email
    let customerId = await getCustomerIdByEmail(email);
    
    // If customer doesn't exist, create a new one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          source: 'careplan-studio'
        }
      });
      customerId = customer.id;
      logger.info('Created new Stripe customer', { customerId, email });
    }
    
    // Check the customer's subscription status
    return await checkCustomerSubscriptionStatus(customerId);
  } catch (error) {
    logger.error('Error authenticating and checking customer status', { email, error });
    throw error;
  }
} 