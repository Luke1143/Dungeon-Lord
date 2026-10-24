// The level screen's menu, in the manner of Dungeon Keeper: the minimap on top, resources, tabs (overview, buildings, spells, traps, creatures), a grid of tiles
// and a strip with the explanation of what is hovered or selected. Events fall in as icons and pile up next to the menu; a click on one shows where and what.
// Tiles are plain buttons (the old ids and classes stay, so the game logic does not care); this file only draws and wires the looks.
const UI_HINTS={
  storage:['Lagerraum','Hier lagern Gold, Erz und Eisen. Imps bringen alles hierher.'],
  dormitory:['Schlafsaal','Betten für die Kreaturen: wer ausgeschlafen ist, arbeitet besser.'],
  library:['Bibliothek','Warlocks erforschen hier Ideen: neue Räume und Zauber.'],
  hatchery:['Hühnerfarm','Hühner sind das Futter für die Kreaturen.'],
  bridge:['Brücke','Eine Brücke über Wasser oder Lava. Erst erforscht, dann bauen.'],
  smelter:['Schmelze','Schmilzt Erz und alte Ausrüstung zu Barren.'],
  forge:['Schmiede','Schmiedet aus Barren Waffen, Rüstungen und Schilde.'],
  arena:['Arena','Kreaturen kämpfen hier gegeneinander und lernen dabei.'],
  prison:['Gefängnis','Hier sitzen gefangene Helden.'],
  armory:['Rüstkammer','Lager nur für Ausrüstung. Kreaturen holen sich, was sie mögen.'],
  tavern:['Taverne','Kreaturen entspannen sich hier und werden zufriedener.'],
  graveyard:['Friedhof','Hier ruhen die Gefallenen.'],
  guardpost:['Wachposten','Wer hier angestellt ist, bewacht den Posten und greift Eindringlinge an.'],
  training:['Trainingskammer','Kreaturen üben hier und sammeln Erfahrung.'],
  temple:['Tempel','Ein Ort der Andacht für die Kreaturen.'],
  demolish:['Abreißen','Reißt einen Raum ab. Die Kosten werden voll erstattet.'],
  summon:['Imp beschwören','Ein neuer Imp gräbt, baut und trägt. Jeder weitere kostet mehr.'],
  pick:['Aufheben','Hebt einen Imp, eine Kreatur oder eine Leiche auf und setzt sie anderswo ab.'],
  possess:['Besessenheit','Übernimm ein Wesen und steuere es selbst, auch in der Ich-Perspektive.']
};
function uiTab(name){
  document.querySelectorAll('.dkPane').forEach(p=>{ p.hidden=(p.id!=='menu-'+name); });
  document.querySelectorAll('.dkTab').forEach(b=>b.classList.toggle('active',b.dataset.menu===name));
  if(name==='creatures' && typeof renderCreatureList==='function') renderCreatureList();
}
// the hover text of a tile (what it is, what it costs) in the strip at the foot of the menu
function uiHintWire(){
  const box=document.getElementById('dkHint'); if(!box) return;
  document.querySelectorAll('.tile[data-hint]').forEach(b=>{
    const h=UI_HINTS[b.dataset.hint]; if(!h) return;
    const show=()=>{ const cost=b.querySelector('.tc'); box.innerHTML=`<b>${h[0]}</b>${cost&&cost.textContent?` · <span>${cost.textContent}</span>${b.dataset.room&&cost.textContent==='100'?' <span>Gold je Kachel</span>':''}`:''}<br>${h[1]}`; box.hidden=false; };
    b.addEventListener('mouseenter',show); b.addEventListener('focus',show);
    b.addEventListener('mouseleave',()=>{ box.hidden=true; }); b.addEventListener('blur',()=>{ box.hidden=true; });
  });
}
// ---- events as falling icons ----
const UI_EVENT_KINDS=[
  [/aufgestiegen/i,'⭐','Stufenaufstieg'], [/gefallen|stirbt|getötet|niedergestreckt|verhungert|gestorben/i,'💀','Tod'], [/eingedrungen|Welle|Helden|Angriff|Held/i,'⚔️','Gefahr'],
  [/Lager ist voll|nicht mehr eingelagert/i,'📦','Lager voll'], [/Bau|gebaut|fertiggestellt/i,'🏗️','Bau'], [/Grabaufgaben|gegraben|vorgegraben/i,'⛏️','Graben'],
  [/Gold|Lohn|Beute/i,'💰','Gold'], [/Idee|erforscht|Forschung/i,'💡','Idee'], [/Debug/i,'🐞','Debug']
];
const uiEventKind=msg=>{ for(const [re,ic,name] of UI_EVENT_KINDS) if(re.test(msg)) return { ic, name }; return { ic:'📜', name:'Meldung' }; };
const uiSeenEvents=new Set(); let uiEventDismissed=new Set();
function uiRenderEvents(){
  const box=document.getElementById('eventStack'); if(!box||typeof state==='undefined'||!state) return;
  const list=(state.eventLog||[]).filter(e=>!uiEventDismissed.has(e.id)&&state.tickCount-e.tick<1500).slice(0,9);      // the newest at the bottom of the pile
  const keep=new Set(list.map(e=>e.id));
  [...box.children].forEach(el=>{ if(!keep.has(+el.dataset.id)) el.remove(); });
  list.slice().reverse().forEach(e=>{
    let el=box.querySelector(`[data-id="${e.id}"]`);
    const k=uiEventKind(e.msg);
    if(!el){
      el=document.createElement('button'); el.className='evIcon'; el.dataset.id=e.id; el.innerHTML=`<span>${k.ic}</span><i></i>`;
      el.addEventListener('click',()=>{ jumpCameraTo(e.x,e.y); const box2=document.getElementById('dkHint'); if(box2){ box2.innerHTML=`<b>${k.name}</b>${e.n>1?' ×'+e.n:''}<br>${e.msg.replace(/[<>&]/g,'')}`; box2.hidden=false; clearTimeout(window.__evHint); window.__evHint=setTimeout(()=>{ box2.hidden=true; },6000); } uiEventDismissed.add(e.id); el.classList.add('gone'); setTimeout(()=>{ el.remove(); },200); });
      if(!uiSeenEvents.has(e.id)){ uiSeenEvents.add(e.id); el.classList.add('drop'); }
      box.appendChild(el);
    }
    el.title=e.msg+(e.n>1?`  ×${e.n}`:'');
    const badge=el.querySelector('i'); badge.textContent=e.n>1?e.n:'';
  });
  // order: the newest on top of the pile, the oldest at the bottom
  [...box.children].sort((a,b)=>+b.dataset.id-+a.dataset.id).forEach(el=>box.appendChild(el));
}
// ---- creatures as portraits ----
function uiPortrait(kind,size){
  const c=document.createElement('canvas'); c.width=c.height=size; c.className='portrait';
  try{ const cv=spriteCanvas(kind,0,true,true); const g=c.getContext('2d'); g.imageSmoothingEnabled=false; const s=Math.min(size/cv.width,size/cv.height); g.drawImage(cv,(size-cv.width*s)/2,(size-cv.height*s)/2,cv.width*s,cv.height*s); }catch(e){ const g=c.getContext('2d'); g.font=(size*0.7)+'px serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText((SPECIES[kind]||{}).icon||'❔',size/2,size/2); }
  return c;
}

uiHintWire(); uiTab('info');
