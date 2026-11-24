// SVG figures (user, November 2026: the game moves to them step by step, the pixel sprites stay as legacy until then; see CLAUDE.md, docs/ui.md).
// A kit of creature kinds (ork, imp) built from parts that move on their own: legs from the hip, the body with belly, belt and buckle, the head with
// skull, jaw, eyes (blinking, looking), brows (mood) and what a kind has of its own (tusks, ears, a tail, a sack on the back), the gear on the parts
// (helmet, breastplate, shoulder plates, loincloth), and two floating hands without arms that hold the weapon or tool (the style rule, CLAUDE.md).
// Every kind shares the part names, the motion, the stats and one body plan (humanoidShapes: the gear is fitted to the body, whatever its size), so parts
// of one kind can later go onto another (a creature sewn from others). Style: grim. Genes pick the look (presets of them are the styles), the stats shape
// it (cleverness: a bigger head, a smaller jaw; strength: the shoulders much more than the hips; agility: longer legs, slimmer; savagery: longer tusks,
// darker brows), a seed rolls them with the skin's hue, a scar and the
// gear (deterministic: the same seed, the same creature). One set of path data feeds two outputs: real SVG (crisp at any size) and a canvas (Path2D),
// which also gives the after-effects: pixel (the figure drawn as a small sprite), smooth (pixel, then grown with EPX), soft, and a boiling line.
// The in-game viewer opens with "#svgork" at the end of the address; the same file is the whole of the published viewer page. The game draws its imps with it (svg-figures.js).
const SvgRig=(()=>{
  const ell=(cx,cy,rx,ry)=>`M${cx-rx} ${cy} a${rx} ${ry} 0 1 0 ${2*rx} 0 a${rx} ${ry} 0 1 0 ${-2*rx} 0z`;
  // a path mirrored left to right: x negated (1), y kept (0); in an arc the end point's x is negated and the sweep turned round (2)
  // a path scaled by kx, ky and moved by dx, dy (absolute commands only: the paths fitted here have no relative ones); moved only: movePath
  function affPath(d,kx,ky,dx,dy){
    const X={ M:[1,2], L:[1,2], T:[1,2], Q:[1,2,1,2], C:[1,2,1,2,1,2], H:[1], V:[2] };
    let cmd='M', i=0; return d.replace(/[a-zA-Z]|-?\d*\.?\d+/g,tok=>{ if(/[a-zA-Z]/.test(tok)){ cmd=tok; i=0; return tok; } const pat=X[cmd]||[0], k=pat.length?pat[i%pat.length]:0; i++;
      return k===1?String(+(parseFloat(tok)*kx+dx).toFixed(2)):(k===2?String(+(parseFloat(tok)*ky+dy).toFixed(2)):tok); });
  }
  const movePath=(d,dx,dy)=>affPath(d,1,1,dx,dy);
  function mirror(d){
    const X={ M:[1,0], m:[1,0], L:[1,0], l:[1,0], T:[1,0], t:[1,0], Q:[1,0,1,0], q:[1,0,1,0], C:[1,0,1,0,1,0], c:[1,0,1,0,1,0], H:[1], h:[1], V:[0], v:[0], A:[0,0,0,0,2,1,0], a:[0,0,0,0,2,1,0], Z:[], z:[] };
    let cmd='M', i=0; return d.replace(/[a-zA-Z]|-?\d*\.?\d+/g,tok=>{ if(/[a-zA-Z]/.test(tok)){ cmd=tok; i=0; return tok; } const pat=X[cmd]||[0], k=pat.length?pat[i%pat.length]:0; i++;
      return k===1?String(-parseFloat(tok)):(k===2?String(1-parseFloat(tok)):tok); });
  }
  // ---- colours of each kind (the grim style); the skin and the eyes come from the genes (SKINS, EYES in the kind's table) ----
  // shapes: [path, fill key or null, stroke width (0 none), stroke key]
  const PAL={
    ork:{ skin:'#3c4730', light:'#4c583b', dark:'#20271a', shade:'rgba(0,0,0,0.3)', leg:'#2f3827', foot:'#15120f', belt:'#261c15', gold:'#9c907a', bone:'#c4b89c', line:'#070504', brow:'#11160d', eye:'#ff4a1e', pupil:'#200300', glow:'rgba(255,60,20,0.42)', mouth:'#140403', tongue:'#4a1410', iron:'#2c2c33', ironDark:'#17171b', wood:'#30231a', leather:'#261c15', cloth:'#3a0f0c', rust:'#6e3320', scar:'#7e705f' },
    imp:{ skin:'#7a3219', light:'#94431f', dark:'#3e140a', shade:'rgba(0,0,0,0.3)', leg:'#6a2b15', foot:'#1a0a05', belt:'#5a4228', gold:'#c9a040', ore:'#8a929c', bone:'#d2c29a', rope:'#8a1a10', line:'#080403', brow:'#260a04', eye:'#ffb020', socket:'#120604', glow:'rgba(255,150,30,0.45)', pupil:'#200300', mouth:'#160403', tongue:'#5a1a14', iron:'#44444c', ironDark:'#222228', wood:'#35261b', leather:'#33231a', sack:'#8a7452', sackDark:'#5e4c33', cloth:'#2e140c', rust:'#6e3320', scar:'#d89a70' }
  };
  const SKIN_KEYS=['skin','light','dark','leg','brow'];
  // a hand: a round fist with the fingers drawn on it (three seams across the front, the thumb on the side towards the body); its colour is the skin's,
  // or the armour's when the creature wears shoulder plates ('hand', 'handLine' are set when the rig is built)
  function fist(cx,cy,rx,ry,sw){       // (a right hand: the fingers point right, away from the body; the left one is this mirrored)
    const f=v=>(+v).toFixed(2), seam=y=>`M${f(cx+0.05*rx)} ${f(y)} q${f(0.45*rx)} ${f(0.12*ry)} ${f(0.9*rx)} 0`;
    return [[ell(cx,cy,rx,ry),'hand',sw],[[seam(cy-0.1*ry),seam(cy+0.3*ry),seam(cy+0.68*ry)].join(' '),null,sw*0.55,'handLine'],
      [`M${f(cx-rx*0.7)} ${f(cy-ry*0.45)} q${f(rx*0.55)} ${f(-ry*0.45)} ${f(rx*1.25)} ${f(-ry*0.1)}`,null,sw*0.6,'handLine']];
  }
  const f2=v=>+(+v).toFixed(2);
  // ---- the humanoids: one body plan for every kind (user, November 2026) ----
  // Every humanoid comes from the same generator (humanoidShapes): its kind's table entry (HUMANOIDS) gives the ranges of its measures, its genes (0..1)
  // pick the measures, the stats shape them the same way for every kind. From the measures come the body (shoulder line and width, waist, hips, legs,
  // head centre, width and height, chin, the points of the hands), the face of the kind on the head, and the gear:
  //   the helmet over the skull down to the brows, the breastplate from the shoulders to the waist, the shoulder plates on the shoulders,
  //   the belt across the hips, the loincloth from the belt down to the knees.
  // So a helmet fits a small imp head and a broad ork skull alike, as a weapon lands in the fist whatever the size (the user's rule).
  // Stats: strength the shoulders much more than the hips (and bigger hands, a little thicker legs), cleverness the head, agility the legs, savagery tusks and brows.
  // What a kind has of its own and does not change with the body: the imp's tail, the sack on its back and its loads.
  const IMP_T={
    tail:[['M2.5 -12 Q12 -9 14 -16 Q15.4 -21.6 19.6 -21',null,2.4,'line'],['M2.5 -12 Q12 -9 14 -16 Q15.4 -21.6 19.6 -21',null,1.3,'skin'],['M18.6 -23.6 L23 -20.4 L18.2 -18.8z','dark',1]], tailAt:[2.5,-12],
    sack:[['M-17.4 -13.2 Q-22.6 -21.4 -18 -28.4 Q-15.2 -32 -12.6 -32.8 L-9.6 -32.8 Q-7 -32 -4.6 -28.4 Q-0.4 -21.4 -5.6 -13.2 Q-11.5 -10.6 -17.4 -13.2z','sack',1.5],
        ['M-9 -31.4 Q-5.4 -29 -4.6 -24 Q-3.8 -18 -6.2 -14 Q-9 -12.4 -11 -12.2 Q-6.6 -16.6 -7 -23 Q-7.4 -28.6 -9 -31.4z','sackDark',0],
        ['M-13.2 -33.2 Q-11.1 -35.2 -9 -33.2 Q-7 -35.2 -5.4 -37.8 Q-7.4 -37 -8.6 -38.6 Q-9.8 -36.8 -11.2 -38.8 Q-12.4 -37 -14.2 -38.2 Q-15.8 -36.2 -16.6 -37.6 Q-15.8 -35 -13.2 -33.2z','sack',1.4],
        ['M-13.6 -33.4 Q-11.1 -31.8 -8.6 -33.4 M-13.4 -32.4 Q-11.1 -30.8 -8.8 -32.4',null,1.3,'rope'],['M-8.8 -33 q1.6 0.6 2 2.6 M-8.8 -33 q0.6 1.6 -0.4 3',null,1,'rope']], sackAt:[-8,-24],
    load:{ gold:[[ell(-12.6,-37.6,1.3,0.9),'gold',0.6],[ell(-10,-38.4,1.2,0.85),'gold',0.6],[ell(-11.2,-36.8,1.1,0.8),'gold',0.6]], ore:[['M-12.8 -37.4 l2 -1.6 l1.8 1.2 l-0.6 1.6 l-2 0.4z','ore',0.6],['M-9.6 -38.2 l1.4 -0.8 l1 1 l-1.2 1z','ore',0.6]] },
  };
  const EAR_KINK={ root:[['M-9.6 -38.4 L-14.2 -40.6 L-14.5 -38 L-10.2 -32.6z','skin',1.4],['M-10.6 -37.4 L-13.6 -39.1 L-13.7 -37.6 L-10.8 -34.4z','dark',0]],
    tip:[['M-14.2 -40.6 L-18 -42.4 L-14.5 -38z','skin',1.4],['M-14.6 -39.8 L-16.4 -41.2 L-14.8 -38.8z','dark',0]], at:[-9.9,-35.5], kink:[-14.35,-39.3] };
  const EAR_LOBE={ root:[['M-7.4 -39.2 Q-12.5 -42.4 -17.2 -40 Q-17.8 -37.4 -15 -35.8 Q-11 -34.6 -7.6 -34.4z','skin',1.4],['M-8.6 -38.2 Q-12.4 -40.4 -15.6 -38.8 Q-13.4 -36.6 -8.8 -35.8z','dark',0]], at:[-7.6,-36.8] };
  // the looks of a kind as presets of its genes (the imp's tried before: Bestie, Wicht, Knolle); "eigen" is genes of one's own.
  // Genes: kopf (head size), kinn (round .. pointed; the ork's jaw narrower), kopfForm / koerperForm / beinForm (oval .. round .. angular), fuss (the kind's
  // three feet), tief (how deep the head sits), koerper (gaunt .. round), beine (short .. long), augen (eye size), haut (the kind's three skins), augenFarbe, ohren (imp)
  const IMP_PRESETS={
    bestie:{ kopf:0.35, kinn:1, kopfForm:0.35, koerperForm:0.5, beinForm:0.3, fuss:0, tief:0.7, koerper:0.4, beine:0.35, augen:0.45, haut:0.5, augenFarbe:0, ohren:'spitz' },
    wicht:{ kopf:0.8, kinn:0.5, kopfForm:0.4, koerperForm:0.25, beinForm:0.1, fuss:0, tief:0.3, koerper:0, beine:1, augen:0.95, haut:1, augenFarbe:1, ohren:'spitz' },
    knolle:{ kopf:0.75, kinn:0, kopfForm:0.5, koerperForm:0.5, beinForm:0.55, fuss:0.5, tief:0.95, koerper:1, beine:0, augen:0.95, haut:0, augenFarbe:0, ohren:'spitz' }
  };
  const ORK_PRESETS={
    krieger:{ kopf:0.4, kinn:0.3, kopfForm:0.85, koerperForm:0.85, beinForm:0.8, fuss:0, tief:0.4, koerper:0.5, beine:0.5, augen:0.4, haut:0.5, augenFarbe:0 },
    brocken:{ kopf:0.1, kinn:0.05, kopfForm:0.95, koerperForm:0.7, beinForm:0.65, fuss:0, tief:1, koerper:1, beine:0.1, augen:0.2, haut:0.15, augenFarbe:0.1 },
    spaeher:{ kopf:0.65, kinn:0.85, kopfForm:0.3, koerperForm:0.35, beinForm:0.2, fuss:0.5, tief:0.1, koerper:0, beine:1, augen:0.7, haut:0.9, augenFarbe:1 }
  };
  const mix=(a,b,k)=>{ const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)); const A=p(a), B=p(b); return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*k).toString(16).padStart(2,'0')).join(''); };
  const mix3=(a,b,c,k)=>k<0.5?mix(a,b,k*2):mix(b,c,(k-0.5)*2);       // three colours along one gene
  // a closed form around (cx, cy), half width a, half height b: form 0 oval (narrower), 0.5 round, 1 angular (a superellipse towards a rectangle);
  // chin: the lower half runs to a point; top, bot: the width at the top and at the bottom (a taper: shoulders against hips)
  function formPts(cx,cy,a,b,form,chin,top,bot){
    const N=56, n=form<=0.5?2:2+8*(form-0.5)/0.5, ax=a*(form<0.5?0.8+0.4*form:1), pts=[];
    for(let i=0;i<N;i++){ const t=i/N*Math.PI*2-Math.PI/2, c=Math.cos(t), sn=Math.sin(t), u=Math.sign(c)*Math.abs(c)**(2/n), v=Math.sign(sn)*Math.abs(sn)**(2/n);
      let wv=((1-v)/2)*(top===undefined?1:top)+((1+v)/2)*(bot===undefined?1:bot); if(v>0&&chin) wv*=1-chin*0.85*v**1.5;
      pts.push([cx+u*ax*wv,cy+v*b]); }
    return pts;
  }
  const ptsPath=pts=>'M'+pts.map(([x,y])=>x.toFixed(2)+' '+y.toFixed(2)).join(' L')+'z';
  // the shaded side of a form: its right edge and a curve inside it
  function formShade(pts,cx){
    const mx=Math.max(...pts.map(q=>q[0])), right=pts.filter(([x])=>x>cx+0.25*(mx-cx)); if(right.length<3) return 'M0 0z';
    return ptsPath(right.concat(right.slice().reverse().map(([x,y])=>[cx+(x-cx)*0.62,y])));
  }
  // the part of a form above height y: from where its left side crosses y, round over the top, to where its right side crosses it (the crossings exact:
  // an angular form has few points along its sides)
  function above(pts,y){
    const run=pts.slice(pts.length/2).concat(pts.slice(0,pts.length/2)), out=[];       // from the lowest point: left side up, the top, right side down
    for(let i=0;i<run.length;i++){ const a=run[i], b=run[(i+1)%run.length];
      if(a[1]<=y) out.push(a);
      if((a[1]-y)*(b[1]-y)<0) out.push([a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]),y]); }
    return out;
  }
  // the half width of a form at height y
  function widthAt(pts,y){ let w=0; for(let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length]; if((a[1]-y)*(b[1]-y)<=0&&a[1]!==b[1]) w=Math.max(w,Math.abs(a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]))); } return w; }
  // the colours from the genes: the skin along the kind's three skins, the eyes between its two colours
  function palOf(K,g){
    const P=Object.assign({},K.base), [s0,s1,s2]=K.skins, e=g.augenFarbe||0;
    SKIN_KEYS.forEach(k=>{ P[k]=mix3(s0[k],s1[k],s2[k],g.haut===undefined?0.5:g.haut); });
    P.eye=mix(K.eye[0],K.eye[1],e); if(K.socket) P.socket=mix(K.socket[0],K.socket[1],e);
    P.glow=`rgba(${K.glow[0].map((v,i)=>Math.round(v+(K.glow[1][i]-v)*e)).join(',')},${K.glowA})`;
    return P;
  }
  // ---- the faces: what a kind has on its head, fitted to the head (aw: its half width, h: its height, top, cy: its middle, chinY: the chin) ----
  // browY: the line the helmet's rim sits on
  const FACES={
    // the imp: big eye pits with a glowing spark, thin brows, no mouth (it eats nothing and never complains)
    imp({ aw, cy },g){
      const erx=2.4+1.6*g.augen, ery=erx*1.18, ex=-Math.min(aw*0.5,erx+0.6), ey=cy+1, s=erx/3.1, bp=(dx,dy)=>`${f2(ex+dx*s)} ${f2(ey+dy*s)}`;
      return { eye:[[ell(f2(ex),f2(ey),f2(erx),f2(ery)),'socket',0]], pupil:[[ell(f2(ex+0.3),f2(ey+0.4),f2(erx*0.55),f2(erx*0.55)),'glow',0],[ell(f2(ex+0.3),f2(ey+0.4),f2(erx*0.27),f2(erx*0.27)),'eye',0]],
        eyeAt:[f2(ex),f2(ey)], pupilIn:0.3, lookK:0.6+0.6*g.augen, lid:[[`M${f2(ex-erx)} ${f2(ey)} q${f2(erx)} 1.4 ${f2(2*erx)} 0`,null,1.3,'line']],
        brow:[[`M${bp(-3.6,-4.2)} L${bp(2.6,-2.6)} L${bp(2.4,-3.8)} L${bp(-3.2,-5.8)}z`,'brow',0]], browAt:[f2(ex+0.3*s),f2(ey-4*s)], browY:ey-ery*0.85,
        mouth:[], jaw:[], mouthAt:[0,f2(cy+4)], jawAt:[0,f2(cy+4)] };
    },
    // the ork: small glowing slit eyes under heavy brows, an underbite jaw with the mouth behind it and tusks out of it (drawn for a head 19 wide and 14.5 high)
    ork({ aw, h, top, chinY },g){
      const kx=aw/9.5, ky=h/14.5, at=(d,x,y)=>affPath(d,kx,ky,x,y);
      const ex=-aw*0.45, ey=top+h*0.6, erx=(1.4+0.8*g.augen)*kx, ery=erx*0.55, jt=chinY-1.5*ky, jb=jt+8*ky, wb=aw*(0.62-0.3*g.kinn);
      return { eye:[[ell(f2(ex),f2(ey),f2(erx*1.7),f2(ery*2)),'glow',0],[ell(f2(ex),f2(ey),f2(erx),f2(ery)),'eye',0]], pupil:[[ell(f2(ex+0.2*kx),f2(ey),f2(0.4*kx),f2(ery*0.9)),'pupil',0]],
        eyeAt:[f2(ex),f2(ey)], pupilIn:0.2, lookK:0.45, lid:[[`M${f2(ex-erx*1.1)} ${f2(ey)} L${f2(ex+erx*1.1)} ${f2(ey)}`,null,1.4,'line']],
        brow:[[at('M-4.7 -3 L2.7 -1 L2.5 -2.6 L-4.3 -5z',ex,ey),'brow',0]], browAt:[f2(ex-0.7*kx),f2(ey-2.4*ky)], browY:ey-2.2*ky,
        mouth:[[ell(0,f2(jt+3.7*ky),f2(6.8*kx),f2(2.4*ky)),'mouth',1.4],[ell(0,f2(jt+4.3*ky),f2(3*kx),f2(0.9*ky)),'tongue',0]], mouthAt:[0,f2(jt+3.5*ky)],
        jaw:[[ptsPath([[-1.1*aw,jt],[1.1*aw,jt],[aw,jt+5*ky],[wb,jb],[-wb,jb],[-aw,jt+5*ky]]),'light',1.8],[ptsPath([[0.4*aw,jt],[1.1*aw,jt],[aw,jt+5*ky],[wb,jb],[wb*0.5,jb],[0.62*aw,jt+4.5*ky]]),'shade',0]],
        jawAt:[0,f2(jt+1.5*ky)], tusk:[[at('M-1 0 Q-3 -5 -0.6 -10 L0.6 -5.5 Q0.6 -2.5 1.2 0z',-0.7*aw,jt+4.5*ky),'bone',1.3]], tuskAt:[f2(-0.7*aw),f2(jt+4.5*ky)] };
    }
  };
  // ---- the feet: a part of their own (in front of the leg, behind it from the back); xc: the leg's middle, lw: its width, u: the size of the kind ----
  function footShapes(type,xc,lw,u,sw){
    const s=Math.max(0.9,lw/3.4);
    if(type==='claws') return [[`M${f2(xc-2.6*s)} 0.2 l${f2(0.9*s)} ${f2(-1.7*s)} M${f2(xc-0.6*s)} 0.2 l${f2(0.4*s)} ${f2(-1.9*s)} M${f2(xc+1.3*s)} 0.2 l${f2(0.1*s)} ${f2(-1.7*s)}`,null,1.1,'bone']];
    if(type==='paws') return [[ell(f2(xc),f2(-0.7*u),f2(lw*0.8),f2(1.3*u)),'leg',sw*0.9],[`M${f2(xc-0.6*s)} ${f2(-1.2*u)} l0 ${f2(1.4*u)} M${f2(xc+0.6*s)} ${f2(-1.2*u)} l0 ${f2(1.4*u)}`,null,0.8,'dark']];
    if(type==='boots') return [[`M${f2(xc-lw*0.56)} ${f2(-2.6*u)} L${f2(xc+lw*0.52)} ${f2(-2.6*u)} L${f2(xc+lw*0.55)} 0 L${f2(xc-lw*0.72)} 0z`,'foot',sw*0.75],[`M${f2(xc-lw*0.56)} ${f2(-2.6*u)} L${f2(xc+lw*0.52)} ${f2(-2.6*u)}`,null,sw*0.6,'leather']];
    if(type==='wraps') return [[`M${f2(xc-lw*0.5)} ${f2(-5.4*u)} l${f2(lw)} ${f2(0.8*u)} M${f2(xc-lw*0.52)} ${f2(-3.9*u)} l${f2(lw*1.04)} ${f2(0.8*u)} M${f2(xc-lw*0.54)} ${f2(-2.4*u)} l${f2(lw*1.08)} ${f2(0.8*u)}`,null,sw*0.8,'cloth'],
      [`M${f2(xc-lw*0.62)} 0 L${f2(xc-lw*0.55)} ${f2(-1.2*u)} L${f2(xc+lw*0.5)} ${f2(-1.2*u)} L${f2(xc+lw*0.6)} 0z`,'foot',sw*0.75]];
    return [[`M${f2(xc-lw*0.85)} 0 L${f2(xc-lw*0.75)} ${f2(-2.2*u)} L${f2(xc+lw*0.8)} ${f2(-2.2*u)} L${f2(xc+lw*0.95)} 0z`,'foot',sw*0.9]];       // clumps
  }
  // ---- the gear, computed from the body plan A (it lands on the right part at any size) ----
  const GEAR={
    // the helmet: the skull's upper part, a little bigger, down to the brows; a rim, a ridge, a nose guard (not from behind), horns for those who wear them
    helmet(A,K,back,style){
      const { hPts, top, h, aw, browY, sw }=A, hc=top+h/2, hu=aw/9.5, shell=above(hPts,browY).map(([x,y])=>[x*1.1,hc+(y-hc)*1.08]);
      if(shell.length<4) return [];
      const rw=Math.max(...shell.map(q=>Math.abs(q[0])))*1.02, ry=Math.max(...shell.map(q=>q[1])), out=[];
      if(style==='horns'){ const horn='M0 0 Q-6.5 -2 -8.5 -10.5 Q-3 -5.5 2.5 -2z', hd=affPath(horn,hu,hu,-aw*0.8,top+h*0.16); out.push([hd,'bone',sw*0.85],[mirror(hd),'bone',sw*0.85]); }
      if(style==='crest') out.push([affPath('M-1.6 1 L-0.9 -6.5 L4.5 -6 L2.2 1.2z',hu,hu,0,top),'cloth',sw*0.8]);       // a crest along the top
      out.push([ptsPath(shell),'iron',sw],[formShade(shell,0),'shade',0],
        [`M${f2(-rw)} ${f2(ry-1.1*hu)} L${f2(rw)} ${f2(ry-1.1*hu)} L${f2(rw*0.97)} ${f2(ry+0.7*hu)} L${f2(-rw*0.97)} ${f2(ry+0.7*hu)}z`,'ironDark',sw*0.8],
        [`M0 ${f2(top-h*0.02)} L0 ${f2(ry-1.1*hu)}`,null,sw*0.7,'ironDark']);
      if(!back) out.push([`M${f2(-0.7*hu)} ${f2(ry)} L${f2(0.7*hu)} ${f2(ry)} L${f2(0.45*hu)} ${f2(ry+h*0.2)} L${f2(-0.45*hu)} ${f2(ry+h*0.2)}z`,'ironDark',sw*0.6]);
      return out;
    },
    // the breastplate: the body's own outline from the shoulders down to the waist, a straight neckline, a point at the bottom
    chest(A){
      const { bPts, topY, hipY, bodyH, u, sw }=A, yc=hipY-bodyH*0.3, yt=topY+0.6*u;
      const pts=above(bPts,yc).map(([x,y])=>[x*1.05,Math.max(y,yt)]).concat([[0,yc+2.6*u]]), w=widthAt(pts,yt+2*u);
      return [[ptsPath(pts),'iron',sw],[`M0 ${f2(yt+0.4*u)} L0 ${f2(yc+1.8*u)}`,null,sw*0.6,'ironDark'],
        [`M${f2(-w*0.6)} ${f2(yt+3*u)} l${f2(1.4*u)} ${f2(4*u)} M${f2(w*0.45)} ${f2(yt+2.4*u)} l${f2(0.7*u)} ${f2(3.4*u)}`,null,sw*0.6,'rust'],[formShade(pts,0),'shade',0]];
    },
    // the shield in the left hand (its grip at the fist, the fist drawn over it): a round buckler, a kite or a tower, as big as the shoulders are broad
    shield(A,family,at){
      const { wSh, sw }=A, r=wSh*(family==='tower'?0.62:(family==='kite'?0.58:0.45)), [x,y]=at;
      const face=family==='tower'?affPath('M-0.8 -1.4 L0.8 -1.4 L0.8 1.3 L-0.8 1.3z',r,r,x,y):(family==='kite'?affPath('M-1 -1.1 L1 -1.1 L0.9 0.3 L0 1.45 L-0.9 0.3z',r,r,x,y):ell(f2(x),f2(y),f2(r),f2(r)));
      return [[face,'wood',sw],[face,null,sw*0.7,'iron'],[family==='buckler'||!family?ell(f2(x),f2(y),f2(r*0.3),f2(r*0.3)):affPath('M-0.12 -1 L0.12 -1 L0.12 1 L-0.12 1z',r,r,x,y),'iron',sw*0.6]];
    },
  // the left shoulder plate (the right one is it mirrored): on the shoulder, as big as the shoulders are broad, with a spike
    pauldron(A){
      const { wSh, topY, bodyH, bPts, sw }=A, k=wSh/15, y=topY+bodyH*0.16, x=-widthAt(bPts,y)*0.88;       // on the body's edge at that height, whatever its form
      return { at:[f2(x),f2(y)], shapes:[[affPath('M-1.5 -3.5 L-7 -11 L1 -4.5z',k,k,x,y),'ironDark',sw*0.75],[affPath('M-4 -0.5 L2.5 -5.5 L5 0.5 L1 5 L-4.5 3.5z',k,k,x,y),'iron',sw],[affPath('M2.5 -5.5 L5 0.5 L1 5 L1.6 -0.2z',k,k,x,y),'shade',0]] };
    },
    // the belt across the hips: a rope (the imp) or a band with a buckle
    belt(A,K){
      const { hipY, wHip, bPts, u, sw }=A;
      if(K.belt==='rope') return { belt:[[`M${f2(-wHip-0.6)} ${f2(hipY-2.4)} Q0 ${f2(hipY+0.4)} ${f2(wHip+0.6)} ${f2(hipY-2.4)}`,null,1.6,'belt']], buckle:[[ell(f2(-wHip*0.55),f2(hipY-0.6),1.9,1.7),'leather',1.1]] };
      const y0=hipY-4.5*u, y1=hipY-0.6*u, w0=widthAt(bPts,y0)*1.03, w1=widthAt(bPts,y1)*1.03, by=(y0+y1)/2;
      return { belt:[[`M${f2(-w0)} ${f2(y0)} L${f2(w0)} ${f2(y0)} L${f2(w1)} ${f2(y1)} L${f2(-w1)} ${f2(y1)}z`,'belt',sw*0.9]],
        buckle:[[ell(0,f2(by),f2(2.2*u),f2(1.9*u)),'gold',1.2],[ell(f2(-0.75*u),f2(by-0.2*u),f2(0.5*u),f2(0.5*u)),'line',0],[ell(f2(0.75*u),f2(by-0.2*u),f2(0.5*u),f2(0.5*u)),'line',0]] };
    },
    // the loincloth: from the belt down to the knees, as broad as the hips
    cloth(A){
      const { hipY, wHip, sw }=A, kx=wHip*0.55/4.6, ky=-hipY/10;
      return [[affPath('M-4.6 0 L4.6 0 L5.4 6.6 L3.6 5.2 L2 8 L0 5.8 L-2 8 L-3.6 5.2 L-5.4 6.6z',kx,ky,0,hipY-ky),'cloth',sw*0.85]];
    }
  };
  // ---- the kinds: the ranges of their measures [at gene 0, more at gene 1], their colours, face, feet, gear, extras ----
  const HUMANOIDS={
    imp:{ px:24, worker:true, hipY:-10, bodyH:[13.6,3.8], hip:[5.6,6], sh:[6,3], legW:[2.2,1.8], legX:0.5, legK:[0.8,0.6], line:1.4,
      head:{ w:[7,2.6], h:[16.5,4.5], chinH:0.2, chinK:1, over:1.6, sink:8 }, hand:[2.4,0.6], handOut:4.5, handGap:2, pad:3,
      face:'imp', feet:['claws','paws','clumps'], belt:'rope', helm:'plain', ears:true, sack:true, tail:true, scar:false,
      weapons:['pick','club'], weapon:'pick', presets:IMP_PRESETS, base:PAL.imp,
      skins:[{ skin:'#8c3a1c', light:'#a8522a', dark:'#46160a', leg:'#7a3018', brow:'#2a0c06' },{ skin:'#7a3219', light:'#94431f', dark:'#3e140a', leg:'#6a2b15', brow:'#260a04' },{ skin:'#5a3a34', light:'#6e4a42', dark:'#2a1714', leg:'#4e322d', brow:'#1a0d0b' }],
      eye:['#ffb020','#c4f4ff'], socket:['#120604','#05070a'], glow:[[255,150,30],[120,220,255]], glowA:0.48 },
    ork:{ px:48, hipY:-12, bodyH:[24,4], hip:[8.5,3], sh:[13,3], legW:[5.2,2], legX:0.55, legK:[1,0.3], line:1.7,
      head:{ w:[8,2], h:[13,3], chinH:0.1, chinK:0.3, over:3.5, sink:4 }, hand:[3.2,0.6], handOut:4, handGap:3, pad:9,
      face:'ork', feet:['boots','wraps','claws'], belt:'band', helm:'horns', scar:true,
      weapons:['axe','club','sword','hammer','spear','dagger','bow','staff'], weapon:'axe', presets:ORK_PRESETS, base:PAL.ork,
      skins:[{ skin:'#3a5228', light:'#4a6534', dark:'#1e2c14', leg:'#2e4220', brow:'#0f180a' },{ skin:'#3c4730', light:'#4c583b', dark:'#20271a', leg:'#2f3827', brow:'#11160d' },{ skin:'#4a463c', light:'#5a554a', dark:'#26231e', leg:'#3a3730', brow:'#15130f' }],
      eye:['#ff4a1e','#f0d040'], glow:[[255,60,20],[240,200,40]], glowA:0.42 }
  };
  // one humanoid's parts from its kind, genes and stats (back: seen from behind)
  function humanoidShapes(kind,g,t,back,G){
    const K=HUMANOIDS[kind], lin=(r,v)=>r[0]+r[1]*v, sw=K.line, mvS=(sh,dx,dy)=>sh.map(([d,c,w,st])=>[movePath(d,dx,dy),c,w,st]);
    t=Object.assign({ stark:0.5 },t||{});
    const plump=g.koerper, hipY=K.hipY, u=-hipY/10, bodyH=lin(K.bodyH,plump), topY=hipY-bodyH;
    const wHip=lin(K.hip,plump)*(0.95+0.1*t.stark), wSh=lin(K.sh,plump)*(0.8+0.5*t.stark);       // strength: the shoulders much more than the hips
    // the legs: the form axis (slim and oval, round and stout, angular and blocky), the thickness with the body; the foot of the kind
    const xc=-wHip*K.legX, lw=lin(K.legW,plump)*(0.95+0.1*t.stark), lf=g.beinForm===undefined?0.5:g.beinForm, ft=g.fuss===undefined?0:g.fuss;
    const lPts=formPts(xc,hipY/2-0.6*u,lw/2*(lf<0.5?1.15:1),-hipY/2+0.6*u,lf,0,1.1,0.75), leg=[[ptsPath(lPts),'leg',sw*0.95],[formShade(lPts,xc),'shade',0]];
    const fType=K.feet[Math.min(2,Math.floor(ft*3))], foot=footShapes(fType,xc,lw,u,sw);
    // the body: from the hips up to the shoulders, oval, round or angular; ribs when gaunt, a belly when round
    const bTop=topY-1.4*u, bBot=hipY+1.6*u, bPts=formPts(0,(bTop+bBot)/2,1,(bBot-bTop)/2,g.koerperForm===undefined?0.5:g.koerperForm,0,wSh*1.12,wHip*1.3);
    const body=[[ptsPath(bPts),'skin',sw],[formShade(bPts,0),'shade',0]];
    if(plump<0.35){ const rx=wSh*0.62; body.push([[0.32,0.5,0.68].map(k=>hipY-bodyH*k).map(y=>`M${f2(-rx)} ${f2(y)} l${f2(2.4*u)} ${f2(0.7*u)} M${f2(rx)} ${f2(y)} l${f2(-2.4*u)} ${f2(0.7*u)}`).join(' '),null,0.9*u,'dark']); }
    const bx=wHip*0.5, by1=hipY-bodyH*0.55, by2=hipY-1*u;
    const belly=plump>=0.3?[[`M${f2(-bx)} ${f2(by1)} Q0 ${f2(by1+3.5*u)} ${f2(bx)} ${f2(by1)} Q${f2(bx*0.75)} ${f2(by2-0.5*u)} 0 ${f2(by2)} Q${f2(-bx*0.75)} ${f2(by2-0.5*u)} ${f2(-bx)} ${f2(by1)}z`,'light',0]]:[];
    // the head: oval, round or angular, the chin to a point, on top of the shoulders; the face of the kind on it
    const HD=K.head, hf=g.kopfForm===undefined?0.5:g.kopfForm, w=lin(HD.w,g.kopf), p=g.kinn, h=lin(HD.h,g.kopf)*(1+HD.chinH*p), chinY=topY+HD.over*u, top=chinY-h, cy=top+h*0.45;
    const hPts=formPts(0,top+h/2,w,h/2,hf,p*HD.chinK), aw=w*(hf<0.5?0.8+0.4*hf:1), skull=[[ptsPath(hPts),'skin',sw],[formShade(hPts,0),'shade',0]];
    const face=FACES[K.face]({ aw, h, top, cy, chinY },g);
    // the body plan the gear is fitted to
    const A={ topY, hipY, wSh, wHip, bodyH, bPts, hPts, top, h, aw, browY:face.browY, u, sw }, pd=GEAR.pauldron(A);
    const hr=lin(K.hand,plump)*(0.9+0.25*t.stark), handAt=[f2(wSh+K.handOut*u),f2(hipY-bodyH*0.42)], headY=(g.tief||0)*HD.sink, legK=lin(K.legK,g.beine===undefined?0.5:g.beine);
    const S=Object.assign({ shadow:[[ell(0,f2(1.2*u),f2(wHip+2*u),f2(2*u)),'shadowC',0]], leg, foot, footClaws:fType==='claws', hip:[f2(xc),hipY], body, belly,
      neck:[0,f2(topY+1*u)], skull, scar:K.scar?[[`M${f2(-aw*0.75)} ${f2(top+h*0.22)} L${f2(-aw*0.2)} ${f2(top+h*0.72)}`,null,1.1,'scar']]:null,
      helmet:GEAR.helmet(A,K,back,(G&&G.helmStyle)||K.helm), shield:G&&G.shield?GEAR.shield(A,G.shield,[-handAt[0],handAt[1]]):null, chest:GEAR.chest(A), pauldron:pd.shapes, pauldronAt:pd.at, cloth:GEAR.cloth(A),
      fist:fist(handAt[0],handAt[1],f2(hr),f2(hr*0.92),sw*0.95), handAt, handGap:K.handGap,
      horn:null, look:{ ears:!!K.ears, horns:false }, headY, legK, px:K.px,
      headBox:[-aw*0.6,top+h*0.15,aw*0.6,top+h*0.62], bodyBox:[-wSh*0.6,topY+2*u,wSh*0.6,hipY-3*u],
      H:Math.round(-hipY*(legK-1)+(-top)-headY+K.pad) },face,GEAR.belt(A,K));
    if(K.ears){       // the ears: pointed with a kink, or lobes; at the side of the head, as big as the head
      const ax=-aw*0.93, ay=cy-h*0.05, E=g.ohren==='lappen'?EAR_LOBE:EAR_KINK, dx=ax-E.at[0], dy=ay-E.at[1];
      Object.assign(S,g.ohren==='lappen'?{ ear:mvS(E.root,dx,dy), earTip:null, earAt:[ax,ay], earGrow:true }:{ ear:mvS(E.root,dx,dy), earTip:mvS(E.tip,dx,dy), earAt:[ax,ay], kinkAt:[E.kink[0]+dx,E.kink[1]+dy], earGrow:'kink' },{ earScale:w/8 });
    }
    if(K.sack) Object.assign(S,{ sack:mvS(IMP_T.sack,-(wSh-7.5),topY+24), sackAt:[-11.5-(wSh-7.5),topY+1], load:{ gold:mvS(IMP_T.load.gold,-(wSh-7.5),topY+24), ore:mvS(IMP_T.load.ore,-(wSh-7.5),topY+24) } });
    if(K.tail) Object.assign(S,{ tail:IMP_T.tail, tailAt:IMP_T.tailAt });
    return S;
  }
  // tools and weapons any kind can hold
  const WEAPONS={
    axe:[['M23 -5 L24.6 -5 L24.6 -44 L23 -44z','wood',1.4],['M24.6 -43 L35 -47 L33 -40 L36 -34 L33 -27 L24.6 -30z','iron',1.4],['M30 -44 L31 -41 M33 -33 L31.5 -31',null,1,'rust']],
    club:[['M22 -6 L25 -6 L28.5 -37 Q24 -45 18.5 -37z','wood',1.6],['M19 -36 l-3 -1 M28 -36 l3 -1 M20.5 -30 l-3 0 M27 -30 l3 0',null,1.4,'ironDark']],
    sword:[['M23.2 -15 L24.8 -15 L24.8 -45 L24 -48 L23.2 -45z','iron',1.3],['M19.5 -15 L28.5 -15 L28.5 -13 L19.5 -13z','ironDark',1.2],['M23.2 -13 L24.8 -13 L24.8 -7 L23.2 -7z','wood',1]],
    pick:[['M23.2 -4 L24.8 -4 L24.8 -30 L23.2 -30z','wood',1.2],['M15 -29 Q24 -34.4 33 -29 L33 -27.4 Q24 -31.6 15 -27.4z','iron',1.2]],
    hammer:[['M23.2 -5 L24.8 -5 L24.8 -38 L23.2 -38z','wood',1.3],['M17.5 -43.5 L30.5 -43.5 L30.5 -35 L17.5 -35z','iron',1.4],['M19.5 -43.5 L19.5 -35 M28.5 -43.5 L28.5 -35',null,1,'ironDark']],
    dagger:[['M23.3 -14 L24.7 -14 L24.7 -26 L24 -29 L23.3 -26z','iron',1.1],['M21.5 -14 L26.5 -14 L26.5 -12.8 L21.5 -12.8z','ironDark',1],['M23.3 -12.8 L24.7 -12.8 L24.7 -8.5 L23.3 -8.5z','wood',0.9]],
    spear:[['M23.4 2 L24.6 2 L24.6 -46 L23.4 -46z','wood',1.2],['M22.2 -45.5 L25.8 -45.5 L24 -55z','iron',1.2]],
    bow:[['M24 -5 Q35 -24 24 -43',null,2.6,'line'],['M24 -5 Q35 -24 24 -43',null,1.5,'wood'],['M24 -5 L24 -43',null,0.6,'bone']],
    staff:[['M23.3 -2 L24.7 -2 L24.7 -45 L23.3 -45z','wood',1.2],[ell(24,-48,3.6,3.6),'glow',0],[ell(24,-48,1.9,1.9),'eye',1,'line']]
  };
  // the armour's materials in the grim style: plate and its dark seams
  const MATERIALS={ leder:['#4a3424','#2a1c12'], bronze:['#6e5226','#3c2a12'], eisen:['#2c2c33','#17171b'], stahl:['#4c5560','#262c34'], schwarz:['#1c1c22','#0b0b0f'] };
  // where each is held (its grip, in its own coordinates)
  const GRIP={ axe:[24,-15], club:[23.5,-12], sword:[24,-10], pick:[24,-12], hammer:[24,-14], dagger:[24,-10.6], spear:[24,-18], bow:[29.5,-24], staff:[24,-17] };
  // ---- a spec: kind, style (a preset or "eigen"), genes, stats 0..1, gear, hue shift, scar; the seed rolls one ----
  function rng(seed){ let a=seed>>>0||1; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  const kindOf=kind=>HUMANOIDS[kind]?kind:'ork';
  const stylesOf=kind=>Object.keys(HUMANOIDS[kindOf(kind)].presets).concat(['eigen']);
  const presetsOf=kind=>HUMANOIDS[kindOf(kind)].presets;
  // the genes of a spec: its style's preset (or the kind's first), its own genes over it
  const genesOf=spec=>{ const K=HUMANOIDS[kindOf(spec.kind)], ps=K.presets; return Object.assign({},ps[Object.keys(ps)[0]],ps[spec.style]||{},spec.genes||{}); };
  function roll(seed,kind){
    const r=rng(seed), pick=a=>a[Math.floor(r()*a.length)]; kind=kindOf(kind); const K=HUMANOIDS[kind]; pick(stylesOf(kind));       // (a style was drawn here once; kept so every seed keeps its look)
    const genes={ kopf:r(), kinn:r(), kopfForm:r(), koerperForm:r(), beinForm:r(), fuss:r(), tief:r(), koerper:r(), beine:r(), augen:0.3+0.7*r(), haut:r(), augenFarbe:r()<0.6?r()*0.3:0.6+0.4*r(), ohren:r()<0.6?'spitz':'lappen' };
    return { kind, style:'eigen', genes, traits:{ klug:r(), stark:r(), flink:r(), wild:r() }, hue:(r()*2-1)*12, scar:r()<0.4,
      gear:{ helmet:r()<0.5, chest:r()<0.5, pauldrons:r()<0.45, cloth:r()<0.6, weapon:pick(['none'].concat(K.weapons)), hands:true, load:pick(['none','gold','ore']), ears:!!K.ears||r()<0.5, horns:false }, level:1+Math.floor(r()*12), seed };       // an imp always has its ears (they show its level)
  }
  function defaults(kind){
    kind=kindOf(kind); const K=HUMANOIDS[kind], first=Object.keys(K.presets)[0];
    return { kind, style:first, genes:Object.assign({},K.presets[first]), traits:{ klug:0.5, stark:0.5, flink:0.5, wild:0.5 }, hue:0, scar:!!K.scar,
      gear:{ helmet:!K.worker, chest:false, pauldrons:!K.worker, cloth:true, weapon:K.weapon, hands:true, load:'gold' } };       // a worker (the imp) wears no armour
  }
  // colours: the kind's and style's, the skin turned by the hue shift
  function hueShift(hex,deg){
    if(!deg||hex[0]!=='#') return hex; const n=parseInt(hex.slice(1),16); let r=(n>>16&255)/255, g=(n>>8&255)/255, b=(n&255)/255;
    const mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2, d=mx-mn; let h=0, s=0;
    if(d){ s=d/(1-Math.abs(2*l-1)); h=mx===r?((g-b)/d)%6:(mx===g?(b-r)/d+2:(r-g)/d+4); h*=60; }
    h=(h+deg+360)%360; const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2; let rr=0, gg=0, bb=0;
    if(h<60){ rr=c; gg=x; } else if(h<120){ rr=x; gg=c; } else if(h<180){ gg=c; bb=x; } else if(h<240){ gg=x; bb=c; } else if(h<300){ rr=x; bb=c; } else { rr=c; bb=x; }
    const to=v=>Math.round((v+m)*255).toString(16).padStart(2,'0'); return '#'+to(rr)+to(gg)+to(bb);
  }
  // ---- building a rig from a spec: the tree of parts (pivot, shapes, children) and each part's resting transform ----
  // scars (user: whoever is knocked out gets one): each has a fixed place from the seed and its number, every other one on the head, the rest on the body
  function scarShapes(n,box,seed,odd){
    const out=[]; for(let i=odd?1:0;i<n;i+=2){ const r=rng((seed||17)*7919+i*104729+1), x=box[0]+(box[2]-box[0])*r(), y=box[1]+(box[3]-box[1])*r(), a=r()*Math.PI, L=3.6+2.8*r(), dx=Math.cos(a)*L/2, dy=Math.sin(a)*L/2, nx=-dy/L*1.6, ny=dx/L*1.6;
      out.push([`M${(x-dx).toFixed(2)} ${(y-dy).toFixed(2)} L${(x+dx).toFixed(2)} ${(y+dy).toFixed(2)} M${(x-nx-dx*0.3).toFixed(2)} ${(y-ny-dy*0.3).toFixed(2)} l${(2*nx).toFixed(2)} ${(2*ny).toFixed(2)} M${(x-nx+dx*0.3).toFixed(2)} ${(y-ny+dy*0.3).toFixed(2)} l${(2*nx).toFixed(2)} ${(2*ny).toFixed(2)}`,null,1.25,'scar']); }
    return out;
  }
  function build(spec){
    const kind=kindOf(spec&&spec.kind), K=HUMANOIDS[kind], own=spec&&spec.genes; spec=Object.assign({},defaults(kind),spec||{}); spec.kind=kind;
    if(!stylesOf(kind).includes(spec.style)) spec.style=stylesOf(kind)[0];
    const genes=genesOf({ kind, style:spec.style, genes:own }), t=Object.assign({},defaults(kind).traits,spec.traits), G=Object.assign({},defaults(kind).gear,spec.gear), back=spec.view==='back';
    const S=humanoidShapes(kind,genes,t,back,G);
    const pal=Object.assign({ shadowC:'rgba(0,0,0,0.35)' },palOf(K,genes)); SKIN_KEYS.forEach(k=>{ pal[k]=hueShift(pal[k],spec.hue); });
    const M=MATERIALS[G.mat]; if(M){ pal.iron=M[0]; pal.ironDark=M[1]; }       // the armour's material (the game's: leather, bronze, iron, steel)
    const armoured=!!G.pauldrons; pal.hand=armoured?pal.iron:pal.skin; pal.handLine=armoured?pal.ironDark:pal.dark;       // the hands: skin, or armour with the shoulder plates
    const P=(id,pivot,shapes,kids)=>({ id, pivot, shapes:shapes||[], kids:(kids||[]).filter(Boolean) });
    const mirrorShapes=sh=>sh.map(([d,f,w,st])=>[mirror(d),f,w,st]);
    const shiftX=(sh,dx)=>sh.map(([d,f,w,st])=>[d.replace(/^M(-?[\d.]+)/,(m0,x)=>'M'+(parseFloat(x)+dx).toFixed(2)),f,w,st]);       // ellipses moved over keep their shape
    const ex=S.eyeAt, br=S.browAt, R=v=>[-v[0],v[1]], ears=!!K.ears&&G.ears!==false;
    const lvl=Math.max(1,Math.min(12,spec.level||1)), earK=S.earGrow?(lvl-1)/11:0;       // earK: how far the ears have grown (0 at level 1, 1 at 12)
    const grow=Math.min(1,(lvl-1)/5), sag=Math.max(0,(lvl-6)/6);       // kinked ears: out until level 6, then down
    const nScars=spec.scars||0, seed=spec.seed||17, hy=S.neck[1];
    const earParts=ears&&S.ear?[P('earL',S.earAt,S.ear,S.earTip?[P('earTipL',S.kinkAt,S.earTip)]:[]),P('earR',R(S.earAt),mirrorShapes(S.ear),S.earTip?[P('earTipR',R(S.kinkAt),mirrorShapes(S.earTip))]:[])]:[];
    const skullPart=P('skull',[0,hy-4],S.skull,[!back&&spec.scar&&S.scar?P('scar',[0,hy-7],S.scar):null,
        nScars&&S.headBox?P('scarsHead',[0,hy-4],scarShapes(nScars,S.headBox,seed,false)):null]);
    const helmet=G.helmet&&S.helmet.length?P('helmet',[0,hy-8],S.helmet):null;
    const headKids=back?[skullPart].concat(earParts,[helmet]):earParts.concat([       // seen from the front the ears lie behind the head (no seam)
      skullPart, helmet,
      P('mouth',S.mouthAt,S.mouth),
      P('jaw',S.jawAt,S.jaw,S.tusk?[P('tuskL',S.tuskAt,S.tusk),P('tuskR',R(S.tuskAt),mirrorShapes(S.tusk))]:[]),
      P('eyeL',ex,S.eye,[P('pupilL',ex,S.pupil)]),
      P('eyeR',R(ex),shiftX(S.eye,-2*ex[0]),[P('pupilR',R(ex),shiftX(S.pupil,-2*ex[0]-2*(S.pupilIn||0)))]),
      P('lidL',ex,S.lid), P('lidR',R(ex),mirrorShapes(S.lid)),
      P('browL',br,S.brow), P('browR',R(br),mirrorShapes(S.brow))
    ]);
    const bb=S.bodyBox, mid=(bb[1]+bb[3])/2;
    const bodyKids=[
      back?P('spine',[0,mid],[[`M0 ${(bb[1]-1).toFixed(2)} L0 ${(bb[3]+2).toFixed(2)}`,null,1.1,'dark']]):P('belly',[0,mid],S.belly),
      nScars>1?P('scarsBody',[0,mid],scarShapes(nScars,bb,seed,true)):null,
      G.chest?P('chest',[0,mid-2],S.chest):null,
      G.cloth?P('cloth',[0,S.hip[1]-1],S.cloth):null,
      P('belt',[0,S.hip[1]-2],S.belt), back?null:P('buckle',[0,S.hip[1]-2],S.buckle),
      G.pauldrons?P('pauldronL',S.pauldronAt,S.pauldron):null, G.pauldrons?P('pauldronR',R(S.pauldronAt),mirrorShapes(S.pauldron)):null,
      P('head',S.neck,[],headKids)
    ];
    // the weapon or tool: held by the right hand (its grip in the fist, the fist drawn over the haft), or, without hands, floating beside it
    const hands=G.hands!==false, wName=G.weapon&&G.weapon!=='none'&&WEAPONS[G.weapon]?G.weapon:null, grip=GRIP[wName]||[24,-16], ha=S.handAt;
    const weapon=wName?P('weapon',hands?grip:[24,-22],WEAPONS[wName]):null;
    const shield=S.shield?P('shield',R(ha),S.shield):null;
    const handKids=hands?[P('handL',R(ha),[],[shield,P('fistL',R(ha),mirrorShapes(S.fist))]),P('handR',ha,[],[weapon,P('fistR',ha,S.fist)])]:[weapon,shield];
    const sack=S.sack&&G.load&&G.load!=='none'?P('sack',S.sackAt,S.sack.concat(S.load[G.load]||[])):null;
    const feet=side=>S.foot.length&&!(back&&S.footClaws)?[P('foot'+side,[S.hip[0]*(side==='L'?1:-1),0],side==='L'?S.foot:mirrorShapes(S.foot))]:[];
    const tail=S.tail?P('tail',S.tailAt,S.tail):null, legsBody=[P('legL',S.hip,S.leg,feet('L')),P('legR',R(S.hip),mirrorShapes(S.leg),feet('R')),P('body',[0,S.hip[1]],S.body,bodyKids)];
    const tree=P('root',[0,0],[],[spec.shadow===false?null:P('shadow',[0,0],S.shadow)].concat(back?legsBody.concat([tail,sack]):[tail,sack].concat(legsBody),handKids));       // from behind: tail and sack in front of the body
    // the stats as proportions on top of the body plan (strength is in the plan itself: the shoulders, the hands)
    const bw=1.1-0.2*t.flink, ls=(0.85+0.45*t.flink)*S.legK, hs=0.85+0.45*t.klug, js=1.15-0.35*t.klug, ts=0.6+0.9*t.wild;
    const hip=-S.hip[1], lift=-(hip*ls-hip), half=Math.abs(ha[0]);
    const base={
      shadow:{ sx:bw }, legL:{ x:-(bw-1)*Math.abs(S.hip[0])*0.7, y:lift, sy:ls }, legR:{ x:(bw-1)*Math.abs(S.hip[0])*0.7, y:lift, sy:ls }, body:{ y:lift, sx:bw },
      head:{ y:S.headY, sx:hs/bw, sy:hs }, jaw:{ sx:js, sy:js }, tuskL:{ sy:ts }, tuskR:{ sy:ts },
      root:back?{ sx:-1 }:{}, sack:{ x:3.6, y:lift-0.6, sx:1.22, sy:1.22, r:spec.seed?-45+90*rng(spec.seed*2654435761+97)():25 },       // nearer the middle, bigger, tilted (user: -45 to +45 degrees, either way)
      earL:S.earGrow==='kink'?{ sx:0.45+0.55*grow+0.15*sag, sy:0.55+0.45*grow+0.1*sag, r:-30*sag }:(S.earGrow?{ sx:0.7+earK, sy:0.8+0.5*earK, r:-68*earK }:{}),
      earR:S.earGrow==='kink'?{ sx:0.45+0.55*grow+0.15*sag, sy:0.55+0.45*grow+0.1*sag, r:30*sag }:(S.earGrow?{ sx:0.7+earK, sy:0.8+0.5*earK, r:68*earK }:{}),       // longer, broader, and hanging lower
      earTipL:{ sx:1+0.35*sag, r:-100*sag }, earTipR:{ sx:1+0.35*sag, r:100*sag },       // the tip folds at the kink
      handL:{ x:-(bw-1)*half-S.handGap, y:lift, sx:1.15, sy:1.15 }, handR:{ x:(bw-1)*half+S.handGap, y:lift, sx:1.15, sy:1.15 },       // a gap between body and hand: they float
      weapon:hands?{ x:ha[0]-grip[0], y:ha[1]-grip[1], r:12 }:{ x:(bw-1)*16-5, y:lift }
    };
    if(S.earScale) ['earL','earR'].forEach(k=>{ base[k].sx=(base[k].sx||1)*S.earScale; base[k].sy=(base[k].sy||1)*S.earScale; });       // the imp's ears as big as its head
    return { tree, base, pal, spec, genes, hands, earHeavy:S.earGrow==='kink'?sag:earK, H:S.H, px:S.px, has:{ helmet:true, chest:true, pauldrons:true, load:!!K.sack, ears:!!K.ears, horns:false, level:!!K.ears }, lookK:S.lookK, browBase:(t.wild-0.5)*14 };
  }
  // how far a part moves sideways when the ork half turns (turn -1 .. 1): the face more than the skull, so the flat figure seems to turn
  const TURN={ skull:0.6, earL:0.6, earR:0.6, helmet:0.7, mouth:1.4, jaw:1.4, eyeL:2.2, eyeR:2.2, lidL:2.2, lidR:2.2, browL:2.2, browR:2.2, belly:1.6, chest:1.0, cloth:1.1, buckle:2.2 };
  // the parts pulled apart (the "parts" view): where each one drifts
  const EXPLODE={ legL:[-6,6], legR:[6,6], belly:[0,4], belt:[0,7], buckle:[0,11], cloth:[0,14], chest:[0,-4], head:[0,-10], skull:[0,-5], helmet:[0,-14], jaw:[0,7], mouth:[0,3], eyeL:[-5,-3], eyeR:[5,-3], lidL:[-5,-3], lidR:[5,-3], browL:[-7,-8], browR:[7,-8], pupilL:[-1.5,0], pupilR:[1.5,0], pauldronL:[-9,-4], pauldronR:[9,-4], handL:[-9,2], handR:[9,2], weapon:[6,-4], earL:[-6,-2], earR:[6,-2], earTipL:[-3,0], earTipR:[3,0], hornL:[-3,-6], hornR:[3,-6], tail:[8,2], sack:[-8,-4] };
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
    // the imp's own: ears that twitch now and then, a tail that lashes, the sack that bounces on the back
    const twitch=Math.max(0,Math.sin(s.t*0.9))**12;
    const hv=rig.earHeavy||0, light=1-0.8*hv, flop=hv*(s.walking?Math.sin(w-0.9)*11:Math.sin(s.t*1.4)*2.5);       // light ears twitch, heavy ones swing after each step
    put('earL',{ r:(-3*Math.sin(s.t*1.1)-14*twitch+6*roar)*light-flop*0.5 }); put('earR',{ r:(3*Math.sin(s.t*1.1)+14*twitch-6*roar)*light+flop*0.5 });
    put('earTipL',{ r:-flop*1.4 }); put('earTipR',{ r:flop*1.4 });
    put('tail',{ r:Math.sin(s.t*2.3)*9+Math.sin(w)*6*walkK+roar*Math.sin(s.t*30)*6 });
    put('sack',{ y:-1.1*Math.abs(Math.sin(w-0.4))+0.3*breath, r:-2*Math.sin(w)*walkK });
    // the floating hands: they swing against each other while it walks (as arms would), bob a little behind the body, go up when it roars
    put('handL',{ x:s.turn*1.2-0.6*Math.sin(w)*walkK, y:1.6*Math.sin(w)*walkK-1.1*Math.abs(Math.sin(w+0.7))*walkK+Math.sin(s.t*2+1)*0.6-6*roar, r:-8*Math.sin(w)*walkK+12*roar });
    put('handR',{ x:s.turn*1.2+0.6*Math.sin(w)*walkK-2*roar, y:-1.6*Math.sin(w)*walkK-1.1*Math.abs(Math.sin(w+0.7))*walkK+Math.sin(s.t*2)*0.6-9*roar, r:8*Math.sin(w)*walkK-14*roar });
    const sw=s.swing||0;       // a swing (the game: digging, building, a blow): 0 rest, 1 the tool up high, -1 struck down and forward
    if(sw){ P.handR.y-=(sw>0?10:8)*sw; P.handR.r-=12*sw; P.handR.x-=1.5*sw; P.handL.y-=3*sw; }       // up for the wind-up, down for the blow (sw below 0)
    put('weapon',rig.hands?{ r:Math.sin(s.t*1.3)*3-roar*48-sw*(sw>0?40:55) }:{ x:-s.turn, y:Math.sin(s.t*2)*0.8-Math.abs(Math.sin(w))*0.6*walkK, r:Math.sin(s.t*1.3)*4-roar*40 });
    const closed=s.blink>0?1:0, k=rig.lookK||1;
    ['L','R'].forEach(sd=>{ put('eye'+sd,{ x:turnOf('eye'+sd), sy:1-0.9*closed+(roar?0.15:0) }); put('pupil'+sd,{ x:s.look[0]*k, y:s.look[1]*k*0.6, a:closed?0:1 }); put('lid'+sd,{ x:turnOf('lid'+sd), a:closed }); });
    put('browL',{ x:turnOf('browL'), y:s.moodK[1], r:s.moodK[0]+rig.browBase }); put('browR',{ x:turnOf('browR'), y:s.moodK[1], r:-s.moodK[0]-rig.browBase });
    // the resting transform of the values, then the parts view on top
    Object.keys(rig.base).forEach(id=>{ const b=rig.base[id]; if(!P[id]) put(id,{}); const v=P[id]; v.x+=b.x||0; v.y+=b.y||0; v.r+=b.r||0; v.sx*=b.sx||1; v.sy*=b.sy||1; });
    if(s.explode>0.001) Object.keys(EXPLODE).forEach(id=>{ if(P[id]){ P[id].x+=EXPLODE[id][0]*s.explode; P[id].y+=EXPLODE[id][1]*s.explode; } });
    return P;
  }
  const tf=(p,v)=>`translate(${v.x} ${v.y}) translate(${p[0]} ${p[1]}) rotate(${v.r}) scale(${v.sx} ${v.sy}) translate(${-p[0]} ${-p[1]})`;
  // ---- what lies in front of what: one rule for every creature (user, November 2026) ----
  // The tree of parts decides how they move (a fist moves with its hand, the eyes with the head); the order they are drawn in comes from this table,
  // per view, from the back to the front. A part's name without L/R; a part not in the table is drawn with the one it hangs on.
  // Front: the tail and the carried sack behind, the legs, the body with what is on it, the ears behind the head, the face, the hands and what they hold in front.
  // Back: the loincloth lowest, the legs, the hands and what they hold, the head with its ears, then the back over them, the carried sack, the tail on top.
  const LAYERS={
    front:['shadow','tail','sack','leg','foot','body','spine','belly','scarsBody','chest','belt','buckle','cloth','pauldron','ear','earTip','head','skull','scar','scarsHead','horn','helmet','mouth','jaw','tusk','eye','pupil','lid','brow','shield','weapon','hand','fist'],
    back:['shadow','cloth','foot','leg','shield','weapon','hand','fist','ear','earTip','head','skull','scar','scarsHead','horn','helmet','body','spine','scarsBody','chest','belt','buckle','pauldron','sack','tail']
  };
  const baseName=id=>id.replace(/[LR]$/,'');
  // every part with its whole transform (an affine matrix [a b c d e f]) and alpha, in drawing order
  const mul=(m,n)=>[m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1], m[0]*n[2]+m[2]*n[3], m[1]*n[2]+m[3]*n[3], m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5]];
  function localM(p,v){ const r=v.r*Math.PI/180, c=Math.cos(r), sn=Math.sin(r), [px,py]=p;
    return mul(mul([1,0,0,1,v.x+px,v.y+py],[c*v.sx,sn*v.sx,-sn*v.sy,c*v.sy,0,0]),[1,0,0,1,-px,-py]); }
  function flat(rig,P){
    const order=LAYERS[rig.spec.view==='back'?'back':'front'], out=[]; let n=0;
    const walk=(part,M,a,layer)=>{ const v=P&&P[part.id]||{ x:0, y:0, r:0, sx:1, sy:1, a:1 }, m=mul(M,localM(part.pivot,v)), al=a*(v.a===undefined?1:v.a);
      const k=order.indexOf(baseName(part.id)), L=k>=0?k:layer; out.push({ part, m, a:al, L, n:n++ }); part.kids.forEach(c=>walk(c,m,al,L)); };
    walk(rig.tree,[1,0,0,1,0,0],1,0);
    return out.sort((p,q)=>p.L-q.L||p.n-q.n);
  }
  // the SVG output: one <g> per part, side by side in drawing order (built once per rig); draw() sets their matrices
  function svg(host,rig){
    const NS='http://www.w3.org/2000/svg', els={}; while(host.firstChild) host.removeChild(host.firstChild);
    flat(rig,null).forEach(({ part })=>{ const g=document.createElementNS(NS,'g'); g.dataset.part=part.id;
      part.shapes.forEach(([d,fill,sw,stroke])=>{ const p=document.createElementNS(NS,'path'); p.setAttribute('d',d); p.setAttribute('fill',fill?rig.pal[fill]:'none');
        if(sw){ p.setAttribute('stroke',rig.pal[stroke||'line']); p.setAttribute('stroke-width',sw); p.setAttribute('stroke-linejoin','round'); p.setAttribute('stroke-linecap','round'); } g.appendChild(p); });
      host.appendChild(g); els[part.id]=g; });
    return { draw(P){ flat(rig,P).forEach(({ part, m, a })=>{ const g=els[part.id]; if(!g) return; g.setAttribute('transform',`matrix(${m.map(x=>x.toFixed(4)).join(' ')})`); g.setAttribute('opacity',a); }); } };
  }
  // the canvas output: the same paths (Path2D) in the same order, scaled k pixels to a unit, the feet at (ox, oy)
  const paths=new Map(); const p2=d=>{ let p=paths.get(d); if(!p){ p=new Path2D(d); paths.set(d,p); } return p; };
  function canvas(g,rig,P,k,ox,oy){
    g.save(); g.lineJoin='round'; g.lineCap='round';
    flat(rig,P).forEach(({ part, m, a })=>{ if(a<=0.01||!part.shapes.length) return; g.setTransform(k*m[0],k*m[1],k*m[2],k*m[3],ox+k*m[4],oy+k*m[5]); g.globalAlpha=Math.min(1,a);
      part.shapes.forEach(([d,fill,sw,stroke])=>{ const p=p2(d); if(fill){ g.fillStyle=rig.pal[fill]; g.fill(p); } if(sw){ g.strokeStyle=rig.pal[stroke||'line']; g.lineWidth=sw; g.stroke(p); } }); });
    g.restore();
  }
  const lookOf=kind=>({ ears:!!HUMANOIDS[kindOf(kind)].ears, horns:false });
  return { build, roll, defaults, lookOf, genesOf, presetsOf, IMP_PRESETS, create, step, pose, svg, canvas, MOODS, KINDS:Object.keys(HUMANOIDS), stylesOf, weaponsOf:kind=>HUMANOIDS[kindOf(kind)].weapons };
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
.orkv-stage canvas[hidden],.orkv [hidden]{ display:none }
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
    const c=document.createElement('canvas'); c.width=Math.round(size*1.25); c.height=Math.round(size*1.08); const g=c.getContext('2d'), k=size/rig.H;       // every kind fills its sprite (an imp is as many pixels high as an ork)
    SvgRig.canvas(g,rig,P,k,c.width*0.42,c.height-2*k); snap(g,c.width,c.height); return c;
  }
  const KIND_NAME={ ork:'Ork', imp:'Imp' }, STYLE_NAME={ bestie:'Bestie', wicht:'Wicht', knolle:'Knolle', krieger:'Krieger', brocken:'Koloss', spaeher:'Späher', eigen:'Eigen' }, WEAPON_NAME={ none:'keine', axe:'Axt', club:'Keule', sword:'Schwert', pick:'Spitzhacke', hammer:'Hammer', dagger:'Dolch', spear:'Speer', bow:'Bogen', staff:'Stab' };
  // the genes (every humanoid: every look between the presets)
  const GENES=[['kopf','Kopfgröße'],['kopfForm','Kopf: oval, rund, eckig'],['kinn','Kinn spitz'],['koerperForm','Körper: oval, rund, eckig'],['beinForm','Beine: oval, rund, eckig'],['fuss','Füße'],['tief','Kopf tief'],['koerper','Körper rund'],['beine','Beine lang'],['augen','Augen groß'],['haut','Hautton'],['augenFarbe','Augenfarbe']];
  const TRAITS=[['klug','Klugheit','Kopf'],['stark','Stärke','Schultern'],['flink','Gewandtheit','Beine'],['wild','Wildheit','Hauer']];
  let lastViewer=null;       // the viewer opened last (tests hold its blinking)
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
  <label for="orkvKind">Art</label><select id="orkvKind">${SvgRig.KINDS.map(k=>`<option value="${k}">${KIND_NAME[k]||k}</option>`).join('')}</select>
  <label for="orkvStyle">Stil</label><select id="orkvStyle"></select>
  <button id="orkvRoll">Würfeln</button>
  <button id="orkvWalk" aria-pressed="true">Auf und ab</button>
  <button id="orkvMouse" aria-pressed="false">Schaut zur Maus</button>
  <button id="orkvBlink">Blinzeln</button>
  <button id="orkvRoar">Brüllen</button>
  <button id="orkvParts" aria-pressed="false">Einzelteile</button>
</div>
<div class="orkv-row" id="orkvGenes"><span class="orkv-group">Gene</span>${GENES.map(([k,n])=>`<label class="orkv-slider" for="orkvGn_${k}">${n}<input type="range" id="orkvGn_${k}" min="0" max="100" value="50"></label>`).join('')}
  <span id="orkvEarsBox"><label for="orkvEars">Ohren</label> <select id="orkvEars"><option value="spitz">spitz mit Knick</option><option value="lappen">Lappen</option></select></span></div>
<div class="orkv-row"><span class="orkv-group">Werte</span>${TRAITS.map(([k,n,what])=>`<label class="orkv-slider" for="orkvT_${k}">${n} <small>(${what})</small><input type="range" id="orkvT_${k}" min="0" max="100" value="50"></label>`).join('')}</div>
<div class="orkv-row"><span class="orkv-group">Ausrüstung</span>
  <label for="orkvWeapon">Waffe</label><select id="orkvWeapon"></select>
  <label for="orkvLoad" data-for="load">Last</label><select id="orkvLoad" data-for="load"><option value="none">keine</option><option value="gold">Gold</option><option value="ore">Erz</option></select>
  <button id="orkvG_hands" aria-pressed="false">Hände</button><button id="orkvG_helmet" aria-pressed="false">Helm</button><button id="orkvG_chest" aria-pressed="false">Brustpanzer</button><button id="orkvG_pauldrons" aria-pressed="false">Schulterplatten</button><button id="orkvG_cloth" aria-pressed="false">Lendenschurz</button><button id="orkvScar" aria-pressed="false">Narbe</button><button id="orkvKo">K.o.</button><button id="orkvHeal">Narben weg</button><span id="orkvScarN" class="orkv-group"></span><button id="orkvG_ears" aria-pressed="false">Ohren</button><button id="orkvG_horns" aria-pressed="false">Hörner</button>
  <label for="orkvShield">Schild</label><select id="orkvShield"><option value="">keiner</option><option value="buckler">Buckler</option><option value="kite">Dreiecksschild</option><option value="tower">Turmschild</option></select>
  <label for="orkvMat">Material</label><select id="orkvMat"><option value="">Grundfarbe</option><option value="leder">Leder</option><option value="bronze">Bronze</option><option value="eisen">Eisen</option><option value="stahl">Stahl</option></select>
  <label for="orkvHelm">Helmform</label><select id="orkvHelm"><option value="">wie die Art</option><option value="plain">schlicht</option><option value="crest">Kamm</option><option value="horns">Hörner</option></select>
  <label class="orkv-slider" for="orkvLevel" id="orkvLevelBox">Stufe <input type="range" id="orkvLevel" min="1" max="12" value="1"><output id="orkvLevelOut">1</output></label>
</div>
<div class="orkv-row">
  <label for="orkvView">Ansicht</label><select id="orkvView"><option value="front">vorn</option><option value="back">hinten</option></select>
  <label for="orkvMood">Stimmung</label><select id="orkvMood">${Object.keys(SvgRig.MOODS).map(m=>`<option value="${m}">${m}</option>`).join('')}</select>
  <label for="orkvFx">Nachbearbeitung</label><select id="orkvFx"><option value="vector">Vektor (SVG)</option><option value="boil">Wackel-Linie</option><option value="pixel">Pixel</option><option value="smooth" selected>Pixel, glatt hochgerechnet</option><option value="soft">Weich</option></select>
  <label for="orkvRes">Pixelgröße</label><select id="orkvRes"><option value="24">24 px</option><option value="32">32 px</option><option value="48" selected>48 px</option><option value="64">64 px</option><option value="128">128 px</option></select>
</div>
<div class="orkv-sprites" id="orkvSprites" aria-label="Der Ork als Sprite von 16 bis 128 Pixeln"></div>
<p class="orkv-note">Ein Baukasten statt einer Zeichnung: Ork und Imp teilen einen Körperplan, dieselben Teile und Bewegungen. Gene wählen das Aussehen (die Stile sind Voreinstellungen davon), die Werte formen den Körper (Klugheit: größerer Kopf und kleinerer Kiefer, Stärke: viel breitere Schultern, kaum breitere Hüften und größere Hände, Gewandtheit: längere Beine und schlanker, Wildheit: längere Hauer und finsterere Brauen). Die Ausrüstung wird aus dem Körper berechnet: der Helm aus dem Schädel bis zu den Brauen, der Brustpanzer aus dem Umriss von den Schultern bis zur Taille, die Schulterplatten auf den Schultern, Gürtel und Lendenschurz an der Hüfte. So sitzt sie bei jeder Größe, wie die Waffe in der Faust. Die Hände schweben ohne Arme neben dem Körper; ohne Hände schwebt die Waffe allein. „Würfeln“ zieht aus einem Seed Gene, Werte, Hautton, Narbe und Ausrüstung. Unten dieselbe Figur als Sprite, in der gewählten Nachbearbeitung.</p>`;
    const $=id=>root.querySelector('#'+id), stage=$('orkvStage'), svgEl=$('orkvSvg'), cv=$('orkvCanvas'), turb=$('orkvTurb');
    let spec=SvgRig.defaults('ork'), rig, out;
    const s=SvgRig.create(), opt={ walk:true, mouse:null, followMouse:false, explode:false, fx:'smooth', res:48 };
    // the controls show the spec; a change rebuilds the rig
    // the choices follow the kind: its styles, its weapons and tools, the gear it can wear, a load for those who carry one
    const fill=(sel,list,names)=>{ sel.innerHTML=list.map(v=>`<option value="${v}">${names[v]||v}</option>`).join(''); };
    const show=()=>{ $('orkvKind').value=spec.kind; fill($('orkvStyle'),SvgRig.stylesOf(spec.kind),STYLE_NAME); $('orkvStyle').value=rig.spec.style;
      fill($('orkvWeapon'),['none'].concat(SvgRig.weaponsOf(spec.kind)),WEAPON_NAME);
      ['helmet','chest','pauldrons'].forEach(k=>{ $('orkvG_'+k).hidden=!rig.has[k]; });
      root.querySelectorAll('[data-for="load"]').forEach(e=>{ e.hidden=!rig.has.load; });
      const lk=SvgRig.lookOf(spec.kind); ['ears','horns'].forEach(k=>{ const b=$('orkvG_'+k); b.hidden=!rig.has[k]; b.setAttribute('aria-pressed',spec.gear[k]!==undefined?!!spec.gear[k]:lk[k]!==false); });
      $('orkvLevelBox').hidden=!rig.has.level; $('orkvView').value=spec.view||'front'; $('orkvScarN').textContent=(spec.scars||0)?`${spec.scars||0} ×`:'';
      const gn=rig.genes; GENES.forEach(([k])=>{ $('orkvGn_'+k).value=Math.round((gn[k]===undefined?0.5:gn[k])*100); }); $('orkvEarsBox').hidden=!rig.has.ears; if(rig.has.ears) $('orkvEars').value=gn.ohren||'spitz'; $('orkvLevel').value=spec.level||1; $('orkvLevelOut').textContent=spec.level||1; $('orkvLoad').value=spec.gear.load||'none'; $('orkvShield').value=spec.gear.shield||''; $('orkvMat').value=spec.gear.mat||''; $('orkvHelm').value=spec.gear.helmStyle||''; TRAITS.forEach(([k])=>{ $('orkvT_'+k).value=Math.round(spec.traits[k]*100); }); $('orkvWeapon').value=spec.gear.weapon;
      ['helmet','chest','pauldrons','cloth'].forEach(k=>$('orkvG_'+k).setAttribute('aria-pressed',!!spec.gear[k])); $('orkvG_hands').setAttribute('aria-pressed',spec.gear.hands!==false); $('orkvScar').setAttribute('aria-pressed',!!spec.scar); };
    const rebuild=()=>{ rig=SvgRig.build(spec); out=SvgRig.svg($('orkvRig'),rig); show(); };
    rebuild();
    $('orkvKind').addEventListener('change',e=>{ spec=SvgRig.defaults(e.target.value); rebuild(); opt.res=rig.px; $('orkvRes').value=String(rig.px); });       // each kind its own pixel size (the user: the imp at 24, the ork at 48)
    $('orkvStyle').addEventListener('change',e=>{ spec.style=e.target.value; const pr=SvgRig.presetsOf(spec.kind)[spec.style]; if(pr) spec.genes=Object.assign({},pr); rebuild(); });
    // a gene changed: the creature is one of its own now
    const gene=(k,v)=>{ spec.genes=SvgRig.genesOf(spec); spec.genes[k]=v; spec.style='eigen'; rebuild(); };
    GENES.forEach(([k])=>$('orkvGn_'+k).addEventListener('input',e=>gene(k,e.target.value/100)));
    $('orkvEars').addEventListener('change',e=>gene('ohren',e.target.value));       // a style brings its look (the beast: no ears, no horns)
    ['ears','horns'].forEach(k=>$('orkvG_'+k).addEventListener('click',()=>{ spec.gear[k]=$('orkvG_'+k).getAttribute('aria-pressed')!=='true'; rebuild(); }));
    $('orkvLevel').addEventListener('input',e=>{ spec.level=+e.target.value; rebuild(); });
    $('orkvLoad').addEventListener('change',e=>{ spec.gear.load=e.target.value; rebuild(); });
    [['orkvShield','shield'],['orkvMat','mat'],['orkvHelm','helmStyle']].forEach(([id,k])=>$(id).addEventListener('change',e=>{ spec.gear[k]=e.target.value||undefined; rebuild(); }));
    TRAITS.forEach(([k])=>$('orkvT_'+k).addEventListener('input',e=>{ spec.traits[k]=e.target.value/100; rebuild(); }));
    $('orkvWeapon').addEventListener('change',e=>{ spec.gear.weapon=e.target.value; rebuild(); });
    ['helmet','chest','pauldrons','cloth'].forEach(k=>$('orkvG_'+k).addEventListener('click',()=>{ spec.gear[k]=!spec.gear[k]; rebuild(); }));
    $('orkvG_hands').addEventListener('click',()=>{ spec.gear.hands=spec.gear.hands===false; rebuild(); });
    $('orkvScar').addEventListener('click',()=>{ spec.scar=!spec.scar; rebuild(); });
    $('orkvKo').addEventListener('click',()=>{ spec.scars=(spec.scars||0)+1; if(!spec.seed) spec.seed=1+Math.floor(Math.random()*1e6); rebuild(); });       // knocked out: one scar more (user)
    $('orkvHeal').addEventListener('click',()=>{ spec.scars=0; spec.scar=false; rebuild(); });
    $('orkvView').addEventListener('change',e=>{ spec.view=e.target.value; rebuild(); });
    $('orkvRoll').addEventListener('click',()=>{ spec=SvgRig.roll(Math.floor(Math.random()*1e9),spec.kind); rebuild(); });
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
      SvgRig.step(s,dt,{ walk:opt.walk, mouse:opt.followMouse?opt.mouse:null, range:56, explode:opt.explode });
      const P=SvgRig.pose(s,rig), vec=opt.fx==='vector'||opt.fx==='boil'; svgEl.style.visibility=vec?'visible':'hidden'; cv.hidden=vec;
      if(vec){ out.draw(P); $('orkvRig').setAttribute('filter',opt.fx==='boil'?'url(#orkvBoil)':''); boilT+=dt; if(boilT>0.13){ boilT=0; turb.setAttribute('seed',1+Math.floor(Math.random()*90)); } }
      else if((stageT+=dt)>1/30){ stageT=0;
        // the ork opt.res pixels high (as the sprites below), the stage around it in the same pixels
        const r=stage.getBoundingClientRect(), k=opt.res/rig.H, small=document.createElement('canvas'); small.width=Math.round(192*k); small.height=Math.round(80*k);
        const g=small.getContext('2d'); SvgRig.canvas(g,rig,P,k,small.width/2,small.height-8*k);
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
    return lastViewer={ close(){ alive=false; root.remove(); }, state:s, opt, get spec(){ return spec; } };
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
  return { open, overlay, get last(){ return lastViewer; } };
})();
