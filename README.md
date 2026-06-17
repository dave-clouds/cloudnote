# ☁️ CloudNote

A clean, modern, client-side productivity dashboard built with vanilla HTML, CSS, and JavaScript. CloudNote lets users create and manage personal notes and to-do tasks entirely within the browser — no server, no database, no sign-up required. All data is persisted automatically using the browser's built-in `localStorage` API, with notes and tasks stored under independent keys so they never interfere with each other.

The codebase is intentionally written with heavy inline comments to serve as a learning resource. Every function explains the JavaScript concept it demonstrates alongside the feature it implements.

---

## 🌐 Live Demo

**[https://dave-clouds.github.io/cloudnote/](https://dave-clouds.github.io/cloudnote/)**

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Features](#-features)
3. [Technologies Used](#-technologies-used)
4. [File Structure](#-file-structure)
5. [How It Works](#-how-it-works)
6. [LocalStorage Architecture](#-localstorage-architecture)
7. [Getting Started](#-getting-started)
8. [Future Roadmap](#-future-roadmap)
9. [Author](#-author)

---

## 🌐 Project Overview

CloudNote is a fully functional, single-page productivity dashboard with two independent modules:

- **My Notes** — a full CRUD note-taking system with a responsive card grid
- **To-Do List** — a task manager with custom checkboxes, completion tracking, and a live counter badge

Both modules persist their data independently through `localStorage`, meaning everything survives page refreshes and browser restarts without any backend.

---

## ✨ Features

### 📝 Notes (Full CRUD)
- **Create** — Write a note with a title and body, then save it instantly.
- **Read** — All saved notes are displayed in a responsive CSS Grid card layout.
- **Update** — Click the edit icon on any card to reload it into the form for changes.
- **Delete** — Remove any note permanently (with confirmation dialog).

### ✅ To-Do List (Full CRUD)
- **Create** — Type a task and press Enter or click "Add Task".
- **Complete** — Click the custom styled checkbox to mark a task done (strikethrough + fade).
- **Toggle** — Click again to mark a completed task incomplete.
- **Delete** — Remove any task instantly with the trash icon.
- **Counter Badge** — A live pill badge on the sidebar tab always shows the number of incomplete tasks. Disappears when all tasks are done.
- **Empty State** — A friendly prompt appears when the task list is empty.

### 💾 Independent LocalStorage Persistence
- Notes save automatically under `cloudnote_data` after every create, update, or delete.
- Tasks save automatically under `cloudnote_todos` after every create, toggle, or delete.
- The two storage keys are completely isolated — clearing notes never affects tasks and vice versa.
- First-time visitors receive two onboarding seed notes. Tasks start from a blank slate.

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `Enter` (in note title field) | Jump focus to the content textarea |
| `Ctrl + Enter` / `Cmd + Enter` (in note content) | Save the current note |
| `Enter` (in task input) | Add the new task |

### 🔒 Secure HTML Escaping
User-supplied text is never injected into `innerHTML` without sanitization. A dedicated `escapeHTML()` helper converts dangerous characters into safe HTML entities across both modules.

### 📐 Responsive Layout
- Fixed sidebar on the left; flexible canvas on the right.
- Notes use `CSS Grid` with `auto-fill` / `minmax(260px, 1fr)` — reflowing automatically from one column to many.
- Tasks use a full-width flex column that spans all grid cells.
- Breakpoints at `768px` and `560px` progressively adapt the layout for mobile.

---

## 🛠️ Technologies Used

| Technology | Role |
|---|---|
| **HTML5** | Semantic page structure (`<aside>`, `<main>`, `<article>`, `<time>`) |
| **CSS3** | Styling, layout (Flexbox + CSS Grid), CSS custom properties, transitions |
| **Vanilla JavaScript (ES6+)** | All application logic — state, DOM, events, persistence |
| **localStorage API** | Browser-native key/value persistence (no backend required) |
| **Feather Icons** | Lightweight SVG icon set for edit and delete actions |

No build tools, bundlers, or frameworks are used. The project runs directly in any modern browser.

---

## 📁 File Structure

```
cloudnote/
├── index.html      # App shell — sidebar, canvas header, notes form, todo form, workspace
├── style.css       # Design system — CSS variables, grid, note cards, todo items, checkboxes
├── app.js          # All JavaScript — two independent modules (Notes + Todos), persistence, events
└── README.md       # Project documentation (this file)
```

Each file has a single, clear responsibility. The two feature modules (Notes and Todos) live inside `app.js` but are clearly sectioned — their state arrays, render functions, CRUD operations, and persistence helpers never cross-reference each other.

---

## ⚙️ How It Works

### Architecture — Single Source of Truth (×2)

Each module owns one global array that is the authoritative record for its data:

```
let notes = [];    // owns all note objects   — persisted to 'cloudnote_data'
let todos = [];    // owns all task objects   — persisted to 'cloudnote_todos'
```

The UI is always a *reflection* of these arrays, never the source. Every mutation triggers the same three-step cycle:

```
User action
    │
    ▼
Mutate array[]        ← push / filter / toggle property
    │
    ▼
render<Module>()      ← wipe workspace, loop array, inject HTML
    │
    ▼
save<Module>ToLocalStorage()   ← JSON.stringify → localStorage
```

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

### Notes CRUD Function Map

| Operation | Function | Array Method |
|---|---|---|
| Create | `handleSave()` — create path | `Array.push()` |
| Read | `renderNotes()` | `Array.map()` + `Array.join()` |
| Update | `handleSave()` — edit path | `Array.findIndex()` + mutation |
| Delete | `deleteNote(id)` | `Array.filter()` |

### Todos CRUD Function Map

| Operation | Function | Array Method |
|---|---|---|
| Create | `addTodo()` | `Array.push()` |
| Read | `renderTodos()` | `Array.map()` + `Array.join()` |
| Toggle | `toggleTodo(id)` | `Array.findIndex()` + `!bool` |
| Delete | `deleteTodo(id)` | `Array.filter()` |

### Custom Checkbox — How It Works

The browser's default `<input type="checkbox">` is hidden with CSS (`opacity: 0; width: 0; height: 0`). A sibling `<span>` is styled as the visible box. When the hidden input receives a `:checked` state, the CSS adjacent sibling selector (`+`) activates the visual fill and checkmark drawn via a `::after` pseudo-element — no images or icon fonts required.

---

## 💾 LocalStorage Architecture

### Independent Keys

```
localStorage
├── cloudnote_data    →  JSON string of the notes[]  array
└── cloudnote_todos   →  JSON string of the todos[]  array
```

The two keys are entirely separate. Operating on one never touches the other.

### Save Flow

```js
// Notes
localStorage.setItem('cloudnote_data',  JSON.stringify(notes));

// Todos
localStorage.setItem('cloudnote_todos', JSON.stringify(todos));
```

`JSON.stringify()` is required because `localStorage` only stores strings. Without it, writing an array produces the useless string `"[object Object]"`.

### Load Flow

```js
const raw = localStorage.getItem('cloudnote_data');  // returns string | null
const arr = JSON.parse(raw);                          // reconstructs JS array
```

`JSON.parse()` reverses the serialization so the rest of the app receives real JavaScript objects it can work with. Both loaders are wrapped in `try/catch` to handle any corrupted data gracefully.

### Initialisation Decision Tree (`init()`)

```
Page loads
    │
    ├── NOTES ──────────────────────────────────────────────────
    │       loadFromLocalStorage()
    │               │
    │       ┌───────┴──────────┐
    │   length > 0         length === 0
    │   (returning)        (first visit)
    │       │                   │
    │   notes = saved      notes = [2 seed notes]
    │                      saveToLocalStorage()
    │       │                   │
    │       └───────┬───────────┘
    │           renderNotes()
    │
    └── TODOS ──────────────────────────────────────────────────
            loadTodosFromLocalStorage()
                    │
            ┌───────┴──────────┐
        length > 0         length === 0
        (returning)        (first visit)
            │                   │
        todos = saved       todos = []   (blank slate, no seed)
            │                   │
            └───────┬───────────┘
                updateTodoBadge()   (badge shown on sidebar immediately)
```

---

## 🚀 Getting Started

CloudNote requires no installation, build step, or server. Any simple static file server works.

### Option 1 — Python (built-in, zero setup)

```bash
python3 -m http.server 5000
```

Then open `http://localhost:5000` in your browser.

### Option 2 — VS Code Live Server

Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, right-click `index.html`, and choose **Open with Live Server**.

### Option 3 — Any Static Host

Upload `index.html`, `style.css`, and `app.js` to GitHub Pages, Netlify, Vercel, or Replit and the app is live immediately.

> **Note:** Because CloudNote uses `localStorage`, each browser/device maintains its own independent data. Notes and tasks do not sync across devices.

---

## 🗺️ Future Roadmap

| Feature | Description |
|---|---|
| 🔍 **Search Notes** | Live filter bar that narrows the card grid as the user types |
| 🔢 **Note Counter** | Dynamic badge in the sidebar showing the total note count |
| 📭 **Enhanced Empty State** | Illustrated empty-state UI with a clear call-to-action |
| 🌙 **Dark Mode** | Toggle between light and dark themes, preference saved to `localStorage` |
| 📤 **Export Notes** | Download all notes as a `.json` or `.txt` file for backup |
| ♿ **Accessibility Improvements** | Full keyboard navigation, ARIA labels, and focus management |

---

## 👤 Author

**CloudNote** is a portfolio project developed as part of a structured front-end learning curriculum.

- Built with vanilla HTML, CSS, and JavaScript — no frameworks
- Designed to demonstrate clean architecture, educational code style, and progressive feature development
- Open for extension, forking, and learning

---

*CloudNote — Your ideas, in the cloud.* ☁️
