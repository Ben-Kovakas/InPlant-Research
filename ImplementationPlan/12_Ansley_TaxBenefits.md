# 12 — Tax Benefits & Incentive Stack

## Ansley Mall · 1544 Piedmont Ave NE, Atlanta, GA 30324

> **City-Ready Proposal — Pillar 4: Tax Benefits / Incentive Stack**
> **Owner:** Selig Enterprises (private, for-profit) · **Asset:** 1964 retail center, ~215,634 ft² roof + ~6 ac parking field
> **Retrofit modeled:** ~1.84 MW rooftop solar PV + ~1.4 MW parking-lot canopy solar + partial extensive green roof + stormwater package
> **Date:** 2026-06-16

---

### How to read this document

This pillar tells the owner **where the money comes from** to make a ~$3.1–6.7M retrofit pencil. Because Selig is a **private, taxable, for-profit entity**, the federal tax credits and depreciation deductions apply cleanly and directly against tax liability — there is no "tax-exempt / elective-pay" complication and no public-ownership haircut. That is a real advantage and the case is built on it.

**Modeled vs. assumed vs. verify.** Every number is tagged:
- **[MODELED]** — computed from the Google Solar API study + our research constants (see Doc 10, `ansley-mall.json`).
- **[ASSUMED]** — a stated planning assumption (e.g., self-consumption %, eligible basis).
- **[VERIFY]** — a current-law or site-specific item a tax advisor / Georgia Power rep must confirm before it is quoted to a board.

> **⚠️ Material legal-change flag (2025).** The **One Big Beautiful Bill Act (OBBBA, signed July 4, 2025)** changed the timelines for nearly every federal incentive below. The 30% ITC and §179D both now hinge on a **construction-start deadline**, and the depreciation rules changed. **This is the single biggest driver of urgency in the whole proposal — these are sunsetting windows, not permanent programs.** All federal items below are flagged **[VERIFY with tax counsel]** because the implementing Treasury guidance was still tightening as of mid-2026.

---

## 1. The Stack at a Glance

| # | Incentive | Type | Modeled value to this project | Window / deadline | Confidence |
|---|-----------|------|-------------------------------|-------------------|:--:|
| 1 | **Federal ITC (30%)** | Tax credit | **~$472K–$964K** (solar capex × 30%) | Construction must start **by Jul 4, 2026**; in service by **Dec 31, 2027** | [VERIFY] |
| 1b | **PTC alternative** | Tax credit | ~$0.0275/kWh × ~4.34 GWh ≈ **~$119K/yr × 10 yr** | Same begin-construction regime | [VERIFY] |
| 2 | **§179D deduction** | Tax deduction | **~$125K–$1.25M+** (deduction, not credit) on EE scope | Construction must start **by Jun 30, 2026** | [VERIFY] |
| 3 | **100% Bonus Depreciation** | Tax deduction | First-year deduction on depreciable basis (~85% of cost) | Restored for assets placed in service **after Jan 19, 2025** | [VERIFY] |
| 4 | **Georgia Power Commercial EE Rebate** | Cash rebate | **$100K–$350K / building / yr** (program cap) | Annual program; pre-approval required | [VERIFY] |
| 5 | **Net Metering / buyback** | Avoided cost | Minor — design self-consumes; export ~6.68¢ < retail | Ongoing; program capacity-capped | [VERIFY] |
| 6 | **Cool-roof exemption** | Avoided cost | Avoided mandatory re-roof-to-spec cost on PV/green area | Triggered at re-roof; ongoing ordinance | Med |
| 7 | **Tree-recompense avoidance** | Avoided cost | Avoided ~$/DBH-inch recompense (~80 lot trees satisfied in-kind) | Triggered at lot resurface/permit | Med |

**Stacking note.** Items 1–3 stack: the ITC is a *credit* (dollar-for-dollar against tax), while §179D and bonus depreciation are *deductions* (reduce taxable income). They are not mutually exclusive, but the ITC reduces the **depreciable basis** by half the credit (basis reduction = 15% on a 30% ITC) — flagged below. Items 4–7 are independent of the federal stack.

---

## 2. Federal Incentives

### 2.1 Federal Investment Tax Credit (ITC) — 30%

**What it is.** A dollar-for-dollar federal income-tax credit equal to 30% of the eligible cost basis of a commercial solar PV system (Internal Revenue Code §48 / §48E "clean electricity" credit). It is the centerpiece of the stack.

**Value to this project [MODELED].** Applied to the combined solar capex band (roof + canopy):

| Scenario | Solar capex | ITC @ 30% | Capex after ITC |
|---|---|---|---|
| Google-optimistic ($0.857/W roof) | low end | ~$472K (roof alone, per fixture) | ~$1.10M (roof) |
| Our-researched ($1.75/W roof) | high end | ~$964K (roof alone, per fixture) | ~$2.25M (roof) |

The `ansley-mall.json` fixture carries the **roof-only** ITC explicitly: `capexAfterItcUsd` = **$1.10M–$2.25M** (from $1.57M–$3.21M less 30%). Adding the ~1.4 MW canopy roughly **doubles** the solar capex and the credit; canopy steel runs higher ($/W), so the canopy ITC is proportionally larger per kW.

**Eligibility for this owner/project.** Strong. Selig is a taxable for-profit with tax appetite, so the credit is usable directly (no need for elective pay / transfer, though transfer under §6418 remains an option if appetite is short). Both rooftop PV and parking-canopy PV are eligible energy property. **Prevailing-wage & apprenticeship (PWA)** compliance is what unlocks the full 30% (vs. a 6% base) on projects over 1 MW — **this ~3.24 MW combined project is over 1 MW, so PWA compliance is mandatory to hit 30%.** [VERIFY — confirm PWA documentation in the EPC contract.]

**Form / process.** Claimed on **IRS Form 3468** (Investment Credit) filed with the corporate return for the tax year the system is placed in service. Maintain PWA payroll records, the cost-basis schedule, and the placed-in-service date.

**Time window [VERIFY — OBBBA].** Per the One Big Beautiful Bill Act (July 2025): commercial solar can still claim the **full 30%** if **construction begins by July 4, 2026** (commonly via the safe-harbor "begin construction" rules), with the project **placed in service by Dec 31, 2027**. A July 2025 executive order directed Treasury to **tighten** what counts as "beginning construction" (likely requiring substantial physical work, not just an equipment deposit). **This converts the ITC from a standing program into a hard deadline — the dominant scheduling driver for the whole retrofit.**

### 2.2 Production Tax Credit (PTC) — the ITC-vs-PTC choice

**What it is.** An alternative to the ITC: instead of a one-time 30% credit on cost, the PTC pays a per-kWh credit on **actual generation for 10 years** (§45 / §45Y). The Google study modeled the alternative at **$0.0275/kWh**.

**The choice (from the Google model) [MODELED].** PTC vs. ITC is an either/or election per facility:
- **ITC** = ~30% of capex up front — favors **high-cost-per-watt** systems (canopy steel, our $1.75/W case).
- **PTC** = ~$0.0275/kWh × generation × 10 yr — favors **high-yield, low-cost** systems (Google's $0.857/W roof case).

At ~4.34 GWh/yr combined, a PTC stream is **~$119K/yr ≈ ~$1.19M nominal over 10 yr** [MODELED], vs. a ~$472K–$964K one-time ITC on the roof (more with canopy). **Rule of thumb:** the cheaper the install ($/W), the more the PTC tends to win; the more expensive, the more the ITC wins. The parking canopy (expensive steel) leans ITC; a cheap rooftop install could lean PTC. **[VERIFY]** the election with tax counsel — it is locked once made and interacts with PWA and depreciation.

### 2.3 §179D — Energy-Efficient Commercial Buildings Deduction

**What it is.** A federal tax **deduction** (not a credit) for installing energy-efficient building systems (envelope, HVAC, lighting) that reduce total energy/power cost vs. an ASHRAE reference baseline. Relevant here to the **green-roof envelope / cool-roof / any HVAC + lighting** scope, **not** the solar PV itself.

**Value [VERIFY — 2025/26 rates].** Verified current values:
- **Tax years beginning 2025:** $0.58/ft² (at 25% savings) sliding up to **$1.16/ft²** (no PWA), or up to **~$5.81/ft²** *with* prevailing-wage & apprenticeship.
- **Tax years beginning 2026:** $0.59/ft² up to **$1.19/ft²** (no PWA); higher with PWA.

On ~215,634 ft², even the non-PWA floor (~$0.58/ft²) is **~$125K**; the PWA-qualified ceiling could approach **$1M+** if the EE scope is deep enough to hit high savings tiers. [ASSUMED — actual deduction depends on the modeled % energy savings of the *building* scope, which must be certified.]

**Eligibility.** Selig as building owner can claim it directly. Requires **third-party certification** by a licensed engineer using approved DOE software modeling.

**Form / process.** **IRS Form 7205** with the return, supported by the engineer's §179D certification. Note this is a **deduction** — its cash value = deduction × marginal tax rate (~21% federal corporate), so a $1M deduction ≈ ~$210K of tax saved.

**Time window [VERIFY — OBBBA].** **The OBBBA terminated §179D for property whose construction begins after June 30, 2026.** This is an even tighter deadline than the ITC — to capture §179D, the EE scope must be under construction by mid-2026.

### 2.4 MACRS / 100% Bonus Depreciation

**What it is.** Depreciation lets the owner deduct the capital cost of the solar/energy assets over time. Historically solar used a **5-year MACRS** schedule; **bonus depreciation** lets a large share be deducted in **year one**.

**2025 status [VERIFY — OBBBA].** The OBBBA **restored 100% bonus depreciation** for qualifying assets **placed in service after Jan 19, 2025** (it had been phasing down). Reporting indicates the dedicated **5-year MACRS classification was removed for new solar** under OBBBA, but 100% first-year bonus depreciation remains — so the practical effect is still a large **first-year deduction**. **[VERIFY with tax counsel — this is the most unsettled item and the MACRS/bonus interaction needs confirmation for a 2026/27 in-service date.]**

**Basis interaction [VERIFY].** Claiming the 30% ITC reduces the depreciable basis by **half the credit** (i.e., depreciate ~85% of cost, not 100%). Industry guidance suggests combining 30% ITC + 100% bonus depreciation lets a taxable owner recover **~45% of the solar investment via first-year tax benefits**. For Selig that is a major front-loaded cash benefit on top of the ITC.

**Form / process.** Depreciation schedule (Form 4562) with the return; coordinate with the ITC basis-reduction. Requires tax appetite in the placed-in-service year to absorb the deduction.

---

## 3. State / Utility Incentives

### 3.1 Georgia Power Commercial Energy-Efficiency Rebate

**What it is.** A cash rebate from Georgia Power's **Commercial Energy Efficiency Program (CEEP)** for installing measurable, verifiable energy-efficient equipment (lighting, HVAC, controls, etc.) at a commercial facility on a GPC commercial tariff.

**Value.** **$100K–$350K per building per year** (program cap) [VERIFY — confirm current 2026 caps and qualifying-measure list with a GPC rep].

**Eligibility.** Selig must be an active Georgia Power customer on a commercial tariff and install qualifying equipment. The green-roof/envelope and any HVAC/lighting upgrades are candidate measures; **solar PV generation is generally NOT a CEEP measure** — this rebate attaches to the *efficiency* scope, not the *generation* scope.

**Form / process.** **Pre-approval / pre-qualification before installation** is typically required, with post-install measurement & verification. Engage GPC at design stage.

**Time window.** Annual program; rebates allocated until the yearly budget is exhausted — **apply early in the program year.**

### 3.2 Net Metering / Solar Buyback

**What it is.** Compensation for solar energy exported to the grid. Georgia Power's buyback (avoided-cost) rate is **~6.68¢/kWh** [VERIFY], well below the retail rate the owner avoids by self-consuming. The fixture also references a NEM figure of $0.0288/kWh capped at 125% of annual use.

**Why it's minor here — the self-consumption point [MODELED].** Ansley Mall **uses ~13.43 GWh/yr** but the combined solar generates only **~4.34 GWh/yr** — about **18% of load from the roof alone, ~32% combined**. Because generation is far below consumption, **essentially all solar is self-consumed on-site, with no export haircut.** The economic value of each solar kWh is therefore the **retail rate avoided ($0.115–$0.187/kWh), not the ~6.68¢ export rate.** Net metering is upside-protection, not a primary value driver — and Georgia Power's NEM program is capacity-capped (and historically oriented to small/residential systems), so it should **not** be counted on for a 3+ MW commercial array. [VERIFY interconnection terms at this size.]

> **Design implication:** size solar to **self-consume**, which this project already does (~32% of load). This is the strongest, most defensible part of the energy economics — the savings come from offsetting expensive retail power, not from selling cheap power back.

---

## 4. City / Avoided-Cost Incentives

### 4.1 Cool-Roof Exemption (avoided compliance cost)

**What it is.** Atlanta's **Cool Roof Ordinance (25-O-1310)** requires that a re-roof meet cool-roof SRI/reflectance thresholds. **Roof area covered by solar PV or a green roof is EXEMPT** from that obligation.

**Value as avoided cost.** The 1964 membrane will eventually require a re-roof, which would otherwise trigger a mandatory cool-roof-spec install across the whole ~215,634 ft². By placing PV + green roof over the bulk of the roof, the owner **satisfies/exempts the obligation in-kind** — avoiding the incremental cost of a code-compliant cool-roof retrofit on that area. **This is the "killer hook": a mandatory future compliance cost is converted into a revenue-and-savings asset.** [VERIFY exact exempt-area mechanics and any cool-coating still required on uncovered perimeter.]

### 4.2 Tree-Recompense Avoidance

**What it is.** Atlanta's **Tree Protection Ordinance (Ch. 158)** requires parking lots of 30+ spaces to provide **≥1 tree per 8 spaces**; failing to meet canopy requirements triggers **recompense** (~$/DBH-inch) at resurface/permit.

**Value as avoided cost.** A ~600–700-space lot implies a requirement of **~75–88 trees** [GAP — pending lot/space measurement]. Providing lot trees / pollinator islands as part of the canopy + stormwater package **satisfies the requirement in-kind and avoids recompense fees**, and may earn the **1.25× planting credit**. The solar canopy and tree islands are designed to coexist. [VERIFY space count and current per-inch recompense rate.]

---

## 5. Cash-Flow Summary — Payback as a Defensible BAND

### 5.1 Why a band, not a point

Payback is **highly sensitive** to two inputs the team deliberately bracketed rather than guessed:
- **Install cost ($/W):** Google-optimistic **$0.857/W** ↔ our-researched **$1.75/W**.
- **Avoided retail rate ($/kWh):** our-researched **$0.115/kWh** ↔ Google **$0.187/kWh**.

Quoting a single payback would be indefensible; the honest answer is a **2.5–8 year band**, with the truth landing in the middle for a real EPC bid.

### 5.2 Combined-solar economics (roof ~1.84 MW + canopy ~1.4 MW) [MODELED]

| Line | Optimistic edge (Google) | Conservative edge (Research) |
|---|---|---|
| Combined solar capacity | 3,236 kW DC | 3,236 kW DC |
| Combined generation | ~4.34 GWh/yr | ~4.34 GWh/yr |
| Install cost ($/W) | **$0.857/W** | **$1.75/W** |
| Avoided retail rate | **$0.187/kWh** | **$0.115/kWh** |
| **Annual energy savings** | **~$811K/yr** | **~$499K/yr** |
| Gross solar capex (combined, approx.) | ~$2.8M | ~$5.7M |
| **Less 30% ITC** | −~$833K | −~$1.70M |
| **Incentive-adjusted capex (after ITC)** | **~$1.9M** | **~$4.0M** |
| **Simple payback band** | **~2.5 yr** | **~8.0 yr** |

> Roof-only is anchored in the fixture: capex **$1.57M–$3.21M**, **$1.10M–$2.25M after ITC**. The combined figures above scale that up for the ~1.4 MW canopy (carried at a higher $/W for canopy steel — treat the conservative column as the planning case).

### 5.3 Stacking the rest on top

The payback band above **only counts the ITC.** It is **conservative** because it excludes:
- **100% bonus depreciation** (~first-year deduction worth ~21% of ~85% of basis → meaningful additional first-year cash for a taxable owner) [VERIFY],
- **§179D** (~$125K–$1M+ deduction on the EE/envelope scope) [VERIFY],
- **Georgia Power CEEP rebate** ($100K–$350K cash) [VERIFY],
- **Cool-roof exemption** and **tree-recompense avoidance** (avoided future compliance cost).

Layering depreciation + §179D + the GPC rebate **pulls the effective payback toward the optimistic edge** and is where the "~45% of cost recovered in year one via federal tax benefits" claim comes from. The defensible headline: **a 2.5–8 yr simple payback on solar alone, shortened further by the depreciation + deduction + rebate + avoided-cost layers.**

### 5.4 Environmental return (for the City side-B narrative)
- **~1,665 t CO₂/yr** avoided (combined) toward the 59%-by-2030 / net-zero-2050 goal.
- **~4.34 GWh/yr** on-site clean generation toward 100% clean energy by 2035.
- **~2.4M gal/yr** stormwater retained (green-roof portion) toward the citywide GI target.

---

## 6. Modeled-vs-Assumed Ledger & Verify List

| Item | Status | Action before board-quote |
|---|---|---|
| Solar capacity / generation (roof) | [MODELED — Google Solar API] | High confidence; method validated vs. hand estimate |
| Canopy capacity (~1.4 MW) | [ASSUMED] | Measure lot in Google Earth; firm up $/W for canopy steel |
| 30% ITC eligibility & PWA | [VERIFY] | Confirm PWA payroll/apprenticeship in EPC; >1 MW makes PWA mandatory |
| **ITC begin-construction deadline (Jul 4, 2026)** | [VERIFY — OBBBA] | **Confirm safe-harbor "begin construction" with counsel — drives schedule** |
| ITC vs. PTC election | [MODELED / VERIFY] | Tax counsel runs both; lower $/W leans PTC, higher leans ITC |
| **§179D deadline (begin construction by Jun 30, 2026)** | [VERIFY — OBBBA] | Even tighter than ITC; certify EE % savings via DOE software |
| §179D $/ft² (2025: up to $1.16/$5.81 PWA; 2026: $1.19) | [VERIFY] | Confirm tax-year rate + PWA path with engineer/CPA |
| MACRS removed / 100% bonus restored | [VERIFY — OBBBA] | Most unsettled item; confirm depreciation treatment for 2026/27 in-service |
| ITC basis reduction (~15%) | [VERIFY] | Coordinate ITC + depreciation basis with CPA |
| GA Power CEEP cap $100K–$350K | [VERIFY] | Confirm 2026 caps + qualifying measures with GPC; pre-approve |
| Net-metering buyback ~6.68¢ / NEM cap | [VERIFY] | Confirm interconnection terms at 3+ MW; design self-consumes regardless |
| Self-consumption ~32% of load | [MODELED] | High confidence; 13.43 GWh use ≫ 4.34 GWh gen |
| Cool-roof exempt-area mechanics | [VERIFY] | Confirm exempt area + perimeter coating with Office of Buildings |
| Tree count / recompense rate | [GAP/VERIFY] | Measure spaces (~75–88 trees); confirm $/DBH-inch |
| Marginal tax rate for deduction value | [ASSUMED ~21%] | Use Selig's actual effective rate |

---

*Sources (current-law verification, June 2026):*
- [EnergySage — Federal Solar Tax Credit in 2026 (OBBBA changes)](https://www.energysage.com/solar/solar-tax-credit-explained/)
- [Carr, Riggs & Ingram — Energy Tax Credits After OBBBA](https://www.criadv.com/insight/energy-tax-credits-after-obbba/)
- [U.S. DOE — 179D Energy Efficient Commercial Buildings Deduction](https://www.energy.gov/cmei/buildings/179d-energy-efficient-commercial-buildings-tax-deduction)
- [Uncle Kam — 179D Complete 2026 Tax Guide](https://unclekam.com/tax-write-offs/deductions/energy-efficient-commercial-building-deduction/)
- [Green Convergence — 100% Bonus Depreciation Is Back (OBBBA)](https://www.greenconvergence.com/blog/100-bonus-depreciation-is-back)
- [Citadel — Big Beautiful Bill: 2025 Deadlines & Commercial Solar Impact](https://blog.citadelrs.com/the-big-beautiful-bill-and-commercial-and-multifamily-solar-2025-impact-and-deadlines)
- [Georgia Power — Commercial Energy Efficiency Program](https://www.georgiapower.com/business/products-programs/efficiency-maintenance/ceep.html)
- [EnergySage — 2026 Georgia Power Net Metering](https://www.energysage.com/local-data/net-metering/georgia-power/)

> **Disclaimer:** This pillar summarizes incentive design for planning. Federal items reflect post-OBBBA (July 2025) law as understood June 2026, with Treasury guidance still tightening. **Not tax advice — Selig must confirm all federal positions with tax counsel and the utility programs with a Georgia Power representative before relying on any value herein.**
