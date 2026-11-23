// SVG rig (an experiment, user November 2026): the ork as a vector figure made of parts that move on their own: legs from the hip, the body,
// the belly, belt and buckle, the head, the jaw with its tusks, the eyes (blinking, looking), the brows (mood). One set of path data feeds two outputs:
// real SVG (crisp at any size) and a canvas (Path2D), which also gives the after-effects: pixel (the vector figure drawn as a small sprite),
// smooth (pixel, then grown with EPX), soft, and a boiling line (SVG turbulence). The in-game viewer opens with "#svgork" at the end of the address;
// the same file is the whole of the published viewer page. Nothing of the game uses it yet.
const OrkRig=(()=>{
  const C={ skin:'#5f8f3a', light:'#86b05a', dark:'#3d6224', leg:'#4e6b30', foot:'#324a20', belt:'#6b4a35', gold:'#c8a040', tusk:'#f2e8d5', line:'#14100c', brow:'#2a3f18', eye:'#ffffff', mouth:'#3a120c', tongue:'#a8443a' };
  const ell=(cx,cy,rx,ry)=>`M${cx-rx} ${cy} a${rx} ${ry} 0 1 0 ${2*rx} 0 a${rx} ${ry} 0 1 0 ${-2*rx} 0z`;
  // coordinates in units, the feet's middle at 0,0 (y up is negative); a shape: [path, fill, stroke width (0 none), stroke colour]
  // a part: its pivot (it turns and scales about it), its own shapes, then its children (drawn after it, in order)
  const RIG={ id:'root', pivot:[0,0], shapes:[], kids:[
    { id:'shadow', pivot:[0,0], shapes:[[ell(0,1.5,17,3),'rgba(0,0,0,0.35)',0]] },
    { id:'legL', pivot:[-7,-12], shapes:[['M-11 -12 q-1 9 2 12 h7 q2 -6 0 -12z',C.leg,2],['M-10 -1.5 h8',C.foot,1.4,C.foot]] },
    { id:'legR', pivot:[7,-12], shapes:[['M11 -12 q1 9 -2 12 h-7 q-2 -6 0 -12z',C.leg,2],['M10 -1.5 h-8',C.foot,1.4,C.foot]] },
    { id:'body', pivot:[0,-12], shapes:[['M-18 -24 q0 -14 18 -15 q18 1 18 15 q1 14 -18 15 q-19 -1 -18 -15z',C.skin,2],['M-14 -28 q4 4 2 9',null,1.5,C.dark]], kids:[
      { id:'belly', pivot:[0,-18], shapes:[['M-10 -21 q10 9 20 0 q0 8 -10 9 q-10 -1 -10 -9z',C.light,0]] },
      { id:'belt', pivot:[0,-14], shapes:[['M-17 -16 q17 6 34 0 l0 4 q-17 6 -34 0z',C.belt,2]] },
      { id:'buckle', pivot:[0,-14], shapes:[['M-3 -16.5 h6 v5 h-6z',C.gold,2]] },
      { id:'head', pivot:[0,-36], shapes:[], kids:[
        { id:'skull', pivot:[0,-40], shapes:[['M-10 -44 q10 -10 20 0 q3 6 0 10 q-10 5 -20 0 q-3 -4 0 -10z',C.skin,2]] },
        { id:'mouth', pivot:[0,-33], shapes:[[ell(0,-32.5,9,3.2),C.mouth,1.6],[ell(0,-31,4.5,1.4),C.tongue,0]] },
        { id:'jaw', pivot:[0,-35], shapes:[['M-13 -36 q13 10 26 0 q2 8 -4 11 q-9 4 -18 0 q-6 -3 -4 -11z',C.light,2],['M-10 -32 l0 -7 l3 0 l0 5z',C.tusk,1.5],['M10 -32 l0 -7 l-3 0 l0 5z',C.tusk,1.5]] },
        { id:'eyeL', pivot:[-4.5,-40], shapes:[[ell(-4.5,-40,2.6,2.2),C.eye,0]], kids:[{ id:'pupilL', pivot:[-4,-39.6], shapes:[[ell(-4,-39.6,1.2,1.2),C.line,0]] }] },
        { id:'eyeR', pivot:[4.5,-40], shapes:[[ell(4.5,-40,2.6,2.2),C.eye,0]], kids:[{ id:'pupilR', pivot:[4,-39.6], shapes:[[ell(4,-39.6,1.2,1.2),C.line,0]] }] },
        { id:'lidL', pivot:[-4.5,-40], shapes:[['M-7.3 -40 q2.8 1.6 5.6 0',null,1.6,C.line]] },
        { id:'lidR', pivot:[4.5,-40], shapes:[['M1.7 -40 q2.8 1.6 5.6 0',null,1.6,C.line]] },
        { id:'browL', pivot:[-6,-43.5], shapes:[['M-9 -44.5 l6 2',null,2.2,C.brow]] },
        { id:'browR', pivot:[6,-43.5], shapes:[['M9 -44.5 l-6 2',null,2.2,C.brow]] }
      ] }
    ] }
  ] };
  // how far a part moves sideways when the ork half turns (turn -1 .. 1): the face more than the skull, so the flat figure seems to turn
  const TURN={ skull:0.6, mouth:1.4, jaw:1.4, eyeL:2.2, eyeR:2.2, lidL:2.2, lidR:2.2, browL:2.2, browR:2.2, belly:1.6, buckle:2.2 };
  // the parts pulled apart (the "parts" view): where each one drifts
  const EXPLODE={ legL:[-6,6], legR:[6,6], belly:[0,4], belt:[0,7], buckle:[0,11], head:[0,-10], skull:[0,-5], jaw:[0,7], mouth:[0,3], eyeL:[-5,-3], eyeR:[5,-3], lidL:[-5,-3], lidR:[5,-3], browL:[-7,-8], browR:[7,-8], pupilL:[-1.5,0], pupilR:[1.5,0] };
  const MOODS={ ruhig:[0,0,0], wütend:[16,0.6,0], überrascht:[-8,-2.2,0], traurig:[-16,-0.4,0] };       // brow turn (degrees, inner end down), brow lift, -
  // the state of the animation
  function create(){ return { t:0, x:0, dir:1, wait:0.8, walking:false, phase:0, turn:0, blink:0, nextBlink:1.5, twice:false, look:[0,0], roar:0, mood:'ruhig', moodK:[0,0], explode:0, breath:0 }; }
  // one step: o = { walk, mouse:[x,y] or null (in units of the figure, its feet at 0,0), range }
  function step(s,dt,o){
    s.t+=dt;
    if(o.walk){ if(s.wait>0){ s.wait-=dt; s.walking=false; } else { s.walking=true; s.x+=s.dir*15*dt; const R=o.range||48; if(Math.abs(s.x)>R){ s.x=Math.sign(s.x)*R; s.dir=-s.dir; s.wait=1+Math.random()*1.2; } } }
    else s.walking=false;
    if(s.walking) s.phase+=dt*7.5; else { const rest=Math.round(s.phase/Math.PI)*Math.PI; s.phase+=(rest-s.phase)*Math.min(1,dt*8); }
    s.turn+=((s.walking?s.dir:0)-s.turn)*Math.min(1,dt*4);
    // blinking: now and then, sometimes twice
    s.nextBlink-=dt; if(s.nextBlink<=0){ s.blink=0.16; s.nextBlink=s.twice?0.28:2+Math.random()*3.5; s.twice=!s.twice&&Math.random()<0.25; }
    s.blink=Math.max(0,s.blink-dt);
    // where the eyes go: the mouse, the way it walks, or a look around while it stands
    let lx=0, ly=0;
    if(o.mouse){ const dx=o.mouse[0]-(s.x), dy=o.mouse[1]+40; const d=Math.hypot(dx,dy)||1; lx=dx/d; ly=dy/d; }
    else if(s.walking){ lx=s.dir*0.8; } else { lx=Math.sin(s.t*1.3)*0.9; ly=Math.sin(s.t*0.7)*0.3; }
    s.look[0]+=(lx-s.look[0])*Math.min(1,dt*9); s.look[1]+=(ly-s.look[1])*Math.min(1,dt*9);
    s.roar=Math.max(0,s.roar-dt);
    const m=MOODS[s.roar>0?'wütend':s.mood]||MOODS.ruhig; s.moodK[0]+=(m[0]-s.moodK[0])*Math.min(1,dt*8); s.moodK[1]+=(m[1]-s.moodK[1])*Math.min(1,dt*8);
    s.explode+=((o.explode?1:0)-s.explode)*Math.min(1,dt*5);
  }
  // the pose of every part: { x, y, r (degrees), sx, sy, a }
  function pose(s){
    const P={}, put=(id,v)=>{ P[id]=Object.assign({ x:0, y:0, r:0, sx:1, sy:1, a:1 },v); };
    const w=s.phase, walkK=Math.min(1,Math.abs(Math.sin(w))+ (s.walking?0:0)), roar=s.roar>0?Math.min(1,s.roar*3,(1.2-s.roar)*6):0;
    const lift=k=>-2.6*Math.max(0,Math.sin(w+k));
    put('root',{ x:s.x });
    put('shadow',{ sx:1-0.06*Math.abs(Math.sin(w)) });
    put('legL',{ y:lift(0), r:6*Math.sin(w) }); put('legR',{ y:lift(Math.PI), r:6*Math.sin(w+Math.PI) });
    const breath=Math.sin(s.t*2.1);
    put('body',{ y:-1.1*Math.abs(Math.sin(w))+(roar?Math.sin(s.t*60)*0.4:0), sx:1+0.012*breath, sy:1-0.012*breath+0.02*Math.cos(2*w)*(s.walking?1:0), r:-2.5*s.turn });
    put('head',{ y:0.8*Math.abs(Math.sin(w+0.6)), r:s.turn*3+Math.sin(w)*1.5+(roar?Math.sin(s.t*45)*2.5:0) });
    const turnOf=id=>(TURN[id]||0)*s.turn;
    put('skull',{ x:turnOf('skull'), sx:1-0.07*Math.abs(s.turn) });
    const open=roar?1:0;
    put('mouth',{ x:turnOf('mouth'), sy:0.2+0.8*open, a:open>0.05?1:0 });
    put('jaw',{ x:turnOf('jaw'), y:3.2*open, r:0 });
    put('belly',{ x:turnOf('belly') }); put('belt',{}); put('buckle',{ x:turnOf('buckle') });
    const closed=s.blink>0?1:0;
    ['L','R'].forEach(k=>{ put('eye'+k,{ x:turnOf('eye'+k), sy:1-0.9*closed+(roar?0.15:0) }); put('pupil'+k,{ x:s.look[0]*1.1, y:s.look[1]*0.7, a:closed?0:1 }); put('lid'+k,{ x:turnOf('lid'+k), a:closed }); });
    put('browL',{ x:turnOf('browL'), y:s.moodK[1], r:s.moodK[0] }); put('browR',{ x:turnOf('browR'), y:s.moodK[1], r:-s.moodK[0] });
    // the parts view: every part drifts away from its place
    if(s.explode>0.001) Object.keys(EXPLODE).forEach(id=>{ if(P[id]){ P[id].x+=EXPLODE[id][0]*s.explode; P[id].y+=EXPLODE[id][1]*s.explode; } });
    return P;
  }
  const tf=(p,v)=>`translate(${v.x} ${v.y}) translate(${p[0]} ${p[1]}) rotate(${v.r}) scale(${v.sx} ${v.sy}) translate(${-p[0]} ${-p[1]})`;
  // the SVG output: one <g> per part, built once; draw() sets the transforms
  function svg(host){
    const NS='http://www.w3.org/2000/svg', els={};
    const build=(part,parent)=>{ const g=document.createElementNS(NS,'g'); g.dataset.part=part.id;
      part.shapes.forEach(([d,fill,sw,stroke])=>{ const p=document.createElementNS(NS,'path'); p.setAttribute('d',d); p.setAttribute('fill',fill||'none');
        if(sw){ p.setAttribute('stroke',stroke||C.line); p.setAttribute('stroke-width',sw); p.setAttribute('stroke-linejoin','round'); p.setAttribute('stroke-linecap','round'); } g.appendChild(p); });
      parent.appendChild(g); els[part.id]={ g, pivot:part.pivot }; (part.kids||[]).forEach(k=>build(k,g)); };
    build(RIG,host);
    return { draw(P){ Object.keys(els).forEach(id=>{ const e=els[id], v=P[id]; if(!v) return; e.g.setAttribute('transform',tf(e.pivot,v)); e.g.setAttribute('opacity',v.a); }); }, els };
  }
  // the canvas output: the same paths (Path2D), scaled k pixels to a unit, the feet at (ox, oy)
  const paths=new Map(); const p2=d=>{ let p=paths.get(d); if(!p){ p=new Path2D(d); paths.set(d,p); } return p; };
  function canvas(g,P,k,ox,oy){
    g.save(); g.translate(ox,oy); g.scale(k,k); g.lineJoin='round'; g.lineCap='round';
    const draw=part=>{ const v=P[part.id]||{ x:0, y:0, r:0, sx:1, sy:1, a:1 }; if(v.a<=0.01) return; g.save(); const [px,py]=part.pivot;
      g.translate(v.x+px,v.y+py); g.rotate(v.r*Math.PI/180); g.scale(v.sx,v.sy); g.translate(-px,-py); g.globalAlpha*=v.a;
      part.shapes.forEach(([d,fill,sw,stroke])=>{ const p=p2(d); if(fill){ g.fillStyle=fill; g.fill(p); } if(sw){ g.strokeStyle=stroke||C.line; g.lineWidth=sw; g.stroke(p); } });
      (part.kids||[]).forEach(draw); g.restore(); };
    draw(RIG); g.restore();
  }
  return { create, step, pose, svg, canvas, MOODS, C };
})();

// ---- the viewer: a stage (a strip of dungeon floor under a torch), the controls, and the ork as a small sprite at three sizes ----
const SvgOrkViewer=(()=>{
  const CSS=`
.orkv{ --ink:#e9dcc0; --mute:#a8977a; --line:#5b4632; --panel:#1d1611; --ground:#120d0a; --accent:#d9a441; color:var(--ink); font:14px/1.45 "Inter",system-ui,sans-serif; display:flex; flex-direction:column; gap:14px }
.orkv-stage{ position:relative; width:100%; aspect-ratio:2.4/1; max-width:100%; border:1px solid var(--line); border-radius:6px; overflow:hidden;
  background:radial-gradient(ellipse 45% 70% at 50% 18%,rgba(255,154,64,0.22),transparent 70%),
   repeating-linear-gradient(90deg,rgba(0,0,0,0.35) 0 2px,transparent 2px 64px),
   linear-gradient(#1a130f 0 58%,#3a2c22 58% 59%,#4a3a30 59%,#30241c 100%) }
.orkv-stage svg,.orkv-stage canvas{ position:absolute; inset:0; width:100%; height:100%; display:block }
.orkv-stage canvas{ image-rendering:pixelated }
.orkv-row{ display:flex; flex-wrap:wrap; gap:8px; align-items:center }
.orkv-row label{ color:var(--mute); font-size:12px; letter-spacing:0.04em; text-transform:uppercase; margin-right:2px }
.orkv button,.orkv select{ font:inherit; color:var(--ink); background:var(--panel); border:1px solid var(--line); border-radius:4px; padding:5px 10px; cursor:pointer }
.orkv button[aria-pressed="true"]{ border-color:var(--accent); color:var(--accent) }
.orkv button:focus-visible,.orkv select:focus-visible{ outline:2px solid var(--accent); outline-offset:2px }
.orkv-sprites{ display:flex; flex-wrap:wrap; gap:18px; align-items:flex-end; background:var(--panel); border:1px solid var(--line); border-radius:6px; padding:10px 14px }
.orkv-sprites figure{ margin:0; display:flex; flex-direction:column; align-items:center; gap:4px; color:var(--mute); font-size:12px; font-variant-numeric:tabular-nums }
.orkv-sprites canvas{ image-rendering:pixelated; background:#2a201a }
.orkv-note{ color:var(--mute); font-size:13px; max-width:68ch }`;
  // EPX: a corner takes the colour of two equal neighbours (grows a pixel picture twice, the edges stay crisp)
  function epx2(src){
    const w=src.width, h=src.height, a=src.getContext('2d').getImageData(0,0,w,h).data, c=document.createElement('canvas'); c.width=w*2; c.height=h*2;
    const g=c.getContext('2d'), out=g.createImageData(w*2,h*2), o=out.data;
    const px=(x,y)=>{ x=Math.max(0,Math.min(w-1,x)); y=Math.max(0,Math.min(h-1,y)); const i=(y*w+x)*4; return (a[i]<<24|a[i+1]<<16|a[i+2]<<8|a[i+3])>>>0; };
    const put=(x,y,v)=>{ const i=(y*w*2+x)*4; o[i]=v>>>24; o[i+1]=(v>>>16)&255; o[i+2]=(v>>>8)&255; o[i+3]=v&255; };
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const P=px(x,y), A=px(x,y-1), B=px(x+1,y), C=px(x-1,y), D=px(x,y+1);
      put(2*x,2*y,(C===A&&C!==D&&A!==B)?A:P); put(2*x+1,2*y,(A===B&&A!==C&&B!==D)?B:P); put(2*x,2*y+1,(D===C&&D!==B&&C!==A)?C:P); put(2*x+1,2*y+1,(B===D&&B!==A&&D!==C)?D:P); }
    g.putImageData(out,0,0); return c;
  }
  // a small canvas without smoothing at the edges of the shapes: drawn, then every pixel's alpha snapped (a pixel sprite has no half pixels)
  function sprite(P,size){
    const c=document.createElement('canvas'); c.width=size; c.height=size; const g=c.getContext('2d'), k=size/66;
    OrkRig.canvas(g,P,k,c.width/2,size-2*k);
    const im=g.getImageData(0,0,c.width,c.height), d=im.data; for(let i=3;i<d.length;i+=4) d[i]=d[i]>110?255:0; g.putImageData(im,0,0); return c;
  }
  function open(host){
    if(!document.getElementById('orkv-css')){ const st=document.createElement('style'); st.id='orkv-css'; st.textContent=CSS; document.head.appendChild(st); }
    const root=document.createElement('div'); root.className='orkv'; host.appendChild(root);
    root.innerHTML=`
<div class="orkv-stage" id="orkvStage">
  <svg id="orkvSvg" viewBox="-96 -72 192 80" preserveAspectRatio="xMidYMax meet" aria-label="Der Ork aus Einzelteilen">
    <defs><filter id="orkvBoil" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence id="orkvTurb" type="fractalNoise" baseFrequency="0.08" numOctaves="1" seed="1"/><feDisplacementMap in="SourceGraphic" scale="1.8"/></filter></defs>
    <g id="orkvRig"></g>
  </svg>
  <canvas id="orkvCanvas" hidden></canvas>
</div>
<div class="orkv-row">
  <button id="orkvWalk" aria-pressed="true">Auf und ab</button>
  <button id="orkvMouse" aria-pressed="false">Schaut zur Maus</button>
  <button id="orkvBlink">Blinzeln</button>
  <button id="orkvRoar">Brüllen</button>
  <button id="orkvParts" aria-pressed="false">Einzelteile</button>
</div>
<div class="orkv-row">
  <label for="orkvMood">Stimmung</label><select id="orkvMood">${Object.keys(OrkRig.MOODS).map(m=>`<option>${m}</option>`).join('')}</select>
  <label for="orkvFx">Nachbearbeitung</label><select id="orkvFx"><option value="vector">Vektor (SVG)</option><option value="boil">Wackel-Linie</option><option value="pixel">Pixel</option><option value="smooth">Pixel, glatt hochgerechnet</option><option value="soft">Weich</option></select>
  <label for="orkvRes">Pixelgröße</label><select id="orkvRes"><option value="24">24 px</option><option value="32" selected>32 px</option><option value="48">48 px</option><option value="64">64 px</option><option value="128">128 px</option></select>
</div>
<div class="orkv-sprites" id="orkvSprites" aria-label="Der Ork als Sprite in Spielgröße"></div>
<p class="orkv-note">Ein Ork aus 17 Teilen mit eigenen Drehpunkten: Beine, Körper, Bauch, Gürtel, Schnalle, Kopf, Schädel, Kiefer mit Hauern, Mund, Augen, Pupillen, Lider und Brauen. Beim Gehen rutschen Gesicht, Kiefer und Bauch unterschiedlich weit zur Seite, das wirkt wie eine halbe Drehung. Unten derselbe Ork live als Pixel-Sprite von 16 bis 128 Pixeln Höhe: Vektor-Animation, Pixel-Ausgabe.</p>`;
    const $=id=>root.querySelector('#'+id), stage=$('orkvStage'), svgEl=$('orkvSvg'), cv=$('orkvCanvas'), turb=$('orkvTurb');
    const out=OrkRig.svg($('orkvRig')), s=OrkRig.create();
    const opt={ walk:true, mouse:null, followMouse:false, explode:false, fx:'vector', res:32 };
    const toggle=(id,key)=>{ const b=$(id); b.addEventListener('click',()=>{ opt[key]=!opt[key]; b.setAttribute('aria-pressed',opt[key]); if(key==='followMouse'&&!opt[key]) opt.mouse=null; }); };
    toggle('orkvWalk','walk'); toggle('orkvMouse','followMouse'); toggle('orkvParts','explode');
    $('orkvBlink').addEventListener('click',()=>{ s.blink=0.16; s.nextBlink=0.3; s.twice=true; });
    $('orkvRoar').addEventListener('click',()=>{ s.roar=1.2; });
    $('orkvMood').addEventListener('change',e=>{ s.mood=e.target.value; });
    $('orkvFx').addEventListener('change',e=>{ opt.fx=e.target.value; });
    $('orkvRes').addEventListener('change',e=>{ opt.res=+e.target.value; });
    stage.addEventListener('pointermove',e=>{ if(!opt.followMouse) return; const r=stage.getBoundingClientRect(), sc=Math.min(r.width/192,r.height/80), ox=r.left+r.width/2, oy=r.bottom-8*sc;
      opt.mouse=[(e.clientX-ox)/sc,(e.clientY-oy)/sc]; });
    // the sprites at game size: 16, 24 and 32 pixels high, each shown four times as large
    // the sprites at game size and larger: 16 to 128 pixels high; the small ones shown four times as large, the big ones three and two times
    const TIMES={ 4:'vierfach', 3:'dreifach', 2:'doppelt' };
    const spr=$('orkvSprites'), figs=[[16,4],[24,4],[32,4],[64,3],[128,2]].map(([n,m])=>{ const f=document.createElement('figure'), c=document.createElement('canvas'); c.width=n*m; c.height=n*m; const cap=document.createElement('figcaption'); cap.textContent=n+' px, '+TIMES[m]; f.append(c,cap); spr.appendChild(f); return { n, c }; });
    let last=performance.now(), spriteT=0, boilT=0, alive=true;
    const frame=now=>{ if(!alive||!root.isConnected){ alive=false; return; } requestAnimationFrame(frame);
      const dt=Math.min(0.05,(now-last)/1000); last=now;
      OrkRig.step(s,dt,{ walk:opt.walk, mouse:opt.followMouse?opt.mouse:null, range:62, explode:opt.explode });
      const P=OrkRig.pose(s);
      const vec=opt.fx==='vector'||opt.fx==='boil'; svgEl.style.visibility=vec?'visible':'hidden'; cv.hidden=vec;
      if(vec){ out.draw(P); $('orkvRig').setAttribute('filter',opt.fx==='boil'?'url(#orkvBoil)':''); boilT+=dt; if(boilT>0.13){ boilT=0; turb.setAttribute('seed',1+Math.floor(Math.random()*90)); } }
      else {
        // the ork opt.res pixels high (as the sprites below), the stage around it in the same pixels
        const r=stage.getBoundingClientRect(), k=opt.res/66, small=document.createElement('canvas'); small.width=Math.round(192*k); small.height=Math.round(80*k);
        const g=small.getContext('2d'); OrkRig.canvas(g,P,k,small.width/2,small.height-8*k);
        let src=small;
        if(opt.fx!=='soft'){ const im=g.getImageData(0,0,small.width,small.height), d=im.data; for(let i=3;i<d.length;i+=4) d[i]=d[i]>110?255:0; g.putImageData(im,0,0); }
        if(opt.fx==='smooth') src=epx2(epx2(small));
        const dpr=Math.min(2,window.devicePixelRatio||1); cv.width=Math.round(r.width*dpr); cv.height=Math.round(r.height*dpr);
        const cg=cv.getContext('2d'); cg.imageSmoothingEnabled=opt.fx!=='pixel'; const sc=Math.min(cv.width/src.width,cv.height/src.height);
        cg.clearRect(0,0,cv.width,cv.height); cg.drawImage(src,(cv.width-src.width*sc)/2,cv.height-src.height*sc,src.width*sc,src.height*sc);
      }
      spriteT+=dt; if(spriteT>0.08){ spriteT=0; figs.forEach(f=>{ const sp=sprite(Object.assign({},P,{ root:Object.assign({},P.root,{ x:0 }) }),f.n), g=f.c.getContext('2d'); g.imageSmoothingEnabled=false; g.clearRect(0,0,f.c.width,f.c.height); g.drawImage(sp,0,0,f.c.width,f.c.height); }); }
    };
    requestAnimationFrame(frame);
    return { close(){ alive=false; root.remove(); }, state:s, opt };
  }
  // in the game (where View3D exists): "#svgork" opens it over everything
  function overlay(){
    const host=document.createElement('div'); host.style.cssText='position:fixed;inset:0;z-index:9999;background:#120d0a;overflow:auto;padding:16px max(16px,env(safe-area-inset-left,0px))';
    const inner=document.createElement('div'); inner.style.cssText='max-width:1100px;margin:0 auto'; host.appendChild(inner);
    const close=document.createElement('button'); close.textContent='✕'; close.style.cssText='position:fixed;right:14px;top:10px;z-index:2;font-size:18px';
    host.appendChild(close); document.body.appendChild(host); const v=open(inner);
    close.onclick=()=>{ v.close(); host.remove(); if(location.hash==='#svgork') history.replaceState(null,'',location.pathname); };
  }
  if(typeof window!=='undefined'&&typeof View3D!=='undefined'){ const maybe=()=>{ if(location.hash==='#svgork') overlay(); }; window.addEventListener('hashchange',maybe); window.addEventListener('load',()=>setTimeout(maybe,300)); }
  return { open, overlay };
})();
