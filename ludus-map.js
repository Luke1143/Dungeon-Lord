// Ludus map mode: a campaign-style world of cities. Each city holds a cup (several rounds, a loss throws you out, the final is against a figure of the ladder); winning conquers the city.
// State: ludus.mode==='map', ludus.map={ at, done[] }, ludus.cup={ node, round, rounds } while a cup runs. The world itself is rebuilt from the run seed (never saved).
let ludusMapCache=null, ludusMapTerrain=null;
function ludusMapWorld(){
  if(!ludusMapCache||ludusMapCache.seed!==ludus.seed){
    const prev=world, prevT=owTerrainCache;
    try{ world=buildWorld('lm'+ludus.seed); owTerrainCache=null; owRenderTerrain(); ludusMapTerrain=owTerrainCache; ludusMapCache=world; ludusMapCache.seed=ludus.seed; }
    finally{ world=prev; owTerrainCache=prevT; }
  }
  return ludusMapCache;
}
const ludusMapUnlocked=()=>!!(ludusMeta.unlockAll||ludusMeta.bestWins>=8||(ludusMeta.titles||0)>0);
const ludusMapLastCol=w=>Math.max(...w.nodes.map(n=>n.col));
function ludusMapInit(){
  const w=ludusMapWorld(), start=w.nodes.find(n=>n.col===0);
  ludus.map={ at:start.id, done:[start.id] };
}
const ludusCupNode=()=>ludusMapWorld().nodes[ludus.cup?ludus.cup.node:ludus.map.at];
const ludusCupRoundsFor=n=>2+(n.col>=4?1:0)+(n.col>=8?1:0);
function ludusMapNeighbours(id){ const w=ludusMapWorld(); return w.edges.filter(e=>e.a===id||e.b===id).map(e=>e.a===id?e.b:e.a); }
function ludusCupBout(){
  const w=ludusMapWorld(), n=ludusCupNode(), r=ludus.cup.round, last=r===ludus.cup.rounds-1, target=Math.max(0.7,0.95-0.03*n.col-0.02*r-(last?0.05:0));
  let o;
  if(last){
    const lad=ludusLadder(ludus.week), idx=Math.max(0,Math.min(9,9-Math.round(n.col*9/ludusMapLastCol(w)))), rival=lad[idx];
    o=ludusFigureBout(rival,n.col,50+25*n.col,target); o.final=true; o.rank=rival.rank;
  } else {
    o=ludusQuickBout('easy',1); o.cup=true; ludusFitLevel(o,target); o.reward=Math.round(ludusBoutReward(o,'hard')*1.3); o.title=`Runde ${r+1}: ${o.title||o.name}`;
  }
  o.cup=true; o.diff='hard'; return o;
}
function ludusCupWon(o){
  const cup=ludus.cup, n=ludusCupNode();
  if(!o.final){ cup.round++; return ` Du kommst weiter: die nächste Runde in ${n.name} ruft morgen.`; }
  const w=ludusMapWorld(), cap=n.col===ludusMapLastCol(w);
  ludus.cup=null; ludus.map.done.push(n.id); ludus.fame+=3+n.col; ludusGainRenown(Math.round((15+5*n.col)*ludusHallMult())); ludus.gold+=40+30*n.col;
  ludus.giftChoice=genGiftOffer(Math.random,ludusCreature(),ludus.fame);
  let t=` ${n.name} ist erobert! +${40+30*n.col} Gold.`;
  if(cap){ ludus.over=true; ludus.cause='Die Hauptstadt ist erobert: du bist Champion der Karte!'; ludusMeta.titles=(ludusMeta.titles||0)+1; ludusMeta.bestWins=Math.max(ludusMeta.bestWins,ludus.wins+1); ludusMeta.bestDays=Math.max(ludusMeta.bestDays,ludus.day); t+=' Das Land liegt dir zu Füßen.'; }
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
  const n=ludusCupNode(); if(ludus.over||ludus.forced||ludus.cup||ludus.map.done.includes(n.id)||n.type==='event') return;
  ludus.cup={ node:n.id, round:0, rounds:ludusCupRoundsFor(n) }; ludus.forced={ type:'cup' };
  ludus.team.forEach(m=>{ m.hp=undefined; m.energy=100; });
  ludusSave(); ludusRender();
}
function ludusMapDraw(){
  const cv=document.getElementById('luMapCanvas'); if(!cv) return;
  const w=ludusMapWorld(), g=cv.getContext('2d'), done=new Set(ludus.map.done), at=ludus.map.at, near=new Set(ludusMapNeighbours(at)), T=OW_TILE;
  g.drawImage(ludusMapTerrain,0,0);
  g.fillStyle='rgba(52,16,60,0.5)';
  for(let y=0;y<OW_ROWS;y++) for(let x=0;x<OW_COLS;x++){ if(w.terrain[y][x]==='water') continue; const nd=w.nodes[w.regionOf[y*OW_COLS+x]]; if(nd&&done.has(nd.id)&&nd.col>0) g.fillRect(x*T,y*T,T,T); }
  w.edges.forEach(e=>{ const a=w.nodes[e.a], b=w.nodes[e.b], live=e.a===at||e.b===at; g.strokeStyle=live?'#e6c36a':'rgba(70,45,25,0.85)'; g.lineWidth=live?3:2; g.setLineDash(live?[]:[5,4]); g.beginPath(); g.moveTo(a.x*T+T/2,a.y*T+T/2); g.lineTo(b.x*T+T/2,b.y*T+T/2); g.stroke(); });
  g.setLineDash([]);
  w.nodes.forEach(n=>{
    const px=n.x*T+T/2, py=n.y*T+T/2, isDone=done.has(n.id);
    if(near.has(n.id)){ g.fillStyle='rgba(255,215,90,0.35)'; g.beginPath(); g.arc(px,py,17,0,Math.PI*2); g.fill(); }
    if(n.id===at){ g.strokeStyle='#7fe0ff'; g.lineWidth=2; g.beginPath(); g.arc(px,py,16,0,Math.PI*2); g.stroke(); }
    g.fillStyle='rgba(10,6,4,0.78)'; g.beginPath(); g.arc(px,py,12,0,Math.PI*2); g.fill();
    g.strokeStyle=isDone?'#8a4aa8':'#c9b98a'; g.lineWidth=1.5; g.beginPath(); g.arc(px,py,12,0,Math.PI*2); g.stroke();
    owGlyph(g,n.type,px,py,isDone);
  });
}
function ludusMapHTML(){
  const w=ludusMapWorld(), n=w.nodes[ludus.map.at], lt=LOCATION_TYPES[n.type], isCity=n.col>0&&n.type!=='event', done=ludus.map.done.includes(n.id), busy=!!(ludus.forced||ludus.event||ludus.cup||ludus.giftChoice);
  const near=ludusMapNeighbours(n.id).map(id=>w.nodes[id]);
  return `<div class="luPanel"><h2>Karte</h2><p class="luHint">Jede Reise kostet einen Tag. In jeder Stadt wartet ein Turnier: wer gewinnt, kommt weiter, wer verliert, fliegt raus. Im Finale steht einer der Besten der Rangliste. Wer die Hauptstadt erobert, gewinnt.</p>
    <canvas id="luMapCanvas" width="${OW_COLS*OW_TILE}" height="${OW_ROWS*OW_TILE}" style="width:100%;max-width:960px;border:1px solid #5a4a30"></canvas>
    <p><b>${ludusEsc(n.name)}</b>${lt?' — '+Tr(lt.label):''}${done?' · erobert':''}${isCity&&!done?` · Turnier: ${ludusCupRoundsFor(n)} Runden`:''}</p>
    ${isCity&&!done?`<button id="luCupGo" class="menuMain" ${busy?'disabled':''}>Turnier betreten</button>`:''}
    <div class="luOpts">${near.map(m=>`<button data-travel="${m.id}" ${busy?'disabled':''}>${ludusEsc(m.name)}${ludus.map.done.includes(m.id)?' ✓':''}</button>`).join(' ')}</div></div>`;
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
