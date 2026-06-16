# pipeline — calculation workers

Python calc workers for **In-Planted / Climate Resilient ATL**. Each worker reads a
`Building` JSON fixture, runs a real engineering model, and emits a canonical
`WorkerResult<TResult>` (see `contracts/HANDSHAKE.md` §3.7) as camelCase JSON. The JS
scoring engine / 3D twin consumes that JSON.

Currently shipped: **`workers/solar_pysam.py`** — the rooftop-solar worker.

---

## solar_pysam.py

Emits a canonical `WorkerResult<SolarResult>` for a building's roof PV.

### What it does
1. Loads a `Building` JSON (default: the Ansley Mall fixture) and selects a roof
   `CandidateSurface` (default: the first `type: "roof"` surface).
2. Computes `systemCapacityKwDc` from usable roof area:
   `areaM2 × 0.15 kW/m² × 0.70 packing` — unless `--capacity-kw` overrides it
   (e.g. pass Google's modeled **1836** kW DC).
3. Runs the **fidelity ladder** (architecture/02 §1.1) to get `acAnnualKwh`,
   `acMonthlyKwh[12]`, `capacityFactor`:
   - **Tier 1 (preferred):** NREL SAM via **`PySAM.Pvwattsv8`** with tilt / azimuth /
     losses / array_type / module_type from assumptions and lat/lon from the building.
   - **Tier 0 (a):** live **NREL PVWatts v8 HTTP** call — used only if PySAM is missing
     **and** BOTH `NREL_API_KEY` and `NREL_API_BASE` are set. ⚠️ **Security:** the worker
     has **no default endpoint** — it will not send your key to any domain the code chose.
     You must set `NREL_API_BASE` to an endpoint you have **personally verified as official
     NREL** (the long-established host is `developer.nrel.gov`). Earlier project notes
     referenced `developer.nlr.gov` as a "moved" domain — that is **unverified** and
     resembles a typosquat; do not send a credential there without confirming it.
   - **Tier 0 (b):** documented **closed-form** PVWatts-style estimate using an Atlanta
     specific-yield constant (**1,300 kWh/kWp/yr**; NREL PVWatts/NSRDB TMY regional,
     ~14% losses) — always available.
4. Computes `co2AvoidedTonsYr = acAnnualKwh × gridFactorKgPerKwh / 1000`
   (default grid factor **0.3837** kg CO₂/kWh — EPA eGRID2023 Rev 2, SRSO).
5. Writes the `WorkerResult<SolarResult>` to stdout **and** `--out`
   (default `pipeline/out/ansley-mall-solar.json`), with `provenance.tier = "modeled"`
   and `provenance.source/method` reflecting which path ran, plus an `inputHash`
   (`sha256:…`) for the content-addressed result cache (architecture/03).

### Graceful fallback (important)
The `PySAM` import is wrapped. **The script always runs and always emits valid JSON**,
even with PySAM not installed and no network. Which path produced the number is visible
in `provenance.source` / `provenance.method` and in `warnings[]`. In this repo's
environment PySAM is not installed, so the **closed-form Tier-0(b)** path runs by default.

### Setup
```bash
# Optional — enables the Tier-1 PySAM path (the bankable model):
pip install -r pipeline/requirements.txt

# Optional — enables the live PVWatts HTTP fallback when PySAM is absent.
# BOTH must be set; NREL_API_BASE must be an endpoint YOU verified as official NREL.
export NREL_API_KEY=your_key
export NREL_API_BASE=https://developer.nrel.gov/api/pvwatts/v8.json   # verify host before use
```

### Run
```bash
# Default: Ansley fixture, roof surface, capacity derived from roof area.
python3 pipeline/workers/solar_pysam.py

# Cross-check against Google's modeled 1,836 kW DC system.
python3 pipeline/workers/solar_pysam.py --capacity-kw 1836

# Different building / surface / output.
python3 pipeline/workers/solar_pysam.py \
  --building src/data/buildings/ansley-mall.json \
  --surface ansley-roof \
  --out pipeline/out/ansley-mall-solar.json
```

### CLI args
| Flag | Default | Meaning |
|---|---|---|
| `--building PATH` | `src/data/buildings/ansley-mall.json` | Building JSON to load |
| `--surface ID` | first roof surface | `CandidateSurface.id` to size against |
| `--capacity-kw KW` | derived from area | Override `systemCapacityKwDc` (e.g. `1836`) |
| `--out PATH` | `pipeline/out/ansley-mall-solar.json` | Output JSON path |
| `--grid-factor KG` | `0.3837` | Grid emission factor (kg CO₂/kWh) |
| `--quiet` | off | Suppress stdout (still writes `--out`) |

### How the output maps to the engine / twin (`interventions.roofSolar`)
The `SolarResult` fields map directly onto the building's `interventions.roofSolar`
block (and feed `BuildingTotals`):

| `SolarResult` field | `interventions.roofSolar` field | Engine use |
|---|---|---|
| `systemCapacityKwDc` | `capacityKwDc.value` | system size; `combinedSolarKwDc` |
| `acAnnualKwh` | `annualKwh.value` | `combinedAnnualKwh`; load-offset %; $ savings |
| `co2AvoidedTonsYr` | `co2TonsYr.value` | `combinedCo2TonsYr`; city-contribution carbon |
| `acMonthlyKwh[12]` | (drives the twin's sun-slider / monthly series) | `timeDependent` |
| `capacityFactor` | (QA / yield sanity check) | validation |
| `assumptions.*` + envelope `provenance` | `provenance` on each value | provenance tier |

The envelope's `inputHash` is the cache key (architecture/03): same inputs +
same `workerVersion` ⇒ identical result, so the twin can read a cached run instead
of re-computing.

### Cross-check (Ansley)
With `--capacity-kw 1836`, the worker emits **2,386,800 kWh/yr** and **915.82 t CO₂/yr**
— within ~0.4% / ~0.3% of the fixture's Google-derived 2,378,253 kWh and 913 t.
