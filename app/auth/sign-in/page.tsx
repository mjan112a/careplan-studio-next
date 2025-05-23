'use client';

import AuthForm from '../components/auth-form';
import { logger } from '@/lib/logging';

export default function SignInPage() {
  logger.debug('Rendering sign-in page');
  return <AuthForm mode="sign-in" />;
} 