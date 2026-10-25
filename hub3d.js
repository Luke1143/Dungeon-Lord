// The Ludus as a real 3D place (Three.js, lib/three.min.js, loaded on demand). Every building is a stage of its own: the camera is bound to the selected one, swings
// over quickly when another is chosen, and nothing else is in sight (no peeking behind the scenes). An orbit around the building is allowed within narrow limits.
// Buildings that are not bought are empty building sites: the fighter walks in, and the only thing to do there is to build. Guests and the fighter are billboards
// of the game's own sprites. The Ludus screen tells this view which room to show and in which tier each one stands.
const Hub3D=(()=>{
  let T, host, renderer, post=null, scene, camera, ready=false, loading=null, running=false, last=0, sig='';
  const cam={ x:0, z:3, r:15, tx:0, tz:3, tr:15, dTheta:0, dPhi:0, theta0:0.6, phi0:0.85, idle:0 };
  const texCache=new Map(), spriteTex=new Map(), rooms={}, MAT={};
  let current='inn', previous=null, travel=0, fighter=null, fighterInfo=null;
  const DEF={
    inn:     { x:0,     z:3,    r:15, door:[0,5.5], inside:[-1.2,0.9] },
    pit:     { x:13,    z:-1,   r:19, door:[0,6.5], inside:[0,0.6] },
    forge:   { x:-12.5, z:-0.5, r:14, door:[0,4.5], inside:[0.5,1.2] },
    library: { x:-8,    z:-10,  r:14, door:[0,4.5], inside:[0,0.8] },
    hall:    { x:7,     z:-10,  r:14, door:[0,4.5], inside:[0,0.8] },
    training:{ x:0,     z:-19,  r:15, door:[0,5.2], inside:[0,0.4] },
    event:   { x:-25,   z:-8,   r:11, door:[-5,2.5], inside:[-1.6,0.6] }
  };

  function load(){
    if(window.THREE) return Promise.resolve();
    if(loading) return loading;
    return loading=new Promise((res,rej)=>{ const s=document.createElement('script'); s.src='lib/three.min.js'; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
  }
  // a small pixel texture: base colour, speckles, optional plank / stone lines
  function tex(kind,base,spec){
    const key=kind+base+spec; if(texCache.has(key)) return texCache.get(key);
    const c=document.createElement('canvas'); c.width=c.height=32; const g=c.getContext('2d'); g.fillStyle=base; g.fillRect(0,0,32,32);
    let s=7; const r=()=>{ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
    for(let i=0;i<90;i++){ g.fillStyle=spec; g.globalAlpha=0.12+r()*0.2; g.fillRect(Math.floor(r()*32),Math.floor(r()*32),1+Math.floor(r()*2),1); }
    g.globalAlpha=0.35; g.fillStyle='#000';
    if(kind==='planks'){ for(let y=0;y<32;y+=8) g.fillRect(0,y,32,1); }
    if(kind==='stone'){ for(let y=0;y<32;y+=8){ g.fillRect(0,y,32,1); for(let x=(y/8%2)*8;x<32;x+=16) g.fillRect(x,y,1,8); } }
    if(kind==='cobble'){ for(let y=0;y<32;y+=8){ g.fillRect(0,y,32,1); for(let x=(y/8%2)*5;x<32;x+=10) g.fillRect(x,y,1,8); } }
    const t=new T.CanvasTexture(c); t.magFilter=T.NearestFilter; t.minFilter=T.NearestFilter; t.generateMipmaps=false; t.wrapS=t.wrapT=T.RepeatWrapping; t.colorSpace=T.SRGBColorSpace;
    texCache.set(key,t); return t;
  }
  function mat(name){
    if(MAT[name]) return MAT[name];
    const defs={ wood:['planks','#8a5a34','#3a2312'], darkwood:['planks','#5a3820','#2a1608'], stone:['stone','#8d949c','#3a3f46'], darkstone:['stone','#575e66','#22252a'], sand:['plain','#c9ac7a','#8a7248'], cobble:['cobble','#6f6a63','#2c2a27'], cloth:['plain','#a02a2a','#601414'], gold:['plain','#d4af37','#8a6d12'], book:['plain','#5a3a6a','#2a1a35'], dirt:['plain','#4a3a28','#2a2014'], straw:['plain','#b89a4a','#7a6428'] };
    const d=defs[name]; return MAT[name]=new T.MeshLambertMaterial({ map:tex(d[0],d[1],d[2]) });
  }
  const flat=(color,emissive)=>new T.MeshLambertMaterial({ color, emissive:emissive||0x000000 });
  function box(w,h,d,m,x,y,z,parent){ const o=new T.Mesh(new T.BoxGeometry(w,h,d),typeof m==='string'?mat(m):m); o.position.set(x,y+h/2,z); parent.add(o); return o; }
  function cyl(rt,rb,h,seg,m,x,y,z,parent){ const o=new T.Mesh(new T.CylinderGeometry(rt,rb,h,seg),typeof m==='string'?mat(m):m); o.position.set(x,y+h/2,z); parent.add(o); return o; }
  function light(parent,x,y,z,color,intensity,dist){ const l=new T.PointLight(color,intensity,dist); l.position.set(x,y,z); l.userData.base=intensity; parent.add(l); parent.userData.lights.push(l); return l; }
  function wall(x0,z0,x1,z1,h,m,parent){ const dx=x1-x0, dz=z1-z0, len=Math.hypot(dx,dz), o=box(len,h,0.3,m,(x0+x1)/2,0,(z0+z1)/2,parent); o.rotation.y=-Math.atan2(dz,dx); return o; }
  // the ground a stage stands on: it ends a little beyond the building, the rest is darkness
  function pad(g,w,d){ box(w+5,0.2,d+5,'cobble',0,-0.2,0,g); }

  // ---- the buildings (tier t = 1..): the same footprint grows richer; local coordinates around the room's centre ----
  function buildTavern(g,t){
    const W=10, D=8; pad(g,W,D);
    box(W,0.1,D,'wood',0,0,0,g);
    const wm=t>=2?'stone':'wood', wh=t>=2?2.6:2.2;
    wall(-W/2,-D/2,W/2,-D/2,wh,wm,g); wall(-W/2,-D/2,-W/2,D/2,wh,wm,g); wall(W/2,-D/2,W/2,D/2-3,wh,wm,g);
    if(t>=2){ [-4,0,4].forEach(bx=>box(0.3,2.6,0.3,'darkwood',bx,0,-D/2+0.2,g)); }
    box(4.2,1.1,0.9,'darkwood',2.6,0,-D/2+1.2,g); box(4.4,0.12,1.1,'wood',2.6,1.1,-D/2+1.2,g);
    [[-2.5,1],[-2.5,-1.8],[1,2.2]].forEach(([tx,tz])=>{ cyl(0.7,0.7,0.8,10,'wood',tx,0,tz,g); [[-1,0],[1,0],[0,-1],[0,1]].forEach(([sx,sz])=>cyl(0.22,0.22,0.45,6,'darkwood',tx+sx*1.0,0,tz+sz*1.0,g)); });
    box(2,0.6,1.1,'darkwood',-W/2+1.3,0,D/2-1.2,g); box(2,0.3,1.1,'cloth',-W/2+1.3,0.6,D/2-1.2,g);
    box(1.6,1.6,0.8,'darkstone',-W/2+0.6,0,-1,g); box(0.9,0.12,0.5,flat(0xff7a20,0xff5a10),-W/2+0.7,0.1,-1,g);
    light(g,-W/2+1.2,1.0,-1,0xff8a30,1.6,10);
    cyl(0.4,0.4,0.9,8,'darkwood',W/2-0.7,0,-D/2+0.7,g); cyl(0.4,0.4,0.9,8,'darkwood',W/2-0.7,0,-D/2+1.7,g);
    if(t>=2){ [-2,2].forEach(lx=>box(0.25,0.35,0.25,flat(0xffcc66,0xffaa33),lx,2.0,0.5,g)); light(g,0,2.1,0.5,0xffcc66,0.9,9); box(3,0.04,2,'cloth',-0.5,0.1,0.2,g); }
    if(t>=3){ [-3.5,3.5].forEach(bx=>box(0.1,1.4,0.9,'cloth',bx,0.9,-D/2+0.2,g)); box(0.6,0.5,0.6,'gold',0,2.1,0.5,g); }
    spawnGuests(g,t);
  }
  function buildPit(g,t){
    pad(g,10,10); cyl(4.6,4.6,0.06,28,'sand',0,0,0,g);
    const posts=t>=2?24:14;
    for(let i=0;i<posts;i++){ const a=i/posts*Math.PI*2; if(t>=2 && i===0) continue; cyl(0.12,0.12,t>=2?1.3:0.9,5,t>=2?'stone':'darkwood',Math.cos(a)*4.6,0,Math.sin(a)*4.6,g); }
    if(t>=2){ for(let i=1;i<24;i++){ const a=(i+0.5)/24*Math.PI*2; box(1.25,0.9,0.3,'stone',Math.cos(a)*4.6,0,Math.sin(a)*4.6,g).rotation.y=-a-Math.PI/2; } box(0.3,2,0.3,'darkwood',4.6,0,0.9,g); box(0.3,2,0.3,'darkwood',4.6,0,-0.9,g); box(0.5,0.3,2.1,'darkwood',4.6,2,0,g); }
    if(t>=3){ for(let i=0;i<5;i++){ const a=Math.PI*0.65+i*0.3; box(1.4,0.5,0.8,'wood',Math.cos(a)*6.2,0,Math.sin(a)*6.2,g).rotation.y=-a-Math.PI/2; box(1.4,1.1,0.8,'wood',Math.cos(a)*6.9,0,Math.sin(a)*6.9,g).rotation.y=-a-Math.PI/2; }
      [-1,1].forEach(s=>{ box(0.15,2.2,0.15,'darkwood',-4.9,0,s*2.4,g); box(0.3,0.3,0.3,flat(0xff7a20,0xff5a10),-4.9,2.2,s*2.4,g); }); light(g,-4.9,2.4,0,0xff8a30,1.2,9); }
    box(1.6,0.9,0.5,'darkwood',-1.8,0,2.0,g); box(0.2,1.4,0.2,'darkwood',1.5,0,-1.5,g);
  }
  function buildForge(g,t){
    pad(g,7,6); box(7,0.08,6,'darkstone',0,0,0,g);
    if(t>=3){ wall(-3.5,-3,3.5,-3,2.6,'stone',g); wall(-3.5,-3,-3.5,3,2.6,'stone',g); wall(3.5,-3,3.5,1,2.6,'stone',g); }
    else { [[-3.3,-2.8],[3.3,-2.8],[-3.3,2.8],[3.3,2.8]].forEach(([px,pz])=>box(0.25,2.3,0.25,'darkwood',px,0,pz,g)); box(7.2,0.15,6.2,'wood',0,2.3,0,g); }
    box(2,1.6,1.4,'darkstone',-1.8,0,-2.0,g); box(1.2,0.1,0.7,flat(0xff6a10,0xff4a00),-1.8,1.6,-2.0,g); box(0.8,2.6,0.8,'darkstone',-1.8,1.6,-2.4,g); light(g,-1.8,1.9,-2,0xff6a20,1.8,9);
    box(1,0.7,0.6,'darkstone',1.2,0,0,g); box(1.2,0.15,0.7,'darkstone',1.2,0.7,0,g);
    if(t>=2){ box(2,1.6,0.4,'darkwood',2.6,0,-2.6,g); [0,1,2].forEach(i=>box(0.08,0.9,0.08,'stone',1.9+i*0.5,0.5,-2.4,g)); box(0.8,0.5,0.6,'darkstone',-0.2,0,1.8,g); }
    if(t>=3){ box(1,0.7,0.6,'darkstone',-1.5,0,0.5,g); box(1.3,0.15,0.7,'darkstone',-1.5,0.7,0.5,g); }
  }
  function buildLibrary(g,t){
    pad(g,7,6); box(7,0.08,6,'wood',0,0,0,g); const wm=t>=2?'stone':'wood';
    wall(-3.5,-3,3.5,-3,2.6,wm,g); wall(-3.5,-3,-3.5,3,2.6,wm,g);
    const shelves=t===1?2:(t===2?4:6);
    for(let i=0;i<shelves;i++){ const sx=-2.6+i%3*2.2, sz=i<3?-2.5:-0.4; if(i<3||t>=2){ box(1.8,t>=3?2.2:1.7,0.5,'darkwood',sx,0,sz,g); for(let k=0;k<(t>=3?4:3);k++) box(1.6,0.28,0.4,'book',sx,0.2+k*0.5,sz+0.05,g); } }
    box(1.6,0.8,0.9,'darkwood',1.6,0,1.6,g); box(0.5,0.05,0.4,flat(0xe8e0c0),1.6,0.8,1.6,g);
    if(t>=2){ box(0.15,0.4,0.15,flat(0xffe0a0,0xffcc66),1.2,0.8,1.6,g); light(g,1.2,1.3,1.6,0xffd890,0.9,8); }
    if(t>=3){ const gl=new T.Mesh(new T.SphereGeometry(0.45,10,8),mat('gold')); gl.position.set(-2.3,1.4,1.8); g.add(gl); cyl(0.1,0.3,0.9,6,'darkwood',-2.3,0,1.8,g); box(3,0.04,2,'cloth',0,0.1,1.2,g); }
  }
  function buildHall(g,t){
    pad(g,7,6); box(7,0.1,6,'stone',0,0,0,g); box(2.6,0.5,1.8,'stone',0,0.1,-1.5,g); box(1.6,0.5,1.2,'gold',0,0.6,-1.5,g);
    [-3.2,3.2].forEach(bx=>{ box(0.25,3,0.25,'darkwood',bx,0,-2.6,g); box(1.1,1.8,0.1,'cloth',bx,1.0,-2.5,g); });
    box(2.4,1.4,0.15,'darkwood',2.2,0.6,1.5,g);
    if(t>=2){ [-3.2,3.2].forEach(bx=>cyl(0.3,0.3,2.8,10,'stone',bx,0,2.4,g)); box(7,0.4,0.6,'stone',0,2.8,2.4,g); box(0.5,0.5,0.5,'gold',0,3.2,2.4,g); }
  }
  function buildTraining(g,t){
    pad(g,8,7); box(8,0.06,7,'sand',0,0,0,g);
    const dummies=t===1?2:(t===2?3:4);
    for(let i=0;i<dummies;i++){ const x=-2.4+i*(4.8/Math.max(1,dummies-1)); cyl(0.12,0.12,1.4,5,'darkwood',x,0,-2,g); box(0.8,0.2,0.2,'darkwood',x,1.0,-2,g); const h=new T.Mesh(new T.SphereGeometry(0.28,8,6),mat('straw')); h.position.set(x,1.6,-2); g.add(h); box(0.5,0.6,0.3,'straw',x,0.7,-2,g); }
    box(2.2,1.1,0.5,'darkwood',3.0,0,1.8,g); [0,1,2,3].forEach(i=>box(0.08,0.9,0.08,'stone',2.3+i*0.45,0.7,1.8,g));
    if(t>=2){ [-3.8,3.8].forEach(px=>{ box(0.2,2,0.2,'darkwood',px,0,-3,g); box(0.3,0.3,0.3,flat(0xff7a20,0xff5a10),px,2,-3,g); }); light(g,-3.8,2.2,-3,0xff8a30,1,8); box(1.2,0.4,1.2,'stone',-2.8,0,1.8,g); }
    if(t>=3){ box(8,0.6,0.3,'stone',0,0,3.4,g); box(0.3,0.6,7,'stone',-4,0,0,g); box(0.3,0.6,7,'stone',4,0,0,g); box(2,1.4,0.15,'cloth',0,1,-3.4,g); }
  }
  // the street scene where the events happen: a lantern, crates, a wall; the fighter stands on the left, the others come to the right
  function buildAlley(g){
    pad(g,11,8); box(11,0.08,8,'cobble',0,0,0,g);
    wall(-5.5,-3.8,5.5,-3.8,3.2,'darkstone',g); wall(5.5,-3.8,5.5,2.5,3.2,'stone',g);
    box(1.4,1.6,0.15,flat(0x1a1410),-1.2,0.9,-3.6,g); box(1.1,0.1,0.3,'darkwood',-1.2,0.7,-3.5,g);
    box(1.1,1.0,1.1,'wood',-4.4,0,-2.6,g); box(0.9,0.8,0.9,'wood',-3.5,0,-3.0,g); box(0.8,0.7,0.8,'darkwood',-4.2,1.0,-2.7,g);
    cyl(0.5,0.5,0.9,8,'darkwood',4.2,0,-2.8,g);
    box(0.15,2.6,0.15,'darkwood',0.4,0,-3.2,g); box(0.5,0.5,0.5,flat(0xffcc66,0xffaa33),0.4,2.6,-3.2,g); light(g,0.4,2.7,-3,0xffcc66,1.4,12);
    g.userData.cast=[]; g.userData.castKey='';
  }
  // an unbought room: a bare plot with stakes and a rope, nothing inside
  function buildSite(g,w,d){
    pad(g,w,d); box(w,0.05,d,'dirt',0,0,0,g);
    [[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]].forEach(([px,pz])=>box(0.18,1.0,0.18,'darkwood',px,0,pz,g));
    [[-w/2,d/2,w/2,d/2],[-w/2,-d/2,w/2,-d/2],[-w/2,-d/2,-w/2,d/2],[w/2,-d/2,w/2,d/2]].forEach(([a,b,c,e])=>{ wall(a,b,c,e,0.05,flat(0xc8a96a),g).position.y=0.9; });
    box(0.8,0.5,0.8,'darkwood',-w/4,0,-d/4,g); box(1.2,0.3,0.6,'wood',w/4,0,d/4,g);
  }
  const BUILD={ event:buildAlley, inn:buildTavern, pit:buildPit, forge:buildForge, library:buildLibrary, hall:buildHall, training:buildTraining };
  const SITE={ event:[10,8], inn:[10,8], pit:[9,9], forge:[7,6], library:[7,6], hall:[7,6], training:[8,7] };

  // ---- people ----
  function actorTex(kind,facingRight,frame,extra){
    const key=kind+'|'+(facingRight?1:0)+'|'+frame+'|'+JSON.stringify(extra||null);
    if(spriteTex.has(key)) return spriteTex.get(key);
    const cv=spriteCanvas(kind,frame,facingRight,true,extra), t=new T.CanvasTexture(cv); t.magFilter=T.NearestFilter; t.minFilter=T.NearestFilter; t.generateMipmaps=false; t.colorSpace=T.SRGBColorSpace;
    spriteTex.set(key,t); return t;
  }
  function makeActor(kind,x,z,scale,extra){
    const s=new T.Sprite(new T.SpriteMaterial({ map:actorTex(kind,false,0,extra), transparent:true, alphaTest:0.05 })); s.center.set(0.5,0.12); s.scale.set(1.5*scale,1.5*scale,1); s.position.set(x,0,z);
    s.userData={ kind, extra, x, z, tx:x, tz:z, wait:Math.random()*2, right:false, phase:Math.random()*10 }; return s;
  }
  const GUEST_KINDS=['goblin','ork','skeleton','dwarf','barbarian','thief','troll','darkelf'];
  function spawnGuests(g,tier){
    g.userData.guests=[]; g.userData.guestKey='';
    // without a world the tavern fills with strangers; the Ludus normally sends its characters through setGuests()
    const kinds=GUEST_KINDS.filter(k=>typeof ZOO!=='undefined'&&ZOO[k]), n=2+Math.min(4,tier);
    for(let i=0;i<n;i++){ const k=kinds[Math.floor(Math.random()*kinds.length)], s=makeActor(k,-3+Math.random()*7,-2+Math.random()*4.5,k==='troll'?1.15:0.9); g.add(s); g.userData.guests.push(s); }
  }
  function setGuests(list){
    const g=rooms.inn&&rooms.inn.group; if(!g||!g.userData.guests||!list||!list.length) return;
    const key=JSON.stringify(list.map(x=>[x.kind,x.sig])); if(g.userData.guestKey===key) return; g.userData.guestKey=key;
    g.userData.guests.forEach(s=>g.remove(s)); g.userData.guests=[];
    list.forEach(x=>{ const s=makeActor(x.kind,-3+Math.random()*7,-2+Math.random()*4.5,x.kind==='troll'?1.15:0.9,x.extra); g.add(s); g.userData.guests.push(s); });
  }
  // the others of an event scene: they stand to the right of the fighter and, when the scene is over and they `exit`, walk off
  const CAST_POS=[[2.2,0.3],[3.6,1.5],[3.4,-1.2]];
  function setCast(list){
    const g=rooms.event&&rooms.event.group; if(!g||!g.userData.cast) return;
    list=list||[]; const key=JSON.stringify(list.map(x=>[x.kind,x.sig]));
    if(g.userData.castKey!==key){
      g.userData.cast.forEach(s=>g.remove(s)); g.userData.cast=[]; g.userData.castKey=key;
      list.slice(0,3).forEach((x,i)=>{ const s=makeActor(x.kind,CAST_POS[i][0],CAST_POS[i][1],x.kind==='troll'?1.15:0.95,x.extra); s.userData.right=false; g.add(s); g.userData.cast.push(s); });
    }
    const out=list.some(x=>x.exit);
    g.userData.cast.forEach(s=>{ if(out&&!s.userData.leaving){ s.userData.leaving=true; s.userData.tx=s.userData.x+12; s.userData.tz=s.userData.z+0.5; } });
  }
  function walk(s,dt,t,speed){
    const u=s.userData, dx=u.tx-u.x, dz=u.tz-u.z, d=Math.hypot(dx,dz); let moving=false;
    if(d>0.05){ const st=Math.min(d,speed*dt); u.x+=dx/d*st; u.z+=dz/d*st; if(Math.abs(dx)>0.05) u.right=dx>0; moving=true; }
    s.material.map=actorTex(u.kind,u.right,moving?Math.floor(t*6+u.phase)%4:Math.floor(t*1.6+u.phase)%2,u.extra);
    s.position.set(u.x,0.02+(moving?Math.abs(Math.sin(t*9+u.phase))*0.05:0),u.z); return moving;
  }
  function stepActors(dt,t){
    const inn=rooms.inn;
    if(inn&&inn.group.visible&&inn.group.userData.guests) inn.group.userData.guests.forEach(s=>{ const u=s.userData; if(Math.hypot(u.tx-u.x,u.tz-u.z)<0.1){ u.wait-=dt; if(u.wait<=0){ u.tx=-4+Math.random()*8; u.tz=-2.5+Math.random()*5.5; u.wait=1+Math.random()*3; } } walk(s,dt,t,0.7); });
    const ev=rooms.event; if(ev&&ev.group.visible&&ev.group.userData.cast) ev.group.userData.cast.forEach(s=>walk(s,dt,t,s.userData.leaving?2.4:1));
    if(fighter){
      const u=fighter.userData, now=performance.now()/1000;
      if(u.enterAt && now>=u.enterAt){ u.tx=u.goalX; u.tz=u.goalZ; u.enterAt=0; }       // after the camera has swung over, he steps inside
      walk(fighter,dt,t,2.4); if(u.ring) u.ring.position.set(u.x,0.03,u.z);
    }
  }

  // ---- the scene ----
  async function init(hostEl){
    host=hostEl; await load(); T=window.THREE;
    renderer=new T.WebGLRenderer({ antialias:false, alpha:false }); renderer.domElement.style.cssText='width:100%;height:100%;display:block;cursor:grab';
    host.appendChild(renderer.domElement);
    scene=new T.Scene(); scene.background=new T.Color(0x0c0907); scene.fog=new T.Fog(0x0c0907,22,48);
    camera=new T.PerspectiveCamera(42,1,0.1,120);
    scene.add(new T.AmbientLight(0xb8aec0,1.35)); const sun=new T.DirectionalLight(0xffe2b8,0.85); sun.position.set(-8,16,10); scene.add(sun);
    // the orbit is narrow: drag turns the view a little around the room, the wheel nudges the distance; nothing else moves the camera
    const el=renderer.domElement; let drag=null;
    el.addEventListener('pointerdown',e=>{ drag={ x:e.clientX, y:e.clientY }; el.setPointerCapture(e.pointerId); el.style.cursor='grabbing'; cam.idle=0; });
    el.addEventListener('pointermove',e=>{ if(!drag) return; const dx=e.clientX-drag.x, dy=e.clientY-drag.y; drag.x=e.clientX; drag.y=e.clientY; cam.dTheta=Math.max(-1.1,Math.min(1.1,cam.dTheta-dx*0.006)); cam.dPhi=Math.max(-0.3,Math.min(0.35,cam.dPhi-dy*0.004)); cam.idle=0; });
    el.addEventListener('pointerup',()=>{ drag=null; el.style.cursor='grab'; });
    el.addEventListener('wheel',e=>{ e.preventDefault(); const base=(DEF[current]||DEF.inn).r; cam.tr=Math.max(base*0.75,Math.min(base*1.2,cam.tr*(1+Math.sign(e.deltaY)*0.06))); cam.idle=0; },{ passive:false });
    Object.keys(DEF).forEach(id=>{ const g=new T.Group(); g.position.set(DEF[id].x,0,DEF[id].z); g.userData={ lights:[], tier:-1 }; g.visible=false; scene.add(g); rooms[id]={ group:g }; });
    post=createPostFX(T); ready=true; resize(); window.addEventListener('resize',resize);
    return true;
  }
  function resize(){
    if(!ready||!host) return; const w=host.clientWidth||600, h=host.clientHeight||360;
    renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1)); renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); if(post) post.resize(w,h,Math.min(1.5,window.devicePixelRatio||1));
  }
  // tiers = { inn, pit, forge, library, hall, training }, 0 = not bought; the fighter is { kind, extra, sig } or null
  function sync(tiers,fighterIn,castIn,guestsIn){
    if(!ready) return;
    Object.keys(DEF).forEach(id=>{
      const r=rooms[id], t=tiers[id]||0, g=r.group; if(g.userData.tier===t) return;
      while(g.children.length) g.remove(g.children[0]); g.userData.lights.length=0; g.userData.guests=null; g.userData.tier=t;
      if(t>0) BUILD[id](g,t); else buildSite(g,SITE[id][0],SITE[id][1]);
    });
    setCast(castIn); setGuests(guestsIn);
    const key=fighterIn?JSON.stringify([fighterIn.kind,fighterIn.sig]):'';
    if(key!==sig){ sig=key; setFighter(fighterIn); }
    if(!rooms[current].group.visible) focus(current,true);
  }
  function setFighter(info){
    if(fighter){ scene.remove(fighter); if(fighter.userData.ring) scene.remove(fighter.userData.ring); fighter=null; }
    fighterInfo=info; if(!info) return;
    fighter=makeActor(info.kind,0,0,1.15,info.extra); fighter.userData.fighter=true; scene.add(fighter);
    const ring=new T.Mesh(new T.RingGeometry(0.35,0.5,20),new T.MeshBasicMaterial({ color:0xe63c32, transparent:true, opacity:0.7, side:T.DoubleSide })); ring.rotation.x=-Math.PI/2; scene.add(ring); fighter.userData.ring=ring;
    placeFighter(current,true);
  }
  // the fighter stands at the door, the camera swings over, and a moment later he walks into the room
  function placeFighter(id,instant){
    if(!fighter) return; const d=DEF[id], u=fighter.userData;
    u.goalX=d.x+d.inside[0]; u.goalZ=d.z+d.inside[1];
    if(instant){ u.x=u.tx=u.goalX; u.z=u.tz=u.goalZ; u.enterAt=0; return; }
    u.x=u.tx=d.x+d.door[0]; u.z=u.tz=d.z+d.door[1]; u.enterAt=performance.now()/1000+0.55; u.right=false;
  }
  function focus(id,instant){
    if(!ready||!DEF[id]) return;
    const same=id===current && rooms[id].group.visible; if(same&&!instant) return;
    if(!same&&!instant){ previous=current; travel=0.7; }
    current=id; Object.keys(rooms).forEach(k=>{ rooms[k].group.visible=(k===current)||(travel>0&&k===previous); });
    cam.tx=DEF[id].x; cam.tz=DEF[id].z; cam.tr=DEF[id].r; cam.dTheta=0; cam.dPhi=0; cam.idle=0;
    if(instant){ cam.x=cam.tx; cam.z=cam.tz; cam.r=cam.tr; travel=0; }
    placeFighter(id,instant);
  }
  function frame(now){
    if(!running) return; requestAnimationFrame(frame);
    const dt=Math.min(0.1,(now-last)/1000||0.016); last=now; const t=now/1000;
    const sc=document.getElementById('ludusScreen'); if(!sc||sc.hidden||!ready) return;
    const k=1-Math.exp(-dt*6.5); cam.x+=(cam.tx-cam.x)*k; cam.z+=(cam.tz-cam.z)*k; cam.r+=(cam.tr-cam.r)*k;
    if(travel>0){ travel-=dt; if(travel<=0){ travel=0; Object.keys(rooms).forEach(id=>{ rooms[id].group.visible=(id===current); }); } }
    cam.idle+=dt; const sway=cam.idle>3?Math.sin(t*0.12)*0.25:0;
    const th=cam.theta0+cam.dTheta+sway, ph=cam.phi0+cam.dPhi;
    camera.position.set(cam.x+Math.sin(th)*Math.cos(ph)*cam.r, 0.6+Math.sin(ph)*cam.r, cam.z+Math.cos(th)*Math.cos(ph)*cam.r); camera.lookAt(cam.x,0.5,cam.z);
    Object.keys(rooms).forEach(id=>{ const g=rooms[id].group; if(g.visible) g.userData.lights.forEach((l,i)=>{ l.intensity=l.userData.base*(0.85+0.2*Math.sin(t*9+i*3)+0.08*Math.sin(t*23+i)); }); });
    stepActors(dt,t);
    if(!(post&&post.render(renderer,scene,camera))) renderer.render(scene,camera);
  }
  function setPost(n){ if(post) post.setLevel(n); }
  function start(){ if(running||!ready) return; running=true; last=performance.now(); requestAnimationFrame(frame); resize(); }
  function stop(){ running=false; }
  return { init, sync, focus, start, stop, resize, setPost, get ready(){ return ready; }, get current(){ return current; } };
})();
