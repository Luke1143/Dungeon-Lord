// Ludus: a roguelike mode on top of the creature arena (concept: docs/ludus.md). One fighter, one run: pit matches for gold, an inn to heal, a smithy for gear.
// A match is a normal arena match (arenaBuild/arenaStart) with the fighter of the run on the dark side; fainting is survived, dying ends the run.
// Everything of a run lives in `ludus` and is saved after each step; `ludusMeta` holds what outlives a run (records, debug switch).
const LUDUS_STORE='dungeon-lord-ludus-v1';
const LUDUS_START_GOLD=40;
const LUDUS_STARTER_KINDS=['ork','goblin','skeleton','barbarian','thief','troll'];   // what is known before the campaign has shown more (the debug switch opens everything)
const LUDUS_NAMES=['Marcus','Livia','Brutus','Cassia','Titus','Varro','Nerva','Drusa','Rufus','Sabina','Cato','Valeria','Gaius','Aurelia','Lucan','Fulvia','Decimus','Octavia','Cornelius','Silvia'];
let ludus=null, ludusMeta={ unlockAll:true, roomsAll:false, bestWins:0, bestDays:0, runs:0, renown:12, rooms:{ inn:1 }, cats:{} };
// ---- the Ludus as a place: rooms that are bought once and stay for every run, and that grow in tiers (meta progress, paid with standing) ----
// cost[i] = standing to reach tier i+1. The forge's tier is the quality of what it sells; its categories (weapon kinds, armour weights, shields) are bought separately.
const LUDUS_ROOMS={
  inn:    { label:'Taverne',      cost:[0,25,80],       text:['Huhn und Bett','besseres Essen, das Bett heilt mehr','Festmahl, das Bett heilt fast alles'] },
  pit:    { label:'Grube',        cost:[10,45,130],     text:['Pit-Kämpfe mit kleinen Preisen','Preise um die Hälfte höher','Große Preise (mehr als das Doppelte)'] },
  forge:  { label:'Schmiede',     cost:[20,60,150,300], text:['nur grobe Ware aus schlechten Teilen','gewöhnliche Ware','feine Ware aus guten Teilen','epische Ware aus den besten Teilen'] },
  library:{ label:'Bücherei',     cost:[25,70,160],     text:['einfache Fähigkeiten','mittlere Fähigkeiten','alle Fähigkeiten'] },
  hall:   { label:'Turnierhalle', cost:[60,200],        text:['Wochenturnier','höhere Preise und mehr Ansehen'] }
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
function ludusBuildHTML(){
  const rooms=Object.keys(LUDUS_ROOMS).map(id=>{
    const r=LUDUS_ROOMS[id], t=ludusRoomTier(id), max=r.cost.length, full=t>=max, cost=r.cost[t];
    return `<div class="luItem"><span><b>${r.label}</b> ${t?`Stufe ${ludusRoomTier(id)}/${max}: ${r.text[Math.min(max,ludusRoomTier(id))-1]}`:'noch nicht gebaut'}${full?'':`<br><small>Nächste Stufe: ${r.text[t]}</small>`}</span>${full?'<span>✓</span>':`<button data-room="${id}" ${ludusMeta.renown<cost?'disabled':''}>${t?'Ausbauen':'Bauen'} · ${cost}</button>`}</div>`; }).join('');
  const forge=ludusRoomTier('forge')>0?Object.keys(LUDUS_CATS).map(type=>`<div class="luCatRow"><b>${LUDUS_CAT_LABEL[type]}:</b> ${LUDUS_CATS[type].map(([fam,cost])=>{ const have=ludusCatOwned(type,fam), lab=ITEMS[fam+'_plain']?ITEMS[fam+'_plain'].baseLabel:fam; return have?`<span class="luCat have">${lab}</span>`:`<button data-cat="${type}:${fam}" ${ludusMeta.renown<cost?'disabled':''}>${lab} · ${cost}</button>`; }).join(' ')}</div>`).join(''):'';
  return `<div class="luPanel"><h2>Ausbau</h2><p class="luHint">Ansehen: <b>${ludusMeta.renown}</b>. Es kommt aus Siegen und bleibt über alle Läufe.</p>${rooms}${forge?`<h3>Sortiment der Schmiede</h3>${forge}`:''}</div>`;
}
let ludusSel=-1, ludusActive=false, ludusResolved=false, ludusResultText='', ludusTab='pit', ludusBusy=false, ludusNote='';

// ---- persistence ----
async function ludusSave(){ try{ await window.storage.set(LUDUS_STORE, JSON.stringify({ run:ludus, meta:ludusMeta }), false); }catch(e){} }
async function ludusLoad(){
  try{ const r=await window.storage.get(LUDUS_STORE,false); if(r&&r.value){ const d=JSON.parse(r.value); ludus=d.run&&!d.run.over?d.run:(d.run||null); ludusMeta=Object.assign(ludusMeta,d.meta||{}); ludusMeta.rooms=Object.assign({ inn:1 },ludusMeta.rooms||{}); ludusMeta.cats=ludusMeta.cats||{}; } }catch(e){}
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
    fighter:{ kind, name:name||LUDUS_NAMES[Math.floor(Math.random()*LUDUS_NAMES.length)], level:1, xp:0, hp:undefined, inventory:[], learned:[], seed:Math.floor(Math.random()*1e9) } };
  ludusMeta.runs++; ludusTab=ludusRoomTier('pit')>0?'pit':'inn'; ludusNote='';
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
    f.hp=c.unconscious?1:Math.max(1,c.hp);
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
    ludus.day++; ludus.opp=null;
  }
  ludusResultText=head+'\n'+text; ludusSave();
  return head;
}
function ludusLeaveMatch(){
  if(!ludusResolved){ ludusResolve(state); }
  ludusActive=false; arenaSpell=null; document.getElementById('menu-spells').hidden=true;
  document.body.classList.remove('arenaMode'); debugNoFog=false; possessed=null; fpRestoreOnLeave();
  document.getElementById('arenaResult').hidden=true; document.getElementById('ludusContinue').hidden=true;
  state=makeDefaultState(); ludusNote=ludusResultText.replace('\n',' — '); ludusTab='pit'; showScreen('ludus'); ludusRender();
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
  const c=ludusCreature(), prev=state;
  try{ if(!state||!state.eventLog) state=makeDefaultState(); const ok=learnAbility(c,id); if(!ok){ ludusNote='Das Buch verrät ihm nichts Neues oder er hat keinen Platz dafür.'; ludusRender(); return; } }
  finally { state=prev; }
  ludus.fighter.learned=(c.learned||[]).slice(); ludus.gold-=pr; ludusNote=`${ludus.fighter.name} lernt "${ABILITIES[id].name}".`; ludusSave(); ludusRender();
}

// ---- the town square ----
const ludusEsc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
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
function ludusRender(){
  const el=document.getElementById('ludusBody'); if(!el) return;
  if(!ludus){ el.innerHTML=ludusStartHTML(); ludusWireStart(el); ludusHubSync(); return; }
  if(!ludus.over && ludusTab!=='gear' && ludusTab!=='build' && ludusTab!=='inn' && !({ pit:'pit', tour:'hall', smith:'forge', lib:'library' }[ludusTab]&&ludusRoomTier({ pit:'pit', tour:'hall', smith:'forge', lib:'library' }[ludusTab])>0)) ludusTab='inn';
  const f=ludus.fighter, c=ludusCreature(), pct=ludusHealPct(c,f), nextXp=xpForLevel(f.level+1), curXp=xpForLevel(f.level), xpPct=Math.max(0,Math.min(100,Math.round(100*((f.xp||0)-curXp)/Math.max(1,nextXp-curXp))));
  const wornIdx=new Set(wornItems(c).map(w=>c.inventory.indexOf(w))), abil=knownAbilities(c).filter(id=>ABILITIES[id]);
  const itemRow=(inst,i)=>`<div class="luItem${wornIdx.has(i)?' worn':''}${ludusSel===i?' sel':''}" data-pick="${i}"><span>${ludusEsc(instLabel(inst))}${wornIdx.has(i)?' ✓':''}</span></div>`;
  const left=`<div class="luCard"><canvas id="luPrev" width="140" height="140"></canvas><h2>${ludusEsc(f.name)}</h2><div>${SPECIES[f.kind].label} · Stufe ${f.level}</div><div class="luStance">Kampfstil: <b>${STANCES[stanceOf(c)].label}</b></div>
    <div class="luBar"><i class="hp" style="width:${pct}%"></i><b>${Math.round(c.hp)}/${c.maxHp} LP</b></div><div class="luBar"><i class="xp" style="width:${xpPct}%"></i><b>${f.xp||0}/${nextXp} EP</b></div>
    ${abil.length?`<div class="luAbil">${abil.map(id=>ABILITIES[id].icon+' '+ABILITIES[id].name).join(' · ')}</div>`:''}
    <div class="luInv">${(f.inventory||[]).filter((x,i)=>wornIdx.has(i)).length?f.inventory.map((x,i)=>wornIdx.has(i)?itemRow(x,i):'').join(''):'<i>Keine Ausrüstung.</i>'}</div></div>`;
  let main='';
  if(ludus.over){
    main=`<div class="luPanel"><h2>Der Lauf ist zu Ende</h2><p>${ludusEsc(ludus.cause)}</p><p>Siege: ${ludus.wins} · Tage: ${ludus.day} · Ruhm: ${ludus.fame}</p><p>Rekord: ${ludusMeta.bestWins} Siege, ${ludusMeta.bestDays} Tage.</p><button id="luNew" class="menuMain">Neuer Kämpfer</button></div>`;
  } else if(ludusTab==='pit'){
    const o=ludus.opp;
    main=`<div class="luPanel"><h2>Pit-Kampf</h2>`+(o?`<div class="luOpp"><canvas id="luOpp" width="110" height="110"></canvas><div><b>${ludusEsc(o.name)}</b><br>${SPECIES[o.kind].label} · Stufe ${o.level}<br>Preis: ${o.reward} Gold</div></div><button id="luFight" class="menuMain">Kämpfen</button>`
      : (ludusBusy?'<p>Der Wirt sucht einen Gegner … <span id="luScout"></span></p>':'<p>Kein Gegner in Sicht.</p>'))+`<p class="luHint">Jeder Kampf kostet einen Tag. Wer bewusstlos wird, überlebt; wer fällt, beendet den Lauf.</p></div>`;
  } else if(ludusTab==='inn'){
    main=`<div class="luPanel"><h2>Taverne</h2><p>Ein gebratenes Huhn stärkt (${ludusChickenCost()} Gold). Im Bett schlafen ist gratis, kostet aber einen Tag.</p>
      <button id="luChicken" ${ludus.gold<ludusChickenCost()?'disabled':''}>🍗 Huhn essen (${ludusChickenCost()} Gold, +${Math.round(ludusChickenHeal()*100)} % LP)</button> <button id="luSleep">🛏️ Schlafen (+${Math.round(ludusSleepHeal()*100)} % LP, ein Tag)</button></div>`;
  } else if(ludusTab==='build'){
    main=ludusBuildHTML();
  } else if(ludusTab==='tour'){
    const t=ludusTour(), lad=ludusLadder(t.week), next=t.beaten<10?lad[9-t.beaten]:null;
    main=`<div class="luPanel"><h2>Wochenturnier ${t.week}</h2><p class="luHint">Die Rangliste ist für alle Spieler dieser Woche gleich. Besiege die Gegner von unten nach oben, bis du den Meister schlägst.</p>
      ${lad.map((r,i)=>{ const done=(9-i)<t.beaten; return `<div class="luItem${done?' worn':''}${next&&next.rank===r.rank?' sel':''}"><span>${r.rank}. ${ludusEsc(r.name)} — ${SPECIES[r.kind].label}, Stufe ${r.level}</span><span>${done?'✓':''}</span></div>`; }).join('')}
      ${next?`<p>Nächster Gegner: <b>${ludusEsc(next.name)}</b> (Platz ${next.rank}) · Preis ${Math.round((20+12*(t.beaten+1)+(next.rank===1?100:0))*ludusHallMult())} Gold</p><button id="luChallenge" class="menuMain">Herausfordern</button>`:'<p><b>Du bist Meister dieser Woche!</b> Nächste Woche gibt es eine neue Rangliste.</p>'}</div>`;
  } else if(ludusTab==='lib'){
    const books=ludusBooks();
    main=`<div class="luPanel"><h2>Bücherei</h2><p class="luHint">Jeden Tag liegen drei Bücher aus, passend zur Art deines Kämpfers.</p>
      ${books.length?books.map(id=>`<div class="luItem"><span>${ABILITIES[id].icon} ${ABILITIES[id].name} — ${ABILITIES[id].text||''}</span><button data-book="${id}" ${ludus.gold<ludusBookPrice(id)?'disabled':''}>${ludusBookPrice(id)} Gold</button></div>`).join(''):'<p><i>Heute gibt es nichts Neues für ihn.</i></p>'}</div>`;
  } else if(ludusTab==='gear'){
    const inv=f.inventory||[], sel=inv[ludusSel];
    main=`<div class="luPanel"><h2>Ausrüstung</h2>${inv.length?inv.map(itemRow).join(''):'<p><i>Du besitzt noch nichts. Die Schmiede verkauft Ausrüstung.</i></p>'}
      ${sel?`<div class="luDetail"><pre>${ludusEsc(itemDescription(sel))}</pre>
        <button data-equip="${ludusSel}">${wornIdx.has(ludusSel)?'Ablegen':'Anlegen'}</button>
        <button data-reroll="${ludusSel}" title="Aussehen neu würfeln">🎲 ${ludusRerollPrice(sel)}</button>
        <button data-sell="${ludusSel}" title="Verkaufen">💰 ${ludusSellPrice(sel)}</button></div>`:(inv.length?'<p class="luHint">Wähle ein Stück, um es zu lesen, an- oder abzulegen.</p>':'')}</div>`;
  } else if(ludusTab==='smith'){
    const stock=ludusStock();
    main=`<div class="luPanel"><h2>Schmiede</h2><p>Heute im Angebot (${LUDUS_ROOMS.forge.text[ludusRoomTier('forge')-1]}):</p>${stock.length?stock.map((it,i)=>`<div class="luItem"><span>${ludusEsc(instLabel(it))}${it.q>=1.07?'':''}</span><button data-buy="${i}" ${ludus.gold<ludusPrice(it.id)?'disabled':''}>${ludusPrice(it.id)} Gold</button></div>`).join(''):'<p><i>Die Schmiede hat heute nichts, was du führen kannst. Kaufe unter "Ausbau" mehr Sorten.</i></p>'}</div>`;
    el._stock=stock;
  }
  const tabs=ludus.over?'':`<div class="luTabs">${[['pit','Grube','pit'],['tour','Turnier','hall'],['inn','Taverne','inn'],['smith','Schmiede','forge'],['lib','Bücherei','library'],['gear','Ausrüstung'],['build','Ausbau']].filter(t=>!t[2]||ludusRoomTier(t[2])>0).map(([k,l])=>`<button data-tab="${k}" class="${ludusTab===k?'on':''}">${l}</button>`).join('')}</div>`;
  el.innerHTML=`<h1 class="bigTitle" style="font-size:30px">Ludus</h1>
    <div class="luTop"><span>Tag ${ludus.day}</span><span>💰 ${ludus.gold}</span><span>Ruhm ${ludus.fame}</span><span>Siege ${ludus.wins}</span><span>Ansehen ${ludusMeta.renown}</span></div>
    ${ludusNote?`<div class="luNote">${ludusEsc(ludusNote)}</div>`:''}
    <div class="luCols">${left}<div>${tabs}${main}${ludus.log.length?`<div class="luLog">${ludus.log.map(ludusEsc).join('<br>')}</div>`:''}</div></div>
    <div class="arBtns"><button id="luMenu" class="menuMain">Hauptmenü</button><button id="luReset" class="menuMain">Neu beginnen</button></div>`;
  const stockNow=el._stock;
  el.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{ ludusTab=b.dataset.tab; ludusNote=''; if(ludusTab!=='gear') ludusSel=-1; ludusRender(); if(ludusTab==='pit') ludusScoutOpponent(); }));
  el.querySelectorAll('[data-pick]').forEach(b=>b.addEventListener('click',()=>{ ludusSel=+b.dataset.pick; if(ludusTab!=='gear'){ ludusTab='gear'; } ludusRender(); }));
  el.querySelectorAll('[data-equip]').forEach(b=>b.addEventListener('click',()=>{ const i=+b.dataset.equip, inst=f.inventory[i];
    if(wornIdx.has(i)){ inst.off=true; delete inst.pin; } else { delete inst.off; inst.pin=Date.now(); }       // the piece put on last takes its place first; a second one-handed blade fills the other hand
    ludusSave(); ludusRender(); }));
  el.querySelectorAll('[data-sell]').forEach(b=>b.addEventListener('click',()=>{ const i=+b.dataset.sell, inst=f.inventory[i]; ludus.gold+=ludusSellPrice(inst); f.inventory.splice(i,1); ludusSel=-1; ludusNote=''; ludusSave(); ludusRender(); }));
  el.querySelectorAll('[data-reroll]').forEach(b=>b.addEventListener('click',()=>{ const i=+b.dataset.reroll, inst=f.inventory[i], pr=ludusRerollPrice(inst); if(ludus.gold<pr) return; ludus.gold-=pr; inst.s=Math.floor(Math.random()*1e9); ludusSave(); ludusRender(); }));
  el.querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>{ const it=stockNow[+b.dataset.buy], pr=ludusPrice(it.id); if(ludus.gold<pr) return; ludus.gold-=pr; f.inventory.push({ id:it.id, q:it.q, s:it.s }); ludusNote=''; ludusSave(); ludusRender(); }));
  const on=(id,fn)=>{ const b=document.getElementById(id); if(b) b.addEventListener('click',fn); };
  on('luFight',ludusFight); on('luChallenge',ludusChallenge);
  el.querySelectorAll('[data-room]').forEach(b=>b.addEventListener('click',()=>ludusBuyRoom(b.dataset.room)));
  el.querySelectorAll('[data-cat]').forEach(b=>b.addEventListener('click',()=>{ const [t,f2]=b.dataset.cat.split(':'); ludusBuyCat(t,f2); }));
  el.querySelectorAll('[data-book]').forEach(b=>b.addEventListener('click',()=>ludusBuyBook(b.dataset.book))); on('luNew',()=>{ ludus=null; ludusSave(); ludusRender(); });
  on('luChicken',()=>{ if(ludus.gold<ludusChickenCost()) return; ludus.gold-=ludusChickenCost(); ludusHeal(ludusChickenHeal()); ludusSave(); ludusRender(); });
  on('luSleep',()=>{ ludusHeal(ludusSleepHeal()); ludus.day++; ludus.opp=null; ludusLog('geschlafen'); ludusSave(); ludusRender(); });
  on('luMenu',()=>showScreen('menu'));
  on('luReset',e=>{ const b=e.currentTarget; if(b.dataset.sure){ ludus=null; ludusNote=''; ludusSave(); ludusRender(); return; } b.dataset.sure='1'; b.textContent=Tr('Sicher? Nochmal klicken'); setTimeout(()=>{ if(b.isConnected){ delete b.dataset.sure; b.textContent=Tr('Neu beginnen'); } },3000); });
  if(ludusTab==='pit' && !ludus.over && !ludus.opp) ludusScoutOpponent();
  ludusHubSync();
}
// the 3D courtyard shows the meta progress; the fighter of the run stands at the hearth, a click on a building opens its tab
let hubState='idle';
function ludusHubTiers(){ const t={}; Object.keys(LUDUS_ROOMS).forEach(id=>{ t[id]=ludusRoomTier(id); }); return t; }
function ludusHubSync(){
  if(hubState==='failed') return;
  if(hubState==='idle'){
    hubState='loading';
    Hub3D.init(document.getElementById('hubHost')).then(()=>{ hubState='ready'; Hub3D.onPick=ludusHubPick; Hub3D.start(); ludusHubSync(); }).catch(e=>{ console.error(e); hubState='failed'; document.getElementById('hubHost').hidden=true; });
    return;
  }
  if(hubState!=='ready') return;
  let fighter=null; if(ludus&&!ludus.over){ const c=ludusCreature(), extra=typeof equipLook==='function'?equipLook(c):undefined; fighter={ kind:ludus.fighter.kind, extra:extra||undefined, sig:JSON.stringify(extra||null) }; }
  Hub3D.sync(ludusHubTiers(),fighter); Hub3D.start(); Hub3D.resize();
}
function ludusHubPick(id){
  const tab={ inn:'inn', pit:'pit', forge:'smith', library:'lib', hall:'tour', fighter:'gear' }[id]; if(!tab) return;
  const room=id==='fighter'?'inn':id;
  if(!ludus){ return; }
  if(id!=='fighter' && ludusRoomTier(room)===0){ ludusTab='build'; } else ludusTab=tab;
  ludusNote=''; ludusSel=-1; ludusRender(); if(ludusTab==='pit') ludusScoutOpponent();
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
  return `<h1 class="bigTitle">Ludus</h1><div class="subtitle">Führe einen Kämpfer durch die Gruben, von Stufe 1 ohne Ausrüstung bis zum Ruhm.</div>
    <div class="luPanel"><h2>Neuer Kämpfer</h2><p>Kreatur <select id="luKind">${arenaOpts(kinds,kinds[0]&&kinds[0][0])}</select> Name <input id="luName" maxlength="16" placeholder="zufällig"></p>
      <p><label><input type="checkbox" id="luUnlock" ${ludusMeta.unlockAll?'checked':''}> Debug: alle Kreaturen freigeschaltet</label><br><label><input type="checkbox" id="luRooms" ${ludusMeta.roomsAll?'checked':''}> Debug: alle Räume voll ausgebaut</label></p>
      <p class="luHint">Rekord: ${ludusMeta.bestWins} Siege, ${ludusMeta.bestDays} Tage. Läufe: ${ludusMeta.runs}</p>
      <button id="luStart" class="menuMain">Beginnen</button> <button id="luMenu2" class="menuMain">Zurück</button></div>${ludusBuildHTML()}`;
}
function ludusWireStart(el){
  document.getElementById('luStart').addEventListener('click',()=>ludusNewRun(document.getElementById('luKind').value,document.getElementById('luName').value.trim()));
  document.getElementById('luMenu2').addEventListener('click',()=>showScreen('menu'));
  document.getElementById('luUnlock').addEventListener('change',e=>{ ludusMeta.unlockAll=e.target.checked; ludusSave(); ludusRender(); });
  document.getElementById('luRooms').addEventListener('change',e=>{ ludusMeta.roomsAll=e.target.checked; ludusSave(); ludusRender(); });
  el.querySelectorAll('[data-room]').forEach(b=>b.addEventListener('click',()=>ludusBuyRoom(b.dataset.room)));
  el.querySelectorAll('[data-cat]').forEach(b=>b.addEventListener('click',()=>{ const [t,f2]=b.dataset.cat.split(':'); ludusBuyCat(t,f2); }));
}
async function ludusOpen(){ await ludusLoad(); ludusNote=''; showScreen('ludus'); ludusRender(); if(ludus&&!ludus.over&&ludusTab==='pit') ludusScoutOpponent(); }
document.getElementById('menuLudus').addEventListener('click',ludusOpen);
document.getElementById('ludusContinue').addEventListener('click',ludusLeaveMatch);
