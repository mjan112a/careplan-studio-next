# AI Interactions

The AI Interactions system logs and tracks all AI model interactions in the application, providing comprehensive observability, analytics, and debugging capabilities. This documentation describes the implementation and usage of this feature.

## Overview

The system captures detailed information about each AI interaction, including:

- Request and response payloads
- Performance metrics
- Error information
- User context
- File metadata

This data is stored in a dedicated `ai_interactions` table in our Postgres database.

## Database Schema

The `ai_interactions` table stores the following information for each AI interaction:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier (Primary Key) |
| `timestamp` | TIMESTAMPTZ | When the request was made |
| `request` | JSONB | Full request payload sent to the AI model |
| `response` | JSONB | Full response payload from the AI model (if successful) |
| `latency_ms` | INTEGER | Time taken for the AI call in milliseconds |
| `error_code` | TEXT | Error code if the call failed |
| `error_message` | TEXT | Error message if the call failed |
| `model_name` | TEXT | Name of the AI model used (e.g., 'gpt-4', 'claude-3') |
| `user_id` | UUID | ID of the user who initiated the request |
| `file_metadata` | JSONB | Metadata about any files sent with the request |
| `status` | TEXT | Status of the interaction ('success', 'error') |
| `prompt_hash` | TEXT | Hash of the prompt for deduplication/analytics |
| `ip_address` | INET | IP address of the requester |

### Indexes

- `idx_ai_interactions_user_id`: For querying by user
- `idx_ai_interactions_timestamp`: For time-based queries (DESC order)

## Usage

### Logging an AI Interaction

```typescript
import { logAIInteraction } from '@/lib/ai/logging';

async function makeAIRequest(prompt: string, userId: string) {
  const startTime = Date.now();
  try {
    const response = await aiModel.complete(prompt);
    
    await logAIInteraction({
      request: { prompt },
      response: response.data,
      latency_ms: Date.now() - startTime,
      model_name: 'claude-3',
      user_id: userId,
      status: 'success'
    });
    
    return response;
  } catch (error) {
    await logAIInteraction({
      request: { prompt },
      error_code: error.code,
      error_message: error.message,
      latency_ms: Date.now() - startTime,
      model_name: 'claude-3',
      user_id: userId,
      status: 'error'
    });
    throw error;
  }
}
```

### Querying Interactions

```typescript
import { getAIInteractions } from '@/lib/ai/queries';

// Get recent interactions for a user
const userInteractions = await getAIInteractions({
  userId,
  limit: 10,
  orderBy: 'timestamp',
  order: 'desc'
});

// Get failed interactions in a time window
const failedInteractions = await getAIInteractions({
  status: 'error',
  startTime: startDate,
  endTime: endDate
});
```

## Privacy and Security

The AI Interactions system implements several privacy and security measures:

1. **Data Retention**: Interactions are retained according to our data retention policy
2. **PII Handling**: Personal Identifiable Information in requests/responses should be redacted before logging
3. **Access Control**: Access to the interactions data is restricted based on user roles
4. **Encryption**: Sensitive data in JSONB fields can be encrypted if required

## Monitoring and Analytics

The stored interactions data enables:

1. **Usage Analytics**
   - Request volumes by model/user
   - Average response times
   - Error rates

2. **Cost Tracking**
   - Model usage by user/feature
   - Token consumption metrics

3. **Error Analysis**
   - Common error patterns
   - Model reliability metrics

4. **Performance Monitoring**
   - Latency trends
   - Success rates
   - Geographic distribution of requests

## Implementation Details

### Database Setup

```sql
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  request JSONB NOT NULL,
  response JSONB,
  latency_ms INTEGER,
  error_code TEXT,
  error_message TEXT,
  model_name TEXT,
  user_id UUID,
  file_metadata JSONB,
  status TEXT NOT NULL DEFAULT 'success',
  prompt_hash TEXT,
  ip_address INET
);

CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_timestamp ON ai_interactions(timestamp DESC);
```
