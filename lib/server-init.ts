import { registerWebhookEndpoint } from './stripe';
import { logger } from './logger';

let isInitialized = false;

export async function initializeServer() {
  if (isInitialized) {
    return;
  }

  try {
    // Register Stripe webhook endpoint
    await registerWebhookEndpoint();
    
    isInitialized = true;
    logger.info('Server initialization completed successfully');
  } catch (error) {
    logger.error('Failed to initialize server', { error });
    throw error;
  }
} 