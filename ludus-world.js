// The Ludus world: persistent characters. Everyone the fighter meets in the pit, in the tavern or in the street is a character of the run's world
// ({id, name, kind, level, tier, seed, status, ...}): they keep their look, level and gear, remember how they met the fighter, can die, beg, join, or come back for revenge.
// The world is renewed after every tournament round (some leave, the rest grow, new ones arrive), so it never dies out. Concept: docs/ludus.md.
const LUDUS_WORLD_SIZE=10;
const ludusNpc=id=>(ludus&&ludus.world||[]).find(n=>n.id===id)||null;
const ludusNpcPool=()=>(ludus.world||[]).filter(n=>n.status==='active' && !n.maimed && n.id!==ludus.companion);
// what a character looks like to the arena and to the 3D view: the same fields as an anonymous opponent, plus the id
const ludusNpcFoe=n=>({ kind:n.kind, level:n.level, tier:n.tier, seed:n.seed, name:n.name, npc:n.id });
function ludusNpcName(r){
  const taken=new Set((ludus.world||[]).filter(n=>n.status==='active').map(n=>n.name).concat([ludus.fighter.name]));
  const free=LUDUS_NAMES.filter(x=>!taken.has(x)); const l=free.length?free:LUDUS_NAMES;
  return l[Math.floor(r()*l.length)];
}
function ludusNpcNew(r){
  const kinds=ludusKinds(), fl=ludus.fighter.level;
  return { id:'n'+Math.floor(r()*1e9), name:ludusNpcName(r), kind:kinds[Math.floor(r()*kinds.length)], level:Math.max(1,fl+Math.floor(r()*3)-1),
    tier:Math.max(0,Math.min(3,ludusAverageTier()+Math.floor(r()*3)-1)), seed:Math.floor(r()*1e9), status:'active', bond:0, met:0, last:null };
}
function ludusPopulate(){
  if(!ludus.world) ludus.world=[];
  const r=ludusRng('pop'+ludus.day+':'+ludus.world.length);
  let guard=0; while(ludus.world.filter(n=>n.status==='active').length<LUDUS_WORLD_SIZE && guard++<40) ludus.world.push(ludusNpcNew(r));
}
// once a week, after the tournament round: some retire, the others train, new ones come in
function ludusRepopulate(){
  const r=ludusRng('repop'+ludus.day);
  ludus.world.forEach(n=>{
    if(n.status!=='active') return;
    n.maimed=false;
    if(n.id===ludus.companion){ n.level++; return; }
    if(r()<0.25){ n.status='gone'; n.goneDay=ludus.day; return; }
    if(r()<0.6) n.level++;
    if(r()<0.25) n.tier=Math.min(3,n.tier+1);
  });
  ludus.world=ludus.world.filter(n=>n.status==='active' || (n.status==='dead' && ludus.day-(n.diedDay||0)<21));
  ludusPopulate();
}
// how a character stands to the fighter, in one line (the last thing that happened between them)
function ludusNpcStory(n){
  const l=n.last; if(!l) return n.id===ludus.companion?'dein Gefährte':'';
  const d=l.d, T={
    surrender:`hat sich dir an Tag ${d} ergeben`, beaten:`wurde von dir an Tag ${d} besiegt`, beatYou:`hat dich an Tag ${d} besiegt`, ally:`kämpfte an Tag ${d} an deiner Seite`,
    helped:`bekam von dir an Tag ${d} Münzen`, robbed:`wurde von dir an Tag ${d} ausgeraubt`, sent:`wurde von dir an Tag ${d} weggeschickt`, paid:`bekam von dir an Tag ${d} Schutzgeld`, scared:`ergriff an Tag ${d} vor dir die Flucht`, died:`fiel an Tag ${d} im Kampf`
  };
  return n.id===ludus.companion?'dein Gefährte':(T[l.t]||'');
}
const ludusGearWord=t=>['zerlumpt und schlecht bewaffnet','einfach ausgerüstet','gut ausgerüstet','prächtig ausgerüstet'][Math.max(0,Math.min(3,t))];
const ludusCastLine=s=>`${s.name} — ${SPECIES[s.kind].label}, Stufe ${s.level}, ${ludusGearWord(s.tier)}`;
// the look of a character for the 3D view
function ludusLookOf(s){
  const c=arenaMake(s.kind,0,0); c.level=s.level; c.inventory=arenaGear(c,ludusOppGroup(s),0);
  const extra=typeof equipLook==='function'?equipLook(c):undefined;
  return { kind:s.kind, extra:extra||undefined, sig:JSON.stringify(extra||null) };
}
// who sits in the tavern today: the companion, those the fighter knows, and a few strangers (the same for the whole day)
function ludusTavernGuests(){
  if(!ludus||ludus.over) return [];
  const r=ludusRng('tav'+ludus.day), act=(ludus.world||[]).filter(n=>n.status==='active'), comp=ludusNpc(ludus.companion);
  const shuf=l=>l.map(x=>[r(),x]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  const known=shuf(act.filter(n=>n.met&&n!==comp)), rest=shuf(act.filter(n=>!n.met&&n!==comp));
  return (comp&&comp.status==='active'?[comp]:[]).concat(known.slice(0,3)).concat(rest.slice(0,2)).slice(0,5);
}
// after a match: what happened to the characters who fought in it
function ludusNpcOutcomes(st,won){
  (st.arena.roster||[]).forEach((team,ti)=>team.forEach(c=>{
    const n=c.npcId&&ludusNpc(c.npcId); if(!n) return;
    n.met=1;
    const gone=c.removed||c.dead||!st.creatures.includes(c);
    if(gone){ n.status='dead'; n.diedDay=ludus.day; n.last={ t:'died', d:ludus.day }; if(ludus.companion===n.id) ludus.companion=null; return; }
    if(ti===0){ n.last={ t:'ally', d:ludus.day }; n.bond=Math.min(3,(n.bond||0)+1); return; }
    if(won){
      if(c.surrendered){ n.last={ t:'surrender', d:ludus.day }; n.maimed=true; }
      else n.last={ t:'beaten', d:ludus.day };
    } else { n.last={ t:'beatYou', d:ludus.day }; }
  }));
}
