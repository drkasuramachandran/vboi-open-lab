# VBOI — Virtual Biomedical Optical Instrument · PRD

## Original problem statement
Build a professional web application called **VBOI — Virtual Biomedical Optical Instrument**, a biomedical optics teaching and portfolio platform. Full 12-module scaffold, mock data, client-side approximations. Frontend-only (React + Tailwind + Recharts), no backend/DB/auth. Deep teal + amber accent, clinical/professional design.

## User personas
- **Student / TA**: needs an interactive playground for biomedical optics concepts (Beer–Lambert, thin-lens, Gaussian beam, PSFs, Raman, OCT).
- **Instructor**: needs a way to demo each station live and have students compile snapshots into a report.
- **Portfolio builder**: composes a "virtual instrument" from module outputs and exports a printable/JSON report.

## Architecture (v1)
- **Stack**: React 19 + Tailwind 3 + Recharts 3 + Radix UI (shadcn) + sonner + framer-motion.
- **Routing**: React Router v7. All modules under `/modules/*`.
- **State**: `InstrumentContext` persists `{results, selected, projectName}` to `localStorage` (key `vboi.instrument.v1`).
- **Shared components**: `ModuleShell`, `ParameterSlider`, `ResultChart`, `ImageViewer`, `UploadDropzone`, `Sidebar`, `Layout`.
- **Design system**: HSL tokens (deep teal primary, amber accent), IBM Plex Sans/Mono + Sora, grid-dot background, scanline overlays.

## Core requirements (static)
- 12 module pages, each with title + explainer + interactive controls + chart/visual + "Save to My Instrument".
- Persistent "My Instrument" running across sessions (localStorage).
- Client-side formulas only. Uploads accepted (CSV, JSON, PNG) with sample data fallbacks.
- Print-to-PDF + JSON export from Report Generator.
- No backend, no auth, no DB.

## What's been implemented (2026-02)
- **M01 Fundamentals** — Beer–Lambert penetration depth with 3 sliders (preset-hydratable).
- **M02 Lens & Ray Tracing** — Real ABCD-matrix trace + 3rd-order aberration model (spherical, coma, astigmatism); sliders auto-restore from preset.
- **M03 Beam Propagation** — Gaussian w(z) chart; gallery accepts PNG + `.npy` (2D, C/F order, f4/f8/i2/i4/u1/u2); **Field-Map Cross-Section** panel line-outs any NPY along row or column.
- **M04 Fiber Optic Probe** — NA/core/wd sliders (preset-hydratable) + SVG probe schematic.
- **M05 Microscope & Confocal** — Widefield vs confocal PSF toggle (preset-hydratable).
- **M06 Raman Analyzer** — AsLS baseline + pseudo-Voigt peak fit (preset-hydratable).
- **M07 OCT Viewer** — Sample B-scan + real CSV → matrix rendered on canvas + column scrubber.
- **M08 Image Processing** — Canvas grayscale/threshold/Sobel edge (preset-hydratable).
- **M09 SIM Demonstrator** — Widefield vs SIM comparison canvases.
- **M10 System Builder** — Checkbox aggregation + compile.
- **M11 Results Dashboard** — Grouped snapshots + **CSV download per card** + delete/clear.
- **M12 Report Generator** — Printable report + JSON export.
- **Shareable Instrument Link** — URL-safe base64 encoding + QR code + auto-import on visit.
- **Instrument Presets** — Fluorescence Confocal / Handheld Raman / Portable OCT one-click builds that hydrate module sliders via `useModulePrefill`.
- **Instructor Mode** — Sidebar toggle locks all main-content interactivity + shows sticky read-only banner; sidebar stays interactive.
- **Home** — Hero, presets, system-overview pipeline, 12-module grid.
- **Sidebar** — 4 grouped sections, saved counter, share, lock.
- **Persistence** — verified via localStorage across reload; lock is session-only by design.

## Testing status
Frontend end-to-end tested via testing subagent (iteration_1): 100% pass. No console errors; all 12 modules + save/load/delete/export flows verified.

## Prioritized backlog

### P0 (next few asks — the whole point of the scaffold)
- Replace mock ray-trace with real thin-lens + ABCD matrix formula.
- OCT: parse uploaded A-scan CSV into a rendered B-scan (row-by-row).
- Beam: parse & render an uploaded MEEP field CSV/NPY instead of just showing an image.
- Raman: add proper baseline (asymmetric least-squares) & Voigt peak fit.

### P1
- Per-module JSON export/import so a snapshot can be shared standalone.
- Fiber probe: illumination pattern preview on a synthetic tissue phantom.
- Microscope: full 3D PSF cross-section + Airy disk overlay.
- Cursor-driven measurement tool on OCT B-scan.

### P2
- Dark mode.
- Cloud sync (would require adding a backend — currently deferred by spec).
- Multi-instrument projects (rename + switch active instrument).

## Key files
- `/app/frontend/src/App.js` — router
- `/app/frontend/src/context/InstrumentContext.jsx` — global state
- `/app/frontend/src/lib/moduleConfig.js` — module registry
- `/app/frontend/src/components/{Sidebar,Layout,ModuleShell,ParameterSlider,ResultChart,ImageViewer,UploadDropzone}.jsx`
- `/app/frontend/src/pages/*.jsx` — 12 modules + Home + Results + Report
- `/app/frontend/src/constants/testIds/vboi.js` — data-testid catalogue
