// Teams (docs/ludus.md, "Teams"): every gladiator of the world belongs to a team; a lone one is a team of one. The player's school is a team as well
// (its gold is ludus.gold, its members ludus.team) and lives by the same rules.
// Gold belongs to the team: board and lodging, wages, prizes, ransoms, purchases all go through the team's purse.
// Teams form when a region is filled (1 to 3), every rookie founds his own; a team with gold hires a lone gladiator (the price the school pays);
// two small teams who like each other merge; a team with nobody left is gone. There is no rank inside a team (no captain who could change).
// ludus.teams={ [id]: { id, name, region, gold, founded } }; a gladiator of the world carries `team` (the id).
const LUDUS_TEAMS={ hireDays:10, mergeLike:3, mergeMax:2, joinLike:0 };
const ludusTeam=id=>(ludus&&ludus.teams||{})[id]||null;
const ludusTeamOf=n=>n&&!ludusMember(n.id)?ludusTeam(n.team):null;
const ludusTeamMembers=id=>(ludus.world||[]).filter(n=>n.team===id&&n.status==='active');
const ludusTeamSize=n=>n&&ludusMember(n.id)?ludus.team.length:(n?ludusTeamMembers(n.team).length:0);
const ludusFamily=name=>String(name||'').trim().split(' ').slice(-1)[0];
const ludusStartPurse=n=>10+5*(n.level||1);
// a new team, named after its founder's family ("Haus Durus", a second one "Haus Durus II")
function ludusTeamNew(region,founder,gold){
  ludus.teams=ludus.teams||{};
  const base='Haus '+ludusFamily(founder.name), names=new Set(Object.values(ludus.teams).map(t=>t.name));
  let name=base; for(let k=2;names.has(name);k++) name=base+' '+(['II','III','IV','V','VI','VII','VIII','IX','X'][k-2]||k);
  const id='t'+(ludus.teamSeq=(ludus.teamSeq||0)+1);
  ludus.teams[id]={ id, name, region, gold:Math.max(0,Math.round(gold||0)), founded:ludus.day };
  founder.team=id; return ludus.teams[id];
}
// the purse of a gladiator: his team's (the school's for its own)
function ludusGold(n){ if(!n) return 0; if(ludusMember(n.id)) return ludus.gold; const t=ludusTeamOf(n); return t?t.gold||0:0; }
function ludusGoldAdd(n,v){ if(!n||!v) return; if(ludusMember(n.id)){ ludus.gold+=v; return; } const t=ludusTeamOf(n); if(t) t.gold=Math.max(0,Math.round((t.gold||0)+v)); }
const ludusTeamName=n=>{ if(!n) return ''; if(ludusMember(n.id)) return 'Deine Schule'; const t=ludusTeamOf(n); return t?t.name:''; };

// keeps the teams in order: every gladiator of the world in a team of his region (one who is not founds his own, with the purse he carried or a starting one),
// teams nobody is left in are gone. Runs whenever gladiators were made, moved or lost; old saves come in through it too.
function ludusTeamsTidy(){
  if(!ludus||!ludus.world) return;
  ludus.teams=ludus.teams||{};
  ludus.world.forEach(n=>{
    if(n.status!=='active'){ return; }
    const t=ludusTeam(n.team);
    if(!t||t.region!==n.region) ludusTeamNew(n.region,n,n.gold!==undefined?n.gold:ludusStartPurse(n));
    delete n.gold;
  });
  Object.keys(ludus.teams).forEach(id=>{ if(!ludusTeamMembers(id).length) delete ludus.teams[id]; });
  // the title of a region belongs to a team (an old save named a gladiator; a team that is gone hands it to the best of the table)
  Object.keys(ludus.regions||{}).forEach(k=>{ const reg=ludus.regions[k], c=reg.champ; if(!c) return;
    if(c.t==='npc'){ const n=ludusNpc(c.id); reg.champ=n&&n.status==='active'&&n.team?{ t:'team', id:n.team }:null; }
    else if(c.t==='team'&&!ludus.teams[c.id]) reg.champ=null;
    if(!reg.champ){ const best=Object.values(ludus.teams).filter(t=>t.region===+k).sort((a,b)=>ludusTeamMembers(b.id).reduce((s,n)=>s+(n.honor||0),0)-ludusTeamMembers(a.id).reduce((s,n)=>s+(n.honor||0),0))[0]; if(best) reg.champ={ t:'team', id:best.id }; }
  });
}
// a region is filled: the boss with the two strongest, the rest in teams of 1 to 3 (a fixed rule from the region's dice, no dice in the run)
function ludusTeamsFill(id,r){
  const l=ludusRegionNpcs(id).filter(n=>!n.team||!ludusTeam(n.team)); if(!l.length) return;
  const boss=l.find(n=>n.boss), rest=l.filter(n=>n!==boss).sort((a,b)=>b.level-a.level);
  const make=g=>{ const t=ludusTeamNew(id,g[0],g.reduce((s,n)=>s+ludusStartPurse(n),0)); g.slice(1).forEach(n=>{ n.team=t.id; }); g.forEach(n=>{ delete n.gold; }); };
  if(boss) make([boss].concat(rest.splice(0,2)));
  const shuf=rest.map(n=>[r(),n]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  while(shuf.length){ const k=Math.min(shuf.length,1+Math.floor(r()*3)); make(shuf.splice(0,k)); }
}
// how much the members of one group like those of another (the relations both ways added, per pair); a team's relation is never kept, only worked out
const ludusTeamLiking=(a,b)=>ludusLiking(a,b);       // both ways added: 3 = they like each other well

// ---- the teams' evening: board and lodging, hiring, merging ----
// board and lodging: every team pays for each of its gladiators; what it cannot pay it does not pay (it is poor, its gladiators work instead of fighting)
function ludusTeamsUpkeep(){
  Object.values(ludus.teams||{}).forEach(t=>{ const node=ludusMapWorld().nodes[t.region]; if(!node) return; t.gold=Math.max(0,(t.gold||0)-ludusUpkeep(node.col)*ludusTeamMembers(t.id).length); });
}
const ludusTeamPoor=t=>{ const node=ludusMapWorld().nodes[t.region]; return !node||(t.gold||0)<3*ludusUpkeep(node.col)*Math.max(1,ludusTeamMembers(t.id).length); };
// hiring: a team that can pay the price and 10 days of board for one more hires the best lone gladiator of its region who does not dislike it
// (at most one in a region per day; not the boss, not a champion, not a rival); his purse goes into the team's
function ludusTeamsHire(){
  const done=new Set();
  Object.values(ludus.teams||{}).sort((a,b)=>(b.gold||0)-(a.gold||0)).forEach(t=>{
    if(done.has(t.region)) return; const node=ludusMapWorld().nodes[t.region]; if(!node) return;
    const mem=ludusTeamMembers(t.id); if(!mem.length) return;
    const solos=ludusRegionNpcs(t.region).filter(n=>n.team!==t.id&&ludusTeamMembers(n.team).length===1&&!n.boss&&!n.rival&&!ludusIsChamp(t.region,'npc',n.id)&&!n.maimed&&ludusTeamLiking([n],mem)>=LUDUS_TEAMS.joinLike);
    const n=solos.sort((a,b)=>ludusGladWorth(b)-ludusGladWorth(a)).find(x=>(t.gold||0)>=ludusTeamHirePrice(x)+LUDUS_TEAMS.hireDays*ludusUpkeep(node.col)*(mem.length+1)); if(!n) return;
    const own=ludusTeam(n.team), price=ludusTeamHirePrice(n);
    t.gold-=price; t.gold+=own?own.gold||0:0; if(own) delete ludus.teams[own.id]; n.team=t.id; done.add(t.region);
    ludusChron(t.region,'team',`${n.name} tritt ${t.name} bei (${price} Gold).`);
  });
}
const ludusTeamHirePrice=n=>Math.round(20+22*n.level);       // what the school pays for a stranger (ludusRecruitPrice without the relation)
// merging: two teams of at most two in one region whose members like each other (2 and more) become one (the one with more gold keeps its name); one a day per region
function ludusTeamsMerge(){
  const done=new Set(), ts=Object.values(ludus.teams||{});
  ts.forEach(a=>{ if(done.has(a.region)||!ludus.teams[a.id]) return; const A=ludusTeamMembers(a.id); if(!A.length||A.length>LUDUS_TEAMS.mergeMax||A.some(n=>n.boss)) return;
    const b=ts.find(x=>x!==a&&ludus.teams[x.id]&&x.region===a.region&&ludusTeamMembers(x.id).length<=LUDUS_TEAMS.mergeMax&&!ludusTeamMembers(x.id).some(n=>n.boss)&&ludusTeamLiking(A,ludusTeamMembers(x.id))>=LUDUS_TEAMS.mergeLike); if(!b) return;
    const [keep,go]=(b.gold||0)>(a.gold||0)?[b,a]:[a,b];
    ludusTeamMembers(go.id).forEach(n=>{ n.team=keep.id; }); keep.gold=(keep.gold||0)+(go.gold||0); delete ludus.teams[go.id]; done.add(a.region);
    ludusChron(keep.region,'team',`${go.name} geht in ${keep.name} auf.`);
  });
}
function ludusTeamsEvening(){ ludusTeamsTidy(); ludusTeamsHire(); ludusTeamsMerge(); ludusTeamsTidy(); ludusAccordsEvening(); }

// ---- the table: teams of the region by honour (the sum of their gladiators'), the school among them ----
function ludusTeamTable(id){
  const rows=Object.values(ludus.teams||{}).filter(t=>t.region===id).map(t=>{ const m=ludusTeamMembers(t.id); return { t:'team', id:t.id, name:t.name, size:m.length, honor:m.reduce((s,n)=>s+(n.honor||0),0), wins:m.reduce((s,n)=>s+(n.wins||0),0), fame:m.reduce((s,n)=>s+ludusFame(n),0), gold:t.gold||0, champ:m.some(n=>ludusIsChamp(id,'npc',n.id)), boss:m.some(n=>n.boss) }; });
  if(id===ludus.map.region&&ludus.team.length) rows.push({ t:'own', id:'own', name:'Deine Schule', size:ludus.team.length, honor:ludus.team.reduce((s,m)=>s+(m.honor||0),0), wins:ludus.wins, fame:ludus.team.reduce((s,m)=>s+ludusFame(m),0), gold:ludus.gold, champ:ludus.team.some(m=>ludusIsChamp(id,'own',m.id)) });
  rows.sort((a,b)=>(b.champ-a.champ)||(b.honor-a.honor)||(b.size-a.size)); rows.forEach((x,i)=>x.rank=i+1);
  return rows;
}
function ludusTeamTableHTML(id){
  const rows=ludusTeamTable(id); if(!rows.length) return '';
  return `<h3>Tabelle der Teams</h3>${rows.map(x=>`<div class="luItem${x.t==='own'?' sel':''}"><span>${x.rank}. ${x.champ?'👑 ':''}${ludusEsc(x.name)} · ${x.size} ${x.size===1?'Gladiator':'Gladiatoren'}${x.t==='team'&&ludusAccord('own',x.id)?' · '+LUDUS_ACCORD_WORD[ludusAccord('own',x.id).type]:''}</span><span>${x.honor} Ehre · ${x.wins} Siege · ${x.gold} Gold</span></div>`).join('')}`;
}
// the card: the team of a gladiator and who else is in it
function ludusTeamLine(n){
  const t=ludusTeamOf(n); if(!t) return '';
  const mates=ludusTeamMembers(t.id).filter(x=>x!==n).map(x=>x.name);
  return `Team: ${t.name}${mates.length?` (mit ${mates.join(', ')})`:' (allein)'} · Kasse ${t.gold||0} Gold`;
}

// ---- accords between teams: a spare accord (nobody of one executes anybody of the other) and an alliance (that, and never in the ring against each other, except the pit) ----
// The school makes them only on its own offer (a team accepts from relation 1, an alliance from 2) and ends them itself (the team's gladiators −1).
// Teams of the world make and end them among themselves by how they like each other (spare from 1, alliance from 2; ended below 0.5 and 1.5).
// A team's relation is worked out from its gladiators': to the school the average of their relation to it, between two teams the average both ways.
// ludus.accords=[{ a, b, type:'spare'|'ally', day }] (a, b: team ids, 'own' for the school)
const LUDUS_ACCORD={ spare:1, ally:2, keep:0.5 };
const ludusTeamKey=n=>!n?null:(ludusMember(n.id)?'own':(n.team||null));
const ludusAccord=(ka,kb)=>ka&&kb&&ka!==kb?(ludus.accords||[]).find(x=>(x.a===ka&&x.b===kb)||(x.a===kb&&x.b===ka))||null:null;
const ludusAllied=(n,m)=>{ const x=ludusAccord(ludusTeamKey(n),ludusTeamKey(m)); return !!x&&x.type==='ally'; };
const ludusSpared=(n,m)=>!!ludusAccord(ludusTeamKey(n),ludusTeamKey(m));
const ludusAlliedSchool=n=>{ const x=ludusAccord('own',ludusTeamKey(n)); return !!x&&x.type==='ally'; };
function ludusTeamRel(ka,kb){
  if(kb==='own') [ka,kb]=[kb,ka];
  if(ka==='own'){ const m=ludusTeamMembers(kb); return m.length?m.reduce((s,n)=>s+(n.bond||0),0)/m.length:0; }
  return ludusLiking(ludusTeamMembers(ka),ludusTeamMembers(kb))/2;
}
function ludusAccordSet(ka,kb,type){ ludus.accords=(ludus.accords||[]).filter(x=>!((x.a===ka&&x.b===kb)||(x.a===kb&&x.b===ka))); if(type) ludus.accords.push({ a:ka, b:kb, type, day:ludus.day }); }
const LUDUS_ACCORD_WORD={ spare:'Schonungsabkommen', ally:'Bündnis' };
function ludusAccordOffer(teamId,type){
  const t=ludusTeam(teamId), cur=ludusAccord('own',teamId); if(!t||!LUDUS_ACCORD[type]||(cur&&(cur.type===type||cur.type==='ally'))) return;
  const rel=ludusTeamRel('own',teamId), need=LUDUS_ACCORD[type];
  if(rel<need){ ludusNote=`${t.name} lehnt ab: dafür braucht es eine Beziehung von ${need}.`; ludusRender(); return; }
  ludusAccordSet('own',teamId,type); ludus.arenaOffers=null; ludus.arenaEst=null;
  const txt=`Deine Schule und ${t.name} schließen ein ${LUDUS_ACCORD_WORD[type]}.`; ludusChron(t.region,'accord',txt); ludusNote=txt; ludusSave(); ludusRender();
}
function ludusAccordCancel(teamId){
  const t=ludusTeam(teamId), cur=ludusAccord('own',teamId); if(!t||!cur) return;
  ludusAccordSet('own',teamId,null); ludusTeamMembers(teamId).forEach(n=>{ n.bond=Math.max(-3,(n.bond||0)-1); }); ludus.arenaOffers=null; ludus.arenaEst=null;
  const txt=`Deine Schule kündigt das ${LUDUS_ACCORD_WORD[cur.type]} mit ${t.name}.`; ludusChron(t.region,'accord',txt); ludusNote=txt; ludusSave(); ludusRender();
}
// the teams of the world among themselves, every evening (only teams of one region; the school's accords are left to the school)
function ludusAccordsEvening(){
  ludus.accords=(ludus.accords||[]).filter(x=>(x.a==='own'||ludus.teams[x.a])&&(x.b==='own'||ludus.teams[x.b])&&(x.a!=='own'&&x.b!=='own'||ludus.team.length));
  const byRegion={}; Object.values(ludus.teams||{}).forEach(t=>{ (byRegion[t.region]=byRegion[t.region]||[]).push(t); });
  Object.values(byRegion).forEach(ts=>{ for(let i=0;i<ts.length;i++) for(let j=i+1;j<ts.length;j++){
    const a=ts[i], b=ts[j], rel=ludusTeamRel(a.id,b.id), cur=ludusAccord(a.id,b.id), had=cur?cur.type:null;
    let want=had;
    if(rel>=LUDUS_ACCORD.ally) want='ally'; else if(had==='ally'&&rel<LUDUS_ACCORD.ally-LUDUS_ACCORD.keep) want=rel>=LUDUS_ACCORD.spare?'spare':null;
    if(!want&&rel>=LUDUS_ACCORD.spare) want='spare'; else if(want==='spare'&&rel<LUDUS_ACCORD.spare-LUDUS_ACCORD.keep) want=null;
    if(want===had) continue;
    ludusAccordSet(a.id,b.id,want);
    ludusChron(a.region,'accord',want?`${a.name} und ${b.name} schließen ein ${LUDUS_ACCORD_WORD[want]}.`:`${a.name} und ${b.name} beenden ihr ${LUDUS_ACCORD_WORD[had]}.`);
  } });
}
// the entries of a tournament: are they allied (then the weaker of the table gives the other the way)
const ludusEntryKey=e=>!e?null:(e.t==='own'?'own':e.id);
const ludusEntriesAllied=(a,b)=>{ const x=ludusAccord(ludusEntryKey(a),ludusEntryKey(b)); return !!x&&x.type==='ally'; };
// the card: the diplomacy with a gladiator's team
function ludusAccordHTML(n){
  const t=ludusTeamOf(n); if(!t) return '';
  const rel=ludusTeamRel('own',t.id), cur=ludusAccord('own',t.id), r1=Math.round(rel*10)/10;
  let h=`<h3>Abkommen mit ${ludusEsc(t.name)}</h3><p class="luHint">Beziehung des Teams zur Schule: ${r1} (der Schnitt seiner Gladiatoren). Ein Schonungsabkommen (ab 1): niemand richtet einen des anderen hin. Ein Bündnis (ab 2): dazu steigt ihr in der Arena nicht mehr gegeneinander in den Ring (in der Grube schon), und im Turnier lässt das schwächere Team dem stärkeren den Vortritt.</p>`;
  if(cur) h+=`<p>Ihr habt ein ${LUDUS_ACCORD_WORD[cur.type]} (seit Tag ${cur.day}). ${cur.type==='spare'?`<button data-accord="${t.id}:ally" ${rel<LUDUS_ACCORD.ally?'disabled':''}>Bündnis anbieten</button> `:''}<button data-accord="${t.id}:cancel">Aufkündigen</button></p>`;
  else h+=`<p><button data-accord="${t.id}:spare" ${rel<LUDUS_ACCORD.spare?'disabled':''}>Schonungsabkommen anbieten</button> <button data-accord="${t.id}:ally" ${rel<LUDUS_ACCORD.ally?'disabled':''}>Bündnis anbieten</button></p>`;
  return h;
}
function ludusWireAccords(el){ el.querySelectorAll('[data-accord]').forEach(b=>b.addEventListener('click',()=>{ const [id,what]=b.dataset.accord.split(':'); if(what==='cancel') ludusAccordCancel(id); else ludusAccordOffer(id,what); })); }
