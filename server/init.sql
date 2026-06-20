CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS traces (
    id UUID NOT NULL,
    app_id UUID NOT NULL,
    session_id TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    model TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    prompt_tokens INT NOT NULL,
    completion_tokens INT NOT NULL,
    latency_ms INT NOT NULL,
    cost_usd NUMERIC(10,6) NOT NULL,
    metadata JSONB,
    PRIMARY KEY (id, timestamp) 
);

SELECT create_hypertable('traces', 'timestamp', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS prompt_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL,
    trace_id UUID NOT NULL,
    trace_timestamp TIMESTAMPTZ NOT NULL,
    embedding VECTOR(768), 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS prompt_embeddings_hnsw_idx 
ON prompt_embeddings USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS evals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL,
    trace_id UUID NOT NULL,
    trace_timestamp TIMESTAMPTZ NOT NULL,
    scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    faithfulness FLOAT NOT NULL,
    toxicity FLOAT NOT NULL,
    judge_model TEXT NOT NULL,
    summary TEXT
);

CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    app_id UUID NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    payload TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_trace_stats
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', timestamp)            AS bucket,
    app_id,
    count(*)                                    AS trace_count,
    avg(cost_usd)                               AS avg_cost,
    avg(latency_ms)                             AS avg_latency,
    sum(cost_usd)                               AS total_cost,
    sum(prompt_tokens) + sum(completion_tokens) AS total_tokens_used
FROM traces
GROUP BY bucket, app_id;