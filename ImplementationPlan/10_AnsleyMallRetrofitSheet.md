# 10 — Ansley Mall Retrofit Sheet (manual pipeline run)

> **Run by hand from Google Earth inputs — no software model.** This is the worked example that validates Doc 04's selection logic on a real site and seeds the engine fixture.
> **⚠️ All numbers are ballpark/illustrative with stated assumptions.** Items needing real data are flagged **[GAP]**. Do not quote on a slide until the [GAP]s close.

## Inputs (from Google Earth, 2026-06-16)
| Field | Value | Source |
|---|---|---|
| Location | **33.7983, −84.3711** (33°47'54"N 84°22'16"W) | cursor on building |
| Roof area (footprint) | **215,634 ft² (20,033 m²)** | traced polygon |
| Roof long-axis heading | **145°** (NW–SE) | measured line |
| Stories | single-story | imagery |
| Roof color | light/gray membrane (confirm SRI/age) | imagery [GAP] |
| Parking lot area | **not measured** [GAP] | — |
| Site context | big parking field N/E; **BeltLine corridor on W edge**; tree cover around perimeter | imagery |

## Assumptions (stated so they can be challenged)
- Usable roof for PV ≈ **65%** of footprint (perimeter fire setbacks + HVAC + walkways) → ~140,000 ft² / ~13,000 m².
- Flat-roof PV effective density ≈ **11 W/ft²** (ballasted tilt racks); cross-checked vs. 0.15 kW/m² × 0.7 packing.
- Atlanta specific yield ≈ **1,400 kWh/kWp/yr**; grid factor **0.3837 kg CO₂/kWh** (eGRID SRSO); retail offset **$0.115/kWh**; PV **$1.75/W**; green roof **$20/ft²**; rainfall **~50 in/yr**; green-roof retention **~60%**; **30% ITC**.
- Parking field ≈ **6 acres** (site ~16 ac − ~5 ac building), ~50% canopy-coverable. **[GAP — measure it]**

---

## 1. Surfaces
| ID | Surface | Area | Key attributes |
|---|---|---|---|
| S1 | **Roof** | 215,634 ft² | flat, single-story, light membrane, low structural headroom (1964 bar-joist) |
| S2 | **Parking lot** | ~6 ac est. [GAP] | impervious asphalt, ~600–700 spaces est. [GAP] |
| S3 | **Perimeter / BeltLine edge** | linear, W side | pedestrian, BeltLine adjacency |

## 2. Eligibility matrix (qualify / disqualify + why)
| Intervention | S1 Roof | S2 Lot | S3 Edge | Why |
|---|:--:|:--:|:--:|---|
| **Rooftop solar PV** | ✅ | — | — | flat, huge area, ~3–5 psf clears structural |
| **Solar canopy** | — | ✅ | — | shades cars + generates; the real home for "shade" |
| **Extensive green roof** | ⚠️ | — | — | **load-gated** — needs PE memo on 1964 deck |
| **Cool roof** | ✅ | — | — | baseline re-roof obligation; green/solar exempt |
| **Rainwater cistern** | ✅ | ✅ | — | captures roof runoff at grade |
| **Permeable paving / bioswales** | — | ✅ | — | lot stormwater |
| **Rooftop agriculture** | ⚠️ | — | — | access + load constrained |
| **Shade lattice** | ❌ | ~ | ✅ | pointless on roof; canopy covers the lot; fits BeltLine edge |
| **Pollinator / native landscaping** | — | ✅ | ✅ | tree islands + BeltLine edge |
| **Lot tree canopy** | — | ✅ | — | satisfies Tree Ord. 1/8 spaces |
| **EV charging** | — | ✅ | — | pairs with canopy |

## 3. Sizing (ballpark)
**Rooftop solar (S1):**
- ~140,000 ft² usable × 11 W/ft² ≈ **~1.5 MW DC**
- × 1,400 kWh/kWp ≈ **~2.1M kWh/yr** → **~806 t CO₂/yr** → **~$242k/yr** (retail offset)
- Capex ~$2.63M → **~$1.84M after 30% ITC** → **payback ~7.6 yr** (longer if export-limited)

**Parking-lot solar canopy (S2) [GAP — depends on lot measure]:**
- ~130,000 ft² coverable × 11 W/ft² ≈ **~1.4 MW DC** → ~2.0M kWh/yr → ~752 t CO₂/yr
- Higher capex (~$2.5–3.5/W for canopy steel); bonus: car shade + EV + stormwater routing

**Green roof (S1, if ~60% of roof, structurally cleared):**
- ~129,000 ft² → **~2.4M gal/yr** retained; **~52k gal per 1" storm** (first-inch compliance)
- Capex ~$2.6M; sequestration minor (~5 t CO₂/yr)
- **Conflict:** competes with rooftop PV for the same roof → split the roof or biosolar a portion

**Combined solar (roof + canopy): ~2.9–3.0 MW DC → ~4.1M kWh/yr → ~1,550 t CO₂/yr → ~$470k/yr.**

## 4. Codes to compare against (gate vs. carrot, this site)
| Code | What it requires | Gate/Carrot | Our angle |
|---|---|---|---|
| **Cool Roof Ord. 25-O-1310** | re-roof → cool roof; **green roof & solar EXEMPT** | Gate→Carrot | the killer hook — our interventions satisfy/exempt a mandatory obligation |
| **Stormwater Ch.74 Art.X** | capture first **1.0"** on-site via GI | Gate+Carrot | big roof+lot = big obligation; green roof + bioswales over-comply |
| **Tree Protection Ch.158 §158-30** | parking 30+ → **≥1 tree/8 spaces** | Gate (on resurface) | ~75–88 trees on a ~600–700 space lot [GAP]; recompense-avoidance carrot |
| **Structural load** | extensive green roof 15–35 psf | **Gate** (green roof) | PE load-comparison memo; PV clears trivially (~3–5 psf) |
| **GA Power interconnection** | export ≈ 6–7¢ < retail 11.5¢ | Constraint | size solar to **self-consume**, not export |
| **NFPA / fire setbacks** | rooftop PV pathways + perimeter clearance | Constraint | already in the 65% usable assumption |
| **Zoning / BeltLine Overlay + parking min.** | canopies vs. parking-count minimums; overlay design | Check | confirm at parcel stage |

## 5. Hero set (recommendation)
1. **Parking-lot solar canopies (~1.4 MW)** — signature move; shade + power + EV; the visual a downtown tower *cannot* tell.
2. **Rooftop PV (~1.5 MW)** — easy structural win; biggest single CO₂ chunk.
3. **Stormwater package** — green-roof showcase portion (structurally cleared) + lot bioswales/permeable + cistern → satisfies first-inch + cool-roof exemption.
- *Garnish (Side-B / equity story):* BeltLine-edge pollinator landscaping + lot trees (satisfies tree ordinance).

## 6. Remaining data gaps (to close before quoting)
1. **Parking-lot area + space count** — canopy sizing + tree ordinance. *(measure in Earth)*
2. **Structural drawings / roof load capacity** — the green-roof gate. *(Selig / Office of Buildings archive)*
3. **CBEEO ENERGY STAR "before" score** — the baseline rating. *(CBEEO row)*
4. **Roof membrane age/SRI** — is the cool-roof obligation already partly met? *(Street View / records)*
5. **Confirm Selig wholly-owns the parcel** — single-owner story. *(Fulton qPublic)*

---

## 7. Google Solar API cross-check (Design_3_Financial_Model.xlsx, 2026-06-16)
Google Earth's own Solar Study independently modeled the roof — validates our hand estimate.

| Metric | Our hand est. (roof) | **Google** | Adopt |
|---|---|---|---|
| Capacity | ~1.5 MW | **1.84 MW** | Google (geometry-based) |
| Generation | ~2.1M kWh | **2.38M kWh** | Google |
| CO₂ | ~806 t/yr | **~913 t/yr** | scales w/ gen |
| $/W | $1.75 | **$0.857** ⚠️ low | present as range |
| $/kWh | $0.115 | **$0.187** ⚠️ high | present as range |

**Key findings:** (1) capacity/generation match → method validated; (2) Google put **0 W on parking** — the lot solar canopy (~1.4 MW) is *our* value-add; (3) building uses **13.4 GWh/yr** vs. ~2.38 GWh generated → solar is **~18% of load, 100% self-consumed** (no export haircut); (4) payback is highly sensitive to $/W + $/kWh → present a **2.5–8 yr band**. Numbers folded into `src/data/buildings/ansley-mall.json`.
