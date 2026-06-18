# CloudNote

A clean, modern, client-side productivity dashboard built with vanilla HTML, CSS, and JavaScript. CloudNote lets users create and manage personal notes and to-do tasks entirely within the browser — no server, no database, no sign-up required. All data persists automatically using the browser's built-in `localStorage` API, with notes and tasks stored under independent keys so they never interfere with each other.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technologies Used](#technologies-used)
4. [File Structure](#file-structure)
5. [How It Works](#how-it-works)
6. [LocalStorage Architecture](#localstorage-architecture)
7. [Getting Started](#getting-started)
8. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Overview

CloudNote is a fully functional, single-page productivity dashboard with two independent modules accessible from a responsive sidebar:

- **Notes** — a full CRUD note-taking system with real-time search, a responsive card grid, and an auto-expanding editor.
- **To-Do** — a task manager with custom-styled checkboxes, completion tracking, and a live counter badge.

The sidebar features a branded logo image, inline SVG navigation icons (file-text for Notes, check-square for To-Do), and collapses into a compact horizontal top bar on narrow mobile screens. Both modules persist their data independently through `localStorage`, meaning everything survives page refreshes and browser restarts with no backend required.

---

## Features

### Notes (Full CRUD)

- **Create** — Write a note with a title and body, then save it instantly.
- **Read** — All saved notes display in a responsive CSS Grid card layout.
- **Update** — Click the edit icon on any card to reload it into the form for changes.
- **Delete** — Remove any note permanently with a confirmation dialog.

### Real-Time Notes Search

- A search bar above the notes grid filters results on every keystroke — no submit button, no page reload.
- Searches both the **title** and **content** of every note simultaneously.
- Matching is **case-insensitive** — searching "cloud" finds "Cloud", "CLOUD", and "cloud" alike.
- Clearing the search instantly restores all notes.
- A **"No matching notes found."** empty state appears when no notes match the query.
- Search never writes to `localStorage` — it is a read-only, in-memory filter over the existing `notes[]` array.

### Dynamic Note Editor

- The content textarea starts at a generous height and **auto-expands vertically** as the user types — no internal scrollbar while writing.
- When loading an existing note for editing, the textarea **immediately sizes itself** to fit the loaded content.
- **Manual resize** is preserved — users can drag the bottom handle to make the editor even taller.
- Saving or cancelling resets the textarea back to its default height.

### To-Do List (Full CRUD)

- **Create** — Type a task and press Enter or click "+ Add Task".
- **Complete** — Click the custom-styled checkbox to mark a task done (strikethrough + fade).
- **Toggle** — Click again to mark a completed task incomplete.
- **Delete** — Remove any task instantly with the trash icon.
- **Counter Badge** — A live pill badge on the sidebar tab shows the number of incomplete tasks. It disappears when all tasks are done.
- **Empty State** — A friendly prompt appears when the task list is empty.

### Responsive Sidebar UI

- Fixed sidebar on the left with a branded PNG logo (`assets/cloudnote-logo.png`), displayed at 40×40 px with `object-fit: contain` so it never warps.
- Navigation tabs use inline SVG icons (`file-text` for Notes, `check-square` for To-Do) with `stroke="currentColor"` — icons are soft sky blue at rest and turn bright white on hover and when active.
- The search bar uses an inline SVG search icon positioned absolutely on the left edge of the input field.
- At `max-width: 560px` the sidebar collapses into a compact horizontal top bar. The logo scales to 32×32 px, the brand name tightens to a smaller size, and nav tabs stack side-by-side — SVGs and labels stay on one line without wrapping.
- A mid-tier breakpoint at `max-width: 768px` narrows the sidebar to 200 px and reduces canvas padding for tablet-sized windows.

### LocalStorage Persistence

- Notes save automatically under `cloudnote_data` after every create, update, or delete.
- Tasks save automatically under `cloudnote_todos` after every create, toggle, or delete.
- The two storage keys are completely isolated — clearing notes never affects tasks and vice versa.
- First-time visitors receive two onboarding seed notes. Tasks start from a blank slate.

### Security — HTML Escaping

User-supplied text is never injected into `innerHTML` without sanitization. A dedicated `escapeHTML()` helper converts dangerous characters into safe HTML entities across both modules.

---

## Technologies Used

| Technology | Role |
|---|---|
| **HTML5** | Semantic page structure (`<aside>`, `<main>`, `<nav>`, `<header>`, `<section>`) |
| **CSS3** | Design system via CSS custom properties, Flexbox, CSS Grid, transitions, responsive media queries |
| **Vanilla JavaScript (ES6+)** | All application logic — state management, DOM rendering, events, persistence |
| **localStorage API** | Browser-native key/value persistence — no backend required |
| **Feather Icons (CDN)** | Lightweight SVG icon set used for edit and delete action buttons on note cards |
| **Inline SVGs** | Navigation tab icons and search bar icon — rendered sharp at any resolution, color-controlled via `currentColor` |

No build tools, bundlers, or frameworks are used. The project runs directly in any modern browser.

---

## File Structure

```
cloudnote/
├── index.html               # App shell — sidebar, canvas header, notes form, search bar, to-do form, workspace
├── style.css                # Design system — CSS variables, grid, note cards, search bar, to-do items, responsive breakpoints
├── app.js                   # All JavaScript — Notes module, To-Do module, search, auto-resize, tab switching, events
├── assets/
│   ├── cloudnote-logo.png   # Brand logo displayed in the sidebar header
│   └── icons/
│       ├── file-text.svg    # Source SVG for the Notes navigation tab icon
│       ├── check-square.svg # Source SVG for the To-Do navigation tab icon
│       └── search.svg       # Source SVG for the search bar icon
└── README.md                # Project documentation (this file)
```

Each file has a single, clear responsibility. The two feature modules (Notes and Todos) live inside `app.js` but are clearly sectioned — their state arrays, render functions, CRUD operations, and persistence helpers never cross-reference each other.

---

## How It Works

### Architecture — Single Source of Truth (×2)

Each module owns one global array that is the authoritative record for its data:

```js
let notes = [];    // owns all note objects  — persisted to 'cloudnote_data'
let todos = [];    // owns all task objects  — persisted to 'cloudnote_todos'
```

The UI is always a reflection of these arrays. Every mutation triggers the same three-step cycle:

```
User action
    │
    ▼
Mutate array[]               ← push / filter / toggle property
    │
    ▼
render<Module>()             ← wipe workspace, loop array, inject HTML
    │
    ▼
save<Module>ToLocalStorage() ← JSON.stringify → localStorage
```

### Real-Time Search

The search bar listens to the `input` event, which fires on every keystroke, paste, or deletion — making results update instantly.

```
Keystroke → 'input' event fires
                │
           filterNotes() reads searchInput.value
                │
        ┌───────┴────────────┐
    query === ''          query !== ''
        │                     │
   renderNotes()         Array.filter()
   (show all)            checks title + content
                              │
                         renderNotes(matches)
                         (show subset)
```

`Array.filter()` is non-destructive — it builds a temporary array of matches and discards it after rendering. The original `notes[]` array is **never mutated** during search and `localStorage` is **never written** during search.

### Auto-Expanding Textarea

The textarea auto-resize technique uses a deliberate two-step height calculation:

```js
function autoResizeTextarea() {
  noteContentInput.style.height = 'auto';           // Step 1: collapse to recalculate
  noteContentInput.style.height =
    noteContentInput.scrollHeight + 'px';           // Step 2: expand to content height
}
```

Resetting to `'auto'` first forces the browser to recalculate a fresh minimum, making shrinking possible when lines are deleted. The companion CSS (`overflow: hidden` on `.form-textarea`) prevents a scrollbar from briefly appearing during the recalculation.

### Note Data Shape

```js
{
  id:      1718000000000,       // Date.now() — unique timestamp ID
  title:   "My note title",
  content: "Body text here.",
  date:    "June 17, 2026 at 3:04 PM"
}
```

### Task Data Shape

```js
{
  id:        1718000000001,    // Date.now() — always unique
  text:      "Finish CloudNote",
  completed: false,            // toggled by the custom checkbox
  createdAt: "6/17/2026"       // toLocaleDateString() — compact form
}
```

---

## LocalStorage Architecture

### Independent Keys

```
localStorage
├── cloudnote_data    →  JSON string of the notes[] array
└── cloudnote_todos   →  JSON string of the todos[] array
```

The two keys are entirely separate. Operating on one never touches the other.

### Save and Load

```js
// Save
localStorage.setItem('cloudnote_data',  JSON.stringify(notes));
localStorage.setItem('cloudnote_todos', JSON.stringify(todos));

// Load
const raw = localStorage.getItem('cloudnote_data');  // returns string | null
const arr = JSON.parse(raw);                          // reconstructs JS array
```

Both loaders are wrapped in `try/catch` to handle any corrupted data gracefully. First-time visitors (empty storage) receive two seed notes; the to-do list starts blank.

---

## Getting Started

CloudNote requires no installation, build step, or server.

### Option 1 — Python (built-in, zero setup)

```bash
python3 -m http.server 5000
```

Then open `http://localhost:5000` in your browser.

### Option 2 — VS Code Live Server

Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, right-click `index.html`, and choose **Open with Live Server**.

### Option 3 — Any Static Host

Upload the project files to GitHub Pages, Netlify, Vercel, or Replit and the app is live immediately.

> **Note:** Because CloudNote uses `localStorage`, each browser and device maintains its own independent data. Notes and tasks do not sync across devices.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Enter` (in note title field) | Jump focus to the content textarea |
| `Ctrl + Enter` / `Cmd + Enter` (in note content) | Save the current note |
| `Enter` (in task input) | Add the new task |

---

*CloudNote — Your ideas, in the cloud.*
