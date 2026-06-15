# Executive Summary — Regulatory Research Chain
## Urban Green-Retrofit Engine · Target: Central Downtown Atlanta (Connector Core)

> **Produced by:** the 3-agent research chain in this folder, run in sequence against a shared target.
> **Chain:** `MetricValueAnalyst1` (what reviewers measure) → `CaseStudy2` (who cleared those bars & how) → `Integration3` (package into data + deliverables).
> **Target:** District-level — the downtown core inside the Downtown Connector (Fairlie-Poplar, South Downtown, Five Points / Peachtree corridor). **No specific parcel selected yet**; parcel-dependent items are flagged throughout.
> **Date of research:** 2026-06-15. Several governing rules changed in 2025–2026 — see "Moving Targets."

---

## TL;DR — The One-Slide Version

A non-destructive botanical retrofit (green roofs, rooftop solar, shade-crop plots, vine lattices) of an **existing** downtown Atlanta building is **regulatorily feasible and, post-June-2026, increasingly favored** — *if* it is designed as a low-load extensive system that clears the structural gate up front.

- **The killer hook:** Atlanta's new **Cool Roof Ordinance (eff. June 2026)** requires cool roofs on new construction *and roof replacements* — and **vegetated roof area is exempt.** A green roof becomes a *compliant path for a mandatory obligation* owners face anyway, not a discretionary amenity.
- **The one gate that decides everything:** **added structural load.** It's binary, it blocks every downstream deliverable, and it's retired cheaply by an extensive (15–35 psf) system + a PE load-comparison memo. The **Atlanta City Hall green roof** (58 psf added vs. 186 psf capacity, no reinforcement, on a 1930 downtown historic high-rise) is the direct local proof it works.
- **The strongest environmental win:** **first-inch stormwater retention** (Ch. 74 Art. X) — the highest-status downtown metric, with Chicago City Hall (~75% of a 1" storm retained) as the defensible performance benchmark.
- **The free dollars:** because we *add* vegetation, we **avoid** the just-quadrupled tree recompense ($140/diameter inch, eff. Jan 2026) and can **bank 1.25× caliper planting credit.**

---

## The Chain & How Each Link Fed the Next

| Agent | Question it answered | What it handed forward |
|---|---|---|
| **1 · MetricValueAnalyst** | What does each of the 7 regulatory reviewers actually *measure*, and which metrics are gates vs. carrots? | The bar heights — concrete thresholds, code citations, and a leverage ranking. |
| **2 · CaseStudy** | *Who has cleared those exact bars on an existing building, and how?* | Real precedents mapped back to Agent 1's gates, plus the techniques that cleared each one. |
| **3 · Integration** | How do we package proof of clearing those bars into artifacts reviewers trust? | A data-source registry, six reusable report templates, and a sequenced agency-handoff workflow. |

Full agent outputs are preserved in `MetricValueAnalyst1.MD`, `CaseStudy2.MD`, `Integration3.MD` (prompts) — the findings below synthesize their returned reports.

---

## 1. The Regulatory Landscape — Gates vs. Carrots (from Agent 1)

**GATES (hard pass/fail — clear them or no permit):**

| Gate | Threshold / standard | How it's cleared |
|---|---|---|
| **Structural load** ⚠️ *highest-risk* | 2024 IBC + GA amendments (eff. Jan 2026); green roof 20 psf (non-occupied) vs. 100 psf (garden); saturated medium ~7 psf/inch | GA-licensed **PE stamp** on a load-comparison memo; default to **extensive 15–35 psf** to avoid reinforcement |
| **Fire / life-safety** | 2024 IFC; combustible façade components >40 ft may trigger **NFPA 285**; egress + FD/PV access pathways | Non-combustible support / keep lattices <40 ft; maintained, irrigated spec; preserve access |
| **Stormwater** *(also a carrot)* | Ch. 74 Art. X — retain **first 1.0"** on-site via green infrastructure; GSMM Vol. 2 sizing | GI BMP (green roof + cistern) sized to capture the first inch |
| **Georgia 811 locate** | Statutory; locate ≥2 business days before *any* dig (incl. planting) | 811 ticket — **or avoid entirely by staying rooftop/structure-mounted** |
| **AUDC Certificate of Appropriateness** *(parcel-dependent)* | Required for **Fairlie-Poplar** (a designated downtown historic district) | Reversible, low-ROW-visibility design (see NPS standards) |

**CARROTS (ranked by pitch leverage):**

1. **Cool Roof Ordinance 25-O-1310** (passed June 2025, eff. June 2026) — vegetated roof area is **exempt** → green roof = compliant path for a mandatory roof-replacement obligation. *Strongest, most universal hook.*
2. **First-inch stormwater retention** — the hardest, highest-status downtown environmental metric; directly addresses the project's stormwater driver in the CSO-pressured core.
3. **Tree recompense avoidance + 1.25× caliper credit** — $140/in (eff. Jan 2026, up from $30) makes *being additive* genuinely valuable.
4. **Zoning open-space / landscape credit** — real but *uncertain*: ATL Zoning 2.0 rewrite is mid-adoption; credit language not final.
5. **Historic reversibility** — eases/expedites AUDC COA in Fairlie-Poplar (narrative value, non-monetary).

---

## 2. Proof It Works — Top Precedents (from Agent 2)

| Precedent | Why it matters | Maps to gate |
|---|---|---|
| **Atlanta City Hall Pilot Green Roof** (1930 downtown historic high-rise) | Same city/code/typology; **58 psf added vs. 186 psf capacity → NO reinforcement**; re-coated existing membrane in place | Structural ✓ (the local analog) |
| **Chicago City Hall Green Roof** (1911 historic, NPS exemplar) | Best historic-retrofit hurdle log: **set-back/not-visible-from-ROW** (historic), **cantilever intensive zones over columns** (avoids slab reinforcement), retains **~75% of a 1" storm** | Structural ✓ Historic ✓ Stormwater ✓ |
| **NPS "Green Roofs on Historic Buildings" Standards** | The codified historic pathway AUDC will track: not visible from ROW, set back ≥1 bay/from edge, generally ≥4 stories, reversible, extensive-low-plants if parapet is short. **Silent on living walls → uncertain** | Historic ✓ (the rulebook) |
| *Supporting:* Ponce City Market (lightweight expanded-shale aggregate to dodge upgrades; federal HTC review) · Southface Eco Office (green roof + 6.4 kW PV + 1,750-gal cistern co-location) · Kendeda Bldg (new-build stormwater ceiling: 40% rooftop capture, 50,000-gal cistern) · Historic Fourth Ward Park (regulators accept green infrastructure as a *substitute* for gray — but dig-intensive, triggers 811) | | |

**The pattern that clears the gates:** extensive low-load green roof, verify residual capacity first, put any heavy zones over columns, keep plantings set back and out of street view in historic districts, and stay rooftop/structure-mounted to avoid the 811 dig gate.

---

## 3. The Executable Package (from Agent 3)

**A. Data Source Registry** — authoritative source per data need (full URLs in `Integration3` output):
- **Zoning/parcel/overlay/historic flag:** [COA Open Data Hub](https://dpcd-coaplangis.opendata.arcgis.com/) (ArcGIS Feature Services → GeoJSON/Shapefile/API) + [COA Property Info viewer](https://gis.atlantaga.gov/propinfo/) — *least portable; changes per city.*
- **Tree canopy:** [GA Tech Atlanta UTC](https://geospatial.gatech.edu/AtlantaUTC/) (2018 & 2023). **Protected-tree count = field arborist survey, not a download.**
- **Stormwater/impervious:** [Atlanta Watershed GIS](https://atlantawatershed.org/gis/) (partly request-based — no clean REST endpoint; confirm sf applicability threshold with DWM at parcel) + GSMM Vol. 2.
- **Flood:** [FEMA NFHL](https://www.fema.gov/flood-maps/national-flood-hazard-layer) (national, fully portable REST/WMS).
- **Utilities/easements:** [Georgia 811](https://georgia811.com/) + private SUE survey + Fulton County deed/plat.
- **Soils:** [USDA Web Soil Survey](https://www.nrcs.usda.gov/resources/data-and-reports/web-soil-survey) (national; low relevance for rooftop-only retrofit) + site borings if reaching grade.
- **Historic boundaries:** [COA Historic Preservation / AUDC](https://www.atlantaga.gov/government/departments/city-planning/historic-preservation) + NPS/National Register.

**B. Reviewer-Trusted Report Templates** (reusable across sites — only citations change per city):
1. Code-Compliance Matrix (the spine: requirement → citation → how we comply → evidence → reviewer → status)
2. Structural Load Memo (PE-stamped) — *the gate-retiring artifact*
3. Stormwater Concept Plan / GI Sizing Worksheet
4. Tree Recompense + Planting-Credit Worksheet
5. Historic Design Narrative (conditional, Fairlie-Poplar)
6. Zoning Conformance / Variance Narrative

**C. Handoff Workflow:**
- **Phase 0:** assemble data in parallel (parcel/zoning/historic flag determines if historic + zoning narratives are even needed).
- **Phase 1 (start immediately — longest pole):** Structural Load Memo. Passing it at extensive load unlocks everything downstream.
- **Phase 2 (parallel once load is retired):** stormwater, tree, historic, zoning, fire substantiation.
- **Phase 3:** roll all evidence into the Code-Compliance Matrix.
- **Agencies:** Office of Buildings (structural, zoning, cool-roof exemption, matrix) · Atlanta Fire Rescue (NFPA 285) · Dept. of Watershed Mgmt (stormwater) · City Arborist (tree) · AUDC (historic, *before* building permit) · Georgia 811 (only if digging).

---

## 4. Highest-Risk Gate & Earliest-Retiring Evidence

> **Added structural load** is the single highest-risk gate: binary, unavoidable for any rooftop augmentation, and it blocks nearly every downstream deliverable.
>
> **Retire it first, cheaply:** pull the building's original structural drawings from the Office of Buildings archive and have a GA-licensed PE produce the load-comparison table *before* any design spend. Constrain the concept to an **extensive system at 15–35 psf** to avoid reinforcement entirely. Cite **Atlanta City Hall** as the in-district analog. Where a heavier garden zone is wanted, **cantilever it over columns** (Chicago City Hall) rather than reinforcing the slab.

*(Note: Fire/NFPA 285 on living walls is the highest-*uncertainty* gate — no documented vegetation precedent — but it's avoidable by choosing rooftop/non-combustible systems. Structural load is not avoidable, hence it's the priority.)*

---

## 5. Moving Targets — Re-verify at Integration / Parcel Stage

- **ATL Zoning 2.0** (Unified Development Code) — public comment Dec 2025–Apr 2026, adoption ~spring/summer 2026; **open-space/landscape credit language not final.** Use legacy-code fallback until adopted.
- **Cool Roof Ordinance** — effective **June 2026** (the exemption hook depends on it).
- **Tree recompense inflation indexing** — begins **Jan 2027**.
- **Stormwater applicability sf threshold** — confirm with **Dept. of Watershed Management** once a parcel is chosen.

---

## 6. Open Flags & Recommended Next Steps

**Open flags carried through the chain:**
- **Fire/NFPA 285 for living walls / façade vegetation has NO documented precedent** — treat vine lattices on combustible-component façades >40 ft as requiring bespoke analysis; favor rooftop placement.
- **No Atlanta-local AUDC COA paper trail for a rooftop greening** was found — we have the *rules* (NPS) but not a local approval exemplar. Pull one at parcel stage if it exists.
- **Permit application→approval timelines are undocumented** across nearly all precedents — we cannot give the hackathon a reliable schedule estimate from precedent alone.
- **Ponce City Market exact load/soil-depth figures are undisclosed** (only "lightweight aggregate to avoid upgrades").

**Recommended next steps (when a parcel is picked):**
1. **Select a parcel** that showcases all three problems — ideally a Fairlie-Poplar mid-rise (≥4 stories, parapet to conceal plantings) to exercise the full gate set including AUDC.
2. Pull original structural drawings + run the **PE load-comparison memo (Template B.2)** — retire the top gate first.
3. Confirm **stormwater applicability** and **historic designation** with DWM and AUDC for that exact parcel.
4. Wire the **data registry endpoints** (Section 3A) into the retrofit engine so the 3D twin's numbers become data-driven (the prototype's current numbers are placeholders).

---

## Portability Note (scaling to another city)

- **Stays the same (national):** FEMA NFHL, USDA Web Soil Survey, the 811 one-call concept, NPS/National Register historic standards, NFPA 285, and all template *structures*.
- **Must be re-sourced (local):** zoning/parcel data (least portable), protected-tree ordinance + canopy study, state BMP/stormwater manual + local impervious layer, local historic-district boundaries + design-review body, and every code citation.

---

*Generated by the ArchitectureCodeResearchAgents chain. See the three `*.MD` agent prompts in this folder for the role definitions, and the per-agent reports for full sourcing.*
