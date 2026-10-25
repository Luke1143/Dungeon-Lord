// Two spells that work in every mode (campaign, arena, Ludus): Rückzug (retreat) and Berserk. See docs/spells.md.
//  Retreat: in the campaign the creatures in reach are taken into the throne room; in a bout (arena, Ludus) it ends the fight, nobody is lost.
//  Berserk: those affected fight to the death and never withdraw (no flight, no giving up).
// Besides, whenever enemies stand in the throne room, all imps go berserk by themselves; a Ludus scroll that calls an imp makes it berserk too (it is gone after the bout).
const GOD_SPELLS={
  retreat:{ name:'Rückzug', range:3, cooldown:300 },
  berserk:{ name:'Berserk', range:2, cooldown:200 }
};
let godSpell=null;                 // the campaign spell that is chosen and waits for a target tile
function godSpellSet(id){
  godSpell=(godSpell===id)?null:id;
  if(godSpell){ if(typeof pickMode!=='undefined'&&pickMode){ cancelHeldEntity(); exitPickMode(); } possessMode=false; document.getElementById('possessBtn').classList.remove('active'); buildMode=null; document.querySelectorAll('.roomBtn').forEach(b=>b.classList.remove('active')); }
  document.querySelectorAll('.tile[data-hint="retreat"],.tile[data-hint="berserk"]').forEach(b=>b.classList.toggle('active',b.dataset.hint===godSpell));
  setInspect(godSpell?`${GOD_SPELLS[godSpell].name}: auf ein Feld klicken (Reichweite ${GOD_SPELLS[godSpell].range}).`:'');
}
const godNear=(x,y,r,list)=>list.filter(c=>!c.removed&&!c.held&&Math.abs(c.x-x)+Math.abs(c.y-y)<=r);
// Retreat in the campaign: your creatures (and imps) around the tile appear in the throne room
function spellRetreatCampaign(x,y){
  const th=tilesOfRoom('throne'); if(!th.length) return 0; let n=0;
  godNear(x,y,GOD_SPELLS.retreat.range,state.creatures.concat(state.imps)).filter(c=>factionOf(c)==='evil'&&c.kind!=='dungeonlord').forEach(c=>{
    const free=th.filter(t=>!tileOccupied(t.x,t.y,c)), t=(free.length?free:th)[Math.floor(Math.random()*(free.length||th.length))];
    if(typeof spawnEffect==='function') spawnEffect('teleportOut',c.x,c.y);
    c.x=t.x; c.y=t.y; c.renderX=t.x; c.renderY=t.y; c.path=[]; c.fightTarget=null; c.state=c.unconscious?'unconscious':'idle'; n++;
    if(typeof spawnEffect==='function') spawnEffect('teleportIn',t.x,t.y);
  });
  return n;
}
function spellBerserk(x,y,list,ticks){
  const hit=godNear(x,y,GOD_SPELLS.berserk.range,list); hit.forEach(c=>{ c.berserkTicks=ticks; c.path=[]; if(typeof emitFx==='function') emitFx('claim',c.x,c.y,{ color:'#e02818' }); }); return hit.length;
}
function godCast(x,y){
  const id=godSpell; if(!id) return;
  const cool=(state.godCool=state.godCool||{});
  if((cool[id]||0)>state.tickCount){ setInspect('Der Zauber ist noch nicht wieder bereit.'); return; }
  let n=0;
  if(id==='retreat') n=spellRetreatCampaign(x,y);
  else if(id==='berserk') n=spellBerserk(x,y,state.creatures.concat(state.imps).filter(c=>factionOf(c)==='evil'),400);
  if(!n){ setInspect('Hier gibt es kein Ziel für diesen Zauber.'); return; }
  cool[id]=state.tickCount+GOD_SPELLS[id].cooldown; logEvent(`${GOD_SPELLS[id].name}: ${n} Wesen.`,x,y);
  godSpell=null; document.querySelectorAll('.tile[data-hint="retreat"],.tile[data-hint="berserk"]').forEach(b=>b.classList.remove('active')); setInspect(''); draw(); updateUI();
}
// the cool-down shown on the tiles
function godSpellsUI(){
  if(!state||state.arena) return;
  ['retreat','berserk'].forEach(id=>{ const b=document.querySelector(`.tile[data-hint="${id}"]`); if(!b) return; const left=Math.max(0,((state.godCool||{})[id]||0)-state.tickCount), tc=b.querySelector('.tc'); b.disabled=left>0; if(tc) tc.textContent=left>0?Math.ceil(left/5)+'':'frei'; });
}
// enemies in the throne room: all imps stand and fight
function tickImpBerserk(){
  if(!state||state.arena||state.tickCount%4) return;
  const th=tilesOfRoom('throne'); if(!th.length) return;
  const at=new Set(th.map(t=>t.x+','+t.y));
  if(state.creatures.some(c=>factionOf(c)==='good'&&!c.unconscious&&!c.removed&&at.has(c.x+','+c.y))) state.imps.forEach(i=>{ i.berserkTicks=Math.max(i.berserkTicks||0,14); });
}
// in a bout (arena, Ludus)
function arenaRetreat(st){ st.arena.over=true; st.arena.winner=-1; st.arena.retreated=true; }
function arenaCallImp(st,x,y){
  const t=st.grid[y]&&st.grid[y][x]; if(!t||t.type!=='floor'||st.creatures.some(c=>c.x===x&&c.y===y&&!c.removed)) return false;
  const c=arenaMake('imp',x,y); c.faction='evil'; c.level=Math.max(1,(typeof ludusLevel==='function'&&typeof ludus!=='undefined'&&ludus&&ludus.team?ludusLevel():5)); c.xp=xpForLevel(c.level); c.maxHp=statMaxHp(c); c.hp=c.maxHp; c.inventory=[];
  c.arenaTeam=0; c.berserkTicks=1e9; c.state='fighting'; c.path=[]; st.creatures.push(c); st.arena.roster[0].push(c); emitFx('claim',x,y,{ color:'#e02818' }); return true;
}
