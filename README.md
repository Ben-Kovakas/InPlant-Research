# In-Planted — Climate-Resilient ATL

An interactive web app built with **Vite + React + Three.js** for the *Play with
Purpose 4* hackathon. It turns a commercial building owner's retrofit intent into
a **city-ready proposal** — using **Ansley Mall** (Selig Enterprises) as the hero
case. This repo also includes the project write-ups (the `.md` files) describing
the architecture and analysis behind the app.

**The build follows `Play with Purpose-4.pdf` as the source of truth.** Two roles,
one journey:

- **Owner / Asset Manager** (primary user) → `Login → Owner workspace`: see the
  building **baseline** (ENERGY STAR 63 vs the 75 threshold), toggle retrofit
  **interventions** on the live 3D twin and watch the **5 key numbers** re-price
  instantly (kWh/yr, capex range, payback band, gallons/yr + % of the 1″ storm,
  CO₂), compare **packages A/B/C**, and **export a Retrofit Action Dossier**
  (in-browser HTML → Print/Save-as-PDF).
- **City of Atlanta — Mayor's Office** (secondary user) → `Login → City dashboard`:
  a **Climate Contribution Ledger** showing how the retrofit contributes toward
  codified city goals (59%-by-2030 / net-zero-2050, 100% clean energy by 2035,
  the 1″ stormwater GI target), current applications, and proactive measures.

> Front-end only for the demo: a **mock API layer** (`src/api/mockApi.js`) mirrors
> the planned REST contract (`contracts/03_api-endpoints.md`) and runs the shared
> **scoring engine** (`src/engine/`) over the committed `ansley-mall.json` fixture,
> so it can be swapped for a real backend later with no view changes. Login is a
> mock role-switch (no passwords); per-user toggle config persists in localStorage.

---

## 🚀 Quick start (plug & play)

You only need **Node.js installed** — npm comes bundled with it.

```bash
# 1. Clone the repo
git clone <repo-url>
cd visualDemo

# 2. Install the exact same dependencies the author uses
npm install

# 3. Run the app
npm run dev
```

`npm run dev` opens the app automatically at **http://localhost:5173**.

> **How this works:** `npm install` reads `package-lock.json` and installs the
> *exact* versions of every dependency. Everyone gets an identical setup — the
> JavaScript equivalent of `poetry install`. No global tools to install.

---

## 📋 Requirements

- **Node.js 18 or newer** (the author runs Node 24 — see `.nvmrc`).
  - Check yours: `node -v`
  - Don't have it? Download from [nodejs.org](https://nodejs.org) (LTS is fine).
  - Using [nvm](https://github.com/nvm-sh/nvm)? Just run `nvm use` in this folder.

---

## 🛠️ Available commands

| Command | What it does |
|---|---|
| `npm install` | Installs all dependencies (run this once after cloning) |
| `npm run dev` | Starts the dev server with hot-reload at `localhost:5173` |
| `npm run build` | Builds a production bundle into `dist/` |
| `npm run preview` | Serves the production build locally to preview it |

---

## 📁 What's in here

```
visualDemo/
├── src/                         # React + Three.js app
│   ├── App.jsx                  # Router root (login / owner / city / dossier)
│   ├── main.jsx                 # React entry point (+ styles/tokens.css)
│   ├── state/AppContext.jsx     # Shared store + dependency-free router + role/session
│   ├── api/mockApi.js           # Mock "backend" (mirrors contracts/03 REST surface)
│   ├── engine/                  # Scoring engine: interventions, scoring, packages
│   ├── lib/format.js            # Shared number/unit formatting
│   ├── components/TwinCanvas.jsx# Controlled 3D twin (props: activeLayers, sunT…)
│   ├── views/                   # Login, owner/, city/, dossier/
│   ├── AnsleyApp.jsx            # Original full-screen 3D twin (TwinCanvas ported from it)
│   ├── legacy/Lot0427App.jsx    # Older Lot 0427 demo (preserved)
│   └── data/buildings/          # Building fixtures (e.g. ansley-mall.json)
├── ImplementationPlan/          # ★ Authoritative planning base (start at 00_README.md)
├── contracts/                   # Domain types, engine/API contracts, JSON schemas
├── pipeline/                    # Python offline data pipeline (geocode, solar) → JSON
├── spec-driven/                 # Backend architecture spec
├── ArchitectureCodeResearchAgents/  # ExecutiveSummary.md (research synthesis)
├── archive/                     # Superseded legacy research (grep can skip)
├── index.html                   # Vite HTML shell
├── vite.config.js               # Vite + React config (dev server on port 5173)
├── package.json                 # Dependencies + scripts
└── package-lock.json            # Locks exact versions for reproducible installs
```

> **`npm run dev` opens the role-select login.** Pick *Building Owner* for the
> main journey, or *City of Atlanta* for the Side-B dashboard. The original
> full-screen twin lives in `src/AnsleyApp.jsx`; the Lot 0427 demo is preserved in
> `src/legacy/Lot0427App.jsx`.

---

## 🧰 Troubleshooting

- **`npm: command not found`** → Node isn't installed. See Requirements above.
- **Port 5173 already in use** → stop whatever is using it, or edit the `port`
  in `vite.config.js`.
- **Weird install errors** → delete `node_modules/` and `package-lock.json`,
  then run `npm install` again.
