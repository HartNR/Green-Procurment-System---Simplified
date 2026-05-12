# Green Procurement System (Simplified)

This folder is a **static** HTML/CSS/JS recreation of the Green Procurement System UI.

It is designed to run entirely in the browser with no backend required. The app uses `localStorage` for persistence and a simple page shell + client-side router pattern to render the dashboard, procurement log, supplier profiles, data modification form, and GPPB reference.

## How to run

- Open `index.html` in your browser.
- Alternatively, open any of the page shells directly:
  - `procurement-log.html`
  - `suppliers.html`
  - `modify-data.html`
  - `gppb-reference.html`

## App structure

### Shared files

- `app.js`
  - Central application logic and state management.
  - Handles routing between pages, rendering page content into `#view-root`, shared page metadata, search, table rendering, and data persistence.
  - Contains the procurement export/import behavior, green status classification logic, and utility helpers.
- `styles.css`
  - Global layout and shared styling for the app shell, sidebar, buttons, typography, tables, badges, and responsive behavior.
- `GPC.png`, `gang-logo.svg`
  - Brand assets used in the header and sidebar.
- `server/`
  - Currently empty. No backend server code is included in this simplified static version.

### Pages and page-specific code

#### Dashboard
- `index.html`
  - Shell page that loads the app layout and sets the forced route to the dashboard.
- `dashboard.css`
  - Page-specific styling for dashboard widgets, summary cards, charts, and cards.
- `dashboard.js`
  - Dashboard rendering and chart binding logic.

#### Procurement Log
- `procurement-log.html`
  - Shell page for the procurement log UI.
  - Loads the page-specific stylesheet and required client libraries.
- `procurement-log.css`
  - Styling for procurement log layout, tables, import cards, and form fields.
- `procurement-log.js`
  - Logic for the procurement log page and hooks that integrate with `app.js`.
  - Supports Excel import, receipt OCR, acquisition logging, and search filtering.

#### Supplier Profiles
- `suppliers.html`
  - Shell page for supplier management.
- `suppliers.css`
  - Styling for supplier tables and profile cards.
- `suppliers.js`
  - Supplier page rendering and supplier profile logic.

#### Modify Data
- `modify-data.html`
  - Shell page for editing or resetting sample data.
- `modify-data.css`
  - Styling for the modify-data page and form layout.
- `modify-data.js`
  - Data editing utilities, reset functions, and sample-data injection.

#### GPPB Reference
- `gppb-reference.html`
  - Shell page for the GPPB reference section.
- `gppb-reference.css`
  - Styling for the reference page content.
- `gppb-reference.js`
  - Static reference content and any page-specific interactions.

## Data persistence

- Data is stored in browser `localStorage` under the key:
  - `gps_simplified_v1`
- To inspect or edit the app data manually:
  - Chrome/Edge: `F12` → **Application** → **Local Storage** → your site → `gps_simplified_v1`
  - Console commands:
    - `JSON.parse(localStorage.getItem("gps_simplified_v1"))`
    - `localStorage.setItem("gps_simplified_v1", JSON.stringify(...))`

## What each major file controls

- `index.html` — dashboard shell and app entry point.
- `procurement-log.html` — procurement log entry point with import/export and OCR support.
- `suppliers.html` — supplier management shell.
- `modify-data.html` — data modification shell.
- `gppb-reference.html` — reference content shell.
- `app.js` — shared state, routing, rendering, and most of the app logic.
- `styles.css` — shared layout and theme styling.
- `*.css` files per page — page-specific appearance.
- `*.js` files per page — page-specific render and behavior hooks.

## Notes for editors

- If you want to change the main app flow, edit `app.js`.
- If you want to adjust the overall layout, theme, or shared controls, edit `styles.css`.
- If you want to update a page shell or navigation entry, edit the corresponding HTML file and its page-specific CSS/JS.
- The procurement log export button and Excel export logic are implemented in `app.js` but are rendered inside `procurement-log.html`.

## Dependencies

- `xlsx` library is loaded in `procurement-log.html` for Excel import/export.
- `tesseract.js` is loaded in `procurement-log.html` for receipt OCR.

## Recommended edit path

1. Open the relevant `.html` shell page in your editor.
2. Update the page-specific `.js` file for page behavior.
3. Update page-specific `.css` for styling changes.
4. Use `app.js` for shared page logic, routing, or persistence changes.

## Helpful shortcuts

- To return to the dashboard from any page, open `index.html`.
- To view the procurement history page directly, open `procurement-log.html`.
- To inspect and edit saved browser data, use `localStorage` as described above.

