# Terminal Colors for Server Logging

Our server logging is designed to use colors to make logs more readable, but in some terminal environments, these colors may not appear by default. This document explains how to enable them.

## The Issue

Chalk (v5.x) in our project is an ESM-only module, which can cause issues with color support in certain Node.js environments. Additionally, many terminals or CI/CD environments may not show colors by default.

## How to Enable Colors

### Method 1: Use the Built-in Script

We've added a convenience script to run the development server with colors forced on:

```sh
npm run dev:colors
```

This is equivalent to running:

```sh
FORCE_COLOR=3 FORCE_LOGGER_COLORS=true next dev
```

### Method 2: Environment Variables

You can set these environment variables to enable colors:

- `FORCE_COLOR=3` - Forces full RGB color support
- `FORCE_LOGGER_COLORS=true` - Specifically tells our logger to use colors

### Method 3: Create a Local Environment File

Create a `.env.local` file in your project root with:

```
FORCE_LOGGER_COLORS=true
FORCE_COLOR=3
```

### Method 4: Terminal Configuration

Some terminals may need configuration:

- **Windows Command Prompt**: Consider using Windows Terminal instead
- **VS Code Terminal**: Make sure "Terminal > Integrated: Color Scheme" is set
- **GitHub Actions/CI**: Set `FORCE_COLOR=3` in your GitHub Actions workflow

## Testing Logger Color Support

To test if your terminal and environment support logger color output, use the comprehensive logger test script:

### Option 1: Compile and Run with tsc + node

1. Compile the script to JavaScript:
   ```sh
   npx tsc scripts/test-logger.ts --outDir dist/
   ```
2. Run the compiled script:
   ```sh
   node dist/scripts/test-logger.js
   ```

You can also set environment variables to force or disable color:
```sh
FORCE_COLOR=3 FORCE_LOGGER_COLORS=true node dist/scripts/test-logger.js
FORCE_COLOR=0 node dist/scripts/test-logger.js
```

This script will print sample logs at all levels, with context, stack traces, and sanitization. It will also print instructions for forcing or disabling color output.

> **Note:** The old `scripts/force-colors.js` script is now obsolete. Use `scripts/test-logger.ts` for all logger color and formatting tests.

## How Our Colorization Works

Our server logger implementation in `lib/logging/server.ts` uses direct ANSI color codes instead of relying on Chalk. This approach is more reliable across different environments.

## Common Issues

1. **No colors in Docker container**: Add `ENV FORCE_COLOR=3` to your Dockerfile
2. **No colors in CI/CD**: Set the environment variable in your CI configuration
3. **No colors in production logs**: Production logs intentionally don't use colors for better log aggregation

## References

- [ANSI color codes](https://en.wikipedia.org/wiki/ANSI_escape_code#Colors)
- [Chalk documentation](https://github.com/chalk/chalk)
- [Terminal color detection algorithm](https://github.com/chalk/supports-color) 