# ADR: AI Interactions Table

## Status
Proposed

## Context
We want to log all AI interactions (requests and responses) for observability, analytics, and debugging. This includes storing the request, response, latency, error information, and relevant metadata in a single table. The table will support querying by user and time window, and will be used for both auditing and analytics.

## Decision
We will create a table called `ai_interactions` with the following fields:

- `id` (UUID, PK): Unique identifier for each interaction.
- `timestamp` (TIMESTAMPTZ): When the request was made.
- `request` (JSONB): The full request payload sent to the AI model.
- `response` (JSONB, nullable): The full response payload from the AI model.
- `latency_ms` (INTEGER): Time taken for the AI call in milliseconds.
- `error_code` (TEXT, nullable): Error code if the call failed.
- `error_message` (TEXT, nullable): Error message if the call failed.
- `model_name` (TEXT): The name of the AI model used.
- `user_id` (UUID, nullable): The user who initiated the request, if available.
- `file_metadata` (JSONB, nullable): Metadata about any file sent with the request.
- `status` (TEXT): 'success', 'error', etc.
- `prompt_hash` (TEXT, nullable): Hash of the prompt for deduplication/analytics.
- `ip_address` (INET, nullable): IP address of the requester, if available.

## Rationale
- **Observability:** Enables tracking and debugging of AI usage and errors.
- **Analytics:** Supports analysis of usage patterns, latency, and error rates.
- **Security/Audit:** Allows for auditing of user actions and requests.
- **Scalability:** JSONB fields allow flexible storage of request/response payloads.
- **Privacy:** Sensitive data can be redacted or encrypted as needed.

## Consequences
- Increased storage requirements due to large payloads.
- Need for data retention and privacy policies.
- Indexing on `user_id` and `timestamp` for efficient queries.

---

## Example Schema (Postgres)

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