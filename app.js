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
    // Pull the master chapter blueprint map
    const response = await fetch('./data/chapters.json');
    globalChapters = await response.json();
    
    // Concurrently load all section profiles across files
    const loadPromises = globalChapters.map(ch => 
      fetch(`./data/${ch.file}`).then(res => res.json())
    );
    
    const results = await loadPromises;
    loadedSections = results.flat(); // Merge all sub-arrays into a single database array
    
    renderChapterPills();
    renderCode();
  } catch (error) {
    container.innerHTML = `<div class="empty-state">Error hydrating law definitions database: ${error.message}</div>`;
  }
}

// 2. RENDERING HORIZONTAL TOC TRACK PILLS
function renderChapterPills() {
  pillTrack.innerHTML = '';
  
  // Isolate chapters relative to active mode context
  const targetChapters = globalChapters.filter(ch => ch.modes.includes(activeMode));
  
  // Inject "All Chapters" reset pill
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
  container.innerHTML = '';
  const cleanQuery = searchQuery.trim().toLowerCase();

  // Filter track logic matching selections
  let filtered = loadedSections.filter(s => s.mode_tags.includes(activeMode));
  
  if (activeChapterFilter !== 'ALL') {
    filtered = filtered.filter(s => s.chapter === activeChapterFilter);
  }

  if (cleanQuery) {
    filtered = filtered.filter(s => {
      const isSectionMatch = s.section_number === cleanQuery;
      const isChapterMatch = s.chapter.toLowerCase() === cleanQuery || `ch ${s.chapter.toLowerCase()}` === cleanQuery;
      const isTextMatch = s.content.toLowerCase().includes(cleanQuery) || s.title.toLowerCase().includes(cleanQuery);
      return isSectionMatch || isChapterMatch || isTextMatch;
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state">No matching sections found for "${searchQuery}".</div>`;
    return;
  }

  filtered.forEach(section => {
    const card = document.createElement('div');
    card.className = 'statute-card';

    let txt = section.content;

    // Inject footnote indicators natively matching text tokens
    if (section.footnotes && section.footnotes.length > 0) {
      section.footnotes.forEach(fn => {
        const regex = new RegExp(`\\b(${fn.marker})\\b`, 'g');
        txt = txt.replace(regex, `<span class="footnote-trigger" data-footnote-text="${fn.text}">$1</span>`);
      });
    }

    // Process yellow lookup highlighting mechanics
    if (cleanQuery && isNaN(cleanQuery) && !cleanQuery.startsWith('ch')) {
      const highlightRegex = new RegExp(`(?<!<[^>]*)\\b(${cleanQuery})\\b(?![^<]*>)`, 'gi');
      txt = txt.replace(highlightRegex, `<mark class="search-highlight">$1</mark>`);
    }

    card.innerHTML = `
      <div class="meta-tag">Chapter ${section.chapter}: ${section.chapter_title}</div>
      <h3 class="section-heading">Sec. ${section.section_number}: ${section.title}</h3>
      <p class="statute-text">${txt}</p>
    `;
    container.appendChild(card);
  });

  setupInteractionListeners();
}

// 4. USER EVENT CAPTURE LOGIC
searchBar.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  clearSearch.classList.toggle('hidden', searchQuery.length === 0);
  renderCode();
});

clearSearch.addEventListener('click', () => {
  searchBar.value = '';
  searchQuery = '';
  clearSearch.classList.add('hidden');
  renderCode();
});

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

function showSheet(text) { sheetText.innerText = text; sheet.classList.add('visible'); }
function hideSheet() { sheet.classList.remove('visible'); }
document.addEventListener('pointerdown', (e) => {
  if (!sheet.contains(e.target) && !e.target.classList.contains('footnote-trigger')) hideSheet();
});

linearBtn.addEventListener('click', () => { if (activeMode !== 'linear') { activeMode = 'linear'; activeChapterFilter = 'ALL'; updateModeUI(linearBtn, offencesBtn); } });
offencesBtn.addEventListener('click', () => { if (activeMode !== 'offences') { activeMode = 'offences'; activeChapterFilter = 'ALL'; updateModeUI(offencesBtn, linearBtn); } });

function updateModeUI(active, inactive) {
  active.classList.add('active'); inactive.classList.remove('active');
  searchBar.value = ''; searchQuery = ''; clearSearch.classList.add('hidden');
  renderChapterPills(); renderCode();
}

// Execution Hook Guard
document.addEventListener('DOMContentLoaded', initApp);
