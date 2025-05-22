#!/usr/bin/env ts-node
/**
 * Comprehensive Logger Test Script
 *
 * Usage:
 *   ts-node scripts/test-logger.ts
 *   # or after build:
 *   node dist/scripts/test-logger.js
 *
 * This script tests:
 *   - All log levels (error, warn, info, debug)
 *   - Context (flat, nested, sensitive fields)
 *   - Stack traces
 *   - Log level filtering
 *   - Color and no-color modes (via env vars)
 *   - Sanitization of sensitive data
 *
 * It does NOT use Chalk or any other color library.
 * It uses only the project's logger (lib/logging/server.ts).
 */

import { logger, ServerLogger } from '../lib/logging/server';
import { LogLevel } from '../lib/logging/types';

function printHeader(title: string) {
  // ANSI cyan bright underline
  console.log(`\n\x1b[36m\x1b[1m\x1b[4m${title}\x1b[0m`);
}

function printEnvInfo() {
  printHeader('Environment Info');
  console.log(`  FORCE_COLOR = ${process.env.FORCE_COLOR || 'not set'}`);
  console.log(`  FORCE_LOGGER_COLORS = ${process.env.FORCE_LOGGER_COLORS || 'not set'}`);
  console.log(`  NODE_ENV = ${process.env.NODE_ENV || 'not set'}`);
  console.log(`  LOG_LEVEL = ${process.env.LOG_LEVEL || 'not set'}`);
  console.log(`  Terminal isTTY = ${process.stdout.isTTY}`);
}

function testAllLogLevels() {
  printHeader('Test: All Log Levels');
  logger.error('This is an error log', { code: 500, context: 'error-test' });
  logger.warn('This is a warning log', { code: 400, context: 'warn-test' });
  logger.info('This is an info log', { code: 200, context: 'info-test' });
  logger.debug('This is a debug log', { code: 100, context: 'debug-test' });
}

function testContextAndSanitization() {
  printHeader('Test: Context and Sanitization');
  logger.info('Flat context', { user: 'alice', action: 'login', token: 'abcdef1234567890abcdef1234567890' });
  logger.info('Nested context', {
    user: {
      id: 42,
      email: 'alice@example.com',
      authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },
    request: {
      headers: {
        cookie: 'session=abcdefghijklmnopqrstuvwxyz12345678901234'
      }
    }
  });
  logger.info('Sensitive fields', {
    password: 'supersecretpassword123',
    apiKey: 'sk_test_abcdefghijklmnopqrstuvwxyz12345678901234',
    value: 'verylongsensitivedatathatshouldbetruncatedhere'
  });
}

function testErrorWithStack() {
  printHeader('Test: Error with Stack Trace');
  try {
    throw new Error('Simulated error for stack trace test');
  } catch (error) {
    logger.error('Caught an error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: { operation: 'stack-trace-test' }
    });
  }
}

function testLogLevelFiltering() {
  printHeader('Test: Log Level Filtering');
  const tempLogger = new ServerLogger({ defaultLevel: LogLevel.WARN });
  tempLogger.error('Should appear (error)', { test: 'log-level' });
  tempLogger.warn('Should appear (warn)', { test: 'log-level' });
  tempLogger.info('Should NOT appear (info)', { test: 'log-level' });
  tempLogger.debug('Should NOT appear (debug)', { test: 'log-level' });
  console.log('  (Only error and warn logs should be visible above)');
}

function printColorInstructions() {
  printHeader('Instructions: Forcing Color Output');
  console.log('To force color output, compile and run the script as follows:');
  console.log('  npx tsc scripts/test-logger.ts --outDir dist/');
  console.log('  FORCE_COLOR=3 FORCE_LOGGER_COLORS=true node dist/scripts/test-logger.js');
  console.log('Or add these to your .env.local:');
  console.log('  FORCE_COLOR=3');
  console.log('  FORCE_LOGGER_COLORS=true');
  console.log('To disable color, run:');
  console.log('  FORCE_COLOR=0 node dist/scripts/test-logger.js');
}

function main() {
  printHeader('Comprehensive Logger Test Script');
  printEnvInfo();
  testAllLogLevels();
  testContextAndSanitization();
  testErrorWithStack();
  testLogLevelFiltering();
  printColorInstructions();
  printHeader('Test Complete');
  console.log('Review the output above to verify:');
  console.log('  - All log levels are colorized and formatted');
  console.log('  - Sensitive fields are truncated');
  console.log('  - Stack traces are shown for errors');
  console.log('  - Log level filtering works');
  console.log('  - Color output can be forced or disabled');
}

main(); 