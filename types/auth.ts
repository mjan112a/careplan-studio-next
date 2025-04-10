export type UserRole = 'admin' | 'user';
export type SubscriptionLevel = 'free' | 'starter' | 'pro' | 'team';

export interface UserProfile {
  id: string;
  role: UserRole;
  full_name: string | null;
  company: string | null;
  phone: string | null;
  subscription_level: SubscriptionLevel;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  email_verified: boolean;
  role: UserRole;
  profile: UserProfile | null;
}

export interface AuthError {
  message: string;
  status?: number;
} 