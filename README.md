# CVMS_WEB

Comprehensive documentation of the project's architecture, structure, and runtime behavior.

## Overview
CVMS_WEB is a client-side Voucher Management application built with React. It provides:
- Voucher creation and management with taxes and totals
- Basic user management (admin/user) and login
- Configurable restaurants and airlines lists
- Tax settings (TPS/TVQ) with derived totals and invoice preview
- Voucher archival and aging report
- Export as CSV

The application runs in the browser and persists data to Firebase Firestore (no custom backend server).

## High-level Architecture
- Runtime: React 18, create-react-app (react-scripts 5)
- Mounting pipeline: public/index.html → src/index.js → `<App />` (src/App.js)
- UI composition: Single top-level component (VoucherApp) organizing the UI into tabs (Vouchers, General Settings, Settings, Aging Report). Within the file, UI sections act like sub-components.
- State management: React useState for authoritative state, useMemo for derived/computed values.
- Persistence: Firebase Firestore (see src\\firebase.js). Writes vouchers, tax settings, restaurants, airlines, and users; limited reads implemented (e.g., tax fetch, password change). On app load, data is not auto-fetched yet.
- Styling: Plain CSS via src/App.css (primary styles) and src/styles.css (minimal globals).
- Networking: Uses Firebase SDK to talk to Firestore; no custom backend.

## Project Structure
- README.md — This document.
- package.json — Dependencies and scripts.
- public/index.html — HTML template with the root <div id="root" />.
- src/index.js — React entry point; creates the root and renders App in StrictMode.
- src/App.js — Main application implementation (all tabs and features live here).
- src/App.css — Main styles for layout, forms, tables, tabs, login UI, etc.
- src/styles.css — Minimal global styles for the .App class.
- src/firebase.js — Firebase initialization (Auth and Firestore).

## Entry and Rendering Flow
1. public/index.html defines `<div id="root"></div>`.
2. src/index.js obtains that element, creates a React root (createRoot), and renders:
   - `<StrictMode>`
     - `<App />` from src/App.js
3. src/App.js (VoucherApp) renders the entire UI and manages all state.

## Core Modules and Responsibilities
- src/index.js
  - Bootstraps React and mounts the App component.
- src/App.js (VoucherApp)
  - Tabs:
    - Vouchers: create, list, filter, select, export, and archive vouchers.
    - General Settings: configure taxes (TPS/TVQ), preview invoice line.
    - Settings: manage restaurants, airlines, and users; change password.
    - Aging Report: generate report based on voucher ages.
  - Cloud persistence via Firebase Firestore; some reads are on-demand (e.g., tax doc fetch) and most lists are currently maintained in-memory during a session.
  - CSV export via a small utility.
  - Basic authentication and roles (admin/user); in-memory login; Firebase Auth not used.
- src/App.css, src/styles.css
  - Provide styles for layout, tables, buttons, login, and tabs.

## Data and State Management
- Authoritative state: useState hooks store vouchers, archived vouchers, users, filters, active tab, form values, and settings.
- Derived state (useMemo): computes taxes and totals based on subtotal and tax rates, and constructs invoice preview text.
- Firestore collections (current usage):
  - vouchers — voucher documents (including totals, status, invoiceNumber).
  - tax — single doc storing tpsPct and tvqPct.
  - restaurants — documents with { name }.
  - airlines — documents with { name, code }.
  - users — documents with { username, password, role } (passwords are plaintext; demo only).
- Utilities:
  - formatCurrency(n): normalizes numeric display to two decimals.
  - downloadCSV(rows, filename): forms CSV and triggers a browser download.
  - checkPasswordStrength(pwd): basic strength check (must include lower/upper/digit, len ≥ 8).

## Feature Breakdown (Tabs)
1. Vouchers
   - Create vouchers with: date, receipt, restaurant, airline, subtotal, invoice number, and status (e.g., "Unbilled").
   - Auto-calculated fields: TPS, TVQ, and Total derived from tax settings and subtotal.
   - List view with selection, filtering (by airline, restaurant, receipt, date range), and bulk actions.
   - Archive vouchers and export the current list to CSV.
   - Inline invoice preview string.
2. General Settings
   - Configure TPS and TVQ percentages and persist them.
   - See the live invoice line preview based on current form values and taxes.
3. Settings
   - Manage reference data for Restaurants and Airlines (name + code for airlines).
   - User management: create users with roles (admin/user), change passwords.
   - Simple authentication gate; default admin user is provisioned on first run.
4. Aging Report
   - Summarize vouchers by age buckets to help with outstanding/unbilled visibility.

## Styling Approach
- Pure CSS via src/App.css classes controlling layout (grid form, tables, tabs) and basic look-and-feel.
- src/styles.css provides minimal global styles. No CSS-in-JS is used.
- Note: @mui/material, emotion, and lucide-react are present in dependencies but are not used in the current UI implementation.

## Security Notes
- User credentials are stored in Firestore in plain text (demo-only). Do NOT use as-is in production; implement Firebase Auth or a secure backend with hashing and proper access rules.
- The Firebase config in src\firebase.js is checked in for convenience; move secrets to environment variables (.env) and enforce restrictive Firestore security rules.
- There is no custom server-side validation; client performs basic checks only.

## Build and Development
- Prerequisites: Node.js (LTS recommended) and npm.
- Scripts (from package.json):
  - npm start — run the app in development mode.
  - npm run build — create a production build.
  - npm test — run tests (if present; CRA test runner configured with jsdom).
  - npm run eject — eject CRA configuration (irreversible).
- Browserslist targets are defined in package.json.

## Extensibility Guidelines
- Componentization: Consider extracting major sections (VoucherForm, VoucherTable, Filters, SettingsPanel, AgingReport) into separate components/files for maintainability.
- State management: If the app grows, introduce a state container (Context/Reducer, Zustand, Redux) and normalize data.
- Persistence: Build out Firestore integration (initial data fetching, pagination, offline support) or introduce a secure backend API; implement proper error handling, optimistic updates, and RBAC via Firestore Security Rules or backend.
- UI library: If needed, adopt @mui/material consistently or remove it from dependencies.
- Routing: Introduce React Router for true multi-page navigation across tabs.
- Testing: Add unit tests for utilities and integration tests for key flows.

## Known Limitations
- Single-file App component increases complexity as features grow.
- No server-side business logic; Firestore is used but data fetching on app load is limited (most lists are session-only until refresh logic is added).
- Authentication is client-only; passwords are stored in Firestore in plaintext (demo-only).

## Project Status
- Working demo with Firestore-backed writes (and selected reads) and CSV export.
- Ready for adding initial data fetching from Firestore, modular refactoring, and secure authentication.


## Getting Started

Prerequisites:
- Node.js LTS (v18.x or v20.x recommended)
- npm v8+ (comes with Node LTS)

Install dependencies:
- Windows PowerShell
  1. cd C:\Users\HadiSaad\WebstormProjects\CVMS_WEB
  2. npm install

Run the app in development:
- npm start
  - Opens http://localhost:3000

Create a production build:
- npm run build

### Firebase setup
- Ensure you have a Firebase project and Firestore enabled (in Test mode for local development).
- Update src\firebase.js with your Firebase config (projectId, apiKey, etc.).
- Recommended: move the config to environment variables for production and set restrictive Firestore security rules.
- Collections used by the app will be created as you use the UI:
  - tax: click "Save Tax Settings" to create/update the tax doc.
  - vouchers, restaurants, airlines, users: created when you add items via the app.

### Troubleshooting install issues
If you previously saw an ERESOLVE error related to typescript and react-scripts:
- The project has been updated to React 18 and react-scripts 5, and TypeScript has been removed (this project is JS-only). This resolves the peer dependency conflict.
- If you still hit issues after pulling the latest changes, try:
  1. Delete the node_modules folder and package-lock.json
  2. Run: npm install

As a last resort you can also try:
- npm install --legacy-peer-deps

Note: @mui/material is included but not used in the current UI; it remains installed for potential future use.
