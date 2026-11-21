// The living world of the Ludus tour (concept: docs/ludus.md, "Die lebende Welt"). Every gladiator of the map is a fighter like the player's own:
// level, experience, life, rest, real gear, gold, honour. Each morning he decides what to do today (the pit, the arena or rest); the player meets in the pit
// and the arena exactly those who chose to be there. In the evening the others fight each other: in the player's region with the real engine,
// elsewhere with a quick estimate (the same outcomes, roughly: experience, loot, gold, honour, death). Who outgrows a region moves on to the right,
// rookies start on the left. A chronicle tells the news.
const LUDUS_LIFE={
  restBelow:55,        // % of life under which a gladiator rests
  outgrow:2,           // levels above his region's level at which a gladiator moves on to the right
  minRoster:6,         // a region that has fewer gets wanderers
  deathCoarse:0.06,    // the chance that the loser of an arena bout dies, where it is only estimated
  chronicle:80         // entries kept
};

// ---- a gladiator as a fighter: the same record as a member of the player's team ----
function ludusEquip(n){
  if(n.inventory) return n;
  if(n.member){ const m=n.member; n.inventory=JSON.parse(JSON.stringify(m.inventory||[])); n.learned=(m.learned||[]).slice(); n.gifts=JSON.parse(JSON.stringify(m.gifts||[])); n.xp=m.xp||xpForLevel(n.level); delete n.member; }
  else { const c=arenaMake(n.kind,0,0); c.level=n.level; const g=arenaGroup(n.kind,1,n.level); g.tier=n.tier; g.seed=n.seed; n.inventory=JSON.parse(JSON.stringify(arenaGear(c,g,0))); n.learned=[]; n.gifts=[]; n.xp=xpForLevel(n.level); }
  n.hp=undefined; n.energy=100; n.gold=n.gold||10+5*n.level; n.wins=n.wins||0; n.losses=n.losses||0; n.kills=n.kills||0; if(n.bold===undefined) n.bold=(arenaHash(n.id)%100)/100;
  return n;
}
const ludusGladTier=n=>{ const l=(n.inventory||[]).filter(i=>instDef(i)); return l.length?Math.round(l.reduce((a,i)=>a+ludusTierIndex(i),0)/l.length):0; };
// what a gladiator is worth in a fight, for the quick estimate (orks at level 1): kind and level, gear, how hurt he is
function ludusGladWorth(n){
  const c=ludusMemberCreature(n), hp=c.hp/Math.max(1,c.maxHp);
  return creatureWorthAt(n.kind,n.level)*Math.pow(ludusKindBoost(n.kind),2)*(1+0.18*ludusGladTier(n))*(0.4+0.6*hp);
}
const ludusHurtPct=n=>{ const c=ludusMemberCreature(n); return Math.round(100*c.hp/Math.max(1,c.maxHp)); };
function ludusChron(region,t){ ludus.chronicle=ludus.chronicle||[]; ludus.chronicle.unshift({ d:ludus.day, r:region, t }); if(ludus.chronicle.length>LUDUS_LIFE.chronicle) ludus.chronicle.length=LUDUS_LIFE.chronicle; }
const ludusRegionName=id=>{ const n=ludusMapWorld().nodes[id]; return n?n.name:''; };
// experience by the numbers (where no creature is at hand): the same formula as for the player's team
function ludusGladXp(n,xp){ n.xp=(n.xp||xpForLevel(n.level))+xp; let up=false; while(n.level<40&&n.xp>=xpForLevel(n.level+1)){ n.level++; up=true; } return up; }
const ludusBoutXp=(foeLevel,won,nFoes)=>Math.round(LUDUS_XP_MULT*(won?18+8*foeLevel+6*((nFoes||1)-1):6+2*foeLevel));

// ---- the morning: what each gladiator of the player's region does today ----
function ludusLifePlan(){
  const id=ludus.map.region, plans={}, r=ludusRng('plan'+ludus.day+':'+id), tIn=ludusTourneyIn();
  ludusRegionNpcs(id).forEach(n=>{
    ludusEquip(n);
    if(n.maimed||ludusHurtPct(n)<LUDUS_LIFE.restBelow||tIn<=1) { plans[n.id]='rest'; return; }
    if(n.boss||ludusIsChamp(id,'npc',n.id)){ plans[n.id]=r()<0.35?'arena':'rest'; return; }      // the champion fights now and then, but nobody may challenge him outside the tournament
    const x=r(); plans[n.id]=x<0.15?'rest':(x<0.15+0.35+0.3*n.bold?'arena':'pit');
  });
  ludus.life={ day:ludus.day, region:id, plans, busy:[] };
}
const ludusPlanOf=id=>ludus.life&&ludus.life.day===ludus.day?ludus.life.plans[id]:undefined;
// who is free in the pit / the arena today (not the champion: he only meets the player in the tournament)
const ludusGoers=what=>ludusRegionNpcs(ludus.map.region).filter(n=>ludusPlanOf(n.id)===what&&!(ludus.life.busy||[]).includes(n.id)&&!n.boss&&!ludusIsChamp(ludus.map.region,'npc',n.id));
const ludusLifeBusy=ids=>{ if(ludus.life) ludus.life.busy=(ludus.life.busy||[]).concat(ids.filter(Boolean)); };

// ---- a bout between gladiators, fought by the engine; everything that happens to them stays ----
// a, b: lists of gladiators (records of ludus.world, or own members); kind: 'pit' (nobody dies) | 'arena'. Returns 0 when side a wins, 1 when b, and what happened
function ludusLifeBout(a,b,kind,seed){
  const side=l=>({ name:l[0].name, groups:l.map(n=>{ const g=ludusFighterGroup(ludusEquip(n)); if(!ludusMember(n.id)) g.npc=n.id; return g; }) });
  const setup={ teams:[side(a),side(b)], map:{ layout:'pit', dims:'S', seed:'life'+ludus.seed+':'+seed, lava:0, water:0, crystal:0, near:1 }, fog:false, batch:1, ludus:true, fixedMap:true, noDeath:kind==='pit' };
  const st=arenaBuild(setup,''), prev=state, ps=screen; let w=0;
  try{ state=st; screen='level'; let k=0; while(arenaStep(st)&&k<8000) k++; w=st.arena.winner<0?(Math.random()<0.5?0:1):st.arena.winner; }
  finally{ state=prev; screen=ps; }
  const out={ winner:w, dead:[] };
  [a,b].forEach((l,ti)=>l.forEach(n=>{
    const c=st.arena.roster[ti].find(x=>x.memberId===n.id), gone=!c||c.removed||c.dead||!st.creatures.includes(c);
    if(gone){ out.dead.push(n); return; }
    const foes=ti?a:b, xp=ludusBoutXp(Math.max(...foes.map(f=>f.level)),ti===w,foes.length);
    withState(st,()=>grantXp(c,xp));
    n.level=c.level; n.xp=c.xp; n.inventory=JSON.parse(JSON.stringify(c.inventory||[])); n.learned=(c.learned||[]).slice();
    n.hp=c.unconscious?1:Math.max(1,Math.round(c.hp)); n.energy=Math.max(10,(Number.isFinite(c.energy)?c.energy:100)-12);
  }));
  return out;
}
// the best piece of a loser's gear goes to the winner: worn when it is better than what he wears of that kind, else sold
function ludusLifeLoot(winner,loser){
  const pool=(loser.inventory||[]).filter(i=>instDef(i)&&['weapon','armor','shield'].includes(instDef(i).type)).sort((x,y)=>ludusPrice(y.id)-ludusPrice(x.id));
  const it=pool[0]; if(!it) return null;
  loser.inventory.splice(loser.inventory.indexOf(it),1);
  const d=instDef(it), worn=(winner.inventory||[]).filter(i=>instDef(i)&&instDef(i).type===d.type);
  if(!worn.length||Math.max(...worn.map(ludusTierIndex))<ludusTierIndex(it)){ worn.forEach(w=>winner.inventory.splice(winner.inventory.indexOf(w),1)); winner.inventory.push(it); }
  else winner.gold=(winner.gold||0)+ludusSellPrice(it);
  return it;
}
// the bookkeeping of a bout between gladiators: wins, honour, gold, the dead
function ludusLifeAfterBout(sides,res,kind,region){
  const [a,b]=sides, win=res.winner===0?a:b, lose=res.winner===0?b:a, L=ludusRegionLevel(ludusMapWorld().nodes[region].col);
  win.forEach(n=>{ n.wins=(n.wins||0)+1; if(kind==='arena'){ n.gold=(n.gold||0)+10+6*L; n.honor=(n.honor||0)+10*lose.length; } });
  lose.forEach(n=>{ n.losses=(n.losses||0)+1; if(kind==='arena') n.honor=Math.max(0,(n.honor||0)-5); });
  if(kind==='pit'&&win[0]&&lose[0]){ const it=ludusLifeLoot(win[0],lose[0]); if(it&&ludusTierIndex(it)>=2) ludusChron(region,`${win[0].name} nimmt ${lose[0].name} in der Grube ${instLabel(it)} ab.`); }
  res.dead.forEach(n=>{ n.status='dead'; n.diedDay=ludus.day; n.last={ t:'died', d:ludus.day }; const k=win[0]; if(k&&res.dead.indexOf(k)<0) k.kills=(k.kills||0)+1;
    ludusChron(region,`${n.name} (${SPECIES[n.kind].label}, Stufe ${n.level}) fällt in der Arena${k?' gegen '+k.name:''}.`); });
}

// ---- the evening: the bouts of the day without the player ----
// in the player's region: pairs of similar strength, in the pit and in the arena, fought by the engine
function ludusLifeEveningHere(){
  if(!ludus.life||ludus.life.day!==ludus.day) return;
  const id=ludus.life.region;
  ['pit','arena'].forEach(kind=>{
    const l=ludusGoers(kind).sort((x,y)=>ludusGladWorth(y)-ludusGladWorth(x));
    for(let i=0;i+1<l.length;i+=2){ const a=[l[i]], b=[l[i+1]], res=ludusLifeBout(a,b,kind,ludus.day+':'+kind+i); ludusLifeAfterBout([a,b],res,kind,id); }
  });
  ludusRegionNpcs(id).forEach(n=>{ if(ludusPlanOf(n.id)==='rest') ludusLifeRest(n); });
}
function ludusLifeRest(n){ const c=ludusMemberCreature(n); n.hp=Math.min(c.maxHp,Math.round(c.hp+c.maxHp*0.5)); if(n.hp>=c.maxHp) n.hp=undefined; n.energy=100; }
// elsewhere: the same day, estimated: who fights whom, the stronger wins as often as the worth says
function ludusLifeEveningElsewhere(){
  const r=ludusRng('else'+ludus.day);
  Object.keys(ludus.regions||{}).forEach(k=>{
    const id=+k; if(id===ludus.map.region) return;
    const l=ludusRegionNpcs(id).filter(n=>!n.maimed); l.forEach(ludusEquip);
    const goers={ pit:[], arena:[] };
    l.forEach(n=>{ if(ludusHurtPct(n)<LUDUS_LIFE.restBelow){ ludusLifeRest(n); return; } const x=r(); if(x<0.25){ ludusLifeRest(n); return; } (x<0.25+0.3+0.3*n.bold?goers.arena:goers.pit).push(n); });
    ['pit','arena'].forEach(kind=>{
      const g=goers[kind].sort((x,y)=>ludusGladWorth(y)-ludusGladWorth(x));
      for(let i=0;i+1<g.length;i+=2){
        const a=g[i], b=g[i+1], wa=ludusGladWorth(a), wb=ludusGladWorth(b), pa=Math.pow(wa,1.5)/(Math.pow(wa,1.5)+Math.pow(wb,1.5)), aw=r()<pa, win=aw?a:b, lose=aw?b:a;
        ludusGladXp(win,ludusBoutXp(lose.level,true,1)); ludusGladXp(lose,ludusBoutXp(win.level,false,1));
        const cw=ludusMemberCreature(win), cl=ludusMemberCreature(lose);
        win.hp=Math.max(1,Math.round(cw.hp*(0.45+0.4*r()))); lose.hp=Math.max(1,Math.round(cl.hp*0.15));
        const res={ winner:aw?0:1, dead:kind==='arena'&&r()<LUDUS_LIFE.deathCoarse?[lose]:[] };
        ludusLifeAfterBout([[a],[b]],res,kind,id);
      }
    });
  });
}
// gladiators with gold buy better gear (the forge of their region: one quality above what they wear, up to the region's usual one and one more)
function ludusLifeShop(){
  (ludus.world||[]).forEach(n=>{
    if(n.status!=='active'||!n.inventory||(n.gold||0)<20) return;
    const node=ludusMapWorld().nodes[n.region]; if(!node) return; const top=Math.min(3,ludusRegionTier(node.col)+1);
    for(const it of n.inventory.slice()){
      const d=instDef(it); if(!d||!['weapon','armor','shield'].includes(d.type)) continue;
      const t=ludusTierIndex(it); if(t>=top) continue; const id=d.family+'_'+TIER_IDS[t+1]; if(!ITEMS[id]) continue;
      const pr=ludusPrice(id); if(n.gold<pr) continue;
      n.gold-=pr; n.inventory.splice(n.inventory.indexOf(it),1,{ id, q:1, s:arenaHash(n.id+':'+ludus.day+':'+id) }); break;
    }
  });
}
// the day ends (called before the day is counted on)
function ludusLifeEvening(){
  ludusLifeEveningHere(); ludusLifeEveningElsewhere(); ludusLifeShop();
  (ludus.world||[]).forEach(n=>{ if(n.status==='active') n.tier=ludusGladTier(n); });
}

// ---- the tournaments of the other regions (on the same day as the player's): the champion is estimated from the best eight ----
function ludusLifeTourneys(){
  const r=ludusRng('lt'+ludus.day);
  Object.keys(ludus.regions||{}).forEach(k=>{
    const id=+k; if(id===ludus.map.region) return;
    const champ=ludusChamp(id), l=ludusRegionNpcs(id).filter(n=>!n.maimed);
    const seeds=l.sort((x,y)=>(ludusIsChamp(id,'npc',y.id)-ludusIsChamp(id,'npc',x.id))||((y.honor||0)-(x.honor||0))).slice(0,8);
    let round=seeds; while(round.length>1){ const next=[]; for(let i=0;i<round.length;i+=2){ const a=round[i], b=round[i+1]; if(!b){ next.push(a); continue; } const wa=ludusGladWorth(a), wb=ludusGladWorth(b); next.push(r()<Math.pow(wa,1.5)/(Math.pow(wa,1.5)+Math.pow(wb,1.5))?a:b); } round=next; }
    const w=round[0]; if(!w) return;
    const prev=champ&&champ.t==='npc'?ludusNpc(champ.id):null;
    ludus.regions[id].champ={ t:'npc', id:w.id }; w.honor=(w.honor||0)+30;
    if(!prev||prev.id!==w.id) ludusChron(id,`${w.name} gewinnt das Turnier von ${ludusRegionName(id)}${prev?' und stürzt '+prev.name:''}.`);
  });
  ludusLifeMigrate();
}
// ---- after a tournament: who has outgrown his region moves on to the right; rookies start on the left; empty regions get wanderers ----
function ludusLifeMigrate(){
  const w=ludusMapWorld(), r=ludusRng('mig'+ludus.day);
  (ludus.world||[]).filter(n=>n.status==='active'&&!n.boss).forEach(n=>{
    const node=w.nodes[n.region]; if(!node||n.region===ludus.map.region&&ludus.tourney) return;
    if(ludusIsChamp(n.region,'npc',n.id)) return;
    if(n.level<ludusRegionLevel(node.col)+LUDUS_LIFE.outgrow) return;
    const next=ludusMapNeighbours(node.id).map(i=>w.nodes[i]).filter(m=>m.col>node.col);
    // a waypoint is passed on the way: the next region behind it
    const regions=[]; next.forEach(m=>{ if(ludusIsRegion(m)) regions.push(m); else ludusMapNeighbours(m.id).map(i=>w.nodes[i]).filter(x=>x.col>m.col&&ludusIsRegion(x)).forEach(x=>regions.push(x)); });
    if(!regions.length) return;
    const crowd=m=>ludusRegionNpcs(m.id).length+r()*0.5, to=regions.sort((x,y)=>crowd(x)-crowd(y))[0]; ludusRegionEnsure(to.id);       // the least crowded of the next regions
    ludusChron(n.region,`${n.name} (Stufe ${n.level}) zieht weiter nach ${to.name}.`);
    n.region=to.id; n.honor=0; n.maimed=false;
  });
  Object.keys(ludus.regions||{}).forEach(k=>{
    const id=+k, node=w.nodes[id], have=ludusRegionNpcs(id).filter(n=>!n.boss&&!ludusIsChamp(id,'npc',n.id)).length;
    if(node.col===0){ for(let i=have;i<LUDUS_TOUR.roster;i++){ const n=ludusNpcMake(r,id,0.55+0.25*r(),-1); n.honor=0; ludus.world.push(n); ludusChron(id,`${n.name} (${SPECIES[n.kind].label}) beginnt als Neuling in ${node.name}.`); } }
    else if(have<LUDUS_LIFE.minRoster){ for(let i=have;i<LUDUS_LIFE.minRoster;i++){ const n=ludusNpcMake(r,id,0.8+0.2*r(),-1); n.honor=0; ludus.world.push(n); } }
  });
  ludus.world=ludus.world.filter(n=>n.status==='active'||n.status==='team'||(n.status==='dead'&&ludus.day-(n.diedDay||0)<30));
}

// ---- on screen ----
const LUDUS_PLAN_LABEL={ pit:'in der Grube', arena:'in der Arena', rest:'ruht' };
function ludusChronicleHTML(){
  const l=(ludus.chronicle||[]).slice(0,18); if(!l.length) return '';
  return `<h3>Chronik</h3><div class="luLog">${l.map(e=>`<span>Tag ${e.d}${e.r!==ludus.map.region?' · '+ludusEsc(ludusRegionName(e.r)):''}:</span> <span>${ludusEsc(e.t)}</span>`).join('<br>')}</div>`;
}
