// The living world of the Ludus tour (concept: docs/ludus.md, "Die lebende Welt"). Every gladiator of the map is a fighter like the player's own:
// level, experience, life, rest, real gear, gold, honour. Each morning he decides what to do today (the pit, the arena or rest); the player meets in the pit
// and the arena exactly those who chose to be there. In the evening the others fight each other: in the player's region with the real engine,
// elsewhere with a quick estimate (the same outcomes, roughly: experience, loot, gold, honour, death). Who outgrows a region moves on to the right,
// rookies start on the left. A chronicle tells the news.
const LUDUS_LIFE={
  restBelow:55,        // % of life under which a gladiator rests
  outgrow:2,           // levels above his region's level at which a gladiator moves on to the right
  champExtra:1,        // a champion stays one level longer (then he lays down the title and moves on too)
  minRoster:6,         // a region that has fewer gets wanderers
  deathCoarse:0.03,    // the chance that the loser of an arena bout dies in the fight, where it is only estimated (the verdict may follow)
  ffaFrom:5,           // from this many in the evening arena, the four weakest fight a free for all (with pacts) instead of duels
  chronicle:80         // entries kept
};

// ---- a gladiator as a fighter: the same record as a member of the player's team ----
function ludusEquip(n){
  if(n.inventory) return n;
  if(n.member){ const m=n.member; n.inventory=JSON.parse(JSON.stringify(m.inventory||[])); n.learned=(m.learned||[]).slice(); n.gifts=JSON.parse(JSON.stringify(m.gifts||[])); n.xp=m.xp||xpForLevel(n.level); delete n.member; }
  else { const c=arenaMake(n.kind,0,0); c.level=n.level; const g=arenaGroup(n.kind,1,n.level); g.tier=n.tier; g.seed=n.seed; n.inventory=JSON.parse(JSON.stringify(arenaGear(c,g,0))); n.learned=[]; n.gifts=[]; n.xp=xpForLevel(n.level); }
  n.hp=undefined; n.energy=100; n.wins=n.wins||0; n.losses=n.losses||0; n.kills=n.kills||0; if(n.bold===undefined) n.bold=(arenaHash(n.id)%100)/100;
  return n;
}
const ludusGladTier=n=>{ const l=(n.inventory||[]).filter(i=>instDef(i)); return l.length?Math.round(l.reduce((a,i)=>a+ludusTierIndex(i),0)/l.length):0; };
// what a gladiator is worth in a fight, for the quick estimate (orks at level 1): kind and level, gear, how hurt he is
function ludusGladWorth(n){
  const c=ludusMemberCreature(n), hp=c.hp/Math.max(1,c.maxHp);
  return creatureWorthAt(n.kind,n.level)*Math.pow(ludusKindBoost(n.kind),2)*(1+0.18*ludusGladTier(n))*(0.4+0.6*hp);
}
const ludusHurtPct=n=>{ const c=ludusMemberCreature(n); return Math.round(100*c.hp/Math.max(1,c.maxHp)); };
// k: what kind of news (loot, death, champ, move, rookie); the page shows everything of the own region, from elsewhere what matters for the way ahead
function ludusChron(region,k,t){ ludus.chronicle=ludus.chronicle||[]; ludus.chronicle.unshift({ d:ludus.day, r:region, k, t }); if(ludus.chronicle.length>LUDUS_LIFE.chronicle) ludus.chronicle.length=LUDUS_LIFE.chronicle; }
const ludusRegionName=id=>{ const n=ludusMapWorld().nodes[id]; return n?n.name:''; };
// experience by the numbers (where no creature is at hand): the same formula as for the player's team
function ludusGladXp(n,xp){ n.xp=(n.xp||xpForLevel(n.level))+xp; let up=false; while(n.level<40&&n.xp>=xpForLevel(n.level+1)){ n.level++; up=true; } return up; }
const ludusBoutXp=(foeLevel,won,nFoes)=>Math.round(LUDUS_XP_MULT*(won?18+8*foeLevel+6*((nFoes||1)-1):6+2*foeLevel));

// ---- the morning: what each gladiator of the player's region does today ----
function ludusLifePlan(){
  const id=ludus.map.region, plans={}, r=ludusRng('plan'+ludus.day+':'+id), tIn=ludusTourneyIn();
  ludusRegionNpcs(id).forEach(n=>{
    ludusEquip(n);
    if(n.maimed||ludusHurtPct(n)<LUDUS_LIFE.restBelow||tIn<=1) { plans[n.id]='rest'; return; }
    if(n.boss||ludusIsChamp(id,'npc',n.id)){ const x=r(); plans[n.id]=x<0.35?'pit':(x<0.55?'arena':'rest'); return; }      // the champion fights now and then, but nobody may challenge him outside the tournament
    if(ludusLifePoor(n)){ plans[n.id]=r()<n.bold?'arena':'work'; return; }       // gold for board and lodging: the bold fight for it, the others work
    const x=r(); plans[n.id]=x<0.15?'rest':(x<0.15+0.35+0.3*n.bold?'arena':'pit');
  });
  ludus.life={ day:ludus.day, region:id, plans, busy:[] };
  ludusAiChallenge();
  ludusChallengesToday().forEach(c=>{ plans[c.npc]='arena'; });       // a challenged gladiator keeps the appointment
}
const ludusPlanOf=id=>ludus.life&&ludus.life.day===ludus.day?ludus.life.plans[id]:undefined;
// who is free in the pit / the arena today (not the champion: he only meets the player in the tournament)
const ludusGoers=what=>ludusRegionNpcs(ludus.map.region).filter(n=>ludusPlanOf(n.id)===what&&!(ludus.life.busy||[]).includes(n.id)&&(what==='pit'||!n.boss&&!ludusIsChamp(ludus.map.region,'npc',n.id))&&!ludusChallenged(n.id));       // the champion's team trains in the pit but meets nobody in the arena outside the tournament; who has an appointment in the arena keeps himself for it
const ludusLifeBusy=ids=>{ ids.forEach(id=>{ const n=id&&ludusNpc(id); if(n) n.foughtToday=true; }); if(ludus.life) ludus.life.busy=(ludus.life.busy||[]).concat(ids.filter(Boolean)); };

// ---- a bout between gladiators, fought by the engine; everything that happens to them stays ----
// a, b: lists of gladiators (records of ludus.world, or own members); kind: 'pit' (nobody dies) | 'arena'. Returns 0 when side a wins, 1 when b, and what happened
function ludusLifeBout(a,b,kind,seed){ return ludusLifeBoutN([a,b],kind,seed,[]); }
// the same with any number of sides (a free for all) and the pacts among them
function ludusLifeBoutN(sides,kind,seed,pacts){
  const side=l=>({ name:l[0].name, groups:l.map(n=>{ const g=ludusFighterGroup(ludusEquip(n)); if(!ludusMember(n.id)) g.npc=n.id; return g; }) });
  const setup={ teams:sides.map(side), pacts, map:{ layout:'pit', dims:'S', seed:'life'+ludus.seed+':'+seed, lava:0, water:0, crystal:0, near:1 }, fog:false, batch:1, ludus:true, fixedMap:true, noDeath:kind==='pit' };
  const st=arenaBuild(setup,''), prev=state, ps=screen; let w=0;
  try{ state=st; screen='level'; let k=0; while(arenaStep(st)&&k<8000) k++; w=st.arena.winner<0?Math.floor(Math.random()*sides.length):st.arena.winner; }
  finally{ state=prev; screen=ps; }
  const out={ winner:w, dead:[] };
  sides.forEach((l,ti)=>l.forEach(n=>{
    const c=st.arena.roster[ti].find(x=>x.memberId===n.id), gone=!c||c.removed||c.dead||!st.creatures.includes(c);
    if(gone){ out.dead.push(n); return; }
    const foes=[].concat(...sides.filter((x,k)=>k!==ti)), xp=ludusBoutXp(Math.max(...foes.map(f=>f.level)),ti===w,foes.length);
    withState(st,()=>grantXp(c,xp));
    n.level=c.level; n.xp=c.xp; n.inventory=JSON.parse(JSON.stringify(c.inventory||[])); n.learned=(c.learned||[]).slice();
    n.hp=c.unconscious?1:Math.max(1,Math.round(c.hp)); n.energy=Math.max(10,(Number.isFinite(c.energy)?c.energy:100)-12);
  }));
  return out;
}
// the best piece of a loser's gear goes to the winner: worn when it is better than what he wears of that kind, else sold
function ludusLifeLoot(winner,loser){
  const pool=(loser.inventory||[]).filter(i=>instDef(i)&&['weapon','armor','shield'].includes(instDef(i).type)).sort((x,y)=>ludusPrice(y.id)-ludusPrice(x.id));
  const it=pool[0]; if(!it) return null;
  loser.inventory.splice(loser.inventory.indexOf(it),1);
  const d=instDef(it), worn=(winner.inventory||[]).filter(i=>instDef(i)&&instDef(i).type===d.type);
  if(!worn.length||Math.max(...worn.map(ludusTierIndex))<ludusTierIndex(it)){ worn.forEach(w=>winner.inventory.splice(winner.inventory.indexOf(w),1)); winner.inventory.push(it); }
  else ludusGoldAdd(winner,ludusSellPrice(it));
  return it;
}
// the bookkeeping of a bout between gladiators: wins, honour, gold, the dead
function ludusLifeAfterBout(sides,res,kind,region){
  sides.forEach(l=>l.forEach(n=>{ n.foughtToday=true; }));
  const win=sides[res.winner]||[], lose=[].concat(...sides.filter((x,k)=>k!==res.winner)), L=ludusRegionLevel(ludusMapWorld().nodes[region].col);
  win.forEach(n=>ludusMoodAfterBout(n,true,ludusHurtPct(n))); lose.forEach(n=>{ if(res.dead.indexOf(n)<0) ludusMoodAfterBout(n,false,ludusHurtPct(n)); });
  win.forEach(n=>{ n.wins=(n.wins||0)+1; if(kind==='arena'||kind==='tourney') n.fame=ludusFame(n)+1; if(kind==='arena'){ ludusGoldAdd(n,10+6*L); n.honor=(n.honor||0)+10*lose.length; } });
  lose.forEach(n=>{ n.losses=(n.losses||0)+1; if(kind==='arena') n.honor=Math.max(0,(n.honor||0)-5); });
  if(kind==='pit'&&win[0]&&lose[0]){ const it=ludusLifeLoot(win[0],lose[0]); if(it&&region===ludus.map.region) ludusChron(region,'loot',`${win[0].name} nimmt ${lose[0].name} in der Grube ${instLabel(it)} ab.`); }
  res.dead.forEach(n=>{ n.status='dead'; n.diedDay=ludus.day; n.last={ t:'died', d:ludus.day }; const k=win[0]; if(k&&res.dead.indexOf(k)<0) k.kills=(k.kills||0)+1;
    ludusChron(region,'death',`${n.name} (${SPECIES[n.kind].label} der Stufe ${n.level}) fällt in der Arena${k?' gegen '+k.name:''}.`); });
  // the verdict: the winner (the best of his side still standing) over every loser who lives; between gladiators of the same school there is none
  if(kind==='arena'||kind==='tourney'){ const w=win.find(n=>res.dead.indexOf(n)<0); if(w) lose.filter(n=>res.dead.indexOf(n)<0&&n.status!=='dead').forEach(l=>{ if(!!ludusMember(w.id)&&!!ludusMember(l.id)) return; if(ludusMember(w.id)) return; ludusVerdict(w,l,ludusAiExecutes(w,l),region); }); }
}

// ---- fame and the verdict: whoever wins in the arena decides over a loser who is still alive ----
// Execute: the loser dies, the winner gains fame (2 + half the loser's fame: who has executed much carries much fame, and is worth much to whoever beats him).
// Spare: the loser pays a ransom out of his own gold (up to a prize of the region), and owes the winner (+2 to their relation, +3 when he could pay nothing).
// The world's gladiators decide by a fixed rule, no dice: their boldness, the loser's fame and how often he executed others speak for the axe, a good relation against it.
const LUDUS_VERDICT={ fame:2, fameShare:0.5, spare:2, sparePoor:3, ai:0.55 };
const ludusFame=g=>g&&g.fame||0;
// the relation of `a` to `b` (-3 … 3): a gladiator of the world to the school is his `bond`, otherwise what `a` remembers of `b`
function ludusRel(a,b){ if(!a||!b) return 0; const own=x=>!!ludusMember(x.id); if(own(b)&&!own(a)) return a.bond||0; return (a.rel&&a.rel[b.id])||0; }
function ludusRelAdd(a,b,v){ if(!a||!b) return; const own=x=>!!ludusMember(x.id); if(own(b)&&!own(a)){ a.bond=Math.max(-3,Math.min(3,(a.bond||0)+v)); return; } a.rel=a.rel||{}; a.rel[b.id]=Math.max(-3,Math.min(3,(a.rel[b.id]||0)+v)); }
const ludusExecGain=l=>LUDUS_VERDICT.fame+Math.round(LUDUS_VERDICT.fameShare*ludusFame(l));
const ludusRansom=(l,region)=>{ const L=ludusRegionLevel(ludusMapWorld().nodes[region].col), want=10+6*L, has=ludusGold(l); return Math.max(0,Math.min(want,has)); };
// an accord between their teams, or a good relation (2 and more), spares him for sure; below that the relation weighs much against the axe
const ludusAiExecutes=(w,l)=>!ludusSpared(w,l)&&ludusRel(w,l)<2&&0.7*(w.bold===undefined?0.5:w.bold)+0.03*ludusFame(l)+0.12*(l.execs||0)-0.4*ludusRel(w,l)>LUDUS_VERDICT.ai;
// carries a verdict out; returns the line for the chronicle and the result
function ludusVerdict(w,l,execute,region){
  const ownL=!!ludusMember(l.id), ownW=!!ludusMember(w.id);
  if(execute){
    const gain=ludusExecGain(l); w.fame=ludusFame(w)+gain; w.execs=(w.execs||0)+1; w.kills=(w.kills||0)+1; if(ownW) ludus.fame+=gain;
    if(ownL){ ludus.team=ludus.team.filter(m=>m!==l); ludus.sel=Math.max(0,Math.min(ludus.sel,ludus.team.length-1)); const n=l.npc&&ludusNpc(l.npc); if(n){ n.status='dead'; n.diedDay=ludus.day; } }
    else { l.status='dead'; l.diedDay=ludus.day; l.last={ t:'died', d:ludus.day }; }
    (ludus.world||[]).forEach(n=>{ if(n.status==='active'&&n!==w&&n.rel&&(n.rel[l.id]||0)>=1) ludusRelAdd(n,w,-2); });       // his friends do not forget
    const t=`${w.name} richtet ${l.name} hin (+${gain} Ruhm).`; ludusChron(region,'death',t);
    if(ownL&&!ownW){ ludusRivalMark(w,[l],'exec'); ludusHallAdd(l,'exec',w.name); }       // whoever executes one of yours becomes your rival
    const rv=ownW?ludusRevenge(l):''; return rv?t+' · '+rv:t;
  }
  const pay=ludusRansom(l,region);
  ludusGoldAdd(l,-pay); ludusGoldAdd(w,pay);       // out of the loser's team's purse into the winner's
  ludusRelAdd(l,w,pay>0?LUDUS_VERDICT.spare:LUDUS_VERDICT.sparePoor);
  const t=`${w.name} verschont ${l.name}${pay?` (Lösegeld ${pay} Gold)`:''}.`; if(region===ludus.map.region) ludusChron(region,'spare',t); return t;
}

// ---- challenges: a duel in the arena the next day; whoever does not come is a coward ----
// A challenged gladiator accepts when he bears a grudge, when he thinks himself a match (at least 0.8 of the challenger's worth) or when he is bold; else he declines
// and loses 5 honour. The duel pays half again, and 10 honour more to the winner; who does not come loses 10 honour, the other gains 5.
// The world challenges too: each morning the most eager gladiator of the region (boldness, grudge against the school, honour just below an own gladiator's) may challenge
// the school's best (at most every 3 days); enemies among themselves settle it in the evening's arena.
const LUDUS_CHALLENGE={ accept:0.8, decline:5, coward:10, bonus:10, aiEvery:3, aiScore:1.15 };
const ludusChallengesToday=()=>(ludus.challenges||[]).filter(c=>c.day===ludus.day);
const ludusChallenged=id=>(ludus.challenges||[]).some(c=>c.npc===id&&c.day>=ludus.day&&!c.done);
const ludusAccepts=(n,m)=>ludusRel(n,m)<=-1||ludusGladWorth(n)>=LUDUS_CHALLENGE.accept*ludusGladWorth(m)||(n.bold||0)>=0.7;
const ludusCanChallenge=n=>!!n&&n.status==='active'&&!n.boss&&!ludusAlliedSchool(n)&&!ludusIsChamp(ludus.map.region,'npc',n.id)&&!ludusChallenged(n.id)&&!ludus.tourney&&ludusTourneyIn()>1;
function ludusChallenge(id){
  const n=ludusNpc(id), m=ludus.fighter; if(!m||!ludusCanChallenge(n)) return;
  if(ludusAccepts(n,m)){ ludus.challenges=(ludus.challenges||[]).concat([{ id:'c'+ludus.day+':'+n.id, own:m.id, npc:n.id, day:ludus.day+1, by:'own' }]); const t=`${m.name} fordert ${n.name} heraus: morgen in der Arena.`; ludusChron(ludus.map.region,'challenge',t); ludusNote=t+` · ${n.name} nimmt an.`; }
  else { n.honor=Math.max(0,(n.honor||0)-LUDUS_CHALLENGE.decline); const t=`${n.name} lehnt die Herausforderung von ${m.name} ab.`; ludusChron(ludus.map.region,'challenge',t); ludusNote=t; }
  ludus.arenaOffers=null; ludusSave(); ludusRender();
}
function ludusAiChallenge(){
  if(ludus.tourney||ludusTourneyIn()<=1||!ludus.team.length||ludus.day-(ludus.lastAiChallenge||-99)<LUDUS_CHALLENGE.aiEvery) return;
  const id=ludus.map.region, top=ludus.team.slice().sort((a,b)=>(b.honor||0)-(a.honor||0))[0];
  const best=ludusRegionNpcs(id).filter(n=>ludusCanChallenge(n)&&!n.maimed&&ludusHurtPct(n)>=LUDUS_LIFE.restBelow)
    .map(n=>({ n, sc:(n.bold||0)+0.3*Math.max(0,-(n.bond||0))+((top.honor||0)>(n.honor||0)&&(top.honor||0)-(n.honor||0)<=30?0.3:0) })).sort((a,b)=>b.sc-a.sc)[0];
  if(!best||best.sc<LUDUS_CHALLENGE.aiScore) return;
  ludus.challenges=(ludus.challenges||[]).concat([{ id:'c'+ludus.day+':'+best.n.id, own:top.id, npc:best.n.id, day:ludus.day, by:'npc' }]); ludus.lastAiChallenge=ludus.day; ludus.arenaOffers=null;
  const t=`${best.n.name} fordert ${top.name} heraus: heute in der Arena.`; ludusChron(id,'challenge',t); if(typeof ludusDayNote!=='undefined') ludusDayNote+=(ludusDayNote?' · ':'')+t;
}
// the end of the day: who did not come to his duel is a coward
function ludusChallengesExpire(){
  (ludus.challenges||[]).filter(c=>c.day===ludus.day&&!c.done).forEach(c=>{ const m=ludusMember(c.own), n=ludusNpc(c.npc);
    if(!n||n.status!=='active') return;       // the other one could not come: nobody is a coward
    if(m) m.honor=Math.max(0,(m.honor||0)-LUDUS_CHALLENGE.coward); if(n) n.honor=(n.honor||0)+5;
    if(m&&n) ludusChron(ludus.map.region,'challenge',`${m.name} kneift vor ${n.name}.`); });
  ludus.challenges=(ludus.challenges||[]).filter(c=>c.day>ludus.day);
}
// enemies first: pairs of a list who bear each other a grudge (relation −2 or worse) fight each other, the rest by strength; never two of one team
function ludusFeudPairs(l){
  const out=[], left=l.slice(), mates=(a,b)=>!!a.team&&a.team===b.team||ludusAllied(a,b);
  for(let i=0;i<left.length;i++){ const a=left[i]; const j=left.findIndex((b,k)=>k>i&&!mates(a,b)&&(ludusRel(a,b)<=-2||ludusRel(b,a)<=-2)); if(j>0){ out.push([a,left[j],true]); left.splice(j,1); left.splice(i,1); i--; } }
  return out.concat(ludusPairUp(left));
}
// pairs of neighbours by strength, never two of one team or of allied teams (they do not fight each other in the arena)
function ludusPairUp(l){ const left=l.slice(), out=[]; while(left.length>1){ const a=left.shift(), j=left.findIndex(b=>(!a.team||b.team!==a.team)&&!ludusAllied(a,b)); if(j<0) continue; out.push([a,left.splice(j,1)[0],false]); } return out; }

// the evening's free for all among the world's gladiators: four, everyone for himself, and those who like each other stand together (the same rule as in the player's bouts)
function ludusLifeFfa(four,region){
  const o={ foes:four.map(n=>({ npc:n.id })) }, pacts=ludusAiPacts(o), res=ludusLifeBoutN(four.map(n=>[n]),'arena',ludus.day+':ffa',pacts);
  pacts.forEach(([i,j])=>ludusChron(region,'pact',`${four[i-1].name} und ${four[j-1].name} verbünden sich für Jeder gegen jeden.`));
  ludusChron(region,'pact',`Jeder gegen jeden: ${four.map(n=>n.name).join(', ')}. ${four[res.winner].name} bleibt als Letzter stehen.`);
  ludusLifeAfterBout(four.map(n=>[n]),res,'arena',region);
  if(pacts.length) pacts.forEach(([i,j])=>{ const a=four[i-1], b=four[j-1]; if(res.dead.indexOf(a)<0&&res.dead.indexOf(b)<0){ ludusRelAdd(a,b,1); ludusRelAdd(b,a,1); } });       // a pact that held binds
}

// ---- alliances in a free for all: allies do not fight each other while any other side still stands; then they fight it out ----
// A gladiator of the field allies with the school for nothing if he is well disposed (relation 1 and more), for 6 gold per level of his if neutral or wary, not at all if hostile.
// Gladiators of the field who like each other (their relations both ways add up to 3 or more) stand together on their own, in pairs. A pact that held: the ally +1 to the school.
// Striking an ally while the pact holds is betrayal (only a possessed gladiator can): the betrayed becomes hostile (−3), and the chronicle tells it.
const LUDUS_PACT={ fee:6, mutual:3 };
const ludusPactFee=n=>(n.bond||0)>=1?0:((n.bond||0)<=-2?null:LUDUS_PACT.fee*n.level);
// the sides of a free for all besides the school (side 0): lists of foe indices; a team bout groups them, else every foe is a side of his own
const ludusFfaSides=o=>o.groups||(o.foes||[]).map((f,k)=>[k]);
const ludusSideNpcs=(o,s)=>(ludusFfaSides(o)[s-1]||[]).map(k=>ludusNpc((o.foes[k]||{}).npc)).filter(Boolean);
const ludusSideName=(o,s)=>ludusSideNpcs(o,s).map(n=>n.name).join(' & ');
// how much two groups like each other: the relations both ways, per pair of them
const ludusLiking=(A,B)=>{ let t=0, k=0; A.forEach(a=>B.forEach(b=>{ t+=ludusRel(a,b)+ludusRel(b,a); k++; })); return k?t/k:0; };
function ludusAiPacts(o){
  const S=ludusFfaSides(o).length, out=[], used=new Set([o.pact]);
  for(let i=1;i<=S;i++) for(let j=i+1;j<=S;j++){ if(used.has(i)||used.has(j)) continue;
    if(ludusLiking(ludusSideNpcs(o,i),ludusSideNpcs(o,j))>=LUDUS_PACT.mutual){ out.push([i,j]); used.add(i); used.add(j); } }
  return out;
}
// the pacts of a bout, as sides of the match (0 = the school, 1… = the other sides in order); a side asks the sum of its members' prices, and none if one of them refuses
function ludusPacts(o){ if(!o||!o.ffa) return []; const g=ludusAiPacts(o); if(o.pact) g.unshift([0,o.pact]); return g; }
const ludusSidePactFee=(o,s)=>{ const f=ludusSideNpcs(o,s).map(ludusPactFee); return !f.length||f.includes(null)?null:f.reduce((a,b)=>a+b,0); };
function ludusPactOffer(i,s){
  const o=ludusArenaOffers()[i]; if(!o||!o.ffa||o.pact||ludusAiPacts(o).some(p=>p.includes(s))) return;
  const ns=ludusSideNpcs(o,s), fee=ludusSidePactFee(o,s); if(!ns.length||fee===null||ludus.gold<fee) return;
  ludus.gold-=fee; ns.forEach(n=>{ ludusGoldAdd(n,ludusPactFee(n)); }); o.pact=s; ludus.arenaEst=null;
  ludusNote=`Kampfbündnis mit ${ludusSideName(o,s)}: ihr kämpft zusammen, bis nur noch ihr übrig seid${fee?` (${fee} Gold)`:''}.`; ludusSave(); ludusRender();
}
// after the bout: betrayals and pacts that held
function ludusPactsAfter(o,st,lead){
  if(!o||!o.ffa) return ''; const side=ti=>ti===0?(lead?[lead]:[]):ludusSideNpcs(o,ti), out=[];
  (st.arena.betrayals||[]).forEach(([by,of])=>{ const A=side(by), B=side(of); if(!A.length||!B.length) return;
    if(by===0) B.forEach(n=>{ n.bond=-3; }); else if(of===0) A.forEach(n=>{ n.bond=-3; }); else B.forEach(b=>A.forEach(a=>{ b.rel=b.rel||{}; b.rel[a.id]=-3; }));
    const t=`${A.map(n=>n.name).join(' & ')} verrät ${B.map(n=>n.name).join(' & ')}.`; ludusChron(ludus.map.region,'pact',t); out.push(t); });
  if(o.pact&&lead&&!(st.arena.betrayals||[]).some(p=>p.includes(0))){ ludusSideNpcs(o,o.pact).forEach(n=>ludusRelAdd(n,lead,1)); out.push(`Das Bündnis mit ${ludusSideName(o,o.pact)} hat gehalten.`); }
  return out.join(' · ');
}

// ---- trade with a gladiator: the same prices for everyone; a good relation makes them better ----
// buying from him: worth × (1.3 − 0.1 × relation); selling to him (a piece better than what he wears, if he can pay): worth × (0.6 + 0.05 × relation)
const ludusBuyPrice=(n,inst)=>Math.max(1,Math.round(ludusPrice(asInstance(inst).id)*(1.3-0.1*(n.bond||0))));
const ludusSellTo=(n,inst)=>Math.max(1,Math.round(ludusPrice(asInstance(inst).id)*(0.6+0.05*(n.bond||0))));
function ludusWantsItem(n,inst){ const d=instDef(inst); if(!d||!['weapon','armor','shield'].includes(d.type)) return false; const worn=(n.inventory||[]).filter(i=>instDef(i)&&instDef(i).type===d.type); return !worn.length||Math.max(...worn.map(ludusTierIndex))<ludusTierIndex(inst); }
// a gift of gold: a step of relation for 5 gold per level of his
const ludusGiftCost=n=>5*n.level;
function ludusTradeBuy(id,k){ const n=ludusNpc(id), inst=n&&n.inventory&&n.inventory[k]; if(!inst) return; const pr=ludusBuyPrice(n,inst); if(ludus.gold<pr) return; ludus.gold-=pr; ludusGoldAdd(n,pr); n.inventory.splice(k,1); ludus.stash.push(inst); ludusNote=`Gekauft: ${instLabel(inst)} für ${pr} Gold.`; ludusSave(); ludusRender(); }
function ludusTradeSell(id,k){ const n=ludusNpc(id), inst=ludus.stash[k]; if(!n||!inst||!ludusWantsItem(n,inst)) return; const pr=ludusSellTo(n,inst); if(ludusGold(n)<pr) return;
  ludusGoldAdd(n,-pr); ludus.gold+=pr; ludus.stash.splice(k,1); const d=instDef(inst); n.inventory=(n.inventory||[]).filter(i=>!(instDef(i)&&instDef(i).type===d.type)); n.inventory.push(inst); n.tier=ludusGladTier(n); ludusRelAdd(n,ludus.fighter,1);
  ludusNote=`Verkauft: ${instLabel(inst)} an ${n.name} für ${pr} Gold.`; ludusSave(); ludusRender(); }
function ludusTradeGift(id){ const n=ludusNpc(id); if(!n) return; const c=ludusGiftCost(n); if(ludus.gold<c||(n.bond||0)>=3) return; ludus.gold-=c; ludusGoldAdd(n,c); n.bond=Math.min(3,(n.bond||0)+1); ludusNote=`${n.name} nimmt das Geschenk an.`; ludusSave(); ludusRender(); }
const LUDUS_BOND_WORD=b=>b>=2?'befreundet':(b>=1?'wohlgesinnt':(b<=-2?'verfeindet':(b<=-1?'misstrauisch':'neutral')));

// ---- the evening: the bouts of the day without the player ----
// in the player's region: pairs of similar strength, in the pit and in the arena, fought by the engine
function ludusLifeEveningHere(){
  if(!ludus.life||ludus.life.day!==ludus.day) return;
  const id=ludus.life.region;
  ['pit','arena'].forEach(kind=>{
    const l=ludusGoers(kind).sort((x,y)=>ludusGladWorth(y)-ludusGladWorth(x));
    if(kind==='arena'&&l.length>=LUDUS_LIFE.ffaFrom){ const four=[]; for(let k=l.length-1;k>=0&&four.length<4;k--) if(!four.some(x=>x.team===l[k].team||ludusAllied(x,l[k]))) four.push(l[k]); if(four.length===4){ four.forEach(x=>l.splice(l.indexOf(x),1)); ludusLifeFfa(four,id); } }       // the four weakest of four teams
    const pairs=kind==='arena'?ludusFeudPairs(l):l.reduce((o,n,i)=>(i%2?o[o.length-1].push(n):o.push([n]),o),[]).filter(p=>p.length===2);
    pairs.forEach(([x,y,feud],i)=>{ if(feud) ludusChron(id,'challenge',`Fehde in der Arena: ${x.name} gegen ${y.name}.`); const a=[x], b=[y], res=ludusLifeBout(a,b,kind,ludus.day+':'+kind+i); ludusLifeAfterBout([a,b],res,kind,id); });
  });
  ludusRegionNpcs(id).forEach(n=>{ const p=ludusPlanOf(n.id); if(p==='rest'||((p==='pit'||p==='arena')&&!n.foughtToday)) ludusLifeRest(n); else if(p==='work') ludusLifeWork(n); });
}
function ludusLifeRest(n){ const c=ludusMemberCreature(n); n.hp=Math.min(c.maxHp,Math.round(c.hp+c.maxHp*0.5)); if(n.hp>=c.maxHp) n.hp=undefined; n.energy=100; ludusMoodAdd(n,LUDUS_MOOD.rest); }
// elsewhere: the same day, estimated: who fights whom, the stronger wins as often as the worth says
function ludusLifeEveningElsewhere(){
  const r=ludusRng('else'+ludus.day);
  Object.keys(ludus.regions||{}).forEach(k=>{
    const id=+k; if(id===ludus.map.region) return;
    const l=ludusRegionNpcs(id).filter(n=>!n.maimed); l.forEach(ludusEquip);
    const goers={ pit:[], arena:[] };
    l.forEach(n=>{ if(ludusHurtPct(n)<LUDUS_LIFE.restBelow){ ludusLifeRest(n); return; } if(ludusLifePoor(n)&&r()>=n.bold){ ludusLifeWork(n); return; } const x=r(); if(x<0.25){ ludusLifeRest(n); return; } (x<0.25+0.3+0.3*n.bold?goers.arena:goers.pit).push(n); });
    ['pit','arena'].forEach(kind=>{
      const g=goers[kind].sort((x,y)=>ludusGladWorth(y)-ludusGladWorth(x)), gp=kind==='arena'?ludusFeudPairs(g):g.reduce((o,n,i)=>(i%2?o[o.length-1].push(n):o.push([n]),o),[]).filter(p=>p.length===2);
      for(const [a,b] of gp){
        const wa=ludusGladWorth(a), wb=ludusGladWorth(b), pa=Math.pow(wa,1.5)/(Math.pow(wa,1.5)+Math.pow(wb,1.5)), aw=r()<pa, win=aw?a:b, lose=aw?b:a;
        ludusGladXp(win,ludusBoutXp(lose.level,true,1)); ludusGladXp(lose,ludusBoutXp(win.level,false,1));
        const cw=ludusMemberCreature(win), cl=ludusMemberCreature(lose);
        win.hp=Math.max(1,Math.round(cw.hp*(0.45+0.4*r()))); lose.hp=Math.max(1,Math.round(cl.hp*0.15));
        const res={ winner:aw?0:1, dead:kind==='arena'&&r()<LUDUS_LIFE.deathCoarse?[lose]:[] };       // death in the fight itself; the verdict comes after (ludusLifeAfterBout)
        ludusLifeAfterBout([[a],[b]],res,kind,id);
      }
    });
  });
}
// gladiators with gold buy better gear (the forge of their region: one quality above what they wear, up to the region's usual one and one more)
function ludusLifeShop(){
  // the poor sell: a gladiator short of gold sells his best piece to one of his region who wants it and can pay (worth × (0.8 + 0.05 × their relation))
  (ludus.world||[]).forEach(n=>{
    if(n.status!=='active'||!ludusLifePoor(n)||!(n.inventory||[]).length) return;
    const it=n.inventory.slice().sort((a,b)=>ludusPrice(b.id)-ludusPrice(a.id))[0];
    const buyer=ludusRegionNpcs(n.region).filter(b=>b!==n&&b.team!==n.team&&!ludusLifePoor(b)&&ludusWantsItem(b,it)).map(b=>({ b, pr:Math.round(ludusPrice(it.id)*(0.8+0.05*ludusRel(b,n))) })).filter(x=>ludusGold(x.b)>=x.pr).sort((p,q)=>ludusGold(q.b)-ludusGold(p.b))[0];
    if(!buyer) return;
    const b=buyer.b, d=instDef(it); n.inventory.splice(n.inventory.indexOf(it),1); ludusGoldAdd(n,buyer.pr); ludusGoldAdd(b,-buyer.pr);
    b.inventory=(b.inventory||[]).filter(i=>!(instDef(i)&&instDef(i).type===d.type)); b.inventory.push(it); ludusRelAdd(n,b,1);
    if(n.region===ludus.map.region) ludusChron(n.region,'trade',`${n.name} verkauft ${instLabel(it)} an ${b.name} für ${buyer.pr} Gold.`);
  });
  (ludus.world||[]).forEach(n=>{
    if(n.status!=='active'||!n.inventory||ludusGold(n)<20) return;
    const node=ludusMapWorld().nodes[n.region]; if(!node) return; const top=Math.min(3,ludusRegionTier(node.col)+1);
    for(const it of n.inventory.slice()){
      const d=instDef(it); if(!d||!['weapon','armor','shield'].includes(d.type)) continue;
      const t=ludusTierIndex(it); if(t>=top) continue; const id=d.family+'_'+TIER_IDS[t+1]; if(!ITEMS[id]) continue;
      const pr=ludusPrice(id); if(ludusGold(n)<pr) continue;
      ludusGoldAdd(n,-pr); n.inventory.splice(n.inventory.indexOf(it),1,{ id, q:1, s:arenaHash(n.id+':'+ludus.day+':'+id) }); break;
    }
  });
}
// the day ends (called before the day is counted on)
// board and lodging, the same as for the player's school (paid by the team, ludus-teams.js): a gladiator of a poor team works or fights for gold tomorrow
const ludusLifePoor=n=>{ const t=ludusTeamOf(n); return !t||ludusTeamPoor(t); };
function ludusLifeWork(n){ ludusGoldAdd(n,ludusWage(ludusMapWorld().nodes[n.region].col)); n.energy=Math.max(10,(n.energy||100)-10); }
function ludusLifeUpkeep(){ ludusTeamsUpkeep(); }
function ludusLifeEvening(){
  ludusTeamsTidy(); ludusLifeEveningHere(); ludusLifeEveningElsewhere(); ludusLifeShop(); ludusLifeUpkeep(); ludusTeamsEvening();
  (ludus.world||[]).forEach(n=>{ delete n.foughtToday; });
  (ludus.world||[]).forEach(n=>{ if(n.status==='active') n.tier=ludusGladTier(n); });
}

// ---- the tournaments of the other regions (on the same day as the player's): the champion team is estimated from the best eight (each by its three strongest) ----
function ludusLifeTourneys(){
  const r=ludusRng('lt'+ludus.day);
  Object.keys(ludus.regions||{}).forEach(k=>{
    const id=+k; if(id===ludus.map.region) return;
    const champ=ludusChamp(id), l=ludusRegionNpcs(id).filter(n=>!n.maimed);
    const seeds=ludusTeamTable(id).filter(x=>x.t==='team'&&ludusTeamMembers(x.id).some(n=>!n.maimed)).slice(0,8);       // the champion team first, then the table
    const power=x=>ludusEntryLineup({ t:'team', id:x.id }).reduce((s,n)=>s+Math.pow(ludusGladWorth(n),1.5),0);
    let round=seeds; while(round.length>1){ const next=[]; for(let i=0;i<round.length;i+=2){ const a=round[i], b=round[i+1]; if(!b){ next.push(a); continue; } const pa=power(a), pb=power(b); next.push(r()<pa/Math.max(1e-6,pa+pb)?a:b); } round=next; }
    const w=round[0]; if(!w) return;
    const prev=champ&&champ.t==='team'?ludusTeam(champ.id):null;
    ludus.regions[id].champ={ t:'team', id:w.id }; ludusEntryLineup({ t:'team', id:w.id }).forEach(n=>{ n.honor=(n.honor||0)+30; });
    if(!prev||prev.id!==w.id) ludusChron(id,'champ',`${w.name} gewinnt das Turnier von ${ludusRegionName(id)}${prev?' und stürzt '+prev.name:''}.`);
  });
  ludusLifeMigrate();
}
// ---- after a tournament: a team that has outgrown its region moves on to the right; rookies start on the left; empty regions get wanderers ----
// A team moves as one: when its gladiators' average level stands 2 above its region's (3 with a champion among them). In the last column it retires as legends.
function ludusLifeMigrate(){
  const w=ludusMapWorld(), r=ludusRng('mig'+ludus.day);
  ludusTeamsTidy();
  Object.values(ludus.teams||{}).forEach(t=>{
    const mem=ludusTeamMembers(t.id), node=w.nodes[t.region]; if(!mem.length||!node||t.region===ludus.map.region&&ludus.tourney||mem.some(n=>n.rival)) return;       // a rival's team does not wander off: it hunts
    const champ=mem.find(n=>ludusIsChamp(t.region,'npc',n.id)), avg=mem.reduce((s,n)=>s+n.level,0)/mem.length;
    if(avg<ludusRegionLevel(node.col)+LUDUS_LIFE.outgrow+(champ?LUDUS_LIFE.champExtra:0)) return;
    const next=ludusMapNeighbours(node.id).map(i=>w.nodes[i]).filter(m=>m.col>node.col);
    // a waypoint is passed on the way: the next region behind it
    const regions=[]; next.forEach(m=>{ if(ludusIsRegion(m)) regions.push(m); else ludusMapNeighbours(m.id).map(i=>w.nodes[i]).filter(x=>x.col>m.col&&ludusIsRegion(x)).forEach(x=>regions.push(x)); });
    if(!regions.length){       // nowhere further to go: the land's best retire as legends
      if(champ) return;
      mem.forEach(n=>{ n.status='gone'; n.goneDay=ludus.day; }); ludusChron(t.region,'champ',`${t.name} (${mem.map(n=>n.name).join(', ')}) tritt als Legende ab.`); return; }
    if(champ){       // the champion team lays down its title: the team of the gladiator with the most honour (of another team) takes place 1
      const nx=ludusRegionNpcs(t.region).filter(x=>x.team!==t.id&&!x.maimed).sort((a,b)=>(b.honor||0)-(a.honor||0))[0];
      if(nx&&ludusTeam(nx.team)){ ludus.regions[t.region].champ={ t:'team', id:nx.team }; ludusChron(t.region,'champ',`${t.name} legt den Titel von ${node.name} nieder, ${ludusTeam(nx.team).name} ist neuer Champion.`); }
    }
    const crowd=m=>ludusRegionNpcs(m.id).length+r()*0.5, to=regions.sort((x,y)=>crowd(x)-crowd(y))[0]; ludusRegionEnsure(to.id);       // the least crowded of the next regions
    ludusChron(t.region,'move',`${t.name} zieht weiter nach ${to.name}.`);
    if(to.id===ludus.map.region) ludusChron(to.id,'move',`${t.name} kommt aus ${ludusRegionName(t.region)}.`);
    mem.forEach(n=>{ n.region=to.id; n.honor=0; n.maimed=false; n.boss=false; }); t.region=to.id;
  });
  Object.keys(ludus.regions||{}).forEach(k=>{
    const id=+k, node=w.nodes[id], have=ludusRegionNpcs(id).filter(n=>!n.boss&&!ludusIsChamp(id,'npc',n.id)).length;
    if(node.col===0){ for(let i=have;i<LUDUS_TOUR.roster;i++){ const n=ludusNpcMake(r,id,0.55+0.25*r(),-1); n.honor=0; ludus.world.push(n); ludusChron(id,'rookie',`${n.name} (${SPECIES[n.kind].label}) beginnt als Neuling in ${node.name}.`); } }
    else if(have<LUDUS_LIFE.minRoster){ for(let i=have;i<LUDUS_LIFE.minRoster;i++){ const n=ludusNpcMake(r,id,0.8+0.2*r(),-1); n.honor=0; ludus.world.push(n); } }
  });
  ludus.world=ludus.world.filter(n=>n.status==='active'||n.status==='team'||(n.status==='dead'&&ludus.day-(n.diedDay||0)<30));
  ludusTeamsTidy();       // the rookies and wanderers found their teams
}

// ---- on screen ----
const LUDUS_PLAN_LABEL={ pit:'in der Grube', arena:'in der Arena', rest:'ruht', work:'arbeitet' };
function ludusChronicleHTML(){
  const w=ludusMapWorld(), col=ludusRegionNode().col, near=e=>{ const n=w.nodes[e.r]; return !!n&&n.col>=col&&n.col<=col+2; };
  const l=(ludus.chronicle||[]).filter(e=>e.r===ludus.map.region||((e.k==='champ'||e.k==='death')&&near(e))).slice(0,18); if(!l.length) return '';
  return `<h3>Chronik</h3><div class="luLog">${l.map(e=>`<span>Tag ${e.d}${e.r!==ludus.map.region?' · '+ludusEsc(ludusRegionName(e.r)):''}:</span> <span>${ludusEsc(e.t)}</span>`).join('<br>')}</div>`;
}
