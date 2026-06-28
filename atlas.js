const data=AtlasKnowledge;

const app=document.getElementById('app');
const search=document.getElementById('search');

function render(items=data.sections){
app.innerHTML=items.map(s=>`
<div class="card">
<h2>Section ${s.number}: ${s.heading}</h2>
<h3>Architect's Note</h3><p>${s.architect}</p>
<h3>Structural Insight</h3><p>${s.insight}</p>
<h3>Patterns</h3>${s.patterns.map(x=>`<span class="tag">${x}</span>`).join('')}
<h3>Concepts</h3>${s.concepts.map(x=>`<span class="tag">${x}</span>`).join('')}
<h3>Thinking Question</h3><p>${s.question}</p>
</div>`).join('');
}

search.oninput=()=>{
let q=search.value.toLowerCase();
render(data.sections.filter(x=>JSON.stringify(x).toLowerCase().includes(q)));
};

render();

if('serviceWorker' in navigator){
navigator.serviceWorker.register('service-worker.js');
}