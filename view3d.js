// 3D view for the level: block terrain with pixel textures, sprites as billboards (Three.js, lib/three.min.js, loaded on demand).
// The game keeps its 2D logic; index.html feeds this view with the terrain (tileInfo) and a list of things to draw ("capture" of the 2D draw calls).
// Input stays on the 2D canvas, which lies on top as a transparent overlay (marks, selection, drag rectangle).
const View3D=(()=>{
  const PITCH=0.85, FOV=45, WALL=1.0;
  let T, host, renderer, scene, camera, tileGroup, spriteGroup, ready=false, loading=null, active=false;
  let yaw=0, w=1, h=1, cols=0, rows=0;
  const tiles=[];                 // index y*cols+x -> { mesh, sig }
  const texCache=new Map(), matCache=new Map(), canvasTex=new Map(), emojiCanvas=new Map();
  const pool=[]; let poolUsed=0, decalPool=[], decalUsed=0;
  let rayTarget=[];
  const lights=[];   // pooled point lights for candles, fires and kilns (nearest few)

  function load(){
    if(window.THREE) return Promise.resolve();
    if(loading) return loading;
    return loading=new Promise((res,rej)=>{ const s=document.createElement('script'); s.src='lib/three.min.js'; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
  }
  async function init(hostEl, worldCols, worldRows){
    await load();
    T=window.THREE; host=hostEl; cols=worldCols; rows=worldRows;
    renderer=new T.WebGLRenderer({ antialias:false, alpha:false });
    renderer.domElement.id='board3d';
    Object.assign(renderer.domElement.style,{ position:'absolute', left:'0', top:'0', width:'100%', height:'100%', display:'none' });
    host.insertBefore(renderer.domElement, host.firstChild);
    scene=new T.Scene(); scene.background=new T.Color(0x0f0b09); scene.fog=new T.Fog(0x0f0b09,26,70);
    camera=new T.PerspectiveCamera(FOV,1,0.1,200);
    scene.add(new T.AmbientLight(0xa8a0b8,1.7));
    const sun=new T.DirectionalLight(0xffe0b0,0.75); sun.position.set(-6,14,8); scene.add(sun);
    tileGroup=new T.Group(); spriteGroup=new T.Group(); scene.add(tileGroup, spriteGroup);
    ready=true;
  }
  function resize(cssW,cssH,dpr){
    w=cssW; h=cssH;
    if(!ready) return;
    renderer.setPixelRatio(Math.min(2,dpr||1)); renderer.setSize(cssW,cssH,false);
    camera.aspect=cssW/cssH; camera.updateProjectionMatrix();
  }
  function setActive(on){ active=on; if(ready) renderer.domElement.style.display=on?'block':'none'; }

  // ---- terrain ----
  function shadeHex(c,amt){
    const m=/^#?([0-9a-f]{6})$/i.exec(c); if(!m) return c;
    const n=parseInt(m[1],16); const f=v=>Math.max(0,Math.min(255,Math.round(v+amt)));
    return '#'+[(n>>16)&255,(n>>8)&255,n&255].map(f).map(v=>v.toString(16).padStart(2,'0')).join('');
  }
  // spec: { full } (opaque texture from TILEGEN.full) or { color, kind } (flat colour plus speckle overlay)
  const specKey=s=>(s.full?('F'+s.full):('O'+s.color+'|'+(s.kind||'')))+(s.crack?'#c'+s.crack:'')+(s.tint?'#t'+s.tint:'');
  function texture(spec,variant){
    const key=specKey(spec)+'|'+variant;
    if(texCache.has(key)) return texCache.get(key);
    const c=document.createElement('canvas'); c.width=c.height=32; const g=c.getContext('2d');
    if(spec.full){
      const o=TILEGEN.full(spec.full,variant);
      o.g.forEach((row,yy)=>row.forEach((col,xx)=>{ g.fillStyle=col; g.fillRect(xx*2,yy*2,2,2); }));
    } else {
      g.fillStyle=spec.color; g.fillRect(0,0,32,32);
      if(spec.kind && typeof TILEGEN!=='undefined'){
        const o=TILEGEN.gen(spec.kind,variant+1);
        o.g.forEach((row,yy)=>row.forEach((ch,xx)=>{ if(ch==='.') return; g.fillStyle=o.pal[ch]; g.fillRect(xx*2,yy*2,2,2); }));
      }
    }
    const t=new T.CanvasTexture(c); t.magFilter=T.NearestFilter; t.minFilter=T.NearestFilter; t.generateMipmaps=false; t.colorSpace=T.SRGBColorSpace;
    if(spec.tint){ g.fillStyle=spec.tint; g.fillRect(0,0,32,32); }
    if(spec.crack && typeof TILEGEN!=='undefined'){
      const o=TILEGEN.crack(spec.crack,variant);
      o.g.forEach((row,yy)=>row.forEach((ch,xx)=>{ if(ch==='.') return; g.fillStyle=o.pal[ch]; g.fillRect(xx*2,yy*2,2,2); }));
      t.needsUpdate=true;
    }
    texCache.set(key,t); return t;
  }
  function material(spec,variant,extra){
    const key=specKey(spec)+'|'+variant+'|'+(extra||'');
    if(matCache.has(key)) return matCache.get(key);
    const m=new T.MeshLambertMaterial(Object.assign({ map:texture(spec,variant) }, extra==='water'?{ transparent:true, opacity:0.88 }:{}));
    matCache.set(key,m); return m;
  }
  const boxGeo=()=>boxGeo.g||(boxGeo.g=new T.BoxGeometry(1,WALL,1));
  const flatGeo=()=>flatGeo.g||(flatGeo.g=(()=>{ const g=new T.PlaneGeometry(1,1); g.rotateX(-Math.PI/2); return g; })());
  // info = { wall, color, kind, top, water, hidden } from the game
  function buildTile(x,y,info){
    const v=(x*7+y*13)%4;
    let mesh;
    if(info.wall){
      const cr=info.crack||0, wc=s=>cr?Object.assign({},s,{ crack:cr }):s;   // dig progress shows as cracks on every face
      const base={ color:info.color, kind:info.kind }, f=info.faces||[base,base,base,base];
      const top=material(wc({ color:info.top||shadeHex(info.color,38), kind:info.kind }),v);
      const m=i=>material(wc(f[i]||base),v);
      mesh=new T.Mesh(boxGeo(),[m(0),m(1),top,m(0),m(2),m(3)]); mesh.position.set(x+0.5,WALL/2,y+0.5);   // +x, -x, top, bottom, +z, -z
    } else {
      mesh=new T.Mesh(flatGeo(), material(Object.assign(info.full?{ full:info.full }:{ color:info.color, kind:info.kind }, info.tint?{ tint:info.tint }:{}),v,info.water?'water':'')); mesh.position.set(x+0.5,info.water?-0.12:0,y+0.5);
    }
    mesh.userData={ x, y };
    return mesh;
  }
  function syncTiles(tileInfo){
    for(let y=0;y<rows;y++) for(let x=0;x<cols;x++){
      const info=tileInfo(x,y), sig=(info.wall?'w':'f')+'|'+(info.full||'')+'|'+info.color+'|'+info.kind+'|'+(info.top||'')+'|'+(info.water?1:0)+'|'+(info.crack||0)+'|'+(info.tint||'')+'|'+(info.faces?info.faces.map(specKey).join(','):'');
      const i=y*cols+x, cur=tiles[i];
      if(cur && cur.sig===sig) continue;
      if(cur) tileGroup.remove(cur.mesh);
      const mesh=buildTile(x,y,info); tileGroup.add(mesh); tiles[i]={ mesh, sig };
    }
    if(!rayTarget.length) rayTarget=tileGroup.children;
  }

  // ---- sprites ----
  function texOfCanvas(cv){
    let t=canvasTex.get(cv);
    if(!t){ t=new T.CanvasTexture(cv); t.magFilter=T.NearestFilter; t.minFilter=T.NearestFilter; t.generateMipmaps=false; t.colorSpace=T.SRGBColorSpace; canvasTex.set(cv,t); }
    return t;
  }
  function emojiTex(ch){
    let cv=emojiCanvas.get(ch);
    if(!cv){ cv=document.createElement('canvas'); cv.width=cv.height=32; const g=cv.getContext('2d'); g.font='26px serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(ch,16,17); emojiCanvas.set(ch,cv); }
    return texOfCanvas(cv);
  }
  function takeSprite(){
    let s=pool[poolUsed];
    if(!s){ s=new T.Sprite(new T.SpriteMaterial({ transparent:true, alphaTest:0.05 })); spriteGroup.add(s); pool.push(s); }
    poolUsed++; s.visible=true; s.material.color.setHex(0xffffff); return s;
  }
  let chipTex=null, puffTex=null;
  function particleTex(shape){
    if(shape==='puff'){
      if(!puffTex){ const c=document.createElement('canvas'); c.width=c.height=16; const g=c.getContext('2d'); g.fillStyle='#fff'; for(let y=0;y<16;y++) for(let x=0;x<16;x++){ const dx=x+0.5-8, dy=y+0.5-8; if(dx*dx+dy*dy<=64) g.fillRect(x,y,1,1); } puffTex=texOfCanvas(c); }
      return puffTex;
    }
    if(!chipTex){ const c=document.createElement('canvas'); c.width=c.height=2; const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,2,2); chipTex=texOfCanvas(c); }
    return chipTex;
  }
  function takeDecal(){
    let d=decalPool[decalUsed];
    if(!d){ d=new T.Mesh(flatGeo(), new T.MeshBasicMaterial({ transparent:true, depthWrite:false })); spriteGroup.add(d); decalPool.push(d); }
    decalUsed++; d.visible=true; return d;
  }
  // item: { canvas | emoji, x, y (tile units, tile top-left), ox, oy (css px offsets of the 2D draw), scale, alpha, rotation, kind: 'creature'|'prop'|'emoji' }
  // torches: a stick fixed to a wall face (dx,dy point to the wall) leaning away from it; dx=dy=0 stands upright on the floor
  const torchPool=[]; let torchUsed=0;
  function takeTorch(){
    let g=torchPool[torchUsed];
    if(!g){
      g=new T.Group();
      const stick=new T.Mesh(new T.BoxGeometry(0.07,0.38,0.07), new T.MeshLambertMaterial({ color:0x5a3820 }));
      const cup=new T.Mesh(new T.BoxGeometry(0.12,0.05,0.12), new T.MeshLambertMaterial({ color:0x575e66 })); cup.position.y=0.2;
      g.add(stick,cup); spriteGroup.add(g); torchPool.push(g);
    }
    torchUsed++; g.visible=true; return g;
  }
  function placeTorch(it){
    const lean=0.35, g=takeTorch(), cx=it.wx-it.dx*0.03, cz=it.wz-it.dy*0.03, cy=it.wy-0.18;
    g.position.set(cx,cy,cz); g.rotation.set(-it.dy*lean,0,it.dx*lean);
    const top=0.19, sx=-it.dx*Math.sin(lean)*top, sz=-it.dy*Math.sin(lean)*top;
    const f=takeSprite(); f.material.map=texOfCanvas(it.canvas); f.material.opacity=1; f.material.rotation=0; f.center.set(0.5,0.3); f.scale.set(0.55,0.55,1);
    f.position.set(cx+sx, cy+Math.cos(lean)*top+0.02, cz+sz);
    it.wy=cy+Math.cos(lean)*top+0.1;
  }
  function place(it){
    if(it.kind==='wallTorch'){ placeTorch(it); return; }
    if(it.kind==='particle'){
      const s=takeSprite(); s.material.map=particleTex(it.shape); s.material.color.set(it.color); s.material.opacity=Math.max(0,Math.min(1,it.alpha)); s.material.rotation=0; s.center.set(0.5,0.5); const sz=Math.max(0.03,it.size); s.scale.set(sz,sz,1); s.position.set(it.x,it.z,it.y); return;
    }
    const tex=it.canvas?texOfCanvas(it.canvas):emojiTex(it.emoji);
    const ox=(it.ox||0)/32, oy=(it.oy||0)/32, alpha=it.alpha===undefined?1:it.alpha;
    if(it.emoji && it.scale>=1.5){
      const d=takeDecal(); d.material.map=tex; d.material.opacity=alpha; d.material.needsUpdate=true;
      const size=0.5*it.scale; d.scale.set(size,1,size); d.position.set(it.x+0.5,0.03,it.y+0.5); d.rotation.y=-(it.rotation||0);
      return;
    }
    if(it.wx!==undefined){ const t2=takeSprite(); t2.material.map=tex; t2.material.opacity=1; t2.material.rotation=0; t2.center.set(0.5,0.5); const sz=0.9*(it.scale||1); t2.scale.set(sz,sz,1); t2.position.set(it.wx,it.wy,it.wz); return; }
    const s=takeSprite(); s.material.map=tex; s.material.opacity=alpha; s.material.rotation=it.kind==='creature'?(it.rotation||0):0; s.material.needsUpdate=true;
    let size, base, anchorY=0, py=0;
    if(it.kind==='creature'){ size=0.78*(it.scale||1); }
    else if(it.kind==='prop'){ size=0.78*(it.scale||1); }
    else { size=0.5*(it.scale||1)*1.25; }
    if(it.kind==='emoji' && oy<0){ anchorY=0.5; py=0.62+(-oy)*0.9; }       // thoughts and markers hover above the head
    else if(it.kind==='emoji'){ anchorY=0.5; py=0.28+size/2; }
    s.center.set(0.5,it.kind==='emoji'?0.5:0);
    s.scale.set(size,size,1);
    if(it.kind==='emoji') s.position.set(it.x+0.5+ox*Math.cos(yaw), py, it.y+0.5-ox*Math.sin(yaw));
    else { const dz=oy*0.8; s.position.set(it.x+0.5+ox*Math.cos(yaw)+dz*Math.sin(yaw), py, it.y+0.5-ox*Math.sin(yaw)+dz*Math.cos(yaw)); }   // offsets are screen-relative: right and toward the viewer
  }

  // ---- camera, render, pick, project ----
  function camRight(){ return { x:Math.cos(yaw), z:-Math.sin(yaw) }; }
  function setCamera(cx,cy,viewRows){
    const d=Math.max(4,viewRows*Math.sin(PITCH)/(2*Math.tan(FOV*Math.PI/360)));
    camera.position.set(cx+Math.sin(yaw)*Math.cos(PITCH)*d, Math.sin(PITCH)*d, cy+Math.cos(yaw)*Math.cos(PITCH)*d);
    camera.lookAt(cx,0,cy);
    camera.updateMatrixWorld();
  }
  const LIGHT_KEYS={ torch:[0xff9a40,3.4,5.5], candle:[0xffb060,4,6], fire:[0xff7a2a,5,8], kiln:[0xff6a20,5,7], furnace:[0xff6a20,3,5] };
  const MAX_LIGHTS=10;
  function updateLights(items,cx,cy,now){
    while(lights.length<MAX_LIGHTS){ const l=new T.PointLight(0xffa040,0,6,1.6); scene.add(l); lights.push(l); }
    const lp=it=>it.wx!==undefined?[it.wx,it.wz]:[it.x+0.5,it.y+0.5];
    const cand=items.filter(it=>(it.kind==='prop'||it.kind==='wallTorch')&&LIGHT_KEYS[it.key]).map(it=>{ const [lx,lz]=lp(it); return { it, d:(lx-cx)*(lx-cx)+(lz-cy)*(lz-cy) }; }).sort((a,b)=>a.d-b.d).slice(0,MAX_LIGHTS);
    cand.forEach(({it},i)=>{
      const l=lights[i];
      const [col,inten,dist]=LIGHT_KEYS[it.key];
      l.color.setHex(col); l.distance=dist; l.intensity=inten+Math.sin(now/130+i*2)*0.3+Math.sin(now/53+i)*0.15;
      { const [lx,lz]=lp(it); l.position.set(lx, it.wy!==undefined?it.wy:0.8, lz); }
    });
    for(let i=cand.length;i<lights.length;i++) lights[i].intensity=0;   // keep all lights alive: toggling them would recompile the shaders
  }
  function render(tileInfo, items, cx, cy, viewRows){
    if(!ready||!active) return;
    syncTiles(tileInfo);
    updateLights(items,cx,cy,performance.now());
    poolUsed=0; decalUsed=0; torchUsed=0;
    items.forEach(place);
    for(let i=torchUsed;i<torchPool.length;i++) torchPool[i].visible=false;
    for(let i=poolUsed;i<pool.length;i++) pool[i].visible=false;
    for(let i=decalUsed;i<decalPool.length;i++) decalPool[i].visible=false;
    setCamera(cx,cy,viewRows);
    renderer.render(scene,camera);
  }
  function pick(px,py){
    if(!ready||!active) return null;
    const ray=new T.Raycaster(); ray.setFromCamera(new T.Vector2(px/w*2-1,-(py/h)*2+1),camera);
    const hit=ray.intersectObjects(rayTarget,false)[0];
    return hit?{ x:hit.object.userData.x, y:hit.object.userData.y }:null;
  }
  function project(wx,wy,height){
    const v=new T.Vector3(wx,height||0,wy).project(camera);
    return { x:(v.x*0.5+0.5)*w, y:(-v.y*0.5+0.5)*h, behind:v.z>1 };
  }
  // which side of the screen a movement (dx,dy in tile units) goes: >0 right, <0 left
  function sideOf(dx,dy){ const r=camRight(); return dx*r.x+dy*r.z; }
  return { init, resize, setActive, render, pick, project, sideOf, camRight,
    get yaw(){ return yaw; }, set yaw(v){ yaw=v; }, get ready(){ return ready; }, get active(){ return active; }, WALL };
})();
