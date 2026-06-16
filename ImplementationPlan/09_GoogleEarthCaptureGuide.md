# 09 — Google Earth Capture Cheat-Sheet (for the manual Ansley Mall pipeline)

> **Goal:** capture, in one pass through free Google Earth, everything needed to run the retrofit pipeline by hand for **Ansley Mall, 1544 Piedmont Ave NE, Atlanta, GA 30324** — no software model required.
> **You have:** Google AI Pro → "**Ask Google Earth**" (Gemini map insights). Use it as a quick first guess; confirm numbers with the **Measure** tool (the ruler icon), which is the ground truth.

---

## The 6 things to grab (priority order)

| # | What | How in Google Earth (web) | What it feeds |
|---|------|---------------------------|---------------|
| 1 | **Top-down screenshot** of the whole site (roof + parking lot), **scale bar visible** | Zoom so the building + lot fill the frame. Press **`r`** (or click the compass) to reset to north-up / straight-down. Screenshot it. | Surface decomposition; I read obstructions, lot layout, tree islands directly |
| 2 | **Roof area** | Click the **Measure** tool (ruler icon, left toolbar) → click around the roof outline → close the shape → read **Area** (switch units to **ft²** or **m²**). If the roof has separate sections/heights, measure each and label them. | Solar kW, green-roof gallons, cool-roof area |
| 3 | **Parking-lot area + space count** | Measure the paved lot the same way. For spaces: count the rows in the screenshot, or **Ask Google Earth** "how many parking spaces", then sanity-check (≈325 ft²/space incl. aisles). | Solar-canopy sizing; **tree ordinance** (1 tree / 8 spaces) |
| 4 | **Lat/long** | Read it from the bottom status bar, or copy from the URL (the `@33.79…,-84.36…` part). | Solar calc location |
| 5 | **Roof long-axis heading** *(optional)* | Measure tool → draw a single line along the roof's long edge → read the **heading (°)**. | Panel/canopy row orientation |
| 6 | **Stories + roof material** | Tilt into 3D, or drop into **Street View** at the storefronts. Note single-story, parapet, roof color (dark membrane?). | Heat "before"; structural read |

---

## Fastest one-pass sequence

1. Search **"Ansley Mall, Piedmont"** (already done) → zoom to fit the whole site.
2. Press **`r`** for a clean top-down, north-up view → **screenshot #1** (whole site + scale bar).
3. **Measure → roof polygon** → note area. Screenshot the measurement overlay → **screenshot #2**.
4. **Measure → parking-lot polygon** → note area + estimate spaces.
5. Grab **lat/long** from the URL.
6. (Optional) **Ask Google Earth**: "roof area of this building?" and "how many parking spaces?" — paste its answers so I can compare to your measurements.
7. (Optional) One **Street View** screenshot of the storefront for stories/roof material.

---

## What to paste back to me

- Screenshot #1 (whole site, scale bar)
- Screenshot #2 (roof measurement overlay), or just the **roof area number**
- **Parking-lot area** + rough **space count**
- **Lat/long**
- (optional) roof heading, Street View shot, and any "Ask Google Earth" answers

That's enough for me to produce the **Ansley Mall retrofit sheet**: surface decomposition → eligibility matrix (every intervention × surface, qualify/disqualify + why) → rough sizing (solar kW/kWh, gallons, tons CO₂, capex, incentive-adjusted payback) → the specific Atlanta codes each triggers (cool-roof exemption, first-inch stormwater, tree ordinance, structural-load gate, GA Power interconnection) → remaining data gaps.

---

## Accuracy notes

- **Measure tool = truth; Ask Google Earth = hint.** The Gemini map-insights answers can be approximate — always prefer the polygon area you traced.
- A **scale bar in the screenshot** lets me re-estimate areas independently if a measurement is unclear.
- Footprint area ≈ roof area for a single-story building (good — Ansley is single-story).
- Usable roof ≈ 0.6–0.7 × measured area after HVAC/skylights/setbacks; I'll apply that, but flag big rooftop equipment you see.
