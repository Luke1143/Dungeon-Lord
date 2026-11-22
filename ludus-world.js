// The Ludus world: persistent characters. Every gladiator of a region (ludus-tour.js makes them) is a character of the run's world
// ({id, name, kind, level, tier, seed, status, region, honor, ...}): they keep their look, level and gear, remember how they met the fighter, can die, beg, join, or come back for revenge.
// A region is renewed after each of its tournaments (some leave, the rest grow, rookies arrive), so it never dies out. Concept: docs/ludus.md.
// Encounters are made from the creature budget (budget.js): the team is worth W orks, the opponents together are worth about as much, as many and as strong as that takes.
// Nobody is weakened for it: a dragon meets a swarm of orks, a goblin meets another goblin.
// a very weak kind is lifted a little (never the other way round): life and strength grow so that it is worth at least 0.7 orks
const ludusKindBoost=k=>+Math.max(1,Math.sqrt(0.7/creatureWorth(k))).toFixed(2);
// `lv` (optional) asks what the team would be worth if everybody stood on that level: the yardstick of a place with a level of its own (a city of the map)
const ludusMemberWorth=(m,lv)=>creatureWorthAt(m.kind,lv||m.level)*Math.pow(ludusKindBoost(m.kind),2);
const ludusTeamWorth=lv=>ludus.team.reduce((a,m)=>a+ludusMemberWorth(m,lv),0);
const ludusUnitWorth=lv=>ludusTeamWorth(lv)/Math.max(1,ludus.team.length);
// the kinds that can show up as single opponents: not far above what one member of the team is worth
const ludusFoeKinds=lv=>{ const u=ludusUnitWorth(lv), l=ludusKinds().filter(k=>creatureWorth(k)<=u*1.3); return l.length?l:ludusKinds().slice().sort((a,b)=>creatureWorth(a)-creatureWorth(b)).slice(0,6); };
// the level at which a kind is a match for one member of the team, `edge` levels more
const ludusMatchLevel=(k,edge,lv)=>Math.max(1,Math.min(40,creatureLevelFor(k,ludusUnitWorth(lv))+Math.round(edge||0)));
const ludusNpc=id=>(ludus&&ludus.world||[]).find(n=>n.id===id)||null;
// the gladiators of the region the team is in (not its boss): they are met in the arena, the tavern and the street
const ludusNpcPool=()=>(ludus.world||[]).filter(n=>n.status==='active' && !n.maimed && !n.boss && (!ludus.map||n.region===ludus.map.region));
// what a character looks like to the arena and to the 3D view: the same fields as an anonymous opponent, plus the id
const ludusNpcFoe=n=>({ kind:n.kind, level:n.level, tier:n.tier, seed:n.seed, name:n.name, npc:n.id });
// a gladiator's name: first name and byname, unique in the whole land (the player's own keep their single names)
function ludusNpcName(r){
  const taken=new Set((ludus.world||[]).filter(n=>n.status!=='dead'&&n.status!=='gone').map(n=>n.name).concat(ludus.team.map(m=>m.name)));
  for(let i=0;i<60;i++){ const nm=LUDUS_NAMES[Math.floor(r()*LUDUS_NAMES.length)]+' '+LUDUS_CAST[Math.floor(r()*LUDUS_CAST.length)]; if(!taken.has(nm)) return nm; }
  return LUDUS_NAMES[Math.floor(r()*LUDUS_NAMES.length)]+' '+LUDUS_CAST[Math.floor(r()*LUDUS_CAST.length)]+' '+(2+Math.floor(r()*8));
}
// how a character stands to the fighter, in one line (the last thing that happened between them)
function ludusNpcStory(n){
  const l=n.last; if(!l) return '';
  const d=l.d, T={
    surrender:`hat sich dir an Tag ${d} ergeben`, beaten:`wurde von dir an Tag ${d} besiegt`, beatYou:`hat dich an Tag ${d} besiegt`, ally:`kämpfte an Tag ${d} an deiner Seite`,
    helped:`bekam von dir an Tag ${d} Münzen`, robbed:`wurde von dir an Tag ${d} ausgeraubt`, sent:`wurde von dir an Tag ${d} weggeschickt`, paid:`bekam von dir an Tag ${d} Schutzgeld`, scared:`ergriff an Tag ${d} vor dir die Flucht`, died:`fiel an Tag ${d} im Kampf`, joined:`trat an Tag ${d} in dein Team ein`, left:`verließ an Tag ${d} dein Team`
  };
  return T[l.t]||'';
}
const ludusGearWord=t=>['zerlumpt und schlecht bewaffnet','einfach ausgerüstet','gut ausgerüstet','prächtig ausgerüstet'][Math.max(0,Math.min(3,t))];
const ludusCastLine=s=>`${s.name} — ${SPECIES[s.kind].label}, Stufe ${s.level}, ${ludusGearWord(s.tier)}`;
// the look of a character for the 3D view
function ludusLookOf(s){
  const c=ludusFoeCreature(s.npc?s:Object.assign({ npc:s.id&&ludusNpc(s.id)?s.id:undefined },s));
  const extra=typeof equipLook==='function'?equipLook(c):undefined;
  return { kind:s.kind, extra:extra||undefined, sig:JSON.stringify(extra||null) };
}
// who sits in the tavern today: those the fighter knows, and a few strangers (the same for the whole day)
function ludusTavernGuests(){
  if(!ludus||ludus.over) return [];
  const r=ludusRng('tav'+ludus.day), act=(ludus.world||[]).filter(n=>n.status==='active');
  const shuf=l=>l.map(x=>[r(),x]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  const here=act.filter(n=>!n.boss&&n.region===ludus.map.region&&!ludusIsChamp(n.region,'npc',n.id)), known=shuf(here.filter(n=>n.met)), rest=shuf(here.filter(n=>!n.met));
  return known.slice(0,3).concat(rest.slice(0,2)).slice(0,5);
}
// after a match: what happened to the characters who fought in it. A gladiator of the world keeps what the bout did to him (life, experience, gear), like the team does
function ludusNpcOutcomes(st,won,o){
  const foeLv=Math.max(...ludus.team.map(m=>m.level));
  (st.arena.roster||[]).forEach((team,ti)=>team.forEach(c=>{
    const n=c.npcId&&ludusNpc(c.npcId); if(!n) return;
    n.met=1;
    const gone=c.removed||c.dead||!st.creatures.includes(c);
    if(gone){ n.status='dead'; n.diedDay=ludus.day; n.last={ t:'died', d:ludus.day }; if(n.region!==undefined) ludusChron(n.region,'death',`${n.name} (${SPECIES[n.kind].label} der Stufe ${n.level}) fällt im Kampf gegen deine Schule.`); return; }
    const theyWon=st.arena.winner===ti;
    if(n.inventory&&!(o&&o.rent&&ti===0)){ withState(st,()=>grantXp(c,ludusBoutXp(foeLv,theyWon,1))); n.level=c.level; n.xp=c.xp; n.inventory=JSON.parse(JSON.stringify(c.inventory||[])); n.learned=(c.learned||[]).slice(); n.hp=c.unconscious?1:Math.max(1,Math.round(c.hp)); n.energy=Math.max(10,(Number.isFinite(c.energy)?c.energy:100)-12); }
    if(theyWon) n.wins=(n.wins||0)+1; else n.losses=(n.losses||0)+1;
    if(ti===0){ n.last={ t:'ally', d:ludus.day }; n.bond=Math.min(3,(n.bond||0)+1); return; }
    if(won){
      if(c.surrendered){ n.last={ t:'surrender', d:ludus.day }; n.maimed=true; }
      else n.last={ t:'beaten', d:ludus.day };
    } else { n.last={ t:'beatYou', d:ludus.day }; }
  }));
}

// ---- the team: recruiting and dismissing ----
// the level a character has as a mate: as far from a fair match for its kind as it was in the world (the kind's strength is made up for by ludusKindBoost)
const ludusMateLevel=n=>n.level;       // a gladiator joins as what he is
const ludusRecruitPrice=n=>Math.round((20+22*ludusMateLevel(n))*((n.bond||0)>=2?0.5:((n.bond||0)<0?1.6:1)));
function ludusJoinTeam(n){
  ludusEquip(n); ludusLearnKind(n.kind);       // a kind that fights for the school is known from now on
  ludus.team.push({ id:'m'+n.id, npc:n.id, gifts:JSON.parse(JSON.stringify(n.gifts||[])), kind:n.kind, name:n.name, level:n.level, xp:n.xp||xpForLevel(n.level), hp:n.hp, energy:n.energy, inventory:JSON.parse(JSON.stringify(n.inventory||[])), learned:(n.learned||[]).slice(), books:[], seed:n.seed, honor:n.honor||0 });
  ludusNormalizeGear(ludus.team[ludus.team.length-1]); n.status='team'; n.maimed=false; n.met=1; n.last={ t:'joined', d:ludus.day };
}
function ludusRecruit(id){
  const n=ludusNpc(id); if(!n||n.status!=='active'||ludusSlotsFree()<1||(n.bond||0)<=-2) return false;
  const price=ludusRecruitPrice(n); if(ludus.gold<price) return false;
  ludus.gold-=price; ludusJoinTeam(n); ludusNote=`${n.name} tritt in dein Team ein.`; ludusSave(); ludusRender(); return true;
}
function ludusDismiss(i){
  const m=ludus.team[i]; if(!m||ludus.team.length<2) return;
  const n=m.npc&&ludusNpc(m.npc); if(n){ Object.assign(n,{ status:'active', level:m.level, xp:m.xp, hp:m.hp, energy:m.energy, inventory:JSON.parse(JSON.stringify(m.inventory||[])), learned:(m.learned||[]).slice(), gifts:JSON.parse(JSON.stringify(m.gifts||[])), region:ludus.map.region, honor:m.honor||0, last:{ t:'left', d:ludus.day } }); }
  ludus.team.splice(i,1); ludus.sel=Math.max(0,Math.min(ludus.sel,ludus.team.length-1)); ludus.pick=(ludus.pick||[]).filter(id=>id!==m.id); ludusNote=`${m.name} verlässt das Team.`; ludusSave(); ludusRender();
}
