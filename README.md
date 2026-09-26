# VBOI Open Lab Frontend

React 19 + Vite frontend for the Virtual Biomedical Optical Instruments Laboratory.

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Structure

- `src/pages/` — the 12 laboratory modules and major application pages
- `src/components/` — shared laboratory UI components
- `src/components/ui/` — reusable Radix/shadcn-style controls
- `src/context/` — instrument/results state
- `src/lib/` — scientific calculations, presets, data parsers and sharing utilities
- `src/hooks/` — reusable React hooks

The frontend is intentionally independent of Emergent and does not require a backend for its current client-side laboratory functionality.
