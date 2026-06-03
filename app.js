// 1. The Raw Bare Act Data Array
const pakistanPenalCode = [
  {
    "section_number": "1",
    "title": "Title and extent of operation of the Code",
    "chapter": "I",
    "chapter_title": "Introduction",
    "mode_tags": ["linear"],
    "content": "This Act shall be called the Pakistan Penal Code, and shall take effect throughout Pakistan.",
    "footnotes": [
      { "id": "fn-1", "marker": "Pakistan", "text": "Substituted by Ordinance 21 of 1960." }
    ]
  },
  {
    "section_number": "84",
    "title": "Act of a person of unsound mind",
    "chapter": "IV",
    "chapter_title": "General Exceptions",
    "mode_tags": ["linear"],
    "content": "Nothing is an offence which is done by a person who, at the time of doing it, by reason of unsoundness of mind, is incapable of knowing the nature of the act.",
    "footnotes": []
  },
  {
    "section_number": "378",
    "title": "Theft",
    "chapter": "XVII",
    "chapter_title": "Of Offences Against Property",
    "mode_tags": ["linear", "offences"],
    "content": "Whoever, intending to take dishonestly any moveable property out of the possession of any person without that person's consent, moves that property in order to such taking, is said to commit theft.",
    "footnotes": [
      { "id": "fn-2", "marker": "dishonestly", "text": "See Section 24 PPC for definition." }
    ]
  }
];

let activeMode = 'linear';
let searchQuery = '';
let activeChapterFilter = 'ALL';
let pressTimer;

const container = document.getElementById('statute-container');
const linearBtn = document.getElementById('btn-linear');
const offencesBtn = document.getElementById('btn-offences');
const searchBar = document.getElementById('search-bar');
const clearSearch = document.getElementById('clear-search');
const pillTrack = document.getElementById('chapter-pills');
const sheet = document.getElementById('footnote-sheet');
const sheetText = document.getElementById('footnote-text');

// 1. Build dynamic horizontal Table of Contents pills based on what sections are visible
function renderChapterPills() {
  pillTrack.innerHTML = '';
  
  // Find chapters available in current mode
  const availableSections = pakistanPenalCode.filter(s => s.mode_tags.includes(activeMode));
  const uniqueChapters = [];
  const map = new Map();
  
  uniqueChapters.push({ id: 'ALL', title: 'All Chapters' });
  
  for (const item of availableSections) {
    if(!map.has(item.chapter)){
        map.set(item.chapter, true);
        uniqueChapters.push({ id: item.chapter, title: `Ch. ${item.chapter}` });
    }
  }

  uniqueChapters.forEach(ch => {
    const pill = document.createElement('button');
    pill.className = `pill ${activeChapterFilter === ch.id ? 'active' : ''}`;
    pill.innerText = ch.title;
    pill.addEventListener('click', () => {
      activeChapterFilter = ch.id;
      renderCode();
      renderChapterPills();
    });
    pillTrack.appendChild(pill);
  });
}

// 2. Main Processing and Rendering Engine
function renderCode() {
  container.innerHTML = '';
  const cleanQuery = searchQuery.trim().toLowerCase();

  // Multi-tier filtering pipeline (Mode -> Chapter -> Search Input)
  let filtered = pakistanPenalCode.filter(s => s.mode_tags.includes(activeMode));
  
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

    // Apply Footnote Sub-Wrappers
    section.footnotes.forEach(fn => {
      const regex = new RegExp(`\\b(${fn.marker})\\b`, 'g');
      txt = txt.replace(regex, `<span class="footnote-trigger" data-footnote-text="${fn.text}">$1</span>`);
    });

    // Apply Real-time Text Query Highlighting (Skipping already processed HTML tags)
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

// 3. User Input Listeners
searchBar.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  if (searchQuery.length > 0) {
    clearSearch.classList.remove('hidden');
  } else {
    clearSearch.classList.add('hidden');
  }
  renderCode();
});

clearSearch.addEventListener('click', () => {
  searchBar.value = '';
  searchQuery = '';
  clearSearch.classList.add('hidden');
  renderCode();
});

// Setup interaction hooks for footnote items
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

// Toggle Modes
linearBtn.addEventListener('click', () => { if (activeMode !== 'linear') { activeMode = 'linear'; activeChapterFilter = 'ALL'; updateModeUI(linearBtn, offencesBtn); } });
offencesBtn.addEventListener('click', () => { if (activeMode !== 'offences') { activeMode = 'offences'; activeChapterFilter = 'ALL'; updateModeUI(offencesBtn, linearBtn); } });

function updateModeUI(active, inactive) {
  active.classList.add('active'); inactive.classList.remove('active');
  searchBar.value = ''; searchQuery = ''; clearSearch.classList.add('hidden');
  renderChapterPills(); renderCode();
}

// Initialize Boot
renderChapterPills();
renderCode();
