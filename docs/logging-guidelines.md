# Logging Guidelines

## Architecture Decision Record (ADR)

### Status

Accepted

### Context and Decision

We use Node.js Runtime instead of Edge Runtime with a standardized logging system that provides:

- Full Node.js API access
- Standardized logging with context support
- ANSI-based colorful output
- Full stack trace support
- Structured logging patterns

### Benefits

- Better debugging capabilities with context
- Consistent logging patterns across the application
- Improved error tracing with stack information
- Better compatibility with npm packages
- Simpler development experience

### Trade-offs

- Slightly longer cold starts compared to Edge Runtime
- Not using Edge Runtime's global distribution benefits
- Higher memory usage per instance

## Logger Interface

```typescript
interface ILogger {
  setLogLevel(level: LogLevel): void;
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

enum LogLevels {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}
```

The log level can be configured via the LOG_LEVEL environment variable, defaulting to INFO if not set.

## Key Principles

1. **Structured over unstructured**: Use structured logging with separate context objects rather than embedding variables in strings
2. **Consistent patterns**: Use the same patterns throughout the codebase
3. **Appropriate levels**: Use the right log level for different types of information
4. **Context-rich**: Include relevant context with each log entry

## Log Levels and Usage

### ERROR Level

For errors that affect functionality and require attention:

- API failures
- Database errors
- Authentication failures
- Unhandled exceptions

### WARN Level

For potentially harmful situations that don't prevent operation:

- Deprecated feature usage
- Resource constraints
- Unexpected but recoverable conditions

### INFO Level

For important operational events that should be visible in normal operation:

- User actions (login, logout, profile updates)
- Important state changes
- Successful completion of significant operations
- API responses for important endpoints

### DEBUG Level

For detailed information useful during development and troubleshooting:

- Function entry/exit points
- Parameter values
- Intermediate calculation results
- Detailed state information

## Context Best Practices

When adding context to log messages:

1. Always include the module name for traceability
2. Include key input parameters that would help with debugging
3. For API calls, include request IDs, user IDs, and relevant identifiers
4. For database operations, include table names and record IDs
5. For authentication, include user IDs but never include passwords or tokens
6. When logging errors, include the error message and stack trace when available

Example context structure:

```typescript
{
  module: 'payment-service',  // Always include module
  userId: '123',             // Relevant IDs
  amount: 100,              // Key parameters
  transactionId: 'tx_123',  // Operation-specific IDs
  error?: Error,            // For error logging
  stack?: string            // For error logging
}
```

## Usage Patterns

### Basic Import

```typescript
import { logger } from '@/lib/logging';
```

### Standard Logging Examples

```typescript
// Info logging with context
logger.info('User logged in', { 
  module: 'auth',
  userId,
  loginMethod 
});

// Debug logging for function entry
logger.debug('Processing payment', { 
  module: 'payment-service',
  amount,
  userId 
});

// Warning for deprecated feature
logger.warn('Using deprecated API endpoint', {
  module: 'api',
  endpoint: '/v1/legacy',
  userId
});

// Error logging with full context
logger.error('Payment processing failed', {
  module: 'payment-service',
  amount,
  userId,
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined
});
```

### Error Handling Pattern

```typescript
try {
  // operation
} catch (error) {
  logger.error('Operation failed', {
    module: 'current-module',
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context: { /* relevant operation context */ }
  });
  throw error; // or handle appropriately
}
```

### Middleware Integration

```typescript
export const runtime = 'nodejs';  // Required for all server-side code

export async function middleware(req: NextRequest) {
  try {
    // middleware logic
  } catch (error) {
    logger.error('Middleware error', {
      module: 'middleware',
      error: error instanceof Error ? error.message : String(error),
      path: req.nextUrl.pathname
    });
    // handle error appropriately
  }
}
```

## Color Support

### Enabling Colors

There are several ways to enable color support:

1. **Development Script**:

   ```sh
   npm run dev:colors
   ```

2. **Environment Variables**:

   ```sh
   FORCE_COLOR=3 FORCE_LOGGER_COLORS=true next dev
   ```

3. **Local Environment File** (.env.local):

   ```
   FORCE_LOGGER_COLORS=true
   FORCE_COLOR=3
   ```

### Environment-Specific Behavior

- Development: DEBUG level logs enabled by default
- Production: INFO level and above enabled by default, colors disabled for better log aggregation
- CI/CD: Set `FORCE_COLOR=3` in your CI configuration
- Docker: Add `ENV FORCE_COLOR=3` to your Dockerfile

## Migration from Console.log

When migrating from console.log statements:

1. Replace with appropriate log level:
   - `console.log` → `logger.info` or `logger.debug` depending on significance
   - `console.error` → `logger.error`
   - `console.warn` → `logger.warn`

2. Add structured context:

   ```typescript
   // From this:
   console.log(`User ${userId} performed action ${action}`);

   // To this:
   logger.info('User performed action', { 
     module: 'user-service',
     userId, 
     action 
   });
   ```

3. Add error context:

   ```typescript
   // From this:
   console.error('Error processing request:', error);

   // To this:
   logger.error('Error processing request', {
     module: 'request-handler',
     error: error instanceof Error ? error.message : String(error),
     stack: error instanceof Error ? error.stack : undefined,
     requestId
   });
   ```

## Testing Logger Output

Use the comprehensive logger test script:

```sh
# Compile and run
npx tsc scripts/test-logger.ts --outDir dist/
node dist/scripts/test-logger.js

# With forced colors
FORCE_COLOR=3 FORCE_LOGGER_COLORS=true node dist/scripts/test-logger.js

# Without colors
FORCE_COLOR=0 node dist/scripts/test-logger.js
```
