# CarePlan Studio

A modern web application for creating, managing, and simulating long-term care plans. CarePlan Studio helps healthcare professionals and financial advisors model care scenarios, generate comprehensive policy documents, and make data-driven decisions for patient care planning.

## Key Features

- Interactive care plan simulation
- Policy document generation and management
- AI-powered assistance for care planning
- Secure authentication and data management
- Real-time collaboration tools

## Getting Started

### Prerequisites

- Node.js 18.17.0 or higher
- pnpm package manager
- Supabase account for backend services

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-org/careplan-studio-next.git
   cd careplan-studio-next
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   ```bash
   cp env.example .env
   ```

   Edit `.env` with your configuration values.

4. Start the development server:

   ```bash
   pnpm dev
   ```

The application will be available at `http://localhost:3000`.

## Environment Setup

The following environment variables are required:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
GEMINI_API_KEY=your_gemini_api_key

# Stripe Configuration (for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Development

### Running Tests

```bash
pnpm test
```

### Building for Production

```bash
pnpm build
```

### Linting and Type Checking

```bash
pnpm lint
pnpm type-check
```

## Architecture and Technical Details

### Technology Stack

- **Frontend**: Next.js 14 with App Router and React 19
- **Backend**: Node.js Runtime with Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth with SSR
- **UI Framework**: Radix UI primitives with Tailwind CSS
- **Package Manager**: pnpm with strict versioning

### Key Design Decisions

#### Runtime Environment

- Node.js Runtime for all server-side code
- Full Node.js API access
- No Edge Runtime specific patterns

#### Authentication

- Supabase SSR authentication
- Server-side auth state management
- Row-level security implementation

#### Logging System

- Structured logging with context support
- Multiple log levels (DEBUG, INFO, WARN, ERROR)
- Environment-based configuration
- Stack trace support for error logging

#### Code Organization

- `/app` - Next.js App Router pages and API routes
- `/components` - Reusable React components
- `/lib` - Core library code and utilities
- `/docs` - Documentation and ADRs
- `/types` - TypeScript type definitions
- `/utils` - Helper functions and utilities

### Development Standards

#### TypeScript and Module Standards

- Strict TypeScript configuration
- ES Module patterns
- Path aliases with '@/' prefix
- Type-safe imports and exports

#### React and Component Patterns

- Server Components by default
- Client Components marked with 'use client'
- Next.js built-in optimizations
- Responsive design patterns

#### Error Handling

- Structured error logging
- Context-aware error messages
- Full stack trace capture
- Standardized error patterns

## License

MIT License - See [LICENSE](LICENSE) for details.
