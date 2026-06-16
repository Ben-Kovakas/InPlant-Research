# 03 · API Endpoints — FRONT-END ↔ BACK-END Contract `[PLANNED]`
## In-Planted / Climate Resilient ATL — the living handshake at the FE↔BE seam

> **What this document is.** The agreed shape of the wire between the React/Three.js front end and the back-end API, *before either side is built*. **No live API exists yet** — the demo's "endpoint" is the JS engine importing the committed fixture JSON (`src/data/buildings/ansley-mall.json`). This file defines the **target** REST surface (`/v1`) and a GraphQL alternative sketch so that when we wire FE↔BE, both sides already agree on routes, payloads, async patterns, auth, and error shapes.
>
> **Status: everything here is `[PLANNED]`.** Nothing in this doc is built. It is the contract we commit to *now* so the migration from committed-JSON → live-API is a fill-in, not a redesign.
>
> **Canonical-types rule (non-negotiable).** Every request/response body reuses the canonical core types from [`HANDSHAKE.md` §3](HANDSHAKE.md) — `Building`, `CandidateSurface`, `Score`, `EngineResult`, `WorkerResult`, `ProvenancedValue`. This doc adds **only** API-transport types (`Job`, `ErrorResponse`, `Paginated<T>`, `AuthToken`, envelope headers). It never redefines a domain field. If a domain type needs to change, change it in `HANDSHAKE.md` §3 and bump its Changelog — not here.
>
> **Platform grounding.** The async-job pattern, auth (Cognito/JWT), tenanting (RLS on `tenantId`), and the report→presigned-URL flow all come from [`architecture/03_PlatformServing.md`](../ImplementationPlan/architecture/03_PlatformServing.md): *the request path must never wait on a simulation.* Report-generation semantics come from [`ImplementationPlan/03_ReportExportSpec.md`](../ImplementationPlan/03_ReportExportSpec.md). Thesis: a company turns intent into a **city-ready proposal** ([`00_README.md`](../ImplementationPlan/00_README.md)).

---

## 0. Conventions (inherited from HANDSHAKE §1, restated for the wire)

- **Base URL:** `https://api.in-planted.app/v1` (version in the path — see §3.7).
- **Wire format:** JSON, `camelCase` (HANDSHAKE §1). `Content-Type: application/json` on every request/response with a body.
- **Auth:** `Authorization: Bearer <JWT>` on every endpoint except `POST /v1/auth/token`. JWT is a Cognito-issued access token; `tenantId` is a claim inside it (§6).
- **Units in the field name; every meaningful number is a `ProvenancedValue`** — the API serves the *same* shapes the engine and fixture use. The transport does not strip provenance.
- **Determinism:** every computed payload (`EngineResult`, report) carries `engineVersion`; same inputs + same `engineVersion` ⇒ identical bytes. This is what lets the twin (client engine) and the API (server-of-record engine) agree.
- **Idempotency, pagination, errors, rate limits, versioning, CORS, headers** — all in §5 (cross-cutting). Read §5 before implementing any handler.

---

## 1. Resource map

All routes are under `/v1`. Auth scope is the OAuth2/Cognito scope (§6.2) the caller's token must carry. `tenant` = scoped to the caller's `tenantId` via Postgres RLS (architecture/03 §6); a building/job/report is only visible to its owning tenant.

### 1.1 Auth / session

| Route | Method | Purpose | Auth scope |
|---|---|---|---|
| `/v1/auth/token` | `POST` | Exchange credentials (or refresh token) for an `AuthToken`. Thin proxy to Cognito. | *(none — public)* |
| `/v1/auth/refresh` | `POST` | Exchange a refresh token for a new access token. | *(none — refresh token in body)* |
| `/v1/auth/session` | `GET` | Return the resolved identity + tenant for the current token (who am I). | `openid` |

### 1.2 Buildings

| Route | Method | Purpose | Auth scope |
|---|---|---|---|
| `/v1/buildings` | `GET` | List buildings for the tenant (paginated, §5.2). | `buildings:read` |
| `/v1/buildings` | `POST` | Ingest a building by address/ABID (kicks the geometry/ingest pipeline; **async** → returns a `Job`). | `buildings:write` |
| `/v1/buildings/{buildingId}` | `GET` | Fetch one `Building` **with its `surfaces[]`** (§2.1). | `buildings:read` |
| `/v1/buildings/{buildingId}` | `PATCH` | Update editable building fields (e.g. owner-supplied `annualElectricityUseKwh`, `energyStarScore`). | `buildings:write` |
| `/v1/buildings/{buildingId}/surfaces` | `GET` | List `CandidateSurface[]` for the building (subset of the building GET, for chatty twin reads). | `buildings:read` |

### 1.3 Scores (synchronous — empirical engine)

| Route | Method | Purpose | Auth scope |
|---|---|---|---|
| `/v1/buildings/{buildingId}/scores` | `GET` | Run the **shared JS engine** server-side over the persisted building + cached worker results and return an `EngineResult`. `?weights=...` re-weights the composite. Fast (ms) — empirical formulas + cached sims, **no live simulation**. | `scores:read` |

> **Why this is synchronous.** Scoring is pure JS arithmetic over already-persisted inputs (architecture/03 §1.1 S6, §2.4 "tiered fidelity: default to empirical formulas, instant"). Re-weighting the composite never triggers a simulation. Heavy sims are a *separate* async resource (§1.4); their outputs are cached and folded into this result.

### 1.4 Calc jobs (asynchronous — heavy sims)

| Route | Method | Purpose | Auth scope |
|---|---|---|---|
| `/v1/buildings/{buildingId}/jobs` | `POST` | Trigger a heavy simulation (`solar` / `stormwater` / `energy` / `geometry`). Enqueues SQS → Step Functions → Batch. Returns `202` + `Job` (`queued`). | `jobs:write` |
| `/v1/buildings/{buildingId}/jobs` | `GET` | List jobs for a building (paginated, filter `?status=`). | `jobs:read` |
| `/v1/jobs/{jobId}` | `GET` | **Poll** job status/result. Returns the `Job` (lifecycle §4). | `jobs:read` |
| `/v1/jobs/{jobId}` | `DELETE` | Cancel a queued/running job (best-effort). | `jobs:write` |

### 1.5 Reports (asynchronous — Playwright/Chrome on Fargate)

| Route | Method | Purpose | Auth scope |
|---|---|---|---|
| `/v1/buildings/{buildingId}/reports` | `POST` | Generate the city-ready proposal (master one-pager + fan-out briefs). Async → `202` + `Job` of `kind:"report"`. | `reports:write` |
| `/v1/reports/{reportId}` | `GET` | Fetch report metadata + **presigned S3 download URLs** once the job succeeded (§4.4). | `reports:read` |
| `/v1/buildings/{buildingId}/reports` | `GET` | List a building's generated reports (paginated). | `reports:read` |

### 1.6 City / portfolio *(later — `[PLANNED, post-MVP]`)*

| Route | Method | Purpose | Auth scope |
|---|---|---|---|
| `/v1/portfolios/{portfolioId}` | `GET` | Portfolio (set of buildings) with rolled-up totals. | `portfolios:read` |
| `/v1/portfolios/{portfolioId}/jobs` | `POST` | Fan-out analysis across all buildings (Step Functions `Map`). | `jobs:write` |
| `/v1/portfolios/{portfolioId}/rankings` | `GET` | Buildings ranked by composite (PostGIS query). | `portfolios:read` |
| `/v1/cities/{cityId}/contribution` | `GET` | Side-B aggregate contribution toward a city's goals. | `city:read` |

*(Portfolio/city endpoints map to architecture/03 Phase 3–4; specified here so the route shape is reserved, not built for MVP.)*

---

## 2. Request / response schemas (canonical types)

### 2.1 `GET /v1/buildings/{buildingId}` → `Building` (+ surfaces)

- **Path:** `buildingId` — kebab slug (HANDSHAKE §1), e.g. `ansley-mall`.
- **Query:** `?include=surfaces` (default `surfaces` always included; `?include=surfaces,interventions` to embed the per-intervention metric stubs).
- **Response `200`:** a `Building` exactly per [HANDSHAKE §3.5](HANDSHAKE.md), whose `surfaces` are `CandidateSurface[]` ([§3.3](HANDSHAKE.md)). No new fields. `schemaVersion` is on the body.
- **Errors:** `404 building_not_found`, `403 forbidden` (cross-tenant), `401 unauthorized`.

### 2.2 `GET /v1/buildings/{buildingId}/scores?weights=...` → `EngineResult`

- **Query — `weights`:** URL-encoded JSON object of composite weights, `Record<objective, number>` summing to 1, e.g. `weights={"solar":0.5,"stormwater":0.2,"carbon":0.3}`. Omitted ⇒ server default weights (the demo's balanced profile). Objectives are the closed set from `Intervention.addressesObjectives` (HANDSHAKE §3.4): `solar | stormwater | heat | carbon | energy | biodiversity`.
- **Query — `fidelity`:** `empirical` (default, instant) | `simulated` (uses cached heavy-sim results where present; **never blocks** — if a sim hasn't run, that metric falls back to empirical and `provenance.tier` reflects it).
- **Response `200`:** an `EngineResult` exactly per [HANDSHAKE §3.6](HANDSHAKE.md) — `surfaceScores: Score[]`, `ranked: Score[]`, `buildingTotals`, `engineVersion`, `schemaVersion`, optional `timeDependent`. Re-weighting only re-derives `composite`/`ranked`; raw `metrics` are stable for a given `engineVersion`.
- **Headers:** `X-Engine-Version`, `X-Schema-Version` (§5.6). `ETag` = `engineVersion + inputHash + weightsHash` for client caching.
- **Errors:** `400 invalid_weights` (don't sum to 1 / unknown objective), `404 building_not_found`.

### 2.3 `POST /v1/buildings/{buildingId}/jobs` → `Job` (async) + polling + webhook

**Request body:**
```jsonc
{
  "kind": "solar",                  // "solar" | "stormwater" | "energy" | "geometry"
  "params": {                       // kind-specific; passed through to the worker
    "surfaceId": "ansley-roof",     // optional — scope to one surface
    "tiltDeg": 10, "azimuthDeg": 145, "lossesPct": 14
  },
  "fidelity": "high",               // "high" => full solver (Batch); "fast" => Lambda/empirical
  "callbackUrl": "https://app.example.com/hooks/inplanted"  // optional webhook (§4.3)
}
```
- **Response `202 Accepted`:** a `Job` (§3.1) in state `queued`, with `Location: /v1/jobs/{jobId}` header.
- **Poll:** `GET /v1/jobs/{jobId}` → `Job`. When `status:"succeeded"`, `Job.result` carries the canonical `WorkerResult<TResult>` (HANDSHAKE §3.7) — e.g. for `kind:"solar"`, `result.result` is a `SolarResult`. Re-running identical `params` is a **cache hit** (content-addressed by `inputHash`, architecture/03 §2.4): the job returns `succeeded` near-instantly with `cacheHit:true`.
- **Webhook (callback option):** if `callbackUrl` is supplied, the platform `POST`s the terminal `Job` to it on `succeeded`/`failed` (§4.3) — so the FE can skip polling. Signed per §4.3.
- **Errors:** `400 invalid_job_kind`, `404 building_not_found`, `409 job_conflict` (an identical job is already running — returns the in-flight `jobId`).

### 2.4 `POST /v1/buildings/{buildingId}/reports` → report job → presigned URL

**Request body:**
```jsonc
{
  "audience": "owner",              // "owner" | "city"  (Side A / Side B, ReportExportSpec §0)
  "packageId": "B",                 // which scored package to render
  "weights": { "solar": 0.5, "stormwater": 0.2, "carbon": 0.3 },  // optional — re-rank before render
  "briefs": ["A1","A2","A5","B1"],  // fan-out briefs to include (ReportExportSpec §1); [] = master only
  "format": "pdf"                   // "pdf" | "json"
}
```
- **Response `202 Accepted`:** a `Job` of `kind:"report"`, `Location: /v1/jobs/{jobId}`. Async because Playwright/Chrome renders take seconds (architecture/03 §5.2).
- **On success:** poll `GET /v1/jobs/{jobId}` (or webhook) → terminal `Job` whose `result` points at the report; then `GET /v1/reports/{reportId}` returns metadata + **presigned S3 URLs** (§4.4). The report body itself is the `InPlantedRetrofitReport` object from ReportExportSpec §4.1 (that doc owns its schema; this contract only owns the *delivery*).
- **Errors:** `400 invalid_audience`/`unknown_brief`, `404 building_not_found`/`package_not_found`.

---

## 3. API-only types (TypeScript — these live in THIS doc, not HANDSHAKE)

These are **transport** types. They wrap or reference canonical domain types but never redefine domain fields.

### 3.1 `Job` — the async envelope (covers calc jobs AND report jobs)
```ts
type JobKind   = "solar" | "stormwater" | "energy" | "geometry" | "report" | "portfolioAnalyze";
type JobStatus = "queued" | "running" | "succeeded" | "failed" | "canceled";

interface Job<TResult = unknown> {
  jobId: string;                 // server-assigned (uuid)
  kind: JobKind;
  status: JobStatus;             // lifecycle §4.1
  buildingId?: string;           // present for building-scoped jobs
  portfolioId?: string;          // present for portfolio jobs
  tenantId: string;              // RLS owner
  params?: Record<string, unknown>;
  progressPct?: number;          // 0–100, best-effort while running
  inputHash?: string;            // content-addressed cache key (architecture/03 §2.4)
  cacheHit?: boolean;            // true => no compute was spent
  result?: TResult;              // populated only when status === "succeeded"
                                 //   calc jobs: WorkerResult<SolarResult> | WorkerResult<...> (HANDSHAKE §3.7)
                                 //   report jobs: { reportId: string }
  error?: ErrorResponse["error"];// populated only when status === "failed" (§3.2)
  createdAt: string;             // ISO 8601
  startedAt?: string;
  finishedAt?: string;
  engineVersion?: string;        // stamped on compute jobs for determinism
  links: {                       // HATEOAS-lite so the FE never builds URLs by hand
    self: string;                // /v1/jobs/{jobId}
    building?: string;
    report?: string;             // /v1/reports/{reportId} (report jobs)
  };
}
```

### 3.2 `ErrorResponse` — the one error envelope for every non-2xx
```ts
interface ErrorResponse {
  error: {
    code: string;                // stable machine code, e.g. "building_not_found", "invalid_weights"
    message: string;             // human-readable, safe to surface in UI
    status: number;              // mirrors HTTP status (400, 401, 403, 404, 409, 422, 429, 500, 503)
    requestId: string;           // correlate with CloudWatch logs (architecture/03 §6 observability)
    details?: Array<{            // field-level validation errors
      field: string;             // e.g. "weights.solar"
      issue: string;             // e.g. "must be between 0 and 1"
    }>;
    retryable?: boolean;         // true for 429/503/transient job failures
    docsUrl?: string;            // link to the relevant contract section
  };
}
```

### 3.3 `Paginated<T>` — list envelope (cursor-based, §5.2)
```ts
interface Paginated<T> {
  items: T[];
  page: {
    limit: number;               // page size actually applied
    nextCursor: string | null;   // opaque; null => last page
    prevCursor: string | null;
    totalEstimate?: number;      // best-effort count (may be approximate at scale)
  };
}
```

### 3.4 `AuthToken` — token-exchange response (§6)
```ts
interface AuthToken {
  accessToken: string;           // JWT (Cognito access token); carries tenantId + scopes claims
  tokenType: "Bearer";
  expiresInSec: number;          // typically 3600
  refreshToken?: string;         // present on initial token grant, not on refresh
  scope: string;                 // space-delimited granted scopes, e.g. "buildings:read scores:read jobs:write"
  tenantId: string;              // resolved tenant (also a JWT claim; echoed for convenience)
}
```

---

## 4. The async job lifecycle (cross-cutting, applies to calc + report jobs)

### 4.1 State machine
```
            POST /buildings/{id}/jobs  (or /reports)
                         │ 202
                         ▼
   ┌────────┐  picked   ┌─────────┐  solver/renderer ok  ┌────────────┐
   │ queued │ ────────▶ │ running │ ───────────────────▶ │ succeeded  │ (terminal)
   └───┬────┘  by Batch └────┬────┘                       └────────────┘
       │ DELETE              │ solver error / timeout / poison
       ▼                     ▼
   ┌──────────┐         ┌────────┐
   │ canceled │         │ failed │ (terminal; error envelope in Job.error; retryable flag)
   └──────────┘         └────────┘
```
- `queued → running → succeeded|failed` is the normal path. `DELETE /v1/jobs/{jobId}` moves a non-terminal job to `canceled` (best-effort — a Batch job already executing may still finish).
- **Cache hit shortcut:** identical `inputHash` ⇒ job is created already `succeeded` with `cacheHit:true`, zero compute (architecture/03 §2.4). The FE flow is unchanged (still `202` then poll), it just resolves immediately.
- **Poison protection:** SQS DLQ + job TTL (architecture/03 §2.4) — a job that exhausts retries lands `failed` with `error.retryable:false`.

### 4.2 Polling guidance (FE)
- Poll `GET /v1/jobs/{jobId}` with backoff (e.g. 1s → 2s → 5s, cap 10s). `Job.status` terminal ⇒ stop. Honor `Retry-After` if returned.
- Prefer the webhook (§4.3) or a future WebSocket/EventBridge push (architecture/03 §5.1) over tight polling when available.

### 4.3 Webhook / callback (alternative to polling)
- If `callbackUrl` was supplied at job creation, on every terminal transition the platform `POST`s the full `Job` body to that URL.
- **Security:** request carries `X-InPlanted-Signature: sha256=<hmac>` over the raw body using the tenant's registered webhook secret; receivers MUST verify. Delivery is at-least-once with retry/backoff; receivers MUST be idempotent on `jobId`.

### 4.4 Report delivery (presigned URLs)
- `GET /v1/reports/{reportId}` (after the report job succeeds) returns:
```jsonc
{
  "reportId": "INP-2026-ansley-001",
  "buildingId": "ansley-mall",
  "audience": "owner",
  "engineVersion": "0.3.0",
  "schemaVersion": "0.1.0",
  "generatedAt": "2026-06-16T14:30:00Z",
  "master": {
    "format": "pdf",
    "url": "https://s3-presigned...",   // presigned GET, short-lived
    "expiresAt": "2026-06-16T15:30:00Z"
  },
  "briefs": [
    { "briefId": "A1_structural", "url": "https://s3-presigned...", "expiresAt": "..." },
    { "briefId": "B1_city",       "url": "https://s3-presigned...", "expiresAt": "..." }
  ],
  "json": { "url": "https://s3-presigned...", "expiresAt": "..." }  // the InPlantedRetrofitReport object (ReportExportSpec §4.1)
}
```
- URLs are short-lived presigned S3 GETs (architecture/03 §3, §5.2). Re-`GET` the report to mint fresh URLs after expiry; the underlying artifact is immutable (content-hashed in S3).

---

## 5. Cross-cutting

### 5.1 Standard error envelope
Every non-2xx returns `ErrorResponse` (§3.2) with `Content-Type: application/json`. Status codes used: `400` (malformed/invalid params), `401` (missing/expired token), `403` (cross-tenant / missing scope), `404` (not found), `409` (conflict / duplicate idempotent op), `422` (semantically invalid, e.g. weights that don't sum to 1 — `400` also acceptable, pick one and document), `429` (rate limited), `500` (bug), `503` (dependency down — `retryable:true`).

### 5.2 Pagination
Cursor-based on every list endpoint. Query: `?limit=` (default 25, max 100) and `?cursor=` (opaque, from `page.nextCursor`). Response is `Paginated<T>` (§3.3). Cursor encodes sort position + tenant; never expose offsets (unstable under concurrent writes).

### 5.3 Idempotency keys
All non-idempotent writes (`POST /buildings`, `POST .../jobs`, `POST .../reports`) accept an `Idempotency-Key: <client-uuid>` header. The server caches the response per `(tenantId, key)` for 24h: a retried request with the same key returns the original `Job`/resource (not a duplicate job). Recommended for all job triggers so a flaky network can't double-spend a simulation. Calc jobs additionally dedupe on `inputHash` (§4.1) even without a key.

### 5.4 Rate limits
Per-tenant token-bucket at the API Gateway. On exceed: `429` + `Retry-After: <sec>` + `ErrorResponse{code:"rate_limited", retryable:true}`. Suggested defaults (`[verify]`, tune in prod): reads 100 req/s burst, job-creation 10/s (heavy compute is the scarce resource), report-creation 2/s. Headers `X-RateLimit-Limit` / `X-RateLimit-Remaining` / `X-RateLimit-Reset` on every response.

### 5.5 Versioning policy
- **Path version `/v1`.** Breaking changes (removed/renamed field, changed type/unit, removed endpoint) ⇒ new path version `/v2`; `/v1` supported through a deprecation window with `Sunset` + `Deprecation` headers.
- **Additive changes** (new optional field, new endpoint, new enum value) are **non-breaking** and ship within `/v1` — clients MUST ignore unknown fields.
- The body-level `schemaVersion` (HANDSHAKE §1) tracks the *domain-type* contract independently of the *URL* version; `X-Schema-Version` echoes it (§5.6).

### 5.6 Headers — `schemaVersion` / `engineVersion`
Every response carries:
- `X-Schema-Version` — the HANDSHAKE contract version the payload conforms to (mirrors body `schemaVersion`).
- `X-Engine-Version` — on any payload produced by the scoring engine or a worker (`/scores`, job results, reports); the determinism stamp (HANDSHAKE §1). Same inputs + same `X-Engine-Version` ⇒ identical body.
- `X-Request-Id` — correlation id, echoed in `ErrorResponse.requestId`.
Clients MAY send `X-Schema-Version` to assert the contract they were built against; a mismatch the server can't satisfy ⇒ `400 schema_version_unsupported`.

### 5.7 CORS
The browser twin is a different origin from the API. Preflight (`OPTIONS`) and actual requests: `Access-Control-Allow-Origin: <app origin>` (allowlist, not `*`, because requests are credentialed), `Access-Control-Allow-Methods: GET,POST,PATCH,DELETE,OPTIONS`, `Access-Control-Allow-Headers: Authorization,Content-Type,Idempotency-Key,X-Schema-Version`, `Access-Control-Expose-Headers: X-Engine-Version,X-Schema-Version,X-Request-Id,X-RateLimit-*,Location`, `Access-Control-Max-Age: 600`. Configured at API Gateway (architecture/03 §1.1 S1).

---

## 6. Auth, scopes, tenanting

### 6.1 Token flow (Cognito / JWT)
```
FE ──POST /v1/auth/token {username,password | refreshToken}──▶ API ──▶ Cognito User Pool
   ◀──────────────── AuthToken { accessToken (JWT), refreshToken, expiresInSec, scope, tenantId } ──┘
FE then sends:  Authorization: Bearer <accessToken>   on every /v1 call
   API Gateway Cognito authorizer validates the JWT, extracts `tenantId` + `scope` claims,
   sets Postgres  SET app.tenant_id = <tenantId>  per request → RLS enforces tenant isolation.
```
- Access tokens are short-lived (`expiresInSec`, ~1h); refresh via `POST /v1/auth/refresh`. The FE never sees AWS creds — only the JWT (architecture/03 §6 auth, §6 secrets rule).
- Enterprise SSO/SAML federates *into* Cognito later (architecture/03 §1.1 S2) — the wire contract is unchanged.

### 6.2 Scopes
Granted in the JWT `scope` claim; the authorizer rejects calls whose required scope (§1 tables) isn't present with `403 forbidden`.
```
openid                          — identity only (auth/session)
buildings:read  buildings:write
surfaces:read                   (subset of buildings:read; reserved for fine-grained roles)
scores:read
jobs:read       jobs:write
reports:read    reports:write
portfolios:read city:read       — post-MVP
```

### 6.3 Tenanting
- Every resource row carries `tenantId` (architecture/03 §6 multi-tenancy, pooled + RLS). `tenantId` comes from the **token**, never from the request body or path — a caller cannot read/write another tenant's data even with a valid id.
- Cross-tenant access ⇒ `403` (or `404` to avoid leaking existence — pick one policy and apply it consistently; recommend `404` for `GET` by id).

---

## 7. Concrete examples (Ansley Mall)

### 7.1 Fetch building + scores

**Request — building:**
```http
GET /v1/buildings/ansley-mall HTTP/1.1
Host: api.in-planted.app
Authorization: Bearer eyJhbGci...
```
**Response `200`** (canonical `Building`, abbreviated — full shape per HANDSHAKE §3.5; values from the demo fixture):
```jsonc
{
  "id": "ansley-mall",
  "name": "Ansley Mall",
  "owner": "Selig Enterprises (private)",
  "address": "1544 Piedmont Ave NE, Atlanta, GA 30324",
  "city": "atlanta",
  "location": { "lat": 33.7983, "lon": -84.3711, "provenance": { "tier": "measured", "source": "Google Earth trace" } },
  "yearBuilt": 1964,
  "stories": 1,
  "roofAreaM2": 20033,
  "energyStarScore": { "value": null, "provenance": { "tier": "gap", "source": "CBEEO", "note": "pull before quoting a 'before' score" } },
  "annualElectricityUseKwh": { "value": 13428838, "provenance": { "tier": "fetched", "source": "Google Solar API" } },
  "surfaces": [
    {
      "id": "ansley-roof", "type": "roof",
      "areaM2": { "value": 20033, "provenance": { "tier": "measured", "source": "Google Earth trace" } },
      "imperviousPct": 100,
      "addedLoadCapacityPsf": { "value": null, "provenance": { "tier": "gap", "source": "structural drawings", "note": "gates green roof, not PV" } },
      "allowedInterventions": ["solar", "greenRoof", "coolRoof", "cistern"]
    },
    {
      "id": "ansley-lot", "type": "parking",
      "areaM2": { "value": 24000, "provenance": { "tier": "gap", "source": "estimate ~6 ac", "note": "measure in Google Earth" } },
      "imperviousPct": 100,
      "allowedInterventions": ["solarCanopy", "bioswale", "permeablePaving", "lotTrees", "evCharging"]
    }
  ],
  "schemaVersion": "0.1.0"
}
```

**Request — scores, solar-weighted:**
```http
GET /v1/buildings/ansley-mall/scores?weights=%7B%22solar%22%3A0.5%2C%22stormwater%22%3A0.2%2C%22carbon%22%3A0.3%7D HTTP/1.1
Authorization: Bearer eyJhbGci...
```
**Response `200`** (canonical `EngineResult`, HANDSHAKE §3.6; totals from the fixture's `buildingTotals`):
```jsonc
{
  "buildingId": "ansley-mall",
  "engineVersion": "0.3.0",
  "schemaVersion": "0.1.0",
  "surfaceScores": [
    {
      "surfaceId": "ansley-roof", "intervention": "solar",
      "metrics": { "solarKwhYr": 2378253, "carbonTonsYr": 913, "capexUsd": { "low": 1573752, "high": 3213613, "basis": "$0.857–1.75/W × 1.836 MW" }, "paybackYears": { "low": 2.5, "high": 8.0 } },
      "normalized": { "solar": 0.92, "carbon": 0.74 },
      "composite": 0.86,
      "feasibility": { "permitable": true, "notes": ["PV clears structural gate (~3–5 psf)"] }
    },
    {
      "surfaceId": "ansley-lot", "intervention": "solarCanopy",
      "metrics": { "solarKwhYr": 1960000, "carbonTonsYr": 752 },
      "normalized": { "solar": 0.78, "carbon": 0.61 },
      "composite": 0.71,
      "feasibility": { "permitable": true, "notes": ["our value-add; Google modeled 0 W on the lot"] }
    }
  ],
  "ranked": [ /* same Scores, ordered by composite desc */ ],
  "buildingTotals": {
    "combinedSolarKwDc": 3236,
    "combinedAnnualKwh": 4338253,
    "combinedCo2TonsYr": 1665,
    "pctOfBuildingLoadOffset": 32,
    "stormwaterGalYr": 2400000,
    "annualEnergySavingsUsd": { "low": 498900, "high": 811253 },
    "paybackYearsRange": { "low": 2.5, "high": 8.0 }
  }
}
```
Response headers: `X-Engine-Version: 0.3.0`, `X-Schema-Version: 0.1.0`, `ETag: "0.3.0-a1b2c3-w50-20-30"`.

### 7.2 Trigger a solar calc job + poll

**Request:**
```http
POST /v1/buildings/ansley-mall/jobs HTTP/1.1
Authorization: Bearer eyJhbGci...
Idempotency-Key: 6f9a...e2
Content-Type: application/json

{ "kind": "solar", "fidelity": "high",
  "params": { "surfaceId": "ansley-roof", "tiltDeg": 10, "azimuthDeg": 145, "lossesPct": 14 } }
```
**Response `202 Accepted`** (`Location: /v1/jobs/job_01HZ...`):
```jsonc
{
  "jobId": "job_01HZ...", "kind": "solar", "status": "queued",
  "buildingId": "ansley-mall", "tenantId": "selig-ent",
  "params": { "surfaceId": "ansley-roof", "tiltDeg": 10, "azimuthDeg": 145, "lossesPct": 14 },
  "inputHash": "sha256:7d3f...", "cacheHit": false,
  "createdAt": "2026-06-16T14:28:00Z",
  "links": { "self": "/v1/jobs/job_01HZ...", "building": "/v1/buildings/ansley-mall" }
}
```
**Poll → `GET /v1/jobs/job_01HZ...` → `200`** (terminal; `result` is a canonical `WorkerResult<SolarResult>`, HANDSHAKE §3.7):
```jsonc
{
  "jobId": "job_01HZ...", "kind": "solar", "status": "succeeded",
  "buildingId": "ansley-mall", "tenantId": "selig-ent",
  "inputHash": "sha256:7d3f...", "cacheHit": false, "progressPct": 100,
  "engineVersion": "0.3.0",
  "createdAt": "2026-06-16T14:28:00Z", "startedAt": "2026-06-16T14:28:03Z", "finishedAt": "2026-06-16T14:28:51Z",
  "result": {
    "worker": "solar_pysam", "workerVersion": "1.2.0",
    "inputHash": "sha256:7d3f...",
    "result": {
      "surfaceId": "ansley-roof",
      "systemCapacityKwDc": 1836,
      "acAnnualKwh": 2378253,
      "acMonthlyKwh": [148000,162000,205000,228000,241000,236000,239000,233000,210000,191000,160000,145253],
      "capacityFactor": 0.148,
      "co2AvoidedTonsYr": 913,
      "assumptions": { "tiltDeg": 10, "azimuthDeg": 145, "lossesPct": 14, "arrayType": 1, "moduleType": 0, "gridFactorKgPerKwh": 0.3837 }
    },
    "provenance": { "tier": "modeled", "source": "NREL PVWatts v8", "method": "PySAM pvwattsv8", "date": "2026-06-16" },
    "computedAt": "2026-06-16T14:28:51Z"
  },
  "links": { "self": "/v1/jobs/job_01HZ...", "building": "/v1/buildings/ansley-mall" }
}
```
*(A failure instead returns `status:"failed"` and an `error` block per §3.2 with `retryable`.)*

### 7.3 Generate a report

**Request:**
```http
POST /v1/buildings/ansley-mall/reports HTTP/1.1
Authorization: Bearer eyJhbGci...
Idempotency-Key: 91c2...aa
Content-Type: application/json

{ "audience": "owner", "packageId": "B",
  "weights": { "solar": 0.5, "stormwater": 0.2, "carbon": 0.3 },
  "briefs": ["A1","A2","A5","B1"], "format": "pdf" }
```
**Response `202`** (`Location: /v1/jobs/job_02AB...`):
```jsonc
{ "jobId": "job_02AB...", "kind": "report", "status": "queued",
  "buildingId": "ansley-mall", "tenantId": "selig-ent",
  "createdAt": "2026-06-16T14:30:00Z",
  "links": { "self": "/v1/jobs/job_02AB...", "building": "/v1/buildings/ansley-mall" } }
```
**After success → `GET /v1/reports/INP-2026-ansley-001` → `200`** (presigned delivery, §4.4):
```jsonc
{
  "reportId": "INP-2026-ansley-001", "buildingId": "ansley-mall", "audience": "owner",
  "engineVersion": "0.3.0", "schemaVersion": "0.1.0", "generatedAt": "2026-06-16T14:30:42Z",
  "master": { "format": "pdf", "url": "https://inplanted-reports.s3...X-Amz-Signature=...", "expiresAt": "2026-06-16T15:30:42Z" },
  "briefs": [
    { "briefId": "A1_structural", "url": "https://...", "expiresAt": "2026-06-16T15:30:42Z" },
    { "briefId": "A2_stormwater", "url": "https://...", "expiresAt": "2026-06-16T15:30:42Z" },
    { "briefId": "A5_matrix",     "url": "https://...", "expiresAt": "2026-06-16T15:30:42Z" },
    { "briefId": "B1_city",       "url": "https://...", "expiresAt": "2026-06-16T15:30:42Z" }
  ],
  "json": { "url": "https://...", "expiresAt": "2026-06-16T15:30:42Z" }
}
```

---

## 8. GraphQL alternative (brief sketch — defer per architecture/03 §5.1)

REST is the starting requirement. Add **AppSync GraphQL** *only if* the twin's nested reads (building → surfaces → scores → incentives) become a chatty-REST problem. The schema would expose the same canonical types; mutations return the same `Job`.
```graphql
type Query {
  building(id: ID!): Building
  scores(buildingId: ID!, weights: WeightsInput): EngineResult   # synchronous engine
  job(id: ID!): Job
  report(id: ID!): Report
}
type Mutation {
  ingestBuilding(input: IngestInput!): Job!          # async → Job
  runCalc(buildingId: ID!, input: CalcInput!): Job!  # async → Job (kind: solar|stormwater|energy)
  generateReport(buildingId: ID!, input: ReportInput!): Job!  # async → Job(kind: report)
}
type Subscription { jobUpdated(jobId: ID!): Job }    # replaces polling/webhook (architecture/03 §5.1 push)
# Building/CandidateSurface/Score/EngineResult/WorkerResult map 1:1 to HANDSHAKE §3.
# Job/ErrorResponse/Paginated/AuthToken map 1:1 to §3 of this doc.
```
**Why a sketch, not a spec:** one nested GraphQL read collapses the twin's building+surfaces+scores+incentives round-trips, and `Subscription` is the cleanest job-push. But it's an optimization, not MVP — REST `/v1` ships first.

---

## 9. Mapping to today (migration path)

Each planned endpoint and what currently substitutes for it. Today the "API" is committed JSON + (eventually) a Python worker CLI; nothing is networked.

| Planned endpoint `[PLANNED]` | What substitutes for it **today** | Migration note |
|---|---|---|
| `GET /v1/buildings/{id}` | `import` of `src/data/buildings/ansley-mall.json` by the JS engine | Same `Building` shape — swap the import for a `fetch`; body is byte-compatible once provenance strings → `Provenance` objects. |
| `GET /v1/buildings` (list) | the set of files in `src/data/buildings/*.json` | Becomes a PostGIS `SELECT … WHERE tenant_id` (architecture/03 §3). |
| `GET /v1/buildings/{id}/scores?weights=` | JS engine (`src/engine/*`) run **in-browser** over the imported fixture | The *same* shared engine runs server-side (Node Lambda) for the server-of-record result; browser keeps running it for the live twin. One engine, two runtimes (architecture/03 §1.1 S6). |
| `POST /v1/buildings/{id}/jobs` (`kind:solar`) | the **PySAM solar worker CLI** run offline by hand; output pasted into the fixture's `interventions.roofSolar` block | CLI output already is the canonical `SolarResult`/`WorkerResult` (HANDSHAKE §3.7) — wrap the same worker in a Batch job, enqueue via SQS (architecture/03 §2). *(Worker is real for solar today; stormwater/energy are `[PLANNED]`.)* |
| `POST .../jobs` (`stormwater`/`energy`) | not yet built — values are hand-entered constants in the fixture | New Batch solvers (SWMM/EnergyPlus) emit the same `WorkerResult` envelope. |
| `GET /v1/jobs/{jobId}` | n/a — offline runs have no job id | Pure new infra (Step Functions execution status). |
| `POST /v1/buildings/{id}/reports` → presigned URL | `window.print()` of the rendered HTML one-pager in the browser | Same HTML template rendered server-side by Playwright/Chrome → S3 → presigned URL (architecture/03 §5.2). FE swaps "print" for "poll job → download". |
| `GET /v1/reports/{id}` | the in-browser report view / printed PDF | Report JSON is the `InPlantedRetrofitReport` (ReportExportSpec §4.1), now persisted + delivered presigned. |
| `POST /v1/auth/token` + scopes/tenanting | none — demo is unauthenticated, single "tenant", static files | New: Cognito + JWT + Postgres RLS (architecture/03 §6). Add `tenant_id` from day one of the DB. |
| `/v1/portfolios/*`, `/v1/cities/*` | the per-building fixture + the static city-contribution block in the fixture | Post-MVP (architecture/03 Phase 3–4). |

---

## 10. Proposed contract changes (spine additions)

These belong on the **HANDSHAKE spine** but are flagged here, not yet applied (this doc must not modify HANDSHAKE):

1. **Add API-transport types to the index.** HANDSHAKE §0 lists `01–04`; this doc (`03`) introduces `Job`, `ErrorResponse`, `Paginated<T>`, `AuthToken`. Recommend a one-line note in HANDSHAKE §5 that these four transport types are owned here and are *not* domain types (so `01_domain-types.md` doesn't try to mirror them as pydantic/JSON-Schema domain artifacts — though `Job`/`ErrorResponse` likely deserve JSON Schema for FE validation).
2. **`tenantId` is a first-class field.** It appears on every persisted resource (architecture/03 §6) but isn't in any HANDSHAKE §3 type. Decide: keep it transport-only (set by RLS, never in `Building`) — **recommended** — or add it to the domain types. This doc assumes transport-only; flag for a spine decision.
3. **Provenance on the wire vs. in the fixture.** The committed fixture uses *string* provenance (`"provenance": "google"`); HANDSHAKE §3.1 defines `Provenance` as an *object*. The API serves the object form. Flag: the fixture→API migration needs a provenance-string→object normalizer, and HANDSHAKE §6 ("source-of-truth map") should note the demo fixture predates the object form.
4. **`weights` shape.** This doc defines the composite-weights query param as `Record<objective, number>` summing to 1 over the §3.4 objective enum. If the engine (Doc 01 §7.8 / `02_engine-contracts.md`) formalizes a `Weights` type, it should live in `02` and be referenced here — flag for alignment.
5. **Bump HANDSHAKE Changelog** when `03_api-endpoints.md` is filled (it currently says "sub-docs 01–04 to be filled").

---

## Changelog
| Date | Version | Change |
|---|---|---|
| 2026-06-16 | 0.1.0 | Initial `[PLANNED]` FE↔BE contract: resource map (auth/buildings/scores/jobs/reports/+portfolio later), canonical-typed request/response schemas, async job lifecycle, error/pagination/idempotency/rate-limit/versioning/CORS/header conventions, Cognito/JWT auth + scopes + tenanting, Ansley examples, GraphQL sketch, mapping-to-today, proposed spine additions. |
