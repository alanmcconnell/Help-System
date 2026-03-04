# Help System — Plug-and-Play Install Guide

Copyright (c) 2026 Great Lakes Heritage, LLC  
All rights reserved.

---

## What This Is

A self-contained Help System that adds:
- A **Help panel** (slide-in sidebar) to every page — opened by the Help menu item or F1
- A **Help Editor** page (Admin only) for managing help content per page
- **Rich text** (Quill editor) for section text and client-specific text — font family, font size, bold, italic, underline, link, color, clear formatting
- Optional **video links** per section
- Role-based security: only Admins can delete pages/sections

---

## Folder Contents

```
Code/
  Client/
    help-editor.html      ← Copy to your client app folder
    help-editor.js        ← Copy to your client app folder

  Client Lib/
    help-panel.js         ← Copy to your client/lib/ folder
    help-panel.css        ← Copy to your client/lib/ folder
    help-config.js        ← Copy to your client/lib/ folder
                          (update the SERVER_PORT to the server port number in the .enf file)
    acm_Prompts.js        ← Copy to your client/lib/ folder
                          (Change the ACM_APP_TITLE constant at the top of the file to match your app's name.)

  endpoint/
    help-api.js           ← Copy to your server folder
                          (Register the file with server.mjs)

  Server/
    help-db-setup.sql     ← Run once against your database
```

---

## Step-by-Step Install

### 1. Database

Run the SQL script once against your app's existing database — it adds two tables alongside your existing tables:
```
mysql -u <user> -p <database> < help-db-setup.sql
```

### 2. Server — Register the API router

In your `server.mjs`:
```js
import helpRoutes from './help-api.js';
app.use('/api', helpRoutes);

// Optional: serve local video files
app.use('/videos', express.static(process.env.HELP_VIDEOS_ROOT_PATH || './videos'));
```

Add to your `.env` (only needed if using local video files):
```
HELP_VIDEOS_ROOT_PATH=C:\path\to\your\videos
```

### 3. Client — Help Panel (all pages)

Copy `help-panel.js` and `help-panel.css` to your `client/lib/` folder.

In every HTML page that should show the Help panel, add **after** `menu.js`:
```html
<link rel="stylesheet" href="lib/help-panel.css">
<script src="lib/help-panel.js"></script>
```

Open `help-panel.js` and set the config constants at the top if needed:
```js
const HELP_VIDEO_PORT = null;          // set if videos are on a different port
const HELP_API_URL_OVERRIDE = null;    // set if API is on a different origin
```

### 4. Client — Add Help to the app menu

Add a Help link to your app's existing navigation menu:
```html
<li><a href="#" onclick="openHelpPanel(); return false;">Help</a></li>
```

`help-panel.js` automatically injects the `#helpPanel` div into `document.body` on page load — no HTML changes needed beyond the menu link.

### 5. Client — Help Editor page (Admin only)

Copy `help-editor.html` and `help-editor.js` to your client app folder.

Add a link to the Help Editor in your Admin menu:
```html
<a href="help-editor.html" data-role="Admin">Help Editor</a>
```

---

## Configuration Reference

| File | Constant | Default | Description |
|------|----------|---------|-------------|
| `help-editor.js` | `HELP_API_BASE_PATH` | `'/api'` | API path prefix |
| `help-editor.js` | `HELP_VIDEO_PORT` | `null` | Port for video static route (null = same as API) |
| `help-panel.js` | `HELP_VIDEO_PORT` | `null` | Port for video static route |
| `help-panel.js` | `HELP_API_URL_OVERRIDE` | `null` | Full API base URL override |

Update all HTML pages with the correct script order (help-config.js and help-panel.js before menu.js):
---

## API Endpoints (all under `/api`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/help/:pageKey` | None | Fetch sections for a page (used by help panel) |
| GET | `/help-editor/pages` | None | List all pages |
| POST | `/help-editor/page` | None | Create page |
| PUT | `/help-editor/page/:id` | None | Update page |
| DELETE | `/help-editor/page/:id` | None | Delete page + sections |
| GET | `/help-editor/sections/:pageId` | None | List sections for a page |
| POST | `/help-editor/section` | None | Create section |
| PUT | `/help-editor/section/:id` | None | Update section |
| DELETE | `/help-editor/section/:id` | Admin JWT | Delete section |

> **Note:** The red triangle divider between `section_text` and `client_text` is only rendered when `client_text` contains visible text (empty Quill HTML such as `<p><br></p>` is treated as empty).

## Issues:
File: help-editor.html   Make sure the data returned from the database is in a JSON format.
API: Make sure this is run:
    import helpRoutes from './help-api.js';
    app.use('/api', helpRoutes);
---

## Database Schema

**help_content**
| Column | Type | Notes |
|--------|------|-------|
| help_content_id | INT PK AUTO_INCREMENT | |
| page_key | VARCHAR(100) | e.g. `accession-document` |

**help_sections**
| Column | Type | Notes |
|--------|------|-------|
| help_sections_id | INT PK AUTO_INCREMENT | |
| help_content_id | INT FK | → help_content |
| section_title | VARCHAR(200) | |
| section_text | MEDIUMTEXT | HTML from Quill |
| client_text | MEDIUMTEXT | HTML from Quill (client-specific) |
| video_content | VARCHAR(500) | filename.mp4 or https://... |
| display_order | INT | Sort order (100, 200, 300...) |

---

## Dependencies

- **Client**: Quill 1.3.7 (loaded from CDN in help-editor.html)
- **Server**: `express`, `mysql2/promise`, `jsonwebtoken` (standard in most Node apps)
- **Existing lib files** (must already be in your `client/lib/`):
  `menu.css`, `menu.js`, `JWT-Tokens-Client.js`, `role-permissions.js`, `_config.js`
