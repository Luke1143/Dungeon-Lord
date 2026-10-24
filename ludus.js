// Ludus: a roguelike mode on top of the creature arena (concept: docs/ludus.md). One fighter, one run: pit matches for gold, an inn to heal, a smithy for gear.
// A match is a normal arena match (arenaBuild/arenaStart) with the fighter of the run on the dark side; fainting is survived, dying ends the run.
// Everything of a run lives in `ludus` and is saved after each step; `ludusMeta` holds what outlives a run (records, debug switch).
const LUDUS_STORE='dungeon-lord-ludus-v1';
const LUDUS_START_GOLD=40;
const LUDUS_STARTER_KINDS=['ork','goblin','skeleton','barbarian','thief','troll'];   // what is known before the campaign has shown more (the debug switch opens everything)
const LUDUS_NAMES=['Marcus','Livia','Brutus','Cassia','Titus','Varro','Nerva','Drusa','Rufus','Sabina','Cato','Valeria','Gaius','Aurelia','Lucan','Fulvia','Decimus','Octavia','Cornelius','Silvia'];
let ludus=null, ludusMeta={ unlockAll:true, roomsAll:false, bestWins:0, bestDays:0, runs:0, renown:0, rooms:{ inn:1, pit:1 }, cats:{} };
// ---- the Ludus as a place: rooms that are bought once and stay for every run, and that grow in tiers (meta progress, paid with standing) ----
// cost[i] = standing to reach tier i+1. The forge's tier is the quality of what it sells; its categories (weapon kinds, armour weights, shields) are bought separately.
const LUDUS_ROOMS={
  inn:    { label:'Taverne',      cost:[0,25,80],       text:['Huhn und Bett','besseres Essen, das Bett heilt mehr','Festmahl, das Bett heilt fast alles'] },
  pit:    { label:'Grube',        cost:[0,45,130],      text:['Pit-Kämpfe mit kleinen Preisen','Preise um die Hälfte höher','Große Preise (mehr als das Doppelte)'] },
  forge:  { label:'Schmiede',     cost:[20,60,150,300], text:['nur grobe Ware aus schlechten Teilen','gewöhnliche Ware','feine Ware aus guten Teilen','epische Ware aus den besten Teilen'] },
  library:{ label:'Bücherei',     cost:[25,70,160],     text:['einfache Fähigkeiten','mittlere Fähigkeiten','alle Fähigkeiten'] },
  hall:   { label:'Turnierhalle', cost:[60,200],        text:['Wochenturnier','höhere Preise und mehr Ansehen'] },
  training:{ label:'Trainingsraum', cost:[30,90,200],    text:['Übungspuppen: Erfahrung ohne Verletzung (kostet Gold und einen Tag)','bessere Lehrmeister (mehr Erfahrung)','Meisterlehre (viel Erfahrung)'] }
};
const LUDUS_CATS={   // what the forge may sell: [type, family, cost]; the first of each type comes with the forge
  weapon:[['sword',0],['dagger',8],['spear',15],['mace',15],['axe',20],['hammer',30],['javelin',12],['bow',25],['crossbow',40],['wandFire',30],['wandBolt',40],['wandIce',50]],
  armor:[['lightArmor',0],['mediumArmor',20],['heavyArmor',45]],
  shield:[['buckler',10],['kite',20],['tower',40]]
};
const LUDUS_CAT_LABEL={ weapon:'Waffen', armor:'Rüstungen', shield:'Schilde' };
function ludusRoomTier(id){ if(ludusMeta.roomsAll) return LUDUS_ROOMS[id].cost.length; return ludusMeta.rooms[id]||0; }
function ludusCatOwned(type,fam){ const e=LUDUS_CATS[type].find(x=>x[0]===fam); return !!e && (ludusMeta.roomsAll || e[1]===0 && ludusRoomTier('forge')>0 || !!(ludusMeta.cats[type]&&ludusMeta.cats[type][fam])); }
function ludusGainRenown(n){ if(n>0) ludusMeta.renown=(ludusMeta.renown||0)+n; }
function ludusBuyRoom(id){
  const room=LUDUS_ROOMS[id], t=ludusMeta.rooms[id]||0, cost=room.cost[t]; if(cost===undefined||ludusMeta.renown<cost) return;
  ludusMeta.renown-=cost; ludusMeta.rooms[id]=t+1; ludusNote=`${room.label}: ${room.text[t]}.`; ludusSave(); ludusRender();
}
function ludusBuyCat(type,fam){
  const e=LUDUS_CATS[type].find(x=>x[0]===fam); if(!e||ludusCatOwned(type,fam)||ludusMeta.renown<e[1]) return;
  ludusMeta.renown-=e[1]; (ludusMeta.cats[type]=ludusMeta.cats[type]||{})[fam]=1; ludusSave(); ludusRender();
}
const ludusInnTier=()=>Math.max(1,ludusRoomTier('inn'));
const ludusChickenCost=()=>[6,5,4][ludusInnTier()-1], ludusChickenHeal=()=>[0.4,0.55,0.7][ludusInnTier()-1], ludusSleepHeal=()=>[0.5,0.65,0.85][ludusInnTier()-1];
const ludusPitMult=()=>[0,1,1.5,2.2][ludusRoomTier('pit')]||1, ludusHallMult=()=>[0,1,1.5][ludusRoomTier('hall')]||1;
let ludusSel=-1, ludusActive=false, ludusResolved=false, ludusResultText='', ludusTab='inn', ludusBusy=false, ludusNote='';
// ---- persistence ----
async function ludusSave(){ try{ await window.storage.set(LUDUS_STORE, JSON.stringify({ run:ludus, meta:ludusMeta }), false); }catch(e){} }
async function ludusLoad(){
  try{ const r=await window.storage.get(LUDUS_STORE,false); if(r&&r.value){ const d=JSON.parse(r.value); ludus=d.run&&!d.run.over?d.run:(d.run||null); ludusMeta=Object.assign(ludusMeta,d.meta||{}); ludusMeta.rooms=Object.assign({ inn:1, pit:1 },ludusMeta.rooms||{}); ludusMeta.rooms.pit=Math.max(1,ludusMeta.rooms.pit||0); ludusMeta.cats=ludusMeta.cats||{}; } }catch(e){}
}
const ludusRng=(salt)=>seededRng(arenaHash((ludus?ludus.seed:'x')+':'+salt));
function ludusKinds(){ const all=arenaKinds(); return ludusMeta.unlockAll?all:all.filter(k=>LUDUS_STARTER_KINDS.includes(k)); }

// ---- the fighter ----
function ludusFighterGroup(){
  const f=ludus.fighter, g=arenaGroup(f.kind,1,f.level); g.fighter=f; g.seed=f.seed; return g;
}
// the fighter as a creature (for pictures and numbers), not placed in any match
function ludusCreature(){
  const f=ludus.fighter, c=arenaMake(f.kind,0,0); arenaApplyFighter(c,f); return c;
}
const ludusTierIndex=inst=>Math.max(0,TIER_IDS.indexOf((instDef(inst)||{}).tier));
function ludusPrice(id){
  const d=ITEMS[id]; if(!d) return 0;
  const base=d.type==='weapon'?18*(d.hands===2?1.5:1):(d.type==='armor'?({ lightArmor:22, mediumArmor:34, heavyArmor:52 }[d.family]||30):({ buckler:14, kite:22, tower:32 }[d.family]||20));
  return Math.max(4,Math.round(base*[0.5,1,2.4,5.5][Math.max(0,TIER_IDS.indexOf(d.tier))]));
}
const ludusSellPrice=inst=>Math.floor(ludusPrice(asInstance(inst).id)*0.5);
const ludusRerollPrice=inst=>Math.max(3,Math.round(ludusPrice(asInstance(inst).id)*0.15));

// ---- a new run ----
function ludusNewRun(kind,name){
  const seed=String(Math.floor(Math.random()*1e9));
  ludus={ seed, day:1, gold:LUDUS_START_GOLD, fame:0, wins:0, losses:0, over:false, cause:'', log:[], opp:null,
    fighter:{ kind, name:name||LUDUS_NAMES[Math.floor(Math.random()*LUDUS_NAMES.length)], level:1, xp:0, hp:undefined, inventory:[], learned:[], books:[], seed:Math.floor(Math.random()*1e9) } };
  ludusMeta.runs++; ludusTab='inn'; ludusNote='';
  ludusSave(); ludusRender();
}
function ludusLog(t){ ludus.log.unshift(`Tag ${ludus.day}: ${t}`); ludus.log=ludus.log.slice(0,8); }

// ---- the opponent: a kind and gear picked so that the match is close to even (a few test fights decide) ----
function ludusOppGroup(o){ const g=arenaGroup(o.kind,1,o.level); g.tier=o.tier; g.seed=o.seed; g.name=o.name; return g; }
function ludusMatchSetup(o,salt){
  return { teams:[ { name:ludus.fighter.name, groups:[ludusFighterGroup()] }, { name:o.name, groups:[ludusOppGroup(o)] } ],
    map:{ layout:'pit', dims:'S', seed:'lud'+ludus.seed+':'+ludus.day+(salt||''), lava:0, water:0, crystal:0, near:1 }, batch:1, ludus:true };
}
function ludusAverageTier(){
  const worn=wornItems(ludusCreature()); if(!worn.length) return 0;
  return Math.max(0,Math.min(3,Math.round(worn.reduce((t,i)=>t+ludusTierIndex(i),0)/worn.length)));
}
function ludusScoutOpponent(){
  if(ludusBusy||ludus.opp||ludus.over) return;
  ludusBusy=true; ludusRender();
  // one candidate per timer tick, so the page stays alive and can paint between the test fights
  const r=ludusRng('opp'+ludus.day), tier=ludusAverageTier(), pool=ludusKinds().slice(), cands=[];
  for(let i=0;i<5&&pool.length;i++) cands.push(pool.splice(Math.floor(r()*pool.length),1)[0]);
  const run=ludus, step=(i,best)=>{
    if(ludus!==run) { ludusBusy=false; return; }
    if(i>=cands.length){
      run.opp=Object.assign(best.o,{ reward:Math.round((12+6*run.fighter.level)*ludusPitMult()) }); ludusBusy=false; ludusSave(); ludusRender(); return;
    }
    const kind=cands[i], o={ kind, level:run.fighter.level, tier, seed:Math.floor(r()*1e9), name:LUDUS_NAMES[Math.floor(r()*LUDUS_NAMES.length)] };
    let score=1;
    try{ const res=arenaSimulate(ludusMatchSetup(o,'scout'),2,null); score=Math.abs(res.wins[0]/2-0.5)+r()*0.05; }catch(e){ console.error(e); }
    const el=document.getElementById('luScout'); if(el) el.textContent=`${i+1}/${cands.length}`;
    setTimeout(()=>step(i+1,(!best||score<best.score)?{ score, o }:best),20);
  };
  setTimeout(()=>step(0,null),30);
}

// ---- the match ----
function ludusFight(){
  if(!ludus||ludus.over||!ludus.opp) return;
  ludusActive=true; ludusResolved=false; ludusResultText='';
  const setup=ludusMatchSetup(ludus.opp,'');
  arenaStart(setup);
  document.getElementById('levelSubtitle').textContent=Tr('Ludus — Pit-Kampf');
}
// called once when the match is over (or left): applies the outcome to the run; returns the headline
function ludusResolve(st){
  if(ludusResolved) return ludusResultText.split('\n')[0]||'';
  ludusResolved=true;
  const f=ludus.fighter, c=st.arena.roster[0][0], o=ludus.opp, won=st.arena.winner===0;
  const dead=!c || c.removed || c.dead || !st.creatures.includes(c);
  let head, text;
  if(dead){
    ludus.over=true; ludus.cause=`Gefallen gegen ${o.name} (${SPECIES[o.kind].label})`; head='Gefallen'; text=`${f.name} ist in der Grube gestorben. Der Lauf endet nach ${ludus.wins} Siegen und ${ludus.day} Tagen.`;
    ludusGainRenown(Math.floor(ludus.fame/2));
    ludusMeta.bestWins=Math.max(ludusMeta.bestWins,ludus.wins); ludusMeta.bestDays=Math.max(ludusMeta.bestDays,ludus.day);
  } else {
    const prev=state; state=st;
    try{ grantXp(c, won ? 18+8*o.level : 6+2*o.level); } finally { state=prev; }
    f.level=c.level; f.xp=c.xp; f.inventory=JSON.parse(JSON.stringify(c.inventory||[])); f.learned=(c.learned||[]).slice();
    f.hp=c.asleep?Math.max(1,Math.round(c.hp)):(c.unconscious?1:Math.max(1,c.hp));
    if(won){
      ludus.gold+=o.reward; ludus.fame++; ludus.wins++; if(!o.tour) ludusGainRenown(1+(ludusRoomTier('pit')>=3?1:0));
      const loot=(st.looseItems||[]).filter(it=>it&&it.kind==='equipment');
      loot.forEach(it=>{ f.inventory.push(looseInst(it)); });
      head='Sieg'; text=`${f.name} gewinnt gegen ${o.name}. +${o.reward} Gold${loot.length?`, Beute: ${loot.length} Stück`:''}.`;
      ludusLog(`Sieg über ${o.name}`);
      if(o.tour){ const t=ludusTour(); t.beaten++; ludus.fame+=o.rank===1?10:1; ludusGainRenown(Math.round((o.rank===1?10:2)*ludusHallMult())); if(o.rank===1){ ludusMeta.titles=(ludusMeta.titles||0)+1; text+=' Du bist Meister dieser Woche!'; } }
    } else {
      ludus.losses++; ludus.gold+=2; head=c.surrendered?'Aufgegeben':(c.unconscious?'Bewusstlos':'Verloren');
      text=`${f.name} ${c.surrendered?'gibt auf und überlebt':(c.unconscious?'sinkt bewusstlos zu Boden, überlebt aber':'verliert nach Zeit')}. +2 Gold Trost.`;
      ludusLog(`Niederlage gegen ${o.name}`);
    }
    f.energy=Math.max(10,(Number.isFinite(c.energy)?c.energy:(f.energy===undefined?100:f.energy))-12); ludus.day++; ludus.opp=null;
  }
  ludusResultText=head+'\n'+text; ludusSave();
  return head;
}
function ludusLeaveMatch(){
  if(!ludusResolved){ ludusResolve(state); }
  ludusActive=false; arenaSpell=null; document.getElementById('menu-spells').hidden=true;
  document.body.classList.remove('arenaMode'); debugNoFog=false; possessed=null; fpRestoreOnLeave();
  document.getElementById('arenaResult').hidden=true; document.getElementById('ludusContinue').hidden=true;
  state=makeDefaultState(); ludusNote=ludusResultText.replace('\n',' — '); ludusTab=ludus.over?'start':'pit'; showScreen('ludus'); ludusRender();
}

// ---- the weekly ladder: ten rivals from a seed that depends only on the calendar week, so every player meets the same ones ----
const LUDUS_CAST=['Ferox','Rufus','Magnus','Niger','Longus','Crassus','Felix','Fortis','Gracilis','Pius'];
function ludusWeekId(d){
  d=d||new Date(); const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())), day=t.getUTCDay()||7; t.setUTCDate(t.getUTCDate()+4-day);
  const y0=new Date(Date.UTC(t.getUTCFullYear(),0,1)), wk=Math.ceil(((t-y0)/86400000+1)/7);
  return t.getUTCFullYear()+'-W'+String(wk).padStart(2,'0');
}
function ludusLadder(week){
  const r=seededRng(arenaHash('ladder:'+week)), pool=arenaKinds().slice(), out=[];
  for(let i=0;i<10;i++){      // i = 0 is the champion, i = 9 the weakest
    const kind=pool.splice(Math.floor(r()*pool.length),1)[0], strength=9-i;
    out.push({ kind, level:1+Math.round(strength*1.8), tier:Math.max(0,Math.min(3,Math.floor(strength/3))), seed:Math.floor(r()*1e9),
      name:LUDUS_NAMES[Math.floor(r()*LUDUS_NAMES.length)]+' '+LUDUS_CAST[Math.floor(r()*LUDUS_CAST.length)], rank:i+1 });
  }
  return out;
}
function ludusTour(){
  const w=ludusWeekId(); if(!ludus.tour||ludus.tour.week!==w) ludus.tour={ week:w, beaten:0 };
  return ludus.tour;
}
function ludusChallenge(){
  const t=ludusTour(), lad=ludusLadder(t.week), rival=lad[9-t.beaten]; if(!rival||ludus.over) return;
  ludus.opp=Object.assign({},rival,{ reward:Math.round((20+12*(t.beaten+1)+(rival.rank===1?100:0))*ludusHallMult()), tour:true });
  ludusSave(); ludusFight();
}
// ---- the library: ability books, three a day, fitted to the fighter's kind ----
function ludusBooks(){
  const c=ludusCreature(), r=ludusRng('books'+ludus.day);
  const cap=[0,3,4,9][ludusRoomTier('library')]||0;
  const pool=(ARCHETYPE_POOL[archetypeOf(c)]||[]).concat(['haste','guard']).filter((id,i,a)=>a.indexOf(id)===i && ABILITIES[id] && ABILITIES[id].power<=cap && !knownAbilities(c).includes(id));
  const out=[]; while(out.length<3 && pool.length) out.push(pool.splice(Math.floor(r()*pool.length),1)[0]);
  return out;
}
const ludusBookPrice=id=>30+22*(ABILITIES[id].power||2);
function ludusBuyBook(id){
  const pr=ludusBookPrice(id); if(ludus.gold<pr) return;
  ludus.gold-=pr; (ludus.fighter.books=ludus.fighter.books||[]).push(id); ludusNote=`Du kaufst das Buch "${ABILITIES[id].name}". Es liegt im Inventar und will gelernt werden.`; ludusSave(); ludusRender();
}
// a book in the bag is read: the fighter learns the ability (the rules of the main game decide whether there is room)
function ludusLearnBook(i){
  const f=ludus.fighter, id=(f.books||[])[i]; if(!id) return;
  const c=ludusCreature(), prev=state; let ok=false;
  try{ if(!state||!state.eventLog) state=makeDefaultState(); ok=learnAbility(c,id); } finally { state=prev; }
  if(!ok){ ludusNote='Das Buch verrät ihm nichts Neues oder er hat keinen Platz dafür.'; ludusRender(); return; }
  f.learned=(c.learned||[]).slice(); f.books.splice(i,1); ludusNote=`${f.name} lernt "${ABILITIES[id].name}".`; ludusSave(); ludusRender();
}
// ---- the training room: one turn of practice gives experience without a scratch, for a little gold ----
const ludusTrainCost=()=>10+4*ludus.fighter.level, ludusTrainXp=()=>Math.round((8+4*ludus.fighter.level)*[1,1.6,2.4][Math.max(0,ludusRoomTier('training')-1)]);
function ludusTrain(){
  const cost=ludusTrainCost(); if(ludus.gold<cost||ludusRoomTier('training')<1) return;
  const f=ludus.fighter, c=ludusCreature(), prev=state, xp=ludusTrainXp(), before=c.level;
  try{ if(!state||!state.eventLog) state=makeDefaultState(); grantXp(c,xp); } finally { state=prev; }
  f.level=c.level; f.xp=c.xp; f.energy=Math.max(10,(f.energy===undefined?100:f.energy)-15); ludus.gold-=cost; ludus.day++; ludus.opp=null; if(c.level>before) f.hp=undefined;
  ludusNote=`${f.name} übt am Dummy: +${xp} Erfahrung${c.level>before?` — Stufe ${c.level}!`:''}`; ludusLog('trainiert'); ludusSave(); ludusRender();
}

// ---- the town square ----
const ludusEsc=s=>String(s).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));   // text only (quotes stay, so the translation sees them)
// what the forge sells today: only the unlocked kinds, in the quality of the forge's tier; a poor forge sells poor parts (the worst of six rolls), a fine one the best
function ludusStock(){
  const ft=ludusRoomTier('forge'); if(!ft) return [];
  const r=ludusRng('shop'+ludus.day), maxTier=Math.min(3,ft-1), q=[0.9,0.97,1.04,1.1][ft-1], tries=[6,1,3,6][ft-1], worst=ft===1, out=[];
  const ids=Object.keys(ITEMS).filter(id=>{ const d=ITEMS[id], ti=TIER_IDS.indexOf(d.tier); return ['weapon','armor','shield'].includes(d.type) && ti<=maxTier && ti>=Math.max(0,maxTier-1) && ludusCatOwned(d.type,d.family); });
  ['weapon','armor','shield'].forEach(type=>{
    const l=ids.filter(id=>ITEMS[id].type===type);
    for(let i=0;i<(type==='weapon'?3:2)&&l.length;i++){
      const id=l.splice(Math.floor(r()*l.length),1)[0]; let best=null;
      for(let k=0;k<tries;k++){ const s=Math.floor(r()*1e9), p=partsOf({ id, q, s }), sc=p?p.model.bal:0; if(!best || (worst?sc<best.sc:sc>best.sc)) best={ sc, s }; }
      out.push({ id, q, s:best.s });
    }
  });
  return out;
}
function ludusHealPct(c,f){ return Math.round(100*Math.max(0,Math.min(c.maxHp,f.hp===undefined?c.maxHp:f.hp))/c.maxHp); }
function ludusHeal(frac){ const c=ludusCreature(), f=ludus.fighter; f.hp=Math.min(c.maxHp,(f.hp===undefined?c.maxHp:f.hp)+Math.round(c.maxHp*frac)); }
// every building has its tab; a tab of a room that is not bought shows the empty plot and the one thing to do there: build
const LUDUS_TABS=[['inn','Taverne','inn'],['pit','Grube','pit'],['train','Trainingsraum','training'],['smith','Schmiede','forge'],['lib','Bücherei','library'],['tour','Turnierhalle','hall'],['gear','Inventar',null]];
const ludusRoomOfTab=tab=>(LUDUS_TABS.find(t=>t[0]===tab)||[])[2]||null;
function ludusRoomBox(id){
  const r=LUDUS_ROOMS[id], t=ludusRoomTier(id), max=r.cost.length; if(t>=max) return t?`<p class="luHint">${r.label}: voll ausgebaut.</p>`:'';
  const cost=r.cost[t];
  return `<div class="luBuild"><p><b>${t?'Ausbau':'Bauplatz'}:</b> ${r.text[t]}</p><button data-room="${id}" class="menuMain" ${ludusMeta.renown<cost?'disabled':''}>${t?'Ausbauen':'Bauen'} · ${cost} Ansehen</button></div>`;
}
function ludusCatsHTML(){
  return Object.keys(LUDUS_CATS).map(type=>`<div class="luCatRow"><b>${LUDUS_CAT_LABEL[type]}:</b> ${LUDUS_CATS[type].map(([fam,cost])=>{ const have=ludusCatOwned(type,fam), lab=ITEMS[fam+'_plain']?ITEMS[fam+'_plain'].baseLabel:fam; return have?`<span class="luCat have">${lab}</span>`:`<button data-cat="${type}:${fam}" ${ludusMeta.renown<cost?'disabled':''}>${lab} · ${cost}</button>`; }).join(' ')}</div>`).join('');
}
function ludusRender(){
  const el=document.getElementById('ludusBody'); if(!el) return;
  const live=!!ludus&&!ludus.over;
  const tabsAll=(live?[]:[['start',ludus&&ludus.over?'Der Lauf':'Neuer Kämpfer',null]]).concat(LUDUS_TABS.filter(t=>live||t[0]!=='gear'));
  if(!tabsAll.some(t=>t[0]===ludusTab)) ludusTab=live?'inn':'start';
  const roomId=ludusRoomOfTab(ludusTab)||'inn', tier=ludusRoomTier(roomId), room=LUDUS_ROOMS[roomId];
  let f=null, c=null, wornIdx=new Set(), left='';
  if(live){
    f=ludus.fighter; c=ludusCreature();
    const pct=ludusHealPct(c,f), nextXp=xpForLevel(f.level+1), curXp=xpForLevel(f.level), xpPct=Math.max(0,Math.min(100,Math.round(100*((f.xp||0)-curXp)/Math.max(1,nextXp-curXp))));
    wornIdx=new Set(wornItems(c).map(w=>c.inventory.indexOf(w)));
    const abil=knownAbilities(c).filter(id=>ABILITIES[id]);
    left=`<div class="luCard"><canvas id="luPrev" width="140" height="140"></canvas><h2>${ludusEsc(f.name)}</h2><div>${SPECIES[f.kind].label} · Stufe ${f.level}</div><div class="luStance">Kampfstil: <b>${STANCES[stanceOf(c)].label}</b></div>
      <div class="luBar"><i class="hp" style="width:${pct}%"></i><b>${Math.round(c.hp)}/${c.maxHp} LP</b></div><div class="luBar"><i class="xp" style="width:${xpPct}%"></i><b>${f.xp||0}/${nextXp} EP</b></div><div class="luBar"><i class="rest" style="width:${Math.round(f.energy===undefined?100:f.energy)}%"></i><b>Ausgeschlafen ${Math.round(f.energy===undefined?100:f.energy)} %</b></div>
      ${abil.length?`<div class="luAbil">${abil.map(id=>ABILITIES[id].icon+' '+ABILITIES[id].name).join(' · ')}</div>`:''}
      <div class="luInv">${(f.inventory||[]).some((x,i)=>wornIdx.has(i))?f.inventory.map((x,i)=>wornIdx.has(i)?`<div class="luItem worn" data-pick="${i}"><span>${ludusEsc(instLabel(x))} ✓</span></div>`:'').join(''):'<i>Keine Ausrüstung.</i>'}</div></div>`;
  }
  const itemRow=(inst,i)=>`<div class="luItem${wornIdx.has(i)?' worn':''}${ludusSel===i?' sel':''}" data-pick="${i}"><span>${ludusEsc(instLabel(inst))}${wornIdx.has(i)?' ✓':''}</span></div>`;
  let main='';
  if(ludusTab==='start'){
    main=(ludus&&ludus.over?`<div class="luPanel"><h2>Der Lauf ist zu Ende</h2><p>${ludusEsc(ludus.cause)}</p><p>Siege: ${ludus.wins} · Tage: ${ludus.day} · Ruhm: ${ludus.fame}</p><p>Rekord: ${ludusMeta.bestWins} Siege, ${ludusMeta.bestDays} Tage.</p></div>`:'')+ludusStartHTML();
  } else if(tier===0){
    main=`<div class="luPanel"><h2>${room.label}: Bauplatz</h2><p>Hier steht noch nichts. Wer hier baut, bekommt: ${room.text[0]}.</p>${ludusRoomBox(roomId)}</div>`;
  } else if(!live && ludusTab!=='gear'){
    main=`<div class="luPanel"><h2>${room.label} (Stufe ${tier}/${room.cost.length})</h2><p>${room.text[tier-1]}.</p>${roomId==='forge'?`<h3>Sortiment der Schmiede</h3>${ludusCatsHTML()}`:''}${ludusRoomBox(roomId)}</div>`;
  } else if(ludusTab==='pit'){
    const o=ludus.opp;
    main=`<div class="luPanel"><h2>Pit-Kampf</h2>`+(o?`<div class="luOpp"><canvas id="luOpp" width="110" height="110"></canvas><div><b>${ludusEsc(o.name)}</b><br>${SPECIES[o.kind].label} · Stufe ${o.level}<br>Preis: ${o.reward} Gold</div></div><button id="luFight" class="menuMain">Kämpfen</button>`
      : (ludusBusy?'<p>Der Wirt sucht einen Gegner … <span id="luScout"></span></p>':'<p>Kein Gegner in Sicht.</p>'))+`<p class="luHint">Jeder Kampf kostet einen Tag. Wer bewusstlos wird, überlebt; wer fällt, beendet den Lauf.</p>${ludusRoomBox('pit')}</div>`;
  } else if(ludusTab==='inn'){
    main=`<div class="luPanel"><h2>Taverne</h2><p>Ein gebratenes Huhn stärkt (${ludusChickenCost()} Gold). Im Bett schlafen ist gratis, kostet aber einen Tag.</p>
      <button id="luChicken" ${ludus.gold<ludusChickenCost()?'disabled':''}>🍗 Huhn essen (${ludusChickenCost()} Gold, +${Math.round(ludusChickenHeal()*100)} % LP)</button> <button id="luSleep">🛏️ Schlafen (+${Math.round(ludusSleepHeal()*100)} % LP, ein Tag)</button>${ludusRoomBox('inn')}</div>`;
  } else if(ludusTab==='train'){
    const cost=ludusTrainCost();
    main=`<div class="luPanel"><h2>Trainingsraum</h2><p>Eine Runde am Übungsdummy gibt Erfahrung, ohne dass jemand Schaden nimmt. Sie kostet Gold und einen Tag.</p>
      <button id="luTrain" class="menuMain" ${ludus.gold<cost?'disabled':''}>Trainieren · ${cost} Gold · +${ludusTrainXp()} Erfahrung</button>${ludusRoomBox('training')}</div>`;
  } else if(ludusTab==='tour'){
    const t=ludusTour(), lad=ludusLadder(t.week), next=t.beaten<10?lad[9-t.beaten]:null;
    main=`<div class="luPanel"><h2>Wochenturnier ${t.week}</h2><p class="luHint">Die Rangliste ist für alle Spieler dieser Woche gleich. Besiege die Gegner von unten nach oben, bis du den Meister schlägst.</p>
      ${lad.map((r,i)=>{ const done=(9-i)<t.beaten; return `<div class="luItem${done?' worn':''}${next&&next.rank===r.rank?' sel':''}"><span>${r.rank}. ${ludusEsc(r.name)} — ${SPECIES[r.kind].label}, Stufe ${r.level}</span><span>${done?'✓':''}</span></div>`; }).join('')}
      ${next?`<p>Nächster Gegner: <b>${ludusEsc(next.name)}</b> (Platz ${next.rank}) · Preis ${Math.round((20+12*(t.beaten+1)+(next.rank===1?100:0))*ludusHallMult())} Gold</p><button id="luChallenge" class="menuMain">Herausfordern</button>`:'<p><b>Du bist Meister dieser Woche!</b> Nächste Woche gibt es eine neue Rangliste.</p>'}${ludusRoomBox('hall')}</div>`;
  } else if(ludusTab==='lib'){
    const books=ludusBooks();
    main=`<div class="luPanel"><h2>Bücherei</h2><p class="luHint">Jeden Tag liegen drei Bücher aus, passend zur Art deines Kämpfers. Gekaufte Bücher liegen im Inventar und müssen gelernt werden.</p>
      ${books.length?books.map(id=>`<div class="luItem"><span>${ABILITIES[id].icon} ${ABILITIES[id].name} — ${ABILITIES[id].text||''}</span><button data-book="${id}" ${ludus.gold<ludusBookPrice(id)?'disabled':''}>${ludusBookPrice(id)} Gold</button></div>`).join(''):'<p><i>Heute gibt es nichts Neues für ihn.</i></p>'}${ludusRoomBox('library')}</div>`;
  } else if(ludusTab==='gear'){
    const inv=f.inventory||[], sel=inv[ludusSel], books=f.books||[];
    main=`<div class="luPanel"><h2>Inventar</h2>${inv.length?inv.map(itemRow).join(''):'<p><i>Du besitzt noch keine Ausrüstung. Die Schmiede verkauft welche.</i></p>'}
      ${sel?`<div class="luDetail"><pre>${ludusEsc(itemDescription(sel))}</pre>
        <button data-equip="${ludusSel}">${wornIdx.has(ludusSel)?'Ablegen':'Anlegen'}</button>
        <button data-reroll="${ludusSel}" title="Aussehen neu würfeln">🎲 ${ludusRerollPrice(sel)}</button>
        <button data-sell="${ludusSel}" title="Verkaufen">💰 ${ludusSellPrice(sel)}</button></div>`:(inv.length?'<p class="luHint">Wähle ein Stück, um es zu lesen, an- oder abzulegen.</p>':'')}
      ${books.length?`<h3>Bücher</h3>${books.map((id,i)=>`<div class="luItem"><span>📖 ${ABILITIES[id].icon} ${ABILITIES[id].name} — ${ABILITIES[id].text||''}</span><button data-learn="${i}">Lernen</button></div>`).join('')}`:''}</div>`;
  } else if(ludusTab==='smith'){
    const stock=ludusStock();
    main=`<div class="luPanel"><h2>Schmiede</h2><p>Heute im Angebot (${LUDUS_ROOMS.forge.text[tier-1]}):</p>${stock.length?stock.map((it,i)=>`<div class="luItem"><span>${ludusEsc(instLabel(it))}</span><button data-buy="${i}" ${ludus.gold<ludusPrice(it.id)?'disabled':''}>${ludusPrice(it.id)} Gold</button></div>`).join(''):'<p><i>Die Schmiede hat heute nichts, was du führen kannst. Kaufe unten mehr Sorten.</i></p>'}<h3>Sortiment der Schmiede</h3>${ludusCatsHTML()}${ludusRoomBox('forge')}</div>`;
    el._stock=stock;
  }
  const tabs=`<div class="luTabs">${tabsAll.map(([k,l,rm])=>{ const built=!rm||ludusRoomTier(rm)>0; return `<button data-tab="${k}" class="${ludusTab===k?'on':''}${built?'':' site'}">${built?'':'🔒 '}${l}</button>`; }).join('')}</div>`;
  el.innerHTML=`<div class="luTop"><span>Ansehen ${ludusMeta.renown}</span>${live?`<span>Tag ${ludus.day}</span><span>💰 ${ludus.gold}</span><span>Ruhm ${ludus.fame}</span><span>Siege ${ludus.wins}</span>`:''}</div>
    ${ludusNote?`<div class="luNote">${ludusEsc(ludusNote)}</div>`:''}
    ${tabs}<div class="${live?'luCols':'luSolo'}">${left}<div>${main}${live&&ludus.log.length?`<div class="luLog">${ludus.log.map(ludusEsc).join('<br>')}</div>`:''}</div></div>
    <div class="arBtns"><button id="luMenu" class="menuMain">Hauptmenü</button>${live?'<button id="luReset" class="menuMain">Neu beginnen</button>':''}</div>`;
  const stockNow=el._stock;
  el.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{ ludusTab=b.dataset.tab; ludusNote=''; if(ludusTab!=='gear') ludusSel=-1; ludusRender(); if(ludusTab==='pit'&&live) ludusScoutOpponent(); }));
  if(live){
    el.querySelectorAll('[data-pick]').forEach(b=>b.addEventListener('click',()=>{ ludusSel=+b.dataset.pick; ludusTab='gear'; ludusRender(); }));
    el.querySelectorAll('[data-equip]').forEach(b=>b.addEventListener('click',()=>{ const i=+b.dataset.equip, inst=f.inventory[i];
      if(wornIdx.has(i)){ inst.off=true; delete inst.pin; } else { delete inst.off; inst.pin=Date.now(); }       // the piece put on last takes its place first; a second one-handed blade fills the other hand
      ludusSave(); ludusRender(); }));
    el.querySelectorAll('[data-sell]').forEach(b=>b.addEventListener('click',()=>{ const i=+b.dataset.sell, inst=f.inventory[i]; ludus.gold+=ludusSellPrice(inst); f.inventory.splice(i,1); ludusSel=-1; ludusNote=''; ludusSave(); ludusRender(); }));
    el.querySelectorAll('[data-reroll]').forEach(b=>b.addEventListener('click',()=>{ const i=+b.dataset.reroll, inst=f.inventory[i], pr=ludusRerollPrice(inst); if(ludus.gold<pr) return; ludus.gold-=pr; inst.s=Math.floor(Math.random()*1e9); ludusSave(); ludusRender(); }));
    el.querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>{ const it=stockNow[+b.dataset.buy], pr=ludusPrice(it.id); if(ludus.gold<pr) return; ludus.gold-=pr; f.inventory.push({ id:it.id, q:it.q, s:it.s }); ludusNote=''; ludusSave(); ludusRender(); }));
    el.querySelectorAll('[data-book]').forEach(b=>b.addEventListener('click',()=>ludusBuyBook(b.dataset.book)));
    el.querySelectorAll('[data-learn]').forEach(b=>b.addEventListener('click',()=>ludusLearnBook(+b.dataset.learn)));
  }
  const on=(id,fn)=>{ const b=document.getElementById(id); if(b) b.addEventListener('click',fn); };
  el.querySelectorAll('[data-room]').forEach(b=>b.addEventListener('click',()=>ludusBuyRoom(b.dataset.room)));
  el.querySelectorAll('[data-cat]').forEach(b=>b.addEventListener('click',()=>{ const [t,f2]=b.dataset.cat.split(':'); ludusBuyCat(t,f2); }));
  on('luFight',ludusFight); on('luChallenge',ludusChallenge); on('luTrain',ludusTrain);
  on('luChicken',()=>{ if(ludus.gold<ludusChickenCost()) return; ludus.gold-=ludusChickenCost(); ludusHeal(ludusChickenHeal()); ludus.fighter.energy=Math.min(100,(ludus.fighter.energy===undefined?100:ludus.fighter.energy)+10); ludusSave(); ludusRender(); });
  on('luSleep',()=>{ ludusHeal(ludusSleepHeal()); ludus.fighter.energy=100; ludus.day++; ludus.opp=null; ludusLog('geschlafen'); ludusSave(); ludusRender(); });
  on('luMenu',()=>showScreen('menu'));
  on('luReset',e=>{ const b=e.currentTarget; if(b.dataset.sure){ ludus=null; ludusNote=''; ludusTab='start'; ludusSave(); ludusRender(); return; } b.dataset.sure='1'; b.textContent=Tr('Sicher? Nochmal klicken'); setTimeout(()=>{ if(b.isConnected){ delete b.dataset.sure; b.textContent=Tr('Neu beginnen'); } },3000); });
  if(ludusTab==='start') ludusWireStart(el);
  if(ludusTab==='pit' && live && !ludus.opp) ludusScoutOpponent();
  ludusHubSync(roomId);
}
// the 3D courtyard shows the meta progress; the camera belongs to the selected room, the fighter of the run walks in after it
let hubState='idle';
function ludusHubTiers(){ const t={}; Object.keys(LUDUS_ROOMS).forEach(id=>{ t[id]=ludusRoomTier(id); }); return t; }
function ludusHubSync(roomId){
  if(hubState==='failed') return;
  if(hubState==='idle'){
    hubState='loading';
    Hub3D.init(document.getElementById('hubHost')).then(()=>{ hubState='ready'; Hub3D.start(); ludusHubSync(roomId); }).catch(e=>{ console.error(e); hubState='failed'; document.getElementById('hubHost').hidden=true; });
    return;
  }
  if(hubState!=='ready') return;
  let fighter=null; if(ludus&&!ludus.over){ const c=ludusCreature(), extra=typeof equipLook==='function'?equipLook(c):undefined; fighter={ kind:ludus.fighter.kind, extra:extra||undefined, sig:JSON.stringify(extra||null) }; }
  Hub3D.sync(ludusHubTiers(),fighter); Hub3D.focus(roomId||'inn'); Hub3D.start(); Hub3D.resize();
}
function ludusPaint(){
  if(screen!=='ludus'||!ludus) return;
  const cv=document.getElementById('luPrev'); if(cv) arenaPaintCreature(cv,ludusCreature(),0,96);
  const oc=document.getElementById('luOpp'); if(oc&&ludus.opp){ const o=ludus.opp, c=arenaMake(o.kind,0,0); c.level=o.level; c.inventory=arenaGear(c,ludusOppGroup(o),0); arenaPaintCreature(oc,c,1,76); }
}
setInterval(ludusPaint,200);

// ---- starting a run ----
function ludusStartHTML(){
  const kinds=ludusKinds().map(k=>[k,SPECIES[k].label]).sort((a,b)=>a[1].localeCompare(b[1],'de'));
  return `<div class="luPanel"><h2>Neuer Kämpfer</h2><p class="luHint">Führe einen Kämpfer durch die Gruben, von Stufe 1 ohne Ausrüstung bis zum Ruhm.</p><p>Kreatur <select id="luKind">${arenaOpts(kinds,kinds[0]&&kinds[0][0])}</select> Name <input id="luName" maxlength="16" placeholder="zufällig"></p>
      <p><label><input type="checkbox" id="luUnlock" ${ludusMeta.unlockAll?'checked':''}> Debug: alle Kreaturen freigeschaltet</label><br><label><input type="checkbox" id="luRooms" ${ludusMeta.roomsAll?'checked':''}> Debug: alle Räume voll ausgebaut</label></p>
      <p class="luHint">Rekord: ${ludusMeta.bestWins} Siege, ${ludusMeta.bestDays} Tage. Läufe: ${ludusMeta.runs}</p>
      <button id="luStart" class="menuMain">Beginnen</button></div>`;
}
function ludusWireStart(el){
  document.getElementById('luStart').addEventListener('click',()=>ludusNewRun(document.getElementById('luKind').value,document.getElementById('luName').value.trim()));
  document.getElementById('luUnlock').addEventListener('change',e=>{ ludusMeta.unlockAll=e.target.checked; ludusSave(); ludusRender(); });
  document.getElementById('luRooms').addEventListener('change',e=>{ ludusMeta.roomsAll=e.target.checked; ludusSave(); ludusRender(); });
}
async function ludusOpen(){ await ludusLoad(); ludusNote=''; ludusTab=(ludus&&!ludus.over)?'inn':'start'; showScreen('ludus'); ludusRender(); }
document.getElementById('menuLudus').addEventListener('click',ludusOpen);
document.getElementById('ludusContinue').addEventListener('click',ludusLeaveMatch);
