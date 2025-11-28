// js/app.js
const STORAGE_KEY = 'student_notes_v1';
let notes = []; // { id, title, content, createdAt }
let editId = null;

// DOM
const form = document.getElementById('noteForm');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const saveBtn = document.getElementById('saveBtn');
const notesList = document.getElementById('notesList');
const clearAllBtn = document.getElementById('clearAll');
const searchInput = document.getElementById('search');
const sortSelect = document.getElementById('sortSelect');

// Initialize
loadNotes();
renderNotes();

// Form submit -> create or update
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  if (!title || !content) return alert('Please provide both title and content.');

  if (editId) {
    // update
    const idx = notes.findIndex(n => n.id === editId);
    if (idx === -1) { alert('Note not found'); return; }
    notes[idx].title = title;
    notes[idx].content = content;
    editId = null;
    saveBtn.textContent = 'Add Note';
  } else {
    // create
    const note = { id: generateId(), title, content, createdAt: Date.now() };
    notes.push(note);
  }
  persist();
  renderNotes();
  form.reset();
});

// Delete all
clearAllBtn.addEventListener('click', () => {
  if (!notes.length) return alert('No notes to delete.');
  if (!confirm('Delete ALL notes? This cannot be undone.')) return;
  notes = [];
  persist();
  renderNotes();
});

// search & sort
searchInput?.addEventListener('input', () => renderNotes());
sortSelect?.addEventListener('change', () => renderNotes());

// CRUD helpers
function editNote(id) {
  const n = notes.find(x => x.id === id);
  if (!n) return alert('Note not found');
  titleInput.value = n.title;
  contentInput.value = n.content;
  editId = id;
  saveBtn.textContent = 'Update Note';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteNote(id) {
  if (!confirm('Delete this note?')) return;
  notes = notes.filter(n => n.id !== id);
  persist();
  renderNotes();
}

// storage
function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}
function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    notes = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load notes:', e);
    notes = [];
  }
}

// render
function renderNotes() {
  const q = (searchInput && searchInput.value.trim().toLowerCase()) || '';
  const sort = (sortSelect && sortSelect.value) || 'new';
  let list = notes.slice();

  if (q) {
    list = list.filter(n => (n.title + ' ' + n.content).toLowerCase().includes(q));
  }

  list.sort((a, b) => sort === 'new' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);

  notesList.innerHTML = '';
  if (!list.length) {
    notesList.innerHTML = '<div class="empty">No notes yet — add one above.</div>';
    return;
  }

  for (const n of list) {
    const article = document.createElement('article');
    article.className = 'note';
    article.innerHTML = `
      <div>
        <h3>${escapeHtml(n.title)}</h3>
        <div class="meta">${formatDate(n.createdAt)}</div>
        <p style="margin-top:8px">${escapeHtml(n.content)}</p>
      </div>
      <div class="actions">
        <button class="edit" data-id="${n.id}" data-action="edit">Edit</button>
        <button class="delete" data-id="${n.id}" data-action="delete">Delete</button>
      </div>
    `;
    notesList.appendChild(article);
  }

  // attach handlers
  notesList.querySelectorAll('button').forEach(btn => {
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    btn.onclick = () => action === 'edit' ? editNote(id) : deleteNote(id);
  });
}

// small helpers
function generateId() {
  return 'n_' + Math.random().toString(36).slice(2, 10);
}
function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
