# AI TaskFlow — Architecture Document

## 1. System Architecture Overview

AI TaskFlow is an asynchronous task processing platform following a **producer-consumer** architecture. Users interact through a Next.js frontend, which communicates with an Express.js API. Tasks are enqueued into Redis via BullMQ and consumed by horizontally-scalable Python workers.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          KUBERNETES CLUSTER                             │
│                                                                         │
│  ┌──────────┐     ┌──────────────┐     ┌──────────┐                    │
│  │ Next.js  │────▶│ Express.js   │────▶│ MongoDB  │◀─── (status read)  │
│  │ Frontend │     │ API Server   │     │          │                    │
│  │ (N pods) │◀────│ (N pods)     │     └──────────┘                    │
│  └──────────┘     └──────┬───────┘           ▲                         │
│       ▲                  │                   │                         │
│       │           ┌──────▼───────┐     ┌─────┴──────┐                  │
│   (polls)         │    Redis     │────▶│  Python    │                  │
│                   │  (BullMQ)    │     │  Workers   │                  │
│                   └──────────────┘     │  (N pods)  │                  │
│                                       └────────────┘                  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Ingress Controller (nginx)                                     │    │
│  │  aitaskflow.example.com → frontend-svc                          │    │
│  │  api.aitaskflow.example.com → backend-svc                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow
1. **User creates task** → Frontend POST to API → API saves task (status=`pending`) to MongoDB → API pushes job to Redis queue
2. **Worker picks up job** → BRPOP from Redis (atomic, no double-processing) → Updates status to `running` → Processes operation → Updates status to `success`/`failed` with result and logs
3. **Frontend polls** → GET /api/tasks/:id every 2s while status is `pending`/`running` → Reflects updates in real time

---

## 2. Worker Scaling Strategy

### Horizontal Scaling
Workers are **stateless consumers** — scaling is achieved by increasing the `replicas` count on the Kubernetes Deployment.

- **BullMQ guarantees** atomic job claiming via Redis BRPOP + Lua scripts
- **No double-processing**: Each job is delivered to exactly one worker
- **Concurrency**: Each worker pod handles `WORKER_CONCURRENCY` (default: 5) concurrent jobs via Python asyncio
- **Effective parallelism** = `replicas × WORKER_CONCURRENCY`

### Autoscaling (HPA)

| Environment | Min Replicas | Max Replicas | Scale Metric |
|---|---|---|---|
| Staging | 1 | 2 | CPU > 70% |
| Production | 5 | 20 | CPU > 70% |

Production at max scale: `20 pods × 10 concurrency = 200 concurrent jobs`

---

## 3. Handling ~100,000 Tasks/Day

### Throughput Math

- **100,000 tasks/day** = ~1.16 tasks/second average, ~5-10 tasks/second peak
- **Average processing time per task**: ~50ms (text operations are CPU-trivial)
- **Single worker pod throughput**: `1000ms / 50ms × 5 concurrency = 100 tasks/second`
- **2 worker pods** (staging) can handle: 200 tasks/second → **17.28M tasks/day** (172× headroom)
- **5 worker pods** (production minimum) can handle: 500 tasks/second

### Bottleneck Analysis

| Component | Capacity | Notes |
|---|---|---|
| Redis | 100,000+ ops/sec | Not a bottleneck for this scale |
| MongoDB writes | ~10,000 writes/sec per node | Compound indexes keep query time < 5ms |
| API server | ~2,000 req/sec per pod | 3 pods = 6,000 req/sec capacity |
| Worker | 100 tasks/sec/pod | HPA adds pods if CPU > 70% |

### Queue Backpressure
- BullMQ stores jobs in Redis lists — Redis handles millions of queued items
- `maxmemory-policy: noeviction` prevents job loss under memory pressure
- Monitoring: Track queue length via Redis `LLEN` and alert if queue depth exceeds threshold (e.g., > 10,000 pending)

---

## 4. MongoDB Indexing Strategy

### Indexes

| Index | Fields | Purpose | Query Pattern |
|---|---|---|---|
| Email (unique) | `users.email` | Login lookups, duplicate prevention | `findOne({ email })` |
| User+Created (compound) | `tasks.{userId: 1, createdAt: -1}` | Dashboard task listing with sort | `find({ userId }).sort({ createdAt: -1 })` |
| Status | `tasks.status` | Filter by status | `find({ status: 'pending' })` |
| Status+Created (compound) | `tasks.{status: 1, createdAt: -1}` | Admin monitoring queries | `find({ status }).sort({ createdAt: -1 })` |

### Rationale at Scale (~100k tasks/day)
- After 1 year: ~36.5M task documents
- The `{userId: 1, createdAt: -1}` compound index ensures O(log n) lookups for any user's dashboard query, avoiding full collection scans
- Index size estimate: ~2GB for 36.5M documents (well within RAM on a 4GB+ instance)
- Status index enables efficient worker monitoring and retry queries

### Write Optimization
- Log entries are appended via `$push` (atomic array append, no full document rewrite)
- Status updates use `$set` on indexed field — Mongo updates the index in-place

---

## 5. Redis Failure Handling & Recovery

### Scenarios

| Scenario | Impact | Recovery Strategy |
|---|---|---|
| **Redis restart** | Queued jobs are lost (default Redis config) | Enable Redis AOF persistence (`appendonly yes`) for durability |
| **Worker crash mid-job** | Job may be in `running` state with no completion | BullMQ tracks job state — stalled jobs are automatically retried (3 attempts with exponential backoff) |
| **Redis connection loss** | Workers and API cannot enqueue/dequeue | BullMQ reconnects automatically with exponential backoff. Jobs submitted during outage return 503 to users |
| **Network partition** | Workers may not receive jobs | Redis Sentinel or Redis Cluster for HA in production |

### Idempotency Safety
- Before processing, the worker checks if the task is already in a terminal state (`success`/`failed`). If so, it skips processing silently.
- This prevents data corruption from duplicate delivery after retries.

### Production Recommendations
1. **Redis persistence**: Enable AOF with `appendfsync everysec` for durability with minimal performance impact
2. **Redis HA**: Use Redis Sentinel or Redis Cluster for automatic failover
3. **Job TTL**: Remove completed jobs after 24 hours to prevent unbounded memory growth (`removeOnComplete: { age: 86400 }`)
4. **Monitoring**: Alert on `bullmq:task-processing:wait` list length, connection errors, and stalled job counts

---

## 6. Deployment Strategy: Staging vs Production

### Environment Differences

| Aspect | Staging | Production |
|---|---|---|
| Backend replicas | 1 | 3 |
| Worker replicas | 1 (HPA: 1-2) | 5 (HPA: 5-20) |
| Frontend replicas | 1 | 2 |
| Worker concurrency | 5 | 10 |
| Argo CD sync | Auto (self-heal) | Manual (requires approval) |
| Resource limits | Lower (256Mi/250m) | Higher (1Gi/1 CPU) |
| MongoDB | Shared instance | Dedicated StatefulSet or Atlas |
| Ingress host | staging.aitaskflow.example.com | aitaskflow.example.com |

### Promotion Process (GitOps)

```
1. Developer merges PR → develop branch
2. CI builds Docker images tagged with git SHA
3. CI updates infra-repo staging overlay with new image tags (automated commit)
4. Argo CD detects drift → auto-syncs staging cluster
5. Team validates on staging
6. Developer creates git tag (v1.x.x) from main
7. CI builds production images tagged with version
8. CI creates PR on infra-repo production overlay
9. Team reviews PR → merges
10. Argo CD detects change → team manually syncs production
```

This ensures:
- **Full auditability**: Every production change is a git commit
- **Rollback**: Revert the infra-repo commit, Argo CD auto-syncs to previous state
- **No direct kubectl**: All changes flow through git
