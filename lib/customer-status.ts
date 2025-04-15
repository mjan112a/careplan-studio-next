import { CustomerSubscriptionStatus } from './stripe-customer';

/**
 * Fetches a customer's subscription status from the API
 * @param email - The customer's email address
 * @returns Promise<CustomerSubscriptionStatus> - The customer's subscription status
 */
export async function fetchCustomerStatus(email: string): Promise<CustomerSubscriptionStatus> {
  try {
    const response = await fetch('/api/customer-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch customer status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching customer status:', error);
    throw error;
  }
}

/**
 * Checks if a customer has access to a specific product
 * @param customerStatus - The customer's subscription status
 * @param productId - The ID of the product to check
 * @returns boolean - Whether the customer has access to the product
 */
export function hasProductAccess(
  customerStatus: CustomerSubscriptionStatus,
  productId: string
): boolean {
  // Check if the customer has an active subscription
  if (!customerStatus.hasActiveSubscription) {
    return false;
  }

  // Check if the customer has access to the specific product
  const product = customerStatus.products[productId];
  return !!product && product.active;
}

/**
 * Checks if a customer is in a trial period
 * @param customerStatus - The customer's subscription status
 * @returns boolean - Whether the customer is in a trial period
 */
export function isInTrialPeriod(customerStatus: CustomerSubscriptionStatus): boolean {
  return customerStatus.isInTrial;
}

/**
 * Gets the date when a customer's trial or subscription ends
 * @param customerStatus - The customer's subscription status
 * @param productId - Optional product ID to check a specific product
 * @returns Date | null - The date when the trial or subscription ends, or null if not applicable
 */
export function getExpirationDate(
  customerStatus: CustomerSubscriptionStatus,
  productId?: string
): Date | null {
  // If a product ID is provided, check that specific product
  if (productId) {
    const product = customerStatus.products[productId];
    if (!product) return null;

    // Check trial end date first, then subscription end date
    if (product.trialEndsAt) {
      return new Date(product.trialEndsAt * 1000);
    }
    
    if (product.subscriptionEndsAt) {
      return new Date(product.subscriptionEndsAt * 1000);
    }
    
    return null;
  }

  // Otherwise, check the overall customer status
  if (customerStatus.trialEndsAt) {
    return new Date(customerStatus.trialEndsAt * 1000);
  }
  
  if (customerStatus.subscriptionEndsAt) {
    return new Date(customerStatus.subscriptionEndsAt * 1000);
  }
  
  return null;
} 