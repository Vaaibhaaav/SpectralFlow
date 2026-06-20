package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"spectraflow/internal/agents"
	"spectraflow/internal/events"
	"spectraflow/internal/models"
	"spectraflow/internal/storage"
	"spectraflow/internal/telemetry"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
)

type IngestionServer struct {
	Bus *events.EventBus
	DB  *storage.DatabaseEngine
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("[INFO] No .env file found, reading from system environment variables.")
	}

	connStr := os.Getenv("CONNECTION_STRING")
	groqKey := os.Getenv("GROQ_API_KEY")
	modelName := os.Getenv("MODEL_NAME")
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if connStr == "" || groqKey == "" || modelName == "" {
		log.Fatal("Critical Error: Missing required infrastructure environment variables (CONNECTION_STRING, GROQ_API_KEY, MODEL_NAME).")
	}

	db, err := storage.NewDatabaseEngine(connStr)
	if err != nil {
		log.Fatalf("Failed to initialize database pool: %v", err)
	}
	defer db.Close()

	// if err := db.ExecuteInitScript("init.sql"); err != nil {
	// 	log.Printf("[DATABASE INIT WARNING] Schema deployment step skipped or caught errors: %v\n", err)
	// }

	redisClient := storage.NewRedisClient()

	// 3. Bootstrap Seed Metadata (Default Tenant Provisioning)
	// testAppID := "99999999-9999-9999-9999-999999999999"
	// _, err = db.Pool.Exec(context.Background(),
	// 	"INSERT INTO apps (id, name) VALUES ($1, 'Production Assistant AI') ON CONFLICT (id) DO NOTHING;",
	// 	testAppID,
	// )
	// if err != nil {
	// 	log.Printf("Non-fatal database notification: App ID provisioning status: %v", err)
	// }

	// 4. Initialize Structured Event Bus & Channel Registration
	bus := events.NewEventBus()

	indexerChan := bus.Subscribe("indexer", 1000)
	anomalyChan := bus.Subscribe("anomaly", 1000)
	vectorIndexerChan := bus.Subscribe("vector_indexer", 1000)
	alertChan := bus.SubscribeAlerts("root_cause_pipeline", 500)
	dbAlertChan := bus.SubscribeAlerts("database_logger", 500)
	driftChan := bus.Subscribe("drift", 1000)
	retrainChan := bus.SubscribeRetrain("replay_harness", 500)
	agenticEvalChan := bus.Subscribe("agentic_eval", 1000)
	// 5. Instantiation & Asynchronous Deployment of Worker Grid
	ctx := context.Background()

	// Worker 1: TimescaleDB Bulk Metrics Indexer
	indexerWorker := agents.NewIndexerWorker(db)
	go indexerWorker.Start(ctx, indexerChan)

	// Worker 2: Vector Embedding Indexer (Ollama -> pgvector)
	vectorIndexerWorker := agents.NewVectorIndexerWorker(db)
	go vectorIndexerWorker.Start(ctx, vectorIndexerChan)

	// Worker 3: Statistical Anomaly Detection Agent (EWMA via Redis)
	anomalyAgent := agents.NewAnomalyAgent(redisClient, bus, 0.2)
	go anomalyAgent.Start(ctx, anomalyChan)

	// Worker 4: Semantic Drift Detection Agent (Vector Space Topology Checking)
	driftAgent := agents.NewDriftAgent(db, bus, 25, 0.15)
	go driftAgent.Start(ctx, driftChan)

	// Worker 5: Groq AI Root-Cause Synthesis Agent (Triggered by Anomaly/Drift alerts)
	rootLlmAgent := agents.NewRootCauseAgent(db, bus, modelName, groqKey)
	go rootLlmAgent.Start(ctx, alertChan)

	// Worker 6: Automation Replay Watcher (Reacts to training drift triggers)
	go func() {
		log.Println("Background Replay Automation Harness pipeline active.")
		for appID := range retrainChan {
			log.Printf("[RETRAIN SIGNAL] Intercepted retraining pipeline trigger for App ID: %s. Booting prompt regression tests...\n", appID)
		}
	}()

	agenticEvalAgent := agents.NewAgenticEvalAgent(bus, db, modelName, groqKey)
	go agenticEvalAgent.Start(ctx, agenticEvalChan)

	go func() {
		log.Println("Asynchronous Database Alerts Logger Worker deployed.")
		for alert := range dbAlertChan {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			err := db.InsertAlert(ctx, alert)
			cancel()
			if err != nil {
				log.Printf("[ALERTS DB ERROR]: Failed to persist incident log %s: %v\n", alert.ID, err)
			}
		}
	}()
	// 6. Set Up Inward-Facing HTTP Gateway Router
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	server := &IngestionServer{Bus: bus, DB: db}
	r.Post("/v1/traces", server.HandleIngestion)
	r.Get("/v1/traces", server.HandleGetTraces)
	r.Get("/v1/analytics/overview", server.HandleAnalyticsOverview)
	r.Get("/v1/analytics/drift", server.HandleDriftTimeline)
	r.Get("/v1/analytics/alerts", server.HandleGetAlerts)
	r.Post("/v1/app/new-app", server.handleNewApp)
	r.Get("/v1/apps", server.handleGetApps)
	r.Get("/v1/analytics/evals", server.HandleGetEvals)

	log.Println("Spectraflow Ingestion Gateway online running on port :" + port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func (s *IngestionServer) HandleGetTraces(w http.ResponseWriter, r *http.Request) {
	appID := r.URL.Query().Get("app_id")
	if appID == "" {
		appID = "99999999-9999-9999-9999-999999999999"
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	traces, err := s.DB.GetTraces(ctx, appID)
	if err != nil {
		http.Error(w, "Failed to fetch dashboard incident records: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(traces)
}

func (s *IngestionServer) HandleGetEvals(w http.ResponseWriter, r *http.Request) {
	appID := r.URL.Query().Get("app_id")
	if appID == "" {
		appID = "99999999-9999-9999-9999-999999999999"
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	evals, err := s.DB.GetEvals(ctx, appID)
	if err != nil {
		http.Error(w, "Failed to fetch dashboard eval records: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(evals)
}

func (s *IngestionServer) HandleIngestion(w http.ResponseWriter, r *http.Request) {
	var payload models.TraceEvent

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Malformed JSON payload request", http.StatusBadRequest)
		return
	}

	scrubbedPrompt := telemetry.ScrubPII(payload.Prompt)
	scrubbedResponse := telemetry.ScrubPII(payload.Response)
	costUSD := telemetry.CalculateCosts(payload.Model, float64(payload.PromptTokens), float64(payload.CompletionTokens))

	trace := models.TraceEvent{
		ID:               payload.ID,
		AppID:            payload.AppID,
		SessionID:        payload.SessionID,
		Timestamp:        time.Now(),
		Model:            payload.Model,
		Prompt:           scrubbedPrompt,
		Response:         scrubbedResponse,
		PromptTokens:     payload.PromptTokens,
		CompletionTokens: payload.CompletionTokens,
		LatencyMs:        payload.LatencyMs,
		CostUSD:          costUSD,
		Metadata:         payload.Metadata,
	}

	s.Bus.Publish(trace)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{"status": "received", "trace_id": trace.ID})
}

func (s *IngestionServer) HandleAnalyticsOverview(w http.ResponseWriter, r *http.Request) {
	appID := r.URL.Query().Get("app_id")
	if appID == "" {
		appID = "99999999-9999-9999-9999-999999999999"
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	overview, err := s.DB.GetAnayticsOverview(ctx, appID)
	if err != nil {
		http.Error(w, "Failed to compute telemetry aggregates: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(overview)
}

func (s *IngestionServer) HandleDriftTimeline(w http.ResponseWriter, r *http.Request) {
	appID := r.URL.Query().Get("app_id")
	if appID == "" {
		appID = "99999999-9999-9999-9999-999999999999"
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	points, err := s.DB.GetDriftTimeline(ctx, appID)
	if err != nil {
		http.Error(w, "Failed to retrieve drift timeline vectors: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(points)
}

func (s *IngestionServer) handleNewApp(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Name string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Malformed JSON payload request", http.StatusBadRequest)
		return
	}

	if payload.Name == "" {
		http.Error(w, "App name cannot be empty", http.StatusBadRequest)
		return
	}

	appID := uuid.New().String()
	if err := s.DB.CreateApp(context.Background(), payload.Name, appID); err != nil {
		http.Error(w, "Failed to create app: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "created", "app_id": appID})
}

func (s *IngestionServer) handleGetApps(w http.ResponseWriter, r *http.Request) {
	apps, err := s.DB.GetApps(context.Background())
	if err != nil {
		http.Error(w, "Failed to retrieve apps: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(apps)
}

func (s *IngestionServer) HandleGetAlerts(w http.ResponseWriter, r *http.Request) {
	appID := r.URL.Query().Get("app_id")
	if appID == "" {
		appID = "99999999-9999-9999-9999-999999999999"
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	alerts, err := s.DB.GetRecentAlerts(ctx, appID)
	if err != nil {
		http.Error(w, "Failed to fetch dashboard incident records: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(alerts)
}
