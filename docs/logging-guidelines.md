# Structured Logging Guidelines

This document provides guidelines for using the structured logging system in our application. Consistent logging practices help with debugging, monitoring, and understanding application behavior.

## Key Principles

1. **Structured over unstructured**: Use structured logging with separate context objects rather than embedding variables in strings.
2. **Consistent patterns**: Use the same patterns throughout the codebase.
3. **Appropriate levels**: Use the right log level for different types of information.
4. **Context-rich**: Include relevant context with each log entry.

## Log Levels

- **ERROR**: For errors that affect functionality and require attention.
- **WARN**: For concerning situations that don't necessarily break functionality.
- **INFO**: For important operational events that should be visible in normal operation.
- **DEBUG**: For detailed information useful during development and troubleshooting.

## Basic Usage

Import the logger in your files:

```typescript
import { logger } from '@/lib/logging';
```

### Simple Logging

```typescript
logger.info('User logged in');
logger.error('Failed to process request');
```

### Structured Logging with Context

```typescript
// GOOD: Structured logging with context separation
logger.info('User logged in', { userId, email });
logger.error('Operation failed', { operationId, status });

// BAD: Embedding variables in the message
logger.info(`User ${userId} logged in with email ${email}`);
```

### Error Logging

For error handling, use the `logError` helper:

```typescript
import { logError } from '@/lib/logging';

try {
  // Operation
} catch (error) {
  logError('Failed to fetch data', error, { userId, requestId });
  
  // Then handle the error appropriately
  return errorResponse;
}
```

This captures the error message, stack trace, and additional context.

## Best Practices

### 1. Message Format

Write clear, concise messages that explain what happened, not how it happened:

```typescript
// GOOD: Clear, action-oriented
logger.info('Payment processed', { amount, userId });

// BAD: Unclear or too detailed
logger.info('The payment was successfully processed after verification');
```

### 2. Context Data

Include relevant context, but avoid including sensitive information:

```typescript
// GOOD: Relevant context
logger.info('User updated profile', { userId, updatedFields: ['name', 'avatar'] });

// BAD: Sensitive data or too much information
logger.info('User updated profile', { userId, password, fullUserObject });
```

### 3. Error Handling

Always include the original error object when logging errors:

```typescript
// GOOD: With proper error object
try {
  await apiCall();
} catch (error) {
  logError('API call failed', error, { endpoint });
}

// BAD: Losing error information
try {
  await apiCall();
} catch (error) {
  logger.error('API call failed: ' + error.message);
}
```

### 4. Component/Feature Context

Add component or feature identifiers for better filtering:

```typescript
logger.info('Subscription check completed', { 
  component: 'SubscriptionManager',
  userId,
  hasActiveSubscription
});
```

## Migration from Console.log

When migrating from `console.log` statements:

1. Replace with the appropriate log level:
   - `console.log` → `logger.info` or `logger.debug`
   - `console.error` → `logger.error`
   - `console.warn` → `logger.warn`

2. Separate the message from context data:

```typescript
// From this:
console.log(`User ${userId} performed action ${action}`);

// To this:
logger.info('User performed action', { userId, action });
```

3. For error logging, use the `logError` helper:

```typescript
// From this:
console.error('Error processing request:', error);

// To this:
logError('Error processing request', error, { requestId });
```

## Environment Configuration

- In development, DEBUG level logs are enabled by default
- In production, INFO level and above are enabled by default
- Log levels can be configured via the `LOG_LEVEL` environment variable

## Tools

Use the logger migration script to help identify console.log statements that need to be converted:

```bash
node utils/logger-migration.js
``` 