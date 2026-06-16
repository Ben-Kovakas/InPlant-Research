# 08 — Ansley Mall Deep Dive (single-building dossier)

## In-Planted / Climate Resilient ATL · Is this ONE site worth it as the demo?

> **Target:** Ansley Mall, **1544 Piedmont Ave NE, Atlanta, GA 30324** (Piedmont Heights, at Piedmont Ave × Monroe Dr).
> **Owner:** Selig Enterprises (privately held, family-owned Atlanta CRE, est. 1918). **Wholly Selig-owned since Dec 1972.**
> **Date:** 2026-06-16 · **Author:** deep-dive research.
> **Grounding:** 05_SingleOwnerPortfolio, 04_SelectionLogic, FINAL §5/§7, ExecutiveSummary, 02_DataAcquisitionPlan.
> **Verification posture:** facts cited inline from web research (June 2026). Numbers I had to *assume* (roof usable fraction, parking area split, space count) are tagged **[ASSUMED]**; items needing a real source pull are tagged **[CONFIRM]**. Sizing is order-of-magnitude, defensible-for-pitch, NOT engineering.

---

## TL;DR verdict

**Yes — Ansley Mall is a compelling single-site demo, and arguably stronger than a downtown tower.** It is the textbook geometry our intervention set was built for: a **~175k sqft single-story flat roof** *plus* a **~12–16 acre site with a very large surface parking lot**, owned 100% by **one nameable private company** (clean incentive story), built **1964** (textbook low "before"), and **physically touching the BeltLine Northeast Trail via a brand-new pedestrian bridge** (direct city-resilience / green-corridor narrative). Two surfaces, two heroes.

**Hero set (do these three):**
1. **Solar carport canopies over the parking lot** — the single biggest move. ~1.5–2.5 MW DC possible; shades cars (heat-island), generates the headline MWh, *and* the lot is where "shade" actually belongs (not the roof).
2. **Rooftop solar PV on the flat roof** — ~1.4 MW DC on a 175k sqft roof; no structural drama, no green-roof load gate.
3. **Stormwater capture (green roof + bioswales/permeable in the lot)** — a ~700k sqft impervious site sheds enormous runoff; first-inch capture is the highest-status local environmental metric and the BeltLine edge gives the story a face.

**Headline ballpark (assumptions stated in §3):** combined solar **~3 MW DC → ~4.3M kWh/yr**, offsetting **~1,650 metric tons CO₂/yr**, ~**$495k/yr** in energy value; an extensive green roof on ~60% of the roof captures **~2.5–3.0M gal/yr**. Combined solar capex ~**$7–8M**, roughly **~$5M after 30% ITC**, simple payback **~10 yr** (canopy-heavy) to **~7–8 yr** (roof-PV-heavy). It is a real, ownable, "here's your RFP" demo.

**Top data gaps:** exact **roof polygon area**, **parking space count / lot area**, **original structural drawings** (green-roof load gate), the **CBEEO ENERGY STAR row** (the actual "before" score), and **impervious %**.

---

## 1. Ansley Mall — the facts

| Attribute | Value | Source / confidence |
|---|---|---|
| Address | 1544 Piedmont Ave NE, Atlanta, GA 30324 | confirmed |
| Neighborhood | **Piedmont Heights** (NOT Midtown proper; some brokers loosely say "Midtown") | Wikipedia; listing |
| Type | Open-air community shopping center, **single-story** | confirmed |
| GLA / property size | **~174,780–175,300 sqft** leasable (single level). One older history source cites ~201,400 sqft GLA at an earlier configuration — treat **~175k** as current. | CommercialSearch (174,780 SF); mall-history sources |
| Site size | **~16 acres** (open-air mall property; the BeltLine bridge connects "the 16-acre property") | Urbanize / Atlanta Jewish Times |
| Year opened | **1964** (grand opening event April 1966; planning began Jan 1963). Pre-energy-code. | mall-history; Wikipedia |
| Developer / architect (orig.) | Adams-Cates Co.; designed by Mastin Associates (Marietta) | mall-history blog |
| Ownership | **Wholly Selig Enterprises**, acquired **Dec 1972** | Wikipedia; Selig |
| Last renovation | **2010** (Earthstation); plus current BeltLine-facing restaurant-row additions | Wikipedia; WhatNow Atlanta |
| Anchor / tenants | **Publix, CVS, LA Fitness**, The Cook's Warehouse, Ansley Wine Merchants, Phidippides, Brooklyn Bagel, Bantam+Biddy, Vinny's NY Pizza, Intaglia Home | search; flyer |
| BeltLine adjacency | **Direct.** Selig built a **~105-ft pedestrian/bike bridge** from the BeltLine **Northeast Trail** onto the property (announced ~2021–22, structure built 2023–24, "ecologically-sound / avoids environmental impact"). A rooftop-smokehouse restaurant (Lewis BBQ) is part of the BeltLine-facing reinvestment. | Urbanize Atlanta |

**Structure type & what it means for green-roof load (the gate):** No drawings pulled yet, but a **1964 single-story retail box** of this era is almost certainly **open-web steel bar joists + metal deck** (with rigid insulation over ribbed metal, or lightweight concrete over deck). That matters: such roofs were designed for modest live loads (~20 psf snow/maintenance is typical), so an **extensive green roof at 15–35 psf saturated is plausible but NOT free — it is exactly the load gate** that a GA-licensed PE must clear with a load-comparison memo against the original drawings. Bar-joist systems *often* accept a retrofit positive load but **must be analyzed member-by-member** (tributary load on each joist). **Implication for the demo:** lead the roof with **solar PV** (a few psf, dead-simple) and treat the **green roof as the load-gated, PE-memo'd option** — precisely the structural-gate story from ExecutiveSummary §1/§4 (cite Atlanta City Hall: 58 psf added vs 186 psf capacity → no reinforcement, on a 1930 building). **[CONFIRM structure via Office of Buildings archive drawings + aerial.]**

**Heat-island & surrounding land use:** the site is the classic intown heat sink — **dark single-ply/built-up roof + large asphalt parking lot** (parking 120–150 °F, black roof ~140 °F per the project's own deltas) surrounded by walkable residential (Piedmont Heights/Morningside/Virginia-Highland), Piedmont Park to the SW, and the BeltLine green corridor on its edge. That contrast (hot lot ↔ green BeltLine) is the visual the demo wants.

**CBEEO / ENERGY STAR:** at ~175k sqft it is **well over the 25,000-sqft CBEEO threshold → almost certainly a covered building with an ABID and a benchmarked ENERGY STAR/EUI row.** **NOT yet pulled** — do not quote a score until you pull it from `web.atlantaga.gov/coabuildings/` + `gis.atlantaga.gov/cbeeo/`. A 1964 un-deep-retrofitted retail center is *expected* to sit in a low ENERGY STAR band, but that is **inferred, not confirmed [CONFIRM]**. (Note: multi-tenant retail GLA can be split across parcels/meters — confirm the whole center benchmarks as one ABID.)

Approx **lat/lon for PVWatts: 33.793, -84.366** (per 05_SingleOwnerPortfolio).

---

## 2. The full intervention menu (big flat roof + big lot + BeltLine edge)

Honest suitability for **this** site. P = which problem (Heat / Stormwater / Carbon / Energy / Biodiversity).

### ROOF (~175k sqft flat, low-slope)
| Intervention | What / where | Suitability here | Problem |
|---|---|---|---|
| **Rooftop solar PV** ⭐ | PV across the flat roof, low-tilt (~10°) south | **Excellent.** Huge unshaded single plane, only a few psf — clears the structural gate trivially. A roof this size = ~1.4 MW. The roof's #1 use. | Carbon, Energy |
| **Extensive green roof** ⭐ (gated) | 15–35 psf sedum/media over part of the roof | **Good but load-gated.** Bar-joist 1964 deck → needs a PE load memo (the gate). Best as the *stormwater + cool-roof-compliance* play on a portion (e.g. BeltLine-facing bay for visibility). | Stormwater, Heat, Energy, Biodiversity |
| **Biosolar (green roof + PV)** | PV mounted above a green-roof layer | **Compelling narrative, secondary in practice.** Combines the two roof heroes (vegetation cools modules → slight yield bump; vegetation gets the cool-roof exemption). Use as the "best-practice" upsell on the demonstrative bay, not the whole roof (doubles the load + cost question). | Carbon+Stormwater+Heat |
| **Cool roof** | High-SRI reflective membrane on re-roof | **Default / baseline, not a hero.** It's the *obligation* (Ord. 25-O-1310) that green roof / solar coverage can substitute for. Frame cool roof as "the floor you must hit anyway; green/solar is the upgrade that exempts you." | Heat, Energy |
| **Blue roof (detention)** | Controlled-release ponding on roof | **Marginal here.** Adds water weight (load gate) to an old bar-joist deck; lot-based detention/bioswales are cheaper and lower-risk for this site. Mention, don't lead. | Stormwater |
| **Rainwater harvesting / cistern** | Cistern capturing roof runoff for irrigation | **Good support act.** Co-locates with green roof (Southface Eco Office precedent: green roof + PV + 1,750-gal cistern). Feeds lot landscaping / green-roof irrigation. | Stormwater |
| **Rooftop agriculture** | Intensive bed / community-ag plot | **Niche / narrative only.** Heavy (intensive load), needs access + a tenant. Use as a small BeltLine-facing "community ag" gesture, not a metric driver. (The Lewis-BBQ rooftop-smokehouse already gives the roof a "destination" story to ride.) | Biodiversity, narrative |

### PARKING LOT (~the bigger opportunity on this site)
| Intervention | What / where | Suitability here | Problem |
|---|---|---|---|
| **Solar carport canopies** ⭐⭐ | Elevated PV canopies over parking rows | **The single best move on this site.** This is where "shade" actually pays: shades cars (heat), generates the *largest* block of MWh, and the lot is huge. Towers can't do this; Ansley's lot is the reason to pick it. | Carbon, Energy, Heat |
| **Permeable paving** | Replace/overlay asphalt in lower-traffic stalls | **Good, targeted.** Full repaving is costly; deploy in islands/overflow stalls to cut first-inch runoff. | Stormwater, Heat |
| **Bioswales / rain gardens** | Vegetated swales in islands & lot perimeter | **Excellent + cheap.** Big impervious lot → lots of runoff to intercept; pairs with the Ch. 74 first-inch story and counts as GI BMP. | Stormwater, Biodiversity, Heat |
| **EV charging** | Stalls under/near the canopies | **Strong pairing.** Canopy PV → EV chargers is a clean amenity + ITC-eligible story; modest area, high visibility. | Carbon, Energy, amenity |
| **Tree islands / canopy** | Shade trees in lot islands | **Required anyway (see §4) + a hero for heat.** Ch. 158 forces ~1 tree/8 spaces; doing it well is free heat-island reduction and BeltLine-consistent. | Heat, Biodiversity |

### PERIMETER / BeltLine edge
| Intervention | What / where | Suitability here | Problem |
|---|---|---|---|
| **Shade lattice / trellis** | Pedestrian edge, BeltLine bridge approach, plaza | **OK at the edge only.** On the roof it is **pointless** (no people, and solar/green roof beat it). At the BeltLine-facing pedestrian zone it adds shade + a green face to the trail. Keep <40 ft to dodge the NFPA-285 fire gate. | Heat, biodiversity, narrative |
| **Pollinator / native landscaping** | BeltLine edge buffer + lot swales | **Easy win, on-brand.** Cheap biodiversity proxy (habitat m²), reinforces the green-corridor story, no gates. | Biodiversity, Stormwater |

**Honest "don't bother here" calls:** shade lattice *on the roof*; blue roof on the aged bar-joist deck (load risk vs. cheaper lot detention); full rooftop intensive farm as a metric driver (load + ops). Lead with the two solar plays + lot/edge GI.

---

## 3. Rough sizing & "is it worth it"

### Area assumptions (state them — they drive everything)
- **Roof (single-story → footprint ≈ roof):** GLA ~175,000 sqft = **~16,260 m²**. Usable for PV after setbacks/HVAC/penetrations **× 0.65 [ASSUMED]** → **~10,570 m²** usable; for green roof assume **~60%** plantable → **~105,000 sqft**.
- **Site:** ~16 acres = ~697,000 sqft. Building footprint ~175,000 sqft → **~522,000 sqft non-building**, mostly surface parking + drives + landscaping. Assume **~350,000 sqft is actual parking surface [ASSUMED]** (rest = drive aisles, sidewalks, existing landscape).
- **Parking spaces:** a ~175k-sqft NNN retail center at a ~4/1,000 ratio ≈ **~700 spaces [ASSUMED — CONFIRM via aerial/parcel].**
- **Solar-canopy coverage:** assume canopies over **~50%** of parking surface (the contiguous, canopy-friendly rows) = **~175,000 sqft = ~16,260 m² [ASSUMED].**

### Constants (from 02_DataAcquisitionPlan / FINAL §7)
PV density 0.15 kW/m² · packing 0.70 · Atlanta ≈ ~1,450 kWh/kW/yr specific yield · eGRID SRSO **0.3837 kg CO₂/kWh** · GA Power **$0.115/kWh** · PV $1.75/W (rooftop) · **carport PV ~$3.2/W** (canopy structure premium) · green roof **$20/sqft** · retention **~60%** of annual rainfall · Atlanta rain **~50 in/yr** · 30% ITC · 7.48 gal/ft³.

### Roof solar PV
- kW_DC ≈ 10,570 m² × 0.15 × 0.70 ≈ **~1,110 kW** (call it **~1.1 MW**; could reach ~1.4 MW with denser packing across the full roof plane).
- kWh/yr ≈ 1,110 × ~1,450 ≈ **~1.6M kWh/yr**.
- Capex ≈ 1,110 kW × $1,750/kW ≈ **~$1.94M** → after 30% ITC ≈ **~$1.36M**.
- CO₂ ≈ 1.6M × 0.3837 ≈ **~615 t/yr** · Energy value ≈ 1.6M × $0.115 ≈ **~$184k/yr**.

### Parking solar-canopy PV (the hero)
- kW_DC ≈ 16,260 m² × 0.15 × 0.70 ≈ **~1,710 kW** (**~1.7 MW**). (Per-space cross-check: ~350 shaded spaces × ~11 kW/canopy-pair ≈ ~1.9 MW — same order; use **~1.7–1.9 MW**.)
- kWh/yr ≈ 1,710 × ~1,500 (canopies tilt slightly better) ≈ **~2.6M kWh/yr**.
- Capex ≈ 1,710 kW × ~$3,200/kW ≈ **~$5.5M** → after 30% ITC ≈ **~$3.8M**. (Canopies cost ~2× rooftop $/W because of the steel structure — the honest tradeoff.)
- CO₂ ≈ 2.6M × 0.3837 ≈ **~1,000 t/yr** · Energy value ≈ **~$300k/yr** · plus the **shade/heat** co-benefit that rooftop PV doesn't give.

### Combined solar headline
- **~2.8–3.0 MW DC → ~4.2–4.3M kWh/yr → ~1,650 t CO₂/yr avoided → ~$485–495k/yr** energy value.
- Combined capex **~$7.4M** → after 30% ITC **~$5.2M**. Add §179D + any GA Power rebate → lower still.
- **Simple payback:** roof-PV alone **~7–8 yr**; canopy-heavy blended **~10–11 yr** pre-other-incentives (better with §179D + accelerated depreciation, which a private owner like Selig can use).

### Green roof (stormwater + cool-roof compliance, the gated play)
- Area ~105,000 sqft. Annual capture ≈ 105,000 sqft × (50 in/12) ft × **60%** = 105,000 × 4.167 × 0.60 ≈ **~262,500 ft³ → ~1.96M gal/yr**. (Scale to ~140k sqft and it's **~2.6M gal/yr**; **~2.5–3.0M gal/yr** is the defensible band.)
- First-inch (Ch. 74) on the green-roofed area: WQv = 1.0" × Rv × A /12; rooftop Rv ≈ 0.95 → ~105,000 × 0.95 /12 ≈ ~8,300 ft³ ≈ **~62,000 gal per 1" storm** retained on that area.
- Capex ≈ 105,000 sqft × $20 ≈ **~$2.1M** (extensive). Cool-roof-exemption value = avoided re-roof compliance cost (qualitative).
- **Caveat:** this is the **load-gated** item — number is real only after the PE memo clears the bar-joist deck.

### Lot GI (bioswales + permeable + required trees)
- Adds first-inch capture across the parking surface and satisfies Ch. 158; modest capex, high heat/biodiversity/compliance value. Treat as the "cheap compliance + heat" layer, not a headline kWh/gal driver.

### Verdict
**Worth it. Yes.** One site, one owner, two big surfaces, two clean heroes, a live BeltLine hook, and a 1964 "before." The combined-solar headline (~3 MW, ~4.3M kWh, ~1,650 t CO₂, ~$0.5M/yr) is large enough to carry a pitch on its own, and the parking-canopy story is the thing a downtown tower **cannot** tell. The green roof + lot GI give the stormwater/heat/compliance narrative (first-inch, cool-roof exemption, Ch. 158 trees) and the structural-gate teaching moment. **Hero set: (1) solar carport canopies, (2) rooftop PV, (3) stormwater (green roof + bioswales).** Cool roof = the baseline you frame solar/green roof as exempting; agriculture/lattice = narrative garnish at the BeltLine edge.

---

## 4. Codes & rules to compare against (Atlanta-specific, this site)

GATE = hard pass/fail. CARROT = incentive/credit the site can claim.

| Rule | What it says (verified June 2026) | How it hits Ansley | Gate / Carrot |
|---|---|---|---|
| **Cool Roof Ordinance 25-O-1310** (passed 2025-06-02; enforceable after a state-submission window, effectively **~June 2026**) | New construction **AND full roof replacements** must hit low-slope **SRI ≥85 / reflectance ≥0.70** (steep-slope SRI ≥20 / refl. ≥0.21), 3-yr aged. **Green/vegetated roof area is exempt**; roof sections ≤3% of floor area exempt; mere repairs (not full replacement) exempt. Solar/equipment areas handled as exemptions. | When Selig re-roofs this 1964 membrane (a *when*, not *if*), the cool-roof obligation triggers. **Green roof = a compliant exempt path; PV areas help too.** This is the **killer hook**: a mandatory obligation our intervention satisfies. | **GATE (re-roof) → turned CARROT** by green/solar exemption |
| **Stormwater — City Code Ch. 74, Art. X** | Capture/retain the **first 1.0"** on-site via green infrastructure (GSMM Vol. 2 sizing; Rv = 0.05 + 0.009×I). | A ~700k-sqft mostly-impervious site sheds a lot; green roof + bioswales + permeable size the GI to the first inch. Applicability sf threshold to **confirm with DWM** at parcel stage. | **GATE (on qualifying work) + CARROT** (highest-status local metric) |
| **Tree Protection — Ch. 158, §158-30** | Surface lots being **built/resurfaced with ≥30 spaces** must submit a plan to the City Arborist; **≥1 tree per 8 parking spaces** in landscaped areas; interior islands ≥36 sqft (6'×6'); landscaped area **≥10% of paved area**. Recompense **$140/DBH-inch** (eff. Jan 2026, up from ~$30); 1.25× caliper planting credit. | **Directly relevant** — a ~700-space lot needs **~85+ trees** to comply on resurface; adding canopy/swales banks planting credit and *avoids* recompense. Our lot interventions are *additive*, so they earn rather than owe. | **GATE (on resurface) + CARROT** (recompense avoidance + credit) |
| **Structural load** (2024 IBC + GA amendments) | Added roof dead load must be justified; extensive green roof 15–35 psf, saturated media ~7 psf/in. Needs **GA-licensed PE load-comparison memo** vs. original drawings. | The **decisive gate for the green roof** on the 1964 bar-joist/metal deck. PV (a few psf) clears easily. Pull original drawings; cite Atlanta City Hall (58 vs 186 psf → no reinforcement). | **GATE (highest-risk for green roof)** |
| **Solar permitting + Georgia Power interconnection / net metering** | COA building+electrical permits. GA Power: the favorable **monthly-netting** pilot (5,000 customers / 32 MW) is **closed/full**; new commercial is on **instantaneous netting** — excess exported at ~avoided cost + ~4¢ (≈6–7¢/kWh historically), **far below** the ~11.5¢ retail offset. Systems >100 kW face interconnection study; the old 250-kW commercial cap context applies. | **Design to self-consume**, not export: a 175k-sqft retail center with Publix/LA Fitness/CVS has large daytime load → most of the ~4.3M kWh offsets retail-priced consumption on-site (good economics). Big arrays (MW-scale) → expect an **interconnection study** and possible phased/behind-multiple-meters design. **Confirm current GA Power tariff + PSC rules at design.** | **GATE (interconnection) + economic constraint** (export ≠ retail value) |
| **Fire / NFPA (canopies + edge lattice)** | IFC: FD roof access + PV rapid-shutdown pathways; combustible façade components >40 ft may trigger **NFPA-285**; canopy setbacks/clearances. | Keep roof-PV access pathways; keep any BeltLine-edge **shade lattice <40 ft** and non-combustible to avoid NFPA-285. Canopies are open structures — standard PV fire detailing. | **GATE (manageable with standard detailing)** |
| **Zoning / parking minimums (canopy implications)** | Solar canopies occupy parking; ATL **Zoning 2.0 / Unified Development Code** rewrite is mid-adoption (comment Dec 2025–Apr 2026, adoption ~2026) and may add open-space/landscape credit. **BeltLine Overlay** (§16-36.019) sets its own lot-landscaping minimums for this corridor. | Canopies usually **don't lose** the parking space (cars park under), so parking-minimum risk is low — **confirm** canopy posts/clearances keep stalls compliant. BeltLine Overlay landscaping may *exceed* Ch. 158 here — check the overlay. Zoning-2.0 credit language **not final** → use legacy fallback. | **GATE (verify) + possible CARROT** (open-space credit) |

---

## 5. Data gaps (what to pull to make the numbers real)

| Gap | Why it matters | Best source |
|---|---|---|
| **Exact roof polygon area (m²)** | Drives PV kW + green-roof gallons; my 175k sqft is GLA, not measured roof | **Fulton County Structure Footprints** (`gisdata.fultoncountyga.gov`) → area in UTM 16N |
| **Parking area + space count** | Drives canopy MW *and* Ch. 158 tree count; ~700 spaces is **[ASSUMED]** | Parcel minus footprint (Fulton parcels + footprints) + aerial stall count |
| **Original structural drawings** | The green-roof **load gate** — bar-joist deck capacity vs. 15–35 psf | **COA Office of Buildings** archive; then GA-licensed **PE load-comparison memo** |
| **CBEEO ENERGY STAR row** | The actual "before" score + ABID + EUI + GHG (don't quote until pulled) | `web.atlantaga.gov/coabuildings/` + `gis.atlantaga.gov/cbeeo/`; fallback email `buildingefficiency@atlantaga.gov` |
| **Impervious %** | Feeds Rv → first-inch WQv for the lot | NLCD GeoTIFF (mrlc.gov) sampled at 33.793, -84.366; rooftop/lot ≈ 95–100% |
| **GA Power tariff + interconnection rules (current)** | MW-scale export economics + study requirement | georgiapower.com business tariffs; GA PSC dockets |
| **BeltLine Overlay landscaping reqs** | May exceed Ch. 158 on this corridor | COA Code §16-36.019; COA Open Data historic/overlay layers |
| Parcel ownership confirmation (100% Selig) | Single-owner story integrity | Fulton County qPublic / GSCCCA deeds (grantee = Selig entity) |

---

## Sources
- Ansley Mall facts: [Wikipedia](https://en.wikipedia.org/wiki/Ansley_Mall) · [CommercialSearch](https://www.commercialsearch.com/commercial-property/us/ga/atlanta/ansley-mall-1/) · [Mall-history blog](https://mall-hall-of-fame.blogspot.com/2008/06/dekalb-county-georgias-fourth-shopping.html) · [Malls Wiki](https://malls.fandom.com/wiki/Ansley_Mall)
- BeltLine bridge / reinvestment: [Urbanize Atlanta — bridge announced](https://atlanta.urbanize.city/post/ansley-mall-beltline-bridge-announced) · [Urbanize — rooftop smokehouse](https://atlanta.urbanize.city/post/lewis-barbecue-beltline-ansley-mall-bridge-worlds-first-rooftop-smokehouse-opening-soon) · [Atlanta Jewish Times](https://www.atlantajewishtimes.com/selig-announces-beltline-connectivity/) · [WhatNow Atlanta](https://whatnow.com/atlanta/real-estate/renovations-to-ansley-mall-will-add-restaurant-space-along-beltline/)
- Cool Roof Ord. 25-O-1310: [Columbia Climate Law Blog](https://blogs.law.columbia.edu/climatechange/2025/06/27/atlantas-new-ordinance-raises-the-bar-on-cool-roofs/) · [Sheffield Metals](https://sheffieldmetals.com/learning-center/new-2025-atlanta-cool-roof-city-ordinance/) · [Smart Surfaces Coalition](https://smartsurfacescoalition.org/atlanta-press-release)
- Tree Protection Ch. 158 §158-30: [Atlanta eLaws](http://atlanta.elaws.us/code/coor_ptii_ch158_artii_div1_sec158-30) · [Municode Ch. 158](https://library.municode.com/ga/atlanta/codes/code_of_ordinances/177780?nodeId=PTIICOORENOR_CH158VE)
- Georgia Power net metering / interconnection: [EnergySage 2026](https://www.energysage.com/local-data/net-metering/georgia-power/) · [GA Power RNR tariff](https://www.georgiapower.com/content/dam/georgia-power/pdfs/business-pdfs/tariffs/2023/RNR-11.pdf)
- Structural typology: [Metal Construction News — retrofit roofing](https://www.metalconstructionnews.com/articles/the-retrofit-roofing-game-preparing-for-the-existing-roofing-analysis/)
- Solar carport cost/sizing: [SolarTech canopy guide](https://solartechonline.com/blog/what-is-solar-parking-canopy-guide/) · [GreenLancer carport guide](https://www.greenlancer.com/post/solar-carports)
</content>
</invoke>
