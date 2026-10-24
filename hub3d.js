// The Ludus as a real 3D place (Three.js, lib/three.min.js, loaded on demand): an orbit camera around a courtyard whose buildings are the meta progress.
// Only the tavern stands at first; the pit, forge, library and tournament hall appear as building sites and grow tier by tier once they are bought.
// Guests and the fighter of the run are billboards (the game's own sprites). Clicking a building tells the Ludus screen which tab to open.
const Hub3D=(()=>{
  let T, host, renderer, scene, camera, world, actors, ready=false, loading=null, running=false, sig='', last=0;
  const cam={ theta:0.9, phi:0.85, r:32, tx:0, ty:0.4, tz:-2, idle:0 };
  const texCache=new Map(), spriteTex=new Map(), picks=[], guests=[], lights=[];
  let fighterSprite=null, fighterInfo=null, hover=null, labelSprites=[];
  let onPick=null;

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
  const MAT={};
  function mat(name){
    if(MAT[name]) return MAT[name];
    const defs={ wood:['planks','#8a5a34','#3a2312'], darkwood:['planks','#5a3820','#2a1608'], stone:['stone','#8d949c','#3a3f46'], darkstone:['stone','#575e66','#22252a'], sand:['plain','#c9ac7a','#8a7248'], cobble:['cobble','#6f6a63','#2c2a27'], grass:['plain','#4b5d32','#2c3a1c'], cloth:['plain','#a02a2a','#601414'], gold:['plain','#d4af37','#8a6d12'], book:['plain','#5a3a6a','#2a1a35'] };
    const d=defs[name], m=new T.MeshLambertMaterial({ map:tex(d[0],d[1],d[2]) }); MAT[name]=m; return m;
  }
  const flat=(color,emissive)=>new T.MeshLambertMaterial({ color, emissive:emissive||0x000000 });
  function box(w,h,d,m,x,y,z,parent){ const o=new T.Mesh(new T.BoxGeometry(w,h,d),typeof m==='string'?mat(m):m); o.position.set(x,y+h/2,z); (parent||world).add(o); return o; }
  function cyl(rt,rb,h,seg,m,x,y,z,parent){ const o=new T.Mesh(new T.CylinderGeometry(rt,rb,h,seg),typeof m==='string'?mat(m):m); o.position.set(x,y+h/2,z); (parent||world).add(o); return o; }
  function light(x,y,z,color,intensity,dist){ if(lights.length>=7) return null; const l=new T.PointLight(color,intensity,dist); l.position.set(x,y,z); l.userData.base=intensity; world.add(l); lights.push(l); return l; }
  function label(text,x,y,z){
    const c=document.createElement('canvas'); c.width=256; c.height=48; const g=c.getContext('2d'); g.font='bold 24px Cinzel, serif'; g.textAlign='center'; g.fillStyle='rgba(20,14,10,0.75)'; g.fillRect(0,4,256,40); g.fillStyle='#f0e2c0'; g.fillText(text,128,34);
    const t=new T.CanvasTexture(c); t.magFilter=T.NearestFilter; t.minFilter=T.NearestFilter; t.generateMipmaps=false; t.colorSpace=T.SRGBColorSpace;
    const s=new T.Sprite(new T.SpriteMaterial({ map:t, transparent:true, depthTest:false })); s.position.set(x,y,z); s.scale.set(4.2,0.8,1); s.renderOrder=10; world.add(s); labelSprites.push(s); return s;
  }
  function pickBox(id,x,z,w,d,h){ const m=new T.Mesh(new T.BoxGeometry(w,h||3,d),new T.MeshBasicMaterial({ transparent:true, opacity:0, depthWrite:false })); m.position.set(x,(h||3)/2,z); m.userData.room=id; world.add(m); picks.push(m); }

  // ---- the buildings (tier t = 1..): the same footprint grows richer ----
  function wall(x0,z0,x1,z1,h,m,parent){ const dx=x1-x0, dz=z1-z0, len=Math.hypot(dx,dz), o=box(len,h,0.3,m,(x0+x1)/2,0,(z0+z1)/2,parent); o.rotation.y=-Math.atan2(dz,dx); return o; }
  function buildTavern(t,x,z){
    const W=10, D=8, g=new T.Group(); g.position.set(x,0,z); world.add(g);
    box(W,0.1,D,'wood',0,0,0,g);                                                   // floor
    const wm=t>=2?'stone':'wood';
    wall(-W/2,-D/2,W/2,-D/2,t>=2?2.6:2.2,wm,g); wall(-W/2,-D/2,-W/2,D/2,t>=2?2.6:2.2,wm,g); wall(W/2,-D/2,W/2,D/2-3,t>=2?2.6:2.2,wm,g);
    if(t>=2){ [-4,0,4].forEach(bx=>box(0.3,2.6,0.3,'darkwood',bx,0,-D/2+0.2,g)); }
    box(4.2,1.1,0.9,'darkwood',2.6,0,-D/2+1.2,g); box(4.4,0.12,1.1,'wood',2.6,1.1,-D/2+1.2,g);                // bar counter
    [[-2.5,1],[-2.5,-1.8],[1,2.2]].forEach(([tx,tz])=>{ cyl(0.7,0.7,0.8,10,'wood',tx,0,tz,g); [[-1,0],[1,0],[0,-1],[0,1]].forEach(([sx,sz])=>cyl(0.22,0.22,0.45,6,'darkwood',tx+sx*1.0,0,tz+sz*1.0,g)); });   // tables with stools
    box(2,0.6,1.1,'darkwood',-W/2+1.3,0,D/2-1.2,g); box(2,0.3,1.1,'cloth',-W/2+1.3,0.6,D/2-1.2,g);                // bed
    box(1.6,1.6,0.8,'darkstone',-W/2+0.6,0,-1,g); box(0.9,0.12,0.5,flat(0xff7a20,0xff5a10),-W/2+0.7,0.1,-1,g);   // hearth
    light(x-W/2+1.2,1.0,z-1,0xff8a30,1.6,10);
    cyl(0.4,0.4,0.9,8,'darkwood',W/2-0.7,0,-D/2+0.7,g); cyl(0.4,0.4,0.9,8,'darkwood',W/2-0.7,0,-D/2+1.7,g);       // barrels
    if(t>=2){ [-2,2].forEach(lx=>{ box(0.25,0.35,0.25,flat(0xffcc66,0xffaa33),lx,2.0,0.5,g); }); light(x,2.1,z+0.5,0xffcc66,0.9,9); box(3,0.04,2,'cloth',-0.5,0.1,0.2,g); }
    if(t>=3){ [-3.5,3.5].forEach(bx=>box(0.1,1.4,0.9,'cloth',bx,0.9,-D/2+0.2,g)); box(0.6,0.5,0.6,'gold',0,2.1,0.5,g); }
    pickBox('inn',x,z,W,D,2.4);
    label(t>=3?'★★ Taverne':(t>=2?'★ Taverne':'Taverne'),x,3.6,z-1);
  }
  function buildPit(t,x,z){
    const g=new T.Group(); g.position.set(x,0,z); world.add(g);
    cyl(4.6,4.6,0.06,28,'sand',0,0,0,g);
    const posts=t>=2?24:14;
    for(let i=0;i<posts;i++){ const a=i/posts*Math.PI*2; if(t>=2 && i===0) continue; cyl(0.12,0.12,t>=2?1.3:0.9,5,t>=2?'stone':'darkwood',Math.cos(a)*4.6,0,Math.sin(a)*4.6,g); }
    if(t>=2){ for(let i=0;i<24;i++){ const a=(i+0.5)/24*Math.PI*2; if(i===0) continue; box(1.25,0.9,0.3,'stone',Math.cos(a)*4.6,0,Math.sin(a)*4.6,g).rotation.y=-a-Math.PI/2; } box(0.3,2,0.3,'darkwood',4.6,0,0.9,g); box(0.3,2,0.3,'darkwood',4.6,0,-0.9,g); box(0.5,0.3,2.1,'darkwood',4.6,2,0,g); }
    if(t>=3){ for(let i=0;i<5;i++){ const a=Math.PI*0.65+i*0.3; box(1.4,0.5+i*0.0,0.8,'wood',Math.cos(a)*6.2,0,Math.sin(a)*6.2,g).rotation.y=-a-Math.PI/2; box(1.4,1.1,0.8,'wood',Math.cos(a)*6.9,0,Math.sin(a)*6.9,g).rotation.y=-a-Math.PI/2; }
      [-1,1].forEach(s=>{ box(0.15,2.2,0.15,'darkwood',-4.9,0,s*2.4,g); box(0.3,0.3,0.3,flat(0xff7a20,0xff5a10),-4.9,2.2,s*2.4,g); }); light(x-4.9,2.4,z,0xff8a30,1.2,9); }
    box(1.6,0.9,0.5,'darkwood',-1.8,0,2.0,g); box(0.2,1.4,0.2,'darkwood',1.5,0,-1.5,g);     // a practice dummy and a rack
    pickBox('pit',x,z,10,10,2);
    label(t>=3?'★★ Grube':(t>=2?'★ Grube':'Grube'),x,3.4,z);
  }
  function buildForge(t,x,z){
    const g=new T.Group(); g.position.set(x,0,z); world.add(g);
    box(7,0.08,6,'darkstone',0,0,0,g);
    if(t>=3){ wall(-3.5,-3,3.5,-3,2.6,'stone',g); wall(-3.5,-3,-3.5,3,2.6,'stone',g); wall(3.5,-3,3.5,1,2.6,'stone',g); }
    else { [[-3.3,-2.8],[3.3,-2.8],[-3.3,2.8],[3.3,2.8]].forEach(([px,pz])=>box(0.25,2.3,0.25,'darkwood',px,0,pz,g)); box(7.2,0.15,6.2,'wood',0,2.3,0,g); }
    box(2,1.6,1.4,'darkstone',-1.8,0,-2.0,g); box(1.2,0.1,0.7,flat(0xff6a10,0xff4a00),-1.8,1.6,-2.0,g); box(0.8,2.6,0.8,'darkstone',-1.8,1.6,-2.4,g); light(x-1.8,1.9,z-2,0xff6a20,1.8,9);
    box(1,0.7,0.6,'darkstone',1.2,0,0,g); box(1.2,0.15,0.7,'darkstone',1.2,0.7,0,g);                       // anvil
    if(t>=2){ box(2,1.6,0.4,'darkwood',2.6,0,-2.6,g); [0,1,2].forEach(i=>box(0.08,0.9,0.08,'stone',1.9+i*0.5,0.5,-2.4,g)); box(0.8,0.5,0.6,'darkstone',-0.2,0,1.8,g); }
    if(t>=3){ box(1,0.7,0.6,'darkstone',-1.5,0,0.5,g); box(1.3,0.15,0.7,'darkstone',-1.5,0.7,0.5,g); }
    pickBox('forge',x,z,7,6,2.6);
    label(['Schmiede','★ Schmiede','★★ Schmiede','★★★ Schmiede'][Math.min(3,t-1)],x,3.6,z);
  }
  function buildLibrary(t,x,z){
    const g=new T.Group(); g.position.set(x,0,z); world.add(g);
    box(7,0.08,6,'wood',0,0,0,g); const wm=t>=2?'stone':'wood';
    wall(-3.5,-3,3.5,-3,2.6,wm,g); wall(-3.5,-3,-3.5,3,2.6,wm,g);
    const shelves=t===1?2:(t===2?4:6);
    for(let i=0;i<shelves;i++){ const sx=-2.6+i%3*2.2, sz=i<3?-2.5:-0.4; if(i<3||t>=2){ box(1.8,t>=3?2.2:1.7,0.5,'darkwood',sx,0,sz,g); for(let k=0;k<(t>=3?4:3);k++) box(1.6,0.28,0.4,'book',sx,0.2+k*0.5,sz+0.05,g); } }
    box(1.6,0.8,0.9,'darkwood',1.6,0,1.6,g); box(0.5,0.05,0.4,flat(0xe8e0c0),1.6,0.8,1.6,g);
    if(t>=2){ box(0.15,0.4,0.15,flat(0xffe0a0,0xffcc66),1.2,0.8,1.6,g); light(x+1.2,1.3,z+1.6,0xffd890,0.9,8); }
    if(t>=3){ const gl=new T.Mesh(new T.SphereGeometry(0.45,10,8),mat('gold')); gl.position.set(-2.3,1.4,1.8); g.add(gl); cyl(0.1,0.3,0.9,6,'darkwood',-2.3,0,1.8,g); box(3,0.04,2,'cloth',0,0.1,1.2,g); }
    pickBox('library',x,z,7,6,2.6);
    label(['Bücherei','★ Bücherei','★★ Bücherei'][Math.min(2,t-1)],x,3.4,z);
  }
  function buildHall(t,x,z){
    const g=new T.Group(); g.position.set(x,0,z); world.add(g);
    box(7,0.1,6,'stone',0,0,0,g); box(2.6,0.5,1.8,'stone',0,0.1,-1.5,g); box(1.6,0.5,1.2,'gold',0,0.6,-1.5,g);                  // podium
    [-3.2,3.2].forEach(bx=>{ box(0.25,3,0.25,'darkwood',bx,0,-2.6,g); box(1.1,1.8,0.1,'cloth',bx,1.0,-2.5,g); });
    box(2.4,1.4,0.15,'darkwood',2.2,0.6,1.5,g);                                                    // ladder board
    if(t>=2){ [-3.2,3.2].forEach(bx=>cyl(0.3,0.3,2.8,10,'stone',bx,0,2.4,g)); box(7,0.4,0.6,'stone',0,2.8,2.4,g); box(0.5,0.5,0.5,'gold',0,3.2,2.4,g); }
    pickBox('hall',x,z,7,6,2.6);
    label(t>=2?'★ Turnierhalle':'Turnierhalle',x,3.6,z);
  }
  function buildSite(id,name,x,z,w,d){
    const g=new T.Group(); g.position.set(x,0,z); world.add(g);
    box(w,0.05,d,flat(0x4a3a28),0,0,0,g);
    [[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]].forEach(([px,pz])=>box(0.18,1.3,0.18,'darkwood',px,0,pz,g));
    wall(-w/2,d/2,w/2,d/2,0.05,flat(0xc8a96a),g).position.y=1.0; wall(-w/2,-d/2,w/2,-d/2,0.05,flat(0xc8a96a),g).position.y=1.0;
    box(1.2,0.5,0.1,'wood',0,1.0,d/2+0.2,g);
    pickBox(id,x,z,w,d,2);
    label('🔒 '+name,x,2.4,z);
  }

  // ---- people ----
  function actorTex(kind,facingRight,frame,extra){
    const key=kind+'|'+(facingRight?1:0)+'|'+frame+'|'+JSON.stringify(extra||null);
    if(spriteTex.has(key)) return spriteTex.get(key);
    const cv=spriteCanvas(kind,frame,facingRight,true,extra), t=new T.CanvasTexture(cv); t.magFilter=T.NearestFilter; t.minFilter=T.NearestFilter; t.generateMipmaps=false; t.colorSpace=T.SRGBColorSpace;
    spriteTex.set(key,t); return t;
  }
  function makeActor(kind,x,z,scale,extra){
    const s=new T.Sprite(new T.SpriteMaterial({ map:actorTex(kind,false,0,extra), transparent:true, alphaTest:0.05 })); s.center.set(0.5,0.12); s.scale.set(1.5*scale,1.5*scale,1); s.position.set(x,0,z);
    s.userData={ kind, extra, x, z, tx:x, tz:z, wait:Math.random()*2, right:false, scale, phase:Math.random()*10 }; actors.add(s); return s;
  }
  const GUEST_KINDS=['goblin','ork','skeleton','dwarf','barbarian','thief','troll','darkelf'];
  function spawnGuests(tavern){
    guests.length=0; while(actors.children.length) actors.remove(actors.children[0]); fighterSprite=null;
    if(!tavern) return;
    const n=2+Math.min(4,tavern), kinds=GUEST_KINDS.filter(k=>typeof ZOO!=='undefined'&&ZOO[k]);
    for(let i=0;i<n;i++){ const k=kinds[Math.floor(Math.random()*kinds.length)], s=makeActor(k,-3+Math.random()*7,-2+Math.random()*4.5,k==='troll'?1.15:0.9); guests.push(s); }
  }
  function setFighter(info){
    if(fighterSprite){ actors.remove(fighterSprite); fighterSprite=null; }
    fighterInfo=info; if(!info||!ready) return;
    fighterSprite=makeActor(info.kind,-1.6,0.9,1.15,info.extra); fighterSprite.userData.fighter=true; fighterSprite.userData.tx=-1.6; fighterSprite.userData.tz=0.9;
    const ring=new T.Mesh(new T.RingGeometry(0.35,0.5,20),new T.MeshBasicMaterial({ color:0xe63c32, transparent:true, opacity:0.7, side:T.DoubleSide })); ring.rotation.x=-Math.PI/2; ring.position.y=0.03; fighterSprite.userData.ring=ring; actors.add(ring);
  }
  function stepActors(dt,t){
    actors.children.forEach(s=>{
      const u=s.userData; if(!u.kind) return;
      if(u.fighter){ u.x+=(u.tx-u.x)*Math.min(1,dt*2); u.z+=(u.tz-u.z)*Math.min(1,dt*2); }
      else {
        const dx=u.tx-u.x, dz=u.tz-u.z, d=Math.hypot(dx,dz);
        if(d<0.1){ u.wait-=dt; if(u.wait<=0){ u.tx=-4+Math.random()*8; u.tz=-2.5+Math.random()*5.5; u.wait=1+Math.random()*3; } }
        else { u.x+=dx/d*0.7*dt; u.z+=dz/d*0.7*dt; if(Math.abs(dx)>0.05) u.right=dx>0; }
      }
      const moving=!u.fighter && Math.hypot(u.tx-u.x,u.tz-u.z)>0.1, frame=moving?Math.floor(t*6+u.phase)%4:Math.floor(t*1.6+u.phase)%2;
      s.material.map=actorTex(u.kind,u.right,frame,u.extra); s.position.set(TAV.x+u.x,0.02+(moving?Math.abs(Math.sin(t*9+u.phase))*0.05:0),TAV.z+u.z);
      if(u.ring) u.ring.position.set(TAV.x+u.x,0.03,TAV.z+u.z);
    });
  }
  const TAV={ x:0, z:3 };

  // ---- the scene ----
  async function init(hostEl){
    host=hostEl; await load(); T=window.THREE;
    renderer=new T.WebGLRenderer({ antialias:false, alpha:false }); renderer.domElement.style.cssText='width:100%;height:100%;display:block;cursor:grab';
    host.appendChild(renderer.domElement);
    scene=new T.Scene(); scene.background=new T.Color(0x14100c); scene.fog=new T.Fog(0x14100c,30,64);
    camera=new T.PerspectiveCamera(42,1,0.1,120);
    scene.add(new T.AmbientLight(0xb8aec0,1.35)); const sun=new T.DirectionalLight(0xffe2b8,0.85); sun.position.set(-8,16,10); scene.add(sun);
    const ground=new T.Mesh(new T.PlaneGeometry(60,50),mat('cobble')); ground.rotation.x=-Math.PI/2; ground.position.set(0,-0.01,-2); mat('cobble').map.repeat.set(30,25); scene.add(ground);
    world=new T.Group(); scene.add(world); actors=new T.Group(); scene.add(actors);
    // orbit: drag turns the camera, the wheel zooms, a click picks a building
    const el=renderer.domElement; let drag=null;
    el.addEventListener('pointerdown',e=>{ drag={ x:e.clientX, y:e.clientY, moved:0 }; el.setPointerCapture(e.pointerId); el.style.cursor='grabbing'; cam.idle=0; });
    el.addEventListener('pointermove',e=>{
      if(drag){ const dx=e.clientX-drag.x, dy=e.clientY-drag.y; drag.moved+=Math.abs(dx)+Math.abs(dy); drag.x=e.clientX; drag.y=e.clientY; cam.theta-=dx*0.006; cam.phi=Math.max(0.35,Math.min(1.45,cam.phi-dy*0.005)); cam.idle=0; }
      else hoverAt(e);
    });
    el.addEventListener('pointerup',e=>{ el.style.cursor='grab'; if(drag && drag.moved<5) pickAt(e); drag=null; });
    el.addEventListener('wheel',e=>{ e.preventDefault(); cam.r=Math.max(9,Math.min(44,cam.r*(1+Math.sign(e.deltaY)*0.08))); cam.idle=0; },{ passive:false });
    ready=true; resize();
    window.addEventListener('resize',resize);
    return true;
  }
  const ray=()=>new T.Raycaster();
  function rayAt(e){ const r=renderer.domElement.getBoundingClientRect(), rc=ray(); rc.setFromCamera(new T.Vector2(((e.clientX-r.left)/r.width)*2-1, -(((e.clientY-r.top)/r.height)*2-1)),camera); return rc; }
  function pickAt(e){
    const rc=rayAt(e); const sp=fighterSprite?rc.intersectObject(fighterSprite,false):[];
    if(sp.length && onPick){ onPick('fighter'); return; }
    const hits=rc.intersectObjects(picks,false); if(hits.length && onPick) onPick(hits[0].object.userData.room);
  }
  function hoverAt(e){ const hits=rayAt(e).intersectObjects(picks,false); renderer.domElement.style.cursor=hits.length?'pointer':'grab'; }
  function resize(){
    if(!ready||!host) return; const w=host.clientWidth||600, h=host.clientHeight||360;
    renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1)); renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
  }
  // rebuild the buildings when the meta state changes; `m` = { inn, pit, forge, library, hall (tiers) }
  function sync(m,fighter){
    if(!ready) return;
    const s=JSON.stringify([m,!!fighter]);
    if(s!==sig){
      sig=s; picks.length=0; lights.forEach(l=>l.parent&&l.parent.remove(l)); lights.length=0; labelSprites.length=0;
      while(world.children.length) world.remove(world.children[0]);
      buildTavern(Math.max(1,m.inn||1),TAV.x,TAV.z);
      m.pit?buildPit(m.pit,13,-1):buildSite('pit','Grube',13,-1,9,9);
      m.forge?buildForge(m.forge,-12.5,-0.5):buildSite('forge','Schmiede',-12.5,-0.5,7,6);
      m.library?buildLibrary(m.library,-8,-10):buildSite('library','Bücherei',-8,-10,7,6);
      m.hall?buildHall(m.hall,7,-10):buildSite('hall','Turnierhalle',7,-10,7,6);
      spawnGuests(Math.max(1,m.inn||1));
    }
    const fk=fighter?JSON.stringify([fighter.kind,fighter.sig]):''; if(fk!==(fighterInfo&&fighterInfo.key)||!fighterSprite&&fighter){ if(fighter) fighter.key=fk; setFighter(fighter); }
  }
  function frame(now){
    if(!running) return; requestAnimationFrame(frame);
    const dt=Math.min(0.1,(now-last)/1000||0.016); last=now; const t=now/1000;
    const sc=document.getElementById('ludusScreen'); if(!sc||sc.hidden||!ready) return;
    cam.idle+=dt; if(cam.idle>3) cam.theta+=dt*0.07;
    camera.position.set(cam.tx+Math.sin(cam.theta)*Math.cos(cam.phi)*cam.r, cam.ty+Math.sin(cam.phi)*cam.r, cam.tz+Math.cos(cam.theta)*Math.cos(cam.phi)*cam.r); camera.lookAt(cam.tx,cam.ty,cam.tz);
    lights.forEach((l,i)=>{ l.intensity=l.userData.base*(0.85+0.2*Math.sin(t*9+i*3)+0.08*Math.sin(t*23+i)); });
    stepActors(dt,t);
    renderer.render(scene,camera);
  }
  function start(){ if(running||!ready) return; running=true; last=performance.now(); requestAnimationFrame(frame); resize(); }
  function stop(){ running=false; }
  // a fighter given as { kind, extra (equipLook), sig } stands at the hearth; `fighterTarget` moves him
  return { init, sync, start, stop, resize, set onPick(f){ onPick=f; }, get ready(){ return ready; }, walkTo(x,z){ if(fighterSprite){ fighterSprite.userData.tx=x; fighterSprite.userData.tz=z; } } };
})();
