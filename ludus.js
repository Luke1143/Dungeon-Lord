// Ludus: a roguelike mode on top of the creature arena (concept: docs/ludus.md). One fighter, one run: pit matches for gold, an inn to heal, a smithy for gear.
// A match is a normal arena match (arenaBuild/arenaStart) with the fighter of the run on the dark side; fainting is survived, dying ends the run.
// Everything of a run lives in `ludus` and is saved after each step; `ludusMeta` holds what outlives a run (records, debug switch).
const LUDUS_STORE='dungeon-lord-ludus-v1';
const LUDUS_START_GOLD=40, LUDUS_CHICKEN_COST=6, LUDUS_CHICKEN_HEAL=0.4, LUDUS_SLEEP_HEAL=0.5;
const LUDUS_STARTER_KINDS=['ork','goblin','skeleton','barbarian','thief','troll'];   // what is known before the campaign has shown more (the debug switch opens everything)
const LUDUS_NAMES=['Marcus','Livia','Brutus','Cassia','Titus','Varro','Nerva','Drusa','Rufus','Sabina','Cato','Valeria','Gaius','Aurelia','Lucan','Fulvia','Decimus','Octavia','Cornelius','Silvia'];
let ludus=null, ludusMeta={ unlockAll:true, bestWins:0, bestDays:0, runs:0 };
let ludusSel=-1, ludusActive=false, ludusResolved=false, ludusResultText='', ludusTab='pit', ludusBusy=false, ludusNote='';

// ---- persistence ----
async function ludusSave(){ try{ await window.storage.set(LUDUS_STORE, JSON.stringify({ run:ludus, meta:ludusMeta }), false); }catch(e){} }
async function ludusLoad(){
  try{ const r=await window.storage.get(LUDUS_STORE,false); if(r&&r.value){ const d=JSON.parse(r.value); ludus=d.run&&!d.run.over?d.run:(d.run||null); ludusMeta=Object.assign(ludusMeta,d.meta||{}); } }catch(e){}
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
  ludusMeta.runs++; ludusTab='pit'; ludusNote='';
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
      run.opp=Object.assign(best.o,{ reward:12+6*run.fighter.level }); ludusBusy=false; ludusSave(); ludusRender(); return;
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
    ludusMeta.bestWins=Math.max(ludusMeta.bestWins,ludus.wins); ludusMeta.bestDays=Math.max(ludusMeta.bestDays,ludus.day);
  } else {
    const prev=state; state=st;
    try{ grantXp(c, won ? 18+8*o.level : 6+2*o.level); } finally { state=prev; }
    f.level=c.level; f.xp=c.xp; f.inventory=JSON.parse(JSON.stringify(c.inventory||[])); f.learned=(c.learned||[]).slice();
    f.hp=c.unconscious?1:Math.max(1,c.hp);
    if(won){
      ludus.gold+=o.reward; ludus.fame++; ludus.wins++;
      const loot=(st.looseItems||[]).filter(it=>it&&it.kind==='equipment');
      loot.forEach(it=>{ f.inventory.push(looseInst(it)); });
      head='Sieg'; text=`${f.name} gewinnt gegen ${o.name}. +${o.reward} Gold${loot.length?`, Beute: ${loot.length} Stück`:''}.`;
      ludusLog(`Sieg über ${o.name}`);
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

// ---- the town square ----
const ludusEsc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
function ludusStock(){
  const r=ludusRng('shop'+ludus.day), maxTier=Math.min(3,1+Math.floor(ludus.fame/4)), out=[];
  const ids=Object.keys(ITEMS).filter(id=>['weapon','armor','shield'].includes(ITEMS[id].type) && TIER_IDS.indexOf(ITEMS[id].tier)<=maxTier);
  ['weapon','armor','shield'].forEach(type=>{ const l=ids.filter(id=>ITEMS[id].type===type); for(let i=0;i<(type==='weapon'?3:2)&&l.length;i++) out.push(l.splice(Math.floor(r()*l.length),1)[0]); });
  return out;
}
function ludusHealPct(c,f){ return Math.round(100*Math.max(0,Math.min(c.maxHp,f.hp===undefined?c.maxHp:f.hp))/c.maxHp); }
function ludusHeal(frac){ const c=ludusCreature(), f=ludus.fighter; f.hp=Math.min(c.maxHp,(f.hp===undefined?c.maxHp:f.hp)+Math.round(c.maxHp*frac)); }
function ludusRender(){
  const el=document.getElementById('ludusBody'); if(!el) return;
  if(!ludus){ el.innerHTML=ludusStartHTML(); ludusWireStart(el); return; }
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
    main=`<div class="luPanel"><h2>Taverne</h2><p>Ein gebratenes Huhn stärkt (${LUDUS_CHICKEN_COST} Gold). Im Bett schlafen ist gratis, kostet aber einen Tag.</p>
      <button id="luChicken" ${ludus.gold<LUDUS_CHICKEN_COST?'disabled':''}>🍗 Huhn essen (${LUDUS_CHICKEN_COST} Gold, +${Math.round(LUDUS_CHICKEN_HEAL*100)} % LP)</button> <button id="luSleep">🛏️ Schlafen (+${Math.round(LUDUS_SLEEP_HEAL*100)} % LP, ein Tag)</button></div>`;
  } else if(ludusTab==='gear'){
    const inv=f.inventory||[], sel=inv[ludusSel];
    main=`<div class="luPanel"><h2>Ausrüstung</h2>${inv.length?inv.map(itemRow).join(''):'<p><i>Du besitzt noch nichts. Die Schmiede verkauft Ausrüstung.</i></p>'}
      ${sel?`<div class="luDetail"><pre>${ludusEsc(itemDescription(sel))}</pre>
        <button data-equip="${ludusSel}">${wornIdx.has(ludusSel)?'Ablegen':'Anlegen'}</button>
        <button data-reroll="${ludusSel}" title="Aussehen neu würfeln">🎲 ${ludusRerollPrice(sel)}</button>
        <button data-sell="${ludusSel}" title="Verkaufen">💰 ${ludusSellPrice(sel)}</button></div>`:(inv.length?'<p class="luHint">Wähle ein Stück, um es zu lesen, an- oder abzulegen.</p>':'')}</div>`;
  } else if(ludusTab==='smith'){
    const stock=ludusStock();
    main=`<div class="luPanel"><h2>Schmiede</h2><p>Heute im Angebot:</p>${stock.map((id,i)=>`<div class="luItem"><span>${ludusEsc(ITEMS[id].label)}</span><button data-buy="${i}" ${ludus.gold<ludusPrice(id)?'disabled':''}>${ludusPrice(id)} Gold</button></div>`).join('')}</div>`;
    el._stock=stock;
  }
  const tabs=ludus.over?'':`<div class="luTabs">${[['pit','Grube'],['inn','Taverne'],['smith','Schmiede'],['gear','Ausrüstung']].map(([k,l])=>`<button data-tab="${k}" class="${ludusTab===k?'on':''}">${l}</button>`).join('')}</div>`;
  el.innerHTML=`<h1 class="bigTitle" style="font-size:30px">Ludus</h1>
    <div class="luTop"><span>Tag ${ludus.day}</span><span>💰 ${ludus.gold}</span><span>Ruhm ${ludus.fame}</span><span>Siege ${ludus.wins}</span></div>
    ${ludusNote?`<div class="luNote">${ludusEsc(ludusNote)}</div>`:''}
    <div class="luCols">${left}<div>${tabs}${main}${ludus.log.length?`<div class="luLog">${ludus.log.map(ludusEsc).join('<br>')}</div>`:''}</div></div>
    <div class="arBtns"><button id="luMenu" class="menuMain">Hauptmenü</button><button id="luReset" class="menuMain">Neu beginnen</button></div>`;
  const stockNow=el._stock;
  el.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{ ludusTab=b.dataset.tab; ludusNote=''; if(ludusTab!=='gear') ludusSel=-1; ludusRender(); if(ludusTab==='pit') ludusScoutOpponent(); }));
  el.querySelectorAll('[data-pick]').forEach(b=>b.addEventListener('click',()=>{ ludusSel=+b.dataset.pick; if(ludusTab!=='gear'){ ludusTab='gear'; } ludusRender(); }));
  el.querySelectorAll('[data-equip]').forEach(b=>b.addEventListener('click',()=>{ const i=+b.dataset.equip, inst=f.inventory[i]; if(wornIdx.has(i)) inst.off=true; else { const sl=slotsOfItem(inst); f.inventory.forEach((o,j)=>{ if(j!==i && slotsOfItem(o).some(s=>sl.includes(s))) o.off=true; }); delete inst.off; } ludusSave(); ludusRender(); }));
  el.querySelectorAll('[data-sell]').forEach(b=>b.addEventListener('click',()=>{ const i=+b.dataset.sell, inst=f.inventory[i]; ludus.gold+=ludusSellPrice(inst); f.inventory.splice(i,1); ludusSel=-1; ludusNote=''; ludusSave(); ludusRender(); }));
  el.querySelectorAll('[data-reroll]').forEach(b=>b.addEventListener('click',()=>{ const i=+b.dataset.reroll, inst=f.inventory[i], pr=ludusRerollPrice(inst); if(ludus.gold<pr) return; ludus.gold-=pr; inst.s=Math.floor(Math.random()*1e9); ludusSave(); ludusRender(); }));
  el.querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>{ const id=stockNow[+b.dataset.buy], pr=ludusPrice(id); if(ludus.gold<pr) return; ludus.gold-=pr; f.inventory.push({ id, q:1, s:Math.floor(Math.random()*1e9) }); ludusNote=''; ludusSave(); ludusRender(); }));
  const on=(id,fn)=>{ const b=document.getElementById(id); if(b) b.addEventListener('click',fn); };
  on('luFight',ludusFight); on('luNew',()=>{ ludus=null; ludusSave(); ludusRender(); });
  on('luChicken',()=>{ if(ludus.gold<LUDUS_CHICKEN_COST) return; ludus.gold-=LUDUS_CHICKEN_COST; ludusHeal(LUDUS_CHICKEN_HEAL); ludusSave(); ludusRender(); });
  on('luSleep',()=>{ ludusHeal(LUDUS_SLEEP_HEAL); ludus.day++; ludus.opp=null; ludusLog('geschlafen'); ludusSave(); ludusRender(); });
  on('luMenu',()=>showScreen('menu'));
  on('luReset',e=>{ const b=e.currentTarget; if(b.dataset.sure){ ludus=null; ludusNote=''; ludusSave(); ludusRender(); return; } b.dataset.sure='1'; b.textContent=Tr('Sicher? Nochmal klicken'); setTimeout(()=>{ if(b.isConnected){ delete b.dataset.sure; b.textContent=Tr('Neu beginnen'); } },3000); });
  if(ludusTab==='pit' && !ludus.over && !ludus.opp) ludusScoutOpponent();
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
      <p><label><input type="checkbox" id="luUnlock" ${ludusMeta.unlockAll?'checked':''}> Debug: alles freigeschaltet</label></p>
      <p class="luHint">Rekord: ${ludusMeta.bestWins} Siege, ${ludusMeta.bestDays} Tage. Läufe: ${ludusMeta.runs}</p>
      <button id="luStart" class="menuMain">Beginnen</button> <button id="luMenu2" class="menuMain">Zurück</button></div>`;
}
function ludusWireStart(el){
  document.getElementById('luStart').addEventListener('click',()=>ludusNewRun(document.getElementById('luKind').value,document.getElementById('luName').value.trim()));
  document.getElementById('luMenu2').addEventListener('click',()=>showScreen('menu'));
  document.getElementById('luUnlock').addEventListener('change',e=>{ ludusMeta.unlockAll=e.target.checked; ludusSave(); ludusRender(); });
}
async function ludusOpen(){ await ludusLoad(); ludusNote=''; showScreen('ludus'); ludusRender(); if(ludus&&!ludus.over&&ludusTab==='pit') ludusScoutOpponent(); }
document.getElementById('menuLudus').addEventListener('click',ludusOpen);
document.getElementById('ludusContinue').addEventListener('click',ludusLeaveMatch);
