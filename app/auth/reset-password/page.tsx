'use client';

import AuthForm from '../components/auth-form';
import { logger } from '@/lib/logging';

export default function ResetPasswordPage() {
  logger.debug('Rendering reset password page');
  return <AuthForm mode="reset-password" />;
} 