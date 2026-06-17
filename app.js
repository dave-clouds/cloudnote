// =============================================================
//  CloudNote — app.js
//  Vanilla JavaScript powering all note CRUD operations,
//  the To-Do List module, and tab-switching.
//  Read the comments throughout to understand each concept!
// =============================================================


// -------------------------------------------------------------
// 1. GLOBAL STATE
//    Each module owns its own array. Notes and Todos never
//    mix — they are completely independent data structures,
//    stored under different LocalStorage keys, and rendered
//    by different functions.
// -------------------------------------------------------------
let notes = [];
//  ^ Each element will look like this:
//    {
//      id:      1718000000000,   // unique number (from Date.now())
//      title:   "My note title",
//      content: "Body text here.",
//      date:    "June 17, 2026 at 3:04 PM"
//    }

let todos = [];
//  ^ The To-Do array lives alongside notes but is completely
//    separate. Each element will look like this:
//    {
//      id:        1718000000001,  // Date.now() — always unique
//      text:      "Finish CloudNote",
//      completed: false,          // toggled by the custom checkbox
//      createdAt: "6/17/2026"     // toLocaleDateString() — short form
//    }


// -------------------------------------------------------------
// 2. DOM REFERENCES
//    We cache (grab and store) references to the HTML elements
//    we'll interact with most often. Doing this once at the top
//    is faster than calling document.getElementById() every
//    time a user clicks something.
//
//    Notes elements and Todo elements are grouped separately
//    so it's easy to see at a glance which module owns what.
// -------------------------------------------------------------

// --- Notes module elements ---
const noteTitleInput   = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
const saveBtn          = document.getElementById('save-btn');
const cancelBtn        = document.getElementById('cancel-btn');
const notesForm        = document.getElementById('notes-form');
const searchInput      = document.getElementById('search-input');
const notesSearchArea  = document.getElementById('notes-search-area');
const notesBadge       = document.getElementById('notes-badge');

// --- To-Do module elements ---
const todoInput        = document.getElementById('todo-input');
const addTodoBtn       = document.getElementById('add-todo-btn');
const todoForm         = document.getElementById('todo-form');
const todoBadge        = document.getElementById('todo-badge');

// --- Shared layout elements ---
const workspace        = document.getElementById('workspace');
const canvasTitle      = document.getElementById('canvas-title');
const canvasSubtitle   = document.getElementById('canvas-subtitle');
const navTabs          = document.querySelectorAll('.nav-tab');
//  ^ querySelectorAll returns a NodeList (like an array) of
//    ALL elements that match the CSS selector '.nav-tab'.


// =============================================================
//  3. PERSISTENCE LAYER — LocalStorage helpers
//
//  LocalStorage is a key/value store built into every browser.
//  It survives page refreshes and browser restarts, making it
//  perfect for lightweight client-side persistence.
//
//  The two rules of LocalStorage:
//    - It can only store STRINGS (not objects or arrays).
//    - All reads/writes are synchronous (instant, no await).
//
//  INDEPENDENT KEYS — Notes and Todos each have their own key.
//  This means:
//    • Deleting all notes never touches the todos.
//    • Deleting all todos never touches the notes.
//    • Each module can evolve its data shape independently.
// =============================================================

const STORAGE_KEY      = 'cloudnote_data';   // Notes persistence key
const TODO_STORAGE_KEY = 'cloudnote_todos';  // Todos persistence key
//  ^ Two separate keys = two completely isolated data buckets
//    in the same browser storage area.


// -------------------------------------------------------------
// saveToLocalStorage()
//
//  Serializes the entire notes array into a JSON string and
//  writes it to LocalStorage under our storage key.
//
//  Why JSON.stringify()?
//  LocalStorage only accepts strings. Our `notes` variable is
//  a JavaScript array of objects — a complex data structure.
//  JSON.stringify() converts it into a flat text representation,
//  for example:
//    [{"id":1718000000000,"title":"Hello","content":"World","date":"..."}]
//  That string is what actually gets stored in the browser.
// -------------------------------------------------------------
function saveToLocalStorage() {
  const serialized = JSON.stringify(notes);
  //  JSON.stringify() walks the array and encodes every object,
  //  string, and number into valid JSON text.

  localStorage.setItem(STORAGE_KEY, serialized);
  //  setItem(key, value) writes the string to LocalStorage.
  //  If the key already exists its value is silently overwritten,
  //  which is exactly what we want — we always mirror the current
  //  state of the notes array, nothing more.
}


// -------------------------------------------------------------
// loadFromLocalStorage()
//
//  Reads the stored JSON string from LocalStorage, parses it
//  back into a JavaScript array, and returns it.
//  Returns an empty array [] if nothing has been saved yet.
//
//  Why JSON.parse()?
//  LocalStorage gives us back the raw string we stored.
//  JSON.parse() reverses JSON.stringify() — it reads the text
//  and reconstructs the original JavaScript data structure
//  (our array of note objects) so we can work with it normally.
// -------------------------------------------------------------
function loadFromLocalStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  //  getItem(key) returns the stored string, or null if the
  //  key has never been set.

  if (stored === null) {
    // Nothing saved yet — this is a brand-new visitor.
    // Return an empty array so the caller can decide what to do.
    return [];
  }

  // JSON.parse() can throw a SyntaxError if the stored string
  // is somehow corrupted. We wrap it in try/catch so a bad
  // value never crashes the whole app — we just start fresh.
  try {
    return JSON.parse(stored);
    //  JSON.parse() returns the reconstructed JavaScript value.
    //  In our case that's always an array of note objects.
  } catch (error) {
    console.warn('CloudNote: could not parse saved data. Starting fresh.', error);
    return [];
  }
}


// -------------------------------------------------------------
// saveTodosToLocalStorage()
//
//  Mirror of saveToLocalStorage() but for the todos array.
//  Writes to TODO_STORAGE_KEY so it never collides with notes.
// -------------------------------------------------------------
function saveTodosToLocalStorage() {
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
  //  Same pattern as notes: stringify the array into a string,
  //  store it under a dedicated key. Nothing else is touched.
}


// -------------------------------------------------------------
// loadTodosFromLocalStorage()
//
//  Reads and parses the saved todos. Returns [] if nothing
//  has been stored yet, or if the data is somehow corrupted.
// -------------------------------------------------------------
function loadTodosFromLocalStorage() {
  const stored = localStorage.getItem(TODO_STORAGE_KEY);

  if (stored === null) {
    return []; // First visit — no todos have been saved yet.
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.warn('CloudNote: could not parse saved todos. Starting fresh.', error);
    return [];
  }
}


// -------------------------------------------------------------
// 4. HELPER — formatDate()
//    Converts a JavaScript Date object into a human-readable
//    string like "June 17, 2026 at 3:04 PM".
// -------------------------------------------------------------
function formatDate(dateObj) {
  return dateObj.toLocaleString('en-US', {
    year:   'numeric',
    month:  'long',
    day:    'numeric',
    hour:   'numeric',
    minute: '2-digit',
  });
}


// =============================================================
//  4. READ — renderNotes(displayArray)
//
//  Rebuilds the visible card grid from scratch on every call.
//
//  Parameter:
//    displayArray (optional) — the subset of notes to show.
//    When omitted, the full notes[] array is used (normal view).
//    When passed from filterNotes(), it contains only matches.
//
//  Pattern:  1. Wipe the old HTML
//            2. Check for an empty array → show a placeholder
//            3. Loop through the array → build a card per note
//            4. Inject the finished HTML into the DOM
//            5. Re-initialize Feather Icons on the new markup
// =============================================================
function renderNotes(displayArray) {

  // Always sync the notes badge whenever we render — whether
  // that's the full list, a filtered subset, or an empty state.
  // The badge always reflects notes.length (the real total),
  // NOT the filtered subset, so searching for "cloud" doesn't
  // make the badge drop to "1" when 5 notes exist.
  updateNotesBadge();

  // If no argument was passed, default to the full notes array.
  // The || operator returns the right side when the left is falsy.
  // undefined (no argument) is falsy, so we fall back to notes[].
  const list = displayArray || notes;

  // Step 1 — Clear whatever HTML is currently in the workspace.
  workspace.innerHTML = '';

  // Step 2 — Show the appropriate empty state based on context.
  if (list.length === 0) {
    // Two different messages depending on WHY the list is empty:
    //   • Search returned nothing → "no matching notes"
    //   • Notes array itself is empty → "no notes yet"
    const isSearching = searchInput && searchInput.value.trim() !== '';

    workspace.innerHTML = isSearching
      ? `<div class="empty-state">
           <span class="empty-icon">🔍</span>
           <p>No matching notes found.</p>
         </div>`
      : `<div class="empty-state">
           <span class="empty-icon">📋</span>
           <p>No notes yet — write your first one above!</p>
         </div>`;
    return; // Exit early; nothing else to render.
  }

  // Step 3 — Build an HTML string by looping through every note.
  // We use .map() to transform each note object into an HTML
  // string, then .join('') to stitch those strings into one big
  // block with no commas between them.
  // NOTE: we loop `list`, not `notes`, so that when filterNotes()
  // passes a filtered subset we only render the matching cards.
  const cardsHTML = list.map(note => {

    // Each note gets a card. We embed the note's unique `id`
    // directly in the button as a data attribute so we can read
    // it back when the user clicks edit or delete.
    return `
      <article class="note-card">

        <h3 class="note-card-title" title="${escapeHTML(note.title)}">
          ${escapeHTML(note.title)}
        </h3>

        <p class="note-card-content">
          ${escapeHTML(note.content)}
        </p>

        <time class="note-card-timestamp">
          🕐 ${note.date}
        </time>

        <div class="note-card-actions">

          <!-- Edit button — stores this note's id so we know
               which note to load into the form -->
          <button
            class="icon-btn edit"
            data-id="${note.id}"
            title="Edit note"
            onclick="editNote(${note.id})"
          >
            <i data-feather="edit-2"></i>
          </button>

          <!-- Delete button — same idea: id tells us which
               note to remove from the array -->
          <button
            class="icon-btn delete"
            data-id="${note.id}"
            title="Delete note"
            onclick="deleteNote(${note.id})"
          >
            <i data-feather="trash-2"></i>
          </button>

        </div>
      </article>
    `;
  }).join('');

  // Step 4 — Inject the entire block of card HTML into the DOM.
  workspace.innerHTML = cardsHTML;

  // Step 5 — Feather Icons parses <i data-feather="..."> tags
  // and replaces them with inline SVGs. We must call this again
  // whenever we inject new HTML that contains feather icons.
  feather.replace();
}


// =============================================================
//  5. SEARCH — filterNotes()
//
//  Called on every keystroke inside the search bar.
//  Reads the query, filters notes[], and passes the results
//  to renderNotes() as the optional displayArray argument.
//
//  How the search state flows:
//
//    keystroke  →  'input' event fires
//                       │
//                  filterNotes() reads searchInput.value
//                       │
//                  query === ''   →  renderNotes()        (show all)
//                  query !== ''   →  Array.filter()
//                                         │
//                                    renderNotes(matches)  (show subset)
//
//  Key design decisions:
//    • We NEVER write to LocalStorage during a search — it's a
//      read-only view of the existing notes[] array.
//    • We NEVER mutate notes[] — the filter builds a fresh
//      temporary array and throws it away after each render.
//    • Case-insensitive matching is achieved by lowercasing BOTH
//      the query and the fields before comparing.
// =============================================================
function filterNotes() {

  // Read the current value and strip surrounding whitespace.
  const query = searchInput.value.trim().toLowerCase();
  //  .toLowerCase() normalises the query so "Cloud" matches
  //  "cloud", "CLOUD", "Cloud", etc.

  if (query === '') {
    // Empty bar → show all notes with no filtering.
    // Calling renderNotes() with no argument defaults to notes[].
    renderNotes();
    return;
  }

  // Array.filter() returns a NEW array containing only the
  // elements for which the callback returns true.
  // The original notes[] is never modified.
  const matches = notes.filter(note => {

    // Lowercase both sides so comparison is case-insensitive.
    const inTitle   = note.title.toLowerCase().includes(query);
    const inContent = note.content.toLowerCase().includes(query);

    // Keep this note if the query appears in EITHER the title
    // OR the content. The || (OR) operator returns true if at
    // least one side is true.
    return inTitle || inContent;
  });

  // Pass the filtered subset to renderNotes().
  // renderNotes() handles the "no matches" empty state internally
  // by checking whether searchInput has a value.
  renderNotes(matches);
}


// -------------------------------------------------------------
// 6. HELPER — escapeHTML()
//    Security note: never inject user-typed text directly into
//    innerHTML without escaping it first. If someone types
//    <script>alert('hi')</script> as a note, we don't want
//    that code to actually run. This function converts the
//    dangerous characters into safe HTML entities.
// -------------------------------------------------------------
function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}


// =============================================================
//  6. CREATE / UPDATE — handleSave()
//
//  This single function handles BOTH creating a new note AND
//  saving edits to an existing one. We know which mode we're
//  in by checking saveBtn.dataset.editing:
//    - Empty string ""  → CREATE mode
//    - A number string  → EDIT mode (that number is the note id)
// =============================================================
function handleSave() {

  // Read and trim whitespace from the input fields.
  const title   = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();

  // Don't save a completely empty note.
  if (!title && !content) {
    noteTitleInput.focus();
    noteTitleInput.style.borderColor = 'var(--color-danger)';
    setTimeout(() => noteTitleInput.style.borderColor = '', 1000);
    return;
  }

  // --- Determine CREATE vs EDIT mode ---
  const editingId = saveBtn.dataset.editing;

  if (editingId === '') {
    // ---- CREATE MODE ----
    // Build a new note object and push it onto the array.
    const newNote = {
      id:      Date.now(),   // milliseconds since Jan 1 1970 — always unique
      title:   title || 'Untitled',
      content: content,
      date:    formatDate(new Date()),
    };

    notes.push(newNote);
    // notes array now has one more item at the end.

  } else {
    // ---- EDIT MODE ----
    // Convert the stored string id back to a number so we
    // can compare it with the numeric ids in the array.
    const id = Number(editingId);

    // Find the index of the note we're editing.
    // findIndex() loops the array and returns the position of
    // the first element where the test function returns true.
    const index = notes.findIndex(n => n.id === id);

    if (index !== -1) {
      // Overwrite just the fields the user can change.
      // We keep the original id and date intact.
      notes[index].title   = title || 'Untitled';
      notes[index].content = content;
      // Optionally you could add an "edited" timestamp here.
    }

    // Reset the button back to CREATE mode.
    saveBtn.dataset.editing = '';
    saveBtn.textContent     = 'Save Note';
    cancelBtn.style.display = 'none';
  }

  // Clear the input fields so they're ready for the next note.
  clearForm();

  // Re-draw all cards to reflect the updated array.
  renderNotes();

  // Persist the updated array to LocalStorage so this change
  // survives a page refresh. We call this AFTER renderNotes()
  // so the UI and storage always update together.
  saveToLocalStorage();
}


// =============================================================
//  7. UPDATE — editNote(id)
//
//  Called when the user clicks the ✏️ edit icon on a card.
//  We look up the note by id, load its data into the form
//  inputs, and switch the Save button into EDIT mode.
// =============================================================
function editNote(id) {

  // find() returns the first array element where the test is
  // true, or undefined if nothing matches.
  const note = notes.find(n => n.id === id);

  if (!note) return; // Safety check — note not found, do nothing.

  // Populate the form inputs with the existing note data.
  noteTitleInput.value   = note.title;
  noteContentInput.value = note.content;

  // Store the id on the Save button so handleSave() knows
  // it's in edit mode and which note to update.
  saveBtn.dataset.editing = id;
  saveBtn.textContent     = 'Update Note';

  // Show the Cancel button so the user can abort the edit.
  cancelBtn.style.display = 'inline-flex';

  // Size the textarea to fit the loaded content immediately.
  // Without this call the box would stay at its CSS min-height
  // even if the note is much longer, causing a jarring jump
  // the moment the user starts typing.
  autoResizeTextarea();

  // Scroll to the top of the page and focus the title input
  // so the user knows the form is ready.
  noteTitleInput.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// =============================================================
//  8. DELETE — deleteNote(id)
//
//  Called when the user clicks the 🗑️ delete icon on a card.
//  We use .filter() to build a NEW array that contains every
//  note EXCEPT the one matching the given id, then replace
//  the old array with the new one.
// =============================================================
function deleteNote(id) {

  // Optional: ask for confirmation before deleting.
  const confirmed = window.confirm('Delete this note? This cannot be undone.');
  if (!confirmed) return;

  // .filter() loops the array and keeps only elements where
  // the test function returns true. Notes where n.id === id
  // return false, so they get dropped from the new array.
  notes = notes.filter(n => n.id !== id);

  // If we were in the middle of editing the note we just
  // deleted, reset the form back to create mode.
  if (saveBtn.dataset.editing === String(id)) {
    cancelEdit();
  }

  // Re-draw to reflect the removal.
  renderNotes();

  // Sync LocalStorage with the notes array now that one item
  // has been filtered out. The deleted note will not come back
  // on the next page load.
  saveToLocalStorage();
}


// -------------------------------------------------------------
// 9. HELPER — autoResizeTextarea()
//
//  Makes the note content textarea grow as the user types,
//  eliminating the internal scrollbar while keeping the
//  manual resize handle available.
//
//  How it works:
//    1. Set height to 'auto' — this forces the browser to
//       recalculate and collapse the element to its minimum.
//    2. Read scrollHeight — the total height needed to display
//       ALL the content without clipping.
//    3. Set height to that scrollHeight value in pixels.
//
//  Why the two-step 'auto' then scrollHeight?
//  If we only set height = scrollHeight, the element never
//  shrinks when the user deletes lines — scrollHeight would
//  already be equal to the current (too-tall) height. Resetting
//  to 'auto' first forces a fresh measurement every time.
//
//  CSS requirement: overflow: hidden on .form-textarea
//  ensures no scrollbar flashes during the resize calculation.
// -------------------------------------------------------------
function autoResizeTextarea() {
  noteContentInput.style.height = 'auto';
  noteContentInput.style.height = noteContentInput.scrollHeight + 'px';
}


// -------------------------------------------------------------
// 10. HELPER — clearForm()
//     Empties both input fields and resets textarea height.
//     Called after every save, cancel, or edit operation.
// -------------------------------------------------------------
function clearForm() {
  noteTitleInput.value          = '';
  noteContentInput.value        = '';
  // Reset textarea back to its CSS min-height so the form
  // doesn't stay tall after a long note is saved.
  noteContentInput.style.height = '';
}


// -------------------------------------------------------------
// 10. HELPER — cancelEdit()
//     Resets the form and Save button back to CREATE mode
//     without saving anything. Wired to the Cancel button.
// -------------------------------------------------------------
function cancelEdit() {
  clearForm();
  saveBtn.dataset.editing = '';
  saveBtn.textContent     = 'Save Note';
  cancelBtn.style.display = 'none';
}


// =============================================================
//  TO-DO MODULE — functions 11 through 14
//
//  This entire block is self-contained. It has its own:
//    • State array  (todos[])
//    • Render func  (renderTodos)
//    • CRUD funcs   (addTodo, toggleTodo, deleteTodo)
//    • Badge update (updateTodoBadge)
//    • Persistence  (saveTodosToLocalStorage / load...)
//  None of these functions touch the notes[] array or the
//  notes storage key — the two modules are fully isolated.
// =============================================================


// -------------------------------------------------------------
// 11. updateNotesBadge()
//
//  Mirrors updateTodoBadge() for the My Notes tab.
//  Shows the TOTAL number of saved notes in the pill.
//
//  Design choice: unlike the todo badge (which only counts
//  incomplete tasks), the notes badge counts every note —
//  including ones being edited — because all notes have equal
//  value and there's no "done" state for a note.
//
//  Hidden entirely at 0 to avoid showing an empty "0" pill
//  when the workspace is blank (first visit, or after deleting
//  the last note).
// -------------------------------------------------------------
function updateNotesBadge() {

  const total = notes.length;
  //  notes.length is the simplest possible count — no filter
  //  needed because every entry in notes[] is a "live" note.

  if (total > 0) {
    notesBadge.textContent   = total;
    notesBadge.style.display = 'inline-block';
  } else {
    notesBadge.style.display = 'none';
  }
}


// -------------------------------------------------------------
// 12. updateTodoBadge()
//
//  Counts the incomplete tasks and shows that number in the
//  pill badge next to the sidebar tab.
//
//  A badge of "0" is hidden entirely to keep the UI clean —
//  we only show a number when there's real work remaining.
// -------------------------------------------------------------
function updateTodoBadge() {

  // .filter() counts only tasks where completed is still false.
  const remaining = todos.filter(t => !t.completed).length;

  if (remaining > 0) {
    todoBadge.textContent    = remaining;
    todoBadge.style.display  = 'inline-block';
  } else {
    todoBadge.style.display  = 'none';
    //  Hiding at 0 prevents showing "0" which looks odd and
    //  adds no useful information.
  }
}


// -------------------------------------------------------------
// 12. renderTodos()
//
//  Clears the workspace and rebuilds the entire To-Do list
//  from the todos[] array. Called after every mutation.
//
//  Structure injected:
//    <div class="todo-list-wrapper">   ← spans full grid width
//      <li class="todo-item [completed]">
//        custom checkbox | text + date | delete button
//      </li>
//      ...
//    </div>
// -------------------------------------------------------------
function renderTodos() {

  // Always sync the badge whenever we render.
  updateTodoBadge();

  workspace.innerHTML = '';

  // Empty state — no tasks yet.
  if (todos.length === 0) {
    workspace.innerHTML = `
      <div class="todo-empty-state">
        <span class="todo-empty-icon">✅</span>
        <p>No tasks yet — add your first one above!</p>
      </div>
    `;
    return;
  }

  // Build a wrapper div that spans the full grid, then fill it
  // with one <div> per todo item.
  //
  // Why a wrapper instead of direct grid children?
  // The workspace uses CSS Grid for notes cards. The To-Do list
  // is a vertical column. Wrapping in a grid-column:1/-1 div
  // lets us use flexbox internally without fighting the grid.
  const itemsHTML = todos.map(todo => {

    // We pass the id into onclick so each button knows exactly
    // which task to target when clicked.
    return `
      <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">

        <!-- CUSTOM CHECKBOX
             The hidden <input> tracks the true/false state.
             The visible <span> is styled via CSS using the
             adjacent sibling selector (+) triggered by :checked.
             onclick fires toggleTodo() because pointer-events
             on the input are disabled — the label handles clicks. -->
        <label class="todo-checkbox-label" title="${todo.completed ? 'Mark incomplete' : 'Mark complete'}">
          <input
            type="checkbox"
            class="todo-checkbox-input"
            ${todo.completed ? 'checked' : ''}
            onchange="toggleTodo(${todo.id})"
          />
          <span class="todo-checkbox-custom"></span>
        </label>

        <!-- Task text and created date -->
        <div class="todo-item-body">
          <span class="todo-item-text">${escapeHTML(todo.text)}</span>
          <span class="todo-item-date">Added ${todo.createdAt}</span>
        </div>

        <!-- Delete button -->
        <button
          class="icon-btn delete"
          title="Delete task"
          onclick="deleteTodo(${todo.id})"
        >
          <i data-feather="trash-2"></i>
        </button>

      </div>
    `;
  }).join('');

  workspace.innerHTML = `<div class="todo-list-wrapper">${itemsHTML}</div>`;

  // Re-initialize Feather Icons on the newly injected HTML.
  feather.replace();
}


// -------------------------------------------------------------
// 13. addTodo()
//
//  Reads the todo input field, creates a new task object,
//  pushes it to the todos array, persists, and re-renders.
//
//  Data shape created here:
//    { id, text, completed: false, createdAt }
// -------------------------------------------------------------
function addTodo() {

  const text = todoInput.value.trim();

  // Don't add a blank task.
  if (!text) {
    todoInput.focus();
    todoInput.style.borderColor = 'var(--color-danger)';
    setTimeout(() => todoInput.style.borderColor = '', 1000);
    return;
  }

  // Build the new task object.
  const newTodo = {
    id:        Date.now(),
    //  Date.now() gives us a millisecond timestamp — unique as
    //  long as the user isn't creating tasks faster than 1/ms.
    text:      text,
    completed: false,
    //  All new tasks start incomplete. The user checks them off.
    createdAt: new Date().toLocaleDateString(),
    //  toLocaleDateString() returns a short date like "6/17/2026"
    //  which is more compact than the full formatDate() output.
  };

  todos.push(newTodo);
  //  push() adds the new task to the END of the array.
  //  The most recently added task always appears at the bottom.

  todoInput.value = ''; // Clear input for the next task.
  todoInput.focus();    // Keep focus so the user can type immediately.

  renderTodos();
  saveTodosToLocalStorage();
}


// -------------------------------------------------------------
// 14. toggleTodo(id)
//
//  Flips the completed boolean on a single task.
//  Called by the custom checkbox's onchange event.
//
//  We use findIndex() to locate the task, then directly mutate
//  its .completed property — no need to replace the whole array.
// -------------------------------------------------------------
function toggleTodo(id) {

  const index = todos.findIndex(t => t.id === id);
  //  findIndex() returns the position (-1 if not found).

  if (index === -1) return; // Safety check.

  // Flip the boolean: true → false, false → true.
  todos[index].completed = !todos[index].completed;
  //  The ! (NOT) operator inverts a boolean.
  //  If the task was false (incomplete), it becomes true (done).
  //  If it was true (done), it becomes false (back on the list).

  renderTodos();
  saveTodosToLocalStorage();
}


// -------------------------------------------------------------
// 15. deleteTodo(id)
//
//  Removes a task permanently using the same .filter() pattern
//  used in deleteNote() — builds a new array that excludes the
//  task matching the given id.
// -------------------------------------------------------------
function deleteTodo(id) {

  todos = todos.filter(t => t.id !== id);
  //  Every task where t.id !== id survives into the new array.
  //  The one matching task is silently dropped.

  renderTodos();
  saveTodosToLocalStorage();
}


// =============================================================
//  16. TAB TOGGLE — switchTab(tabName)
//
//  Controls which view is visible. Two tabs:
//    "notes"  → shows notes form + card grid
//    "todo"   → shows todo form + task list
// =============================================================
function switchTab(tabName) {

  // --- Update active styling on sidebar buttons ---
  // Loop through every .nav-tab button and toggle the
  // 'active' class based on whether its data-tab matches.
  navTabs.forEach(tab => {
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // --- Swap visible form and render the right workspace ---
  if (tabName === 'notes') {

    // Show Notes form + search bar, hide Todo form.
    notesForm.style.display       = 'block';
    notesSearchArea.style.display = 'block';
    todoForm.style.display        = 'none';

    canvasTitle.textContent    = 'All Notes';
    canvasSubtitle.textContent = 'Capture your thoughts below.';

    // Clear any stale search query so returning to the tab always
    // shows the full notes grid rather than a previous filter.
    searchInput.value = '';

    renderNotes();

  } else if (tabName === 'todo') {

    // Show Todo form, hide Notes form + search bar.
    notesForm.style.display       = 'none';
    notesSearchArea.style.display = 'none';
    todoForm.style.display        = 'block';

    canvasTitle.textContent    = 'To-Do List';
    canvasSubtitle.textContent = 'Track your tasks below.';

    renderTodos();
    todoInput.focus();
  }
}


// =============================================================
//  17. EVENT LISTENERS
//
//  Event listeners are the bridge between user actions (clicks,
//  key presses) and our JavaScript functions. We attach them
//  once here at the bottom so all our functions are already
//  defined when the listeners fire.
//
//  Notes listeners and Todo listeners are grouped separately.
// =============================================================

// --- Notes: Save / Update button ---
saveBtn.addEventListener('click', handleSave);

// --- Notes: Cancel edit mode ---
cancelBtn.addEventListener('click', cancelEdit);

// --- Notes: Enter in title jumps to content textarea ---
noteTitleInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault();       // stop the form from submitting
    noteContentInput.focus();     // move cursor to the textarea
  }
});

// --- Notes: Ctrl+Enter (Cmd+Enter) inside textarea saves ---
noteContentInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    handleSave();
  }
});

// --- Notes: Auto-resize textarea as the user types ---
// The 'input' event fires on every character typed, pasted,
// or deleted — making it the right hook for live resizing.
// We also call autoResizeTextarea() when loading a note into
// edit mode (in editNote()) so the box sizes to existing content.
noteContentInput.addEventListener('input', autoResizeTextarea);

// --- Notes: Live search on every keystroke ---
// The 'input' event fires after EVERY change to the field
// (typing, pasting, clearing with backspace) — perfect for
// real-time filtering without needing a submit button.
searchInput.addEventListener('input', filterNotes);

// --- Todo: "Add Task" button click ---
addTodoBtn.addEventListener('click', addTodo);

// --- Todo: pressing Enter in the task input also adds a task ---
todoInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    addTodo();
    //  This mirrors the Ctrl+Enter pattern from Notes —
    //  pressing Enter is the natural way to submit a single-
    //  line input, so we wire it up for a smoother experience.
  }
});

// --- Sidebar tabs: wire each tab to switchTab() ---
// 'data-tab' attribute on each button tells us which tab was clicked.
navTabs.forEach(tab => {
  tab.addEventListener('click', function () {
    switchTab(this.dataset.tab); // 'this' refers to the clicked button
  });
});


// =============================================================
//  18. INITIALISATION — runs once when the page first loads
//
//  Handles BOTH modules independently:
//
//  NOTES decision tree:
//    1. Check LocalStorage for saved notes.
//    2. Found  → restore into notes[] and render.
//    3. Not found → seed two example notes, persist, render.
//
//  TODOS decision tree:
//    1. Check LocalStorage for saved todos.
//    2. Found  → restore into todos[].
//    3. Not found → start with an empty list (no seeding needed).
//
//  The two modules never interfere with each other here.
//  Notes are loaded under 'cloudnote_data'.
//  Todos are loaded under 'cloudnote_todos'.
// =============================================================
(function init() {

  // ---- NOTES ------------------------------------------------
  const savedNotes = loadFromLocalStorage();

  if (savedNotes.length > 0) {
    // Returning user — restore their notes exactly as saved.
    notes = savedNotes;
  } else {
    // First-time visitor — seed two onboarding notes.
    notes = [
      {
        id:      Date.now() - 2000,
        title:   'Welcome to CloudNote ☁️',
        content: 'This is your personal note-taking space. Click the edit icon to change a note, or the trash icon to delete it. Hit "Save Note" above to add your own!',
        date:    formatDate(new Date()),
      },
      {
        id:      Date.now() - 1000,
        title:   'Keyboard Shortcuts',
        content: 'Press Enter in the title field to jump to the content area. Press Ctrl+Enter (Cmd+Enter on Mac) inside the content area to save your note instantly. Switch to the To-Do tab to manage your tasks!',
        date:    formatDate(new Date()),
      },
    ];
    // Persist seeds immediately so a refresh loads them.
    saveToLocalStorage();
  }

  renderNotes(); // Draw the notes grid (default view on load).

  // ---- TODOS ------------------------------------------------
  const savedTodos = loadTodosFromLocalStorage();
  //  Unlike notes, todos have no seed data. An empty list is a
  //  perfectly valid starting state — there's nothing confusing
  //  about a blank To-Do tab on a first visit.

  if (savedTodos.length > 0) {
    todos = savedTodos; // Restore saved tasks.
  }
  //  If savedTodos is empty we just leave todos = [] as-is.

  // Update the badge immediately so the sidebar already shows
  // a count if the user has outstanding tasks from last session.
  updateTodoBadge();
  //  We call updateTodoBadge() here (not renderTodos()) because
  //  the workspace is currently showing the Notes grid. We only
  //  render the todo list when the user clicks the tab.

})();
// The parentheses at the end immediately invoke this function —
// it's called an IIFE (Immediately Invoked Function Expression).
