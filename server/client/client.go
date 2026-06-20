package client

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

type SpectraflowClient struct {
	GatewayURL string
	AppID      string
	OAClient   *openai.Client
}

func NewSpectraflowClient(gatewayURL, appID string, apiKey string) *SpectraflowClient {
	cfg := openai.NewClient(
		option.WithAPIKey(apiKey),
		option.WithBaseURL("https://api.groq.com/openai/v1/"),
	)
	return &SpectraflowClient{
		GatewayURL: gatewayURL,
		AppID:      appID,
		OAClient:   &cfg,
	}
}

func (sf *SpectraflowClient) Completion(ctx context.Context, model, prompt string) (string, error) {
	startTime := time.Now()

	chatCompletion, err := sf.OAClient.Chat.Completions.New(ctx, openai.ChatCompletionNewParams{
		Model: model,
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.UserMessage(prompt),
		},
	})
	if err != nil {
		return "", err
	}

	responseText := chatCompletion.Choices[0].Message.Content
	latency := time.Since(startTime).Milliseconds()

	go func() {
		_ = sf.shipTelemetry(model, prompt, responseText, latency, chatCompletion.Usage.PromptTokens, chatCompletion.Usage.CompletionTokens)
	}()

	return responseText, nil
}

func (sf *SpectraflowClient) shipTelemetry(model, prompt, response string, latencyMs, pTokens, cTokens int64) error {
	payload := map[string]interface{}{
		"id":                uuid.New().String(),
		"app_id":            sf.AppID,
		"model":             model,
		"prompt":            prompt,
		"response":          response,
		"prompt_tokens":     pTokens,
		"completion_tokens": cTokens,
		"latency_ms":        latencyMs,
	}

	body, _ := json.Marshal(payload)

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	req, _ := http.NewRequestWithContext(ctx, "POST", sf.GatewayURL+"/v1/traces", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	resp.Body.Close()
	return nil
}
