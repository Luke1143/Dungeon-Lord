// SVG rig (an experiment, user November 2026): the ork as a vector figure made of parts that move on their own: legs from the hip, the body,
// the belly, belt and buckle, the head, the jaw with its tusks, the eyes (blinking, looking), the brows (mood), and the gear on them (helmet,
// breastplate, shoulder plates, loincloth; a weapon floating beside it: creatures have no hands, what they hold is their hand).
// A kit, not one drawing: two styles (classic, grim) share the parts and the motion and differ in shapes and colours; the proportions follow
// values (cleverness: a bigger head, a smaller jaw; strength: a broader body; agility: longer legs, slimmer; savagery: longer tusks, darker brows),
// and a seed rolls them with the skin's hue, a scar and the gear (deterministic: the same seed, the same ork).
// One set of path data feeds two outputs: real SVG (crisp at any size) and a canvas (Path2D), which also gives the after-effects: pixel (the vector
// figure drawn as a small sprite), smooth (pixel, then grown with EPX), soft, and a boiling line (SVG turbulence).
// The in-game viewer opens with "#svgork" at the end of the address; the same file is the whole of the published viewer page. The game does not use it yet.
const OrkRig=(()=>{
  const ell=(cx,cy,rx,ry)=>`M${cx-rx} ${cy} a${rx} ${ry} 0 1 0 ${2*rx} 0 a${rx} ${ry} 0 1 0 ${-2*rx} 0z`;
  // a path mirrored left to right (x negated); paths without arcs only
  function mirror(d){
    const X={ M:[1,0], m:[1,0], L:[1,0], l:[1,0], T:[1,0], t:[1,0], Q:[1,0,1,0], q:[1,0,1,0], C:[1,0,1,0,1,0], c:[1,0,1,0,1,0], H:[1], h:[1], V:[0], v:[0], Z:[], z:[] };
    let cmd='M', i=0; return d.replace(/[a-zA-Z]|-?\d*\.?\d+/g,tok=>{ if(/[a-zA-Z]/.test(tok)){ cmd=tok; i=0; return tok; } const pat=X[cmd]||[0]; const neg=pat.length&&pat[i%pat.length]; i++; return neg?String(-parseFloat(tok)):tok; });
  }
  // ---- the two styles: colours and shapes; a shape is [path, fill key or null, stroke width (0 none), stroke key] ----
  const PAL={
    klassisch:{ skin:'#5f8f3a', light:'#86b05a', dark:'#3d6224', leg:'#4e6b30', foot:'#324a20', belt:'#6b4a35', gold:'#c8a040', bone:'#f2e8d5', line:'#14100c', brow:'#2a3f18', eye:'#ffffff', pupil:'#14100c', glow:'rgba(0,0,0,0)', mouth:'#3a120c', tongue:'#a8443a', iron:'#8a9096', ironDark:'#5d6268', wood:'#8a6446', leather:'#7a5a3a', cloth:'#6b4a35', rust:'#7a4a2a', scar:'#b8c890' },
    düster:{ skin:'#4a5638', light:'#5e6b48', dark:'#2c3522', leg:'#3a4530', foot:'#1e1a16', belt:'#2e221a', gold:'#a89c86', bone:'#cfc3a8', line:'#0a0806', brow:'#1c2216', eye:'#ff5a2a', pupil:'#2a0400', glow:'rgba(255,70,30,0.35)', mouth:'#1a0604', tongue:'#5a1a14', iron:'#3a3a42', ironDark:'#1f1f24', wood:'#3a2a20', leather:'#2e221a', cloth:'#4a1612', rust:'#7a3a22', scar:'#8a7a6a' }
  };
  const SKIN_KEYS=['skin','light','dark','leg','brow'];
  const SHAPES={
    klassisch:{
      shadow:[[ell(0,1.5,17,3),'shadow',0]],
      leg:[['M-11 -12 q-1 9 2 12 h7 q2 -6 0 -12z','leg',2],['M-10 -1.5 h8',null,1.4,'foot']],
      body:[['M-18 -24 q0 -14 18 -15 q18 1 18 15 q1 14 -18 15 q-19 -1 -18 -15z','skin',2],['M-14 -28 q4 4 2 9',null,1.5,'dark']],
      belly:[['M-10 -21 q10 9 20 0 q0 8 -10 9 q-10 -1 -10 -9z','light',0]],
      belt:[['M-17 -16 q17 6 34 0 l0 4 q-17 6 -34 0z','belt',2]],
      buckle:[['M-3 -16.5 h6 v5 h-6z','gold',2]],
      skull:[['M-10 -44 q10 -10 20 0 q3 6 0 10 q-10 5 -20 0 q-3 -4 0 -10z','skin',2]],
      scar:[['M-8 -47 L-3 -42.5',null,1.2,'scar']],
      mouth:[[ell(0,-32.5,9,3.2),'mouth',1.6],[ell(0,-31,4.5,1.4),'tongue',0]],
      jaw:[['M-13 -36 q13 10 26 0 q2 8 -4 11 q-9 4 -18 0 q-6 -3 -4 -11z','light',2]],
      tusk:[['M-10 -32 l0 -7 l3 0 l0 5z','bone',1.5]], tuskAt:[-8.5,-32],
      eye:[[ell(-4.5,-40,2.6,2.2),'eye',0]], eyeAt:[-4.5,-40], pupil:[[ell(-4,-39.6,1.2,1.2),'pupil',0]], pupilIn:0.5, lookK:1.1,
      lid:[['M-7.3 -40 q2.8 1.6 5.6 0',null,1.6,'line']],
      brow:[['M-9 -44.5 l6 2',null,2.2,'brow']], browAt:[-6,-43.5],
      helmet:[['M-10.5 -44 Q0 -56 10.5 -44 L10.5 -42.6 L-10.5 -42.6z','iron',1.8],['M-1 -44 h2 v4.5 h-2z','ironDark',1.2],[ell(-6,-45.6,0.7,0.7),'ironDark',0],[ell(6,-45.6,0.7,0.7),'ironDark',0]],
      chest:[['M-15.5 -33 Q0 -39 15.5 -33 L13.5 -19 Q0 -15.5 -13.5 -19z','leather',1.8],['M0 -36 L0 -17.5',null,1.2,'dark'],['M-9 -31 l3 0 M6 -31 l3 0',null,1.2,'dark']],
      pauldron:[[ell(-16.5,-33,5.5,3.6),'iron',1.8]], pauldronAt:[-16,-33], pauldronR:[[ell(16.5,-33,5.5,3.6),'iron',1.8]],
      cloth:[['M-5.5 -14 L5.5 -14 L6.5 -4.5 Q0 -2.5 -6.5 -4.5z','cloth',1.6]],
      axe:[['M23 -7 L25 -7 L25 -41 L23 -41z','wood',1.6],['M25 -40 Q34 -42 34 -32 Q34 -26 25 -28z','iron',1.6]],
      headY:0, legK:1
    },
    düster:{
      shadow:[[ell(0,1.5,15,2.6),'shadow',0]],
      leg:[['M-9.5 -12 L-8.5 0 L-3 0 L-3.5 -12z','leg',1.8],['M-9.2 -2.6 L-2.8 -2.6 L-2.8 0 L-9.3 0z','foot',1.2]],
      body:[['M-13 -13 L-14.5 -26 L-16.5 -35 L-11 -39.5 L11 -39.5 L16.5 -35 L14.5 -26 L13 -13 Q0 -10.5 -13 -13z','skin',1.8],['M-9 -31 l4 1 M-9 -27 l4 1 M9 -31 l-4 1 M9 -27 l-4 1',null,1.2,'dark']],
      belly:[['M-5 -25 L5 -25 L4 -17 L-4 -17z','light',0],['M0 -25 L0 -17',null,1,'dark']],
      belt:[['M-13.5 -16.5 L13.5 -16.5 L13 -12.5 L-13 -12.5z','belt',1.6]],
      buckle:[[ell(0,-14.6,2.6,2.3),'gold',1.2],[ell(-0.9,-14.8,0.6,0.6),'line',0],[ell(0.9,-14.8,0.6,0.6),'line',0]],
      skull:[['M-8 -46.5 L-3 -50.5 L3 -50.5 L8 -46.5 L9.5 -40.5 L6.5 -36 L-6.5 -36 L-9.5 -40.5z','skin',1.8]],
      scar:[['M-7.5 -46 L-2 -38.5',null,1.1,'scar']],
      mouth:[[ell(0,-33.8,6.8,2.4),'mouth',1.4],[ell(0,-33.2,3,0.9),'tongue',0]],
      jaw:[['M-10.5 -37.5 L10.5 -37.5 L9.5 -32.5 L5 -29.5 L-5 -29.5 L-9.5 -32.5z','light',1.8]],
      tusk:[['M-8 -33 Q-10 -38 -7.6 -43 L-6.4 -38.5 Q-6.4 -35.5 -5.8 -33z','bone',1.3]], tuskAt:[-7,-33],
      eye:[[ell(-4.3,-41.6,2.6,1.6),'glow',0],[ell(-4.3,-41.6,1.7,0.9),'eye',0]], eyeAt:[-4.3,-41.6], pupil:[[ell(-4.1,-41.6,0.4,0.8),'pupil',0]], pupilIn:0.2, lookK:0.45,
      lid:[['M-6.2 -41.6 l3.8 0',null,1.4,'line']],
      brow:[['M-9 -44.6 L-1.6 -42.6 L-1.8 -44.2 L-8.6 -46.6z','brow',0]], browAt:[-5,-44],
      helmet:[['M-9.5 -44.5 L-8.5 -50.5 L-3 -53.5 L3 -53.5 L8.5 -50.5 L9.5 -44.5 L4 -45.5 L0 -44 L-4 -45.5z','iron',1.6],['M-8.5 -50.5 Q-15 -52.5 -17 -61 Q-11.5 -56 -6 -52.5z','bone',1.4],['M8.5 -50.5 Q15 -52.5 17 -61 Q11.5 -56 6 -52.5z','bone',1.4],['M-0.6 -53 L0.6 -53 L0.6 -46 L-0.6 -46z','ironDark',0]],
      chest:[['M-12 -37 L12 -37 L10.5 -21 L0 -17.5 L-10.5 -21z','iron',1.6],['M0 -36.5 L0 -18.5',null,1,'ironDark'],['M-8 -33 L-6 -27 M7 -34 L8 -29',null,1,'rust']],
      pauldron:[['M-18 -35.5 L-11.5 -40.5 L-9 -34.5 L-13 -30 L-18.5 -31.5z','iron',1.6],['M-15.5 -38.5 L-21 -46 L-13 -39.5z','ironDark',1.2]], pauldronAt:[-14,-35],
      cloth:[['M-6 -13 L6 -13 L7 -3 L5 -5.5 L3 -1.5 L1 -4.5 L-1 -0.5 L-3 -4.5 L-5 -1.5 L-7 -4.5z','cloth',1.4]],
      axe:[['M23 -5 L24.6 -5 L24.6 -44 L23 -44z','wood',1.4],['M24.6 -43 L35 -47 L33 -40 L36 -34 L33 -27 L24.6 -30z','iron',1.4],['M30 -44 L31 -41 M33 -33 L31.5 -31',null,1,'rust']],
      headY:1.6, legK:1.15
    }
  };
  const WEAPONS={
    club:[['M22 -6 L25 -6 L28.5 -37 Q24 -45 18.5 -37z','wood',1.6],['M19 -36 l-3 -1 M28 -36 l3 -1 M20.5 -30 l-3 0 M27 -30 l3 0',null,1.4,'ironDark']],
    sword:[['M23.2 -15 L24.8 -15 L24.8 -45 L24 -48 L23.2 -45z','iron',1.3],['M19.5 -15 L28.5 -15 L28.5 -13 L19.5 -13z','ironDark',1.2],['M23.2 -13 L24.8 -13 L24.8 -7 L23.2 -7z','wood',1]]
  };
  // ---- a spec: style, values 0..1, gear, hue shift, scar; the seed rolls one ----
  function rng(seed){ let a=seed>>>0||1; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  function roll(seed,style){
    const r=rng(seed), pick=a=>a[Math.floor(r()*a.length)];
    return { style:style||pick(['klassisch','düster']), traits:{ klug:r(), stark:r(), flink:r(), wild:r() }, hue:(r()*2-1)*22, scar:r()<0.4,
      gear:{ helmet:r()<0.5, chest:r()<0.5, pauldrons:r()<0.45, cloth:r()<0.6, weapon:pick(['none','axe','club','sword']) }, seed };
  }
  const DEFAULT={ style:'düster', traits:{ klug:0.5, stark:0.5, flink:0.5, wild:0.5 }, hue:0, scar:true, gear:{ helmet:true, chest:false, pauldrons:true, cloth:true, weapon:'axe' } };
  // colours: the style's, the skin turned by the hue shift
  function hueShift(hex,deg){
    if(!deg||hex[0]!=='#') return hex; const n=parseInt(hex.slice(1),16); let r=(n>>16&255)/255, g=(n>>8&255)/255, b=(n&255)/255;
    const mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2, d=mx-mn; let h=0, s=0;
    if(d){ s=d/(1-Math.abs(2*l-1)); h=mx===r?((g-b)/d)%6:(mx===g?(b-r)/d+2:(r-g)/d+4); h*=60; }
    h=(h+deg+360)%360; const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2; let rr=0, gg=0, bb=0;
    if(h<60){ rr=c; gg=x; } else if(h<120){ rr=x; gg=c; } else if(h<180){ gg=c; bb=x; } else if(h<240){ gg=x; bb=c; } else if(h<300){ rr=x; bb=c; } else { rr=c; bb=x; }
    const to=v=>Math.round((v+m)*255).toString(16).padStart(2,'0'); return '#'+to(rr)+to(gg)+to(bb);
  }
  // ---- building a rig from a spec: the tree of parts (pivot, shapes, children) and each part's resting transform ----
  function build(spec){
    spec=Object.assign({},DEFAULT,spec||{}); const S=SHAPES[spec.style]||SHAPES.klassisch, t=Object.assign({},DEFAULT.traits,spec.traits), G=Object.assign({},DEFAULT.gear,spec.gear);
    const pal=Object.assign({ shadow:'rgba(0,0,0,0.35)' },PAL[spec.style]||PAL.klassisch); SKIN_KEYS.forEach(k=>{ pal[k]=hueShift(pal[k],spec.hue); });
    const P=(id,pivot,shapes,kids)=>({ id, pivot, shapes:shapes||[], kids:kids||[] });
    const mirrorShapes=sh=>sh.map(([d,f,w,st])=>[mirror(d),f,w,st]);
    const ex=S.eyeAt, br=S.browAt, ta=S.tuskAt;
    // the right eye: the left one moved over (ellipses keep their shape; the pupil sits towards the nose on both sides)
    const shiftX=(sh,dx)=>sh.map(([d,f,w,st])=>[d.replace(/^M(-?[\d.]+)/,(m0,x)=>'M'+(parseFloat(x)+dx).toFixed(2)),f,w,st]), pupilIn=S.pupilIn||0;
    const headKids=[
      P('skull',[0,-41],S.skull,spec.scar?[P('scar',[0,-44],S.scar)]:[]),
      G.helmet?P('helmet',[0,-45],S.helmet):null,
      P('mouth',[0,-33],S.mouth),
      P('jaw',[0,-36],S.jaw,[P('tuskL',ta,S.tusk),P('tuskR',[-ta[0],ta[1]],mirrorShapes(S.tusk))]),
      P('eyeL',ex,S.eye,[P('pupilL',ex,S.pupil)]),
      P('eyeR',[-ex[0],ex[1]],shiftX(S.eye,-2*ex[0]),[P('pupilR',[-ex[0],ex[1]],shiftX(S.pupil,-2*ex[0]-2*pupilIn))]),
      P('lidL',ex,S.lid), P('lidR',[-ex[0],ex[1]],mirrorShapes(S.lid)),
      P('browL',br,S.brow), P('browR',[-br[0],br[1]],mirrorShapes(S.brow))
    ].filter(Boolean);
    const bodyKids=[
      P('belly',[0,-20],S.belly), G.chest?P('chest',[0,-28],S.chest):null,
      G.cloth?P('cloth',[0,-14],S.cloth):null,
      P('belt',[0,-14],S.belt), P('buckle',[0,-14],S.buckle),
      G.pauldrons?P('pauldronL',S.pauldronAt,S.pauldron):null, G.pauldrons?P('pauldronR',[-S.pauldronAt[0],S.pauldronAt[1]],S.pauldronR||mirrorShapes(S.pauldron)):null,
      P('head',[0,-37],[],headKids)
    ].filter(Boolean);
    const weapon=G.weapon&&G.weapon!=='none'?P('weapon',[24,-22],G.weapon==='axe'?S.axe:WEAPONS[G.weapon]):null;
    const tree=P('root',[0,0],[],[P('shadow',[0,0],S.shadow),P('legL',[-7,-12],S.leg),P('legR',[7,-12],mirrorShapes(S.leg)),P('body',[0,-12],S.body,bodyKids),weapon].filter(Boolean));
    // the values as proportions
    const ls=(0.85+0.45*t.flink)*S.legK, bw=(0.85+0.4*t.stark)*(1.1-0.2*t.flink), hs=0.85+0.45*t.klug, js=1.15-0.35*t.klug, ts=0.6+0.9*t.wild, ps=0.8+0.4*t.stark, lift=-(12*ls-12);
    const base={
      shadow:{ sx:bw }, legL:{ x:-(bw-1)*5, y:lift, sy:ls }, legR:{ x:(bw-1)*5, y:lift, sy:ls }, body:{ y:lift, sx:bw },
      head:{ y:S.headY, sx:hs/bw, sy:hs }, jaw:{ sx:js, sy:js }, tuskL:{ sy:ts }, tuskR:{ sy:ts }, pauldronL:{ sx:ps, sy:ps }, pauldronR:{ sx:ps, sy:ps },
      weapon:{ x:(bw-1)*16, y:lift }
    };
    return { tree, base, pal, spec, lookK:S.lookK, browBase:(t.wild-0.5)*14 };
  }
  // how far a part moves sideways when the ork half turns (turn -1 .. 1): the face more than the skull, so the flat figure seems to turn
  const TURN={ skull:0.6, helmet:0.7, mouth:1.4, jaw:1.4, eyeL:2.2, eyeR:2.2, lidL:2.2, lidR:2.2, browL:2.2, browR:2.2, belly:1.6, chest:1.0, cloth:1.1, buckle:2.2 };
  // the parts pulled apart (the "parts" view): where each one drifts
  const EXPLODE={ legL:[-6,6], legR:[6,6], belly:[0,4], belt:[0,7], buckle:[0,11], cloth:[0,14], chest:[0,-4], head:[0,-10], skull:[0,-5], helmet:[0,-14], jaw:[0,7], mouth:[0,3], eyeL:[-5,-3], eyeR:[5,-3], lidL:[-5,-3], lidR:[5,-3], browL:[-7,-8], browR:[7,-8], pupilL:[-1.5,0], pupilR:[1.5,0], pauldronL:[-9,-4], pauldronR:[9,-4], weapon:[10,0] };
  const MOODS={ ruhig:[0,0], wütend:[16,0.6], überrascht:[-8,-2.2], traurig:[-16,-0.4] };       // brow turn (degrees, inner end down), brow lift
  // the state of the animation
  function create(){ return { t:0, x:0, dir:1, wait:0.8, walking:false, phase:0, turn:0, blink:0, nextBlink:1.5, twice:false, look:[0,0], roar:0, mood:'ruhig', moodK:[0,0], explode:0 }; }
  // one step: o = { walk, mouse:[x,y] or null (in units of the figure, its feet at 0,0), range, explode }
  function step(s,dt,o){
    s.t+=dt;
    if(o.walk){ if(s.wait>0){ s.wait-=dt; s.walking=false; } else { s.walking=true; s.x+=s.dir*15*dt; const R=o.range||48; if(Math.abs(s.x)>R){ s.x=Math.sign(s.x)*R; s.dir=-s.dir; s.wait=1+Math.random()*1.2; } } }
    else s.walking=false;
    if(s.walking) s.phase+=dt*7.5; else { const rest=Math.round(s.phase/Math.PI)*Math.PI; s.phase+=(rest-s.phase)*Math.min(1,dt*8); }
    s.turn+=((s.walking?s.dir:0)-s.turn)*Math.min(1,dt*4);
    s.nextBlink-=dt; if(s.nextBlink<=0){ s.blink=0.16; s.nextBlink=s.twice?0.28:2+Math.random()*3.5; s.twice=!s.twice&&Math.random()<0.25; }       // now and then, sometimes twice
    s.blink=Math.max(0,s.blink-dt);
    let lx=0, ly=0;       // where the eyes go: the mouse, the way it walks, or a look around while it stands
    if(o.mouse){ const dx=o.mouse[0]-s.x, dy=o.mouse[1]+40, d=Math.hypot(dx,dy)||1; lx=dx/d; ly=dy/d; }
    else if(s.walking){ lx=s.dir*0.8; } else { lx=Math.sin(s.t*1.3)*0.9; ly=Math.sin(s.t*0.7)*0.3; }
    s.look[0]+=(lx-s.look[0])*Math.min(1,dt*9); s.look[1]+=(ly-s.look[1])*Math.min(1,dt*9);
    s.roar=Math.max(0,s.roar-dt);
    const m=MOODS[s.roar>0?'wütend':s.mood]||MOODS.ruhig; s.moodK[0]+=(m[0]-s.moodK[0])*Math.min(1,dt*8); s.moodK[1]+=(m[1]-s.moodK[1])*Math.min(1,dt*8);
    s.explode+=((o.explode?1:0)-s.explode)*Math.min(1,dt*5);
  }
  // the pose of every part: { x, y, r (degrees), sx, sy, a }, the motion on top of the resting transform
  function pose(s,rig){
    const P={}, put=(id,v)=>{ P[id]=Object.assign({ x:0, y:0, r:0, sx:1, sy:1, a:1 },v); };
    const w=s.phase, roar=s.roar>0?Math.min(1,s.roar*3,(1.2-s.roar)*6):0, lift=k=>-2.6*Math.max(0,Math.sin(w+k)), breath=Math.sin(s.t*2.1);
    const turnOf=id=>(TURN[id]||0)*s.turn, walkK=s.walking?1:0;
    put('root',{ x:s.x });
    put('shadow',{ sx:1-0.06*Math.abs(Math.sin(w)) });
    put('legL',{ y:lift(0), r:6*Math.sin(w) }); put('legR',{ y:lift(Math.PI), r:6*Math.sin(w+Math.PI) });
    put('body',{ y:-1.1*Math.abs(Math.sin(w))+(roar?Math.sin(s.t*60)*0.4:0), sx:1+0.012*breath, sy:1-0.012*breath+0.02*Math.cos(2*w)*walkK, r:-2.5*s.turn });
    put('head',{ y:0.8*Math.abs(Math.sin(w+0.6)), r:s.turn*3+Math.sin(w)*1.5+(roar?Math.sin(s.t*45)*2.5:0) });
    put('skull',{ x:turnOf('skull'), sx:1-0.07*Math.abs(s.turn) }); put('helmet',{ x:turnOf('helmet') });
    put('mouth',{ x:turnOf('mouth'), sy:0.2+0.8*roar, a:roar>0.05?1:0 });
    put('jaw',{ x:turnOf('jaw'), y:3.2*roar });
    put('belly',{ x:turnOf('belly') }); put('chest',{ x:turnOf('chest') }); put('buckle',{ x:turnOf('buckle') });
    put('cloth',{ x:turnOf('cloth'), r:Math.sin(w)*6*walkK+Math.sin(s.t*1.7)*1.5 });
    put('weapon',{ x:-s.turn, y:Math.sin(s.t*2)*0.8-Math.abs(Math.sin(w))*0.6*walkK, r:Math.sin(s.t*1.3)*4-roar*40 });
    const closed=s.blink>0?1:0, k=rig.lookK||1;
    ['L','R'].forEach(sd=>{ put('eye'+sd,{ x:turnOf('eye'+sd), sy:1-0.9*closed+(roar?0.15:0) }); put('pupil'+sd,{ x:s.look[0]*k, y:s.look[1]*k*0.6, a:closed?0:1 }); put('lid'+sd,{ x:turnOf('lid'+sd), a:closed }); });
    put('browL',{ x:turnOf('browL'), y:s.moodK[1], r:s.moodK[0]+rig.browBase }); put('browR',{ x:turnOf('browR'), y:s.moodK[1], r:-s.moodK[0]-rig.browBase });
    // the resting transform of the values, then the parts view on top
    Object.keys(rig.base).forEach(id=>{ const b=rig.base[id]; if(!P[id]) put(id,{}); const v=P[id]; v.x+=b.x||0; v.y+=b.y||0; v.sx*=b.sx||1; v.sy*=b.sy||1; });
    if(s.explode>0.001) Object.keys(EXPLODE).forEach(id=>{ if(P[id]){ P[id].x+=EXPLODE[id][0]*s.explode; P[id].y+=EXPLODE[id][1]*s.explode; } });
    return P;
  }
  const tf=(p,v)=>`translate(${v.x} ${v.y}) translate(${p[0]} ${p[1]}) rotate(${v.r}) scale(${v.sx} ${v.sy}) translate(${-p[0]} ${-p[1]})`;
  // the SVG output: one <g> per part, built once per rig; draw() sets the transforms
  function svg(host,rig){
    const NS='http://www.w3.org/2000/svg', els={}; while(host.firstChild) host.removeChild(host.firstChild);
    const build=(part,parent)=>{ const g=document.createElementNS(NS,'g'); g.dataset.part=part.id;
      part.shapes.forEach(([d,fill,sw,stroke])=>{ const p=document.createElementNS(NS,'path'); p.setAttribute('d',d); p.setAttribute('fill',fill?rig.pal[fill]:'none');
        if(sw){ p.setAttribute('stroke',rig.pal[stroke||'line']); p.setAttribute('stroke-width',sw); p.setAttribute('stroke-linejoin','round'); p.setAttribute('stroke-linecap','round'); } g.appendChild(p); });
      parent.appendChild(g); els[part.id]={ g, pivot:part.pivot }; part.kids.forEach(k=>build(k,g)); };
    build(rig.tree,host);
    return { draw(P){ Object.keys(els).forEach(id=>{ const e=els[id], v=P[id]; if(!v) return; e.g.setAttribute('transform',tf(e.pivot,v)); e.g.setAttribute('opacity',v.a); }); } };
  }
  // the canvas output: the same paths (Path2D), scaled k pixels to a unit, the feet at (ox, oy)
  const paths=new Map(); const p2=d=>{ let p=paths.get(d); if(!p){ p=new Path2D(d); paths.set(d,p); } return p; };
  function canvas(g,rig,P,k,ox,oy){
    g.save(); g.translate(ox,oy); g.scale(k,k); g.lineJoin='round'; g.lineCap='round';
    const draw=part=>{ const v=P[part.id]||{ x:0, y:0, r:0, sx:1, sy:1, a:1 }; if(v.a<=0.01) return; g.save(); const [px,py]=part.pivot;
      g.translate(v.x+px,v.y+py); g.rotate(v.r*Math.PI/180); g.scale(v.sx,v.sy); g.translate(-px,-py); g.globalAlpha*=v.a;
      part.shapes.forEach(([d,fill,sw,stroke])=>{ const p=p2(d); if(fill){ g.fillStyle=rig.pal[fill]; g.fill(p); } if(sw){ g.strokeStyle=rig.pal[stroke||'line']; g.lineWidth=sw; g.stroke(p); } });
      part.kids.forEach(draw); g.restore(); };
    draw(rig.tree); g.restore();
  }
  return { build, roll, create, step, pose, svg, canvas, MOODS, DEFAULT, STYLES:Object.keys(SHAPES) };
})();

// ---- the viewer: a stage (a strip of dungeon floor under a torch), the controls, and the ork as sprites from 16 to 128 pixels ----
const SvgOrkViewer=(()=>{
  const CSS=`
.orkv{ --ink:#e9dcc0; --mute:#a8977a; --line:#5b4632; --panel:#1d1611; --ground:#120d0a; --accent:#d9a441; color:var(--ink); font:14px/1.45 "Inter",system-ui,sans-serif; display:flex; flex-direction:column; gap:14px }
.orkv-stage{ position:relative; width:100%; aspect-ratio:2.4/1; max-width:100%; border:1px solid var(--line); border-radius:6px; overflow:hidden;
  background:radial-gradient(ellipse 45% 70% at 50% 18%,rgba(255,154,64,0.22),transparent 70%),
   repeating-linear-gradient(90deg,rgba(0,0,0,0.35) 0 2px,transparent 2px 64px),
   linear-gradient(#1a130f 0 58%,#3a2c22 58% 59%,#4a3a30 59%,#30241c 100%) }
.orkv-stage svg,.orkv-stage canvas{ position:absolute; inset:0; width:100%; height:100%; display:block }
.orkv-stage canvas{ image-rendering:pixelated }
.orkv-row{ display:flex; flex-wrap:wrap; gap:8px 10px; align-items:center }
.orkv-row label,.orkv-group{ color:var(--mute); font-size:12px; letter-spacing:0.04em; text-transform:uppercase }
.orkv-slider{ display:flex; align-items:center; gap:6px; color:var(--ink); font-size:13px; text-transform:none; letter-spacing:0 }
.orkv-slider input{ width:110px; accent-color:var(--accent) }
.orkv button,.orkv select{ font:inherit; color:var(--ink); background:var(--panel); border:1px solid var(--line); border-radius:4px; padding:5px 10px; cursor:pointer }
.orkv button[aria-pressed="true"]{ border-color:var(--accent); color:var(--accent) }
.orkv button:focus-visible,.orkv select:focus-visible,.orkv input:focus-visible{ outline:2px solid var(--accent); outline-offset:2px }
.orkv-sprites{ display:flex; flex-wrap:wrap; gap:18px; align-items:flex-end; background:var(--panel); border:1px solid var(--line); border-radius:6px; padding:10px 14px }
.orkv-sprites figure{ margin:0; display:flex; flex-direction:column; align-items:center; gap:4px; color:var(--mute); font-size:12px; font-variant-numeric:tabular-nums }
.orkv-sprites canvas{ image-rendering:pixelated; background:#2a201a; max-width:100% }
.orkv-note{ color:var(--mute); font-size:13px; max-width:68ch; margin:0 }`;
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
  const snap=(g,w,h)=>{ const im=g.getImageData(0,0,w,h), d=im.data; for(let i=3;i<d.length;i+=4) d[i]=d[i]>110?255:0; g.putImageData(im,0,0); };       // a pixel sprite has no half pixels
  // one sprite: the ork `size` pixels high (with room for the horns and the weapon: the canvas a little wider and higher)
  function sprite(rig,P,size){
    const c=document.createElement('canvas'); c.width=Math.round(size*1.25); c.height=Math.round(size*1.08); const g=c.getContext('2d'), k=size/66;
    OrkRig.canvas(g,rig,P,k,c.width*0.42,c.height-2*k); snap(g,c.width,c.height); return c;
  }
  const TRAITS=[['klug','Klugheit','Kopf'],['stark','Stärke','Breite'],['flink','Gewandtheit','Beine'],['wild','Wildheit','Hauer']];
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
  <label for="orkvStyle">Stil</label><select id="orkvStyle">${OrkRig.STYLES.map(s=>`<option value="${s}">${s==='düster'?'Düster':'Klassisch'}</option>`).join('')}</select>
  <button id="orkvRoll">Würfeln</button>
  <button id="orkvWalk" aria-pressed="true">Auf und ab</button>
  <button id="orkvMouse" aria-pressed="false">Schaut zur Maus</button>
  <button id="orkvBlink">Blinzeln</button>
  <button id="orkvRoar">Brüllen</button>
  <button id="orkvParts" aria-pressed="false">Einzelteile</button>
</div>
<div class="orkv-row"><span class="orkv-group">Werte</span>${TRAITS.map(([k,n,what])=>`<label class="orkv-slider" for="orkvT_${k}">${n} <small>(${what})</small><input type="range" id="orkvT_${k}" min="0" max="100" value="50"></label>`).join('')}</div>
<div class="orkv-row"><span class="orkv-group">Ausrüstung</span>
  <label for="orkvWeapon">Waffe</label><select id="orkvWeapon"><option value="none">keine</option><option value="axe">Axt</option><option value="club">Keule</option><option value="sword">Schwert</option></select>
  <button id="orkvG_helmet" aria-pressed="false">Helm</button><button id="orkvG_chest" aria-pressed="false">Brustpanzer</button><button id="orkvG_pauldrons" aria-pressed="false">Schulterplatten</button><button id="orkvG_cloth" aria-pressed="false">Lendenschurz</button><button id="orkvScar" aria-pressed="false">Narbe</button>
</div>
<div class="orkv-row">
  <label for="orkvMood">Stimmung</label><select id="orkvMood">${Object.keys(OrkRig.MOODS).map(m=>`<option value="${m}">${m}</option>`).join('')}</select>
  <label for="orkvFx">Nachbearbeitung</label><select id="orkvFx"><option value="vector">Vektor (SVG)</option><option value="boil">Wackel-Linie</option><option value="pixel">Pixel</option><option value="smooth" selected>Pixel, glatt hochgerechnet</option><option value="soft">Weich</option></select>
  <label for="orkvRes">Pixelgröße</label><select id="orkvRes"><option value="24">24 px</option><option value="32">32 px</option><option value="48" selected>48 px</option><option value="64">64 px</option><option value="128">128 px</option></select>
</div>
<div class="orkv-sprites" id="orkvSprites" aria-label="Der Ork als Sprite von 16 bis 128 Pixeln"></div>
<p class="orkv-note">Ein Baukasten statt einer Zeichnung: zwei Stile mit denselben Teilen und Bewegungen. Die Werte formen den Körper (Klugheit: größerer Kopf und kleinerer Kiefer, Stärke: breiter, Gewandtheit: längere Beine und schlanker, Wildheit: längere Hauer und finsterere Brauen). „Würfeln“ zieht aus einem Seed Stil, Werte, Hautton, Narbe und Ausrüstung. Die Ausrüstung hängt an den Körperteilen und macht jede Bewegung mit; die Waffe schwebt daneben. Unten derselbe Ork als Sprite, in der gewählten Nachbearbeitung.</p>`;
    const $=id=>root.querySelector('#'+id), stage=$('orkvStage'), svgEl=$('orkvSvg'), cv=$('orkvCanvas'), turb=$('orkvTurb');
    let spec=JSON.parse(JSON.stringify(OrkRig.DEFAULT)), rig, out;
    const s=OrkRig.create(), opt={ walk:true, mouse:null, followMouse:false, explode:false, fx:'smooth', res:48 };
    // the controls show the spec; a change rebuilds the rig
    const show=()=>{ $('orkvStyle').value=spec.style; TRAITS.forEach(([k])=>{ $('orkvT_'+k).value=Math.round(spec.traits[k]*100); }); $('orkvWeapon').value=spec.gear.weapon;
      ['helmet','chest','pauldrons','cloth'].forEach(k=>$('orkvG_'+k).setAttribute('aria-pressed',!!spec.gear[k])); $('orkvScar').setAttribute('aria-pressed',!!spec.scar); };
    const rebuild=()=>{ rig=OrkRig.build(spec); out=OrkRig.svg($('orkvRig'),rig); show(); };
    rebuild();
    $('orkvStyle').addEventListener('change',e=>{ spec.style=e.target.value; rebuild(); });
    TRAITS.forEach(([k])=>$('orkvT_'+k).addEventListener('input',e=>{ spec.traits[k]=e.target.value/100; rebuild(); }));
    $('orkvWeapon').addEventListener('change',e=>{ spec.gear.weapon=e.target.value; rebuild(); });
    ['helmet','chest','pauldrons','cloth'].forEach(k=>$('orkvG_'+k).addEventListener('click',()=>{ spec.gear[k]=!spec.gear[k]; rebuild(); }));
    $('orkvScar').addEventListener('click',()=>{ spec.scar=!spec.scar; rebuild(); });
    $('orkvRoll').addEventListener('click',()=>{ spec=OrkRig.roll(Math.floor(Math.random()*1e9)); rebuild(); });
    const toggle=(id,key)=>{ const b=$(id); b.addEventListener('click',()=>{ opt[key]=!opt[key]; b.setAttribute('aria-pressed',opt[key]); if(key==='followMouse'&&!opt[key]) opt.mouse=null; }); };
    toggle('orkvWalk','walk'); toggle('orkvMouse','followMouse'); toggle('orkvParts','explode');
    $('orkvBlink').addEventListener('click',()=>{ s.blink=0.16; s.nextBlink=0.3; s.twice=true; });
    $('orkvRoar').addEventListener('click',()=>{ s.roar=1.2; });
    $('orkvMood').addEventListener('change',e=>{ s.mood=e.target.value; });
    $('orkvFx').addEventListener('change',e=>{ opt.fx=e.target.value; });
    $('orkvRes').addEventListener('change',e=>{ opt.res=+e.target.value; });
    stage.addEventListener('pointermove',e=>{ if(!opt.followMouse) return; const r=stage.getBoundingClientRect(), sc=Math.min(r.width/192,r.height/80), ox=r.left+r.width/2, oy=r.bottom-8*sc;
      opt.mouse=[(e.clientX-ox)/sc,(e.clientY-oy)/sc]; });
    // the sprites: 16 to 128 pixels high; the small ones shown four times as large, the big ones three and two times
    const TIMES={ 4:'vierfach', 3:'dreifach', 2:'doppelt' };
    const spr=$('orkvSprites'), figs=[[16,4],[24,4],[32,4],[48,3],[64,3],[128,2]].map(([n,m])=>{ const f=document.createElement('figure'), c=document.createElement('canvas'); c.width=Math.round(n*1.25)*m; c.height=Math.round(n*1.08)*m;
      const cap=document.createElement('figcaption'); cap.textContent=`${n} px, ${TIMES[m]}`; f.append(c,cap); spr.appendChild(f); return { n, c }; });
    let last=performance.now(), spriteT=0, boilT=0, stageT=0, alive=true;
    const frame=now=>{ if(!alive||!root.isConnected){ alive=false; return; } requestAnimationFrame(frame);
      const dt=Math.min(0.05,(now-last)/1000); last=now;
      OrkRig.step(s,dt,{ walk:opt.walk, mouse:opt.followMouse?opt.mouse:null, range:56, explode:opt.explode });
      const P=OrkRig.pose(s,rig), vec=opt.fx==='vector'||opt.fx==='boil'; svgEl.style.visibility=vec?'visible':'hidden'; cv.hidden=vec;
      if(vec){ out.draw(P); $('orkvRig').setAttribute('filter',opt.fx==='boil'?'url(#orkvBoil)':''); boilT+=dt; if(boilT>0.13){ boilT=0; turb.setAttribute('seed',1+Math.floor(Math.random()*90)); } }
      else if((stageT+=dt)>1/30){ stageT=0;
        // the ork opt.res pixels high (as the sprites below), the stage around it in the same pixels
        const r=stage.getBoundingClientRect(), k=opt.res/66, small=document.createElement('canvas'); small.width=Math.round(192*k); small.height=Math.round(80*k);
        const g=small.getContext('2d'); OrkRig.canvas(g,rig,P,k,small.width/2,small.height-8*k);
        let src=small; if(opt.fx!=='soft') snap(g,small.width,small.height); if(opt.fx==='smooth') src=epx2(epx2(small));
        const dpr=Math.min(2,window.devicePixelRatio||1); cv.width=Math.round(r.width*dpr); cv.height=Math.round(r.height*dpr);
        const cg=cv.getContext('2d'); cg.imageSmoothingEnabled=opt.fx!=='pixel'; const sc=Math.min(cv.width/src.width,cv.height/src.height);
        cg.clearRect(0,0,cv.width,cv.height); cg.drawImage(src,(cv.width-src.width*sc)/2,cv.height-src.height*sc,src.width*sc,src.height*sc);
      }
      // the sprites follow the chosen after-effect: plain pixels, or grown smoothly when "smooth" is chosen
      spriteT+=dt; if(spriteT>0.1){ spriteT=0; const Q=Object.assign({},P,{ root:Object.assign({},P.root,{ x:0 }) });
        figs.forEach(f=>{ let sp=sprite(rig,Q,f.n); const smooth=opt.fx==='smooth'; if(smooth) sp=epx2(epx2(sp));
          const g=f.c.getContext('2d'); g.imageSmoothingEnabled=smooth; g.clearRect(0,0,f.c.width,f.c.height); g.drawImage(sp,0,0,f.c.width,f.c.height); }); }
    };
    requestAnimationFrame(frame);
    return { close(){ alive=false; root.remove(); }, state:s, opt, get spec(){ return spec; } };
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
