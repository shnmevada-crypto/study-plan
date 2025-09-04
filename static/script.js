const subjects = [
  {key:'maths', name:'Maths (Edexcel GCSE)', icon:'images/maths.svg', resources:[{label:'BBC Bitesize', url:'https://www.bbc.co.uk/bitesize/subjects/z38pycw'}]},
  {key:'english_lit', name:'English Literature (AQA GCSE)', icon:'images/english_lit.svg', resources:[{label:'AQA English Lit', url:'https://www.aqa.org.uk/subjects/english/gcse/english-literature-8702'}]},
  {key:'english_lang', name:'English Language (AQA GCSE)', icon:'images/english_lang.svg', resources:[{label:'AQA English Lang', url:'https://www.aqa.org.uk/subjects/english/gcse/english-language-8700'}]},
  {key:'french', name:'French (GCSE)', icon:'images/french.svg', resources:[{label:'BBC French', url:'https://www.bbc.co.uk/bitesize/subjects/zgdqxnb'}]},
  {key:'business', name:'Business (Edexcel GCSE)', icon:'images/business.svg', resources:[{label:'Edexcel Business', url:'https://qualifications.pearson.com/en/qualifications/edexcel-gcses/business-2017.html'}]},
  {key:'comp_sci', name:'Computer Science (AQA GCSE)', icon:'images/comp_sci.svg', resources:[{label:'AQA Comp Sci', url:'https://www.aqa.org.uk/subjects/computing/gcse/computer-science-8520'}]},
  {key:'science', name:'Combined Science (AQA GCSE)', icon:'images/science.svg', resources:[{label:'AQA Combined Science', url:'https://www.aqa.org.uk/subjects/science/gcse/combined-science-trilogy-8464'}]},
  {key:'pe', name:'Physical Education (AQA GCSE)', icon:'images/pe.svg', resources:[{label:'AQA PE', url:'https://www.aqa.org.uk/subjects/physical-education/gcse/physical-education-8582'}]},
  {key:'ind', name:'Independent Study / Past Papers', icon:'images/independent.svg', resources:[{label:'Physics & Maths Tutor', url:'https://www.physicsandmathstutor.com/'}]}
];

const WEEKS = 40;
const TERM_START = new Date(2025,8,4); // 4 Sep 2025

function buildSidebar(){
  const weekLinks = document.getElementById('weekLinks');
  for(let i=1;i<=WEEKS;i++){
    const a = document.createElement('a');
    a.href='#';
    a.textContent='Week '+i;
    a.className='week-link';
    a.onclick = (e)=>{ e.preventDefault(); showWeek(i); };
    weekLinks.appendChild(a);
  }
}
function buildWeeks(){
  const container = document.getElementById('weeksContainer');
  for(let w=1; w<=WEEKS; w++){
    const card = document.createElement('div');
    card.className='week-card';
    card.id='week-'+w;
    const start = new Date(TERM_START.getTime() + (w-1)*7*24*60*60*1000);
    const title = document.createElement('h3');
    title.textContent = 'Week '+w+' — week beginning '+start.toDateString();
    card.appendChild(title);
    for(let d=0; d<7; d++){
      const dayDate = new Date(start.getTime()+d*24*60*60*1000);
      const dayDiv = document.createElement('div');
      dayDiv.className='day';
      const header = document.createElement('div');
      header.className='day-header';
      header.innerHTML = '<div>'+dayDate.toDateString()+'</div><div class="tick" data-date="'+dayDate.toISOString().slice(0,10)+'"></div>';
      dayDiv.appendChild(header);
      const times = (d<5)?['6:00–6:45 pm','6:50–7:35 pm','7:40–8:25 pm']:['10:00–10:45 am','10:50–11:35 am','11:40–12:25 pm'];
      times.forEach((t,idx)=>{
        const slot = document.createElement('div');
        slot.className='slot';
        const subj = subjects[(w + d + idx) % subjects.length];
        slot.innerHTML = '<img src="'+subj.icon+'" alt="" style="width:44px;height:44px;border-radius:8px;"><div class="meta"><div class="title">'+t+' → '+subj.name+'</div><div class="sub">Topic: planned topic • Resource: <a href="'+subj.resources[0].url+'" target="_blank">'+subj.resources[0].label+'</a></div></div><div class="tick" data-slot="'+w+'-'+d+'-'+idx+'"></div>';
        dayDiv.appendChild(slot);
      });
      card.appendChild(dayDiv);
    }
    container.appendChild(card);
  }
}

function showWeek(n){
  document.querySelectorAll('.week-link').forEach((el,idx)=> el.classList.toggle('active', idx+1===n));
  document.querySelectorAll('.week-card').forEach(wc=> wc.style.display='none');
  const el = document.getElementById('week-'+n); if(el) el.style.display='block';
  document.querySelector('.left-panel').scrollTo({top:0, behavior:'smooth'});
}

function loadTicks(){
  const stored = JSON.parse(localStorage.getItem('studyplan_ticks') || '{}');
  document.querySelectorAll('.tick').forEach(t=>{
    const key = t.dataset.date || t.dataset.slot;
    if(key && stored[key]) t.classList.add('done');
    t.onclick = ()=>{ if(!key) return; const cur = JSON.parse(localStorage.getItem('studyplan_ticks')||'{}'); cur[key]=!cur[key]; localStorage.setItem('studyplan_ticks', JSON.stringify(cur)); t.classList.toggle('done'); };
  });
}

function loadTodos(){
  const todoListEl = document.getElementById('todoList');
  const todos = JSON.parse(localStorage.getItem('studyplan_todos')||'[]');
  todoListEl.innerHTML='';
  todos.forEach((td,idx)=>{ const div = document.createElement('div'); div.className='todoItem '+(td.done?'done':''); div.innerHTML = '<div>'+td.text+'</div><div><button data-idx="'+idx+'">✔</button></div>'; todoListEl.appendChild(div);});
  todoListEl.querySelectorAll('button').forEach(b=> b.onclick = ()=> { const idx = b.dataset.idx; const todos = JSON.parse(localStorage.getItem('studyplan_todos')||'[]'); todos[idx].done = !todos[idx].done; localStorage.setItem('studyplan_todos', JSON.stringify(todos)); loadTodos(); });
}
document.addEventListener('DOMContentLoaded', ()=>{
  buildSidebar();
  buildWeeks();
  showWeek(1);
  loadTicks();
  loadTodos();
  // calendar fetch (serverless function)
  (async function fetchCalendar(){
    const endpoint = '/.netlify/functions/filterCalendar';
    const calUrl = encodeURIComponent('https://www.greenford.ealing.sch.uk/ghscalendar');
    try {
      const resp = await fetch(`${endpoint}?url=${calUrl}`);
      if(!resp.ok) throw new Error('fail');
      const json = await resp.json();
      const container = document.getElementById('calendarEvents');
      if((json.events||[]).length===0){ container.innerHTML = '<div class="muted">No Year 11 events found.</div>'; return; }
      container.innerHTML = '';
      json.events.forEach(ev=>{
        const card = document.createElement('div'); card.className='calendar-event-card'; card.innerHTML = '<div><strong>'+ (new Date(ev.start)).toLocaleString() +'</strong> — '+(ev.summary||'')+'</div><div>'+(ev.description||'')+'</div>'; container.appendChild(card);
      });
    } catch (err) {
      document.getElementById('calendarEvents').innerHTML = '<div class="muted">Calendar unavailable.</div>';
      console.warn(err);
    }
  })();
});
