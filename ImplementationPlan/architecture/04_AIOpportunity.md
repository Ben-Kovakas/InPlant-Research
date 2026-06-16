# 04 · AI Opportunity Map — Where AI Genuinely Helps (and Where It Doesn't)

## In-Planted / Climate Resilient ATL — the "WHERE DOES AI HELP" map

> **What this document is.** A rigorous map of where AI is the *right* tool for the green-retrofit recommendation engine + 3D twin + auto-generated "city-ready proposal" — and, just as importantly, where deterministic engineering, real physics simulators, and plain code are the right tools. The product's credibility (per `03_ReportExportSpec.md` §5) rests on numbers that are *defensible*; AI-washing the parts that should be deterministic would destroy that. The rule applied throughout: **use AI where the input is unstructured, the rules change, or the search space is huge — and use deterministic code/real models where a formula or a standard already exists and the number must be auditable.**
>
> **Grounding:** `00_README.md` (thesis: companies → city-ready proposals, the two-sided ledger), `ArchitectureCodeResearchAgents/ExecutiveSummary.md` (the regulatory chain — the highest-value AI target), `03_ReportExportSpec.md` (the report = the generation target, with its provenance/honesty layer), `04_SelectionLogic.md` (surface → gate → rank — *deliberately not an optimizer at demo scale*), and the three Ansley pillars (`11_Ansley_Codes.md`, `12_Ansley_TaxBenefits.md`, `13_Ansley_CityContribution.md`).
>
> **This is a Claude shop.** Where an LLM is the right tool, the recommendation defaults to Claude (Anthropic) — and there is a concrete technical reason for the report/regulatory work: the **Claude Citations API** grounds every generated claim to an exact source span (character / page / content-block index) with the `cited_text` returned for free (not counted against output tokens). That maps 1:1 onto the report's mandatory provenance layer. Recommendations stay objective; non-Claude tools are named where they're genuinely better.

---

## 0. The one-paragraph thesis on AI here

The product is **80% deterministic engineering with three sharp AI wedges.** The physics (solar yield, stormwater sizing, structural load, CO₂) must stay deterministic and cited — that is the entire credibility argument. AI earns its place in exactly the spots the deterministic stack *can't* reach: (1) turning **unstructured imagery** into the surfaces the engine needs (perception), (2) keeping the **regulatory/incentive stack current and parcel-specific** across cities — the expensive-to-maintain, generalize-the-product layer (RAG/agents), and (3) **drafting the human-readable proposal** from already-computed, already-cited structured numbers (grounded generation). Everything else is a force multiplier on those three, or it is code pretending to be AI.

---

## 1. Capability Map

> Legend — **Build-vs-buy:** BUY = use an off-the-shelf product/API; BUILD = build it (usually thin LLM orchestration over Claude); HYBRID = buy a component, build the glue. **When:** H = hackathon / now; V1 = first real product; LATER = scale stage.

| # | Capability | Is AI the right tool? | AI technique (concrete, 2025–26) | Value to the product | Build vs. Buy | When |
|---|---|---|---|---|---|---|
| **P1** | Roof-plane / obstruction segmentation from imagery | **Yes** (unstructured pixels → geometry) | Segmentation foundation models — SAM/SAM-adapter fine-tuned for remote sensing; YOLOv8-edge roof-polygon extraction (outperforms raw SAM at mIoU 0.85–1.0 on roof edges) | Surfaces feed the whole `04_SelectionLogic` gate→rank pipeline | **BUY first** (Google Solar API / HelioScope LiDAR), BUILD only where they fail | V1 (buy at H) |
| **P2** | **Parking-lot** canopy area extraction | **Yes** — *the gap Google Solar API explicitly does not cover* | Semantic segmentation of lot/pavement from aerial + LiDAR (SAM-adapter or a small trained U-Net/YOLO-seg); polygonize → usable canopy area | Ansley's **~1.4 MW lot canopy** (`12_Ansley_TaxBenefits`) is half the solar story and Google **won't** size it | **BUILD** (thin) or HYBRID | V1 |
| **P3** | Footprint / story / year-built backfill where GIS is missing | Partial | Vision model read of street/aerial imagery; LLM extraction from assessor PDFs | Fills `building` schema fields when COA GIS is thin | HYBRID | LATER |
| **R1** | **Regulatory & incentive intelligence (RAG)** — codes, ordinances, zoning, tariffs, federal/state incentives | **Yes — highest-leverage AI play** | LLM + hybrid-retrieval RAG (BM25 + dense + contextual-retrieval chunking) over a curated corpus, with **citation-grounded** answers and a currency pipeline | Keeps the expensive code/incentive stack current per city; answers "what applies to THIS parcel"; **generalizes the product to any city** | **BUILD** on Claude (+ a vector DB) | V1 (lite at H) |
| **R2** | "What applies to this parcel" agent | **Yes** | Tool-calling agent: parcel attributes + historic/zoning flags → retrieves the governing rule set → returns gates/carrots with citations | Automates the `ExecutiveSummary` Phase-0 triage (historic? zoning trigger? cool-roof?) | **BUILD** on Claude (Agent SDK) | V1 |
| **G1** | **Report generation** — owner master + A1–A6 fan-out + Side-B city report | **Yes** (structured numbers → defensible prose) | LLM drafting **from the structured engine JSON**, grounded via **Claude Citations API** so every number/claim maps to a source span | The core "now I can act" artifact (`03_ReportExportSpec`); turns the hand-assembled write-up into a generated one | **BUILD** on Claude | H (one-pager), V1 (full fan-out) |
| **G2** | Narrative tailoring per audience (owner vs. Mayor's Office) | **Yes** | Same JSON, two prompts/framings (Side A vs Side B per `03` §0 audience flag) | One artifact, two audiences without re-deriving numbers | **BUILD** on Claude | V1 |
| **U1** | Conversational / agentic UX over twin + engine | **Yes** (NL intent → tool calls) | Tool-calling agent ("add canopies", "cheapest path to first-inch compliance") that invokes deterministic engine functions and re-renders the twin | Makes the twin explorable; demo "wow"; lowers expertise barrier | **BUILD** on Claude (Agent SDK) | V1 / LATER |
| **S1** | ML **surrogate** for slow simulators (EnergyPlus / SWMM) | **Yes — but only once a real simulator exists to train against** | Surrogate ML (XGBoost / MLP / Bayesian-DL) trained on simulator runs; ~60× faster than EnergyPlus for real-time what-if | Real-time slider re-rank in the twin without re-running a full sim | **BUILD** (HYBRID w/ buy of EnergyPlus/SWMM as ground truth) | LATER |
| **O1** | Multi-objective package optimization across a portfolio | Eventually (search space large) | Multi-objective optimization (NSGA-II / MILP) — *classical optimization, not "AI" per se*; ML only for the surrogate objective fn | Picks intervention mix across many buildings under budget/impact trade-offs | **BUILD** | LATER |
| **D1** | Demo-scale "pick the intervention" | **No — deterministic** | Hand-run gate→rank decision table (`04_SelectionLogic`) | Transparent, defensible, debuggable at demo scale | n/a (code) | H |
| **X1** | The physics numbers (solar kWh, stormwater gal, structural psf, CO₂, payback) | **No — deterministic/real models** | PVWatts, GSMM Vol. 2 runoff eqn, `Q=U·A·ΔT`, eGRID factor, PE load comparison | **The credibility of the entire product** | BUY API / code formula | H |

---

## 2. Perception AI (P1–P3) — vision where Google's API stops

**Why AI here:** roof planes, obstructions, and parking-lot extents live in **pixels and point clouds**, not in any database. That is the canonical computer-vision problem.

**Buy first, build the gap.** For roofs, the deterministic-enough commercial stack is excellent and should be bought, not rebuilt:

- **Google Solar API** — building rooftops only; flat commercial roofs *are* supported (panels assumed flush). **Hard limit (confirmed June 2026 docs): it does not model parking lots or fields — buildings only.** Already wired in `06_GeospatialDataPipeline` / `10_AnsleyMallRetrofitSheet`.
- **HelioScope (Aurora)** — NREL-approved engine, LiDAR over ~98% of US population, **AI-driven obstruction detection**, API library, ~$159–259/mo. This is the C&I roof workhorse; buy it before building any roof segmentation.

**Where you must BUILD (the real perception wedge): parking lots.** Ansley's headline is **~1.4 MW of lot-canopy solar** (`11`/`12`) — and Google Solar API will not size it. This is the genuine CV build:

- **Approach:** semantic segmentation of pavement/lot polygons from high-res aerial (NAIP/Google) + LiDAR, then polygonize → usable canopy area → feed the canopy `CandidateSurface`. 2025 state of the art: **SAM / SAM-adapter** (foundation model, near-zero-shot, fine-tune the mask decoder while freezing the encoder) for the segmentation prior; **YOLOv8-based edge detection** beats raw SAM on roof-polygon mIoU (0.85–1.0) and the same pattern transfers to lot edges. For a hackathon, a hand-digitized lot polygon in Google Earth (per `09_GoogleEarthCaptureGuide`) is the honest stand-in; the CV model is the V1 automation.
- **Watch:** Google announced Solar API + Google Earth integration for *"large commercial roofs and parking lots."* **[unverified — announced, confirm GA/coverage at build time.]** If it ships and covers ATL, it could collapse P2 from BUILD → BUY. Track it before investing in a lot-segmentation model.

**P3 (footprint/year/story backfill):** lower priority; a vision read of imagery or an LLM extraction from assessor PDFs fills schema gaps when COA GIS is thin. LATER.

> **Honesty flag:** segmentation output is *modeled geometry*, not survey. Tag derived areas `basis: modeled` in `data_provenance` (`03` §5). A real project still needs a measured roof/lot survey before construction.

---

## 3. Regulatory & Incentive Intelligence (R1–R2) — the highest-leverage AI play

This is the AI capability with the **highest leverage and the clearest moat.** The `ExecutiveSummary.md` chain already proved the thesis by hand: the gates/carrots, the citations, the agency workflow — *and* it documented that this layer is (a) expensive to maintain by hand, (b) parcel-specific, and (c) the **least portable** part of the product ("zoning/parcel data is the least portable; every code citation must be re-sourced per city"). Those three properties are exactly what a RAG system is *for*.

**Why currency matters — the OBBBA example.** `12_Ansley_TaxBenefits` is built around the **One Big Beautiful Bill Act (signed July 4, 2025)**, which converted the 30% ITC and §179D from standing programs into **construction-start deadlines** (ITC begin-construction by Jul 4 2026; §179D by Jun 30 2026) and changed depreciation. A hand-maintained incentive table goes stale the moment a bill passes; the whole payback band in the proposal swings on it. Plus Atlanta's own moving targets: **Cool Roof Ordinance eff. June 2026**, **ATL Zoning 2.0** mid-adoption, **tree recompense $30→$140/in (Jan 2026)**. **Keeping this current is the product's most expensive recurring cost — automating it is the most valuable AI work.**

### 3.1 RAG architecture (the diagram)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  CORPUS  (per-city, versioned)                                             │
│  municipal code (Municode/eLaws) · zoning/UDC · utility tariffs (RNR-11)   │
│  · federal/state incentives (IRC §48/§179D, OBBBA) · GSMM · ordinances     │
│  · COA GIS metadata · NPS/NFPA national standards (portable)               │
└───────────────┬──────────────────────────────────────────────────────────┘
                │  (1) INGESTION  — scheduled crawl + change-detection (diff hashes)
                │      PDF/HTML → text; preserve § citation + effective-date + URL
                ▼
        ┌───────────────────┐   (2) CHUNKING — section-aware, NOT naive fixed-size
        │  Doc processor    │       each chunk carries {citation, effective_date,
        │  + Contextual     │       jurisdiction, source_url}.  Contextual Retrieval:
        │    Retrieval      │       prepend a Claude-written 1-line context to each
        └─────────┬─────────┘       chunk before embedding (cuts retrieval misses)
                  ▼
        ┌───────────────────┐   (3) INDEX — HYBRID retrieval
        │  Vector store +   │       dense embeddings  ⊕  BM25 keyword (codes are
        │  BM25 (hybrid)    │       citation/number-heavy → lexical matters) → RRF
        └─────────┬─────────┘       fuse → rerank
                  │
   parcel attrs ──┤  (4) QUERY  — "what applies to THIS parcel?"
   (historic?     ▼      tool-calling AGENT (Claude Agent SDK) plans retrieval:
    zoning? sqft) ┌───────────────────┐   filters corpus by jurisdiction + effective_date,
                  │  Retriever agent  │   pulls governing gates/carrots
                  └─────────┬─────────┘
                            ▼
        ┌───────────────────────────────┐  (5) GENERATE + GROUND
        │  Claude + Citations API       │      answer interleaves claims with
        │  (claims ↔ source spans)      │      char/page-span citations; cited_text
        └─────────┬─────────────────────┘      returned free → render in report footer
                  ▼
        ┌───────────────────────────────┐  (6) EVAL + HALLUCINATION CONTROL
        │  - groundedness check          │      retrieval-eval (recall@k);
        │  - "abstain if no citation"    │      answer must cite or it returns
        │  - effective-date guard        │      "verify"; legal-RAG hallucination
        │  - human-in-the-loop review    │      rates run up to 33% → never auto-file
        └────────────────────────────────┘
```

### 3.2 The design choices that matter (cite-checked)

- **Hybrid retrieval, not dense-only.** Codes are citation- and number-dense ("§158-30", "0.70 SRI", "$140/DBH-inch"). Pure semantic search misses exact tokens; **BM25 + dense, fused (RRF) then reranked** is the 2025 standard for legal/regulatory corpora. Add **Contextual Retrieval** (prepend a short Claude-generated context sentence to each chunk before embedding) to cut retrieval failures.
- **Chunk on structure, carry metadata.** Chunk by code section, and attach `{citation, effective_date, jurisdiction, source_url}` to every chunk so the answer can cite it *and* the currency guard can filter stale law (e.g., legacy zoning vs. Zoning 2.0).
- **Grounding via Claude Citations API.** Each claim is tied to a span with `cited_text` (free, not billed as output tokens), works with prompt caching for the big corpus, supports PDF (page-indexed) and plain-text (char-indexed) and custom-content (block-indexed) chunks. This is the technical reason to do this on Claude — it directly produces the `03` §5 provenance layer. *(Note: Citations is incompatible with Structured Outputs — generate cited prose, then parse to JSON in a second pass, or use the engine's own JSON as the source of numbers.)*
- **Hallucination control is non-negotiable here.** Independent 2024–25 studies put **legal-RAG hallucination rates as high as 33%** even with retrieval. Therefore: **abstain-if-no-citation** (no source span ⇒ return a `verify` flag, never a number), an **effective-date guard** (never quote a rule outside its effective window — the OBBBA/Cool-Roof/Zoning-2.0 dates), and **human-in-the-loop** before anything is filed. This RAG **drafts and cites; it never autonomously asserts a legal conclusion.** That matches the docs' existing `[verify]` discipline.
- **Keeping it current.** Scheduled crawl + **change-detection by content hash** per source; when a section changes, re-chunk/re-embed and bump `effective_date`. This is the automation that replaces the manual re-verification the `ExecutiveSummary` "Moving Targets" section warns about.
- **Generalization payoff.** National/portable sources (FEMA NFHL, NPS historic standards, NFPA 285, IRC) are shared corpus; only the **local** layer (zoning, tree ordinance, local stormwater manual, historic boundaries) is re-sourced per city. The RAG makes "add a new city" a data-ingestion task, not a research project — the path from one ATL demo to a product.

**[verify]** Exact hallucination rate cited (up to 33%) is from a Stanford-affiliated legal-AI evaluation surfaced in search; treat the magnitude as directional, the *direction* (retrieval alone does not eliminate hallucination) is well-established.

---

## 4. Report Generation (G1–G2) — grounded generation, not free writing

**Why AI here:** the report is **structured numbers → fluent, audience-specific, citation-bearing prose** across one master + six fan-out briefs + a Side-B city report (`03` §1). That fan-out and tone-shifting is genuinely tedious to template by hand and genuinely easy for an LLM — *as long as it never invents a number.*

**The hard rule: the LLM does not compute, it composes.** Every quantitative field (kWh, gallons, psf, $, payback) comes **from the engine's deterministic JSON** (`03` §4.1 schema). The LLM's job is prose, structure, and grounding — not arithmetic. Implementation:

1. Engine emits the validated `InPlantedRetrofitReport` JSON (numbers already computed + `data_provenance` already tagged).
2. Pass the JSON as a **custom-content document** (block-level citations) to Claude with Citations enabled; the model drafts each section's narrative, citing the exact JSON block / code source behind each claim.
3. **Templating vs. generation split:** numeric tables, the incentive stack, and the code-compliance matrix are **deterministically templated** (no LLM — they're tabular and exact); the LLM generates the *connective narrative*, the executive summary, the per-audience framing, and the brief cover letters. This hybrid is cheaper, faster, and far safer than full generation.
4. **Side A vs Side B (G2):** same JSON, `audience` flag flips the prompt — owner gets payback/incentive framing, Mayor's Office gets the contribution-ledger framing (`13`). No number is re-derived.
5. **Human-in-the-loop:** the owner reviews before anything goes to an agency; the `verify` flags and provenance footer render in the PDF.

> This is exactly the `03` §6 minimum-viable cut: one-pager + incentive checklist + structural-memo stub, all from one JSON. The LLM makes those read like a consultant wrote them; the engine guarantees the numbers.

---

## 5. Conversational / Agentic UX (U1)

**Why AI here:** natural-language intent ("what if I add canopies?", "show me the cheapest path to first-inch compliance") → a plan of **tool calls** against the deterministic engine, then re-render the twin. The LLM is the *router and explainer*; it does not do the math.

- **Pattern:** Claude **Agent SDK** tool-calling. Tools are thin wrappers over existing engine functions: `add_intervention(surface, type)`, `recompute_impact(package)`, `rank_packages(weights)`, `query_codes(parcel)`. The agent parses intent, calls tools, narrates the result, updates `twin_state`.
- **"Cheapest path to first-inch compliance"** = the agent calls the deterministic GSMM sizing + cost functions in a loop, not an LLM guess. The agent orchestrates; the engine decides.
- **Value:** removes the expertise barrier (owner need not know the gate logic), and it's a strong demo moment. **When:** V1+, after the engine functions are stable enough to expose as tools. Not a hackathon-day-one item.

---

## 6. ML Surrogates & Optimization (S1, O1) — real, but LATER

- **S1 — Surrogate models for slow simulators.** Genuinely good AI: a trained **XGBoost / MLP / Bayesian-DL** surrogate can emulate **EnergyPlus ~60× faster**, enabling real-time what-if in the twin. **But the prerequisite is a real simulator to train against** — you cannot surrogate a model you haven't built. At hackathon/demo scale the numbers come from PVWatts + closed-form equations (`03` §3), which are already fast; there is nothing slow to emulate yet. **Build the real EnergyPlus/SWMM pipeline first, then surrogate it once the twin needs sub-second sliders over many scenarios.** LATER.
- **O1 — Multi-objective optimization.** `04_SelectionLogic` is explicit: at demo scale this is **a transparent hand-run decision table, not an optimizer** — and that is the *correct* call for credibility. True multi-objective optimization (NSGA-II / MILP) earns its place only at **portfolio scale** (rank/sequence interventions across many buildings under budget + impact constraints). Note this is **classical optimization, not "AI"** — don't AI-wash it; ML enters only as the surrogate objective function (S1). LATER.

---

## 7. Where AI Does NOT Belong (use deterministic code / real models)

This section is load-bearing for credibility. The following must **not** be done by an LLM or learned model — they have exact formulas, standards, or stamps, and the output must be auditable:

| Do NOT use AI for | Use instead | Why |
|---|---|---|
| Solar energy yield | **NREL PVWatts API** | Standard, validated, citable; an LLM estimate is indefensible |
| Stormwater first-inch sizing | **GSMM Vol. 2 runoff eqn** `WQv=(P·Rv·A)/12`, `Rv=0.05+0.009·I` | Code-mandated formula (Ch. 74 Art. X) |
| Structural load clearance | **GA-licensed PE load-comparison memo** | A legal **stamp** — AI cannot sign it; the binary gate that blocks everything (`ExecutiveSummary` §4) |
| CO₂ avoided | **EPA eGRID SRSO factor × kWh** | Regulatory factor; must cite the current value |
| Payback / incentive math | **Deterministic arithmetic** from the schema | Numbers go to a board; arithmetic must be exact and reproducible |
| Demo-scale intervention pick | **Gate→rank decision table** (`04`) | Transparent + debuggable beats a black box at demo scale |
| Final legal/tax/code conclusions | **Human professional** (PE, tax counsel, arborist, AUDC) | RAG drafts and cites; humans decide and sign. Legal-RAG hallucinates up to ~33% |
| Geometry sizing in the twin | **Compute from numbers** (`panel_count = area×packing÷panel_area`) | `04`: "geometry follows the numbers"; visual and readouts must agree |

**The line:** AI prepares, drafts, perceives, retrieves, and routes. Deterministic models and licensed humans compute, decide, and sign. The provenance layer (`03` §5: `measured` / `modeled` / `illustrative` / `literature`) is the enforcement mechanism — any field an LLM touched is `modeled` at best and never `measured`.

---

## 8. Build-vs-Buy Summary (AI / solar SaaS)

| Product | What it does well | Buy or build around it |
|---|---|---|
| **Google Solar API** | Rooftop solar potential, flux maps; flat roofs OK | **BUY** for roofs; **does NOT do parking lots** → build P2 |
| **HelioScope (Aurora)** | C&I roof design, NREL engine, LiDAR ~98% US, AI obstruction detection, API | **BUY** for serious roof PV design; ~$159–259/mo |
| **Aurora Solar** | Full sales/design suite (more residential-leaning) | Evaluate; heavier than needed for the twin demo |
| **cove.tool** | Building-performance / energy + cost early-design analysis | Evaluate for the EnergyPlus-adjacent energy modeling later **[unverified — confirm current API]** |
| **PVsyst** | Bankable detailed PV simulation | LATER, for bankable yield (overkill for demo) |
| **Claude (Anthropic)** | RAG w/ Citations API, Agent SDK tool-calling, grounded generation | **BUILD** R1/R2/G1/G2/U1 on it — Citations API is the differentiator for the provenance requirement |
| **Vector DB** (e.g. pgvector/Pinecone/Weaviate) | Dense retrieval store for the code corpus | **BUY/HOST** as the R1 index; pair with BM25 |

**Rule of thumb:** buy the **solar physics + roof CV** (mature, validated, cheap). Build the **regulatory RAG, the report generation, the parking-lot CV gap, and the conversational layer** — these are the proprietary, generalize-the-product, hard-to-buy pieces.

---

## 9. Prioritized AI Roadmap

### Build FIRST (hackathon → V1) — max leverage per unit effort

1. **G1 — Grounded report generation (one-pager).** Highest demo payoff, lowest risk: the engine JSON already exists; Claude + Citations turns it into the hero "city-ready proposal." This *is* the thesis made visible. Start here.
2. **R1-lite — Regulatory/incentive RAG over the Ansley corpus.** Even a small curated corpus (the docs in `ArchitectureCodeResearchAgents` + the Ansley pillars + OBBBA/Cool-Roof sources) demonstrates the moat and currency story. Hybrid retrieval + Citations + abstain-if-no-citation.

### Build SECOND (V1)

3. **R2 — "what applies to this parcel" agent** (tool-calling triage of historic/zoning/cool-roof flags).
4. **P2 — Parking-lot segmentation** (the genuine CV build Google won't do) — *unless* the announced Google Earth lot integration ships and covers ATL, in which case BUY.
5. **G2 — Side-A/Side-B audience tailoring** + full A1–A6 fan-out.

### Build LATER (scale)

6. **U1 — Conversational/agentic twin UX** (once engine functions are stable tools).
7. **S1 — ML surrogates** (only after a real EnergyPlus/SWMM pipeline exists to train against).
8. **O1 — Portfolio multi-objective optimization** (classical optimization; only at portfolio scale).
9. **P3 — Imagery/PDF backfill** of building attributes.

### Never (keep deterministic)

- The physics numbers, the PE stamp, the payback arithmetic, the demo-scale intervention pick, and the final legal/tax conclusions. See §7.

---

### Sources (web-verified, June 2026)
- Roof/lot segmentation & SAM: [YOLOv8 roof-polygon edge detection (arXiv 2503.09187)](https://arxiv.org/html/2503.09187v1) · [SAM for Remote Sensing (arXiv 2306.16623)](https://arxiv.org/pdf/2306.16623) · [SAM-adapter building extraction (arXiv 2312.02464)](https://arxiv.org/html/2312.02464v2)
- Google Solar API limits (buildings only, not parking lots): [Solar API Methodology](https://developers.google.com/maps/documentation/solar/methodology) · [Solar API overview](https://developers.google.com/maps/documentation/solar/overview) · [Google Earth + Solar API parking-lot announcement (X)](https://x.com/googleearth/status/1839720402094043203) **[unverified GA]**
- HelioScope / Aurora: [HelioScope product](https://helioscope.aurorasolar.com/) · [Aurora C&I tooling](https://aurorasolar.com/blog/expanding-into-ci-solar-discover-the-software-tools-for-success/)
- Legal/regulatory RAG, hallucination & grounding: [Stanford legal-RAG hallucinations study (PDF)](https://dho.stanford.edu/wp-content/uploads/Legal_RAG_Hallucinations.pdf) · [Hallucination-Free? AI legal research tools (arXiv 2405.20362)](https://arxiv.org/pdf/2405.20362) · [RAG + KG for regulatory compliance (Latitude)](https://latitude.so/blog/build-rag-kg-regulatory-compliance) · [RAG architectures 2025 guide](https://medium.com/data-science-collective/rag-architectures-a-complete-guide-for-2025-daf98a2ede8c)
- ML surrogates for EnergyPlus (~60× faster): [ANN vs XGBoost surrogate (PMC11508148)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11508148/) · [ORNL EnergyPlus surrogate (PDF)](https://info.ornl.gov/sites/publications/Files/Pub160865.pdf) · [Bayesian DL energy surrogates (arXiv 2010.03029)](https://arxiv.org/pdf/2010.03029)
- Claude Citations API & Agent SDK: [Claude Citations API docs](https://platform.claude.com/docs/en/build-with-claude/citations) · [Anthropic Citations API (Simon Willison)](https://simonwillison.net/2025/Jan/24/anthropics-new-citations-api/) · [Build with Claude](https://www.anthropic.com/learn/build-with-claude)

> **Disclaimer:** Product capabilities and pricing reflect web sources as of June 2026 and move fast — re-verify the Google Earth parking-lot integration status, HelioScope pricing/API scope, and cove.tool API before committing. Items marked **[unverified]** were announced but not independently confirmed here.
