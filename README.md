# CarePlan Studio

A modern web application for managing care plans and patient information.

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## TODO

### Authentication Configuration
- [ ] Configure auth session timeout to 20 minutes in Supabase
  - This setting is only available in the Pro plan
  - When upgrading to Pro, set the session duration to 20 minutes in:
    - Supabase Dashboard > Authentication > Settings > Session Duration
    - Or via the Management API using the `updateConfig` endpoint

## License

MIT 