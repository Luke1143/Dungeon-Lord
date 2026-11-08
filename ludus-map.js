// Ludus map mode: a campaign-style world of cities. Each city holds a cup (several rounds, a loss throws you out, the final is against a figure of the ladder); winning conquers the city.
// State: ludus.mode==='map', ludus.map={ at, done[], beaten[] }, ludus.cup={ node, round, rounds } while a cup runs. The world itself is rebuilt from the run seed (never saved).
let ludusMapCache=null, ludusMapTerrain=null, ludusMapSeed=null;
function ludusMapWorld(){
  if(!ludusMapCache||ludusMapSeed!==ludus.seed){
    const prev=world, prevT=owTerrainCache;
    try{ world=buildWorld('lm'+ludus.seed); owTerrainCache=null; owRenderTerrain(); ludusMapTerrain=owTerrainCache; ludusMapCache=world; ludusMapSeed=ludus.seed; }
    finally{ world=prev; owTerrainCache=prevT; }
  }
  return ludusMapCache;
}
const ludusMapUnlocked=()=>!!(ludusMeta.unlockAll||ludusMeta.bestWins>=8||(ludusMeta.titles||0)>0);
const ludusMapLastCol=w=>Math.max(...w.nodes.map(n=>n.col));
function ludusMapInit(){
  const w=ludusMapWorld(), start=w.nodes.find(n=>n.col===0);
  ludus.map={ at:start.id, done:[start.id], beaten:[] };
}
const ludusCupNode=()=>ludusMapWorld().nodes[ludus.cup?ludus.cup.node:ludus.map.at];
const ludusCupRoundsFor=n=>2+(n.col>=4?1:0)+(n.col>=8?1:0);
function ludusMapNeighbours(id){ const w=ludusMapWorld(); return w.edges.filter(e=>e.a===id||e.b===id).map(e=>e.a===id?e.b:e.a); }
const ludusIsCity=n=>n.col>0&&n.type!=='event';

// ---- the strength of a city ----
// A city has the level of a team that is a match for it (the recommended level, shown on the map). Its foes are made for that level whatever the team is now:
// test fights against a reference team find the foes' level that gives the wanted win rate. The reference team is the team's own kinds on the city's level, with the gear and the gifts
// a player on the usual way (a city after the other) has by then. Whoever comes too early meets what he cannot beat, whoever trains first wins with ease; better gear, more gifts and scrolls are the margin.
const LUDUS_CITY={
  step:1, cap:9,                   // the level grows by `step` per column of the map, up to `cap` (levels come ever slower: the experience needed doubles with each)
  round:0.99, perCol:0.012, final:0.97, finalPerCol:0.025,       // the win rate of the reference team in a round / in the final, lower for each column
  giftsPerCol:0.6,                 // gifts of the reference team: so many for each column after the first
  needs:6,                         // cities to conquer before the capital opens
  driftStart:90, driftEvery:20,    // the cities arm themselves: from this day on their level rises by one, and by one more every so many days (whoever trains for ever falls behind)
  maxOver:4,                       // foes are at most this many levels above the city's (a weak kind made a monster of a level plays unevenly: rather a stronger kind)
  runs:16                          // test fights per probe (at most) when a cup bout is searched
};
const ludusCityBase=col=>Math.max(1,Math.min(LUDUS_CITY.cap,Math.round(1+LUDUS_CITY.step*col)));
const ludusCityDrift=()=>ludus&&ludus.day>=LUDUS_CITY.driftStart?1+Math.floor((ludus.day-LUDUS_CITY.driftStart)/LUDUS_CITY.driftEvery):0;
const ludusCityLevel=col=>ludusCityBase(col)+ludusCityDrift();
const ludusCityTier=col=>col<3?0:(col<8?1:2);       // the gear a player has by then (crude at first, plain in the middle, fine at the end)
const LUDUS_TIER_WORD=['grobe','schlichte','feine'];
const ludusCityGifts=col=>Math.max(0,Math.round(LUDUS_CITY.giftsPerCol*(col-1)));
const ludusCityTarget=(col,last)=>Math.max(0.3,last?LUDUS_CITY.final-LUDUS_CITY.finalPerCol*col:LUDUS_CITY.round-LUDUS_CITY.perCol*col);
// what a player usually wears: a sword and a light armour of the tier (the smith's cheapest), whatever the kind
const ludusStdGear=(tier,seed)=>['sword','lightArmor'].map((fam,i)=>({ id:fam+'_'+TIER_IDS[tier], q:1, s:seed+i }));
function ludusRefTeam(col,rng){
  const L=ludusCityLevel(col), tier=ludusCityTier(col);
  const team=ludus.team.map((m,i)=>({ id:'rf'+i, gifts:[], kind:m.kind, name:m.name, level:L, xp:xpForLevel(L), hp:undefined, inventory:ludusStdGear(tier,m.seed%1000+i), learned:[], books:[], seed:m.seed }));
  for(let k=0;k<ludusCityGifts(col);k++){ const m=team[k%team.length], offer=genGiftOffer(rng,ludusMemberCreature(m),4*k); m.gifts.push(offer.sort((a,b)=>b.power-a.power)[0]); }       // each takes the strongest of the offer, as a player would
  return team;
}
// how the team stands against a city, by the levels alone: 0 easy, 1 feasible, 2 balanced, 3 risky, 4 hopeless
// (measured: a team at the city's level clears a cup about 7 times in 10, one level more about 8, two more about 9; two less about 3, and fewer from there)
function ludusCityRisk(n){ const d=ludusLevel()-ludusCityLevel(n.col); return d>=2?0:(d===1?1:(d===0?2:(d>=-2?3:4))); }
const LUDUS_RISK_LABEL=['Leicht','Machbar','Ausgeglichen','Riskant','Aussichtslos'], LUDUS_RISK_COLOR=['#7fd36b','#b6dc5a','#e8d870','#f09a40','#e05040'];
const ludusConquered=()=>ludus.map.done.filter(id=>ludusMapWorld().nodes[id].col>0).length;
const ludusCapitalOpen=()=>ludusConquered()>=LUDUS_CITY.needs;
const ludusCanEnter=n=>ludusIsCity(n)&&!ludus.map.done.includes(n.id)&&(n.col<ludusMapLastCol(ludusMapWorld())||ludusCapitalOpen());

// ---- the finals: a ghost whose level fits the city, else the figure of the ladder for its column (one already beaten makes room for the next weaker) ----
const ludusGhostCol=(g,last)=>{ const lv=ludusGhostLevel(g); let best=1; for(let c=1;c<=last;c++) if(Math.abs(ludusCityBase(c)-lv)<=Math.abs(ludusCityBase(best)-lv)) best=c; return best; };       // the first column whose level is nearest to the ghost's (the highest of equals: the deepest)
const ludusMapBaseIdx=(col,last)=>Math.max(0,Math.min(9,9-Math.round(col*9/last)));
function ludusMapFigureAt(col,beaten){
  const w=ludusMapWorld(), last=ludusMapLastCol(w), lad=ludusLadderBase(ludus.week), base=ludusMapBaseIdx(col,last), done=beaten||[];
  const g=(ludusMeta.ghosts||[]).find(x=>ludusGhostCol(x,last)===col);
  if(g) return Object.assign(ludusGhostFigure(g,lad[base]),{ rank:base+1 });
  for(let d=0;d<10;d++) for(const i of [base+d,base-d]) if(i>=0&&i<10&&!done.includes('r'+lad[i].rank)) return lad[i];
  return lad[base];
}
const ludusMapFigure=n=>ludusMapFigureAt(n.col,ludus.map.beaten);

// ---- the cup ----
// the round's foes: of a few candidates (some easier, some harder than the budget says) the one nearest to the wanted win rate against the reference team; its level is fitted after
function* ludusCupCandidateG(rng,L,tier,target,team,minWorth){
  let kinds=ludusFoeKinds(L); const strong=kinds.filter(k=>creatureWorth(k)>=minWorth); if(strong.length>=3) kinds=strong;
  let best=null;
  for(const [i,scale] of [0.6,0.8,1,1,1.3,1.7].entries()){
    const o=ludusCandidate(rng,kinds,L,tier,rng()*0.8,scale,L); o.cup=true;
    let rate=0.5; try{ rate=arenaSimulate(ludusMatchSetup(o,'cs'+i,team),5,null).wins[0]/5; ludusSims+=5; }catch(e){}
    const sc=Math.abs(rate-target)+rng()*0.05; if(!best||sc<best.sc) best={ sc, o };
    yield i;
  }
  return best.o;
}
// the bout of the cup's current round (a generator, see ludusStepper; ludusCupBout runs it to the end)
function* ludusCupBoutG(){
  const n=ludusCupNode(), cup=ludus.cup, r=cup.round, last=r===cup.rounds-1, L=ludusCityLevel(n.col), tier=ludusCityTier(n.col), target=ludusCityTarget(n.col,last), team=ludusRefTeam(n.col,ludusRng('ref'+n.id+':'+r));
  const cap=L+LUDUS_CITY.maxOver, runs=LUDUS_CITY.runs;
  let o;
  if(last){
    const fig=ludusMapFigure(n), city={ ref:L, ratio:1, tier, team, runs, cap }, reward=Math.round(14+9*L)*2, rng=ludusRng('fig'+n.id);
    o=yield* ludusFigureBoutG(fig,n.col,reward,target,city);
    // a figure that is too mighty even on the lowest level makes way for a lesser kind of the same name, one too weak even on the highest for a stronger one
    for(let a=0;a<4&&!fig.ghost;a++){
      const cur=creatureWorth(o.foes[0].kind), tooStrong=o.fitFloor&&o.fitRate<target-0.2, tooWeak=o.foes[0].level>=cap&&o.fitRate>target+0.1;
      const pool=ludusFoeKinds(L).filter(k=>tooStrong?creatureWorth(k)<cur:(tooWeak?creatureWorth(k)>cur*1.3:false)); if(!pool.length) break;
      o=yield* ludusFigureBoutG(Object.assign({},fig,{ kind:pool[Math.floor(rng()*pool.length)] }),n.col,reward,target,city);
    }
    if(fig.ghost) yield* ludusFitLevelG(o,target,team,true,runs,o.foes[0].level);       // a former team stands as it was, but is never stronger than the city allows: its levels only go down
    o.final=true; o.rank=fig.rank;
  } else {
    // a candidate that needs the highest level allowed and still is too easy has too weak a kind: the next try takes only stronger kinds
    const rng=ludusRng('cup'+n.id+':'+r), unit=ludusUnitWorth(L);
    for(let a=0;a<3;a++){
      const cand=yield* ludusCupCandidateG(rng,L,tier,target,team,unit*[0.3,0.6,0.9][a]);
      o=yield* ludusFitLevelG(cand,target,team,true,runs,cap);
      if(o.foes[0].level<cap||o.fitRate<=target+0.1) break;
    }
    o.reward=Math.round((10+6*L)*ludusPitMult()*(1+0.5*(ludus.team.length-1))*1.2); o.title=`Runde ${r+1}: ${o.title||o.name}`;
  }
  o.cup=true; o.diff='hard'; o.cityLevel=L; return o;
}
const ludusCupBout=()=>ludusDrain(ludusCupBoutG());
// the search for the foes of a cup round runs in the background (already while the result of the round before is shown) and stores the bout in the forced fight
let ludusCupJob=null;
function ludusCupSearch(fo){
  if(!fo||fo.opp||(ludusCupJob&&ludusCupJob.fo===fo)||!ludus.cup) return;
  const run=ludus, job=ludusCupJob={ fo };
  const alive=()=>ludus===run&&ludus.forced===fo&&!fo.opp&&ludus.cup;
  // a search that failed falls back on a plain bout that still counts as the round
  const fallback=()=>Object.assign(ludusQuickBout('fair',1),{ cup:true, final:ludus.cup.round===ludus.cup.rounds-1 });
  const done=o=>{ if(ludusCupJob===job) ludusCupJob=null; if(!alive()) return; fo.opp=o||fallback(); ludusSave(); if(screen==='ludus') ludusRender(); };
  const abort=()=>{ if(alive()) return false; if(ludusCupJob===job) ludusCupJob=null; return true; };
  ludusSims=0;
  ludusStepper(ludusCupBoutG(),done,abort,()=>{ const el=document.getElementById('luSearchN'); if(el) el.textContent=ludusSims; });
}
function ludusCupWon(o){
  const cup=ludus.cup, n=ludusCupNode();
  if(!o.final){ cup.round++; return ` Du kommst weiter: die nächste Runde in ${n.name} ruft morgen.`; }
  const w=ludusMapWorld(), cap=n.col===ludusMapLastCol(w), gold=40+30*n.col;
  ludus.cup=null; ludus.map.done.push(n.id); if(o.figId) (ludus.map.beaten=ludus.map.beaten||[]).push(o.figId);
  ludus.fame+=3+n.col; ludusGainRenown(Math.round((15+5*n.col)*ludusHallMult())); ludus.gold+=gold;
  ludus.giftChoice=genGiftOffer(Math.random,ludusCreature(),ludus.fame);
  let t=` ${n.name} ist erobert! +${gold} Gold.`;
  if(cap){ ludus.over=true; ludus.cause='Die Hauptstadt ist erobert: du bist Champion der Karte!'; ludusMeta.titles=(ludusMeta.titles||0)+1; ludusSaveGhost(ludus.team,'',true); ludusMeta.bestWins=Math.max(ludusMeta.bestWins,ludus.wins+1); ludusMeta.bestDays=Math.max(ludusMeta.bestDays,ludus.day); t+=' Das Land liegt dir zu Füßen.'; }
  return t;
}
function ludusMapTravel(id){
  if(ludus.over||ludus.forced||ludus.event||ludus.cup||ludus.giftChoice) return;
  if(!ludusMapNeighbours(ludus.map.at).includes(id)) return;
  const n=ludusMapWorld().nodes[id]; ludus.map.at=id;
  ludusLog(`Reise nach ${n.name}`);
  ludusAdvanceDay();
  if(n.type==='event'&&!ludus.forced&&!ludus.event){ ludusMaybeEvent(); if(!ludus.event){ const g=8+3*n.col; ludus.gold+=g; ludusNote=`Am Wegesrand liegt etwas Gold: +${g}.`; } }
  ludusSave(); ludusRender();
}
function ludusCupEnter(){
  const n=ludusCupNode(); if(ludus.over||ludus.forced||ludus.cup||!ludusCanEnter(n)) return;
  ludus.cup={ node:n.id, round:0, rounds:ludusCupRoundsFor(n) }; ludus.forced={ type:'cup' };
  ludus.team.forEach(m=>{ m.hp=undefined; m.energy=100; });
  ludusCupSearch(ludus.forced); ludusSave(); ludusRender();
}

// ---- the map on screen ----
function ludusMapDraw(){
  const cv=document.getElementById('luMapCanvas'); if(!cv) return;
  const w=ludusMapWorld(), g=cv.getContext('2d'), done=new Set(ludus.map.done), at=ludus.map.at, near=new Set(ludusMapNeighbours(at)), T=OW_TILE;
  g.drawImage(ludusMapTerrain,0,0);
  g.fillStyle='rgba(52,16,60,0.5)';
  for(let y=0;y<OW_ROWS;y++) for(let x=0;x<OW_COLS;x++){ if(w.terrain[y][x]==='water') continue; const nd=w.nodes[w.regionOf[y*OW_COLS+x]]; if(nd&&done.has(nd.id)&&nd.col>0) g.fillRect(x*T,y*T,T,T); }
  w.edges.forEach(e=>{ const a=w.nodes[e.a], b=w.nodes[e.b], live=e.a===at||e.b===at; g.strokeStyle=live?'#e6c36a':'rgba(70,45,25,0.85)'; g.lineWidth=live?3:2; g.setLineDash(live?[]:[5,4]); g.beginPath(); g.moveTo(a.x*T+T/2,a.y*T+T/2); g.lineTo(b.x*T+T/2,b.y*T+T/2); g.stroke(); });
  g.setLineDash([]);
  g.font='bold 11px sans-serif'; g.textAlign='center'; g.textBaseline='middle';
  w.nodes.forEach(n=>{
    const px=n.x*T+T/2, py=n.y*T+T/2, isDone=done.has(n.id);
    if(near.has(n.id)){ g.fillStyle='rgba(255,215,90,0.35)'; g.beginPath(); g.arc(px,py,17,0,Math.PI*2); g.fill(); }
    if(n.id===at){ g.strokeStyle='#7fe0ff'; g.lineWidth=2; g.beginPath(); g.arc(px,py,16,0,Math.PI*2); g.stroke(); }
    g.fillStyle='rgba(10,6,4,0.78)'; g.beginPath(); g.arc(px,py,12,0,Math.PI*2); g.fill();
    g.strokeStyle=isDone?'#8a4aa8':'#c9b98a'; g.lineWidth=1.5; g.beginPath(); g.arc(px,py,12,0,Math.PI*2); g.stroke();
    owGlyph(g,n.type,px,py,isDone);
    if(ludusIsCity(n)&&!isDone){        // the recommended level, in the colour of how the team stands against it
      const txt=String(ludusCityLevel(n.col)), tw=g.measureText(txt).width+8;
      g.fillStyle='rgba(10,6,4,0.85)'; g.fillRect(px-tw/2,py+13,tw,13); g.fillStyle=LUDUS_RISK_COLOR[ludusCityRisk(n)]; g.fillText(txt,px,py+19.5);
    }
  });
}
function ludusMapHTML(){
  const w=ludusMapWorld(), n=w.nodes[ludus.map.at], lt=LOCATION_TYPES[n.type], city=ludusIsCity(n), done=ludus.map.done.includes(n.id), busy=!!(ludus.forced||ludus.event||ludus.cup||ludus.giftChoice);
  const near=ludusMapNeighbours(n.id).map(id=>w.nodes[id]), cap=n.col===ludusMapLastCol(w);
  const tag=m=>ludusIsCity(m)&&!ludus.map.done.includes(m.id)?` · ${Tr('Stufe')} ${ludusCityLevel(m.col)}`:'';
  let info='';
  if(city&&!done){
    const L=ludusCityLevel(n.col), risk=ludusCityRisk(n), fig=ludusMapFigure(n);
    info=`<p>Empfohlene Stufe: <b>${L}</b><br>Deine Aussichten: <b style="color:${LUDUS_RISK_COLOR[risk]}">${LUDUS_RISK_LABEL[risk]}</b><br>Turnier: ${ludusCupRoundsFor(n)} Runden</p>
      <p class="luHint">Gegner abgestimmt auf: Stufe ${L} · ${LUDUS_TIER_WORD[ludusCityTier(n.col)]} Ausrüstung · Gaben: ${ludusCityGifts(n.col)}</p>
      <p class="luHint">Finalgegner: <b>${ludusEsc(fig.name)}</b>${fig.ghost?' · <i>'+(fig.ghost.members.length>1?'früheres Team':'früherer Kämpfer')+'</i>':''}</p>`;
    if(cap&&!ludusCapitalOpen()) info+=`<p class="luBane">Die Tore der Hauptstadt sind verschlossen: erobere zuerst ${LUDUS_CITY.needs} Städte (bisher ${ludusConquered()}).</p>`;
  }
  return `<div class="luPanel"><h2>Karte</h2><p class="luHint">Jede Reise kostet einen Tag. In jeder Stadt wartet ein Turnier: wer gewinnt, kommt weiter, wer verliert, fliegt raus. Im Finale steht einer der Besten der Rangliste. Wer die Hauptstadt erobert, gewinnt. Die Zahl an einer Stadt ist die empfohlene Stufe: Die Gegner richten sich nach der Stadt, nicht nach dir.</p>
    <p class="${ludusCityDrift()?'luBane':'luHint'}">${ludusCityDrift()?`Die Städte haben aufgerüstet: +${ludusCityDrift()} Stufen.`:`Die Städte rüsten auf: ab Tag ${LUDUS_CITY.driftStart} steigt ihre Stufe, danach alle ${LUDUS_CITY.driftEvery} Tage um 1.`}</p>
    <canvas id="luMapCanvas" width="${OW_COLS*OW_TILE}" height="${OW_ROWS*OW_TILE}" style="width:100%;max-width:960px;border:1px solid #5a4a30"></canvas>
    <p><b>${ludusEsc(n.name)}</b>${lt?' — '+Tr(lt.label):''}${done&&city?' · erobert':''}</p>${info}
    ${city&&!done?`<button id="luCupGo" class="menuMain" ${busy||!ludusCanEnter(n)?'disabled':''}>Turnier betreten</button>`:''}
    <div class="luOpts">${near.map(m=>`<button data-travel="${m.id}" ${busy?'disabled':''}>${ludusEsc(m.name)}${ludus.map.done.includes(m.id)?' ✓':tag(m)}</button>`).join(' ')}</div></div>`;
}
// the hall in the map mode: who waits in the finals, column by column
function ludusMapHallHTML(){
  const w=ludusMapWorld(), last=ludusMapLastCol(w), rows=[];
  for(let col=1;col<=last;col++){ const f=ludusMapFigureAt(col,[]), done=(ludus.map.beaten||[]).includes('r'+f.rank);
    rows.push(`<div class="luItem${done?' worn':''}"><span>${Tr('Stufe')} ${ludusCityLevel(col)}: ${ludusEsc(f.name)} — ${SPECIES[f.kind].label}${f.ghost?' · '+(f.ghost.members.length>1?'früheres Team':'früherer Kämpfer'):''}</span><span>${done?'✓':''}</span></div>`); }
  return rows.join('');
}
function ludusMapWire(el){
  if(ludusTab!=='map'||!ludus.map) return;
  ludusMapDraw();
  el.querySelectorAll('[data-travel]').forEach(b=>b.addEventListener('click',()=>ludusMapTravel(+b.dataset.travel)));
  const go=document.getElementById('luCupGo'); if(go) go.addEventListener('click',ludusCupEnter);
  const cv=document.getElementById('luMapCanvas');
  if(cv) cv.addEventListener('click',e=>{ const r=cv.getBoundingClientRect(), k=cv.width/r.width, x=(e.clientX-r.left)*k, y=(e.clientY-r.top)*k, w=ludusMapWorld();
    const hit=w.nodes.find(n=>Math.hypot(n.x*OW_TILE+OW_TILE/2-x,n.y*OW_TILE+OW_TILE/2-y)<16); if(hit) ludusMapTravel(hit.id); });
}
