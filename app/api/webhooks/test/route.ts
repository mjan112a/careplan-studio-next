import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  // Don't expose the full secret in logs
  const secretPreview = webhookSecret 
    ? `${webhookSecret.substring(0, 5)}...${webhookSecret.substring(webhookSecret.length - 5)}` 
    : 'Not set';
  
  logger.info('Webhook secret test', { 
    secretPreview,
    isSet: !!webhookSecret,
    length: webhookSecret ? webhookSecret.length : 0
  });
  
  return NextResponse.json({ 
    status: 'ok',
    webhookSecretSet: !!webhookSecret,
    secretLength: webhookSecret ? webhookSecret.length : 0,
    secretPreview
  });
} 