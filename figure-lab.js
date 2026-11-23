// Figure lab (an experiment, user November 2026): the same creature, the ork, four ways side by side on a dungeon floor under a torch,
// to see which way figures could go. Open the game with "#figuren" at the end of its address. Nothing of the game uses it.
//   1 Pixel     the sprite as the game draws it now (a billboard)
//   2 Voxel     the sprite itself, every pixel a little cube; thicker in the middle of each part (a cushion), so it is round from any side.
//               Works for every creature at once, with no new drawing.
//   3 Blocks    a hand-built model of boxes (head, jaw with tusk, belly, belt, legs; no arms: creatures have no hands), pixel textures, a walk
//   4 SVG       a hand-drawn vector ork: smooth shapes and a dark outline, crisp at any size (here as a billboard and flat at three sizes)
const FigureLab=(()=>{
  const SVG_ORK=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="32" cy="60" rx="17" ry="3" fill="rgba(0,0,0,0.35)"/>
  <g stroke="#14100c" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M21 46 q-1 9 2 12 h7 q2-6 0-12z" fill="#4e6b30"/>
    <path d="M43 46 q1 9 -2 12 h-7 q-2-6 0-12z" fill="#4e6b30"/>
    <path d="M14 34 q0-14 18-15 q18 1 18 15 q1 14-18 15 q-19-1-18-15z" fill="#5f8f3a"/>
    <path d="M22 37 q10 9 20 0 q0 8-10 9 q-10-1-10-9z" fill="#86b05a" stroke="none"/>
    <path d="M15 42 q17 6 34 0 l0 4 q-17 6-34 0z" fill="#6b4a35"/>
    <rect x="29" y="41.5" width="6" height="5" rx="1" fill="#c8a040"/>
    <path d="M22 14 q10-10 20 0 q3 6 0 10 q-10 5-20 0 q-3-4 0-10z" fill="#5f8f3a"/>
    <path d="M19 22 q13 10 26 0 q2 8-4 11 q-9 4-18 0 q-6-3-4-11z" fill="#86b05a"/>
    <path d="M22 26 l0-7 l3 0 l0 5z" fill="#f2e8d5" stroke-width="1.5"/>
    <path d="M42 26 l0-7 l-3 0 l0 5z" fill="#f2e8d5" stroke-width="1.5"/>
  </g>
  <path d="M23 14 l6 2 M41 14 l-6 2" stroke="#2a3f18" stroke-width="2.2" stroke-linecap="round"/>
  <ellipse cx="27.5" cy="18" rx="2.6" ry="2.2" fill="#ffffff"/><ellipse cx="36.5" cy="18" rx="2.6" ry="2.2" fill="#ffffff"/>
  <circle cx="28" cy="18.4" r="1.2" fill="#14100c"/><circle cx="36" cy="18.4" r="1.2" fill="#14100c"/>
  <path d="M18 30 q4 4 2 9" stroke="#3d6224" stroke-width="1.5" fill="none" stroke-linecap="round"/>
</svg>`;
  let T, renderer, scene, camera, root, running=false, t0=0, theta=0, drag=null, parts={};
  function load(){ return window.THREE?Promise.resolve():new Promise((res,rej)=>{ const s=document.createElement('script'); s.src='lib/three.min.js'; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
  const tex=(cv,smooth)=>{ const t=new T.CanvasTexture(cv); t.magFilter=smooth?T.LinearFilter:T.NearestFilter; t.minFilter=smooth?T.LinearMipmapLinearFilter:T.NearestFilter; t.generateMipmaps=!!smooth; t.colorSpace=T.SRGBColorSpace; return t; };
  // the ork's sprite frame: a 16 x 16 grid of palette letters, with the part each pixel belongs to (H head, T torso, L legs)
  function orkFrame(t,moving){
    const z=ZOO.ork, f=z.frame(t,false,moving,null), N=f.g.length;
    const tag=f.tag||f.g.map((r,y)=>r.map(()=>y<5?'H':(y<11?'T':'L')));       // without part tags: head, torso, legs by rows
    return { g:f.g.map(r=>r.slice().reverse()), tag:tag.map(r=>r.slice().reverse()), pal:z.pal };       // looking right
  }
  function spriteCv(t,moving){ const f=orkFrame(t,moving), cv=document.createElement('canvas'); cv.width=cv.height=16; const g=cv.getContext('2d');
    f.g.forEach((row,y)=>row.forEach((ch,x)=>{ if(ch==='.') return; g.fillStyle=f.pal[ch]||'#f0f'; g.fillRect(x,y,1,1); })); return cv; }
  // 1: the billboard of today
  function buildPixel(x){ const m=new T.SpriteMaterial({ map:tex(spriteCv(0,false)), transparent:true, alphaTest:0.5 }), s=new T.Sprite(m); s.center.set(0.5,0); s.scale.set(1.05,1.05,1); s.position.set(x,0,0); root.add(s); parts.pixel=s; }
  // 2: voxels from the sprite; each pixel a cube, as deep as it lies inside its part (edge 1, then 2, 3 ... at most 4 on each side), the back leg behind, the front leg ahead
  function buildVoxel(x){
    const f=orkFrame(0,false), N=16, solid=(xx,yy,tag)=>xx>=0&&yy>=0&&xx<N&&yy<N&&f.g[yy][xx]!=='.'&&f.g[yy][xx]!=='k'&&(!tag||f.tag[yy][xx]===tag);
    const cells=[]; for(let y=0;y<N;y++) for(let xx=0;xx<N;xx++){ if(!solid(xx,y)) continue; const tag=f.tag[y][xx];
      let d=1; while(d<4&&solid(xx-d,y,tag)&&solid(xx+d,y,tag)&&solid(xx,y-d,tag)&&solid(xx,y+d,tag)) d++;       // how far inside its part
      const half=tag==='L'?1:Math.min(4,d+ (tag==='T'?1:0)), zoff=tag==='L'?(xx<8?-1.5:1.5):0;
      cells.push({ x:xx, y, half, zoff, col:f.pal[f.g[y][xx]] }); }
    const total=cells.reduce((a,c)=>a+c.half*2,0), u=1/16, geo=new T.BoxGeometry(u,u,u), mat=new T.MeshLambertMaterial(), mesh=new T.InstancedMesh(geo,mat,total), m=new T.Matrix4(), col=new T.Color();
    let i=0; cells.forEach(c=>{ for(let k=-c.half;k<c.half;k++){ m.makeTranslation((c.x-7.5)*u,(15.5-c.y)*u,(k+0.5+c.zoff)*u); mesh.setMatrixAt(i,m); col.set(c.col); mesh.setColorAt(i,col); i++; } });
    const g=new T.Group(); g.add(mesh); g.position.set(x,0,0); g.scale.setScalar(1.05); root.add(g); parts.voxel=g;       // the sprite's plane faces the camera: the ork in profile, as in the sprite, with depth
  }
  // 3: boxes, Minecraft-like but without arms; a small pixel texture per colour (noise and a darker rim) so the faces read as blocks
  function blockTex(hex){ const cv=document.createElement('canvas'); cv.width=cv.height=8; const g=cv.getContext('2d'), n=parseInt(hex.slice(1),16), c={ r:(n>>16&255)/255, g:(n>>8&255)/255, b:(n&255)/255 };       // the hex as it is (sRGB), not three's linear colour
    for(let y=0;y<8;y++) for(let x=0;x<8;x++){ const n=((x*7+y*13)%5)/5*0.14-0.07, rim=(x===0||y===0||x===7||y===7)?-0.1:0; const k=1+n+rim; g.fillStyle=`rgb(${Math.min(255,c.r*255*k)|0},${Math.min(255,c.g*255*k)|0},${Math.min(255,c.b*255*k)|0})`; g.fillRect(x,y,1,1); }
    return tex(cv); }
  function buildBlocks(x){
    const P=Object.assign({ s:'#5f8f3a', S:'#86b05a', z:'#3d6224', t:'#5f8f3a', T:'#86b05a', u:'#3d6224', c:'#6b4a35', C:'#8a6446', l:'#4e6b30', L:'#6a8c42', y:'#324a20', w:'#f2e8d5', e:'#ffffff', p:'#14100c' },ZOO.ork.pal), u=1/16, g=new T.Group(), mats={};       // the sprite's colours (sprites.js), whatever its palette lacks
    const mat=hex=>mats[hex]||(mats[hex]=new T.MeshLambertMaterial({ map:blockTex(hex) }));
    const box=(w,h,d,hex,px,py,pz,parent)=>{ const o=new T.Mesh(new T.BoxGeometry(w*u,h*u,d*u),mat(hex)); o.position.set(px*u,py*u,pz*u); (parent||g).add(o); return o; };
    const hip=(px)=>{ const p=new T.Group(); p.position.set(px*u,5*u,0); g.add(p); box(3,5,3,P.l,0,-2.5,0,p); box(3.4,1,3.6,P.y,0,-4.6,0.3,p); return p; };
    const legL=hip(-2.5), legR=hip(2.5);
    const body=new T.Group(); g.add(body);
    box(10,7,7,P.t,0,8.5,0,body); box(7,4.5,1,P.T,0,8,3.6,body); box(10.4,1.4,7.4,P.c,0,5.8,0,body); box(1.6,1.2,0.6,'#c8a040',0,5.8,3.8,body);
    const head=new T.Group(); head.position.set(0,12*u,0.5*u); body.add(head);
    box(6,5,6,P.s,0,2.5,0,head); box(7,3,5,P.S,0,0.2,1.2,head);       // skull and the big jaw
    box(1,2.2,1,P.w,-2.6,2,3.8,head); box(1,2.2,1,P.w,2.6,2,3.8,head);       // tusks
    box(1.6,1.4,0.3,P.e,-1.5,3.6,3.05,head); box(1.6,1.4,0.3,P.e,1.5,3.6,3.05,head); box(0.7,0.8,0.3,P.p,-1.3,3.5,3.15,head); box(0.7,0.8,0.3,P.p,1.3,3.5,3.15,head);
    box(2,0.6,0.4,P.z,-1.5,4.6,3.05,head); box(2,0.6,0.4,P.z,1.5,4.6,3.05,head);       // brows
    g.position.set(x,0,0); g.scale.setScalar(1.05); g.rotation.y=Math.PI/4; root.add(g); parts.blocks={ g, legL, legR, body, head };       // half turned: looking right like the sprite, its face still in view
  }
  // 4: the vector ork: drawn into a big canvas (crisp), as a billboard
  async function svgCanvas(px){ const img=new Image(); img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(SVG_ORK); await img.decode(); const cv=document.createElement('canvas'); cv.width=cv.height=px; cv.getContext('2d').drawImage(img,0,0,px,px); return cv; }
  async function buildSvg(x){ const m=new T.SpriteMaterial({ map:tex(await svgCanvas(512),true), transparent:true, alphaTest:0.3 }), s=new T.Sprite(m); s.center.set(0.5,0.03); s.scale.set(1.1,1.1,1); s.position.set(x,0,0); root.add(s); parts.svg=s; }
  // the floor: dark flagstones in pixels; a torch light, a cold fill light
  function buildRoom(){
    const cv=document.createElement('canvas'); cv.width=cv.height=16; const g=cv.getContext('2d'); g.fillStyle='#4a3a30'; g.fillRect(0,0,16,16);
    for(let i=0;i<40;i++){ g.fillStyle=i%2?'#5a4838':'#3e3028'; g.fillRect((i*7)%16,(i*11)%16,2,1); } g.fillStyle='#221a14'; g.fillRect(0,0,16,1); g.fillRect(0,0,1,16);
    const t=tex(cv); t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(9,5);
    const floor=new T.Mesh(new T.PlaneGeometry(9,5),new T.MeshLambertMaterial({ map:t })); floor.rotation.x=-Math.PI/2; floor.position.set(0,0,0); scene.add(floor);
    scene.add(new T.AmbientLight(0xb0a8c0,1.5)); const sun=new T.DirectionalLight(0xffe8c8,1.3); sun.position.set(-3,6,5); scene.add(sun);
    const torch=new T.PointLight(0xff9a40,6,7,1.2); torch.position.set(0,1.6,1.6); scene.add(torch); parts.torch=torch;
  }
  function labels(){
    const bar=document.createElement('div'); bar.style.cssText='position:absolute;left:0;right:0;top:12px;display:flex;justify-content:space-around;color:#e8d9b0;font:600 15px sans-serif;pointer-events:none';
    ['Pixel (heute)','Voxel aus dem Sprite','Klötzchen (Quader)','SVG (Vektor)'].forEach(n=>{ const s=document.createElement('span'); s.textContent=n; bar.appendChild(s); });
    return bar;
  }
  function flat(){       // the vector ork flat, at three sizes, next to the pixel sprite at the same sizes
    const box=document.createElement('div'); box.style.cssText='position:absolute;left:12px;bottom:12px;display:flex;gap:18px;align-items:flex-end;background:rgba(20,16,12,0.85);padding:10px 14px;border:1px solid #6a5233;border-radius:6px;color:#e8d9b0;font:13px sans-serif';
    [32,64,128].forEach(px=>{ const c=document.createElement('div'); c.style.cssText='display:flex;flex-direction:column;align-items:center;gap:4px';
      const sp=spriteCv(0,false); sp.style.cssText=`width:${px}px;height:${px}px;image-rendering:pixelated`; const v=document.createElement('img'); v.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(SVG_ORK); v.style.cssText=`width:${px}px;height:${px}px`;
      const row=document.createElement('div'); row.style.cssText='display:flex;gap:6px;align-items:flex-end'; row.append(sp,v); const l=document.createElement('span'); l.textContent=px+' px'; c.append(row,l); box.appendChild(c); });
    return box;
  }
  async function open(){
    await load(); T=window.THREE;
    const host=document.createElement('div'); host.id='figureLab'; host.style.cssText='position:fixed;inset:0;z-index:9999;background:#0f0b09';
    const close=document.createElement('button'); close.textContent='✕'; close.style.cssText='position:absolute;right:12px;top:8px;z-index:2;font-size:18px'; close.onclick=()=>{ running=false; host.remove(); if(location.hash==='#figuren') history.replaceState(null,'',location.pathname); };
    renderer=new T.WebGLRenderer({ antialias:true }); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1)); host.appendChild(renderer.domElement); host.append(labels(),flat(),close); document.body.appendChild(host);
    scene=new T.Scene(); scene.background=new T.Color(0x0f0b09); scene.fog=new T.Fog(0x0f0b09,6,14); camera=new T.PerspectiveCamera(40,1,0.05,50); root=new T.Group(); scene.add(root);
    buildRoom(); buildPixel(-3); buildVoxel(-1); buildBlocks(1); await buildSvg(3);
    const el=renderer.domElement; el.style.cursor='grab';
    el.addEventListener('pointerdown',e=>{ drag={ x:e.clientX }; el.setPointerCapture(e.pointerId); }); el.addEventListener('pointerup',()=>{ drag=null; });
    el.addEventListener('pointermove',e=>{ if(!drag) return; theta=Math.max(-1.2,Math.min(1.2,theta-(e.clientX-drag.x)*0.004)); drag.x=e.clientX; });
    const size=()=>{ renderer.setSize(window.innerWidth,window.innerHeight); camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); }; size(); window.addEventListener('resize',size);
    running=true; t0=performance.now(); requestAnimationFrame(frame);
  }
  function frame(now){
    if(!running) return; requestAnimationFrame(frame);
    const t=(now-t0)/1000, k=Math.floor(t*6.5)%4;
    // the camera swings slowly in front of the four (drag turns it); the sprites (billboards) always face it, the 3D figures do not
    const th=theta+Math.sin(t*0.25)*0.6, ph=0.32; camera.position.set(Math.sin(th)*6.6*Math.cos(ph),Math.sin(ph)*6.6+0.4,Math.cos(th)*6.6*Math.cos(ph)); camera.lookAt(0,0.55,0);
    // walking in place: the pixel sprite and the voxel ork keep still (one frame), the blocks walk
    const b=parts.blocks; if(b){ const sw=Math.sin(t*6.5)*0.55; b.legL.rotation.x=sw; b.legR.rotation.x=-sw; b.body.position.y=Math.abs(Math.cos(t*6.5))*0.02; b.head.rotation.y=Math.sin(t*0.9)*0.35; }
    if(parts.torch) parts.torch.intensity=6+Math.sin(t*9)*0.6+Math.sin(t*23)*0.3;
    renderer.render(scene,camera);
  }
  function maybeOpen(){ if(location.hash==='#figuren') open().catch(e=>console.error(e)); }
  window.addEventListener('hashchange',maybeOpen);
  return { open, maybeOpen, SVG_ORK };
})();
window.addEventListener('load',()=>setTimeout(FigureLab.maybeOpen,300));
