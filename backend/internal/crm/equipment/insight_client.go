package equipment

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const (
	defaultDeepSeekEndpoint = "https://api.deepseek.com/chat/completions"
	defaultDeepSeekModel    = "deepseek-chat"
)

type InsightClient struct {
	apiKey     string
	endpoint   string
	model      string
	httpClient *http.Client
}

type insightMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type insightRequest struct {
	Model          string                 `json:"model"`
	Messages       []insightMessage       `json:"messages"`
	Temperature    float64                `json:"temperature"`
	ResponseFormat map[string]string      `json:"response_format,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
}

type insightResponse struct {
	Choices []struct {
		Message insightMessage `json:"message"`
	} `json:"choices"`
}

type modelRecurrentFailure struct {
	Label    string `json:"label"`
	Count    int    `json:"count"`
	Evidence string `json:"evidence"`
}

type modelInsightResponse struct {
	PresumedFailure  string                  `json:"presumedFailure"`
	Summary          string                  `json:"summary"`
	RecurrentFailure []modelRecurrentFailure `json:"recurrentFailures"`
}

func NewInsightClient(apiKey, endpoint, model string) *InsightClient {
	normalizedKey := strings.TrimSpace(apiKey)
	if normalizedKey == "" {
		return nil
	}

	normalizedEndpoint := strings.TrimSpace(endpoint)
	if normalizedEndpoint == "" {
		normalizedEndpoint = defaultDeepSeekEndpoint
	}

	normalizedModel := strings.TrimSpace(model)
	if normalizedModel == "" {
		normalizedModel = defaultDeepSeekModel
	}

	return &InsightClient{
		apiKey:   normalizedKey,
		endpoint: normalizedEndpoint,
		model:    normalizedModel,
		httpClient: &http.Client{
			Timeout: 35 * time.Second,
		},
	}
}

func (c *InsightClient) Analyze(ctx context.Context, analysisPayload string) (modelInsightResponse, error) {
	if c == nil {
		return modelInsightResponse{}, fmt.Errorf("insight client not configured")
	}

	reqBody := insightRequest{
		Model: c.model,
		Messages: []insightMessage{
			{
				Role: "system",
				Content: "Eres Lubot AI, un ingeniero senior de mantenimiento industrial. Debes responder SIEMPRE en JSON valido y estricto, sin markdown. " +
					"Tu objetivo: estimar falla presumida y fallas frecuentes para el equipo consultado. " +
					"Regla obligatoria: recurrentFailures debe basarse en conocimiento tecnico general del modelo/familia del equipo, no en conteos del historial local recibido.",
			},
			{
				Role: "user",
				Content: "Analiza el siguiente contexto tecnico del equipo y responde en JSON con esta forma exacta: " +
					"{\"presumedFailure\": string, \"summary\": string, \"recurrentFailures\": [{\"label\": string, \"count\": number, \"evidence\": string}]}. " +
					"Instrucciones adicionales: " +
					"1) recurrentFailures debe listar entre 3 y 5 fallas frecuentes conocidas para ese tipo de equipo desde tu conocimiento tecnico general; " +
					"2) count debe ser una ponderacion relativa (1-5) de prevalencia esperada, no un conteo del historial local; " +
					"3) no menciones nombre del modelo de IA ni frases de limite como 'solo se analizo un caso'; " +
					"4) summary debe ser corto y accionable para tecnico de campo. " +
					"Contexto: " + analysisPayload,
			},
		},
		Temperature:    0.2,
		ResponseFormat: map[string]string{"type": "json_object"},
	}

	rawReq, err := json.Marshal(reqBody)
	if err != nil {
		return modelInsightResponse{}, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.endpoint, bytes.NewReader(rawReq))
	if err != nil {
		return modelInsightResponse{}, err
	}
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	httpResp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return modelInsightResponse{}, err
	}
	defer httpResp.Body.Close()

	rawResp, err := io.ReadAll(io.LimitReader(httpResp.Body, 1024*1024))
	if err != nil {
		return modelInsightResponse{}, err
	}

	if httpResp.StatusCode < 200 || httpResp.StatusCode >= 300 {
		return modelInsightResponse{}, fmt.Errorf("deepseek status %d", httpResp.StatusCode)
	}

	var decoded insightResponse
	if err := json.Unmarshal(rawResp, &decoded); err != nil {
		return modelInsightResponse{}, err
	}

	if len(decoded.Choices) == 0 {
		return modelInsightResponse{}, fmt.Errorf("empty deepseek choices")
	}

	content := strings.TrimSpace(decoded.Choices[0].Message.Content)
	content = trimCodeFence(content)
	content = extractJSONObject(content)
	if content == "" {
		return modelInsightResponse{}, fmt.Errorf("empty deepseek content")
	}

	var modelResult modelInsightResponse
	if err := json.Unmarshal([]byte(content), &modelResult); err != nil {
		return modelInsightResponse{}, err
	}

	return modelResult, nil
}

func trimCodeFence(content string) string {
	trimmed := strings.TrimSpace(content)
	trimmed = strings.TrimPrefix(trimmed, "```json")
	trimmed = strings.TrimPrefix(trimmed, "```")
	trimmed = strings.TrimSuffix(trimmed, "```")
	return strings.TrimSpace(trimmed)
}

func extractJSONObject(content string) string {
	start := strings.Index(content, "{")
	end := strings.LastIndex(content, "}")
	if start == -1 || end == -1 || end <= start {
		return ""
	}
	return content[start : end+1]
}
