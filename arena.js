// Creature arena ("Kreaturen-Arena"): a separate game mode that is also a test bench. Pick the creatures of two teams (kind, number, level, gear, an extra ability),
// a procedural map, and watch them fight; the Dungeon Lord's possession works as everywhere else. The same set-up can be simulated many times for numbers.
// The mode reuses the level screen: `state.arena` marks the match, `gameTick` hands over to `arenaTick`, and the usual AI is replaced by tickCombat alone
// (everyone sees every foe). Team A is the dark side (faction 'evil'), team B the good side (faction 'good'), whatever the species.
const ARENA_STORE='dungeon-lord-arena-setup-v1';
const ARENA_MAX_TICKS=4000, ARENA_LUDUS_TICKS=700;   // a Ludus match has a time limit (about 4 minutes at normal speed)
const ARENA_LAYOUTS=[['pit','Offene Grube'],['caverns','Höhlen'],['halls','Hallen'],['canyon','Schlucht'],['tunnels','Stollen']];
const ARENA_DIMS=[['S','klein'],['M','mittel'],['L','groß']];
const ARENA_GEARS=[['auto','Standard'],['none','keine'],['custom','eigene']];

function arenaGroup(kind,count,level){ return { kind, count, level, gear:'auto', tier:1, weapon:'', armor:'', shield:'', ability:'', seed:Math.floor(Math.random()*1e9) }; }
// the set-up lists every creature on its own: a group of N becomes N entries (older saved set-ups), each with its own look seed
function arenaExpand(setup){ setup.teams.forEach(t=>{ const out=[]; t.groups.forEach(g=>{ for(let i=0;i<Math.max(1,Math.min(20,g.count|0||1));i++) out.push(Object.assign({},g,{ count:1, seed:i?Math.floor(Math.random()*1e9):(g.seed!==undefined?g.seed:Math.floor(Math.random()*1e9)) })); }); t.groups=out; }); return setup; }
function arenaDefaultSetup(){
  return arenaExpand({ teams:[ { name:Tr('Dunkelheit'), groups:[arenaGroup('ork',3,1)] }, { name:Tr('Helden'), groups:[arenaGroup('barbarian',3,1)] } ],
           map:{ layout:'pit', dims:'S', seed:'', lava:0, water:0, crystal:0, near:0 }, batch:20 });
}
let arenaSetup=arenaDefaultSetup();
function arenaKinds(){ return Object.keys(SPECIES).filter(k=>SPECIES[k].canFight && SPECIES[k].category!=='boss' && !['worker','dungeonlord','imp','fly'].includes(k)); }
const arenaTeamOf=c=> c.faction==='evil'?0:1;
async function arenaSaveSetup(){ try{ await window.storage.set(ARENA_STORE, JSON.stringify(arenaSetup), false); }catch(e){} }
async function arenaLoadSetup(){ try{ const r=await window.storage.get(ARENA_STORE,false); if(r&&r.value){ const s=JSON.parse(r.value); if(s&&s.teams&&s.teams.length===2&&s.map) arenaSetup=arenaExpand(Object.assign(arenaDefaultSetup(),s)); } }catch(e){} }

// ---- building a match ----
function arenaHash(s){ let h=2166136261; for(const ch of String(s)){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }
function arenaMake(kind,x,y){
  if(kind==='warlock') return createWarlock(x,y);
  if(kind==='hound') return createHound(x,y);
  if(kind==='beetle') return createBeetle(x,y);
  if(HORDE_KINDS.has(kind)||BEAST_KINDS.has(kind)) return createHorde(kind,x,y);
  return createHero(kind,x,y);
}
// the look of each piece (blade shape, helm style ...) follows from the entry's seed, so a re-roll of the seed re-rolls the look
function arenaSeedGear(items,g,i){ if(g.seed!==undefined) items.forEach((it,k)=>{ it.s=arenaHash(g.seed+':'+(i|0)+':'+k); }); return items; }
function arenaGear(c,g,i){
  const inst=id=>({ id, q:1, s:Math.floor(Math.random()*1e9) });
  if(g.gear==='none') return [];
  if(g.gear==='custom') return arenaSeedGear([g.weapon,g.weapon2,g.armor,g.shield].filter(id=>id&&ITEMS[id]).map(inst),g,i);
  const geared=['barbarian','thief','elf','wizard','knight','archer','monk','paladin','dwarf','giant','dryad'];
  if(geared.includes(c.kind)) return arenaSeedGear(heroGear(c.kind,c.level||1,false,Math.max(0,Math.min(3,g.tier===undefined?1:g.tier))),g,i);
  return arenaSeedGear((HORDE_START_GEAR[c.kind]||[]).map(inst),g,i);
}
function arenaComponents(g){
  const W=WORLD_COLS,H=WORLD_ROWS, comp=Array.from({length:H},()=>Array(W).fill(-1)), list=[];
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ if(g[y][x].type!=='floor'||comp[y][x]>=0) continue; const cells=[], q=[[x,y]]; comp[y][x]=list.length;
    while(q.length){ const [cx,cy]=q.pop(); cells.push([cx,cy]); for(const [nx,ny] of [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]]){ if(nx>=0&&ny>=0&&nx<W&&ny<H&&g[ny][nx].type==='floor'&&comp[ny][nx]<0){ comp[ny][nx]=list.length; q.push([nx,ny]); } } }
    list.push(cells); }
  return list.sort((a,b)=>b.length-a.length);
}
// the pit is a walled yard in the middle of the map: size S/M/L is half, three quarters or all of the inner space
function arenaPit(g,dims){
  const f={ S:0.5, M:0.75, L:1 }[dims]||0.5, w=Math.round((WORLD_COLS-4)*f), h=Math.round((WORLD_ROWS-4)*f), x0=(WORLD_COLS-w)>>1, y0=(WORLD_ROWS-h)>>1;
  for(let y=0;y<WORLD_ROWS;y++) for(let x=0;x<WORLD_COLS;x++){ const t=g[y][x], edge=x<x0||y<y0||x>=x0+w||y>=y0+h;
    if(edge){ t.type='bedrock'; } else { t.type='floor'; t.gold=false; t.ore=false; t.gem=false; t.water=false; t.lava=false; t.castle=false; t.crystal=false; t.crystalFloor=false; t.goldPile=0; t.orePile=0; t.reinforced=false; t.marked=false; }
    t.room=null; t.natural=true; }
  for(let i=0,n=Math.round(WORLD_COLS*WORLD_ROWS/90);i<n;i++){ const x=randInt(x0+3,x0+w-5), y=randInt(y0+3,y0+h-5); [[0,0],[1,0],[0,1],[1,1]].slice(0,randInt(1,4)).forEach(([dx,dy])=>{ g[y+dy][x+dx].type='bedrock'; }); }
}
// everything set up for a match, returns a fresh state (the global `state` is not touched)
function arenaBuild(setup,seedExtra){
  const keepRandom=Math.random, seedWord=(setup.map.seed||'')+(seedExtra||'');
  if(seedWord){ const r=seededRng(arenaHash(seedWord)); Math.random=r; }
  let st;
  try{
    const m=setup.map, layout=m.layout==='pit'?'caverns':m.layout;
    levelGen={ dims:m.dims, layout, rivers:[0,0], lakes:[m.water||0,m.water||0], lava:[m.lava||0,m.lava||0], crystal:[m.crystal||0,m.crystal||0], ruins:[0,0], vaults:[0,0], goldVeins:-6, oreVeins:-6, bedrock:-3 };
    st=makeDefaultState();
    const g=st.grid;
    for(let y=0;y<WORLD_ROWS;y++) for(let x=0;x<WORLD_COLS;x++){ const t=g[y][x]; if(t.room==='throne'||t.room==='entrance'||t.room==='portal') t.room=null; }
    if(m.layout==='pit'){ arenaPit(g,m.dims); if(m.lava) growLava(g,m.lava); if(m.water){ for(let i=0;i<m.water;i++){ const x=randInt(6,WORLD_COLS-7), y=randInt(6,WORLD_ROWS-7); blobCells(x,y,randInt(8,16)).forEach(([cx,cy])=>{ g[cy][cx].type='water'; g[cy][cx].lava=false; }); } } }
    // two camps at the far ends of the biggest open cave; when there is none, carve one
    let comps=arenaComponents(g);
    if(!comps.length || comps[0].length<150){ const cx=WORLD_COLS>>1, cy=WORLD_ROWS>>1; carveRect(g,cx-12,cy-6,cx+12,cy+6); comps=arenaComponents(g); }
    const cells=comps[0], key=([x,y])=>x+y*0.8;
    const A=cells.reduce((a,b)=>key(a)<=key(b)?a:b);
    const B=m.near ? cells.reduce((a,b)=>Math.abs(Math.abs(b[0]-A[0])+Math.abs(b[1]-A[1])-14)<Math.abs(Math.abs(a[0]-A[0])+Math.abs(a[1]-A[1])-14)?b:a) : cells.reduce((a,b)=>key(a)>=key(b)?a:b);
    for(let y=0;y<WORLD_ROWS;y++) for(let x=0;x<WORLD_COLS;x++){ const t=g[y][x]; if(t.type==='floor'){ t.owned=true; t.discovered=true; t.seen=true; t.enemy=false; t.look='arena'; } }
    // the walls around the floor are dressed like the arena building's (a reinforced wall wears the look of the room it faces)
    for(let y=0;y<WORLD_ROWS;y++) for(let x=0;x<WORLD_COLS;x++){ const t=g[y][x]; if(t.type==='rock' && neighbors(x,y).some(([nx,ny])=>g[ny][nx].type==='floor')) t.reinforced=true; }
    if(setup.fog){ for(let y=0;y<WORLD_ROWS;y++) for(let x=0;x<WORLD_COLS;x++){ g[y][x].seen=false; } }
    st.imps=[]; st.creatures=[]; st.gold=0; st.looseItems=[]; st.corpses=[]; st.war=newWar(); st.war.timer=1e9; st.war.arena=true;
    st.arena={ over:false, winner:null, anchors:[{x:A[0],y:A[1]},{x:B[0],y:B[1]}], fog:!!setup.fog, maxTicks:setup.ludus?ARENA_LUDUS_TICKS:ARENA_MAX_TICKS, hpWins:!!setup.ludus, roster:[[],[]] };
  } finally { Math.random=keepRandom; }
  // the teams
  const prev=state; state=st;
  try{
    setup.teams.forEach((team,ti)=>{
      const anchor=st.arena.anchors[ti], free=arenaFreeTiles(st,anchor,60);
      team.groups.forEach(grp=>{
        for(let i=0;i<Math.max(1,Math.min(20,grp.count|0));i++){
          const at=free.shift()||anchor, c=arenaMake(grp.kind,at.x,at.y);
          c.faction=ti===0?'evil':'good'; c.level=Math.max(1,Math.min(40,grp.level|0||1)); c.xp=xpForLevel(c.level);
          c.maxHp=statMaxHp(c); c.hp=c.maxHp; c.inventory=arenaGear(c,grp,i);
          if(grp.ability && ABILITIES[grp.ability]) c.learned=[grp.ability];
          if(grp.name) c.name=grp.name;
          if(grp.fighter) arenaApplyFighter(c,grp.fighter);
          c.state='idle'; c.path=[]; c.arenaTeam=ti; c.state='fighting';
          st.creatures.push(c); st.arena.roster[ti].push(c);
        }
      });
    });
    // gear hidden in the yard: in a pocket between the pillars, far from both camps, never in plain sight (only someone who goes looking finds it)
    if(setup.items && setup.items.length){
      const g=st.grid, nearRock=(x,y)=>{ let n=0; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const t=g[y+dy]&&g[y+dy][x+dx]; if(t&&t.type!=='floor') n++; } return n; };
      const spots=arenaFreeTiles(st,st.arena.anchors[0],600).filter(t=>st.arena.anchors.every(an=>Math.abs(an.x-t.x)+Math.abs(an.y-t.y)>=8)).sort((p,q)=>nearRock(q.x,q.y)-nearRock(p.x,p.y));
      setup.items.slice(0,1).forEach(id=>{ if(!ITEMS[id]||!spots.length) return; const t=spots[Math.floor(Math.random()*Math.min(3,spots.length))]; const it=looseOf({ id, q:1, s:Math.floor(Math.random()*1e9) },t.x,t.y); it.arenaFloor=true; st.looseItems.push(it); });
    }
  } finally { state=prev; }
  return st;
}
// soft fog of war for the pit: the dark side's fighters see ARENA_VISION tiles around them (walls block the view); what was seen stays dimly known
const ARENA_VISION=8;
function arenaFog(st){
  const g=st.grid, W=WORLD_COLS, H=WORLD_ROWS, N=W*H;
  if(!st.vis||st.vis.length!==N) st.vis=new Uint8Array(N);
  if(!st.fogA||st.fogA.length!==N) st.fogA=new Float32Array(N);
  const vis=st.vis, dist=new Float32Array(N).fill(99); vis.fill(0);
  const seers=st.creatures.filter(c=>arenaTeamOf(c)===0 && !c.removed && !c.held);
  seers.forEach(c=>{
    const R=ARENA_VISION;
    for(let y=Math.max(0,c.y-R);y<=Math.min(H-1,c.y+R);y++) for(let x=Math.max(0,c.x-R);x<=Math.min(W-1,c.x+R);x++){
      const d=Math.hypot(x-c.x,y-c.y); if(d>R) continue;
      const t=g[y][x], solid=t.type==='rock'||t.type==='bedrock';
      if(d>1.5 && !lineClear(c.x,c.y,x,y)) continue;
      const k=y*W+x; vis[k]=1; if(d<dist[k]) dist[k]=d; t.seen=true;
      if(!solid) for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const q=g[y+dy]&&g[y+dy][x+dx]; if(q&&(q.type==='rock'||q.type==='bedrock')) q.seen=true; }
    }
  });
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const k=y*W+x, t=g[y][x]; st.fogA[k]=vis[k]?Math.max(0,Math.min(0.5,(dist[k]-(ARENA_VISION-3))/3*0.5)):(t.seen?0.62:1); }
}
// a creature standing on a piece of gear takes it, if it has room; the new piece counts at once (the best per hand and body is worn)
function arenaPickups(st){
  if(!st.looseItems||!st.looseItems.length) return;
  st.creatures.forEach(c=>{
    if(c.unconscious||c.removed||c.kind==='imp') return;
    const i=st.looseItems.findIndex(it=>it.kind==='equipment'&&it.x===c.x&&it.y===c.y); if(i<0) return;
    const inst=looseInst(st.looseItems[i]); if(!hasFreeSlot(c,inst)) return;
    giveItem(c,inst); st.looseItems.splice(i,1); logEvent(`${actorLabel(c)} hebt ${instLabel(inst)} auf.`,c.x,c.y);
  });
}
// with gear on the ground and no foe within a few steps, a creature goes to pick it up (called from tickCombat)
function arenaItemDetour(c){
  const st=state; if(!st.arena||!st.looseItems||!st.looseItems.some(it=>it.kind==='equipment')) return false;
  if(c.kind==='imp'||c.unconscious||!usesEquipment(c)&&c.category!=='hero') return false;
  const foes=st.creatures.filter(o=>o!==c&&!o.unconscious&&!o.removed&&areHostile(c,o));
  if(foes.some(o=>Math.abs(o.x-c.x)+Math.abs(o.y-c.y)<=3)) return false;
  let best=null; st.looseItems.forEach(it=>{ if(it.kind!=='equipment'||!hasFreeSlot(c,looseInst(it))) return; const d=Math.abs(it.x-c.x)+Math.abs(it.y-c.y); if(d<=9&&(!best||d<best.d)) best={ it, d }; });
  if(!best) return false;
  // not when a foe is closer to the gear than we are (then the fight comes first)
  if(foes.some(o=>Math.abs(o.x-best.it.x)+Math.abs(o.y-best.it.y)<best.d)) return false;
  const res=bfsFind(c.x,c.y,(x,y)=>x===best.it.x&&y===best.it.y); if(!res) return false;
  c.path=res.path; c.state='engaging'; stepAlong(c); return true;
}
// a persistent fighter (the Ludus mode) steps into the match with its own level, gear, abilities and wounds
function arenaApplyFighter(c,f){
  c.name=f.name||c.name; c.level=Math.max(1,f.level|0||1); c.xp=f.xp||xpForLevel(c.level); c.maxHp=statMaxHp(c);
  c.inventory=JSON.parse(JSON.stringify(f.inventory||[])); c.learned=(f.learned||[]).slice(); c.gifts=JSON.parse(JSON.stringify(f.gifts||[]));
  c.hp=Math.max(1,Math.min(c.maxHp,f.hp===undefined?c.maxHp:f.hp));
  if(f.energy!==undefined) c.energy=f.energy;          // how well rested: the quicker the stamina returns
}
function arenaFreeTiles(st,from,n){
  const g=st.grid, seen=new Set([from.x+','+from.y]), q=[[from.x,from.y]], out=[];
  for(let qi=0;qi<q.length&&out.length<n;qi++){ const [x,y]=q[qi]; if(g[y][x].type==='floor') out.push({x,y});
    for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){ const k=nx+','+ny; if(nx>=0&&ny>=0&&nx<WORLD_COLS&&ny<WORLD_ROWS&&!seen.has(k)&&g[ny][nx].type==='floor'){ seen.add(k); q.push([nx,ny]); } } }
  return out;
}
const ARENA_SURRENDER_TICKS=60;   // fleeing for this long (about 20 s at normal speed) counts as giving up
const arenaAlive=(st,ti)=>st.creatures.filter(c=>arenaTeamOf(c)===ti && !c.unconscious && !c.removed && !c.dead && !c.imprisoned);
// one tick of a match; returns true while it goes on
function arenaStep(st){
  st.tickCount++;
  st.creatures.slice().forEach(c=>guard('creature '+(c.kind||'')+' '+(c.state||''),tickCreature,c));
  guard('projectiles',tickProjectiles);
  guard('pickups',arenaPickups,st);
  if(st.arena.fog) guard('fog',arenaFog,st);
  [processDeaths,tickCorpses,tickEffects,pruneEventLog].forEach(f=>guard(f.name,f));
  st.creatures.forEach(c=>{
    if(c.state==='fleeing' && !c.unconscious) c.fleeTicks=(c.fleeTicks||0)+1; else if(c.fleeTicks) c.fleeTicks=Math.max(0,c.fleeTicks-2);
    if(c.fleeTicks>=ARENA_SURRENDER_TICKS && !c.unconscious){ c.surrendered=true; c.unconscious=true; c.unconsciousTimer=1e9; c.path=[]; c.fightTarget=null; c.state='unconscious'; logEvent(`${actorLabel(c)} gibt auf.`,c.x,c.y); }
  });
  const a=arenaAlive(st,0).length, b=arenaAlive(st,1).length;
  if(a===0||b===0||st.tickCount>=st.arena.maxTicks){
    st.arena.over=true; st.arena.winner=(a>0&&b===0)?0:((b>0&&a===0)?1:-1);
    if(st.arena.winner<0 && st.arena.hpWins){   // out of time: whoever kept more of the health wins
      const hp=ti=>st.creatures.filter(c=>arenaTeamOf(c)===ti&&!c.removed).reduce((n,c)=>n+Math.max(0,c.hp)/Math.max(1,c.maxHp),0), h0=hp(0), h1=hp(1);
      if(Math.abs(h0-h1)>0.05) st.arena.winner=h0>h1?0:1;
    }
  }
  return !st.arena.over;
}
// headless runs for numbers (the test bench)
function arenaSimulate(setup,n,onProgress){
  const prevState=state, prevScreen=screen, res={ wins:[0,0], draws:0, ticks:0, left:[0,0], runs:n };
  try{
    for(let i=0;i<n;i++){
      const st=arenaBuild(setup,'#'+i); state=st; screen='level';
      while(arenaStep(st)){}
      if(st.arena.winner<0) res.draws++; else res.wins[st.arena.winner]++;
      res.ticks+=st.tickCount; res.left[0]+=arenaAlive(st,0).length; res.left[1]+=arenaAlive(st,1).length;
      if(onProgress) onProgress(i+1);
    }
  } finally { state=prevState; screen=prevScreen; }
  res.ticks=Math.round(res.ticks/n); res.left=res.left.map(v=>+(v/n).toFixed(1));
  return res;
}
window.ArenaLab={ simulate:(setup,n)=>arenaSimulate(setup||arenaSetup,n||10), defaultSetup:arenaDefaultSetup, kinds:arenaKinds, build:arenaBuild };

// ---- the live match on the level screen ----
let arenaLiveSetup=null, arenaRuns=0;
function arenaStart(setup){
  arenaLiveSetup=JSON.parse(JSON.stringify(setup)); arenaRuns++;
  const st=arenaBuild(setup,arenaRuns>1?'r'+arenaRuns:'');
  if(typeof FX!=='undefined') FX.reset();
  state=st; document.body.classList.add('arenaMode'); debugNoFog=!setup.fog; document.body.classList.toggle('ludusMode',!!setup.ludus);
  if(setup.fog) arenaFog(st);
  document.getElementById('levelSubtitle').textContent='Kreaturen-Arena — Dunkelheit gegen Helden';
  selectedRoomTiles=null; possessed=null; heldEntity=null;
  showScreen('level');
  state=st; jumpCameraTo((st.arena.anchors[0].x+st.arena.anchors[1].x)/2, (st.arena.anchors[0].y+st.arena.anchors[1].y)/2);
  setSpeed(1); arenaPanelSig='';
  document.getElementById('arenaResult').hidden=true; arenaSpell=null;
  document.getElementById('menu-spells').hidden=false;
  arenaRenderPanel();
}
function arenaTick(){
  const st=state;
  if(st.arena.over){ guard('draw',draw); guard('arenaPanel',arenaRenderPanel); arenaShowResult(); return; }
  arenaStep(st);
  guard('draw',draw); if(st.tickCount%4===0||st.arena.over) guard('arenaPanel',arenaRenderPanel);
  if(st.arena.over) arenaShowResult();
}
function arenaShowResult(){
  const box=document.getElementById('arenaResult'); if(!box.hidden) return;
  const st=state, w=st.arena.winner, names=arenaLiveSetup?arenaLiveSetup.teams.map(t=>t.name):['A','B'];
  document.getElementById('arenaResultTitle').textContent= w<0 ? 'Unentschieden' : `${names[w]} gewinnt`;
  document.getElementById('arenaResultText').textContent=`Nach ${st.tickCount} Ticks. Überlebende: ${names[0]} ${arenaAlive(st,0).length}, ${names[1]} ${arenaAlive(st,1).length}.`;
  document.getElementById('arenaAgain').hidden=document.getElementById('arenaToSetup').hidden=ludusActive;
  document.getElementById('ludusContinue').hidden=!ludusActive;
  if(ludusActive){ document.getElementById('arenaResultTitle').textContent=ludusResolve(st); document.getElementById('arenaResultText').textContent=ludusResultText.split('\n').slice(1).join(' '); }
  box.hidden=false;
}
function arenaLeave(){
  if(ludusActive){ ludusLeaveMatch(); return; }
  arenaSpell=null; document.getElementById('menu-spells').hidden=true;
  document.body.classList.remove('arenaMode','ludusMode'); debugNoFog=false; possessed=null; fpRestoreOnLeave();
  state=makeDefaultState(); showScreen('arena');
}
function fpRestoreOnLeave(){ try{ if(typeof endPossession==='function') endPossession(); }catch(e){} }
// ---- god spells for the arena (the player's hand: heal, wake, curse, speed, fire, lightning, paralyse, summon) ----
const ARENA_SPELLS=[ { id:'heal', icon:'💚', name:'Heilen' }, { id:'revive', icon:'🦄', name:'Wecken' }, { id:'curse', icon:'🥶', name:'Fluch' }, { id:'haste', icon:'💨', name:'Eile' },
  { id:'fireball', icon:'🔥', name:'Feuerball' }, { id:'bolt', icon:'⚡', name:'Blitz' }, { id:'paralyze', icon:'😱', name:'Lähmen' }, { id:'summon', icon:'➕', name:'Herbeirufen' } ];
let arenaSpell=null, arenaSummon={ kind:'ork', level:5, team:0 };
function arenaSetSpell(id){
  arenaSpell=(arenaSpell===id)?null:id;
  if(arenaSpell){ if(pickMode){ cancelHeldEntity(); exitPickMode(); } possessMode=false; document.getElementById('possessBtn').classList.remove('active'); }
  arenaPanelSig=''; arenaRenderPanel();
  setInspect(arenaSpell?`${ARENA_SPELLS.find(s=>s.id===arenaSpell).name}: auf ein Feld klicken (Rechtsklick/erneut wählen bricht ab).`:'');
}
function arenaDamage(c,dmg){
  c.hp-=dmg; c.hitAt=Date.now();
  if(c.hp<=0){ c.hp=0; knockOutOrKill(c,0,null,'arena'); }
}
function arenaCast(x,y){
  const st=state, all=st.creatures, at=all.find(c=>c.x===x&&c.y===y&&!c.held), near=r=>all.filter(c=>Math.abs(c.x-x)+Math.abs(c.y-y)<=r&&!c.removed);
  const s=arenaSpell; let used=true;
  if(s==='heal'){ if(at){ at.hp=at.maxHp; emitFx('claim',x,y); } else used=false; }
  else if(s==='revive'){ if(at&&at.unconscious){ at.unconscious=false; at.hp=Math.max(1,Math.round(at.maxHp*0.5)); emitFx('claim',x,y); } else used=false; }
  else if(s==='curse'){ near(1).forEach(c=>{ c.weakTicks=80; }); emitFx('claim',x,y); }
  else if(s==='haste'){ near(1).forEach(c=>{ c.hastedTicks=60; c.rallyTicks=60; }); emitFx('claim',x,y); }
  else if(s==='fireball'){ near(1).forEach(c=>arenaDamage(c,20)); emitFx('dig',x,y,{ color:'#ff7a20' }); }
  else if(s==='bolt'){ if(at) arenaDamage(at,35); else used=false; if(at) emitFx('dig',x,y,{ color:'#ffe060' }); }
  else if(s==='paralyze'){ near(2).forEach(c=>{ c.rootedTicks=20; c.path=[]; }); emitFx('claim',x,y); }
  else if(s==='summon'){
    if(st.grid[y][x].type!=='floor'||at) used=false;
    else { const c=arenaMake(arenaSummon.kind,x,y); c.faction=arenaSummon.team===0?'evil':'good'; c.level=Math.max(1,arenaSummon.level|0||1); c.xp=xpForLevel(c.level); c.maxHp=statMaxHp(c); c.hp=c.maxHp;
      c.inventory=arenaGear(c,{ gear:'auto', tier:1 }); c.arenaTeam=arenaSummon.team; c.state='fighting'; c.path=[]; st.creatures.push(c); st.arena.roster[arenaSummon.team].push(c); emitFx('claim',x,y); }
  }
  if(!used) setInspect('Hier gibt es kein Ziel für diesen Zauber.');
  draw(); arenaPanelSig=''; arenaRenderPanel();
}
let arenaPanelSig='';
function arenaRenderPanel(){
  const st=state, box=document.getElementById('arenaPanel'); if(!st||!st.arena||!box) return;
  const names=(arenaLiveSetup||arenaSetup).teams.map(t=>t.name);
  const row=c=>{ const pct=Math.max(0,Math.round(100*c.hp/Math.max(1,c.maxHp))), out=c.unconscious||c.removed||c.dead;
    return `<div class="arRow${out?' out':''}" data-row="${st.creatures.indexOf(c)}"><span class="arIc">${creatureIconHTML(c,28)}</span><span class="arName">${SPECIES[c.kind].label} ${c.level}${c.fallen?'':''}</span><span class="arBar"><i style="width:${pct}%"></i><em style="width:${Math.round(staminaOf(c))}%"></em></span><button data-pos="${st.creatures.indexOf(c)}" title="Besessenheit">👁</button></div>`; };
  const cols=[0,1].map(ti=>{ const all=st.creatures.filter(c=>arenaTeamOf(c)===ti); return `<div class="arTeam t${ti}"><b>${names[ti]}</b> <small>${arenaAlive(st,ti).length}/${all.length}</small>${all.map(row).join('')}</div>`; }).join('');
  const kinds=arenaKinds().map(k=>[k,SPECIES[k].label]).sort((p,q)=>p[1].localeCompare(q[1],'de'));
  const spells=ludusActive?'':`<div class="arSpells">${ARENA_SPELLS.map(s=>`<button data-spell="${s.id}" class="${arenaSpell===s.id?'on':''}" title="${s.name}">${s.icon} ${s.name}</button>`).join('')}</div>`
    + (arenaSpell==='summon'?`<div class="arSummon"><select data-sk>${arenaOpts(kinds,arenaSummon.kind)}</select> Stufe <input data-sl type="number" min="1" max="40" value="${arenaSummon.level}" style="width:44px"> <select data-st>${arenaOpts([[0,names[0]],[1,names[1]]],arenaSummon.team)}</select></div>`:'');
  const html=`<div class="arInfo">Tick ${st.tickCount}</div>${spells}${cols}`;
  if(html!==arenaPanelSig && !(box.contains(document.activeElement) && /SELECT|INPUT/.test(document.activeElement.tagName))){ arenaPanelSig=html; box.innerHTML=html; box.querySelectorAll('button[data-spell]').forEach(b=>b.addEventListener('click',()=>arenaSetSpell(b.dataset.spell)));
    const sk=box.querySelector('[data-sk]'); if(sk){ sk.addEventListener('change',()=>{ arenaSummon.kind=sk.value; }); box.querySelector('[data-sl]').addEventListener('change',e=>{ arenaSummon.level=+e.target.value; }); box.querySelector('[data-st]').addEventListener('change',e=>{ arenaSummon.team=+e.target.value; }); }
    box.querySelectorAll('.arRow').forEach(r=>r.addEventListener('pointerdown',e=>{ if(e.target.closest('button')) return; const c=st.creatures[+r.dataset.row]; if(c) combatBarClick(c); }));
    box.querySelectorAll('button[data-pos]').forEach(b=>b.addEventListener('click',()=>{ const c=st.creatures[+b.dataset.pos]; if(c && !c.unconscious){ startPossession(c); } })); }
}

// ---- the set-up screen ----
function arenaOpts(list,sel){ return list.map(([v,l])=>`<option value="${v}"${v===sel?' selected':''}>${l}</option>`).join(''); }
function arenaItemOpts(type,sel){
  const rows=Object.keys(ITEMS).filter(id=>ITEMS[id].type===type).map(id=>[id,`${ITEMS[id].baseLabel||ITEMS[id].label} (${ITEMS[id].tierLabel||'normal'})`]);
  return arenaOpts([['','—']].concat(rows),sel);
}
function arenaRenderSetup(){
  const el=document.getElementById('arenaSetupBody'); if(!el) return;
  const kinds=arenaKinds().map(k=>[k,SPECIES[k].label]).sort((a,b)=>a[1].localeCompare(b[1],'de'));
  const abil=[['','keine']].concat(Object.keys(ABILITIES).filter(id=>!ABILITIES[id].passive).map(id=>[id,ABILITIES[id].icon+' '+ABILITIES[id].name]));
  const group=(ti,gi,g)=>`<div class="arGroup" data-t="${ti}" data-g="${gi}">
    <canvas class="arPrev" width="96" height="96" data-prev></canvas>
    <div class="arFields">
      <select data-f="kind">${arenaOpts(kinds,g.kind)}</select> Stufe <input data-f="level" type="number" min="1" max="40" value="${g.level}">
      Ausrüstung <select data-f="gear">${arenaOpts(ARENA_GEARS,g.gear)}</select>
      ${g.gear==='auto'?`Güte <select data-f="tier">${arenaOpts([[0,'krude'],[1,'normal'],[2,'fein'],[3,'episch']],g.tier)}</select>`:''}
      ${g.gear==='custom'?`<select data-f="weapon" title="Waffe">${arenaItemOpts('weapon',g.weapon)}</select><select data-f="weapon2" title="Zweite Waffe">${arenaItemOpts('weapon',g.weapon2)}</select><select data-f="armor" title="Rüstung">${arenaItemOpts('armor',g.armor)}</select><select data-f="shield" title="Schild">${arenaItemOpts('shield',g.shield)}</select>`:''}
      Fähigkeit <select data-f="ability">${arenaOpts(abil,g.ability)}</select>
    </div>
    <div class="arBtns"><button data-copy="1" title="Kopie ins Team legen">Kopieren</button><button data-reroll="1" title="Aussehen der Ausrüstung neu würfeln">🎲</button><button data-del="1" title="Kämpfer entfernen">✕</button></div></div>`;
  const team=(ti)=>`<div class="arTeamBox t${ti}"><h3><input data-tn="${ti}" value="${arenaSetup.teams[ti].name}"></h3>${arenaSetup.teams[ti].groups.map((g,gi)=>group(ti,gi,g)).join('')}<button data-add="${ti}">+ Kämpfer</button></div>`;
  const m=arenaSetup.map, num=(f,v,max)=>`<input data-m="${f}" type="number" min="0" max="${max}" value="${v}">`;
  el.innerHTML=`<div class="arTeams">${team(0)}${team(1)}</div>
    <div class="arMap"><h3>Gelände</h3>
      Form <select data-m="layout">${arenaOpts(ARENA_LAYOUTS,m.layout)}</select>
      Größe <select data-m="dims">${arenaOpts(ARENA_DIMS,m.dims)}</select>
      Start <select data-m="near">${arenaOpts([[0,'weit auseinander'],[1,'nah beieinander']],m.near?1:0)}</select>
      Seed <input data-m="seed" value="${m.seed||''}" placeholder="leer = Zufall" size="10">
      Lava ${num('lava',m.lava,4)} Wasser ${num('water',m.water,4)} Kristall ${num('crystal',m.crystal,3)}
    </div>
    <div class="arBatch">Simulation: <input data-b="batch" type="number" min="1" max="200" value="${arenaSetup.batch||20}"> Läufe <button id="arenaSim">Simulieren</button> <span id="arenaSimOut"></span></div>`;
  const apply=()=>{ arenaSaveSetup(); };
  el.querySelectorAll('.arGroup').forEach(row=>{
    const ti=+row.dataset.t, gi=+row.dataset.g, grp=arenaSetup.teams[ti].groups[gi];
    row.querySelectorAll('[data-f]').forEach(inp=>inp.addEventListener('change',()=>{ const f=inp.dataset.f; grp[f]=inp.type==='number'||f==='tier'?+inp.value:inp.value; apply(); if(f==='gear'||f==='kind') arenaRenderSetup(); }));
    row.querySelector('[data-copy]').addEventListener('click',()=>{ arenaSetup.teams[ti].groups.splice(gi+1,0,Object.assign({},grp,{ seed:Math.floor(Math.random()*1e9) })); apply(); arenaRenderSetup(); });
    row.querySelector('[data-reroll]').addEventListener('click',()=>{ grp.seed=Math.floor(Math.random()*1e9); apply(); });
    row.querySelector('[data-del]').addEventListener('click',()=>{ arenaSetup.teams[ti].groups.splice(gi,1); if(!arenaSetup.teams[ti].groups.length) arenaSetup.teams[ti].groups.push(arenaGroup(ti?'barbarian':'ork',1,1)); apply(); arenaRenderSetup(); });
  });
  el.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>{ const ti=+b.dataset.add; arenaSetup.teams[ti].groups.push(arenaGroup(ti?'knight':'troll',1,1)); apply(); arenaRenderSetup(); }));
  el.querySelectorAll('[data-tn]').forEach(inp=>inp.addEventListener('change',()=>{ arenaSetup.teams[+inp.dataset.tn].name=inp.value||'Team'; apply(); }));
  el.querySelectorAll('[data-m]').forEach(inp=>inp.addEventListener('change',()=>{ const f=inp.dataset.m; arenaSetup.map[f]=(inp.type==='number'||f==='near')?+inp.value:inp.value; apply(); }));
  el.querySelector('[data-b]').addEventListener('change',e=>{ arenaSetup.batch=+e.target.value||20; apply(); });
  document.getElementById('arenaSim').addEventListener('click',()=>{
    const out=document.getElementById('arenaSimOut'), n=Math.max(1,Math.min(200,arenaSetup.batch|0||20)); out.textContent='läuft …';
    setTimeout(()=>{ const r=arenaSimulate(arenaSetup,n,null), nm=arenaSetup.teams.map(t=>t.name);
      out.textContent=`${nm[0]} ${r.wins[0]} · ${nm[1]} ${r.wins[1]} · unentschieden ${r.draws} (von ${n}) · Ø ${r.ticks} Ticks · Überlebende Ø ${r.left[0]} / ${r.left[1]}`; },30);
  });
}
// the live picture of each entry: its sprite with the chosen gear, idling; the creature is rebuilt whenever the entry changes
const ARENA_PREVIEWS=new WeakMap();
function arenaPreviewCreature(grp){
  const sig=JSON.stringify([grp.kind,grp.level,grp.gear,grp.tier,grp.weapon,grp.weapon2,grp.armor,grp.shield,grp.seed]);
  let p=ARENA_PREVIEWS.get(grp); if(p&&p.sig===sig) return p.c;
  const keep=Math.random; let c=null;
  try{ c=arenaMake(grp.kind,0,0); c.level=Math.max(1,Math.min(40,grp.level|0||1)); c.inventory=arenaGear(c,grp,0); }catch(e){ c=null; } finally { Math.random=keep; }
  ARENA_PREVIEWS.set(grp,{ sig, c }); return c;
}
// one creature as an idling sprite with its gear on a canvas; team 0 stands on a red ring, team 1 on a blue one
function arenaPaintCreature(cv,c,ti,unit){
  const g=cv.getContext('2d'); g.clearRect(0,0,cv.width,cv.height); if(!c) return;
  const key=(typeof ZOO!=='undefined'&&ZOO[c.kind+(ti===0?'_ally':'')])?c.kind+(ti===0?'_ally':''):c.kind, z=ZOO[key]; if(!z) return;
  const extra=z.humanoid?equipLook(c):undefined, t=Math.floor(Date.now()/260)+(c.id||0), img=spriteCanvas(key,t,ti===0,false,extra);
  const size=Math.round((unit||64)*creatureScale(c)), x=(cv.width-size)>>1, y=cv.height-size-4;
  g.fillStyle=ti===0?'rgba(230,60,50,0.55)':'rgba(70,130,255,0.55)'; g.beginPath(); g.ellipse(cv.width/2,cv.height-8,size*0.34,size*0.11,0,0,7); g.fill();
  g.imageSmoothingEnabled=false; g.drawImage(img,x,y,size,size);
}
function arenaDrawPreviews(){
  document.querySelectorAll('#arenaSetupBody canvas[data-prev]').forEach(cv=>{
    const row=cv.closest('.arGroup'); if(!row) return; const grp=arenaSetup.teams[+row.dataset.t].groups[+row.dataset.g]; if(!grp) return;
    arenaPaintCreature(cv,arenaPreviewCreature(grp),+row.dataset.t);
  });
}
setInterval(()=>{ if(screen==='arena') arenaDrawPreviews(); },200);
async function arenaOpenSetup(){ await arenaLoadSetup(); showScreen('arena'); arenaRenderSetup(); }
document.getElementById('menuArena').addEventListener('click',arenaOpenSetup);
document.getElementById('arenaBack').addEventListener('click',()=>showScreen('menu'));
document.getElementById('arenaStart').addEventListener('click',()=>{ arenaSaveSetup(); arenaStart(arenaSetup); });
document.getElementById('arenaAgain').addEventListener('click',()=>arenaStart(arenaLiveSetup||arenaSetup));
document.getElementById('arenaToSetup').addEventListener('click',arenaLeave);
