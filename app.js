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
        // Correct pathing: data/ + ch.file (ensures data/ch-01.json)
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
  
  // Filter for linear or offences mode
  let targetChapters = globalChapters;
  if (activeMode === 'offences') {
  filtered = filtered.filter(s => 
    (s.chapter_title && s.chapter_title.toLowerCase().includes('offence')) || 
    (s.title && s.title.toLowerCase().includes('offence'))
  );
}
  
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

  let filtered = loadedSections.filter(s => s.mode_tags && Array.isArray(s.mode_tags));
  
  if (activeMode === 'offences') {
    filtered = filtered.filter(s => s.chapter_title && s.chapter_title.toLowerCase().includes('offence'));
  }
  
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
    card.innerHTML = `
      <div class="meta-tag">Chapter ${section.chapter || ''}: ${section.chapter_title || ''}</div>
      <h3 class="section-heading">Sec. ${section.section_number || ''}: ${section.title || ''}</h3>
      <p class="statute-text">${txt}</p>
    `;
    container.appendChild(card);
  });
  setupInteractionListeners();
}

// 4. EVENT LISTENERS
if (searchBar) searchBar.addEventListener('input', (e) => { searchQuery = e.target.value; renderCode(); });
if (linearBtn) linearBtn.addEventListener('click', () => { activeMode = 'linear'; activeChapterFilter = 'ALL'; updateModeUI(linearBtn, offencesBtn); });
if (offencesBtn) offencesBtn.addEventListener('click', () => { activeMode = 'offences'; activeChapterFilter = 'ALL'; updateModeUI(offencesBtn, linearBtn); });

function updateModeUI(active, inactive) {
  active.classList.add('active'); 
  inactive.classList.remove('active');
  renderChapterPills(); 
  renderCode();
}

document.addEventListener('DOMContentLoaded', initApp);
