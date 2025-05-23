'use client';

import AuthForm from '../components/auth-form';
import { logger } from '@/lib/logging';

export default function SignUpPage() {
  logger.debug('Rendering sign-up page');
  return <AuthForm mode="sign-up" />;
} 