// The keep of the good side (design: docs/design.md, "Die Wirtschaft der Guten im Level").
// The enemy portal is their entrance and throne room in one. The province reacts to the ancient evil that appeared underground:
// it lures heroes from its pool, builds rooms around the portal (same room types as the player, a blue skin) and sends trupps down.
// How it behaves is a personality (AI_PROFILES) taken from the region on the world map: a panicking village plays slow, scattered
// and defensive, a legendary hero like Oberon is hyper aggressive and reacts to what the player does.
// Everything here works on the game state (state.keep) and is called from tickWar().
const AI_PROFILES={
  panic:     { label:'Unkoordiniert und panisch (der Bürgermeister packt lieber seinen Karren)', aggression:0.12, speed:0.55, coordination:0.15, patience:1.7, maxRooms:3,
               rooms:['hatchery','dormitory','storage'] },
  cautious:  { label:'Vorsichtig und langsam', aggression:0.3, speed:0.8, coordination:0.5, patience:1.3, maxRooms:5,
               rooms:['hatchery','dormitory','forge','library','storage'] },
  drilled:   { label:'Gedrillt und koordiniert', aggression:0.55, speed:1.0, coordination:0.9, patience:1.0, maxRooms:7,
               rooms:['dormitory','arena','hatchery','forge','library','dormitory','arena'] },
  aggressive:{ label:'Aggressiv: schickt früh Trupps', aggression:0.9, speed:1.15, coordination:0.55, patience:0.8, maxRooms:6,
               rooms:['dormitory','arena','hatchery','dormitory','forge','library'] },
  fortified: { label:'Verschanzt: wartet auf den Angriff', aggression:0.15, speed:0.9, coordination:0.9, patience:1.5, maxRooms:7,
               rooms:['dormitory','forge','hatchery','dormitory','storage','arena','library'] },
  hyper:     { label:'Hyperaggressiv und reagiert auf dein Handeln', aggression:1.0, speed:1.4, coordination:0.9, patience:0.6, maxRooms:0, reacts:true, rooms:[] },
  greedy:    { label:'Geizig: bewacht seinen Schatz und baut aus', aggression:0.25, speed:0.9, coordination:0.7, patience:1.4, maxRooms:5,
               rooms:['storage','forge','dormitory','hatchery','storage'] }
};

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
  state.keep={ profileId:id, profile:prof, recruited:0, total:keepPoolTotal(mods), food:2+mods.size, timer:Math.round(KEEP_FIRST_RECRUIT/prof.speed),
    buildTimer:Math.round(KEEP_BUILD_BASE/(prof.speed*1.5)), builder:!!builder && prof.maxRooms>0, roomsBuilt:0, rootGuards:0, boost:1, log:[] };
}

// grow one room next to the keep by carving rock (the good side's workers are abstract for now)
function keepBuildRoom(){
  const k=state.keep, prof=k.profile;
  if(k.roomsBuilt>=prof.maxRooms) return false;
  const type=prof.rooms[k.roomsBuilt%prof.rooms.length];
  const [w,h]= (type==='storage'||type==='dormitory') ? [3,2] : [2,2];
  const seeds=keepTiles(); if(!seeds.length) return false;
  const g=state.grid;
  const free=(x,y)=>{
    if(x<2||y<2||x>=WORLD_COLS-2||y>=WORLD_ROWS-2) return false;
    const t=g[y][x];
    if(t.owned||t.room||t.goodRoom||t.gem||t.root||t.fixed||t.reinforced||t.hoard||t.tree||t.castle||t.grove) return false;
    if(t.type!=='rock' && !(t.type==='floor'&&t.natural)) return false;
    return !neighbors(x,y).some(([nx,ny])=>g[ny][nx].owned);    // never carve right against the player's dungeon
  };
  for(let attempt=0;attempt<80;attempt++){
    const s=seeds[randInt(0,seeds.length-1)], dir=[[1,0],[-1,0],[0,1],[0,-1]][randInt(0,3)];
    const x0 = dir[0]>0 ? s.x+1 : (dir[0]<0 ? s.x-w : s.x-randInt(0,w-1));
    const y0 = dir[1]>0 ? s.y+1 : (dir[1]<0 ? s.y-h : s.y-randInt(0,h-1));
    let ok=true;
    for(let y=y0;y<y0+h&&ok;y++) for(let x=x0;x<x0+w;x++) if(!free(x,y)){ ok=false; break; }
    if(!ok) continue;
    for(let y=y0;y<y0+h;y++) for(let x=x0;x<x0+w;x++){
      const t=g[y][x]; t.type='floor'; t.owned=false; t.natural=false; t.gold=false; t.ore=false; t.marked=false; t.goodRoom=type; t.enemy=false;
    }
    k.roomsBuilt++;
    logEvent(`Die Gegner bauen: ${ROOM_TYPES[type]?ROOM_TYPES[type].label:type}.`, x0, y0);
    return true;
  }
  k.buildTimer=Math.round(KEEP_BUILD_BASE/2);   // no space this time, try again soon
  return false;
}

function keepPickKind(rooms,mods){
  const w=state.war, k=state.keep;
  if(w.heroPool) return w.heroPool[randInt(0,w.heroPool.length-1)];       // gates: the province's own pool
  const bag=['barbarian','barbarian','thief'];
  if((rooms.arena||0)>=2) bag.push('barbarian','barbarian');
  if((rooms.library||0)>=2||mods.wizards>0) for(let i=0;i<2+mods.wizards;i++) bag.push('wizard');
  if((rooms.forge||0)>=2||mods.gearTier>=2) bag.push('knight','knight');
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

// a recruit waiting at the portal for the trupp to gather
function keepGarrison(c){
  if(Math.abs(c.x-c.post.x)+Math.abs(c.y-c.post.y)>1){
    const res=bfsFind(c.x,c.y,(x,y)=>x===c.post.x&&y===c.post.y);
    if(res&&res.path.length){ c.path=res.path; c.state='marching'; stepAlong(c); return true; }
  }
  c.state='guarding';
  return true;
}

function tickKeep(){
  const k=state.keep, w=state.war; if(!k) return;
  const prof=k.profile, mods=waveMods(w), rooms=keepRoomCounts();
  // economy: a trickle plus the farms; the keep is only as strong as what is still standing
  k.food+=(0.004+0.012*(rooms.hatchery||0))*prof.speed*k.boost;
  if(k.builder){ k.buildTimer--; if(k.buildTimer<=0){ keepBuildRoom(); k.buildTimer=Math.round(KEEP_BUILD_BASE/(prof.speed*(1+0.1*k.roomsBuilt))); } }
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
  const names={ dormitory:'Kaserne', hatchery:'Vorratskammer', library:'Zauberschule', arena:'Übungsplatz', forge:'Schmiede', storage:'Lager' };
  const parts=Object.keys(r).map(t=>`${names[t]||t} ${r[t]}`);
  return `${k.recruited}/${k.total} Rekruten${parts.length?' · '+parts.join(' · '):''}`;
}
