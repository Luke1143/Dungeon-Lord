// The Ludus screen's dungeon: each region's dungeon is built by the campaign's generator (dungeon-gen.js) from campaign rooms and drawn by the
// campaign's own 3D view (a second instance of view3d.js) through the campaign's own draw code (draw2d's capture in index.html), so the Ludus looks
// like the campaign: the same walls, floors, torches, room props, sprites, emotes and picture effects. The gladiators are creatures standing in the
// room of what they do today and wandering about it; a click on one tells the Ludus screen who it was (onPick).
// While it draws, the hub lends its world to the shared draw code: `state`, the world size, the camera and the 3D view are swapped and put back.
const LudusHub=(()=>{
  // the Ludus rooms as campaign rooms: type (ROOM_TYPES), size by tier (1, 2, ...), or fixed; bath: a basin of water; event: the way in (a 3x3 entrance)
  const ROOMS={
    inn:     { type:'tavern',   size:[[5,4],[6,5],[7,5]] },
    pit:     { type:'arena',    size:[[6,6],[7,6],[7,7]] },
    training:{ type:'training', size:[[4,4],[5,5],[6,5]] },
    forge:   { type:'forge',    size:[[4,4],[5,4],[5,5],[6,5]] },
    library: { type:'library',  size:[[4,4],[5,4],[6,5]] },
    temple:  { type:'temple',   size:[[4,4],[5,5],[6,6]] },
    bath:    { type:null, pool:true, size:[[5,5],[6,5],[7,6]] },
    hall:    { type:'throne',   size:[[6,5],[7,6]] },
    arena:   { type:'arena',    size:[[8,7]] },
    work:    { type:'storage',  size:[[5,4]] },
    event:   { type:null, gate:true, size:[[5,5]] }
  };
  const ALWAYS=new Set(['arena','work','event']), CELL=[13,12];
  let view=null, host=null, ready=false, running=false, last=0, onPick=null, current='inn';
  let dungeon=null, world=null, planKey='', people=new Map(), cast=[], blocked=new Set();
  const cam={ x:0, y:0, rows:12, tx:0, ty:0, trows:12, yaw:0.35, tyaw:0.35, zoom:1 };

  // ---- the dungeon ----
  function sizeOf(id,tier){ const s=ROOMS[id].size; return s[Math.max(0,Math.min(s.length-1,tier-1))]; }
  function plan(tiers,seed){
    const key=seed+'|'+Object.keys(ROOMS).map(id=>id+tierOf(tiers,id)).join(',');
    if(key===planKey&&dungeon) return false; planKey=key;
    const rooms=Object.keys(ROOMS).map(id=>{ const d=ROOMS[id], t=tierOf(tiers,id), [w,h]=sizeOf(id,Math.max(1,t)); return { id, type:d.type, w, h, pool:d.pool&&t>0, site:t<=0 }; });
    dungeon=dungeonGen({ seed:'ludus:'+seed, rooms, cell:CELL, loops:3 });
    const ev=dungeon.rooms.event; for(let y=ev.y+1;y<ev.y+4;y++) for(let x=ev.x+1;x<ev.x+4;x++) dungeon.grid[y][x].room='entrance';       // the way in: guests come out of the shaft
    world=dungeonState(dungeon); world.ore=6; world.iron=3;       // the workshop's store
    world.ludusHub=true;
    people.forEach(p=>{ p.placed=false; }); cast.forEach(p=>{ p.placed=false; });
    if(view&&view.ready) view.setSize(dungeon.cols,dungeon.rows);
    return true;
  }
  function tierOf(tiers,id){ if(ALWAYS.has(id)) return 1; if(id==='hall') return Math.max(1,tiers.hall||0); return tiers[id]||0; }
  const roomTiles=id=>{ const r=dungeon&&dungeon.rooms[id]; if(!r) return []; const out=[];
    for(let y=r.y;y<r.y+r.h;y++) for(let x=r.x;x<r.x+r.w;x++){ const t=dungeon.grid[y][x]; if(t.type==='floor'&&t.room!=='entrance'&&!blocked.has(x+','+y)) out.push([x,y]); }
    return out; };
  const hashId=id=>{ let h=2166136261; for(const ch of String(id)) h=Math.imul(h^ch.charCodeAt(0),16777619); return h>>>0; };

  // ---- who stands where ----
  // people: { id, kind, c (the creature), room, own, sel, name }; a person keeps his creature while his look stays (sig)
  function setPeople(list){
    const seen=new Set();
    (list||[]).forEach(p=>{
      seen.add(p.id); let q=people.get(p.id);
      if(!q||q.sig!==p.sig||q.kind!==p.kind){ q={ id:p.id, sig:p.sig, kind:p.kind, c:p.c||arenaMake(p.kind,0,0), placed:false, wait:0 }; q.c.faction='ludus'; people.set(p.id,q); }
      if(q.room!==p.room){ q.room=p.room; q.placed=false; }
      q.own=!!p.own; q.sel=!!p.sel; q.name=p.name||'';
    });
    people.forEach((q,id)=>{ if(!seen.has(id)) people.delete(id); });
  }
  function setCast(list){
    const sig=JSON.stringify((list||[]).map(s=>[s.kind,s.sig]));
    if(sig!==setCast.sig){ setCast.sig=sig; cast=(list||[]).map((s,i)=>{ const c=s.c||arenaMake(s.kind,0,0); c.faction='ludus'; return { id:'cast'+i, kind:s.kind, c, room:'event', placed:false, wait:0 }; }); }
    const exit=(list||[]).some(s=>s.exit); cast.forEach(p=>{ p.exit=exit; });
  }
  function place(p){
    const tiles=roomTiles(p.room)||[]; if(!tiles.length){ p.hidden=true; return; }
    const taken=new Set(); people.forEach(o=>{ if(o!==p&&o.placed) taken.add(o.c.x+','+o.c.y); });
    const free=tiles.filter(([x,y])=>!taken.has(x+','+y)), pool=free.length?free:tiles, [x,y]=pool[hashId(p.id)%pool.length];
    p.c.x=x; p.c.y=y; p.c.renderX=x; p.c.renderY=y; p.tx=x; p.ty=y; p.wait=1+(hashId(p.id)%40)/10; p.step=0; p.placed=true; p.hidden=false;
  }
  // a person waits, then walks tile by tile to another free tile of his room; the guests of an event that ends go back down the shaft
  function walk(p,dt){
    if(!p.placed) place(p); if(p.hidden) return;
    const c=p.c;
    if(p.exit){ const ev=dungeon.rooms.event; p.tx=ev.x+2; p.ty=ev.y+2; if(c.x===p.tx&&c.y===p.ty){ p.hidden=true; return; } }
    if(c.x===p.tx&&c.y===p.ty){
      p.wait-=dt; if(p.wait<=0){ const tiles=roomTiles(p.room); if(tiles.length){ const [x,y]=tiles[Math.floor(Math.random()*tiles.length)]; p.tx=x; p.ty=y; } p.wait=1.5+Math.random()*4; }
    } else {
      p.step-=dt;
      if(p.step<=0){ p.step=p.exit?0.3:0.5;
        const ok=(x,y)=>{ const t=dungeon.grid[y]&&dungeon.grid[y][x]; return !!t&&(t.type==='floor')&&(p.exit||(!blocked.has(x+','+y)&&t.room!=='entrance')); };
        const sx=Math.sign(p.tx-c.x), sy=Math.sign(p.ty-c.y);
        if(sx&&ok(c.x+sx,c.y)) c.x+=sx; else if(sy&&ok(c.x,c.y+sy)) c.y+=sy; else if(sx&&!p.exit) { p.tx=c.x; p.ty=c.y; } else { if(sx) c.x+=sx; else c.y+=sy; }
      }
    }
    const k=Math.min(1,dt*(p.exit?5:3.2)); c.renderX+=(c.x-c.renderX)*k; c.renderY+=(c.y-c.renderY)*k;
  }

  // ---- drawing through the campaign's code ----
  function lend(fn){
    const keep={ state, WORLD_COLS, WORLD_ROWS, camX, camY, VIEW_COLS, VIEW_ROWS, View3D, possessed, selectedRoomTiles, dragStart, dragCurrent, roomsMemo, ctx, capture, fxP:FX.particles, fxS:FX.stains };
    state=world; WORLD_COLS=dungeon.cols; WORLD_ROWS=dungeon.rows; View3D=view; possessed=null; selectedRoomTiles=null; dragStart=null; dragCurrent=null; roomsMemo=null; FX.particles=[]; FX.stains=[];
    try{ return fn(); }
    finally{ ({ state, WORLD_COLS, WORLD_ROWS, camX, camY, VIEW_COLS, VIEW_ROWS, View3D, possessed, selectedRoomTiles, dragStart, dragCurrent, roomsMemo, ctx, capture }=keep); FX.particles=keep.fxP; FX.stains=keep.fxS; }
  }
  function draw(){
    lend(()=>{
      world.creatures=[]; people.forEach(p=>{ if(p.placed&&!p.hidden) world.creatures.push(p.c); }); cast.forEach(p=>{ if(p.placed&&!p.hidden) world.creatures.push(p.c); });
      capture=[]; ctx=dummyCtx; camX=0; camY=0; VIEW_COLS=WORLD_COLS; VIEW_ROWS=WORLD_ROWS;
      draw2d();
      const items=capture; capture=null;
      wallTorchItems().forEach(it=>items.push(it));
      const b=new Set(); items.forEach(it=>{ if(it.kind==='prop'&&Number.isInteger(it.x)&&Number.isInteger(it.y)) b.add(it.x+','+it.y); }); blocked=b;       // nobody stands in a barrel
      people.forEach(p=>{ if(p.placed&&!p.hidden&&(p.own||p.sel)) items.push({ kind:'ring', x:p.c.renderX, y:p.c.renderY, color:p.sel?'#f4d36a':'#e63c32' }); });
      view.yaw=cam.yaw; view.setFirstPerson(null); view.setFog(22,60);
      view.render(tileInfo3d, items, cam.x+0.5, cam.y+0.5, cam.rows/cam.zoom);
    });
  }
  function frame(now){
    if(!running) return; requestAnimationFrame(frame);
    const dt=Math.min(0.1,(now-last)/1000||0.016); last=now;
    const sc=document.getElementById('ludusScreen'); if(!sc||sc.hidden||!ready||!dungeon) return;
    const k=1-Math.exp(-dt*5); cam.x+=(cam.tx-cam.x)*k; cam.y+=(cam.ty-cam.y)*k; cam.rows+=(cam.trows-cam.rows)*k; cam.yaw+=(cam.tyaw-cam.yaw)*k;
    people.forEach(p=>walk(p,dt)); cast.forEach(p=>walk(p,dt));
    try{ draw(); }catch(e){ console.error(e); running=false; }
  }

  // ---- the screen ----
  async function init(hostEl){
    host=hostEl; view=makeView3D();
    await view.init(host,CELL[0]*3,CELL[1]*3,'hub3d');
    view.setActive(true);
    const el=host.querySelector('#hub3d'); el.style.cursor='grab';
    let drag=null;
    const who=e=>{ const r=el.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top; let best=null, bd=34;
      people.forEach(p=>{ if(!p.placed||p.hidden) return; const s=view.project(p.c.renderX+0.5,p.c.renderY+0.5,0.45); const d=Math.hypot(s.x-px,s.y-py); if(d<bd){ bd=d; best=p; } }); return best; };
    el.addEventListener('pointerdown',e=>{ drag={ x:e.clientX, moved:0 }; el.setPointerCapture(e.pointerId); el.style.cursor='grabbing'; });
    el.addEventListener('pointermove',e=>{
      if(!drag){ const p=who(e); el.style.cursor=p?'pointer':'grab'; el.title=p?p.name||'':''; return; }
      const dx=e.clientX-drag.x; drag.x=e.clientX; drag.moved+=Math.abs(dx); cam.tyaw=Math.max(-0.9,Math.min(1.6,cam.tyaw-dx*0.006)); });       // drag turns the view a little
    el.addEventListener('pointerup',e=>{ const click=drag&&drag.moved<6; drag=null; el.style.cursor='grab'; if(click){ const p=who(e); if(p&&onPick) onPick(p.id); } });
    el.addEventListener('wheel',e=>{ e.preventDefault(); cam.zoom=Math.max(0.75,Math.min(1.6,cam.zoom*(1-Math.sign(e.deltaY)*0.08))); },{ passive:false });
    ready=true; resize(); window.addEventListener('resize',resize);
    return true;
  }
  function resize(){ if(!ready||!host) return; view.resize(host.clientWidth||600,host.clientHeight||360,Math.min(1.5,window.devicePixelRatio||1)); }
  // tiers = { inn, pit, ... } (0 = not bought: a bare site); seed: the region's dungeon; castIn: the guests of an event; peopleIn: who stands where
  function sync(tiers,seed,castIn,peopleIn){
    if(!ready) return;
    const fresh=plan(tiers||{},seed||'start');
    setCast(castIn); setPeople(peopleIn);
    if(fresh) focus(current,true);
  }
  // the camera goes to a room, the view a little wider than the room
  function focus(id,instant){
    if(!ready||!dungeon) return;
    const r=dungeon.rooms[id]||dungeon.rooms.inn; current=dungeon.rooms[id]?id:'inn';
    cam.tx=r.cx; cam.ty=r.cy; cam.trows=Math.max(r.w,r.h)+3;
    if(instant){ cam.x=cam.tx; cam.y=cam.ty; cam.rows=cam.trows; cam.yaw=cam.tyaw; }
  }
  function start(){ if(running||!ready) return; running=true; last=performance.now(); requestAnimationFrame(frame); resize(); }
  function stop(){ running=false; }
  function setLook(o){ if(!ready) return; if(o.post!==undefined) view.setPost(o.post); if(o.relief!==undefined) view.setRelief(o.relief); if(o.mood!==undefined) view.setMood(o.mood); if(o.shadows!==undefined) view.setShadows(o.shadows); }
  return { init, sync, focus, start, stop, resize, setLook, set onPick(f){ onPick=f; }, get ready(){ return ready; }, get current(){ return current; },
    get dungeon(){ return dungeon; }, get people(){ return people; },
    // where a person stands on the screen (pixels in the host), for tests and pointers
    screenOf(id){ const p=people.get(id); if(!ready||!p||!p.placed||p.hidden) return null; return view.project(p.c.renderX+0.5,p.c.renderY+0.5,0.45); } };
})();
