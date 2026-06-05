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
      } catch (fileErr) { console.error("Skipped:", fileErr); }
    }
    renderChapterPills();
    renderCode();
  } catch (error) {
    container.innerHTML = `<div class="empty-state">Error: ${error.message}</div>`;
  }
}

function renderChapterPills() {
  if (!pillTrack) return;
  pillTrack.innerHTML = '';
  let targetChapters = (activeMode === 'offences') 
    ? globalChapters.filter(ch => ch.title.toLowerCase().includes('offence'))
    : globalChapters;
  
  const allPill = document.createElement('button');
  allPill.className = `pill ${activeChapterFilter === 'ALL' ? 'active' : ''}`;
  allPill.innerText = 'All Chapters';
  allPill.addEventListener('click', () => { activeChapterFilter = 'ALL'; renderCode(); renderChapterPills(); });
  pillTrack.appendChild(allPill);

  targetChapters.forEach(ch => {
    const pill = document.createElement('button');
    pill.className = `pill ${activeChapterFilter === ch.id ? 'active' : ''}`;
    pill.innerText = `Ch. ${ch.id}`;
    pill.addEventListener('click', () => { activeChapterFilter = ch.id; renderCode(); renderChapterPills(); });
    pillTrack.appendChild(pill);
  });
}

function renderCode() {
  if (!container) return;
  container.innerHTML = '';
  const cleanQuery = searchQuery.trim().toLowerCase();

  let filtered = loadedSections.filter(s => s.mode_tags && s.mode_tags.includes(activeMode));
  if (activeMode === 'offences') {
    filtered = filtered.filter(s => (s.chapter_title && s.chapter_title.toLowerCase().includes('offence')) || (s.title && s.title.toLowerCase().includes('offence')));
  }
  if (activeChapterFilter !== 'ALL') {
    filtered = filtered.filter(s => s.chapter === activeChapterFilter);
  }
  if (cleanQuery) {
    filtered = filtered.filter(s => s.content?.toLowerCase().includes(cleanQuery) || s.title?.toLowerCase().includes(cleanQuery));
  }

  if (filtered.length === 0) { container.innerHTML = `<div class="empty-state">No matching sections found.</div>`; return; }

  filtered.forEach(section => {
    const card = document.createElement('div');
    card.className = 'statute-card';
    
    // Footnote Logic
    let txt = section.content || '';
    if (section.footnotes) {
      section.footnotes.forEach(fn => {
        const regex = new RegExp(`\\b(${fn.marker})\\b`, 'g');
        txt = txt.replace(regex, `<span class="footnote-trigger" data-footnote-text="${fn.text}">$1</span>`);
      });
    }

    // Sentencing Ladder Logic
    let ladderHTML = '';
    if (section.sentencing_ladder) {
      const steps = section.sentencing_ladder.map(step => 
        `<div class="step"><strong>${step.condition}:</strong> ${step.penalty}</div>`
      ).join('');
      
      ladderHTML = `
        <details class="sentencing-ladder">
          <summary>🪜 View Sentencing Escalation</summary>
          <div class="ladder-steps">${steps}</div>
        </details>
      `;
    }

    card.innerHTML = `
      <div class="meta-tag">Chapter ${section.chapter || ''}: ${section.chapter_title || ''}</div>
      <h3 class="section-heading">Sec. ${section.section_number || ''}: ${section.title || ''}</h3>
      <p class="statute-text">${txt}</p>
      ${ladderHTML}
    `;
    container.appendChild(card);
  });
  setupInteractionListeners();
}

function setupInteractionListeners() {
  document.querySelectorAll('.footnote-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => showSheet(trigger.getAttribute('data-footnote-text')));
  });
}

function showSheet(text) { if (sheetText && sheet) { sheetText.innerText = text; sheet.classList.add('visible'); } }
function hideSheet() { if (sheet) sheet.classList.remove('visible'); }
document.addEventListener('pointerdown', (e) => { if (sheet && !sheet.contains(e.target) && !e.target.classList.contains('footnote-trigger')) hideSheet(); });

if (searchBar) searchBar.addEventListener('input', (e) => { searchQuery = e.target.value; renderCode(); });
if (linearBtn) linearBtn.addEventListener('click', () => { activeMode = 'linear'; activeChapterFilter = 'ALL'; updateModeUI(linearBtn, offencesBtn); });
if (offencesBtn) offencesBtn.addEventListener('click', () => { activeMode = 'offences'; activeChapterFilter = 'ALL'; updateModeUI(offencesBtn, linearBtn); });

function updateModeUI(active, inactive) {
  active.classList.add('active'); inactive.classList.remove('active');
  renderChapterPills(); renderCode();
}

document.addEventListener('DOMContentLoaded', initApp);
