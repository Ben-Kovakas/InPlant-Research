# 03 · Report / Export Specification
## In-Planted / Climate Resilient ATL — the "now I can take a solid direction" artifact

> **What this document is.** The 3D twin is the *show-me*. This spec defines the **exported report** — the *now-I-can-act* artifact. It is the document a commercial building owner would otherwise have to **hand-assemble manually** (hunting parcel data, energy models, code citations, incentive rules) before they could pursue any incentive or permit. In-Planted generates it for them. This file defines that report's taxonomy, section structure, real-world handoff workflow, an exportable JSON schema, a filled demo example, the credibility/honesty layer, and a hackathon-pragmatic minimum-viable cut.
>
> **Grounding:** `FINAL.md` §1 (actor = owner who hires the other 5 personas), §2 (wow metrics), §6 (6-part hero artifact), §7 (equations behind each number); `ArchitectureCodeResearchAgents/ExecutiveSummary.md` §3B (six reviewer-trusted templates), §3C (agency handoff phases).
>
> **The two-sided framing this report serves:**
> - **Side A — Gives the company (owner):** incentive/tax-credit stack, energy + fee savings, foot-traffic/amenity value, and a **permitting/compliance head-start**.
> - **Side B — Provides the Mayor's Office / City:** a report showing the building's measured contribution to Atlanta's green/sustainability goals, plus starting points for the architecture-code conversation.
> - The report is the **gateway** that saves both sides the manual write-up. One artifact, two audiences.

---

## 1. Report Taxonomy — one master, many fan-out briefs

The product generates **ONE owner-facing master report** per building (or per portfolio, with one master per building inside it). The master is self-contained and pitch-ready. From it, the engine **fans out** vendor/agency briefs — each a focused extract pre-formatted for the specific hired team or agency that will act on it. This mirrors `FINAL.md` §1 ("one owner-facing report, fanning out into vendor-ready packages") and maps 1:1 onto the six reviewer-trusted templates in `ExecutiveSummary.md` §3B.

```
                        ┌─────────────────────────────────────────────┐
                        │  MASTER OWNER REPORT  (the hero artifact)     │
                        │  building snapshot · package · impact deltas  │
                        │  cost/ROI + incentive stack · feasibility ·   │
                        │  next-step checklist                          │
                        └───────────────┬─────────────────────────────┘
                                        │  fans out into ↓
   ┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
   ▼              ▼              ▼              ▼              ▼              ▼              ▼
 SIDE A — vendor/agency briefs (the owner hands these to the teams they HIRE)        SIDE B — City
 ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
 │Structural│ │Stormwater│ │Tree /    │ │Historic  │ │Code-     │ │Zoning    │ │City / Mayor's│
 │Load Memo │ │GI Sizing │ │Planting  │ │Design    │ │Compliance│ │Conform-  │ │Office green- │
 │(stub)    │ │Worksheet │ │Credit WS │ │Narrative │ │Matrix    │ │ance      │ │goals contrib.│
 └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘
      ▼            ▼            ▼            ▼            ▼            ▼              ▼
   Structural   Civil /      Arborist     Architect /  Law /        Architect /   City of Atlanta
   PE           stormwater   (reg. tree   AUDC         compliance   zoning        Mayor's Office /
   (GA-licensed) engineer    professional consultant   advisor      counsel       Office of Resilience
```

### 1.1 Master → brief → recipient mapping

| # | Fan-out brief | Maps to `ExecutiveSummary.md` §3B template | Hired team / recipient (the persona the owner hires) | Agency it ultimately reaches (§3C) |
|---|---|---|---|---|
| A1 | **Structural Load Memo (stub)** | B.2 Structural Load Memo (PE-stamped) — *the gate-retiring artifact* | Structural **PE** (GA-licensed) | Office of Buildings |
| A2 | **Stormwater / GI Sizing Worksheet** | B.3 Stormwater Concept Plan / GI Sizing Worksheet | **Civil / stormwater engineer** | Dept. of Watershed Management (DWM) |
| A3 | **Tree Recompense + Planting-Credit Worksheet** | B.4 Tree Recompense + Planting-Credit Worksheet | **Arborist** (registered tree professional, §158-33) | City Arborist |
| A4 | **Historic Design Narrative** *(conditional — only if parcel is in a historic district, e.g. Fairlie-Poplar)* | B.5 Historic Design Narrative | **Architect / historic-preservation consultant** | AUDC (Atlanta Urban Design Commission) — *before* building permit |
| A5 | **Code-Compliance Matrix** | B.1 Code-Compliance Matrix (the spine) | **Law / compliance advisor** | Office of Buildings (rolls up all evidence) |
| A6 | **Zoning Conformance / Variance Narrative** | B.6 Zoning Conformance / Variance Narrative | **Architect / zoning counsel** | Office of Planning / Zoning |
| **B1** | **City / Mayor's-Office Contribution Report** *(Side B)* | *Not in §3B — net-new, the Side-B deliverable* | **City of Atlanta** (Mayor's Office of Resilience / Sustainability) | Mayor's Office; supports CBEEO benchmarking disclosure |

**Conditionality rules (so the engine doesn't over-generate):**
- A4 Historic Narrative is generated **only if** `parcel.historic_district != null` (e.g., Fairlie-Poplar).
- A6 Zoning narrative is generated **only if** the package triggers a zoning question (open-space credit, variance) — otherwise folded into A5 as a single matrix row. ATL Zoning 2.0 is mid-adoption; default to legacy-code fallback (`ExecutiveSummary.md` §5).
- A1 Structural Memo is **always** generated (it is the universal gate per §3C Phase 1).

---

## 2. Section-by-section structure of the MASTER owner report

Built directly on `FINAL.md` §6's six-part hero artifact. Each section lists its **data fields**, the **source/equation** (cited to `FINAL.md` §7), and the **real-world action it enables**.

### Section 0 — Cover / Identity (provenance)
| Field | Source | Enables |
|---|---|---|
| `report_id`, `generated_at`, `engine_version`, `parcel_id`, `address` | Engine + COA GIS / Property Info viewer | Traceability; lets a reviewer trust the artifact's origin |
| `audience` (owner / city) | Render-time flag | Same data, two framings (Side A vs Side B) |

### Section 1 — Building Snapshot + Current Sustainability Rating
*(FINAL.md §6.1)*

| Field | Source | Enables |
|---|---|---|
| `gross_floor_area_sqft`, `stories`, `year_built`, `roof_area_sqft`, `usable_roof_area_sqft` | COA GIS + Microsoft US Building Footprints + LiDAR | Sizes every downstream estimate |
| `energy_star_percentile` / `eui_kbtu_sqft` | ENERGY STAR Portfolio Manager benchmark (FINAL §3.1; top-25% ≈ 35% less energy) | "Where do I rank?" hook; baseline for CBEEO |
| `cool_roof_status` (compliant / re-roof obligation pending) | Cool Roof Ord. 25-O-1310 (eff. June 2026), §3B matrix | Frames the green roof as a *compliant path for a mandatory obligation* |
| `current_rating_summary` (0–100 composite, pre-retrofit) | FINAL §7.8 composite | The "before" the retrofit improves on |

**Action:** establishes the baseline the owner is starting from — the "you are here."

### Section 2 — Recommended Package(s) on the 3D Twin
*(FINAL.md §6.2)*

| Field | Source | Enables |
|---|---|---|
| `packages[]` — each: `package_id`, `name` (e.g. "Package B"), `interventions[]` | Engine scoring (`projectSummary.md` pipeline) | The owner picks a package to commission |
| each intervention: `type` (solar / green_roof / cistern / shade_lattice / shade_crop), `surface_id`, `area_sqft`, `placement_note` | Surface extraction + scoring | Maps the recommendation to a real surface → becomes an RFP scope line |
| `twin_view_url` / `twin_state` (camera, sun-time, layer toggles) | Three.js prototype state | Lets the reader jump back into the *show-me* from the report |

**Action:** turns "we should green our building" into "build *this* on *that* roof" — the scope an RFP is written against.

### Section 3 — Impact Deltas (the environmental "wow")
*(FINAL.md §6.3 — gallons / kWh / tons CO₂ / °F / habitat)*

| Field | Equation / source (FINAL.md §7) | "Verify" flag |
|---|---|---|
| `stormwater_gallons_per_storm`, `annual_gallons_retained`, `first_inch_compliance` (bool) | §7.2 — `WQv = (P×Rv×A)/12`, `Rv = 0.05+0.009·I`, green-roof retention 50–80%; `1 ft³ = 7.48 gal`; first 1.0" per Ch. 74 Art. X | `Rv` form per GSMM Vol. 2; first-inch sf threshold per DWM |
| `solar_kwh_per_yr`, `system_kw_dc` | §7.1 — NREL PVWatts API; `kW_DC ≈ area_m² × 0.15–0.20 × 0.7` | module power density + packing factor |
| `energy_kwh_saved_per_yr` | §7.4 — empirical % cooling reduction OR `Q=U·A·ΔT` w/ Atlanta CDH + COP | U-values, CDH, COP |
| `co2_tons_per_yr` (operational + sequestration) | §7.5 — `(kWh saved + kWh solar) × eGRID factor` (~0.4 kg/kWh) + `veg_area × seq_rate` | current EPA eGRID SERC/Southern factor |
| `roof_temp_drop_F` | §7.3 — Landsat/MODIS LST + empirical delta (black ~140°F → green ~90°F) | empirical, label as illustrative |
| `habitat_m2_added` | §7.6 — vegetated area proxy; **qualitative** | no standard formula — honesty note |

**Action:** ESG/sustainability reporting numbers; the substance of the Side-B City report; feeds green-financing qualification.

### Section 4 — Cost & ROI incl. Stacked Incentive $
*(FINAL.md §6.4 — the owner's headline "wow", FINAL §5.1)*

| Field | Equation / source (FINAL.md §7.7) | Real-world doc it feeds |
|---|---|---|
| `capex_total`, `capex_by_intervention[]` | `Σ(area × unit_cost)` — green roof $/sqft, solar $/W, cistern $/gal (EPA GI / Chattahoochee Riverkeeper / NREL / RSMeans) | RFP budget |
| `annual_savings` = `energy_$ + avoided_stormwater_fee + avoided_tree_recompense` | §7.7 + Georgia Power commercial tariff | The savings side of payback |
| **`incentive_stack[]`** — itemized below | FINAL §5.1 (already researched) | Each line = one application |
| `incentive_total`, `net_capex` = `capex − incentive_total` | §7.7 incentive-adjusted capex | What the owner actually finances |
| `simple_payback_yrs` = `net_capex / annual_savings` | §7.7 | The single number that triggers "commission it" |

**`incentive_stack[]` line items (each carries `eligibility`, `est_value`, `requires`, `deadline`, `citation`, `verify`):**

| Incentive | Level | What it requires (web-confirmed) | Citation |
|---|---|---|---|
| **§179D deduction** | Federal | Energy model showing ≥25% cost reduction vs ASHRAE 90.1 baseline; **PE certification**; up to $1.00/sqft (→ $5.00/sqft w/ prevailing wage + apprenticeship) | IRC §179D; IRS guidance |
| **30% ITC (§48)** | Federal | Solar/storage/geothermal placed in service; **Form 3468**; 30% rate needs wage+apprenticeship (or <1 MW exemption); locked through 2032, phases down after mid-2026 | IRC §48; IRS Form 3468 |
| **Georgia Power Commercial EE rebate** | Utility | Prescriptive/custom measures; $100K–$350K/building/yr | FINAL §5.1 |
| **Georgia Conservation Tax Credit** | State | 25% of FMV of donated land/easement; corp cap $500K | FINAL §5.1 |
| **Cool-roof exemption value** | City | Vegetated roof area exempt from re-roof cool-roof obligation → avoided compliance cost | Ord. 25-O-1310 |
| **Tree recompense avoidance + 1.25× planting credit** | City | Being additive avoids $140/DBH-in; banks 1.25× caliper credit | Ch. 158 |

**Action:** the owner sees net cost, payback, and a dated list of money to claim — the single most direct driver of "act now."

### Section 5 — Feasibility + Codes Satisfied/Pre-empted
*(FINAL.md §6.5; metric #7; `ExecutiveSummary.md` §1)*

| Field | Source | Enables |
|---|---|---|
| `permitability_confidence` (low/med/high risk) | §3B Code-Compliance Matrix rollup | "Low-risk → proceed to design" |
| `structural_gate_status` (extensive 15–35 psf target; residual-capacity note) | §3B B.2; Atlanta City Hall analog (58 vs 186 psf) | De-risks the binary gate up front |
| `codes_satisfied[]` / `codes_preempted[]` — each `code`, `citation`, `how_complied`, `reviewer`, `status` | §3B B.1 matrix spine | Each row = a permitting conversation pre-answered |
| `open_flags[]` (e.g. NFPA 285 living-wall uncertainty; AUDC if historic) | `ExecutiveSummary.md` §6 | Honest risk surfacing |

**Action:** answers the owner's "time/permitting" pain; tells them which gates are already cleared on paper.

### Section 6 — Next-Step Checklist (RFP starter + incentive applications)
*(FINAL.md §6.6)*

| Field | Source | Enables |
|---|---|---|
| `rfp_scope_lines[]` (derived from Section 2 interventions) | Engine | Paste into an RFP to the contractor/architect |
| `incentive_applications[]` — each `incentive`, `form`, `prerequisite_artifact`, `deadline` | Section 4 + web-confirmed reqs | A literal to-do list with dependencies |
| `agency_handoffs[]` — sequenced per §3C phases (see §3 below) | `ExecutiveSummary.md` §3C | Who to send what, in what order |
| `generated_briefs[]` (links to the fan-out A1–A6 + B1) | §1 taxonomy | One click → the vendor packet |

**Action:** this is the section that literally tells the owner what to do Monday morning.

---

## 3. The "Next Steps in the Real World" Workflow

Each export is tied to a concrete real-world action, **sequenced to mirror `ExecutiveSummary.md` §3C phases**. The master report's Section 6 renders this as an ordered checklist.

### Phase 0 — Assemble & decide (the report itself)
- Owner reviews the **Master Report**, picks a package (e.g. Package B), confirms the parcel flags (historic? zoning trigger?) that decide which briefs generate.

### Phase 1 — Retire the structural gate (longest pole, start immediately)
- **Export:** A1 **Structural Load Memo (stub)** → hand to **structural PE**.
- **Owner does:** pull original structural drawings from Office of Buildings archive; PE produces the load-comparison table at extensive (15–35 psf) load, cites Atlanta City Hall analog. **This unlocks everything downstream.**

### Phase 2 — Run the substantiation tracks in parallel (once load is retired)
- **A2 GI Sizing Worksheet → civil/stormwater engineer → DWM.** Owner submits the first-inch (1.0") capture sizing to **Dept. of Watershed Management**; confirm sf applicability threshold.
- **A3 Tree/Planting-Credit Worksheet → arborist → City Arborist.** Documents recompense avoidance + 1.25× credit.
- **A4 Historic Design Narrative → architect → AUDC** (*only if historic*; AUDC review happens **before** the building permit).
- **A6 Zoning Conformance → zoning counsel → Office of Planning** (*only if triggered*).
- **In parallel — incentive applications (Side A money):**
  - **§179D:** commission the PE energy-model certification (≥25% vs ASHRAE 90.1); claim up to $1.00/sqft (or $5.00 w/ prevailing wage + apprenticeship) on the tax return.
  - **30% ITC (§48):** file **Form 3468** for the solar/storage in the placed-in-service year; confirm wage/apprenticeship or <1 MW exemption.
  - **Georgia Power rebate:** submit prescriptive/custom measure application.
  - **Cool-roof exemption / tree credit:** file with Office of Buildings / City Arborist.

### Phase 3 — Roll up & submit for permit
- **A5 Code-Compliance Matrix → law/compliance advisor → Office of Buildings.** All Phase-2 evidence rolls into the matrix (requirement → citation → how-complied → evidence → reviewer → status); this is the permitting submission spine.

### Side-B track (runs anytime after Phase 0)
- **B1 City / Mayor's-Office Contribution Report → City of Atlanta.** Owner submits the building's measured contribution to city goals (gallons retained, tons CO₂, canopy/habitat) and uses the energy data to satisfy the **CBEEO annual benchmarking** (ENERGY STAR Portfolio Manager, ≥25,000 sqft, **June 1 deadline**, 12 months whole-building energy+water). The report is the pre-assembled write-up the City would otherwise require the owner to compile manually.

---

## 4. Concrete Data Schema for Export

### 4.1 JSON schema (the full report object the prototype generates)

```jsonc
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "InPlantedRetrofitReport",
  "type": "object",
  "required": ["report_id", "generated_at", "engine_version", "building", "packages"],
  "properties": {
    "report_id":      { "type": "string" },
    "generated_at":   { "type": "string", "format": "date-time" },
    "engine_version": { "type": "string" },
    "audience":       { "enum": ["owner", "city"], "default": "owner" },
    "data_provenance": {
      "type": "object",
      "description": "Per-field source + modeled-vs-measured honesty layer (see §5).",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "source":   { "type": "string" },
          "basis":    { "enum": ["measured", "modeled", "illustrative", "literature"] },
          "verify":   { "type": "boolean" },
          "citation": { "type": "string" }
        }
      }
    },

    "building": {
      "type": "object",
      "required": ["parcel_id", "address", "gross_floor_area_sqft"],
      "properties": {
        "parcel_id":               { "type": "string" },
        "address":                 { "type": "string" },
        "lat": { "type": "number" }, "lng": { "type": "number" },
        "gross_floor_area_sqft":   { "type": "number" },
        "roof_area_sqft":          { "type": "number" },
        "usable_roof_area_sqft":   { "type": "number" },
        "stories":                 { "type": "integer" },
        "year_built":              { "type": "integer" },
        "historic_district":       { "type": ["string", "null"] },
        "energy_star_percentile":  { "type": ["number", "null"] },
        "eui_kbtu_sqft":           { "type": ["number", "null"] },
        "cool_roof_status":        { "enum": ["compliant", "reroof_obligation_pending", "exempt", "unknown"] },
        "current_rating":          { "type": "number", "minimum": 0, "maximum": 100 }
      }
    },

    "packages": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["package_id", "name", "interventions", "impact", "cost"],
        "properties": {
          "package_id": { "type": "string" },
          "name":       { "type": "string" },
          "recommended": { "type": "boolean" },
          "twin_state": {
            "type": "object",
            "properties": {
              "sun_time": { "type": "string" },
              "layers":   { "type": "array", "items": { "type": "string" } },
              "camera":   { "type": "array", "items": { "type": "number" } }
            }
          },
          "interventions": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["type", "surface_id", "area_sqft"],
              "properties": {
                "type":          { "enum": ["solar", "green_roof", "cistern", "shade_lattice", "shade_crop"] },
                "surface_id":    { "type": "string" },
                "area_sqft":     { "type": "number" },
                "placement_note":{ "type": "string" }
              }
            }
          },

          "impact": {
            "type": "object",
            "properties": {
              "stormwater_gallons_per_storm": { "type": "number" },
              "annual_gallons_retained":      { "type": "number" },
              "first_inch_compliance":        { "type": "boolean" },
              "solar_kwh_per_yr":             { "type": "number" },
              "system_kw_dc":                 { "type": "number" },
              "energy_kwh_saved_per_yr":      { "type": "number" },
              "co2_tons_per_yr":              { "type": "number" },
              "roof_temp_drop_F":             { "type": "number" },
              "habitat_m2_added":             { "type": "number" }
            }
          },

          "cost": {
            "type": "object",
            "required": ["capex_total", "incentive_stack", "simple_payback_yrs"],
            "properties": {
              "capex_total":      { "type": "number" },
              "capex_by_intervention": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "type": { "type": "string" },
                    "unit_cost": { "type": "number" },
                    "unit": { "type": "string" },
                    "subtotal": { "type": "number" }
                  }
                }
              },
              "annual_savings": {
                "type": "object",
                "properties": {
                  "energy_$":                 { "type": "number" },
                  "avoided_stormwater_fee_$": { "type": "number" },
                  "avoided_tree_recompense_$":{ "type": "number" },
                  "total_$":                  { "type": "number" }
                }
              },
              "incentive_stack": {
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["name", "level", "est_value_$"],
                  "properties": {
                    "name":     { "type": "string" },
                    "level":    { "enum": ["federal", "state", "utility", "city"] },
                    "est_value_$": { "type": "number" },
                    "requires": { "type": "string" },
                    "form":     { "type": ["string", "null"] },
                    "deadline": { "type": ["string", "null"] },
                    "citation": { "type": "string" },
                    "verify":   { "type": "boolean" }
                  }
                }
              },
              "incentive_total_$":  { "type": "number" },
              "net_capex_$":        { "type": "number" },
              "simple_payback_yrs": { "type": "number" }
            }
          },

          "feasibility": {
            "type": "object",
            "properties": {
              "permitability_confidence": { "enum": ["low_risk", "medium_risk", "high_risk"] },
              "structural_gate_status":   { "type": "string" },
              "codes_satisfied": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "code":         { "type": "string" },
                    "citation":     { "type": "string" },
                    "how_complied": { "type": "string" },
                    "reviewer":     { "type": "string" },
                    "status":       { "enum": ["met", "pending", "needs_review"] }
                  }
                }
              },
              "codes_preempted": { "type": "array", "items": { "type": "string" } },
              "open_flags":      { "type": "array", "items": { "type": "string" } }
            }
          },

          "next_steps": {
            "type": "object",
            "properties": {
              "rfp_scope_lines": { "type": "array", "items": { "type": "string" } },
              "incentive_applications": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "incentive":           { "type": "string" },
                    "form":                { "type": ["string", "null"] },
                    "prerequisite_artifact": { "type": "string" },
                    "deadline":            { "type": ["string", "null"] }
                  }
                }
              },
              "agency_handoffs": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "phase":    { "type": "integer" },
                    "brief_id": { "type": "string" },
                    "agency":   { "type": "string" },
                    "hired_team": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "generated_briefs": {
      "type": "array",
      "description": "The fan-out artifacts (§1). Each is a derived view of this report.",
      "items": {
        "type": "object",
        "properties": {
          "brief_id":   { "enum": ["A1_structural", "A2_stormwater", "A3_tree", "A4_historic", "A5_matrix", "A6_zoning", "B1_city"] },
          "template":   { "type": "string" },
          "recipient":  { "type": "string" },
          "agency":     { "type": "string" },
          "conditional":{ "type": "boolean" },
          "export_url": { "type": "string" }
        }
      }
    }
  }
}
```

### 4.2 Recommended human-readable export formats

| Format | Audience | Content | Build path |
|---|---|---|---|
| **Master one-pager (PDF)** | Owner / pitch / judges | Sections 1–6 condensed to a single page: snapshot, twin thumbnail, the 4 hero deltas (gallons / kWh / tons CO₂ / payback), the incentive-stack dollar figure, feasibility traffic-light, next-step checklist | Render JSON → HTML template → print-to-PDF (e.g. `@react-pdf` or headless Chrome) |
| **Multi-page vendor packet (PDF)** | Hired teams / agencies | Cover + master summary, then one section per generated brief (A1–A6, B1). Each brief is a §3B template pre-filled with this building's data, citations, and "verify" flags | Same renderer, brief-per-page sections |
| **JSON export** | Prototype / integrations | The full object above | Native engine output |
| **City contribution report (PDF, Side B)** | Mayor's Office | B1 only: building's measured contribution to city goals + CBEEO benchmarking-ready energy summary | Audience-flag render of the same JSON |

**One-pager layout (top → bottom):** header (address + current rating) · twin thumbnail with package label · four big metric tiles · "Incentive stack: $X" callout · payback + net-capex line · feasibility traffic-light row · "Your next 3 steps" checklist · provenance/honesty footer.

### 4.3 Filled-in example (demo building — ILLUSTRATIVE numbers)

> **All numbers below are illustrative placeholders** consistent with `FINAL.md` ranges, for the demo "Lot 0427" building. They are **not measured** — they exemplify the schema. Real values require wiring the §7 data paths.

```jsonc
{
  "report_id": "INP-2026-0427-001",
  "generated_at": "2026-06-16T14:30:00Z",
  "engine_version": "0.3.0-hackathon",
  "audience": "owner",
  "data_provenance": {
    "packages[0].impact.solar_kwh_per_yr":   { "source": "NREL PVWatts API",        "basis": "modeled",      "verify": true,  "citation": "developer.nrel.gov" },
    "packages[0].impact.co2_tons_per_yr":    { "source": "EPA eGRID Southern",      "basis": "modeled",      "verify": true,  "citation": "EPA eGRID (verify current factor)" },
    "packages[0].impact.roof_temp_drop_F":   { "source": "empirical literature",    "basis": "illustrative", "verify": true,  "citation": "green ~90F vs black ~140F" },
    "packages[0].impact.habitat_m2_added":   { "source": "vegetated-area proxy",    "basis": "illustrative", "verify": false, "citation": "FINAL §7.6 (qualitative)" }
  },
  "building": {
    "parcel_id": "14-0078-LL-0427",
    "address": "Lot 0427, Fairlie-Poplar, Atlanta, GA",
    "lat": 33.7556, "lng": -84.3915,
    "gross_floor_area_sqft": 120000,
    "roof_area_sqft": 18000,
    "usable_roof_area_sqft": 12600,
    "stories": 8,
    "year_built": 1928,
    "historic_district": "Fairlie-Poplar",
    "energy_star_percentile": 42,
    "eui_kbtu_sqft": 88,
    "cool_roof_status": "reroof_obligation_pending",
    "current_rating": 51
  },
  "packages": [
    {
      "package_id": "B",
      "name": "Package B — Extensive Green Roof + Rooftop Solar + Cistern",
      "recommended": true,
      "twin_state": { "sun_time": "2026-06-21T13:00", "layers": ["solar", "drainage"], "camera": [40, 60, 40] },
      "interventions": [
        { "type": "green_roof", "surface_id": "roof_main", "area_sqft": 9000,  "placement_note": "Extensive 15-35 psf; set back from parapet (historic, not visible from ROW)" },
        { "type": "solar",      "surface_id": "roof_south","area_sqft": 3600,  "placement_note": "South-facing; ~0.18 kW/m2, 0.7 packing" },
        { "type": "cistern",    "surface_id": "mech_room", "area_sqft": 200,   "placement_note": "Co-located w/ green roof for first-inch capture" }
      ],
      "impact": {
        "stormwater_gallons_per_storm": 8400,
        "annual_gallons_retained": 410000,
        "first_inch_compliance": true,
        "solar_kwh_per_yr": 92000,
        "system_kw_dc": 59,
        "energy_kwh_saved_per_yr": 61000,
        "co2_tons_per_yr": 61,
        "roof_temp_drop_F": 48,
        "habitat_m2_added": 836
      },
      "cost": {
        "capex_total": 612000,
        "capex_by_intervention": [
          { "type": "green_roof", "unit_cost": 22, "unit": "$/sqft", "subtotal": 198000 },
          { "type": "solar",      "unit_cost": 2.6,"unit": "$/W",    "subtotal": 153400 },
          { "type": "cistern",    "unit_cost": 1.5,"unit": "$/gal",  "subtotal": 18000 }
        ],
        "annual_savings": { "energy_$": 9100, "avoided_stormwater_fee_$": 4200, "avoided_tree_recompense_$": 5600, "total_$": 18900 },
        "incentive_stack": [
          { "name": "§179D deduction",                "level": "federal", "est_value_$": 60000, "requires": "PE-certified energy model >=25% vs ASHRAE 90.1", "form": "claimed on return", "deadline": "tax year placed in service", "citation": "IRC §179D", "verify": true },
          { "name": "30% ITC (§48)",                  "level": "federal", "est_value_$": 46000, "requires": "solar placed in service; wage+apprenticeship or <1MW", "form": "Form 3468", "deadline": "PIS tax year (rate phases down after mid-2026)", "citation": "IRC §48", "verify": true },
          { "name": "Georgia Power Commercial EE rebate","level": "utility", "est_value_$": 120000, "requires": "prescriptive/custom measure app", "form": null, "deadline": "annual program cycle", "citation": "GA Power EE program", "verify": true },
          { "name": "Cool-roof exemption value",      "level": "city",    "est_value_$": 22000, "requires": "vegetated roof area documented", "form": null, "deadline": "at re-roof", "citation": "Ord. 25-O-1310", "verify": true },
          { "name": "Tree recompense avoidance + 1.25x credit","level": "city","est_value_$": 5600,"requires": "additive planting documented by arborist","form": null,"deadline": null,"citation": "Ch. 158","verify": true }
        ],
        "incentive_total_$": 253600,
        "net_capex_$": 358400,
        "simple_payback_yrs": 19.0
      },
      "feasibility": {
        "permitability_confidence": "low_risk",
        "structural_gate_status": "Extensive system targeted at 15-35 psf; Atlanta City Hall analog (58 vs 186 psf, no reinforcement). PE memo pending.",
        "codes_satisfied": [
          { "code": "Cool Roof Ordinance", "citation": "25-O-1310", "how_complied": "Vegetated roof area exempt", "reviewer": "Office of Buildings", "status": "met" },
          { "code": "Stormwater first-inch", "citation": "Ch. 74 Art. X", "how_complied": "GI sized to capture 1.0\"", "reviewer": "DWM", "status": "pending" },
          { "code": "Tree Protection", "citation": "Ch. 158", "how_complied": "Additive planting; no removal", "reviewer": "City Arborist", "status": "met" }
        ],
        "codes_preempted": ["Future mandatory re-roof cool-roof obligation"],
        "open_flags": ["AUDC Certificate of Appropriateness required (Fairlie-Poplar historic) - submit before building permit", "Confirm stormwater sf applicability threshold with DWM"]
      },
      "next_steps": {
        "rfp_scope_lines": [
          "Extensive green roof, 9,000 sqft, 15-35 psf, set back from parapet",
          "Rooftop PV, ~59 kW DC, south-facing roof_south",
          "Stormwater cistern co-located for first-inch capture"
        ],
        "incentive_applications": [
          { "incentive": "§179D",   "form": "tax return", "prerequisite_artifact": "PE energy-model certification", "deadline": "tax year PIS" },
          { "incentive": "30% ITC", "form": "Form 3468",  "prerequisite_artifact": "solar placed-in-service docs",   "deadline": "tax year PIS" },
          { "incentive": "GA Power rebate", "form": null, "prerequisite_artifact": "measure application",            "deadline": "annual cycle" }
        ],
        "agency_handoffs": [
          { "phase": 1, "brief_id": "A1_structural", "agency": "Office of Buildings", "hired_team": "Structural PE" },
          { "phase": 2, "brief_id": "A2_stormwater", "agency": "DWM",                 "hired_team": "Civil engineer" },
          { "phase": 2, "brief_id": "A3_tree",       "agency": "City Arborist",       "hired_team": "Arborist" },
          { "phase": 2, "brief_id": "A4_historic",   "agency": "AUDC",                "hired_team": "Architect/HP consultant" },
          { "phase": 3, "brief_id": "A5_matrix",     "agency": "Office of Buildings", "hired_team": "Law/compliance" }
        ]
      }
    }
  ],
  "generated_briefs": [
    { "brief_id": "A1_structural", "template": "B.2 Structural Load Memo",      "recipient": "Structural PE",        "agency": "Office of Buildings", "conditional": false, "export_url": "/export/INP-2026-0427-001/A1.pdf" },
    { "brief_id": "A2_stormwater", "template": "B.3 GI Sizing Worksheet",       "recipient": "Civil engineer",       "agency": "DWM",                 "conditional": false, "export_url": "/export/INP-2026-0427-001/A2.pdf" },
    { "brief_id": "A3_tree",       "template": "B.4 Tree/Planting-Credit WS",   "recipient": "Arborist",             "agency": "City Arborist",       "conditional": false, "export_url": "/export/INP-2026-0427-001/A3.pdf" },
    { "brief_id": "A4_historic",   "template": "B.5 Historic Design Narrative", "recipient": "Architect/HP",         "agency": "AUDC",                "conditional": true,  "export_url": "/export/INP-2026-0427-001/A4.pdf" },
    { "brief_id": "A5_matrix",     "template": "B.1 Code-Compliance Matrix",    "recipient": "Law/compliance",       "agency": "Office of Buildings", "conditional": false, "export_url": "/export/INP-2026-0427-001/A5.pdf" },
    { "brief_id": "B1_city",       "template": "City Contribution (net-new)",   "recipient": "Mayor's Office",       "agency": "City of Atlanta",     "conditional": false, "export_url": "/export/INP-2026-0427-001/B1.pdf" }
  ]
}
```

> **Note on the illustrative payback (19 yrs):** intentionally honest — a green-roof-heavy package has a long simple payback before the *full* incentive stack and the avoided mandatory re-roof are valued. The narrative point is that the incentive stack ($253.6K) cuts net capex by ~41%, and the cool-roof exemption converts a *mandatory* future cost into a compliant amenity. A solar-weighted package would show a shorter payback. Tune weights via the §7.8 sliders.

---

## 5. What Makes It Credible / Defensible

1. **Every number carries provenance.** The `data_provenance` map tags each field with `source`, `basis` (measured / modeled / illustrative / literature), a `verify` flag, and a `citation`. The PDF footer renders this so no number is naked.
2. **Modeled vs. measured honesty note (mandatory on every export):**
   - **Modeled:** solar (NREL PVWatts), energy savings, CO₂ (EPA eGRID factor) — defensible engineering estimates, not metered.
   - **Illustrative:** roof-temp drop and habitat m² — empirical/proxy, explicitly flagged; we do not overclaim biodiversity (`FINAL.md` §7.6).
   - **Measured:** only fields sourced from the owner's actual utility data / GIS (e.g. floor area, ENERGY STAR percentile once Portfolio Manager data is loaded).
3. **Code references are first-class.** Every feasibility row and incentive line cites the governing code/ordinance (25-O-1310, Ch. 74 Art. X, Ch. 158, IRC §179D/§48) — matching the §3B Code-Compliance Matrix spine reviewers trust.
4. **"Verify" flags mark moving targets.** Coefficients and rules flagged in `FINAL.md` §7 and `ExecutiveSummary.md` §5 (Rv form, eGRID factor, DWM sf threshold, ATL Zoning 2.0, ITC phase-down after mid-2026) carry `verify: true` so a reviewer knows what to re-confirm at parcel stage.
5. **Open flags are surfaced, not hidden** (NFPA 285 living-wall uncertainty; no local AUDC rooftop-greening exemplar; undocumented permit timelines). Honesty reads as credibility to both a judge and a real reviewer.
6. **The structural gate is treated as binary and first** — matching `ExecutiveSummary.md` §4 — so the report never implies feasibility it hasn't earned.

---

## 6. Hackathon-Pragmatic Recommendation

### Minimum Viable Export (build THIS for the demo)
Three artifacts, all generated from the same JSON object:

1. **Master one-pager (PDF)** — Sections 1–6 condensed; the hero. This alone wins the "now I can take a solid direction" moment.
2. **Incentive checklist** — Section 4's `incentive_stack[]` + Section 6's `incentive_applications[]` as a standalone dated to-do list (179D, 30% ITC/Form 3468, GA Power rebate, cool-roof exemption). This is the Side-A "show me the money."
3. **Structural-memo stub (A1)** — a one-page B.2 template pre-filled with the building's roof area, target psf, and the Atlanta City Hall analog, with PE-signature blanks. Demonstrates the "fan-out to hired teams" mechanic with the single most important brief (the universal gate).

Plus a **one-paragraph Side-B City snippet** (B1 lite) appended to the one-pager: "This building contributes X gal retained, Y tons CO₂/yr toward Atlanta's 59%-by-2030 goal" — shows the two-sided value in the pitch without building the full city report.

**Why this cut:** it exercises the whole taxonomy (master → at least one fan-out brief → both Side A and Side B) and proves the engine generates the exact write-up owners do manually today — while staying buildable in hackathon time via a single JSON → HTML → print-to-PDF renderer.

### Full Vision (post-hackathon)
- All six fan-out briefs (A1–A6) auto-generated per parcel with conditionals firing on historic/zoning flags.
- The full B1 City Contribution Report wired to **CBEEO benchmarking** (ENERGY STAR Portfolio Manager export, ≥25,000 sqft, June 1 deadline).
- Portfolio mode: one master per building, ranked by the §7.8 composite score, with cross-building sequencing (1–5 year plan).
- Live data behind every modeled field (PVWatts, eGRID, GSMM, LST) so `basis` flips from illustrative → modeled → measured as data lands.
- User-adjustable score-weight sliders (ROI-first vs stormwater-first) that re-rank packages and re-render the report.

---

### Source citations (web-confirmed real-world specifics)
- §179D: ≥25% energy-cost reduction vs ASHRAE 90.1 baseline, PE certification required, $0.50→$1.00/sqft base (up to $5.00 w/ prevailing wage + apprenticeship). [IRS §179D](https://www.irs.gov/credits-deductions/energy-efficient-commercial-buildings-deduction), [DOE 179D](https://www.energy.gov/cmei/buildings/179d-energy-efficient-commercial-buildings-tax-deduction)
- 30% ITC (§48): Form 3468, placed-in-service 2022–2032, 30% needs wage+apprenticeship or <1 MW exemption, phases down after mid-2026. [IRS Form 3468 instructions](https://www.irs.gov/pub/irs-pdf/i3468.pdf)
- Atlanta CBEEO: annual benchmarking via ENERGY STAR Portfolio Manager, buildings ≥25,000 sqft, **June 1** deadline, 12 months whole-building energy+water, audit every 10 yrs. [Atlanta Building Benchmarking](https://atlantabuildingbenchmarking.wordpress.com/), [Livable Buckhead CBEEO guide](https://livablebuckhead.com/atlanta-commercial-energy-efficiency-ordinance-what-is-it-how-do-i-comply/)
