'use client';

import AuthForm from '../components/auth-form';
import { logger } from '@/lib/logging';

export default function UpdatePasswordPage() {
  logger.debug('Rendering update password page');
  return <AuthForm mode="update-password" />;
} 