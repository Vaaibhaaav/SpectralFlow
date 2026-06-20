package agents

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"spectraflow/internal/events"
	"spectraflow/internal/models"
	"spectraflow/internal/storage"
	"time"
)

type DriftAgent struct {
	DB           *storage.DatabaseEngine
	Bus          *events.EventBus
	BatchSize    int
	Threshold    float64
	TraceCounter map[string]int
	BreachStreak map[string]int
}

func NewDriftAgent(db *storage.DatabaseEngine, bus *events.EventBus, batchSize int, threshold float64) *DriftAgent {
	return &DriftAgent{
		DB:           db,
		Bus:          bus,
		BatchSize:    batchSize,
		Threshold:    threshold,
		TraceCounter: make(map[string]int),
		BreachStreak: make(map[string]int),
	}
}

func (d *DriftAgent) Start(ctx context.Context, traceChan chan models.TraceEvent) {
	log.Println("Semantic Drift Detection Agent worker deployed and active.")

	for event := range traceChan {
		d.TraceCounter[event.AppID]++

		if d.TraceCounter[event.AppID] >= d.BatchSize {
			d.TraceCounter[event.AppID] = 0
			d.analyzeSemanticDrift(ctx, event.AppID)
		}

	}
}

func (d *DriftAgent) analyzeSemanticDrift(ctx context.Context, appId string) {
	query := `
		WITH rolling_window AS (
			SELECT embedding 
			FROM prompt_embeddings 
			ORDER BY trace_timestamp DESC 
			LIMIT 500
		),
		baseline_window AS (
			SELECT embedding 
			FROM prompt_embeddings 
			ORDER BY trace_timestamp ASC 
			LIMIT 500
		)
		SELECT COALESCE(AVG(r.embedding <=> b.embedding), 0.0) as avg_cosine_distance
		FROM rolling_window r
		CROSS JOIN baseline_window b;
	`

	var avgDistance float64
	err := d.DB.Pool.QueryRow(ctx, query).Scan(&avgDistance)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("[DRIFT ERROR] Database distance execution failed %v \n", err)
		return
	}

	log.Printf("[DRIFT EVAL] App %s running spatial check. Avg Cosine Distance: %f\n", appId, avgDistance)

	if avgDistance > d.Threshold {
		d.BreachStreak[appId]++
		log.Printf("[DRIFT WARNING] Semantic drift anomaly detected! Current streak: %d/3\n", d.BreachStreak[appId])

		if d.BreachStreak[appId] >= 3 {
			d.triggerDriftBreach(appId, avgDistance)
			d.BreachStreak[appId] = 0
		}
	} else {
		d.BreachStreak[appId] = 0
	}
}

func (d *DriftAgent) triggerDriftBreach(appId string, shiftDelta float64) {
	msg := fmt.Sprintf("Critical Semantic Drift Breach ! Average vector space distance has shifted past threshold value boundaries to %f .", shiftDelta)
	log.Printf("[DRIFT BREACH CRITICAL] %s\n", msg)

	payloadMap := map[string]interface{}{
		"app_id":            appId,
		"measured_shift":    shiftDelta,
		"drift_threshold":   d.Threshold,
		"window_evaluation": "500_cross_product",
	}
	payloadJson, _ := json.Marshal(payloadMap)
	alert := models.AlertEvent{
		ID:        fmt.Sprintf("drift-alert-%d", time.Now().UnixNano()),
		AppID:     appId,
		Type:      "DRIFT",
		Message:   msg,
		Payload:   string(payloadJson),
		Timestamp: time.Now(),
	}
	d.Bus.PublishAlerts(alert)
	d.Bus.PublishRetrains(appId)
}
