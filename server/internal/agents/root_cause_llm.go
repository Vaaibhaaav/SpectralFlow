package agents

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"spectraflow/internal/events"
	"spectraflow/internal/models"
	"spectraflow/internal/storage"

	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

type RootCauseAgent struct {
	DB         *storage.DatabaseEngine
	Bus        *events.EventBus
	GroqClient *openai.Client
	ModelName  string
}

func NewRootCauseAgent(db *storage.DatabaseEngine, bus *events.EventBus, modelName string, apiKey string) *RootCauseAgent {
	client := openai.NewClient(
		option.WithAPIKey(apiKey),
		option.WithBaseURL("https://api.groq.com/openai/v1/"),
	)

	return &RootCauseAgent{
		DB:         db,
		Bus:        bus,
		GroqClient: &client,
		ModelName:  modelName,
	}
}

func (r *RootCauseAgent) Start(ctx context.Context, alertChan chan models.AlertEvent) {
	log.Println("Root-Cause Synthesis Agent worker active and monitoring alert streams.")

	for alert := range alertChan {
		log.Printf("[ROOT CAUSE] Processing incident for Root-Cause Synthesis: %s", alert.ID)

		recentTraces, err := r.fetchRecentContext(ctx, alert.AppID, 5)
		if err != nil {
			log.Printf("[ROOT CAUSE] Failed to fetch recent context for incident %s: %v", alert.ID, err)
			continue
		}

		summary, err := r.SynthesizeIncident(ctx, alert, recentTraces)
		if err != nil {
			log.Printf("[ROOT CAUSE] Failed to synthesize incident %s: %v", alert.ID, err)
			continue
		}

		log.Printf("[ROOT CAUSE ANALYSIS DONE] Root Cause: %s", summary)
	}
}

func (r *RootCauseAgent) fetchRecentContext(ctx context.Context, appID string, limit int) ([]models.TraceEvent, error) {
	query := `
		SELECT id, prompt, response, latency_ms, cost_usd 
		FROM traces 
		WHERE app_id = $1 
		ORDER BY timestamp DESC 
		LIMIT $2;
	`
	rows, err := r.DB.Pool.Query(ctx, query, appID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var traces []models.TraceEvent
	for rows.Next() {
		var trace models.TraceEvent
		if err := rows.Scan(&trace.ID, &trace.Prompt, &trace.Response, &trace.LatencyMs, &trace.CostUSD); err != nil {
			return nil, err
		}
		traces = append(traces, trace)
	}
	return traces, nil
}

func (r *RootCauseAgent) SynthesizeIncident(ctx context.Context, alert models.AlertEvent, traces []models.TraceEvent) (string, error) {
	tracesJSON, _ := json.MarshalIndent(traces, "", "  ")

	systemPrompt := "You are an expert site reliability engineer for LLM systems. Analyze the provided alert and context logs, and respond with a strict JSON object containing fields: summary, likely_cause, and recommended_action."
	userPrompt := fmt.Sprintf("Alert Fired: %s\n\nRecent System Traces:\n%s", alert.Message, string(tracesJSON))

	chatCompletion, err := r.GroqClient.Chat.Completions.New(ctx, openai.ChatCompletionNewParams{
		Model: openai.ChatModel(r.ModelName),
		ResponseFormat: openai.ChatCompletionNewParamsResponseFormatUnion{
			OfJSONObject: &openai.ResponseFormatJSONObjectParam{},
		},
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage(systemPrompt),
			openai.UserMessage(userPrompt),
		},
	})
	if err != nil {
		return "", err
	}

	return chatCompletion.Choices[0].Message.Content, nil
}