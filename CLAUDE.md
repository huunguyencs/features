# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
compsci login        # refresh AWS CodeArtifact token — required before npm install
npm run dev          # dev server at http://localhost:5173
npm run build        # production build → dist/
npm run preview      # serve dist/ at http://localhost:4173 (needed to test PWA/service worker)
npm run lint         # ESLint
npx prettier --write "src/**/*.{js,jsx,css}" "*.{js,json}"  # format all files
node generate-icons.mjs  # regenerate public/icons/*.png (pure Node, no deps)
```

> PWA install prompt and offline mode only work under `npm run preview` (or HTTPS), not `npm run dev`.

## Architecture

**Router:** `HashRouter` — all routes use `/#/path`. This is intentional so the built `dist/` works on any static host (GitHub Pages, local filesystem) without server config.

**Layout:** `src/components/Layout.jsx` wraps all tool routes with a collapsible sidebar. Collapsed state is persisted to `localStorage` under `sidebar-collapsed`.

**Adding a tool:**
1. Create `src/tools/YourTool.jsx`
2. Add a route in `src/App.jsx`
3. Add an entry (path + label + inline SVG icon) to the `tools` array in `src/components/Sidebar.jsx`

**Styling system** — use these Tailwind component classes defined in `src/index.css` instead of raw utilities:
- `.tool-card` — card container
- `.tool-input` / `.tool-textarea` — form controls
- `.output-block` — monospace read-only output
- `.btn-primary` / `.btn-secondary` — buttons
- `.tool-label` — form labels
- `.badge-valid` / `.badge-invalid` — status badges

**Custom Tailwind color tokens** (defined in `tailwind.config.js`):
- `surface-base` / `surface-raised` / `surface-overlay` — background layers
- `accent-primary` / `accent-hover` / `accent-muted` — indigo accent
- `text-primary` / `text-secondary` / `text-muted` — text hierarchy

**PWA:** `vite-plugin-pwa` with Workbox `generateSW` mode. `base` in `vite.config.js` is set to `"/features/"` to match the GitHub Pages deployment path — update this if the repo name changes. The `start_url` in the manifest must match `base`.

**Deployment:** GitHub Actions workflow at `.github/workflows/deploy.yml` builds on push to `master` and deploys `dist/` to GitHub Pages via `actions/deploy-pages`.

**URL Shortener storage:** short ID → original URL map lives in `localStorage` under `devtools-url-map`. Short links only resolve in the same browser. The redirect route is `/#/r/:shortId` handled by `src/tools/RedirectHandler.jsx`.

**Hash Generator** requires a secure context (`window.isSecureContext`). It renders an error state on plain HTTP — works on localhost and HTTPS only.
