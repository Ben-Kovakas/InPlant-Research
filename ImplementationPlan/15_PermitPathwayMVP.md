# 15 — Permit Pathway MVP Requirements

> **Source of truth:** *DCP Permitting Services Guide* (City of Atlanta Dept. of City Planning, Aug 2023). Every application type, office, phase, and sequence in this MVP traces to that document. Where the guide is silent (intervention→application mapping), we infer and tag confidence.
> **Thesis (carried from [[core-thesis]]):** help a company turn a sustainability idea into a *city-ready proposal*. The proposal is only credible if it answers **"what do I actually have to file, with whom, in what order?"** — that is the permit pathway. This MVP makes the existing twin answer that question.
> **Date:** 2026-06-16 · **Status:** Phase-1 slice shipped (fixture + digest section); requirements below define the full MVP.

---

## 0. What the DCP guide gives us (the deterministic core)

The guide reduces Atlanta development to a clean machine:

- **3 offices** — Zoning & Development (OZD), Design (OOD), Buildings (OOB).
- **3 phases** — Entitlement (conditional) → Permitting → Inspection → CO.
- **A controlled application vocabulary** (pp. 68–75): Commercial (Solar PV, Alteration, Addition, Conversion, Demolition, Express, Land Development), Commercial Trade (General Electric, HVAC, Plumbing, Low Voltage, EV…), Fire & Life Safety, Arborist, Planning (SAP/Subdivision/BZA/ZRB), etc.
- **One portal** — Accela ACA (`aca-prod.accela.com/ATLANTA_GA`).

**Key insight that defines the product:** mapping a retrofit *scope* → DCP *application set* is **deterministic** and doable today. The only non-deterministic input is **parcel zoning** (classification, overlay, historic status, NPU) — a single GIS lookup. So the MVP is a rules engine over the DCP vocabulary, plus one flagged data-pull step.

See [[ansley-codes]] / `11_Ansley_Codes.md` for the gate/carrot code layer this complements — codes say *what standard you must meet*; the permit pathway says *which application carries it*.

---

## 1. MVP definition

**Permit Pathway Generator** — given a building + a set of selected interventions (the twin's existing layer toggles), output:

1. The **required DCP applications** (type, lead office, what triggers it, confidence).
2. The **filing sequence / critical path** (long-poles called out).
3. The **parcel data still needed** before filing (the zoning branch).
4. Surfaced in the existing **City-Ready Proposal** slide-over as section "04 Permit pathway," and exportable with the rest of the proposal.

This is **Side-A** (owner: "here's your RFP / filing checklist") and feeds **Side-B** (city: "here's a permittable, code-clearing project").

---

## 2. Functional requirements

| # | Requirement | Priority | DCP basis |
|---|---|---|---|
| F1 | Map each active intervention → its DCP application type(s) | **must** | App. Type Overview pp.68–75 |
| F2 | Tag each application: `required` / `likely` / `conditional` + confidence | **must** | inferred |
| F3 | Show lead office + trigger + note per application | **must** | Who Regulates p.6 |
| F4 | List the parcel data pull needed (zoning/overlay/historic/NPU/ROW) | **must** | Know Your Zone pp.8–17 |
| F5 | Render an ordered critical path with the two long-poles (GA Power study, PE load memo) | **should** | Permitting sequence (doc 11) |
| F6 | Drive the application set from the **live layer toggles** (turn off canopies → SAP + LDP downgrade) | **should** | twin already has toggles |
| F7 | Include in the printable/export proposal | **could** | proposal digest exists |
| F8 | Express-permit exclusion logic (>25 kW / structural ⇒ not Express) | **could** | Express Permits p.44 |

**Out of scope for MVP:** live Accela submission/API; real-time GIS zoning fetch; multi-building portfolio pathway; fee calculation. (All are post-MVP; the data shape leaves room.)

---

## 3. Data model

`permitPathway` block on each building fixture (shipped for Ansley in `ansley-mall.json`):

```jsonc
"permitPathway": {
  "portal": "Accela ACA · …",
  "leadOffice": "Office of Buildings (OOB)",
  "phases": ["Entitlement (conditional)", "Permitting", "Inspection → CO"],
  "applications": [
    { "key","type","office","trigger","status","confidence","note?","dcpRef" }
  ],
  "needsDataPull": [ { "item","why","source" } ],
  "criticalPath": [ "…ordered steps…" ]
}
```

**Generalization:** `applications` should ultimately be *derived* by a rules table (intervention → application) rather than hand-authored per building — see F6 / §5. The hand-authored Ansley block is the Phase-1 fixture that proves the shape.

---

## 4. The rule mapping (intervention → DCP application)

The deterministic core. This is the table the engine encodes:

| Intervention (twin layer) | DCP application(s) | Office | Status logic |
|---|---|---|---|
| Rooftop PV | Commercial · Solar PV; Commercial Trade · Electrical | OOB | `required` if >25 kW (else Express) |
| Lot solar canopy | Commercial · Solar PV + Land Development (footings); **SAP** if BeltLine/overlay | OOB (+OZD) | `required`; SAP `likely` on BL |
| Green roof | Commercial · Alteration / Re-roof | OOB | `required`; **PE load memo** gates |
| Cool roof (membrane) | Commercial · Re-roof | OOB | `required` on full re-roof |
| Stormwater (bioswale/permeable/cistern) | Land Development; DWM concept; Trade · Plumbing (backflow) | OOB + DWM | `required` |
| Lot trees / landscape | Arborist · Tree & Landscape Plan | OOB Arborist | `required` if 30+ space lot resurfaced |
| EV charging | Commercial Trade · EV connections | OOB | `required` if in scope |
| Any assembly tenant / PV fire pathways | Fire & Life Safety | AFRD + OOB | `required` |

**Always-on cross-cutting:** Accela submission; adopted codes (IBC '18 / IECC '15 / NEC '20 / NFPA / ADA); Inspection → CO.

**Zoning-branch (needs GIS pull):** Rezoning / ZRB / CRC (use change), BZA Variance (parking/setbacks), OOD Historic review, NPU routing, ATLDOT ROW.

---

## 5. Build phases

- **Phase 1 — shipped.** `permitPathway` fixture + "04 Permit pathway" section in the slide-over (status badges, offices, triggers, DCP refs, data-pull list). Static per-building.
- **Phase 2 — rules engine.** Move §4 into `engine/permits.js`: `derivePermitPathway(building, activeInterventions)` returns the `applications[]`. Wire to the live layer toggles (F6) so the pathway reorders as the user toggles scope — mirrors the existing `store`/toggle pattern in [[prototype-implementation-plan]] (`01_PrototypeImplementationPlan.md`).
- **Phase 3 — proposal export + zoning stub.** Include pathway in the printable proposal (F7); add a zoning-lookup stub keyed to `gis.atlantaga.gov/propinfo` that flips `needsDataPull` items to resolved when a classification is entered.

---

## 6. Acceptance criteria

1. Opening **City-Ready Proposal** shows section 04 with all 8 Ansley applications, each with office + trigger + status badge + DCP page ref. ✅ (Phase 1)
2. The 6 parcel-data-pull items render with source links. ✅ (Phase 1)
3. `vite build` passes; JSON valid. ✅
4. *(Phase 2)* Toggling the **Lot Canopy** layer off removes the SAP + LDP-canopy applications from the pathway.
5. *(Phase 3)* Entering a zoning classification resolves the zoning-branch data-pull items and reveals any Rezoning/Variance need.

---

## 7. Honesty / provenance

Every application cites a DCP page. Inferred items (intervention→application, SAP-on-BeltLine) are tagged `likely`/`medium`, not asserted as fact. The zoning branch is explicitly *unresolved pending GIS* — we show the question, not a guess. This is the same provenance discipline as the metric fixture (`google`/`measured`/`research`/`gap` tags).
