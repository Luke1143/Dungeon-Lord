// Ghosts: the team of an ended run stands on the ladder of the next runs, as a rival team (it killed you, or it was the champion).
// ludusMeta.ghosts=[{ id, name, killer, champion, members:[{kind,name,level,xp,gifts,inventory,learned,seed}] }]; they replace the ladder figure of their strength
const LUDUS_GHOST_MAX=10;
function ludusSaveGhost(team,killer,champion){
  const members=team.map((m,i)=>({ id:'g'+i, kind:m.kind, name:m.name, level:m.level, xp:m.xp, seed:m.seed, gifts:JSON.parse(JSON.stringify(m.gifts||[])), inventory:JSON.parse(JSON.stringify(m.inventory||[])), learned:(m.learned||[]).slice() }));
  ludusMeta.ghosts=(ludusMeta.ghosts||[]).concat([{ id:'gh'+Date.now().toString(36)+Math.floor(Math.random()*1e4), name:members[0].name+(members.length>1?' & Co':''), killer:killer||'', champion:!!champion, members }]);
  if(ludusMeta.ghosts.length>LUDUS_GHOST_MAX){ const weakest=ludusMeta.ghosts.reduce((a,b)=>(ludusGhostLevel(b)+(b.champion?99:0)<ludusGhostLevel(a)+(a.champion?99:0)?b:a)); ludusMeta.ghosts=ludusMeta.ghosts.filter(x=>x!==weakest); }       // the list is full: the weakest goes, champions stay
}
const ludusGhostLevel=g=>Math.round(g.members.reduce((a,m)=>a+m.level,0)/g.members.length);

// ---- the nemesis: whoever kills or executes the last of a school outlives the run ----
// He keeps his name, kind, gear, fame and his tally (who of yours he killed, when, how), and grows a level for every run he outlives.
// In the next run he waits in the region whose level fits him (region level = his level − 1, at least the first), hostile to the school (−3) and bold:
// he is likely to challenge your best. Whoever of yours kills or executes him takes revenge (+5 fame); then he is gone for good, as he is when he dies otherwise.
// ludusMeta.nemeses=[{ id, name, kind, level, xp, seed, inventory, learned, fame, execs, bold, victims:[{ name, kind, how, day, run }], runs }]
const LUDUS_NEMESIS={ max:5, revenge:5 };
// the killer of a run: an execution names him; a death in the fight names the strongest of the winners who still stand
function ludusKillerOf(st){
  const wi=st.arena.winner, sides=(st.arena.roster||[]).map((s,ti)=>ti).filter(ti=>ti!==0&&(wi<0||ti===wi));
  const l=[].concat(...sides.map(ti=>st.arena.roster[ti]||[])).filter(c=>c.npcId&&!c.removed&&!c.dead&&st.creatures.includes(c)).map(c=>ludusNpc(c.npcId)).filter(n=>n&&n.status==='active');
  return l.sort((a,b)=>b.level-a.level)[0]||null;
}
// the world's nemeses, written back into the meta: the living ones as they are now, the dead ones struck off; a new one for the killer of this run
function ludusNemesisSync(killer,how,victims){
  if(!ludus||!ludus.world) return;
  let list=(ludusMeta.nemeses||[]).slice();
  ludus.world.filter(n=>n.nemesis).forEach(n=>{
    const e=list.find(x=>x.id===n.nemesis); if(!e) return;
    if(n.status!=='active'){ list=list.filter(x=>x!==e); return; }
    Object.assign(e,{ level:n.level, xp:n.xp, inventory:JSON.parse(JSON.stringify(n.inventory||[])), learned:(n.learned||[]).slice(), fame:n.fame||0, execs:n.execs||0 });
  });
  if(killer&&killer.status==='active'){
    let e=killer.nemesis&&list.find(x=>x.id===killer.nemesis);
    if(!e){ e={ id:'ne'+Date.now().toString(36)+Math.floor(Math.random()*1e4), name:killer.name, kind:killer.kind, seed:killer.seed, bold:Math.max(0.7,killer.bold||0), victims:[], runs:0 }; list.push(e); killer.nemesis=e.id; }
    Object.assign(e,{ level:killer.level, xp:killer.xp, inventory:JSON.parse(JSON.stringify(killer.inventory||[])), learned:(killer.learned||[]).slice(), fame:killer.fame||0, execs:killer.execs||0 });
    (victims||[]).forEach(v=>e.victims.push({ name:v.name, kind:v.kind, how, day:ludus.day, run:(ludusMeta.runs||0) }));
  }
  if(list.length>LUDUS_NEMESIS.max) list=list.slice(list.length-LUDUS_NEMESIS.max);
  ludusMeta.nemeses=list;
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
  const e=ludusNemesisOf(n); if(!e||!e.victims.length) return '';
  return ['Erzfeind deiner Schule, aus früheren Läufen:'].concat(e.victims.slice(-3).map(x=>`${x.how==='exec'?'hingerichtet':'getötet'}: ${x.name} (Tag ${x.day})`)).join(' · ');
}
// revenge: one of yours has killed or executed him
function ludusRevenge(n){
  if(!n||!n.nemesis||n.avenged||n.status==='active') return '';
  n.avenged=true; ludus.fame+=LUDUS_NEMESIS.revenge; ludusMeta.nemeses=(ludusMeta.nemeses||[]).filter(e=>e.id!==n.nemesis);
  const t=`Rache: ${n.name} ist tot (+${LUDUS_NEMESIS.revenge} Ruhm).`; ludusChron(n.region,'nemesis',t); return t;
}
// the run's end: who waits for the next school
function ludusNemesesHTML(){
  const l=ludusMeta.nemeses||[]; if(!l.length) return '';
  return `<h3>Deine Erzfeinde</h3>${l.map(e=>`<div class="luItem"><span>${ludusEsc(e.name)} — ${SPECIES[e.kind]?SPECIES[e.kind].label:e.kind}, Stufe ${e.level}</span><span>${e.victims.length} Opfer</span></div>`).join('')}<p class="luHint">Sie wachsen mit jedem Lauf um eine Stufe und warten in der Region, die zu ihnen passt. Wer einen von ihnen tötet oder hinrichtet, nimmt Rache (+${LUDUS_NEMESIS.revenge} Ruhm).</p>`;
}
