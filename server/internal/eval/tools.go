package eval

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"

	"github.com/openai/openai-go"
)

func GetToolsDefinition() []openai.ChatCompletionToolParam {
	return []openai.ChatCompletionToolParam{
		{
			Function: openai.FunctionDefinitionParam{
				Name:        "scan_vulnerabilites_patterns",
				Description: openai.String("Scans incoming prompt strings for known exploit layouts, prompt injections, or jailbreak patterns (like ignoring system instructions, direct commands or role playing)"),
				Parameters: openai.FunctionParameters{
					"type": "object",
					"properties": map[string]interface{}{
						"text": map[string]interface{}{
							"type":        "string",
							"description": "The raw prompt string extracted from the trace event",
						},
					},
					"required": []string{"text"},
				},
			},
		},
		{
			Function: openai.FunctionDefinitionParam{
				Name:        "calculate_token_density",
				Description: openai.String("Computes the structural density ratio between completion tokens and prompt tokens to detect unnatural payload generation or loops."),
				Parameters: openai.FunctionParameters{
					"type": "object",
					"properties": map[string]interface{}{
						"prompt_tokens":     map[string]interface{}{"type": "integer"},
						"completion_tokens": map[string]interface{}{"type": "integer"},
					},
					"required": []string{"prompt_tokens", "completion_tokens"},
				},
			},
		},
	}
}

func ExecuteTool(ctx context.Context, name string, argument string) (string, error) {
	switch name {
	case "scan_vulnerabilites_patterns":
		var args struct {
			Text string `json:"text"`
		}
		if err := json.Unmarshal([]byte(argument), &args); err != nil {
			return "", nil
		}
		return runVulnerabilityCheck(args.Text), nil
	case "calculate_token_density":
		var args struct {
			PromptTokens     int `json:"prompt_tokens"`
			CompletionTokens int `json:"completion_tokens"`
		}
		if err := json.Unmarshal([]byte(argument), &args); err != nil {
			return "", nil
		}
		return runTokenDensityCalculation(ctx, args.PromptTokens, args.CompletionTokens), nil

	default:
		return "", fmt.Errorf("The requested tool does not exist in runtime registry tool name %s", name)
	}
}

func runVulnerabilityCheck(text string) string {
	patterns := []*regexp.Regexp{
		regexp.MustCompile(`(?i)ignore\s+all\s+previous\s+instructions`),
		regexp.MustCompile(`(?i)system\s+override`),
		regexp.MustCompile(`(?i)dan\s+mode`),
		regexp.MustCompile(`(?i)you\s+are\s+now\s+unbound`),
	}

	for _, pattern := range patterns {
		if pattern.MatchString(text) {
			return `{"status": "vulnerable", "matched_pattern": "` + pattern.String() + `", "risk_score": 0.95}`
		}
	}
	return `{"status": "clean", "risk_score": 0.02}`
}

func runTokenDensityCalculation(ctx context.Context, pTokens, cTokens int) string {
	if pTokens == 0 {
		return `{"error" : "division by zero prompt tokens"}`
	}
	ratio := float64(cTokens) / float64(pTokens)

	status := "nominal"
	threshold := 10.0
	if ratio >= threshold {
		status = "abnormally_bloated_output"
	}

	return fmt.Sprintf(`{"density_ratio":%f,"status":"%s"}`, ratio, status)
}
