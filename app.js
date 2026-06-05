let globalChapters = [];
let loadedSections = [];
let activeMode = 'linear'; // 'linear', 'offences', or 'map'
let searchQuery = '';
let activeChapterFilter = 'ALL';

// DOM Link Nodes
const container = document.getElementById('statute-container');
const linearBtn = document.getElementById('btn-linear');
const offencesBtn = document.getElementById('btn-offences');
const mapBtn = document.getElementById('btn-map'); 
const searchBar = document.getElementById('search-bar');
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

window.scrollToSection = function(sectionNumber) {
  activeMode = 'linear';
  searchQuery = '';
  activeChapterFilter = 'ALL';
  updateModeUI(linearBtn, [offencesBtn, mapBtn]);
  renderCode();

  const headings = Array.from(document.querySelectorAll('.section-heading'));
  const target = headings.find(h => h.innerText.includes(`Sec. ${sectionNumber}:`));
  
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.parentElement.style.transition = 'background 0.5s';
    target.parentElement.style.backgroundColor = '#e8f0fe';
    setTimeout(() => { target.parentElement.style.backgroundColor = ''; }, 2000);
  }
};

function renderMap() {
  container.innerHTML = `<div class="map-canvas" id="map-canvas"></div>`;
  const mapCanvas = document.getElementById('map-canvas');
  
  // Filter sections by map_node existence AND active chapter filter
  let mappedSections = loadedSections.filter(s => s.map_node);
  if (activeChapterFilter !== 'ALL') {
    mappedSections = mappedSections.filter(s => s.chapter === activeChapterFilter);
  }
  
  mappedSections.forEach((section) => {
    const node = document.createElement('div');
    node.className = 'map-node';
    node.style.left = `${section.map_node.x}px`;
    node.style.top = `${section.map_node.y}px`;
    node.innerHTML = `Sec. ${section.section_number}`;
    node.onclick = () => scrollToSection(section.section_number);
    mapCanvas.appendChild(node);
  });
}

function renderChapterPills() {
  if (!pillTrack) return;
  pillTrack.innerHTML = '';
  
  // Logic to determine which chapters to show based on the active mode
  let targetChapters = globalChapters;

  if (activeMode === 'offences') {
    targetChapters = globalChapters.filter(ch => ch.title.toLowerCase().includes('offence'));
  } else if (activeMode === 'map') {
    // NEW: Filter to only show chapters that contain at least one section with a 'map_node'
    targetChapters = globalChapters.filter(ch => 
      loadedSections.some(s => s.chapter === ch.id && s.map_node)
    );
  }
  
  const allPill = document.createElement('button');
  allPill.className = `pill ${activeChapterFilter === 'ALL' ? 'active' : ''}`;
  allPill.innerText = 'All Chapters';
  allPill.addEventListener('click', () => { 
    activeChapterFilter = 'ALL'; 
    activeMode === 'map' ? renderMap() : renderCode(); 
    renderChapterPills(); 
  });
  pillTrack.appendChild(allPill);

  targetChapters.forEach(ch => {
    const pill = document.createElement('button');
    pill.className = `pill ${activeChapterFilter === ch.id ? 'active' : ''}`;
    pill.innerText = `Ch. ${ch.id}`;
    pill.addEventListener('click', () => { 
      activeChapterFilter = ch.id; 
      activeMode === 'map' ? renderMap() : renderCode(); 
      renderChapterPills(); 
    });
    pillTrack.appendChild(pill);
  });
}

function renderCode() {
  if (!container || activeMode === 'map') return;
  container.innerHTML = '';
  const cleanQuery = searchQuery.trim().toLowerCase();

  let filtered = loadedSections.filter(s => s.mode_tags && s.mode_tags.includes(activeMode));
  if (activeMode === 'offences') {
    filtered = filtered.filter(s => (s.chapter_title?.toLowerCase().includes('offence')) || (s.title?.toLowerCase().includes('offence')));
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
    
    let contentHTML = section.content_parts ? section.content_parts.map(p => `<p class="part-${p.type}">${p.text}</p>`).join('') : `<p class="statute-text">${section.content || ''}</p>`;

    if (section.footnotes) {
      section.footnotes.forEach(fn => {
        const regex = new RegExp(`\\b(${fn.marker})\\b`, 'gi');
        const triggerClass = fn.is_definition ? 'definition-trigger' : 'footnote-trigger';
        contentHTML = contentHTML.replace(regex, `<span class="${triggerClass}" data-footnote-text="${fn.text}">$1</span>`);
      });
    }

    let ladderHTML = section.sentencing_ladder ? `<details class="sentencing-ladder"><summary>🪜 View Sentencing Escalation</summary><div class="ladder-steps">${section.sentencing_ladder.map(s => `<div class="step"><strong>${s.condition}:</strong> ${s.penalty}</div>`).join('')}</div></details>` : '';
    let relatedHTML = section.related_sections ? `<div class="related-bar"><strong>See also:</strong> ${section.related_sections.map(rs => `<span class="link" onclick="scrollToSection('${rs.section}')">Sec. ${rs.section}</span>`).join(', ')}</div>` : '';

    card.innerHTML = `<div class="meta-tag">Chapter ${section.chapter || ''}: ${section.chapter_title || ''}</div><h3 class="section-heading">Sec. ${section.section_number || ''}: ${section.title || ''}</h3>${contentHTML}${ladderHTML}${relatedHTML}`;
    container.appendChild(card);
  });
  setupInteractionListeners();
}

function setupInteractionListeners() {
  document.querySelectorAll('.footnote-trigger, .definition-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => showSheet(trigger.getAttribute('data-footnote-text')));
  });
}

function showSheet(text) { if (sheetText && sheet) { sheetText.innerText = text; sheet.classList.add('visible'); } }
function hideSheet() { if (sheet) sheet.classList.remove('visible'); }
document.addEventListener('pointerdown', (e) => { if (sheet && !sheet.contains(e.target) && !e.target.matches('.footnote-trigger, .definition-trigger')) hideSheet(); });

if (searchBar) searchBar.addEventListener('input', (e) => { searchQuery = e.target.value; renderCode(); });

if (linearBtn) linearBtn.addEventListener('click', () => { activeMode = 'linear'; updateModeUI(linearBtn, [offencesBtn, mapBtn]); renderCode(); });
if (offencesBtn) offencesBtn.addEventListener('click', () => { activeMode = 'offences'; updateModeUI(offencesBtn, [linearBtn, mapBtn]); renderCode(); });
if (mapBtn) mapBtn.addEventListener('click', () => { activeMode = 'map'; updateModeUI(mapBtn, [linearBtn, offencesBtn]); renderMap(); });

function updateModeUI(active, inactives) {
  active.classList.add('active');
  inactives.forEach(btn => btn.classList.remove('active'));
  renderChapterPills();
}

document.addEventListener('DOMContentLoaded', initApp);
