# 04 — Selection Logic (basic): how interventions get picked & placed

> **Purpose:** the defensible, demo-scale logic for deciding *what intervention goes on what surface* — so placements are informed by measured attributes + documented gates, not eyeballed. Maps directly to the team's 4-step demo flow.
> **Principle:** **don't pick interventions, qualify surfaces.** Decompose a building into candidate surfaces → gate each surface for eligibility → rank the survivors by impact/ROI → place geometry sized from the numbers.

---

## The pipeline (surface → gate → rank → sized geometry)

```
Building
  └─ decompose ─▶ CandidateSurface[]  (roof, S/W facades, N facade, perimeter/edge)
                    each with: orientation, areaM2, slope/tilt, imperviousPct,
                               sunExposure, addedLoadCapacityPsf
                       │
            ┌──────────▼───────────┐
            │ 1. ELIGIBILITY GATE   │  precondition pass/fail per intervention
            │    (binary, physical) │  → populates surface.allowedInterventions[]
            └──────────┬───────────┘
                       │ survivors only
            ┌──────────▼───────────┐
            │ 2. RANK               │  engine composite (impact + ROI + feasibility)
            └──────────┬───────────┘
                       │ best-per-surface (+ retain runner-up for trade-off)
            ┌──────────▼───────────┐
            │ 3. SIZED GEOMETRY     │  mesh sized FROM engine numbers (not vice-versa)
            └───────────────────────┘
```

**Gate before rank, never rank-then-check.** A surface can score huge on impact and still be ineligible (sloped roof, no structural headroom). Eligibility is binary and comes first.

---

## The eligibility gates (the heart of "informed")

Each cell of a surface × intervention **suitability matrix** is decided by a precondition tied to a *measured surface attribute*. Demo-scale: fill this matrix by hand for the chosen building(s).

| Intervention | Eligible when… | Disqualified when… | Decided by attribute | Anchor / source |
|---|---|---|---|---|
| **Solar PV** | faces S/SW/W, low shading, usable area; roof or sun-facing facade | N-facing, shaded, tiny | `orientation.azimuth`, `sunExposure`, `usableAreaM2` | PVWatts `ac_annual`; orientation |
| **Green roof (extensive)** | **flat/low-slope roof** + structural headroom for 15–35 psf | sloped, no load capacity, facade | `slope/tilt`, `addedLoadCapacityPsf` | **structural gate** (ExecutiveSummary §1/§4); Atlanta City Hall precedent |
| **Agriculture (shade-crop canopy)** | flat roof w/ access; livability/story rationale | no access, no area | `type==roof`, `areaM2`, access | secondary; narrative weight |
| **Shade lattice / trellis** | perimeter/plaza edge, walls **<40 ft**, pedestrian zone | combustible facade >40 ft, no ground edge | `type==perimeter/facade`, height | NFPA-285 fire gate (ExecutiveSummary) |

> Every "eligible" must trace to: a measured attribute meeting a documented precondition. If it can't, drop it.

**The one conflict to resolve:** solar vs. green roof competing for the *same flat roof*. Keep the higher composite as the recommended package, **retain the runner-up** so the UI shows the trade-off (`recommend.js`, Doc 01 §3.9).

---

## Credibility checks (cheap, high-value)

- **Attach a precedent to every surviving cell.** Green roof on a downtown high-rise → Atlanta/Chicago City Hall; green roof + PV + cistern co-located → Southface Eco Office; lightweight media to dodge structural upgrades → Ponce City Market. No precedent ⇒ shaky ⇒ flag or drop.
- **Geometry follows the numbers.** Panel count = `usableAreaM2 × packing ÷ panel_area`; canopy footprint = computed shade area; green-roof extent = the area feeding the gallons figure. Visual and readouts must agree.

---

## How this maps to the team's demo flow

| Demo step | Selection-logic stage | Note |
|---|---|---|
| **1. Find a single-owner building set** (one entity, not 3 owners) | input selection | clean portfolio narrative; feeds the two-sided ledger (one company → city) |
| **2. Pull dimensions / building data / current sustainability** (likely low) | surface decomposition + attributes + baseline | low ENERGY STAR = strong "before"; attributes populate `CandidateSurface` |
| **3. Compare against gates/thresholds → what it qualifies for** | **eligibility gate** (matrix above) | simple at demo scale: 1 (maybe 2) structures per intervention category |
| **4. Build models, fill report details** | rank → sized geometry → report | 📌 **PIN:** step 4 also yields data explicitly useful for the **Mayor's Office / Side-B** report — captured separately (see 07) and slotted into the report later |

📌 **Pinned for implementation:** the Mayor's-Office-side data (city goal contribution, district context, equity overlay) is gathered in step 4 but lives in the **Side-B contribution report**, not the owner-facing gate logic. Don't let it complicate the eligibility pass; treat it as report enrichment.

---

## What this is NOT (demo honesty)

This is **not an optimizer** over hundreds of buildings — at demo scale it's a transparent, hand-run decision table for one (maybe two) structures per category. The *method* generalizes (same gates, run programmatically over a CBEEO portfolio later); the *demo* runs it by hand and stays fully defensible.
