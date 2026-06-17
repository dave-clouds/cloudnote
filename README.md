# ☁️ CloudNote

A clean, modern, client-side note-taking application built with vanilla HTML, CSS, and JavaScript. CloudNote was developed as a portfolio milestone project to demonstrate fundamental front-end engineering skills — including DOM manipulation, array-driven state management, browser persistence, and responsive layout design — without relying on any frameworks or external libraries.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Features](#-features)
3. [Technologies Used](#-technologies-used)
4. [File Structure](#-file-structure)
5. [How the Notes System Works](#-how-the-notes-system-works)
6. [LocalStorage Persistence](#-localstorage-persistence)
7. [Getting Started](#-getting-started)
8. [Future Roadmap](#-future-roadmap)
9. [Author](#-author)

---

## 🌐 Project Overview

CloudNote is a fully functional, single-page note-taking dashboard. Users can create, read, update, and delete personal notes entirely within the browser — no server, no database, no sign-up required. All data is persisted automatically using the browser's built-in `localStorage` API, meaning notes survive page refreshes and browser restarts.

The codebase is intentionally written with heavy inline comments to serve as a learning resource. Every function explains the JavaScript concept it demonstrates alongside the feature it implements.

---

## ✨ Features

### 📝 Notes (Full CRUD)
- **Create** — Write a note with a title and body, then save it instantly.
- **Read** — All saved notes are displayed in a responsive card grid.
- **Update** — Click the edit icon on any card to load it back into the form for changes.
- **Delete** — Remove any note permanently with a single click (with confirmation).

### 💾 LocalStorage Persistence
- Notes are automatically saved to `localStorage` after every create, update, and delete operation.
- On page load the app checks for existing saved data and restores it seamlessly.
- First-time visitors are greeted with two onboarding seed notes; returning users always see their own data.

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `Enter` (in title field) | Jump focus to the content textarea |
| `Ctrl + Enter` / `Cmd + Enter` (in content) | Save the current note |

### 🔒 Secure HTML Escaping
User-supplied text is never injected into `innerHTML` without sanitization. A dedicated `escapeHTML()` helper converts `<`, `>`, `"`, and `&` characters into safe HTML entities, preventing accidental (or malicious) script injection.

### 🗂️ Sidebar Tab Navigation
- **My Notes** — displays the note input form and the card grid.
- **To-Do List** — reserved panel with a "coming soon" placeholder (module in progress).

### 📐 Responsive Layout
- A fixed navigation sidebar sits on the left; the main canvas occupies the remaining width.
- The notes grid uses `CSS Grid` with `auto-fill` and `minmax(260px, 1fr)` columns, so it naturally reflows from one column on mobile to many columns on wide screens.
- Breakpoints at `768px` and `560px` progressively adapt the sidebar and canvas padding.

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
├── index.html      # Application shell — layout, sidebar, form, and workspace container
├── style.css       # Full design system — CSS variables, grid, cards, and responsive rules
├── app.js          # All JavaScript — state, CRUD functions, persistence, and event wiring
└── README.md       # Project documentation (this file)
```

Each file has a single, clear responsibility. Keeping them separated makes the codebase easy to navigate and extend.

---

## ⚙️ How the Notes System Works

CloudNote follows a **single source of truth** pattern. One global array — `let notes = []` — owns all application data. The UI is always a reflection of that array, never the other way around.

### Data Shape

Each note is a plain JavaScript object:

```js
{
  id:      1718000000000,       // Date.now() — unique timestamp ID
  title:   "My note title",
  content: "Body text here.",
  date:    "June 17, 2026 at 3:04 PM"
}
```

### The Render Cycle

Every mutation to the `notes` array triggers the same sequence:

```
User action (click / keypress)
        │
        ▼
Mutate notes[]          ← push / splice / filter
        │
        ▼
renderNotes()           ← wipe workspace, loop array, inject HTML cards
        │
        ▼
saveToLocalStorage()    ← JSON.stringify(notes) → localStorage
```

This predictable one-way flow means the displayed cards and stored data are always in sync.

### CRUD Function Map

| Operation | Function | Array Method Used |
|---|---|---|
| Create | `handleSave()` (create path) | `Array.push()` |
| Read | `renderNotes()` | `Array.map()` + `Array.join()` |
| Update | `handleSave()` (edit path) | `Array.findIndex()` + direct mutation |
| Delete | `deleteNote(id)` | `Array.filter()` |

---

## 💾 LocalStorage Persistence

The browser's `localStorage` API stores data as **strings only**. Because our notes are JavaScript objects inside an array, two conversion steps are required.

### Saving — `saveToLocalStorage()`

```js
// 1. Serialize: JavaScript array → JSON string
const serialized = JSON.stringify(notes);

// 2. Write: store the string under a namespaced key
localStorage.setItem('cloudnote_data', serialized);
```

`JSON.stringify()` converts the array and all its objects into a portable text format that `localStorage` can store. Without it, writing the array directly would produce the useless string `"[object Object]"`.

### Loading — `loadFromLocalStorage()`

```js
// 1. Read: retrieve the raw string (or null if never set)
const stored = localStorage.getItem('cloudnote_data');

// 2. Deserialize: JSON string → JavaScript array
return JSON.parse(stored);
```

`JSON.parse()` reverses the process — it reads the text and reconstructs the original JavaScript data structure so the rest of the app can work with real objects and arrays again.

### First-Visit vs. Returning-User Logic (`init()`)

```
Page loads → loadFromLocalStorage()
                    │
         ┌──────────┴──────────┐
    length > 0              length === 0
    (returning user)        (first-time visitor)
         │                       │
    notes = savedNotes      notes = [seed note 1, seed note 2]
                            saveToLocalStorage()  ← persist seeds immediately
         │                       │
         └──────────┬────────────┘
                renderNotes()
```

Saved data is **never overwritten** unless the user explicitly creates, edits, or deletes a note.

---

## 🚀 Getting Started

CloudNote requires no installation, build step, or server. Because the project serves static files, any simple HTTP server works.

### Option 1 — Python (built-in, zero setup)

```bash
# Python 3
python3 -m http.server 5000
```

Then open `http://localhost:5000` in your browser.

### Option 2 — VS Code Live Server

Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, right-click `index.html`, and choose **Open with Live Server**.

### Option 3 — Any Static Host

Upload the three files (`index.html`, `style.css`, `app.js`) to any static hosting platform — GitHub Pages, Netlify, Vercel, or Replit — and the app is live immediately.

> **Note:** Because CloudNote uses `localStorage`, each browser/device maintains its own independent set of notes. Data does not sync across devices.

---

## 🗺️ Future Roadmap

The following features are planned for upcoming development milestones:

| Feature | Description |
|---|---|
| ✅ **To-Do List Module** | Full task management with custom checkboxes and localStorage persistence |
| 🔍 **Search Notes** | Live filter bar that narrows the card grid as the user types |
| 🔢 **Note Counter** | Dynamic badge in the sidebar showing the current note count |
| 📭 **Enhanced Empty State** | Illustrated empty-state UI with a clear call-to-action prompt |
| 🌙 **Dark Mode** | Toggle between light and dark themes, preference saved to localStorage |
| 📤 **Export Notes** | Download all notes as a `.json` or `.txt` file for backup |
| ♿ **Accessibility Improvements** | Full keyboard navigation, ARIA labels, and focus management enhancements |

---

## 👤 Author

**CloudNote** is a portfolio project developed as part of a structured front-end learning curriculum.

- Built with vanilla HTML, CSS, and JavaScript — no frameworks
- Designed to demonstrate clean architecture, educational code style, and progressive feature development
- Open for extension, forking, and learning

---

*CloudNote — Your ideas, in the cloud.* ☁️
