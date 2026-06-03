let globalChapters = [];
let loadedSections = [];
let activeMode = 'linear';
let searchQuery = '';
let activeChapterFilter = 'ALL';
let pressTimer;

// DOM Link Nodes
const container = document.getElementById('statute-container');
const linearBtn = document.getElementById('btn-linear');
const offencesBtn = document.getElementById('btn-offences');
const searchBar = document.getElementById('search-bar');
const clearSearch = document.getElementById('clear-search');
const pillTrack = document.getElementById('chapter-pills');
const sheet = document.getElementById('footnote-sheet');
const sheetText = document.getElementById('footnote-text');

// 1. ASYNC BOOTLOADER ENGINE
async function initApp() {
  try {
    const response = await fetch('data/chapters.json');
    if (!response.ok) throw new Error("Could not find data/chapters.json");
    globalChapters = await response.json();
    
    loadedSections = [];

    for (const ch of globalChapters) {
      try {
        const res = await fetch(`data/${ch.file}`);
        if (res.ok) {
          const data = await res.json();
          loadedSections = loadedSections.concat(data);
        }
      } catch (fileErr) {
        console.error("Skipped loading a file:", fileErr);
      }
    }
    
    renderChapterPills();
    renderCode();
  } catch (error) {
    container.innerHTML = `<div class="empty-state">Error hydrating database: <br><small>${error.message}</small></div>`;
  }
}

// 2. RENDERING HORIZONTAL TOC TRACK PILLS
function renderChapterPills() {
  if (!pillTrack) return;
  pillTrack.innerHTML = '';
  
  const targetChapters = globalChapters.filter(ch => ch.modes && ch.modes.includes(activeMode));
  
  const allPill = document.createElement('button');
  allPill.className = `pill ${activeChapterFilter === 'ALL' ? 'active' : ''}`;
  allPill.innerText = 'All Chapters';
  allPill.addEventListener('click', () => {
    activeChapterFilter = 'ALL';
    renderCode();
    renderChapterPills();
  });
  pillTrack.appendChild(allPill);

  targetChapters.forEach(ch => {
    const pill = document.createElement('button');
    pill.className = `pill ${activeChapterFilter === ch.id ? 'active' : ''}`;
    pill.innerText = `Ch. ${ch.id}`;
    pill.title = ch.title;
    pill.addEventListener('click', () => {
      activeChapterFilter = ch.id;
      renderCode();
      renderChapterPills();
    });
    pillTrack.appendChild(pill);
  });
}

// 3. CODE RENDERING PIPELINE
function renderCode() {
  if (!container) return;
  container.innerHTML = '';
  const cleanQuery = searchQuery.trim().toLowerCase();

  let filtered = loadedSections.filter(s => s.mode_tags && Array.isArray(s.mode_tags) && s.mode_tags.includes(activeMode));
  
  if (activeChapterFilter !== 'ALL') {
    filtered = filtered.filter(s => s.chapter === activeChapterFilter);
  }

  if (cleanQuery) {
    filtered = filtered.filter(s => {
      const isSectionMatch = s.section_number === cleanQuery;
      const isChapterMatch = s.chapter && (s.chapter.toLowerCase() === cleanQuery || `ch ${s.chapter.toLowerCase()}` === cleanQuery);
      const isTextMatch = (s.content && s.content.toLowerCase().includes(cleanQuery)) || (s.title && s.title.toLowerCase().includes(cleanQuery));
      return isSectionMatch || isChapterMatch || isTextMatch;
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state">No matching sections found.</div>`;
    return;
  }

  filtered.forEach(section => {
    const card = document.createElement('div');
    card.className = 'statute-card';

    let txt = section.content || '';

    if (section.footnotes && section.footnotes.length > 0) {
      section.footnotes.forEach(fn => {
        const regex = new RegExp(`\\b(${fn.marker})\\b`, 'g');
        txt = txt.replace(regex, `<span class="footnote-trigger" data-footnote-text="${fn.text}">$1</span>`);
      });
    }

    if (cleanQuery && isNaN(cleanQuery) && !cleanQuery.startsWith('ch')) {
      const highlightRegex = new RegExp(`(?<!<[^>]*)\\b(${cleanQuery})\\b(?![^<]*>)`, 'gi');
      txt = txt.replace(highlightRegex, `<mark class="search-highlight">$1</mark>`);
    }

    card.innerHTML = `
      <div class="meta-tag">Chapter ${section.chapter || ''}: ${section.chapter_title || ''}</div>
      <h3 class="section-heading">Sec. ${section.section_number || ''}: ${section.title || ''}</h3>
      <p class="statute-text">${txt}</p>
    `;
    container.appendChild(card);
  });

  setupInteractionListeners();
}

// 4. USER EVENT CAPTURE LOGIC
if (searchBar) {
  searchBar.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (clearSearch) clearSearch.classList.toggle('hidden', searchQuery.length === 0);
    renderCode();
  });
}

if (clearSearch) {
  clearSearch.addEventListener('click', () => {
    if (searchBar) searchBar.value = '';
    searchQuery = '';
    clearSearch.classList.add('hidden');
    renderCode();
  });
}

function setupInteractionListeners() {
  const triggers = document.querySelectorAll('.footnote-trigger');
  triggers.forEach(trigger => {
    trigger.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => showSheet(trigger.getAttribute('data-footnote-text')), 350);
    }, { passive: true });
    trigger.addEventListener('touchend', () => clearTimeout(pressTimer));
    trigger.addEventListener('click', () => showSheet(trigger.getAttribute('data-footnote-text')));
  });
}

function showSheet(text) { 
  if (sheetText && sheet) {
    sheetText.innerText = text; 
    sheet.classList.add('visible'); 
  }
}

function hideSheet() { 
  if (sheet) sheet.classList.remove('visible'); 
}

document.addEventListener('pointerdown', (e) => {
  if (sheet && !sheet.contains(e.target) && !e.target.classList.contains('footnote-trigger')) hideSheet();
});

if (linearBtn) {
  linearBtn.addEventListener('click', () => { 
    if (activeMode !== 'linear') { 
      activeMode = 'linear'; 
      activeChapterFilter = 'ALL'; 
      updateModeUI(linearBtn, offencesBtn); 
    } 
  });
}

if (offencesBtn) {
  offencesBtn.addEventListener('click', () => { 
    if (activeMode !== 'offences') { 
      activeMode = 'offences'; 
      activeChapterFilter = 'ALL'; 
      updateModeUI(offencesBtn, linearBtn); 
    } 
  });
}

function updateModeUI(active, inactive) {
  if (active) active.classList.add('active'); 
  if (inactive) inactive.classList.remove('active');
  if (searchBar) searchBar.value = ''; 
  searchQuery = ''; 
  if (clearSearch) clearSearch.classList.add('hidden');
  renderChapterPills(); 
  renderCode();
}

document.addEventListener('DOMContentLoaded', initApp);
