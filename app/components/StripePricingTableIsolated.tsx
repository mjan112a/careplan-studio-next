'use client';

import { useEffect, useState, useRef } from 'react';
import { logger } from '@/lib/logging';
import { getBaseUrl } from '@/utils/url';
import './StripePricingTable.css';

// Declare the custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'pricing-table-id': string;
        'publishable-key': string;
        'success-url'?: string;
        'client-reference-id'?: string;
        'customer-email'?: string;
      }, HTMLElement>;
    }
  }
}

interface StripePricingTableIsolatedProps {
  userId?: string | null;
  userEmail?: string | null;
}

export default function StripePricingTableIsolated({ 
  userId = null, 
  userEmail = null 
}: StripePricingTableIsolatedProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);
  
  // Get the publishable key from environment variables
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51R8lEzJtL7Msij8lJvt2O1lT9vjEKpLOOiGu7jjLIZKRDrZyZQXhbbIw2Y1JDS72r9ceSy5TpmVvU1w8zSrZpFFz00iZQa6M7D';
  
  // Get the pricing table ID from environment variables
  const pricingTableId = process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID || 'prctbl_1RCllHJtL7Msij8lkooRsSwC';

  // Get the base URL using the utility function
  const baseUrl = getBaseUrl();
  
  // Construct the success URL with the session ID parameter
  const successUrl = `${baseUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`;

  // Load the Stripe script
  useEffect(() => {
    // Only run this once
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;
    
    const loadStripe = () => {
      try {
        // Create script element
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/pricing-table.js';
        script.async = true;
        
        // Set up load handler
        script.onload = () => {
          logger.info('Stripe script loaded via manual injection');
          
          // Check if custom element is defined immediately
          setTimeout(() => {
            try {
              if (typeof customElements !== 'undefined' && customElements.get('stripe-pricing-table')) {
                logger.info('Stripe custom element available');
                setIsReady(true);
              } else {
                // Fallback option - force render anyway after a timeout
                logger.warn('Stripe custom element not found, forcing render');
                setIsReady(true);
              }
            } catch (checkError) {
              logger.error('Error checking custom elements', { error: checkError });
              setIsReady(true); // Try rendering anyway
            }
          }, 500);
        };
        
        // Set up error handler
        script.onerror = () => {
          const errorMsg = 'Failed to load Stripe script';
          logger.error(errorMsg);
          setError(errorMsg);
        };
        
        // Add to document
        document.body.appendChild(script);
        
        return () => {
          // Clean up
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
        };
      } catch (err) {
        const errorMsg = 'Error setting up Stripe script';
        logger.error(errorMsg, { error: err });
        setError(errorMsg);
        return () => {};
      }
    };
    
    // Start loading
    const cleanup = loadStripe();
    
    // Fallback - if script doesn't load within 5 seconds, show error
    const fallbackTimer = setTimeout(() => {
      if (!isReady && !error) {
        setError('Stripe script load timed out. Please refresh the page.');
      }
    }, 5000);
    
    return () => {
      cleanup();
      clearTimeout(fallbackTimer);
    };
  }, [isReady, error]);

  // Create and manage the Stripe pricing table element
  useEffect(() => {
    if (!isReady || !containerRef.current) return;
    
    try {
      // Clear the container first
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      
      // Create the custom element
      const stripeTable = document.createElement('stripe-pricing-table');
      stripeTable.setAttribute('pricing-table-id', pricingTableId);
      stripeTable.setAttribute('publishable-key', publishableKey);
      stripeTable.setAttribute('success-url', successUrl);
      
      if (userId) {
        stripeTable.setAttribute('client-reference-id', userId);
      }
      
      if (userEmail) {
        stripeTable.setAttribute('customer-email', userEmail);
      }
      
      // Append to the container
      containerRef.current.appendChild(stripeTable);
    } catch (err) {
      logger.error('Error creating Stripe pricing table element', { error: err });
    }
  }, [isReady, pricingTableId, publishableKey, successUrl, userId, userEmail]);
  
  // Render function
  let content;
  if (error) {
    content = (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-red-600">
          <p>Error loading subscription plans. Please try refreshing the page.</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  } else if (!isReady) {
    content = (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nt-blue mx-auto"></div>
          <p className="mt-4 text-nt-gray">Loading subscription plans...</p>
        </div>
      </div>
    );
  } else {
    content = <div ref={containerRef} className="stripe-pricing-table-container" />;
  }
  
  return content;
} 