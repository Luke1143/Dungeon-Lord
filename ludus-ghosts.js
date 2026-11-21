// Ghosts: the team of an ended run stands on the ladder of the next runs, as a rival team (it killed you, or it was the champion).
// ludusMeta.ghosts=[{ id, name, killer, champion, members:[{kind,name,level,xp,gifts,inventory,learned,seed}] }]; they replace the ladder figure of their strength
const LUDUS_GHOST_MAX=10;
function ludusSaveGhost(team,killer,champion){
  const members=team.map((m,i)=>({ id:'g'+i, kind:m.kind, name:m.name, level:m.level, xp:m.xp, seed:m.seed, gifts:JSON.parse(JSON.stringify(m.gifts||[])), inventory:JSON.parse(JSON.stringify(m.inventory||[])), learned:(m.learned||[]).slice() }));
  ludusMeta.ghosts=(ludusMeta.ghosts||[]).concat([{ id:'gh'+Date.now().toString(36)+Math.floor(Math.random()*1e4), name:members[0].name+(members.length>1?' & Co':''), killer:killer||'', champion:!!champion, members }]);
  if(ludusMeta.ghosts.length>LUDUS_GHOST_MAX){ const weakest=ludusMeta.ghosts.reduce((a,b)=>(ludusGhostLevel(b)+(b.champion?99:0)<ludusGhostLevel(a)+(a.champion?99:0)?b:a)); ludusMeta.ghosts=ludusMeta.ghosts.filter(x=>x!==weakest); }       // the list is full: the weakest goes, champions stay
}
const ludusGhostLevel=g=>Math.round(g.members.reduce((a,m)=>a+m.level,0)/g.members.length);

// ---- the nemesis: whoever kills or executes one of the school's gladiators becomes its nemesis and outlives the run ----
// He keeps his name, kind, gear, fame and his tally (who of yours he killed, when, how), and grows a level for every run he outlives.
// In the next run he waits in the region whose level fits him (region level = his level − 1, at least the first), hostile to the school (−3) and bold:
// he is likely to challenge your best. Every 4 days a nemesis who is elsewhere moves one region nearer to the school (he hunts it).
// His rank grows with his victims and the runs he outlived: Erzfeind, then Geißel (3), then Schrecken der Schulen (6).
// Whoever of yours kills or executes him takes revenge (+5 fame); then he is gone for good, as he is when he dies otherwise. His friends bear the school a grudge (−2),
// and his best friend (relation 2 or more) swears revenge: he becomes the next nemesis.
// ludusMeta.nemeses=[{ id, name, kind, level, xp, seed, inventory, learned, fame, execs, bold, victims:[{ name, kind, how, day, run }], runs, sworn }]
const LUDUS_NEMESIS={ max:5, revenge:5, huntEvery:4, ranks:[[6,'Schrecken der Schulen'],[3,'Geißel'],[0,'Erzfeind']] };
const ludusNemesisRank=e=>{ const v=(e.victims||[]).length+(e.runs||0); return LUDUS_NEMESIS.ranks.find(([k])=>v>=k)[1]; };
// the killer of a bout: the strongest foe who still stands (of the winning side, if a foe's side won)
function ludusKillerOf(st){
  const wi=st.arena.winner, sides=(st.arena.roster||[]).map((s,ti)=>ti).filter(ti=>ti!==0&&(wi<=0||ti===wi));       // the school won or nobody did: any foe still standing
  const l=[].concat(...sides.map(ti=>st.arena.roster[ti]||[])).filter(c=>c.npcId&&!c.removed&&!c.dead&&st.creatures.includes(c)).map(c=>ludusNpc(c.npcId)).filter(n=>n&&n.status==='active');
  return l.sort((a,b)=>b.level-a.level)[0]||null;
}
const ludusNemesisCopy=(e,n)=>Object.assign(e,{ level:n.level, xp:n.xp, inventory:JSON.parse(JSON.stringify(n.inventory||[])), learned:(n.learned||[]).slice(), fame:n.fame||0, execs:n.execs||0 });
// a gladiator of the world has killed (how: 'kill' or 'exec') some of the school's own, or swears revenge ('oath', no victims): he is (or stays) a nemesis
function ludusNemesisMark(killer,victims,how,sworn){
  if(!killer||killer.status!=='active'||ludusMember(killer.id)) return;
  let list=(ludusMeta.nemeses||[]).slice(), e=killer.nemesis&&list.find(x=>x.id===killer.nemesis);
  const before=e?ludusNemesisRank(e):null;
  if(!e){ e={ id:'ne'+Date.now().toString(36)+Math.floor(Math.random()*1e4), name:killer.name, kind:killer.kind, seed:killer.seed, bold:Math.max(0.7,killer.bold||0), victims:[], runs:0, sworn:sworn||'' }; list.push(e); killer.nemesis=e.id; }
  ludusNemesisCopy(e,killer); killer.bond=-3; killer.bold=Math.max(killer.bold||0,0.7);
  (victims||[]).forEach(v=>e.victims.push({ name:v.name, kind:v.kind, how, day:ludus.day, run:(ludusMeta.runs||0) }));
  // the list keeps the five worst: most victims first
  if(list.length>LUDUS_NEMESIS.max){ list.sort((a,b)=>(b.victims||[]).length-(a.victims||[]).length); list=list.slice(0,LUDUS_NEMESIS.max); }
  ludusMeta.nemeses=list;
  if(!list.includes(e)) return;
  const region=killer.region, rank=ludusNemesisRank(e);
  if(!before) ludusChron(region,'nemesis',sworn?`${killer.name} schwört Rache für ${sworn}: ein neuer Erzfeind.`:`${killer.name} wird zum Erzfeind deiner Schule.`);
  else if(rank!==before) ludusChron(region,'nemesis',`${killer.name} steigt auf: ${rank}.`);
}
// the world's nemeses, written back into the meta: the living ones as they are now, the dead and the gone struck off
function ludusNemesisSync(){
  if(!ludus||!ludus.world) return;
  let list=(ludusMeta.nemeses||[]).slice();
  ludus.world.filter(n=>n.nemesis).forEach(n=>{ const e=list.find(x=>x.id===n.nemesis); if(!e) return; if(n.status!=='active') list=list.filter(x=>x!==e); else ludusNemesisCopy(e,n); });
  ludusMeta.nemeses=list;
}
// the hunt: every 4 days a nemesis who is not where the school is moves one region nearer along the roads (a waypoint is passed); a champion keeps his region
function ludusNemesisStep(from,to){
  const w=ludusMapWorld(), dist={ [to]:0 }, q=[to];
  while(q.length){ const x=q.shift(); ludusMapNeighbours(x).forEach(y=>{ if(dist[y]===undefined){ dist[y]=dist[x]+1; q.push(y); } }); }
  if(dist[from]===undefined) return null;
  let at=from; do{ at=ludusMapNeighbours(at).sort((a,b)=>(dist[a]??1e9)-(dist[b]??1e9))[0]; } while(at!==undefined&&at!==to&&!ludusIsRegion(w.nodes[at]));
  return at===undefined?null:at;
}
function ludusNemesisHunt(){
  if(ludus.day%LUDUS_NEMESIS.huntEvery||ludus.tourney) return;
  const goal=ludus.map.region, w=ludusMapWorld();
  (ludus.world||[]).filter(n=>n.nemesis&&n.status==='active'&&n.region!==goal&&!ludusIsChamp(n.region,'npc',n.id)).forEach(n=>{
    const to=ludusNemesisStep(n.region,goal); if(to===null||to===n.region) return;
    n.region=to; n.boss=false; ludusRegionEnsure(to);
    ludusChron(to,'nemesis',to===goal?`${n.name} ist in ${w.nodes[to].name} angekommen und sucht deine Schule.`:`${n.name} folgt deiner Schule nach ${w.nodes[to].name}.`);
  });
}
// a new run: every nemesis has grown a level since; they enter the world when their region is first filled (ludusRegionEnsure)
function ludusNemesisGrow(){ (ludusMeta.nemeses||[]).forEach(e=>{ e.level=Math.min(40,(e.level||1)+1); e.xp=xpForLevel(e.level); e.runs=(e.runs||0)+1; }); }
const ludusNemesisCol=e=>Math.max(0,(e.level||1)-2);       // region level = col + 1 = his level − 1
function ludusNemesisPlace(id){
  const col=ludusMapWorld().nodes[id].col, here=new Set((ludus.world||[]).filter(n=>n.nemesis).map(n=>n.nemesis));
  (ludusMeta.nemeses||[]).forEach(e=>{
    if(here.has(e.id)||Math.min(ludusNemesisCol(e),LUDUS_TOUR.cap-1)!==Math.min(col,LUDUS_TOUR.cap-1)) return;
    const n=ludusEquip({ id:'n'+e.id, name:e.name, kind:e.kind, level:e.level, xp:e.xp, seed:e.seed, inventory:JSON.parse(JSON.stringify(e.inventory||[])), learned:(e.learned||[]).slice(),
      status:'active', bond:-3, met:1, last:null, region:id, honor:60, born:ludus.day, bold:e.bold||0.8, fame:e.fame||0, execs:e.execs||0, nemesis:e.id });
    ludus.world.push(n); ludusChron(id,'nemesis',`${n.name} ist wieder da und hat deine Schule nicht vergessen.`);
  });
}
const ludusNemesisOf=n=>n&&n.nemesis&&(ludusMeta.nemeses||[]).find(e=>e.id===n.nemesis)||null;
// what the school remembers of him (the card)
function ludusNemesisText(n){
  const e=ludusNemesisOf(n); if(!e) return '';
  return [`${ludusNemesisRank(e)} deiner Schule${e.sworn?`, hat Rache für ${e.sworn} geschworen`:''}.`].concat(e.victims.slice(-3).map(x=>`${x.how==='exec'?'hingerichtet':'getötet'}: ${x.name} (Tag ${x.day})`)).join(' · ');
}
// revenge: one of yours has killed or executed him
function ludusRevenge(n){
  if(!n||!n.nemesis||n.avenged||n.status==='active') return '';
  n.avenged=true; ludus.fame+=LUDUS_NEMESIS.revenge; ludusMeta.nemeses=(ludusMeta.nemeses||[]).filter(e=>e.id!==n.nemesis);
  const t=`Rache: ${n.name} ist tot (+${LUDUS_NEMESIS.revenge} Ruhm).`; ludusChron(n.region,'nemesis',t);
  // his friends do not forget: a grudge against the school, and the best of them swears revenge
  const friends=(ludus.world||[]).filter(x=>x.status==='active'&&x!==n&&x.rel&&(x.rel[n.id]||0)>=1).sort((a,b)=>(b.rel[n.id]-a.rel[n.id])||(b.level-a.level));
  friends.forEach(x=>{ x.bond=Math.max(-3,(x.bond||0)-2); });
  if(friends[0]&&friends[0].rel[n.id]>=2) ludusNemesisMark(friends[0],[],'oath',n.name);
  return t;
}
// the run's end: who waits for the next school
function ludusNemesesHTML(){
  const l=ludusMeta.nemeses||[]; if(!l.length) return '';
  return `<h3>Deine Erzfeinde</h3>${l.map(e=>`<div class="luItem"><span>${ludusEsc(e.name)} — ${SPECIES[e.kind]?SPECIES[e.kind].label:e.kind}, Stufe ${e.level}</span><span>${ludusNemesisRank(e)} · ${e.victims.length} Opfer</span></div>`).join('')}<p class="luHint">Sie wachsen mit jedem Lauf um eine Stufe und warten in der Region, die zu ihnen passt. Wer einen von ihnen tötet oder hinrichtet, nimmt Rache (+${LUDUS_NEMESIS.revenge} Ruhm).</p>`;
}
