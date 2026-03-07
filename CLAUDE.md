# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"인생은 이름표 붙이기 게임" — A personal PWA (Progressive Web App) running entirely in the browser. No build system, no npm, no bundler. It's a single `index.html` + plain JS files + one `style.css`. Serve locally with any static file server (e.g., `python -m http.server 8080` or VS Code Live Server).

Authentication uses Google Sign-In (GSI). On `localhost`/`127.0.0.1`, auth is bypassed automatically — no login needed for local dev.

## Architecture

All JS files are loaded as plain `<script>` tags in `index.html` (no modules). They share a single global scope. Load order matters.

### File Responsibilities

| File | Role |
|------|------|
| `storage.js` | App constants (`K`, `APP_TOKEN`), LocalStorage helpers (`L`/`S`), date/format utils, mock data injection, `EXPENSE_CATEGORIES` |
| `data.js` | CRUD for docs/books/quotes/memos/expenses, stats functions, `activeTab` state, `currentLoadedDoc` |
| `sync.js` | `SYNC` object — GAS (Google Apps Script) backend sync over HTTP POST. `SYNC.loadDatabase()`, `SYNC.scheduleDatabaseSave()`, etc. |
| `routine.js` | Daily routine check data + ring/streak/monthly rendering |
| `editor.js` | Rich-text editor toolbar, paste handling, image resize, expense form (category grid, SMS paste, save/update/delete) |
| `ui.js` | Tab switching (`switchTab`), layout switching (`setMobileView`, `toggleSidebar`), list/photo/calendar rendering, search |
| `ui-expense.js` | All expense UI: full dashboard, category chart, timelines, modal open/close (`openExpenseModal`, `closeExpenseModal`) |
| `gesture.js` | Touch gesture setup for mobile/tablet/PC swipe navigation |
| `app.js` | Entry point: Google auth, `showApp()`, `init()`, location modal |

### Data Flow

1. On load: `showApp()` → `SYNC.loadDatabase()` (fetches from GAS) → populates LocalStorage → `injectMockData()` / `injectExpenseMockData()` (only if storage empty) → `init()`
2. All reads/writes go through LocalStorage via `L(key)` / `S(key, value)`
3. Writes are debounced and synced to GAS backend via `SYNC.scheduleDocSave()` / `SYNC.scheduleDatabaseSave()`
4. GAS backend stores data in Google Drive / Google Sheets

### Storage Keys (defined in `storage.js` as `K`)

- `K.docs` → navi / fiction / blog documents
- `K.checks` → daily routine check state (keyed by date string)
- `K.books` → reading list
- `K.quotes` → quote collection
- `K.memos` → memos
- `K.expenses` → expense records

### Tab System

`activeTab` (in `data.js`) drives which content is shown. Values: `'navi'`, `'fiction'`, `'blog'`, `'book'`, `'quote'`, `'memo'`, `'expense'`. `switchTab()` in `ui.js` orchestrates panel visibility and expense-specific layout.

## Responsive Layout

Three breakpoints, each with a different panel structure:

- **Mobile** (`≤768px`): Single-panel view; `setMobileView('side'|'list'|'editor')` switches between sidebar, list, and editor via CSS classes (`view-side`, `view-list`, `view-editor`) on `#mainApp`
- **Tablet** (`769–1400px`): 2-column; sidebar toggles with `tablet-side-open` class; `ed-topbar-right` is moved to `document.body` with `topbar-fixed` class to escape swipe capture
- **PC** (`>1400px`): 3-column; sidebar toggles with `sidebar-closed`

For the expense tab on tablet/PC: list-panel and editor are hidden; `expenseFullDashboard` (at app level, outside editor) is shown full-width with a sticky header.

## Expense Feature Key Points

- **Expense modal** (`expenseModalOverlay`) lives at app level (not inside editor) so it renders correctly even when editor is hidden
- `openExpenseModal(id)` — pass `null` for new entry, expense `id` for edit
- `saveExpenseForm('modal')` — saves and refreshes dashboard
- `renderExpenseTimeline(yearMonth, useModal)` — `useModal=true` makes item clicks open modal instead of switching panel
- Two unimplemented stubs: `openExpenseDatePicker()` and `filterExpenseDetail()`

## GAS Backend

`GAS_URL` in `sync.js` points to the deployed Google Apps Script. All requests are POST with `token` + `idToken` (Google JWT from localStorage). On localhost, `idToken` is absent, causing `SYNC._post` to throw `'LocalMode'` — sync is silently skipped, app works offline-only.
