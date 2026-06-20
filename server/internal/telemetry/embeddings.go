package telemetry

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type OllamaEmbedResponse struct {
	Embeddings [][]float64 `json:"embeddings"`
}

func GenerateEmbeddings(ctx context.Context, text string) ([]float64, error) {
	if text == "" {
		return nil, fmt.Errorf("cannot generate embedding for empty text")
	}

	requestBody, err := json.Marshal(map[string]interface{}{
		"model": "nomic-embed-text",
		"input": text,
	})
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		"http://127.0.0.1:11434/api/embed",
		bytes.NewBuffer(requestBody),
	)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var body bytes.Buffer
		body.ReadFrom(resp.Body)

		return nil, fmt.Errorf(
			"ollama returned %d: %s",
			resp.StatusCode,
			body.String(),
		)
	}

	var result OllamaEmbedResponse

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if len(result.Embeddings) == 0 {
		return nil, fmt.Errorf("empty embeddings returned")
	}

	return result.Embeddings[0], nil
}