package agents

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"spectraflow/internal/events"
	"spectraflow/internal/models"
	"spectraflow/internal/storage"
	"time"
)

type AnomalyAgent struct {
	Redis *storage.RedisClient
	Bus   *events.EventBus
	Alpha float64
}

func NewAnomalyAgent(r *storage.RedisClient, b *events.EventBus, alpha float64) *AnomalyAgent {
	return &AnomalyAgent{
		Redis: r,
		Bus:   b,
		Alpha: alpha,
	}
}

func (a *AnomalyAgent) Start(ctx context.Context, traceChan chan models.TraceEvent) {
	log.Println("Anomaly Detection Agent worker deployed and active.")

	for event := range traceChan {
		a.evaluateMetric(ctx, event, "cost", event.CostUSD)
		a.evaluateMetric(ctx, event, "latency", float64(event.LatencyMs))
	}

}

func (a *AnomalyAgent) evaluateMetric(ctx context.Context, event models.TraceEvent, metricName string, value float64) {
	meanKey := fmt.Sprintf("stats:%s:%s:ewma", event.AppID, metricName)
	varKey := fmt.Sprintf("stats:%s:%s:variance", event.AppID, metricName)

	oldMean, err := a.Redis.GetState(ctx, meanKey)
	if err != nil {
		log.Println("Could not retrieve old mean")
		return
	}
	oldVariance, err := a.Redis.GetState(ctx, varKey)
	if err != nil {
		log.Println("Could not retrieve old variance")
		return
	}

	if oldMean == 0.0 {
		_ = a.Redis.SetState(ctx, meanKey, value)
		_ = a.Redis.SetState(ctx, varKey, 0.0)
		return
	}
	stdDev := math.Sqrt(oldVariance)
	if stdDev > 0 {
		zScore := (value - oldMean) / stdDev
		if zScore > 3.0 {
			a.triggerAlert(event, metricName, value, oldMean, zScore)
		}
	}

	newMean := (a.Alpha * value) + ((1.0 - a.Alpha) * oldMean)

	diff := value - oldMean
	newVariance := ((1.0 - a.Alpha) * (oldVariance + (a.Alpha * (diff * diff))))

	_ = a.Redis.SetState(ctx, meanKey, newMean)
	_ = a.Redis.SetState(ctx, varKey, newVariance)

}

func (a *AnomalyAgent) triggerAlert(event models.TraceEvent, metricName string, currentValue, mean, zScore float64) {
	msg := fmt.Sprintf("Critical anomaly detected for %s! Current value (%f) exceeded expected baseline mean (%f).", metricName, currentValue, mean)
	log.Printf("[ANOMALY ALERT ALERT] %s (Z-Score: %f)\n", msg, zScore)

	payload := map[string]interface{}{
		"trace_id":       event.ID,
		"app_id":         event.AppID,
		"metric":         metricName,
		"current_value":  currentValue,
		"baseline_mean":  mean,
		"calculated_z":   zScore,
		"trigger_status": "breach",
	}

	payloadJson, _ := json.Marshal(payload)

	alert := models.AlertEvent{
		ID:        fmt.Sprintf("alert-%d", time.Now().UnixNano()),
		AppID:     event.AppID,
		Type:      "ANOMALY_BREACH",
		Message:   msg,
		Payload:   string(payloadJson),
		Timestamp: time.Now(),
	}
	a.Bus.PublishAlerts(alert)
}
