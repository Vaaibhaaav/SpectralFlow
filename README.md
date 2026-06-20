# 🌊 SpectraFlow

### High-Performance LLM Telemetry & Autonomous Observability Gateway

[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Ollama](https://img.shields.io/badge/Ollama-Embedded-black?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.com)

SpectraFlow is a local-first **LLM Telemetry & Autonomous Evaluation Gateway**. Built using Go, TimescaleDB, and Redis, it asynchronously intercepts production AI traffic to track operational costs, observe latency statistics, track vector space semantic model drift, and orchestrate agentic evaluation loops to scan for security vulnerabilities and auto-synthesize incident root causes.

---

## 🖼️ Unified Observability Platform

The Next.js interactive console delivers lightning-fast visualization of real-time ingestion streams, statistical anomalies, and conceptual model drift trends across decoupled worker matrices.

### 1. Main Telemetry Core Dashboard
*Real-time performance metrics tracking total data ingestion scales, aggregated token volumes, and moving latency frequencies profile configurations.*

![Main Telemetry Overview Dashboard](public/dashboard.png)

### 2. Semantic Model Drift Analytics
*Continuous tracking of vector embedding topologies over time, rendering spatial shifts by plotting the rolling cosine distance of incoming queries against baseline application centroids.*

![Semantic Model Drift Timeline Chart](public/model_drift.png)

### 3. Anomaly & Threshold Incident Monitor
*Statistical anomaly detection stream capturing runtime system deviations (latency timeouts, resource cost surges) derived from live calculations.*

![Anomaly Detection & Breach Feed](public/anomaly.png)

---

## 🚀 Architectural Modules

* **⚡ Non-Blocking Ingestion Gateway:** A blazing-fast Go HTTP engine built using a structured asynchronous event-bus grid to ensure zero head-of-line blocking on the LLM completion hot-path.
* **📊 Time-Series Hypertable Engine (TimescaleDB):** Real-time analytics tracking total trace counts, precise latency distributions, and precise cost estimations driven by optimized Postgres Continuous Aggregates.
* **🧠 Semantic Drift Monitoring (pgvector + Ollama):** Advanced geometric coordinate tracking that monitors the rolling **Cosine Distance** shifts between active user prompts and a historical baseline vector centroid (using 768-dimension `nomic-embed-text`).
* **📉 EWMA Anomaly Monitor (Redis):** A fast statistical tracking layer computing historical moving averages via recursive variance models to determine instant **Z-Scores** and intercept latency or cost outliers.
* **🤖 Autonomous Judge & Root-Cause Synthesis:** Asynchronous background LLM agents that intercept telemetry alert steps, handle custom tool-calling blocks, evaluate prompt-injection patterns, and generate automated mitigation logs.

---

## 🛠️ The Core Infrastructure Stack

* **Backend Core:** Go (Golang) + `chi` Router Grid
* **Telemetry & Time-Series Storage:** TimescaleDB (PostgreSQL 16)
* **Vector Space Engine:** `pgvector` extension for geometric coordinate models
* **Caching & Moving State Engine:** Redis 7 (Alpine Linux distribution)
* **Localized Text Embedding Processor:** Ollama (`nomic-embed-text`)
* **Agentic Compute Pipeline:** Groq Cloud LPU SDK Matrix (`llama3` inference cluster)

---

## 🏗️ System Architecture

```mermaid
graph TD
    classDef main fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef db fill:#06b6d4,stroke:#0891b2,stroke-width:2px,color:#fff;
    classDef worker fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff;
    classDef client fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff;

    subgraph Clients ["LLM Application Clients"]
        C[Client Apps]:::client
    end

    subgraph GW ["Ingestion Gateway (Go / Chi)"]
        G[POST /v1/traces]:::main
        EB[Asynchronous Event Bus]:::main
        G --> EB
    end

    subgraph Workers ["Asynchronous Worker Matrix"]
        W1[Timescale Indexer]:::worker
        W2[Vector Indexer]:::worker
        W3[Anomaly Detector]:::worker
        W4[Drift Tracker]:::worker
        W5[Agentic Judge]:::worker
    end

    subgraph Storage ["Physical Storage Volumes"]
        TS[(TimescaleDB Hypertable)]:::db
        PV[(pgvector Embeddings)]:::db
        RD[(Redis EWMA State)]:::db
        GQ[Groq Llama 3]:::worker
    end

    C -->|POST /v1/traces| G
    EB --> W1
    EB --> W2
    EB --> W3
    EB --> W4
    EB --> W5

    W1 --> TS
    W2 --> PV
    W3 --> RD
    W4 --> PV
    W5 --> GQ
    W5 --> TS
```

---

## 🚦 Quick Start

### 1. Environment Configuration
Clone the workspace and configure your `.env` variables. Create a [.env](file:///d:/Projects/SpectraFlow/server/.env) file in the `server` directory:

| Variable | Description | Example |
|---|---|---|
| `PORT` | Local port for the Go server gateway | `8080` |
| `CONNECTION_STRING` | PostgreSQL/TimescaleDB connection string | `postgres://postgres:secretpassword@localhost:5433/spectraflow?sslmode=disable` |
| `GROQ_API_KEY` | Groq SDK key for autonomous evaluation agent | `gsk_your_groq_api_key_here` |
| `MODEL_NAME` | Inference model targeting autonomous evaluations | `llama-3.1-8b-instant` |

### 2. Boot the Storage Infrastructure
Spin up the local TimescaleDB and Redis containers with persistent volume mounts:
```bash
cd server
docker compose up -d
```
> **Note:** Configuration settings are defined in [docker-compose.yml](file:///d:/Projects/SpectraFlow/server/docker-compose.yml) and DB schemas are initialized via [init.sql](file:///d:/Projects/SpectraFlow/server/init.sql).

### 3. Start the Ingestion Engine & Workers
Launch the Go telemetry gateway running on [main.go](file:///d:/Projects/SpectraFlow/server/cmd/api/main.go):
```bash
cd server
go run cmd/api/main.go
```
The gateway engine will boot up background telemetry workers and listen for incoming trace payloads on `http://localhost:8080/v1/traces`.

### 4. Start the Web Console
Launch the Next.js frontend app:
```bash
cd client
npm run dev
```
Open `http://localhost:3000` to interact with the dashboard dashboard console.

---

## 📡 API Reference Specifications

### 1. Telemetry Ingestion Hot-Path
Submit execution traces asynchronously for indexing, semantic analysis, anomaly metrics, and evaluation tasks.

* **Endpoint:** `POST /v1/traces`
* **Content-Type:** `application/json`

#### Payload Schema
```json
{
  "id": "eadae7f4-6dca-4bfe-b51e-39a8ffd42238",
  "app_id": "5f271cf7-e49e-4540-b065-0d775de4d0ee",
  "session_id": "session-123",
  "model": "llama3-70b-8192",
  "prompt": "Write a highly optimized Go concurrent worker pool.",
  "response": "Here is a standard concurrent channel layout...",
  "prompt_tokens": 25,
  "completion_tokens": 140,
  "latency_ms": 202
}
```

### 2. Fetch Aggregated Metrics
Retrieve real-time metrics aggregates.

* **Endpoint:** `GET /v1/analytics/overview`
* **Query Parameter:** `app_id` (UUID string)

#### Response Schema
```json
{
  "total_traces": 7,
  "total_cost_usd": 0.000134,
  "avg_latency_ms": 202.00,
  "total_tokens": 675
}
```

### 3. Retrieve Active Alerts
Retrieve statistical anomalies or semantic drift security breaches.

* **Endpoint:** `GET /v1/analytics/alerts`
* **Query Parameter:** `app_id` (UUID string)

### 4. Fetch Embedding Drift Timeline
Retrieve geometric distance trends calculated against the application's centroid reference baseline.

* **Endpoint:** `GET /v1/analytics/drift`
* **Query Parameter:** `app_id` (UUID string)