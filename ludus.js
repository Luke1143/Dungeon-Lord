// Ludus: a roguelike mode on top of the creature arena (concept: docs/ludus.md). One fighter, one run: pit matches for gold, an inn to heal, a smithy for gear.
// A match is a normal arena match (arenaBuild/arenaStart) with the fighter of the run on the dark side; fainting is survived, dying ends the run.
// Everything of a run lives in `ludus` and is saved after each step; `ludusMeta` holds what outlives a run (records, debug switches; the meta progression is still to be designed). Rooms, standing and the world's characters belong to the run.
const LUDUS_STORE='dungeon-lord-ludus-v1';
const LUDUS_START_GOLD=40;
const LUDUS_STARTER_KINDS=['ork','goblin','skeleton','barbarian','thief','troll'];   // what is known before the campaign has shown more (the debug switch opens everything)
const LUDUS_NAMES=['Marcus','Livia','Brutus','Cassia','Titus','Varro','Nerva','Drusa','Rufus','Sabina','Cato','Valeria','Gaius','Aurelia','Lucan','Fulvia','Decimus','Octavia','Cornelius','Silvia'];
let ludus=null, ludusMeta={ unlockAll:true, roomsAll:false, bestWins:0, bestDays:0, runs:0 };
// ---- the Ludus as a place: rooms that are built during a run (paid with standing, which wins bring) and that grow in tiers ----
// cost[i] = standing to reach tier i+1. The forge's tier is the quality of what it sells; its categories (weapon kinds, armour weights, shields) are bought separately.
const LUDUS_ROOMS={
  inn:    { label:'Taverne',      cost:[0,15,45],       text:['Huhn und Bett, ein Platz im Team','besseres Essen, das Bett heilt mehr, zwei Plätze im Team','Festmahl, das Bett heilt fast alles, drei Plätze im Team'] },
  pit:    { label:'Grube',        cost:[0,30,90],      text:['Pit-Kämpfe mit kleinen Preisen','Preise um die Hälfte höher','Große Preise (mehr als das Doppelte)'] },
  forge:  { label:'Schmiede',     cost:[0,25,70,150], text:['nur grobe Ware aus schlechten Teilen','gewöhnliche Ware','feine Ware aus guten Teilen','epische Ware aus den besten Teilen'] },
  library:{ label:'Bücherei',     cost:[20,50,110],     text:['einfache Fähigkeiten','mittlere Fähigkeiten','alle Fähigkeiten'] },
  hall:   { label:'Turnierhalle', cost:[40,120],        text:['Wochenturnier','höhere Preise und mehr Ansehen'] },
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
const ludusPitMult=()=>[0,1,1.5,2.2][ludusRoomTier('pit')]||1, ludusHallMult=()=>[0,1,1.5][ludusRoomTier('hall')]||1;
let ludusSel=-1, ludusActive=false, ludusResolved=false, ludusResultText='', ludusTab='inn', ludusBusy=false, ludusNote='';
// ---- persistence ----
async function ludusSave(){ try{ await window.storage.set(LUDUS_STORE, JSON.stringify({ run:ludus, meta:ludusMeta }), false); }catch(e){} }
async function ludusLoad(){
  try{ const r=await window.storage.get(LUDUS_STORE,false); if(r&&r.value){ const d=JSON.parse(r.value); ludus=d.run&&!d.run.over?d.run:(d.run||null); ludusMeta=Object.assign(ludusMeta,d.meta||{}); ['renown','rooms','cats'].forEach(k=>delete ludusMeta[k]); if(ludus){ ludusLink(ludus); } if(ludus&&!ludus.over){ ludus.rooms=ludus.rooms||{ inn:1, pit:1 }; ludus.renown=ludus.renown||0; ludus.cats=ludus.cats||{}; if(!ludus.world) ludusPopulate(); if(ludus.event&&!ludus.event.cast) ludus.event=null; } } }catch(e){}
}
const ludusRng=(salt)=>seededRng(arenaHash((ludus?ludus.seed:'x')+':'+salt));
function ludusKinds(){ const all=arenaKinds(); return ludusMeta.unlockAll?all:all.filter(k=>LUDUS_STARTER_KINDS.includes(k)); }

// ---- the team: the fighter and the mates recruited in the tavern, each with gear, wounds and gifts of their own. `ludus.fighter` is the member shown and worked on (a getter on the run) ----
function ludusLink(l){ if(!l) return l; if(!l.team){ l.team=l.fighter?[l.fighter]:[]; delete l.fighter; l.companion=null; } l.sel=Math.max(0,Math.min(l.team.length-1,l.sel|0)); l.team.forEach((m,i)=>{ if(!m.id) m.id='m'+i+Math.floor(Math.random()*1e6); if(!m.gifts) m.gifts=[]; });
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
  const seed=String(Math.floor(Math.random()*1e9));
  ludus={ seed, day:1, gold:LUDUS_START_GOLD, fame:0, wins:0, losses:0, over:false, cause:'', log:[], opp:null, options:null, rooms:{ inn:1, pit:1, forge:1 }, renown:0, cats:{}, world:[], forced:null, event:null, followup:null, giftChoice:null, lastFight:1, week:ludusWeekId(),
    sel:0, team:[{ id:'m0', gifts:[], kind, name:name||LUDUS_NAMES[Math.floor(Math.random()*LUDUS_NAMES.length)], level:1, xp:0, hp:undefined, inventory:[], learned:[], books:[], seed:Math.floor(Math.random()*1e9) }] };
  ludusLink(ludus);
  ludusMeta.runs++; ludusTab='inn'; ludusNote=''; ludusPopulate();
  ludusSave(); ludusRender();
}
function ludusLog(t){ ludus.log.unshift(`Tag ${ludus.day}: ${t}`); ludus.log=ludus.log.slice(0,8); }

// ---- the bouts: what stands in the pit against the fighter. A bout is a duel, a pack of weaker foes, or a tag-team match with an ally; sometimes gear lies in the arena. ----
// {title, variant, foes:[{kind,level,tier,seed,name}], ally, items, reward, diff, tour, rank}; its difficulty is found by a few test fights (win rate against the fighter).
const LUDUS_DIFF={ easy:{ label:'Leicht', target:0.8, mult:0.6 }, fair:{ label:'Fair', target:0.5, mult:1 }, hard:{ label:'Schwer', target:0.3, mult:1.7 } };
const SCOUT_RUNS=4, LUDUS_XP_MULT=3.5;       // the campaign's levels come slowly; a run is short, so a fight is worth three and a half times as much
const LUDUS_TOUR_EVERY=5, LUDUS_IDLE_LIMIT=3;           // a tournament round every 7 days; whoever does not fight for 4 days is thrown into the pit
function ludusOppGroup(o){ const g=arenaGroup(o.kind,1,o.level); g.tier=o.tier; g.seed=o.seed; g.name=o.name; if(o.npc) g.npc=o.npc; return g; }
const ludusFoes=o=>o.foes||[o];
const ludusVariantLabel=o=>({ swarm:'Rudel', tag:'Tag-Team', group:'Gruppe' }[o.variant]||'Duell');
function ludusMatchSetup(o,salt){
  const foes=ludusFoes(o);
  return { teams:[ { name:ludus.team[0].name, groups:ludus.team.map(m=>ludusFighterGroup(m)).concat(o.ally?[ludusOppGroup(o.ally)]:[]) }, { name:o.title||o.name, groups:foes.map(ludusOppGroup) } ],
    map:{ layout:o.layout||'pit', dims:'S', seed:'lud'+ludus.seed+':'+ludus.day, lava:0, water:0, crystal:0, near:1 }, items:o.items||null, fog:true, batch:1, ludus:true, fixedMap:true, deathmatch:!!o.tour, mercy:ludus.wins+ludus.losses<3 };
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
function ludusLayoutPick(r){ let x=r()*LUDUS_LAYOUT_ODDS.reduce((a,b)=>a+b[1],0); for(const [l,w] of LUDUS_LAYOUT_ODDS){ x-=w; if(x<=0) return l; } return 'pit'; }
const ludusLayoutLabel=l=>(ARENA_LAYOUTS.find(x=>x[0]===l)||[0,'Offene Grube'])[1];
// one candidate bout, built from the budget: `scale` makes it easier (below 1) or harder (above); `r` is a seeded random function
function ludusCandidate(r,kinds,level,tier,variantRoll,scale){
  const name=()=>{ let n; for(let i=0;i<6;i++){ n=LUDUS_NAMES[Math.floor(r()*LUDUS_NAMES.length)]; if(!ludus.team.some(m=>m.name===n)) break; } return n; };
  const nT=ludus.team.length, roll=variantRoll===undefined?r():variantRoll, W=ludusTeamWorth()*(scale||1);
  const pool=ludusNpcPool(), used=new Set();
  const pickKind=(lo,hi)=>{ const mid=(lo+hi)/2; let l=kinds.filter(k=>creatureWorth(k)>=lo&&creatureWorth(k)<=hi); if(!l.length) l=kinds.slice().sort((a,b)=>Math.abs(Math.log(creatureWorth(a)/mid))-Math.abs(Math.log(creatureWorth(b)/mid))).slice(0,3); return l[Math.floor(r()*l.length)]; };
  // one opponent worth about `w`: a character of the world of about that worth, else a stranger of the kind (a random fitting one) at the level that makes the worth
  const slot=(w,kind)=>{
    if(!kind){ const near=pool.filter(n=>!used.has(n.id) && Math.abs(Math.log(creatureWorthAt(n.kind,n.level)/w))<0.4); if(near.length){ const n=near[Math.floor(r()*near.length)]; used.add(n.id); return ludusNpcFoe(n); } }
    const k=kind||pickKind(w*0.4,w*1.6);
    return { kind:k, level:creatureLevelFor(k,w), tier, seed:Math.floor(r()*1e9), name:name() };
  };
  let o;
  if(nT===1 && roll>0.82 && W>=1){ const w=W/2; o={ variant:'tag', ally:slot(ludusTeamWorth()), foes:[slot(w),slot(w)] }; }
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
function ludusBoutReward(o,diff){ const n=ludusFoes(o).length; return Math.max(3,Math.round((12+6*ludusLevel())*ludusPitMult()*LUDUS_DIFF[diff].mult*(o.variant==='swarm'?1+0.15*(n-1):(o.variant==='tag'?0.9:1))*(1+0.5*(ludus.team.length-1))*(o.items?0.9:1))); }
// the pit's offer: a duel-sized choice of two bouts (three with the upgraded pit): easier for less, fair for a fair prize, harder for a bonus
function ludusScoutOpponent(){
  if(ludusBusy||ludus.options||ludus.over) return;
  ludusBusy=true; ludusRender();
  // one candidate per timer tick, so the page stays alive and can paint between the test fights
  const r=ludusRng('opp'+ludus.day), tier=ludusAverageTier(), kinds=ludusFoeKinds(), cands=[], level=ludusLevel();
  const scales=[0.55,0.7,1,1,1,1.3,1.6,2];
  for(let i=0;i<8;i++) cands.push(ludusCandidate(r,kinds,level,tier,i<3?0:(i<5?0.6:(i<7?0.9:undefined)),scales[i]));
  const run=ludus, want=['fair','easy'].concat(ludusRoomTier('pit')>=2?['hard']:[]), rated=[];
  const step=i=>{
    if(ludus!==run){ ludusBusy=false; return; }
    if(i>=cands.length){
      const used=new Set(), opts=[];
      want.forEach(d=>{ let best=null; rated.forEach(x=>{ if(used.has(x.o)) return; const sc=Math.abs(x.rate-LUDUS_DIFF[d].target); if(!best||sc<best.sc) best={ sc, x }; }); if(best){ used.add(best.x.o); opts.push(Object.assign(best.x.o,{ diff:d, est:+best.x.rate.toFixed(2), reward:ludusBoutReward(best.x.o,d) })); } });
      opts.sort((p,q)=>LUDUS_DIFF[p.diff].mult-LUDUS_DIFF[q.diff].mult);
      run.options=opts; ludusBusy=false; ludusSave(); ludusRender(); return;
    }
    const o=cands[i]; let rate=0.5;
    try{ const res=arenaSimulate(ludusMatchSetup(o,'scout'),SCOUT_RUNS,null); rate=res.wins[0]/SCOUT_RUNS; }catch(e){ console.error(e); }
    rated.push({ o, rate: rate+(r()-0.5)*0.1 });
    const el=document.getElementById('luScout'); if(el) el.textContent=`${i+1}/${cands.length}`;
    setTimeout(()=>step(i+1),20);
  };
  setTimeout(()=>step(0),30);
}
// a bout is made fitting: the opponent's level is searched (a few test fights) until the fighter's win rate comes near `target`
function ludusFitLevel(o,target){
  const f=o.foes[0], RUNS=10; let lo=1, hi=40, l=f.level, best=l, bestErr=9;
  for(let i=0;i<7;i++){
    f.level=l; o.level=Math.max(...o.foes.map(x=>x.level));
    let rate=0.5; try{ rate=arenaSimulate(ludusMatchSetup(o,'fit'+i),RUNS,null).wins[0]/RUNS; }catch(e){ break; }
    const err=Math.abs(rate-target); if(err<bestErr){ bestErr=err; best=l; } if(err<=0.06) break;
    if(rate>target) lo=Math.max(lo,l+1); else hi=Math.min(hi,l-1);
    if(lo>hi) break; l=Math.round(Math.sqrt(lo*hi));
  }
  f.level=best; o.level=best; return o;
}
// a quick, single bout of about the wanted difficulty (for forced fights, which cannot wait for the pit's scouting)
function ludusQuickBout(diff,rewardMult){
  const r=seededRng(arenaHash(ludus.seed+':q'+ludus.day)), tier=ludusAverageTier(), kinds=ludusFoeKinds(), level=ludusLevel(); let best=null;
  for(let i=0;i<4;i++){ const o=ludusCandidate(r,kinds,level,tier,0); o.items=null; let rate=0.5; try{ rate=arenaSimulate(ludusMatchSetup(o,'quick'),2,null).wins[0]/2; }catch(e){} const sc=Math.abs(rate-LUDUS_DIFF[diff].target)+r()*0.05; if(!best||sc<best.sc) best={ sc, o }; }
  return Object.assign(best.o,{ diff, reward:Math.round(ludusBoutReward(best.o,diff)*(rewardMult||1)) });
}

// ---- the days: they only pass by doing something, and the calendar pushes: a tournament round every week, a forced bout for whoever idles ----
const ludusTourIn=()=>LUDUS_TOUR_EVERY*Math.ceil(ludus.day/LUDUS_TOUR_EVERY)-ludus.day;
const ludusIdleIn=()=>Math.max(0,LUDUS_IDLE_LIMIT-(ludus.day-(ludus.lastFight||1)));
function ludusAdvanceDay(){
  ludus.day++; ludus.opp=null; ludus.options=null; ludus.event=null;
  if(ludus.over) return;
  if(ludus.day%LUDUS_TOUR_EVERY===0) ludus.forced={ type:'tour' };
  else if(ludus.day-(ludus.lastFight||1)>=LUDUS_IDLE_LIMIT) ludus.forced={ type:'debt' };
  if(!ludus.forced) ludusMaybeEvent();
}
function ludusForcedBout(){
  const fo=ludus.forced; if(!fo.opp){
    if(fo.type==='tour'){ const t=ludusTour(), lad=ludusLadder(t.week), rival=lad[Math.max(0,9-t.beaten)]; let rk=rival.kind; if(creatureWorth(rk)>ludusUnitWorth()*2){ const rr=ludusRng('rk'+t.week+':'+t.beaten), ks=ludusFoeKinds(); rk=ks[Math.floor(rr()*ks.length)]; }       // a rival too mighty for this team is replaced by a lesser kind of the same name
      const rv=Object.assign({},rival,{ kind:rk, level:ludusMatchLevel(rk,0) }), esc=Array.from({ length:ludus.team.length-1 },(_,k)=>{ const r=ludusRng('esc'+t.beaten+':'+k), ks=ludusFoeKinds(), kk=ks[Math.floor(r()*ks.length)]; return { kind:kk, level:Math.max(1,ludusMatchLevel(kk,-2)), tier:rival.tier, seed:Math.floor(r()*1e9), name:LUDUS_NAMES[Math.floor(r()*LUDUS_NAMES.length)] }; }); fo.opp=Object.assign({},rv,{ variant:'duel', foes:[rv].concat(esc), title:`${rival.name} (${SPECIES[rk].label})`, reward:Math.round((20+12*(Math.min(t.beaten,9)+1)+(rival.rank===1?100:0))*ludusHallMult()), tour:true, diff:'hard' }); ludusFitLevel(fo.opp,Math.max(0.45,0.92-0.05*t.beaten)); }
    else fo.opp=ludusQuickBout('fair',0.5);
  }
  return fo.opp;
}

// ---- the match ----
function ludusFight(o){
  if(!ludus||ludus.over) return;
  o=o||ludus.opp; if(!o) return;
  ludus.opp=o; ludusActive=true; ludusResolved=false; ludusResultText='';
  const setup=ludusMatchSetup(o,'');
  arenaStart(setup);
  document.getElementById('levelSubtitle').textContent=Tr(o.tour?'Ludus — Turnierkampf':'Ludus — Pit-Kampf');
}
// called once when the match is over (or left): applies the outcome to the run; returns the headline
function ludusResolve(st){
  if(ludusResolved) return ludusResultText.split('\n')[0]||'';
  ludusResolved=true;
  const o=ludus.opp, won=st.arena.winner===0, foes=ludusFoes(o), team=ludus.team.slice();
  const pairs=team.map(m=>{ const c=st.arena.roster[0].find(x=>x.memberId===m.id); const dead=!c||c.removed||c.dead||!st.creatures.includes(c); return { m, c, dead }; });
  const alive=pairs.filter(p=>!p.dead), fallen=pairs.filter(p=>p.dead);
  let head, text;
  ludus.forced=null; ludus.lastFight=ludus.day;
  ludusNpcOutcomes(st,won);
  fallen.forEach(p=>{ const n=p.m.npc&&ludusNpc(p.m.npc); if(n){ n.status='dead'; n.diedDay=ludus.day; n.last={ t:'died', d:ludus.day }; } });
  ludus.team=ludus.team.filter(m=>!fallen.some(p=>p.m===m)); ludus.sel=Math.max(0,Math.min(ludus.sel,ludus.team.length-1));
  const fell=fallen.map(p=>p.m.name).join(', ');
  if(!alive.length){
    ludus.over=true; ludus.cause=`Gefallen gegen ${o.title||o.name}`; head='Gefallen'; text=`${fell} ${team.length>1?'sind':'ist'} in der Grube gestorben. Der Lauf endet nach ${ludus.wins} Siegen und ${ludus.day} Tagen.`;
    ludusMeta.bestWins=Math.max(ludusMeta.bestWins,ludus.wins); ludusMeta.bestDays=Math.max(ludusMeta.bestDays,ludus.day);
  } else {
    const lead=alive[0], who=alive.length>1?'Dein Team':lead.m.name, xp=Math.round(LUDUS_XP_MULT*(won ? 18+8*o.level+6*(foes.length-1) : 6+2*o.level));
    const prev=state; state=st;
    try{ alive.forEach(p=>grantXp(p.c,xp)); } finally { state=prev; }
    alive.forEach(({m,c})=>{
      m.level=c.level; m.xp=c.xp; m.inventory=JSON.parse(JSON.stringify(c.inventory||[])); m.learned=(c.learned||[]).slice(); ludusNormalizeGear(m);
      m.hp=c.asleep?Math.max(1,Math.round(c.hp)):(c.unconscious?1:Math.max(1,c.hp));
      m.energy=Math.max(10,(Number.isFinite(c.energy)?c.energy:(m.energy===undefined?100:m.energy))-12);
    });
    if(won){
      ludus.gold+=Math.round(o.reward*giftMul(lead.c,'gold')); ludus.fame++; ludus.wins++; if(!o.tour) ludusGainRenown(({ easy:3, fair:6, hard:9 }[o.diff]||6)+(ludusRoomTier('pit')>=3?1:0));
      const loot=(st.looseItems||[]).filter(it=>it&&it.kind==='equipment'&&!it.arenaFloor);
      loot.forEach(it=>{ ludus.stash.push(looseInst(it)); });
      head='Sieg'; text=`${who} gewinnt gegen ${o.title||o.name}. +${o.reward} Gold${loot.length?`, Beute: ${loot.length} Stück`:''}.`;
      ludusLog(`Sieg über ${o.title||o.name}`);
      if(o.tour){ const t=ludusTour(); t.beaten++; ludus.fame+=o.rank===1?10:1; ludusGainRenown(Math.round((o.rank===1?40:12)*ludusHallMult())); ludus.giftChoice=genGiftOffer(Math.random,lead.c,ludus.fame); if(o.rank===1){ ludusMeta.titles=(ludusMeta.titles||0)+1; text+=' Du bist Meister dieser Rangliste!'; } }
    } else {
      const c=lead.c; ludus.losses++; ludus.gold+=2; head=c.surrendered?'Aufgegeben':(c.unconscious?'Bewusstlos':'Verloren');
      text=`${who} ${c.surrendered?'gibt auf und überlebt':(c.unconscious?'sinkt bewusstlos zu Boden, überlebt aber':'verliert nach Zeit')}. +2 Gold Trost.`;
      ludusLog(`Niederlage gegen ${o.title||o.name}`);
    }
    if(fell) text+=` ${fell} ${fallen.length>1?'sind':'ist'} gefallen.`;
    if(o.tour) ludusRepopulate();
    ludusAdvanceDay();
  }
  ludusResultText=head+'\n'+text; ludusSave();
  return head;
}
function ludusLeaveMatch(){
  if(!ludusResolved){ ludusResolve(state); }
  ludusActive=false; arenaSpell=null; uiTab('info');
  document.body.classList.remove('arenaMode','ludusMode'); debugNoFog=false; possessed=null; fpRestoreOnLeave();
  document.getElementById('arenaResult').hidden=true; document.getElementById('ludusContinue').hidden=true;
  state=makeDefaultState(); ludusNote=ludusResultText.replace('\n',' — '); ludusTab=ludus.over?'start':'pit'; showScreen('ludus'); ludusRender();
}

// ---- the ladder: ten rivals from a seed that depends only on the calendar week the run began in, so players who start together meet the same ones ----
const LUDUS_CAST=['Ferox','Rufus','Magnus','Niger','Longus','Crassus','Felix','Fortis','Gracilis','Pius'];
function ludusWeekId(d){
  d=d||new Date(); const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())), day=t.getUTCDay()||7; t.setUTCDate(t.getUTCDate()+4-day);
  const y0=new Date(Date.UTC(t.getUTCFullYear(),0,1)), wk=Math.ceil(((t-y0)/86400000+1)/7);
  return t.getUTCFullYear()+'-W'+String(wk).padStart(2,'0');
}
function ludusLadder(week){
  const r=seededRng(arenaHash('ladder:'+week)), pool=arenaKinds().slice(), out=[];
  for(let i=0;i<10;i++){      // i = 0 is the champion, i = 9 the weakest
    const strength=9-i, fit=pool.filter(k=>strength>=9||creatureWorth(k)<=0.6+0.5*strength), from=fit.length?fit:pool, kind=from[Math.floor(r()*from.length)]; pool.splice(pool.indexOf(kind),1);       // the lower ranks are weaker kinds
    out.push({ kind, level:1+Math.round(strength*1.8), tier:Math.max(0,Math.min(3,Math.floor(strength/3))), seed:Math.floor(r()*1e9),
      name:LUDUS_NAMES[Math.floor(r()*LUDUS_NAMES.length)]+' '+LUDUS_CAST[Math.floor(r()*LUDUS_CAST.length)], rank:i+1, layout:ludusLayoutPick(r) });
  }
  return out;
}
function ludusTour(){ if(!ludus.tour) ludus.tour={ week:ludus.week||ludusWeekId(), beaten:0 }; return ludus.tour; }
function ludusTavernHTML(){
  const g=ludusTavernGuests(), head=`<p class="luHint">Team: ${ludus.team.length} von ${ludusTeamMax()} Plätzen. Wer anheuert, hat keine Tag-Team-Kämpfe mit geliehenen Mitstreitern mehr, dafür kämpft das ganze Team gegen mehrere Gegner.</p>`;
  if(!g.length) return head;
  return head+`<h3>Gäste</h3>${g.map(n=>{ const pr=ludusRecruitPrice(n), can=ludusSlotsFree()>0&&(n.bond||0)>-2; return `<div class="luItem"><span>${ludusEsc(n.name)} — ${SPECIES[n.kind].label}, Stufe ${ludusMateLevel(n)}${ludusNpcStory(n)?' · '+ludusEsc(ludusNpcStory(n)):''}</span>${can?`<button data-recruit="${n.id}" ${ludus.gold<pr?'disabled':''}>Anheuern · ${pr} Gold</button>`:''}</div>`; }).join('')}`;
}
const ludusCastHTML=cast=>cast.length?`<div class="luCast">${cast.map(s=>`<div>${ludusEsc(ludusCastLine(s))}</div>`).join('')}</div>`:'';
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
  const c=ludusMemberCreature(f), prev=state; let ok=false;
  try{ if(!state||!state.eventLog) state=makeDefaultState(); ok=learnAbility(c,id); } finally { state=prev; }
  if(!ok){ ludusNote='Das Buch verrät ihm nichts Neues oder er hat keinen Platz dafür.'; ludusRender(); return; }
  f.learned=(c.learned||[]).slice(); ludus.bookbag.splice(i,1); ludusNote=`${f.name} lernt "${ABILITIES[id].name}".`; ludusSave(); ludusRender();
}
// ---- the training room: one turn of practice gives experience without a scratch, for a little gold ----
const ludusTrainCost=()=>10+4*ludus.fighter.level, ludusTrainXp=()=>Math.round((8+4*ludus.fighter.level)*[1,1.6,2.4][Math.max(0,ludusRoomTier('training')-1)]);
function ludusTrain(){
  const cost=ludusTrainCost(); if(ludus.gold<cost||ludusRoomTier('training')<1) return;
  const f=ludus.fighter, c=ludusCreature(), prev=state, xp=ludusTrainXp(), before=c.level;
  try{ if(!state||!state.eventLog) state=makeDefaultState(); grantXp(c,xp); } finally { state=prev; }
  f.level=c.level; f.xp=c.xp; f.energy=Math.max(10,(f.energy===undefined?100:f.energy)-15); ludus.gold-=cost; ludusAdvanceDay(); if(c.level>before) f.hp=undefined;
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
const LUDUS_TABS=[['inn','Taverne','inn'],['pit','Grube','pit'],['train','Trainingsraum','training'],['smith','Schmiede','forge'],['lib','Bücherei','library'],['tour','Turnierhalle','hall'],['gear','Inventar',null],['sheet','Werte',null]];
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
  const tabsAll=live?LUDUS_TABS:[['start',ludus&&ludus.over?'Der Lauf':'Neuer Kämpfer',null]];
  if(!tabsAll.some(t=>t[0]===ludusTab)) ludusTab=live?'inn':'start';
  const roomId=ludusRoomOfTab(ludusTab)||'inn', tier=ludusRoomTier(roomId), room=LUDUS_ROOMS[roomId];
  let f=null, c=null, wornIdx=new Set(), left='';
  if(live){
    f=ludus.fighter; c=ludusCreature();
    const pct=ludusHealPct(c,f), nextXp=xpForLevel(f.level+1), curXp=xpForLevel(f.level), xpPct=Math.max(0,Math.min(100,Math.round(100*((f.xp||0)-curXp)/Math.max(1,nextXp-curXp))));
    wornIdx=new Set(wornItems(c).map(w=>c.inventory.indexOf(w)));
    const abil=knownAbilities(c).filter(id=>ABILITIES[id]);
    const strip=`<div class="luTeam">${ludus.team.map((m,i)=>{ const mc=ludusMemberCreature(m); return `<button data-member="${i}" class="${i===ludus.sel?'on':''}">${ludusEsc(m.name)}<small>${ludusHealPct(mc,m)} %</small></button>`; }).join('')}${Array.from({length:Math.max(0,ludusSlotsFree())},()=>'<span class="luSlot" title="Freier Platz: in der Taverne kann man jemanden anheuern">+</span>').join('')}</div>`;
    left=`<div class="luCard">${strip}<canvas id="luPrev" width="140" height="140"></canvas><h2>${ludusEsc(f.name)}</h2><div>${SPECIES[f.kind].label} · Stufe ${f.level}</div>${ludus.team.length>1?`<button data-dismiss="${ludus.sel}" class="luSmall">Entlassen</button>`:''}<div class="luStance">Kampfstil: <b>${STANCES[stanceOf(c)].label}</b></div>${(f.gifts||[]).map(g=>`<div class="luGiftMini r${g.rarity}" title="${ludusEsc(giftLines(g).map(l=>(l.role==='bane'?'▼ ':'▲ ')+Tr(l.text)).join('\n'))}">${ludusEsc(giftTitle(g))}</div>`).join('')}
      <div class="luBar"><i class="hp" style="width:${pct}%"></i><b>${Math.round(c.hp)}/${c.maxHp} LP</b></div><div class="luBar"><i class="xp" style="width:${xpPct}%"></i><b>${f.xp||0}/${nextXp} EP</b></div><div class="luBar"><i class="rest" style="width:${Math.round(f.energy===undefined?100:f.energy)}%"></i><b>Ausgeschlafen ${Math.round(f.energy===undefined?100:f.energy)} %</b></div>
      ${abil.length?`<div class="luAbil">${abil.map(id=>ABILITIES[id].icon+' '+ABILITIES[id].name).join(' · ')}</div>`:''}
      ${ludusSlotsHTML(f)}</div>`;
  }
  const itemRow=(inst,i)=>`<div class="luItem${wornIdx.has(i)?' worn':''}${ludusSel===i?' sel':''}" data-pick="${i}"><span>${ludusEsc(instLabel(inst))}${wornIdx.has(i)?' ✓':''}</span></div>`;
  let main='', override='';
  if(live && ludus.giftChoice){
    override=`<div class="luPanel luGifts"><h2>Eine Gabe</h2><p>Der Sieg in der Turnierrunde wird belohnt. Wähle eine Gabe, sie bleibt für den ganzen Lauf.</p><div class="luOpts">${ludus.giftChoice.map((g,i)=>`<div class="luOption luGift r${g.rarity}"><div><b>${ludusEsc(giftTitle(g))}</b>${g.wild?' <span class="luTrait">[Wildkarte]</span>':''}<br><i>${Tr(GIFT_RARITY[g.rarity])}</i>${giftLines(g).map(l=>`<div class="${l.role==='bane'?'luBane':'luBoon'}"><span>${l.role==='bane'?'▼':'▲'}</span> <span>${ludusEsc(l.text)}</span></div>`).join('')}</div>${ludus.team.length>1?ludus.team.map((m,mi)=>`<button data-gift="${i}:${mi}" class="menuMain">Für ${ludusEsc(m.name)}</button>`).join(' '):`<button data-gift="${i}:0" class="menuMain">Wählen</button>`}</div>`).join('')}</div></div>`;
  } else if(live && ludus.forced){
    const fo=ludus.forced, o=ludusForcedBout();
    override=`<div class="luPanel luForced"><h2>Pflichtkampf: ${fo.type==='tour'?'Die Turnierrunde':(fo.type==='event'?'Der Hinterhalt':'Der Wirt hat genug')}</h2><p>${fo.type==='tour'?'Heute wird gekämpft: Die Runde dieser Woche ruft dich in die Grube. Wer nicht antritt, ist raus. Ein Turnierkampf geht auf Leben und Tod: Aufgeben gibt es nicht, wer unterliegt, stirbt.':(fo.type==='event'?'Dem kommst du nicht aus.':'Du hast zu lange nur geschlafen und geübt. Der Wirt schickt dich in die Grube, damit du dir dein Bett verdienst.')}</p>
      <div class="luOpp"><canvas id="luForcedPrev" width="110" height="110"></canvas><div><b>${ludusEsc(o.title||o.name)}</b><br>${ludusVariantLabel(o)} · Stufe ${o.level}<br>Preis: ${o.reward} Gold</div></div><button id="luForcedGo" class="menuMain">Antreten</button></div>`;
  } else if(live && ludus.event){
    const ev=ludus.event, def=ludusEventDef(ev.id), opts=ludusEventOptions(def);
    override=`<div class="luPanel luEvent"><h2>${def.title}</h2><p>${ludusEsc(def.text(ev))}</p>${ludusCastHTML(ev.cast)}${opts.map((o,i)=>`<button data-event="${i}" class="menuMain" ${o.when&&!o.when(ev)?'disabled':''}>${o.trait?'<span class="luTrait">['+SPECIES[ludus.fighter.kind].label+']</span> ':''}${ludusEsc(typeof o.label==='function'?o.label(ev):o.label)}</button>`).join(' ')}</div>`;
  }
  if(live && ludus.followup && !ludus.giftChoice){ const fu=ludus.followup; override=`<div class="luPanel luEvent"><h2>${fu.title}</h2><p>${ludusEsc(fu.text)}</p><button id="luFollowGo" class="menuMain">Weiter</button></div>`; }
  ludusEventShown=!!(override && live && !ludus.giftChoice && (ludus.followup || (ludus.event && !ludus.forced)));
  if(override){ main=override; }
  else if(ludusTab==='start'){
    main=(ludus&&ludus.over?`<div class="luPanel"><h2>Der Lauf ist zu Ende</h2><p>${ludusEsc(ludus.cause)}</p><p>Siege: ${ludus.wins} · Tage: ${ludus.day} · Ruhm: ${ludus.fame}</p><p>Rekord: ${ludusMeta.bestWins} Siege, ${ludusMeta.bestDays} Tage.</p></div>`:'')+ludusStartHTML();
  } else if(tier===0){
    main=`<div class="luPanel"><h2>${room.label}: Bauplatz</h2><p>Hier steht noch nichts. Wer hier baut, bekommt: ${room.text[0]}.</p>${ludusRoomBox(roomId)}</div>`;
  } else if(!live && ludusTab!=='gear'){
    main=`<div class="luPanel"><h2>${room.label} (Stufe ${tier}/${room.cost.length})</h2><p>${room.text[tier-1]}.</p>${roomId==='forge'?`<h3>Sortiment der Schmiede</h3>${ludusCatsHTML()}`:''}${ludusRoomBox(roomId)}</div>`;
  } else if(ludusTab==='pit'){
    const opts=ludus.options;
    main=`<div class="luPanel"><h2>Pit-Kampf</h2>`+(opts?`<div class="luOpts">${opts.map((o,i)=>`<div class="luOption"><div class="luDiff d-${o.diff}">${LUDUS_DIFF[o.diff].label}</div><canvas class="luOptPrev" data-opt="${i}" width="100" height="100"></canvas><div><b>${ludusEsc(o.title)}</b><br>${ludusVariantLabel(o)} · Stufe ${o.level}${o.layout&&o.layout!=='pit'?' · Arena: '+ludusLayoutLabel(o.layout):''}${o.items?' · es geht das Gerücht, in der Grube liege etwas versteckt':''}<br>Preis: ${o.reward} Gold</div><button data-fight="${i}" class="menuMain">Kämpfen</button></div>`).join('')}</div>`
      : (ludusBusy?'<p>Der Wirt sucht Gegner … <span id="luScout"></span></p>':'<p>Kein Gegner in Sicht.</p>'))+`<p class="luHint">Jeder Kampf kostet einen Tag. Wer bewusstlos wird, überlebt; wer fällt, beendet den Lauf. Leichter Kampf, kleiner Preis; schwerer Kampf (mit ausgebauter Grube), großer Preis.</p>${ludusRoomBox('pit')}</div>`;
  } else if(ludusTab==='inn'){
    main=`<div class="luPanel"><h2>Taverne</h2><p>Ein gebratenes Huhn stärkt (${ludusChickenCost()} Gold). Im Bett schlafen ist gratis, kostet aber einen Tag.</p>
      <button id="luChicken" ${ludus.gold<ludusChickenCost()?'disabled':''}>🍗 Huhn essen (${ludusChickenCost()} Gold, +${Math.round(ludusChickenHeal()*100)} % LP)</button> <button id="luBanquet" ${ludus.gold<ludusBanquetCost()?'disabled':''} title="Gold wird zu Ansehen">🍷 Bankett geben (${ludusBanquetCost()} Gold, +3 Ansehen)</button> <button id="luSleep">🛏️ Schlafen (+${Math.round(ludusSleepHeal()*100)} % LP, ein Tag)</button>${ludusTavernHTML()}${ludusRoomBox('inn')}</div>`;
  } else if(ludusTab==='train'){
    const cost=ludusTrainCost();
    main=`<div class="luPanel"><h2>Trainingsraum</h2><p>Eine Runde am Übungsdummy gibt Erfahrung, ohne dass jemand Schaden nimmt. Sie kostet Gold und einen Tag.</p>
      <button id="luTrain" class="menuMain" ${ludus.gold<cost?'disabled':''}>Trainieren · ${cost} Gold · +${ludusTrainXp()} Erfahrung</button>${ludusRoomBox('training')}</div>`;
  } else if(ludusTab==='tour'){
    const t=ludusTour(), lad=ludusLadder(t.week), next=t.beaten<10?lad[9-t.beaten]:null;
    main=`<div class="luPanel"><h2>Turnier ${t.week}</h2><p class="luHint">Alle ${LUDUS_TOUR_EVERY} Tage ruft die nächste Runde, und sie muss gekämpft werden. Die Rangliste ist für alle, die in dieser Woche begonnen haben, gleich. Besiege die Gegner von unten nach oben, bis du den Meister schlägst.</p>
      <p><b>Nächste Runde in ${ludusTourIn()} Tagen.</b></p>
      ${lad.map((r,i)=>{ const done=(9-i)<t.beaten; return `<div class="luItem${done?' worn':''}${next&&next.rank===r.rank?' sel':''}"><span>${r.rank}. ${ludusEsc(r.name)} — ${SPECIES[r.kind].label}, Stufe ${ludusMatchLevel(r.kind,0)}</span><span>${done?'✓':''}</span></div>`; }).join('')}
      ${next?`<p>Gegner der nächsten Runde: <b>${ludusEsc(next.name)}</b> (Platz ${next.rank})</p>`:'<p><b>Du bist Meister dieser Rangliste!</b> Die Runden gehen weiter, gegen den Meister selbst.</p>'}${ludusRoomBox('hall')}</div>`;
  } else if(ludusTab==='lib'){
    const books=ludusBooks();
    main=`<div class="luPanel"><h2>Bücherei</h2><p class="luHint">Jeden Tag liegen drei Bücher aus, passend zur Art deines Kämpfers. Gekaufte Bücher liegen im Inventar und müssen gelernt werden.</p>
      ${books.length?books.map(id=>`<div class="luItem"><span>${ABILITIES[id].icon} ${ABILITIES[id].name} — ${ABILITIES[id].text||''}</span><button data-book="${id}" ${ludus.gold<ludusBookPrice(id)?'disabled':''}>${ludusBookPrice(id)} Gold</button></div>`).join(''):'<p><i>Heute gibt es nichts Neues für ihn.</i></p>'}${ludusRoomBox('library')}</div>`;
  } else if(ludusTab==='gear'){
    const all=ludusItems(), sel=all[ludusSel], books=ludus.bookbag||[], total=Math.max(24,Math.ceil((all.length+1)/6)*6);
    const cells=all.map((e,k)=>`<button class="luCell${ludusSel===k?' sel':''}" data-item="${k}" style="border-color:${itemTierColor(e.inst)}" title="${ludusEsc(instLabel(e.inst))}"><img src="${itemIconURL(e.inst,40)}">${e.owner?`<b>${ludusEsc(e.owner.name[0])}</b>`:''}</button>`).concat(Array.from({length:total-all.length},()=>'<span class="luCell empty"></span>')).join('');
    main=`<div class="luPanel"><h2>Inventar</h2><h3>Ausrüstungsplätze von ${ludusEsc(f.name)}</h3>${ludusSlotsHTML(f)}<h3>Vorrat des Teams</h3><p class="luHint">Das ganze Team teilt sich diese Fächer. Ein Buchstabe in der Ecke zeigt, wer das Stück trägt.</p><div class="luGrid">${cells}</div>
      ${sel?`<div class="luDetail"><pre>${ludusEsc(itemDescription(sel.inst))}</pre>
        ${ludus.team.filter(m=>m!==sel.owner).map(m=>`<button data-give="${ludusSel}:${ludus.team.indexOf(m)}">${sel.owner?'Geben':'Anlegen'}: ${ludusEsc(m.name)}</button>`).join(' ')}${sel.owner?`<button data-give="${ludusSel}:-1">Ablegen</button>`:''}
        <button data-reroll="${ludusSel}" title="Aussehen neu würfeln">🎲 ${ludusRerollPrice(sel.inst)}</button>
        <button data-sell="${ludusSel}" title="Verkaufen">💰 ${ludusSellPrice(sel.inst)}</button></div>`:(all.length?'<p class="luHint">Wähle ein Stück, um es zu lesen, weiterzugeben oder zu verkaufen.</p>':'<p><i>Das Team besitzt noch keine Ausrüstung. Die Schmiede verkauft welche.</i></p>')}
      ${books.length?`<h3>Bücher</h3>${books.map((id,i)=>`<div class="luItem"><span>📖 ${ABILITIES[id].icon} ${ABILITIES[id].name} — ${ABILITIES[id].text||''}</span><span>${ludus.team.map((m,mi)=>`<button data-learn="${i}:${mi}">Lernen: ${ludusEsc(m.name)}</button>`).join(' ')}</span></div>`).join('')}`:''}</div>`;
  } else if(ludusTab==='sheet'){
    main=ludusSheetHTML(f);
  } else if(ludusTab==='smith'){
    const stock=ludusStock();
    main=`<div class="luPanel"><h2>Schmiede</h2><p>Heute im Angebot (${LUDUS_ROOMS.forge.text[tier-1]}):</p>${stock.length?stock.map((it,i)=>`<div class="luItem"><span>${ludusEsc(instLabel(it))}</span><button data-buy="${i}" ${ludus.gold<ludusPrice(it.id)?'disabled':''}>${ludusPrice(it.id)} Gold</button></div>`).join(''):'<p><i>Die Schmiede hat heute nichts, was du führen kannst. Kaufe unten mehr Sorten.</i></p>'}<h3>Sortiment der Schmiede</h3>${ludusCatsHTML()}${ludusRoomBox('forge')}</div>`;
    el._stock=stock;
  }
  const tabs=`<div class="luTabs">${tabsAll.map(([k,l,rm])=>{ const built=!rm||ludusRoomTier(rm)>0; return `<button data-tab="${k}" class="${ludusTab===k?'on':''}${built?'':' site'}">${built?'':'🔒 '}${l}</button>`; }).join('')}</div>`;
  el.innerHTML=`<div class="luTop">${live?`<span>Ansehen ${ludusRenown()}</span><span>Tag ${ludus.day}</span><span>💰 ${ludus.gold}</span><span>Ruhm ${ludus.fame}</span><span>Siege ${ludus.wins}</span><span title="Alle ${LUDUS_TOUR_EVERY} Tage eine Turnierrunde; wer ${LUDUS_IDLE_LIMIT} Tage nicht kämpft, wird in die Grube geschickt">Turnier in ${ludusTourIn()} Tagen</span><span>${ludusIdleIn()<=2?'⚠ ':''}Pflichtkampf spätestens in ${Math.min(ludusIdleIn(),ludusTourIn())} Tagen</span>`:''}</div>
    ${ludusNote?`<div class="luNote">${ludusEsc(ludusNote)}</div>`:''}
    ${override?'':tabs}<div class="${live?'luCols':'luSolo'}">${left}<div>${main}${live&&ludus.log.length?`<div class="luLog">${ludus.log.map(ludusEsc).join('<br>')}</div>`:''}</div></div>
    <div class="arBtns"><button id="luMenu" class="menuMain">Hauptmenü</button>${live?'<button id="luReset" class="menuMain">Neu beginnen</button>':''}</div>`;
  const stockNow=el._stock;
  el.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{ ludusTab=b.dataset.tab; ludusNote=''; if(ludusTab!=='gear') ludusSel=-1; ludusRender(); if(ludusTab==='pit'&&live) ludusScoutOpponent(); }));
  if(live){
    el.querySelectorAll('[data-item]').forEach(b=>b.addEventListener('click',()=>{ ludusSel=+b.dataset.item; ludusTab='gear'; ludusRender(); }));
    el.querySelectorAll('[data-give]').forEach(b=>b.addEventListener('click',()=>{ const [k,mi]=b.dataset.give.split(':').map(Number), e=ludusItems()[k]; if(!e) return; ludusGiveItem(e.inst,mi<0?null:ludus.team[mi]); ludusSel=-1; ludusSave(); ludusRender(); }));
    el.querySelectorAll('[data-sell]').forEach(b=>b.addEventListener('click',()=>{ const e=ludusItems()[+b.dataset.sell]; if(!e) return; ludus.gold+=ludusSellPrice(e.inst); const list=e.owner?e.owner.inventory:ludus.stash; list.splice(list.indexOf(e.inst),1); ludusSel=-1; ludusNote=''; ludusSave(); ludusRender(); }));
    el.querySelectorAll('[data-reroll]').forEach(b=>b.addEventListener('click',()=>{ const e=ludusItems()[+b.dataset.reroll]; if(!e) return; const pr=ludusRerollPrice(e.inst); if(ludus.gold<pr) return; ludus.gold-=pr; e.inst.s=Math.floor(Math.random()*1e9); ludusSave(); ludusRender(); }));
    el.querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>{ const it=stockNow[+b.dataset.buy], pr=ludusPrice(it.id); if(ludus.gold<pr) return; ludus.gold-=pr; ludus.stash.push({ id:it.id, q:it.q, s:it.s }); ludusNote=''; ludusSave(); ludusRender(); }));
    el.querySelectorAll('[data-book]').forEach(b=>b.addEventListener('click',()=>ludusBuyBook(b.dataset.book)));
    el.querySelectorAll('[data-learn]').forEach(b=>b.addEventListener('click',()=>{ const [i,mi]=b.dataset.learn.split(':').map(Number); ludusLearnBook(i,mi); }));
  }
  const on=(id,fn)=>{ const b=document.getElementById(id); if(b) b.addEventListener('click',fn); };
  el.querySelectorAll('[data-room]').forEach(b=>b.addEventListener('click',()=>ludusBuyRoom(b.dataset.room)));
  el.querySelectorAll('[data-cat]').forEach(b=>b.addEventListener('click',()=>{ const [t,f2]=b.dataset.cat.split(':'); ludusBuyCat(t,f2); }));
  el.querySelectorAll('[data-fight]').forEach(b=>b.addEventListener('click',()=>ludusFight(ludus.options[+b.dataset.fight])));
  el.querySelectorAll('[data-member]').forEach(b=>b.addEventListener('click',()=>{ ludus.sel=+b.dataset.member; ludusSel=-1; ludusSave(); ludusRender(); }));
  el.querySelectorAll('[data-dismiss]').forEach(b=>b.addEventListener('click',()=>ludusDismiss(+b.dataset.dismiss)));
  el.querySelectorAll('[data-recruit]').forEach(b=>b.addEventListener('click',()=>ludusRecruit(b.dataset.recruit)));
  el.querySelectorAll('[data-gift]').forEach(b=>b.addEventListener('click',()=>{ const [gi,mi]=b.dataset.gift.split(':').map(Number); const g=ludus.giftChoice&&ludus.giftChoice[gi], m=ludus.team[mi||0]; if(!g||!m) return; (m.gifts=m.gifts||[]).push(g); ludus.giftChoice=null; ludusNote=Tr('Gabe angenommen: {0}').replace('{0}',giftTitle(g)); ludusSave(); ludusRender(); }));
  el.querySelectorAll('[data-event]').forEach(b=>b.addEventListener('click',()=>ludusEventChoose(+b.dataset.event)));
  on('luFollowGo',()=>{ ludus.followup=null; ludusSave(); ludusRender(); });
  on('luForcedGo',()=>ludusFight(ludusForcedBout())); on('luTrain',ludusTrain);
  on('luChicken',()=>{ if(ludus.gold<ludusChickenCost()) return; ludus.gold-=ludusChickenCost(); ludusHeal(ludusChickenHeal()); ludus.fighter.energy=Math.min(100,(ludus.fighter.energy===undefined?100:ludus.fighter.energy)+10); ludusSave(); ludusRender(); });
  on('luBanquet',()=>{ const c=ludusBanquetCost(); if(ludus.gold<c) return; ludus.gold-=c; ludusGainRenown(3); ludusNote='Das Bankett spricht sich herum: +3 Ansehen.'; ludusSave(); ludusRender(); });
  on('luSleep',()=>{ ludusHealAll(ludusSleepHeal()); ludus.team.forEach(m=>{ m.energy=100; }); ludusAdvanceDay(); ludusLog('geschlafen'); ludusSave(); ludusRender(); });
  on('luMenu',()=>showScreen('menu'));
  on('luReset',e=>{ const b=e.currentTarget; if(b.dataset.sure){ ludus=null; ludusNote=''; ludusTab='start'; ludusSave(); ludusRender(); return; } b.dataset.sure='1'; b.textContent=Tr('Sicher? Nochmal klicken'); setTimeout(()=>{ if(b.isConnected){ delete b.dataset.sure; b.textContent=Tr('Neu beginnen'); } },3000); });
  if(ludusTab==='start') ludusWireStart(el);
  if(ludusTab==='pit' && live && !ludus.options && !override) ludusScoutOpponent();
  ludusHubSync(roomId);
}
// the 3D courtyard shows the meta progress; the camera belongs to the selected room, the fighter of the run walks in after it
let hubState='idle', ludusEventShown=false;
function ludusHubTiers(){ const t={ event:1 }; Object.keys(LUDUS_ROOMS).forEach(id=>{ t[id]=(ludus&&!ludus.over)||ludusMeta.roomsAll?ludusRoomTier(id):(id==='inn'||id==='pit'?1:0); }); return t; }
function ludusHubSync(roomId){
  if(hubState==='failed') return;
  if(hubState==='idle'){
    hubState='loading';
    Hub3D.init(document.getElementById('hubHost')).then(()=>{ hubState='ready'; Hub3D.start(); ludusHubSync(roomId); }).catch(e=>{ console.error(e); hubState='failed'; document.getElementById('hubHost').hidden=true; });
    return;
  }
  if(hubState!=='ready') return;
  let fighter=null; if(ludus&&!ludus.over){ const c=ludusCreature(), extra=typeof equipLook==='function'?equipLook(c):undefined; fighter={ kind:ludus.fighter.kind, extra:extra||undefined, sig:JSON.stringify(extra||null) }; }
  const showEv=!!(ludus&&!ludus.over&&ludusEventShown);
  Hub3D.sync(ludusHubTiers(),fighter,showEv?ludusEventCast():null,ludusTavernGuests().map(ludusLookOf)); Hub3D.focus(showEv?'event':(roomId||'inn')); Hub3D.start(); Hub3D.resize();
}
function ludusPaint(){
  if(screen!=='ludus'||!ludus) return;
  const cv=document.getElementById('luPrev'); if(cv) arenaPaintCreature(cv,ludusCreature(),0,96);
  const draw=(canvas,o,size)=>{ const f=ludusFoes(o)[0], c=arenaMake(f.kind,0,0); c.level=f.level; c.inventory=arenaGear(c,ludusOppGroup(f),0); arenaPaintCreature(canvas,c,1,size); };
  document.querySelectorAll('canvas.luOptPrev').forEach(cv2=>{ const o=(ludus.options||[])[+cv2.dataset.opt]; if(o) draw(cv2,o,66); });
  const fc=document.getElementById('luForcedPrev'); if(fc&&ludus.forced&&ludus.forced.opp) draw(fc,ludus.forced.opp,76);
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
