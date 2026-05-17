# Intelligent Vehicle Media Auditor

A high-performance asynchronous image analysis pipeline, anti-fraud auditor, and background worker system designed to process, analyze, and validate vehicle uploads.

* **Git Repository**: [https://github.com/aman-ak-r/ginger_media](https://github.com/aman-ak-r/ginger_media)

---

## 🏗️ Architecture

The backend is designed around an asynchronous, decoupled queue architecture that isolates CPU-intensive image processing from REST API operations, ensuring high availability and robust performance.

### 1. Service & Processing Flow
The lifecycle of an image upload proceeds through a highly structured multi-stage validation, queue, and UI diagnostics cycle:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Client (Web UI Dashboard)                          │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │  POST /api/uploads (multipart/form-data)
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  Unified Application Process (Docker Container)             │
│                                                                             │
│   ┌───────────────────────────┐         ┌───────────────────────────────┐   │
│   │    Express HTTP Server    │         │     BullMQ Worker Thread      │   │
│   │   • Magic byte checks     │         │   • Fetch image from Disk     │   │
│   │   • Raw file persistence  │         │   • Concurrency level: 2      │   │
│   │   • Postgres job logger   │         │   • Laplacian edge checks     │   │
│   │   • Redis task enqueuer   │         │   • Write final SQL results   │   │
│   └─────────────┬─────────────┘         └───────────────▲───────────────┘   │
└─────────────────┼───────────────────────────────────────┼───────────────────┘
                  │  enqueue({ jobId })                   │  poll / lease
                  ▼                                       │
┌─────────────────────────────────────────────────────────┴───────────────────┐
│                           Redis Cache Broker                                │
│                   (BullMQ backed, atomic queue locks)                       │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PostgreSQL Database                               │
│            (Prisma 7 Edge Engine Client + WASM pg driver pool)              │
└─────────────────────────────────────────────────────────────────────────────┘
```

1.  **Ingress, Rate-Limiting & Validation**: The client submits a `POST /api/uploads` request containing the multipart file buffer. Express intercepts the request, the custom sliding-window **Rate Limiter** evaluates historical IP timestamps, Multer performs size validations, and custom middleware inspects the file stream.
2.  **State Initialization & Disk Persistence**: The server persistently writes the raw file to `/uploads` under a unique UUID-based folder, inserts a `pending` status log inside PostgreSQL, enqueues the task inside Redis, and returns a `201 Created` ticket with the `jobId` to the client.
3.  **Real-time Polling & Analytics Dashboard**: The visual web dashboard catches the returned ID and polls `GET /api/uploads/:jobId/status` every 1 second.
4.  **Asynchronous Analysis**: The worker thread pulls the task lease, updates the job status to `processing`, and runs all analysis modules (blur edge convolutions, perceptual duplicate hashing, brightness calculations, and EXIF checks) concurrently.
5.  **Finalization**: The worker logs individual check parameters inside `analysis_results` and updates the `ImageJob` record to `completed` or `failed` with a final quality status tag. The client dashboard picks up the finished status and queries `GET /api/uploads/:jobId/results` to slide open the comprehensive audit sidebar panel.

---

### 2. Queue Strategy
To secure atomic task delivery and avoid event-loop blocking, we leverage **BullMQ** backed by a high-performance Redis cache broker:
*   **Concurrency Tuning (`concurrency: 2`)**: Image convolutions are highly CPU-bound operations. Restricting the worker thread lock to a concurrency factor of `2` per process ensures complete core utilization without starving the concurrent Express API request loop.
*   **Decoupled Multi-Process Support**: While packaged inside a single container for resource efficiency in this deployment, the API server and the BullMQ workers are structurally isolated. They communicate exclusively via Redis TCP connections, allowing workers to scale out horizontally under load without modification.
*   **Backoff Retries**: Transient failures (like database connection pool exhaustion) automatically trigger exponential backoff retries (e.g. retry 1 after 2s, retry 2 after 4s) to guarantee eventual consistency.

---

### 3. Major Design Decisions

*   **Integrated HTML/JS Glassmorphic Dashboard UI**:
    *   *Problem*: Spawning a separate React/Vite container increases staging complexity, increases build times, and requires extra proxy setups.
    *   *Decision*: We designed a visually jaw-dropping single-page application at `backend/public/` using premium CSS-glassmorphic styling, custom Lucide vector icons, dynamic HSL glow states, smooth slide-out drawers, and instant drag-and-drop file uploading. This is served directly by the Express process via `express.static('public')`, giving recruiters an out-of-the-box dynamic visual audit experience at `http://localhost:3000` with zero extra steps.
*   **Custom In-Memory Sliding-Window Rate Limiter**:
    *   *Problem*: Adding external rate-limiting packages increases dependencies, raises CommonJS/ESM module import conflicts, and creates extra configuration overhead.
    *   *Decision*: We wrote a clean, dependency-free sliding-window rate limiting middleware in `src/api/middleware/rateLimiter.ts`. It maps historical IP timestamps inside an memory cache and filters out timestamps older than 60s, returning a detailed `429 Too Many Requests` code if clients upload more than `10` images per minute.
*   **Perceptual Hashing (pHash) over Cryptographic Hashing (MD5/SHA-256)**: 
    *   *Problem*: Cryptographic hashes change entirely with any re-encoding. Saving a vehicle photo at JPEG quality 90 vs 95 changes the SHA-256 hash completely.
    *   *Decision*: We generate a 64-bit gradient Perceptual Hash (pHash). This downscales the image and evaluates intensity differences between pixels, catching visually identical duplicates even if they have been cropped, compressed, or resized.
*   **Prisma 7 WebAssembly Edge Adapters**:
    *   *Problem*: In Prisma 7, the traditional direct query engines are deprecated inside edge/container environments.
    *   *Decision*: We migrated the database layer to utilize a **WebAssembly-based client driver adapter** (`@prisma/adapter-pg` + standard `pg` Pool). This decouples the database engine from glibc/musl binary files, enabling compiled code to run cleanly inside slinned Docker containers.

---

## 🛠️ Running Instructions

### 1. Production Docker Staging (Recommended 🚀)
Compiles the TypeScript code, executes database migrations, and boots all persistent services automatically.

**Command:**
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
*   **Visual Web Dashboard & API**: `http://localhost:3000`
*   **PostgreSQL**: Mapped to host port `5433` (internal port `5432`)
*   **Redis**: Mapped to host port `6379`

---

### 2. Local Manual Development Setup

**Steps:**
1. Navigate to the project directory:
   ```bash
   cd backend
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Start the support containers (Postgres + Redis):
   ```bash
   docker compose up -d
   ```
4. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
5. Apply database schema migrations:
   ```bash
   npx prisma migrate dev
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

---

### 3. Seed & Test Verification Scripts 🧪
We have provided custom scripts in the root directory to verify database connectivity and transaction performance:

*   **Database Seeding**: Writes simulated completed image jobs and duplicate hashes into your local database to populate the duplicate check index:
    ```bash
    npx tsx seed-db.ts
    ```
*   **Connectivity Verification**: Queries and reports the active row counts inside your database to verify the Prisma connection adapter:
    ```bash
    npx tsx test-db.ts
    ```

---

## 📡 API Reference & Payload Formats

### 1. Upload Vehicle Image
`POST /api/uploads`
*   **Body**: `multipart/form-data`
*   **Field**: `image` (File buffer, max 10MB)
*   **Rate Limits**: Secured up to `10` uploads per minute per IP.

#### Sample Curl Request:
```bash
curl -X POST -F "image=@/path/to/car.jpg" http://localhost:3000/api/uploads
```

#### Response (`201 Created`):
```json
{
  "jobId": "f5f242cb-b4e8-466d-a128-d3c52e46b9a8",
  "status": "pending",
  "message": "Image uploaded successfully. Processing started.",
  "uploadedAt": "2026-05-17T09:46:39.597Z"
}
```

---

### 2. Get Full Quality Analysis Results
`GET /api/uploads/:jobId/results`

#### Sample Curl Request:
```bash
curl http://localhost:3000/api/uploads/f5f242cb-b4e8-466d-a128-d3c52e46b9a8/results
```

#### Response (`200 OK`):
```json
{
  "jobId": "f5f242cb-b4e8-466d-a128-d3c52e46b9a8",
  "status": "completed",
  "overallStatus": "clean",
  "issueCount": 0,
  "processingDurationMs": 242,
  "checks": [
    {
      "check": "blur_detection",
      "status": "passed",
      "confidence": 0.88,
      "detail": "Image is sharp. Sharpness score: 176.45"
    },
    {
      "check": "brightness_analysis",
      "status": "passed",
      "confidence": 1.0,
      "detail": "Brightness level: 124.50/255"
    },
    {
      "check": "duplicate_detection",
      "status": "passed",
      "confidence": 0.12,
      "detail": "No duplicates detected. Highest similarity: 12.0%"
    },
    {
      "check": "dimension_validation",
      "status": "passed",
      "confidence": 1.0,
      "detail": "Dimensions: 1920x1080"
    },
    {
      "check": "metadata_analysis",
      "status": "passed",
      "confidence": 0.9,
      "detail": "Camera: Apple iPhone 15. Metadata appears consistent."
    }
  ],
  "metadata": {
    "originalFilename": "car.jpg",
    "fileSizeBytes": 204850,
    "mimeType": "image/jpeg",
    "dimensions": { "width": 1920, "height": 1080 },
    "format": "jpeg",
    "space": "srgb",
    "channels": 3,
    "density": 72,
    "hasAlpha": false
  },
  "summary": "0 issue(s) detected"
}
```

---

## ⚖️ Trade-offs & Operational Disclosures

### 1. What Was Intentionally Simplified
*   **No Multi-Role Authentication**: API routes are unauthenticated for staging simplicity. A production architecture would enforce API key validation or JWT headers.
*   **Local File System Storage**: Images are written directly to local folders rather than dedicated cloud storage (like AWS S3).
*   **Linear Duplicate Queries**: To verify duplicate hashes, the worker queries completed jobs from the database and runs Hamming calculations in memory. For massive scale, this would be delegated to a vector search database or localized Locality-Sensitive Hashing (LSH) indexing service.

### 2. What We Would Improve With More Time
*   **S3 Storage Provider Abstraction**: Swap local file writing with an S3 Client class using direct multi-part uploads to AWS bucket volumes.
*   **Job Prioritization Policies**: Introduce priority queuing to ensure high-priority vehicle audits (e.g. premium dealers) are prioritized over standard queues.
*   **Stuck-Job Reclaiming sweeps**: An active sweeping process to reset jobs stuck in `processing` back to `pending` if a container crashes mid-task.

### 3. Scalability Concerns
*   **CPU Concurrency Limits**: High-concurrency upload spikes will block node execution pools if workers are run on the same CPU cores as the HTTP thread. Scaling requires splitting workers into separate instances.
*   **Storage Exhaustion**: Storing raw images on single SSD volumes will quickly deplete storage pools at high upload volumes (e.g. 10k uploads/day).
*   **Database Lock Contention**: Writing five concurrent check result rows per image can create transactional lock delays in PostgreSQL during high-throughput batches.

### 4. Failure Handling Concerns
*   **Orphan File Retention**: If a database transaction fails after an image has already been saved to `/uploads`, an orphaned file is left on disk. A periodic sweeping service is needed to match files with database keys.
*   **Lack of Dead-Letter Alerting**: Failed tasks sit silently inside Redis with no PagerDuty or Slack alert notifications, leading to silent processing blockages.

---

## 🤖 AI Usage Disclosure
In accordance with standard assignment compliance guidelines:
*   **Where AI was used**: Assisted in scaffolding the database schema design and drafting initial structures for the BullMQ queue workers.
*   **What AI helped with**: Generating boilerplate type definitions and suggesting standard Laplacian edge variance thresholds.
*   **Where AI output was wrong**: Initial AI code generated obsolete CommonJS modules and direct database client engines that conflicted with modern ESM requirements and Prisma 7 edge constraints. Resolved manually by implementing `@prisma/adapter-pg` driver adapters and updating tsconfig import resolutions.
*   **How you validated AI-generated code**: Verified all code through local compilation tests, manual database transactions, and multi-container Docker validation.
