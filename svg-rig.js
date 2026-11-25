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
  const GN=o=>Object.assign({ kopf:0.5, kinn:0.5, kopfForm:0.5, koerperForm:0.5, beinForm:0.5, fuss:0, tief:0.3, koerper:0.4, beine:0.5, augen:0.5, haut:0.5, augenFarbe:0, haar:0.3, bart:0.5 },o);
  const GOBLIN_PRESETS={ flitzer:GN({ kopf:0.7, kinn:0.8, kopfForm:0.4, koerper:0.1, beine:0.8, augen:0.8, fuss:0 }), grinser:GN({ kopf:0.9, kinn:0.2, kopfForm:0.6, koerper:0.7, beine:0.2, augen:0.6, fuss:0.5, haut:0.8 }) };
  const TROLL_PRESETS={ fels:GN({ kopf:0.2, kinn:0.1, kopfForm:0.9, koerperForm:0.8, beinForm:0.85, koerper:0.8, tief:0.9, beine:0.3, augen:0.3 }), moor:GN({ kopf:0.5, kinn:0.6, kopfForm:0.4, koerperForm:0.4, beinForm:0.4, koerper:0.4, tief:0.5, beine:0.7, haut:1, augenFarbe:1 }) };
  const ELF_PRESETS={ klinge:GN({ kopf:0.4, kinn:0.8, kopfForm:0.3, koerperForm:0.3, beinForm:0.2, koerper:0.1, beine:0.8, augen:0.5 }), hexe:GN({ kopf:0.7, kinn:0.6, kopfForm:0.4, koerperForm:0.4, koerper:0.3, beine:0.6, augen:0.8, haut:1, augenFarbe:1, fuss:0.5 }) };
  const VAMPIRE_PRESETS={ graf:GN({ kopf:0.5, kinn:0.9, kopfForm:0.35, koerperForm:0.4, koerper:0.3, beine:0.7, augen:0.4 }), bleich:GN({ kopf:0.6, kinn:0.6, kopfForm:0.5, koerperForm:0.2, koerper:0, beine:0.9, augen:0.7, haut:1, augenFarbe:1 }) };
  const WARLOCK_PRESETS={ seher:GN({ kopf:0.5, koerper:0.3, augen:0.5 }), irrer:GN({ kopf:0.7, koerper:0.1, augen:1, haut:1, augenFarbe:1 }) };
  const SKELETON_PRESETS={ krieger:GN({ kopf:0.4, kopfForm:0.7, koerper:0.5, beine:0.5, augen:0.5 }), alt:GN({ kopf:0.7, kopfForm:0.3, kinn:0.6, koerper:0.2, beine:0.6, augen:0.8, haut:1, augenFarbe:1 }) };
  const HUMAN_PRESETS={ veteran:GN({ kopf:0.5, kinn:0.3, kopfForm:0.75, koerperForm:0.6, koerper:0.3, augen:0.4, haut:0.45, augenFarbe:0.2, haar:0.8, bart:0.72, fuss:0, tief:0.45 }),
    soeldner:GN({ kopf:0.4, kinn:0.2, kopfForm:0.95, koerperForm:0.85, koerper:0.6, haut:0.55, augenFarbe:0.8, haar:0.1, bart:0.9, fuss:0.8, tief:0.7 }), bauer:GN({ kopf:0.6, kinn:0.6, kopfForm:0.3, koerperForm:0.3, koerper:0.15, haut:0.2, augenFarbe:0.5, haar:0.3, bart:0.3, fuss:0, tief:0.2 }) };
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
    if(K.hairs){ P.hair=mix3(K.hairs[0],K.hairs[1],K.hairs[2],g.haar===undefined?0.3:g.haar); P.hairDark=mix(P.hair,'#000000',0.45); P.brow=mix(P.hair,'#000000',0.25); }       // the hair's colour by its gene
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
    },
    // the goblin: big round eyes with a slit, a hooked nose, a wide grin full of pointed teeth
    goblin({ aw, h, cy, chinY },g){
      const erx=(1.7+1.1*g.augen)*aw/8, ery=erx*0.92, ex=-aw*0.42, ey=cy+0.02*h, my=chinY-h*0.22, mw=aw*0.62, ny=ey+ery*0.7;
      const teeth=[-0.62,-0.22,0.22,0.62].map(k=>`M${f2(k*mw-0.55)} ${f2(my-0.2)} L${f2(k*mw)} ${f2(my+1.5)} L${f2(k*mw+0.55)} ${f2(my-0.2)}z`).join(' ');
      return { eye:[[ell(f2(ex),f2(ey),f2(erx),f2(ery)),'eye',1,'line']], pupil:[[ell(f2(ex+0.2),f2(ey),f2(erx*0.22),f2(ery*0.72)),'pupil',0]], eyeAt:[f2(ex),f2(ey)], pupilIn:0.2, lookK:0.7,
        lid:[[`M${f2(ex-erx)} ${f2(ey)} L${f2(ex+erx)} ${f2(ey)}`,null,1.2,'line']], brow:[[`M${f2(ex-erx*1.1)} ${f2(ey-ery-0.9)} L${f2(ex+erx*0.9)} ${f2(ey-ery*0.55)}`,null,1.3,'brow']], browAt:[f2(ex),f2(ey-ery)], browY:ey-ery*0.75,
        nose:[[`M-0.6 ${f2(ny-1.8)} Q1.9 ${f2(ny)} 0.7 ${f2(ny+1.9)} L-0.8 ${f2(ny+1.3)}z`,'light',1,'line']],
        mouth:[], mouthAt:[0,f2(my)], jaw:[[`M${f2(-mw)} ${f2(my-0.6)} Q0 ${f2(my+h*0.17)} ${f2(mw)} ${f2(my-0.6)} Q0 ${f2(my+h*0.05)} ${f2(-mw)} ${f2(my-0.6)}z`,'mouth',1.1,'line'],[teeth,'bone',0]], jawAt:[0,f2(my)] };
    },
    // the brute (the troll): the ork's underbite with short tusks, small eyes deep under one heavy brow ridge, a big drooping nose
    brute(H,g){
      const F=FACES.ork(H,g), { aw, h, top }=H, kx=aw/9.5, ky=h/14.5, ex=-aw*0.42, ey=top+h*0.52, r=(1+0.5*g.augen)*kx;
      return Object.assign(F,{ eye:[[ell(f2(ex),f2(ey),f2(r*1.6),f2(r*1.25)),'socket',0],[ell(f2(ex),f2(ey),f2(r*0.85),f2(r*0.65)),'glow',0]], pupil:[[ell(f2(ex),f2(ey),f2(r*0.38),f2(r*0.38)),'eye',0]], eyeAt:[f2(ex),f2(ey)], lookK:0.3,
        lid:[[`M${f2(ex-r*1.5)} ${f2(ey)} L${f2(ex+r*1.5)} ${f2(ey)}`,null,1.4,'line']],
        brow:[[`M${f2(-aw*1.04)} ${f2(ey-2*ky)} L${f2(-0.05*aw)} ${f2(ey-1.1*ky)} L${f2(-0.05*aw)} ${f2(ey-3.4*ky)} L${f2(-aw*0.95)} ${f2(ey-4.4*ky)}z`,'dark',1.2,'line']], browAt:[f2(ex),f2(ey-2.5*ky)], browY:ey-3.6*ky,
        nose:[[ell(0,f2(ey+2.8*ky),f2(aw*0.3),f2(2.5*ky)),'light',1.3,'line'],[`M${f2(-aw*0.12)} ${f2(ey+4.2*ky)} l0.6 -0.6 M${f2(aw*0.12)} ${f2(ey+4.2*ky)} l-0.6 -0.6`,null,0.9,'dark']],
        tusk:[[affPath('M-1 0 Q-2.4 -3 -0.6 -6 L0.6 -3.4 Q0.6 -1.6 1.2 0z',kx,ky,-0.62*aw,+F.tuskAt[1]),'bone',1.2]] });
    },
    // the fine face (dark elf, vampire): slanted glowing eyes, thin brows, a thin nose and mouth; the vampire shows its fangs
    fine({ aw, h, cy, chinY },g,K){
      const erx=(1.5+0.8*g.augen)*aw/6.6, ery=erx*0.5, ex=-aw*0.4, ey=cy+0.08*h, my=chinY-h*0.16, ny=ey+h*0.15;
      const jaw=[[`M${f2(-aw*0.22)} ${f2(my)} Q0 ${f2(my+0.8)} ${f2(aw*0.22)} ${f2(my)}`,null,1,'dark']];
      if(K.fangs) jaw.push([`M${f2(-aw*0.17)} ${f2(my+0.3)} l0.45 1.7 l0.45 -1.6z M${f2(aw*0.17)} ${f2(my+0.3)} l-0.45 1.7 l-0.45 -1.6z`,'bone',0.5,'line']);
      return { eye:[[ell(f2(ex),f2(ey),f2(erx*1.5),f2(ery*2.2)),'glow',0],[`M${f2(ex-erx)} ${f2(ey+ery*0.35)} Q${f2(ex-erx*0.15)} ${f2(ey-ery*1.4)} ${f2(ex+erx)} ${f2(ey-ery*0.45)} Q${f2(ex+erx*0.1)} ${f2(ey+ery*1.1)} ${f2(ex-erx)} ${f2(ey+ery*0.35)}z`,'eye',0.8,'line']],
        pupil:[[ell(f2(ex+0.1*erx),f2(ey),f2(erx*0.2),f2(ery*0.8)),'pupil',0]], eyeAt:[f2(ex),f2(ey)], pupilIn:0.1, lookK:0.4,
        lid:[[`M${f2(ex-erx)} ${f2(ey)} L${f2(ex+erx)} ${f2(ey-ery*0.3)}`,null,1.1,'line']], brow:[[`M${f2(ex-erx*1.15)} ${f2(ey-ery-1.6)} L${f2(ex+erx*0.95)} ${f2(ey-ery*0.4-0.7)}`,null,1,'brow']], browAt:[f2(ex),f2(ey-ery-1)], browY:ey-ery-1.9,
        nose:[[`M0.2 ${f2(ey+0.6)} L-0.5 ${f2(ny)} L0.5 ${f2(ny+0.3)}`,null,0.9,'dark']], mouth:[], mouthAt:[0,f2(my)], jaw, jawAt:[0,f2(my)] };
    },
    // the skull (the skeleton): dark sockets with a small glowing point, the nose a hole, a row of teeth that drops when it roars
    skull({ aw, h, cy, chinY },g){
      const r=(1.6+0.9*g.augen)*aw/7, ex=-aw*0.4, ey=cy+0.05*h, my=chinY-h*0.13, tw=aw*0.48;
      return { eye:[[ell(f2(ex),f2(ey),f2(r),f2(r*1.05)),'socket',0]], pupil:[[ell(f2(ex+0.2),f2(ey+0.2),f2(r*0.6),f2(r*0.6)),'glow',0],[ell(f2(ex+0.2),f2(ey+0.2),f2(r*0.26),f2(r*0.26)),'eye',0]], eyeAt:[f2(ex),f2(ey)], pupilIn:0.2, lookK:0.3,
        lid:[], brow:[], browAt:[f2(ex),f2(ey-r)], browY:ey-r-0.6, noBlink:true,
        nose:[[`M0 ${f2(ey+r*0.8)} L${f2(-r*0.55)} ${f2(ey+r*2)} L${f2(r*0.55)} ${f2(ey+r*2)}z`,'socket',0]], mouth:[], mouthAt:[0,f2(my)],
        jaw:[[`M${f2(-tw)} ${f2(my-1.2)} L${f2(tw)} ${f2(my-1.2)} L${f2(tw*0.85)} ${f2(my+1.6)} L${f2(-tw*0.85)} ${f2(my+1.6)}z`,'skin',1,'line'],[[-0.5,-0.17,0.17,0.5].map(k=>`M${f2(k*tw)} ${f2(my-1.2)} L${f2(k*tw*0.95)} ${f2(my+1.5)}`).join(' '),null,0.6,'line']], jawAt:[0,f2(my-1)] };
    },
    // the hood's dark: no face, two glowing points (the warlock)
    hood({ aw, h, cy },g){
      const ex=-aw*0.3, ey=cy+0.14*h, r=(0.6+0.5*g.augen)*aw/6.5;
      return { eye:[[ell(f2(ex),f2(ey),f2(r*2.4),f2(r*1.8)),'glow',0],[ell(f2(ex),f2(ey),f2(r),f2(r*0.8)),'eye',0]], pupil:[], eyeAt:[f2(ex),f2(ey)], pupilIn:0, lookK:0.3,
        lid:[], brow:[], browAt:[f2(ex),f2(ey-r)], browY:cy-0.15*h, nose:[], mouth:[], mouthAt:[0,f2(cy+0.3*h)], jaw:[], jawAt:[0,f2(cy+0.3*h)] };
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
    if(type==='bare') return [[ell(f2(xc-lw*0.15),f2(-0.6*u),f2(lw*0.72),f2(1*u)),'skin',sw*0.8]];
    if(type==='shoes') return [[`M${f2(xc-lw*0.95)} 0 L${f2(xc-lw*0.55)} ${f2(-1.7*u)} L${f2(xc+lw*0.55)} ${f2(-1.7*u)} L${f2(xc+lw*0.6)} 0z`,'foot',sw*0.75]];       // pointed, the toe outward
    if(type==='bones') return [[`M${f2(xc-lw*1.6)} -0.5 L${f2(xc+lw*0.6)} -0.5`,null,2.4,'line'],[`M${f2(xc-lw*1.6)} -0.5 L${f2(xc+lw*0.6)} -0.5`,null,1.2,'skin']];
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
      const l1=yc-2.2*u, l2=yc-0.4*u, w1=widthAt(pts,l1)*0.96, w2=widthAt(pts,l2)*0.96, rv=[[-w*0.75,yt+1*u],[w*0.75,yt+1*u],[-w1*0.85,l1-0.8*u],[w1*0.85,l1-0.8*u]];
      return [[ptsPath(pts),'iron',sw],[`M0 ${f2(yt+0.4*u)} L0 ${f2(yc+1.8*u)}`,null,sw*0.6,'ironDark'],[`M${f2(-w1)} ${f2(l1)} Q0 ${f2(l1+0.8*u)} ${f2(w1)} ${f2(l1)} M${f2(-w2)} ${f2(l2)} Q0 ${f2(l2+0.8*u)} ${f2(w2)} ${f2(l2)}`,null,sw*0.55,'ironDark'],
        [rv.map(([x,y])=>ell(f2(x),f2(y),f2(0.35*u),f2(0.35*u))).join(' '),'ironDark',0],
        [`M${f2(-w*0.6)} ${f2(yt+3*u)} l${f2(1.4*u)} ${f2(4*u)} M${f2(w*0.45)} ${f2(yt+2.4*u)} l${f2(0.7*u)} ${f2(3.4*u)}`,null,sw*0.6,'rust'],[formShade(pts,0),'shade',0]];
    },
    // the shield in the left hand (its grip at the fist, the fist drawn over it): a round buckler, a kite or a tower, as big as the shoulders are broad
    shield(A,family,at,flat,back){
      // turned a little (user, November 2026: face-on, from above, it looked clumsy): narrower, its edge showing on the side towards the body as its thickness
      const { wSh, sw, u }=A, r=wSh*(family==='tower'?0.62:(family==='kite'?0.58:0.45))*(A.shieldK||1), [x,y]=at, kx=A.sideOn?0.16:(flat?1:0.58), ed=flat||A.sideOn?0:Math.max(0.6,0.12*r);
      const unit=family==='tower'?[[-0.8,-1.4],[0.8,-1.4],[0.8,1.3],[-0.8,1.3]]:(family==='kite'?[[-1,-1.1],[1,-1.1],[0.9,0.3],[0,1.45],[-0.9,0.3]]:ellPts(0,0,1,1,24));
      const lean=flat||A.sideOn?0:0.12, at2=(dx)=>unit.map(([ux,uy])=>[x+ux*r*kx+dx+uy*r*lean,y+uy*r]), face=ptsPath(at2(0)), out=[];       // (lean: its top a little outward)
      if(ed){ const e=at2(ed); out.push([ptsPath(e),'ironDark',sw],[ptsPath(at2(ed*0.5)),'wood',0]); }       // the edge: the wood's thickness behind the face, the iron rim round it
      out.push([face,'wood',sw],[face,null,sw*0.7,'iron'],[formShade(at2(0),x),'shade',0]);
      if(A.sideOn) return out;       // on its edge: only the narrow face
      if(back){       // from behind: its back, planks of wood, two leather straps, the grip the hand holds
        const pl=[-0.5,0,0.5].map(k=>`M${f2(x+k*r*kx+0.5*r*lean)} ${f2(y-r)} L${f2(x+k*r*kx-0.5*r*lean)} ${f2(y+r)}`).join(' ');
        out.push([pl,null,sw*0.45,'ironDark'],[`M${f2(x-0.85*r*kx-0.3*r*lean)} ${f2(y-0.3*r)} L${f2(x+0.85*r*kx-0.3*r*lean)} ${f2(y-0.3*r)} M${f2(x-0.85*r*kx+0.2*r*lean)} ${f2(y+0.2*r)} L${f2(x+0.85*r*kx+0.2*r*lean)} ${f2(y+0.2*r)}`,null,0.7*(u||1),'leather']);
        return out;
      }
      if(family==='buckler'||!family) out.push([ell(f2(x),f2(y),f2(r*0.3*kx),f2(r*0.3)),'iron',sw*0.6,'ironDark']);
      else if(!A.emblem) out.push([affPath('M-0.12 -1 L0.12 -1 L0.12 1 L-0.12 1z',r*kx,r,x,y),'iron',sw*0.6,'ironDark']);
      else out.push([affPath('M-1 0.35 L1 0.35',r*0.8*kx,r,x,y),null,sw*0.6,'ironDark']);
      if(A.emblem&&family!=='buckler'){ const k=r*0.32, ey=y-r*0.35; out.push([affPath('M-1 -0.2 Q-1 -1.3 0 -1.3 Q1 -1.3 1 -0.2 Q1 0.4 0.55 0.6 L0.5 1 L-0.5 1 L-0.55 0.6 Q-1 0.4 -1 -0.2z',k*kx,k,x,ey),'bone',sw*0.5],[ell(f2(x-0.42*k*kx),f2(ey-0.15*k),f2(0.3*k*kx),f2(0.32*k)),'socket',0],[ell(f2(x+0.42*k*kx),f2(ey-0.15*k),f2(0.3*k*kx),f2(0.32*k)),'socket',0]); }       // a skull painted on it
      return out;
    },
  // the left shoulder plate (the right one is it mirrored): on the shoulder, as big as the shoulders are broad, with a spike
    pauldron(A){
      const { wSh, topY, bodyH, bPts, sw }=A, k=wSh/15*(A.pauldronK||1), y=A.shoulderY===undefined?topY+bodyH*0.16:A.shoulderY, x=-widthAt(bPts,y)*0.88;       // on the body's edge at that height, whatever its form
      return { at:[f2(x),f2(y)], shapes:[[affPath('M-1.5 -3.5 L-7 -11 L1 -4.5z',k,k,x,y),'ironDark',sw*0.75],[affPath('M-4 -0.5 L2.5 -5.5 L5 0.5 L1 5 L-4.5 3.5z',k,k,x,y),'iron',sw],[affPath('M2.5 -5.5 L5 0.5 L1 5 L1.6 -0.2z',k,k,x,y),'shade',0]] };
    },
    // the belt across the hips: a rope (the imp) or a band with a buckle
    belt(A,K){
      const { hipY, wHip, bPts, u, sw }=A;
      if(!K.belt) return { belt:[], buckle:[] };
      if(K.belt==='rope') return { belt:[[`M${f2(-wHip-0.6)} ${f2(hipY-2.4)} Q0 ${f2(hipY+0.4)} ${f2(wHip+0.6)} ${f2(hipY-2.4)}`,null,1.6,'belt']], buckle:[[ell(f2(-wHip*0.55),f2(hipY-0.6),1.9,1.7),'leather',1.1]] };
      const y0=A.beltY===undefined?hipY-4.5*u:A.beltY, y1=A.beltY===undefined?hipY-0.6*u:A.beltY+1.6*u, w0=widthAt(bPts,y0)*1.03, w1=widthAt(bPts,y1)*1.03, by=(y0+y1)/2;
      if(K.buckle==='plain') return { belt:[[`M${f2(-w0)} ${f2(y0)} L${f2(w0)} ${f2(y0)} L${f2(w1)} ${f2(y1)} L${f2(-w1)} ${f2(y1)}z`,'belt',sw*0.9]],
        buckle:[[`M${f2(-1.4*u)} ${f2(y0-0.3*u)} L${f2(1.4*u)} ${f2(y0-0.3*u)} L${f2(1.4*u)} ${f2(y1+0.3*u)} L${f2(-1.4*u)} ${f2(y1+0.3*u)}z`,null,0.8*u,'ironDark'],[`M0 ${f2(by)} L${f2(1.8*u)} ${f2(by)}`,null,0.6*u,'belt']] };       // a plain iron buckle, the tongue of the belt through it
      return { belt:[[`M${f2(-w0)} ${f2(y0)} L${f2(w0)} ${f2(y0)} L${f2(w1)} ${f2(y1)} L${f2(-w1)} ${f2(y1)}z`,'belt',sw*0.9]],
        buckle:[[ell(0,f2(by),f2(2.2*u),f2(1.9*u)),'gold',1.2],[ell(f2(-0.75*u),f2(by-0.2*u),f2(0.5*u),f2(0.5*u)),'line',0],[ell(f2(0.75*u),f2(by-0.2*u),f2(0.5*u),f2(0.5*u)),'line',0]] };
    },
    // the loincloth: from the belt down to the knees, as broad as the hips
    cloth(A){
      const { hipY, wHip, sw }=A, kx=wHip*0.55*(A.clothW||1)/4.6, ky=-hipY/10, kl=A.clothL||1;
      return [[affPath('M-4.6 0 L4.6 0 L5.4 6.6 L3.6 5.2 L2 8 L0 5.8 L-2 8 L-3.6 5.2 L-5.4 6.6z',kx,ky*kl,0,hipY-ky),'cloth',sw*0.85]];
    }
  };
  // ---- what some kinds wear or have of their own, fitted to the body plan as the gear is: hair, a hood, a high collar, a cape, a robe instead of legs,
  // a crest of spikes, a body of bones ----
  const EXTRAS={
    // hair: long (down over the shoulders, a parting, locks beside the face) or slicked back (a widow's peak); hairBack lies behind the head (from behind: over it)
    hair(A,style,back){
      const { hPts, top, h, aw, cy, chinY, u }=A, hc=top+h/2, sc=k=>([x,y])=>[x*k,hc+(y-hc)*k];
      if(style==='long'){
        const cap=above(hPts,top+0.34*h).map(sc(1.07)), L=cap[0], R=cap[cap.length-1];
        const front=[[-aw*1.05,cy+0.28*h]].concat(cap,[[aw*1.05,cy+0.28*h],[aw*0.72,top+0.38*h],[aw*0.12,top+0.2*h],[-aw*0.72,top+0.38*h]]);
        const backP=above(hPts,cy).map(sc(1.1)).concat([[aw*1.2,chinY+0.45*h],[aw*0.4,chinY+0.55*h],[-aw*0.4,chinY+0.55*h],[-aw*1.2,chinY+0.45*h]]);
        return { hair:back?[]:[[ptsPath(front),'hair',A.sw*0.8],[`M${f2(aw*0.12)} ${f2(top+0.2*h)} L${f2(aw*0.05)} ${f2(top+0.02*h)}`,null,0.7,'hairDark']], hairBack:[[ptsPath(backP),'hair',A.sw*0.8],[ptsPath(backP.slice(Math.floor(backP.length*0.55))),'hairDark',0]] };
      }
      const cap=above(hPts,top+0.3*h).map(sc(1.05));
      const front=cap.concat([[aw*0.32,top+0.26*h],[0,top+0.4*h],[-aw*0.32,top+0.26*h]]);
      return { hair:back?[]:[[ptsPath(front),'hair',A.sw*0.8],[`M${f2(-aw*0.55)} ${f2(top+0.08*h)} Q0 ${f2(top-0.03*h)} ${f2(aw*0.55)} ${f2(top+0.08*h)}`,null,0.7,'hairDark']],
        hairBack:[[ptsPath(above(hPts,chinY-0.22*h).map(sc(1.05))),'hair',A.sw*0.8]] };
    },
    // the hood: a pointed hood round the head, the face a dark opening in it (none from behind)
    hood(A,back){
      const { top, h, aw, cy, chinY, sw }=A, pts=[[-aw*1.36,chinY+0.18*h],[-aw*1.32,cy],[-aw*1.05,top+0.08*h],[-aw*0.35,top-0.3*h],[aw*0.25,top-0.48*h],[aw*0.6,top-0.2*h],[aw*1.05,top+0.08*h],[aw*1.32,cy],[aw*1.36,chinY+0.18*h],[0,chinY+0.32*h]];
      const out=[[ptsPath(pts),'tunic',sw],[formShade(pts,0),'shade',0]];
      if(!back) out.push([ell(0,f2(cy+0.1*h),f2(aw*0.74),f2(h*0.44)),'void',sw*0.6,'tunicDark']);
      return out;
    },
    // a high collar standing up behind the head (the vampire)
    collar(A){ const { topY, top, h, aw, sw }=A, c=`M${f2(-aw*0.4)} ${f2(topY+1)} L${f2(-aw*1.55)} ${f2(top+0.45*h)} L${f2(-aw*1.05)} ${f2(topY+0.5)}z`;
      return [[c,'cape',sw*0.8],[mirror(c),'cape',sw*0.8],[`M${f2(-aw*0.55)} ${f2(topY+0.6)} L${f2(-aw*1.35)} ${f2(top+0.52*h)} M${f2(aw*0.55)} ${f2(topY+0.6)} L${f2(aw*1.35)} ${f2(top+0.52*h)}`,null,0.8,'capeIn']]; },
    // the cape: from the shoulders down to the ankles, its lining seen from the front, its outside from behind
    cape(A,back){ const { topY, wSh, wHip, sw, u }=A, pts=[[-wSh*0.9,topY+0.5],[-wHip*1.75,-1.5*u],[-wHip*0.9,-0.4*u],[0,-1.2*u],[wHip*0.9,-0.4*u],[wHip*1.75,-1.5*u],[wSh*0.9,topY+0.5]];
      return [[ptsPath(pts),back?'cape':'capeIn',sw],[`M${f2(-wSh*0.5)} ${f2(topY+3*u)} L${f2(-wHip*1.1)} ${f2(-2*u)} M${f2(wSh*0.5)} ${f2(topY+3*u)} L${f2(wHip*1.1)} ${f2(-2*u)}`,null,0.8,back?'capeIn':'cape']]; },
    // the robe instead of legs: from the waist to the floor, wider at the hem, a band of trim
    robe(A){ const { hipY, wHip, sw, u }=A, y0=hipY-2*u, pts=[[-wHip*1.05,y0],[wHip*1.05,y0],[wHip*1.65,0],[wHip*0.8,0.6],[0,0.2],[-wHip*0.8,0.6],[-wHip*1.65,0]];
      return [[ptsPath(pts),'tunic',sw],[formShade(pts,0),'shade',0],[`M${f2(-wHip*1.6)} ${f2(-1.6*u)} Q0 ${f2(-0.9*u)} ${f2(wHip*1.6)} ${f2(-1.6*u)}`,null,1.4*u,'trim'],[`M0 ${f2(y0+1)} L0 ${f2(-2.4*u)}`,null,0.8,'tunicDark']]; },
    // a crest of stone spikes over the skull (the troll)
    crest(A){ const { hPts, top, h, aw, u }=A; return [-1,0,1].map(i=>{ const x=i*aw*0.42, y=top+Math.abs(i)*0.1*h+0.08*h, b=1.4*u;
      return [`M${f2(x-b)} ${f2(y+0.6)} L${f2(x+i*0.6)} ${f2(y-3.6*u)} L${f2(x+b)} ${f2(y+0.6)}z`,'dark',A.sw*0.8]; }); },
    // a body of bones: collarbone, ribs, spine, pelvis (the outline stays: the gear is fitted to it); legs of two bones each with a knee
    bones(A){ const { topY, hipY, wSh, wHip, bodyH, bPts, u }=A, bone=(d,w)=>[[d,null,w+1.2,'line'],[d,null,w,'skin']], out=[[ptsPath(bPts),null,0]];
      out.push(...bone(`M${f2(-wSh*0.95)} ${f2(topY+0.8*u)} Q0 ${f2(topY+2.2*u)} ${f2(wSh*0.95)} ${f2(topY+0.8*u)}`,1.4));
      [0.2,0.36,0.52].forEach(k=>{ const y=topY+bodyH*k, w=wSh*(0.8-0.25*k); out.push(...bone(`M${f2(-w)} ${f2(y)} Q0 ${f2(y+2.6*u)} ${f2(w)} ${f2(y)}`,1.1)); });
      out.push(...bone(`M0 ${f2(topY+0.5*u)} L0 ${f2(hipY-1*u)}`,1.3));
      out.push([`M${f2(-wHip*0.85)} ${f2(hipY-2.4*u)} Q0 ${f2(hipY-0.6*u)} ${f2(wHip*0.85)} ${f2(hipY-2.4*u)} L${f2(wHip*0.55)} ${f2(hipY+1.2*u)} Q0 ${f2(hipY+0.4*u)} ${f2(-wHip*0.55)} ${f2(hipY+1.2*u)}z`,'skin',1,'line']);
      return out; },
    boneLeg(xc,hipY,lw){ const d=`M${f2(xc)} ${f2(hipY+0.5)} L${f2(xc)} -0.6`; return [[d,null,lw+1.2,'line'],[d,null,lw,'skin'],[ell(f2(xc),f2(hipY/2),f2(lw*0.9),f2(lw*0.8)),'skin',0.8,'line']]; }
  };
  // ---- the kinds: the ranges of their measures [at gene 0, more at gene 1], their colours, face, feet, gear, extras ----
  const HUMANOIDS={
    imp:{ px:24, height:0.6, worker:true, cloth:true, hipY:-10, bodyH:[13.6,3.8], hip:[5.6,6], sh:[6,3], legW:[2.2,1.8], legX:0.5, legK:[0.8,0.6], line:1.4,
      head:{ w:[7,2.6], h:[16.5,4.5], chinH:0.2, chinK:1, over:1.6, sink:8 }, hand:[2.4,0.6], handOut:4.5, handGap:2, pad:3,
      face:'imp', feet:['claws','paws','clumps'], belt:'rope', helm:'plain', ears:'imp', sack:true, tail:true, scar:false,
      weapons:['pick','club'], weapon:'pick', presets:IMP_PRESETS, base:PAL.imp,
      skins:[{ skin:'#8c3a1c', light:'#a8522a', dark:'#46160a', leg:'#7a3018', brow:'#2a0c06' },{ skin:'#7a3219', light:'#94431f', dark:'#3e140a', leg:'#6a2b15', brow:'#260a04' },{ skin:'#5a3a34', light:'#6e4a42', dark:'#2a1714', leg:'#4e322d', brow:'#1a0d0b' }],
      eye:['#ffb020','#c4f4ff'], socket:['#120604','#05070a'], glow:[[255,150,30],[120,220,255]], glowA:0.48 },
    ork:{ px:48, height:1.12, hipY:-12, bodyH:[24,4], hip:[8.5,3], sh:[13,3], legW:[5.2,2], legX:0.55, legK:[1,0.3], line:1.7,
      head:{ w:[8,2], h:[13,3], chinH:0.1, chinK:0.3, over:3.5, sink:4 }, hand:[3.2,0.6], handOut:4, handGap:3, pad:9,
      face:'ork', feet:['boots','wraps','claws'], belt:'band', helm:'horns', scar:true, cloth:true,
      weapons:['axe','club','sword','hammer','spear','dagger','bow','staff'], weapon:'axe', presets:ORK_PRESETS, base:PAL.ork,
      skins:[{ skin:'#3a5228', light:'#4a6534', dark:'#1e2c14', leg:'#2e4220', brow:'#0f180a' },{ skin:'#3c4730', light:'#4c583b', dark:'#20271a', leg:'#2f3827', brow:'#11160d' },{ skin:'#4a463c', light:'#5a554a', dark:'#26231e', leg:'#3a3730', brow:'#15130f' }],
      eye:['#ff4a1e','#f0d040'], glow:[[255,60,20],[240,200,40]], glowA:0.42 },
    // the first wave of the others (user, November 2026: brighter colours than the ork's for the next creatures)
    goblin:{ px:32, height:0.75, hipY:-9, bodyH:[11.5,3], hip:[5,2.5], sh:[6,2.5], legW:[2.1,1.2], legX:0.5, legK:[0.85,0.35], line:1.3,
      head:{ w:[7.5,2.2], h:[12.5,3], chinH:0.15, chinK:0.5, over:2, sink:3 }, hand:[2.2,0.5], handOut:4, handGap:2, pad:3,
      face:'goblin', ears:'goblin', feet:['claws','bare','shoes'], belt:'rope', helm:'plain', armour:false, cloth:true, clothed:true,
      weapons:['dagger','club','spear','bow'], weapon:'dagger', presets:GOBLIN_PRESETS, base:Object.assign({},PAL.imp,{ tunic:'#6e5a34', tunicDark:'#4a3c22', trim:'#5a3a24', cloth:'#5a3a24', foot:'#3a2a18', pupil:'#1a1000' }),
      skins:[{ skin:'#7a9a30', light:'#94b444', dark:'#3e5014', leg:'#5a4a2a', brow:'#2a3010' },{ skin:'#8aa83a', light:'#a4c252', dark:'#46581a', leg:'#5a4a2a', brow:'#2e3612' },{ skin:'#9a9a50', light:'#b4b468', dark:'#4e4e22', leg:'#5a4a2a', brow:'#34341a' }],
      eye:['#f4d040','#ff8a30'], glow:[[244,208,64],[255,138,48]], glowA:0.4 },
    troll:{ px:64, height:1.45, hipY:-14, bodyH:[27,6], hip:[10.5,3], sh:[16,4], legW:[7,2.5], legX:0.55, legK:[0.9,0.3], line:1.9,
      head:{ w:[7.5,1.5], h:[11.5,2], chinH:0.1, chinK:0.2, over:0.3, sink:1.5 }, hand:[4.4,1], handOut:4.5, handGap:3, pad:8,
      face:'brute', crest:true, feet:['clumps','claws','clumps'], belt:'band', helm:'plain', armour:false, cloth:true, scar:true,
      weapons:['club','hammer','axe'], weapon:'club', presets:TROLL_PRESETS, base:Object.assign({},PAL.ork,{ socket:'#0c1214', cloth:'#4a3a2a', bone:'#d8d0bc' }),
      skins:[{ skin:'#5a7e88', light:'#6e949e', dark:'#2e4248', leg:'#4a6a72', brow:'#1e2a2e' },{ skin:'#6a8a96', light:'#80a2ae', dark:'#38484e', leg:'#52707a', brow:'#22302e' },{ skin:'#7a8a78', light:'#92a28e', dark:'#3e4a3c', leg:'#5e6e5c', brow:'#262e24' }],
      eye:['#ffc040','#ff5030'], glow:[[255,192,64],[255,80,48]], glowA:0.4 },
    darkelf:{ px:48, height:1.03, hipY:-14, bodyH:[21,3], hip:[6.8,1.8], sh:[9,2.5], legW:[3.4,1], legX:0.5, legK:[1,0.3], line:1.5,
      head:{ w:[6.4,1.2], h:[13.5,2], chinH:0.25, chinK:1, over:2.5, sink:2 }, hand:[2.5,0.4], handOut:4, handGap:2.5, pad:6,
      face:'fine', ears:'elf', hair:'long', feet:['boots','shoes','boots'], belt:'band', helm:'crest', armour:false, clothed:true,
      weapons:['sword','dagger','bow','staff','spear'], weapon:'sword', presets:ELF_PRESETS, base:Object.assign({},PAL.ork,{ tunic:'#3a3256', tunicDark:'#241e38', trim:'#a040a0', foot:'#1a1424', belt:'#2a2038', gold:'#c0b0d8', hair:'#e8e6f0', hairDark:'#a8a4bc', pupil:'#200028' }),
      skins:[{ skin:'#6a6aa8', light:'#8484c0', dark:'#3a3a66', leg:'#2c2640', brow:'#d8d6e8' },{ skin:'#7a74a0', light:'#948eb8', dark:'#443e60', leg:'#2c2640', brow:'#d8d6e8' },{ skin:'#5a6488', light:'#727ca2', dark:'#323a54', leg:'#2c2640', brow:'#d8d6e8' }],
      eye:['#f0e8ff','#c060ff'], glow:[[220,200,255],[190,90,255]], glowA:0.45 },
    vampire:{ px:48, hipY:-13, bodyH:[21,3], hip:[7,1.8], sh:[9.5,2.5], legW:[3.4,1], legX:0.5, legK:[1,0.25], line:1.5,
      head:{ w:[6.5,1.2], h:[13.5,2], chinH:0.25, chinK:0.9, over:2.5, sink:2 }, hand:[2.5,0.4], handOut:4, handGap:2.5, pad:6,
      face:'fine', fangs:true, hair:'slick', collar:true, cape:true, feet:['shoes','boots','shoes'], belt:'band', helm:'plain', armour:false, clothed:true,
      weapons:['sword','dagger','staff'], weapon:'none', presets:VAMPIRE_PRESETS, base:Object.assign({},PAL.ork,{ tunic:'#2a1c24', tunicDark:'#140c12', trim:'#a02234', foot:'#0e0a0c', belt:'#3a1420', gold:'#c8a050', hair:'#1e1418', hairDark:'#4a3440', cape:'#1e1418', capeIn:'#9a1c2c', pupil:'#1a0004' }),
      skins:[{ skin:'#e4dcdc', light:'#f4ecec', dark:'#a8989c', leg:'#2a1c24', brow:'#2a1c22' },{ skin:'#d8d0d0', light:'#ece4e4', dark:'#9c8e90', leg:'#2a1c24', brow:'#2a1c22' },{ skin:'#c8ccd8', light:'#dce0ec', dark:'#8c90a0', leg:'#2a1c24', brow:'#2a1c22' }],
      eye:['#ff3040','#ffb030'], glow:[[255,48,64],[255,176,48]], glowA:0.45 },
    warlock:{ px:48, hipY:-12, bodyH:[19,3], hip:[7,2], sh:[8.5,2], legW:[4,1], legX:0.5, legK:[1,0.2], line:1.5,
      head:{ w:[6.5,1], h:[12.5,2], chinH:0.1, chinK:0.5, over:2.5, sink:2 }, hand:[2.5,0.4], handOut:4.5, handGap:2.5, pad:10,
      face:'hood', hood:true, lower:'robe', feet:['bare','bare','bare'], belt:'rope', helm:'plain', armour:false, clothed:true,
      weapons:['staff','dagger'], weapon:'staff', presets:WARLOCK_PRESETS, base:Object.assign({},PAL.ork,{ tunic:'#3a2e52', tunicDark:'#221a32', trim:'#c08a30', belt:'#c08a30', void:'#050308', socket:'#050308' }),
      skins:[{ skin:'#a89a8a', light:'#c0b2a2', dark:'#6a5e50', leg:'#3a2e52', brow:'#2a2030' },{ skin:'#8a9a7a', light:'#a2b292', dark:'#566248', leg:'#3a2e52', brow:'#2a2030' },{ skin:'#9a8aa8', light:'#b2a2c0', dark:'#5e5068', leg:'#3a2e52', brow:'#2a2030' }],
      eye:['#ffffff','#80f0ff'], glow:[[255,240,220],[120,240,255]], glowA:0.5 }
  };
  // ---- the realistic body plan (user, November 2026: the human as the baseline, a grim realism; the skeleton is a human without the flesh) ----
  // Proportions of a grown man: about seven and a half heads high, a neck, sloping shoulders that end in the shoulder cap (no arms: the hands float),
  // a waist, the pelvis, thigh and shin with a knee between. The forms are smooth curves through measured points (Catmull-Rom), so the gear's rules
  // (helmet to the brows, breastplate to the waist, shoulder plates on the shoulder's edge) work on them as on every other kind.
  function spline(ctrl,n,closed){
    const out=[], m=ctrl.length, at=i=>closed?ctrl[(i+m)%m]:ctrl[Math.max(0,Math.min(m-1,i))], segs=closed?m:m-1;
    for(let i=0;i<segs;i++){ const p0=at(i-1), p1=at(i), p2=at(i+1), p3=at(i+2);
      for(let k=0;k<n;k++){ const t=k/n, t2=t*t, t3=t2*t; out.push([0,1].map(j=>0.5*(2*p1[j]+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t3))); } }
    if(!closed) out.push(ctrl[m-1]); return out;
  }
  // a symmetric closed form from its right half (from the top centre down to the bottom centre): top, the right side, the bottom, the left side
  function symForm(right,n){ const R=spline(right,n), L=R.slice(1,-1).reverse().map(([x,y])=>[-x,y]); return R.concat(L); }
  const sp=(ctrl,n)=>ptsPath(spline(ctrl,n||4,true));       // a smooth closed shape
  // is (x, y) inside the polygon
  const inside=(pts,x,y)=>{ let c=false; for(let i=0,j=pts.length-1;i<pts.length;j=i++){ const [xi,yi]=pts[i], [xj,yj]=pts[j]; if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi) c=!c; } return c; };
  const area=pts=>pts.reduce((a,p,i)=>{ const q=pts[(i+1)%pts.length]; return a+p[0]*q[1]-q[0]*p[1]; },0);
  // a shape with a hole (the hole wound the other way round: it stays open with the nonzero rule, in SVG and on the canvas)
  const withHole=(outer,hole)=>ptsPath(outer)+' '+ptsPath(Math.sign(area(outer))===Math.sign(area(hole))?hole.slice().reverse():hole);
  const ellPts=(cx,cy,rx,ry,n)=>Array.from({ length:n||24 },(_,i)=>{ const a=i/(n||24)*Math.PI*2; return [cx+Math.cos(a)*rx,cy+Math.sin(a)*ry]; });
  // the human face: small eyes with their whites, the lid's crease, shadowed sockets, a nose, the folds beside it, a mouth; drawn to the head's size
  FACES.human=function({ aw, h, top, chinY },g){
    const ey=top+0.5*h, ex=-aw*0.4, erx=aw*0.2, ery=erx*0.45, ir=ery*0.95, ny=top+0.71*h, my=top+0.83*h, F='faceLine';
    const alm=`M${f2(ex-erx)} ${f2(ey+0.1)} Q${f2(ex-erx*0.2)} ${f2(ey-ery*1.3)} ${f2(ex+erx)} ${f2(ey-0.1)} Q${f2(ex)} ${f2(ey+ery*1.1)} ${f2(ex-erx)} ${f2(ey+0.1)}z`;
    return { eye:[[alm,'sclera',0.4,'line'],[`M${f2(ex-erx*1.05)} ${f2(ey-0.05)} Q${f2(ex-erx*0.1)} ${f2(ey-ery*1.9)} ${f2(ex+erx*1.05)} ${f2(ey-0.3)}`,null,0.7,'line']],
      pupil:[[ell(f2(ex+0.05),f2(ey),f2(ir),f2(ir)),'eye',0],[ell(f2(ex+0.05),f2(ey),f2(ir*0.42),f2(ir*0.42)),'pupil',0]], eyeAt:[f2(ex),f2(ey)], pupilIn:0.05, lookK:0.25,
      lid:[[`M${f2(ex-erx)} ${f2(ey)} Q${f2(ex)} ${f2(ey+ery*0.7)} ${f2(ex+erx)} ${f2(ey)}`,null,0.8,'line']],
      brow:[[`M${f2(ex-erx*1.35)} ${f2(ey-ery*2.2)} L${f2(ex+erx*1.15)} ${f2(ey-ery*2.4)} L${f2(ex+erx*1.1)} ${f2(ey-ery*1.6)} L${f2(ex-erx*1.2)} ${f2(ey-ery*1.5)}z`,'brow',0]], browAt:[f2(ex),f2(ey-ery*2)], browY:ey-ery*3.4,
      nose:[[ell(f2(ex),f2(ey-0.3*ery),f2(erx*1.35),f2(ery*2.1)),'shadeFace',0],[ell(f2(-ex),f2(ey-0.3*ery),f2(erx*1.35),f2(ery*2.1)),'shadeFace',0],       // the sockets in shadow
        [`M${f2(aw*0.06)} ${f2(ey-ery)} Q${f2(aw*0.16)} ${f2(ny-0.08*h)} ${f2(aw*0.15)} ${f2(ny)}`,null,0.6,F],       // the nose's shaded side
        [`M${f2(-aw*0.17)} ${f2(ny)} Q0 ${f2(ny+0.07*h)} ${f2(aw*0.17)} ${f2(ny)}`,null,0.7,F],[ell(f2(-aw*0.08),f2(ny+0.01*h),0.35,0.22),F,0],[ell(f2(aw*0.08),f2(ny+0.01*h),0.35,0.22),F,0],
        [`M${f2(-aw*0.22)} ${f2(ny+0.02*h)} Q${f2(-aw*0.34)} ${f2(ny+0.07*h)} ${f2(-aw*0.3)} ${f2(my+0.02*h)} M${f2(aw*0.22)} ${f2(ny+0.02*h)} Q${f2(aw*0.34)} ${f2(ny+0.07*h)} ${f2(aw*0.3)} ${f2(my+0.02*h)}`,null,0.5,F],       // the folds beside the nose
        [`M${f2(-aw*0.4)} ${f2(top+0.3*h)} Q0 ${f2(top+0.27*h)} ${f2(aw*0.4)} ${f2(top+0.3*h)} M${f2(-aw*0.3)} ${f2(top+0.35*h)} Q0 ${f2(top+0.33*h)} ${f2(aw*0.3)} ${f2(top+0.35*h)}`,null,0.35,F]],       // lines on the brow
      mouth:[], mouthAt:[0,f2(my)], jaw:[[`M${f2(-aw*0.22)} ${f2(my)} Q0 ${f2(my+0.4)} ${f2(aw*0.22)} ${f2(my)}`,null,0.75,'lip'],[`M${f2(-aw*0.13)} ${f2(my+0.035*h)} Q0 ${f2(my+0.06*h)} ${f2(aw*0.13)} ${f2(my+0.035*h)}`,null,0.5,F]], jawAt:[0,f2(my)] };
  };
  // the feral ork's face (the second ork, on the realistic body plan): narrow glowing eyes deep under a heavy, angry brow ridge, high cheekbones over
  // hollow cheeks, a flat, broken nose, an underbite: the lower jaw juts out, its lip over the upper one, two long tusks rise from it past the mouth's corners.
  // Its paint by a gene: a band of soot across the eyes and stripes down the chin, or ritual scars cut into one cheek and over one brow.
  FACES.orkFeral=function({ aw, h, top, chinY },g){
    const X=x=>f2(x*aw), Y=y=>f2(top+y*h), F='faceLine', ey=0.42, ex=-0.4, erx=0.17*(0.85+0.3*(g.augen===undefined?0.5:g.augen)), ery=0.03, my=0.75, ny=0.58;       // eyes, mouth, the nose's tip
    const P=(pts,n)=>sp(pts.map(([x,y])=>[x*aw,top+y*h]),n||2);       // a smooth shape through points in head units (x by the half width, y by the height)
    const L=(pts)=>'M'+pts.map(([x,y])=>X(x)+' '+Y(y)).join(' L');
    // the eye: a narrow slit, its outer corner up; a faint glow round it in the shadow of the socket
    const eye=[[ell(X(ex),Y(ey),X(erx*1.15),f2(h*ery*2.4)),'glow',0],
      [P([[ex-erx,ey-ery*0.9],[ex-erx*0.2,ey-ery*1.6],[ex+erx,ey+ery*0.4],[ex+erx*0.1,ey+ery*1.2],[ex-erx*0.8,ey+ery*0.5]],2),'eye',0.3,'line']];
    const brow=[[P([[ex-erx*2,ey-ery*4.4],[ex-erx*0.2,ey-ery*4.8],[ex+erx*1.6,ey-ery*1.6],[ex+erx*1.45,ey+ery*0.8],[ex,ey-ery*1.2],[ex-erx*1.8,ey-ery*1.2]],2),'brow',0],
      [P([[ex-erx*1.7,ey-ery*3.8],[ex,ey-ery*4],[ex+erx*1.2,ey-ery*2],[ex,ey-ery*2.8]],2),'browLight',0]];       // the ridge, its upper edge in the light
    const nose=[
      [P([[ex-erx*1.7,ey-ery*1.8],[ex+erx*1.5,ey-ery*0.4],[ex+erx*1.2,ey+ery*3.4],[ex-erx*1.5,ey+ery*2.8]],2),'socketShade',0],[P([[-ex-erx*1.5,ey-ery*0.4],[-ex+erx*1.7,ey-ery*1.8],[-ex+erx*1.5,ey+ery*2.8],[-ex-erx*1.2,ey+ery*3.4]],2),'socketShade',0],       // deep sockets
      [P([[-0.97,0.47],[-0.62,0.52],[-0.34,0.55],[-0.58,0.565],[-0.9,0.56]],2),'light',0],[P([[0.97,0.47],[0.9,0.56],[0.58,0.565],[0.34,0.55],[0.62,0.52]],2),'light',0],       // the high cheekbones catch the light
      [P([[-0.85,0.58],[-0.5,0.61],[-0.44,0.7],[-0.8,0.72]],2),'shadeFace',0],[P([[0.85,0.58],[0.8,0.72],[0.44,0.7],[0.5,0.61]],2),'shade',0],       // the hollows under them
      [P([[-0.27,ny],[-0.06,ny-0.035],[0.08,ny-0.03],[0.29,ny+0.01],[0.25,ny+0.07],[0.08,ny+0.09],[-0.1,ny+0.09],[-0.26,ny+0.065]],2),'light',0.35,'faceLine'],       // the flat, broad nose
      [L([[0.02,ey-0.03],[0.07,ey+0.06],[-0.03,ny-0.03]]),null,0.55,F],       // its bridge, broken (a kink to one side)
      [ell(X(-0.13),Y(ny+0.055),X(0.075),f2(0.02*h))+' '+ell(X(0.13),Y(ny+0.055),X(0.075),f2(0.02*h)),'socket',0],       // flared nostrils
      [`M${X(-0.05)} ${Y(ey-0.1)} L${X(-0.02)} ${Y(ey-0.02)} M${X(0.06)} ${Y(ey-0.1)} L${X(0.03)} ${Y(ey-0.02)}`,null,0.4,F],       // the frown between the brows
      [`M${X(-0.3)} ${Y(ny+0.08)} Q${X(-0.5)} ${Y(ny+0.12)} ${X(-0.54)} ${Y(my+0.02)} M${X(0.3)} ${Y(ny+0.08)} Q${X(0.5)} ${Y(ny+0.12)} ${X(0.54)} ${Y(my+0.02)}`,null,0.5,F]];       // the folds to the mouth's corners
    if((g.bemalung===undefined?0.5:g.bemalung)>=0.5) nose.unshift([P([[-0.95,0.34],[-0.3,0.37],[0,0.42],[0.3,0.37],[0.95,0.34],[0.98,0.49],[0.35,0.5],[0,0.53],[-0.35,0.5],[-0.98,0.49]],2),'paint',0],       // the soot across the eyes
      [[-0.2,0,0.2].map(x=>`M${X(x)} ${Y(0.85)} L${X(x*1.15)} ${Y(0.98)}`).join(' '),null,0.75,'paint','chin']);       // and down the chin (moved onto the jaw below)
    else nose.push([[0,1,2].map(i=>`M${X(0.5+i*0.12)} ${Y(0.53+i*0.035)} L${X(0.32+i*0.12)} ${Y(0.74+i*0.03)}`).join(' '),null,0.45,'scar'],       // three cuts down one cheek
      [`M${X(-0.62)} ${Y(0.22)} L${X(-0.36)} ${Y(0.5)}`,null,0.5,'scar']);       // and one through the brow
    // the lower jaw: the head's outline below the mouth, a little wider (it juts out), outlined round its sides and the chin only; the lower lip over the
    // upper one with small teeth on it; the tusks
    const jl=[[0.97,0.82],[0.92,0.91],[0.64,0.995],[0,1.025],[-0.64,0.995],[-0.92,0.91],[-0.97,0.82]];
    const jaw=[[P([[-0.7,my-0.02],[0,my-0.04],[0.7,my-0.02],[0.95,my+0.02]].concat(jl.slice(0,-1),[[-0.95,my+0.02]]),2),'skin',0],
      ['M'+spline([[0.8,my-0.01]].concat(jl,[[-0.8,my-0.01]]).map(([x,y])=>[x*aw,top+y*h]),3).map(([x,y])=>f2(x)+' '+f2(y)).join(' L'),null,0.8,'line'],
      [P([[0.36,my+0.01],[0.7,my],[0.97,0.83],[0.92,0.91],[0.64,0.99],[0.5,0.88]],2),'shade',0],
      [P([[-0.52,my-0.02],[0,my-0.05],[0.52,my-0.02],[0.38,my+0.035],[0,my+0.045],[-0.38,my+0.035]],2),'light',0.3,'faceLine'],       // the lower lip, jutting into the light
      [[-0.2,0.2].map(x=>`M${X(x-0.05)} ${Y(my-0.035)} L${X(x)} ${Y(my-0.075)} L${X(x+0.05)} ${Y(my-0.035)}z`).join(' '),'bone',0.25,'line'],       // two small lower teeth over the lip
      [`M${X(-0.52)} ${Y(my-0.025)} Q0 ${Y(my-0.065)} ${X(0.52)} ${Y(my-0.025)}`,null,0.45,'line'],       // the mouth's line
      [`M${X(-0.18)} ${Y(0.94)} Q0 ${Y(0.965)} ${X(0.18)} ${Y(0.94)}`,null,0.4,F]];       // the chin's fold
    nose.filter(q=>q[4]==='chin').forEach(q=>{ nose.splice(nose.indexOf(q),1); jaw.push(q.slice(0,4)); });       // the paint on the chin moves with the jaw
    const tl=0.33*h, tb=0.06*h, tx=-0.5*aw, ty=top+(my+0.03)*h;       // a tusk from the jaw up past the upper lip, its tip turned out
    const tusk=[[`M${f2(tx-tb)} ${f2(ty)} Q${f2(tx-tb*1.4)} ${f2(ty-tl*0.55)} ${f2(tx-tb*2)} ${f2(ty-tl)} Q${f2(tx+tb*0.4)} ${f2(ty-tl*0.6)} ${f2(tx+tb)} ${f2(ty)}z`,'bone',0.45,'line'],
      [`M${f2(tx+tb*0.2)} ${f2(ty-0.1)} Q${f2(tx-tb*0.2)} ${f2(ty-tl*0.5)} ${f2(tx-tb*1.6)} ${f2(ty-tl*0.92)}`,null,0.35,'boneDark']];
    return { eye, pupil:[[ell(X(ex+0.01),Y(ey),f2(0.022*aw),f2(h*ery*1.1)),'pupil',0]], eyeAt:[X(ex),Y(ey)], pupilIn:0.01*aw, lookK:0.15,
      lid:[[L([[ex-erx*1.1,ey-ery],[ex+erx*1.1,ey+ery*0.5]]),null,0.9,'line']], brow, browAt:[X(ex),Y(ey-ery*1.8)], browY:top+(ey-ery*5)*h,
      nose, mouth:[[P([[-0.52,my-0.03],[0,my-0.07],[0.52,my-0.03],[0.4,my+0.07],[0,my+0.09],[-0.4,my+0.07]],2),'mouth',0.4,'line'],[ell(0,Y(my+0.06),X(0.25),f2(0.025*h)),'tongue',0]], mouthAt:[0,Y(my-0.04)],
      jaw, jawAt:[0,Y(my-0.04)], tusk, tuskAt:[f2(tx),f2(ty)] };
  };
  // ---- the bones (user, November 2026: the parts must look right; anatomical references: a skull from the front, the pelvis and the thigh bones,
  // the ribcage with the spine, the bones of the lower leg and the foot). Every bone is a filled shape with a thin outline, a shaded side where it turns away. ----
  const BL=0.45;       // the outline of a bone
  // a rib: a flat band along a smooth curve, its outline and its fill
  const bandRib=(pts,w)=>{ const d=ptsPath(spline(pts,4)).replace(/z$/,''); return [[d,null,w*2+BL*2,'line'],[d,null,w*2,'skin']]; };
  // a bone along a line from p to q: its half width at the start, the middle and the end (thicker ends: the joints)
  function boneAlong(p,q,w0,wm,w1){
    const dx=q[0]-p[0], dy=q[1]-p[1], L=Math.hypot(dx,dy)||1, nx=-dy/L, ny=dx/L, at=(t,w,s)=>[p[0]+dx*t+nx*w*s,p[1]+dy*t+ny*w*s];
    const ws=[[0,w0],[0.12,(w0+wm)/2],[0.5,wm],[0.88,(wm+w1)/2],[1,w1]], A=ws.map(([t,w])=>at(t,w,1)), B=ws.map(([t,w])=>at(t,w,-1)).reverse();
    return A.concat(B);
  }
  const boneShape=(pts,n)=>[[sp(pts,n||2),'skin',BL,'line'],[formShade(spline(pts,n||2,true),pts.reduce((a,q)=>a+q[0],0)/pts.length),'boneShade',0]];
  // the skull from the front: the vault, the temples narrowing, the cheekbones flaring out under the eyes, the upper jaw with its teeth (the lower jaw is a part of its own)
  function cranium(A,back){
    const { aw, h, top }=A, X=x=>x*aw, Y=y=>top+y*h;
    const pts=symForm([[0,0],[0.52,0.025],[0.82,0.11],[0.97,0.25],[1,0.37],[0.95,0.48],[0.9,0.54],[0.99,0.6],[0.93,0.665],[0.74,0.69],[0.6,0.74],[0.5,0.8],[0.25,0.815],[0,0.815]].map(([x,y])=>[X(x),Y(y)]),4);
    const out=[[ptsPath(pts),'skin',BL*1.2,'line'],[formShade(pts,0),'boneShade',0]];
    if(back){ out.push([`M${f2(X(-0.75))} ${f2(Y(0.3))} Q0 ${f2(Y(0.18))} ${f2(X(0.75))} ${f2(Y(0.3))} M0 ${f2(Y(0.02))} L${f2(X(0.03))} ${f2(Y(0.22))}`,null,0.3,'boneDark'],[ell(0,f2(Y(0.74)),f2(X(0.22)),f2(X(0.16))),'socket',BL,'line']); return { pts, shapes:out }; }       // from behind: the sutures, the hole for the spine
    // the temples (hollows over the cheekbones), the shadow under the cheekbones
    [-1,1].forEach(s=>{ out.push([sp([[s*0.9,0.4],[s*0.97,0.47],[s*0.9,0.56],[s*0.8,0.5]].map(([x,y])=>[X(x),Y(y)]),2),'boneShade',0],[sp([[s*0.93,0.645],[s*0.74,0.7],[s*0.62,0.755],[s*0.66,0.7],[s*0.8,0.665]].map(([x,y])=>[X(x),Y(y)]),2),'boneShade',0]); });
    // the sutures of the vault, faint
    out.push([`M${f2(X(-0.6))} ${f2(Y(0.06))} Q${f2(X(-0.2))} ${f2(Y(0.14))} ${f2(X(0.05))} ${f2(Y(0.1))} Q${f2(X(0.35))} ${f2(Y(0.06))} ${f2(X(0.62))} ${f2(Y(0.08))}`,null,0.3,'boneDark']);
    // the upper teeth: eight in a row under the gum's line, the outer ones smaller
    const teeth=[]; for(let i=0;i<8;i++){ const x0=-0.42+i*0.105, x1=x0+0.095, k=1-Math.abs(i-3.5)/6, y0=0.745+0.015*(1-k), y1=0.81-0.012*(1-k); teeth.push(`M${f2(X(x0))} ${f2(Y(y0))} L${f2(X(x1))} ${f2(Y(y0))} L${f2(X(x1-0.005))} ${f2(Y(y1))} Q${f2(X((x0+x1)/2))} ${f2(Y(y1+0.012))} ${f2(X(x0+0.005))} ${f2(Y(y1))}z`); }
    out.push([teeth.join(' '),'tooth',0.12,'line']);
    return { pts, shapes:out };
  }
  // the face of the skull: square-round orbits slanting outward, the pear of the nose with its septum, the brow's ridge; the lower jaw with its teeth (drops when it roars)
  FACES.skullReal=function({ aw, h, top },g){
    const X=x=>x*aw, Y=y=>top+y*h, ex=-0.38, ey=0.475, ro=0.27+0.03*g.augen;
    const orbit=spline([[ex-ro,ey-0.06],[ex-ro*0.3,ey-0.105],[ex+ro*0.85,ey-0.09],[ex+ro,ey+0.02],[ex+ro*0.55,ey+0.1],[ex-ro*0.5,ey+0.095],[ex-ro*1.08,ey+0.02]].map(([x,y])=>[X(x),Y(y)]),3,true);
    const nose=spline([[0,0.555],[0.075,0.6],[0.13,0.665],[0.11,0.7],[0.03,0.69],[0,0.7],[-0.03,0.69],[-0.11,0.7],[-0.13,0.665],[-0.075,0.6]].map(([x,y])=>[X(x),Y(y)]),3,true);
    const R=s=>[[0,0.83],[0.42,0.825],[0.56,0.805],[0.64,0.76],[0.7,0.72],[0.77,0.735],[0.79,0.84],[0.71,0.93],[0.45,0.985],[0.18,1.01],[0,1.0]].map(([x,y])=>[X(s*x),Y(y)]);
    const mand=R(1).concat(R(-1).reverse());
    const teeth=[]; for(let i=0;i<8;i++){ const x0=-0.4+i*0.1, x1=x0+0.09, k=1-Math.abs(i-3.5)/6, y0=0.815, y1=0.86-0.01*(1-k); teeth.push(`M${f2(X(x0))} ${f2(Y(y1))} L${f2(X(x1))} ${f2(Y(y1))} L${f2(X(x1-0.005))} ${f2(Y(y0+0.005))} Q${f2(X((x0+x1)/2))} ${f2(Y(y0-0.008))} ${f2(X(x0+0.005))} ${f2(Y(y0+0.005))}z`); }
    return { eye:[[ptsPath(orbit),'socket',BL,'line'],[sp([[ex-ro*0.9,ey-0.04],[ex+ro*0.8,ey-0.07],[ex+ro*0.6,ey-0.01],[ex-ro*0.6,ey+0.02]].map(([x,y])=>[X(x),Y(y)]),2),'socketDeep',0]],
      pupil:[[ell(f2(X(ex+0.02)),f2(Y(ey+0.01)),f2(X(0.1)),f2(X(0.1))),'glow',0],[ell(f2(X(ex+0.02)),f2(Y(ey+0.01)),f2(X(0.035)),f2(X(0.035))),'eye',0]], eyeAt:[f2(X(ex)),f2(Y(ey))], pupilIn:0.05, lookK:0.12,
      lid:[], brow:[[`M${f2(X(ex-ro*1.1))} ${f2(Y(ey-0.105))} Q${f2(X(ex))} ${f2(Y(ey-0.145))} ${f2(X(ex+ro*1.05))} ${f2(Y(ey-0.11))}`,null,0.5,'boneDark']], browAt:[f2(X(ex)),f2(Y(ey-0.12))], browY:Y(ey-0.13), noBlink:true,
      nose:[[ptsPath(nose),'socket',BL,'line'],[`M0 ${f2(Y(0.625))} L0 ${f2(Y(0.695))}`,null,0.35,'skin'],[`M${f2(X(-0.08))} ${f2(Y(0.53))} Q0 ${f2(Y(0.56))} ${f2(X(0.08))} ${f2(Y(0.53))}`,null,0.3,'boneDark']],
      mouth:[], mouthAt:[0,f2(Y(0.82))], jaw:[[ptsPath(mand),'skin',BL*1.2,'line'],[formShade(mand,0),'boneShade',0],[teeth.join(' '),'tooth',0.12,'line'],
        [ell(f2(X(-0.38)),f2(Y(0.93)),0.22,0.18)+' '+ell(f2(X(0.38)),f2(Y(0.93)),0.22,0.18),'boneDark',0]], jawAt:[0,f2(Y(0.8))] };
  };
  // a hand of bones, curled to a fist: the back of the hand, four fingers of bones folded in front, the thumb across
  function boneFist(cx,cy,r){
    const out=[[ell(f2(cx-0.15*r),f2(cy),f2(0.72*r),f2(0.9*r)),'hand',BL,'line']];
    for(let j=0;j<4;j++){ const y=cy-0.7*r+j*0.46*r; out.push([sp([[cx+0.05*r,y-0.17*r],[cx+0.85*r,y-0.15*r],[cx+0.92*r,y+0.02*r],[cx+0.85*r,y+0.18*r],[cx+0.05*r,y+0.18*r]],2),'hand',BL,'line'],[`M${f2(cx+0.48*r)} ${f2(y-0.16*r)} L${f2(cx+0.48*r)} ${f2(y+0.17*r)}`,null,0.3,'line']); }
    out.push([sp([[cx-0.65*r,cy-0.62*r],[cx+0.2*r,cy-0.98*r],[cx+0.42*r,cy-0.86*r],[cx-0.5*r,cy-0.42*r]],2),'hand',BL,'line']);
    return out;
  }
  // ---- the second skeleton (user, November 2026: black sockets instead of eyes; less detail, more fantasy: we draw it at 64 pixels anyway) ----
  // Fewer, heavier parts: a bigger skull with a crack, angry slanting sockets and a few big teeth; six broad ribs a side straight to the breastbone;
  // three chunky lumbar vertebrae; a simple pelvis; thick bones with knobby joints; bold outlines.
  const BF=0.75;       // its outline
  const fBone=(pts,n)=>[[sp(pts,n||2),'skin',BF,'line'],[formShade(spline(pts,n||2,true),pts.reduce((a,q)=>a+q[0],0)/pts.length),'boneShade',0]];
  const fKnob=(x,y,rx,ry)=>[ell(f2(x),f2(y),f2(rx),f2(ry)),'skin',BF,'line'];
  function craniumF(A,back){
    const { aw, h, top }=A, X=x=>x*aw, Y=y=>top+y*h;
    const pts=symForm([[0,0],[0.55,0.03],[0.86,0.13],[1,0.3],[1,0.44],[0.93,0.53],[1.03,0.6],[0.9,0.69],[0.64,0.745],[0.54,0.81],[0.26,0.83],[0,0.83]].map(([x,y])=>[X(x),Y(y)]),3);
    const out=[[ptsPath(pts),'skin',BF*1.2,'line'],[formShade(pts,0),'boneShade',0],
      [`M${f2(X(-0.42))} ${f2(Y(0.03))} L${f2(X(-0.3))} ${f2(Y(0.13))} L${f2(X(-0.38))} ${f2(Y(0.19))} L${f2(X(-0.24))} ${f2(Y(0.3))}`,null,0.6,'line']];       // the crack
    if(back) return { pts, shapes:out.concat([[ell(0,f2(Y(0.76)),f2(X(0.24)),f2(X(0.18))),'socket',BF,'line']]) };
    [-1,1].forEach(s=>out.push([sp([[s*0.9,0.42],[s*0.98,0.5],[s*0.88,0.57],[s*0.8,0.5]].map(([x,y])=>[X(x),Y(y)]),2),'boneShade',0]));
    const teeth=[]; for(let i=0;i<6;i++){ const x0=-0.43+i*0.145, x1=x0+0.135; teeth.push(`M${f2(X(x0))} ${f2(Y(0.75))} L${f2(X(x1))} ${f2(Y(0.75))} L${f2(X(x1-0.01))} ${f2(Y(0.825))} L${f2(X(x0+0.01))} ${f2(Y(0.825))}z`); }
    out.push([teeth.join(' '),'tooth',0.22,'line']);
    return { pts, shapes:out };
  }
  FACES.skullFantasy=function({ aw, h, top },g){
    const X=x=>x*aw, Y=y=>top+y*h, ex=-0.4, ey=0.47, r=0.29+0.04*g.augen;
    const orbit=[[ex-r*1.05,ey-0.09],[ex+r*0.95,ey-0.02],[ex+r,ey+0.07],[ex+r*0.35,ey+0.12],[ex-r*0.65,ey+0.11],[ex-r*1.1,ey+0.01]].map(([x,y])=>[X(x),Y(y)]);       // the inner corner lower: a grim look
    const R=s=>[[0,0.84],[0.48,0.835],[0.6,0.78],[0.72,0.74],[0.8,0.77],[0.79,0.88],[0.66,0.96],[0.4,1.01],[0,1.02]].map(([x,y])=>[X(s*x),Y(y)]), mand=R(1).concat(R(-1).reverse());
    const teeth=[]; for(let i=0;i<6;i++){ const x0=-0.42+i*0.14, x1=x0+0.13; teeth.push(`M${f2(X(x0))} ${f2(Y(0.9))} L${f2(X(x1))} ${f2(Y(0.9))} L${f2(X(x1-0.01))} ${f2(Y(0.835))} L${f2(X(x0+0.01))} ${f2(Y(0.835))}z`); }
    return { eye:[[sp(orbit,2),'socket',BF,'line']], pupil:[], eyeAt:[f2(X(ex)),f2(Y(ey))], pupilIn:0, lookK:0, lid:[], noBlink:true,
      brow:[[sp([[ex-r*1.15,ey-0.13],[ex+r*1.05,ey-0.05],[ex+r*1.0,ey-0.015],[ex-r*1.1,ey-0.085]].map(([x,y])=>[X(x),Y(y)]),2),'boneDark',0]], browAt:[f2(X(ex)),f2(Y(ey-0.1))], browY:Y(ey-0.14),
      nose:[[sp([[0,0.57],[0.12,0.66],[0.08,0.71],[0,0.68],[-0.08,0.71],[-0.12,0.66]].map(([x,y])=>[X(x),Y(y)]),2),'socket',BF*0.8,'line']],
      mouth:[], mouthAt:[0,f2(Y(0.83))], jaw:[[ptsPath(mand),'skin',BF*1.2,'line'],[formShade(mand,0),'boneShade',0],[teeth.join(' '),'tooth',0.22,'line']], jawAt:[0,f2(Y(0.8))] };
  };
  function boneFistF(cx,cy,r){
    const out=[[ell(f2(cx-0.15*r),f2(cy),f2(0.75*r),f2(0.92*r)),'hand',BF,'line']];
    for(let j=0;j<3;j++){ const y=cy-0.6*r+j*0.6*r; out.push([sp([[cx+0.05*r,y-0.24*r],[cx+0.9*r,y-0.2*r],[cx+0.98*r,y+0.02*r],[cx+0.9*r,y+0.24*r],[cx+0.05*r,y+0.24*r]],2),'hand',BF,'line']); }
    out.push([sp([[cx-0.7*r,cy-0.6*r],[cx+0.25*r,cy-1.02*r],[cx+0.45*r,cy-0.85*r],[cx-0.5*r,cy-0.36*r]],2),'hand',BF,'line']);
    return out;
  }
  Object.assign(EXTRAS,{
    bonesFantasy(A,back){
      const { topY, hipY, wSh, wHip, bodyH, bPts, top, h, u }=A, wC=widthAt(bPts,topY+bodyH*0.42)*0.96, out=[[ptsPath(bPts),null,0]];
      const block=(y,hw,hh)=>out.push([`M${f2(-hw)} ${f2(y)} L${f2(hw)} ${f2(y)} L${f2(hw*0.9)} ${f2(y+hh)} L${f2(-hw*0.9)} ${f2(y+hh)}z`,'skin',BF,'line']);
      const n0=top+h*0.86, n1=topY+0.2*u, nh=(n1-n0)/3; for(let i=0;i<3;i++) block(n0+i*nh,0.75*u,nh*0.8);       // the neck: three
      const sternBot=topY+bodyH*0.32, l0=topY+bodyH*0.5, l1=hipY-6.4*u;
      for(let y=topY+0.4*u;y<l0;y+=1.4*u) block(y,0.6*u,1.1*u);       // the spine behind the ribs (from the front it shows between them and under the breastbone)
      if(back){ [-1,1].forEach(s=>out.push(...fBone([[s*wSh*0.92,topY+0.3*u],[s*wSh*0.45,topY+1.3*u],[s*wC*0.55,topY+bodyH*0.36],[s*wC*0.85,topY+bodyH*0.3]],2))); }
      // six broad ribs a side, from the breastbone down and out round the side
      const Wf=[0.62,0.8,0.92,0.97,0.95,0.85];
      for(let i=0;i<6;i++){ const W=Wf[i]*wC, y=topY+1.3*u+i*1.2*u, d=(0.8+0.42*i)*u, cw=0.5*u, ys=Math.min(y,sternBot-0.6*u);
        [-1,1].forEach(s=>{ const c=ptsPath(spline([[s*1.0*u,ys],[s*W*0.55,y+d*0.75],[s*W*0.88,y+d*0.95],[s*W,y+d*0.45],[s*W*0.94,y-0.1*u]],4)).replace(/z$/,'');
          out.push([c,null,cw*2+BF*2,'line'],[c,null,cw*2,'skin']); }); }
      if(back){ for(let y=topY+0.4*u;y<l0;y+=1.6*u) block(y,0.55*u,1.1*u); }
      else out.push(...fBone([[-1.25*u,topY+0.3*u],[1.25*u,topY+0.3*u],[0.95*u,sternBot-0.8*u],[0,sternBot+0.4*u],[-0.95*u,sternBot-0.8*u]],1));       // the breastbone
      // the collarbones and the shoulders' knobs
      [-1,1].forEach(s=>{ const c=`M${f2(s*1.1*u)} ${f2(topY+0.6*u)} Q${f2(s*wSh*0.5)} ${f2(topY+0.9*u)} ${f2(s*wSh*0.86)} ${f2(topY-0.1*u)}`; out.push([c,null,1.5*u+BF*2,'line'],[c,null,1.5*u,'skin'],fKnob(s*wSh*0.92,topY+0.5*u,1.1*u,0.95*u)); });
      // the lumbar spine: three chunky vertebrae with stubby wings
      const lh=(l1-l0)/3; for(let i=0;i<3;i++){ const y=l0+i*lh; out.push([`M${f2(-2.4*u)} ${f2(y+lh*0.25)} L${f2(2.4*u)} ${f2(y+lh*0.25)} L${f2(2.4*u)} ${f2(y+lh*0.55)} L${f2(-2.4*u)} ${f2(y+lh*0.55)}z`,'skin',BF,'line']); block(y,1.3*u,lh*0.85); }
      // the pelvis, simple: the two wings, the sacrum between, two black holes below
      [-1,1].forEach(s=>{ out.push(...fBone([[s*0.8*u,hipY-5.6*u],[s*wHip*0.45,hipY-8*u],[s*wHip*0.95,hipY-7.2*u],[s*wHip*0.98,hipY-4.6*u],[s*wHip*0.72,hipY-2.4*u],[s*wHip*0.55,hipY-0.4*u],[s*0.4*u,hipY-0.9*u],[s*0.4*u,hipY-2.6*u],[s*1.6*u,hipY-4.4*u]],2),
        [ell(f2(s*wHip*0.42),f2(hipY-1.7*u),f2(wHip*0.15),f2(0.8*u)),'socket',BF,'line']); });
      out.push(...fBone([[-2.2*u,hipY-6.6*u],[2.2*u,hipY-6.6*u],[0.9*u,hipY-2.8*u],[0,hipY-2.1*u],[-0.9*u,hipY-2.8*u]],1));
      return out;
    },
    boneLegFantasy(A){
      const { hipY, wHip, u, legs:{ xk, xa, kneeY, ankY } }=A, hx=-wHip*0.62, hy=hipY-3*u;
      const thigh=[...fBone(boneAlong([hx-0.9*u,hipY-1.8*u],[xk,kneeY-1*u],0.95*u,0.72*u,1.1*u),1),fKnob(hx-1.3*u,hipY-2.2*u,1.0*u,1.1*u),fKnob(hx+0.1*u,hy+0.2*u,1.0*u,1.0*u),
        fKnob(xk-0.75*u,kneeY-0.9*u,0.9*u,0.75*u),fKnob(xk+0.75*u,kneeY-0.9*u,0.9*u,0.75*u)];
      const shin=[...fBone(boneAlong([xk-1.15*u,kneeY+1.2*u],[xa-0.9*u,ankY+0.3*u],0.42*u,0.3*u,0.45*u),1),...fBone(boneAlong([xk+0.2*u,kneeY+0.6*u],[xa+0.3*u,ankY+0.2*u],1.15*u,0.68*u,0.85*u),1),
        fKnob(xk,kneeY-0.15*u,1.0*u,1.1*u),fKnob(xa+0.75*u,ankY+0.2*u,0.6*u,0.6*u),fKnob(xa-0.95*u,ankY+0.4*u,0.5*u,0.6*u)];
      const fx=xa-0.4*u, foot=[fKnob(fx,ankY+1.3*u,1.3*u,1.0*u)];
      for(let i=0;i<3;i++){ const k=i-1; foot.push(...fBone(boneAlong([fx+k*0.6*u,ankY+1.9*u],[fx+k*1.1*u-0.8*u,-0.2],0.42*u,0.32*u,0.42*u),1)); }
      return { thigh, shin, foot };
    }
  });
  // one realistic humanoid's parts (the same fields as humanoidShapes gives, plus a shin with its knee)
  function realShapes(kind,g,t,back,G){
    const K=HUMANOIDS[kind], lin=(r,v)=>r[0]+r[1]*v, sw=K.line, st=t.stark===undefined?0.5:t.stark, plump=g.koerper===undefined?0.4:g.koerper, gx=k=>g[k]===undefined?0.5:g[k];
    const hipY=K.hipY, bodyH=lin(K.bodyH,plump), topY=hipY-bodyH, u=bodyH/21;
    // measured on the user's reference (a man in linen, 77 units from the soles to the crown): the deltoids' outer edge wSh, the chest under the arms
    // wChest, the hips; a male torso is a box (the waist hardly narrower), the shirt hangs straight to just above the crotch
    const wSh=lin(K.sh,plump)*(0.82+0.4*st), wChest=wSh*0.84+0.4, wHip=lin(K.hip,plump)*(0.96+0.08*st), wWaist=wChest*(0.9+0.12*plump)*(K.waistK||1), sq=gx('koerperForm');       // strength: the shoulders much more than the hips (waistK: a narrower waist, the feral ork)
    // the head on a short, thick neck
    const HD=K.head, h=lin(HD.h,gx('kopf')), aw=lin(HD.w,gx('kopf'))*(0.94+0.12*gx('kopfForm')), chinY=topY-(3.3-1.2*gx('tief'))*u*(K.neckK||1), top=chinY-h, cy=top+h*0.45;
    const jaw=0.74+0.22*gx('kopfForm'), chinW=aw*(0.5-0.2*gx('kinn'));
    const hPts=K.feral?symForm([[0,top],[aw*0.42,top+0.02*h],[aw*0.7,top+0.11*h],[aw*0.83,top+0.26*h],[aw*0.88,top+0.4*h],[aw*1.0,top+0.52*h],[aw*0.87,top+0.65*h],[aw*(0.9+0.08*gx('kopfForm')),top+0.8*h],[aw*0.86,top+0.91*h],[aw*(0.66-0.14*gx('kinn')),top+0.99*h],[0,top+h]],5)       // the feral ork: a narrow brow, high cheekbones, hollow cheeks, a broad jutting jaw
      :symForm([[0,top],[aw*0.6,top+0.05*h],[aw*0.93,top+0.23*h],[aw,top+0.42*h],[aw*0.96,top+0.57*h],[aw*0.9,top+0.69*h],[aw*jaw,top+0.84*h],[chinW,top+0.97*h],[0,top+h]],5);
    const skull=K.bones?(K.boneStyle==='fantasy'?craniumF:cranium)({ aw, h, top },back).shapes:[[ptsPath(hPts),'skin',sw*0.85],[formShade(hPts,0),'shade',0]];       // the skeleton: the skull itself (the head's outline still fits the gear)
    if(!K.bones&&!back&&!K.feral) skull.push([`M${f2(aw*0.62)} ${f2(top+0.6*h)} Q${f2(aw*0.8)} ${f2(top+0.75*h)} ${f2(aw*0.55)} ${f2(top+0.88*h)}`,null,0.5,'faceLine']);       // under the cheekbone
    // the torso: the neck's base, the trapezius sloping to the round shoulder (the deltoid, where the arm would hang), under it the chest's side, a box down to the hips
    const nw=aw*0.84*(K.neckW||1), slope=(1-sq)*0.8*u;
    const bPts=symForm([[0,chinY+1],[nw,chinY+0.8],[nw*1.06,topY-1.2*u],[wSh*0.62,topY-0.5*u+slope],[wSh*0.88,topY+0.4*u+slope*0.6],[wSh,topY+2.2*u],[wSh*0.96,topY+3.9*u],[wChest*0.98,topY+5*u],
      [wChest,topY+bodyH*0.4],[wWaist,hipY-bodyH*0.25],[wHip,hipY-1*u],[wHip*0.95,hipY+1.4*u],[wHip*0.4,hipY+2.2*u],[0,hipY+2*u]],4);
    // the legs in a slight A: the thigh from the hip, the knee and the ankle a little further out; a foot of its own
    const lw=lin(K.legW,plump)*(0.95+0.1*st), xh=-wHip*0.52, xk=xh-0.9*u, xa=xh-2*u, xc=xh, kneeY=hipY*0.52, ankY=-4.2*u*0.85, L={ xc, xh, xk, xa, lw, kneeY, ankY };
    const A={ topY, hipY, wSh, wHip, wWaist, bodyH, bPts, hPts, top, h, aw, cy, chinY, u, sw, legs:L, shieldK:K.shieldK, pauldronK:K.pauldronK, emblem:K.emblem, clothW:K.clothW, clothL:K.clothL, shoulderY:topY+1.8*u, beltY:hipY-5.2*u };
    const face=(FACES[K.face]||FACES.human)({ aw, h, top, cy, chinY },g,K); A.browY=face.browY;
    let body, belly=[], leg, shin, foot;
    if(K.bones){ const F=K.boneStyle==='fantasy'; body=F?EXTRAS.bonesFantasy(A,back):EXTRAS.bonesReal(A,back); const bl=F?EXTRAS.boneLegFantasy(A):EXTRAS.boneLegReal(A); leg=bl.thigh; shin=bl.shin; foot=bl.foot; }
    else {
      const skinP=K.clothed?above(bPts,hipY-1.4*u):bPts;       // in a shirt the skin ends under its hem (the trousers show below it)
      body=[[ptsPath(skinP),'skin',sw],[formShade(skinP,0),'shade',0],[`M${f2(-nw*0.9)} ${f2(chinY+1.6)} Q0 ${f2(chinY+2.8)} ${f2(nw*0.9)} ${f2(chinY+1.6)}`,null,1.4,'shadeFace']];       // the shadow under the chin
      if(K.clothed){       // a sleeveless linen shirt: the shoulders bare, a round neckline, straight sides down to just above the crotch, a frayed hem
        const hemY=hipY-0.9*u, tun=symForm([[0,topY+0.9*u],[nw*1.22,topY-1.1*u],[wSh*0.64,topY-0.2*u+slope*0.8],[wSh*0.72,topY+2.4*u],[wChest*1.04,topY+5*u],[wChest*1.02,topY+bodyH*0.42],[wWaist*1.0,hipY-bodyH*0.25],[wChest*0.94,hemY-0.4*u],[wChest*0.92,hemY],[0,hemY+0.3*u]],4);
        const hem=[-0.85,-0.55,-0.25,0.05,0.35,0.65,0.9].map(k=>`M${f2(k*wChest)} ${f2(hemY)} l${f2(0.3*u)} ${f2(0.7*u)}`).join(' ');
        body.push([ptsPath(tun),'tunic',sw*0.9],[formShade(tun,0),'shade',0],[`M${f2(-wChest*0.45)} ${f2(topY+4*u)} Q${f2(-wChest*0.5)} ${f2(hipY-7*u)} ${f2(-wChest*0.6)} ${f2(hemY-0.5*u)} M${f2(wChest*0.2)} ${f2(topY+6*u)} Q${f2(wChest*0.15)} ${f2(hipY-6*u)} ${f2(wChest*0.3)} ${f2(hemY-0.5*u)}`,null,0.5,'tunicDark'],[hem,null,0.5,'tunicDark']);
      }
      if(K.feral) body.push(...EXTRAS.feralBody(Object.assign({ wChest, nw },A),back,G));       // the feral ork: bare, lean and hard, a wrap round the hips
      // trousers of linen (or bare legs): loose, straight, a little wider at the hem; no seam at the knee
      const T=K.clothed?1:0, FR=K.feral?1:0, tw=lw*(0.5+0.04*T), kw=lw*(0.47+0.05*T-0.07*FR), aw2=lw*(0.4+0.06*T-0.11*FR);       // (FR: the feral ork's bare legs, lean: a narrower knee and ankle, the calf out)
      const th=[[xh-tw,hipY-1.2*u],[xh+tw*0.96,hipY-1.2*u],[xk+kw*0.96,kneeY],[xk-kw,kneeY]];
      leg=[[sp(th,3),'leg',sw*0.9],[formShade(spline(th,3,true),(xh+xk)/2),'shade',0]];
      const sh=[[xk-kw,kneeY-1.2*u],[xk+kw*0.96,kneeY-1.2*u],[(xk+xa)/2+kw*0.92,kneeY+5*u],[xa+aw2,ankY],[xa-aw2*1.05,ankY],[(xk+xa)/2-kw*(0.98+0.22*FR),kneeY+(5-1.2*FR)*u]];
      // over the knee a patch of the same cloth with the leg's sides drawn on it: thigh and shin read as one leg
      const py0=kneeY-2*u, py1=kneeY+1.4*u, pl0=xk-kw-(xh-xk)*0.12, pl1=xk-kw+(xh-xk)*0.09, pr0=xk+kw*0.96-(xh-xk)*0.12, pr1=xk+kw*0.96+(xh-xk)*0.09;
      shin=[[sp(sh,3),'leg',sw*0.9],[formShade(spline(sh,3,true),(xk+xa)/2),'shade',0],[ptsPath([[pl0+0.35,py0],[pr0-0.35,py0],[pr1-0.3,py1],[pl1+0.3,py1]]),'leg',0],
        [`M${f2(pl0)} ${f2(py0-0.3)} L${f2(pl1)} ${f2(py1+0.3)} M${f2(pr0)} ${f2(py0-0.3)} L${f2(pr1)} ${f2(py1+0.3)}`,null,sw*0.9,'line'],[`M${f2(xk-kw*0.5)} ${f2(kneeY+0.6*u)} Q${f2(xk)} ${f2(kneeY+1.2*u)} ${f2(xk+kw*0.45)} ${f2(kneeY+0.5*u)}`,null,0.5,FR?'faceLine':'tunicDark']];
      if(T) shin.push([[-0.6,0,0.6].map(k=>`M${f2(xa+k*aw2)} ${f2(ankY-0.2)} l${f2(0.25*u)} ${f2(0.7*u)}`).join(' '),null,0.5,'tunicDark']);       // the frayed hem
      // the foot: bare (toes, turned a little outward) or a boot, by the gene
      const ft=gx('fuss'), fw=lw*0.48;
      foot=ft<0.5?[[sp([[xa-fw*0.5,ankY-0.6],[xa+fw*0.5,ankY-0.6],[xa+fw*0.55,-0.8],[xa+fw*0.35,0.2],[xa-fw*0.95,0.3],[xa-fw*1.05,-0.8]],3),'skin',sw*0.8],[[0,1,2,3].map(i=>`M${f2(xa-fw*(0.85-0.32*i))} 0.2 l0 -0.7`).join(' '),null,0.4,'faceLine']]
        :[[sp([[xa-fw*0.75,ankY-2.2*u],[xa+fw*0.7,ankY-2.2*u],[xa+fw*0.72,-0.6],[xa+fw*0.4,0.25],[xa-fw*1.1,0.3],[xa-fw*1.05,-1.2*u]],3),'foot',sw*0.85],[`M${f2(xa-fw*0.75)} ${f2(ankY-1.4*u)} L${f2(xa+fw*0.7)} ${f2(ankY-1.4*u)}`,null,0.6,'leather']];
      if(FR){       // the feral ork: long bare feet with claws; by the gene wrapped in leather strips, the shins too
        const fx=xa-0.3*u, claws=[0,1,2,3].map(i=>{ const x=fx-fw*(0.95-0.36*i); return `M${f2(x-0.28*u)} 0 L${f2(x+0.28*u)} 0 L${f2(x-0.05*u)} ${f2(0.55*u)}z`; }).join(' ');
        foot=[[sp([[fx-fw*0.5,ankY-0.8],[fx+fw*0.5,ankY-0.8],[fx+fw*0.6,-0.9],[fx+fw*0.4,0.1],[fx-fw*1.15,0.15],[fx-fw*1.2,-0.9]],3),'skin',sw*0.8],[claws,'line',0],
          [[1,2,3].map(i=>`M${f2(fx-fw*(0.95-0.36*i)+0.18*u)} 0.1 l0 -0.8`).join(' '),null,0.4,'faceLine']];
        if(ft>=0.5){ const band=(x0,y0,x1,y1)=>`M${f2(x0)} ${f2(y0)} L${f2(x1)} ${f2(y1)}`, bands=[];
          for(let i=0;i<4;i++){ const t=0.12+0.2*i, y=ankY+(kneeY+3.8*u-ankY)*t, cx=xa+((xk+xa)/2-xa)*t, hw=(aw2+(kw-aw2)*t)*1.08; bands.push(band(cx-hw,y+0.45*u,cx+hw,y-0.45*u)); }
          const bd=bands.join(' '); shin.push([bd,null,1.1*u+0.6,'line'],[bd,null,1.1*u,'leather']);
          const fb=[band(fx-fw*0.55,ankY+0.2*u,fx+fw*0.55,ankY-0.6*u),band(fx-fw*0.95,-1.2*u,fx+fw*0.6,-2.2*u)].join(' ');
          foot.push([fb,null,1.0*u+0.6,'line'],[fb,null,1.0*u,'leather']); }
      }
    }
    // greaves, knee plates, iron shoes (heavy armour), along the leg's line
    if(G&&G.greaves){ const k=lw/7, xm=(xk+xa)/2, cu=[[xk-lw*0.5-0.4,kneeY-6*u],[xk+lw*0.46-0.4,kneeY-6*u],[xk+lw*0.45,kneeY-0.6*u],[xk-lw*0.5,kneeY-0.6*u]], gr=[[xk-lw*0.48,kneeY+0.6*u],[xk+lw*0.44,kneeY+0.6*u],[xm+lw*0.42,kneeY+5*u],[xa+lw*0.36,ankY-1.6*u],[xa-lw*0.4,ankY-1.6*u],[xm-lw*0.46,kneeY+5*u]];
      leg=leg.concat([[sp(cu,2),'iron',sw*0.85],[formShade(spline(cu,2,true),xk),'shade',0],[`M${f2(xk-lw*0.5)} ${f2(kneeY-3.3*u)} L${f2(xk+lw*0.45)} ${f2(kneeY-3.3*u)}`,null,0.6,'ironDark']]);
      shin=[[sp(gr,3),'iron',sw*0.9],[formShade(spline(gr,3,true),xm),'shade',0],[`M${f2(xm-lw*0.2)} ${f2(kneeY+5*u)} l${f2(0.6*k)} ${f2(3*u)}`,null,0.6,'rust'],
        [ell(f2(xk),f2(kneeY),f2(lw*0.46),f2(lw*0.4)),'iron',sw*0.85],[ell(f2(xk),f2(kneeY),f2(lw*0.2),f2(lw*0.17)),'ironDark',0],[`M${f2(xk-0.5*k)} ${f2(kneeY-lw*0.3)} L${f2(xk)} ${f2(kneeY-lw*0.75)} L${f2(xk+0.5*k)} ${f2(kneeY-lw*0.3)}z`,'ironDark',0.5]];
      foot=[[sp([[xa-lw*0.44,ankY-2*u],[xa+lw*0.4,ankY-2*u],[xa+lw*0.42,-0.6],[xa+lw*0.2,0.25],[xa-lw*0.72,0.3],[xa-lw*0.66,-1.2*u]],3),'iron',sw*0.85],[`M${f2(xa-lw*0.5)} ${f2(ankY-0.7*u)} L${f2(xa+lw*0.4)} ${f2(ankY-0.7*u)} M${f2(xa-lw*0.6)} ${f2(-0.6*u)} L${f2(xa+lw*0.38)} ${f2(-0.6*u)}`,null,0.6,'ironDark']];
    }
    const armed=!!(G&&(G.chest||G.cloth||G.pauldrons));       // a belt (with its pouch) only with the armour: the man in linen wears none
    const hr=lin(K.hand,plump)*(0.92+0.2*st), handAt=[f2(wSh*0.98+K.handOut*u),f2(hipY+(K.handDrop===undefined?0.3:K.handDrop)*u)], legK=lin(K.legK,gx('beine'));       // the hands hang beside the hips, under the shoulders
    const pd=GEAR.pauldron(A), S=Object.assign({ shadow:[[ell(0,f2(0.6*u),f2(wHip+3*u),f2(1.6*u)),'shadowC',0]], leg, shin, foot, knee:[f2(xk),f2(kneeY)], ankle:[f2(xa),f2(ankY)], footClaws:false, hip:[f2(xh),hipY], body, belly,
      neck:[0,f2(topY-1*u)], skull, scar:K.scar?[[`M${f2(-aw*0.7)} ${f2(top+0.3*h)} L${f2(-aw*0.25)} ${f2(top+0.62*h)}`,null,0.7,'scar']]:null,
      helmet:GEAR.helmet(A,K,back,(G&&G.helmStyle)||K.helm), shield:G&&G.shield?GEAR.shield(A,G.shield,[-handAt[0],handAt[1]],G.shieldFlat,back):null, chest:GEAR.chest(A), pauldron:pd.shapes, pauldronAt:pd.at, cloth:GEAR.cloth(A),
      fist:K.bones&&!(G&&G.pauldrons)?(K.boneStyle==='fantasy'?boneFistF:boneFist)(+handAt[0],+handAt[1],hr):fist(handAt[0],handAt[1],f2(hr),f2(hr*0.92),sw*0.9), handAt, handGap:K.handGap, horn:null, look:{ ears:!!K.ears, horns:false }, headY:0, legK, px:K.px, real:true, armUp:bodyH*0.3, armIn:1.2*u, shoulderAt:[wSh*0.86,topY+1.9*u], armLen:[10.6*u*(K.armK||1),9.8*u*(K.armK||1)], armW:[1.75*u,1.2*u,0.85*u].map(v=>v*(K.armWK||1)),
      headBox:[-aw*0.6,top+h*0.2,aw*0.6,top+h*0.7], bodyBox:[-wChest*0.6,topY+5*u,wChest*0.6,hipY-3*u], H:Math.round(-hipY*(legK-1)-top+K.pad) },face,armed?GEAR.belt(A,K):{ belt:[], buckle:[] });
    if(K.ears==='human'&&!K.bones){ const ax=-aw*0.97, ay=top+0.52*h; Object.assign(S,{ ear:[[`M${f2(ax+0.4)} ${f2(ay-0.13*h)} Q${f2(ax-aw*0.2)} ${f2(ay-0.12*h)} ${f2(ax-aw*0.16)} ${f2(ay+0.03*h)} Q${f2(ax-aw*0.1)} ${f2(ay+0.13*h)} ${f2(ax+0.4)} ${f2(ay+0.12*h)}z`,'skin',sw*0.7],[`M${f2(ax-aw*0.02)} ${f2(ay-0.07*h)} Q${f2(ax-aw*0.1)} ${f2(ay)} ${f2(ax-aw*0.02)} ${f2(ay+0.06*h)}`,null,0.5,'faceLine']], earTip:null, earAt:[f2(ax),f2(ay)] }); }
    if(K.ears==='feral') Object.assign(S,EXTRAS.earFeral(A));
    if(K.hair&&!K.bones) Object.assign(S,K.hair==='feral'?EXTRAS.hairFeral(A,back,gx('bart'),!!(G&&G.helmet)):EXTRAS.hairReal(A,back));
    if(K.beard&&!K.bones&&!back) S.beard=EXTRAS.beard(A,gx('bart'));
    if(K.coif&&G&&G.helmet) S.coif=EXTRAS.coif(A,back);
    S.A=A; S.hr=hr;
    if(K.pouch&&armed){ const by=A.beltY+1.2*u; S.belt=S.belt.concat([[sp([[-wHip*0.95,by],[-wHip*0.5,by],[-wHip*0.52,by+3.4*u],[-wHip*0.93,by+3.4*u]],2),'leather',sw*0.8],[`M${f2(-wHip*0.95)} ${f2(by+1.2*u)} L${f2(-wHip*0.5)} ${f2(by+1.2*u)}`,null,0.6,'line']]); }
    return S;
  }
  Object.assign(EXTRAS,{
    // short, a little unkempt: the hairline with the temples, the sides over the ears; from behind the back of the head
    hairReal(A,back){ const { hPts, top, h, aw }=A, hc=top+h/2, sc=k=>([x,y])=>[x*k,hc+(y-hc)*k];
      if(back) return { hair:[], hairBack:[[ptsPath(above(hPts,top+0.72*h).map(sc(1.04))),'hair',A.sw*0.6,'hairDark']] };
      const cap=above(hPts,top+0.46*h).map(sc(1.04)), line=[[aw*0.98,top+0.46*h],[aw*0.86,top+0.3*h],[aw*0.62,top+0.24*h],[aw*0.48,top+0.17*h],[aw*0.25,top+0.2*h],[0,top+0.18*h],[-aw*0.25,top+0.2*h],[-aw*0.48,top+0.17*h],[-aw*0.62,top+0.24*h],[-aw*0.86,top+0.3*h],[-aw*0.98,top+0.46*h]];
      return { hair:[[ptsPath(cap.concat(line)),'hair',A.sw*0.6,'hairDark'],[`M${f2(-aw*0.5)} ${f2(top+0.05*h)} l${f2(aw*0.15)} ${f2(0.06*h)} M${f2(aw*0.1)} ${f2(top+0.02*h)} l${f2(aw*0.1)} ${f2(0.08*h)} M${f2(aw*0.55)} ${f2(top+0.08*h)} l${f2(-aw*0.1)} ${f2(0.07*h)}`,null,0.5,'hairDark']], hairBack:[] }; },
    // the beard by its gene: stubble, a short beard, a full one (with the moustache); over the jaw, under the mouth's line
    beard(A,k){ const { top, h, aw, chinY }=A; if(k<0.2) return [];
      if(k<0.45) return [[sp([[-aw*0.88,top+0.66*h],[-aw*0.3,top+0.8*h],[0,top+0.78*h],[aw*0.3,top+0.8*h],[aw*0.88,top+0.66*h],[aw*0.8,top+0.86*h],[0,chinY+0.3],[-aw*0.8,top+0.86*h]],3),'stubble',0]];
      const ext=(k-0.45)*0.5*h, out=[[aw*0.9,top+0.62*h],[aw*0.86,top+0.8*h],[aw*0.55,chinY-0.02*h+ext*0.6],[aw*0.2,chinY+ext],[0,chinY+ext*1.05]];
      const pts=out.concat(out.slice(0,-1).reverse().map(([x,y])=>[-x,y]),[[-aw*0.6,top+0.7*h],[-aw*0.3,top+0.76*h],[0,top+0.745*h],[aw*0.3,top+0.76*h],[aw*0.6,top+0.7*h]]);
      return [[sp(pts,2),'hair',A.sw*0.5,'hairDark'],[`M${f2(-aw*0.3)} ${f2(top+0.9*h)} l${f2(aw*0.06)} ${f2(0.06*h)} M${f2(aw*0.12)} ${f2(top+0.92*h)} l${f2(aw*0.04)} ${f2(0.07*h)} M${f2(aw*0.5)} ${f2(top+0.84*h)} l${f2(-aw*0.02)} ${f2(0.07*h)}`,null,0.4,'hairDark']]; },
    // the mail hood under the helmet: round the head and the neck down onto the shoulders, the face open, the rings drawn as rows of small arcs
    coif(A,back){ const { top, h, aw, chinY, topY, wSh, u, sw }=A, outer=spline([[0,top-0.04*h],[aw*1.08,top+0.2*h],[aw*1.14,top+0.6*h],[aw*1.05,chinY],[wSh*0.62,topY+0.8*u],[wSh*0.55,topY+2.6*u],[0,topY+3.4*u],[-wSh*0.55,topY+2.6*u],[-wSh*0.62,topY+0.8*u],[-aw*1.05,chinY],[-aw*1.14,top+0.6*h],[-aw*1.08,top+0.2*h]],3,true);
      const hole=back?null:ellPts(0,top+0.62*h,aw*0.78,h*0.4,24), d=hole?withHole(outer,hole):ptsPath(outer), rings=[];
      for(let y=top+0.1*h;y<topY+3*u;y+=0.9) for(let x=-wSh*0.6;x<=wSh*0.6;x+=1.1){ const xx=x+((Math.round((y-top)/0.9)%2)?0.55:0); if(inside(outer,xx,y)&&!(hole&&inside(hole,xx,y+0.3))&&!(hole&&inside(hole,xx,y-0.4))) rings.push(`M${f2(xx-0.45)} ${f2(y)} q0.45 0.5 0.9 0`); }
      return [[d,'mail',sw*0.8],[rings.join(' '),null,0.3,'ironDark'],[formShade(outer,0),'shade',0]]; },
    // the skeleton of the trunk: the neck's vertebrae, the spine behind, the shoulder blades behind the ribs, the collarbones, the breastbone, twelve pairs of ribs
    // (seven to the breastbone through their cartilage, three joining the cartilage above in the arch, two floating), the lumbar spine, the pelvis
    bonesReal(A,back){
      const { topY, hipY, wSh, wHip, bodyH, bPts, chinY, top, h, u }=A, wC=widthAt(bPts,topY+bodyH*0.42)*0.96, out=[[ptsPath(bPts),null,0]];
      const vert=(y,hw,hh,wing)=>{ const d=`M${f2(-hw)} ${f2(y)} L${f2(hw)} ${f2(y)} L${f2(hw*0.92)} ${f2(y+hh)} L${f2(-hw*0.92)} ${f2(y+hh)}z`;
        out.push([d,'skin',BL*0.6,'line']); if(wing) out.push([`M${f2(-hw)} ${f2(y+hh*0.35)} L${f2(-hw-wing)} ${f2(y+hh*0.2)} L${f2(-hw-wing)} ${f2(y+hh*0.6)} L${f2(-hw)} ${f2(y+hh*0.7)}z M${f2(hw)} ${f2(y+hh*0.35)} L${f2(hw+wing)} ${f2(y+hh*0.2)} L${f2(hw+wing)} ${f2(y+hh*0.6)} L${f2(hw)} ${f2(y+hh*0.7)}z`,'skin',BL*0.6,'line']); };
      // the neck: seven vertebrae from under the skull down to the shoulders (the upper ones hidden by the jaw)
      const n0=top+h*0.82, n1=topY+0.2*u, nh=(n1-n0)/7; for(let i=0;i<7;i++) vert(n0+i*nh,0.62*u,nh*0.78,0.5*u);
      // the spine behind the ribs (the thoracic vertebrae show between them)
      const t0=topY+0.3*u, t1=topY+bodyH*0.47, th=(t1-t0)/12;       // (the ribcage ends at the waist: below it only the lumbar spine, then the pelvis) for(let i=0;i<12;i++) vert(t0+i*th,(0.55+0.03*i)*u,th*0.8,0);
      // the shoulder blades behind the ribcage (from behind: over it, below)
      const blades=()=>[-1,1].forEach(s=>{ out.push([sp([[s*wSh*0.92,topY+0.2*u],[s*wSh*0.55,topY+1.2*u],[s*wC*0.62,topY+bodyH*0.38],[s*wC*0.8,topY+bodyH*0.36],[s*wSh*0.9,topY+2.6*u]],2),back?'skin':'boneDeep',BL,'line']); if(back) out.push([`M${f2(s*wC*0.65)} ${f2(topY+bodyH*0.12)} L${f2(s*wSh*0.9)} ${f2(topY+0.4*u)}`,null,0.9*u,'line'],[`M${f2(s*wC*0.65)} ${f2(topY+bodyH*0.12)} L${f2(s*wSh*0.9)} ${f2(topY+0.4*u)}`,null,0.9*u-0.8,'skin']); });
      if(!back) blades();
      // the ribs, from the top down: where they meet the breastbone (or the arch), how far down they sag, how far out they reach
      const sY=i=>topY+0.9*u+i*0.62*u, xiph=topY+bodyH*0.3, Wf=[0.5,0.66,0.78,0.86,0.92,0.96,0.98,0.98,0.95,0.9,0.82,0.72];
      for(let i=0;i<12;i++){ const W=Wf[i]*wC, y=sY(i), d=(0.45+0.2*(i+1))*u, cw=0.3*u;
        [-1,1].forEach(s=>{ const X=x=>s*x;
          // behind: the rib's way back to the spine, seen between the others (darker)
          out.push([`M${f2(X(W*0.98))} ${f2(y+d*0.25)} Q${f2(X(W*0.72))} ${f2(y-0.9*u)} ${f2(X(1.0*u))} ${f2(y-1.1*u)}`,null,cw*1.6,'boneDeep']);
          if(i>=10){ out.push(...bandRib([[X(W),y+d*0.2],[X(W*0.97),y+d*0.75],[X(W*0.8),y+d*1.05]],cw)); return; }       // the floating ribs: short, at the side
          out.push(...bandRib([[X(W*0.5),y+d*0.85],[X(W*0.8),y+d*1.02],[X(W*1.0),y+d*0.65],[X(W*0.98),y+d*0.2]],cw));       // the rib: down and out from its cartilage, round the side and up
          const c=i<7?`M${f2(X(1.25*u))} ${f2(y)} Q${f2(X(W*0.3))} ${f2(y+d*0.45)} ${f2(X(W*0.5))} ${f2(y+d*0.85)}`:`M${f2(X(W*0.5))} ${f2(y+d*0.85)} Q${f2(X(W*0.36))} ${f2(y+d*0.45)} ${f2(X(1.6*u+(9-i)*0.4*u))} ${f2(xiph+(i-7)*0.3*u)}`;
          if(!back) out.push([c,null,cw*1.5,'line'],[c,null,cw*1.05,'cartilage']); });       // the cartilage: to the breastbone, or (8 to 10) up to the arch (not seen from behind)
      }
      if(back){ blades(); for(let i=0;i<12;i++) vert(t0+i*th,(0.4+0.02*i)*u,th*0.8,0.7*u); }       // from behind: the blades and the row of the spine over the ribs
      // the breastbone: the handle, the body, the sword-tip
      if(!back) out.push(...boneShape([[-1.3*u,topY+0.4*u],[1.3*u,topY+0.4*u],[1.0*u,topY+2.6*u],[0.85*u,topY+3*u],[0.95*u,xiph-1.6*u],[0.5*u,xiph-0.4*u],[0,xiph+0.9*u],[-0.5*u,xiph-0.4*u],[-0.95*u,xiph-1.6*u],[-0.85*u,topY+3*u],[-1.0*u,topY+2.6*u]],1));
      if(!back) out.push([`M${f2(-0.85*u)} ${f2(topY+2.9*u)} L${f2(0.85*u)} ${f2(topY+2.9*u)}`,null,0.3,'line']);
      // the collarbones: an S from the breastbone's handle to the shoulder's tip, the joint knob at the end
      [-1,1].forEach(s=>{ const c=`M${f2(s*1.1*u)} ${f2(topY+0.7*u)} C${f2(s*wSh*0.35)} ${f2(topY+1.6*u)} ${f2(s*wSh*0.55)} ${f2(topY-0.7*u)} ${f2(s*wSh*0.88)} ${f2(topY-0.1*u)}`; out.push([c,null,1.3*u,'line'],[c,null,1.3*u-0.9,'skin']);
        out.push([ell(f2(s*wSh*0.93),f2(topY+0.4*u),f2(0.9*u),f2(0.7*u)),'skin',BL,'line']); });
      // the lumbar spine: five big vertebrae with their side wings
      const l0=t1+0.2*u, l1=hipY-6.2*u, lh=(l1-l0)/5; for(let i=0;i<5;i++) vert(l0+i*lh,(1.05+0.05*i)*u,lh*0.82,(0.9+0.1*i)*u);
      // the pelvis: the two wings of the hip bones, the sacrum between them, the sockets of the hips, the round holes below, the joint of the pubic bones
      const half=s=>[[0.6*u,hipY-5.4*u],[wHip*0.42,hipY-7.8*u],[wHip*0.82,hipY-7.6*u],[wHip*1.0,hipY-6*u],[wHip*0.93,hipY-4.7*u],[wHip*0.74,hipY-3.8*u],[wHip*0.74,hipY-2.2*u],[wHip*0.6,hipY-0.6*u],[wHip*0.36,hipY-0.3*u],[0.3*u,hipY-0.9*u],[0.3*u,hipY-2.3*u],[wHip*0.3,hipY-2.7*u],[wHip*0.4,hipY-3.5*u],[1.6*u,hipY-4.6*u]].map(([x,y])=>[s*x,y]);
      [-1,1].forEach(s=>{ const p=half(s); out.push([sp(p,2),'skin',BL,'line'],[sp([[s*1.4*u,hipY-5.6*u],[s*wHip*0.5,hipY-7.2*u],[s*wHip*0.82,hipY-6.8*u],[s*wHip*0.66,hipY-4.8*u],[s*wHip*0.4,hipY-4.2*u]],2),'boneShade',0],
        [ell(f2(s*wHip*0.4),f2(hipY-1.55*u),f2(wHip*0.14),f2(0.72*u)),'socket',BL,'line']); });
      out.push(...boneShape([[-2.3*u,hipY-6.4*u],[2.3*u,hipY-6.4*u],[1.5*u,hipY-4*u],[0.6*u,hipY-2.6*u],[0,hipY-2*u],[-0.6*u,hipY-2.6*u],[-1.5*u,hipY-4*u]],2));       // the sacrum
      out.push([[0,1,2,3].map(i=>{ const y=hipY-(5.7-0.9*i)*u, x=(1.25-0.22*i)*u; return ell(f2(-x),f2(y),0.3,0.25)+' '+ell(f2(x),f2(y),0.3,0.25); }).join(' '),'socket',0]);
      return out;
    },
    // a leg of bones: the thigh bone (its head in the hip's socket, the neck, the big knob outside, the shaft leaning in, the two knobs at the knee),
    // the kneecap, the shin bone (wide at the top, the inner ankle at the bottom) and the thin calf bone outside it (the outer ankle), the foot
    boneLegReal(A){
      const { hipY, wHip, u, legs:{ xk, xa, kneeY, ankY } }=A, s=-1, hx=-wHip*0.62, hy=hipY-3*u;
      const shaft=boneAlong([hx-0.95*u,hipY-1.9*u],[xk,kneeY-0.9*u],0.78*u,0.58*u,1.25*u);
      const thigh=[...boneShape(shaft,1),
        [sp([[hx+0.2*u,hy-0.4*u],[hx-1.25*u,hipY-2.9*u],[hx-1.5*u,hipY-1.7*u],[hx-0.5*u,hipY-1.4*u],[hx+0.3*u,hy+0.5*u]],2),'skin',BL,'line'],       // the neck
        [ell(f2(hx+0.15*u),f2(hy-0.05*u),f2(0.85*u),f2(0.85*u)),'skin',BL,'line'],       // the head
        [sp([[hx-1.15*u,hipY-3.5*u],[hx-1.85*u,hipY-3.1*u],[hx-1.95*u,hipY-1.9*u],[hx-1.3*u,hipY-1.5*u]],2),'skin',BL,'line'],       // the great knob outside
        [sp([[xk-1.3*u,kneeY-1.6*u],[xk+1.25*u,kneeY-1.6*u],[xk+1.35*u,kneeY-0.4*u],[xk+0.5*u,kneeY+0.1*u],[xk,kneeY-0.3*u],[xk-0.55*u,kneeY+0.1*u],[xk-1.4*u,kneeY-0.4*u]],2),'skin',BL,'line']];       // the knobs at the knee
      const tib=boneAlong([xk+0.2*u,kneeY+0.6*u],[xa+0.35*u,ankY+0.2*u],1.3*u,0.55*u,0.75*u), fib=boneAlong([xk-1.15*u,kneeY+1.3*u],[xa-0.95*u,ankY+0.4*u],0.4*u,0.24*u,0.42*u);
      const shin=[...boneShape(fib,1),...boneShape(tib,1),
        [sp([[xk-1.35*u,kneeY+0.25*u],[xk+1.4*u,kneeY+0.25*u],[xk+1.2*u,kneeY+1.3*u],[xk-1.1*u,kneeY+1.3*u]],2),'skin',BL,'line'],       // the shin bone's plateau
        [ell(f2(xa+0.85*u),f2(ankY+0.1*u),f2(0.42*u),f2(0.5*u)),'skin',BL,'line'],[ell(f2(xa-0.95*u),f2(ankY+0.4*u),f2(0.38*u),f2(0.55*u)),'skin',BL,'line'],       // the ankles
        [ell(f2(xk),f2(kneeY-0.2*u),f2(0.85*u),f2(1.05*u)),'skin',BL,'line']];       // the kneecap
      // the foot from the front: the ankle's bone and the root of the foot, five long bones fanning forward and out, the toes
      const fx=xa-0.4*u, foot=[[sp([[fx-1.1*u,ankY+0.6*u],[fx+1.0*u,ankY+0.6*u],[fx+1.2*u,ankY+2*u],[fx-1.3*u,ankY+2.1*u]],2),'skin',BL,'line']];
      for(let i=0;i<5;i++){ const k=i-2, x0=fx+k*0.42*u, x1=fx+k*0.62*u-0.5*u, x2=fx+k*0.72*u-0.8*u, w=i===4?0.34*u:0.24*u;
        foot.push(...boneShape(boneAlong([x0,ankY+1.9*u],[x1,-1.1*u],w,w*0.7,w),1),...boneShape(boneAlong([x1,-1.0*u],[x2,0],w*0.9,w*0.7,w*0.8),1)); }
      return { thigh, shin, foot };
    }
  });
  // ---- the feral ork's own (the second ork on the realistic body plan): a lean, hard body, ears swept back, a shaved head with a topknot or a braid ----
  // a braid: plaited segments along a line, tied off at its end with a tuft
  function braidShapes(x0,y0,x1,y1,w,n,sw){
    const dx=(x1-x0)/n, dy=(y1-y0)/n, L=Math.hypot(dx,dy)||1, nx=-dy/L, ny=dx/L, segs=[];
    for(let i=0;i<n;i++){ const cx=x0+dx*(i+0.5), cy=y0+dy*(i+0.5), s=i%2?1:-1, k=1-0.25*i/n;
      segs.push(sp([[cx-dx*0.62+nx*w*k*0.2*s,cy-dy*0.62+ny*w*k*0.2*s],[cx+nx*w*k,cy+ny*w*k],[cx+dx*0.62-nx*w*k*0.2*s,cy+dy*0.62-ny*w*k*0.2*s],[cx-nx*w*k,cy-ny*w*k]],2)); }
    const ex=x1, ey=y1;
    return [[segs.join(' '),'hair',sw*0.5,'hairDark'],[`M${f2(ex-nx*w*0.7)} ${f2(ey-ny*w*0.7)} L${f2(ex+nx*w*0.7)} ${f2(ey+ny*w*0.7)}`,null,w*0.6,'leather'],
      [sp([[ex-nx*w*0.5,ey-ny*w*0.5],[ex+nx*w*0.5,ey+ny*w*0.5],[ex+dx*1.1+nx*w*0.2,ey+dy*1.1+ny*w*0.2],[ex+dx*1.4,ey+dy*1.4],[ex+dx*1.1-nx*w*0.3,ey+dy*1.1-ny*w*0.3]],2),'hair',sw*0.4,'hairDark']];
  }
  Object.assign(EXTRAS,{
    // the bare torso, lean and hard: the neck's cords, the collarbones, the chest's lower edge, the ribs at the flanks, the belly's rows, the lines to the groin;
    // from behind the shoulder blades and the broad back. A leather wrap round the hips (always: the loincloth hangs over it), a strap across the chest and a
    // string of teeth round the neck (not under a breastplate)
    feralBody(A,back,G){
      const { topY, hipY, wSh, wHip, wWaist, wChest, nw, bPts, u, chinY, sw }=A, F='faceLine', out=[], m=(d)=>d+' '+mirror(d);
      if(!back){
        out.push([m(`M${f2(-nw*0.7)} ${f2(chinY+0.6)} Q${f2(-nw*0.5)} ${f2(topY-1*u)} ${f2(-0.5*u)} ${f2(topY+0.5*u)}`),null,0.45,F],       // the neck's cords
          [m(`M${f2(-0.8*u)} ${f2(topY+0.6*u)} Q${f2(-wSh*0.4)} ${f2(topY+1.3*u)} ${f2(-wSh*0.74)} ${f2(topY+0.5*u)}`),null,0.5,F],       // the collarbones
          [m(`M${f2(-0.3*u)} ${f2(topY+5.7*u)} Q${f2(-wChest*0.55)} ${f2(topY+6.8*u)} ${f2(-wChest*0.9)} ${f2(topY+3.4*u)}`),null,0.75,F],       // the chest's lower edge
          [m(sp([[-0.4*u,topY+5.9*u],[-wChest*0.55,topY+7*u],[-wChest*0.88,topY+4.6*u],[-wChest*0.6,topY+6.3*u]],2)),'shadeFace',0],
          [`M0 ${f2(topY+1.8*u)} L0 ${f2(topY+5.4*u)} M0 ${f2(topY+6.6*u)} L0 ${f2(hipY-4*u)}`,null,0.45,F],       // the breastbone, the line down the belly
          [[0,1,2].map(i=>{ const y=topY+(8+2.1*i)*u, w=wWaist*(0.42-0.03*i); return m(`M${f2(-w)} ${f2(y)} Q${f2(-w*0.5)} ${f2(y+0.45*u)} ${f2(-0.15*u)} ${f2(y+0.1*u)}`); }).join(' '),null,0.45,F],       // the belly's rows
          [[0,1,2].map(i=>{ const y=topY+(6.4+1.3*i)*u; return m(`M${f2(-wChest*0.93)} ${f2(y)} L${f2(-wChest*0.74)} ${f2(y+0.9*u)}`); }).join(' '),null,0.4,F],       // the ribs at the flanks
          [m(`M${f2(-wWaist*0.8)} ${f2(hipY-8.5*u)} Q${f2(-wWaist*0.72)} ${f2(hipY-5*u)} ${f2(-wHip*0.32)} ${f2(hipY-2.4*u)}`),null,0.5,F]);       // the lines to the groin
      }
      else out.push([m(`M${f2(-wSh*0.22)} ${f2(topY+1.4*u)} Q${f2(-wSh*0.64)} ${f2(topY+1.1*u)} ${f2(-wSh*0.6)} ${f2(topY+5.4*u)} Q${f2(-wSh*0.44)} ${f2(topY+7*u)} ${f2(-wSh*0.2)} ${f2(topY+6*u)}`),null,0.55,F],       // the shoulder blades
        [m(`M${f2(-wSh*0.66)} ${f2(topY+6.2*u)} Q${f2(-wWaist*0.95)} ${f2(topY+10*u)} ${f2(-wWaist*0.55)} ${f2(hipY-6*u)}`),null,0.5,F],       // the broad back
        [m(`M${f2(-nw*0.8)} ${f2(chinY+1)} Q${f2(-wSh*0.3)} ${f2(topY+1.6*u)} ${f2(-0.4*u)} ${f2(topY+3.4*u)}`),null,0.45,F]);       // the neck's muscle down the back
      if(!(G&&G.chest)){
        const a=[-wSh*0.56,topY-0.7*u], b=[wWaist*0.98,hipY-6.2*u], d=Math.hypot(b[0]-a[0],b[1]-a[1]), nx=-(b[1]-a[1])/d*0.65*u, ny=(b[0]-a[0])/d*0.65*u;
        out.push([ptsPath([[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]]),'leather',sw*0.55],       // the strap across the chest (from behind across the back)
          [ell(f2(a[0]+(b[0]-a[0])*0.42),f2(a[1]+(b[1]-a[1])*0.42),f2(0.75*u),f2(0.75*u)),null,0.45*u,'ironDark']);       // an iron ring on it
        if(!back){ const cord=`M${f2(-nw*1.15)} ${f2(topY-0.9*u)} Q0 ${f2(topY+2.6*u)} ${f2(nw*1.15)} ${f2(topY-0.9*u)}`;       // the string of teeth
          out.push([cord,null,0.4,'leather'],[[-0.6,-0.3,0,0.3,0.6].map(k=>{ const x=k*nw*1.6, y=topY+(1.5-Math.abs(k)*1.6)*u; return `M${f2(x-0.3*u)} ${f2(y)} L${f2(x+0.3*u)} ${f2(y)} L${f2(x)} ${f2(y+1.3*u)}z`; }).join(' '),'bone',0.3,'line']); }
      }
      // the wrap round the hips: from just under the waist to below the crotch, ragged at its hem
      const y0=hipY-4.6*u, y1=hipY+2.7*u, w0=widthAt(bPts,y0)*1.04, w1=wHip*1.08, hem=[];
      for(let i=0;i<=8;i++){ const k=1-2*i/8; hem.push([k*w1*(1-0.06*Math.abs(Math.sin(i*1.7))),y1-(i%2?0.9*u:0)-0.6*u*(1-Math.abs(k))]); }
      const wrap=[[-w0,y0],[w0,y0],[w1,y1-1.2*u]].concat(hem,[[-w1,y1-1.2*u]]);
      out.push([ptsPath(wrap),'leather',sw*0.8],[formShade(wrap,0),'shade',0],[`M${f2(-w0*0.9)} ${f2(y0+2.2*u)} Q0 ${f2(y0+3*u)} ${f2(w0*0.95)} ${f2(y0+1.8*u)}`,null,0.45,'line']);
      return out;
    },
    // long, pointed ears swept back: from the side of the head out and up, a ring in one
    earFeral(A){
      const { aw, h, top, sw }=A, ax=-aw*0.86, ay=top+0.5*h, tx=-aw*1.72, ty=top+0.1*h;
      return { ear:[[`M${f2(ax+0.3)} ${f2(ay-0.1*h)} Q${f2(-aw*1.2)} ${f2(top+0.28*h)} ${f2(tx)} ${f2(ty)} Q${f2(-aw*1.42)} ${f2(top+0.42*h)} ${f2(-aw*1.06)} ${f2(top+0.62*h)} Q${f2(-aw*0.95)} ${f2(top+0.67*h)} ${f2(ax+0.3)} ${f2(ay+0.1*h)}z`,'skin',sw*0.7],
        [`M${f2(ax-0.1)} ${f2(ay-0.05*h)} Q${f2(-aw*1.2)} ${f2(top+0.32*h)} ${f2(tx*0.93)} ${f2(ty+0.06*h)} Q${f2(-aw*1.28)} ${f2(top+0.44*h)} ${f2(ax-0.1)} ${f2(ay+0.06*h)}z`,'dark',0],
        [ell(f2(-aw*1.24),f2(top+0.5*h),0.42,0.42),null,0.3,'ironDark']], earTip:null, earAt:[f2(ax),f2(ay)] };
    },
    // the head shaved (stubble), a topknot (its tail falling behind the head) or a crest of hair with a long braid, by the gene; under a helmet only the tail or the braid shows
    hairFeral(A,back,k,helmet){
      const { hPts, top, h, aw, chinY, topY, wSh, u, sw }=A, hc=top+h/2, sc=s=>([x,y])=>[x*s,hc+(y-hc)*s], style=k<0.34?'shaved':(k<0.67?'knot':'braid');
      const cap=back?above(hPts,top+0.74*h).map(sc(1.01)):above(hPts,top+0.3*h).map(sc(1.01)).concat([[aw*0.7,top+0.2*h],[aw*0.3,top+0.12*h],[0,top+0.13*h],[-aw*0.3,top+0.12*h],[-aw*0.7,top+0.2*h]]);
      const hair=[[ptsPath(cap),'stubble',0]], hairBack=[], out={ hair, hairBack, braid:null };
      if(style==='knot'){
        const knot=[[ell(0,f2(top-0.07*h),f2(aw*0.3),f2(h*0.12)),'hair',sw*0.5,'hairDark'],[sp([[-aw*0.12,top-0.16*h],[aw*0.05,top-0.34*h],[aw*0.12,top-0.16*h]],2),'hair',sw*0.4,'hairDark'],
          [`M${f2(-aw*0.26)} ${f2(top+0.0*h)} Q0 ${f2(top+0.05*h)} ${f2(aw*0.26)} ${f2(top+0.0*h)}`,null,0.7,'leather']];
        const tail=sp([[aw*0.05,top-0.02*h],[aw*0.7,top+0.12*h],[aw*1.18,top+0.42*h],[aw*1.22,chinY+0.15*h],[aw*1.05,chinY+0.3*h],[aw*1.0,top+0.5*h],[aw*0.6,top+0.2*h]],2);
        if(back) hair.push([sp([[-aw*0.18,top+0.02*h],[aw*0.18,top+0.02*h],[aw*0.22,top+0.5*h],[aw*0.1,chinY+0.2*h],[-aw*0.12,chinY+0.15*h],[-aw*0.22,top+0.5*h]],2),'hair',sw*0.5,'hairDark']);
        else hairBack.push([tail,'hair',sw*0.5,'hairDark']);
        if(!helmet) hair.push(...knot);
      }
      if(style==='braid'){
        if(!helmet) hair.push([sp(back?[[-aw*0.24,top-0.02*h],[0,top-0.07*h],[aw*0.24,top-0.02*h],[aw*0.2,top+0.75*h],[-aw*0.2,top+0.75*h]]:[[-aw*0.26,top+0.2*h],[-aw*0.3,top+0.02*h],[0,top-0.07*h],[aw*0.3,top+0.02*h],[aw*0.26,top+0.2*h],[0,top+0.15*h]],2),'hair',sw*0.5,'hairDark']);       // the crest
        if(back) out.braid=braidShapes(0,chinY-0.1*h,aw*0.25,topY+9*u,0.8*u,7,sw);       // down the back
        else hair.push(...braidShapes(aw*1.0,top+0.7*h,wSh*0.62,topY+5.5*u,0.75*u,6,sw));       // forward over the shoulder
      }
      return out;
    }
  });
  // the human (user, November 2026: the baseline for all; grim realism) and the skeleton, a human without the flesh: the same measures, so the same armour fits
  const REAL_MATS={ leder:['#5e4430','#34261a'], bronze:['#7e6030','#44321a'], eisen:['#5a5a5e','#2c2c30'], stahl:['#727a84','#3a4048'], schwarz:['#2a2a30','#121216'] };
  const HUMAN_BASE={ shade:'rgba(20,10,5,0.32)', shadeFace:'rgba(30,15,5,0.12)', faceLine:'rgba(50,25,12,0.55)', lip:'#5a3026', sclera:'#cfc2b0', pupil:'#0c0806', line:'#120d0a', foot:'#3a2a1e', belt:'#4a3422', gold:'#9a8a6a', bone:'#d6ccb4', mouth:'#2a0e0a', tongue:'#6a2a22',
    iron:'#5a5a5e', ironDark:'#2c2c30', mail:'#4a4a4e', wood:'#4a3524', leather:'#5a4030', cloth:'#3e3026', rust:'#7a4024', scar:'#c48a78', socket:'#0a0706', tunic:'#b5ab96', tunicDark:'#7e7666', trim:'#7e7666', stubble:'rgba(40,30,25,0.35)', hair:'#3a2c22', hairDark:'#1e1610', glow:'rgba(0,0,0,0)', eye:'#5a6e7a' };
  // height: how tall a kind stands in the world, a human being 1 (user, November 2026: an ork at least as tall as a man, rather taller)
  HUMANOIDS.human={ px:64, height:1, real:true, hipY:-36, bodyH:[25.5,2.5], hip:[8.2,1.2], sh:[10.2,1.2], legW:[8.6,1.2], legK:[0.97,0.06], line:1,
    head:{ w:[3.55,0.35], h:[9.8,0.8] }, hand:[2.3,0.3], handOut:0.2, handGap:1.2, pad:4, weaponK:1.3, shieldK:1.7, pauldronK:1.3, emblem:true, clothW:1.6,
    face:'human', ears:'human', hair:'short', beard:true, coif:true, pouch:true, clothed:true, rig3d:true, flesh3d:true, belt:'band', buckle:'plain', helm:'horns', armour:false, scar:false, cloth:false,
    weapons:['sword','axe','hammer','spear','dagger','bow','staff','club'], weapon:'none', presets:HUMAN_PRESETS, mats:REAL_MATS, base:HUMAN_BASE,
    skins:[{ skin:'#c9a28a', light:'#dcb8a0', dark:'#8a604c', leg:'#a39a86', brow:'#2a2018' },{ skin:'#a87a5e', light:'#c09274', dark:'#6e4a38', leg:'#a39a86', brow:'#2a2018' },{ skin:'#6e4a36', light:'#86604a', dark:'#45291c', leg:'#a39a86', brow:'#1a120c' }],
    hairs:['#2e2219','#5e4e3e','#8e8a84'], eye:['#5a6e7a','#4a3222'], glow:[[0,0,0],[0,0,0]], glowA:0 };
  HUMANOIDS.skeleton=Object.assign({},HUMANOIDS.human,{ face:'skullReal', bones:true, rig3d:false, flesh3d:false, belt:null, ears:null, hair:null, beard:false, clothed:false, pouch:false, scar:false, weapon:'sword', presets:SKELETON_PRESETS,
    base:Object.assign({},HUMAN_BASE,{ shade:'rgba(20,12,5,0.2)', socket:'#14100c', socketDeep:'#050403', faceLine:'rgba(40,30,20,0.6)', line:'#2a2016', boneShade:'rgba(70,50,25,0.28)', boneDark:'rgba(60,45,25,0.55)', boneDeep:'#9a8e72', cartilage:'#c4bfa8', tooth:'#e6dcc2' }), hairs:null,
    skins:[{ skin:'#e2d8c0', light:'#efe6d2', dark:'#a89e84', leg:'#e2d8c0', brow:'#3a3428' },{ skin:'#d2c8ac', light:'#e2d8c0', dark:'#968c72', leg:'#d2c8ac', brow:'#3a3428' },{ skin:'#bcb294', light:'#ccc2a6', dark:'#827a62', leg:'#bcb294', brow:'#3a3428' }],
    eye:['#fff4e0','#7af0ff'], glow:[[255,220,170],[120,230,255]], glowA:0.5 });
  HUMANOIDS.skeleton2=Object.assign({},HUMANOIDS.skeleton,{ face:'skullFantasy', boneStyle:'fantasy', side:true, rig3d:true, head:{ w:[4.1,0.4], h:[11.2,0.8] },
    base:Object.assign({},HUMANOIDS.skeleton.base,{ socket:'#040303', line:'#1c140c', boneShade:'rgba(60,40,15,0.38)', boneDark:'rgba(40,28,12,0.6)', tooth:'#e2d4ae' }),
    skins:[{ skin:'#e0d2ac', light:'#ece2c4', dark:'#a0906a', leg:'#e0d2ac', brow:'#3a3428' },{ skin:'#d4c49a', light:'#e2d6b4', dark:'#968660', leg:'#d4c49a', brow:'#3a3428' },{ skin:'#c2b088', light:'#d2c29c', dark:'#857552', leg:'#c2b088', brow:'#3a3428' }] });       // the second skeleton: the same body plan, its own bones (a bigger skull)
  // the feral ork (a second ork on the realistic body plan, user November 2026: the stout one clashed with the realistic style): taller than a man,
  // rangy and wiry, long limbs, broad bony shoulders over a narrow waist, the head sunk a little forward between them. Bare but for leather: a wrap round
  // the hips, a strap across the chest, strips round the forearms (and by the gene the shins and feet). Genes of its own: bart picks the hair (it has no
  // beard: shaved, a topknot, a braid), bemalung the paint (ritual scars below 0.5, soot across the eyes above)
  const ORKB_PRESETS={ pirscher:GN({ kopf:0.5, kinn:0.4, kopfForm:0.6, koerperForm:0.75, koerper:0.15, beine:0.9, tief:0.75, augen:0.4, haut:0.15, augenFarbe:0.1, haar:0.1, bart:0.5, bemalung:0.8, fuss:0.8 }),
    schinder:GN({ kopf:0.35, kinn:0.15, kopfForm:0.9, koerperForm:0.9, koerper:0.55, beine:0.6, tief:0.95, augen:0.3, haut:0.85, augenFarbe:0.9, haar:0.3, bart:0.9, bemalung:0.2, fuss:0.1 }) };
  HUMANOIDS.orkB=Object.assign({},HUMANOIDS.human,{ px:64, height:1.18, hipY:-46, bodyH:[28,3], hip:[7.4,1.2], sh:[12.8,1.6], legW:[6.3,1.2], legK:[0.97,0.06], line:1,
    head:{ w:[4.0,0.4], h:[12,0.8] }, hand:[2.7,0.35], handOut:-1.2, handGap:1.2, handDrop:2.2, armK:1.1, armWK:0.82, waistK:0.8, neckK:0.5, neckW:1.05, pad:5,
    weaponK:1.3, shieldK:1.6, pauldronK:1.2, emblem:true, clothW:1.4, clothL:0.62,
    face:'orkFeral', feral:true, paint:true, rig3d:true, flesh3d:true, coifFace:[0.66,0.34,0.86], geneNames:{ bart:'Haartracht' }, ears:'feral', hair:'feral', beard:false, coif:true, pouch:true, clothed:false, wraps:true, belt:'band', buckle:'plain', helm:'horns', armour:false, scar:false, cloth:true,
    weapons:['axe','spear','club','dagger','bow','sword','hammer','staff'], weapon:'axe', presets:ORKB_PRESETS,
    base:Object.assign({},HUMAN_BASE,{ shade:'rgba(8,12,6,0.34)', shadeFace:'rgba(8,10,4,0.2)', socketShade:'rgba(4,4,2,0.45)', faceLine:'rgba(10,14,6,0.6)', lip:'#2c2a22', pupil:'#1a0400', line:'#0b0a08',
      foot:'#2a2018', belt:'#33241a', leather:'#4a3424', cloth:'#3e1c14', bone:'#cfc19c', boneDark:'rgba(90,70,40,0.6)', mouth:'#160604', tongue:'#4a1a14', scar:'#9a988a', stubble:'rgba(8,10,6,0.42)', paint:'rgba(6,5,4,0.72)', browLight:'rgba(255,255,230,0.1)', socket:'#0a0806' }),
    skins:[{ skin:'#56624a', light:'#6c785a', dark:'#2c3424', leg:'#4e5a44', brow:'#14180f' },{ skin:'#4a5244', light:'#5e6656', dark:'#262b22', leg:'#444c3e', brow:'#121410' },{ skin:'#64645a', light:'#7a7a6e', dark:'#33332c', leg:'#5a5a50', brow:'#161612' }],
    hairs:['#0e0c0a','#26201a','#4a443c'], eye:['#ffb83a','#ff4a1e'], glow:[[255,170,50],[255,70,30]], glowA:0.32 });
  // the goblin on the realistic body plan (user, November 2026: the next creature from the kit): three quarters of a man, a big head on a thin body, long arms,
  // big hands; drawn only from the kit of parts in space (only3d: front, back and side are views of the 2.5D figure, no flat drawing of its own)
  HUMANOIDS.goblinB=Object.assign({},HUMANOIDS.human,{ px:48, height:0.75, hipY:-25, bodyH:[20,2.5], hip:[6.0,1], sh:[7.8,1.2], legW:[5.8,1], legK:[0.97,0.06],
    head:{ w:[4.5,0.4], h:[11.5,0.8] }, hand:[2.5,0.3], handOut:-0.6, handGap:1.0, handDrop:3.0, armK:1.12, pad:4, weaponK:1.0, shieldK:1.3, pauldronK:1.0, clothW:1.2, clothL:0.6,
    face:'goblin', ears:'goblin', hair:null, beard:false, coif:true, coifFace:[0.64,0.32,0.82], pouch:true, clothed:false, rig3d:true, flesh3d:true, only3d:true, kit3d:{ wrap:true, ribs:true, muscles:false },
    feet3d:['claws','bare','wrapped'], belt:'rope', buckle:'plain', helm:'plain', armour:false, scar:false, cloth:true,
    weapons:['dagger','club','spear','bow'], weapon:'dagger', presets:GOBLIN_PRESETS,
    base:Object.assign({},HUMAN_BASE,{ shade:'rgba(20,24,6,0.3)', faceLine:'rgba(24,30,8,0.6)', lip:'#3a3018', pupil:'#140c00', line:'#0e0c06', foot:'#3a2a18', belt:'#4a3a22', leather:'#5a4428', cloth:'#5a3a24', bone:'#d8cca4', mouth:'#1a0a04', socket:'#0c0a04', stubble:'rgba(20,24,6,0.4)' }),
    skins:[{ skin:'#64803a', light:'#7a964a', dark:'#36461c', leg:'#5a4a2a', brow:'#22280e' },{ skin:'#7c9040', light:'#94a856', dark:'#42501e', leg:'#5a4a2a', brow:'#262c10' },{ skin:'#8a8a54', light:'#a2a26a', dark:'#4a4a26', leg:'#5a4a2a', brow:'#2c2c16' }],
    hairs:null, eye:['#f4d040','#ff8a30'], glow:[[244,208,64],[255,138,48]], glowA:0.3 });
  // the rest of the first wave from the kit (user, November 2026: go on with the next creatures), each only in 2.5D like the goblin:
  // the troll: half again a man, hunched (the head carried forward), a massive jaw with tusks, a mane, huge hands and feet
  const KIT_BASE=(o)=>Object.assign({},HUMANOIDS.human,{ rig3d:true, flesh3d:true, only3d:true, real:true, beard:false, scar:false, pouch:true, buckle:'plain', armour:false }, o);
  HUMANOIDS.trollB=KIT_BASE({ px:64, height:1.45, hipY:-46, bodyH:[44,4], hip:[13,1.5], sh:[20,2], legW:[14,1.5], legK:[0.97,0.06], head:{ w:[6.2,0.5], h:[14,1] }, hand:[4.2,0.5], handOut:0, handGap:1.5, handDrop:6, armK:1.25, neckK:0.3, neckW:1.3, headFwd:3, pad:8,
    weaponK:1.6, shieldK:2.2, pauldronK:1.6, clothW:2.0, clothL:0.6, face:'brute', ears:'human', hair:'mane', coif:true, coifFace:[0.66,0.34,0.9], clothed:false, kit3d:{ wrap:true }, feet3d:['bare','claws'], belt:'band', helm:'plain', cloth:true,
    weapons:['club','hammer','axe'], weapon:'club', presets:TROLL_PRESETS, base:Object.assign({},HUMAN_BASE,{ socket:'#0c1214', cloth:'#4a3a2a', bone:'#d8d0bc', faceLine:'rgba(14,22,26,0.6)', shade:'rgba(8,14,18,0.32)', line:'#0a0c0c' }),
    skins:[{ skin:'#5a7e88', light:'#6e949e', dark:'#2e4248', leg:'#4a6a72', brow:'#1e2a2e' },{ skin:'#6a8a96', light:'#80a2ae', dark:'#38484e', leg:'#52707a', brow:'#22302e' },{ skin:'#7a8a78', light:'#92a28e', dark:'#3e4a3c', leg:'#5e6e5c', brow:'#262e24' }],
    hairs:['#2e3a24','#3a3226','#4a4a3a'], eye:['#ffc040','#ff5030'], glow:[[255,192,64],[255,80,48]], glowA:0.35 });
  // the dark elf: a little taller than a man, slender, long pointed ears, long white hair, glowing eyes, dressed dark, in boots
  HUMANOIDS.darkelfB=KIT_BASE({ px:64, height:1.03, hipY:-38, bodyH:[25,2], hip:[7.6,1], sh:[9.6,1], legW:[7.6,1], head:{ w:[3.5,0.3], h:[10,0.6] }, hand:[2.2,0.3], handOut:0.2, handGap:1.2, pad:5,
    sleeves:true, face:'fine', ears:'elf', hair:'long', coif:true, clothed:true, feet3d:['boots'], belt:'band', helm:'crest', cloth:false,
    weapons:['sword','dagger','bow','staff','spear'], weapon:'sword', presets:ELF_PRESETS, base:Object.assign({},HUMAN_BASE,{ tunic:'#3a3256', tunicDark:'#241e38', trim:'#a040a0', foot:'#1a1424', belt:'#2a2038', gold:'#c0b0d8', pupil:'#200028', lip:'#3a2a4a' }),
    skins:[{ skin:'#6a6aa8', light:'#8484c0', dark:'#3a3a66', leg:'#2c2640', brow:'#d8d6e8' },{ skin:'#7a74a0', light:'#948eb8', dark:'#443e60', leg:'#2c2640', brow:'#d8d6e8' },{ skin:'#5a6488', light:'#727ca2', dark:'#323a54', leg:'#2c2640', brow:'#d8d6e8' }],
    hairs:['#e8e6f0','#c8c4d8','#a8a4bc'], eye:['#f0e8ff','#c060ff'], glow:[[220,200,255],[190,90,255]], glowA:0.45 });
  // the vampire: a man's size, pale, hair slicked back, fangs, red eyes, dark clothes, a cape lined red with a high collar
  HUMANOIDS.vampireB=KIT_BASE({ px:64, height:1.0, hipY:-36, bodyH:[25.5,2], hip:[8,1], sh:[10.4,1], legW:[8,1], head:{ w:[3.6,0.3], h:[10,0.6] }, hand:[2.3,0.3], handOut:0.2, handGap:1.2, pad:5,
    sleeves:true, face:'fine', fangs:true, ears:'human', hair:'slick', cape:true, collar:true, coif:true, clothed:true, feet3d:['boots'], belt:'band', helm:'plain', cloth:false,
    weapons:['sword','dagger','staff'], weapon:'none', presets:VAMPIRE_PRESETS, base:Object.assign({},HUMAN_BASE,{ tunic:'#2a1c24', tunicDark:'#140c12', trim:'#a02234', foot:'#0e0a0c', belt:'#3a1420', gold:'#c8a050', cape:'#1e1418', capeIn:'#7a1622', pupil:'#1a0004', lip:'#6a3a40' }),
    skins:[{ skin:'#e4dcdc', light:'#f4ecec', dark:'#a8989c', leg:'#2a1c24', brow:'#2a1c22' },{ skin:'#d8d0d0', light:'#ece4e4', dark:'#9c8e90', leg:'#2a1c24', brow:'#2a1c22' },{ skin:'#c8ccd8', light:'#dce0ec', dark:'#8c90a0', leg:'#2a1c24', brow:'#2a1c22' }],
    hairs:['#1e1418','#3a2a30','#5a4a50'], eye:['#ff3040','#ffb030'], glow:[[255,48,64],[255,176,48]], glowA:0.45 });
  // the warlock: a man's size in a hooded robe to the ground, the face in the hood's shadow, the eyes glowing, barefoot
  HUMANOIDS.warlockB=KIT_BASE({ px:64, height:1.0, hipY:-35, bodyH:[25,2], hip:[8.4,1], sh:[10,1], legW:[8.6,1], head:{ w:[3.7,0.3], h:[10,0.6] }, hand:[2.4,0.3], handOut:0.4, handGap:1.2, pad:6,
    sleeves:true, face:'hood', hood:true, lower:'robe', ears:'human', hair:null, coif:false, clothed:true, feet3d:['bare'], belt:'rope', helm:'plain', cloth:false,
    weapons:['staff','dagger'], weapon:'staff', presets:WARLOCK_PRESETS, base:Object.assign({},HUMAN_BASE,{ tunic:'#3a2e52', tunicDark:'#221a32', trim:'#c08a30', belt:'#c08a30', void:'#050308', socket:'#050308' }),
    skins:[{ skin:'#a89a8a', light:'#c0b2a2', dark:'#6a5e50', leg:'#3a2e52', brow:'#2a2030' },{ skin:'#8a9a7a', light:'#a2b292', dark:'#566248', leg:'#3a2e52', brow:'#2a2030' },{ skin:'#9a8aa8', light:'#b2a2c0', dark:'#5e5068', leg:'#3a2e52', brow:'#2a2030' }],
    hairs:null, eye:['#ffffff','#80f0ff'], glow:[[255,240,220],[120,240,255]], glowA:0.5 });
  // the second wave of the horde from the kit (user, November 2026): ghoul, zombie, dark priest, dark knight, succubus, demon, lich, werewolf; each only in 2.5D
  const P2W={ ghoul:{ aasfresser:GN({ kopf:0.6, kinn:0.7, kopfForm:0.4, koerper:0.05, beine:0.6, augen:0.5, haut:0.3, augenFarbe:0.2, fuss:0.2 }), graeber:GN({ kopf:0.5, kinn:0.4, kopfForm:0.7, koerper:0.2, beine:0.4, haut:0.8, augenFarbe:0.8, fuss:0.6 }) },
    zombie:{ frisch:GN({ kopf:0.5, koerper:0.4, haut:0.2, augenFarbe:0.2, haar:0.4, fuss:0.8 }), verwest:GN({ kopf:0.45, koerper:0.15, haut:0.85, augenFarbe:0.8, haar:0.6, fuss:0.1 }) },
    priest:{ kantor:GN({ kopf:0.5, koerper:0.6, haut:0.3, augenFarbe:0.3, bart:0.7 }), eiferer:GN({ kopf:0.45, kinn:0.7, koerper:0.15, haut:0.7, augenFarbe:0.7, bart:0.1 }) },
    darkknight:{ eisern:GN({ koerper:0.5, haut:0.3 }), gefallen:GN({ koerper:0.3, haut:0.7, augenFarbe:1 }) },
    succubus:{ verfuehrerin:GN({ kopf:0.45, kinn:0.8, koerper:0.2, beine:0.8, haut:0.2, haar:0.1, augenFarbe:0.2 }), dornen:GN({ kopf:0.5, kinn:0.6, koerper:0.3, beine:0.6, haut:0.8, haar:0.9, augenFarbe:0.9 }) },
    demon:{ brut:GN({ kopf:0.4, koerper:0.7, beine:0.3, haut:0.2, augenFarbe:0.2 }), fuerst:GN({ kopf:0.5, koerper:0.4, beine:0.6, haut:0.8, augenFarbe:0.8 }) },
    lich:{ gelehrter:GN({ kopf:0.4, augenFarbe:0.2 }), koenig:GN({ kopf:0.5, augenFarbe:0.9 }) },
    werewolf:{ grau:GN({ kopf:0.5, koerper:0.4, beine:0.6, haut:0.2, haar:0.1, augenFarbe:0.2 }), schwarzpelz:GN({ kopf:0.55, koerper:0.6, beine:0.4, haut:0.6, haar:0.6, augenFarbe:0.8 }) } };
  const SK3=(a,b,c)=>[a,b,c].map(([skin,light,dark,leg,brow])=>({ skin, light, dark, leg, brow }));
  HUMANOIDS.ghoul=KIT_BASE({ px:64, hipY:-35, bodyH:[25,2], hip:[7,1], sh:[9.6,1], legW:[6.8,1], head:{ w:[3.8,0.3], h:[10.5,0.6] }, hand:[2.6,0.3], handOut:0, handGap:1.2, handDrop:3, armK:1.15, headFwd:2.2, neckK:0.6, pad:5,
    face:'ghoul', ears:'human', hair:null, claws:true, kit3d:{ ribs:true, wrap:true, muscles:false }, feet3d:['claws'], clothed:false, cloth:true, coif:true, coifFace:[0.64,0.32,0.84], belt:'rope', helm:'plain',
    weapons:['club','dagger'], weapon:'none', presets:P2W.ghoul, base:Object.assign({},HUMAN_BASE,{ cloth:'#3a3428', leather:'#4a4030', faceLine:'rgba(20,26,22,0.6)', mouth:'#140808', socket:'#0a0c0a' }),
    skins:SK3(['#8a9484','#a0aa98','#4a5248','#5a5040','#2a2e28'],['#9a9488','#b0aa9c','#56524a','#5a5040','#2e2c28'],['#7a8a8a','#90a0a0','#424c4c','#5a5040','#262c2c']), hairs:null, eye:['#e0f0c0','#ff6040'], glow:[[220,240,190],[255,96,64]], glowA:0.4 });
  HUMANOIDS.zombie=KIT_BASE({ px:64, hipY:-36, bodyH:[25.5,2], hip:[8,1], sh:[10.2,1], legW:[8.2,1], head:{ w:[3.6,0.3], h:[10,0.6] }, hand:[2.4,0.3], handOut:0.2, handGap:1.2, headFwd:1.2, pad:5,
    face:'zombie', ears:'human', hair:'short', reach:true, wounds:true, clothed:true, feet3d:['bare','boots'], cloth:false, coif:true, belt:'rope', helm:'plain',
    weapons:['club'], weapon:'none', presets:P2W.zombie, base:Object.assign({},HUMAN_BASE,{ tunic:'#6a6048', tunicDark:'#3e3828', trim:'#4a4232', wound:'#5a1a14', mouth:'#1a0806', faceLine:'rgba(30,30,20,0.6)' }),
    skins:SK3(['#9aa088','#b0b69c','#5a604a','#4e4a3c','#2a2a20'],['#8a9a80','#a0b096','#4e5a46','#4e4a3c','#262a20'],['#a09a8a','#b6b0a0','#5e5a4c','#4e4a3c','#2c2a22']), hairs:['#2a241c','#4a4034','#6a665c'], eye:['#d8d890','#e0a040'], glow:[[216,216,144],[224,160,64]], glowA:0.2 });
  HUMANOIDS.priest=KIT_BASE({ px:64, hipY:-35, bodyH:[25,2], hip:[8.6,1], sh:[10,1], legW:[8.6,1], head:{ w:[3.6,0.3], h:[10,0.6] }, hand:[2.3,0.3], handOut:0.4, handGap:1.2, pad:6,
    face:'human', ears:'human', hair:null, beard:true, sleeves:true, lower:'robe', stole:true, pendant:true, clothed:true, feet3d:['bare'], cloth:false, coif:true, belt:'rope', helm:'plain',
    weapons:['staff','dagger'], weapon:'staff', presets:P2W.priest, base:Object.assign({},HUMAN_BASE,{ tunic:'#4a1820', tunicDark:'#2a0c12', trim:'#b08a3a', gold:'#c8a048' }),
    skins:SK3(['#c9a28a','#dcb8a0','#8a604c','#4a1820','#2a2018'],['#a87a5e','#c09274','#6e4a38','#4a1820','#2a2018'],['#d0c0b0','#e0d4c6','#8a7c70','#4a1820','#3a3028']), hairs:['#3a2c22','#8e8a84','#c8c4bc'], eye:['#5a6e7a','#4a3222'], glow:[[0,0,0],[0,0,0]], glowA:0 });
  HUMANOIDS.darkknight=KIT_BASE({ px:64, hipY:-36, bodyH:[26,2], hip:[8.4,1], sh:[11.2,1], legW:[8.8,1], head:{ w:[3.6,0.3], h:[10,0.6] }, hand:[2.4,0.3], handOut:0.2, handGap:1.2, pad:5,
    face:'human', ears:'human', hair:'short', beard:false, cape:true, clothed:true, feet3d:['boots'], cloth:true, coif:true, belt:'band', helm:'visor', wear:{ helmet:true, helmStyle:'visor', chest:true, pauldrons:true, greaves:true, mat:'schwarz' },
    weapons:['sword','axe','hammer','spear'], weapon:'sword', presets:P2W.darkknight, base:Object.assign({},HUMAN_BASE,{ tunic:'#1e1a22', tunicDark:'#0e0c10', cloth:'#4a0e14', cape:'#1a1216', capeIn:'#5a0e16', void:'#030203' }),
    skins:SK3(['#b09080','#c4a492','#6e5244','#1e1a22','#2a2018'],['#8a6a58','#a0806c','#54402e','#1e1a22','#2a2018'],['#c0b8b0','#d4ccc4','#7a7068','#1e1a22','#2a2018']), hairs:['#1a1410','#3a2c22','#6a6660'], eye:['#ff4030','#ff9a30'], glow:[[255,64,48],[255,154,48]], glowA:0.5 });
  HUMANOIDS.succubus=KIT_BASE({ px:64, hipY:-37, bodyH:[24,2], hip:[9,1], sh:[8.8,1], legW:[7.6,1], waistK:0.7, head:{ w:[3.4,0.3], h:[9.6,0.6] }, hand:[2.1,0.3], handOut:0.2, handGap:1.2, pad:6,
    face:'fine', ears:'elf', hair:'long', horns3d:'curl', wings:0.8, tail:'spade', clothed:true, feet3d:['boots'], cloth:false, coif:true, belt:'band', helm:'plain',
    weapons:['dagger','staff'], weapon:'none', presets:P2W.succubus, base:Object.assign({},HUMAN_BASE,{ tunic:'#3a0c1c', tunicDark:'#1e0610', trim:'#8a2a40', foot:'#14060a', wing:'#3a1420', wingBone:'#6a2a34', lip:'#5a1424' }),
    skins:SK3(['#b0566a','#c86e80','#6a2a38','#2a0a14','#2a0a10'],['#9a4a7a','#b2628e','#5a2446','#2a0a14','#2a0a14'],['#c87a70','#dc9286','#7e4640','#2a0a14','#2a0e0a']), hairs:['#1a0a10','#4a1020','#e0d0c0'], eye:['#ffd040','#ff3070'], glow:[[255,208,64],[255,48,112]], glowA:0.45 });
  HUMANOIDS.demon=KIT_BASE({ px:64, height:1.6, hipY:-50, bodyH:[46,4], hip:[13,1.5], sh:[21,2], legW:[13,1.5], head:{ w:[5.6,0.4], h:[13,0.8] }, hand:[3.8,0.4], handOut:0, handGap:1.5, handDrop:4, armK:1.15, neckK:0.4, neckW:1.2, pad:9,
    weaponK:1.6, shieldK:2.2, pauldronK:1.6, clothW:2.0, clothL:0.6, face:'demon', fangs:true, ears:'elf', hair:null, horns3d:'big', wings:1.0, tail:'spade', claws:true, kit3d:{ wrap:true }, feet3d:['claws'], clothed:false, cloth:true, coif:false, belt:'band', helm:'plain',
    weapons:['axe','hammer','club'], weapon:'axe', presets:P2W.demon, base:Object.assign({},HUMAN_BASE,{ cloth:'#2a0c08', leather:'#3a2014', wing:'#2a0c0a', wingBone:'#4a1a12', faceLine:'rgba(30,6,4,0.6)', line:'#0c0404' }),
    skins:SK3(['#8a2a1c','#a43a28','#4a120a','#5a1a10','#1a0604'],['#6a2a2a','#843a38','#3a1212','#4a1a18','#1a0606'],['#9a4a1c','#b45e2a','#561e0a','#5a2a10','#1e0a04']), hairs:null, eye:['#ffd040','#ff8020'], glow:[[255,208,64],[255,128,32]], glowA:0.5 });
  HUMANOIDS.lich=Object.assign({},HUMANOIDS.skeleton2,{ only3d:true, rig3d:true, flesh3d:false, side:false, robeTop:true, lower:'robe', sleeves:true, crown:true, eyeGlow:true, clothed:true, weapons:['staff','dagger'], weapon:'staff', presets:P2W.lich,
    base:Object.assign({},HUMANOIDS.skeleton2.base,{ tunic:'#2a1e3a', tunicDark:'#160e20', trim:'#b08a3a', gold:'#c8a048' }), eye:['#80f0ff','#a0ff80'], glow:[[120,240,255],[160,255,128]], glowA:0.55 });
  HUMANOIDS.werewolf=KIT_BASE({ px:64, height:1.2, hipY:-42, bodyH:[30,3], hip:[9,1], sh:[14,1.4], legW:[9.5,1], head:{ w:[4.2,0.4], h:[11,0.8] }, hand:[3.2,0.4], handOut:0, handGap:1.4, handDrop:4, armK:1.2, headFwd:3, neckK:0.5, neckW:1.2, pad:6,
    weaponK:1.3, shieldK:1.8, pauldronK:1.3, face:'wolf', ears:'wolf', hair:null, ruff:true, tail:'fur', claws:true, kit3d:{ muscles:true }, feet3d:['claws'], clothed:false, cloth:true, coif:false, belt:'rope', helm:'plain',
    weapons:['club','axe'], weapon:'none', presets:P2W.werewolf, base:Object.assign({},HUMAN_BASE,{ cloth:'#3a3026', void:'#0a0806', mouth:'#1a0a08', faceLine:'rgba(20,16,12,0.55)' }),
    skins:SK3(['#6a6058','#827870','#3a342e','#4a4038','#1a1612'],['#4a4440','#605a54','#2a2624','#3a3430','#121010'],['#7a5a40','#927052','#46321e','#4a3a2a','#1e140c']), hairs:['#4a423a','#2a2622','#5a4030'], eye:['#ffd040','#ff8a30'], glow:[[255,208,64],[255,138,48]], glowA:0.45 });
  // one humanoid's parts from its kind, genes and stats (back: seen from behind)
  function humanoidShapes(kind,g,t,back,G){
    const K=HUMANOIDS[kind], lin=(r,v)=>r[0]+r[1]*v, sw=K.line, mvS=(sh,dx,dy)=>sh.map(([d,c,w,st])=>[movePath(d,dx,dy),c,w,st]);
    t=Object.assign({ stark:0.5 },t||{});
    const plump=g.koerper, hipY=K.hipY, u=-hipY/10, bodyH=lin(K.bodyH,plump), topY=hipY-bodyH;
    const wHip=lin(K.hip,plump)*(0.95+0.1*t.stark), wSh=lin(K.sh,plump)*(0.8+0.5*t.stark);       // strength: the shoulders much more than the hips
    // the legs: the form axis (slim and oval, round and stout, angular and blocky), the thickness with the body; the foot of the kind
    const xc=-wHip*K.legX, lw=lin(K.legW,plump)*(0.95+0.1*t.stark), lf=g.beinForm===undefined?0.5:g.beinForm, ft=g.fuss===undefined?0:g.fuss;
    const lPts=formPts(xc,hipY/2-0.6*u,lw/2*(lf<0.5?1.15:1),-hipY/2+0.6*u,lf,0,1.1,0.75), robe=K.lower==='robe';
    const leg=robe?[]:(K.bones?EXTRAS.boneLeg(xc,hipY,lw):[[ptsPath(lPts),'leg',sw*0.95],[formShade(lPts,xc),'shade',0]]);       // under a robe no legs
    const fType=K.feet[Math.min(2,Math.floor(ft*3))], foot=robe?[]:footShapes(fType,xc,lw,u,sw);
    // the body: from the hips up to the shoulders, oval, round or angular; ribs when gaunt, a belly when round
    const bTop=topY-1.4*u, bBot=hipY+1.6*u, bPts=formPts(0,(bTop+bBot)/2,1,(bBot-bTop)/2,g.koerperForm===undefined?0.5:g.koerperForm,0,wSh*1.12,wHip*1.3);
    const body=[[ptsPath(bPts),K.clothed?'tunic':'skin',sw],[formShade(bPts,0),'shade',0]];
    if(K.clothed) body.push([`M${f2(-wSh*0.42)} ${f2(topY-1)} L0 ${f2(topY+bodyH*0.3)} L${f2(wSh*0.42)} ${f2(topY-1)}`,null,1.1*u,'trim']);       // a neckline
    if(plump<0.35&&!K.clothed){ const rx=wSh*0.62; body.push([[0.32,0.5,0.68].map(k=>hipY-bodyH*k).map(y=>`M${f2(-rx)} ${f2(y)} l${f2(2.4*u)} ${f2(0.7*u)} M${f2(rx)} ${f2(y)} l${f2(-2.4*u)} ${f2(0.7*u)}`).join(' '),null,0.9*u,'dark']); }
    const bx=wHip*0.5, by1=hipY-bodyH*0.55, by2=hipY-1*u;
    const belly=plump>=0.3&&!K.clothed?[[`M${f2(-bx)} ${f2(by1)} Q0 ${f2(by1+3.5*u)} ${f2(bx)} ${f2(by1)} Q${f2(bx*0.75)} ${f2(by2-0.5*u)} 0 ${f2(by2)} Q${f2(-bx*0.75)} ${f2(by2-0.5*u)} ${f2(-bx)} ${f2(by1)}z`,'light',0]]:[];
    // the head: oval, round or angular, the chin to a point, on top of the shoulders; the face of the kind on it
    const HD=K.head, hf=g.kopfForm===undefined?0.5:g.kopfForm, w=lin(HD.w,g.kopf), p=g.kinn, h=lin(HD.h,g.kopf)*(1+HD.chinH*p), chinY=topY+HD.over*u, top=chinY-h, cy=top+h*0.45;
    const hPts=formPts(0,top+h/2,w,h/2,hf,p*HD.chinK), aw=w*(hf<0.5?0.8+0.4*hf:1), skull=[[ptsPath(hPts),'skin',sw],[formShade(hPts,0),'shade',0]];
    const face=(FACES[K.face]||FACES.human)({ aw, h, top, cy, chinY },g,K);
    // the body plan the gear is fitted to
    const A={ topY, hipY, wSh, wHip, bodyH, bPts, hPts, top, h, aw, cy, chinY, browY:face.browY, u, sw }, pd=GEAR.pauldron(A);
    const hr=lin(K.hand,plump)*(0.9+0.25*t.stark), handAt=[f2(wSh+K.handOut*u),f2(hipY-bodyH*0.42)], headY=(g.tief||0)*HD.sink, legK=lin(K.legK,g.beine===undefined?0.5:g.beine);
    const S=Object.assign({ shadow:[[ell(0,f2(1.2*u),f2(wHip+2*u),f2(2*u)),'shadowC',0]], leg, foot, footClaws:fType==='claws', hip:[f2(xc),hipY], body, belly,
      neck:[0,f2(topY+1*u)], skull, scar:K.scar?[[`M${f2(-aw*0.75)} ${f2(top+h*0.22)} L${f2(-aw*0.2)} ${f2(top+h*0.72)}`,null,1.1,'scar']]:null,
      helmet:GEAR.helmet(A,K,back,(G&&G.helmStyle)||K.helm), shield:G&&G.shield?GEAR.shield(A,G.shield,[-handAt[0],handAt[1]],G.shieldFlat,back):null, chest:GEAR.chest(A), pauldron:pd.shapes, pauldronAt:pd.at, cloth:GEAR.cloth(A),
      fist:fist(handAt[0],handAt[1],f2(hr),f2(hr*0.92),sw*0.95), handAt, handGap:K.handGap,
      horn:null, look:{ ears:!!K.ears, horns:false }, headY, legK, px:K.px,
      shoulderAt:[wSh*0.95,topY+bodyH*0.15], armW:[hr*0.8,hr*0.58,hr*0.45],
      headBox:[-aw*0.6,top+h*0.15,aw*0.6,top+h*0.62], bodyBox:[-wSh*0.6,topY+2*u,wSh*0.6,hipY-3*u],
      H:Math.round(-hipY*(legK-1)+(-top)-headY+K.pad) },face,GEAR.belt(A,K));
    if(K.bones) S.body=EXTRAS.bones(A), S.belly=[];
    if(K.hood) S.skull=[[ptsPath(hPts),'void',0]], S.hood=EXTRAS.hood(A,back);       // under the hood no head: a dark
    if(K.hair) Object.assign(S,EXTRAS.hair(A,K.hair,back));
    if(K.collar) S.collar=EXTRAS.collar(A);
    if(K.cape) S.cape=EXTRAS.cape(A,back);
    if(robe) S.robe=EXTRAS.robe(A);
    if(K.crest) S.crest=EXTRAS.crest(A);
    if(K.ears==='goblin'||K.ears==='elf'){       // big ears of a kind: the goblin's out to the side, the elf's long and up
      const e=K.ears==='goblin'?`M${f2(-aw*0.88)} ${f2(cy-0.16*h)} L${f2(-aw*2.15)} ${f2(cy-0.34*h)} L${f2(-aw*0.9)} ${f2(cy+0.16*h)}z`:`M${f2(-aw*0.9)} ${f2(cy-0.1*h)} L${f2(-aw*1.7)} ${f2(top-0.02*h)} L${f2(-aw*0.92)} ${f2(cy+0.12*h)}z`;
      const ei=K.ears==='goblin'?`M${f2(-aw*0.95)} ${f2(cy-0.08*h)} L${f2(-aw*1.8)} ${f2(cy-0.25*h)} L${f2(-aw*0.96)} ${f2(cy+0.08*h)}z`:`M${f2(-aw*0.96)} ${f2(cy-0.04*h)} L${f2(-aw*1.5)} ${f2(top+0.12*h)} L${f2(-aw*0.97)} ${f2(cy+0.06*h)}z`;
      Object.assign(S,{ ear:[[e,'skin',sw*0.85],[ei,'dark',0]], earTip:null, earAt:[f2(-aw*0.9),f2(cy)] });
    }
    else if(K.ears){       // the ears: pointed with a kink, or lobes; at the side of the head, as big as the head
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
    club:[['M22 -6 L25 -6 L28.5 -37 Q24 -45 18.5 -37z','wood',1.6],['M19 -36 L16 -37 M28 -36 L31 -37 M20.5 -30 L17.5 -30 M27 -30 L30 -30',null,1.4,'ironDark']],
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
    const out={ kind, style:'eigen', genes, traits:{ klug:r(), stark:r(), flink:r(), wild:r() }, hue:(r()*2-1)*12, scar:r()<0.4,
      gear:{ helmet:r()<0.5, chest:r()<0.5, pauldrons:r()<0.45, cloth:r()<0.6, weapon:pick(['none'].concat(K.weapons)), hands:true, load:pick(['none','gold','ore']), ears:!!K.ears||r()<0.5, horns:false }, level:1+Math.floor(r()*12), seed };       // an imp always has its ears (they show its level)
    out.genes.haar=r(); out.genes.bart=r(); out.gear.greaves=r()<0.4;       // drawn last: the seeds of before keep their looks
    out.genes.bemalung=r();
    return out;
  }
  function defaults(kind){
    kind=kindOf(kind); const K=HUMANOIDS[kind], first=Object.keys(K.presets)[0];
    return { kind, style:first, genes:Object.assign({},K.presets[first]), traits:{ klug:0.5, stark:0.5, flink:0.5, wild:0.5 }, hue:0, scar:!!K.scar,
      gear:{ helmet:!K.worker&&K.armour!==false, chest:false, pauldrons:!K.worker&&K.armour!==false, cloth:!!K.cloth, weapon:K.weapon, hands:true, arms:K.arms!==false, load:'gold' } };       // a worker (the imp) wears no armour, nor do those in clothes
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
  // ---- the side view (a test, user November 2026: besides front and back also left and right; first the fantasy skeleton) ----
  // The skeleton seen from its right, facing right (the left view is it mirrored): the skull in profile (the socket, the nose's hole, the cheekbone, the jaw's
  // hinge), the spine's S (neck forward, the back round, the small of the back hollow), the ribs from the spine down and forward to the breastbone, the shoulder
  // blade over them, the pelvis from the side, the leg with the kneecap in front and the foot pointing forward; the armour from the side; the shield on its edge.
  function sideSkeleton(S0,K,G){
    const A=S0.A, { topY, hipY, bodyH, u, h, top, legs:{ kneeY, ankY } }=A, hd=h*0.82, X=x=>x*hd, Y=y=>top+y*h, P2=a=>a.map(([x,y])=>[X(x),Y(y)]);
    const cr=P2([[0.05,0],[0.3,0.04],[0.44,0.2],[0.47,0.4],[0.42,0.47],[0.47,0.57],[0.5,0.66],[0.43,0.71],[0.42,0.82],[0.2,0.8],[0.02,0.7],[-0.15,0.8],[-0.36,0.68],[-0.49,0.45],[-0.46,0.2],[-0.25,0.04]]);
    const teeth=(y0,y1)=>[0.25,0.31,0.37].map(x=>`M${f2(X(x))} ${f2(Y(y0))} L${f2(X(x+0.05))} ${f2(Y(y0))} L${f2(X(x+0.05))} ${f2(Y(y1))} L${f2(X(x))} ${f2(Y(y1))}z`).join(' ');
    const skull=[[sp(cr,3),'skin',BF*1.2,'line'],[sp(P2([[-0.46,0.2],[-0.49,0.45],[-0.36,0.68],[-0.25,0.55],[-0.33,0.3]]),2),'boneShade',0],
      [sp(P2([[0.18,0.42],[0.42,0.43],[0.44,0.53],[0.3,0.56],[0.17,0.52]]),2),'socket',BF,'line'],       // the socket, black, from the side
      [sp(P2([[0.43,0.6],[0.5,0.64],[0.46,0.69],[0.4,0.66]]),2),'socket',BF*0.8,'line'],       // the nose's hole
      [`M${f2(X(-0.05))} ${f2(Y(0.62))} L${f2(X(0.3))} ${f2(Y(0.61))}`,null,0.7*u,'line'],[`M${f2(X(-0.05))} ${f2(Y(0.62))} L${f2(X(0.3))} ${f2(Y(0.61))}`,null,0.7*u-0.6,'skin'],       // the cheekbone's arch
      [`M${f2(X(-0.05))} ${f2(Y(0.03))} L${f2(X(0.05))} ${f2(Y(0.12))} L${f2(X(-0.02))} ${f2(Y(0.18))} L${f2(X(0.08))} ${f2(Y(0.28))}`,null,0.6,'line'],       // the crack
      [teeth(0.75,0.82),'tooth',0.22,'line']];
    const jaw=[[sp(P2([[0.42,0.82],[0.46,0.88],[0.42,0.98],[0.15,1.0],[-0.08,0.94],[-0.12,0.72],[-0.02,0.66],[0.02,0.8],[0.38,0.84]]),2),'skin',BF*1.2,'line'],[teeth(0.82,0.88),'tooth',0.22,'line']];
    // the spine: a smooth S of vertebrae, each a block across the curve with its spike to the back
    const sp0=[[X(-0.08),Y(0.86)],[-1.0*u,topY+0.2*u],[-2.0*u,topY+bodyH*0.2],[-2.3*u,topY+bodyH*0.35],[-1.8*u,topY+bodyH*0.5],[-1.0*u,topY+bodyH*0.62],[-0.8*u,hipY-6.4*u],[-1.6*u,hipY-4.5*u],[-2.0*u,hipY-2.6*u]];
    const line=spline(sp0,6), spineX=y=>{ for(let i=0;i<line.length-1;i++){ const a=line[i], b=line[i+1]; if((a[1]-y)*(b[1]-y)<=0&&a[1]!==b[1]) return a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]); } return line[line.length-1][0]; };
    const body=[[ptsPath(A.bPts),null,0]];
    for(let i=0;i<line.length-2;i+=2){ const p=line[i], q=line[i+1], seg=boneAlong(p,[p[0]+(q[0]-p[0])*0.8,p[1]+(q[1]-p[1])*0.8],0.75*u,0.75*u,0.75*u);
      body.push([ptsPath(seg),'skin',BF*0.8,'line'],[`M${f2(p[0]-0.6*u)} ${f2(p[1]+0.2*u)} L${f2(p[0]-1.5*u)} ${f2(p[1]+0.7*u)} L${f2(p[0]-0.6*u)} ${f2(p[1]+0.8*u)}z`,'skin',BF*0.6,'line']); }
    // the ribs: from the spine down and forward round the side to the breastbone
    const sB=topY+bodyH*0.32, st=(y)=>4.2*u+(y-topY)/(sB-topY)*0.9*u;       // the breastbone, the depth of the chest in front of the spine
    for(let i=0;i<6;i++){ const yb=topY+1.0*u+i*1.25*u, yf=Math.min(sB-0.3*u,topY+1.4*u+i*1.5*u), B=[spineX(yb)+0.6*u,yb], F=[st(yf),yf], M=[(B[0]+F[0])/2+0.4*u,Math.max(yb,yf)+1.4*u+0.25*i*u];
      const c=ptsPath(spline([B,[B[0]+1.2*u,yb+0.8*u],M,[F[0]-0.8*u,yf+0.6*u],F],4)).replace(/z$/,''); body.push([c,null,0.75*u+BF*2,'line'],[c,null,0.75*u,'skin']); }
    body.push(...fBone(boneAlong([4.2*u,topY+0.4*u],[5.1*u,sB],0.65*u,0.55*u,0.4*u),1));       // the breastbone
    body.push(...fBone([[-0.9*u,topY+0.3*u],[-2.6*u,topY+0.6*u],[-3.1*u,topY+bodyH*0.33],[-1.6*u,topY+bodyH*0.29],[0.3*u,topY+1.6*u]],2));       // the shoulder blade
    { const c=`M${f2(4.2*u)} ${f2(topY+0.4*u)} Q${f2(2.2*u)} ${f2(topY-0.3*u)} ${f2(0.2*u)} ${f2(topY+0.3*u)}`; body.push([c,null,1.3*u+BF*2,'line'],[c,null,1.3*u,'skin']); }       // the collarbone
    body.push(fKnob(0,topY+0.9*u,1.1*u,1.0*u));       // the shoulder joint
    body.push(...fBone([[-2.3*u,hipY-6.4*u],[0.6*u,hipY-7.4*u],[2.8*u,hipY-6.6*u],[2.4*u,hipY-5.2*u],[1.2*u,hipY-4*u],[1.4*u,hipY-2.2*u],[2.6*u,hipY-1.4*u],[2.2*u,hipY-0.7*u],[0.6*u,hipY-0.9*u],[-0.9*u,hipY-0.3*u],[-1.6*u,hipY-1.6*u],[-0.8*u,hipY-3.4*u],[-1.8*u,hipY-4.6*u]],2),
      [ell(f2(0.9*u),f2(hipY-1.6*u),f2(0.6*u),f2(0.5*u)),'socket',BF,'line']);       // the pelvis from the side, its hole
    // the leg: thigh bone from the hip's joint to the knee, the kneecap in front; shin and calf bone; the foot: heel, the long bones, the toes, forward
    const H=[0.4*u,hipY-3*u], Kn=[0.7*u,kneeY-0.4*u], Ak=[0.3*u,ankY];
    const leg=[...fBone(boneAlong(H,Kn,0.95*u,0.72*u,1.1*u),1),fKnob(H[0],H[1],1.0*u,1.0*u),fKnob(0,hipY-2.1*u,0.9*u,1.0*u)];
    const shin=[...fBone(boneAlong([-0.4*u,kneeY+1.2*u],[-0.2*u,ankY+0.3*u],0.4*u,0.3*u,0.42*u),1),...fBone(boneAlong([0.9*u,kneeY+0.6*u],Ak,1.1*u,0.68*u,0.85*u),1),fKnob(Kn[0],Kn[1],1.1*u,1.0*u),fKnob(1.9*u,kneeY-0.2*u,0.6*u,0.85*u)];
    const foot=[fKnob(-0.8*u,-0.9*u,1.0*u,0.85*u),fKnob(Ak[0],ankY+0.6*u,0.8*u,0.7*u)];
    for(let i=0;i<2;i++) foot.push(...fBone(boneAlong([0.6*u,ankY+1.2*u+i*0.3*u],[3.4*u-i*0.4*u,-0.5*u],0.42*u,0.32*u,0.38*u),1),...fBone(boneAlong([3.4*u-i*0.4*u,-0.5*u],[4.6*u-i*0.5*u,-0.15*u],0.36*u,0.28*u,0.3*u),1));
    // ---- the armour from the side, on the same measures (the human's, so the skeleton wears what a man would) ----
    const gear={}, ww=A.sw||1;
    if(G&&G.helmet){
      const shell=P2([[0.5,0.42],[0.49,0.2],[0.33,0.0],[0.05,-0.07],[-0.3,-0.01],[-0.52,0.2],[-0.57,0.46],[-0.5,0.52],[0.05,0.47]]);
      const out=[];
      if(G.helmStyle==='horns'||(!G.helmStyle&&K.helm==='horns')) out.push([sp(P2([[-0.14,0.17],[-0.14,-0.2],[0.22,-0.42],[0.02,-0.12],[0.1,0.13]]),2),'bone',ww*0.85]);       // the near horn, forward and up
      out.push([sp(shell,2),'iron',ww],[sp(P2([[-0.3,0.05],[-0.52,0.22],[-0.56,0.46],[-0.4,0.42],[-0.38,0.2]]),2),'shade',0],[`M${f2(X(0.5))} ${f2(Y(0.4))} Q${f2(X(0))} ${f2(Y(0.47))} ${f2(X(-0.55))} ${f2(Y(0.45))}`,null,1.1*u,'ironDark'],
        [`M${f2(X(0.33))} ${f2(Y(0.0))} Q${f2(X(0))} ${f2(Y(-0.09))} ${f2(X(-0.3))} ${f2(Y(0.0))}`,null,0.6,'ironDark'],[sp(P2([[0.46,0.4],[0.56,0.4],[0.56,0.67],[0.49,0.67]]),1),'ironDark',ww*0.6]);       // the rim, the ridge, the nose guard
      if(G.helmStyle==='crest') out.push([sp(P2([[0.25,-0.02],[0.15,-0.3],[-0.35,-0.25],[-0.3,0.0]]),2),'cloth',ww*0.8]);
      gear.helmet=out;
      // the mail hood: round the back of the head and the neck down onto the shoulders, the face open
      const outer=P2([[0.3,0.2],[-0.1,0.02],[-0.55,0.3],[-0.6,0.76]]).concat([[-2.4*u,topY-0.4*u],[-3.2*u,topY+1.8*u],[0.5*u,topY+2.7*u],[4.7*u,topY+2.3*u],[st(topY)+0.3*u,topY-0.6*u]],P2([[0.28,1.12],[0.5,1.0],[0.53,0.6],[0.5,0.3]]));
      const ring=spline(outer,2,true), hole=ellPts(X(0.32),Y(0.67),X(0.21),h*0.3,20), rings=[];
      for(let y=Y(0.1);y<topY+2.4*u;y+=0.9) for(let x=-3.2*u;x<=5*u;x+=1.1){ const xx=x+((Math.round((y-Y(0.1))/0.9)%2)?0.55:0); if(inside(ring,xx,y)&&!inside(hole,xx,y+0.3)&&!inside(hole,xx,y-0.4)) rings.push(`M${f2(xx-0.45)} ${f2(y)} q0.45 0.5 0.9 0`); }
      gear.coif=[[withHole(ring,hole),'mail',ww*0.8],[rings.join(' '),null,0.3,'ironDark']];
    }
    if(G&&G.chest){       // the breastplate and the back plate as one shell, round in front, the lames at the bottom
      const yt=topY+0.4*u, yc=hipY-bodyH*0.3, sx2=y=>spineX(y);
      const shell=[[st(yt)+0.4*u,yt+0.4*u],[st(topY+bodyH*0.2)+1.2*u,topY+bodyH*0.2],[4.5*u,yc],[3.8*u,yc+2.4*u],[sx2(yc)-1.4*u,yc+1.6*u],[sx2(topY+bodyH*0.3)-1.8*u,topY+bodyH*0.3],[sx2(yt)-1.5*u,yt+0.6*u],[0,yt-0.5*u]];
      gear.chest=[[sp(shell,3),'iron',ww],[sp([[sx2(yc)-1.4*u,yc+1.6*u],[sx2(topY+bodyH*0.3)-1.8*u,topY+bodyH*0.3],[sx2(yt)-1.5*u,yt+0.6*u],[sx2(yt)-0.4*u,yt+0.8*u],[sx2(topY+bodyH*0.3)-0.6*u,topY+bodyH*0.32],[sx2(yc)-0.2*u,yc+1.2*u]],2),'shade',0],
        [`M${f2(4.4*u)} ${f2(yc-1.2*u)} Q${f2(0.5*u)} ${f2(yc+0.3*u)} ${f2(sx2(yc)-1.5*u)} ${f2(yc-0.2*u)} M${f2(4.1*u)} ${f2(yc+0.8*u)} Q${f2(0.5*u)} ${f2(yc+2*u)} ${f2(sx2(yc)-1.4*u)} ${f2(yc+1.3*u)}`,null,ww*0.55,'ironDark'],
        [[[2.6*u,yt+1.4*u],[-1.4*u,yt+1.6*u],[3.4*u,yc-2.6*u]].map(([x,y])=>ell(f2(x),f2(y),f2(0.35*u),f2(0.35*u))).join(' '),'ironDark',0],[`M${f2(3.2*u)} ${f2(topY+bodyH*0.22)} l${f2(0.5*u)} ${f2(2.6*u)}`,null,ww*0.6,'rust']];
    }
    if(G&&G.pauldrons){       // a dome over the shoulder's joint, two lames below, a spike up and back
      const y0=topY+0.9*u; gear.pauldronAt=[0,f2(y0)];
      gear.pauldron=[[`M${f2(0.2*u)} ${f2(y0-2.2*u)} L${f2(-1.4*u)} ${f2(y0-5.6*u)} L${f2(1.4*u)} ${f2(y0-2.4*u)}z`,'ironDark',ww*0.75],[sp([[-3.0*u,y0+0.8*u],[-2.4*u,y0-1.5*u],[0,y0-2.4*u],[2.6*u,y0-1.4*u],[3.2*u,y0+0.9*u],[1.5*u,y0+1.7*u],[-1.5*u,y0+1.7*u]],2),'iron',ww],
        [`M${f2(-2.8*u)} ${f2(y0+0.6*u)} Q0 ${f2(y0+1.6*u)} ${f2(3.0*u)} ${f2(y0+0.6*u)} M${f2(-2.6*u)} ${f2(y0-0.4*u)} Q0 ${f2(y0+0.6*u)} ${f2(2.8*u)} ${f2(y0-0.4*u)}`,null,ww*0.55,'ironDark'],[sp([[0.6*u,y0-2.3*u],[2.6*u,y0-1.4*u],[3.2*u,y0+0.9*u],[2*u,y0+1.5*u],[1.6*u,y0-0.6*u]],2),'shade',0]];
    }
    const by=A.beltY===undefined?hipY-5.2*u:A.beltY;
    if(G&&(G.chest||G.cloth||G.pauldrons)){       // the belt round the waist, its buckle in front, the pouch at the side
      gear.belt=[[sp([[-2.7*u,by],[4.3*u,by-0.3*u],[4.4*u,by+1.6*u],[-2.6*u,by+1.9*u]],1),'belt',ww*0.9],[sp([[-0.4*u,by+1.6*u],[1.8*u,by+1.5*u],[1.9*u,by+4.6*u],[-0.3*u,by+4.7*u]],1),'leather',ww*0.8],[`M${f2(-0.4*u)} ${f2(by+2.8*u)} L${f2(1.85*u)} ${f2(by+2.7*u)}`,null,0.6,'line']];
      gear.buckle=[[`M${f2(3.9*u)} ${f2(by-0.5*u)} L${f2(4.6*u)} ${f2(by-0.6*u)} L${f2(4.7*u)} ${f2(by+1.9*u)} L${f2(4.0*u)} ${f2(by+2.0*u)}z`,null,0.8*u,'ironDark']];
    }
    if(G&&G.cloth){       // the tabard: a front and a back panel, frayed, to the knees (the near leg between them)
      const jag=(x0,x1,y)=>[[x1,y],[x1-0.25*(x1-x0),y-1.2*u],[x1-0.5*(x1-x0),y+0.2*u],[x1-0.75*(x1-x0),y-1.0*u],[x0,y]];
      gear.cloth=[[ptsPath([[2.4*u,by+1.5*u],[4.1*u,by+1.3*u],[3.9*u,kneeY+1.4*u]].concat(jag(1.9*u,3.9*u,kneeY+1.4*u).slice(1))),'cloth',ww*0.85]];
      gear.clothBack=[[ptsPath([[-2.7*u,by+1.8*u],[-1.0*u,by+1.8*u],[-1.3*u,kneeY+1.2*u]].concat(jag(-3.1*u,-1.3*u,kneeY+1.2*u).slice(1))),'cloth',ww*0.85]];
    }
    if(G&&G.greaves){       // the thigh plate in front, the knee plate with its spike, the shin's plate, the iron shoe
      leg.push([ptsPath(boneAlong([H[0]+0.6*u,(H[1]+Kn[1])/2],[Kn[0]+0.5*u,Kn[1]-1.2*u],1.5*u,1.6*u,1.4*u)),'iron',ww*0.85]);
      shin.push([ptsPath(boneAlong([0.6*u,kneeY+1.0*u],[0.35*u,ankY-0.8*u],1.6*u,1.35*u,1.2*u)),'iron',ww*0.9],[`M${f2(1.4*u)} ${f2(kneeY+3*u)} l${f2(-0.3*u)} ${f2(3*u)}`,null,ww*0.6,'rust'],
        [ell(f2(Kn[0]+0.5*u),f2(Kn[1]),f2(1.4*u),f2(1.3*u)),'iron',ww*0.85],[`M${f2(Kn[0]+1.6*u)} ${f2(Kn[1]-0.5*u)} L${f2(Kn[0]+3.2*u)} ${f2(Kn[1])} L${f2(Kn[0]+1.6*u)} ${f2(Kn[1]+0.5*u)}z`,'ironDark',ww*0.6]);
      foot.push([sp([[-1.8*u,-1.8*u],[0.6*u,ankY-0.2*u],[1.6*u,ankY+0.6*u],[4.9*u,-0.8*u],[5.1*u,0.15],[-2.0*u,0.15]],2),'iron',ww*0.85],[`M${f2(1.4*u)} ${f2(ankY+1.6*u)} L${f2(2.6*u)} ${f2(-1.4*u)} M${f2(2.6*u)} ${f2(ankY+2.2*u)} L${f2(3.8*u)} ${f2(-1.0*u)}`,null,ww*0.55,'ironDark']);
    }
    const handAt=[f2(1.0*u),f2(hipY+0.3*u)], hr=S0.handR||2.3;
    const S=Object.assign({},S0,{ side:true, skull, nose:[], eye:[], pupil:[], lid:[], brow:[], mouth:[], jaw, jawAt:[f2(X(-0.08)),f2(Y(0.7))], eyeAt:[0,f2(Y(0.48))], browAt:[0,f2(Y(0.4))],
      body, belly:[], leg, shin, foot, hip:[f2(H[0]),f2(H[1])], knee:[f2(Kn[0]),f2(Kn[1])], ankle:[f2(Ak[0]),f2(Ak[1])], handAt, fist:boneFistF(+handAt[0],+handAt[1],S0.hr||2.3),
      shoulderAt:[0,topY+0.9*u], shield:G&&G.shield?GEAR.shield(Object.assign({},A,{ sideOn:true }),G.shield,[+handAt[0],+handAt[1]],false,false):null,
      shadow:[[ell(0,f2(0.6*u),f2(5*u),f2(1.4*u)),'shadowC',0]], scar:null, helmet:gear.helmet||[], coif:gear.coif||null, chest:gear.chest||[], pauldron:gear.pauldron||[], pauldronAt:gear.pauldronAt||[0,0], cloth:gear.cloth||[], clothBack:gear.clothBack||null, belt:gear.belt||[], buckle:gear.buckle||[] });
    return S;
  }
  function build(spec){
    const kind=kindOf(spec&&spec.kind), K=HUMANOIDS[kind], own=spec&&spec.genes; spec=Object.assign({},defaults(kind),spec||{}); spec.kind=kind;
    if(!stylesOf(kind).includes(spec.style)) spec.style=stylesOf(kind)[0];
    const genes=genesOf({ kind, style:spec.style, genes:own }), t=Object.assign({},defaults(kind).traits,spec.traits), G=Object.assign({},defaults(kind).gear,spec.gear,K.wear), back=spec.view==='back';
    const sideV=(spec.view==='left'||spec.view==='right')&&!!K.side;       // the side view (a test: the fantasy skeleton); without it a kind is seen from the front
    let S=(K.real?realShapes:humanoidShapes)(kind,genes,t,back,G);
    if(sideV) S=sideSkeleton(S,K,G);
    const pal=Object.assign({ shadowC:'rgba(0,0,0,0.35)' },palOf(K,genes)); SKIN_KEYS.forEach(k=>{ pal[k]=hueShift(pal[k],spec.hue); });
    const M=(K.mats||MATERIALS)[G.mat]; if(M){ pal.iron=M[0]; pal.ironDark=M[1]; }       // the armour's material (the game's: leather, bronze, iron, steel)
    const armoured=!!G.pauldrons; pal.hand=armoured?pal.iron:pal.skin; pal.handLine=armoured?pal.ironDark:pal.dark;       // the hands: skin, or armour with the shoulder plates
    const P=(id,pivot,shapes,kids)=>({ id, pivot, shapes:shapes||[], kids:(kids||[]).filter(Boolean) });
    const mirrorShapes=sh=>sideV?sh:sh.map(([d,f,w,st])=>[mirror(d),f,w,st]);
    const shiftX=(sh,dx)=>sh.map(([d,f,w,st])=>[d.replace(/^M(-?[\d.]+)/,(m0,x)=>'M'+(parseFloat(x)+dx).toFixed(2)),f,w,st]);       // ellipses moved over keep their shape
    const ex=S.eyeAt, br=S.browAt, R=sideV?(v=>v):(v=>[-v[0],v[1]]), ears=!!K.ears&&G.ears!==false, front=!back;       // (from the side both hands and legs stand at the same place: no mirror)
    const lvl=Math.max(1,Math.min(12,spec.level||1)), earK=S.earGrow?(lvl-1)/11:0;       // earK: how far the ears have grown (0 at level 1, 1 at 12)
    const grow=Math.min(1,(lvl-1)/5), sag=Math.max(0,(lvl-6)/6);       // kinked ears: out until level 6, then down
    const nScars=spec.scars||0, seed=spec.seed||17, hy=S.neck[1];
    const earParts=ears&&S.ear?[P('earL',S.earAt,S.ear,S.earTip?[P('earTipL',S.kinkAt,S.earTip)]:[]),P('earR',R(S.earAt),mirrorShapes(S.ear),S.earTip?[P('earTipR',R(S.kinkAt),mirrorShapes(S.earTip))]:[])]:[];
    const skullPart=P('skull',[0,hy-4],S.skull,[front&&S.nose&&S.nose.length?P('nose',[0,hy-4],S.nose):null, S.beard&&S.beard.length?P('beard',[0,hy-4],S.beard):null, S.coif?P('coif',[0,hy-6],S.coif):null, S.crest?P('crest',[0,hy-8],S.crest):null,
        S.hair&&S.hair.length?P('hair',[0,hy-8],S.hair):null, S.hood?P('hood',[0,hy-6],S.hood):null, front&&spec.scar&&S.scar?P('scar',[0,hy-7],S.scar):null,
        nScars&&S.headBox?P('scarsHead',[0,hy-4],scarShapes(nScars,S.headBox,seed,false)):null]);
    const helmet=G.helmet&&S.helmet.length?P('helmet',[0,hy-8],S.helmet):null;
    const hairBack=S.hairBack?P('hairBack',[0,hy-4],S.hairBack):null;
    const headKids=back?[skullPart,hairBack].concat(earParts,[helmet]):[hairBack].concat(earParts,[       // seen from the front the ears lie behind the head (no seam)
      skullPart, helmet,
      P('mouth',S.mouthAt,S.mouth),
      P('jaw',S.jawAt,S.jaw,S.tusk?[P('tuskL',S.tuskAt,S.tusk),P('tuskR',R(S.tuskAt),mirrorShapes(S.tusk))]:[]),
      P('eyeL',ex,S.eye,[P('pupilL',ex,S.pupil)]),
      P('eyeR',R(ex),mirrorShapes(S.eye),[P('pupilR',R(ex),shiftX(S.pupil,-2*ex[0]-2*(S.pupilIn||0)))]),
      P('lidL',ex,S.lid), P('lidR',R(ex),mirrorShapes(S.lid)),
      P('browL',br,S.brow), P('browR',R(br),mirrorShapes(S.brow))
    ]);
    const bb=S.bodyBox, mid=(bb[1]+bb[3])/2;
    const bodyKids=[
      back&&!K.clothed?P('spine',[0,mid],[[`M0 ${(bb[1]-1).toFixed(2)} L0 ${(bb[3]+2).toFixed(2)}`,null,1.1,'dark']]):P('belly',[0,mid],S.belly),
      nScars>1?P('scarsBody',[0,mid],scarShapes(nScars,bb,seed,true)):null,
      G.chest?P('chest',[0,mid-2],S.chest):null,
      G.cloth?P('cloth',[0,S.hip[1]-1],S.cloth):null, G.cloth&&S.clothBack?P('clothBack',[0,S.hip[1]-1],S.clothBack):null,
      P('belt',[0,S.hip[1]-2],S.belt), back?null:P('buckle',[0,S.hip[1]-2],S.buckle),
      G.pauldrons?P('pauldronL',S.pauldronAt,S.pauldron):null, G.pauldrons?P('pauldronR',R(S.pauldronAt),mirrorShapes(S.pauldron)):null,
      S.collar?P('collar',S.neck,S.collar):null, S.cape?P('cape',S.neck,S.cape):null,
      S.braid?P('braid',[0,S.A.topY],S.braid):null,       // (the feral ork's braid down its back)
      P('head',S.neck,[],headKids)
    ];
    // the weapon or tool: held by the right hand (its grip in the fist, the fist drawn over the haft), or, without hands, floating beside it
    const hands=G.hands!==false, wName=G.weapon&&G.weapon!=='none'&&WEAPONS[G.weapon]?G.weapon:null, grip=GRIP[wName]||[24,-16], ha=S.handAt;
    const weapon=wName?P('weapon',hands?grip:[24,-22],WEAPONS[wName]):null;
    const shield=S.shield?P('shield',R(ha),S.shield):null;
    const handKids=hands?[P('handL',R(ha),[],[shield,P('fistL',R(ha),mirrorShapes(S.fist))]),P('handR',ha,[],[weapon,P('fistR',ha,S.fist)])]:[weapon,shield];
    const sack=S.sack&&G.load&&G.load!=='none'?P('sack',S.sackAt,S.sack.concat(S.load[G.load]||[])):null;
    const feet=side=>S.foot.length&&!(back&&S.footClaws)?[P('foot'+side,[S.hip[0]*(side==='L'?1:-1),0],side==='L'?S.foot:mirrorShapes(S.foot))]:[];
    const legKids=side=>S.shin?[P('shin'+side,side==='L'?S.knee:R(S.knee),side==='L'?S.shin:mirrorShapes(S.shin),feet(side))]:feet(side);       // a realistic leg: the shin hangs at the knee, the foot at the shin
    const tail=S.tail?P('tail',S.tailAt,S.tail):null, legsBody=[P('legL',S.hip,S.leg,legKids('L')),P('legR',R(S.hip),mirrorShapes(S.leg),legKids('R')),S.robe?P('robe',[0,S.hip[1]],S.robe):null,P('body',[0,S.hip[1]],S.body,bodyKids)];
    const tree=P('root',[0,0],[],[spec.shadow===false?null:P('shadow',[0,0],S.shadow)].concat(back?legsBody.concat([tail,sack]):[tail,sack].concat(legsBody),handKids));       // from behind: tail and sack in front of the body
    // (root: the front view mirrored, so the main hand (the right, which holds the weapon) is on the left of the picture as on a creature that faces us)
    // the stats as proportions on top of the body plan (strength is in the plan itself: the shoulders, the hands)
    const real=!!S.real, bw=real?1.05-0.1*t.flink:1.1-0.2*t.flink, ls=(real?0.96+0.08*t.flink:0.85+0.45*t.flink)*S.legK, hs=real?0.94+0.12*t.klug:0.85+0.45*t.klug, js=1.15-0.35*t.klug, ts=0.6+0.9*t.wild;
    const hip=-S.hip[1], lift=-(hip*ls-hip), half=Math.abs(ha[0]);
    const base={
      shadow:{ sx:bw }, robe:{ y:lift, sy:ls, sx:bw }, legL:{ x:-(bw-1)*Math.abs(S.hip[0])*0.7, y:lift, sy:ls }, legR:{ x:(bw-1)*Math.abs(S.hip[0])*0.7, y:lift, sy:ls }, body:{ y:lift, sx:bw },
      head:{ y:S.headY, sx:hs/bw, sy:hs }, jaw:{ sx:js, sy:js }, tuskL:{ sy:ts }, tuskR:{ sy:ts },
      root:sideV?(spec.view==='left'?{ sx:-1 }:{}):(back?{}:{ sx:-1 }), sack:{ x:3.6, y:lift-0.6, sx:1.22, sy:1.22, r:spec.seed?-45+90*rng(spec.seed*2654435761+97)():25 },       // nearer the middle, bigger, tilted (user: -45 to +45 degrees, either way)
      earL:S.earGrow==='kink'?{ sx:0.45+0.55*grow+0.15*sag, sy:0.55+0.45*grow+0.1*sag, r:-30*sag }:(S.earGrow?{ sx:0.7+earK, sy:0.8+0.5*earK, r:-68*earK }:{}),
      earR:S.earGrow==='kink'?{ sx:0.45+0.55*grow+0.15*sag, sy:0.55+0.45*grow+0.1*sag, r:30*sag }:(S.earGrow?{ sx:0.7+earK, sy:0.8+0.5*earK, r:68*earK }:{}),       // longer, broader, and hanging lower
      earTipL:{ sx:1+0.35*sag, r:-100*sag }, earTipR:{ sx:1+0.35*sag, r:100*sag },       // the tip folds at the kink
      handL:{ x:-(bw-1)*half-S.handGap, y:lift, sx:1.15, sy:1.15 }, handR:{ x:(bw-1)*half+S.handGap, y:lift, sx:1.15, sy:1.15 },       // a gap between body and hand: they float
      weapon:hands?{ x:ha[0]-grip[0], y:ha[1]-grip[1], r:12, sx:K.weaponK||1, sy:K.weaponK||1 }:{ x:(bw-1)*16-5, y:lift }
    };
    // a realistic figure lets its empty hands hang at the hips; a hand that holds something is held bent at the elbow: up to the waist, a little in front of the body
    if(sideV){ base[spec.view==='left'?'handR':'handL'].x-=1.2*(S.A?S.A.u:1);       // the far hand a little back (facing left the right hand is the far one)
      if(hands&&wName){ base.handR.y-=S.armUp; base.handR.x+=2.4*S.A.u; } if(hands&&G.shield){ base.handL.y-=S.armUp; base.handL.x+=3*S.A.u; } }       // from the side: the far hand a little back; a held thing forward
    else if(S.real&&hands){ if(wName){ base.handR.y-=S.armUp; base.handR.x-=S.armIn; } if(G.shield){ base.handL.y-=S.armUp; base.handL.x+=S.armIn; } }
    // the arms (user, November 2026): an arm only links the hand to the shoulder, without a will of its own; the hand leads
    let arm=null;
    if(G.arms&&hands&&S.shoulderAt){ const sh=S.shoulderAt, d0=Math.hypot(ha[0]-sh[0],ha[1]-sh[1]), L=S.armLen||[0.56*d0*1.1,0.44*d0*1.1];
      arm={ sh, ha, L, side:sideV, w:S.armW, bone:K.bones?(K.boneStyle==='fantasy'?'fantasy':true):false, fill:G.pauldrons?'iron':(K.clothed&&!K.real?'tunic':'skin'), wraps:!!K.wraps&&!G.pauldrons }; }
    if(S.earScale) ['earL','earR'].forEach(k=>{ base[k].sx=(base[k].sx||1)*S.earScale; base[k].sy=(base[k].sy||1)*S.earScale; });       // the imp's ears as big as its head
    return { tree, base, pal, spec, genes, hands, noBlink:!!S.noBlink, real, arm, height:K.height||1, mirror:sideV?spec.view==='left':!back, side:sideV, earHeavy:S.earGrow==='kink'?sag:earK, H:S.H, px:S.px, has:{ helmet:true, chest:true, pauldrons:true, load:!!K.sack, ears:!!K.ears&&K.ears!=='human', horns:false, level:K.ears==='imp' }, lookK:S.lookK, browBase:(t.wild-0.5)*14 };
  }
  // how far a part moves sideways when the ork half turns (turn -1 .. 1): the face more than the skull, so the flat figure seems to turn
  const TURN={ beard:1.2, coif:0.4, nose:2, hair:0.7, hood:0.5, collar:0.2, skull:0.6, earL:0.6, earR:0.6, helmet:0.7, mouth:1.4, jaw:1.4, eyeL:2.2, eyeR:2.2, lidL:2.2, lidR:2.2, browL:2.2, browR:2.2, belly:1.6, chest:1.0, cloth:1.1, buckle:2.2 };
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
    // (the front view is drawn mirrored: the main hand is the right hand, on the left of the picture seen from the front; the turn and the look keep their way on the screen)
    const sm=rig.mirror?-1:1, T=s.turn*sm, LX=s.look[0]*sm;
    const P={}, put=(id,v)=>{ P[id]=Object.assign({ x:0, y:0, r:0, sx:1, sy:1, a:1 },v); };
    const w=s.phase, roar=s.roar>0?Math.min(1,s.roar*3,(1.2-s.roar)*6):0, lift=k=>-2.6*Math.max(0,Math.sin(w+k)), breath=Math.sin(s.t*2.1);
    const turnOf=id=>(TURN[id]||0)*T, walkK=s.walking?1:0;
    put('root',{ x:s.x });
    put('shadow',{ sx:1-0.06*Math.abs(Math.sin(w)) });
    if(rig.real){       // a realistic step: the leg lifts, the knee bends (the shin shortens seen from the front), hardly any swing to the side
      put('legL',{ y:1.3*lift(0), r:1.2*Math.sin(w) }); put('legR',{ y:1.3*lift(Math.PI), r:1.2*Math.sin(w+Math.PI) });
      put('shinL',{ sy:1-0.1*Math.max(0,Math.sin(w))*walkK }); put('shinR',{ sy:1-0.1*Math.max(0,Math.sin(w+Math.PI))*walkK });
    } else { put('legL',{ y:lift(0), r:6*Math.sin(w) }); put('legR',{ y:lift(Math.PI), r:6*Math.sin(w+Math.PI) }); }
    if(rig.side){       // from the side: the legs swing forward and back, the knee bends in the swing, the foot stays level
      const lr=-22*Math.sin(w)*walkK, ll=22*Math.sin(w)*walkK, kr=40*Math.max(0,Math.cos(w))*walkK, kl=40*Math.max(0,-Math.cos(w))*walkK;
      put('legR',{ r:lr }); put('legL',{ r:ll }); put('shinR',{ r:kr }); put('shinL',{ r:kl }); put('footR',{ r:-(lr+kr)*0.8 }); put('footL',{ r:-(ll+kl)*0.8 }); }
    put('body',{ y:-1.1*Math.abs(Math.sin(w))+(roar?Math.sin(s.t*60)*0.4:0), sx:1+0.012*breath, sy:1-0.012*breath+0.02*Math.cos(2*w)*walkK, r:-2.5*T });
    put('head',{ y:0.8*Math.abs(Math.sin(w+0.6)), r:T*3+Math.sin(w)*1.5+(roar?Math.sin(s.t*45)*2.5:0) });
    put('skull',{ x:turnOf('skull'), sx:1-0.07*Math.abs(T) }); put('helmet',{ x:turnOf('helmet') });
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
    put('handL',{ x:T*1.2-0.6*Math.sin(w)*walkK, y:1.6*Math.sin(w)*walkK-1.1*Math.abs(Math.sin(w+0.7))*walkK+Math.sin(s.t*2+1)*0.6-6*roar, r:-8*Math.sin(w)*walkK+12*roar });
    put('handR',{ x:T*1.2+0.6*Math.sin(w)*walkK-2*roar, y:-1.6*Math.sin(w)*walkK-1.1*Math.abs(Math.sin(w+0.7))*walkK+Math.sin(s.t*2)*0.6-9*roar, r:8*Math.sin(w)*walkK-14*roar });
    if(rig.side){ P.handR.x=-3*Math.sin(w)*walkK; P.handL.x=3*Math.sin(w)*walkK; }       // from the side the hands swing forward and back, against the legs
    const sw=s.swing||0;       // a swing (the game: digging, building, a blow): 0 rest, 1 the tool up high, -1 struck down and forward
    if(sw){ P.handR.y-=(sw>0?10:8)*sw; P.handR.r-=12*sw; P.handR.x-=1.5*sw; P.handL.y-=3*sw; }       // up for the wind-up, down for the blow (sw below 0)
    put('weapon',rig.hands?{ r:Math.sin(s.t*1.3)*3-roar*48-sw*(sw>0?40:55) }:{ x:-T, y:Math.sin(s.t*2)*0.8-Math.abs(Math.sin(w))*0.6*walkK, r:Math.sin(s.t*1.3)*4-roar*40 });
    put('cape',{ r:-Math.sin(w)*3*walkK+Math.sin(s.t*1.3)*0.8, sx:1+0.03*Math.abs(Math.sin(w))*walkK }); put('robe',{ r:Math.sin(w)*2.5*walkK, sx:1+0.02*breath });       // the cape and the robe sway
    const closed=s.blink>0&&!rig.noBlink?1:0, k=rig.lookK||1;
    ['L','R'].forEach(sd=>{ put('eye'+sd,{ x:turnOf('eye'+sd), sy:1-0.9*closed+(roar?0.15:0) }); put('pupil'+sd,{ x:LX*k, y:s.look[1]*k*0.6, a:closed?0:1 }); put('lid'+sd,{ x:turnOf('lid'+sd), a:closed }); });
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
    front:['shadow','cape','tail','sack','hairBack','leg','shin','foot','robe','body','spine','belly','scarsBody','chest','belt','buckle','cloth','arm','pauldron','collar','ear','earTip','head','skull','nose','scar','scarsHead','horn','crest','hair','coif','beard','hood','helmet','mouth','jaw','tusk','eye','pupil','lid','brow','weapon','hand','fist','shield'],       // the shield over the hand that holds it from behind
    // from the side (facing right; the near side is the right one): the far arm and leg behind the body, the head, the near leg and arm in front
    side:['shadow','armL','handL','fistL','shield','pauldronL','legL','shinL','footL','clothBack','body','scarsBody','chest','belt','buckle','head','skull','coif','helmet','jaw','eyeL','eyeR','legR','shinR','footR','cloth','armR','pauldronR','weapon','handR','fistR'],
    sideL:['shadow','armR','weapon','handR','fistR','pauldronR','legR','shinR','footR','clothBack','body','scarsBody','chest','belt','buckle','head','skull','coif','helmet','jaw','eyeL','eyeR','legL','shinL','footL','cloth','armL','pauldronL','handL','fistL','shield'],
    back:['shadow','cloth','foot','leg','shin','robe','arm','shield','weapon','hand','fist','ear','earTip','head','skull','scar','scarsHead','horn','crest','hairBack','hair','coif','hood','helmet','collar','body','spine','scarsBody','chest','belt','buckle','pauldron','sack','tail','cape']
  };
  const baseName=id=>id.replace(/[LR]$/,'');
  // every part with its whole transform (an affine matrix [a b c d e f]) and alpha, in drawing order
  const mul=(m,n)=>[m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1], m[0]*n[2]+m[2]*n[3], m[1]*n[2]+m[3]*n[3], m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5]];
  function localM(p,v){ const r=v.r*Math.PI/180, c=Math.cos(r), sn=Math.sin(r), [px,py]=p;
    return mul(mul([1,0,0,1,v.x+px,v.y+py],[c*v.sx,sn*v.sx,-sn*v.sy,c*v.sy,0,0]),[1,0,0,1,-px,-py]); }
  function flat(rig,P){
    const order=LAYERS[rig.side?(rig.spec.view==='left'?'sideL':'side'):(rig.spec.view==='back'?'back':'front')], out=[]; let n=0;
    const walk=(part,M,a,layer)=>{ const v=P&&P[part.id]||{ x:0, y:0, r:0, sx:1, sy:1, a:1 }, m=mul(M,localM(part.pivot,v)), al=a*(v.a===undefined?1:v.a);
      const k0=order.indexOf(part.id), k=k0>=0?k0:order.indexOf(baseName(part.id)), L=k>=0?k:layer; out.push({ part, m, a:al, L, n:n++ }); part.kids.forEach(c=>walk(c,m,al,L)); };
    walk(rig.tree,[1,0,0,1,0,0],1,0);
    if(rig.arm) armParts(rig,out,order).forEach(e=>{ e.n=n++; out.push(e); });
    return out.sort((p,q)=>p.L-q.L||p.n-q.n);
  }
  // ---- the arms: two bones each, the shoulder fixed on the body, the wrist at the floating hand, the elbow solved (two-bone inverse kinematics:
  // the law of cosines; it bends outward, away from the body; a hand out of reach stretches the arm straight). Their shapes are made anew for every pose. ----
  const tp=(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
  function armParts(rig,out,order){
    const A=rig.arm, get=id=>out.find(e=>e.part.id===id), body=get('body'); if(!body) return [];
    const cx=tp(body.m,0,A.sh[1])[0], res=[];
    [['R',1],['L',-1]].forEach(([side,s])=>{
      const hand=get('hand'+side); if(!hand) return;
      const sx=A.side?1:s, S0=tp(body.m,sx*A.sh[0],A.sh[1]), H=tp(hand.m,sx*A.ha[0],A.ha[1]), k=Math.hypot(body.m[0],body.m[1])||1;       // (k: the body's scale, the arm grows with the figure)
      const L1=A.L[0]*k, L2=A.L[1]*k, dx=H[0]-S0[0], dy=H[1]-S0[1], d0=Math.hypot(dx,dy)||1, ux=dx/d0, uy=dy/d0;
      const W=[H[0]-ux*A.w[2]*1.2,H[1]-uy*A.w[2]*1.2], d=Math.min(L1+L2-1e-3,Math.max(Math.abs(L1-L2)+1e-3,Math.hypot(W[0]-S0[0],W[1]-S0[1])));
      const vx=(W[0]-S0[0])/(Math.hypot(W[0]-S0[0],W[1]-S0[1])||1), vy=(W[1]-S0[1])/(Math.hypot(W[0]-S0[0],W[1]-S0[1])||1), a=Math.acos(Math.max(-1,Math.min(1,(L1*L1+d*d-L2*L2)/(2*L1*d))));
      // the elbow points back and a little out (seen from the front the arm looks nearly straight, shortened): of its sideways bend only that part shows
      const OUT=A.side?1:0.4, el=sg=>[S0[0]+L1*(vx*Math.cos(a)-vy*Math.sin(sg*a)*OUT),S0[1]+L1*(vy*Math.cos(a)+vx*Math.sin(sg*a)*OUT)], e1=el(1), e2=el(-1);
      const fw=Math.sign(body.m[0])||1, E=A.side?((e1[0]-S0[0])*fw<(e2[0]-S0[0])*fw?e1:e2):(Math.abs(e1[0]-cx)>Math.abs(e2[0]-cx)?e1:e2);       // outward, away from the body (from the side: back)
      const Wp=[E[0]+(W[0]-E[0])*L2/(Math.hypot(W[0]-E[0],W[1]-E[1])||1),E[1]+(W[1]-E[1])*L2/(Math.hypot(W[0]-E[0],W[1]-E[1])||1)];
      const w=A.w.map(v=>v*k), shapes=[];
      if(A.bone==='fantasy'){ shapes.push(...fBone(boneAlong(S0,E,w[0]*0.6,w[1]*0.42,w[1]*0.62),1),fKnob(E[0],E[1],w[1]*0.62,w[1]*0.55),...fBone(boneAlong(E,Wp,w[1]*0.5,w[1]*0.36,w[2]*0.55),1)); }       // one heavy bone a segment, a knob at the elbow
      else if(A.bone){ shapes.push(...boneShape(boneAlong(S0,E,w[0]*0.55,w[1]*0.32,w[1]*0.6),1));
        const n=[-(Wp[1]-E[1]),Wp[0]-E[0]], nl=Math.hypot(n[0],n[1])||1, o=w[2]*0.45, off=(p,sg)=>[p[0]+n[0]/nl*o*sg,p[1]+n[1]/nl*o*sg];
        shapes.push(...boneShape(boneAlong(off(E,1),off(Wp,1),w[1]*0.32,w[1]*0.2,w[2]*0.35),1),...boneShape(boneAlong(off(E,-1),off(Wp,-1),w[1]*0.36,w[1]*0.22,w[2]*0.3),1)); }
      else { const up=boneAlong(S0,E,w[0],w[0]*0.88,w[1]), fo=boneAlong(E,Wp,w[1],w[1]*0.95,w[2]), joint=ellPts(E[0],E[1],w[1],w[1],12), cap=ellPts(S0[0],S0[1],w[0],w[0],14);
        const lw=0.9*k;
        [cap,up,fo,joint].forEach(q=>shapes.push([ptsPath(q),'line',lw*2,'line']));       // the outline under all of it, then the flesh: one shape without seams
        [cap,up,fo,joint].forEach(q=>shapes.push([ptsPath(q),A.fill,0]));
        shapes.push([ptsPath(boneAlong(S0,E,w[0]*0.45,w[0]*0.4,w[1]*0.4).map(([x,y])=>[x+(S0[0]-cx>0?w[0]*0.45:-w[0]*0.45),y])),'shade',0],[ptsPath(boneAlong(E,Wp,w[1]*0.4,w[1]*0.38,w[2]*0.38).map(([x,y])=>[x+(E[0]-cx>0?w[1]*0.4:-w[1]*0.4),y])),'shade',0]);
        if(A.wraps){ const fx=Wp[0]-E[0], fy=Wp[1]-E[1], fl=Math.hypot(fx,fy)||1, nx=-fy/fl, ny=fx/fl;       // leather strips round the forearm, above the wrist
          const d=[0.6,0.74,0.88].map(t=>{ const r=(w[1]+(w[2]-w[1])*t)*1.05, px=E[0]+fx*t, py=E[1]+fy*t; return `M${f2(px-nx*r-fx/fl*0.3*k)} ${f2(py-ny*r-fy/fl*0.3*k)} L${f2(px+nx*r+fx/fl*0.3*k)} ${f2(py+ny*r+fy/fl*0.3*k)}`; }).join(' ');
          shapes.push([d,null,0.95*k+0.6*k,'line'],[d,null,0.95*k,'leather']); } }
      const Li=order.indexOf('arm'+side), L=Li>=0?Li:order.indexOf('arm');
      res.push({ part:{ id:'arm'+side, pivot:[0,0], shapes, kids:[], dyn:true }, m:[1,0,0,1,0,0], a:hand.a, L });
    });
    return res;
  }
  // the SVG output: one <g> per part, side by side in drawing order (built once per rig); draw() sets their matrices
  function svg(host,rig){
    const NS='http://www.w3.org/2000/svg', els={}; while(host.firstChild) host.removeChild(host.firstChild);
    flat(rig,null).forEach(({ part })=>{ const g=document.createElementNS(NS,'g'); g.dataset.part=part.id;
      part.shapes.forEach(([d,fill,sw,stroke])=>{ const p=document.createElementNS(NS,'path'); p.setAttribute('d',d); p.setAttribute('fill',fill?rig.pal[fill]:'none');
        if(sw){ p.setAttribute('stroke',rig.pal[stroke||'line']); p.setAttribute('stroke-width',sw); p.setAttribute('stroke-linejoin','round'); p.setAttribute('stroke-linecap','round'); } g.appendChild(p); });
      host.appendChild(g); els[part.id]=g; });
    return { draw(P){ flat(rig,P).forEach(({ part, m, a })=>{ const g=els[part.id]; if(!g) return; g.setAttribute('transform',`matrix(${m.map(x=>x.toFixed(4)).join(' ')})`); g.setAttribute('opacity',a);
      if(part.dyn) part.shapes.forEach(([d],i)=>{ const q=g.childNodes[i]; if(q) q.setAttribute('d',d); }); }); } };       // the arms: new shapes every pose
  }
  // the canvas output: the same paths (Path2D) in the same order, scaled k pixels to a unit, the feet at (ox, oy)
  const paths=new Map(); const p2=d=>{ let p=paths.get(d); if(!p){ p=new Path2D(d); paths.set(d,p); } return p; };
  function canvas(g,rig,P,k,ox,oy){
    g.save(); g.lineJoin='round'; g.lineCap='round';
    flat(rig,P).forEach(({ part, m, a })=>{ if(a<=0.01||!part.shapes.length) return; g.setTransform(k*m[0],k*m[1],k*m[2],k*m[3],ox+k*m[4],oy+k*m[5]); g.globalAlpha=Math.min(1,a);
      part.shapes.forEach(([d,fill,sw,stroke])=>{ const p=part.dyn?new Path2D(d):p2(d);       // (the arms' shapes change every pose: not kept)
       if(fill){ g.fillStyle=rig.pal[fill]; g.fill(p); } if(sw){ g.strokeStyle=rig.pal[stroke||'line']; g.lineWidth=sw; g.stroke(p); } }); });
    g.restore();
  }
  const lookOf=kind=>({ ears:!!HUMANOIDS[kindOf(kind)].ears, horns:false });
  // the body plan of a spec without the 2D rig (for the 2.5D test, Rig3D): its measures, colours, gear
  function plan(spec){
    const kind=kindOf(spec&&spec.kind), K=HUMANOIDS[kind], own=spec&&spec.genes; spec=Object.assign({},defaults(kind),spec||{}); spec.kind=kind;
    if(!stylesOf(kind).includes(spec.style)) spec.style=stylesOf(kind)[0];
    const genes=genesOf({ kind, style:spec.style, genes:own }), t=Object.assign({},defaults(kind).traits,spec.traits), G=Object.assign({},defaults(kind).gear,spec.gear,K.wear);       // (wear: what a kind always wears, the dark knight his plate)
    const S=(K.real?realShapes:humanoidShapes)(kind,genes,t,false,G);
    const pal=Object.assign({ shadowC:'rgba(0,0,0,0.35)' },palOf(K,genes)); SKIN_KEYS.forEach(k=>{ pal[k]=hueShift(pal[k],spec.hue); });
    const M=(K.mats||MATERIALS)[G.mat]; if(M){ pal.iron=M[0]; pal.ironDark=M[1]; }
    pal.hand=G.pauldrons?pal.iron:pal.skin; pal.handLine=G.pauldrons?pal.ironDark:pal.dark;
    return { K, G, genes, t, S, A:S.A, pal, spec, H:S.H, weapons:WEAPONS, grip:GRIP };
  }
  return { build, plan, roll, kindInfo:kind=>HUMANOIDS[kindOf(kind)], defaults, lookOf, genesOf, presetsOf, IMP_PRESETS, create, step, pose, svg, canvas, MOODS, KINDS:['human'].concat(Object.keys(HUMANOIDS).filter(k=>k!=='human')), stylesOf, weaponsOf:kind=>HUMANOIDS[kindOf(kind)].weapons };
})();

// ---- 2.5D figures (user, November 2026: a test with the fantasy skeleton) ----
// The skeleton as simple 3D forms on joints in space, drawn flat for any direction and any height of the camera: bones are tubes, joints balls, the ribs
// arcs round an ellipse, the pelvis and the shoulder blades plates, the skull a hull of ellipsoids with its sockets, nose and teeth on its surface, the jaw a
// band. Every form is projected (orthographic: the yaw turns the figure, the pitch looks down on it), filled, outlined, shaded on the side away from the light,
// and drawn from the back to the front by its depth (no table of layers). The arms are solved in space (two bones, the elbow back and out). The shield is a
// plate on the arm with its thickness; the weapon is drawn flat at the hand. Coordinates: X the figure's left (its right hand at -X), Y down (the feet at 0),
// Z forward. Yaw 0: it faces us; 90: we see its right side (it faces right). Pitch: how far the camera looks down.
const Rig3D=(()=>{
  const f2=v=>+(+v).toFixed(2), add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], mulv=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2], cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], len=a=>Math.hypot(a[0],a[1],a[2]), norm=a=>mulv(a,1/(len(a)||1));
  const rotX=(v,a)=>{ const c=Math.cos(a), s=Math.sin(a); return [v[0],v[1]*c-v[2]*s,v[1]*s+v[2]*c]; };       // round the X axis: a leg down (+Y) swings forward (+Z) for a > 0
  const path=pts=>'M'+pts.map(p=>p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' L')+'z';
  function hull(pts){       // the convex hull of 2D points (monotone chain)
    const p=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]); if(p.length<3) return p; const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]), lo=[], up=[];
    for(const q of p){ while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0) lo.pop(); lo.push(q); }
    for(let i=p.length-1;i>=0;i--){ const q=p[i]; while(up.length>=2&&cr(up[up.length-2],up[up.length-1],q)<=0) up.pop(); up.push(q); }
    return lo.slice(0,-1).concat(up.slice(0,-1));
  }
  function shadeOf(pts){       // the side away from the light (the light from the upper left, as on every figure): the right part of a shape
    const cx=pts.reduce((a,q)=>a+q[0],0)/pts.length, mx=Math.max(...pts.map(q=>q[0])), right=pts.filter(q=>q[0]>cx+0.25*(mx-cx)); if(right.length<3) return null;
    return path(right.concat(right.slice().reverse().map(([x,y])=>[cx+(x-cx)*0.62,y])));
  }
  // a frame: the projection for one view, and the list of what to draw
  function frame(yaw,pitch){
    const ct=Math.cos(yaw), st=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch), items=[];
    const P=p=>{ const d=p[2]*ct-p[0]*st; return [p[0]*ct+p[2]*st,p[1]*cp+d*sp,d*cp-p[1]*sp]; };
    const view=[-st*cp,-sp,ct*cp];       // towards the camera, in the figure's space
    const F={ P, view, items, faces:n=>dot(n,view),
      put(pts2,dep,fill,o){ o=o||{}; items.push({ d:path(pts2), dep, fill, sw:o.sw===undefined?0.75:o.sw, stroke:o.stroke||'line', shade:o.shade?shadeOf(pts2):null }); },
      line(pts3,w,fill,dep){ const q=pts3.map(P), d='M'+q.map(p=>p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' L'); items.push({ d, dep:dep===undefined?q.reduce((a,p)=>a+p[2],0)/q.length:dep, fill:null, sw:w+1.5, stroke:'line', band:fill, bw:w }); },
      // a band along points on a surface, each with its normal: only the longest run turned to us is drawn (the near half of a ring)
      seen(pts3,nrm,w,fill,bias){ const n=pts3.length, vis=nrm.map(v=>dot(v,view)>-0.02); let best=[], run=[];
        for(let i=0;i<n;i++){ if(vis[i]) run.push(pts3[i]); else { if(run.length>best.length) best=run; run=[]; } } if(run.length>best.length) best=run;
        if(best.length<2) return; const q=best.map(P); F.line(best,w,fill,q.reduce((a,p)=>a+p[2],0)/q.length+(bias||0)); },
      // a closed loop (its first point repeated at the end): started where it turns away, so its near run is whole
      loop(pts,nrm,w,fill,bias){ const k=nrm.findIndex(v=>dot(v,view)<=-0.02); if(k>0){ return F.seen(pts.slice(k).concat(pts.slice(1,k)),nrm.slice(k).concat(nrm.slice(1,k)),w,fill,bias); } F.seen(pts,nrm,w,fill,bias); },
      // a ring round the body at height y (an ellipse of half axes rx, rz round c), its near half; dy(a) tilts it (a strap across the chest)
      ring(c,rx,rz,y,w,fill,bias,a0,a1,dy){ const pts=[], nrm=[], A0=a0===undefined?-Math.PI:a0, A1=a1===undefined?Math.PI:a1, full=a0===undefined;
        for(let i=0;i<=32;i++){ const a=A0+i/32*(A1-A0); pts.push([c[0]+rx*Math.sin(a),y+(dy?dy(a):0),c[2]+rz*Math.cos(a)]); nrm.push(norm([Math.sin(a)/rx,0,Math.cos(a)/rz])); }
        if(full) return F.loop(pts,nrm,w,fill,bias); F.seen(pts,nrm,w,fill,bias); },
      // a thin line on a surface (a muscle's edge, a mouth): only where it faces us, no band
      thin(pts3,nrm,sw,stroke,bias){ const q=pts3.map(P).filter((p,i)=>dot(nrm[i],view)>0.05); if(q.length<2) return;
        items.push({ d:'M'+q.map(p=>p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' L'), dep:q.reduce((a,p)=>a+p[2],0)/q.length+(bias||0), fill:null, sw, stroke }); },
      // a tube from a to b: its half width at the start, the middle and the end
      tube(a,b,ra,rm,rb,fill,o){ const pa=P(a), pb=P(b), dx=pb[0]-pa[0], dy=pb[1]-pa[1], L=Math.hypot(dx,dy)||1e-3, nx=-dy/L, ny=dx/L;
        const ws=[[0,ra],[0.15,(ra+rm)/2],[0.5,rm],[0.85,(rm+rb)/2],[1,rb]], A=ws.map(([t,w])=>[pa[0]+dx*t+nx*w,pa[1]+dy*t+ny*w]), B=ws.map(([t,w])=>[pa[0]+dx*t-nx*w,pa[1]+dy*t-ny*w]).reverse();
        F.put(A.concat(B),(pa[2]+pb[2])/2+((o&&o.bias)||0),fill,{ shade:true }); },
      ball(c,r,fill,o){ const q=P(c); F.put(Array.from({ length:16 },(_,i)=>{ const a=i/16*Math.PI*2; return [q[0]+Math.cos(a)*r,q[1]+Math.sin(a)*r]; }),q[2]+((o&&o.bias)||0),fill,{ shade:true }); },
      plate(pts3,fill,o){ const q=pts3.map(P); F.put(q,q.reduce((a,p)=>a+p[2],0)/q.length+((o&&o.bias)||0),fill,{ shade:!(o&&o.flat), sw:o&&o.sw }); },
      // a flat patch on a surface (a socket, a tooth): seen only from its front, squashed by the angle
      patch(c,n,rx,ry,fill,o){ if(dot(n,view)<0.08) return; const up=Math.abs(n[1])>0.9?[0,0,1]:[0,1,0], t1=norm(cross(up,n)), t2=norm(cross(n,t1));
        const pts=(o&&o.shape?o.shape:Array.from({ length:14 },(_,i)=>{ const a=i/14*Math.PI*2; return [Math.cos(a),Math.sin(a)]; })).map(([x,y])=>P(add(c,add(mulv(t1,x*rx),mulv(t2,y*ry)))));
        F.put(pts,P(c)[2]+((o&&o.bias)||0.02),fill,{ sw:o&&o.sw!==undefined?o.sw:0.5 }); },
      // the outline of solids: the hull of points on ellipsoids [centre, half axes]
      // an ellipsoid may be cut by a clip [top, bottom] (a helmet's cap, a breastplate's straight neckline)
      solid(ells,fill,o){ const pts=[]; ells.forEach(([c,r,clip])=>{ const tA=clip?Math.acos(Math.max(-1,Math.min(1,(clip[1]-c[1])/r[1]))):0, tB=clip?Math.acos(Math.max(-1,Math.min(1,(clip[0]-c[1])/r[1]))):Math.PI;
          for(let i=0;i<=8;i++) for(let j=0;j<16;j++){ const th=tA+i/8*(tB-tA), ph=j/16*Math.PI*2; pts.push(P([c[0]+r[0]*Math.sin(th)*Math.cos(ph),c[1]+r[1]*Math.cos(th),c[2]+r[2]*Math.sin(th)*Math.sin(ph)])); } });
        const h=hull(pts), cz=P(ells[0][0])[2]; F.put(h,cz+((o&&o.bias)||0),fill,{ shade:true, sw:o&&o.sw }); }
    };
    return F;
  }
  // the 2D tools for the weapon and the fist (drawn flat at the hand)
  function flatShapes(F,shapes,at,grip,rot,k,flip,dep){
    const c=Math.cos(rot), s=Math.sin(rot);
    shapes.forEach(([d,fill,sw,stroke])=>{ const q=[]; let tr=d.replace(/(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g,(m,x,y)=>{ let X=(+x-grip[0])*k, Y=(+y-grip[1])*k; if(flip) X=-X; const xx=X*c-Y*s, yy=X*s+Y*c; return (at[0]+xx).toFixed(2)+' '+(at[1]+yy).toFixed(2); });
      F.items.push({ d:tr, dep, fill, sw:sw*k, stroke:stroke||'line' }); });
  }
  // ---- bodies of flesh in space: a kit of parts on the skeleton's joints (user, November 2026: every creature put together from the kit, none built from scratch) ----
  // The trunk, the limbs and the head's hull come from the body plan's measures; the face's parts, the ears, the hair, the beard, the clothes and the feet are table
  // entries the kind picks (FACE3D by its face, its ears, hair, beard, clothed, feral flags), as in 2D. A new kind is a new entry, not new code.
  // the trunk: two hulls (chest and shoulders down to the waist; the belly and the pelvis), so the waist stays narrow; in a shirt of linen, or bare with the
  // muscles' edges as thin lines where they face us; the feral ork's strap, string of teeth and wrap round the hips
  function fleshTrunk(F,c){
    const { A, K, G, u, Y0, by, wC, wAt, aw, cv }=c, { topY, hipY, bodyH, wSh, wHip }=A, yW=hipY-bodyH*0.3+Y0, wW=wAt(hipY-bodyH*0.3)||wC*0.8, shirt=!!K.clothed;
    if(cv.chest) return;       // under the breastplate (its faulds over the pelvis)
    const ch=[by([0,topY+bodyH*0.27,0.5*u]),[wC*1.0,bodyH*0.23,3.4*u]], up=[ch,[by([0,topY-0.5*u,-0.8*u]),[aw*0.95,1.4*u,2.0*u]],[by([0,topY+1.2*u,-0.4*u]),[wSh*0.76,1.7*u,2.9*u]],[[0,yW,0.2*u],[wW*0.98,1.5*u,2.6*u]]];
    const lo=[[by([0,hipY-3.2*u,0.3*u]),[wHip*0.8,3.4*u,3.0*u]],[[0,yW+0.5*u,0.2*u],[wW*0.95,1.4*u,2.6*u]]];
    if(shirt){       // the shirt: sleeveless, its hem just above the crotch; the trousers below it; the neck and the shoulders bare
      F.solid(lo,'leg',{ bias:-1.3*u, sw:0.9 });
      F.solid([[by([0,topY-0.7*u,-0.8*u]),[aw*0.9,1.2*u,1.9*u]]],'skin',{ bias:-1.25*u, sw:0.9 });
      F.solid(up.slice(0,1).concat(up.slice(2).map(([c0,r])=>[c0,[r[0]*1.03,r[1],r[2]*1.04]]),[[by([0,hipY-1.8*u,0.3*u]),[wHip*0.86,1.6*u,3.2*u]]]),'tunic',{ bias:-1.2*u, sw:0.9 });
      F.ring(by([0,0,-0.4*u]),aw*1.05,2.4*u,topY-0.4*u+Y0,0.6*u,'trim',-1.2*u+0.1,-1.4,1.4,a=>Math.cos(a)*1.5*u);       // the neckline
      const [cc,cr]=ch, on=(x,y)=>{ const q=1-Math.pow(x/cr[0],2)-Math.pow((y-cc[1])/cr[1],2), z=cc[2]+cr[2]*1.04*Math.sqrt(Math.max(0.02,q)); return [[x,y,z],norm([x/cr[0]/cr[0],(y-cc[1])/cr[1]/cr[1],(z-cc[2])/cr[2]/cr[2]])]; };
      if(K.stole&&F.faces([0,0,1])>-0.1) [-1,1].forEach(s=>{ const P=[], N=[]; for(let i=0;i<=8;i++){ const y=topY-0.2*u+i/8*(hipY+4*u-topY), [q,m]=y<topY+bodyH*0.5?on(s*aw*0.75,y):[[s*aw*0.75,y+Y0,3.4*u],[0,0,1]]; P.push(q); N.push(m); } F.seen(P,N,1.0*u,'trim',-1.2*u+0.15); });       // the stole: two bands down the front
      if(K.pendant&&F.faces([0,0,1])>0.1){ const [q]=on(0,topY+bodyH*0.26); F.patch(add(q,[0,0,0.2*u]),[0,0,1],1.0*u,1.2*u,'gold',{ bias:-1.2*u+0.2, sw:0.6, shape:[[0,-1],[1,0],[0,1],[-1,0]] }); }       // the holy sign on the chest
      [[-0.45,-0.6],[0.2,0.3]].forEach(([x0,x1])=>{ const P=[], N=[]; for(let i=0;i<=4;i++){ const t=i/4, [p,m]=on(wC*(x0+(x1-x0)*t*0.3),topY+bodyH*(0.2+0.4*t)); P.push(p); N.push(m); } F.thin(P,N,0.5,'tunicDark',-1.2*u+0.05); });       // two folds
      return;
    }
    F.solid(up,'skin',{ bias:-1.2*u, sw:0.9 }); F.solid(lo,'skin',{ bias:-1.3*u, sw:0.9 });
    const kt=K.kit3d||(K.feral?{ strap:true, teeth:true, wrap:true }:{});       // what the bare trunk shows and wears (the kind's entry)
    // the muscles' edges on the chest's ellipsoid (where they face us), or the ribs of a thin one
    const [cc,cr]=ch, on=(x,y)=>{ const q=1-Math.pow(x/cr[0],2)-Math.pow((y-cc[1])/cr[1],2), z=cc[2]+cr[2]*Math.sqrt(Math.max(0.02,q)); return [[x,y,z],norm([x/cr[0]/cr[0],(y-cc[1])/cr[1]/cr[1],(z-cc[2])/cr[2]/cr[2]])]; };
    const edge=(f,n)=>{ const P=[], N=[]; for(let i=0;i<=n;i++){ const [p,m]=f(i/n); P.push(p); N.push(m); } F.thin(P,N,0.5,'faceLine',-1.2*u+0.05); };
    if(kt.muscles!==false){ [-1,1].forEach(s=>{ edge(t=>on(s*(0.3*u+t*wC*0.62),topY+bodyH*0.27+(1-Math.pow(2*t-1,2))*1.1*u+t*-1.4*u),8);       // the chest's lower edge
      edge(t=>on(s*wC*(0.35-0.05*t),topY+bodyH*0.42+t*bodyH*0.18),4);       // the belly's side
      [0,1].forEach(i=>edge(t=>on(s*t*wC*0.32,topY+bodyH*(0.48+0.08*i)+t*0.3*u),3)); });       // the belly's rows
      edge(t=>on(0,topY+bodyH*(0.18+0.42*t)),6); }       // the line down the middle
    if(kt.ribs) [-1,1].forEach(s=>[0,1,2].forEach(i=>edge(t=>on(s*wC*(0.45+0.5*t),topY+bodyH*(0.3+0.08*i)+t*0.9*u),4)));       // the ribs at the flanks
    {       // the strap across the chest, from the right shoulder to the left hip, round the back, an iron ring on it; the string of teeth; the wrap round the hips
      if(kt.strap&&!G.pauldrons){ const y0=topY+bodyH*0.3+Y0, sl=bodyH*0.26/(wC*1.05); F.ring(by([0,0,0.4*u]),wC*1.06,3.75*u,y0,0.9*u,'leather',-1.2*u+0.1,undefined,undefined,a=>Math.sin(a)*wC*1.06*sl);
        const ra=-0.5, rp=by([wC*1.06*Math.sin(ra),0,0.4*u+3.75*u*Math.cos(ra)]); rp[1]=y0+Math.sin(ra)*wC*1.06*sl; F.patch(add(rp,[0,0,0.15*u]),norm([Math.sin(ra),0,Math.cos(ra)]),0.55*u,0.55*u,'ironDark',{ bias:-1.2*u+0.15 }); }
      const ny=topY-0.4*u+Y0; if(kt.teeth) F.ring([0,0,-0.4*u],aw*1.0,2.3*u,ny,0.3*u,'leather',-1.2*u+0.2,-1.3,1.3,a=>(1-Math.cos(a))*-0.3*u+Math.cos(a)*1.4*u);
      if(kt.teeth&&F.faces([0,0,1])>0.1) [-0.6,-0.3,0,0.3,0.6].forEach(a=>{ const p=[Math.sin(a)*aw*1.05,ny+Math.cos(a)*1.4*u+0.4*u,-0.4*u+Math.cos(a)*2.4*u]; F.patch(p,norm([Math.sin(a),0,Math.cos(a)]),0.3*u,0.55*u,'bone',{ bias:-1.2*u+0.25, sw:0.35, shape:[[-1,-1],[1,-1],[0,1]] }); });
      if(kt.wrap) F.solid([[by([0,hipY-1.6*u,0.3*u]),[wHip*0.9,3.6*u,3.4*u],[hipY-4.6*u+Y0,hipY+2.2*u+Y0]]],'leather',{ bias:0.5*u, sw:0.85 });
    }
  }
  // the robe: from the waist to the ground round both feet (it follows the stride), its hem a ring
  function fleshRobe(F,c){
    const { A, K, u, Y0, wAt, wC, legs }=c, { hipY, bodyH, wHip }=A, yW=hipY-bodyH*0.3+Y0, wW=wAt(hipY-bodyH*0.3)||wC*0.8, R=legs.R.Ak, L=legs.L.Ak, mx=(R[0]+L[0])/2, mz=(R[2]+L[2])/2, dz=Math.abs(R[2]-L[2]);
    F.solid([[[0,yW,0.2*u],[wW*1.0,1.6*u,2.8*u]],[[0,hipY*0.55+Y0,0.3*u],[wHip*1.05,2*u,3.4*u]],[[mx,-1.4*u,mz],[wHip*1.2,1.4*u,3.6*u+dz*0.55]]],'tunic',{ bias:-1.3*u, sw:0.9 });
    F.ring([mx,0,mz],wHip*1.2,3.6*u+dz*0.55,-0.6*u,0.6*u,'trim',-1.3*u+0.1);       // the hem's trim
  }
  // the cape from the shoulders to the calves behind (swinging a little as it walks), its lining red; the high collar behind the neck
  function fleshCape(F,c){
    const { A, K, G, u, Y0, by, aw, legs, walkK, w }=c, { topY, wSh }=A, sway=Math.sin(w*2)*0.8*u*walkK, bz=Math.min(legs.R.Ak[2],legs.L.Ak[2])-3.5*u;
    if(K.cape){ const q=[by([-wSh*0.8,topY+0.3*u,-2.2*u]),by([wSh*0.8,topY+0.3*u,-2.2*u]),[wSh*1.3,-3*u,bz+sway],[0,-2.4*u,bz-1*u+sway],[-wSh*1.3,-3*u,bz+sway]];
      F.plate(q,F.faces([0,0,1])>0?'capeIn':'cape',{ bias:-0.5*u }); }
    if(K.collar&&!G.helmet) [-1,1].forEach(s=>F.plate([by([s*aw*0.4,topY-0.6*u,-1.8*u]),by([s*aw*1.5,topY-0.2*u,-1.2*u]),by([s*aw*1.7,topY-4.6*u,-1.6*u]),by([s*aw*0.5,topY-3.8*u,-2.4*u])],F.faces([0,0,1])>0?'capeIn':'cape',{ bias:-0.2*u }));
  }
  // wings on the back (the succubus', the demon's): from the shoulder blade an arm up and out to the wrist, three long fingers down, the skin between them
  function wings3d(F,c){
    const { A, K, u, Y0, by, t }=c, { topY, wSh }=A, k=K.wings, fl=Math.sin(t*1.6)*0.06;
    [-1,1].forEach(s=>{ const B=by([s*wSh*0.3,topY+2*u,-2.8*u]), W=by([s*wSh*(0.9+1.0*k),topY-(4+5*k)*u,-(4+2*k)*u-fl*20]);
      const T=[by([s*wSh*(1.3+1.4*k),topY+(2+4*k)*u,-(5+2*k)*u]),by([s*wSh*(1.0+1.0*k),topY+(6+6*k)*u,-(4.6+1.6*k)*u]),by([s*wSh*(0.6+0.5*k),topY+(8+6*k)*u,-(3.8+1*k)*u])], L=by([s*wSh*0.3,topY+(7+3*k)*u,-3*u]);
      F.plate([B,W,T[0],T[1],T[2],L],'wing',{ bias:-1.5*u });
      F.tube(B,W,0.7*u,0.55*u,0.45*u,'wingBone',{ bias:-1.4*u }); T.forEach(q=>F.tube(W,q,0.4*u,0.3*u,0.1*u,'wingBone',{ bias:-1.4*u })); });
  }
  // a tail from the base of the spine, down and back, swinging as it walks: a spade at its end, or a brush of fur
  function tail3d(F,c){
    const { A, K, u, Y0, by, w, walkK }=c, { hipY }=A, n=7, sway=Math.sin(w)*walkK, fur=K.tail==='fur', pts=[];
    for(let i=0;i<=n;i++){ const t=i/n; pts.push(by([Math.sin(t*2.2+sway)*3*u*t,hipY-3*u+t*t*(-hipY*0.85),-2.5*u-t*(10+4*t)*u])); }
    for(let i=0;i<n;i++){ const r0=(fur?1.4:0.7)*u*(1-i/n*0.6), r1=(fur?1.4:0.7)*u*(1-(i+1)/n*0.6); F.tube(pts[i],pts[i+1],r0,(r0+r1)/2,r1,fur?'hair':'skin',{ bias:-0.5*u }); }
    if(!fur){ const e=pts[n], d=norm(sub(pts[n],pts[n-1])), sd=norm(cross(d,[0,1,0])); F.plate([add(e,mulv(d,-0.3*u)),add(e,add(mulv(sd,1.4*u),mulv(d,0.8*u))),add(e,mulv(d,2.4*u)),add(e,add(mulv(sd,-1.4*u),mulv(d,0.8*u)))],'skin',{ bias:-0.4*u }); }
  }
  // a crown of gold round the head, its spikes up (the lich's)
  function crown3d(F,c){
    const { X, Yh, Z, h, hc }=c, y=Yh(0.16), rx=X(1.02), rz=(Z(0.5)-hc[2])*1.02;
    F.ring([hc[0],0,hc[2]],rx,rz,y,0.09*h,'gold',0.2);
    for(let i=0;i<7;i++){ const a=-Math.PI+i/7*Math.PI*2+0.2, b=[Math.sin(a)*rx,y,hc[2]+Math.cos(a)*rz]; F.tube(b,add(b,[Math.sin(a)*0.02*h,-0.16*h,Math.cos(a)*0.02*h]),0.04*h,0.03*h,0.005*h,'gold',{ bias:0.15 }); }
  }
  // horns from the brow: thin and curling back (the succubus'), or thick, out and up (the demon's)
  function horns3d(F,c){
    const { K, X, Yh, Z, h, hc }=c, big=K.horns3d==='big';
    [-1,1].forEach(s=>{ const p0=[s*X(0.5),Yh(0.16),Z(0.3)];
      const pts=big?[p0,[s*X(1.1),Yh(-0.05),Z(0.35)],[s*X(1.45),Yh(-0.35),Z(0.3)],[s*X(1.4),Yh(-0.6),Z(0.15)]]:[p0,[s*X(0.62),Yh(-0.12),Z(0.05)],[s*X(0.7),Yh(-0.2),Z(-0.45)],[s*X(0.72),Yh(0.1),Z(-0.8)]];
      const r=big?[0.13,0.1,0.06,0.01]:[0.06,0.05,0.035,0.008]; for(let i=0;i<3;i++) F.tube(pts[i],pts[i+1],r[i]*h,(r[i]+r[i+1])/2*h,r[i+1]*h,'bone',{ bias:0.1 }); });
  }
  // the head: its hull by the kind's head form, then the face's parts from the table (each a small function of the head's frame)
  const HEAD3D={
    human:(X,Yh,Z,h,hc)=>[[hc,[X(1.0),0.44*h,Z(0.56)-hc[2]]],[[0,Yh(0.74),Z(0.2)],[X(0.8),0.22*h,Z(0.44)-hc[2]]]],       // the vault and the face, the jaw narrower
    goblin:(X,Yh,Z,h,hc)=>[[hc,[X(1.0),0.42*h,Z(0.5)-hc[2]]],[[0,Yh(0.62),Z(0.22)],[X(0.92),0.14*h,Z(0.38)-hc[2]]],[[0,Yh(0.84),Z(0.26)],[X(0.5),0.16*h,Z(0.34)-hc[2]]]],       // the goblin's: a broad vault, wide cheeks, a pointed chin
    wolf:(X,Yh,Z,h,hc)=>[[hc,[X(1.0),0.4*h,Z(0.5)-hc[2]]],[[0,Yh(0.66),Z(0.78)],[X(0.48),0.15*h,Z(0.48)-hc[2]]],[[0,Yh(0.8),Z(0.62)],[X(0.42),0.1*h,Z(0.4)-hc[2]]]],       // the werewolf's: a wolf's skull, a long snout
    brute:(X,Yh,Z,h,hc)=>[[[hc[0],hc[1]+0.04*h,hc[2]],[X(1.0),0.36*h,Z(0.5)-hc[2]]],[[0,Yh(0.76),Z(0.26)],[X(1.02),0.24*h,Z(0.5)-hc[2]]]],       // the troll's: a low vault, a massive jaw pushed forward
    fine:(X,Yh,Z,h,hc)=>[[hc,[X(0.96),0.45*h,Z(0.55)-hc[2]]],[[0,Yh(0.76),Z(0.2)],[X(0.7),0.2*h,Z(0.42)-hc[2]]]],       // the elf's and the vampire's: narrow, high cheekbones, a pointed chin
    long:(X,Yh,Z,h,hc)=>[[hc,[X(0.98),0.42*h,Z(0.5)-hc[2]]],[[0,Yh(0.78),Z(0.14)],[X(0.9),0.2*h,Z(0.44)-hc[2]]],[[0,Yh(0.52),Z(0.2)],[X(1.0),0.1*h,Z(0.32)-hc[2]]]]       // the ork's: long, the cheekbones high, the jaw broad
  };
  const FACE3D={ human:{ head:'human', eyes:'human', brow:'thin', nose:'human', mouth:'lips' }, orkFeral:{ head:'long', eyes:'glow', brow:'heavy', nose:'flat', mouth:'wide', tusks:true, paint:true },
    goblin:{ head:'goblin', eyes:'slit', brow:'heavy', nose:'hook', mouth:'grin' },
    brute:{ head:'brute', eyes:'glow', brow:'heavy', nose:'flat', mouth:'wide', tusks:true },
    demon:{ head:'brute', eyes:'glow', brow:'heavy', nose:'flat', mouth:'wide' },
    ghoul:{ head:'long', eyes:'glow', brow:'heavy', nose:'flat', mouth:'grin' },
    zombie:{ head:'human', eyes:'glow', brow:'thin', nose:'human', mouth:'wide' },
    wolf:{ head:'wolf', eyes:'glow', brow:'heavy', nose:'snout', mouth:'snout' },
    fine:{ head:'fine', eyes:'almond', brow:'thin', nose:'human', mouth:'lips' },
    hood:{ head:'human', eyes:'glow', brow:'thin', nose:'human', mouth:'lips' } };
  const PART3D={
    eyes:{ human(F,c){ const { X, Yh, Z, h, on }=c; [-1,1].forEach(s=>{ const e=[s*X(0.36),Yh(0.47),Z(0.5)], n=norm([s*0.3,0,0.95]);
        F.patch(e,n,X(0.2),0.045*h,'sclera',{ bias:on(e,0.05), sw:0.4 }); F.patch(add(e,[0,0,0.05]),n,X(0.08),0.04*h,'pupil',{ bias:on(e,0.055), sw:0 }); }); },
      glow(F,c){ const { X, Yh, Z, h, on }=c; [-1,1].forEach(s=>{ const e=[s*X(0.38),Yh(0.48),Z(0.44)], n=norm([s*0.35,0,0.94]), sl=[[-1,0.2],[1,-0.7],[0.9,0.5],[-0.8,0.8]].map(([x,y])=>[s*x,y]);
        F.patch(e,n,X(0.27),0.065*h,'socket',{ bias:on(e,0.05), sw:0, shape:sl }); F.patch(e,n,X(0.2),0.04*h,'glow',{ bias:on(e,0.055), sw:0, shape:sl }); F.patch(e,n,X(0.12),0.022*h,'eye',{ bias:on(e,0.06), sw:0, shape:sl }); }); },
      // narrow almond eyes, slanted, glowing in their own colour (the elf's, the vampire's)
      almond(F,c){ const { X, Yh, Z, h, on }=c; [-1,1].forEach(s=>{ const e=[s*X(0.36),Yh(0.47),Z(0.5)], n=norm([s*0.32,0,0.95]), sl=[[-1,0.3],[-0.2,-0.6],[1,-0.5],[0.4,0.5]].map(([x,y])=>[s*x,y]);
        F.patch(e,n,X(0.24),0.05*h,'socket',{ bias:on(e,0.05), sw:0, shape:sl }); F.patch(e,n,X(0.18),0.035*h,'glow',{ bias:on(e,0.055), sw:0, shape:sl }); F.patch(e,n,X(0.1),0.026*h,'eye',{ bias:on(e,0.06), sw:0, shape:sl }); }); },
      // big almond eyes, yellow, slanted up and out, the pupil a slit
      slit(F,c){ const { X, Yh, Z, h, on }=c; [-1,1].forEach(s=>{ const e=[s*X(0.4),Yh(0.47),Z(0.45)], n=norm([s*0.4,0,0.92]), sl=[[-1,0.35],[-0.3,-0.55],[1,-0.85],[0.6,0.45]].map(([x,y])=>[s*x,y]);
        F.patch(e,n,X(0.3),0.075*h,'socket',{ bias:on(e,0.05), sw:0, shape:sl }); F.patch(e,n,X(0.24),0.055*h,'eye',{ bias:on(e,0.055), sw:0.35, shape:sl }); F.patch(add(e,[0,-0.004*h,0]),n,X(0.035),0.045*h,'pupil',{ bias:on(e,0.06), sw:0 }); }); } },
    brow:{ thin(F,c){ const { X, Yh, Z, h, tb }=c; [-1,1].forEach(s=>{ const b0=[s*X(0.62),Yh(0.39),Z(0.42)], b1=[s*X(0.14),Yh(0.4),Z(0.54)]; F.tube(b0,b1,0.025*h,0.03*h,0.025*h,'brow',{ bias:tb(b0,b1,0.07) }); }); },
      heavy(F,c){ const { X, Yh, Z, h, tb }=c; [-1,1].forEach(s=>{ const b0=[s*X(0.78),Yh(0.4),Z(0.3)], b1=[s*X(0.08),Yh(0.44),Z(0.5)]; F.tube(b0,b1,0.06*h,0.07*h,0.05*h,'skin',{ bias:tb(b0,b1,0.09) }); }); } },
    nose:{ human(F,c){ const { X, Yh, Z, h, tb, on }=c, a=[0,Yh(0.46),Z(0.57)], b=[0,Yh(0.64),Z(0.66)]; F.tube(a,b,0.035*h,0.05*h,0.065*h,'skin',{ bias:tb(a,b,0.08) }); F.patch([0,Yh(0.66),Z(0.6)],norm([0,0.6,0.8]),X(0.14),0.025*h,'dark',{ bias:on([0,Yh(0.66),Z(0.6)],0.085), sw:0 }); },
      flat(F,c){ const { X, Yh, Z, h, on }=c; F.patch([0,Yh(0.62),Z(0.52)],norm([0,0.25,1]),X(0.2),0.05*h,'dark',{ bias:on([0,Yh(0.62),Z(0.52)],0.05), sw:0.4 }); },
      // the wolf's: a black nose at the snout's tip
      snout(F,c){ const { X, Yh, Z, h, on }=c, q=[0,Yh(0.62),Z(1.24)]; F.patch(q,norm([0,-0.1,1]),X(0.2),0.05*h,'void',{ bias:on(q,0.06), sw:0.4 }); },
      // a long hooked nose: out from the brow, down at the tip
      hook(F,c){ const { X, Yh, Z, h, tb }=c, a=[0,Yh(0.46),Z(0.5)], b=[0,Yh(0.62),Z(0.82)], d=[0,Yh(0.72),Z(0.74)]; F.tube(a,b,0.04*h,0.06*h,0.06*h,'skin',{ bias:tb(a,b,0.09) }); F.tube(b,d,0.06*h,0.045*h,0.02*h,'skin',{ bias:tb(a,b,0.095) }); } },
    mouth:{ lips(F,c){ const { X, Yh, Z, h, on, jr, roar }=c, A=[-0.4,-0.2,0,0.2,0.4], P=A.map(a=>jr([Math.sin(a)*X(0.6),Yh(0.79),Math.cos(a)*Z(0.52)])); F.thin(P,A.map(a=>norm([Math.sin(a),0,Math.cos(a)])),roar?0.07*h*roar+0.5:0.6,roar?'mouth':'lip',on(P[2],0.06)); },
      wide(F,c){ const { X, Yh, Z, h, on, jr, roar }=c, A=[-0.5,-0.25,0,0.25,0.5], P=A.map(a=>jr([Math.sin(a)*X(0.62),Yh(0.77),Math.cos(a)*Z(0.5)])); F.thin(P,A.map(a=>norm([Math.sin(a),0,Math.cos(a)])),roar?0.09*h*roar+0.5:0.55,roar?'mouth':'faceLine',on(P[2],0.06)); },
      // the wolf's: the lips along the snout, the fangs at its front
      snout(F,c){ const { X, Yh, Z, h, on, jr, roar }=c; [-1,1].forEach(s=>{ const P=[0.3,0.55,0.8,1.0,1.16].map(z=>jr([s*X(0.42-0.2*(z-0.3)),Yh(0.79),Z(z)])); F.thin(P,P.map(()=>norm([s*0.8,0,0.6])),0.05*h*(0.5+roar),'mouth',on(P[2],0.06));
        const f=jr([s*X(0.2),Yh(0.76),Z(1.06)]); F.tube(f,add(f,[0,0.07*h,0.01*h]),0.025*h,0.018*h,0.004*h,'bone',{ bias:on(f,0.07) }); }); },
      // a grin from cheek to cheek, curved up at the corners, full of small pointed teeth
      grin(F,c){ const { X, Yh, Z, h, on, jr, roar }=c, A=[-0.75,-0.5,-0.25,0,0.25,0.5,0.75], y=a=>Yh(0.76)-Math.pow(a/0.75,2)*0.05*h, P=A.map(a=>jr([Math.sin(a)*X(0.72),y(a),Math.cos(a)*Z(0.44)]));
        if(F.faces([0,0,1])<-0.2) return; F.thin(P,A.map(a=>norm([Math.sin(a),0,Math.cos(a)])),0.05*h*(0.6+roar),'mouth',on(P[3],0.06));
        [-0.55,-0.33,-0.11,0.11,0.33,0.55].forEach(a=>{ const q=jr([Math.sin(a)*X(0.7),y(a)+0.012*h,Math.cos(a)*Z(0.45)]); F.patch(q,norm([Math.sin(a),0,Math.cos(a)]),X(0.05),0.028*h,'bone',{ bias:on(q,0.065), sw:0.3, shape:[[-1,-1],[1,-1],[0,1]] }); }); } },
    // the fangs: two long eye teeth down over the lower lip
    fangs(F,c){ const { X, Yh, Z, h, jr, on }=c; if(F.faces([0,0,1])<-0.1) return; [-1,1].forEach(s=>{ const a=[s*X(0.2),Yh(0.775),Z(0.51)], b=jr([s*X(0.21),Yh(0.86),Z(0.5)]); F.tube(a,b,0.022*h,0.016*h,0.004*h,'bone',{ bias:on(a,0.07)-(F.P(b)[2]-F.P(a)[2])/2 }); }); },
    // the hood over the head and onto the shoulders, the face in its shadow, only the eyes glowing out of it
    hood(F,c){ const { A, u, Y0, by, X, Yh, Z, h, hc, sk }=c;
      const ctr=[hc[0],hc[1]-0.04*h,hc[2]-0.03*h]; F.solid([[ctr,[X(1.3),0.56*h,Z(0.64)-hc[2]]],[by([0,A.topY+0.4*u,-0.6*u]),[A.wSh*0.58,1.8*u,3.2*u],[A.topY-4*u,A.topY+2.4*u]]],'tunic',{ bias:sk+0.03-F.P(ctr)[2], sw:0.9 });       // (over the head from every side)
      const f=[0,Yh(0.56),Z(0.6)]; F.patch(f,[0,0.08,1],X(0.82),0.32*h,'void',{ bias:sk+0.04-F.P(f)[2], sw:0.6, shape:Array.from({ length:14 },(_,i)=>{ const a=i/14*Math.PI*2; return [Math.cos(a),Math.sin(a)*(Math.sin(a)<0?1.2:0.9)]; }) });
      [-1,1].forEach(s=>{ const e=[s*X(0.34),Yh(0.5),Z(0.58)]; F.patch(e,[0,0,1],X(0.2),0.045*h,'glow',{ bias:sk+0.05-F.P(e)[2], sw:0 }); F.patch(e,[0,0,1],X(0.1),0.026*h,'eye',{ bias:sk+0.055-F.P(e)[2], sw:0 }); }); },
    // the tusks on the lower jaw, up past the mouth's corners (longer with savagery)
    tusks(F,c){ const { X, Yh, Z, h, jr, wild }=c; [-1,1].forEach(s=>{ const b0=jr([s*X(0.36),Yh(0.83),Z(0.5)]), b1=jr([s*X(0.5),Yh(0.83)-(0.17+0.14*wild)*h,Z(0.55)]); F.tube(b0,b1,0.055*h,0.04*h,0.01*h,'bone',{ bias:0.1 }); }); },
    // the soot across the eyes and two stripes down the chin, or the ritual scars (by the gene)
    paint(F,c){ const { X, Yh, Z, h, on, gn }=c;
      if((gn.bemalung===undefined?0.5:gn.bemalung)>=0.5){ F.patch([0,Yh(0.48),Z(0.47)],[0,0,1],X(0.92),0.075*h,'paint',{ bias:on([0,Yh(0.48),Z(0.47)],0.045), sw:0, shape:[[-1,-0.6],[1,-0.6],[1,1],[-1,1]] });
        [-1,1].forEach(s=>F.patch([s*X(0.22),Yh(0.88),Z(0.5)],[0,0.3,1],X(0.06),0.08*h,'paint',{ bias:on([0,Yh(0.88),Z(0.5)],0.07), sw:0 })); }
      else { const P=[[X(0.25),Yh(0.36),Z(0.47)],[X(0.45),Yh(0.55),Z(0.43)],[X(0.55),Yh(0.68),Z(0.4)]]; F.thin(P,P.map(()=>norm([0.3,0,0.95])),0.6,'scar',on(P[1],0.08)); } },
    ears:{ // the wolf's: pointed, upright on the top of the head
      wolf(F,c){ const { X, Yh, Z, h }=c; [-1,1].forEach(s=>{ F.plate([[s*X(0.35),Yh(0.12),Z(0.0)],[s*X(0.85),Yh(-0.38),Z(-0.15)],[s*X(0.95),Yh(0.22),Z(-0.2)]],'skin',{ bias:0 });
        F.plate([[s*X(0.48),Yh(0.1),Z(0.02)],[s*X(0.82),Yh(-0.26),Z(-0.12)],[s*X(0.86),Yh(0.16),Z(-0.15)]],'dark',{ bias:0.01, sw:0 }); }); },
      // the elf's: long, narrow, up and back
      elf(F,c){ const { X, Yh, Z, h }=c; [-1,1].forEach(s=>F.plate([[s*X(0.9),Yh(0.36),Z(0.0)],[s*X(1.25),Yh(0.22),Z(-0.2)],[s*X(1.65),Yh(-0.08),Z(-0.45)],[s*X(1.2),Yh(0.4),Z(-0.25)],[s*X(0.92),Yh(0.6),Z(-0.08)]],'skin',{ bias:0 })); },
      // the goblin's: big, out to the side and a little up, the inside dark
      goblin(F,c){ const { X, Yh, Z, h }=c; [-1,1].forEach(s=>{ F.plate([[s*X(0.9),Yh(0.36),Z(0.0)],[s*X(1.6),Yh(0.26),Z(-0.12)],[s*X(2.35),Yh(0.18),Z(-0.3)],[s*X(1.6),Yh(0.52),Z(-0.2)],[s*X(0.92),Yh(0.62),Z(-0.1)]],'skin',{ bias:0 });
        F.plate([[s*X(1.0),Yh(0.42),Z(0.0)],[s*X(1.6),Yh(0.33),Z(-0.12)],[s*X(2.05),Yh(0.26),Z(-0.24)],[s*X(1.55),Yh(0.47),Z(-0.17)]],'dark',{ bias:0.01, sw:0 }); }); },
      human(F,c){ const { X, Yh, Z, h }=c; [-1,1].forEach(s=>F.plate([[s*X(0.95),Yh(0.4),Z(0.02)],[s*X(1.12),Yh(0.38),Z(-0.12)],[s*X(1.1),Yh(0.62),Z(-0.14)],[s*X(0.95),Yh(0.64),Z(-0.04)]],'skin',{ bias:0 })); },
      feral(F,c){ const { X, Yh, Z, h }=c; [-1,1].forEach(s=>{ F.plate([[s*X(0.88),Yh(0.33),Z(-0.02)],[s*X(1.3),Yh(0.22),Z(-0.3)],[s*X(1.8),Yh(0.06),Z(-0.55)],[s*X(1.35),Yh(0.4),Z(-0.38)],[s*X(0.9),Yh(0.62),Z(-0.15)]],'skin',{ bias:0 });
        if(s>0) F.ball([X(1.25),Yh(0.47),Z(-0.36)],0.035*h,'ironDark',{ bias:0.05 }); }); } },       // (a ring in the left one)
    hair:{ // long hair: the cap, a fall down the back to the shoulder blades, a lock at each side
      long(F,c){ const { A, G, u, Y0, X, Yh, Z, h, hc, sk }=c; if(!G.helmet) PART3D.hair.short(F,c);
        F.plate([[-X(1.0),Yh(0.4),Z(-0.35)],[X(1.0),Yh(0.4),Z(-0.35)],[A.wSh*0.5,A.topY+6*u+Y0,-3.2*u],[0,A.topY+6.6*u+Y0,-3.4*u],[-A.wSh*0.5,A.topY+6*u+Y0,-3.2*u]],'hair',{ bias:-0.3 });
        [-1,1].forEach(s=>F.tube([s*X(0.92),Yh(0.32),Z(0.12)],[s*X(1.15),A.topY+1.5*u+Y0,0.6*u],0.07*h,0.08*h,0.05*h,'hair',{ bias:-0.05 })); },
      // slicked back: a close cap with a widow's peak
      slick(F,c){ const { G, X, Yh, Z, h, hc, on }=c; if(G.helmet) return; const ctr=[hc[0],hc[1]-0.02*h,hc[2]-0.04*h]; F.solid([[ctr,[X(1.03),0.45*h,Z(0.57)-hc[2]],[Yh(-0.1),Yh(0.38)]]],'hair',{ bias:on(ctr,0.03), sw:0.8 });
        const p=[0,Yh(0.3),Z(0.54)]; F.patch(p,norm([0,-0.3,1]),X(0.25),0.07*h,'hair',{ bias:on(p,0.06), sw:0, shape:[[-1,-1],[1,-1],[0,1]] }); },
      // a mane of coarse hair along the top of the head down the neck (the troll's)
      mane(F,c){ const { X, Yh, Z, h, hc }=c; F.ring([0,0,hc[2]],0.001,Z(0.5)-hc[2],0,0.2*h,'hair',0.04,-1.1,2.6,a=>Yh(0.42)-Math.cos(a)*0.4*h); },
      // short hair: a cap over the vault down to the brow in front, the nape behind (a patch only seen from behind)
      short(F,c){ const { G, X, Yh, Z, h, hc, sk }=c; if(G.helmet) return;
        const ctr=[hc[0],hc[1]-0.02*h,hc[2]-0.03*h]; F.solid([[ctr,[X(1.06),0.46*h,Z(0.6)-hc[2]],[Yh(-0.1),Yh(0.3)]]],'hair',{ bias:sk+0.03-F.P(ctr)[2], sw:0.8 });       // (sorted just over the head, under the face's parts)
        F.patch([0,Yh(0.5),Z(-0.52)],[0,0,-1],X(0.9),0.22*h,'hair',{ bias:sk+0.03-F.P([0,Yh(0.5),Z(-0.52)])[2], sw:0.6 }); },
      // shaved (stubble), a topknot with its tail down the back, or a crest and a braid over the left shoulder; under a helmet only the tail or the braid
      feral(F,c){ const { A, G, u, Y0, X, Yh, Z, h, hc, gn }=c, topY=A.topY, k=gn.bart===undefined?0.5:gn.bart, style=k<0.34?'shaved':(k<0.67?'knot':'braid');
        if(!G.helmet){ const ctr=[hc[0],hc[1],hc[2]-0.01*h]; F.solid([[ctr,[X(1.0),0.43*h,Z(0.51)-hc[2]],[Yh(-0.1),Yh(0.32)]]],'stubble',{ bias:c.sk+0.02-F.P(ctr)[2], sw:0 }); }
        if(style==='knot'){ if(!G.helmet){ F.ball([0,Yh(-0.04),Z(-0.12)],0.1*h,'hair',{ bias:0.04 }); F.ball([0,Yh(-0.15),Z(-0.1)],0.06*h,'hair',{ bias:0.05 }); }
          F.tube([0,Yh(0.05),Z(-0.45)],[0,Yh(0.5),Z(-0.72)],0.09*h,0.08*h,0.07*h,'hair',{ bias:-0.05 }); F.tube([0,Yh(0.5),Z(-0.72)],[0,Yh(1.15),Z(-0.75)],0.07*h,0.06*h,0.03*h,'hair',{ bias:-0.05 }); }
        if(style==='braid'){ if(!G.helmet) F.ring([0,0,hc[2]],0.001,Z(0.52)-hc[2],0,0.12*h,'hair',0.04,-1.4,1.4,a=>Yh(0.45)-Math.cos(a)*0.47*h);       // the crest along the top
          const b=[[X(0.7),Yh(0.55),Z(-0.5)],[X(1.0),Yh(1.0),Z(-0.35)],[A.wSh*0.55,topY+0.5*u+Y0,0.2*u],[A.wSh*0.6,topY+3*u+Y0,2.6*u],[A.wSh*0.58,topY+5.5*u+Y0,3.2*u]];
          for(let i=0;i<b.length-1;i++) for(let j=0;j<2;j++){ const t=j/2, p=add(b[i],mulv(sub(b[i+1],b[i]),t)); F.ball(p,(0.75-0.05*i)*u,'hair',{ bias:0.05 }); }
          F.tube(b[b.length-1],add(b[b.length-1],[0,1.6*u,0.2*u]),0.4*u,0.3*u,0.15*u,'hair'); } } },
    // the beard on the jaw and the chin, fuller with the gene; over the face, under the nose and the mouth (from behind it is not drawn)
    beard(F,c){ const { X, Yh, Z, h, gn, jr, sk }=c, k=gn.bart===undefined?0.5:gn.bart; if(k<0.2||F.faces([0,0,1])<-0.35) return;
      const bc=jr([0,Yh(0.9)+0.03*h*k,Z(0.32)]); F.solid([[bc,[X(0.8),(0.07+0.1*k)*h,Z(0.32)-c.hc[2]],[Yh(0.74),Yh(1.3)]]],'hair',{ bias:sk+0.055-F.P(bc)[2], sw:0.75 }); }
  };
  function fleshHead(F,c){
    const { A, K, G, u, h, Y0, by, X, Yh, Z, hc, cv }=c, { topY, aw }=A, fc=FACE3D[K.face]||FACE3D.human, nk=K.neckW||1;
    F.tube(by([0,topY-0.6*u,-0.7*u]),[0,Yh(0.88),Z(-0.15)],aw*0.8*nk,aw*0.78*nk,aw*0.75*nk,'skin',{ bias:-0.3 });       // the neck
    F.solid(HEAD3D[fc.head](X,Yh,Z,h,hc),'skin',{ sw:0.9 });
    const sk=F.items[F.items.length-1].dep, jd=c.roar*0.3;
    const p=Object.assign({},c,{ sk, on:(q,b)=>sk+b-F.P(q)[2], tb:(a,b,v)=>sk+v-(F.P(a)[2]+F.P(b)[2])/2, jr:v=>{ const o=[0,Yh(0.62),Z(-0.05)]; return add(o,rotX(sub(v,o),-jd)); } });       // (on, tb: the bias that sorts a patch or a tube just over the head)
    if(K.hood&&!G.helmet){ PART3D.hood(F,p); return sk; }       // under the hood only the eyes
    ['eyes','brow','nose','mouth'].forEach(k=>{ const f=fc[k]&&PART3D[k][fc[k]]; if(f) f(F,p); });
    if(K.fangs) PART3D.fangs(F,p);
    if(K.wounds&&F.faces([0,0,1])>0){ const q=[X(0.45),Yh(0.66),Z(0.45)]; F.patch(q,norm([0.5,0,0.85]),X(0.2),0.06*h,'wound',{ bias:p.on(q,0.06), sw:0.4 }); }       // the zombie's torn cheek
    if(K.ruff){ const q=by([0,topY-0.2*u,-0.6*u]); F.solid([[q,[A.wSh*0.62,2.6*u,3.6*u]],[[0,Yh(0.95),Z(-0.1)],[X(1.1),0.16*h,Z(0.4)-hc[2]]]],'hair',{ bias:-0.6, sw:0.85 }); }       // the werewolf's ruff of fur round the neck
    if(fc.paint) PART3D.paint(F,p); if(fc.tusks) PART3D.tusks(F,p);
    if(K.beard) PART3D.beard(F,p);
    if(K.ears&&PART3D.ears[K.ears]&&!cv.coif) PART3D.ears[K.ears](F,p);       // under the mail hood the ears are hidden
    if(K.hair&&PART3D.hair[K.hair]) PART3D.hair[K.hair](F,p);
    return sk;
  }
  // the legs: bare or in trousers (wider), the knee's ball behind the tubes; the feet bare, in boots, wrapped in leather or with claws
  function fleshLeg(F,c,lg){
    const { K, L, u, gn, cv }=c, { H, Kn, Ak, fl, s }=lg, lw=L.lw, tr=!!K.clothed, f=tr?'leg':'skin', k=tr?1.06:1;
    if(cv.greaves) return;       // under the greaves
    const ft=gn.fuss===undefined?0.5:gn.fuss, FT=K.feet3d||(K.feral?['claws','wrapped']:['bare','boots']), foot=FT[Math.min(FT.length-1,Math.floor(ft*FT.length))];       // the feet by the gene, from the kind's list
    if(K.lower!=='robe'){ F.tube(H,Kn,lw*0.6*k,lw*0.5*k,lw*0.38*k,f); F.ball(Kn,lw*0.37*k,f,{ bias:-1 });
      F.tube(Kn,Ak,lw*0.38*k,(tr?0.38:0.43)*lw*k,lw*(tr?0.34:0.24),f); }       // the shin, the calf (in trousers straight, a little wider at the hem; under a robe only the feet show)
    if(foot==='wrapped') [0.5,0.64,0.78,0.9].forEach(t=>{ const p=add(Kn,mulv(sub(Ak,Kn),t)), r=lw*(0.43-0.2*t)*1.08; F.ring([p[0],0,p[2]],r,r,p[1],0.45*u,'leather',0.05); });
    const fill=foot==='wrapped'?'leather':(foot==='boots'?'foot':'skin');
    F.solid([[fl([0,(foot==='boots'?-0.4:0.4)*u,0.2*u]),[lw*(foot==='boots'?0.3:0.26),(foot==='boots'?2.2:1.3)*u,1.3*u]],[fl([s*0.3*u,-L.ankY-0.65*u,2.6*u]),[lw*0.3,0.7*u,2.1*u]],[fl([0,-L.ankY-0.6*u,-0.6*u]),[lw*0.24,0.6*u,0.9*u]]],fill,{ sw:0.85 });
    if(foot==='claws') [-1,0,1].forEach(k=>{ const b=fl([s*0.3*u+k*0.55*u,-L.ankY-0.4*u,4.4*u]); F.tube(b,add(b,[0,0.35*u,0.9*u]),0.25*u,0.18*u,0.04*u,'bone',{ bias:0.1 }); });
  }
  // ---- the armour in space, on the same body plan (what a man would wear: the skeleton wears it as the 2D figure does) ----
  // the helmet a cap of the head (its rim, its ridge, the nose guard, horns or a crest), the mail hood a hull round head and neck with the face open,
  // the breastplate a shell round the trunk (cut straight at the neck, a point at the bottom, the lames), the shoulder plates domes with a spike,
  // the belt a band round the waist, the tabard two panels, the greaves the thigh, the knee with its spike, the shin and the iron shoe
  function armour(F,c){
    const { A, K, G, u, h, Y0, by, sk, X, Yh, Z, hc, wC, zS, zF, legs }=c, { topY, hipY, bodyH, wSh, wHip, aw }=A, L=A.legs;
    if(G.helmet){
      const style=G.helmStyle||K.helm, visor=style==='visor', rimY=visor?Yh(0.96):Yh(0.36), cr=[X(1.0)*1.12,0.43*h*1.1,(Z(0.48)-hc[2])*1.12], cc=add(hc,[0,-0.02*h,-0.03*h]);
      F.solid([[cc,cr,[cc[1]-cr[1]-1,rimY]]].concat(visor?[[[0,Yh(0.74),Z(0.2)],[X(0.86),0.24*h,Z(0.47)-hc[2]],[Yh(0.5),rimY]]]:[]),'iron',{ bias:sk+0.12-F.P(cc)[2], sw:0.9 });       // (sorted over the head: its centre lies a little behind the head's)       // (the closed helm: down over the face to the chin)
      const rr=t=>Math.sqrt(Math.max(0,1-Math.pow((t-cc[1])/cr[1],2)));       // the cap's width at a height
      if(!visor) F.ring(cc,cr[0]*rr(rimY)*1.04,cr[2]*rr(rimY)*1.04,rimY-0.5*u,1.3*u,'ironDark',0.14);       // the rim
      else if(F.faces([0,0,1])>0.05){ const fz=y=>cc[2]+cr[2]*rr(y)*0.99, e=[0,Yh(0.47),fz(Yh(0.47))], b=v=>sk+v-F.P(e)[2];       // the visor's slit, the eyes glowing in it, the breaths' holes
        F.patch(e,[0,0,1],cr[0]*0.72,0.032*h,'void',{ bias:b(0.13), sw:0, shape:[[-1,-1],[1,-1],[1,1],[-1,1]] });
        [-1,1].forEach(s=>{ const q=[s*X(0.36),Yh(0.47),fz(Yh(0.47))]; F.patch(q,[0,0,1],X(0.11),0.022*h,'glow',{ bias:b(0.135), sw:0 }); });
        [-0.3,-0.1,0.1].forEach(x=>{ const q=[X(0.35)+x*X(1),Yh(0.68),fz(Yh(0.6))+0.04*h]; F.patch(q,[0,0,1],0.012*h,0.012*h,'void',{ bias:b(0.13), sw:0 }); }); }
      const ridge=[], rn=[]; for(let i=1;i<12;i++){ const a=-Math.PI/2+i/12*Math.PI, y=cc[1]-cr[1]*Math.sin(a+Math.PI/2)*1.0; const zz=Math.cos(a+Math.PI/2); ridge.push([0,cc[1]-cr[1]*1.01*Math.cos(a)*1,cc[2]+cr[2]*1.01*Math.sin(a)]); rn.push(norm([0,-Math.cos(a)/cr[1],Math.sin(a)/cr[2]])); }
      F.seen(ridge.filter(p=>p[1]<rimY-u),rn.filter((n,i)=>ridge[i][1]<rimY-u),0.6*u,'ironDark',0.15);       // the ridge over the top
      if(!visor&&F.faces([0,0,1])>0.05) F.tube([0,rimY-0.4*u,Z(0.5)*1.06],[0,Yh(0.62),Z(0.52)*1.04],0.55*u,0.5*u,0.4*u,'ironDark',{ bias:sk-F.P([0,rimY,Z(0.5)])[2]+0.16 });       // the nose guard
      if(style==='horns') [-1,1].forEach(s=>{ const b0=[s*cr[0]*0.92,Yh(0.2),cc[2]+0.05*h], b1=[s*cr[0]*1.55,Yh(0.08),cc[2]+0.12*h], b2=[s*cr[0]*1.85,Yh(-0.38),cc[2]+0.22*h];
        F.tube(b0,b1,1.0*u,0.85*u,0.7*u,'bone'); F.tube(b1,b2,0.7*u,0.45*u,0.08*u,'bone'); });
      if(style==='crest'){ const q=[[0,cc[1]-cr[1]*0.85,cc[2]+cr[2]*0.5],[0,cc[1]-cr[1]*1.55,cc[2]+cr[2]*0.2],[0,cc[1]-cr[1]*1.45,cc[2]-cr[2]*0.9],[0,cc[1]-cr[1]*0.6,cc[2]-cr[2]*0.95]];
        F.plate(q,'cloth',{ bias:0.1 }); F.plate(q.map(p=>[0.5*u,p[1],p[2]]),'cloth',{ bias:0.1 }); }
      if(K.coif&&!visor){       // the mail hood: behind the skull's face, round the head and down onto the shoulders; the face open in front
        F.solid([[hc,[X(1.0)*1.1,0.47*h,(Z(0.48)-hc[2])*1.1],[rimY-u,hc[1]+h]],[by([0,topY-0.6*u,-0.6*u]),[aw*1.0,1.6*u,Z(0.42)-hc[2]],[topY-3*u,topY+1*u]],[by([0,topY+0.7*u,-0.5*u]),[wSh*0.5,1.3*u,3.4*u],[topY-1*u,topY+1.8*u]]],'mail',{ bias:0.03, sw:0.9 });
        const fo=K.coifFace||[0.6,0.27,0.78]; F.patch([0,Yh(fo[0]),Z(0.5)],[0,0.05,1],X(fo[2]),fo[1]*h,'skin',{ bias:sk+0.04-F.P([0,Yh(fo[0]),Z(0.5)])[2], sw:0.6 });       // the face in the hood's opening (the ork's longer face: a bigger opening)
      }
    }
    // the trunk's shell, front and back as one, with the straight neckline; its point in front
    const yc=hipY-bodyH*0.3, zc=u*0.9;
    if(G.chest){
      const up=[by([0,topY+bodyH*0.3,zc]),[wC*1.1,bodyH*0.34,4.3*u],[topY+0.3*u,yc]], sh=[by([0,topY+1.4*u,-0.2*u]),[wSh*0.72,1.6*u,3.4*u],[topY+0.3*u,topY+3*u]], lo=[by([0,yc-1.5*u,zc*0.7]),[wC*0.95,2.8*u,3.7*u],[yc-4*u,yc+0.8*u]];
      F.solid([up,sh,lo],'iron',{ bias:-2.2*u, sw:1 });
      const fr=y=>by([0,y,zF(Math.min(y,topY+bodyH*0.32))+0.6*u]);
      F.solid([[add(fr(yc),[0,0.4*u,-0.6*u]),[1.6*u,2.2*u,1.0*u]]],'iron',{ bias:-2.2*u+0.05 });       // the point at the bottom
      const rd=[], rn=[]; for(let i=0;i<=8;i++){ const y=topY+0.8*u+i/8*(yc+2.2*u-topY-0.8*u); rd.push(add(fr(Math.min(y,yc)),[0,y>yc?y-yc:0,0])); rn.push([0,0,1]); }
      F.seen(rd,rn,0.45*u,'ironDark',0.1);       // the ridge down the front
      [yc-2.4*u,yc-0.6*u].forEach((y,i)=>F.ring(by([0,0,zc*0.7]),wC*(0.97-0.02*i),3.9*u,y+Y0,0.5*u,'ironDark',-2.2*u+0.6,-1.35,1.35));       // the lames
      F.ring(by([0,0,-0.2*u]),wSh*0.5,3.1*u,topY+0.4*u+Y0,0.7*u,'ironDark',-2.2*u+0.6,-1.2,1.2);       // the neckline's rolled edge
      // the faulds over the pelvis: a short skirt of lames from the belt to the hips
      F.solid([[by([0,hipY-4.2*u,0.3*u]),[wHip*0.86,4*u,3.7*u],[yc,hipY-1.6*u]]],'iron',{ bias:-2.2*u-0.1, sw:0.9 });
      F.ring(by([0,0,0.3*u]),wHip*0.8,3.5*u,hipY-2.6*u+Y0,0.5*u,'ironDark',-2.2*u+0.5);
    }
    // the shoulder plates: a dome over the joint, two lames below it, a spike up and back
    if(G.pauldrons){ const pk=K.pauldronK||1;
      [-1,1].forEach(s=>{ const S=by([s*wSh*0.9,topY+0.5*u,-0.3*u]), r=[2.9*u*pk,2.5*u*pk,3.3*u*pk];
        F.solid([[add(S,[s*0.3*u,-0.2*u,0]),r,[S[1]-3*u*pk,S[1]+1.4*u*pk]]],'iron',{ bias:2.5*u, sw:0.9 });
        [1,2].forEach(k=>F.solid([[add(S,[s*(0.5+0.35*k)*u,(1.0+1.1*k)*u*pk,0]),[r[0]*(1-0.08*k),1.2*u,r[2]*(1-0.08*k)],[S[1]+(0.4+1.1*k)*u*pk,S[1]+(2.4+1.1*k)*u*pk]]],'iron',{ bias:2.5*u-0.1*k, sw:0.8 }));
        F.tube(add(S,[s*0.6*u,-2.2*u*pk,-0.4*u]),add(S,[s*1.2*u,-5.4*u*pk,-1.6*u]),0.75*u,0.45*u,0.06*u,'ironDark',{ bias:2.5*u+0.05 }); });
    }
    // the belt round the waist, its buckle in front, a pouch at the side
    const bY=(A.beltY===undefined?hipY-5.2*u:A.beltY)+Y0;
    if(G.chest||G.cloth||G.pauldrons){
      F.ring([0,0,0.4*u],wHip*0.82,3.6*u,bY+0.7*u,1.6*u,'belt',0.3);
      if(F.faces([0,0,1])>0.1) F.patch([0,bY+0.7*u,4.1*u],[0,0,1],1.0*u,1.0*u,'ironDark',{ bias:0.4, shape:[[-1,-1],[1,-1],[1,1],[-1,1]] });
      F.solid([[[wHip*0.7,bY+2.8*u,1.8*u],[1.2*u,1.6*u,0.9*u]]],'leather',{ bias:0.2 });
    }
    // the tabard: a panel in front and one behind, from the belt to the knees, the front one swinging out with the leading knee
    if(G.cloth){ const cw=wHip*0.36*(K.clothW?Math.min(1.3,0.6+K.clothW*0.3):1), kn=Math.max(legs.R.Kn[2],legs.L.Kn[2]), kb=Math.min(legs.R.Kn[2],legs.L.Kn[2]), yb=L.kneeY+1.4*u;
      const jag=(z,dz)=>[[cw*0.95,yb,z],[cw*0.5,yb-1.1*u,z+dz],[0,yb+0.2*u,z+dz],[-cw*0.5,yb-1.0*u,z+dz],[-cw*0.95,yb,z]];
      F.plate([[-cw,bY+1.4*u,4.0*u],[cw,bY+1.4*u,4.0*u]].concat(jag(Math.max(4.0*u,kn+1.6*u),0)),'cloth',{ bias:0.2, flat:false });
      F.plate([[-cw,bY+1.4*u,-3.2*u],[cw,bY+1.4*u,-3.2*u]].concat(jag(Math.min(-3.2*u,kb-1.6*u),0)),'cloth',{ bias:-0.2 });
    }
    // the greaves: the thigh's plate, the knee's cop with its spike, the shin's plate, the iron shoe
    if(G.greaves) ['R','L'].forEach(side=>{ const { H, Kn, Ak, shinR, fl, s }=legs[side];
      F.tube(add(H,[0,1.2*u,0.4*u]),add(Kn,[0,-1.0*u,0.3*u]),1.55*u,1.55*u,1.35*u,'iron');
      F.tube(add(Kn,shinR([0,1.0*u,0.4*u])),add(Ak,shinR([0,-0.6*u,0.3*u])),1.6*u,1.4*u,1.2*u,'iron');
      const kc=add(Kn,shinR([0,0,0.9*u])); F.ball(kc,1.45*u,'iron',{ bias:0.3 }); F.tube(add(kc,shinR([0,0,1.0*u])),add(kc,shinR([0,-0.2*u,2.6*u])),0.55*u,0.3*u,0.05*u,'ironDark',{ bias:0.35 });
      F.solid([[fl([0,0.3*u,0.1*u]),[1.35*u,1.5*u,1.5*u]],[fl([s*0.4*u,-L.ankY-0.7*u,2.6*u]),[1.35*u,0.75*u,2.3*u]],[fl([0,-L.ankY-0.8*u,-0.9*u]),[1.2*u,0.75*u,1.1*u]]],'iron',{ bias:0.1, sw:0.85 }); });
  }
  // ---- the fantasy skeleton in space, from the body plan of the 2D rig (the human's measures) ----
  function skeleton(F,pl,st){
    const A=pl.A, { topY, hipY, bodyH, u, h, top, aw, wSh, wHip }=A, L=A.legs, hd=h*0.82, K=pl.K, G=pl.G;
    const w=st.phase||0, walkK=st.walking?1:0, roar=st.roar>0?Math.min(1,st.roar*3,(1.2-st.roar)*6):0, sw=st.swing||0, bob=-1.1*Math.abs(Math.sin(w))*walkK, breath=Math.sin((st.t||0)*2.1);
    const Y0=bob;       // the body bobs while it walks
    const cv={ chest:!!G.chest, coif:!!(G.helmet&&K.coif), greaves:!!G.greaves };       // what the armour covers is not drawn
    const flesh=!!K.flesh3d, gn=pl.genes||{}, wAt=y=>{ const pts=A.bPts; let m=0; for(let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length]; if((a[1]-y)*(b[1]-y)<=0&&a[1]!==b[1]) m=Math.max(m,Math.abs(a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]))); } return m; };       // a body of flesh (the ork) instead of bones
    const wC=(()=>{ const pts=A.bPts, y=topY+bodyH*0.42; let m=0; for(let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length]; if((a[1]-y)*(b[1]-y)<=0&&a[1]!==b[1]) m=Math.max(m,Math.abs(a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]))); } return m*0.96; })();
    // the spine's S from the side (the same as the 2D profile), as Z at a height
    const sp0=[[-0.08*hd,top+0.86*h],[-1.0*u,topY+0.2*u],[-2.0*u,topY+bodyH*0.2],[-2.3*u,topY+bodyH*0.35],[-1.8*u,topY+bodyH*0.5],[-1.0*u,topY+bodyH*0.62],[-0.8*u,hipY-6.4*u],[-1.6*u,hipY-4.5*u],[-2.0*u,hipY-2.6*u]];
    const zS=y=>{ for(let i=0;i<sp0.length-1;i++){ const a=sp0[i], b=sp0[i+1]; if((a[1]-y)*(b[1]-y)<=0&&a[1]!==b[1]) return a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]); } return y<sp0[0][1]?sp0[0][0]:sp0[sp0.length-1][0]; };
    const sB=topY+bodyH*0.32, zF=y=>4.2*u+(y-topY)/(sB-topY)*0.9*u;       // the front of the chest
    const by=v=>[v[0],v[1]+Y0,v[2]];       // a point of the trunk, bobbing
    const robed=!flesh&&!!K.robeTop;       // a skeleton in a robe (the lich): its trunk's bones hidden
    if(flesh||robed) fleshTrunk(F,{ A, K, G, u, Y0, by, wC, wAt, aw, cv });
    // the spine: vertebrae from under the skull to the sacrum, each a short tube with its spike to the back
    if(!flesh&&!robed) for(let i=0;i<sp0.length-1;i++){ if((cv.chest&&i>=1&&i<=5)||(cv.coif&&i===0)) continue; const a=sp0[i], b=sp0[i+1], n=i===0?3:2; for(let j=0;j<n;j++){ const t0=j/n, t1=(j+0.75)/n, p0=by([0,a[1]+(b[1]-a[1])*t0,a[0]+(b[0]-a[0])*t0]), p1=by([0,a[1]+(b[1]-a[1])*t1,a[0]+(b[0]-a[0])*t1]);
      const r=(i>=5?1.0:0.65)*u; F.tube(p0,p1,r,r,r,'skin',{ bias:-0.3 }); F.tube(mulv(add(p0,p1),0.5),add(mulv(add(p0,p1),0.5),[0,0.5*u,-1.4*u]),0.35*u,0.3*u,0.25*u,'skin',{ bias:-0.4 });
      if(i===5||i===6) F.tube(add(mulv(add(p0,p1),0.5),[-2.4*u,0,0]),add(mulv(add(p0,p1),0.5),[2.4*u,0,0]),0.35*u,0.35*u,0.35*u,'skin',{ bias:-0.35 }); } }
    // the ribs: arcs round an ellipse from the spine (behind) by the side to the breastbone (in front); the near half and the far half sorted apart
    const Wf=[0.62,0.8,0.92,0.97,0.95,0.85];
    if(!cv.chest&&!flesh&&!robed) for(let i=0;i<6;i++){ const W=Wf[i]*wC, yb=topY+1.0*u+i*1.25*u, yf=Math.min(sB-0.3*u,topY+1.4*u+i*1.5*u), zb=zS(yb)+0.4*u, zf=zF(yf), zc=(zb+zf)/2, D=(zf-zb)/2, sag=(1.4+0.25*i)*u;
      [-1,1].forEach(s=>{ const pts=[]; for(let k=0;k<=12;k++){ const a=Math.PI-k/12*(Math.PI-0.12); pts.push(by([s*Math.max(0.7*u,W*Math.sin(a)),yb+(yf-yb)*(1-a/Math.PI)+sag*Math.pow(Math.sin(a),2)*(0.7+0.3*(1-a/Math.PI)),zc+D*Math.cos(a)])); }
        F.line(pts.slice(0,7),0.75*u*2,'skin'); F.line(pts.slice(6),0.75*u*2,'skin'); }); }
    if(!cv.chest&&!flesh&&!robed) F.tube(by([0,topY+0.4*u,zF(topY)]),by([0,sB,zF(sB)]),0.65*u,0.55*u,0.4*u,'skin',{ bias:0.2 });       // the breastbone
    // the collarbones, the shoulders' knobs, the shoulder blades on the back
    if(!flesh&&!robed) [-1,1].forEach(s=>{ if(!cv.chest) F.tube(by([s*1.1*u,topY+0.5*u,zF(topY)-0.3*u]),by([s*wSh*0.86,topY-0.1*u,-0.3*u]),0.75*u,0.6*u,0.7*u,'skin'); if(!G.pauldrons) F.ball(by([s*wSh*0.92,topY+0.5*u,-0.3*u]),1.05*u,'skin');
      if(!cv.chest) F.plate([[s*wSh*0.9,topY+0.2*u,-1.2*u],[s*wSh*0.4,topY+1.0*u,-2.8*u],[s*wC*0.45,topY+bodyH*0.36,-2.6*u],[s*wC*0.85,topY+bodyH*0.3,-1.8*u]].map(by),'skin',{ bias:-0.2 }); });
    // the pelvis: the two wings, the sacrum behind, the holes below
    if(!cv.chest&&!flesh&&!robed) [-1,1].forEach(s=>{ F.plate([[s*1.0*u,hipY-6.0*u,-1.9*u],[s*wHip*0.45,hipY-8.0*u,-1.2*u],[s*wHip*0.9,hipY-7.4*u,0.8*u],[s*wHip*0.98,hipY-5.4*u,2.2*u],[s*wHip*0.8,hipY-4.0*u,1.6*u],[s*wHip*0.66,hipY-2.4*u,0.6*u],[s*wHip*0.55,hipY-0.5*u,-0.6*u],[s*0.45*u,hipY-0.9*u,1.6*u],[s*0.45*u,hipY-2.5*u,1.9*u],[s*1.6*u,hipY-4.4*u,-1.2*u]].map(by),'skin');
      F.patch(by([s*wHip*0.42,hipY-1.6*u,1.1*u]),norm([s*0.5,0,0.85]),wHip*0.15,0.8*u,'socket',{ bias:0.05 }); F.patch(by([s*wHip*0.42,hipY-1.6*u,0.9*u]),norm([-s*0.5,0,-0.85]),wHip*0.15,0.8*u,'socket',{ bias:0.05 }); });
    if(!cv.chest&&!flesh&&!robed) F.plate([[-2.2*u,hipY-6.6*u,-2.0*u],[2.2*u,hipY-6.6*u,-2.0*u],[0.9*u,hipY-2.8*u,-2.2*u],[0,hipY-2.1*u,-2.0*u],[-0.9*u,hipY-2.8*u,-2.2*u]].map(by),'skin',{ bias:-0.1 });
    // the skull: a hull of the vault and the face, the sockets, the nose's hole, the cheekbones, the teeth, the crack; the jaw a band below (it drops when it roars)
    const zH=(K.headFwd||0)*u, hc=[0,top+0.45*h+Y0,zH], X=x=>x*aw, Yh=y=>top+y*h+Y0, Z=z=>z*hd+zH, hy=Math.sin(w+0.6)*0.8*walkK;
    let sk;
    if(flesh) sk=fleshHead(F,{ A, K, G, u, h, Y0, by, X, Yh, Z, hc, gn, wild:(pl.t&&pl.t.wild)||0.5, roar, cv });
    else {
    F.solid([[hc,[X(1.0),0.43*h,Z(0.48)]],[[0,Yh(0.7),Z(0.22)],[X(0.82),0.13*h,Z(0.26)]]],'skin',{ sw:0.9 });
    sk=F.items[F.items.length-1].dep;
    if(K.eyeGlow) [-1,1].forEach(s=>{ const e=[s*X(0.4),Yh(0.49),Z(0.42)]; F.patch(e,norm([s*0.35,0,0.94]),X(0.16),0.05*h,'glow',{ bias:sk+0.06-F.P(e)[2], sw:0 }); F.patch(e,norm([s*0.35,0,0.94]),X(0.07),0.025*h,'eye',{ bias:sk+0.065-F.P(e)[2], sw:0 }); });       // the lich's eyes, glowing in the sockets
    [-1,1].forEach(s=>{ F.patch([s*X(0.4),Yh(0.48),Z(0.4)],norm([s*0.35,0,0.94]),X(0.31),0.115*h,'socket',{ bias:sk+0.05-F.P([s*X(0.4),Yh(0.48),Z(0.4)])[2], sw:0.75 });
      F.tube([s*X(0.72),Yh(0.6),Z(0.32)],[s*X(0.97),Yh(0.6),Z(-0.05)],0.55*u,0.5*u,0.45*u,'skin',{ bias:0.1 }); });
    F.patch([0,Yh(0.64),Z(0.48)],norm([0,0.15,1]),X(0.12),0.055*h,'socket',{ bias:sk+0.06-F.P([0,Yh(0.64),Z(0.48)])[2] });
    for(let i=0;i<6;i++){ const a=(-0.6+i*0.24), c=[Math.sin(a)*X(0.5),Yh(0.785),Math.cos(a)*Z(0.42)]; F.patch(c,norm([Math.sin(a),0,Math.cos(a)]),X(0.065),0.035*h,'tooth',{ bias:sk+0.07-F.P(c)[2], sw:0.3, shape:[[-1,-1],[1,-1],[1,1],[-1,1]] }); }
    if(F.faces(norm([-0.3,-0.6,0.75]))>0.1){ const q=[[-X(0.45),Yh(0.02),Z(0.15)],[-X(0.36),Yh(0.11),Z(0.3)],[-X(0.43),Yh(0.17),Z(0.33)],[-X(0.33),Yh(0.27),Z(0.4)]].map(F.P);
      F.items.push({ d:'M'+q.map(p=>p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' L'), dep:sk+0.08, fill:null, sw:0.55, stroke:'line' }); }       // the crack: a thin line
    // the jaw: a U from hinge to hinge round the chin, its teeth on top
    const jd=roar*0.35, jr=v=>{ const o=[0,Yh(0.62),Z(-0.05)], r=rotX(sub(v,o),-jd); return add(o,r); };
    const jawPts=s=>[[s*X(0.8),Yh(0.63),Z(-0.05)],[s*X(0.74),Yh(0.92),Z(0.0)],[s*X(0.45),Yh(0.99),Z(0.3)],[s*X(0.12),Yh(1.01),Z(0.42)]].map(jr);
    [-1,1].forEach(s=>F.line(jawPts(s),0.16*h,'skin'));
    F.line([jawPts(-1)[3],jawPts(1)[3]],0.16*h,'skin');
    for(let i=0;i<6;i++){ const a=(-0.6+i*0.24), c=jr([Math.sin(a)*X(0.48),Yh(0.855),Math.cos(a)*Z(0.4)]); F.patch(c,norm([Math.sin(a),0,Math.cos(a)]),X(0.065),0.03*h,'tooth',{ bias:sk+0.075-F.P(c)[2], sw:0.3, shape:[[-1,-1],[1,-1],[1,1],[-1,1]] }); }
    }
    // the legs: the thigh swings from the hip, the knee bends in the swing, the foot stays level
    const legs={};
    [-1,1].forEach(s=>{ const side=s<0?'R':'L', ph=s<0?w:w+Math.PI, sw2=22*Math.PI/180*Math.sin(ph)*walkK, kb=40*Math.PI/180*Math.max(0,Math.cos(ph))*walkK;
      const H=by([s*wHip*0.62,hipY-3*u,0.4*u]), K0=[s*Math.abs(L.xk),L.kneeY-0.4*u,0.7*u], A0=[s*Math.abs(L.xa),L.ankY,0.3*u], H0=[s*wHip*0.62,hipY-3*u,0.4*u];
      const Kn=add(H,rotX(sub(K0,H0),sw2)), Ak=add(Kn,rotX(sub(A0,K0),sw2-kb)), shinR=v=>rotX(v,sw2-kb);
      if(!flesh){ F.ball(H,1.0*u,'skin'); F.ball(add(H,[s*1.3*u,0.8*u,-0.4*u]),0.9*u,'skin'); }
      const fl=v=>add(Ak,v);       // the foot level, hanging at the ankle
      legs[side]={ H, Kn, Ak, shinR, fl, s };
      if((cv.greaves||K.lower==='robe')&&!flesh) return;       // under the greaves (drawn with the armour) or the robe
      if(flesh){ fleshLeg(F,{ K, L, u, gn, cv },legs[side]); return; }
      F.tube(H,Kn,0.95*u,0.72*u,1.1*u,'skin'); F.ball(add(Kn,[s*0.7*u,0,0]),0.8*u,'skin'); F.ball(add(Kn,[-s*0.7*u,0,0]),0.8*u,'skin');
      F.tube(add(Kn,shinR([0,0.6*u,0.2*u])),Ak,1.1*u,0.68*u,0.85*u,'skin'); F.tube(add(Kn,shinR([s*1.0*u,1.2*u,-0.6*u])),add(Ak,[s*0.9*u,0.3*u,-0.3*u]),0.4*u,0.3*u,0.42*u,'skin',{ bias:-0.1 });
      F.ball(add(Kn,shinR([0,-0.2*u,1.1*u])),0.75*u,'skin',{ bias:0.2 });       // the kneecap
      F.ball(fl([0,0.6*u,0]),0.8*u,'skin'); F.ball(fl([0,-0.9*u-L.ankY,-1.1*u]),0.85*u,'skin');       // the ankle's bone, the heel
      [-1,0,1].forEach(k=>{ const m0=fl([k*0.5*u,1.2*u,0.3*u]), m1=fl([s*0.6*u+k*0.55*u,-L.ankY-0.5*u+0,3.1*u]); F.tube(m0,m1,0.42*u,0.32*u,0.38*u,'skin'); F.tube(m1,add(m1,[s*0.3*u,0.3*u,1.2*u]),0.36*u,0.28*u,0.3*u,'skin'); });
    });
    if(K.lower==='robe') fleshRobe(F,{ A, K, u, Y0, wAt, wC, legs });
    if(flesh&&(K.cape||K.collar)) fleshCape(F,{ A, K, G, u, Y0, by, aw, legs, walkK, w });
    if(K.wings) wings3d(F,{ A, K, u, Y0, by, t:st.t||0 });
    if(K.tail) tail3d(F,{ A, K, u, Y0, by, w, walkK });
    // the arms: the shoulder fixed, the hand where it would be (hanging, or bent forward when it holds something), the elbow solved back and out
    const hands={};
    [-1,1].forEach(s=>{ const side=s<0?'R':'L', Sh=by([s*wSh*0.86,topY+0.9*u,-0.3*u]), holds=side==='R'?(G.weapon&&G.weapon!=='none'):!!G.shield;
      let Hd=by([s*(wSh*0.98+1.2),hipY+0.3*u+(K.handDrop||0),0.6*u]); if(holds) Hd=add(Hd,[-s*1.0*u,-bodyH*0.3,3.2*u]);
      Hd=add(Hd,[0,Math.sin((st.t||0)*2+(s<0?0:1))*0.6,(s<0?-1:1)*3*u*Math.sin(w)*walkK]);
      if(K.reach&&!holds) Hd=by([s*wSh*0.55,topY+bodyH*0.28+Math.sin((st.t||0)*1.7+s)*0.8*u,11*u]);       // the arms stretched out in front (the zombie)
      if(side==='R'&&sw){ Hd=add(Hd,sw>0?[0,-6*u*sw,-2*u*sw]:[0,3*u*-sw,4*u*-sw]); }
      if(roar) Hd=add(Hd,[0,-6*roar,0]);
      const aK=flesh?(K.armK||1):1, L1=10.6*u*aK, L2=9.8*u*aK, dv=sub(Hd,Sh), d=Math.min(L1+L2-1e-3,Math.max(Math.abs(L1-L2)+1e-3,len(dv))), uu=norm(dv), pole=norm([s*0.4,0,-1]), v=norm(sub(pole,mulv(uu,dot(pole,uu))));
      const a=Math.acos(Math.max(-1,Math.min(1,(L1*L1+d*d-L2*L2)/(2*L1*d)))), E=add(Sh,add(mulv(uu,L1*Math.cos(a)),mulv(v,L1*Math.sin(a)))), Wr=add(E,mulv(norm(sub(Hd,E)),L2));
      if(G.pauldrons){ const k=flesh?1.45*(K.armWK||1):1; F.tube(Sh,E,1.15*u*k,1.0*u*k,1.0*u*k,'iron'); F.ball(E,1.15*u*k,'iron',{ bias:0.1 }); F.tube(E,Wr,1.0*u*k,0.9*u*k,1.05*u*k,'iron'); }       // the arm in iron: the upper and the lower arm's plates, the elbow's cop
      else if(flesh){ const aw3=pl.S.armW||[1.8*u,1.3*u,0.9*u], r0=aw3[0]*1.2, r1=aw3[1]*1.25, r2=aw3[2]*1.15; if(!cv.chest) F.ball(add(Sh,[s*0.2*u,0.4*u,0]),r0*0.84*(K.sleeves?1.1:1),K.sleeves?'tunic':'skin');       // the arm of flesh from the body plan's arm widths: the shoulder's muscle, the upper arm, the elbow, the forearm
        const sl=K.sleeves?'tunic':'skin', sk2=K.sleeves?(K.lower==='robe'?1.3:1.1):1;       // in sleeves (the robe's wider at the wrist)
        F.tube(add(Sh,mulv(norm(sub(E,Sh)),0.8*u)),E,r0*sk2,r0*0.86*sk2,r1*0.81*sk2,sl); F.ball(E,r1*0.81*sk2,sl,{ bias:-1 }); F.tube(E,Wr,r1*0.9*sk2,r1*0.96*sk2,r2*sk2*(K.lower==='robe'?1.4:1),sl);       // (the joints' balls behind the tubes: a round elbow, no puppet's knob)
        if(K.wraps) [0.45,0.62,0.79].forEach(t=>{ const a=add(E,mulv(sub(Wr,E),t)), b=add(E,mulv(sub(Wr,E),t+0.1)), r=(r1*0.96-(r1*0.96-r2)*Math.max(0,t-0.5)*2)*1.08; F.tube(a,b,r,r,r,'leather',{ bias:0.05 }); }); }
      else if(K.sleeves){ F.tube(Sh,E,1.9*u,1.7*u,1.6*u,'tunic'); F.ball(E,1.6*u,'tunic',{ bias:-1 }); F.tube(E,Wr,1.6*u,1.9*u,2.3*u,'tunic'); }       // bones in a robe's wide sleeves
      else { F.tube(Sh,E,0.75*u,0.55*u,0.75*u,'skin'); F.ball(E,0.7*u,'skin'); F.tube(E,Wr,0.6*u,0.45*u,0.55*u,'skin'); }
      // the fist: a knuckled ball, three folded fingers towards the body
      const fr=(pl.S.hr||2.3)*0.9, fc=Wr; F.ball(fc,fr*0.75,'hand',{ bias:0.1 }); [-0.6,0,0.6].forEach(k=>F.tube(add(fc,[0,k*fr*0.55,0.5*fr]),add(fc,[-s*0.8*fr,k*fr*0.55,0.7*fr]),0.25*fr,0.25*fr,0.25*fr,'hand',{ bias:0.15 }));
      if(K.claws&&!G.pauldrons) [-0.6,0,0.6].forEach(k=>{ const b=add(fc,[-s*0.8*fr,k*fr*0.55,0.75*fr]); F.tube(b,add(b,[-s*0.3*fr,0.9*fr,0.5*fr]),0.18*fr,0.12*fr,0.02*fr,'bone',{ bias:0.2 }); });       // claws
      hands[side]={ at:fc, Sh, E };
    });
    if(K.crown&&!G.helmet) crown3d(F,{ X, Yh, Z, h, hc, sk });
    if(K.horns3d&&!G.helmet) horns3d(F,{ K, X, Yh, Z, h, hc });
    armour(F,{ A, K, G, u, h, Y0, by, sk, X, Yh, Z, hc, wC, zS, zF, legs, hands, roar });
    // the weapon (flat at the right hand; its edge turns with the figure), the shield (a plate with its thickness on the left arm)
    if(G.weapon&&G.weapon!=='none'&&pl.weapons[G.weapon]){ const hR=hands.R, q=F.P(hR.at), rot=(-(Math.sin((st.t||0)*1.3)*3)-roar*48-sw*(sw>0?40:55))*Math.PI/180;
      const out=Math.max(-1,Math.min(1,(q[0]-F.P([0,topY,0])[0])/(wSh*0.8))), lean=(sw||roar?0.4:1)*16*out*Math.PI/180;       // at rest the weapon leans out, away from the head (user: the axe hid the ork's face)
      const face=F.P([0,0,1]), facesLeft=face[0]<-0.01; flatShapes(F,pl.weapons[G.weapon],q,pl.grip[G.weapon]||[24,-16],(facesLeft?-rot:rot)+lean,(K.weaponK||1),facesLeft,q[2]+0.05); }       // facing left the weapon is drawn the other way round
    if(G.shield){ const hL=hands.L, n=norm([0.75,0,0.66]), t1=norm(cross([0,1,0],n)), t2=[0,1,0], r=wSh*(G.shield==='tower'?0.62:(G.shield==='kite'?0.58:0.45))*(K.shieldK||1), c=add(hL.at,mulv(n,0.9*u));
      const unit=G.shield==='tower'?[[-0.8,-1.4],[0.8,-1.4],[0.8,1.3],[-0.8,1.3]]:(G.shield==='kite'?[[-1,-1.1],[1,-1.1],[0.9,0.3],[0,1.45],[-0.9,0.3]]:Array.from({ length:20 },(_,i)=>{ const a=i/20*Math.PI*2; return [Math.cos(a),Math.sin(a)]; }));
      const at=(off)=>unit.map(([x,y])=>add(add(c,mulv(n,off)),add(mulv(t1,x*r),mulv(t2,y*r))));
      const front=F.faces(n)>0, d0=F.P(c)[2], fa=at(0).map(F.P), ba=at(-0.9*u).map(F.P);
      F.put(hull(fa.concat(ba)),d0-0.02,'ironDark',{ sw:0.9 });       // the rim: what lies between the two faces (its thickness, seen from the side)
      F.put(front?fa:ba,d0,'wood',{ shade:true, sw:0.9 });       // the face that is turned to us
      if(front&&K.emblem&&G.shield!=='buckler'){ const ec=add(c,mulv(t2,-0.35*r)); F.patch(add(ec,mulv(n,0.05)),n,0.3*r,0.32*r,'bone',{ bias:0.03 }); [-1,1].forEach(e=>F.patch(add(add(ec,mulv(t1,e*0.13*r)),mulv(n,0.1)),n,0.09*r,0.1*r,'socket',{ bias:0.04 })); }
      else if(front) F.patch(add(c,mulv(n,0.1)),n,0.3*r,0.3*r,'iron',{ bias:0.03 });
      else if(unit.length<=6) [-0.3,0.2].forEach(yy=>F.line([add(add(c,mulv(t2,yy*r)),add(mulv(t1,-0.8*r),mulv(n,-0.95*u))),add(add(c,mulv(t2,yy*r)),add(mulv(t1,0.8*r),mulv(n,-0.95*u)))],0.6*u,'leather',d0+0.06)); }       // from behind: the straps
    // the shadow on the floor
    const sh=F.P([0,0,0]); F.items.push({ d:path(Array.from({ length:20 },(_,i)=>{ const a=i/20*Math.PI*2; const p=F.P([Math.cos(a)*6*u,0,Math.sin(a)*5*u]); return [p[0],p[1]]; })), dep:-1e9, fill:'shadowC', sw:0 });
  }
  // the canvas: everything sorted by depth, k pixels to a unit, the feet at (ox, oy)
  function canvas(g,pl,st,yaw,pitch,k,ox,oy){
    const F=frame(yaw,pitch); skeleton(F,pl,st);
    const items=F.items.slice().sort((a,b)=>a.dep-b.dep), pal=pl.pal;
    g.save(); g.setTransform(k,0,0,k,ox,oy); g.lineJoin='round'; g.lineCap='round';
    items.forEach(it=>{ const p=new Path2D(it.d);
      if(it.band){ g.strokeStyle=pal.line; g.lineWidth=it.bw+1.5; g.stroke(p); g.strokeStyle=pal[it.band]||it.band; g.lineWidth=it.bw; g.stroke(p); return; }
      if(it.fill){ g.fillStyle=pal[it.fill]||it.fill; g.fill(p); }
      if(it.shade){ g.fillStyle=pal.boneShade||'rgba(0,0,0,0.25)'; g.fill(new Path2D(it.shade)); }
      if(it.sw){ g.strokeStyle=pal[it.stroke]||pal.line; g.lineWidth=it.sw; g.stroke(p); } });
    g.restore();
  }
  return { canvas, frame, skeleton };
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
  const KIND_NAME={ human:'Mensch', ork:'Ork (alt)', imp:'Imp', goblin:'Goblin (alt)', goblinB:'Goblin', troll:'Troll (alt)', trollB:'Troll', darkelf:'Dunkelelf (alt)', darkelfB:'Dunkelelf', vampire:'Vampir (alt)', vampireB:'Vampir', warlock:'Warlock (alt)', warlockB:'Warlock', ghoul:'Ghul', zombie:'Zombie', priest:'Dunkler Priester', darkknight:'Dunkler Ritter', succubus:'Succubus', demon:'Dämon', lich:'Lich', werewolf:'Werwolf', skeleton2:'Skelett (Fantasy)', skeleton:'Skelett', orkB:'Ork' }, STYLE_NAME={ aasfresser:'Aasfresser', graeber:'Gräber', frisch:'Frisch', verwest:'Verwest', kantor:'Kantor', eiferer:'Eiferer', eisern:'Eisern', gefallen:'Gefallen', verfuehrerin:'Verführerin', dornen:'Dornen', brut:'Brut', fuerst:'Fürst', gelehrter:'Gelehrter', koenig:'König', grau:'Grau', schwarzpelz:'Schwarzpelz', pirscher:'Pirscher', schinder:'Schinder', veteran:'Veteran', soeldner:'Söldner', bauer:'Bauer', bestie:'Bestie', wicht:'Wicht', knolle:'Knolle', krieger:'Krieger', brocken:'Koloss', spaeher:'Späher', flitzer:'Flitzer', grinser:'Grinser', fels:'Fels', moor:'Moor', klinge:'Klinge', hexe:'Hexe', graf:'Graf', bleich:'Bleich', seher:'Seher', irrer:'Irrer', alt:'Uralt', eigen:'Eigen' }, WEAPON_NAME={ none:'keine', axe:'Axt', club:'Keule', sword:'Schwert', pick:'Spitzhacke', hammer:'Hammer', dagger:'Dolch', spear:'Speer', bow:'Bogen', staff:'Stab' };
  // the genes (every humanoid: every look between the presets)
  const GENES=[['kopf','Kopfgröße'],['kopfForm','Kopf: oval, rund, eckig'],['kinn','Kinn spitz'],['koerperForm','Körper: oval, rund, eckig'],['beinForm','Beine: oval, rund, eckig'],['fuss','Füße'],['tief','Kopf tief'],['koerper','Körper rund'],['beine','Beine lang'],['augen','Augen groß'],['haut','Hautton'],['augenFarbe','Augenfarbe'],['haar','Haarfarbe'],['bart','Bart'],['bemalung','Bemalung']];
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
  <button id="orkvG_hands" aria-pressed="false">Hände</button><button id="orkvG_helmet" aria-pressed="false">Helm</button><button id="orkvG_chest" aria-pressed="false">Brustpanzer</button><button id="orkvG_pauldrons" aria-pressed="false">Schulterplatten</button><button id="orkvG_cloth" aria-pressed="false">Lendenschurz</button><button id="orkvG_greaves" aria-pressed="false">Beinschienen</button><button id="orkvG_arms" aria-pressed="false">Arme</button><button id="orkvG_shieldFlat" aria-pressed="false">Schild flach</button><button id="orkvScar" aria-pressed="false">Narbe</button><button id="orkvKo">K.o.</button><button id="orkvHeal">Narben weg</button><span id="orkvScarN" class="orkv-group"></span><button id="orkvG_ears" aria-pressed="false">Ohren</button><button id="orkvG_horns" aria-pressed="false">Hörner</button>
  <label for="orkvShield">Schild</label><select id="orkvShield"><option value="">keiner</option><option value="buckler">Buckler</option><option value="kite">Dreiecksschild</option><option value="tower">Turmschild</option></select>
  <label for="orkvMat">Material</label><select id="orkvMat"><option value="">Grundfarbe</option><option value="leder">Leder</option><option value="bronze">Bronze</option><option value="eisen">Eisen</option><option value="stahl">Stahl</option></select>
  <label for="orkvHelm">Helmform</label><select id="orkvHelm"><option value="">wie die Art</option><option value="plain">schlicht</option><option value="crest">Kamm</option><option value="horns">Hörner</option></select>
  <label class="orkv-slider" for="orkvLevel" id="orkvLevelBox">Stufe <input type="range" id="orkvLevel" min="1" max="12" value="1"><output id="orkvLevelOut">1</output></label>
</div>
<div class="orkv-row">
  <label for="orkvView">Ansicht</label><select id="orkvView"><option value="front">vorn</option><option value="back">hinten</option><option value="left">links</option><option value="right">rechts</option></select>
  <span id="orkv3dBox"><button id="orkv3d" aria-pressed="false">3D (Test)</button> <label class="orkv-slider" for="orkvYaw">Drehung <input type="range" id="orkvYaw" min="0" max="359" value="35"><output id="orkvYawOut">35°</output></label> <label class="orkv-slider" for="orkvPitch">Kamerahöhe <input type="range" id="orkvPitch" min="0" max="70" value="0"><output id="orkvPitchOut">0°</output></label></span>
  <label for="orkvMood">Stimmung</label><select id="orkvMood">${Object.keys(SvgRig.MOODS).map(m=>`<option value="${m}">${m}</option>`).join('')}</select>
  <label for="orkvFx">Nachbearbeitung</label><select id="orkvFx"><option value="vector">Vektor (SVG)</option><option value="boil">Wackel-Linie</option><option value="pixel">Pixel</option><option value="smooth" selected>Pixel, glatt hochgerechnet</option><option value="soft">Weich</option></select>
  <label for="orkvRes">Pixelgröße</label><select id="orkvRes"><option value="24">24 px</option><option value="32">32 px</option><option value="48" selected>48 px</option><option value="64">64 px</option><option value="128">128 px</option></select>
</div>
<div class="orkv-sprites" id="orkvSprites" aria-label="Der Ork als Sprite von 16 bis 128 Pixeln"></div>
<p class="orkv-note">Ein Baukasten statt einer Zeichnung: Ork und Imp teilen einen Körperplan, dieselben Teile und Bewegungen. Gene wählen das Aussehen (die Stile sind Voreinstellungen davon), die Werte formen den Körper (Klugheit: größerer Kopf und kleinerer Kiefer, Stärke: viel breitere Schultern, kaum breitere Hüften und größere Hände, Gewandtheit: längere Beine und schlanker, Wildheit: längere Hauer und finsterere Brauen). Die Ausrüstung wird aus dem Körper berechnet: der Helm aus dem Schädel bis zu den Brauen, der Brustpanzer aus dem Umriss von den Schultern bis zur Taille, die Schulterplatten auf den Schultern, Gürtel und Lendenschurz an der Hüfte. So sitzt sie bei jeder Größe, wie die Waffe in der Faust. Die Hände schweben ohne Arme neben dem Körper; ohne Hände schwebt die Waffe allein. „Würfeln“ zieht aus einem Seed Gene, Werte, Hautton, Narbe und Ausrüstung. Unten dieselbe Figur als Sprite, in der gewählten Nachbearbeitung.</p>`;
    const $=id=>root.querySelector('#'+id), stage=$('orkvStage'), svgEl=$('orkvSvg'), cv=$('orkvCanvas'), turb=$('orkvTurb');
    let spec=SvgRig.defaults('human'), rig, out;
    const s=SvgRig.create(), opt={ r3d:false, yaw:35, pitch:0, walk:true, mouse:null, followMouse:false, explode:false, fx:'smooth', res:48 };
    // the controls show the spec; a change rebuilds the rig
    // the choices follow the kind: its styles, its weapons and tools, the gear it can wear, a load for those who carry one
    const fill=(sel,list,names)=>{ sel.innerHTML=list.map(v=>`<option value="${v}">${names[v]||v}</option>`).join(''); };
    const show=()=>{ $('orkvKind').value=spec.kind; fill($('orkvStyle'),SvgRig.stylesOf(spec.kind),STYLE_NAME); $('orkvStyle').value=rig.spec.style;
      fill($('orkvWeapon'),['none'].concat(SvgRig.weaponsOf(spec.kind)),WEAPON_NAME);
      ['helmet','chest','pauldrons'].forEach(k=>{ $('orkvG_'+k).hidden=!rig.has[k]; });
      root.querySelectorAll('[data-for="load"]').forEach(e=>{ e.hidden=!rig.has.load; });
      const lk=SvgRig.lookOf(spec.kind); ['ears','horns'].forEach(k=>{ const b=$('orkvG_'+k); b.hidden=!rig.has[k]; b.setAttribute('aria-pressed',spec.gear[k]!==undefined?!!spec.gear[k]:lk[k]!==false); });
      $('orkvLevelBox').hidden=!rig.has.level; $('orkv3dBox').hidden=!(pl&&pl.K.rig3d&&typeof Rig3D!=='undefined'); $('orkvView').value=spec.view||'front'; $('orkvScarN').textContent=(spec.scars||0)?`${spec.scars||0} ×`:'';
      const gn=rig.genes, KI=SvgRig.kindInfo(spec.kind); GENES.forEach(([k,n])=>{ const el=$('orkvGn_'+k); el.value=Math.round((gn[k]===undefined?0.5:gn[k])*100); el.parentNode.firstChild.textContent=(KI.geneNames&&KI.geneNames[k])||n; el.parentNode.hidden=k==='bemalung'&&!KI.paint; });       // a kind may name a gene its own way (the ork's beard is its hair style); the paint only for those who wear it $('orkvEarsBox').hidden=!rig.has.level; if(rig.has.ears) $('orkvEars').value=gn.ohren||'spitz'; $('orkvLevel').value=spec.level||1; $('orkvLevelOut').textContent=spec.level||1; $('orkvLoad').value=spec.gear.load||'none'; $('orkvShield').value=spec.gear.shield||''; $('orkvMat').value=spec.gear.mat||''; $('orkvHelm').value=spec.gear.helmStyle||''; TRAITS.forEach(([k])=>{ $('orkvT_'+k).value=Math.round(spec.traits[k]*100); }); $('orkvWeapon').value=spec.gear.weapon;
      ['helmet','chest','pauldrons','cloth','greaves','arms','shieldFlat'].forEach(k=>$('orkvG_'+k).setAttribute('aria-pressed',!!spec.gear[k])); $('orkvG_greaves').hidden=!rig.real; $('orkvG_hands').setAttribute('aria-pressed',spec.gear.hands!==false); $('orkvScar').setAttribute('aria-pressed',!!spec.scar); };
    // the stage: 80 units high (the ork's), more for a taller figure, always 2.4 times as wide; the feet 8 units above its bottom
    // one scale for every kind (a human as tall as a human, an ork taller, an imp small): the stage shows 1.7 human heights, a figure its height of them
    const WORLD=1.7; let SH=80; const stageFit=()=>{ SH=Math.round(rig.H*WORLD/rig.height); svgEl.setAttribute('viewBox',`${-SH*1.2} ${-(SH-0.1*rig.H)} ${SH*2.4} ${SH}`); };
    // the 2.5D test (Rig3D): the figure from its plan, any yaw and camera height
    let pl=null; const side3=()=>!opt.r3d&&pl&&pl.K.flesh3d&&!pl.K.side&&(pl.K.only3d||spec.view==='left'||spec.view==='right')&&typeof Rig3D!=='undefined';       // a kind without a flat profile (the ork) is seen from the side through the 2.5D rig; one drawn only from the kit (the goblin) from every side
    const r3=()=>(opt.r3d&&pl&&pl.K.rig3d&&typeof Rig3D!=='undefined')||side3();
    const yawNow=()=>(side3()?({ right:90, left:270, back:180 }[spec.view]||0):(opt.walk&&s.walking?(s.dir>0?90:270):opt.yaw))*Math.PI/180;       // walking it faces the way it walks
    const drawFig=(g,P,k,ox,oy)=>{ if(r3()) Rig3D.canvas(g,pl,s,yawNow(),side3()?0:opt.pitch*Math.PI/180,k,ox+(P.root&&P.root.x||0)*k,oy); else SvgRig.canvas(g,rig,P,k,ox,oy); };
    const rebuild=()=>{ rig=SvgRig.build(spec); pl=SvgRig.plan(spec); out=SvgRig.svg($('orkvRig'),rig); stageFit(); show(); };
    rebuild(); opt.res=rig.px; $('orkvRes').value=String(rig.px);
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
    ['helmet','chest','pauldrons','cloth','greaves','arms','shieldFlat'].forEach(k=>$('orkvG_'+k).addEventListener('click',()=>{ spec.gear[k]=!spec.gear[k]; rebuild(); }));
    $('orkvG_hands').addEventListener('click',()=>{ spec.gear.hands=spec.gear.hands===false; rebuild(); });
    $('orkvScar').addEventListener('click',()=>{ spec.scar=!spec.scar; rebuild(); });
    $('orkvKo').addEventListener('click',()=>{ spec.scars=(spec.scars||0)+1; if(!spec.seed) spec.seed=1+Math.floor(Math.random()*1e6); rebuild(); });       // knocked out: one scar more (user)
    $('orkvHeal').addEventListener('click',()=>{ spec.scars=0; spec.scar=false; rebuild(); });
    $('orkvView').addEventListener('change',e=>{ spec.view=e.target.value; rebuild(); });
    $('orkv3d').addEventListener('click',()=>{ opt.r3d=!opt.r3d; $('orkv3d').setAttribute('aria-pressed',opt.r3d); });
    [['orkvYaw','yaw'],['orkvPitch','pitch']].forEach(([id,k])=>$(id).addEventListener('input',e=>{ opt[k]=+e.target.value; $(id+'Out').textContent=e.target.value+'°'; }));
    $('orkvRoll').addEventListener('click',()=>{ spec=SvgRig.roll(Math.floor(Math.random()*1e9),spec.kind); rebuild(); });
    const toggle=(id,key)=>{ const b=$(id); b.addEventListener('click',()=>{ opt[key]=!opt[key]; b.setAttribute('aria-pressed',opt[key]); if(key==='followMouse'&&!opt[key]) opt.mouse=null; }); };
    toggle('orkvWalk','walk'); toggle('orkvMouse','followMouse'); toggle('orkvParts','explode');
    $('orkvBlink').addEventListener('click',()=>{ s.blink=0.16; s.nextBlink=0.3; s.twice=true; });
    $('orkvRoar').addEventListener('click',()=>{ s.roar=1.2; });
    $('orkvMood').addEventListener('change',e=>{ s.mood=e.target.value; });
    $('orkvFx').addEventListener('change',e=>{ opt.fx=e.target.value; });
    $('orkvRes').addEventListener('change',e=>{ opt.res=+e.target.value; });
    stage.addEventListener('pointermove',e=>{ if(!opt.followMouse) return; const r=stage.getBoundingClientRect(), sc=Math.min(r.width/(SH*2.4),r.height/SH), ox=r.left+r.width/2, oy=r.bottom-0.1*rig.H*sc;
      opt.mouse=[(e.clientX-ox)/sc,(e.clientY-oy)/sc]; });
    // the sprites: 16 to 128 pixels high; the small ones shown four times as large, the big ones three and two times
    const TIMES={ 4:'vierfach', 3:'dreifach', 2:'doppelt' };
    const spr=$('orkvSprites'), figs=[[16,4],[24,4],[32,4],[48,3],[64,3],[128,2]].map(([n,m])=>{ const f=document.createElement('figure'), c=document.createElement('canvas'); c.width=Math.round(n*1.25)*m; c.height=Math.round(n*1.08)*m;
      const cap=document.createElement('figcaption'); cap.textContent=`${n} px, ${TIMES[m]}`; f.append(c,cap); spr.appendChild(f); return { n, c }; });
    let last=performance.now(), spriteT=0, boilT=0, stageT=0, alive=true;
    const frame=now=>{ if(!alive||!root.isConnected){ alive=false; return; } requestAnimationFrame(frame);
      const dt=Math.min(0.05,(now-last)/1000); last=now;
      SvgRig.step(s,dt,{ walk:opt.walk, mouse:opt.followMouse?opt.mouse:null, range:56, explode:opt.explode });
      if(opt.walk&&s.walking&&((spec.view==='left'&&s.dir>0)||(spec.view==='right'&&s.dir<0))){ spec.view=s.dir>0?'right':'left'; rebuild(); }       // from the side it faces the way it walks
      const P=SvgRig.pose(s,rig), vec=(opt.fx==='vector'||opt.fx==='boil')&&!r3(); svgEl.style.visibility=vec?'visible':'hidden'; cv.hidden=vec;       // (the 3D test draws on the canvas only)
      if(vec){ out.draw(P); $('orkvRig').setAttribute('filter',opt.fx==='boil'?'url(#orkvBoil)':''); boilT+=dt; if(boilT>0.13){ boilT=0; turb.setAttribute('seed',1+Math.floor(Math.random()*90)); } }
      else if((stageT+=dt)>1/30){ stageT=0;
        // the ork opt.res pixels high (as the sprites below), the stage around it in the same pixels
        const r=stage.getBoundingClientRect(), hi=r3()&&(opt.fx==='vector'||opt.fx==='boil'), k=hi?r.height*Math.min(2,window.devicePixelRatio||1)/SH:opt.res/rig.H, small=document.createElement('canvas'); small.width=Math.round(SH*2.4*k); small.height=Math.round(SH*k);       // (the 3D test as vectors: drawn at the stage's own size)
        const g=small.getContext('2d'); drawFig(g,P,k,small.width/2,small.height-0.1*rig.H*k);
        let src=small; if(opt.fx!=='soft'&&opt.fx!=='vector'&&opt.fx!=='boil') snap(g,small.width,small.height); if(opt.fx==='smooth') src=epx2(epx2(small));
        const dpr=Math.min(2,window.devicePixelRatio||1); cv.width=Math.round(r.width*dpr); cv.height=Math.round(r.height*dpr);
        const cg=cv.getContext('2d'); cg.imageSmoothingEnabled=opt.fx!=='pixel'; const sc=Math.min(cv.width/src.width,cv.height/src.height);
        cg.clearRect(0,0,cv.width,cv.height); cg.drawImage(src,(cv.width-src.width*sc)/2,cv.height-src.height*sc,src.width*sc,src.height*sc);
      }
      // the sprites follow the chosen after-effect: plain pixels, or grown smoothly when "smooth" is chosen
      spriteT+=dt; if(spriteT>0.1){ spriteT=0; const Q=Object.assign({},P,{ root:Object.assign({},P.root,{ x:0 }) });
        figs.forEach(f=>{ let sp=r3()?(()=>{ const c=document.createElement('canvas'); c.width=Math.round(f.n*1.25); c.height=Math.round(f.n*1.08); const g=c.getContext('2d'), k=f.n/rig.H; drawFig(g,Q,k,c.width*0.42,c.height-2*k); snap(g,c.width,c.height); return c; })():sprite(rig,Q,f.n); const smooth=opt.fx==='smooth'; if(smooth) sp=epx2(epx2(sp));
          const g=f.c.getContext('2d'); g.imageSmoothingEnabled=smooth; g.clearRect(0,0,f.c.width,f.c.height); g.drawImage(sp,0,0,f.c.width,f.c.height); }); }
    };
    requestAnimationFrame(frame);
    return lastViewer={ close(){ alive=false; root.remove(); }, state:s, opt, get spec(){ return spec; }, get plan(){ return pl; }, get r3(){ return r3(); } };
  }
  // in the game (where View3D exists): "#svgork" opens it over everything
  // in the game: the figure workshop over everything (main menu, options, or "#svgork" at the end of the address); the game pauses while it is open
  let shown=null;
  function overlay(){
    if(shown) return shown;
    const host=document.createElement('div'); host.id='figureWorkshop'; host.style.cssText='position:fixed;inset:0;z-index:9999;background:#120d0a;overflow:auto;padding:16px max(16px,env(safe-area-inset-left,0px))';
    const inner=document.createElement('div'); inner.style.cssText='max-width:1100px;margin:0 auto'; host.appendChild(inner);
    const head=document.createElement('div'); head.style.cssText='display:flex;align-items:center;gap:12px;margin:0 0 12px';
    const title=document.createElement('h2'); title.textContent='Figuren-Werkstatt'; title.style.cssText='margin:0;flex:1;color:#e9dcc0;font-size:22px';
    const close=document.createElement('button'); close.textContent='Zurück'; close.className='menuMain'; close.style.cssText='width:auto;margin:0;padding:6px 16px';
    head.append(title,close); inner.appendChild(head);
    const paused=typeof gameSpeed!=='undefined'?gameSpeed:null; if(paused!==null) gameSpeed=0;
    document.body.appendChild(host); const v=open(inner);
    const key=e=>{ if(e.key==='Escape'){ e.stopPropagation(); shut(); } };
    const shut=()=>{ v.close(); host.remove(); shown=null; window.removeEventListener('keydown',key,true); if(paused!==null&&gameSpeed===0) gameSpeed=paused; if(location.hash==='#svgork') history.replaceState(null,'',location.pathname); };
    window.addEventListener('keydown',key,true); close.onclick=shut;
    return shown={ close:shut, viewer:v };
  }
  if(typeof window!=='undefined'&&typeof View3D!=='undefined'){ const maybe=()=>{ if(location.hash==='#svgork') overlay(); }; window.addEventListener('hashchange',maybe); window.addEventListener('load',()=>setTimeout(maybe,300)); }
  return { open, overlay, get last(){ return lastViewer; }, get shown(){ return shown; } };
})();
