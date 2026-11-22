// Happiness in the Ludus (docs/ludus.md, "Zufriedenheit"): every gladiator, of the school and of the world, has it (0 to 100; beasts and the undead feel nothing).
// It is fighting spirit: the engine strikes with less force when it is low (index.html, moodMul) and holds out shorter (morale); and the fights work back on it.
// Every evening it moves a third of the way towards what his life is worth to him:
//   80 − 4 for every other gladiator of his team (they share a room) − 2 for every level above 1 (the better he is, the more he asks)
//   + comfort + 4 for every friend in his team (−4 for every foe there; at most ±12).
// Comfort: the school's tavern 5 per tier, temple 8 per tier, bath 4 per tier; a team of the world lives as well as its purse allows (1 per 10 gold a head, up to 30).
// The day leaves its mark at once: a win +8, a defeat −8, hurt (below half his life after the bout) −6 more, a day of rest +5, a day in the bath 15/20/25 (by tier).
// Below 20 at the end of a day he leaves his team (the school's last gladiator stays); below 25 a stranger who does not dislike the school may ask to join it (an event).
const LUDUS_MOOD={ base:80, crowd:4, level:2, friend:4, friendCap:12, drift:1/3, win:8, loss:8, hurt:6, rest:5, bath:[15,20,25], leave:20, ask:25, start:70, comfort:{ inn:5, temple:8, bath:4 }, purseCap:30 };
const ludusFeels=g=>{ const s=g&&SPECIES[g.kind]; return !!s&&s.category!=='beast'&&s.category!=='undead'&&!(typeof BEAST_KINDS!=='undefined'&&BEAST_KINDS.has(g.kind)); };
const ludusMood=g=>ludusFeels(g)?Math.round(g.happiness===undefined?LUDUS_MOOD.start:g.happiness):null;
function ludusMoodAdd(g,v){ if(!ludusFeels(g)||!v) return; g.happiness=Math.max(0,Math.min(100,ludusMood(g)+v)); }
const LUDUS_MOOD_WORD=h=>h===null?'fühlt nichts':(h>=75?'glücklich':(h>=50?'zufrieden':(h>=30?'unzufrieden':'unglücklich')));
// comfort of a gladiator's home
function ludusComfort(g){
  if(ludusMember(g.id)) return Object.keys(LUDUS_MOOD.comfort).reduce((s,id)=>s+LUDUS_MOOD.comfort[id]*(ludusRoomTier(id)||0),0);
  const t=ludusTeamOf(g); if(!t) return 0;
  return Math.min(LUDUS_MOOD.purseCap,Math.floor((t.gold||0)/(10*Math.max(1,ludusTeamMembers(t.id).length))));
}
// what his life is worth to him: the target the evening moves towards (the parts, for the sheet)
function ludusMoodParts(g){
  const own=!!ludusMember(g.id), mates=own?ludus.team.filter(m=>m!==g):ludusTeamMembers(g.team).filter(n=>n!==g);
  let fr=0; mates.forEach(o=>{ const r=ludusRel(g,o); if(r>=2) fr+=LUDUS_MOOD.friend; else if(r<=-2) fr-=LUDUS_MOOD.friend; });
  return { base:LUDUS_MOOD.base, crowd:-LUDUS_MOOD.crowd*mates.length, level:-LUDUS_MOOD.level*Math.max(0,(g.level||1)-1), comfort:ludusComfort(g), friends:Math.max(-LUDUS_MOOD.friendCap,Math.min(LUDUS_MOOD.friendCap,fr)) };
}
const ludusMoodTarget=g=>{ const p=ludusMoodParts(g); return Math.max(0,Math.min(100,p.base+p.crowd+p.level+p.comfort+p.friends)); };
// after a bout: the winners glad, the losers sore, the hurt more so
function ludusMoodAfterBout(g,won,hpPct){ if(!ludusFeels(g)) return; ludusMoodAdd(g,won?LUDUS_MOOD.win:-LUDUS_MOOD.loss); if(hpPct!==undefined&&hpPct<50) ludusMoodAdd(g,-LUDUS_MOOD.hurt); }
// the evening: who has had enough (below 20 at the end of the day) leaves his team; then everyone drifts towards his target
function ludusMoodEvening(){
  const lines=[];       // first who has had enough by the end of the day leaves, then the night does its work on the others
  // the school: the unhappiest who is below the line leaves (one an evening; the last one stays)
  const gone=ludus.team.filter(m=>ludusFeels(m)&&ludusMood(m)<LUDUS_MOOD.leave).sort((a,b)=>ludusMood(a)-ludusMood(b))[0];
  if(gone&&ludus.team.length>1){ ludusLeaveSchool(gone); lines.push(`${gone.name} ist unglücklich und verlässt deine Schule.`); }
  // the world: an unhappy gladiator leaves his team and stands alone (others may hire him)
  (ludus.world||[]).filter(n=>n.status==='active'&&ludusFeels(n)&&ludusMood(n)<LUDUS_MOOD.leave&&ludusTeamSize(n)>1&&!n.boss&&!ludusIsChamp(n.region,'npc',n.id)).forEach(n=>{
    const t=ludusTeamOf(n); ludusTeamNew(n.region,n,0); n.happiness=Math.max(ludusMood(n),40);       // a fresh start lifts him a little
    ludusChron(n.region,'team',`${n.name} ist unglücklich und verlässt ${t?t.name:'sein Team'}.`); });
  const drift=g=>{ if(!ludusFeels(g)) return; const h=ludusMood(g); g.happiness=Math.max(0,Math.min(100,Math.round(h+(ludusMoodTarget(g)-h)*LUDUS_MOOD.drift))); };
  ludus.team.forEach(drift); (ludus.world||[]).forEach(n=>{ if(n.status==='active') drift(n); });
  return lines.join(' · ');
}
// a gladiator of the school goes back into the world: the record he came from, or a new one; alone in the region, a little sore at the school
function ludusLeaveSchool(m){
  ludus.team=ludus.team.filter(x=>x!==m); ludus.sel=Math.max(0,Math.min(ludus.sel,ludus.team.length-1));
  let n=m.npc&&ludusNpc(m.npc);
  if(!n){ n={ id:'n'+m.id+'x'+ludus.day, name:m.name, kind:m.kind, seed:m.seed, met:1, honor:0, bold:0.5 }; ludus.world.push(n); }
  Object.assign(n,{ status:'active', region:ludus.map.region, level:m.level, xp:m.xp, inventory:JSON.parse(JSON.stringify(m.inventory||[])), learned:(m.learned||[]).slice(), gifts:JSON.parse(JSON.stringify(m.gifts||[])),
    hp:m.hp, energy:m.energy, bond:Math.min(-1,(n.bond||0)), happiness:45, fame:m.fame||0, wins:m.wins||0, kills:m.kills||0, last:{ t:'left', d:ludus.day } });
  delete n.team; ludusTeamsTidy(); ludusChron(ludus.map.region,'team',`${n.name} verlässt deine Schule.`);
}
// the morning's chance: a stranger of the region who is unhappy and does not dislike the school asks to join it (ludus-events.js, 'defector')
const ludusDefectors=()=>ludusRegionNpcs(ludus.map.region).filter(n=>ludusFeels(n)&&ludusMood(n)<LUDUS_MOOD.ask&&(n.bond||0)>=0&&!n.boss&&!n.rival&&!ludusIsChamp(ludus.map.region,'npc',n.id)&&!ludusAlliedSchool(n));
// the sheet: what makes him glad or sore
function ludusMoodHTML(g){
  const h=ludusMood(g); if(h===null) return `<p class="luHint">Zufriedenheit: ${SPECIES[g.kind].label} fühlt nichts (Bestien und Untote kämpfen immer mit voller Kraft).</p>`;
  const p=ludusMoodParts(g), sign=v=>(v>=0?'+':'−')+Math.abs(v);
  return `<p class="luHint">Zufriedenheit ${h} (${LUDUS_MOOD_WORD(h)}) · Kampfkraft ${Math.round(100*(1-MOOD_DAMAGE*(100-h)/100))} % · strebt zu ${ludusMoodTarget(g)}<br>Grundwert ${p.base} · Kameraden im Raum ${sign(p.crowd)} · Ansprüche (Stufe) ${sign(p.level)} · Komfort ${sign(p.comfort)} · Freunde ${sign(p.friends)}</p>`;
}
