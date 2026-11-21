// The forge and the smelter at work (effects included): a worker hammers at a forge station, another works bellows and anvil of a smelter.
// Checks that sparks and embers are emitted and nothing throws. Usage: NODE_PATH=$(npm root -g) node tests/work.js
const { open, buildScene, finish }=require('./lib');
(async()=>{
  const { browser, page:p, errs }=await open();
  await p.click('#menuNew'); await p.waitForTimeout(800);
  await p.evaluate(buildScene);
  const r=await p.evaluate(()=>{
    const fx={}; const emit=FX.emit; FX.emit=(t,...a)=>{ fx[t]=(fx[t]||0)+1; return emit(t,...a); };
    state.iron=50;
    const fr=activeForges()[0], sm=activeSmelters()[0]; if(!fr||!sm) return { err:'no forge or smelter in the scene' };
    const orks=state.creatures.filter(x=>x.kind==='ork'), c=orks[0], d=orks[1], st=forgeStations(fr)[0];
    c.x=st.front.x; c.y=st.front.y;
    for(let i=0;i<60;i++){ c.state='forgeWork'; c.forgeKey=forgeKey(fr); c.forgeStation=0; c.forgeType='weapon'; c.path=[]; tickForgeWork(c); }
    const ss=smelterStations(sm), S=getSmelter(sm); S.ore=5; d.x=ss.bellows.x; d.y=ss.bellows.y;
    for(let i=0;i<60;i++){ d.state='smelterWork'; d.smelterKey=smelterKey(sm); d.smelterStation='bellows'; d.path=[]; tickSmelterWork(d,1); }
    d.x=ss.anvil.x; d.y=ss.anvil.y;
    for(let i=0;i<60;i++){ if(!S.bloom) S.bloom={ heat:999, hits:0, count:1 }; d.state='smelterWork'; d.smelterKey=smelterKey(sm); d.smelterStation='anvil'; d.path=[]; tickSmelterWork(d,1); }
    // digging: chips and dust on the hit wall face
    const imp=state.imps&&state.imps[0]; if(imp){ for(let y=1;y<WORLD_ROWS-1;y++) for(let x=1;x<WORLD_COLS-1;x++){ const t=state.grid[y][x]; if(t.type==='rock'&&!t.gold&&state.grid[y+1][x].type==='floor'){ t.marked=true; imp.x=x; imp.y=y+1; for(let i=0;i<40;i++) interact(imp,x,y); return { fx }; } } }
    return { fx };
  });
  const fx=r.fx||{};
  finish('work (forge, smelter, digging)',errs,r.err||((fx.sparks>0&&fx.embers>0&&fx.chip>0)?'':'effects missing: '+JSON.stringify(fx)));
  await browser.close();
})();
