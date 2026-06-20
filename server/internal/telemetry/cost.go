package telemetry

import "strings"

func CalculateCosts(modelName string, inputTokens float64, outputTokens float64) float64 {
	modelNameLower := strings.ToLower(modelName)
	var promptRatePerMillion float64
	var completionRatePerMillion float64

	// Real-world platform price rates (Adjustable based on current market scales)
	switch {
	case strings.Contains(modelNameLower, "claude-haiku") || strings.Contains(modelNameLower, "haiku"):
		promptRatePerMillion = 0.35     // $0.35 per 1M tokens
		completionRatePerMillion = 1.50 // $1.50 per 1M tokens

	case strings.Contains(modelNameLower, "claude-sonnet") || strings.Contains(modelNameLower, "sonnet"):
		promptRatePerMillion = 2.50     // $2.50 per 1M tokens
		completionRatePerMillion = 12.00 // $12.00 per 1M tokens

	case strings.Contains(modelNameLower, "gpt-4o") || strings.Contains(modelNameLower, "gpt-4-turbo"):
		promptRatePerMillion = 2.50 // $2.50 per 1M tokens
		completionRatePerMillion = 12.50 // $12.50 per 1M tokens

	case strings.Contains(modelNameLower,"self-hosted") || strings.Contains(modelNameLower,"Ollama"):
		promptRatePerMillion = 0.00
		completionRatePerMillion = 0.00

	default:
		// Fallback rate for unknown or self-hosted local models (like Nomic/Ollama) [cite: 51, 107]
		promptRatePerMillion = 0.10
		completionRatePerMillion = 0.30
	}

	inputCost := (inputTokens / 1000000.0) * promptRatePerMillion
	outputCost := (outputTokens / 1000000.0) * completionRatePerMillion

	return inputCost + outputCost
}
