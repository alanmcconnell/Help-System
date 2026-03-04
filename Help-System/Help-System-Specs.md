# Help System — System Specifications

**Project:** GLH Collections — dev01-alan  
**Copyright:** Great Lakes Heritage, LLC  
**Status:** Implemented  

---

## 1. Purpose

Provide context-sensitive, page-level help content to users of the GLH Collections application. Content is stored in the database and managed by Administrators through a built-in editor — no code changes required to add or update help.

---

## 2. Functional Requirements

### 2.1 Help Panel (All Pages)

| ID | Requirement |
|----|-------------|
| FR-01 | Every page shall display a **Help** link in the main menu bar. |
| FR-02 | Pressing **F1** shall open the help panel. |
| FR-03 | Pressing **Escape** shall close the help panel. |
| FR-04 | The help panel shall slide in from the right side of the screen. |
| FR-05 | The panel header shall display: `Help — <Page Title>` derived from `document.title`. |
| FR-06 | Help content shall be fetched using the current page's filename (without `.html`) as the `page_key`. |
| FR-07 | Sections shall be displayed in ascending `display_order` sequence. |
| FR-08 | Each section shall be collapsible/expandable via a toggle arrow (▼ expanded, ► collapsed). |
| FR-09 | The panel footer shall contain: **Collapse All**, **Print**, **Close**. |
| FR-10 | **Collapse All** shall collapse all sections simultaneously. |
| FR-11 | **Print** shall open a print-formatted window with all section content. |
| FR-12 | **Close** shall dismiss the panel. |
| FR-13 | If no help content exists for the current page, display: *"No help available for this page."* |
| FR-14 | If the current user has the Admin role and no content exists, display a link: *"+ Add help for this page"* linking to `help-editor.html?page=<pageKey>`. |
| FR-15 | A red triangle divider (▼▼▼…) shall be rendered between `section_text` and `client_text` only when `client_text` contains visible text (empty Quill HTML such as `<p><br></p>` is treated as empty). |
| FR-16 | If a section has a `video_content` value, a video player shall be embedded inline in the panel. YouTube and Vimeo URLs render as `<iframe>` embeds; all other URLs render as an HTML5 `<video>` tag. |

### 2.2 Help Editor (Admin Only)

| ID | Requirement |
|----|-------------|
| FR-20 | The Help Editor shall be accessible from the Admin menu (Admin role required). |
| FR-21 | The URL parameter `?page=<pageKey>` shall auto-select the matching page on load. |
| FR-22 | The left panel shall display a scrollable grid of all help pages filtered by `app === 'Collection'`, sorted by `page_key`, showing `page_key (app)`. |
| FR-23 | Clicking a page row shall load its sections in the right panel. |
| FR-24 | Administrators shall be able to **Add Page**, **Save Page**, and **Delete Page**. |
| FR-25 | Deleting a page shall delete all associated sections (cascade). |
| FR-26 | Each page record requires: **Page Key** (required, unique) and **App** (select: Collection, Search). |
| FR-27 | Sections shall be listed showing `display_order. section_title` with **Edit** and **Del** buttons per row. |
| FR-28 | Administrators shall be able to **Add Section**, **Save Section**, **Cancel**, and **Delete Section**. |
| FR-29 | The section form shall contain: Display Order, Title, Section Text (rich text), Client Text (rich text), Video URL. |
| FR-30 | **Section Text** is the admin/internal help content field. |
| FR-31 | **Client Text** is the end-user facing content field. |
| FR-32 | Both text fields shall use a rich text editor (Quill) with: Font Family, Font Size, Bold, Italic, Underline, Link, Text Color, Clear Formatting. |
| FR-33 | Font Family options: Arial, Courier, Georgia, Tahoma, Times, Verdana. |
| FR-34 | Font Size options: 10px, 12px, 14px, 16px, 18px, 20px, 24px, 28px, 32px. |
| FR-35 | Clear Formatting shall strip formatting from the selected text, or the entire editor if nothing is selected. |
| FR-36 | Save Section shall **UPDATE** if `currentSectionId > 0`, or **INSERT** if null/0. |
| FR-37 | Delete Section shall prompt for confirmation before deleting. |
| FR-38 | Delete Page shall prompt for confirmation before deleting. |
| FR-39 | Video URL field accepts a bare filename (e.g. `demo.mp4`) for local videos, or a full `https://` URL. |

---

## 3. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | The help panel HTML shall be injected automatically by `help-panel.js` on `DOMContentLoaded` — no per-page markup required. |
| NFR-02 | The help panel shall use a CSS slide-in animation (`transition: right 0.3s ease`). |
| NFR-03 | The editor page shall be responsive (flex layout collapses to single column at ≤ 768px). |
| NFR-04 | All API calls shall resolve `API_BASE` from `_CONFIG.SERVER_API_URL`, falling back to `hostname:55170/api`. |
| NFR-05 | Rich text content is stored and rendered as HTML (Quill `innerHTML`). |
| NFR-06 | All confirmation dialogs shall use `acm_SecurePopUp()` — no `alert()` or `confirm()`. |

---

## 4. Database Schema

### Table: `help_content`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `help_content_id` | INT | PK, AUTO_INCREMENT | Primary key |
| `page_key` | VARCHAR(100) | NOT NULL, UNIQUE | HTML filename without `.html` |
| `page_title` | VARCHAR(200) | NOT NULL | Defaults to `page_key` value on INSERT |
| `app` | VARCHAR(100) | | Application name (e.g. `Collection`) |
| `is_active` | TINYINT | | Active flag |
| `created_at` | DATETIME | | Auto-set on insert |
| `updated_at` | DATETIME | | Auto-set on update |

### Table: `help_sections`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `help_sections_id` | INT | PK, AUTO_INCREMENT | Primary key |
| `help_content_id` | INT | FK → help_content, CASCADE DELETE | Parent page |
| `section_title` | VARCHAR(200) | NOT NULL | Collapsible section heading |
| `section_text` | MEDIUMTEXT | | Admin/internal rich text HTML |
| `client_text` | MEDIUMTEXT | | End-user rich text HTML |
| `video_content` | VARCHAR(500) | | `filename.mp4` or `https://...` |
| `display_order` | INT | NOT NULL DEFAULT 0 | Sort order |

### Display Order Conventions

| Range | Content Type |
|-------|-------------|
| 100s | About the web page |
| 200s | Input fields on the page |
| 300s | Buttons (Add, Delete, Save, Cancel) |
| 400s | Links to other pages |

---

## 5. API Specification

**Base path:** `/api`  
**Server port:** 55170 (default fallback)

### 5.1 Public — Help Panel

#### `GET /api/help/:pageKey`

Fetches sections for the help panel.

- **Params:** `pageKey` — matches `help_content.page_key`
- **Auth:** None
- **Response 200:** `[{ section_title, section_text, client_text, video_content, display_order }]`
- **Response 200:** `[]` if no matching page

### 5.2 Help Editor — Pages

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET | `/api/help-editor/pages` | None | — | `[{ help_content_id, page_key, app, ... }]` ordered by `app, page_key` |
| POST | `/api/help-editor/page` | None | `{ page_key, app }` | `{ id }` |
| PUT | `/api/help-editor/page/:id` | None | `{ page_key, app }` | `{ message }` |
| DELETE | `/api/help-editor/page/:id` | None | — | `{ message }` — cascades to sections |

### 5.3 Help Editor — Sections

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET | `/api/help-editor/sections/:pageId` | None | — | `[{ help_sections_id, section_title, section_text, client_text, video_content, display_order }]` |
| POST | `/api/help-editor/section` | None | `{ help_content_id, section_title, section_text, client_text, video_content, display_order }` | `{ id }` |
| PUT | `/api/help-editor/section/:id` | None | `{ section_title, section_text, client_text, video_content, display_order }` | `{ message }` |
| DELETE | `/api/help-editor/section/:id` | Admin JWT | — | `{ message }` |

---

## 6. Client-Side Architecture

### 6.1 Help Panel Structure

Injected into `document.body` by `help-panel.js` on `DOMContentLoaded`:

```
#helpPanel
  #helpPanelHeader    — "Help — <Page Title>"
  #helpPanelContent   — rendered sections
  #helpPanelFooter    — Collapse All | Print | Close
```

### 6.2 Page Key Derivation

```javascript
window.location.pathname.split('/').pop().replace(/\.html$/i, '') || 'index'
```

### 6.3 Section Rendering

```html
<div class="help-section">
  <h3 class="help-section-title" onclick="toggleHelpSection(i)">
    <span class="help-toggle">▼</span> {section_title}
  </h3>
  <div class="help-section-body" id="help-body-{i}">
    {section_text}
    [red divider if client_text has visible text]
    {client_text}
    [embedded video player if video_content present:
      YouTube/Vimeo → <iframe> | other URL → <video>]
  </div>
</div>
```

### 6.4 Key Functions (`help-panel.js`)

| Function | Trigger | Behavior |
|----------|---------|----------|
| `openHelpPanel()` | Help menu, F1 | Fetches content, renders sections, slides panel in |
| `closeHelpPanel()` | Close button, Escape | Removes `open` class |
| `toggleHelpSection(i)` | Section title click | Toggles body display and arrow icon |
| `collapseAllHelpSections()` | Collapse All | Hides all bodies, sets all arrows to ► |
| `printHelpPanel()` | Print | Opens new window with print-formatted content |
| `_helpGetApiBase()` | Internal | Resolves API base URL from `_CONFIG` or `window.location` |
| `_helpVideoUrl(filename)` | Internal | Builds full video URL, respecting `HELP_VIDEO_PORT` |
| `_helpNoHelpMsg()` | No content | Returns message HTML with optional Admin add-link |

### 6.5 Rich Text Editor (`help-editor.js`)

- Library: **Quill 1.3.7** (CDN)
- Theme: `snow`
- Two instances: `quill` → `#section_text_editor`, `quillClient` → `#client_text_editor`
- Registered formats: `Font` (whitelist), `Size` (style attributor whitelist)
- Toolbar order: Font Family | Font Size | Bold | Italic | Underline | Link | Color | Clean
- Custom `clean` handler: removes format from selection, or entire editor if no selection

### 6.6 API Base Resolution (`help-editor.js`)

```javascript
// Priority order:
// 1. _CONFIG.SERVER_API_URL (replace /api2 → /api)
// 2. window.location hostname:55170/api (fallback)
```

### 6.7 Save / Update Logic

```javascript
const isUpdate = currentSectionId && currentSectionId > 0;
// true  → PUT  /api/help-editor/section/:id
// false → POST /api/help-editor/section
```

---

## 7. File Inventory

### Live Application

| File | Path | Role |
|------|------|------|
| `help-editor.html` | `client/c01_client-first-app/` | Admin editor UI |
| `help-editor.js` | `client/c01_client-first-app/` | Editor logic, Quill instances, CRUD |
| `help-panel.js` | `client/c01_client-first-app/lib/` | Help panel injection, open/close/print/collapse |
| `help-panel.css` | `client/c01_client-first-app/lib/` | Panel styles, slide-in animation |
| `accession-api.js` | `server/s01_collectionss-server-api/` | All 9 help REST endpoints |

### Plug-and-Play Package

| File | Path | Role |
|------|------|------|
| `help-editor.html` | `docs/Help-System/Code/Client/` | Portable editor UI (no `app` field) |
| `help-editor.js` | `docs/Help-System/Code/Client/` | Portable editor logic |
| `help-panel.js` | `docs/Help-System/Code/Client Lib/` | Portable help panel |
| `help-panel.css` | `docs/Help-System/Code/Client Lib/` | Portable panel styles |
| `help-api.js` | `docs/Help-System/Code/endpoint/` | Portable Express router |
| `help-db-setup.sql` | `docs/Help-System/Code/Server/` | DB table creation script |
| `README.md` | `docs/Help-System/Code/` | Step-by-step install guide |

---

## 8. Security

| Concern | Implementation |
|---------|---------------|
| Help panel (read) | Open — no token required; available to all users |
| Help Editor access | Restricted to Admin role via `role-permissions.js` |
| Delete section | Requires Admin JWT (`Authorization: Bearer <token>`) |
| Delete page | No auth middleware (open) — relies on UI role restriction |
| Admin add-link | Only rendered when `token.user_role === 'Admin'` |
| Confirmation dialogs | All destructive actions use `acm_SecurePopUp()` |

---

## 9. Configuration Reference

| File | Constant | Default | Description |
|------|----------|---------|-------------|
| `help-editor.js` | `HELP_API_BASE_PATH` | `'/api'` | API path prefix (plug-and-play only) |
| `help-editor.js` | `HELP_VIDEO_PORT` | `null` | Port for video static route |
| `help-panel.js` | `HELP_VIDEO_PORT` | `null` | Port for video static route |
| `help-panel.js` | `HELP_API_URL_OVERRIDE` | `null` | Full API base URL override |
| `.env` | `HELP_VIDEOS_ROOT_PATH` | `./videos` | Server path to local video files |

---

## 10. Dependencies

| Layer | Dependency | Notes |
|-------|-----------|-------|
| Client | Quill 1.3.7 | Loaded from CDN in `help-editor.html` |
| Client | `menu.css`, `menu.js` | Menu bar and dark mode support |
| Client | `JWT-Tokens-Client.js` | Token retrieval from `localStorage` |
| Client | `role-permissions.js` | Role-based UI access control |
| Client | `acm_Prompts.js` | `acm_SecurePopUp()` confirmation dialogs |
| Client | `_config.js` | `_CONFIG.SERVER_API_URL` runtime config |
| Server | `express` | HTTP routing |
| Server | `mysql2/promise` | Database access |
| Server | `jsonwebtoken` | JWT verification for DELETE section |
| Server env | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Database connection |
| Server env | `JWT_SECRET` | Token signing/verification |
