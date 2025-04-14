import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.basil', // Updated to latest supported version
  typescript: true,
});

export const getStripeSession = async (params: {
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) => {
  console.log('Creating Stripe checkout session with params:', {
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

  console.log('Stripe checkout session created:', {
    sessionId: session.id,
    clientReferenceId: session.client_reference_id,
    customerId: session.customer,
    subscriptionId: session.subscription
  });

  return session;
}; 