# 03 · Platform & Serving Architecture
## In-Planted / Climate Resilient ATL — the production software backbone

> **What this document is.** The companion to `spec-driven/backend-architecture/spec.md` (the *demo-now* stack: Python pipeline → committed JSON → JS engine → print-PDF, $0 infra). This doc specifies the **production system architecture** that ties together the geospatial data layer, the heavy calculation/simulation engine, the 3D digital-twin frontend, and report generation — and that scales **one building → portfolio → multiple cities**.
>
> **Posture:** AWS-first (the team has Cox Automotive / ALKS access), but every choice notes a portable alternative so we are never trapped. Bias: **pragmatic startup path**, not a reference-architecture cathedral. We build the minimum that makes the demo numbers real and persistent, then add capability tier by tier.
>
> **Audience:** the engineering team turning the hackathon prototype into a product.
>
> **Verification note:** AWS service *limits and pricing patterns* below were checked against 2025–26 sources (linked at the end). Anything I could not pin to a current source is marked **[verify]**. Treat all dollar figures as order-of-magnitude planning numbers, not quotes.

---

## 0. Headline decisions (read this first)

| Decision | Recommendation | Why |
|---|---|---|
| **Overall shape** | **Modular monolith API + an async compute plane**, *not* microservices on day one | A startup-stage team ships faster behind one deployable API. The one hard split that pays for itself immediately is **sync API ↔ async heavy-compute** — because EnergyPlus/SWMM/SAM runs blow past any request timeout. Keep everything else as modules in one service until a seam actually hurts. |
| **Heavy compute** | **SQS queue → AWS Batch (Fargate) workers, orchestrated by Step Functions; results cached in S3 + Postgres** | Simulations run minutes-to-hours and need real CPU/RAM (and sometimes GPU) — Lambda's 15-min ceiling rules it out. Batch is purpose-built for this and scales to zero. Step Functions sequences the multi-step pipeline (extract → simulate → score) with retries and is itself serverless. |
| **Data store** | **Aurora PostgreSQL Serverless v2 + PostGIS** as the system of record; **S3** for rasters (COG) and 3D assets; **DynamoDB or Postgres table** for the results/job cache | PostGIS gives geospatial joins, portfolio queries, and (via `postgis_raster`) direct COG access — the same schema the demo already calls "DB-ready." Serverless v2 scales to near-zero between hackathon and first customers. |
| **3D twin serving** | **Pre-tile to 3D Tiles / glTF in S3, serve through CloudFront; keep React+Three.js client**; Cesium only if we need a true globe | The asset pipeline (footprint+LiDAR → glTF/3D Tiles) is the scaling unlock, not the renderer. Sun-path stays **client-side precomputed** (the demo's cheap-arithmetic `evalTimeDependent`) so interactivity never hits the network. |
| **API style** | **REST (OpenAPI) first; add GraphQL only if the twin's read-graph gets chatty** | REST is enough for "get building, get scores, request report." GraphQL is a later optimization for the nested twin reads, not a starting requirement. |
| **Report generation** | **Async export: a containerized headless-Chrome (Playwright) renderer on Fargate/Batch, triggered via queue, output to S3 + presigned URL** | The demo's `window.print()` HTML survives unchanged — production just renders the *same HTML template* server-side. Async because multi-page vendor packets + map snapshots take seconds, not milliseconds. |
| **Multi-tenancy** | **Pooled (shared infra) with Postgres row-level security keyed on `tenant_id`; Cognito for identity** | Standard AWS SaaS guidance for startups: start pooled, promote a tenant to silo only when compliance/scale demands it (bridge model). |
| **IaC / CI-CD** | **AWS CDK (TypeScript) + GitHub Actions**, deployed into an **ALKS-vended account/role** | CDK keeps infra in the same language as the frontend; ALKS is how CAI vends short-lived AWS credentials, so CI assumes an ALKS role rather than holding static keys. |

**The one rule that drives the whole shape:** *the request path must never wait on a simulation.* Everything else follows from separating the fast read/write API from the slow compute plane.

---

## 1. Service decomposition

### 1.1 The logical services (what they do)

Even inside a modular monolith, these are the **bounded responsibilities**. Day-one they are *modules/packages* behind one API; the table's "Split when" column says when each earns its own deployable.

| # | Service / module | Responsibility | Day-1 form | Split when |
|---|---|---|---|---|
| S1 | **API Gateway / BFF** | Front door: auth, routing, request validation, presigned-URL minting | API Gateway (HTTP API) + one app behind it | rarely — keep as the seam |
| S2 | **Auth & Tenanting** | Identity, tenant resolution, RLS context, API keys | Cognito + a thin authorizer | when you add SSO/SAML for enterprise tenants |
| S3 | **Data-ingestion** | Pull CBEEO/footprints/NLCD/PVWatts/eGRID; normalize to the `Building` schema; provenance tags | the existing Python pipeline, containerized, run on Batch or scheduled | when ingestion cadence/volume needs its own scaling |
| S4 | **Geometry / surface-extraction** | Address → footprint → roof surfaces → glTF/3D-Tiles asset; area/azimuth in UTM | Python (geopandas/shapely/rasterio) container | when tiling for whole cities becomes a standing workload |
| S5 | **Simulation / calc workers** | Run EnergyPlus / SWMM / SAM / PVWatts as jobs; emit raw results | containerized solvers on **AWS Batch** | already its own plane — keep separate |
| S6 | **Scoring / optimization** | The 7-metric engine + composite + ranking + conflict resolution | **shared JS engine** (runs in browser *and* in a Node Lambda for server-of-record scoring) | when optimization (portfolio sequencing) becomes heavy → its own worker |
| S7 | **Report generation** | Assemble report JSON → HTML → PDF (master + fan-out briefs) | Playwright-on-Fargate renderer, queue-triggered | it is already async — keep separate |
| S8 | **Twin asset server** | Serve 3D Tiles / glTF / textures with LOD | **S3 + CloudFront** (static, no service) | only if you need dynamic tiling/auth-per-tile |
| S9 | **Job orchestration** | Sequence S3→S4→S5→S6 per building; retries; status | **Step Functions** | — (managed) |

> **Why share the scoring engine (S6) across client and server?** The demo's hard rule — *the twin recomputes live on the sun slider with zero network* — only holds if the same pure JS formulas run in the browser. In production those identical modules also run server-side (Node) to produce the **authoritative, persisted** scores that back the report and the portfolio rankings. One codebase, two runtimes, guaranteed-identical numbers. This is the most important continuity between the demo and production: **do not fork the engine.**

### 1.2 Monolith vs. microservices vs. serverless — the call

- **Microservices: no (not yet).** A 1–5 person team paying the network/ops tax of 9 services will out-spend its runway on plumbing. Distributed transactions across "scoring" and "report" buy nothing at this scale.
- **Pure serverless (everything Lambda): no.** Lambda's **15-minute max** and 10 GB/6-vCPU ceiling [verify pricing] kill long EnergyPlus/SWMM runs and large Chromium PDF jobs. Lambda *is* right for the thin, fast pieces (authorizer, scoring-of-record, presign, webhooks).
- **Recommendation: modular monolith API (one container/Lambda app) + a serverless-orchestrated async compute plane.** This is the "majestic monolith with a job queue" pattern. You get one thing to deploy and debug, plus unbounded compute where it's actually needed. Promote a module to its own service only when a real seam (independent scaling, separate release cadence, blast-radius isolation) appears.

---

## 2. Heavy-compute orchestration

The slow, expensive part. EnergyPlus (whole-building energy), SWMM (stormwater), SAM/PVWatts (solar) and surface extraction are **minutes-to-hours**, CPU/RAM-bound, sometimes GPU-bound. They must be **async jobs**, never in the request path.

### 2.1 The compute plane

```
client ──POST /buildings/{id}/analyze──▶ API ──▶ Step Functions execution
                                                      │
        ┌─────────────────────────────────────────────┼─────────────────────────────────┐
        ▼                     ▼                         ▼                                  ▼
  [extract geometry]   [run PVWatts/SAM]        [run EnergyPlus]                  [run SWMM]
  Batch (Fargate)      Lambda or Batch          Batch (Fargate, big RAM)         Batch (Fargate)
        │                     │                         │                                  │
        └──────────writes raw results to S3 (keyed by input-hash)────────────────────────┘
                                                      │
                                              [score + persist]
                                              Lambda (shared JS engine) → Aurora/PostGIS
                                                      │
                                              status → client (poll or WebSocket/EventBridge)
```

### 2.2 Worker placement — the decision matrix

| Workload | Run on | Why |
|---|---|---|
| **EnergyPlus, SWMM** (long, heavy, containerized solvers) | **AWS Batch on Fargate** | Batch is purpose-built for batch jobs that run hours, dynamically provisions CPU/GPU/memory-optimized capacity, and scales to zero. NREL ships an official `nrel/energyplus` Docker image — we wrap it. |
| **PVWatts** (a single HTTPS call) | **Lambda** | Sub-second; no container weight needed. This is the demo's hero path, now server-side and cached. |
| **SAM** (NREL System Advisor, heavier than PVWatts) | **Batch** if we run the full model; Lambda if we use the SAM SDK for light cases | depends on fidelity tier |
| **Geometry/tiling** (footprint → glTF, raster sampling) | **Batch (Fargate)**, GPU pool only if mesh-decimating at city scale | bursty, parallelizable per-building |
| **Scoring** (pure JS, ms) | **Lambda** | fast, scales horizontally, identical code to the client engine |

> **Why Batch over raw Fargate/ECS for the solvers?** ECS/Fargate is a great *service* runtime but you'd hand-build the queue, retry, array-job fan-out, and spot-bidding that Batch gives free. Batch sits *on* Fargate (or EC2/Spot) and adds the batch semantics. **Alternative / portable:** Kubernetes + Argo Workflows (or Volcano) if we ever leave AWS or want one orchestration story across clouds.

### 2.3 Orchestration — Step Functions (with a fallback)

- **Use AWS Step Functions** to sequence extract → simulate (parallel branches) → score → persist, with built-in retry/catch, parallel `Map` states for portfolios (fan out across N buildings), and direct Batch/Lambda integration. It is **serverless and pay-per-transition**, so it costs ~nothing when idle — ideal for spiky startup load. Step Functions itself is the recommended AWS-native orchestrator over MWAA for this kind of service workflow; **MWAA (managed Airflow) carries a fixed always-on environment cost** and is better suited to standing data-engineering DAGs than per-request job graphs.
- **Alternatives & when to switch:**
  - **Temporal** — choose if workflows get genuinely complex/long-lived and the team wants to author them as code in one language with fine-grained retry/saga control. More operational ownership (self-host or Temporal Cloud).
  - **Dagster / Airflow (MWAA)** — choose for the *data-ingestion* side (S3) once it's a scheduled, asset-aware pipeline across many cities. Reasonable to run Step Functions for per-request analysis **and** Dagster for nightly bulk ingestion — they don't conflict.

### 2.4 Result caching & cost control (this is what keeps the bill sane)

- **Content-addressed cache.** Hash the *normalized simulation inputs* (geometry + weather file + parameters) → that hash is the S3 key and a Postgres `simulation_results` row. Re-running the same building with the same inputs is a **cache hit, $0 compute.** This is the single biggest lever — EnergyPlus runs are expensive and inputs rarely change between report regenerations.
- **Spot capacity** for Batch (EnergyPlus/SWMM are restartable) → typically 60–90% cheaper than on-demand [verify current spot discount].
- **Scale-to-zero everywhere:** Batch compute env min vCPUs = 0, Aurora Serverless v2 min ACUs near zero, Lambda/Step Functions/SQS are inherently zero-idle. The platform should cost **single-digit dollars/month when nobody's using it.**
- **Tiered fidelity:** default to the demo's *empirical* formulas (instant, free); only dispatch a full EnergyPlus/SWMM run when a user explicitly requests "high-fidelity" or when a report is finalized. Don't burn a simulation on every slider drag.
- **Job TTL + dead-letter queue** on SQS so a poison job can't loop and rack up cost.

---

## 3. Data stores

| Data | Store | Notes |
|---|---|---|
| **System of record** (buildings, surfaces, packages, scores, reports, tenants, jobs) | **Aurora PostgreSQL Serverless v2 + PostGIS** | Geospatial joins (building ↔ parcel ↔ flood zone ↔ tree canopy), portfolio queries ("top N by composite"), and tenant RLS. `postgis_raster` can read **COGs directly from S3 over HTTP RANGE** — no raster ingest needed. Aurora also supports `h3-pg` for hex-grid spatial indexing at city scale. |
| **Rasters** (NLCD impervious, Landsat/MODIS LST, DEM) | **S3 as Cloud-Optimized GeoTIFF (COG)** | COG = one file, HTTP-range-readable; PostGIS/GDAL samples a pixel without downloading the tile. The pipeline already samples NLCD at the roof centroid — this just moves the raster to S3. |
| **3D assets** (glTF, 3D Tiles, textures, twin states) | **S3 + CloudFront** | Static, immutable, content-hashed filenames → infinite cache. |
| **Results / job cache** | **Postgres table** (`simulation_results`, input-hash PK) for the hackathon→early stage; promote hot lookups to **DynamoDB** or **ElastiCache** only if read latency demands it | start simple — one fewer store to run |
| **Reports / exports** (PDF, vendor packets) | **S3** with lifecycle expiry + presigned URLs | async export drops here; client downloads via presigned URL |
| **Bulk analytics** (cross-city portfolio analytics, future) | **Athena over S3 Parquet** (and Snowflake/Redshift only if a BI need emerges) | Athena is serverless, pay-per-scan — right for ad-hoc cross-tenant city analytics; **do not** put it in the transactional path. The CAI org already runs Snowflake (MCP connectors exist) — that's the natural home if analytics graduates to a warehouse. |

**Per-building "model" persistence & versioning.** The `Building` + `CandidateSurface[]` + emitted `Score[]` JSON (the demo's data contract) becomes rows in Postgres, but **keep the JSON contract as the API/interchange shape** — the schema is already DB-ready per the backend spec. Version it two ways:
1. **`engine_version`** stamped on every score/report (already in the report schema) → reproduce any past report.
2. **Immutable result snapshots in S3** keyed by `{building_id}/{engine_version}/{input_hash}.json` → a building's analysis history is an append-only log, never an in-place mutation. This gives portfolio time-series ("how did this building's composite change as we added solar?") for free.

> **PostGIS vs. pure-Athena for the geospatial layer:** PostGIS for the *transactional, low-latency, relational+spatial* core (the app reads/writes here); Athena for *large-scale ad-hoc scans* of cold S3 data. They are complementary, not either/or. Start with PostGIS only; add Athena when a "rank all 2,350 CBEEO buildings across 5 cities" query shows up.

---

## 4. 3D twin serving at scale

The renderer is the easy part; the **asset pipeline and delivery** is what scales from one building to cities.

### 4.1 Pipeline: source → tiles

```
footprint polygon + height (CBEEO/Fulton)  ┐
LiDAR / DEM (optional, better roofs)        ├─▶ [S4 geometry service] ─▶ extruded mesh ─▶ glTF
roof-surface segmentation                   ┘            │                                  │
                                                          ▼                                  ▼
                                              3D Tiles tileset (implicit tiling,      S3 (content-hashed)
                                              meshopt compression, LOD)                      │
                                                                                             ▼
                                                                                       CloudFront CDN
                                                                                             │
                                                                                React + Three.js client
                                                                          (loads glTF/3D Tiles, draws twin)
```

### 4.2 The decisions

- **Format: glTF for single buildings; 3D Tiles for portfolios/cities.** 3D Tiles is the open standard (Cesium/OGC) for streaming massive heterogeneous 3D with a spatial hierarchy and LOD — "city-scale down to sub-centimeter." **3D Tiles Next** adds implicit tiling, variable LOD, and **meshopt compression** (smaller payloads). For one demo building, a single Draco/meshopt-compressed glTF is enough; you graduate to a tileset when a portfolio won't fit in one payload.
- **Renderer: keep React + Three.js** (the existing twin). Three.js loads glTF natively and there are 3D-Tiles loaders for it. **Switch to / add CesiumJS only if** we need a real geospatial globe (multi-city map, accurate georeferencing, terrain). Cesium is the heavyweight champion for that; Three.js is lighter for a single styled building. Don't rewrite to Cesium for the demo building — wrap, as Doc 01 already argues for the engine.
- **Delivery: S3 + CloudFront**, content-hashed filenames, long cache TTLs. **Alternative:** Cesium ion is a managed "raw 3D → optimized 3D Tiles on a global CDN" service — a buy-vs-build shortcut if we don't want to own the tiling pipeline early. Reasonable to start on ion, in-source later.
- **Client vs. server rendering: client-side, always.** The twin is interactive (camera, layer toggles, sun slider); server-side rendering throws away the interactivity that *is* the product. Server-side rendering appears in exactly one place: **the report's twin thumbnail** (S7 renders one frame via headless Chrome).
- **Sun-path interactivity: precomputed, client-side.** This is the demo's `evalTimeDependent` rule and it stays. Sun elevation, instantaneous solar-capture %, and crop-shade are **cheap arithmetic in the browser, < 16 ms/frame, no network.** Anything that *would* need a live calc (a full annual hourly shading study) is precomputed offline by S5 and shipped as a small lookup table in the building JSON. **Never** put a sun-slider drag on a network round-trip.

---

## 5. API & report

### 5.1 API design

- **REST + OpenAPI**, fronted by **API Gateway (HTTP API)** (cheaper/faster than REST API type for our needs [verify pricing]).
- Core resources:
  - `POST /buildings` (ingest by address/ABID) · `GET /buildings/{id}` · `GET /portfolios/{id}`
  - `POST /buildings/{id}/analyze` → returns `job_id` (kicks Step Functions) · `GET /jobs/{id}` (status)
  - `GET /buildings/{id}/scores` (the engine output) · `GET /buildings/{id}/twin` (asset manifest URLs)
  - `POST /buildings/{id}/reports` → `job_id` · `GET /reports/{id}` → presigned PDF URLs
- **Async pattern:** anything slow returns `202 + job_id`; client polls `GET /jobs/{id}` or subscribes to a WebSocket/EventBridge push. No long-held HTTP connections.
- **GraphQL:** defer. Add **AppSync** only if the twin's nested reads (building → surfaces → scores → incentives) become a chatty-REST problem. Not a starting requirement.

### 5.2 Report generation service (S7)

- **Same template, server-side.** The demo renders a styled HTML report and `window.print()`s it. Production keeps that HTML/CSS template verbatim and renders it with **headless Chromium (Playwright)** server-side → pixel-identical PDF, plus multi-page vendor packets the browser print dialog can't do well.
- **Why Playwright over Puppeteer:** current benchmarks show Playwright meaningfully faster (cold and warm) and it's the recommended choice for new projects; both restrict PDF to Chromium anyway.
- **Where it runs: containerized renderer on Fargate/Batch, queue-triggered — not Lambda.** Chromium is ~150 MB + ~30 MB/page and Lambda's 250 MB layer limit makes it fragile; a container sidesteps the limit and handles big vendor packets. (A `@sparticuz/chromium-min` Lambda is viable for the *single one-pager* if we want a cheaper fast path — keep as an option for the lightweight export.)
- **Flow:** `POST /reports` → SQS → renderer container pulls report JSON (built by the shared engine, S6) → renders master one-pager + conditional fan-out briefs (A1–A6, B1) → writes PDFs to S3 → presigned URLs returned via job status. **Async** because packets take seconds.
- **Portable alternative:** **WeasyPrint** (Python, HTML/CSS → PDF, no browser) for the document-style briefs if we want to drop the Chromium dependency; weaker on complex CSS/JS-driven layout, so keep Chromium for anything with the twin thumbnail or rich layout.

---

## 6. Cross-cutting concerns

| Concern | Recommendation | Notes |
|---|---|---|
| **Multi-tenancy** | **Pooled** model: shared Aurora/compute, **Postgres Row-Level Security** keyed on `tenant_id` from the JWT. Promote a tenant to **silo** (own schema/DB) only for compliance/scale → **bridge** model overall. | Standard AWS SaaS-Lens guidance for startups: start pooled, isolate per-tenant later. Every table gets a `tenant_id`; every query runs under an RLS policy; the API sets `SET app.tenant_id` per request. |
| **Auth** | **Amazon Cognito** user pools; JWT carries `tenant_id`; API Gateway authorizer validates. SSO/SAML for enterprise tenants later. | At CAI, check whether org SSO/Okta should federate into Cognito. **[verify org identity policy]** |
| **Secrets / API keys** | **AWS Secrets Manager** (NREL key, GA Power, GEE creds) + **KMS**; workers fetch at runtime. **Never** in client bundles or git — the demo's `NREL_API_KEY` rule, enforced. | Per-tenant API keys (if we expose an API) also live here, rotated. |
| **Observability** | **CloudWatch** (logs/metrics/alarms) + **X-Ray** (trace the Step Functions → Batch → Postgres path) + structured JSON logs with `job_id`/`tenant_id`. Step Functions gives a free visual execution history. | Add an external APM only if CloudWatch gaps appear. |
| **CI/CD** | **GitHub Actions** assuming an **ALKS-vended role** (OIDC, no static keys) → `cdk deploy`. Build/push solver + renderer images to **ECR**. Frontend → S3 + CloudFront invalidation. | Branch → ephemeral PR env optional; main → dev → prod with manual gate. |
| **IaC** | **AWS CDK (TypeScript)** | Same language as the frontend; one repo can hold app + infra. **Alternative:** Terraform if CAI standardizes on it org-wide. **[verify CAI IaC standard]** |
| **Security / compliance** | VPC with private subnets for Aurora/Batch; S3 bucket policies + Block Public Access (CloudFront via OAC only); KMS encryption at rest; least-privilege IAM per service; CBEEO data is public (no PII) but treat tenant analysis as confidential. | At CAI, SCPs and KMS policies are governed — use the **aws-alks-mentor** skill / `bundle-security` for the org's guardrails. |
| **Cost guardrails** | AWS Budgets + per-service cost allocation tags (`tenant_id`, `service`); Batch on Spot; Aurora min ACU; S3/CloudWatch log lifecycle expiry. | Tag everything by tenant from day one so unit-economics are knowable. |

### 6.1 Cost by scale tier (order-of-magnitude planning, **[verify all]**)

| Tier | Shape | Rough monthly infra | Dominant cost |
|---|---|---|---|
| **Demo / hackathon** | Static S3+CloudFront, committed JSON, optional 1 Lambda | **~$0–5** | basically free tier |
| **One building, live** | + Aurora Serverless v2 (min ACU), API GW, 1 Batch job/report | **~$50–150** | Aurora min capacity + occasional Batch |
| **Portfolio (1 org, ~hundreds of buildings)** | + heavier Batch fan-out, more storage, scheduled ingestion | **~$300–1,500** | Batch compute (Spot) + Aurora |
| **Multi-city SaaS (many tenants)** | + Athena analytics, CDN egress, larger Aurora, multi-tenant Cognito | **~low thousands+** | CDN egress (3D assets) + compute + Aurora scaling |

The architecture's defining cost property: **it scales to ~zero when idle** (Serverless v2, Batch min-0, Step Functions/Lambda/SQS pay-per-use), so early-stage burn tracks usage, not provisioned capacity.

---

## 7. Architecture diagram (target state)

```
                                   ┌──────────────────────────────────────────────┐
                                   │  React + Three.js TWIN  (browser)             │
                                   │  loads glTF/3D Tiles · runs shared JS engine  │
                                   │  sun-slider = client arithmetic (no network)  │
                                   └───────┬───────────────────────────▲───────────┘
                       assets (glTF/tiles) │                           │ REST (OpenAPI)
                                   ┌────────▼─────────┐                 │
                                   │  CloudFront CDN  │     ┌───────────▼────────────┐
                                   └────────▲─────────┘     │  API Gateway (HTTP API) │
                                            │ S3 (3D assets)│  + Cognito authorizer   │
                                   ┌────────┴─────────┐     └───────────┬────────────┘
                                   │       S3         │                 │
                                   │ rasters(COG) ·   │     ┌───────────▼────────────┐
                                   │ assets · reports │◀────│  Modular-monolith API   │
                                   │ result snapshots │     │ (Fargate or Lambda app) │
                                   └────────▲─────────┘     │  S1 routing/BFF         │
                                            │               │  S2 auth/tenant (RLS)   │
                  ┌─────────────────────────┼───────────────│  S3 ingest  S4 geometry │
                  │                         │               │  S6 scoring(JS, of-rec) │
                  │            ┌────────────┼───────┐       └─────┬───────────┬───────┘
                  │            │            │       │             │           │ enqueue
                  │   ┌────────▼─────────┐  │  ┌────▼─────────┐   │     ┌─────▼──────┐
                  │   │ Aurora Serverless│  │  │   SQS queues │   │     │    SQS     │
                  │   │  v2 + PostGIS    │◀─┘  └────┬─────────┘   │     │ (reports)  │
                  │   │ system of record │       │ jobs          │     └─────┬──────┘
                  │   │ +reads COG on S3 │  ┌────▼──────────────┐│     ┌─────▼────────────┐
                  │   └──────────────────┘  │  Step Functions   ││     │ Report renderer  │
                  │                         │  (orchestrates)   ││     │ Playwright/Chrome │
                  │                         └────┬──────────────┘│     │ on Fargate/Batch  │
                  │              ┌───────────────┼───────┐       │     └─────┬────────────┘
                  │              ▼               ▼       ▼       │           │ PDFs→S3
                  │      ┌──────────────┐ ┌───────────┐ ┌──────┐ │           ▼
                  │      │ AWS Batch     │ │ AWS Batch │ │Lambda│ │     presigned URL
                  │      │ EnergyPlus    │ │ SWMM /    │ │PVWatts│        (download)
                  │      │ (Fargate/Spot)│ │ geometry  │ │ /SAM │ │
                  │      └──────┬────────┘ └─────┬─────┘ └──┬───┘ │
                  │             └────── raw results ────────┘     │
                  │                         │ score (shared JS engine, Lambda)
                  └─────────────────────────┴─────────── persist scores → Aurora ─┘

  Cross-cutting: Secrets Manager+KMS · CloudWatch+X-Ray · CDK (IaC) · GitHub Actions↔ALKS-role · Budgets+tags
```

---

## 8. Phased rollout — from $0 demo to platform

> Each phase ships something usable and is independently valuable. **Don't build phase N+1 until phase N is in someone's hands.**

### Phase 0 — Demo (today, already specified)
Static S3 + CloudFront hosting the React/Three.js twin + committed JSON fixtures + (optional) one Lambda hiding the PVWatts key. **$0–5/mo.** This is the `backend-architecture/spec.md` stack; nothing here changes. *Exit criterion:* solar is visibly data-driven on stage.

### Phase 1 — Minimum Viable Backend (the first real infra to stand up)
**Goal: persist real data and make scores authoritative, without a compute plane yet.**
- **Stand up first, in this order:**
  1. **ALKS account/role + CDK skeleton + GitHub Actions OIDC** — the deploy spine. Nothing else is reproducible without it.
  2. **Aurora Serverless v2 + PostGIS**, with the demo's JSON contract loaded as the schema; `tenant_id` + RLS from day one (cheap to add now, painful to retrofit).
  3. **API Gateway + a single modular-monolith app** (Fargate service or a Node Lambda) exposing `GET /buildings/{id}`, `/scores`, `/twin`. The **shared JS engine runs here** to produce server-of-record scores.
  4. **Cognito** for auth; **Secrets Manager** for the NREL/utility keys.
  5. **PVWatts as a Lambda** (move the demo's optional proxy server-side, cached to Postgres/S3).
- **Defer:** EnergyPlus/SWMM, 3D tiling, async reports.
- *Exit criterion:* a logged-in user loads a building from the DB, sees engine scores computed server-side, and the twin still runs the sun slider client-side. **~$50–150/mo.**

### Phase 2 — Async compute plane + server-side reports
- **SQS + Step Functions + AWS Batch** with the **PVWatts/SAM** path and one **containerized solver (start with the lighter one — SWMM or PVWatts-SAM; EnergyPlus last)**.
- **Content-addressed result cache** (input-hash → S3 + Postgres) from the first job — this is the cost control, build it now.
- **Async report service:** Playwright-on-Fargate rendering the *same HTML template* → S3 → presigned URL. Master one-pager + the A1 structural stub + B1 city snippet (the demo's MVP export, now server-rendered).
- *Exit criterion:* user clicks "high-fidelity analysis," a job runs, results persist and cache, and a multi-page PDF packet downloads. **~$300/mo + per-run compute.**

### Phase 3 — Portfolio scale
- **Geometry/tiling service (S4)** producing **3D Tiles** to S3+CloudFront; LOD for many-building scenes.
- **Step Functions `Map`** fan-out to analyze a whole portfolio in parallel; portfolio ranking queries in PostGIS.
- Full **ingestion pipeline (S3)** as a scheduled Dagster/Step Functions job (CBEEO bulk + footprints for an org's whole building set).
- *Exit criterion:* upload an org's building list → portfolio twin + ranked packages + per-building reports.

### Phase 4 — Multi-city SaaS
- **Bridge multi-tenancy** (promote big tenants to silo), city-config-driven generalization (the demo's `climate.<city>.json` / `incentives.<city>.json` become DB-backed config tables — no formula-code change, per FR-6).
- **Athena** over Parquet for cross-city analytics; consider **Cesium ion** or a hardened tiling pipeline for many cities; **CloudFront** tuning for global asset egress.
- Cost-allocation tags, Budgets, per-tenant unit economics.
- *Exit criterion:* a second city is onboarded by adding config + data, not code.

---

## 9. Continuity guarantees (what must NOT change from the demo)

These are load-bearing decisions inherited from `backend-architecture/spec.md` and Doc 01 — production must preserve them:

1. **The JSON data contract** (`Building` / `CandidateSurface` / `Score`) stays the interchange shape. Postgres stores it; the API serves it; the engine consumes it. Unchanged.
2. **One shared scoring engine**, run in both browser (live twin) and server (authoritative scores). Never forked.
3. **Sun-path stays client-side arithmetic** — no production feature is allowed to put a slider drag on the network.
4. **The report HTML template** is rendered server-side verbatim; the report JSON schema (Doc 03) is the contract.
5. **City generalization is config, not code** (FR-6) — production turns the city JSON fixtures into config tables; the seven formulas stay city-agnostic.
6. **Every number keeps its provenance tag** (`fetched`/`manual`/`default` + citation, `basis`/`verify`) through to the persisted record and the PDF footer.

---

## Sources (verified 2025–26)

- AWS Batch vs ECS/Fargate vs Lambda for long jobs (Lambda 15-min limit; Batch for hours-long jobs): [mtechzilla](https://www.mtechzilla.com/blogs/aws-fargate-vs-ecs-vs-lambda), [BMC](https://www.bmc.com/blogs/aws-ecs-vs-aws-lambda/), [AWS Batch job-queue limits](https://aws.amazon.com/about-aws/whats-new/2021/04/aws-batch-raises-job-queue-limit/)
- Step Functions vs MWAA vs Temporal (SF serverless/pay-per-use; MWAA fixed always-on cost; Temporal flexibility): [AWS Big Data Blog](https://aws.amazon.com/blogs/big-data/choosing-the-right-workflow-orchestration-service-for-your-use-case-amazon-mwaa-and-aws-step-functions/), [DZone](https://dzone.com/articles/a-comprehensive-comparison-of-aws-step-function-an), [DEV (SF vs Temporal)](https://dev.to/lyonas/aws-step-functions-vs-temporal-comparison-for-workflow-orchestration-j53)
- 3D Tiles / glTF / CesiumJS / 3D Tiles Next (implicit tiling, meshopt, LOD, ion CDN): [Cesium](https://cesium.com/), [3D Tiles Next](https://cesium.com/blog/2021/11/10/introducing-3d-tiles-next/), [Janea Systems on streaming 3D Tiles](https://www.janeasystems.com/blog/streaming-large-3d-scenes-with-3d-tiles), [CesiumGS/3d-tiles spec](https://github.com/CesiumGS/3d-tiles)
- PostGIS + COG-on-S3 / `postgis_raster` / `h3-pg` on Aurora vs Athena: [Crunchy Data — Cloud Rasters with PostGIS](https://www.crunchydata.com/blog/using-cloud-rasters-with-postgis), [Cloud Optimized GeoTIFF](https://cogeo.org/), [Aurora h3-pg](https://aws.amazon.com/about-aws/whats-new/2023/12/amazon-aurora-postgresql-h3-pg-geospatial-indexing/), [PostGIS vs Athena](https://stackshare.io/stackups/amazon-athena-vs-postgis)
- EnergyPlus Docker (official NREL image; queue/worker framework): [NREL/docker-energyplus](https://github.com/NREL/docker-energyplus), [eplus-framework](https://github.com/jamiebull1/eplus-framework)
- AWS SaaS multi-tenancy silo/pool/bridge + RLS + Cognito (start pooled, promote later): [AWS SaaS Lens — Silo/Pool/Bridge](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-pool-and-bridge-models.html), [AWS — Cognito multi-tenant SaaS auth](https://aws.amazon.com/blogs/security/saas-authentication-identity-management-with-amazon-cognito-user-pools/), [Bridge model whitepaper](https://docs.aws.amazon.com/whitepapers/latest/saas-tenant-isolation-strategies/the-bridge-model.html)
- Server-side PDF — Playwright vs Puppeteer, Lambda 250 MB layer / Chromium size, container microservice: [PDF4.dev benchmark 2026](https://pdf4.dev/blog/html-to-pdf-benchmark-2026), [APITemplate — PDF on Lambda](https://apitemplate.io/blog/html-to-pdf-aws-lambda-serverless-guide/), [How to Generate PDFs in 2025](https://dev.to/michal_szymanowski/how-to-generate-pdfs-in-2025-26gi)

> **Unverified / org-specific to confirm:** all dollar figures and AWS quotas (treat as planning estimates); CAI identity federation into Cognito; CAI IaC standard (CDK vs Terraform); ALKS account/role vending specifics — use the **aws-alks-mentor** skill and `bundle-aws` for the org's authoritative answers.
