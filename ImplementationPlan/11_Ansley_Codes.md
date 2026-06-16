# Codes & Compliance — Ansley Mall Green Retrofit

**Building:** Ansley Mall · 1544 Piedmont Ave NE, Atlanta, GA 30324
**Owner:** Selig Enterprises (private) · **Built:** 1964, single-story open-air retail
**Roof:** ~215,634 ft² (20,033 m²) flat, light low-slope membrane, steel bar-joist + metal deck
**Site:** ~16 acres · large surface parking lot (~650 spaces est.) · BeltLine Northeast Trail on the west edge
**Proposed scope:** rooftop solar PV (~1.84 MW), parking-lot solar canopies (~1.4 MW), partial extensive green roof (~60% of roof, gated), lot stormwater (bioswales / permeable / cistern)

> **How to read this:** every rule below is tagged **GATE** (hard pass/fail — no permit until cleared) or **CARROT** (a benefit/credit the design can claim). Several are both: a mandatory obligation that our interventions turn into an advantage. Numbers are kept consistent with the project fixture (`src/data/buildings/ansley-mall.json`). Items I could not independently re-confirm in June 2026 web sources are flagged **[verify]**.

---

## The one-paragraph version

Ansley Mall is unusually *permitable* for a retrofit this size. The signature moves — rooftop PV and parking-lot solar canopies — add only **~3–5 psf** to the roof and sit on independent steel over the lot, so they clear the single hardest gate (added structural load) without an engineering fight. Atlanta's **Cool Roof Ordinance** is the hook, not the hurdle: when Selig re-roofs this 1964 membrane, cool-roof compliance is triggered, and **green-roof and solar-covered area is exempt** — our interventions *are* a compliant path for an obligation the owner faces anyway. The green roof is the only element that genuinely depends on a gate (the bar-joist deck), and it is scoped as a partial, structurally-cleared showcase rather than a whole-roof bet. Everything else is "design-it-right" detailing, not pass/fail risk.

---

## Code-by-code matrix

| # | Code / Ordinance | What it requires | Gate / Carrot | How Ansley clears or leverages it | Reviewing agency |
|---|---|---|---|---|---|
| 1 | **Cool Roof Ordinance 25-O-1310** | On new construction **and full roof replacement**, low-slope roofs must hit **3-yr-aged solar reflectance ≥ 0.70 / SRI ≥ 85** (steep-slope: refl. ≥ 0.21 / SRI ≥ 20). **Vegetated (green) roof area and solar-covered area are exempt**; small sections and simple repairs (not full replacement) are exempt. Effective **June 2026**. | **GATE → CARROT** | Re-roofing this 1964 membrane will trigger the obligation. Rooftop PV and the partial green roof create **exempt area**; the remaining membrane is specified as a high-SRI cool roof (the baseline floor). The retrofit converts a mandatory cost into a compliant upgrade. | City of Atlanta **Office of Buildings** (permit + roofing compliance) |
| 2 | **Stormwater — City Code Ch. 74, Art. X** | Capture/retain the **first 1.0″** of runoff **on-site** via green infrastructure; sizing per Georgia Stormwater Mgmt Manual (GSMM) Vol. 2, runoff coefficient Rv = 0.05 + 0.009 × %impervious. | **GATE** (on qualifying work) **+ CARROT** (highest-status local environmental metric) | A ~100% impervious roof + lot sheds heavily. Partial green roof retains **~52,000 gal per 1″ storm** on the planted area and **~2.4M gal/yr**; lot bioswales, permeable stalls, and a cistern size the rest of the first inch. The design over-complies, which is the headline city-contribution number. **Applicability sf threshold to confirm with DWM at design.** | **Dept. of Watershed Management (DWM)** |
| 3 | **Tree Protection — Ch. 158, §158-30** | Surface lots built/resurfaced with **≥ 30 spaces** must submit a landscape plan to the City Arborist: **≥ 1 tree per 8 parking spaces**, interior islands, **landscaped area ≥ 10% of paved area**, and **no stall > 45 ft from a tree trunk**. Recompense **$140/DBH-inch** (eff. Jan 2026); 1.25× caliper planting credit. | **GATE** (on resurface) **+ CARROT** (recompense avoidance + planting credit) | A ~650-space lot needs **~80 lot trees** to comply (650 ÷ 8 ≈ 81). Because the retrofit is *additive* — new tree islands, bioswale plantings, BeltLine-edge landscaping — it **earns planting credit rather than owing recompense**, and the canopy work doubles as heat-island mitigation. Solar canopies are detailed to coexist with the 45-ft tree-proximity rule. | City of Atlanta **City Arborist** (Office of Buildings / Planning) |
| 4 | **Structural load** (2024 IBC + GA amendments) | Any added roof dead load must be justified against original design capacity; extensive green roof ≈ **15–35 psf** saturated (media ≈ 7 psf/inch). Requires a **GA-licensed PE load-comparison memo** vs. the original drawings. | **GATE** (decisive — green roof only) | **PV clears trivially at ~3–5 psf** (ballasted low-tilt racks) — no reinforcement, this is why solar leads the roof. The **green roof is the gated element** on the 1964 bar-joist deck and must be analyzed joist-by-joist on a partial footprint. Precedent: **Atlanta City Hall** green roof added 58 psf against 186 psf capacity → *no reinforcement* on a 1930 building. Pull original drawings from the Office of Buildings archive first. | City of Atlanta **Office of Buildings** (structural plan review) |
| 5 | **Georgia Power interconnection / net metering** | COA building + electrical permits, plus utility interconnection. Excess **exported** energy is credited at the **Solar Avoided Energy Cost rate (~3.2¢/kWh, 2026) + 4¢ ≈ ~7¢/kWh** — well below the **~11.5¢ retail** offset. Systems above ~100 kW typically require an **interconnection study**. | **GATE** (interconnection) **+ economic constraint** | **Self-consumption, not export, is the design rule.** Ansley uses **~13.4 GWh/yr**; combined solar generates **~4.34 GWh/yr ≈ 32% of load → 100% self-consumed (no export haircut).** Publix / LA Fitness / CVS create large daytime load that absorbs generation at retail value. Expect an interconnection study for the MW-scale arrays; phasing / behind-multiple-meters design may apply. **Confirm current RNR tariff + GA PSC rules at design.** | **Georgia Power** (interconnection) + COA Office of Buildings (electrical permit) |
| 6 | **Fire / NFPA — PV access & setbacks** | 2024 IFC: maintained fire-department roof-access pathways, PV array setbacks at ridges/edges, and **rapid-shutdown**. Combustible façade components > 40 ft may trigger **NFPA 285**. | **GATE** (manageable with standard detailing) | Rooftop PV is laid out with code access/setback pathways — **already baked into the ~65% usable-roof assumption.** Lot canopies are open structures with standard PV fire detailing. Any BeltLine-edge shade lattice is kept **< 40 ft and non-combustible** to avoid NFPA 285. No exotic analysis required. | **Atlanta Fire Rescue** (life-safety) + Office of Buildings |
| 7 | **Zoning / parking minimums + BeltLine Overlay** | Solar canopies occupy parking; parking-count minimums must still be met. The **BeltLine Overlay (§16-36.019)** sets corridor-specific landscaping/design standards that may **exceed** Ch. 158 on the west edge. ATL **Zoning 2.0 / Unified Development Code** rewrite is mid-adoption (public comment Dec 2025–Apr 2026, adoption ~2026) and may add **open-space/landscape credit**. | **GATE** (verify) **+ possible CARROT** | Canopies **do not remove stalls** (cars park beneath), so parking-minimum risk is low — confirm post locations/clearances keep stalls compliant. Check the BeltLine Overlay landscaping minimums against the tree plan (overlay likely governs the west edge). Treat Zoning 2.0 credit as upside only; **use legacy-code fallback until adopted.** | City of Atlanta **Office of Zoning & Development** (+ BeltLine/Planning review) |

---

## Permitting sequence (which agency, in what order)

1. **Pre-application data pull** — original structural drawings (Office of Buildings archive) + CBEEO/ENERGY STAR baseline. *Do this first; it gates the green roof.*
2. **Structural load memo (GA-licensed PE)** — retire the highest-risk gate at extensive load before design spend. → **Office of Buildings** (structural).
3. **Zoning / BeltLine Overlay conformance** — confirm canopy posts vs. parking minimums and overlay landscaping. → **Office of Zoning & Development** (+ BeltLine/Planning).
4. **Stormwater concept + GI sizing (first-inch)** — green roof + lot bioswales/permeable. → **Dept. of Watershed Management**.
5. **Tree / landscape plan** — ~80 lot trees, islands, 10% landscaped area, credit accounting. → **City Arborist**.
6. **Georgia Power interconnection application + study** — run in parallel with the building/electrical permit; size to self-consume. → **Georgia Power**.
7. **Building + electrical + roofing permits** (PV, canopies, cool-roof/green-roof compliance, PV fire pathways) — the consolidated submittal. → **Office of Buildings** + **Atlanta Fire Rescue** life-safety sign-off.
8. **Inspections → final / CO.**

*Critical path:* the **PE structural memo** (green roof) and the **Georgia Power interconnection study** (MW solar) are the two long poles; everything else is parallelizable once load is retired.

---

## Permitability confidence

**HIGH for the solar-led hero set; MEDIUM-conditional for the green roof.** Rooftop PV and lot canopies face no pass/fail gate they don't clear by design (load ~3–5 psf; self-consumed energy; standard fire detailing) — the binding constraints are economic and procedural, not permit-blocking. The green roof is the only element whose approval is contingent on a gate (the 1964 bar-joist deck), and it is scoped partial and PE-verified specifically to de-risk that. The Cool Roof Ordinance, far from being an obstacle, makes the whole package the *compliant* path for a re-roof obligation Selig already owns.

**Open items to confirm at design (do not quote as final):** [verify] exact cool-roof exemption coverage language/section in the 25-O-1310 text (green/solar exemption is per the ordinance as reported by Columbia Climate Law Blog & Smart Surfaces Coalition, not re-confirmed verbatim here); [verify] DWM stormwater applicability sf threshold for this parcel; [verify] current Georgia Power RNR tariff export rate and the >100 kW study trigger; [verify] BeltLine Overlay landscaping minimums vs. Ch. 158; ATL Zoning 2.0 credit language is **not final** — legacy fallback only.

---

### Sources (June 2026 verification)
- Cool Roof Ordinance 25-O-1310: [Columbia Climate Law Blog](https://blogs.law.columbia.edu/climatechange/2025/06/27/atlantas-new-ordinance-raises-the-bar-on-cool-roofs/) · [Smart Surfaces Coalition](https://smartsurfacescoalition.org/atlanta-press-release) · [Smart Surfaces Policy Tracker](https://smartsurfacespolicy.org/policies/atlanta-cool-roof-ordinance/) · [Sheffield Metals](https://sheffieldmetals.com/learning-center/new-2025-atlanta-cool-roof-city-ordinance/)
- Tree Protection Ch. 158 §158-30: [Atlanta eLaws §158-30](http://atlanta.elaws.us/code/coor_ptii_ch158_artii_div1_sec158-30) · [Municode Ch. 158](https://library.municode.com/ga/atlanta/codes/code_of_ordinances/177780?nodeId=PTIICOORENOR_CH158VE) · [Smart Surfaces — Atlanta Parking Lot Requirements](https://smartsurfacespolicy.org/policies/atlanta-parking-lot-requirements/)
- Georgia Power interconnection / net metering: [GA Power commercial rooftop — how it works](https://www.georgiapower.com/business/products-programs/business-solutions/commercial-solar-solutions/commercial-rooftop-installations/how-it-works.html) · [RNR-11 tariff](https://www.georgiapower.com/content/dam/georgia-power/pdfs/business-pdfs/tariffs/2023/RNR-11.pdf)
- Stormwater / structural / zoning: City Code Ch. 74 Art. X (DWM) · 2024 IBC + GA amendments · BeltLine Overlay §16-36.019 · ATL Zoning 2.0 (in adoption)
