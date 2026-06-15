# Green Retrofit Model — Executive Summary & Project Context

> **Status:** Research / concept phase · **Context:** Active hackathon build (days-level timeline)
> **Purpose of this document:** A shared briefing to bring teammates *and* AI collaborators onto the same page about what we're building, why, and how. It precedes the formal research and exists so anyone (human or model) we hand it to can contribute without re-deriving the premise.

---

## TL;DR

We are building a **suggestive retrofit engine for cities**: a system that ingests open environmental and built-environment data for a given site, then recommends *optimal botanical and agricultural augmentations to existing architecture* — green roofs, solar arrays, shade-tolerant crop plots, vine-covered shade lattices, and similar — to address three coupled urban problems at once: **stormwater drainage, shadow/heat, and carbon emissions.**

The engine is **surfaced through an interactive 3D digital twin** of the site, so the recommendations are not just numbers but a spatial, time-aware model a person can explore (e.g. dragging the sun across the day and watching shade, solar capture, and water retention shift). A working visual prototype of this twin already exists (Atlanta "Lot 0427").

The **method is meant to generalize to any city**; for the hackathon we demonstrate it on a **specific building set in Atlanta**.

---

## The Problem (Motivation)

Dense urban areas concentrate three failures of the built environment that are usually treated in isolation but are physically entangled:

1. **Drainage / stormwater.** Impervious roofs and pavement shed rainwater fast, overwhelming sewers, causing flooding, and dumping untreated runoff into waterways. Cities have enormous *unused horizontal surface* (rooftops) that could retain and slow water.
2. **Shadow & heat (urban heat island).** Bare roofs and hardscape absorb and re-radiate heat, raising local temperatures, energy use, and health risk. The *same surfaces* that flood are also the ones baking.
3. **Carbon emissions.** Buildings are major emitters (operational energy + lack of on-site generation/sequestration). Roofs and sun-facing walls are underused for solar capture and for vegetation that sequesters carbon and cools.

**Key insight:** these three problems share a solution surface — the **underused skin of existing buildings** (roofs, sun-facing facades, perimeters). A single intervention often helps all three (a green roof retains water *and* cools *and* sequesters carbon; solar offsets emissions *and* shades). The opportunity is to **optimize what to put where**, per building, using data the city already produces.

---

## The Vision

A planner, building owner, or community group points our tool at a site. The tool:

1. Pulls the relevant data layers for that location.
2. Evaluates each candidate surface (each roof, each facade) for what intervention would help most.
3. Returns a **ranked, quantified set of suggestions** — "south & west faces: solar (est. X% capture); north roof: vegetated retention (est. Y gallons/storm); courtyard edge: shade-crop plot under louvered canopy" — and renders them on a 3D twin of the actual block.

It turns a vague "we should green our buildings" into a **specific, defensible, site-aware plan** with estimated impact on drainage, heat, and carbon.

---

## What We're Actually Building (Core Deliverable)

A **recommendation engine presented through a 3D digital twin** (a blend of "suggestion logic" + "explorable spatial model"):

- **The engine** is the intelligence: it scores candidate interventions per surface against the three objectives and produces ranked suggestions with estimated impact.
- **The twin** is the interface: a faithful, interactive 3D scene of the site where suggestions appear in place, and where time-of-day / sun-path drives live readouts (solar capture, crop shade area, roof retention).

The existing prototype (see below) is the *shape of the front end*. The hackathon work is connecting real data + suggestion logic behind it.

---

## Intervention Taxonomy (What the engine can suggest)

These are the augmentation "layers" the model reasons about. They map directly to the toggleable layers in the prototype:

| Layer | Intervention | Primarily addresses |
|---|---|---|
| **Solar** | PV arrays on sun-facing roofs & walls | Carbon (offset), heat (shading) |
| **Drainage** | Vegetated green roof for stormwater retention | Drainage, heat, carbon |
| **Agriculture** | Shade-tolerant crops under a louvered canopy | Carbon, heat, local food/value |
| **Shade lattice** | Vine-covered perimeter trellis for shaded seating | Heat, carbon, livability |

This list is a starting taxonomy, not a fixed menu — part of the research is refining which interventions to model and how to score them.

---

## How It Works (Conceptual Pipeline)

```
[ Site location ]
       │
       ▼
[ Data ingestion ]  ──  solar/irradiance · rainfall/stormwater · footprints + LiDAR/3D ·
       │                carbon & air quality · zoning/land-use · climate records ·
       │                opportunistic Google Earth / building-infra data
       ▼
[ Surface extraction ]  ──  identify each roof / facade / perimeter as a candidate surface
       │                     with geometry, orientation, and exposure
       ▼
[ Scoring / optimization ]  ──  for each surface × candidate intervention, estimate impact on
       │                        (drainage, heat, carbon); rank and resolve trade-offs
       ▼
[ Suggestions ]  ──  ranked, quantified recommendations per surface
       │
       ▼
[ 3D twin render ]  ──  interventions placed in a time-aware, explorable model
```

*The scoring/optimization stage is the research heart of the project and the least defined — see open questions.*

---

## Data Sources (Inputs)

We intend to feed the model from open and opportunistic sources:

- **Solar / sun-path & irradiance** — drives solar capture and shading estimates.
- **Rainfall / stormwater / flood data** — drives retention and drainage estimates.
- **Building footprints & 3D / LiDAR scans** — geometry of the surfaces we're augmenting.
- **Carbon emissions / air quality** — baseline to estimate offset/improvement.
- **Zoning / land-use / parcel data** — feasibility and constraints.
- **Climate / weather records** — seasonal and long-run context.
- **Google Earth & general building-infrastructure data** — any imagery or structural detail we can opportunistically exploit to characterize a site.

> **Note for AI collaborators:** part of your value here is helping identify *which specific, accessible datasets/APIs* (and their formats, resolution, licensing) best fill each row above — especially for the Atlanta demo area. Concrete source recommendations are welcome.

---

## Scope

- **Long-term:** a **generalizable, any-city framework** — the method (data → scoring → suggestions → twin) should port to any urban area with comparable open data.
- **Hackathon demo:** isolate **one specific building set in Atlanta** (the exact block is TBD) and produce a compelling end-to-end demonstration on it.
- The Atlanta site is the *instance*; the method is the *product*.

---

## What Already Exists — The Prototype

A working **Three.js / React** visual prototype renders an Atlanta lot ("Lot 0427," branded *Climate Resilient ATL*). It demonstrates the intended front-end experience:

- A scanned-looking block of buildings on a lot, re-tagged for intervention.
- Four **toggleable intervention layers**: Solar, Drainage (green roof), Agriculture (shade-crop plot), Shade lattice.
- An **interactive sun-path slider** (June 21 solstice) with play/animate, orbit, and zoom.
- **Live readouts** that respond to sun position: sun elevation, solar capture %, crop shade area (m²), roof retention (gallons).
- Floating in-scene tags labeling each intervention.

**Important caveat:** the prototype's numbers are currently **illustrative/hard-coded placeholders**, not data-driven. The hackathon goal is to replace that with real data and real suggestion logic — i.e. make the twin reflect the *engine*.

---

## What "Good" Looks Like (Hackathon Success Criteria)

- A clear, fast **problem → solution** narrative a judge grasps in under a minute.
- An **end-to-end demo** on the Atlanta site: real(ish) data in → ranked, quantified suggestions out → rendered on the twin.
- At least one intervention where the suggestion is **visibly data-driven** (e.g. solar placement that follows actual sun exposure, retention that follows actual rainfall).
- A believable story for **how it generalizes** beyond the demo block.

---

## Current Status & Open Questions (Research Phase)

**Status:** Concept + front-end prototype exist. Data integration and suggestion logic do not yet.

Open questions we want help resolving:

1. **Scoring model:** How do we quantify each intervention's impact on drainage, heat, and carbon in a way that's defensible but buildable in days? What simplifications are acceptable?
2. **Trade-offs:** When interventions compete for the same surface (solar vs. green roof on one roof), how does the engine decide / present the trade-off?
3. **Data specifics:** Which exact datasets/APIs (and at what resolution) are realistically pullable for the Atlanta demo area within the timeline?
4. **Surface extraction:** How do we get from footprints/LiDAR/imagery to a usable set of candidate surfaces with orientation and area?
5. **Demo site selection:** Which Atlanta building set best showcases all three problems and the engine's value?
6. **Validation:** What's the lightest-weight way to sanity-check our estimates so the demo is credible?

---

## How to Use This Document (Note for AI Collaborators)

If you're an AI being briefed with this file: treat it as the **shared source of truth** for intent. We are time-constrained (hackathon, days). When you help, favor **concrete, buildable recommendations** over exhaustive theory — specific datasets, specific formulas/heuristics, specific architecture choices. Flag assumptions explicitly. Where the "open questions" above are relevant to a task, propose a defensible default rather than asking us to decide everything.

---

## Glossary

- **Suggestive / recommendation engine** — the logic that *proposes* what to build where, with estimated impact (vs. a tool that only visualizes).
- **Digital twin** — an interactive 3D model mirroring a real site, used here to place and explore suggestions.
- **Retrofit / augmentation** — adding interventions to *existing* buildings rather than designing new ones.
- **Candidate surface** — any roof, facade, or perimeter the engine evaluates as a place for an intervention.
- **Green roof** — vegetated roof layer that retains stormwater, cools, and sequesters carbon.
- **Shade lattice / trellis** — a vine-covered structure providing shade and livable space.
- **Urban heat island** — localized warming from heat-absorbing urban surfaces.