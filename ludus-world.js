// The Ludus world: persistent characters. Everyone the fighter meets in the pit, in the tavern or in the street is a character of the run's world
// ({id, name, kind, level, tier, seed, status, ...}): they keep their look, level and gear, remember how they met the fighter, can die, beg, join, or come back for revenge.
// The world is renewed after every tournament round (some leave, the rest grow, new ones arrive), so it never dies out. Concept: docs/ludus.md.
const LUDUS_WORLD_SIZE=10;
// how strong a kind is, in levels (measured by duels against a mixed field with starter gear, see docs/balancing.md): a kind with +4 at level 3 fights like the field at level 7.
// Opponents are levelled with it, and the fighter's own kind is boosted or held back, so every kind starts with a fair chance.
const LUDUS_POWER={ angel:8, archer:-1.0, banshee:-0.5, barbarian:0.5, beetle:1.0, brood:-1.0, darkelf:0.0, darkknight:4, demon:7, dragon:15, dryad:-1.0, dwarf:1.0, elf:1.0, fairy:-5.5, ghost:-0.5, ghoul:1.0, giant:5, goblin:-6.5, golem:5, griffin:6, guardian:1.5, hound:-4.0, kitsune:4.0, knight:1.5, lich:5, lizard:-0.5, monk:1.0, ork:-1.5, paladin:3, phoenix:5.5, priest:-5.0, skeleton:-2.5, succubus:0.0, thief:-6.5, troll:3, unicorn:7, vampire:4.5, warlock:-3.5, werewolf:4.5, wisp:-6.0, wizard:-3.0, yule:-1.5, zombie:-0.5 };
const ludusPower=k=>LUDUS_POWER[k]||0;
// every kind is brought to the same strength: a weak one gets more life and strength (as many levels as it lacks, measured at level 3), a strong one less
const ludusKindBoost=k=>{ const P=Math.max(-8,Math.min(20,ludusPower(k))); if(!P) return 1; const base=1+LEVEL_SCALE_PER_LEVEL*3; return +(P<0?(1+LEVEL_SCALE_PER_LEVEL*(3-P))/base:base/(1+LEVEL_SCALE_PER_LEVEL*(3+P))).toFixed(2); };
// the kinds that can show up as opponents: the strong ones only once the fighter is high enough to meet them at a fair level
const ludusFoeKinds=()=>{ const l=ludusKinds().filter(k=>ludusPower(k)<=ludus.fighter.level+1); return l.length?l:ludusKinds(); };
// the level an opponent of kind `k` needs to be a match for the fighter (the fighter's own kind is already levelled by ludusKindBoost) once `edge` levels are added;
// a kind's strength is a factor, not a number of levels, so the weak ones are raised more at high levels
const ludusKindFactor=k=>{ const P=ludusPower(k), base=levelScale(3); return P>=0?levelScale(3+P)/base:base/levelScale(3-P); };
const ludusMatchLevel=(k,edge)=>Math.max(1,Math.min(40,Math.round((levelScale(ludus.fighter.level)/ludusKindFactor(k)-1)/LEVEL_SCALE_PER_LEVEL+1+(edge||0))));
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
  const kinds=ludusFoeKinds();
  const kind=kinds[Math.floor(r()*kinds.length)];
  return { id:'n'+Math.floor(r()*1e9), name:ludusNpcName(r), kind, level:ludusMatchLevel(kind,Math.floor(r()*3)-1),
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
