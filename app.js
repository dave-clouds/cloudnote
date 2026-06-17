// =============================================================
//  CloudNote — app.js
//  Vanilla JavaScript powering all note CRUD operations and
//  tab-switching. Read the comments to understand each step!
// =============================================================


// -------------------------------------------------------------
// 1. GLOBAL STATE
//    We keep all notes in a single array that lives in memory
//    while the page is open. An array is perfect here because
//    we can push new items in, filter items out, and loop
//    through every note whenever we need to re-draw the screen.
// -------------------------------------------------------------
let notes = [];
//  ^ Each element will look like this:
//    {
//      id:      1718000000000,   // unique number (from Date.now())
//      title:   "My note title",
//      content: "Body text here.",
//      date:    "June 17, 2026 at 3:04 PM"
//    }


// -------------------------------------------------------------
// 2. DOM REFERENCES
//    We cache (grab and store) references to the HTML elements
//    we'll interact with most often. Doing this once at the top
//    is faster than calling document.getElementById() every
//    time a user clicks something.
// -------------------------------------------------------------
const noteTitleInput   = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
const saveBtn          = document.getElementById('save-btn');
const cancelBtn        = document.getElementById('cancel-btn');
const workspace        = document.getElementById('workspace');
const canvasTitle      = document.getElementById('canvas-title');
const canvasSubtitle   = document.getElementById('canvas-subtitle');
const notesForm        = document.getElementById('notes-form');
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
//  We use a single key so all our data lives in one place.
// =============================================================

const STORAGE_KEY = 'cloudnote_data';
//  ^ Defining the key as a constant means we never risk a
//    typo causing a mismatch between saves and loads.


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
//  4. READ — renderNotes()
//
//  This is the most important function in the app. Every time
//  the data changes (add / edit / delete), we call renderNotes()
//  to completely rebuild the visible cards from scratch.
//
//  Pattern:  1. Wipe the old HTML
//            2. Check for an empty array → show a placeholder
//            3. Loop through the array → build a card per note
//            4. Inject the finished HTML into the DOM
//            5. Re-initialize Feather Icons on the new markup
// =============================================================
function renderNotes() {

  // Step 1 — Clear whatever HTML is currently in the workspace.
  // innerHTML = '' is the quickest way to empty a container.
  workspace.innerHTML = '';

  // Step 2 — If the notes array has no items, show an empty
  // state so the user knows what to do next.
  if (notes.length === 0) {
    workspace.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📋</span>
        <p>No notes yet — write your first one above!</p>
      </div>
    `;
    return; // Exit early; nothing else to render.
  }

  // Step 3 — Build an HTML string by looping through every note.
  // We use .map() to transform each note object into an HTML
  // string, then .join('') to stitch those strings into one big
  // block with no commas between them.
  const cardsHTML = notes.map(note => {

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


// -------------------------------------------------------------
// 5. HELPER — escapeHTML()
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
// 9. HELPER — clearForm()
//    Empties both input fields. Called after every save.
// -------------------------------------------------------------
function clearForm() {
  noteTitleInput.value   = '';
  noteContentInput.value = '';
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
//  11. TAB TOGGLE — switchTab(tabName)
//
//  Controls which view is visible. There are two tabs:
//    "notes"  → shows the form + note grid
//    "todo"   → hides the form + shows a coming-soon message
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

  // --- Swap out the canvas content based on chosen tab ---
  if (tabName === 'notes') {

    // Show the input form.
    notesForm.style.display = 'block';

    // Update the header text.
    canvasTitle.textContent    = 'All Notes';
    canvasSubtitle.textContent = 'Capture your thoughts below.';

    // Re-render the notes grid.
    renderNotes();

  } else if (tabName === 'todo') {

    // Hide the notes input form — To-Do has its own UI (coming soon).
    notesForm.style.display = 'none';

    // Update the header text.
    canvasTitle.textContent    = 'To-Do List';
    canvasSubtitle.textContent = 'Stay on top of your tasks.';

    // Replace the workspace content with a placeholder message.
    workspace.innerHTML = `
      <div class="todo-placeholder">
        <span class="todo-icon">🚧</span>
        <h2>Coming Soon!</h2>
        <p>To-Do list functionality is on its way.<br>
           Check back soon for tasks, priorities, and more.</p>
      </div>
    `;
  }
}


// =============================================================
//  12. EVENT LISTENERS
//
//  Event listeners are the bridge between user actions (clicks,
//  key presses) and our JavaScript functions. We attach them
//  once here at the bottom so all our functions are already
//  defined when the listeners fire.
// =============================================================

// Save / Update button
saveBtn.addEventListener('click', handleSave);

// Cancel button (only visible during edit mode)
cancelBtn.addEventListener('click', cancelEdit);

// Allow pressing Enter in the title field to jump to content
noteTitleInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault();       // stop the form from submitting
    noteContentInput.focus();     // move cursor to the textarea
  }
});

// Allow Ctrl+Enter (or Cmd+Enter on Mac) inside the textarea to save
noteContentInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    handleSave();
  }
});

// Wire up each sidebar tab to the switchTab() function.
// 'data-tab' attribute on each button tells us which tab was clicked.
navTabs.forEach(tab => {
  tab.addEventListener('click', function () {
    switchTab(this.dataset.tab); // 'this' refers to the clicked button
  });
});


// =============================================================
//  13. INITIALISATION — runs once when the page first loads
//
//  Decision tree:
//    1. Ask LocalStorage if any notes have been saved before.
//    2. YES → load them into the notes array and render.
//    3. NO  → seed two example notes, save them to LocalStorage
//             (so the next refresh loads them), then render.
//
//  This ensures returning users always see their own data, while
//  brand-new users get a helpful starting point instead of a
//  blank, confusing screen.
// =============================================================
(function init() {

  // --- Step 1: Ask LocalStorage what it has ---
  const savedNotes = loadFromLocalStorage();
  //  loadFromLocalStorage() returns either:
  //    • An array of note objects  → user has visited before
  //    • An empty array []         → first-time visitor

  if (savedNotes.length > 0) {
    // --- Step 2: Returning user — restore their notes ---
    //  We assign the parsed array directly to our global `notes`
    //  variable. From this point the rest of the app works exactly
    //  as if the notes had been created this session.
    notes = savedNotes;

  } else {
    // --- Step 3: First-time visitor — seed example notes ---
    //  The key check: savedNotes.length === 0 is ONLY true when
    //  LocalStorage returned null (key never set) OR when the user
    //  has deleted all their notes. Either way, seeding is safe
    //  because we never reach here if real saved data exists.
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
        content: 'Press Enter in the title field to jump to the content area. Press Ctrl+Enter (Cmd+Enter on Mac) inside the content area to save your note instantly.',
        date:    formatDate(new Date()),
      },
    ];

    // Immediately persist the seed notes so that a refresh will
    // load them from LocalStorage instead of re-seeding.
    // Without this call the seed notes would vanish on refresh.
    saveToLocalStorage();
  }

  // Draw the initial set of cards regardless of which path above
  // we took — the `notes` array is now populated either way.
  renderNotes();

})();
// The parentheses at the end immediately invoke this function —
// it's called an IIFE (Immediately Invoked Function Expression).
