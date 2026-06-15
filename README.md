# Green Retrofit Demo

An interactive visual demo built with **Vite + React + Three.js**. This repo also
includes the project write-ups (the `.md` files) describing the architecture and
analysis behind the demo.

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
├── src/
│   ├── App.jsx          # The main demo component (the JSX you'll be looking at)
│   └── main.jsx         # React entry point
├── index.html           # Vite HTML shell
├── vite.config.js       # Vite + React config (dev server on port 5173)
├── package.json         # Dependencies + scripts
├── package-lock.json    # Locks exact versions for reproducible installs
├── projectSummary.md    # Project overview / write-up
└── ArchitectureCodeResearchAgents/
    ├── CaseStudy2.MD
    ├── Integration3.MD
    └── MetricValueAnalyst1.MD
```

> Note: there's a duplicate copy of the component at the repo root
> (`green-retrofit-demo (1).jsx`). The version the app actually runs is
> `src/App.jsx` — edit that one.

---

## 🧰 Troubleshooting

- **`npm: command not found`** → Node isn't installed. See Requirements above.
- **Port 5173 already in use** → stop whatever is using it, or edit the `port`
  in `vite.config.js`.
- **Weird install errors** → delete `node_modules/` and `package-lock.json`,
  then run `npm install` again.
