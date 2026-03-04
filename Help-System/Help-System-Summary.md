# Help System — Executive Summary

Copyright (c) 2026 Great Lakes Heritage, LLC  
All rights reserved.

---

## Purpose

The Help System provides context-sensitive, page-level help content to users of the GLH web application. Content is managed by Admins through a built-in editor and displayed to all users via a slide-in panel — no page reload required.

---

## How It Works

1. Each web page has a unique `page_key` (e.g. `accession-document`).
2. An Admin uses the **Help Editor** to create one or more sections of help content for that page.
3. Any user clicks **Help** in the menu (or presses **F1**) to open the Help Panel, which fetches and displays the sections for the current page.

---

## Key Features

- **Slide-in Help Panel** — opens on any page via menu link or F1; closes with Escape
- **Rich text editor** (Quill) — bold, italic, underline, links, color, font family, font size
- **Two text fields per section** — `section_text` (general) and `client_text` (client-specific notes); red triangle divider shown only when `client_text` has visible text
- **Embedded video player** — YouTube and Vimeo URLs render as iframe embeds; local `.mp4` or other direct URLs render as an HTML5 video player inline in the panel
- **Collapsible sections** — users can expand/collapse individual sections; Collapse All button
- **Print** — prints the full help panel content
- **Display order** — sections are sorted by a numeric order (convention: 100=About, 200=Inputs, 300=Buttons, 400=Links)
- **Role-based security** — only Admins can delete pages or sections; all users can read

---

## Architecture

```
Browser                         Server (Node/Express)           Database (MySQL)
──────────────────────          ──────────────────────          ────────────────
help-panel.js                   help-api.js (router)            help_content
  openHelpPanel()    ──GET──▶   GET /api/help/:pageKey  ──▶     help_sections
  (slide-in panel)   ◀──JSON──  returns sections

help-editor.html/js             help-api.js (router)
  (Admin CRUD UI)    ──REST──▶  /api/help-editor/pages
                                /api/help-editor/page/:id
                                /api/help-editor/sections/:id
                                /api/help-editor/section/:id
```

---

## File Inventory

| File | Location | Purpose |
|------|----------|---------|
| `help-editor.html` | `client/` | Admin UI — manage pages and sections |
| `help-editor.js` | `client/` | Editor logic — CRUD for pages and sections |
| `help-panel.js` | `client/lib/` | Help panel — fetch and display help for current page |
| `help-panel.css` | `client/lib/` | Styles for the slide-in panel |
| `help-api.js` | `server/` | Express router — all help REST endpoints |
| `help-db-setup.sql` | DB setup | Creates `help_content` and `help_sections` tables |

---

## Database Tables

**`help_content`** — one row per page

| Column | Type | Notes |
|--------|------|-------|
| `help_content_id` | INT PK | Auto-increment |
| `page_key` | VARCHAR(100) | Unique; matches HTML filename without `.html` |
| `page_title` | VARCHAR(200) | Defaults to `page_key` value on insert |
| `app` | VARCHAR(100) | Application name (e.g. `Collection`) |

**`help_sections`** — one or more rows per page

| Column | Type | Notes |
|--------|------|-------|
| `help_sections_id` | INT PK | Auto-increment |
| `help_content_id` | INT FK | → `help_content` (CASCADE DELETE) |
| `section_title` | VARCHAR(200) | Displayed as collapsible heading |
| `section_text` | MEDIUMTEXT | HTML from Quill (general audience) |
| `client_text` | MEDIUMTEXT | HTML from Quill (client-specific notes) |
| `video_content` | VARCHAR(500) | `filename.mp4` or `https://...` |
| `display_order` | INT | Sort order |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/help/:pageKey` | None | Fetch sections for the help panel |
| GET | `/api/help-editor/pages` | None | List all pages |
| POST | `/api/help-editor/page` | None | Create page |
| PUT | `/api/help-editor/page/:id` | None | Update page |
| DELETE | `/api/help-editor/page/:id` | None | Delete page + all its sections |
| GET | `/api/help-editor/sections/:pageId` | None | List sections for a page |
| POST | `/api/help-editor/section` | None | Create section |
| PUT | `/api/help-editor/section/:id` | None | Update section |
| DELETE | `/api/help-editor/section/:id` | Admin JWT | Delete section |

---

## Plug-and-Play Package

A standalone, copy-and-paste version of the Help System is in:

```
docs/Help-System/Code/
  Client/           help-editor.html, help-editor.js
  Client Lib/       help-panel.js, help-panel.css
  endpoint/         help-api.js
  Server/           help-db-setup.sql
  README.md         Step-by-step install guide
```

This package has no dependency on the GLH Collections app structure — it can be dropped into any Node/Express + MySQL web app.

---

## Dependencies

- **Client**: Quill 1.3.7 (CDN), existing `lib/` files (`menu.css`, `menu.js`, `JWT-Tokens-Client.js`, `role-permissions.js`, `acm_Prompts.js`, `_config.js`)
- **Server**: `express`, `mysql2/promise`, `jsonwebtoken`
- **Environment**: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`
