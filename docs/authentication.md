# Authentication System Documentation

## Overview

Our authentication system is built using Supabase Auth with Next.js App Router, providing a secure and scalable solution for user authentication. The system is designed to work with server-side rendering (SSR) and follows best practices for security and user experience.

## Architecture

### Core Components

- `lib/auth/` - Core authentication functionality
  - `auth-service.ts` - Main authentication service with core operations
  - `auth-state.ts` - Session management and auth state handling
  - `auth-retry.ts` - Retry mechanism for auth operations
  - `auth-errors.ts` - Centralized error handling
  - `types.ts` - TypeScript definitions
  - `constants.ts` - Configuration and constants

### Features

- Email/Password Authentication
- Password Reset Flow
- Session Management
- Error Handling with Retries
- Type-safe Implementation
- Comprehensive Logging

## Authentication Flow

### Sign Up

1. User submits registration form
2. Account created with Supabase
3. Verification email sent
4. User verifies email to activate account

### Sign In

1. User submits credentials
2. Authenticated against Supabase
3. Session established
4. Redirected to dashboard

### Password Reset

1. User requests password reset
2. Reset link sent via email
3. User clicks link and sets new password
4. Session invalidated and user redirected to sign in

## Security Features

- CSRF Protection
- Session Refresh
- Secure Password Handling
- Rate Limiting
- Error Masking

## Error Handling

- Comprehensive error types
- Retry mechanism for transient failures
- User-friendly error messages
- Detailed logging for debugging

## Usage Example

```typescript
import { AuthService } from '@/lib/auth';

// Sign in
await AuthService.signInWithPassword(email, password);

// Sign up
await AuthService.signUp(email, password, {
  data: { full_name: fullName }
});

// Reset password
await AuthService.resetPassword(email);
```

## Best Practices

1. Always use the AuthService for auth operations
2. Handle errors appropriately using AuthError types
3. Use the retry mechanism for network operations
4. Log authentication events for auditing
5. Validate user session state server-side

## Configuration

Authentication settings are managed through environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

## Logging

The system uses structured logging with context:

```typescript
logger.info('Auth operation', { 
  userId: user.id,
  action: 'sign-in'
});
```
