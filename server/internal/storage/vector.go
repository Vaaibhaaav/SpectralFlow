package storage

import (
	"context"
	"fmt"
	"time"

	"github.com/pgvector/pgvector-go"
)

func (db *DatabaseEngine) InsertPromptEmbedings(ctx context.Context, traceId string, timestamp time.Time, embeddings []float64, appID string) error {
	query := `
		INSERT INTO prompt_embeddings (trace_id, trace_timestamp, embedding,app_id) 
		VALUES ($1, $2, $3 , $4);
	`
	float32Array := make([]float32, len(embeddings))
	for i, v := range embeddings {
		float32Array[i] = float32(v)
	}

	vector := pgvector.NewVector(float32Array)

	_, err := db.Pool.Exec(ctx, query, traceId, timestamp, vector, appID)
	if err != nil {
		return fmt.Errorf("Failed to commit to vector embeddings with the error %v as : ", err)
	}
	return nil
}
