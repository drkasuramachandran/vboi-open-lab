# VBOI Open Lab — Migration Status

## Completed in this migration pass

1. Created an independent project copy from the supplied Emergent ZIP.
2. Replaced Create React App/CRACO scripts with Vite.
3. Added a Vite React entry point (`src/main.jsx`).
4. Moved the HTML entry point to the Vite project root.
5. Removed Emergent bootstrap/analytics scripts from the HTML.
6. Removed the Emergent visual-editing dependency and CRACO configuration.
7. Removed the Emergent backend/MongoDB scaffold from the standalone copy.
8. Updated Tailwind's HTML content path for the Vite layout.
9. Removed the old React Query provider because the current application does not use React Query outside the entry point.
10. Added standalone project documentation and deployment notes.

## Not yet completed

- `npm install` / production build verification could not be completed in the migration environment because npm dependency installation did not finish within the available execution window.
- Browser-level regression testing has not yet been run against the Vite build.
- Dependency minimization beyond the obvious legacy packages should be done after the first successful install/build.
- Scientific-engine extraction and Python/FastAPI services remain Phase 2/3 work.

## First local verification

From `frontend/`:

```bash
npm install
npm run dev
```

Then test each route listed in `src/App.js`.

For a production check:

```bash
npm run build
npm run preview
```
