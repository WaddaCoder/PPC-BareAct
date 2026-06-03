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

// 1. ASYNC BOOTLOADER ENGINE WITH ROOT-RELATIVE PATHS
async function initApp() {
  try {
    // Root-relative pathing removes directory ambiguity on GitHub Pages
    const response = await fetch('data/chapters.json');
    if (!response.ok) throw new Error("Could not find data/chapters.json on server");
    globalChapters = await response.json();
    
    loadedSections = [];

    // Safely pull sections from each registered file path sequentially
    for (const ch of globalChapters) {
      try {
        const res = await fetch(`data/${ch.file}`);
        if (res.ok) {
          const data = await res.json();
          loadedSections = loadedSections.concat(data);
        } else {
          console.warn(`Data tracking warning: data/${ch.file} could not be found (404).`);
        }
      } catch (fileErr) {
        console.error(`Skipped loading data/${ch.file} due to parsing error:`, fileErr);
      }
    }
    
    renderChapterPills();
    renderCode();
  } catch (error) {
    container.innerHTML = `<div class="empty-state">Error hydrating law definitions database: <br><small>${error.message}</small></div>`;
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
  let filtered = loadedSections.filter(s => s.mode_tags && Array.isArray(s.mode_tags) && s.mode_tags.includes(activeMode));
  
  if (activeChapterFilter !== 'ALL') {
    filtered = filtered.filter(s => s.chapter === activeChapterFilter);
  }

  if (cleanQuery) {
    filtered = filtered.filter(s => {
      const isSectionMatch = s.section_number === cleanQuery;
      const isChapterMatch = s.chapter.toLowerCase() === cleanQuery || `ch ${s.chapter.toLowerCase()}` === cleanQuery;
      const isTextMatch = (s.content && s.content.toLowerCase().includes(cleanQuery)) || (s.title && s.title.toLowerCase().includes(cleanQuery));
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

    let txt = section.content || '';

    // Inject footnote indicators natively matching text tokens
    if (section.footnotes && section.footnotes.length > 0) {
      section.footnotes.forEach(fn => {
        const regex = new RegExp(`\\b(${fn.marker})\\b`, 'g');
        txt = txt.replace(regex, `<span class="footnote-trigger" data-footnote-text="${fn.text}">$1</span>`);
      });
    }

    // Process text query highlighting mechanics
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
    trigger.addEventListener('touchend',
