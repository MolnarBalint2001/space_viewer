# 🌌 NASA Space Viewer

<div align="center">
  <h2>Pattern-driven geospatial insights for the 2025 NASA Space Apps Challenge</h2>
  <p>
    <strong>MolnarDuo</strong> • End-to-end toolkit for uploading satellite tiles, tagging attachments, and running AI-assisted pattern searches across the night sky.
  </p>

  <!-- 🛰️ TECH BADGES -->
  <p>
    <!-- Core Tech -->
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
    <img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" alt="PyTorch"/>
    <img src="https://img.shields.io/badge/Neo4j-008CC1?style=for-the-badge&logo=neo4j&logoColor=white" alt="Neo4j"/>
    <img src="https://img.shields.io/badge/PostGIS-008BB9?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostGIS"/>
    <img src="https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white" alt="RabbitMQ"/>
    <img src="https://img.shields.io/badge/MinIO-C72E49?style=for-the-badge&logo=minio&logoColor=white" alt="MinIO"/>
    <img src="https://img.shields.io/badge/KrakenD-2E2E2E?style=for-the-badge&logo=kraken&logoColor=white" alt="KrakenD"/>
    <img src="https://img.shields.io/badge/Elasticsearch-005571?style=for-the-badge&logo=elasticsearch&logoColor=white" alt="Elasticsearch"/>
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
    <img src="https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes"/>
  </p>

  <!-- ☁️ Infra & AI -->
  <p>
    <img src="https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white" alt="AWS"/>
    <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI"/>
    <img src="https://img.shields.io/badge/Sentence--Transformers-0A66C2?style=for-the-badge&logo=pytorchlightning&logoColor=white" alt="Sentence Transformers"/>
  </p>

  <!-- 🌍 Community & License -->
  <p>
    <img src="https://img.shields.io/badge/Open--Source-00A300?style=for-the-badge&logo=opensourceinitiative&logoColor=white" alt="Open Source"/>
    <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License: MIT"/>
    <img src="https://img.shields.io/badge/Contributions-Welcome-FFA500?style=for-the-badge&logo=github" alt="Contributions Welcome"/>
  </p>
</div>

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Service Guide](#service-guide)
6. [Environment Variables](#environment-variables)
7. [Developer Workflow](#developer-workflow)
8. [Troubleshooting](#troubleshooting)
9. [Contributing](#contributing)

---

## Project Overview

NASA Space Viewer is a multi-service platform that helps analysts ingest satellite data, explore attachment graphs, and detect celestial patterns in real-time. The system combines a TypeScript/Express API, a React-based admin console, and Python microservices for pattern detection and vector embeddings.

Key capabilities:

- **Dataset management** – upload rasters (TIF/MBTiles), describe studies, and broadcast sharing links.
- **Interactive map viewer** – render hosted tiles, inspect detected patterns, and overlay drawing tools.
- **Pattern finder service** – FastAPI microservice running RANSAC-based matching on star catalogs.
- **Attachment graph** – visualize relationships between datasets, documents, and tags (Neo4j).
- **Embedding service** – generates dense vector embeddings for text search and metadata enrichment.

---

## Repository Structure

```
.
├── admin-client/              # React (Vite) admin console
├── server/                    # TypeScript/Express API (TypeORM, Redis, RabbitMQ, Neo4j)
├── pattern-finder-service/    # FastAPI service for pattern detection in star maps
├── embedding_service/         # Flask + sentence-transformers embedding API
├── data/                      # Local storage for tiles/mbtiles and supporting assets
├── qdrant_data/               # Vector database storage (mounted into Qdrant container)
├── docker-compose.yml         # Infrastructure stack (PostGIS, Redis, RabbitMQ, Neo4j, MinIO, Qdrant, Tileserver)
└── README.md                  # You are here ✅
```

---

## Prerequisites

| Tool | Notes |
| ---- | ----- |
| **Node.js** | v20+ recommended (API + admin client) |
| **npm** | Bundled with Node; you can use `pnpm`/`yarn` if preferred |
| **Python** | 3.11+ (pattern finder & embedding services) |
| **Docker & Docker Compose** | For local infrastructure (PostGIS, Redis, MinIO, etc.) |
| **poetry/pip** | Either is fine for Python dependencies (examples use `pip`) |

Optional but useful:

- GDAL or raster utilities if you plan to preprocess MBTiles/TIF datasets
- Make or Taskfile for scripting repeated workflows

---

## Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/<your-org>/nasa-webviewer-app.git
   cd nasa-webviewer-app
   ```

2. **Start infrastructure with Docker Compose**

   The compose file provisions PostGIS, Redis, RabbitMQ, Neo4j, MinIO, Qdrant, and a tileserver.

   ```bash
   docker compose up -d
   ```

   > 💡 Verify containers with `docker compose ps` and wait until health checks report `healthy`.

3. **Install dependencies for each service**

   ```bash
   # Admin client
   cd admin-client
   npm install

   # API server
   cd ../server
   npm install

   # Pattern finder
   cd ../pattern-finder-service
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt

   # Embedding service
   cd ../embedding_service
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Configure environment variables**

   Copy the provided `.env` templates or create your own (see [Environment Variables](#environment-variables)). Adjust credentials for your local setup and replace placeholder API keys.

5. **Run the services**

   In separate terminals (or using a process manager):

   ```bash
   # API server
   cd server
   npm run dev

   # Admin client (Vite dev server)
   cd admin-client
   npm run dev

   # Pattern finder (FastAPI)
   cd pattern-finder-service
   uvicorn pattern_finder_service.app:app --reload --port 8001

   # Embedding service (Flask)
   cd embedding_service
   flask --app main.py run --port 8002
   ```

6. **Open the admin console**

   Visit `http://localhost:5173` (default Vite port) to access the Space Viewer admin experience.

---

## Service Guide

### Admin Client (`admin-client/`)

- **Stack:** React 19, Vite, PrimeReact, TanStack Query
- **Key scripts:**
  - `npm run dev` – start Vite dev server
  - `npm run build` – production build
  - `npm run lint` – ESLint (currently reports legacy `any` usage within map modules)
- **Configuration:** `src/config/globals.ts` for API endpoints, generated API clients in `src/config/api`
- **Features:** dashboard of pattern runs, map viewer overlay, dataset management UI, attachment graph explorer

### API Server (`server/`)

- **Stack:** TypeScript, Express, TypeORM, Redis, RabbitMQ, Neo4j, MinIO integrations
- **Key scripts:**
  - `npm run dev` – start development server (nodemon + tsx)
  - `npm run build` – compile via SWC
  - `npm run lint` / `npm run typecheck`
  - `npm run typeorm:run-migrations` – apply DB migrations
- **Docs:** OpenAPI spec in `server/docs/openapi.yaml`; regenerate typed clients with `npm run openapi:generate-admin`

### Pattern Finder Service (`pattern-finder-service/`)

- **Stack:** FastAPI, NumPy, SciPy, scikit-image, ONNX Runtime
- **Entry point:** `uvicorn pattern_finder_service.app:app`
- **CLI:** `python -m pattern_finder_service.cli --help`
- **Purpose:** run RANSAC-based similarity matching of star constellations against uploaded pattern definitions

### Embedding Service (`embedding_service/`)

- **Stack:** Flask, Sentence Transformers
- **Entry point:** `flask --app main.py run`
- **Purpose:** generate semantic embeddings for documents and labels that feed the search/indexing layers

### Supporting Infrastructure (`docker-compose.yml`)

| Service | Purpose | Default Port |
| ------- | ------- | ------------ |
| `db` | PostGIS database for metadata & tiles | 5432 |
| `redis` | Caching and job queues | 6379 |
| `rabbitmq` | Message broker for background processing | 5672 / 15672 |
| `neo4j` | Graph database for attachment relationships | 7474 / 7687 |
| `minio` | Object storage for uploads | 9000 / 9001 |
| `tileserver-gl` | Serves MBTiles as vector/rasters | 8080 |
| `qdrant` | Vector database for embeddings | 6333 / 6334 |

> 📦 Data volumes are mounted under `pgdata`, `redisdata`, `rabbitmq_data`, `neo4j-data`, `minio-data`, and `qdrant_data`. Clean them cautiously.

---

## Environment Variables

The repo ships with sample `.env` files. Create copies named `.env.local` (or similar) for development. Common variables:

| Variable | Location | Description |
| -------- | -------- | ----------- |
| `PORT` | `server/.env` | API listening port (default `3000`) |
| `DB_*` | `server/.env` | PostGIS connection settings |
| `ALLOWED_ORIGINS` | `server/.env` | Comma-separated list of frontend origins |
| `RABBITMQ_URL`, `RABBITMQ_EXCHANGE` | `server/.env` | Messaging config |
| `MINIO_*` | `server/.env` | Object storage credentials |
| `OPENAI_API_KEY` | `server/.env` | Required for AI-assisted enrichment – **replace with your key** |
| `PATTERN_SERVICE_URL` | `admin-client/src/config/globals.ts` | Points to FastAPI pattern finder |
| `EMBEDDING_SERVICE_URL` | `admin-client/src/config/globals.ts` | Points to embedding microservice |
| `WS_URL` | `admin-client/src/config/globals.ts` | WebSocket endpoint for realtime updates |

Additional services accept standard FastAPI/Flask environment settings (`HOST`, `PORT`, etc.). Configure according to your deployment target.

---

## Developer Workflow

| Task | Command |
| ---- | ------- |
| Lint admin client | `cd admin-client && npm run lint` |
| Build admin client | `cd admin-client && npm run build` |
| Lint API server | `cd server && npm run lint` |
| Type-check API server | `cd server && npm run typecheck` |
| Run pattern service tests (if added) | `pytest` inside `pattern-finder-service` |
| Regenerate API clients | `cd server && npm run openapi:generate-admin` |

Recommended flow:

1. Start Docker infrastructure.
2. Launch the API server, pattern service, and embedding service.
3. Run the Vite dev server for instant frontend feedback.
4. Use seeded datasets (place MBTiles in `data/mbtiles`) or upload through the UI.

---

## Troubleshooting

- **Containers aren’t healthy** – check logs with `docker compose logs <service>`; ensure ports are free.
- **Tiles not loading** – confirm MBTiles files exist under `data/mbtiles`, the tileserver container is running, and the API has access to `TILE_DIR`.
- **Realtime toasts missing** – verify `WS_URL` points to the API server’s WebSocket endpoint and that RabbitMQ/Redis are reachable.
- **Pattern search returns nothing** – validate tolerance and inlier thresholds in `pattern-finder-service/services/pattern_core.py`; ensure stars/pattern inputs share coordinate systems.
- **Lint errors** – known `any` usages remain in map components; address them before production builds if strict linting is required.

---

## Contributing

1. Fork the repository and create a feature branch.
2. Follow the setup steps above and ensure tooling runs cleanly.
3. Add tests or notes for new behaviour (FastAPI/Flask services support pytest).
4. Submit a PR describing the change, context, and any migration steps.

Thanks for exploring the NASA Space Viewer! 🚀

