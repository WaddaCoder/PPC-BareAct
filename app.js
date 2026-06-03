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
      {
        "id": "fn-1",
        "marker": "Pakistan",
        "text": "Substituted by the Central Laws (Statute Reform) Ordinance, 1960 (21 of 1960), Section 3 and 2nd Schedule, for 'the whole of Pakistan' (with effect from 14th October, 1955)."
      }
    ]
  },
  {
    "section_number": "378",
    "title": "Theft",
    "chapter": "XVII",
    "chapter_title": "Of Offences Against Property",
    "mode_tags": ["linear", "offences"],
    "content": "Whoever, intending to take dishonestly any moveable property out of the possession of any person without that person's consent, moves that property in order to such taking, is said to commit theft.",
    "footnotes": [
      {
        "id": "fn-2",
        "marker": "dishonestly",
        "text": "See Section 24 PPC: Doing anything with the intention of causing wrongful gain to one person or wrongful loss to another."
      }
    ]
  }
];

// 2. DOM Elements Tracking
const container = document.getElementById('statute-container');
const linearBtn = document.getElementById('btn-linear');
const offencesBtn = document.getElementById('btn-offences');
const sheet = document.getElementById('footnote-sheet');
const sheetText = document.getElementById('footnote-text');

let activeMode = 'linear'; // Default initial state
let pressTimer;

// 3. The Core Rendering Engine
function renderCode() {
  container.innerHTML = ''; // Clear out the container view
  
  // Filter data based on active mode choice
  const filteredData = pakistanPenalCode.filter(section => 
    section.mode_tags.includes(activeMode)
  );

  // Rebuild the HTML elements on the fly
  filteredData.forEach(section => {
    const card = document.createElement('div');
    card.className = 'statute-card';

    // Parse text to wrap footnote markers dynamically with custom style triggers
    let processedContent = section.content;
    section.footnotes.forEach(fn => {
      const regex = new RegExp(`\\b(${fn.marker})\\b`, 'g');
      processedContent = processedContent.replace(
        regex, 
        `<span class="footnote-trigger" data-footnote-text="${fn.text}">$1</span>`
      );
    });

    card.innerHTML = `
      <div class="meta-tag">Chapter ${section.chapter}: ${section.chapter_title}</div>
      <h3 class="section-heading">Sec. ${section.section_number}: ${section.title}</h3>
      <p class="statute-text">${processedContent}</p>
    `;
    container.appendChild(card);
  });

  setupInteractionListeners();
}

// 4. Zero-Friction Footnote Listeners (Press-and-Hold & Click)
function setupInteractionListeners() {
  const triggers = document.querySelectorAll('.footnote-trigger');

  triggers.forEach(trigger => {
    // Mobile Touch Start (Hold down to preview)
    trigger.addEventListener('touchstart', (e) => {
      const text = trigger.getAttribute('data-footnote-text');
      pressTimer = setTimeout(() => {
        showSheet(text);
      }, 350); // Fluid timing window for touch hold
    }, { passive: true });

    // Cancel action if user slides thumb away early
    trigger.addEventListener('touchend', () => clearTimeout(pressTimer));
    trigger.addEventListener('touchmove', () => clearTimeout(pressTimer));

    // Desktop mouse fallback click
    trigger.addEventListener('click', (e) => {
      showSheet(trigger.getAttribute('data-footnote-text'));
    });
  });
}

function showSheet(text) {
  sheetText.innerText = text;
  sheet.classList.add('visible');
}

function hideSheet() {
  sheet.classList.remove('visible');
}

// Dismiss sheet by clicking on standard background space
document.addEventListener('pointerdown', (e) => {
  if (!sheet.contains(e.target) && !e.target.classList.contains('footnote-trigger')) {
    hideSheet();
  }
});

// 5. Mode Switch Toggle Triggers
linearBtn.addEventListener('click', () => {
  if (activeMode !== 'linear') {
    activeMode = 'linear';
    linearBtn.classList.add('active');
    offencesBtn.classList.remove('active');
    renderCode();
  }
});

offencesBtn.addEventListener('click', () => {
  if (activeMode !== 'offences') {
    activeMode = 'offences';
    offencesBtn.classList.add('active');
    linearBtn.classList.remove('active');
    renderCode();
  }
});

// Initial boot initialization
renderCode();
