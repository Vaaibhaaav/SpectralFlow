package storage

import (
	"context"
	"log"
	"os"
	"spectraflow/internal/models"
	"time"
)

type AnalyticsOverview struct {
	TotalTraces  int64   `json:"total_traces"`
	TotalCostUSD float64 `json:"total_cost_usd"`
	AvgLatencyMs float64 `json:"avg_latency_ms"`
	TotalTokens  int64   `json:"total_tokens"`
}

type DriftDataPoint struct {
	Timestamp time.Time `json:"timestamp"`
	Distance  float64   `json:"distance"`
}

func (db *DatabaseEngine) GetAnayticsOverview(ctx context.Context, appId string) (AnalyticsOverview, error) {
	query1 := `
		SELECT 
			COALESCE(SUM(trace_count),0) as total_traces,
			COALESCE(AVG(avg_latency),0.0) as avg_latency_ms,
			COALESCE(SUM(total_cost),0.0) as total_cost_usd,
			COALESCE(SUM(total_tokens_used),0) as total_tokens_used
		FROM hourly_trace_stats WHERE app_id = $1 AND bucket > 
		NOW() - INTERVAL '24 hours';
	`

	var overview AnalyticsOverview

	err1 := db.Pool.QueryRow(ctx, query1, appId).Scan(
		&overview.TotalTraces,
		&overview.AvgLatencyMs,
		&overview.TotalCostUSD,
		&overview.TotalTokens)
	if err1 != nil {
		return AnalyticsOverview{}, err1
	}

	return overview, nil
}

func (db *DatabaseEngine) InsertEval(ctx context.Context, traceID string, traceTime time.Time, faithfulness, toxicity float64, model, summary string, appId string) error {
	query := `
		INSERT INTO evals (trace_id, trace_timestamp, faithfulness, toxicity, judge_model, summary,app_id)
		VALUES ($1, $2, $3, $4, $5, $6,$7);
	`
	_, err := db.Pool.Exec(ctx, query, traceID, traceTime, faithfulness, toxicity, model, summary, appId)
	return err
}

func (db *DatabaseEngine) GetEvals(ctx context.Context, appID string) ([]models.EvalResult, error) {
	query := `
		SELECT 
			id,app_id,trace_id,trace_timestamp,scored_at,faithfulness,toxicity,judge_model,summary 
		FROM evals WHERE app_id = $1
		ORDER BY scored_at DESC
		LIMIT 20;
	`
	rows, err := db.Pool.Query(ctx, query, appID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var evals []models.EvalResult = []models.EvalResult{}
	for rows.Next() {
		var e models.EvalResult
		if err := rows.Scan(&e.ID, &e.AppID, &e.TraceID, &e.TraceTimestamp, &e.ScoredAt, &e.Faithfulness, &e.Toxicity, &e.JudgeModel, &e.Summary); err != nil {
			return nil, err
		}
		evals = append(evals, e)
	}
	return evals, nil
}

func (db *DatabaseEngine) GetDriftTimeline(ctx context.Context, appID string) ([]DriftDataPoint, error) {
	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM prompt_embeddings WHERE trace_id IS NOT NULL LIMIT 1);`
	if err := db.Pool.QueryRow(ctx, checkQuery).Scan(&exists); err != nil || !exists {
		return []DriftDataPoint{}, nil
	}

	query := `
    WITH baseline_centroid AS (
        SELECT AVG(embedding)::vector(768) as centroid
        FROM (
            SELECT embedding 
            FROM prompt_embeddings 
            WHERE app_id = $1
            ORDER BY trace_timestamp ASC 
            LIMIT 100
        ) sub
    )
    SELECT 
        p.trace_timestamp, 
        COALESCE(p.embedding <=> b.centroid, 0.0)::DOUBLE PRECISION as distance
    FROM prompt_embeddings p
    CROSS JOIN baseline_centroid b
    WHERE p.app_id = $1
    ORDER BY p.trace_timestamp DESC
    LIMIT 50;
`
	rows, err := db.Pool.Query(ctx, query,appID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var points []DriftDataPoint = []DriftDataPoint{} // Initialize as an empty slice, not nil
	for rows.Next() {
		var p DriftDataPoint
		if err := rows.Scan(&p.Timestamp, &p.Distance); err != nil {
			return nil, err
		}
		points = append(points, p)
	}

	return points, nil
}
func (db *DatabaseEngine) CreateApp(ctx context.Context, name string, appId string) error {
	query := `
		INSERT INTO apps(id,name)
		VALUES($1,$2);
	`
	_, err := db.Pool.Exec(ctx, query, appId, name)
	return err
}

func (db *DatabaseEngine) GetApps(ctx context.Context) ([]string, error) {
	query := `
	SELECT id,name FROM apps;
	`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var apps []string
	for rows.Next() {
		var id, name string
		if err := rows.Scan(&id, &name); err != nil {
			return nil, err
		}
		apps = append(apps, id)
	}
	return apps, nil
}

func (db *DatabaseEngine) InsertAlert(ctx context.Context, alert models.AlertEvent) error {
	query := `
		INSERT INTO alerts(id,app_id,type,message,payload,timestamp)
		VALUES($1,$2,$3,$4,$5,$6);
	`
	_, err := db.Pool.Exec(ctx, query, alert.ID, alert.AppID, alert.Type, alert.Message, alert.Payload, alert.Timestamp)
	return err
}

func (db *DatabaseEngine) GetRecentAlerts(ctx context.Context, appID string) ([]models.AlertEvent, error) {
	query := `
		SELECT id, app_id, type, message, payload, timestamp 
		FROM alerts 
		WHERE app_id = $1 
		ORDER BY timestamp DESC 
		LIMIT 10;
	`
	rows, err := db.Pool.Query(ctx, query, appID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var alerts []models.AlertEvent = []models.AlertEvent{}
	for rows.Next() {
		var a models.AlertEvent
		if err := rows.Scan(&a.ID, &a.AppID, &a.Type, &a.Message, &a.Payload, &a.Timestamp); err != nil {
			return nil, err
		}
		alerts = append(alerts, a)
	}
	return alerts, nil
}

// ExecuteInitScript reads a local SQL migration script from disk and executes it against the pool.
func (db *DatabaseEngine) ExecuteInitScript(scriptPath string) error {
	// 1. Read the raw SQL bytes from disk
	sqlBytes, err := os.ReadFile(scriptPath)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// 2. Execute the entire SQL script script file string in a single block pass
	_, err = db.Pool.Exec(ctx, string(sqlBytes))
	if err != nil {
		return err
	}

	log.Printf("[DATABASE INIT] Successfully executed complete migration layout from: %s\n", scriptPath)
	return nil
}

func (db *DatabaseEngine) GetTraces(ctx context.Context, appId string) ([]models.TraceEvent, error) {
	query := `
   SELECT id,app_id,session_id,timestamp,model,prompt,response,prompt_tokens,completion_tokens,latency_ms,cost_usd,metadata 
   FROM traces 
   WHERE app_id = $1 
   ORDER BY timestamp DESC 
   LIMIT 10;
   `
	rows, err := db.Pool.Query(ctx, query, appId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var traces []models.TraceEvent = []models.TraceEvent{}
	for rows.Next() {
		var t models.TraceEvent
		if err := rows.Scan(&t.ID, &t.AppID, &t.SessionID, &t.Timestamp, &t.Model, &t.Prompt, &t.Response, &t.PromptTokens, &t.CompletionTokens, &t.LatencyMs, &t.CostUSD, &t.Metadata); err != nil {
			return nil, err
		}
		traces = append(traces, t)
	}
	return traces, nil
}
