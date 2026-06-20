package models

import "time"

type TraceEvent struct {
	ID               string                 `json:"id"`
	AppID            string                 `json:"app_id"`
	SessionID        string                 `json:"session_id,omitempty"`
	Timestamp        time.Time              `json:"timestamp"`
	Model            string                 `json:"model"`
	Prompt           string                 `json:"prompt"`
	Response         string                 `json:"response"`
	PromptTokens     int                    `json:"prompt_tokens"`
	CompletionTokens int                    `json:"completion_tokens"`
	LatencyMs        int                    `json:"latency_ms"`
	Metadata         map[string]interface{} `json:"metadata,omitempty"`
	CostUSD          float64                `json:"cost_usd"`
}

type AlertType string

const (
	AlertTypeCost    AlertType = "COST"
	AlertTypeLatency AlertType = "LATENCY"
	AlertTypeDrift   AlertType = "DRIFT"
	AlertTypeQuality AlertType = "QUALITY"
)

type AlertEvent struct {
	ID        string    `json:"id"`
	AppID     string    `json:"app_id"`
	Type      AlertType `json:"type"`
	Message   string    `json:"message"`
	Payload   string    `json:"payload"`
	Timestamp time.Time `json:"timestamp"`
}

type EvalResult struct {
	ID             string    `json:"id"`
	AppID          string    `json:"app_id"`
	TraceID        string    `json:"trace_id"`
	TraceTimestamp time.Time `json:"trace_timestamp"`
	ScoredAt       time.Time `json:"scored_at"`
	Faithfulness   float64   `json:"faithfulness"`
	Toxicity       float64   `json:"toxicity"`
	JudgeModel     string    `json:"judge_model"`
	Summary        string    `json:"summary"`
}
