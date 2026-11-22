// Ludus: a roguelike mode on top of the creature arena (concept: docs/ludus.md). A school of gladiators on a tour across the map (ludus-tour.js): the pit for experience and loot,
// the arena for gold and honour, a tournament every 30 days, an inn to heal, a smithy for gear.
// A match is a normal arena match (arenaBuild/arenaStart) with the fighter of the run on the dark side; fainting is survived, dying ends the run.
// Everything of a run lives in `ludus` and is saved after each step; `ludusMeta` holds what outlives a run (records, debug switches; the meta progression is still to be designed). Rooms, standing and the world's characters belong to the run.
const LUDUS_STORE='dungeon-lord-ludus-v1';
const LUDUS_START_GOLD=40;
const LUDUS_STARTER_KINDS=['ork','goblin','skeleton','barbarian','thief','troll'];   // what is known before the campaign has shown more (the debug switch opens everything)
const LUDUS_NAMES=['Marcus','Livia','Brutus','Cassia','Titus','Varro','Nerva','Drusa','Rufus','Sabina','Cato','Valeria','Gaius','Aurelia','Lucan','Fulvia','Decimus','Octavia','Cornelius','Silvia'];
let ludus=null, ludusMeta={ unlockAll:false, roomsAll:false, bestWins:0, bestDays:0, runs:0, v:2 };
// ---- the Ludus as a place: rooms that are built during a run (paid with standing, which wins bring) and that grow in tiers ----
// cost[i] = standing to reach tier i+1. The forge's tier is the quality of what it sells; its categories (weapon kinds, armour weights, shields) are bought separately.
const LUDUS_ROOMS={
  inn:    { label:'Taverne',      cost:[0,15,45],       text:['Huhn und Bett, ein Platz im Team','besseres Essen, das Bett heilt mehr, zwei Plätze im Team','Festmahl, das Bett heilt fast alles, drei Plätze im Team'] },
  pit:    { label:'Grube',        cost:[0,30,90],      text:['Übungskämpfe','ein Viertel mehr Erfahrung aus der Grube','die Hälfte mehr Erfahrung aus der Grube'] },
  forge:  { label:'Schmiede',     cost:[0,25,70,150], text:['nur grobe Ware aus schlechten Teilen','gewöhnliche Ware','feine Ware aus guten Teilen','epische Ware aus den besten Teilen'] },
  library:{ label:'Bücherei',     cost:[20,50,110],     text:['einfache Fähigkeiten','mittlere Fähigkeiten','alle Fähigkeiten'] },
  hall:   { label:'Turnierhalle', cost:[40,120],        text:['Preise der Arena und des Turniers ein Viertel höher','Preise der Arena und des Turniers um die Hälfte höher'] },
  training:{ label:'Trainingsraum', cost:[20,60,130],    text:['Übungspuppen: Erfahrung ohne Verletzung (kostet Gold und einen Tag)','bessere Lehrmeister (mehr Erfahrung)','Meisterlehre (viel Erfahrung)'] }
};
const LUDUS_CATS={   // what the forge may sell: [type, family, cost]; the first of each type comes with the forge
  weapon:[['sword',0],['dagger',8],['spear',15],['mace',15],['axe',20],['hammer',30],['javelin',12],['bow',25],['crossbow',40],['wandFire',30],['wandBolt',40],['wandIce',50]],
  armor:[['lightArmor',0],['mediumArmor',20],['heavyArmor',45]],
  shield:[['buckler',10],['kite',20],['tower',40]]
};
const LUDUS_CAT_LABEL={ weapon:'Waffen', armor:'Rüstungen', shield:'Schilde' };
function ludusRoomTier(id){ if(ludusMeta.roomsAll) return LUDUS_ROOMS[id].cost.length; return (ludus&&ludus.rooms&&ludus.rooms[id])||0; }
const ludusRenown=()=>ludus?(ludus.renown||0):0;
function ludusCatOwned(type,fam){ const e=LUDUS_CATS[type].find(x=>x[0]===fam); return !!e && (ludusMeta.roomsAll || e[1]===0 && ludusRoomTier('forge')>0 || !!(ludus&&ludus.cats&&ludus.cats[type]&&ludus.cats[type][fam])); }
function ludusGainRenown(n){ if(n>0&&ludus) ludus.renown=(ludus.renown||0)+n; }
function ludusBuyRoom(id){
  const room=LUDUS_ROOMS[id], t=ludus.rooms[id]||0, cost=room.cost[t]; if(cost===undefined||ludus.renown<cost) return;
  ludus.renown-=cost; ludus.rooms[id]=t+1; ludusNote=`${room.label}: ${room.text[t]}.`; ludusSave(); ludusRender();
}
function ludusBuyCat(type,fam){
  const e=LUDUS_CATS[type].find(x=>x[0]===fam); if(!e||ludusCatOwned(type,fam)||ludus.renown<e[1]) return;
  ludus.renown-=e[1]; (ludus.cats[type]=ludus.cats[type]||{})[fam]=1; ludusSave(); ludusRender();
}
const ludusBanquetCost=()=>40+10*ludusLevel();       // gold into standing: what is left after the gear
const ludusInnTier=()=>Math.max(1,ludusRoomTier('inn'));
const ludusChickenCost=()=>[6,5,4][ludusInnTier()-1], ludusChickenHeal=()=>[0.4,0.55,0.7][ludusInnTier()-1], ludusSleepHeal=()=>[0.5,0.65,0.85][ludusInnTier()-1];
const ludusHallMult=()=>[1,1.25,1.5][ludusRoomTier('hall')]||1;       // the hall raises the prizes of the arena and the tournament
let ludusSel=-1, ludusActive=false, ludusResolved=false, ludusResultText='', ludusTab='inn', ludusBusy=false, ludusNote='';
// ---- persistence ----
async function ludusSave(){ try{ await window.storage.set(LUDUS_STORE, JSON.stringify({ run:ludus, meta:ludusMeta }), false); }catch(e){} }
async function ludusLoad(){
  try{ const r=await window.storage.get(LUDUS_STORE,false); if(r&&r.value){ const d=JSON.parse(r.value); ludus=d.run&&!d.run.over?d.run:(d.run||null); if(ludus&&!ludus.over&&ludus.mode!=='tour'){ ludus.over=true; ludus.cause='Ein Spielstand von vor der Tournee: bitte neu beginnen.'; } ludusMeta=Object.assign(ludusMeta,d.meta||{}); ['renown','rooms','cats'].forEach(k=>delete ludusMeta[k]); ludusRivalMigrate(); ludusLegacyMigrate(); ludusTeamsTidy(); if(ludus){ ludusLink(ludus); } if(ludus&&!ludus.over){ ludus.rooms=ludus.rooms||{ inn:1, pit:1 }; ludus.renown=ludus.renown||0; ludus.cats=ludus.cats||{}; if(!ludus.world) ludusPopulate(); if(ludus.event&&!ludus.event.cast) ludus.event=null; if(ludus.forced&&ludus.forced.type==='tour') ludus.forced={ type:'week' }; } } }catch(e){}
}
const ludusRng=(salt)=>seededRng(arenaHash((ludus?ludus.seed:'x')+':'+salt));
function ludusKinds(){ const all=arenaKinds(); return ludusMeta.unlockAll?all:all.filter(ludusKnownKind); }       // the starters and what the schools have learnt (ludus-legacy.js)

// ---- the team: the fighter and the mates recruited in the tavern, each with gear, wounds and gifts of their own. `ludus.fighter` is the member shown and worked on (a getter on the run) ----
function ludusLink(l){ if(!l) return l; if(!l.team){ l.team=l.fighter?[l.fighter]:[]; delete l.fighter; l.companion=null; } l.sel=Math.max(0,Math.min(l.team.length-1,l.sel|0)); l.team.forEach((m,i)=>{ if(!m.id) m.id='m'+i+Math.floor(Math.random()*1e6); if(!m.gifts) m.gifts=[]; });
  if(!l.scrolls) l.scrolls={};
  if(!l.stash){ l.stash=[]; l.bookbag=[]; const keep=ludus; ludus=l; try{ l.team.forEach(m=>{ ludusNormalizeGear(m); (m.books||[]).forEach(b=>l.bookbag.push(b)); m.books=[]; }); } finally { ludus=keep; } }
  Object.defineProperty(l,'fighter',{ configurable:true, enumerable:false, get(){ return this.team[this.sel]||this.team[0]; } }); return l; }
const ludusLevel=()=>Math.max(1,Math.round(ludus.team.reduce((a,m)=>a+m.level,0)/Math.max(1,ludus.team.length)));
const ludusTeamMax=()=>1+ludusInnTier();
const ludusSlotsFree=()=>ludusTeamMax()-ludus.team.length;
// the team shares one store of gear and books: a member carries what it wears, everything else lies in the stash
function ludusNormalizeGear(m){
  if(!m.inventory||!m.inventory.length) return;
  const c=ludusMemberCreature(m), worn=new Set(wornItems(c).map(w=>c.inventory.indexOf(w))), keep=[];
  m.inventory.forEach((x,i)=>{ delete x.off; if(worn.has(i)) keep.push(x); else ludus.stash.push(x); });
  m.inventory=keep;
}
// every piece the team owns, with who wears it (null: in the stash)
function ludusItems(){ const out=[]; ludus.team.forEach(m=>(m.inventory||[]).forEach(inst=>out.push({ inst, owner:m }))); ludus.stash.forEach(inst=>out.push({ inst, owner:null })); return out; }
function ludusGiveItem(inst,to){       // to: a member, or null for the stash; the piece put on last takes its place first, what no longer fits goes to the stash
  ludus.team.forEach(m=>{ const i=(m.inventory||[]).indexOf(inst); if(i>=0) m.inventory.splice(i,1); });
  const k=ludus.stash.indexOf(inst); if(k>=0) ludus.stash.splice(k,1);
  if(!to){ delete inst.pin; ludus.stash.push(inst); return; }
  inst.pin=Date.now(); to.inventory.push(inst); ludusNormalizeGear(to);
}
function ludusFighterGroup(f){
  f=f||ludus.fighter; const g=arenaGroup(f.kind,1,f.level); g.fighter=f; g.seed=f.seed; return g;
}
// the fighter as a creature (for pictures and numbers), not placed in any match
function ludusCreature(){
  return ludusMemberCreature(ludus.fighter);
}
function ludusMemberCreature(f){ const c=arenaMake(f.kind,0,0); arenaApplyFighter(c,f); return c; }
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
  if(ludus&&ludus.mode==='tour'&&!ludus.over) ludusRivalSync();       // a run left unfinished: its rivals are written back as they are
  ludusRivalGrow();
  const seed=String(Math.floor(Math.random()*1e9));
  ludus={ seed, mode:'tour', day:1, gold:LUDUS_START_GOLD, fame:0, wins:0, losses:0, over:false, cause:'', log:[], opp:null, options:null, rooms:{ inn:1, pit:1, forge:1 }, renown:0, cats:{}, world:[], forced:null, event:null, followup:null, giftChoice:null, lastFight:1,
    scrolls:{}, sel:0, pick:[], team:[{ id:'m0', gifts:[], kind, name:name||LUDUS_NAMES[Math.floor(Math.random()*LUDUS_NAMES.length)], level:1, xp:0, hp:undefined, inventory:[], learned:[], books:[], seed:Math.floor(Math.random()*1e9), honor:0, job:'fight' }] };
  ludusLink(ludus); ludusMapInit(); ludusLegacyStart();
  ludusMeta.runs++; ludusTab='map'; ludusNote=ludus.heirloom?`${ludus.team[0].name} trägt das Erbstück: ${ludus.heirloom}.`:'';
  ludusSave(); ludusRender();
}
function ludusLog(t){ ludus.log.unshift(`Tag ${ludus.day}: ${t}`); ludus.log=ludus.log.slice(0,8); }

// ---- the bouts: what stands in the pit against the fighter. A bout is a duel, a pack of weaker foes, or a tag-team match with an ally; sometimes gear lies in the arena. ----
// {title, variant, foes:[{kind,level,tier,seed,name}], ally, items, reward, diff, tour, rank}; its difficulty is found by a few test fights (win rate against the fighter).
// what a chance is called: easy from 65 %, fair from 35 %, hard below
const ludusDiffOf=rate=>rate>=0.65?'easy':(rate>=0.35?'fair':'hard');
const LUDUS_DIFF={ easy:{ label:'Leicht', target:0.8, mult:0.6 }, fair:{ label:'Fair', target:0.5, mult:1 }, hard:{ label:'Schwer', target:0.3, mult:1.7 } };
const SCOUT_RUNS=4, LUDUS_XP_MULT=3.5;       // the campaign's levels come slowly; a run is short, so a fight is worth three and a half times as much
// a ghost whose level was lowered starts with the experience of that level
// a gladiator of the world fights as what he is: his own level, gear, wounds and gifts (the same record as a member of the team)
function ludusOppGroup(o){ if(o.npc){ const n=ludusNpc(o.npc); if(n&&n.inventory){ const g=ludusFighterGroup(n); g.npc=n.id; return g; } } if(o.ghost) return ludusFighterGroup(o.level===o.member.level?o.member:Object.assign({},o.member,{ level:o.level, xp:xpForLevel(o.level) })); const g=arenaGroup(o.kind,1,o.level); g.tier=o.tier; g.seed=o.seed; g.name=o.name; if(o.npc) g.npc=o.npc; return g; }
const ludusFoes=o=>o.foes||[o];
const ludusVariantLabel=o=>({ swarm:'Rudel', tag:'Tag-Team', group:'Gruppe', ffa:'Jeder gegen jeden' }[o.variant]||'Duell');
// `team` (optional) stands in for the fighter's own team: the test fights of a place with a level of its own use a reference team
function ludusMatchSetup(o,salt,team){
  const foes=ludusFoes(o); team=team||(o.members?o.members.map(ludusMember).filter(Boolean):ludus.team);
  const own={ name:team[0].name, groups:team.map(m=>ludusFighterGroup(m)).concat(o.ally?[ludusOppGroup(o.ally)]:[]) };
  return { teams:o.ffa?[own].concat(ludusFfaSides(o).map(g=>({ name:g.map(k=>foes[k].name).join(' & '), groups:g.map(k=>ludusOppGroup(foes[k])) }))):[ own, { name:o.title||o.name, groups:foes.map(ludusOppGroup) } ],       // free-for-all: every foe a side of his own
    map:{ layout:o.layout||'pit', dims:'S', seed:'lud'+ludus.seed+':'+ludus.day, lava:0, water:0, crystal:0, near:1 }, items:o.items||null, pacts:ludusPacts(o), fog:true, batch:1, ludus:true, fixedMap:true, swapSides:(arenaHash('side'+ludus.seed+':'+ludus.day)&1)===1, noDeath:!!o.pit, mercy:ludus.wins+ludus.losses<3 };       // nobody dies in the pit; the first bouts of a run cannot kill the team
}
function ludusAverageTier(){
  const worn=ludus.team.reduce((a,m)=>a.concat(wornItems(ludusMemberCreature(m))),[]); if(!worn.length) return 0;
  return Math.max(0,Math.min(3,Math.round(worn.reduce((t,i)=>t+ludusTierIndex(i),0)/worn.length)));
}
function ludusBoutLabel(o){
  const f=ludusFoes(o), k=SPECIES[f[0].kind].label;
  return o.variant==='group'?`Gruppe: ${f.map(x=>x.name).join(', ')}`:o.variant==='swarm'?`Rudel: ${f.length} × ${k}`:(o.variant==='tag'?`Tag-Team mit ${o.ally.name} (${SPECIES[o.ally.kind].label}) gegen ${f.length} Gegner`:`${f[0].name} (${k})`);
}
// the arena a bout is fought in: the open pit most of the time, otherwise a natural cave or one of the shaped stages
const LUDUS_LAYOUT_ODDS=[['pit',30],['caverns',12],['choke',12],['bridge',10],['ring',10],['island',8],['pillars',10],['lanes',8]];
// noLava: the pit, where nobody may die, has no stages with lava
function ludusLayoutPick(r,noLava){ const l=LUDUS_LAYOUT_ODDS.filter(([k])=>!noLava||(k!=='bridge'&&k!=='island')); let x=r()*l.reduce((a,b)=>a+b[1],0); for(const [k,w] of l){ x-=w; if(x<=0) return k; } return 'pit'; }
const ludusLayoutLabel=l=>(ARENA_LAYOUTS.find(x=>x[0]===l)||[0,'Offene Grube'])[1];
// one candidate bout, built from the budget: `scale` makes it easier (below 1) or harder (above); `r` is a seeded random function; `ref` (a level) builds it for what the team would be worth on that level, not for the team as it is
function ludusCandidate(r,kinds,level,tier,variantRoll,scale,ref){
  const name=()=>{ let n; for(let i=0;i<6;i++){ n=LUDUS_NAMES[Math.floor(r()*LUDUS_NAMES.length)]; if(!ludus.team.some(m=>m.name===n)) break; } return n; };
  const nT=ludus.team.length, roll=variantRoll===undefined?r():variantRoll, W=ludusTeamWorth(ref)*(scale||1);
  const pool=ludusNpcPool(), used=new Set();
  const pickKind=(lo,hi)=>{ const mid=(lo+hi)/2; let l=kinds.filter(k=>creatureWorth(k)>=lo&&creatureWorth(k)<=hi); if(!l.length) l=kinds.slice().sort((a,b)=>Math.abs(Math.log(creatureWorth(a)/mid))-Math.abs(Math.log(creatureWorth(b)/mid))).slice(0,3); return creaturePickWeighted(r,l); };
  // one opponent worth about `w`: a character of the world of about that worth, else a stranger of the kind (a random fitting one) at the level that makes the worth
  const slot=(w,kind)=>{
    if(!kind){ const near=pool.filter(n=>!used.has(n.id) && Math.abs(Math.log(creatureWorthAt(n.kind,n.level)/w))<0.4); if(near.length){ const n=near[Math.floor(r()*near.length)]; used.add(n.id); return ludusNpcFoe(n); } }
    const k=kind||pickKind(w*0.4,w*1.6);
    return { kind:k, level:creatureLevelFor(k,w), tier, seed:Math.floor(r()*1e9), name:name() };
  };
  let o;
  if(nT===1 && roll>0.82 && W>=1){ const w=W/2; o={ variant:'tag', ally:slot(ludusTeamWorth(ref)), foes:[slot(w),slot(w)] }; }
  else if(roll>0.55 && creatureWorth(kinds.slice().sort((a,b)=>creatureWorth(a)-creatureWorth(b))[0])*3<=W){
    const k=pickKind(0.05,W/3), n=3+Math.floor(r()*4);
    o={ variant:'swarm', foes:Array.from({length:n},()=>slot(W/n,k)) };
  } else {
    const n=nT>1?Math.min(nT,6):1;
    o={ variant:n>1?'group':'duel', foes:Array.from({length:n},()=>slot(W/n)) };
  }
  o.kind=o.foes[0].kind; o.level=Math.max(...o.foes.map(x=>x.level)); o.name=o.foes[0].name; o.title=ludusBoutLabel(o); o.layout=ludusLayoutPick(r);
  if(r()<0.1){ const ids=Object.keys(ITEMS).filter(id=>['weapon','armor','shield'].includes(ITEMS[id].type)&&ITEMS[id].tier==='plain'&&ludusCatOwned(ITEMS[id].type,ITEMS[id].family)); if(ids.length) o.items=[ids[Math.floor(r()*ids.length)]]; }
  return o;
}
// the pit's offer for today's line-up: two bouts (three with the upgraded pit), easier and fair (and harder). No gold here: experience, and the best piece of the beaten foes' gear
function ludusScoutOpponent(){
  const sig=ludusPickSig()+'|'+ludus.day; if(ludus.options&&ludus.optionsSig!==sig) ludus.options=null;
  if(ludusBusy||ludus.options||ludus.over||ludus.forced) return;
  ludusBusy=true; ludusRender();
  const picks=ludusPicks(), ids=picks.map(m=>m.id);
  // one candidate per timer tick, so the page stays alive and can paint between the test fights
  // the candidates: groups of gladiators who came to the pit today, as many as the line-up (fewer when not enough came), of every strength
  const goers=ludusGoers('pit').sort((a,b)=>ludusGladWorth(a)-ludusGladWorth(b)), n=Math.min(ids.length,goers.length), cands=[], r=ludusRng('opp'+ludus.day+':'+ids.join(','));
  for(let i=0;n>0&&i+n<=goers.length;i++){ const foes=goers.slice(i,i+n).map(ludusNpcFoe); cands.push({ pit:true, members:ids, variant:foes.length>1?'group':'duel', foes, kind:foes[0].kind, level:Math.max(...foes.map(f=>f.level)), name:foes[0].name, layout:ludusLayoutPick(r,true) }); }
  cands.forEach(o=>{ o.title=ludusBoutLabel(o); });
  const run=ludus, rated=[];
  const step=i=>{
    if(ludus!==run){ ludusBusy=false; return; }
    if(i>=cands.length){
      const used=new Set(), opts=[];
      if(!cands.length){ run.options=[]; run.optionsSig=sig; ludusBusy=false; ludusSave(); ludusRender(); return; }
      // up to three bouts: the one nearest to an easy, a fair and a hard chance; each is named by its own chance (as in the arena), the best chance first
      [0.75,0.5,0.25].forEach(t=>{ let best=null; rated.forEach(x=>{ if(used.has(x.o)) return; const sc=Math.abs(x.rate-t); if(!best||sc<best.sc) best={ sc, x }; }); if(best){ used.add(best.x.o); opts.push(Object.assign(best.x.o,{ diff:ludusDiffOf(best.x.rate), est:+best.x.rate.toFixed(2), reward:0 })); } });
      opts.sort((p,q)=>q.est-p.est);
      run.options=opts; run.optionsSig=sig; ludusBusy=false; ludusSave(); ludusRender(); return;
    }
    const o=cands[i]; let rate=0.5;
    try{ const res=arenaSimulate(ludusMatchSetup(o,'scout'),SCOUT_RUNS,null); rate=res.wins[0]/SCOUT_RUNS; }catch(e){ console.error(e); }
    rated.push({ o, rate:Math.max(0,Math.min(1,rate)) });
    const el=document.getElementById('luScout'); if(el) el.textContent=`${i+1}/${cands.length}`;
    setTimeout(()=>step(i+1),20);
  };
  setTimeout(()=>step(0),30);
}
// The searches below are generators: they `yield` after every few test fights, so that the page can stay alive (ludusStepper), or are simply run to the end (ludusDrain).
let ludusSims=0;       // test fights done by the searches, for a progress display
const ludusDrain=gen=>{ let r; do r=gen.next(); while(!r.done); return r.value; };
// runs a search in small steps; `done(result)` is called at the end (with null when it failed), `abort()` stops it, `onStep` sees every step
function ludusStepper(gen,done,abort,onStep){
  const step=()=>{
    if(abort&&abort()) return;
    let r; try{ r=gen.next(); }catch(e){ console.error(e); done(null); return; }
    if(r.done) done(r.value); else { if(onStep) onStep(); setTimeout(step,0); }
  };
  setTimeout(step,0);
}
// a bout is made fitting: the opponents' level is searched (a few test fights) until the win rate of the team (or of `team`, a reference team) comes near `target`.
// Normally the first foe alone is moved (the others stay as they are); with `all` every foe keeps its share (a pack or a group grows together); `cap` is the highest level it may reach
function* ludusFitLevelG(o,target,team,all,runs,cap){
  const RUNS=runs||12, base=o.foes.map(f=>f.level), l0=base[0];
  const set=l=>{ o.foes.forEach((f,i)=>{ if(all||i===0) f.level=Math.max(1,Math.min(40,Math.round(base[i]*l/l0))); }); o.level=Math.max(...o.foes.map(x=>x.level)); };
  // test fights come in batches of five and stop early when the rate is clearly away from the target
  const seen={};
  function* rate(l,tag){
    set(l); let w=0, n=0;
    try{ while(n<RUNS){ const k=Math.min(5,RUNS-n); w+=arenaSimulate(ludusMatchSetup(o,tag,team),k,null).wins[0]; n+=k; ludusSims+=k; yield n; const p=w/n; if(n>=10 && Math.abs(p-target)>0.08+2*Math.sqrt(Math.max(0.02,p*(1-p))/n)) break; } }catch(e){ return seen[l]=target; }
    return seen[l]=w/n;
  }
  let lo=1, hi=cap||40, l=Math.min(l0,hi), best=l, bestErr=9, last=target;
  for(let i=0;i<7;i++){
    const rt=last=yield* rate(l,'fit'+i), err=Math.abs(rt-target); if(err<bestErr){ bestErr=err; best=l; } if(err<=0.05) break;
    if(rt>target) lo=Math.max(lo,l+1); else hi=Math.min(hi,l-1);
    if(lo>hi) break; l=Math.round(Math.sqrt(lo*hi));
  }
  // a second look at the pick with fresh fights: too hard for what was asked, one level down
  for(let k=0;k<8 && best>1;k++){ const rt=last=yield* rate(best,'chk'+k); if(rt>=target-0.1) break; best--; }
  set(best); o.fitRate=seen[best]!==undefined?seen[best]:last; o.fitFloor=best<=1; return o;       // how it ended: the last win rate, and whether even the lowest level was too hard
}
const ludusFitLevel=(...a)=>ludusDrain(ludusFitLevelG(...a));
// a quick, single bout of about the wanted difficulty (for forced fights, which cannot wait for the pit's scouting)
function ludusQuickBout(diff,rewardMult){
  const r=seededRng(arenaHash(ludus.seed+':q'+ludus.day)), tier=ludusAverageTier(), kinds=ludusFoeKinds(), level=ludusLevel(); let best=null;
  for(let i=0;i<4;i++){ const o=ludusCandidate(r,kinds,level,tier,0); o.items=null; let rate=0.5; try{ rate=arenaSimulate(ludusMatchSetup(o,'quick'),2,null).wins[0]/2; }catch(e){} const sc=Math.abs(rate-LUDUS_DIFF[diff].target)+r()*0.05; if(!best||sc<best.sc) best={ sc, o }; }
  return Object.assign(best.o,{ diff, reward:Math.round((12+6*ludusLevel())*LUDUS_DIFF[diff].mult*(rewardMult||1)) });
}

// ---- the days: a day ends with a bout of the school or with 'end the day'. Then everybody who did not fight does his task, the school pays board and lodging,
// the world's gladiators have their evening (ludus-life.js), and the next morning the calendar speaks (tournament, debt) ----
// rest: heals (the inn's bed); train: experience for gold (the training room); work: a wage, no risk. Who was set to fight but had no bout rests.
const ludusTrainCost=m=>10+4*m.level, ludusTrainXp=m=>Math.round((8+4*m.level)*LUDUS_XP_MULT*[0,1,1.4,1.8][ludusRoomTier('training')]);
function ludusDoJob(m,job,travel){
  const col=ludusRegionNode().col;
  if(job==='train'&&ludusRoomTier('training')>0&&ludus.gold>=ludusTrainCost(m)){
    const c=ludusMemberCreature(m), xp=ludusTrainXp(m), before=c.level; ludus.gold-=ludusTrainCost(m);
    withState(null,()=>grantXp(c,xp)); m.level=c.level; m.xp=c.xp; m.energy=Math.max(10,(m.energy===undefined?100:m.energy)-15);
    return `${m.name} trainiert: +${xp} Erfahrung${c.level>before?`, Stufe ${c.level}`:''} (−${ludusTrainCost(m)} Gold)`;
  }
  if(job==='work'){ const w=ludusWage(col); ludus.gold+=w; m.energy=Math.max(10,(m.energy===undefined?100:m.energy)-10); return `${m.name} arbeitet: +${w} Gold`; }
  ludusHeal(ludusSleepHeal()*(travel?0.5:1),m); m.energy=Math.min(100,(m.energy===undefined?100:m.energy)+(travel?40:100));
  return job==='train'?`${m.name} ruht (für das Training fehlt ${ludusRoomTier('training')?'das Gold':'der Trainingsraum'})`:'';
}
function ludusAdvanceDay(fought,travel){
  const ids=new Set((fought||[]).map(m=>m.id||m)), lines=[];
  ludus.team.forEach(m=>{ if(ids.has(m.id)) return; const t=ludusDoJob(m,travel?'rest':(ludusJob(m)==='fight'?'rest':ludusJob(m)),travel); if(t) lines.push(t); });
  if(!ludus.over&&ludus.team.length) lines.push(ludusPayUpkeep());
  ludusDayNote=lines.join(' · ');
  if(!ludus.over) ludusLifeEvening();       // the gladiators who did not meet the player fight each other
  ludusRivalHunt();       // a rival elsewhere comes nearer
  ludusChallengesExpire();       // an appointed duel nobody came to: the own gladiator is a coward
  ludus.day++; ludus.opp=null; ludus.options=null; ludus.event=null;
  if(ludus.over) return;
  ludusCalendar();
  ludusLifePlan();
  if(!ludus.forced) ludusMaybeEvent();
}
let ludusDayNote='';
// the day ends without a bout of the school
function ludusEndDay(){ if(!ludus||ludus.over||ludus.forced||ludus.event||ludus.giftChoice||ludus.verdict) return; ludusLog('Tag ohne Kampf'); ludusAdvanceDay([]); ludusNote=ludusDayNote; ludusSave(); ludusRender(); }
function ludusForcedBout(){
  const fo=ludus.forced;
  if(fo.type==='tourney') return ludusTourneyBout();
  if(!fo.opp) fo.opp=fo.type==='rent'?ludusRentBout():ludusQuickBout('fair',0.5);
  return fo.opp;
}

// a foe as a creature (for pictures): a gladiator of the world as he is, a stranger with the gear of his group
function ludusFoeCreature(f){ const n=f.npc&&ludusNpc(f.npc); if(n&&n.inventory) return ludusMemberCreature(n); const c=arenaMake(f.kind,0,0); c.level=f.level; c.inventory=arenaGear(c,ludusOppGroup(f),0); return c; }
// ---- the match ----
function ludusFight(o){
  if(!ludus||ludus.over) return;
  o=o||ludus.opp; if(!o) return;
  if(!o.members) o.members=[ludus.fighter.id];
  ludus.opp=o; ludusActive=true; ludusResolved=false; ludusResultText='';
  const setup=ludusMatchSetup(o,'');
  arenaStart(setup);
  document.getElementById('levelSubtitle').textContent=Tr(o.tourney?'Ludus — Turnierkampf':(o.pit?'Ludus — Grubenkampf':'Ludus — Arenakampf'));
  const nem=ludusFoes(o).map(f=>f.npc&&ludusNpc(f.npc)).filter(n=>n&&ludusRivalOf(n)); if(nem.length) ludusRivalStage(nem[0]);       // a rival steps into the sand
}
// called once when the match is over (or left): applies the outcome to the run; returns the headline
function ludusResolve(st){
  if(ludusResolved) return ludusResultText.split('\n')[0]||'';
  ludusResolved=true;
  const o=ludus.opp, won=st.arena.winner===0, foes=ludusFoes(o), ids=o.members||[ludus.fighter.id], team=ludus.team.filter(m=>ids.includes(m.id));
  const pairs=team.map(m=>{ const c=st.arena.roster[0].find(x=>x.memberId===m.id); const dead=!c||c.removed||c.dead||!st.creatures.includes(c); return { m, c, dead }; });
  const alive=pairs.filter(p=>!p.dead), fallen=pairs.filter(p=>p.dead);
  let head, text;
  if(ludus.forced&&ludus.forced.type!=='tourney') ludus.forced=null;
  ludus.lastFight=ludus.day;
  if(o.rent) team.forEach(m=>{ m.debtPaidDay=ludus.day; });       // the debt bout settles the debt and pays the day's board of whoever fought it
  if(o.challenge){ const c=(ludus.challenges||[]).find(x=>x.id===o.challenge); if(c) c.done=true; }       // the duel was fought: nobody is a coward
  ludusNpcOutcomes(st,won,o);
  const revenge=foes.map(f=>ludusRevenge(f.npc&&ludusNpc(f.npc))).filter(Boolean);       // a rival who fell in the fight
  ludusLifeBusy(foes.map(f=>f.npc));
  fallen.forEach(p=>{ const n=p.m.npc&&ludusNpc(p.m.npc); if(n){ n.status='dead'; n.diedDay=ludus.day; n.last={ t:'died', d:ludus.day }; } });
  ludus.team=ludus.team.filter(m=>!fallen.some(p=>p.m===m)); ludus.sel=Math.max(0,Math.min(ludus.sel,ludus.team.length-1));
  if(fallen.length){ const killer=ludusKillerOf(st); ludusRivalMark(killer,fallen.map(p=>p.m),'kill'); fallen.forEach(p=>ludusHallAdd(p.m,'kill',killer&&killer.name)); }       // whoever killed one of yours becomes your rival; the fallen go to the hall
  const fell=fallen.map(p=>p.m.name).join(', ');
  if(!ludus.team.length){
    ludus.over=true; ludus.cause=`Gefallen gegen ${o.title||o.name}`; head='Gefallen'; ludusRivalSync(); ludusLegacyEnd(team); text=`${fell} ${team.length>1?'sind':'ist'} in der Arena gestorben. Die Schule ist leer: der Lauf endet nach ${ludus.wins} Siegen und ${ludus.day} Tagen.`;
    ludusMeta.bestWins=Math.max(ludusMeta.bestWins,ludus.wins); ludusMeta.bestDays=Math.max(ludusMeta.bestDays,ludus.day);
    ludusSaveGhost(team,o.title||o.name,false);
  } else {
    const lead=alive[0]||null, who=alive.length>1?'Dein Team':(lead?lead.m.name:'Niemand'), lv=o.level, xp=Math.round(LUDUS_XP_MULT*(won ? 18+8*lv+6*(foes.length-1) : 6+2*lv)*(o.pit?[1,1,1.25,1.5][ludusRoomTier('pit')]||1:1));
    if(!o.rent) withState(st,()=>alive.forEach(p=>grantXp(p.c,xp)));       // a bout for the rent brings nothing, not even experience
    alive.forEach(({m,c})=>{
      m.level=c.level; m.xp=c.xp; m.inventory=JSON.parse(JSON.stringify(c.inventory||[])); m.learned=(c.learned||[]).slice(); ludusNormalizeGear(m);
      m.hp=c.asleep?Math.max(1,Math.round(c.hp)):(c.unconscious?1:Math.max(1,c.hp));
      m.energy=Math.max(10,(Number.isFinite(c.energy)?c.energy:(m.energy===undefined?100:m.energy))-12);
    });
    if(won){
      foes.forEach(f=>ludusLearnKind(f.kind));       // a kind beaten is a kind known
      ludus.wins++; head='Sieg';
      if(o.pit){
        // the pit pays in gear: the best piece the beaten foes carried
        const pool=(st.arena.roster[1]||[]).reduce((a,c)=>a.concat((c.inventory||[]).filter(i=>instDef(i)&&['weapon','armor','shield'].includes(instDef(i).type)).map(i=>({ i, c }))),[]);
        pool.sort((a,b)=>ludusPrice(b.i.id)-ludusPrice(a.i.id)||((b.i.q||1)-(a.i.q||1)));
        const best=pool[0]?JSON.parse(JSON.stringify(pool[0].i)):null; if(best){ delete best.off; delete best.pin; ludus.stash.push(best); const n=pool[0].c.npcId&&ludusNpc(pool[0].c.npcId); if(n&&n.inventory){ const k=n.inventory.findIndex(x=>x.id===best.id&&x.s===best.s); if(k>=0) n.inventory.splice(k,1); } }
        text=`${who} gewinnt gegen ${o.title||o.name}. +${xp} Erfahrung${best?`, Beute: ${instLabel(best)}`:''}.`;
      } else if(o.rent){
        text=`${who} gewinnt gegen ${o.title||o.name}. Damit ist die Schuld abgegolten, mehr gibt es nicht.`;
      } else {
        const gold=Math.round((o.reward||0)*(lead?giftMul(lead.c,'gold'):1)); ludus.gold+=gold; ludus.fame++; if(lead) lead.m.fame=ludusFame(lead.m)+1+(o.challenge?1:0);
        // the verdict: every beaten gladiator of the world who still lives waits for the player's word (see the verdict panel)
        const living=[]; (st.arena.roster||[]).forEach((side,ti)=>{ if(ti===0) return; side.forEach(c=>{ const n=c.npcId&&ludusNpc(c.npcId); if(n&&n.status==='active'&&!c.removed&&!c.dead&&st.creatures.includes(c)) living.push(n.id); }); });
        if(living.length&&lead) ludus.verdict={ w:lead.m.id, list:living };
        const est=o.est===undefined?0.5:o.est; ludusGainRenown(o.tourney?8:(est<0.4?12:(est<0.65?8:5)));
        const loot=(st.looseItems||[]).filter(it=>it&&it.kind==='equipment'&&!it.arenaFloor); loot.forEach(it=>{ ludus.stash.push(looseInst(it)); });
        text=`${who} gewinnt gegen ${o.title||o.name}. +${gold} Gold${loot.length?`, Beute: ${loot.length} Stück`:''}. · +${xp} Erfahrung`;
        if(o.arena&&!o.tourney){ const h=ludusHonor(o,true,team); text+=` +${h} Ehre.`; }
        if(Math.random()<(o.tourney?0.4:0.15)){ const sid=ludusGiveScroll(); text+=` Beute: Schriftrolle ${ludusScrollName(sid)}.`; }
      }
      ludusLog(`Sieg über ${o.title||o.name}`);
    } else {
      const c=lead&&lead.c, ret=!!st.arena.retreated; ludus.losses++; head=ret?'Rückzug':(c&&c.surrendered?'Aufgegeben':(c&&c.unconscious?'Bewusstlos':'Verloren'));
      text=lead?`${who} ${ret?'zieht sich zurück und überlebt':(c.surrendered?'gibt auf und überlebt':(c.unconscious?'sinkt bewusstlos zu Boden, überlebt aber':'verliert nach Zeit'))}.`:'Niemand kommt zurück.';
      if(lead&&!o.rent) text+=` · +${xp} Erfahrung`;
      if(o.arena&&!o.rent&&!o.tourney) ludusHonor(o,false,team);
      ludusLog(`Niederlage gegen ${o.title||o.name}`);
      if(o.arena&&!o.rent&&!st.arena.mercy){
        const wi=st.arena.winner, ws=(st.arena.roster[wi]||[]).filter(c=>c.npcId&&!c.removed&&!c.dead&&!c.unconscious&&st.creatures.includes(c)).map(c=>ludusNpc(c.npcId)).filter(n=>n&&n.status==='active').sort((a,b)=>b.level-a.level), w=ws[0];
        if(w) alive.forEach(({m})=>{ const t=ludusVerdict(w,m,ludusAiExecutes(w,m),ludus.map.region); text+=' · '+t; });
        if(!ludus.team.length){ ludus.over=true; ludus.cause=`Hingerichtet von ${w?w.name:''}`; ludusRivalSync(); ludusLegacyEnd(team); ludusMeta.bestWins=Math.max(ludusMeta.bestWins,ludus.wins); ludusMeta.bestDays=Math.max(ludusMeta.bestDays,ludus.day); ludusSaveGhost(team,o.title||o.name,false); }
      }
    }
    { const pt=ludusPactsAfter(o,st,alive[0]&&alive[0].m); if(pt) text+=' · '+pt; }
    if(fell) text+=` ${fell} ${fallen.length>1?'sind':'ist'} gefallen.`;
    if(revenge.length) text+=' · '+revenge.join(' · ');
    if(ludus.over){}
    else if(o.tourney&&ludus.tourney){
      const r0=ludus.tourney.round, tr=(ludusTourneyResult(o,won)||'').trim(); if(tr) text+=' · '+tr;
      if(!ludus.tourney||ludus.tourney.round!==r0) ludusAdvanceDay(team);       // the round is over: tomorrow the next one
      else ludus.forced={ type:'tourney' };                                     // another own gladiator fights today
    } else ludusAdvanceDay(team);
  }
  if(ludusDayNote&&!ludus.over) text+=' · '+ludusDayNote; ludusDayNote='';
  ludusResultText=head+'\n'+text; ludusSave();
  return head;
}
// the round of the tournament is fought out without the player (none of the own gladiators has a bout left today)
function ludusTourneyAdvance(){
  if(!ludus.tourney||ludusTourneyNext()) return;
  const t=(ludusTourneyCloseRound()||'').trim()||'Die Runde ist ausgefochten.'; ludusAdvanceDay([]); ludusNote=t+(ludusDayNote?' · '+ludusDayNote:''); ludusSave(); ludusRender();
}
function ludusLeaveMatch(){
  if(!ludusResolved){ if(state.arena&&state.arena.deathmatch&&!state.arena.over) return; ludusResolve(state); }       // a bout to the death cannot be left half-fought (the retreat scroll is the way out)
  ludusActive=false; arenaSpell=null; uiTab('info');
  document.body.classList.remove('arenaMode','ludusMode'); debugNoFog=false; possessed=null; fpRestoreOnLeave();
  document.getElementById('arenaResult').hidden=true; document.getElementById('ludusContinue').hidden=true; const ns=document.getElementById('rivalStage'); if(ns) ns.remove();
  state=makeDefaultState(); ludusNote=ludusResultText.replace('\n',' — '); ludusTab=ludus.over?'start':ludusTab; showScreen('ludus'); ludusRender();
}

const LUDUS_CAST=['Ferox','Magnus','Niger','Longus','Crassus','Felix','Fortis','Gracilis','Pius','Celer','Durus','Albus','Saevus','Brevis','Audax','Calvus','Lupus','Ursus','Corvus','Taurus','Vulpes','Rex'];       // bynames of the gladiators
function ludusTavernHTML(){
  const g=ludusTavernGuests(), head=`<p class="luHint">Team: ${ludus.team.length} von ${ludusTeamMax()} Plätzen. Wer anheuert, hat keine Tag-Team-Kämpfe mit geliehenen Mitstreitern mehr, dafür kämpft das ganze Team gegen mehrere Gegner.</p>`;
  if(!g.length) return head;
  return head+`<h3>Gäste</h3>${g.map(n=>{ const pr=ludusRecruitPrice(n), can=ludusSlotsFree()>0&&(n.bond||0)>-2; return `<div class="luItem"><span>${ludusEsc(n.name)} — ${SPECIES[n.kind].label}, Stufe ${ludusMateLevel(n)}${ludusNpcStory(n)?' · '+ludusEsc(ludusNpcStory(n)):''}</span>${can?`<button data-recruit="${n.id}" ${ludus.gold<pr?'disabled':''}>Anheuern · ${pr} Gold</button>`:''}</div>`; }).join('')}`;
}
const ludusCastHTML=cast=>cast.length?`<div class="luCast">${cast.map(s=>`<div>${ludusEsc(ludusCastLine(s))}</div>`).join('')}</div>`:'';
// ---- scrolls: the spells of the main game (the god hand of the arena) as one-time things. They are bought in the library, found as loot and given by events; in a bout the
// spell panel shows the ones you own, and a cast uses one up.
const LUDUS_SCROLLS={ retreat:{ price:50 }, berserk:{ price:35 }, impcall:{ price:25 }, heal:{ price:30 }, revive:{ price:60 }, curse:{ price:25 }, haste:{ price:25 }, fireball:{ price:40 }, bolt:{ price:50 }, paralyze:{ price:40 } };
const ludusScrollName=id=>{ const s=ARENA_SPELLS.find(x=>x.id===id); return s?`${s.icon} ${s.name}`:id; };
const ludusScrollCount=()=>Object.values(ludus.scrolls||{}).reduce((a,b)=>a+b,0);
function ludusGiveScroll(id){ id=id||Object.keys(LUDUS_SCROLLS)[Math.floor(Math.random()*Object.keys(LUDUS_SCROLLS).length)]; ludus.scrolls[id]=(ludus.scrolls[id]||0)+1; return id; }
function ludusUseScroll(id){ if(!ludus.scrolls[id]) return; ludus.scrolls[id]--; if(ludus.scrolls[id]<=0){ delete ludus.scrolls[id]; if(arenaSpell===id){ arenaSpell=null; } } ludusSave(); }
function ludusScrollsHTML(){
  const ids=Object.keys(ludus.scrolls||{}); if(!ids.length) return '<div class="arInfo">Keine Schriftrollen (die Bücherei verkauft welche).</div>';
  return `<div class="arSpells">${ids.map(id=>`<button data-spell="${id}" class="${arenaSpell===id?'on':''}" title="${ludusScrollName(id)}">${ludusScrollName(id)} ×${ludus.scrolls[id]}</button>`).join('')}</div>`;
}
const ludusScrollOffer=()=>{ const r=ludusRng('scr'+ludus.day), ids=Object.keys(LUDUS_SCROLLS), out=[]; while(out.length<2) { const id=ids[Math.floor(r()*ids.length)]; if(!out.includes(id)) out.push(id); } return out; };
function ludusBuyScroll(id){ const pr=LUDUS_SCROLLS[id].price; if(!pr||ludus.gold<pr) return; ludus.gold-=pr; ludusGiveScroll(id); ludusNote=`Du kaufst die Schriftrolle "${ludusScrollName(id)}". Sie wirkt einmal im Kampf.`; ludusSave(); ludusRender(); }
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
  ludus.gold-=pr; ludus.bookbag.push(id); ludusNote=`Du kaufst das Buch "${ABILITIES[id].name}". Es liegt im Inventar und will gelernt werden.`; ludusSave(); ludusRender();
}
// a book in the bag is read: the fighter learns the ability (the rules of the main game decide whether there is room)
function ludusLearnBook(i,mi){
  const f=ludus.team[mi===undefined?ludus.sel:mi], id=ludus.bookbag[i]; if(!f||!id) return;
  const c=ludusMemberCreature(f), ok=withState(null,()=>learnAbility(c,id));
  if(!ok){ ludusNote='Das Buch verrät ihm nichts Neues oder er hat keinen Platz dafür.'; ludusRender(); return; }
  f.learned=(c.learned||[]).slice(); ludus.bookbag.splice(i,1); ludusNote=`${f.name} lernt "${ABILITIES[id].name}".`; ludusSave(); ludusRender();
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
// the character sheet: every number of the selected member and what its abilities and gifts do
function ludusSheetHTML(m){
  const c=ludusMemberCreature(m), pct=v=>Math.round(v*100), w=weaponInstOf(c), tk=takenVs(c), spec=strikeSpec(c);
  const row=(k,v,tip)=>`<div class="luRow"${tip?` title="${ludusEsc(tip)}"`:''}><span>${k}</span><b>${v}</b></div>`;
  const abil=knownAbilities(c).filter(id=>ABILITIES[id]);
  const stats=[
    row('Leben',`${Math.round(c.hp)} / ${c.maxHp}`), row('Stärke',statStrength(c),'Grundschaden eines Treffers vor der Rüstung des Gegners'),
    row('Ausweichen',statDex(c)+' %','Chance, einem Treffer ganz zu entgehen'), row('Glück',statLuck(c)+' %','Chance auf doppelten Schaden, und auf halben beim Verteidigen'),
    row('Tempo','× '+statTempo(c).toFixed(2),'wie schnell Schritte, Schläge und Arbeit gehen'), row('Ausdauer',STAMINA_MAX+' (Erholung '+(STAMINA_REGEN*giftMul(c,'staminaRegen')).toFixed(1)+')','Schläge, Fähigkeiten und Flucht kosten Ausdauer'),
    row('Waffe',w?ludusEsc(instLabel(w)):'keine (natürlicher Angriff)'), row('Schadensart',profileText(attackProfile(c))||'–'), row('Reichweite',spec.reach+' Felder'),
    row('Kampfstil',STANCES[stanceOf(c)].label,STANCES[stanceOf(c)].text)
  ].join('');
  const defs=DMG_KINDS.map((k,i)=>row(DMG_LABEL[k],Math.round(defenseVs(c,k))+' <small>(Schaden × '+tk[i].toFixed(2)+')</small>')).join('');
  const ab=abil.length?abil.map(id=>`<div class="luAb"><b>${ABILITIES[id].icon} ${ABILITIES[id].name}</b> <small>Abklingzeit ${ABILITIES[id].cooldown||'–'}</small><br>${ABILITY_DESC[id]||ABILITIES[id].text||''}</div>`).join(''):'<p class="luHint">Noch keine Fähigkeiten. In der Bücherei gibt es welche, die Stufe schaltet weitere frei.</p>';
  const gf=(m.gifts||[]).length?(m.gifts||[]).map(g=>`<div class="luAb"><b>${ludusEsc(giftTitle(g))}</b>${giftLines(g).map(l=>`<div class="${l.role==='bane'?'luBane':'luBoon'}"><span>${l.role==='bane'?'▼':'▲'}</span> <span>${ludusEsc(l.text)}</span></div>`).join('')}</div>`).join(''):'<p class="luHint">Gaben gibt es nach einem Turniersieg.</p>';
  return `<div class="luPanel"><h2>${ludusEsc(m.name)} — Werte</h2><div class="luSheet"><div><h3>Kampfwerte</h3>${stats}<h3>Verteidigung</h3>${defs}</div><div><h3>Fähigkeiten und Zauber</h3>${ab}<h3>Gaben</h3>${gf}</div></div></div>`;
}
// the slots a member can fill, with what sits in them
function ludusSlotsHTML(m){
  const c=ludusMemberCreature(m), s=wornSlots(c), two=s.rh&&s.rh===s.lh;
  const slot=(label,inst)=>{ const k=inst?ludusItems().findIndex(e=>e.inst===inst):-1; return `<div class="luSlot2${inst?' full':''}" ${inst?`data-item="${k}" title="${ludusEsc(instLabel(inst))}"`:''}><img ${inst?`src="${itemIconURL(inst,40)}"`:'src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="'}><small>${label}</small></div>`; };
  return `<div class="luSlots">${slot(two?'Beide Hände':'Waffe',s.rh)}${two?'':slot('Nebenhand',s.lh)}${slot('Rüstung',s.body)}</div>`;
}
function ludusHealPct(c,f){ return Math.round(100*Math.max(0,Math.min(c.maxHp,f.hp===undefined?c.maxHp:f.hp))/c.maxHp); }
function ludusHeal(frac,m){ m=m||ludus.fighter; const c=ludusMemberCreature(m); m.hp=Math.min(c.maxHp,(m.hp===undefined?c.maxHp:m.hp)+Math.round(c.maxHp*frac)); }
const ludusHealAll=frac=>ludus.team.forEach(m=>ludusHeal(frac,m));
// every building has its tab; a tab of a room that is not bought shows the empty plot and the one thing to do there: build
const LUDUS_TABS=[['map','Karte',null],['tour','Rangliste',null],['arena','Arena',null],['pit','Grube','pit'],['inn','Taverne','inn'],['train','Trainingsraum','training'],['smith','Schmiede','forge'],['lib','Bücherei','library'],['gear','Inventar',null],['sheet','Werte',null]];
const ludusRoomOfTab=tab=>(LUDUS_TABS.find(t=>t[0]===tab)||[])[2]||null;
function ludusRoomBox(id){
  const r=LUDUS_ROOMS[id], t=ludusRoomTier(id), max=r.cost.length; if(t>=max) return t?`<p class="luHint">${r.label}: voll ausgebaut.</p>`:'';
  const cost=r.cost[t];
  return `<div class="luBuild"><p><b>${t?'Ausbau':'Bauplatz'}:</b> ${r.text[t]}</p><button data-room="${id}" class="menuMain" ${ludusRenown()<cost?'disabled':''}>${t?'Ausbauen':'Bauen'} · ${cost} Ansehen</button></div>`;
}
function ludusCatsHTML(){
  return Object.keys(LUDUS_CATS).map(type=>`<div class="luCatRow"><b>${LUDUS_CAT_LABEL[type]}:</b> ${LUDUS_CATS[type].map(([fam,cost])=>{ const have=ludusCatOwned(type,fam), lab=ITEMS[fam+'_plain']?ITEMS[fam+'_plain'].baseLabel:fam; return have?`<span class="luCat have">${lab}</span>`:`<button data-cat="${type}:${fam}" ${ludusRenown()<cost?'disabled':''}>${lab} · ${cost}</button>`; }).join(' ')}</div>`).join('');
}
function ludusRender(){
  const el=document.getElementById('ludusBody'); if(!el) return;
  const live=!!ludus&&!ludus.over;
  const tabsAll=live?LUDUS_TABS:[['start',ludus&&ludus.over?'Der Lauf':'Neue Schule',null]];
  if(!tabsAll.some(t=>t[0]===ludusTab)) ludusTab=live?'inn':'start';
  const roomId=ludusRoomOfTab(ludusTab)||'inn', tier=ludusRoomTier(roomId), room=LUDUS_ROOMS[roomId];
  let f=null, c=null, wornIdx=new Set(), left='';
  if(live){
    f=ludus.fighter; c=ludusCreature();
    const pct=ludusHealPct(c,f), nextXp=xpForLevel(f.level+1), curXp=xpForLevel(f.level), xpPct=Math.max(0,Math.min(100,Math.round(100*((f.xp||0)-curXp)/Math.max(1,nextXp-curXp))));
    wornIdx=new Set(wornItems(c).map(w=>c.inventory.indexOf(w)));
    const abil=knownAbilities(c).filter(id=>ABILITIES[id]);
    const jobOpts=m=>LUDUS_JOBS.map(([k,l])=>`<option value="${k}"${ludusJob(m)===k?' selected':''}${k==='train'&&!ludusRoomTier('training')?' disabled':''}>${l}</option>`).join('');
    const strip=`<div class="luTeam">${ludus.team.map((m,i)=>{ const mc=ludusMemberCreature(m); return `<span class="luMem"><button data-member="${i}" class="${i===ludus.sel?'on':''}">${ludusEsc(m.name)}<small>${ludusHealPct(mc,m)} %</small></button><select data-job="${m.id}" title="Was ${ludusEsc(m.name)} heute tut">${jobOpts(m)}</select></span>`; }).join('')}${Array.from({length:Math.max(0,ludusSlotsFree())},()=>'<span class="luSlot" title="Freier Platz: in der Taverne kann man jemanden anheuern">+</span>').join('')}</div>`;
    left=`<div class="luCard">${strip}<canvas id="luPrev" width="140" height="140"></canvas><h2>${ludusEsc(f.name)}</h2><div>${SPECIES[f.kind].label} · Stufe ${f.level} · Ruhm ${ludusFame(f)}${f.execs?` · ${f.execs} hingerichtet`:''}</div>${ludus.team.length>1?`<button data-dismiss="${ludus.sel}" class="luSmall">Entlassen</button>`:''}<div class="luStance">Kampfstil: <b>${STANCES[stanceOf(c)].label}</b></div>${(f.gifts||[]).map(g=>`<div class="luGiftMini r${g.rarity}" title="${ludusEsc(giftLines(g).map(l=>(l.role==='bane'?'▼ ':'▲ ')+Tr(l.text)).join('\n'))}">${ludusEsc(giftTitle(g))}</div>`).join('')}
      <div class="luBar"><i class="hp" style="width:${pct}%"></i><b>${Math.round(c.hp)}/${c.maxHp} LP</b></div><div class="luBar"><i class="xp" style="width:${xpPct}%"></i><b>${f.xp||0}/${nextXp} EP</b></div><div class="luBar"><i class="rest" style="width:${Math.round(f.energy===undefined?100:f.energy)}%"></i><b>Ausgeschlafen ${Math.round(f.energy===undefined?100:f.energy)} %</b></div>
      ${abil.length?`<div class="luAbil">${abil.map(id=>ABILITIES[id].icon+' '+ABILITIES[id].name).join(' · ')}</div>`:''}
      ${ludusSlotsHTML(f)}${ludusEveningHTML()}<button id="luEndDay" class="menuMain" ${ludus.forced||ludus.event||ludus.giftChoice||ludus.verdict?'disabled':''} title="Der Tag vergeht ohne Kampf: jeder tut seine Aufgabe">Tag beenden</button></div>`;
  }
  const itemRow=(inst,i)=>`<div class="luItem${wornIdx.has(i)?' worn':''}${ludusSel===i?' sel':''}" data-pick="${i}"><span>${ludusEsc(instLabel(inst))}${wornIdx.has(i)?' ✓':''}</span></div>`;
  let main='', override='';
  if(live && ludus.verdict){
    const v=ludus.verdict, w=ludusMember(v.w)||ludus.fighter;
    override=`<div class="luPanel luForced"><h2>Das Urteil</h2><p>Die Menge wartet auf dein Zeichen. ${ludusEsc(w.name)} hat gewonnen; wer noch lebt, liegt im Sand. Hinrichten bringt Ruhm (2 und die Hälfte des Ruhms des Verlierers); Verschonen bringt Lösegeld aus seinem Beutel und seine Dankbarkeit. Wer viele hinrichtet, wird gefürchtet, und hat selbst viel zu verlieren.</p>
      ${v.list.map(id=>{ const n=ludusNpc(id); if(!n) return ''; const pay=ludusRansom(n,ludus.map.region); return `<div class="luItem"><span><b>${ludusEsc(n.name)}</b> — ${SPECIES[n.kind].label}, Stufe ${n.level} · Ruhm ${ludusFame(n)}${n.execs?` · ${n.execs} hingerichtet`:''}</span><span><button data-verdict="${id}:spare">Verschonen · ${pay?pay+' Gold Lösegeld':'kein Gold, große Dankbarkeit'}</button> ${ludusSpared(ludus.team[0]||{ id:"" },n)?`<span class="luHint">Abkommen mit ${ludusEsc(ludusTeamName(n))}: keine Hinrichtung</span>`:`<button data-verdict="${id}:exec">Hinrichten · +${ludusExecGain(n)} Ruhm</button>`}</span></div>`; }).join('')}</div>`;
  } else if(live && ludus.giftChoice){
    override=`<div class="luPanel luGifts"><h2>Eine Gabe</h2><p>Der Sieg in der Turnierrunde wird belohnt. Wähle eine Gabe, sie bleibt für den ganzen Lauf.</p><div class="luOpts">${ludus.giftChoice.map((g,i)=>`<div class="luOption luGift r${g.rarity}"><div><b>${ludusEsc(giftTitle(g))}</b>${g.wild?' <span class="luTrait">[Wildkarte]</span>':''}<br><i>${Tr(GIFT_RARITY[g.rarity])}</i>${giftLines(g).map(l=>`<div class="${l.role==='bane'?'luBane':'luBoon'}"><span>${l.role==='bane'?'▼':'▲'}</span> <span>${ludusEsc(l.text)}</span></div>`).join('')}</div>${ludus.team.length>1?ludus.team.map((m,mi)=>`<button data-gift="${i}:${mi}" class="menuMain">Für ${ludusEsc(m.name)}</button>`).join(' '):`<button data-gift="${i}:0" class="menuMain">Wählen</button>`}</div>`).join('')}</div></div>`;
  } else if(live && ludus.forced){
    const fo=ludus.forced;
    if(fo.type==='tourney'&&ludus.tourney){
      const o=ludusForcedBout(), t=ludus.tourney, rn=ludusTourneyRoundName(t.slots.length), m=o&&ludusMember(o.members[0]);
      override=`<div class="luPanel luForced"><h2>Turnier von ${ludusEsc(ludusRegionNode().name)}: ${rn}</h2><p>Alle Kämpfer der Region müssen antreten. Turnierkämpfe folgen den Regeln der Arena: aufgeben geht, sterben auch. Eine Runde pro Tag; wer nicht kämpft, erholt sich.</p>${ludusTourneyHTML()}
        ${o?`<div class="luOpp"><canvas id="luForcedPrev" width="110" height="110"></canvas><div><b>${ludusEsc(m?m.name:'')}</b> gegen <b>${ludusEsc(o.foeTitle||o.title)}</b><br>Stufe ${o.level}<br>Preis: ${o.reward} Gold</div></div><button id="luForcedGo" class="menuMain">Antreten</button>`
          :`<p>Keiner deiner Kämpfer hat heute noch einen Kampf.</p><button id="luTourneyGo" class="menuMain">Die Runde ausfechten lassen</button>`}</div>`;
    } else { const o=ludusForcedBout();
    override=`<div class="luPanel luForced"><h2>Pflichtkampf: ${fo.type==='rent'?'Die Schuld':(fo.type==='event'?'Der Hinterhalt':'Der Kampf')}</h2><p>${fo.type==='rent'?`Gestern Abend konnte die Schule Kost und Logis nicht bezahlen. Der Wirt schickt einen deiner Kämpfer in die Arena: Er kämpft die Schuld ab, ohne jeden Lohn; dafür ist er heute auch Kost und Logis frei. Es tritt an: <b>${ludusEsc(ludus.fighter.name)}</b> (oben wählen).`:(fo.type==='event'?'Dem kommst du nicht aus.':'')}</p>
      <div class="luOpp"><canvas id="luForcedPrev" width="110" height="110"></canvas><div><b>${ludusEsc(o.title||o.name)}</b><br>${ludusVariantLabel(o)} · Stufe ${o.level}${o.rent?'':`<br>Preis: ${o.reward} Gold`}</div></div><button id="luForcedGo" class="menuMain">Antreten</button></div>`; }
  } else if(live && ludus.event){
    const ev=ludus.event, def=ludusEventDef(ev.id), opts=ludusEventOptions(def);
    override=`<div class="luPanel luEvent"><h2>${def.title}</h2><p>${ludusEsc(def.text(ev))}</p>${ludusCastHTML(ev.cast)}${opts.map((o,i)=>`<button data-event="${i}" class="menuMain" ${o.when&&!o.when(ev)?'disabled':''}>${o.trait?'<span class="luTrait">['+SPECIES[ludus.fighter.kind].label+']</span> ':''}${ludusEsc(typeof o.label==='function'?o.label(ev):o.label)}</button>`).join(' ')}</div>`;
  }
  if(live && ludus.followup && !ludus.giftChoice){ const fu=ludus.followup; override=`<div class="luPanel luEvent"><h2>${fu.title}</h2><p>${ludusEsc(fu.text)}</p><button id="luFollowGo" class="menuMain">Weiter</button></div>`; }
  ludusEventShown=!!(override && live && !ludus.giftChoice && !ludus.verdict && (ludus.followup || (ludus.event && !ludus.forced)));
  if(!override&&live&&ludusPicked){ const pc=ludusPickHTML(); if(pc) override=pc; }
  if(override){ main=override; }
  else if(ludusTab==='start'){
    main=(ludus&&ludus.over?`<div class="luPanel"><h2>Der Lauf ist zu Ende</h2><p>${ludusEsc(ludus.cause)}</p><p>Siege: ${ludus.wins} · Tage: ${ludus.day} · Ruhm: ${ludus.fame}</p><p>Rekord: ${ludusMeta.bestWins} Siege, ${ludusMeta.bestDays} Tage.</p>${ludusRivalsHTML()}</div>`:'')+ludusStartHTML();
  } else if(tier===0){
    main=`<div class="luPanel"><h2>${room.label}: Bauplatz</h2><p>Hier steht noch nichts. Wer hier baut, bekommt: ${room.text[0]}.</p>${ludusRoomBox(roomId)}</div>`;
  } else if(!live && ludusTab!=='gear'){
    main=`<div class="luPanel"><h2>${room.label} (Stufe ${tier}/${room.cost.length})</h2><p>${room.text[tier-1]}.</p>${roomId==='forge'?`<h3>Sortiment der Schmiede</h3>${ludusCatsHTML()}`:''}${ludusRoomBox(roomId)}</div>`;
  } else if(ludusTab==='pit'){
    const opts=ludus.options&&ludus.optionsSig===ludusPickSig()+'|'+ludus.day?ludus.options:null;
    main=`<div class="luPanel"><h2>Grube</h2><p class="luHint">Übungskämpfe, jeden Tag: Hier stirbt niemand, und es gibt kein Gold, nur Erfahrung und das beste Stück Ausrüstung der Besiegten. Gegner sind die Gladiatoren der Region, die heute in die Grube gekommen sind. Es treten alle an, die heute kämpfen: ${ludusPicks().length?ludusPicks().map(m=>ludusEsc(m.name)).join(', '):'niemand (stelle oben jemanden auf Kämpft)'}.</p>`+(!ludusPicks().length?'':(opts&&!opts.length?'<p><i>Heute ist niemand in die Grube gekommen.</i></p>':''))+(!ludusPicks().length?'':opts?`<div class="luOpts">${opts.map((o,i)=>`<div class="luOption"><div class="luDiff d-${o.diff}">${LUDUS_DIFF[o.diff].label}</div><canvas class="luOptPrev" data-opt="${i}" width="100" height="100"></canvas><div><b>${ludusEsc(o.title)}</b><br>${ludusVariantLabel(o)} · Stufe ${o.level}${o.layout&&o.layout!=='pit'?' · Arena: '+ludusLayoutLabel(o.layout):''}<br>Aussichten: ${Math.round(o.est*100)} %</div><button data-fight="${i}" class="menuMain">Kämpfen</button></div>`).join('')}</div>`
      : (ludusBusy?'<p>Der Grubenmeister sucht Gegner … <span id="luScout"></span></p>':'<p>Kein Gegner in Sicht.</p>'))+`<p class="luHint">Ein Kampf beendet den Tag; die anderen tun ihre Aufgabe. Eine ausgebaute Grube gibt mehr Erfahrung.</p>${ludusRoomBox('pit')}</div>`;
  } else if(ludusTab==='arena'){
    main=ludusArenaHTML();
  } else if(ludusTab==='inn'){
    main=`<div class="luPanel"><h2>Taverne</h2><p>Ein gebratenes Huhn stärkt sofort (${ludusChickenCost()} Gold). Wer ruht, schläft hier und heilt über Nacht ${Math.round(ludusSleepHeal()*100)} % seines Lebens.</p>
      <button id="luChicken" ${ludus.gold<ludusChickenCost()?'disabled':''}>🍗 Huhn essen (${ludusChickenCost()} Gold, +${Math.round(ludusChickenHeal()*100)} % LP)</button> <button id="luBanquet" ${ludus.gold<ludusBanquetCost()?'disabled':''} title="Gold wird zu Ansehen">🍷 Bankett geben (${ludusBanquetCost()} Gold, +3 Ansehen)</button> ${ludusTavernHTML()}${ludusRoomBox('inn')}</div>`;
  } else if(ludusTab==='train'){
    main=`<div class="luPanel"><h2>Trainingsraum</h2><p>Wer auf <b>Trainiert</b> steht, übt hier am Ende des Tages: Erfahrung ohne Risiko, gegen Gold. Ein besserer Trainingsraum gibt mehr Erfahrung.</p>${ludus.team.map(m=>`<div class="luItem"><span>${ludusEsc(m.name)} (Stufe ${m.level})</span><span>${ludusTrainCost(m)} Gold · +${ludusTrainXp(m)} Erfahrung</span></div>`).join('')}${ludusRoomBox('training')}</div>`;
  } else if(ludusTab==='tour'){
    main=ludusBoardHTML();
  } else if(ludusTab==='map'){
    main=ludusMapHTML();
  } else if(ludusTab==='lib'){
    const books=ludusBooks();
    main=`<div class="luPanel"><h2>Bücherei</h2><p class="luHint">Jeden Tag liegen drei Bücher aus, passend zur Art deines Kämpfers. Gekaufte Bücher liegen im Inventar und müssen gelernt werden.</p>
      ${books.length?books.map(id=>`<div class="luItem"><span>${ABILITIES[id].icon} ${ABILITIES[id].name} — ${ABILITY_DESC[id]||ABILITIES[id].text||''}</span><button data-book="${id}" ${ludus.gold<ludusBookPrice(id)?'disabled':''}>${ludusBookPrice(id)} Gold</button></div>`).join(''):'<p><i>Heute gibt es nichts Neues für ihn.</i></p>'}
      <h3>Schriftrollen</h3><p class="luHint">Die Zauber der Götterhand, jeder nur einmal verwendbar: im Kampf wählst du sie im Zauberreiter und klickst auf das Ziel.</p>${ludusScrollOffer().map(id=>`<div class="luItem"><span>${ludusScrollName(id)}</span><button data-scroll="${id}" ${ludus.gold<LUDUS_SCROLLS[id].price?'disabled':''}>${LUDUS_SCROLLS[id].price} Gold</button></div>`).join('')}${ludusScrollCount()?`<p class="luHint">Im Besitz: ${Object.keys(ludus.scrolls).map(id=>ludusScrollName(id)+' ×'+ludus.scrolls[id]).join(', ')}</p>`:''}${ludusRoomBox('library')}</div>`;
  } else if(ludusTab==='gear'){
    const all=ludusItems(), sel=all[ludusSel], books=ludus.bookbag||[], total=Math.max(24,Math.ceil((all.length+1)/6)*6);
    const cells=all.map((e,k)=>`<button class="luCell${ludusSel===k?' sel':''}" data-item="${k}" style="border-color:${itemTierColor(e.inst)}" title="${ludusEsc(instLabel(e.inst))}"><img src="${itemIconURL(e.inst,40)}">${e.owner?`<b>${ludusEsc(e.owner.name[0])}</b>`:''}</button>`).concat(Array.from({length:total-all.length},()=>'<span class="luCell empty"></span>')).join('');
    main=`<div class="luPanel"><h2>Inventar</h2><h3>Ausrüstungsplätze von ${ludusEsc(f.name)}</h3>${ludusSlotsHTML(f)}<h3>Vorrat des Teams</h3><p class="luHint">Das ganze Team teilt sich diese Fächer. Ein Buchstabe in der Ecke zeigt, wer das Stück trägt.</p><div class="luGrid">${cells}</div>
      ${sel?`<div class="luDetail"><pre>${ludusEsc(itemDescription(sel.inst))}</pre>
        ${ludus.team.filter(m=>m!==sel.owner).map(m=>`<button data-give="${ludusSel}:${ludus.team.indexOf(m)}">${sel.owner?'Geben':'Anlegen'}: ${ludusEsc(m.name)}</button>`).join(' ')}${sel.owner?`<button data-give="${ludusSel}:-1">Ablegen</button>`:''}
        <button data-reroll="${ludusSel}" title="Aussehen neu würfeln">🎲 ${ludusRerollPrice(sel.inst)}</button>
        <button data-sell="${ludusSel}" title="Verkaufen">💰 ${ludusSellPrice(sel.inst)}</button></div>`:(all.length?'<p class="luHint">Wähle ein Stück, um es zu lesen, weiterzugeben oder zu verkaufen.</p>':'<p><i>Das Team besitzt noch keine Ausrüstung. Die Schmiede verkauft welche.</i></p>')}
      ${ludusScrollCount()?`<h3>Schriftrollen</h3><p class="luHint">${Object.keys(ludus.scrolls).map(id=>ludusScrollName(id)+' ×'+ludus.scrolls[id]).join(' · ')}</p>`:''}${books.length?`<h3>Bücher</h3>${books.map((id,i)=>`<div class="luItem"><span>📖 ${ABILITIES[id].icon} ${ABILITIES[id].name} — ${ABILITY_DESC[id]||ABILITIES[id].text||''}</span><span>${ludus.team.map((m,mi)=>`<button data-learn="${i}:${mi}">Lernen: ${ludusEsc(m.name)}</button>`).join(' ')}</span></div>`).join('')}`:''}</div>`;
  } else if(ludusTab==='sheet'){
    main=ludusSheetHTML(f);
  } else if(ludusTab==='smith'){
    const stock=ludusStock();
    main=`<div class="luPanel"><h2>Schmiede</h2><p>Heute im Angebot (${LUDUS_ROOMS.forge.text[tier-1]}):</p>${stock.length?stock.map((it,i)=>`<div class="luItem"><span>${ludusEsc(instLabel(it))}</span><button data-buy="${i}" ${ludus.gold<ludusPrice(it.id)?'disabled':''}>${ludusPrice(it.id)} Gold</button></div>`).join(''):'<p><i>Die Schmiede hat heute nichts, was du führen kannst. Kaufe unten mehr Sorten.</i></p>'}<h3>Sortiment der Schmiede</h3>${ludusCatsHTML()}${ludusRoomBox('forge')}</div>`;
    el._stock=stock;
  }
  const tabs=`<div class="luTabs">${tabsAll.map(([k,l,rm])=>{ const built=!rm||ludusRoomTier(rm)>0; return `<button data-tab="${k}" class="${ludusTab===k?'on':''}${built?'':' site'}">${built?'':'🔒 '}${l}</button>`; }).join('')}</div>`;
  el.innerHTML=`<div class="luTop">${live?`<span>Ansehen ${ludusRenown()}</span><span>Tag ${ludus.day}</span><span>💰 ${ludus.gold}</span><span>Ruhm ${ludus.fame}</span><span>Siege ${ludus.wins}</span><span title="Jeden Abend Gold je Kämpfer; wer nicht zahlen kann, kämpft am nächsten Morgen in der Arena ohne Lohn">${ludus.gold<ludusRent()?'<b class="luBane">⚠</b> ':''}<span>Kost und Logis: ${ludusRent()} Gold am Tag</span></span><span>${ludus.tourney?`Turnier läuft: ${ludusTourneyRoundName(ludus.tourney.slots.length)}`:`Turnier in ${ludusTourneyIn()} Tagen`}</span>`:''}</div>
    ${ludusNote?`<div class="luNote">${ludusEsc(ludusNote)}</div>`:''}
    ${override?'':tabs}<div class="${live?'luCols':'luSolo'}">${left}<div>${main}${live&&ludus.log.length?`<div class="luLog">${ludus.log.map(ludusEsc).join('<br>')}</div>`:''}</div></div>
    <div class="arBtns"><button id="luMenu" class="menuMain">Hauptmenü</button>${live?'<button id="luReset" class="menuMain">Neu beginnen</button>':''}</div>`;
  const stockNow=el._stock;
  el.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{ ludusTab=b.dataset.tab; ludusNote=''; ludusPicked=null; if(ludusTab!=='gear') ludusSel=-1; ludusRender(); }));
  if(live){
    el.querySelectorAll('[data-item]').forEach(b=>b.addEventListener('click',()=>{ ludusSel=+b.dataset.item; ludusTab='gear'; ludusRender(); }));
    el.querySelectorAll('[data-give]').forEach(b=>b.addEventListener('click',()=>{ const [k,mi]=b.dataset.give.split(':').map(Number), e=ludusItems()[k]; if(!e) return; ludusGiveItem(e.inst,mi<0?null:ludus.team[mi]); ludusSel=-1; ludusSave(); ludusRender(); }));
    el.querySelectorAll('[data-sell]').forEach(b=>b.addEventListener('click',()=>{ const e=ludusItems()[+b.dataset.sell]; if(!e) return; ludus.gold+=ludusSellPrice(e.inst); const list=e.owner?e.owner.inventory:ludus.stash; list.splice(list.indexOf(e.inst),1); ludusSel=-1; ludusNote=''; ludusSave(); ludusRender(); }));
    el.querySelectorAll('[data-reroll]').forEach(b=>b.addEventListener('click',()=>{ const e=ludusItems()[+b.dataset.reroll]; if(!e) return; const pr=ludusRerollPrice(e.inst); if(ludus.gold<pr) return; ludus.gold-=pr; e.inst.s=Math.floor(Math.random()*1e9); ludusSave(); ludusRender(); }));
    el.querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>{ const it=stockNow[+b.dataset.buy], pr=ludusPrice(it.id); if(ludus.gold<pr) return; ludus.gold-=pr; ludus.stash.push({ id:it.id, q:it.q, s:it.s }); ludusNote=''; ludusSave(); ludusRender(); }));
    el.querySelectorAll('[data-scroll]').forEach(b=>b.addEventListener('click',()=>ludusBuyScroll(b.dataset.scroll)));
    el.querySelectorAll('[data-book]').forEach(b=>b.addEventListener('click',()=>ludusBuyBook(b.dataset.book)));
    el.querySelectorAll('[data-learn]').forEach(b=>b.addEventListener('click',()=>{ const [i,mi]=b.dataset.learn.split(':').map(Number); ludusLearnBook(i,mi); }));
  }
  const on=(id,fn)=>{ const b=document.getElementById(id); if(b) b.addEventListener('click',fn); };
  el.querySelectorAll('[data-room]').forEach(b=>b.addEventListener('click',()=>ludusBuyRoom(b.dataset.room)));
  el.querySelectorAll('[data-cat]').forEach(b=>b.addEventListener('click',()=>{ const [t,f2]=b.dataset.cat.split(':'); ludusBuyCat(t,f2); }));
  el.querySelectorAll('[data-fight]').forEach(b=>b.addEventListener('click',()=>ludusFight(ludus.options[+b.dataset.fight])));
  el.querySelectorAll('[data-pact]').forEach(b=>b.addEventListener('click',()=>{ const [i,k]=b.dataset.pact.split(':').map(Number); ludusPactOffer(i,k); }));
  el.querySelectorAll('[data-arena]').forEach(b=>b.addEventListener('click',()=>ludusArenaFight(+b.dataset.arena)));
  el.querySelectorAll('select[data-job]').forEach(b=>b.addEventListener('change',()=>ludusSetJob(b.dataset.job,b.value)));
  el.querySelectorAll('[data-member]').forEach(b=>b.addEventListener('click',()=>{ ludus.sel=+b.dataset.member; ludusSel=-1; ludusSave(); ludusRender(); }));
  el.querySelectorAll('[data-dismiss]').forEach(b=>b.addEventListener('click',()=>ludusDismiss(+b.dataset.dismiss)));
  el.querySelectorAll('[data-recruit]').forEach(b=>b.addEventListener('click',()=>ludusRecruit(b.dataset.recruit)));
  el.querySelectorAll('[data-gift]').forEach(b=>b.addEventListener('click',()=>{ const [gi,mi]=b.dataset.gift.split(':').map(Number); const g=ludus.giftChoice&&ludus.giftChoice[gi], m=ludus.team[mi||0]; if(!g||!m) return; (m.gifts=m.gifts||[]).push(g); ludus.giftChoice=null; ludusNote=Tr('Gabe angenommen: {0}').replace('{0}',giftTitle(g)); ludusSave(); ludusRender(); }));
  el.querySelectorAll('[data-event]').forEach(b=>b.addEventListener('click',()=>ludusEventChoose(+b.dataset.event)));
  on('luFollowGo',()=>{ ludus.followup=null; ludusSave(); ludusRender(); });
  on('luTourneyGo',ludusTourneyAdvance); ludusMapWire(el);
  el.querySelectorAll('[data-verdict]').forEach(b=>b.addEventListener('click',()=>{ const [id,what]=b.dataset.verdict.split(':'), v=ludus.verdict, n=ludusNpc(id), w=v&&(ludusMember(v.w)||ludus.fighter); if(!v||!n||!w||what==='exec'&&ludusSpared(w,n)) return;
    ludusNote=ludusVerdict(w,n,what==='exec',ludus.map.region); v.list=v.list.filter(x=>x!==id); if(!v.list.length) ludus.verdict=null; ludusSave(); ludusRender(); }));
  on('luPickClose',()=>{ ludusPicked=null; ludusRender(); });
  el.querySelectorAll('[data-tbuy]').forEach(b=>b.addEventListener('click',()=>ludusTradeBuy(ludusPicked,+b.dataset.tbuy)));
  el.querySelectorAll('[data-tsell]').forEach(b=>b.addEventListener('click',()=>ludusTradeSell(ludusPicked,+b.dataset.tsell)));
  on('luGift',()=>ludusTradeGift(ludusPicked));
  ludusWireAccords(el);
  on('luChallenge',()=>ludusChallenge(ludusPicked));
  on('luPickJoin',()=>{ const id=ludusPicked; ludusPicked=null; if(!ludusRecruit(id)) ludusRender(); });
  on('luEndDay',ludusEndDay); on('luForcedGo',()=>{ const o=ludusForcedBout(); if(o) ludusFight(o.members?o:Object.assign({},o,{ members:[ludus.fighter.id] })); });
  on('luChicken',()=>{ if(ludus.gold<ludusChickenCost()) return; ludus.gold-=ludusChickenCost(); ludusHeal(ludusChickenHeal()); ludus.fighter.energy=Math.min(100,(ludus.fighter.energy===undefined?100:ludus.fighter.energy)+10); ludusSave(); ludusRender(); });
  on('luBanquet',()=>{ const c=ludusBanquetCost(); if(ludus.gold<c) return; ludus.gold-=c; ludusGainRenown(3); ludusNote='Das Bankett spricht sich herum: +3 Ansehen.'; ludusSave(); ludusRender(); });
  on('luMenu',()=>showScreen('menu'));
  on('luReset',e=>{ const b=e.currentTarget; if(b.dataset.sure){ ludus=null; ludusNote=''; ludusTab='start'; ludusSave(); ludusRender(); return; } b.dataset.sure='1'; b.textContent=Tr('Sicher? Nochmal klicken'); setTimeout(()=>{ if(b.isConnected){ delete b.dataset.sure; b.textContent=Tr('Neu beginnen'); } },3000); });
  if(ludusTab==='start') ludusWireStart(el);
  if(ludusTab==='pit' && live && !override && ludusPicks().length) ludusScoutOpponent();
  if(ludusTab==='arena' && live && !override) ludusArenaScout();
  ludusHubSync(ludusTab);
}
// the 3D courtyard shows the meta progress; the camera belongs to the selected room, the fighter of the run walks in after it
let hubState='idle', ludusEventShown=false;
function ludusHubTiers(){ const t={ event:1 }; Object.keys(LUDUS_ROOMS).forEach(id=>{ t[id]=(ludus&&!ludus.over)||ludusMeta.roomsAll?ludusRoomTier(id):(id==='inn'||id==='pit'?1:0); }); return t; }
// the dungeon of the region (hub3d.js): which room each tab looks at, and who stands where (the room of what he does today)
const LUDUS_HUB_ROOM={ map:'hall', tour:'hall', arena:'arena', pit:'pit', inn:'inn', train:'training', smith:'forge', lib:'library', gear:'inn', sheet:'inn', start:'inn' };
const LUDUS_PLAN_ROOM={ pit:'pit', arena:'arena', work:'work', rest:'inn' }, LUDUS_JOB_ROOM={ fight:'hall', rest:'inn', train:'training', work:'work' };
const ludusLookSig=c=>{ const extra=typeof equipLook==='function'?equipLook(c):undefined; return { extra:extra||undefined, sig:JSON.stringify(extra||null) }; };
function ludusHubPeople(showEv){
  if(!ludus||ludus.over||!ludus.map) return [];
  const id=ludus.map.region, out=[];
  ludusRegionNpcs(id).forEach(n=>{ const room=ludusIsChamp(id,'npc',n.id)?'hall':(LUDUS_PLAN_ROOM[ludusPlanOf(n.id)]||'inn'), look=ludusLookSig(ludusFoeCreature(ludusNpcFoe(n)));
    out.push(Object.assign({ id:n.id, kind:n.kind, room, name:n.name, sel:n.id===ludusPicked },look)); });
  ludus.team.forEach((m,i)=>{ const look=ludusLookSig(ludusMemberCreature(m)), room=showEv&&i===ludus.sel?'event':(LUDUS_JOB_ROOM[ludusJob(m)]||'inn');
    out.push(Object.assign({ id:m.id, kind:m.kind, room, name:m.name, own:true, sel:i===ludus.sel },look)); });
  return out;
}
let ludusPicked=null;       // the gladiator clicked in the dungeon (his card is shown)
function ludusHubSync(tab){
  if(hubState==='failed') return;
  if(hubState==='idle'){
    hubState='loading';
    Hub3D.init(document.getElementById('hubHost')).then(()=>{ hubState='ready'; Hub3D.onPick=ludusOnPick; Hub3D.start(); ludusHubSync(tab); }).catch(e=>{ console.error(e); hubState='failed'; document.getElementById('hubHost').hidden=true; });
    return;
  }
  if(hubState!=='ready') return;
  const live=!!(ludus&&!ludus.over), showEv=live&&ludusEventShown;
  if(typeof View3D!=='undefined') Hub3D.setPost(View3D.post||0);
  Hub3D.sync(ludusHubTiers(),live&&ludus.map?'r'+ludus.seed+':'+ludus.map.region:'start',showEv?ludusEventCast():null,ludusHubPeople(showEv));
  const picked=live&&ludusPicked&&ludusHubPeople(false).find(x=>x.id===ludusPicked);       // the camera follows a clicked gladiator to his room
  Hub3D.focus(showEv?'event':(picked?picked.room:(LUDUS_HUB_ROOM[tab]||'inn'))); Hub3D.start(); Hub3D.resize();
}
// a click on a gladiator in the dungeon: an own one is selected, any other shows his card
function ludusOnPick(id){
  if(!ludus||ludus.over) return;
  const k=ludus.team.findIndex(m=>m.id===id); if(k>=0){ ludus.sel=k; ludusPicked=null; ludusSave(); ludusRender(); return; }
  if(ludusNpc(id)){ ludusPicked=id; ludusRender(); }
}
// the card of a gladiator of the region: who he is, what he does today, how he stands to the school, what one can do with him
function ludusPickHTML(){
  const n=ludusNpc(ludusPicked); if(!n||n.status!=='active'){ ludusPicked=null; return ''; }
  const id=ludus.map.region, champ=ludusIsChamp(id,'npc',n.id), rank=ludusRankOf(id,'npc',n.id), plan=ludusPlanOf(n.id), c=ludusFoeCreature(ludusNpcFoe(n));
  const gear=(n.inventory||[]).map(i=>ludusEsc(instLabel(i))).join(', ')||'keine', story=ludusNpcStory(n);
  const solo=ludusTeamSize(n)<=1, canJoin=!champ&&!n.boss&&solo&&ludusSlotsFree()>0&&(n.bond||0)>-2, price=ludusRecruitPrice(n);
  return `<div class="luPanel"><h2>${ludusEsc(n.name)}</h2><div class="luOpp"><canvas id="luPickPrev" width="110" height="110"></canvas><div>${SPECIES[n.kind].label} · Stufe ${n.level}<br>Platz ${rank}${champ?' (Champion)':''} · ${n.honor||0} Ehre<br>${n.wins||0} Siege, ${n.losses||0} Niederlagen${n.kills?`, ${n.kills} getötet`:''}<br>Ruhm ${ludusFame(n)}${n.execs?` · ${n.execs} hingerichtet`:''}<br>Leben ${ludusHurtPct(n)} %${plan?' · heute '+LUDUS_PLAN_LABEL[plan]:''}</div></div>
    ${ludusRivalText(n)?`<p class="luBane">${ludusEsc(ludusRivalText(n))}</p>`:''}${ludusRivalTraitsText(n)?`<p class="luHint">${ludusEsc(ludusRivalTraitsText(n))}</p>`:''}<p class="luHint">Ausrüstung: ${gear}${story?'<br>Zuletzt: <span>'+ludusEsc(story)+'</span>':''}<br>Zur Schule: ${LUDUS_BOND_WORD(n.bond||0)} (${n.bond||0})<br>${ludusEsc(ludusTeamLine(n))}</p>
    <h3>Handel</h3>${(n.inventory||[]).map((inst,k)=>`<div class="luItem"><span>${ludusEsc(instLabel(inst))}</span><button data-tbuy="${k}" ${ludus.gold<ludusBuyPrice(n,inst)?'disabled':''}>Kaufen · ${ludusBuyPrice(n,inst)} Gold</button></div>`).join('')||'<p class="luHint">Nichts zu verkaufen.</p>'}
    ${ludus.stash.map((inst,k)=>ludusWantsItem(n,inst)?`<div class="luItem"><span>${ludusEsc(instLabel(inst))} <small>(aus deinem Vorrat)</small></span><button data-tsell="${k}" ${ludusGold(n)<ludusSellTo(n,inst)?'disabled':''}>Verkaufen · ${ludusSellTo(n,inst)} Gold</button></div>`:'').join('')}
    ${ludusAccordHTML(n)}<h3>Herausforderung</h3>${ludusChallenged(n.id)?`<p class="luHint">${ludusEsc(n.name)} hat schon eine Verabredung in der Arena.</p>`:(ludusCanChallenge(n)&&ludus.fighter?`<p><button id="luChallenge">${ludusEsc(ludus.fighter.name)} fordert ${ludusEsc(n.name)} heraus</button></p><p class="luHint">Ein Duell morgen in der Arena, um den anderthalbfachen Preis und ${LUDUS_CHALLENGE.bonus} Ehre mehr.<br>${ludusAccepts(n,ludus.fighter)?`${ludusEsc(n.name)} wird annehmen.`:`${ludusEsc(n.name)} wird wohl ablehnen und ${LUDUS_CHALLENGE.decline} Ehre verlieren.`}<br>Wer am Tag des Duells nicht antritt, kneift: −${LUDUS_CHALLENGE.coward} Ehre.</p>`:'<p class="luHint">Den Champion fordert man im Turnier, und kurz vor dem Turnier fordert niemand.</p>')}
    <p><button id="luGift" ${ludus.gold<ludusGiftCost(n)||(n.bond||0)>=3?'disabled':''}>Geschenk · ${ludusGiftCost(n)} Gold (Beziehung +1)</button></p>
    ${champ||n.boss?'<p class="luHint">Der Champion lässt sich nicht anheuern. Man trifft ihn im Turnier.</p>':!solo?`<p class="luHint">${ludusEsc(n.name)} steht bei ${ludusEsc(ludusTeamName(n))} unter Vertrag.</p>`:`<button id="luPickJoin" class="menuMain" ${canJoin&&ludus.gold>=price?'':'disabled'}>Anheuern · ${price} Gold</button>${ludusSlotsFree()>0?'':' <span class="luHint">Kein Platz frei (die Taverne gibt mehr Plätze).</span>'}`}
    <button id="luPickClose">Schließen</button></div>`;
}
function ludusPaint(){
  if(screen!=='ludus'||!ludus) return;
  const cv=document.getElementById('luPrev'); if(cv) arenaPaintCreature(cv,ludusCreature(),0,96);
  const draw=(canvas,o,size)=>{ arenaPaintCreature(canvas,ludusFoeCreature(ludusFoes(o)[0]),1,size); };
  document.querySelectorAll('canvas.luOptPrev').forEach(cv2=>{ const o=(ludus.options||[])[+cv2.dataset.opt]; if(o) draw(cv2,o,66); });
  document.querySelectorAll('canvas.luArPrev').forEach(cv2=>{ const o=(ludus.arenaOffers&&ludus.arenaOffers.list||[])[+cv2.dataset.opt]; if(o) draw(cv2,o,66); });
  const pc=document.getElementById('luPickPrev'); if(pc&&ludusPicked){ const n=ludusNpc(ludusPicked); if(n) arenaPaintCreature(pc,ludusFoeCreature(ludusNpcFoe(n)),1,76); }
  const fc=document.getElementById('luForcedPrev'); if(fc&&ludus.forced){ const o=ludus.forced.type==='tourney'?ludusTourneyBout():ludus.forced.opp; if(o) draw(fc,o,76); }
}
setInterval(ludusPaint,200);

// ---- starting a run ----
function ludusStartHTML(){
  const kinds=ludusKinds().map(k=>[k,SPECIES[k].label]).sort((a,b)=>a[1].localeCompare(b[1],'de'));
  return `<div class="luPanel"><h2>Neue Schule</h2><p class="luHint">Gründe eine Gladiatorenschule und führe sie auf Tournee durch das Land: in der Grube üben, in der Arena um Gold und Ehre kämpfen, alle ${LUDUS_TOUR.tourneyEvery} Tage das Turnier der Region gewinnen und weiterziehen, bis du Platz 1 der Hauptstadt bist. Dein erster Kämpfer beginnt auf Stufe 1, ohne Ausrüstung.</p><p>Kreatur <select id="luKind">${arenaOpts(kinds,kinds[0]&&kinds[0][0])}</select> Name <input id="luName" maxlength="16" placeholder="zufällig"></p>
      <p><label><input type="checkbox" id="luUnlock" ${ludusMeta.unlockAll?'checked':''}> Debug: alle Kreaturen freigeschaltet</label><br><label><input type="checkbox" id="luRooms" ${ludusMeta.roomsAll?'checked':''}> Debug: alle Räume voll ausgebaut</label></p>
      <p class="luHint">Rekord: ${ludusMeta.bestWins} Siege, ${ludusMeta.bestDays} Tage. Läufe: ${ludusMeta.runs}</p>${ludusLegacyHTML()}
      <button id="luStart" class="menuMain">Beginnen</button></div>`;
}
function ludusWireStart(el){
  document.getElementById('luStart').addEventListener('click',()=>ludusNewRun(document.getElementById('luKind').value,document.getElementById('luName').value.trim()));
  document.getElementById('luUnlock').addEventListener('change',e=>{ ludusMeta.unlockAll=e.target.checked; ludusSave(); ludusRender(); });
  document.getElementById('luRooms').addEventListener('change',e=>{ ludusMeta.roomsAll=e.target.checked; ludusSave(); ludusRender(); });
  ludusWireLegacy(el||document);
}
async function ludusOpen(){ await ludusLoad(); ludusNote=''; ludusTab=(ludus&&!ludus.over)?'map':'start'; showScreen('ludus'); ludusRender(); }
document.getElementById('menuLudus').addEventListener('click',ludusOpen);
document.getElementById('ludusContinue').addEventListener('click',ludusLeaveMatch);
