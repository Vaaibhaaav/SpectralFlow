package storage

import (
	"context"
	"fmt"
	"spectraflow/internal/models"
)

func (db *DatabaseEngine) InsertTrace(ctx context.Context, t models.TraceEvent) error {
	query := `
		INSERT INTO traces (
			id, app_id, session_id, timestamp, model, 
			prompt, response, prompt_tokens, completion_tokens, 
			latency_ms, cost_usd, metadata
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
	`

	// Use pool execution directly; pgx automatically optimizes prepared statement lifecycles under the hood
	_, err := db.Pool.Exec(ctx, query,
		t.ID,
		t.AppID,
		t.SessionID,
		t.Timestamp,
		t.Model,
		t.Prompt,
		t.Response,
		t.PromptTokens,
		t.CompletionTokens,
		t.LatencyMs,
		t.CostUSD,
		t.Metadata,
	)

	if err != nil {
		return fmt.Errorf("failed to insert trace frame into TimescaleDB: %w", err)
	}

	return nil
}