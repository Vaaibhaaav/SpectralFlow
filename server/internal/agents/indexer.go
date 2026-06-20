package agents

import (
	"context"
	"log"
	"time"

	"spectraflow/internal/models"
	"spectraflow/internal/storage"
)

type IndexerWorker struct {
	DB *storage.DatabaseEngine
}

func NewIndexerWorker(db *storage.DatabaseEngine) *IndexerWorker {
	return &IndexerWorker{DB: db}
}

func (iw *IndexerWorker) Start(ctx context.Context, traceChan chan models.TraceEvent) {
	log.Println("Asynchronous TimescaleDB Indexer Worker deployed and active.")
	for event := range traceChan {
		ctxTimeout, cancel := context.WithTimeout(ctx, 3*time.Second)
		err := iw.DB.InsertTrace(ctxTimeout, event)
		cancel()

		if err != nil {
			log.Printf("[INDEXER ERROR]: Failed to persist trace frame %s: %v\n", event.ID, err)
		} else {
			log.Printf("[INDEXER SUCCESS]: Persisted trace frame ID %s into TimescaleDB hypertable.\n", event.ID)
		}
	}
}
