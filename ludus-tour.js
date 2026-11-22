// The Ludus tour (concept: docs/ludus.md, "Neues Gerüst: die Tournee"). The run travels across a campaign-style map from left to right.
// Every city is a region with its own gladiators and a ladder; the region's champion (at first its boss) stands on place 1.
// The day: every gladiator of the school has a task (fight, rest, train, work); at most one bout of the school a day. Every evening each gladiator costs his board and lodging
// (who cannot pay fights in the arena for nothing the next morning); a tournament every 10 days.
// Whoever wins a region's tournament is its new place 1 and may travel on to the right; the champion of the last column wins the run.
// State: ludus.map={ at, region, cleared[] }, ludus.regions={ [nodeId]: { champ:{ t:'npc'|'own', id } } }, ludus.tourney while a tournament runs,
// the region's gladiators live in ludus.world (field `region`), the team's honour in member.honor (counted in the region the team is in).
const LUDUS_TOUR={
  tourneyEvery:10,                  // days
  upkeepBase:2, upkeepPerCol:1,     // board and lodging, gold per gladiator and day: so much, and so much more for each column of the map (for the player's school and every gladiator of the world alike)
  wageMult:2,                       // a day of work pays twice one's board
  roster:9,                         // gladiators of a region besides its champion
  bracket:8,                        // places in a tournament
  cap:9                             // the highest region level (the experience needed doubles with every level)
};

// ---- the map ----
let ludusMapCache=null, ludusMapTerrain=null, ludusMapSeed=null;
function ludusMapWorld(){
  if(!ludusMapCache||ludusMapSeed!==ludus.seed){
    const prev=world, prevT=owTerrainCache;
    try{ world=buildWorld('lm'+ludus.seed); owTerrainCache=null; owRenderTerrain(); ludusMapTerrain=owTerrainCache; ludusMapCache=world; ludusMapSeed=ludus.seed; }
    finally{ world=prev; owTerrainCache=prevT; }
  }
  return ludusMapCache;
}
const ludusMapLastCol=w=>Math.max(...w.nodes.map(n=>n.col));
function ludusMapNeighbours(id){ const w=ludusMapWorld(); return w.edges.filter(e=>e.a===id||e.b===id).map(e=>e.a===id?e.b:e.a); }
const ludusIsRegion=n=>n.type!=='event';
const ludusRegionNode=()=>ludusMapWorld().nodes[ludus.map.region];
const ludusHere=()=>ludusMapWorld().nodes[ludus.map.at];
function ludusMapInit(){
  const w=ludusMapWorld(), start=w.nodes.find(n=>n.col===0&&ludusIsRegion(n))||w.nodes.find(n=>n.col===0);
  ludus.map={ at:start.id, region:start.id, cleared:[] }; ludus.regions={}; ludus.chronicle=[];
  w.nodes.filter(ludusIsRegion).forEach(n=>ludusRegionEnsure(n.id));       // the whole land lives from the first day
  ludusLifePlan();
}

// ---- the strength of a region: an ork of the region's level is the yardstick for its gladiators ----
const ludusRegionLevel=col=>Math.max(1,Math.min(LUDUS_TOUR.cap,1+col));
const ludusRegionTier=col=>col<3?0:(col<7?1:2);       // the gear that is usual there (crude at first, plain in the middle, fine at the end)
const ludusRegionUnit=col=>creatureWorthAt('ork',ludusRegionLevel(col));
const ludusUpkeep=col=>LUDUS_TOUR.upkeepBase+LUDUS_TOUR.upkeepPerCol*col, ludusWage=col=>LUDUS_TOUR.wageMult*ludusUpkeep(col);
// the school's board and lodging for one day (whoever fought off a debt today eats for free: the bout paid for the day)
const ludusRent=()=>ludusUpkeep(ludusRegionNode().col)*ludus.team.filter(m=>m.debtPaidDay!==ludus.day).length;
const ludusTourneyIn=()=>LUDUS_TOUR.tourneyEvery-(ludus.day%LUDUS_TOUR.tourneyEvery);
// the kinds a region's gladiators come from: the stronger kinds only further to the right
const ludusRegionKinds=col=>{ const max=1.25+0.3*col, l=arenaKinds().filter(k=>creatureWorth(k)<=max&&creatureWorth(k)>=0.38); return l.length?l:arenaKinds(); };

// a gladiator of a region: `f` is how strong against the yardstick (1 = an ork of the region's level)
function ludusNpcMake(r,regionId,f,tierShift){
  const n=ludusMapWorld().nodes[regionId], kinds=ludusRegionKinds(n.col), kind=creaturePickWeighted(r,kinds);
  return ludusEquip({ id:'n'+Math.floor(r()*1e9), name:ludusNpcName(r), kind, level:creatureLevelFor(kind,ludusRegionUnit(n.col)*f), tier:Math.max(0,Math.min(3,ludusRegionTier(n.col)+(tierShift||0))),
    seed:Math.floor(r()*1e9), status:'active', bond:0, met:0, last:null, region:regionId, honor:0, born:ludus.day, bold:r() });
}
// the region's boss: a former team of the player's whose level fits, else a strong gladiator made with the world
function ludusBossMake(r,regionId){
  const n=ludusMapWorld().nodes[regionId], L=ludusRegionLevel(n.col), used=new Set(Object.values(ludus.regions||{}).map(x=>x.ghost).filter(Boolean));
  const g=(ludusMeta.ghosts||[]).find(x=>!used.has(x.id)&&Math.abs(ludusGhostLevel(x)-(L+2))<=1);
  if(g){ const m=g.members.slice().sort((a,b)=>b.level-a.level)[0];
    return { boss:ludusEquip({ id:'n'+Math.floor(r()*1e9), name:g.name, kind:m.kind, level:m.level, tier:3, seed:m.seed, status:'active', bond:0, met:0, last:null, region:regionId, honor:999, boss:true, ghost:g.id, member:JSON.parse(JSON.stringify(m)), bold:0.5 }), ghost:g.id }; }
  const strong=ludusRegionKinds(n.col).filter(k=>creatureWorth(k)>=1); const kind=creaturePickWeighted(r,strong.length?strong:ludusRegionKinds(n.col));
  const b={ boss:{ id:'n'+Math.floor(r()*1e9), name:ludusNpcName(r), kind, level:creatureLevelFor(kind,ludusRegionUnit(n.col)*1.6),
    tier:Math.min(3,ludusRegionTier(n.col)+1), seed:Math.floor(r()*1e9), status:'active', bond:0, met:0, last:null, region:regionId, honor:999, boss:true, bold:0.5 } };
  ludusEquip(b.boss); return b;
}
// a region is filled the first time the run comes near it: its boss and its gladiators, ranked by strength (the stronger, the more honour)
function ludusRegionEnsure(id){
  ludus.regions=ludus.regions||{}; if(ludus.regions[id]) return ludus.regions[id];
  const r=ludusRng('region'+id), { boss, ghost }=ludusBossMake(r,id);
  ludus.world=ludus.world||[]; ludus.world.push(boss);
  for(let i=0;i<LUDUS_TOUR.roster;i++){ const f=1.15-0.06*i+(r()-0.5)*0.1, n=ludusNpcMake(r,id,f,i<2?1:(i>6?-1:0)); n.honor=Math.round(10*(LUDUS_TOUR.roster-i)+r()*6); ludus.world.push(n); }
  ludus.regions[id]={ champ:{ t:'npc', id:boss.id }, ghost:ghost||null };
  ludusRivalPlace(id);       // an old enemy whose strength fits this region waits here
  return ludus.regions[id];
}
const ludusChamp=id=>(ludus.regions[id]||{}).champ||null;
const ludusIsChamp=(id,t,ref)=>{ const c=ludusChamp(id); return !!c&&c.t===t&&c.id===ref; };
const ludusRegionNpcs=id=>(ludus.world||[]).filter(n=>n.region===id&&n.status==='active');
const ludusMember=id=>ludus.team.find(m=>m.id===id)||null;

// ---- the ladder of a region: its champion first, then everyone by honour ----
function ludusBoard(id){
  const champ=ludusChamp(id), rows=[];
  ludusRegionNpcs(id).forEach(n=>rows.push({ t:'npc', id:n.id, name:n.name, kind:n.kind, level:n.level, honor:n.honor||0, maimed:!!n.maimed, ghost:!!n.ghost, rival:ludusRivalOf(n)?ludusRivalRank(ludusRivalOf(n)):'', boss:!!n.boss, plan:id===ludus.map.region?ludusPlanOf(n.id):undefined, wins:n.wins||0, kills:n.kills||0, fame:n.fame||0 }));
  if(id===ludus.map.region) ludus.team.forEach(m=>rows.push({ t:'own', id:m.id, name:m.name, kind:m.kind, level:m.level, honor:m.honor||0, fame:m.fame||0 }));
  rows.forEach(x=>{ x.champ=!!champ&&champ.t===x.t&&champ.id===x.id; });
  rows.sort((a,b)=>(b.champ-a.champ)||(b.honor-a.honor)||(b.level-a.level));
  rows.forEach((x,i)=>x.rank=i+1);
  return rows;
}
const ludusRankOf=(id,t,ref)=>{ const r=ludusBoard(id).find(x=>x.t===t&&x.id===ref); return r?r.rank:99; };

// ---- the day's tasks: every gladiator of the school fights, rests, trains or works. A bout of the school takes those who are set to fight ----
const LUDUS_JOBS=[['fight','Kämpft'],['rest','Ruht'],['train','Trainiert'],['work','Arbeitet']];
const ludusJob=m=>m.job||'rest';
function ludusPicks(){ return ludus.team.filter(m=>ludusJob(m)==='fight'); }
// what the evening will bring if the day ends now, gladiator by gladiator, with board and lodging and the warnings that matter
function ludusEveningHTML(){
  const col=ludusRegionNode().col, rows=[]; let gold=ludus.gold, spend=0;
  ludus.team.forEach(m=>{
    const pct=ludusHealPct(ludusMemberCreature(m),m), job=ludusJob(m), heal=Math.round(ludusSleepHeal()*100);
    let t;
    if(job==='fight') t=`kämpft (ohne Kampf: ruht, +${heal} % Leben)`;
    else if(job==='rest') t=`ruht: +${heal} % Leben`;
    else if(job==='work'){ t=`arbeitet: +${ludusWage(col)} Gold`; gold+=ludusWage(col); }
    else if(!ludusRoomTier('training')) t='kann nicht trainieren (kein Trainingsraum) und ruht';
    else if(gold-spend<ludusTrainCost(m)) t='kann das Training nicht bezahlen und ruht';
    else { t=`trainiert: +${ludusTrainXp(m)} Erfahrung, −${ludusTrainCost(m)} Gold`; spend+=ludusTrainCost(m); }
    const duel=ludusChallengesToday().find(c=>c.own===m.id&&!c.done), foe=duel&&ludusNpc(duel.npc);
    rows.push(`<div><b>${ludusEsc(m.name)}</b> ${t}${job==='fight'&&pct<35?` <span class="luBane">⚠ nur ${pct} % Leben</span>`:''}${foe?` <span class="luBane">⚠ Duell mit ${ludusEsc(foe.name)} offen: wer nicht antritt, kneift (−${LUDUS_CHALLENGE.coward} Ehre)</span>`:''}</div>`);
  });
  const rent=ludusRent(), short=gold-spend<rent;
  rows.push(`<div>Kost und Logis: −${rent} Gold${short?' <span class="luBane">⚠ reicht nicht: morgen Schuldkampf</span>':''}</div>`);
  return `<div class="luEvening"><h4>Heute Abend</h4>${rows.join('')}</div>`;
}
function ludusSetJob(id,job){ const m=ludusMember(id); if(!m||!LUDUS_JOBS.some(j=>j[0]===job)) return; m.job=job; ludus.options=null; ludus.arenaEst=null; ludusSave(); ludusRender(); }
// the picks for a bout of `n` gladiators (the first n picked); null when fewer are picked
const ludusPickFor=n=>{ const p=ludusPicks(); return p.length>=n?p.slice(0,n):null; };
// who fights an offer: a challenge names its own gladiator (whatever his task), every other offer takes the first of those who fight today
const ludusOfferTeam=o=>o.members?(o.members.map(ludusMember).filter(Boolean).length?o.members.map(ludusMember).filter(Boolean):null):ludusPickFor(LUDUS_MODES[o.mode].size);
const ludusPickSig=()=>ludusPicks().map(m=>m.id).join(',');
// runs `fn` with the team standing for the given members (the budget functions and the match setup read ludus.team)
function ludusWithTeam(members,fn){ const keep=ludus.team; ludus.team=members; try{ return fn(); } finally { ludus.team=keep; } }

// ---- the arena: real bouts against the region's gladiators, for gold, fame, honour and standing. Who fights here can die ----
const LUDUS_MODES={
  duel:  { label:'Duell',  size:1, foes:1, mult:1 },
  double:{ label:'Doppel', size:2, foes:2, mult:1.7 },
  trio:  { label:'Trio',   size:3, foes:3, mult:2.4 },
  pack:  { label:'Rudel',  size:1, pack:true, mult:1.2 },
  ffa:   { label:'Jeder gegen jeden', size:1, ffa:true, mult:1 },     // one of the own among several gladiators, everyone for himself: the last one standing wins
  teams: { label:'Drei Teams zu zwei', size:2, ffa:true, teams:true, mult:2.2 }  // two of the own against two teams of two: the last team standing wins
};
// teams of two from a list: friends first (their relations both ways add up to 2 or more), the rest as they come (by strength)
function ludusTeamUp(l){
  const left=l.slice(), out=[];
  for(let i=0;i<left.length;i++){ const a=left[i], j=left.findIndex((b,k)=>k>i&&ludusRel(a,b)+ludusRel(b,a)>=2); if(j>0){ out.push([a,left[j]]); left.splice(j,1); left.splice(i,1); i--; } }
  for(let i=0;i+1<left.length;i+=2) out.push([left[i],left[i+1]]);
  return out;
}
// today's offers in the arena of the region: the gladiators who came to fight here today. Duels with two of them (different strength),
// a double or trio when the team can field one and enough came, and a pack (the weakest of them, together) against one
function ludusArenaOffers(){
  if(ludus.arenaOffers&&ludus.arenaOffers.day===ludus.day&&ludus.arenaOffers.region===ludus.map.region) return ludus.arenaOffers.list;
  const id=ludus.map.region, n=ludusRegionNode(), r=ludusRng('arena'+ludus.day+':'+id), L=ludusRegionLevel(n.col);
  const pool=ludusGoers('arena').sort((a,b)=>ludusGladWorth(b)-ludusGladWorth(a)), list=[];
  const add=(mode,glads)=>{
    const M=LUDUS_MODES[mode], foes=glads.map(ludusNpcFoe);
    const o={ arena:true, mode, ffa:!!M.ffa, variant:M.pack?'swarm':(M.ffa?'ffa':(foes.length>1?'group':'duel')), foes, layout:ludusLayoutPick(r), kind:foes[0].kind, level:Math.max(...foes.map(f=>f.level)), name:foes[0].name };
    o.title=(M.pack?'Rudel: ':'')+(foes.length>1?foes.map(f=>f.name).join(', '):`${foes[0].name} (${SPECIES[foes[0].kind].label})`);       // several foes: their names (one pair of brackets per title, so the translation reads it right)
    o.baseReward=Math.round((14+9*L)*(M.pack?1+0.3*foes.length:(M.ffa&&!M.teams?0.8+0.5*foes.length:M.mult))*ludusHallMult());
    list.push(o);
  };
  // the day's challenges come first: a duel against the challenged (or challenging) gladiator, with the own gladiator named in it
  ludusChallengesToday().filter(c=>!c.done&&ludusMember(c.own)&&ludusNpc(c.npc)&&ludusNpc(c.npc).status==='active'&&ludusNpc(c.npc).region===id).forEach(c=>{
    add('duel',[ludusNpc(c.npc)]); const o=list[list.length-1]; o.challenge=c.id; o.members=[c.own]; o.baseReward=Math.round(o.baseReward*1.5); o.title=`Herausforderung: ${o.title}`; });
  if(pool.length) add('duel',[pool[Math.floor(pool.length/2)]]);
  if(pool.length>1){ const first=list[list.length-1].foes[0].npc; add('duel',[pool.find(x=>x.id!==first)]); }
  if(ludus.team.length>=3&&pool.length>=3) add('trio',pool.slice(0,3));
  else if(ludus.team.length>=2&&pool.length>=2) add('double',pool.slice(pool.length-2));
  if(pool.length>=3) add('pack',pool.slice(-Math.min(4,pool.length)));
  if(pool.length>=4){ const k=Math.min(4,pool.length-1), at=Math.floor(r()*(pool.length-k+1)); add('ffa',pool.slice(at,at+k)); }
  if(ludus.team.length>=2&&pool.length>=4){ const t=ludusTeamUp(pool).slice(0,2); if(t.length===2){ add('teams',[].concat(...t)); const o=list[list.length-1]; o.groups=[[0,1],[2,3]]; o.title=t.map(p=>p.map(n=>n.name).join(' & ')).join(', '); } }
  ludus.arenaOffers={ day:ludus.day, region:id, list }; return list;
}
// the prize falls as the chances rise: a long shot pays up to twice as much, a sure thing half
const ludusArenaReward=(o,est)=>Math.max(5,Math.round(o.baseReward*(est===undefined?1:Math.max(0.5,Math.min(2,1.6-1.1*est)))));
// the chances of the offers for today's line-up (a few test fights each, in the background)
function ludusArenaScout(){
  const sig=ludusPickSig()+'|'+ludus.day+'|'+ludus.map.region; if(ludusBusy||(ludus.arenaEst&&ludus.arenaEst.sig===sig)) return;
  const offers=ludusArenaOffers(), run=ludus, est={}; ludusBusy=true;
  const step=i=>{
    if(ludus!==run){ ludusBusy=false; return; }
    if(i>=offers.length){ run.arenaEst={ sig, est }; ludusBusy=false; ludusSave(); if(screen==='ludus') ludusRender(); return; }
    const o=offers[i], team=ludusOfferTeam(o);
    if(team){ try{ const res=arenaSimulate(ludusMatchSetup(o,'scout',team),SCOUT_RUNS,null); est[i]=res.wins[0]/SCOUT_RUNS; }catch(e){ console.error(e); } }
    setTimeout(()=>step(i+1),20);
  };
  setTimeout(()=>step(0),30);
}
function ludusArenaFight(i){
  const o=ludusArenaOffers()[i]; if(!o||ludus.forced||ludus.over) return;
  const team=ludusOfferTeam(o); if(!team) return;
  const est=ludus.arenaEst&&ludus.arenaEst.sig===ludusPickSig()+'|'+ludus.day+'|'+ludus.map.region?ludus.arenaEst.est[i]:undefined;
  ludusFight(Object.assign({},o,{ members:team.map(m=>m.id), est, reward:ludusArenaReward(o,est) }));
}
// what a won or lost arena bout does to the ladder: the winners take honour, the losers give some
function ludusHonor(o,won,team){
  const foes=ludusFoes(o).map(f=>f.npc&&ludusNpc(f.npc)).filter(Boolean);
  const gain=10*Math.max(1,foes.length)+(foes.some(n=>(n.honor||0)>Math.max(...team.map(m=>m.honor||0)))?10:0);
  const bonus=o.challenge?LUDUS_CHALLENGE.bonus:0;       // a challenge is a matter of honour: 10 more to the winner
  if(won){ team.forEach(m=>{ m.honor=(m.honor||0)+gain+bonus; }); foes.forEach(n=>{ n.honor=Math.max(0,(n.honor||0)-5); }); return gain+bonus; }
  team.forEach(m=>{ m.honor=Math.max(0,(m.honor||0)-5); }); foes.forEach(n=>{ n.honor=(n.honor||0)+8+bonus; if(bonus) n.fame=ludusFame(n)+1; }); return -5;
}

// ---- board and lodging: every evening; a school that cannot pay pays nothing, and the next morning one of its gladiators fights the debt off in the arena, for nothing ----
function ludusPayUpkeep(){
  const cost=ludusRent();
  if(cost<=0) return '';
  if(ludus.gold>=cost){ ludus.gold-=cost; return `Kost und Logis: −${cost} Gold.`; }
  ludus.debt=true; ludusLog('Kost und Logis nicht bezahlt'); return `Kost und Logis (${cost} Gold) konnten nicht bezahlt werden: morgen muss jemand die Schuld in der Arena abkämpfen.`;
}
function ludusRentBout(){
  const id=ludus.map.region, r=ludusRng('rent'+ludus.day), goers=ludusGoers('arena'), pool=goers.length?goers:ludusRegionNpcs(id).filter(x=>!x.maimed&&!x.boss&&!ludusIsChamp(id,'npc',x.id));
  const n=pool.length?pool[Math.floor(r()*pool.length)]:null, f=n?ludusNpcFoe(n):{ kind:'ork', level:ludusRegionLevel(ludusRegionNode().col), tier:0, seed:Math.floor(r()*1e9), name:'Schuldeneintreiber' };
  return { arena:true, rent:true, mode:'duel', variant:'duel', foes:[f], kind:f.kind, level:f.level, name:f.name, title:`${f.name} (${SPECIES[f.kind].label})`, layout:ludusLayoutPick(r), reward:0 };
}

// ---- the tournament: every 10 days, all gladiators of the region, a knock-out tree of 8, one round a day. The champion is seeded first ----
function ludusTourneyStart(){
  const id=ludus.map.region, champ=ludusChamp(id), board=ludusBoard(id);
  const own=ludus.team.map(m=>({ t:'own', id:m.id })), champE=champ&&(champ.t==='own'?ludusMember(champ.id):ludusNpc(champ.id))?{ t:champ.t, id:champ.id }:null;
  const rest=board.filter(x=>!(champE&&x.t===champE.t&&x.id===champE.id)&&!x.maimed);
  // seeds: the champion, then the ladder; every own gladiator must take part, so the weakest strangers make room for them
  const seeds=champE?[champE]:[], ownLeft=own.filter(e=>!(champE&&champE.t==='own'&&champE.id===e.id));
  const room=Math.max(0,LUDUS_TOUR.bracket-seeds.length-ownLeft.length), npcs=new Set(rest.filter(x=>x.t==='npc').slice(0,room).map(x=>x.id));
  rest.forEach(x=>{ if(x.t==='own'||npcs.has(x.id)) seeds.push({ t:x.t, id:x.id }); });
  const order=[0,7,3,4,1,6,2,5], slots=order.map(i=>seeds[i]||null);
  ludus.tourney={ region:id, round:0, slots, results:[], played:{} };
  ludus.forced={ type:'tourney' };
  ludusLog(`Turnier in ${ludusRegionNode().name}`);
}
const ludusTourneyRoundName=(n)=>n>=8?'Viertelfinale':(n>=4?'Halbfinale':'Finale');
const ludusEntryName=e=>{ if(!e) return '—'; const x=e.t==='own'?ludusMember(e.id):ludusNpc(e.id); return x?x.name:'—'; };
const ludusEntryAlive=e=>!!e&&(e.t==='own'?!!ludusMember(e.id):(()=>{ const n=ludusNpc(e.id); return !!n&&n.status==='active'; })());
const ludusEntryFoe=e=>ludusNpcFoe(ludusNpc(e.id));
const ludusEntryGlad=e=>e.t==='own'?ludusMember(e.id):ludusNpc(e.id);
// the pairs of the current round: [a, b, index]
const ludusTourneyPairs=()=>{ const s=ludus.tourney.slots, out=[]; for(let i=0;i<s.length;i+=2) out.push([s[i],s[i+1],i/2]); return out; };
// the next pair of this round the player has to fight (an own gladiator against a stranger), or null
function ludusTourneyNext(){
  const t=ludus.tourney; if(!t) return null;
  return ludusTourneyPairs().find(([a,b,i])=>t.played[i]===undefined&&ludusEntryAlive(a)&&ludusEntryAlive(b)&&((a.t==='own')!==(b.t==='own')))||null;
}
function ludusTourneyBout(){
  const p=ludusTourneyNext(); if(!p) return null;
  const [a,b,i]=p, own=a.t==='own'?a:b, foe=a.t==='own'?b:a, f=ludusEntryFoe(foe), n=ludusRegionNode(), L=ludusRegionLevel(n.col), final=ludus.tourney.slots.length===2;
  return { arena:true, tourney:true, pair:i, final, mode:'duel', variant:'duel', foes:[f], members:[own.id], kind:f.kind, level:f.level, name:f.name,
    title:`${ludusTourneyRoundName(ludus.tourney.slots.length)}: ${f.name} (${SPECIES[f.kind].label})`, foeTitle:`${f.name} (${SPECIES[f.kind].label})`, layout:ludusLayoutPick(ludusRng('tl'+ludus.day+':'+i)), reward:Math.round((12+8*L)*(final?3:1.5)*ludusHallMult()) };
}
// a bout of the tournament without the player's say (strangers among themselves, or two of the player's own): fought out by the engine
function ludusTourneySim(a,b,i){
  const ga=ludusEntryGlad(a), gb=ludusEntryGlad(b), res=ludusLifeBout([ga],[gb],'arena','t'+ludus.day+':'+i);
  ludusLifeAfterBout([[ga],[gb]],res,'tourney',ludus.tourney.region);
  res.dead.forEach(n=>{ if(ludusMember(n.id)){ ludus.team=ludus.team.filter(m=>m.id!==n.id); ludus.sel=Math.max(0,Math.min(ludus.sel,ludus.team.length-1)); } });
  return res.winner===0;
}
// called after an own bout of the tournament (won: the own gladiator goes on)
function ludusTourneyResult(o,won){
  const t=ludus.tourney; if(!t) return '';
  const [a,b]=ludusTourneyPairs()[o.pair], ownFirst=a.t==='own'&&o.members.includes(a.id);
  t.played[o.pair]=(won===ownFirst)?0:1;
  if(won){ const m=ludusMember(o.members[0]); if(m) m.honor=(m.honor||0)+15; }
  return ludusTourneyNext()?'':ludusTourneyCloseRound();
}
// the round ends: the other pairs are fought out, the winners move on; after the final the region has its champion
function ludusTourneyCloseRound(){
  const t=ludus.tourney, next=[], lines=[];
  ludusTourneyPairs().forEach(([a,b,i])=>{
    let w;
    if(t.played[i]!==undefined) w=t.played[i]===0?a:b;
    else if(!ludusEntryAlive(a)||!ludusEntryAlive(b)) w=ludusEntryAlive(a)?a:(ludusEntryAlive(b)?b:null);
    else { w=ludusTourneySim(a,b,i)?a:b; lines.push(`${ludusEntryName(w)} schlägt ${ludusEntryName(w===a?b:a)}`); }
    next.push(w);
    if(w&&w.t==='npc'){ const n=ludusNpc(w.id); if(n) n.honor=(n.honor||0)+15; }
  });
  t.results.push(lines); t.round++; t.slots=next; t.played={};
  let text=lines.length?' Weitere Kämpfe: '+lines.join(', ')+'.':'';
  if(next.length===1||next.filter(Boolean).length<=1) text+=ludusTourneyEnd(next.find(Boolean)||null);
  return text;
}
function ludusTourneyEnd(w){
  const id=ludus.tourney.region, n=ludusMapWorld().nodes[id], last=n.col===ludusMapLastCol(ludusMapWorld());
  ludus.tourney=null; if(ludus.forced&&ludus.forced.type==='tourney') ludus.forced=null;
  let t='';
  if(w){
    const prev=ludusChamp(id); ludus.regions[id].champ={ t:w.t, id:w.id };
    if(w.t==='own'){
      const m=ludusMember(w.id), gold=40+30*n.col; ludus.gold+=gold; ludus.fame+=3+n.col; ludusGainRenown(Math.round((15+5*n.col)*ludusHallMult()));
      if(!ludus.map.cleared.includes(id)) ludus.map.cleared.push(id);
      ludus.giftChoice=genGiftOffer(Math.random,ludusMemberCreature(m),ludus.fame);
      const beat=prev&&prev.t==='npc'?ludusNpc(prev.id):null; if(beat&&beat.ghost){ const g=(ludusMeta.ghosts||[]).find(x=>x.id===beat.ghost); if(g){ ludusMeta.ghosts=ludusMeta.ghosts.filter(x=>x!==g); t+=` ${g.name} tritt ab.`; } }
      t+=` ${m.name} gewinnt das Turnier von ${n.name} und steht nun auf Platz 1! +${gold} Gold.`;
      ludusLog(`Turniersieg in ${n.name}`);
      if(last){ ludus.over=true; ludus.cause='Platz 1 der Hauptstadt: du bist Champion des Landes!'; ludusMeta.titles=(ludusMeta.titles||0)+1; ludusRivalSync(); ludusSaveGhost(ludus.team,'',true); ludusLegacyEnd(ludus.team); ludusMeta.bestWins=Math.max(ludusMeta.bestWins,ludus.wins); ludusMeta.bestDays=Math.max(ludusMeta.bestDays,ludus.day); t+=' Das Land liegt dir zu Füßen.'; }
    } else t+=` ${ludusEntryName(w)} gewinnt das Turnier von ${n.name}.`;
  }
  ludusRegionAfterTourney(id);
  if(ludus.debt&&!ludus.over){ ludus.debt=false; ludus.forced={ type:'rent' }; }
  return t;
}
// after a tournament the region changes: some gladiators leave, the others grow, rookies come in; the maimed are healed
function ludusRegionAfterTourney(id){
  ludusRegionNpcs(id).forEach(n=>{ n.maimed=false; });
  ludusLifeMigrate();
}

// ---- the calendar, called when a day has passed ----
function ludusCalendar(){
  if(ludus.over) return;
  if(ludus.tourney){ ludus.forced={ type:'tourney' }; return; }
  const atRegion=ludusIsRegion(ludusHere());
  if(ludus.day%LUDUS_TOUR.tourneyEvery===0) ludusLifeTourneys();
  if(ludus.day%LUDUS_TOUR.tourneyEvery===0&&atRegion){ ludusTourneyStart(); return; }       // a debt waits until the tournament is over
  if(ludus.debt){ ludus.debt=false; ludus.forced={ type:'rent' }; }
}

// ---- travel: to the right only, and only from a region the team has won (waypoints in between are free) ----
const ludusMayLeave=()=>!ludusIsRegion(ludusHere())||ludus.map.cleared.includes(ludus.map.at);
const ludusCanTravel=id=>{ const w=ludusMapWorld(), here=ludusHere(), to=w.nodes[id]; return !!to&&ludusMapNeighbours(here.id).includes(id)&&to.col>here.col&&ludusMayLeave(); };
function ludusMapTravel(id){
  if(ludus.over||ludus.forced||ludus.event||ludus.giftChoice||ludus.verdict||!ludusCanTravel(id)) return;
  const w=ludusMapWorld(), from=ludus.map.region, n=w.nodes[id];
  // the champion who leaves gives up the title: the region's best stranger takes place 1
  if(ludusIsChamp(from,'own',(ludusChamp(from)||{}).id)){ const best=ludusRegionNpcs(from).filter(x=>!x.maimed).sort((a,b)=>(b.honor||0)-(a.honor||0))[0]; if(best) ludus.regions[from].champ={ t:'npc', id:best.id }; }
  ludus.map.at=id; ludusLog(`Reise nach ${n.name}`);
  if(ludusIsRegion(n)){ ludus.map.region=id; ludusRegionEnsure(id); ludus.team.forEach(m=>{ m.honor=0; }); ludus.arenaOffers=null; ludus.arenaEst=null; }
  ludusAdvanceDay([],true);       // a day on the road: everybody rests a little, nobody works or trains
  if(n.type==='event'&&!ludus.forced&&!ludus.event){ ludusMaybeEvent(); if(!ludus.event){ const g=8+3*n.col; ludus.gold+=g; ludusNote=`Am Wegesrand liegt etwas Gold: +${g}.`; } }
  ludusSave(); ludusRender();
}

// ---- on screen ----
function ludusMapDraw(){
  const cv=document.getElementById('luMapCanvas'); if(!cv) return;
  const w=ludusMapWorld(), g=cv.getContext('2d'), done=new Set(ludus.map.cleared), at=ludus.map.at, T=OW_TILE;
  const near=new Set(ludusMapNeighbours(at).filter(ludusCanTravel));
  g.drawImage(ludusMapTerrain,0,0);
  g.fillStyle='rgba(52,16,60,0.5)';
  for(let y=0;y<OW_ROWS;y++) for(let x=0;x<OW_COLS;x++){ if(w.terrain[y][x]==='water') continue; const nd=w.nodes[w.regionOf[y*OW_COLS+x]]; if(nd&&done.has(nd.id)) g.fillRect(x*T,y*T,T,T); }
  w.edges.forEach(e=>{ const a=w.nodes[e.a], b=w.nodes[e.b], live=(e.a===at&&near.has(e.b))||(e.b===at&&near.has(e.a)); g.strokeStyle=live?'#e6c36a':'rgba(70,45,25,0.85)'; g.lineWidth=live?3:2; g.setLineDash(live?[]:[5,4]); g.beginPath(); g.moveTo(a.x*T+T/2,a.y*T+T/2); g.lineTo(b.x*T+T/2,b.y*T+T/2); g.stroke(); });
  g.setLineDash([]);
  g.font='bold 11px sans-serif'; g.textAlign='center'; g.textBaseline='middle';
  w.nodes.forEach(n=>{
    const px=n.x*T+T/2, py=n.y*T+T/2, isDone=done.has(n.id);
    if(near.has(n.id)){ g.fillStyle='rgba(255,215,90,0.35)'; g.beginPath(); g.arc(px,py,17,0,Math.PI*2); g.fill(); }
    if(n.id===at){ g.strokeStyle='#7fe0ff'; g.lineWidth=2; g.beginPath(); g.arc(px,py,16,0,Math.PI*2); g.stroke(); }
    g.fillStyle='rgba(10,6,4,0.78)'; g.beginPath(); g.arc(px,py,12,0,Math.PI*2); g.fill();
    g.strokeStyle=isDone?'#8a4aa8':'#c9b98a'; g.lineWidth=1.5; g.beginPath(); g.arc(px,py,12,0,Math.PI*2); g.stroke();
    owGlyph(g,n.type,px,py,isDone);
    if(ludusIsRegion(n)&&!isDone){ const txt=String(ludusRegionLevel(n.col)), tw=g.measureText(txt).width+8; g.fillStyle='rgba(10,6,4,0.85)'; g.fillRect(px-tw/2,py+13,tw,13); g.fillStyle='#e8d870'; g.fillText(txt,px,py+19.5); }
  });
}
function ludusMapHTML(){
  const w=ludusMapWorld(), n=ludusHere(), lt=LOCATION_TYPES[n.type], region=ludusIsRegion(n), busy=!!(ludus.forced||ludus.event||ludus.giftChoice);
  const near=ludusMapNeighbours(n.id).map(id=>w.nodes[id]).filter(m=>m.col>n.col);
  let info='';
  if(region){
    const champ=ludusChamp(n.id), won=ludus.map.cleared.includes(n.id);
    info=`<p>Stufe der Region: <b>${ludusRegionLevel(n.col)}</b> · Platz 1: <b>${ludusEsc(ludusEntryName(champ))}</b>${champ&&champ.t==='own'?' (dein Kämpfer)':''}<br>Nächstes Turnier in ${ludusTourneyIn()} Tagen (Tag ${ludus.day+ludusTourneyIn()}).</p>
      <p class="${won?'luHint':'luBane'}">${won?'Du hast diese Region gewonnen: du darfst weiterziehen, oder bleiben und den Titel verteidigen.':'Weiter geht es erst, wenn einer deiner Kämpfer das Turnier gewinnt und Platz 1 wird.'}</p>`;
  }
  return `<div class="luPanel"><h2>Karte</h2><p class="luHint">Die Tournee führt von links nach rechts. Jede Stadt ist eine Region mit eigener Rangliste; auf Platz 1 steht ihr Boss. Alle ${LUDUS_TOUR.tourneyEvery} Tage ist Turnier: wer es gewinnt, ist Platz 1 und darf weiterziehen. Eine Reise kostet einen Tag je Etappe. Wer Platz 1 der Hauptstadt wird, gewinnt.</p>
    <canvas id="luMapCanvas" width="${OW_COLS*OW_TILE}" height="${OW_ROWS*OW_TILE}" style="width:100%;max-width:960px;border:1px solid #5a4a30"></canvas>
    <p><b>${ludusEsc(n.name)}</b>${lt?' — '+Tr(lt.label):''}</p>${info}
    <div class="luOpts">${near.map(m=>`<button data-travel="${m.id}" ${busy||!ludusCanTravel(m.id)?'disabled':''}>${ludusEsc(m.name)}${ludusIsRegion(m)?' · '+Tr('Stufe')+' '+ludusRegionLevel(m.col):''}</button>`).join(' ')}</div></div>`;
}
function ludusMapWire(el){
  if(ludusTab!=='map'||!ludus.map) return;
  ludusMapDraw();
  el.querySelectorAll('[data-travel]').forEach(b=>b.addEventListener('click',()=>ludusMapTravel(+b.dataset.travel)));
  const cv=document.getElementById('luMapCanvas');
  if(cv) cv.addEventListener('click',e=>{ const r=cv.getBoundingClientRect(), k=cv.width/r.width, x=(e.clientX-r.left)*k, y=(e.clientY-r.top)*k, w=ludusMapWorld();
    const hit=w.nodes.find(n=>Math.hypot(n.x*OW_TILE+OW_TILE/2-x,n.y*OW_TILE+OW_TILE/2-y)<16); if(hit) ludusMapTravel(hit.id); });
}
// the ladder of the region and, while it runs, the tournament tree
function ludusBoardHTML(){
  const n=ludusRegionNode(), rows=ludusBoard(n.id);
  const row=x=>`<div class="luItem${x.t==='own'?' sel':''}"><span>${x.rank}. ${x.champ?'👑 ':''}${ludusEsc(x.name)} — ${SPECIES[x.kind].label}, Stufe ${x.level}${x.ghost?' · früheres Team':''}${x.rival?' · '+x.rival:''}${x.maimed?' · verletzt':''}${x.plan?' · '+LUDUS_PLAN_LABEL[x.plan]:''}${x.t==='npc'?` · ${x.wins} Siege${x.kills?', '+x.kills+' getötet':''}`:''}${x.fame?' · Ruhm '+x.fame:''}</span><span>${x.champ?'Platz 1':x.honor+' Ehre'}</span></div>`;
  return `<div class="luPanel"><h2>Rangliste von ${ludusEsc(n.name)}</h2><p class="luHint">Auf Platz 1 steht der Champion der Region, anfangs ihr Boss. Darunter zählt die Ehre: Arenasiege bringen Ehre, Niederlagen kosten welche. Alle ${LUDUS_TOUR.tourneyEvery} Tage ist Turnier, alle Kämpfer der Region müssen antreten. Nächstes Turnier in <b>${ludusTourneyIn()} Tagen</b>.</p>
    ${ludus.tourney?ludusTourneyHTML():''}${rows.map(row).join('')}${ludusChronicleHTML()}</div>`;
}
function ludusTourneyHTML(){
  const t=ludus.tourney, pairs=ludusTourneyPairs();
  return `<h3>${ludusTourneyRoundName(t.slots.length)}</h3>${pairs.map(([a,b,i])=>{ const r=t.played[i]; return `<div class="luItem"><span>${ludusEsc(ludusEntryName(a))}${a&&a.t==='own'?' ★':''} — ${ludusEsc(ludusEntryName(b))}${b&&b.t==='own'?' ★':''}</span><span>${r===undefined?'':(r===0?ludusEsc(ludusEntryName(a)):ludusEsc(ludusEntryName(b)))+' ✓'}</span></div>`; }).join('')}`;
}
// the alliances of a free for all: who stands together already, and whom the school can ask (his price, or why not)
function ludusPactHTML(o,i){
  const ai=ludusAiPacts(o), name=k=>ludusEsc(ludusSideName(o,k)), rows=ai.map(p=>`<br><small>Verbündet: ${name(p[0])} und ${name(p[1])}</small>`);
  if(o.pact) rows.push(`<br><small>Dein Bündnis: ${name(o.pact)}</small>`);
  else ludusFfaSides(o).forEach((g,k)=>{ const s=k+1; if(!ludusSideNpcs(o,s).length||ai.some(p=>p.includes(s))) return; const fee=ludusSidePactFee(o,s);
    rows.push(fee===null?`<br><small>${name(s)}: kein Bündnis</small>`:`<br><button data-pact="${i}:${s}" ${ludus.gold<fee?'disabled':''}>Bündnis mit ${name(s)} · ${fee?fee+' Gold':'umsonst'}</button>`); });
  return rows.join('');
}
function ludusArenaHTML(){
  const offers=ludusArenaOffers(), sig=ludusPickSig()+'|'+ludus.day+'|'+ludus.map.region, est=ludus.arenaEst&&ludus.arenaEst.sig===sig?ludus.arenaEst.est:null;
  const picks=ludusPicks();
  return `<div class="luPanel"><h2>Arena von ${ludusEsc(ludusRegionNode().name)}</h2><p class="luHint">Echte Kämpfe gegen die Gladiatoren der Region, um Gold, Ruhm, Ansehen und Ehre. Wer hier kämpft, kann sterben (aufgeben und ohnmächtig werden geht weiterhin). Je schlechter die Aussichten, desto höher der Preis. Es treten die an, die heute kämpfen (die ersten so viele, wie die Kampfart braucht): ${picks.length?picks.map(m=>ludusEsc(m.name)).join(', '):'niemand'}.</p>${offers.length?'':'<p><i>Heute ist niemand in die Arena gekommen.</i></p>'}
    <div class="luOpts">${offers.map((o,i)=>{ const M=LUDUS_MODES[o.mode], team=ludusOfferTeam(o), can=!!team, e=est&&est[i]; return `<div class="luOption"><div class="luDiff d-${e===undefined||e===null?'fair':(e>=0.65?'easy':(e>=0.4?'fair':'hard'))}">${M.label}${M.pack||M.teams?'':(M.ffa?` (${o.foes.length+1} Kämpfer)`:` (${M.size} gegen ${M.foes})`)}</div><canvas class="luArPrev" data-opt="${i}" width="100" height="100"></canvas><div><b>${ludusEsc(o.title)}</b><br>Stufe ${o.level}${o.layout&&o.layout!=='pit'?' · Arena: '+ludusLayoutLabel(o.layout):''}<br>${e===undefined||e===null?(can?'Aussichten werden geprüft …':''):'Aussichten: '+Math.round(e*100)+' %'}${o.challenge&&team?'<br>Es kämpft '+ludusEsc(team[0].name)+' (+'+LUDUS_CHALLENGE.bonus+' Ehre beim Sieg; wer nicht kommt, kneift)':''}<br>Preis: ${ludusArenaReward(o,e===null?undefined:e)} Gold${o.ffa?ludusPactHTML(o,i):''}</div><button data-arena="${i}" class="menuMain" ${can?'':'disabled'}>${can?'Kämpfen':`Stelle ${M.size} auf Kämpft`}</button></div>`; }).join('')}</div>${ludusRoomBox('hall')}</div>`;
}
