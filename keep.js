// The keep of the good side (design: docs/design.md, "Die Wirtschaft der Guten im Level").
// The enemy portal is their entrance and throne room in one. The province reacts to the ancient evil that appeared underground:
// it lures heroes from its pool, builds rooms around the portal (same room types as the player, a blue skin) and sends trupps down.
// How it behaves is a personality (AI_PROFILES) taken from the region on the world map: a panicking village plays slow, scattered
// and defensive, a legendary hero like Oberon is hyper aggressive and reacts to what the player does.
// Everything here works on the game state (state.keep) and is called from tickWar().
const AI_PROFILES={
  panic:     { workers:1, label:'Unkoordiniert und panisch (der Bürgermeister packt lieber seinen Karren)', aggression:0.12, speed:0.55, coordination:0.15, patience:1.7, maxRooms:3,
               rooms:['hatchery','dormitory','storage'] },
  cautious:  { workers:2, label:'Vorsichtig und langsam', aggression:0.3, speed:0.8, coordination:0.5, patience:1.3, maxRooms:5,
               rooms:['hatchery','dormitory','forge','library','storage'] },
  drilled:   { workers:2, label:'Gedrillt und koordiniert', aggression:0.55, speed:1.0, coordination:0.9, patience:1.0, maxRooms:7,
               rooms:['dormitory','arena','hatchery','forge','library','dormitory','arena'] },
  aggressive:{ workers:1, label:'Aggressiv: schickt früh Trupps', aggression:0.9, speed:1.15, coordination:0.55, patience:0.8, maxRooms:6,
               rooms:['dormitory','arena','hatchery','dormitory','forge','library'] },
  fortified: { workers:3, label:'Verschanzt: wartet auf den Angriff', aggression:0.15, speed:0.9, coordination:0.9, patience:1.5, maxRooms:7,
               rooms:['dormitory','forge','hatchery','dormitory','storage','arena','library'] },
  hyper:     { workers:0, label:'Hyperaggressiv und reagiert auf dein Handeln', aggression:1.0, speed:1.4, coordination:0.9, patience:0.6, maxRooms:0, reacts:true, rooms:[] },
  greedy:    { workers:3, label:'Geizig: bewacht seinen Schatz und baut aus', aggression:0.25, speed:0.9, coordination:0.7, patience:1.4, maxRooms:5,
               rooms:['storage','forge','dormitory','hatchery','storage'] }
};

const KEEP_ROOM_NAMES={ dormitory:'Kaserne', hatchery:'Vorratskammer', library:'Zauberschule', arena:'Übungsplatz', forge:'Schmiede', storage:'Lager' };

// What a region builds follows from what it is (REGION_TYPES[...].build: a village a farm and some beds, a fortress drill grounds and forges)
// and from the world's progress: the good side's stats (mods) unlock the matching rooms everywhere.
function keepRoomPlan(rt, mods){
  const plan=(rt.build||['dormitory','hatchery']).slice(), prof=AI_PROFILES[rt.ai||'cautious'];
  if(!plan.length) return [];
  if(mods.gearTier>=2 && !plan.includes('forge')) plan.push('forge');
  if(mods.levelBonus>=2 && !plan.includes('arena')) plan.push('arena');
  if(mods.wizards>=1 && !plan.includes('library')) plan.push('library');
  if(mods.size>=2) plan.push('hatchery');
  return plan.slice(0, prof.maxRooms + (mods.waves>=5?1:0));
}

const KEEP_RECRUIT_BASE=130;      // ticks between two recruits at speed 1
const KEEP_BUILD_BASE=260;        // ticks between two new rooms at speed 1
const KEEP_FIRST_RECRUIT=380;     // the province needs time to react

function keepRoomCounts(){
  const c={};
  for(const row of state.grid) for(const t of row) if(t.goodRoom) c[t.goodRoom]=(c[t.goodRoom]||0)+1;
  return c;
}
function keepTiles(){
  const out=[];
  state.grid.forEach((row,y)=>row.forEach((t,x)=>{ if(t.goodRoom || t.room==='portal') out.push({ x, y }); }));
  return out;
}
function keepPoolTotal(mods){
  let total=0;
  for(let n=1;n<=mods.waves;n++) total+=Math.min(WAVE_MAX_SIZE+4, 1+Math.floor(n*0.7)+mods.size);
  return total;
}

// regionType: the REGION_TYPES entry; builder: grow rooms around the portal (normal levels), otherwise the structure is already there (gates)
function initKeep(rt, mods, builder){
  const id=rt.ai||'cautious', prof=AI_PROFILES[id];
  state.war.poolTotal=keepPoolTotal(mods);
  const plan=keepRoomPlan(rt, mods);
  state.keep={ profileId:id, profile:prof, recruited:0, total:keepPoolTotal(mods), food:2+mods.size, timer:Math.round(KEEP_FIRST_RECRUIT/prof.speed),
    buildTimer:Math.round(KEEP_BUILD_BASE/(prof.speed*1.5)), builder:!!builder && plan.length>0, plan, roomsBuilt:0, rootGuards:0, boost:1, log:[] };
  // a developed region starts with part of its keep already standing
  if(state.keep.builder) for(let i=0;i<Math.min(plan.length,Math.max(0,mods.waves-3));i++){ if(keepPlanRoom()) keepFinishJob(state.keep.job); }
}

// choose a site for the next room next to the keep (rock only, never against the player's dungeon); the workers carve and build it
function keepPlanRoom(){
  const k=state.keep, prof=k.profile;
  if(k.roomsBuilt>=k.plan.length) return false;
  const type=k.plan[k.roomsBuilt];
  const [w,h]= (type==='storage'||type==='dormitory') ? [3,2] : [2,2];
  const seeds=keepTiles(); if(!seeds.length) return false;
  const g=state.grid;
  const free=(x,y)=>{
    if(x<2||y<2||x>=WORLD_COLS-2||y>=WORLD_ROWS-2) return false;
    const t=g[y][x];
    if(t.owned||t.room||t.goodRoom||t.gem||t.root||t.fixed||t.reinforced||t.hoard||t.tree||t.castle||t.grove) return false;
    if(t.type!=='rock' && !(t.type==='floor'&&t.natural)) return false;
    return !neighbors(x,y).some(([nx,ny])=>g[ny][nx].owned);
  };
  for(let attempt=0;attempt<80;attempt++){
    const s=seeds[randInt(0,seeds.length-1)], dir=[[1,0],[-1,0],[0,1],[0,-1]][randInt(0,3)];
    const x0 = dir[0]>0 ? s.x+1 : (dir[0]<0 ? s.x-w : s.x-randInt(0,w-1));
    const y0 = dir[1]>0 ? s.y+1 : (dir[1]<0 ? s.y-h : s.y-randInt(0,h-1));
    let ok=true;
    for(let y=y0;y<y0+h&&ok;y++) for(let x=x0;x<x0+w;x++) if(!free(x,y)){ ok=false; break; }
    if(!ok) continue;
    k.job={ x0, y0, w, h, type, progress:0 };
    return true;
  }
  return false;
}
const KEEP_BUILD_WORK=36;      // worker swings needed to finish a room once the site is dug out
const KEEP_RECLAIM_WORK=18;    // swings to win back one conquered tile

function keepSiteTiles(job){ const out=[]; for(let y=job.y0;y<job.y0+job.h;y++) for(let x=job.x0;x<job.x0+job.w;x++) out.push({ x, y }); return out; }
// a conquered enemy tile the workers want back: next to the keep, with no player unit near it
function keepReclaimTarget(c){
  const g=state.grid, units=state.imps.concat(state.creatures.filter(o=>o.faction!=='good'));
  const ours=(x,y)=>{ const t=g[y][x]; return t.type==='floor' && !t.owned && (t.goodRoom || t.room==='portal'); };
  const test=(x,y)=>{
    const t=g[y][x];
    if(!(t.type==='floor' && t.owned && t.wasGood)) return false;
    if(!neighbors(x,y).some(([nx,ny])=>ours(nx,ny))) return false;
    return !units.some(u=>Math.abs(u.x-x)<=3&&Math.abs(u.y-y)<=3);
  };
  const res=bfsFind(c.x,c.y,(x,y)=>neighbors(x,y).some(([nx,ny])=>test(nx,ny)));
  if(!res) return null;
  const end=res.path.length?res.path[res.path.length-1]:{ x:c.x, y:c.y };
  const t=neighbors(end.x,end.y).find(([nx,ny])=>test(nx,ny));
  return t?{ x:t[0], y:t[1], path:res.path }:null;
}
function keepTickWorker(c){
  const k=state.keep, g=state.grid;
  if(c.path && c.path.length){ stepAlong(c); return; }
  if(!k){ return; }
  // 1. win back conquered rooms (shared ground: whoever holds it, uses it)
  const rt=keepReclaimTarget(c);
  if(rt){
    if(rt.path.length){ c.path=rt.path; c.state='marching'; stepAlong(c); return; }
    const t=g[rt.y][rt.x]; c.state='building';
    t.reclaim=(t.reclaim||0)+1;
    if(t.reclaim>=KEEP_RECLAIM_WORK){
      t.reclaim=0; t.owned=false; t.enemy=false; t.goodRoom=t.wasGood; t.room=null; t.reserved=null; t.queuedRoom=null;
      logEvent('Die Gegner holen sich einen Raum zurück.', rt.x, rt.y);
      emitFx('build', rt.x, rt.y);
    }
    return;
  }
  // 2. the current building site: dig it out, then build
  const job=k.job; if(!job){ c.state='idle'; return; }
  const sites=keepSiteTiles(job), isRock=p=>g[p.y][p.x].type==='rock';
  if(sites.some(isRock)){
    const adj=sites.find(p=>isRock(p)&&Math.abs(c.x-p.x)+Math.abs(c.y-p.y)===1);
    if(adj){ c.state='digging'; interact(c, adj.x, adj.y); return; }
    const res=bfsFind(c.x,c.y,(x,y)=>sites.some(p=>isRock(p) && Math.abs(x-p.x)+Math.abs(y-p.y)===1));
    if(res && res.path.length){ c.path=res.path; c.state='marching'; stepAlong(c); }
    else k.job=null;          // unreachable (walled in): plan something else
    return;
  }
  const near=sites.some(p=>Math.abs(c.x-p.x)+Math.abs(c.y-p.y)<=1);
  if(!near){
    const res=bfsFind(c.x,c.y,(x,y)=>sites.some(p=>Math.abs(x-p.x)+Math.abs(y-p.y)<=1));
    if(res && res.path.length){ c.path=res.path; c.state='marching'; stepAlong(c); } else k.job=null;
    return;
  }
  c.state='building'; job.progress++;
  if(job.progress>=KEEP_BUILD_WORK) keepFinishJob(job);
}
function keepFinishJob(job){
  const k=state.keep, g=state.grid;
  keepSiteTiles(job).forEach(p=>{ const t=g[p.y][p.x]; t.type='floor'; t.owned=false; t.gold=false; t.ore=false; t.marked=false; t.goodRoom=job.type; t.wasGood=job.type; t.enemy=false; emitFx('build', p.x, p.y); });
  k.roomsBuilt++; k.job=null;
  logEvent(`Die Gegner bauen: ${KEEP_ROOM_NAMES[job.type]||job.type}.`, job.x0, job.y0);
}
function keepWorkers(){ return state.creatures.filter(c=>c.kind==='worker'&&!c.unconscious); }
function keepSpawnWorker(){
  const tiles=heroSpawnTiles(); if(!tiles.length) return false;
  const h=createHero('worker', tiles[0].x, tiles[0].y);
  h.inventory=[]; h.maxHp=statMaxHp(h); h.hp=h.maxHp;
  state.creatures.push(h);
  return true;
}

function keepPickKind(rooms,mods){
  const w=state.war, k=state.keep;
  if(w.heroPool) return w.heroPool[randInt(0,w.heroPool.length-1)];       // gates: the province's own pool
  const bag=['barbarian','barbarian','thief'];
  // technology: wizards need a school, knights need a forge (and the iron to arm them)
  if((rooms.arena||0)>=2) bag.push('barbarian','barbarian');
  if((rooms.library||0)>=1) for(let i=0;i<1+mods.wizards;i++) bag.push('wizard');
  if((rooms.forge||0)>=1 && mods.gearTier>=1) bag.push('knight','knight');
  if((rooms.dormitory||0)>=3) bag.push('thief');
  return bag[randInt(0,bag.length-1)];
}

function keepRecruit(){
  const k=state.keep, w=state.war, mods=waveMods(w), rooms=keepRoomCounts(), prof=k.profile;
  const tiles=heroSpawnTiles(); if(!tiles.length) return false;
  const alive=state.creatures.filter(c=>c.category==='hero'&&!c.unconscious&&!c.held).length;
  const cap=4+Math.floor(((rooms.dormitory||0))/2)+Math.round(prof.aggression*3);
  if(alive>=cap) return false;
  const last=(k.recruited>=k.total-1) && !w.goals;
  const kind=last?'knight':keepPickKind(rooms,mods);
  const arenaBonus=(rooms.arena||0)>=4?1:0;
  const level=Math.min(MAX_LEVEL, 1+Math.floor(k.recruited/6)+mods.levelBonus+arenaBonus+(last?2:0));
  const forge=rooms.forge||0, noBuild=!k.builder;
  const tier=Math.max(0,Math.min(3, mods.gearTier+(forge>=4?1:0)-((!noBuild&&forge===0&&mods.gearTier>0)?1:0)));
  const h=spawnHero(kind, level, last, k.recruited, Object.assign({}, mods, { gearTier:tier }));
  if(!h) return false;
  k.recruited++; w.wave=k.recruited;
  // the director: attack at once (aggression) or wait at the portal until enough are gathered (coordination)
  if(Math.random()>=prof.aggression){ h.post={ x:tiles[0].x+randInt(-1,1), y:tiles[0].y+randInt(-1,1) }; }
  return true;
}

// garrison (heroes with a post) are released as a trupp when enough have gathered, or when the pool is spent
function keepDirector(){
  const k=state.keep, prof=k.profile;
  const garrison=state.creatures.filter(c=>c.category==='hero'&&c.post&&!c.unconscious);
  if(!garrison.length) return;
  const need=Math.max(1,Math.round(2+(1-prof.coordination)*6));
  const spent=k.recruited>=k.total;
  k.spentFor=spent?(k.spentFor||0)+1:0;
  if(garrison.length>=need || (spent && k.spentFor>20*prof.patience)){
    garrison.forEach(c=>{ c.post=null; });
    const t=heroSpawnTiles()[0]; if(t) logEvent(`Die Gegner sammeln sich und rücken mit ${garrison.length} Mann vor!`, t.x, t.y);
  }
}

// Oberon's reaction: every root the player cuts speeds up his recruiting and sends guards to dig toward the remaining roots
function keepOnRootCut(){
  const k=state.keep; if(!k||!k.profile.reacts) return;
  k.boost=1+0.25*(state.war.roots||0);
  const roots=[];
  state.grid.forEach((row,y)=>row.forEach((t,x)=>{ if(t.root) roots.push({ x, y }); }));
  const mods=waveMods(state.war), lvl=Math.min(MAX_LEVEL,3+mods.levelBonus), tiles=heroSpawnTiles();
  if(!tiles.length) return;
  roots.forEach((r,i)=>{
    const have=state.creatures.filter(c=>c.guardRoot&&c.guardRoot.x===r.x&&c.guardRoot.y===r.y&&!c.unconscious).length;
    if(have>=2) return;
    const h=spawnHero('elf', lvl, false, i, Object.assign({}, mods));
    if(h) h.guardRoot={ x:r.x, y:r.y };
  });
  logEvent('Oberon schickt Wächter zu den übrigen Wurzeln!', tiles[0].x, tiles[0].y);
}

// a guard digs toward its root and stays next to it; returns true while it has something to do
function keepGuardRoot(c){
  const r=c.guardRoot, rt=state.grid[r.y][r.x];
  if(!rt.root){ c.guardRoot=null; return false; }
  if(Math.abs(c.x-r.x)+Math.abs(c.y-r.y)===1){ c.state='guarding'; return true; }
  const route=digRouteToThrone(c,false,(x,y)=>Math.abs(x-r.x)+Math.abs(y-r.y)===1);
  if(!route||!route.length) return false;
  const walk=[];
  for(const st of route){ if(isWalkable(st.x,st.y)) walk.push(st); else break; }
  if(walk.length){ c.path=walk; c.state='marching'; stepAlong(c); return true; }
  c.state='digging'; interact(c, route[0].x, route[0].y);
  return true;
}

// A recruit waiting at the portal lives like the player's creatures do: it eats from the keep's stock (hatchery), rests in the dormitory
// and trains in the arena. Waiting makes heroes stronger but costs food; when the stock runs dry they march out hungry.
const KEEP_UPKEEP=0.004, KEEP_TRAIN_XP=0.05, KEEP_STARVE_TICKS=150;
function keepGarrison(c){
  const k=state.keep;
  if(Math.abs(c.x-c.post.x)+Math.abs(c.y-c.post.y)>1){
    const res=bfsFind(c.x,c.y,(x,y)=>x===c.post.x&&y===c.post.y);
    if(res&&res.path.length){ c.path=res.path; c.state='marching'; stepAlong(c); return true; }
  }
  c.state='guarding';
  if(!k) return true;
  const r=k.rooms||{};
  if(k.food>0){ k.food=Math.max(0,k.food-KEEP_UPKEEP); c.hungry=0; }
  else {
    c.hungry=(c.hungry||0)+1; c.state='hungry';
    if(c.hungry>KEEP_STARVE_TICKS){ c.post=null; c.hungry=0; logEvent('Hungrige Gegner verlassen den Posten und marschieren los!', c.x, c.y); return false; }
  }
  if(r.dormitory && c.hp<c.maxHp) c.hp=Math.min(c.maxHp,c.hp+0.04*Math.min(3,r.dormitory/3));
  if(r.arena && k.food>0 && (c.level||1)<MAX_LEVEL){
    c.state='training';
    c.xp=(c.xp||0)+KEEP_TRAIN_XP*Math.min(3,r.arena/3);
    if(c.xp>=xpForLevel((c.level||1)+1)){ c.level=(c.level||1)+1; c.maxHp=statMaxHp(c); c.hp=c.maxHp; }
  }
  return true;
}

function tickKeep(){
  const k=state.keep, w=state.war; if(!k) return;
  const prof=k.profile, mods=waveMods(w), rooms=keepRoomCounts();
  k.rooms=rooms;
  // economy: a trickle plus the farms; the keep is only as strong as what is still standing
  k.food+=(0.004+0.012*(rooms.hatchery||0))*prof.speed*k.boost;
  if(k.builder){
    const workers=keepWorkers();
    if(workers.length<prof.workers){ k.workerTimer=(k.workerTimer===undefined?60:k.workerTimer)-1; if(k.workerTimer<=0){ keepSpawnWorker(); k.workerTimer=Math.round(240/prof.speed); } }
    if(!k.job && workers.length){ k.buildTimer--; if(k.buildTimer<=0){ keepPlanRoom(); k.buildTimer=Math.round(KEEP_BUILD_BASE/(prof.speed*(1+0.1*k.roomsBuilt))); } }
  }
  if(k.recruited<k.total){
    k.timer--;
    if(k.timer<=0){
      if(k.food>=1 && keepRecruit()){ k.food-=1; k.timer=Math.round(KEEP_RECRUIT_BASE/(prof.speed*k.boost)); }
      else k.timer=15;
    }
  }
  if(state.tickCount%20===0) keepDirector();
}

// what the player may learn about the enemy (hint line and defeat explanation)
function keepSummary(){
  const k=state.keep; if(!k) return '';
  const r=keepRoomCounts();
  const names=KEEP_ROOM_NAMES;
  const parts=Object.keys(r).map(t=>`${names[t]||t} ${r[t]}`);
  const wk=keepWorkers().length, food=Math.floor(k.food);
  return `${k.recruited}/${k.total} Rekruten${wk?' · Handwerker '+wk:''} · Nahrung ${food}${parts.length?' · '+parts.join(' · '):''}`;
}
