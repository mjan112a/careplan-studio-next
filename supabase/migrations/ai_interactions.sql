CREATE TABLE IF NOT EXISTS ai_interactions (
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

CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_timestamp ON ai_interactions(timestamp DESC); 