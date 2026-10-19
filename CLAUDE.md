# ReLeaf: context for Claude

## What this is
ReLeaf is a satellite-imagery deforestation-monitoring website, mainly for NGOs, usable for any region in the world.
- Core shell: draw a region on a map, get a forest summary, download a one-click PDF report.
- USP 1: "What replaced the forest", showing the land cover that appeared after forest loss.
- USP 2: Planted-tree growth tracker, showing vegetation-index trends over a plantation area.
- Goal: a complete, deployed build by December 2026.

## Stack
- Backend: Python, FastAPI, Google Earth Engine (`earthengine-api`), registered as a noncommercial Cloud project.
- Frontend: React (Vite) and Leaflet.
- Data: Hansen Global Forest Change (use the newest version in the Earth Engine catalog, currently `UMD/hansen/global_forest_change_2025_v1_13` or later). Dynamic World for land cover; WRI/Google DeepMind drivers (1 km) as a cause hint. Later: Sentinel-2 + Cloud Score+.
- No LLM in the core shell. Any later LLM may only word computed numbers; API keys stay in the backend.

## How I want to work (important)
- I'm building this myself to learn, the way a software engineer would. **Do not write whole features for me.**
- Act as a pair programmer and reviewer:
  - explain concepts
  - point out bugs and say why they happen
  - suggest approaches
  - review my code
  - give small snippets only when I ask
- Prefer asking me guiding questions over handing me answers.
- When giving how-to steps, prefer GUI/website routes (VS Code panels, GitHub website) over terminal commands where practical.
- Workflow:
  - one GitHub Issue per task
  - one branch per issue
  - small commits
  - a pull request I merge myself

## Milestones
- [ ] M0: Set up the repo with `backend/` (FastAPI) and `frontend/` (Vite React), both running locally.
- [ ] M1: Set up Earth Engine access, with a script that prints tree cover at one point.
- [ ] M2: Build a Leaflet map with a satellite basemap, where drawing a polygon sends it to the backend.
- [ ] M3: Add an analysis endpoint returning forest area in 2000 and loss by year (Hansen), a likely-driver hint (WRI/GDM drivers 1 km) and before/after images.
- [ ] M4: Add a results panel, a forest-loss map layer with a 2001–2025 year slider, and a "Land cover now" tab (Dynamic World).
- [ ] M5: Add one-click PDF report export.
- [ ] M6: Deploy, so there is a live link.
- [ ] Then: USP 1, followed by USP 2.

## Current status
M0 in progress (Oct 19, 2026). Plan: docs/BUILD_PLAN.md
