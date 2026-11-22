// Ghosts: the team of an ended run stands on the ladder of the next runs, as a rival team (it killed you, or it was the champion).
// ludusMeta.ghosts=[{ id, name, killer, champion, members:[{kind,name,level,xp,gifts,inventory,learned,seed}] }]; they replace the ladder figure of their strength
const LUDUS_GHOST_MAX=10;
function ludusSaveGhost(team,killer,champion){
  const members=team.map((m,i)=>({ id:'g'+i, kind:m.kind, name:m.name, level:m.level, xp:m.xp, seed:m.seed, gifts:JSON.parse(JSON.stringify(m.gifts||[])), inventory:JSON.parse(JSON.stringify(m.inventory||[])), learned:(m.learned||[]).slice() }));
  ludusMeta.ghosts=(ludusMeta.ghosts||[]).concat([{ id:'gh'+Date.now().toString(36)+Math.floor(Math.random()*1e4), name:members[0].name+(members.length>1?' & Co':''), killer:killer||'', champion:!!champion, members }]);
  if(ludusMeta.ghosts.length>LUDUS_GHOST_MAX){ const weakest=ludusMeta.ghosts.reduce((a,b)=>(ludusGhostLevel(b)+(b.champion?99:0)<ludusGhostLevel(a)+(a.champion?99:0)?b:a)); ludusMeta.ghosts=ludusMeta.ghosts.filter(x=>x!==weakest); }       // the list is full: the weakest goes, champions stay
}
const ludusGhostLevel=g=>Math.round(g.members.reduce((a,m)=>a+m.level,0)/g.members.length);

// ---- the rival: whoever kills or executes one of the school's gladiators becomes its rival and outlives the run ----
// He keeps his name, kind, gear, fame and his tally (who of yours he killed, when, how), and grows a level for every run he outlives.
// In the next run he waits in the region whose level fits him (region level = his level − 1, at least the first), hostile to the school (−3) and bold:
// he is likely to challenge your best. Every 4 days a rival who is elsewhere moves one region nearer to the school (he hunts it).
// His rank grows with his victims and the runs he outlived: Rivale, then Erzrivale (3), then Angstgegner (6).
// Whoever of yours kills or executes him takes revenge (+5 fame); then he is gone for good, as he is when he dies otherwise. His friends bear the school a grudge (−2);
// none of them takes his place: a gladiator becomes a rival only by his own deed (killing one of yours).
// ludusMeta.rivals=[{ id, name, kind, level, xp, seed, inventory, learned, fame, execs, bold, victims:[{ name, kind, how, day, run }], runs }]
const LUDUS_RIVAL={ max:5, revenge:5, huntEvery:4, ranks:[[6,'Angstgegner'],[3,'Erzrivale'],[0,'Rivale']] };
const ludusRivalRank=e=>{ const v=(e.victims||[]).length+(e.runs||0); return LUDUS_RIVAL.ranks.find(([k])=>v>=k)[1]; };
// the killer of a bout: the strongest foe who still stands (of the winning side, if a foe's side won)
function ludusKillerOf(st){
  const wi=st.arena.winner, sides=(st.arena.roster||[]).map((s,ti)=>ti).filter(ti=>ti!==0&&(wi<=0||ti===wi));       // the school won or nobody did: any foe still standing
  const l=[].concat(...sides.map(ti=>st.arena.roster[ti]||[])).filter(c=>c.npcId&&!c.removed&&!c.dead&&st.creatures.includes(c)).map(c=>ludusNpc(c.npcId)).filter(n=>n&&n.status==='active');
  return l.sort((a,b)=>b.level-a.level)[0]||null;
}
const ludusRivalCopy=(e,n)=>Object.assign(e,{ level:n.level, xp:n.xp, inventory:JSON.parse(JSON.stringify(n.inventory||[])), learned:(n.learned||[]).slice(), fame:n.fame||0, execs:n.execs||0 });
// a gladiator of the world has killed (how: 'kill' or 'exec') some of the school's own: he is (or stays) a rival
function ludusRivalMark(killer,victims,how){
  if(!killer||killer.status!=='active'||ludusMember(killer.id)) return;
  let list=(ludusMeta.rivals||[]).slice(), e=killer.rival&&list.find(x=>x.id===killer.rival);
  const before=e?ludusRivalRank(e):null;
  if(!e){ e={ id:'ne'+Date.now().toString(36)+Math.floor(Math.random()*1e4), name:killer.name, kind:killer.kind, seed:killer.seed, bold:Math.max(0.7,killer.bold||0), victims:[], runs:0 }; list.push(e); killer.rival=e.id; }
  ludusRivalCopy(e,killer); killer.bond=-3; killer.bold=Math.max(killer.bold||0,0.7);
  (victims||[]).forEach(v=>e.victims.push({ name:v.name, kind:v.kind, how, day:ludus.day, run:(ludusMeta.runs||0) }));
  // the list keeps the five worst: most victims first
  if(list.length>LUDUS_RIVAL.max){ list.sort((a,b)=>(b.victims||[]).length-(a.victims||[]).length); list=list.slice(0,LUDUS_RIVAL.max); }
  ludusMeta.rivals=list;
  if(!list.includes(e)) return;
  ludusRivalDress(killer,e);
  const region=killer.region, rank=ludusRivalRank(e);
  if(!before) ludusChron(region,'rival',`${killer.name} wird zum Rivalen deiner Schule.`);
  else if(rank!==before) ludusChron(region,'rival',`${killer.name} steigt auf: ${rank}.`);
}
// the world's rivals, written back into the meta: the living ones as they are now, the dead and the gone struck off
function ludusRivalSync(){
  if(!ludus||!ludus.world) return;
  let list=(ludusMeta.rivals||[]).slice();
  ludus.world.filter(n=>n.rival).forEach(n=>{ const e=list.find(x=>x.id===n.rival); if(!e) return; if(n.status!=='active') list=list.filter(x=>x!==e); else ludusRivalCopy(e,n); });
  ludusMeta.rivals=list;
}
// the hunt: every 4 days a rival who is not where the school is moves one region nearer along the roads (a waypoint is passed); a champion keeps his region
function ludusRivalStep(from,to){
  const w=ludusMapWorld(), dist={ [to]:0 }, q=[to];
  while(q.length){ const x=q.shift(); ludusMapNeighbours(x).forEach(y=>{ if(dist[y]===undefined){ dist[y]=dist[x]+1; q.push(y); } }); }
  if(dist[from]===undefined) return null;
  let at=from; do{ at=ludusMapNeighbours(at).sort((a,b)=>(dist[a]??1e9)-(dist[b]??1e9))[0]; } while(at!==undefined&&at!==to&&!ludusIsRegion(w.nodes[at]));
  return at===undefined?null:at;
}
function ludusRivalHunt(){
  if(ludus.day%LUDUS_RIVAL.huntEvery||ludus.tourney) return;
  const goal=ludus.map.region, w=ludusMapWorld();
  (ludus.world||[]).filter(n=>n.rival&&n.status==='active'&&n.region!==goal&&!ludusIsChamp(n.region,'npc',n.id)).forEach(n=>{
    const to=ludusRivalStep(n.region,goal); if(to===null||to===n.region) return;
    const t=ludusTeamOf(n); (t?ludusTeamMembers(t.id):[n]).forEach(m=>{ m.region=to; m.boss=false; }); if(t) t.region=to; ludusRegionEnsure(to);       // his team hunts with him
    ludusChron(to,'rival',to===goal?`${n.name} ist in ${w.nodes[to].name} angekommen und sucht deine Schule.`:`${n.name} folgt deiner Schule nach ${w.nodes[to].name}.`);
  });
}
// a new run: every rival has grown a level since; they enter the world when their region is first filled (ludusRegionEnsure)
function ludusRivalGrow(){ (ludusMeta.rivals||[]).forEach(e=>{ e.level=Math.min(40,(e.level||1)+1); e.xp=xpForLevel(e.level); e.runs=(e.runs||0)+1; }); }
const ludusRivalCol=e=>Math.max(0,(e.level||1)-2);       // region level = col + 1 = his level − 1
function ludusRivalPlace(id){
  const col=ludusMapWorld().nodes[id].col, here=new Set((ludus.world||[]).filter(n=>n.rival).map(n=>n.rival));
  (ludusMeta.rivals||[]).forEach(e=>{
    if(here.has(e.id)||Math.min(ludusRivalCol(e),LUDUS_TOUR.cap-1)!==Math.min(col,LUDUS_TOUR.cap-1)) return;
    const n=ludusEquip({ id:'n'+e.id, name:e.name, kind:e.kind, level:e.level, xp:e.xp, seed:e.seed, inventory:JSON.parse(JSON.stringify(e.inventory||[])), learned:(e.learned||[]).slice(),
      status:'active', bond:-3, met:1, last:null, region:id, honor:60, born:ludus.day, bold:e.bold||0.8, fame:e.fame||0, execs:e.execs||0, rival:e.id });
    ludusRivalDress(n,e);
    ludus.world.push(n); ludusChron(id,'rival',`${n.name} ist wieder da und hat deine Schule nicht vergessen.`);
  });
}
const ludusRivalOf=n=>n&&n.rival&&(ludusMeta.rivals||[]).find(e=>e.id===n.rival)||null;
// what the school remembers of him (the card)
function ludusRivalText(n){
  const e=ludusRivalOf(n); if(!e) return '';
  return [`${ludusRivalRank(e)} deiner Schule.`].concat(e.victims.slice(-3).map(x=>`${x.how==='exec'?'hingerichtet':'getötet'}: ${x.name} (Tag ${x.day})`)).join(' · ');
}
// revenge: one of yours has killed or executed him
function ludusRevenge(n){
  if(!n||!n.rival||n.avenged||n.status==='active') return '';
  n.avenged=true; ludus.fame+=LUDUS_RIVAL.revenge; ludusTrophyAdd(n,ludusRivalOf(n)); ludusMeta.rivals=(ludusMeta.rivals||[]).filter(e=>e.id!==n.rival);
  const t=`Rache: ${n.name} ist tot (+${LUDUS_RIVAL.revenge} Ruhm).`; ludusChron(n.region,'rival',t);
  // his friends do not forget: a grudge against the school (each of them; nobody takes his place)
  (ludus.world||[]).filter(x=>x.status==='active'&&x!==n&&x.rel&&(x.rel[n.id]||0)>=1).forEach(x=>{ x.bond=Math.max(-3,(x.bond||0)-2); });
  return t;
}
// the run's end: who waits for the next school
function ludusRivalsHTML(){
  const l=ludusMeta.rivals||[]; if(!l.length) return '';
  return `<h3>Deine Rivalen</h3>${l.map(e=>`<div class="luItem"><span>${ludusEsc(e.name)} — ${SPECIES[e.kind]?SPECIES[e.kind].label:e.kind}, Stufe ${e.level}</span><span>${ludusRivalRank(e)} · ${e.victims.length} Opfer</span></div>`).join('')}<p class="luHint">Sie wachsen mit jedem Lauf um eine Stufe und warten in der Region, die zu ihnen passt. Wer einen von ihnen tötet oder hinrichtet, nimmt Rache (+${LUDUS_RIVAL.revenge} Ruhm).</p>`;
}

// ---- a rival's traits: one strength and one weakness when he becomes one, another strength at every rise in rank ----
// They are real rules of the fight (gift effects, docs/gaben.md), shown on his card, so that a school can prepare: the right weapon against his weakness.
const RIVAL_STRENGTHS=[
  { k:'fearless', v:true }, { k:'stunImmune', v:true }, { k:'bleedImmune', v:true }, { k:'lifesteal', v:0.18 }, { k:'thorns', v:0.25 }, { k:'rage', v:0.7 },
  { k:'maxHp', v:1.3 }, { k:'strength', v:1.25 }, { k:'defense', v:1.3 }, { k:'onKillHeal', v:0.25 }, { k:'taken_cut', v:0.6 }, { k:'taken_pierce', v:0.6 }, { k:'taken_blunt', v:0.6 }
];
const RIVAL_WEAKNESSES=[
  { k:'taken_cut', v:1.6 }, { k:'taken_pierce', v:1.6 }, { k:'taken_blunt', v:1.6 }, { k:'frail', v:true }, { k:'noFlight', v:true }, { k:'staminaCost', v:1.4 }, { k:'tempo', v:0.8 }
];
// the next trait for an entry, chosen by a fixed rule from his id (no dice in the run): never a second of the same kind, never a strength against his own weakness
function ludusRivalTrait(e,weak){
  const pool=(weak?RIVAL_WEAKNESSES:RIVAL_STRENGTHS).filter(t=>!(e.traits||[]).some(x=>x.k===t.k));
  if(!pool.length) return null;
  const t=pool[arenaHash(e.id+':'+(e.traits||[]).length)%pool.length];
  return { k:t.k, v:t.v, role:weak?'bane':'boon' };
}
function ludusRivalGrowTraits(e){
  e.traits=e.traits||[];
  if(!e.traits.length){ [ludusRivalTrait(e,false),ludusRivalTrait(e,true)].forEach(t=>{ if(t) e.traits.push(t); }); }
  const want=1+LUDUS_RIVAL.ranks.length-1-LUDUS_RIVAL.ranks.findIndex(([k])=>(e.victims||[]).length+(e.runs||0)>=k);       // 1 strength as Rivale, 2 as Geißel, 3 as Schrecken
  while(e.traits.filter(t=>t.role==='boon').length<want){ const t=ludusRivalTrait(e,false); if(!t) break; e.traits.push(t); }
}
// his traits as a gift of his (the fight reads gifts)
function ludusRivalDress(n,e){
  ludusRivalGrowTraits(e);
  n.gifts=(n.gifts||[]).filter(g=>g.id!=='rival').concat([{ id:'rival', name:'Rivale', rarity:0, fx:e.traits.map(t=>({ k:t.k, v:t.v, role:t.role })) }]);
}
const ludusTraitText=t=>GIFT_MUL[t.k]?GIFT_MUL[t.k].text(t.v):(GIFT_FLAG[t.k]?GIFT_FLAG[t.k].text(t.v===true?0:t.v):t.k);
// the card's lines: what he is good at, where he is weak
function ludusRivalTraitsText(n){
  const e=ludusRivalOf(n); if(!e||!(e.traits||[]).length) return '';
  const s=e.traits.filter(t=>t.role==='boon').map(ludusTraitText), w=e.traits.filter(t=>t.role==='bane').map(ludusTraitText);
  return [s.length?`Stärken: ${s.join(', ')}`:'', w.length?`Schwäche: ${w.join(', ')}`:''].filter(Boolean).join(' · ');
}

// ---- the stage: when a rival steps into the sand, the bout waits for a moment: who he is, whom he killed, what he can and cannot, what he says ----
const RIVAL_TAUNTS=['Ich kenne deine Schule. Ich kenne ihre Gräber.','Noch einer aus dieser Schule? Der Sand wartet schon.','Ich bin zurückgekommen. Für dich.','Letztes Mal hat mich niemand aufgehalten.','Sag mir deinen Namen, damit ich ihn mir merke.'];
function ludusRivalLines(n){
  const e=ludusRivalOf(n); if(!e) return null;
  const v=(e.victims||[]).slice(-4).map(x=>x.name), taunt=RIVAL_TAUNTS[arenaHash(e.id+':'+ludus.day)%RIVAL_TAUNTS.length];
  return { title:`${n.name}, ${ludusRivalRank(e)} deiner Schule`, kind:`${SPECIES[n.kind].label} · Stufe ${n.level} · Ruhm ${n.fame||0}`, victims:v.length?`Opfer: ${v.join(', ')}`:'', traits:ludusRivalTraitsText(n), taunt };
}
function ludusRivalStage(n){
  const l=ludusRivalLines(n), res=document.getElementById('arenaResult'); if(!l||!res) return;
  const old=document.getElementById('rivalStage'); if(old) old.remove();
  setSpeed(0);
  const d=document.createElement('div'); d.id='rivalStage'; d.className='arResult rivalStage';
  d.innerHTML=`<div class="endBox"><h2>${ludusEsc(l.title)}</h2><p>${ludusEsc(l.kind)}</p>${l.victims?`<p>${ludusEsc(l.victims)}</p>`:''}${l.traits?`<p class="luHint">${ludusEsc(l.traits)}</p>`:''}<p><i><span>„</span>${ludusEsc(l.taunt)}<span>“</span></i></p><button id="rivalStageGo" class="menuMain">Kämpfen</button></div>`;
  res.parentElement.appendChild(d);
  d.querySelector('#rivalStageGo').addEventListener('click',()=>{ d.remove(); setSpeed(1); });
}

// saves from before the renames (the rival was called otherwise twice): the meta list, the mark on a gladiator and his traits' gift; a sworn successor is no more
function ludusRivalMigrate(){
  ['nemeses','archEnemies'].forEach(k=>{ if(ludusMeta[k]){ ludusMeta.rivals=(ludusMeta.rivals||[]).concat(ludusMeta[k]); delete ludusMeta[k]; } });
  (ludusMeta.rivals||[]).forEach(e=>{ delete e.sworn; });
  if(ludus&&ludus.world) ludus.world.forEach(n=>{ ['nemesis','arch'].forEach(k=>{ if(n[k]){ n.rival=n[k]; delete n[k]; } }); (n.gifts||[]).forEach(g=>{ if(g.id==='nemesis'||g.id==='arch'){ g.id='rival'; g.name='Rivale'; } }); });
}
