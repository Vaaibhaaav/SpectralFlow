package agents

import (
	"context"
	"log"
	"spectraflow/internal/models"
	"spectraflow/internal/storage"
	"spectraflow/internal/telemetry"
	"time"
)

type VectorIndexerWorker struct {
	DB *storage.DatabaseEngine
}

func NewVectorIndexerWorker(db *storage.DatabaseEngine) *VectorIndexerWorker {
	return &VectorIndexerWorker{DB: db}
}

func (v *VectorIndexerWorker) Start(ctx context.Context, trace chan models.TraceEvent) {
	log.Println("Asynchronous Vector Indexer Worker deployed and active.")

	for traceEvent := range trace {
		workerCtx, cancel := context.WithTimeout(ctx, 50*time.Second)
		vector, err := telemetry.GenerateEmbeddings(workerCtx, traceEvent.Prompt)
		if err != nil {
			log.Printf("[VECTOR ERROR] Failed to generate embedding for trace %s: %v\n", traceEvent.ID, err)
			cancel()
			continue
		}
		err = v.DB.InsertPromptEmbedings(workerCtx, traceEvent.ID, traceEvent.Timestamp, vector, traceEvent.AppID)
		cancel()
		if err != nil {
			log.Printf("[VECTOR ERROR] Failed to insert embedding for trace %s: %v\n", traceEvent.ID, err)
			continue
		} else {
			log.Printf("[VECTOR SUCCESS] Inserted embedding for trace %s\n", traceEvent.ID)
		}
	}
}
