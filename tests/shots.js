// Screenshots of the main views for looking at the game: menu, world map (also fully revealed), dungeon 2D/3D (far and near), toolbar and panel up close,
// arena layouts in 3D and 2D, entrance and portal, Ludus tavern and forge, options. Pictures go to tests/out/.
// Usage: NODE_PATH=$(npm root -g) node tests/shots.js [only=name,name]   (names: the file names below without .png)
const { open, shot, buildScene, startArena, finish, OUT }=require('./lib');
const ONLY=(process.argv[2]||'').split(',').filter(Boolean), want=n=>!ONLY.length||ONLY.some(o=>n.startsWith(o));
(async()=>{
  const { browser, page:p, errs }=await open({ scale:+process.env.SCALE||1 });
  const take=async(name,clip)=>{ if(want(name)) console.log('  '+await shot(p,name,clip)); };
  await take('menu');
  await p.click('#menuNew'); await p.waitForTimeout(1200); await take('worldmap',{ x:80, y:95, width:980, height:560 });
  if(want('worldmap-revealed')){ await p.evaluate(()=>{ window.__known=OW.knownTo; OW.knownTo=()=>true; owDraw(); }); await take('worldmap-revealed',{ x:80, y:95, width:980, height:560 }); await p.evaluate(()=>{ OW.knownTo=window.__known; }); }
  const cam=await p.evaluate(buildScene);
  await p.evaluate(()=>setView3d(false)); await p.waitForTimeout(1200);
  await take('dungeon-2d'); await take('toolbar',{ x:820, y:2, width:620, height:40 }); await take('panel',{ x:10, y:55, width:270, height:490 });
  await p.evaluate(()=>{ setView3d(true); for(let y=0;y<WORLD_ROWS;y++) for(let x=0;x<WORLD_COLS;x++){ const t=state.grid[y][x]; if(t.type==='rock'&&neighbors(x,y).some(([a,b])=>state.grid[b][a].type==='floor'&&state.grid[b][a].owned)) t.reinforced=true; } });
  await p.waitForTimeout(2500); await take('dungeon-3d');
  await p.evaluate(c=>{ setZoom(2.5); jumpCameraTo(c.x,c.y); },cam); await p.waitForTimeout(1500); await take('dungeon-3d-near');
  // entrance and portal, fog lifted around them
  const rooms=await p.evaluate(()=>{ const out={}; ['entrance','portal'].forEach(k=>{ const t=tilesOfRoom(k); if(t.length){ out[k]=[t[0].x,t[0].y]; t.forEach(q=>{ for(let dy=-3;dy<=3;dy++) for(let dx=-3;dx<=3;dx++){ const g=state.grid[q.y+dy]&&state.grid[q.y+dy][q.x+dx]; if(g){ g.seen=true; g.discovered=true; } } }); } }); return out; });
  for(const k of Object.keys(rooms)) for(const d3 of [false,true]){ const name=k+(d3?'-3d':'-2d'); if(!want(name)) continue;
    await p.evaluate(([d3,x,y])=>{ setView3d(d3); setZoom(2.5); jumpCameraTo(x+1,y+1); },[d3,...rooms[k]]); await p.waitForTimeout(1500); await take(name,{ x:430, y:150, width:900, height:600 }); }
  for(const lay of ['pit','ring','pillars','bridge']){ if(!want('arena-'+lay)) continue;
    await p.evaluate(lay=>{ if(state&&state.arena) arenaLeave(); },lay); await p.evaluate(startArena,lay); await p.evaluate(()=>{ setView3d(true); setZoom(1); }); await p.waitForTimeout(2500); await take('arena-'+lay); }
  if(want('arena-2d')){ await p.evaluate(()=>{ if(!(state&&state.arena)) startArena('pit'); setView3d(false); }); await p.waitForTimeout(800); await take('arena-2d'); }
  await p.evaluate(async()=>{ if(state&&state.arena) arenaLeave(); await ludusOpen(); if(!ludus||ludus.over) ludusNewRun('ork','Grom'); });
  for(const t of ['map','tour','arena','pit','inn','smith']){ await p.evaluate(t=>{ ludusTab=t; ludusRender(); },t); await p.waitForTimeout(t==='arena'||t==='pit'?6000:1200); await take('ludus-'+t); }
  if(want('options')){ await p.evaluate(()=>{ showScreen('menu'); const b=document.getElementById('menuOptions'); if(b) b.click(); }); await p.waitForTimeout(500); await take('options'); }
  finish('shots → '+OUT,errs);
  await browser.close();
})();
