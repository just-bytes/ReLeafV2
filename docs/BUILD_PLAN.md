# ReLeaf build plan (from scratch, Oct 19 → Dec 20, 2026)

This plan combines `CLAUDE.md` (the criteria: core shell first, then USP 1, then USP 2) with the "ReLeaf v2 build plan" PDF (the data, architecture and validation details).

> **Issue numbers below are planning labels.** GitHub gives issues and PRs numbers from one shared sequence, so the real issue numbers won't match. Go by the titles.

---

## 1. Decisions (and where this plan differs from the PDF)

| Topic | Decision | Why |
|---|---|---|
| Order of work | **Core shell end to end first** (M0–M6), then USP 1, then USP 2 | Following `CLAUDE.md`. The PDF prototypes everything in Colab before writing any web code. Here you get a deployed site by mid-November, and the hard data science goes into a working skeleton. |
| Frontend | **React (Vite) + react-leaflet + Leaflet-Geoman (free)** | `CLAUDE.md` says React. The PDF uses plain HTML. Its reasons for **Geoman over leaflet-draw** still apply, because leaflet-draw is largely unmaintained. |
| Forest data | **`UMD/hansen/global_forest_change_2025_v1_13`** | I checked the Earth Engine catalog: it covers 2000–2025, and `lossyear` runs from 1 to 25. Update `CLAUDE.md`, which still says v1.12. |
| Earth Engine tier | Start on the **Community tier** (150 EECU-hours a month, no billing account). Move to **Contributor** (1,000 EECU-hours, billing account required) before you deploy (M6). | Development of the core shell uses very little compute. This puts the billing-account question (a parent's or guardian's account) off until it actually matters. |
| Hosting | **Google Cloud Run** in the same Cloud project, deployed from GitHub through the Console. Fallback: Render free tier. | Signs in to Earth Engine without a key file, scales to zero, and has a free tier. |
| PDF | Jinja2 HTML → **WeasyPrint**, built and tested **inside Docker** | WeasyPrint needs the Pango libraries, which are hard to install on Windows. Decide at M5 (see Risks). |
| Prototyping | Colab + `geemap` notebooks **alongside** the build, not ahead of it | Use them to try out Earth Engine logic (M1, M3, USP 1) before moving it into `backend/`. |
| Storage | No database. Cache results in memory, keyed by a hash of the area. | As the PDF recommends. The free database options pause or expire. |
| Land classification | **Dynamic World** (9 classes, 10 m, global, 2015 onward) instead of training a model | Old ReLeaf's U-Net (6 classes, Kaggle data, no measured accuracy) only worked on uploaded images. Dynamic World covers the whole planet and has a published accuracy. Custom ML comes after December. |
| Cause of loss | **WRI/Google DeepMind drivers dataset** (1 km, 91% accuracy) shown as a hint, never as per-pixel truth | Free inside Earth Engine, so no API key is needed |
| LLM / API keys | **Not in the core shell.** Later, optionally, for *wording* a summary from computed numbers, with a check that every number appears in the data and a template fallback | An LLM can't see satellite pixels, so it would make up causes. Keys only ever live in the backend (`.env` locally, Secret Manager on Cloud Run). |

### Versions checked today (pin these)
- Node 26.2 / npm 11.13 · Python 3.14.5 · Git 2.54 · VS Code 1.140 (all already installed)
- npm: `vite` 8.3, `react` 19.3, `leaflet` **1.9.4**, `react-leaflet` 5.0, `@geoman-io/leaflet-geoman-free` 2.20, `react-leaflet-geoman-v2` 1.1 (works with React 19 and react-leaflet 5)
- PyPI: `fastapi` 0.147, `uvicorn` 0.54, `earthengine-api` 1.7.48, `weasyprint` 70.0
- ⚠️ Stay on Leaflet **1.x**: Geoman 2.x does not support Leaflet 2.
- ⚠️ Use the same Python minor version in Docker (`python:3.14-slim`) as you use locally.

---

## 2. Repo layout (target)

```
releaf/
├── backend/          FastAPI app (main.py, routers/, services/ee_*.py, requirements.txt)
├── frontend/         Vite React app (src/components/Map…, src/api.js)
├── notebooks/        Colab / geemap experiments
├── docs/             BUILD_PLAN.md, validation.md, architecture notes
├── data/test_sites/  GeoJSON for fixed test areas
├── README.md  LICENSE  .gitignore  CLAUDE.md
```

The PDF's `releaf/` Python package becomes `backend/services/`. Keep Earth Engine logic in **pure functions** (input: geometry and dates, output: a dict) so you can call them from FastAPI, notebooks and tests.

---

## 3. Workflow (every task)
1. Open an issue on GitHub (website), with a "Done when" checklist.
2. Create a branch from the issue (issue sidebar → "Create a branch"), then check it out in VS Code (status bar branch picker).
3. Make small commits from the VS Code Source Control panel.
4. Open a PR on GitHub, write `Closes #N`, review the diff yourself (and ask me to review), then merge.
5. Pull `main` in VS Code (Source Control → … → Pull).

---

## 4. Phases and sessions

About 5 sessions a week of 2–3 hours each. Each phase ends with a buffer session.

### Phase A: Core shell (Oct 19 → Nov 17)

**What the core shell analyses for a drawn polygon:**
| # | Analysis | Dataset | Milestone |
|---|---|---|---|
| 1 | Forest area in 2000 (ha) | Hansen v1.13 | M3 |
| 2 | Loss per year 2001–2025 (ha) + bar chart | Hansen `lossyear` | M3 / M4 |
| 3 | Total loss (ha, % of 2000 forest) | Hansen | M3 |
| 4 | Loss map layer coloured by year | Hansen | M4 |
| 5 | Year slider: cumulative loss up to year X | Hansen `lossyear ≤ X` | M4 |
| 6 | Likely driver of loss (hint) | WRI/GDM drivers 1 km | M3 / M4 |
| 7 | Before/after images (about 2000 vs 2025) | Hansen `first_*` / `last_*` bands | M3 / M4 |
| 8 | Land cover now, whole polygon (% per class + map) | Dynamic World | M4 |

Hansen is **one image** whose `lossyear` band stores the year each pixel was lost (1 = 2001 … 25 = 2025, 0 = never). So "every year" comes from a single dataset, not 25 separate ones.

**M0: Repo and both apps running locally (Oct 19–21)**
| Issue | Done when |
|---|---|
| #1 Create the repo and the base files | The repo is on GitHub with README, LICENSE and a `.gitignore` covering both Python **and** Node (`node_modules/`, `.venv/`, `dist/`, `.env`); `CLAUDE.md` and this plan are committed |
| #2 Backend skeleton | `backend/` has a virtual environment and `requirements.txt`; `GET /health` returns JSON; `/docs` opens in the browser |
| #3 Frontend skeleton | A Vite React app runs at `localhost:5173` and shows a "ReLeaf" heading |
| #4 Frontend talks to backend | The page shows the result of `/health` (you will run into CORS here, and that's on purpose); use a Vite proxy *or* FastAPI CORS middleware, and be able to explain why you picked it |

**M1: Earth Engine access (Oct 22–24)**
| Issue | Done when |
|---|---|
| #5 Cloud project and EE registration | In the Cloud Console (web): project `releaf-…` created, registered for **noncommercial** Earth Engine, EE API enabled, Community tier selected |
| #6 Local authentication | `earthengine authenticate` (one-time, opens the browser) works; `ee.Initialize(project=…)` runs in a script |
| #7 Tree cover at one point | `backend/scripts/point_check.py` prints `treecover2000` for a lat/lon you choose, and the value matches what the EE Code Editor's Inspector shows at that point |

**M2: Map and drawing (Oct 25–29)**
| Issue | Done when |
|---|---|
| #8 Leaflet map with satellite basemap | Full-screen map, Esri World Imagery basemap with attribution |
| #9 Draw a polygon | The Geoman toolbar is limited to polygon and rectangle; you can get the drawn shape as GeoJSON in React state |
| #10 Send it to the backend | `POST /api/analyze` takes a GeoJSON geometry (validated with Pydantic) and the backend logs or echoes it back |
| #11 Area guardrail | Area is computed and anything above the cap (start at about 50,000 ha) is rejected with a clear message, both in the browser **and** on the server |

**M3: Analysis endpoint (Oct 30 → Nov 5)**
| Issue | Done when |
|---|---|
| #12 Hansen in a notebook | For one test site: forest area in 2000 (`treecover2000 ≥ 30`, `datamask == 1`) and loss hectares per year (`lossyear` 1–25, `ee.Image.pixelArea()`) |
| #13 Move it into a pure function | `services/forest.py` takes a geometry and returns a dict; there is one `reduceRegion` call per statistic, at scale 30 |
| #14 Wire it into the endpoint | `/api/analyze` returns `{forest_2000_ha, loss_by_year: {...}, total_loss_ha, loss_pct}` for a drawn polygon |
| #15 Sanity check | The numbers are close to Global Nature Watch figures for the same area (note how far off they are and explain why) |
| #15a Likely driver hint | `services/drivers.py` returns the main driver class(es) of loss inside the polygon from the WRI/Google DeepMind drivers dataset (`projects/landandcarbon/assets/wri_gdm_drivers_forest_loss_1km/v1_2_2001_2024`), as % of loss area per driver. The response is labelled "1 km context, not per-pixel". |
| #15b Before/after images | Thumbnail URLs for around 2000 and around 2025 true colour, taken from Hansen's own `first_*` / `last_*` Landsat bands (no extra imagery processing) |

**M4: Results panel, map layers and year slider (Nov 6–12)**
| Issue | Done when |
|---|---|
| #16 Results panel | Key numbers plus a loss-by-year bar chart (Chart.js or Recharts), the driver hint line, and before/after images side by side |
| #17 Loss tile layer | The backend returns a `getMapId` tile URL with loss coloured by year, and the frontend adds it as a toggleable layer |
| #17a Year slider | A slider from 2001 to 2025 shows cumulative loss up to the chosen year (`lossyear ≤ X`). The backend serves a tile URL per year; the frontend debounces slider changes and caches URLs it has already fetched |
| #17b Land cover now | A "Land cover" tab: Dynamic World (`GOOGLE/DYNAMICWORLD/V1`) mode label over the last ~6 months of clear images for the **whole polygon** → % per class (9 classes) as a table/donut chart, plus a coloured class layer with a legend. A note shows Dynamic World's published accuracy (73.8% overall) |
| #18 UX states | Loading spinner, readable errors, and the caveat "tree cover loss ≠ deforestation" |

**M5: One-click PDF (Nov 13–17)**
| Issue | Done when |
|---|---|
| #19 Report template | A Jinja2 HTML page shows cover, key numbers, map image, loss chart, before/after images, driver hint, land cover breakdown, caveats and dataset credits (Hansen/UMD, WRI/GDM drivers, Dynamic World: all CC-BY-4.0) |
| #20 Images | The backend downloads `getThumbURL` PNGs and embeds them as base64 (the URLs expire), and draws the chart with matplotlib |
| #21 PDF endpoint and button | `GET /api/report/{id}.pdf` and a "Download PDF" button; it works for 3 test areas |

### Phase B: Deploy (Nov 18 → 22)

**M6: Live link**
| Issue | Done when |
|---|---|
| #22 Dockerfile | `python:3.14-slim` + Pango; FastAPI also serves the built frontend; the container runs locally |
| #23 Guardrails | Contributor tier set up (billing account linked), **$1 budget alert**, daily EECU cap, Cloud Run max instances set to 2 |
| #24 Cloud Run deploy | Console → "Continuously deploy from a repository"; a service account with *Earth Engine Resource Viewer* + *Service Usage Consumer*; 2 GiB memory; **no key file in the repo** |
| #25 Live test and README | 5 areas work on the public URL; README has a screenshot and data credits → **🎉 Core shell shipped** |

### After M6, before USP 1 (only if ahead of schedule)
- Year slider for **land cover** (Dynamic World, 2016–2025)
- Year slider for **real satellite imagery** (Landsat 2001–2016 + Sentinel-2 2017 onward, annual composites). This is heavier on EECU, so measure the cost first.
- Place name for the polygon through free reverse geocoding (OpenStreetMap Nominatim, no key)

### Phase C: USP 1, "What replaced the forest" (Nov 23 → Dec 6)
The PDF's Feature 1, cut down to fit the time left. It builds on #15a (drivers) and #17b (Dynamic World) from the core shell; USP 1 applies them **only to the lost pixels**, adds the corrections, and measures accuracy.
1. Shared imagery helper: Sentinel-2 `S2_SR_HARMONIZED` with Cloud Score+ `cs_cdf ≥ 0.6` (never QA60), plus before/after true-colour chips.
2. "What it is now": Dynamic World class probabilities averaged over 3–6 months; take the top class if its probability is ≥ 0.5, otherwise "uncertain"; mark loss within about a year of the end date "too recent".
3. Overrides, **core set only**: mining polygons, ForTy / FDaP plantations, and the 1 km drivers map as context. (Pasture Watch, MapBiomas and JRC TMF go to v2.1.)
4. Endpoint, results panel ("hectares and % by class" plus a "replaced by" layer), and a PDF section.
5. **Validation (don't cut this):** about 150 labelled points over 2–4 test sites → confusion matrix in `docs/validation.md`.

### Phase D: USP 2, Growth tracker (Dec 7 → 16)
1. Per-plot NDVI time series (Sentinel-2 + Cloud Score+, dry-season composites), with a baseline before planting.
2. Control ring + reference forest → recovery score; years 0–2 show **"too young to see"**.
3. Endpoint, chart and PDF section. One plot at a time (multi-plot upload is a stretch goal).

### Phase E: Release (Dec 17 → 20)
pytest for geometry checks and parsing (with mocked Earth Engine), GitHub Actions, docs, a `v2.0.0` release, and a demo video.

---

## 5. Cut list (cut in this order if you fall behind)
1. Multi-plot growth tracker → one plot at a time
2. Provisional 2026 loss (Dynamic World drop / RADD) → limit to 2001–2025
3. Core-shell extras (#17a year slider, #17b land cover tab) → static loss layer only
4. Secondary overrides → keep mining + plantations + drivers only
5. KML/SHP upload → drawing and GeoJSON only
6. CI → run tests by hand

**Never cut:** cost guardrails (#23), the "loss ≠ deforestation" honesty notes, or USP 1 validation.

---

## 6. Risks and open questions
- **Billing account (by M6):** Cloud Run and the Contributor tier both need one. Check whether you can hold one yourself or need a parent's or guardian's. Community tier is enough until then.
- **WeasyPrint on Windows:** it needs Pango. Options at M5: (a) build and test PDFs only inside Docker (Docker Desktop + WSL2), (b) MSYS2 Pango, (c) switch to ReportLab, which is pure Python but has more layout code. Recommendation: (a), since you need Docker for M6 anyway.
- **Earth Engine timeouts on large areas:** area cap, `tileScale`, `bestEffort`, caching.
- **Scope creep across datasets** is the biggest risk (the PDF's own conclusion). Ship the core shell before touching USP data.

## 7. After December
Partner-tier application, AlphaEarth classifier (v2.1), plantation vs natural classifier, drone tree counting, cloud-masking research. See PDF section 9.
