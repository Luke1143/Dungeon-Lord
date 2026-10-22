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
    scene.add(new T.AmbientLight(0xa8a0b8,2.3));
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
  function texture(color,kind,variant){
    const key=color+'|'+kind+'|'+variant;
    if(texCache.has(key)) return texCache.get(key);
    const c=document.createElement('canvas'); c.width=c.height=32; const g=c.getContext('2d');
    g.fillStyle=color; g.fillRect(0,0,32,32);
    if(kind && typeof TILEGEN!=='undefined'){
      const o=TILEGEN.gen(kind,variant+1);
      o.g.forEach((row,yy)=>row.forEach((ch,xx)=>{ if(ch==='.') return; g.fillStyle=o.pal[ch]; g.fillRect(xx*2,yy*2,2,2); }));
    }
    const t=new T.CanvasTexture(c); t.magFilter=T.NearestFilter; t.minFilter=T.NearestFilter; t.generateMipmaps=false; t.colorSpace=T.SRGBColorSpace;
    texCache.set(key,t); return t;
  }
  function material(color,kind,variant,extra){
    const key=color+'|'+kind+'|'+variant+'|'+(extra||'');
    if(matCache.has(key)) return matCache.get(key);
    const m=new T.MeshLambertMaterial(Object.assign({ map:texture(color,kind,variant) }, extra==='water'?{ transparent:true, opacity:0.88 }:{}));
    matCache.set(key,m); return m;
  }
  const boxGeo=()=>boxGeo.g||(boxGeo.g=new T.BoxGeometry(1,WALL,1));
  const flatGeo=()=>flatGeo.g||(flatGeo.g=(()=>{ const g=new T.PlaneGeometry(1,1); g.rotateX(-Math.PI/2); return g; })());
  // info = { wall, color, kind, top, water, hidden } from the game
  function buildTile(x,y,info){
    const v=(x*7+y*13)%4;
    let mesh;
    if(info.wall){
      const side=material(info.color,info.kind,v), top=material(info.top||shadeHex(info.color,38),info.kind,v);
      mesh=new T.Mesh(boxGeo(),[side,side,top,side,side,side]); mesh.position.set(x+0.5,WALL/2,y+0.5);
    } else {
      mesh=new T.Mesh(flatGeo(), material(info.color,info.kind,v,info.water?'water':'')); mesh.position.set(x+0.5,info.water?-0.12:0,y+0.5);
    }
    mesh.userData={ x, y };
    return mesh;
  }
  function syncTiles(tileInfo){
    for(let y=0;y<rows;y++) for(let x=0;x<cols;x++){
      const info=tileInfo(x,y), sig=(info.wall?'w':'f')+'|'+info.color+'|'+info.kind+'|'+(info.top||'')+'|'+(info.water?1:0);
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
    poolUsed++; s.visible=true; return s;
  }
  function takeDecal(){
    let d=decalPool[decalUsed];
    if(!d){ d=new T.Mesh(flatGeo(), new T.MeshBasicMaterial({ transparent:true, depthWrite:false })); spriteGroup.add(d); decalPool.push(d); }
    decalUsed++; d.visible=true; return d;
  }
  // item: { canvas | emoji, x, y (tile units, tile top-left), ox, oy (css px offsets of the 2D draw), scale, alpha, rotation, kind: 'creature'|'prop'|'emoji' }
  function place(it){
    const tex=it.canvas?texOfCanvas(it.canvas):emojiTex(it.emoji);
    const ox=(it.ox||0)/32, oy=(it.oy||0)/32, alpha=it.alpha===undefined?1:it.alpha;
    if(it.emoji && it.scale>=1.5){
      const d=takeDecal(); d.material.map=tex; d.material.opacity=alpha; d.material.needsUpdate=true;
      const size=0.5*it.scale; d.scale.set(size,1,size); d.position.set(it.x+0.5,0.03,it.y+0.5); d.rotation.y=-(it.rotation||0);
      return;
    }
    const s=takeSprite(); s.material.map=tex; s.material.opacity=alpha; s.material.rotation=it.kind==='creature'?(it.rotation||0):0; s.material.needsUpdate=true;
    let size, base, anchorY=0, py=0;
    if(it.kind==='creature'){ size=0.78; }
    else if(it.kind==='prop'){ size=0.78*(it.scale||1); }
    else { size=0.5*(it.scale||1)*1.25; }
    if(it.kind==='emoji' && oy<0){ anchorY=0.5; py=0.62+(-oy)*0.9; }       // thoughts and markers hover above the head
    else if(it.kind==='emoji'){ anchorY=0.5; py=0.28+size/2; }
    s.center.set(0.5,it.kind==='emoji'?0.5:0);
    s.scale.set(size,size,1);
    const zOff=(it.kind!=='emoji'&&oy>0)?oy*0.6:0;
    s.position.set(it.x+0.5+ox*Math.cos(yaw), py, it.y+0.5+zOff-ox*Math.sin(yaw));
  }

  // ---- camera, render, pick, project ----
  function camRight(){ return { x:Math.cos(yaw), z:-Math.sin(yaw) }; }
  function setCamera(cx,cy,viewRows){
    const d=Math.max(4,viewRows*Math.sin(PITCH)/(2*Math.tan(FOV*Math.PI/360)));
    camera.position.set(cx+Math.sin(yaw)*Math.cos(PITCH)*d, Math.sin(PITCH)*d, cy+Math.cos(yaw)*Math.cos(PITCH)*d);
    camera.lookAt(cx,0,cy);
    camera.updateMatrixWorld();
  }
  function render(tileInfo, items, cx, cy, viewRows){
    if(!ready||!active) return;
    syncTiles(tileInfo);
    poolUsed=0; decalUsed=0;
    items.forEach(place);
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
