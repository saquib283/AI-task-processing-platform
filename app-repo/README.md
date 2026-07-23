# AI TaskFlow — AI Task Processing Platform

A production-ready, full-stack asynchronous task processing platform built with the MERN stack, Python workers, Docker, Kubernetes, and Argo CD GitOps.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, TailwindCSS v4 |
| Backend API | Node.js + Express.js, TypeScript |
| Worker | Python 3.12, BullMQ, PyMongo |
| Database | MongoDB 7 (Mongoose) |
| Queue | Redis 7 (BullMQ) |
| Auth | JWT + bcrypt (cost factor 12) |
| Containerization | Docker multi-stage builds |
| Orchestration | Kubernetes (k3s-compatible) |
| GitOps | Argo CD |
| CI/CD | GitHub Actions |

## Repository Structure

```
├── app-repo/
│   ├── frontend/          # Next.js frontend
│   ├── backend/           # Express.js API
│   ├── worker/            # Python BullMQ worker
│   ├── docker-compose.yml # Local development
│   └── .github/workflows/ # CI/CD pipelines
├── infra-repo/
│   ├── base/              # Kustomize base K8s manifests
│   ├── overlays/
│   │   ├── staging/       # Staging config (1 replica, lower resources)
│   │   └── production/    # Production config (3-5 replicas, HPA)
│   └── argocd/            # Argo CD Application CRDs
└── docs/
    └── architecture.md    # Architecture document
```

## Local Development Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for IDE integration / non-Docker dev)
- Python 3.12+ (for non-Docker dev)

### Quick Start (Docker Compose)

```bash
# 1. Clone the repository
cd app-repo

# 2. Copy environment files
cp backend/.env.example backend/.env
cp worker/.env.example worker/.env
cp frontend/.env.example frontend/.env

# 3. Start all services
docker-compose up --build

# 4. Access the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000/api
# Health check: http://localhost:4000/api/health
```

### Local Development (without Docker)

```bash
# Terminal 1 — Start MongoDB and Redis (via Docker)
docker run -d -p 27017:27017 --name aitask-mongo mongo:7
docker run -d -p 6379:6379 --name aitask-redis redis:7-alpine

# Terminal 2 — Backend
cd app-repo/backend
cp .env.example .env
npm install
npm run dev

# Terminal 3 — Worker
cd app-repo/worker
cp .env.example .env
pip install -r requirements.txt
python -m src.main

# Terminal 4 — Frontend
cd app-repo/frontend
cp .env.example .env
npm install
npm run dev
```

### Environment Variables

See `.env.example` files in each service directory. Key variables:

| Variable | Service | Description |
|---|---|---|
| `MONGODB_URI` | Backend, Worker | MongoDB connection string |
| `REDIS_HOST` / `REDIS_PORT` | Backend, Worker | Redis connection |
| `JWT_SECRET` | Backend | JWT signing secret (min 32 chars) |
| `CORS_ORIGIN` | Backend | Allowed frontend origin |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend API base URL |
| `WORKER_CONCURRENCY` | Worker | Parallel jobs per worker (default: 5) |

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create account | No |
| POST | `/api/auth/login` | Login, receive JWT | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Tasks
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/tasks` | Create and enqueue task | Yes |
| GET | `/api/tasks` | List user's tasks (filtered, paginated) | Yes |
| GET | `/api/tasks/:id` | Get task detail with logs | Yes |
| POST | `/api/tasks/:id/rerun` | Re-run a completed/failed task | Yes |

### Utility
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |

## Deployment

### Kubernetes (Kustomize + Argo CD)

```bash
# Validate staging manifests
kubectl kustomize infra-repo/overlays/staging/

# Validate production manifests
kubectl kustomize infra-repo/overlays/production/

# Apply Argo CD applications
kubectl apply -f infra-repo/argocd/staging-app.yaml
kubectl apply -f infra-repo/argocd/production-app.yaml
```

### CI/CD Flow
1. Push to `develop` → CI builds + pushes Docker images → Updates staging manifests → Argo CD auto-syncs
2. Create git tag `v*` → CI builds production images → Creates PR on infra-repo → Manual merge triggers Argo CD sync

## Assumptions

1. **Container registry**: Docker Hub with namespace `aitaskplatform` (can be changed to any registry by updating workflow env vars)
2. **No live K8s cluster**: Manifests are validated with `kubectl kustomize --dry-run`; no live deployment screenshot available
3. **BullMQ for queue**: Chosen over raw Redis LPUSH/BRPOP for its built-in retry, backoff, stall detection, and native Python interop
4. **MongoDB single instance**: For production, consider MongoDB Atlas or a replica set for HA
5. **Redis single instance**: For production, use Redis Sentinel or Cluster for HA
6. **TailwindCSS v4**: Uses CSS-first configuration (`@import "tailwindcss"`) instead of v3's `tailwind.config.js`
7. **Frontend polling**: Uses 2-second polling instead of WebSockets for simplicity; WebSockets would reduce latency but add complexity
8. **Rate limiting**: Auth endpoints at 5 req/min, task endpoints at 30 req/min per IP

## Security Checklist

- [x] bcrypt password hashing (cost factor 12)
- [x] JWT auth with short-lived access tokens (15min) + refresh tokens (7d)
- [x] Helmet middleware (security headers)
- [x] Rate limiting on auth and task endpoints
- [x] Zod input validation on all API inputs
- [x] CORS locked to known origins
- [x] No secrets in git (`.env.example` templates + K8s Secret templates)
- [x] Non-root users in all Docker containers
- [x] Request body size limited to 5MB

## License

MIT
