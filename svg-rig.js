// SVG figures (user, November 2026: the game moves to them step by step, the pixel sprites stay as legacy until then; see CLAUDE.md, docs/ui.md).
// A kit of creature kinds (ork, imp) built from parts that move on their own: legs from the hip, the body with belly, belt and buckle, the head with
// skull, jaw, eyes (blinking, looking), brows (mood) and what a kind has of its own (tusks, ears, a tail, a sack on the back), the gear on the parts
// (helmet, breastplate, shoulder plates, loincloth), and two floating hands without arms that hold the weapon or tool (the style rule, CLAUDE.md).
// Every kind shares the part names, the motion and the stats, so parts of one kind can later go onto another (a creature sewn from others).
// Styles: "düster" (grim, the chosen direction) for every kind, "klassisch" for the ork. The stats shape the body (cleverness: a bigger head, a smaller
// jaw; strength: broader; agility: longer legs, slimmer; savagery: longer tusks, darker brows), a seed rolls them with the skin's hue, a scar and the
// gear (deterministic: the same seed, the same creature). One set of path data feeds two outputs: real SVG (crisp at any size) and a canvas (Path2D),
// which also gives the after-effects: pixel (the figure drawn as a small sprite), smooth (pixel, then grown with EPX), soft, and a boiling line.
// The in-game viewer opens with "#svgork" at the end of the address; the same file is the whole of the published viewer page. The game does not use it yet.
const SvgRig=(()=>{
  const ell=(cx,cy,rx,ry)=>`M${cx-rx} ${cy} a${rx} ${ry} 0 1 0 ${2*rx} 0 a${rx} ${ry} 0 1 0 ${-2*rx} 0z`;
  // a path mirrored left to right: x negated (1), y kept (0); in an arc the end point's x is negated and the sweep turned round (2)
  function mirror(d){
    const X={ M:[1,0], m:[1,0], L:[1,0], l:[1,0], T:[1,0], t:[1,0], Q:[1,0,1,0], q:[1,0,1,0], C:[1,0,1,0,1,0], c:[1,0,1,0,1,0], H:[1], h:[1], V:[0], v:[0], A:[0,0,0,0,2,1,0], a:[0,0,0,0,2,1,0], Z:[], z:[] };
    let cmd='M', i=0; return d.replace(/[a-zA-Z]|-?\d*\.?\d+/g,tok=>{ if(/[a-zA-Z]/.test(tok)){ cmd=tok; i=0; return tok; } const pat=X[cmd]||[0], k=pat.length?pat[i%pat.length]:0; i++;
      return k===1?String(-parseFloat(tok)):(k===2?String(1-parseFloat(tok)):tok); });
  }
  // ---- colours of each kind and style; shapes: [path, fill key or null, stroke width (0 none), stroke key] ----
  const PAL={
    ork:{
      klassisch:{ skin:'#5f8f3a', light:'#86b05a', dark:'#3d6224', shade:'rgba(0,0,0,0)', leg:'#4e6b30', foot:'#324a20', belt:'#6b4a35', gold:'#c8a040', bone:'#f2e8d5', line:'#14100c', brow:'#2a3f18', eye:'#ffffff', pupil:'#14100c', glow:'rgba(0,0,0,0)', mouth:'#3a120c', tongue:'#a8443a', iron:'#8a9096', ironDark:'#5d6268', wood:'#8a6446', leather:'#7a5a3a', cloth:'#6b4a35', rust:'#7a4a2a', scar:'#b8c890' },
      düster:{ skin:'#3c4730', light:'#4c583b', dark:'#20271a', shade:'rgba(0,0,0,0.3)', leg:'#2f3827', foot:'#15120f', belt:'#261c15', gold:'#9c907a', bone:'#c4b89c', line:'#070504', brow:'#11160d', eye:'#ff4a1e', pupil:'#200300', glow:'rgba(255,60,20,0.42)', mouth:'#140403', tongue:'#4a1410', iron:'#2c2c33', ironDark:'#17171b', wood:'#30231a', leather:'#261c15', cloth:'#3a0f0c', rust:'#6e3320', scar:'#7e705f' }
    },
    imp:{
      düster:{ skin:'#7a3219', light:'#94431f', dark:'#3e140a', shade:'rgba(0,0,0,0.3)', leg:'#6a2b15', foot:'#1a0a05', belt:'#5a4228', gold:'#c9a040', ore:'#8a929c', bone:'#d2c29a', line:'#080403', brow:'#260a04', eye:'#ffb020', socket:'#120604', glow:'rgba(255,150,30,0.45)', mouth:'#160403', tongue:'#5a1a14', iron:'#44444c', ironDark:'#222228', wood:'#35261b', leather:'#33231a', sack:'#5e4c33', sackDark:'#33281b', cloth:'#2e140c', rust:'#6e3320', scar:'#b07050' }
    }
  };
  const SKIN_KEYS=['skin','light','dark','leg','brow'];
  // a hand: a round fist with the fingers drawn on it (three seams across the front, the thumb on the side towards the body); its colour is the skin's,
  // or the armour's when the creature wears shoulder plates ('hand', 'handLine' are set when the rig is built)
  function fist(cx,cy,rx,ry,sw){
    const f=v=>(+v).toFixed(2), seam=x=>`M${f(x)} ${f(cy-ry*0.85)} q${f(-0.12*rx)} ${f(ry*0.4)} 0 ${f(ry*0.8)}`;
    return [[ell(cx,cy,rx,ry),'hand',sw],[[seam(cx-0.42*rx),seam(cx+0.02*rx),seam(cx+0.46*rx)].join(' '),null,sw*0.55,'handLine'],
      [`M${f(cx-rx*0.95)} ${f(cy+ry*0.05)} q${f(rx*0.5)} ${f(-ry*0.15)} ${f(rx*0.85)} ${f(ry*0.45)}`,null,sw*0.6,'handLine']];
  }
  // the ork's parts in both styles, the imp's in the grim one; a missing part is simply not there (the imp has no tusks, the ork no tail)
  const SHAPES={ ork:{
    klassisch:{
      H:66, shadow:[[ell(0,1.5,17,3),'shadowC',0]],
      leg:[['M-11 -12 q-1 9 2 12 h7 q2 -6 0 -12z','leg',2],['M-10 -1.5 h8',null,1.4,'foot']], hip:[-7,-12],
      body:[['M-18 -24 q0 -14 18 -15 q18 1 18 15 q1 14 -18 15 q-19 -1 -18 -15z','skin',2],['M-14 -28 q4 4 2 9',null,1.5,'dark']],
      belly:[['M-10 -21 q10 9 20 0 q0 8 -10 9 q-10 -1 -10 -9z','light',0]],
      belt:[['M-17 -16 q17 6 34 0 l0 4 q-17 6 -34 0z','belt',2]], buckle:[['M-3 -16.5 h6 v5 h-6z','gold',2]],
      neck:[0,-37], skull:[['M-10 -44 q10 -10 20 0 q3 6 0 10 q-10 5 -20 0 q-3 -4 0 -10z','skin',2]], scar:[['M-8 -47 L-3 -42.5',null,1.2,'scar']],
      mouth:[[ell(0,-32.5,9,3.2),'mouth',1.6],[ell(0,-31,4.5,1.4),'tongue',0]], mouthAt:[0,-33],
      jaw:[['M-13 -36 q13 10 26 0 q2 8 -4 11 q-9 4 -18 0 q-6 -3 -4 -11z','light',2]], jawAt:[0,-36],
      tusk:[['M-10 -32 l0 -7 l3 0 l0 5z','bone',1.5]], tuskAt:[-8.5,-32],
      eye:[[ell(-4.5,-40,2.6,2.2),'eye',0]], eyeAt:[-4.5,-40], pupil:[[ell(-4,-39.6,1.2,1.2),'pupil',0]], pupilIn:0.5, lookK:1.1,
      lid:[['M-7.3 -40 q2.8 1.6 5.6 0',null,1.6,'line']],
      brow:[['M-9 -44.5 l6 2',null,2.2,'brow']], browAt:[-6,-43.5],
      helmet:[['M-10.5 -44 Q0 -56 10.5 -44 L10.5 -42.6 L-10.5 -42.6z','iron',1.8],['M-1 -44 h2 v4.5 h-2z','ironDark',1.2],[ell(-6,-45.6,0.7,0.7),'ironDark',0],[ell(6,-45.6,0.7,0.7),'ironDark',0]],
      chest:[['M-15.5 -33 Q0 -39 15.5 -33 L13.5 -19 Q0 -15.5 -13.5 -19z','leather',1.8],['M0 -36 L0 -17.5',null,1.2,'dark'],['M-9 -31 l3 0 M6 -31 l3 0',null,1.2,'dark']],
      pauldron:[[ell(-16.5,-33,5.5,3.6),'iron',1.8]], pauldronAt:[-16,-33], pauldronR:[[ell(16.5,-33,5.5,3.6),'iron',1.8]],
      cloth:[['M-5.5 -14 L5.5 -14 L6.5 -4.5 Q0 -2.5 -6.5 -4.5z','cloth',1.6]],
      fist:fist(17,-21,3.4,3.1,1.8), handAt:[17,-21], handGap:3,
      headY:0, legK:1, weapons:['axe','club','sword'], weapon:'axe', px:48
    },
    düster:{
      H:66, shadow:[[ell(0,1.5,15,2.6),'shadowC',0]],
      leg:[['M-9.5 -12 L-8.5 0 L-3 0 L-3.5 -12z','leg',1.8],['M-9.2 -2.6 L-2.8 -2.6 L-2.8 0 L-9.3 0z','foot',1.2],['M-6.2 -12 L-5.6 0 L-3 0 L-3.5 -12z','shade',0]], hip:[-7,-12],
      body:[['M-13 -13 L-14.5 -26 L-16.5 -35 L-11 -39.5 L11 -39.5 L16.5 -35 L14.5 -26 L13 -13 Q0 -10.5 -13 -13z','skin',1.8],['M5.5 -39.5 L11 -39.5 L16.5 -35 L14.5 -26 L13 -13 Q9 -11.6 6.5 -11.8 L9.5 -26z','shade',0],['M-9 -31 l4 1 M-9 -27 l4 1 M9 -31 l-4 1 M9 -27 l-4 1',null,1.2,'dark']],
      belly:[['M-5 -25 L5 -25 L4 -17 L-4 -17z','light',0],['M0 -25 L0 -17',null,1,'dark']],
      belt:[['M-13.5 -16.5 L13.5 -16.5 L13 -12.5 L-13 -12.5z','belt',1.6]],
      buckle:[[ell(0,-14.6,2.6,2.3),'gold',1.2],[ell(-0.9,-14.8,0.6,0.6),'line',0],[ell(0.9,-14.8,0.6,0.6),'line',0]],
      neck:[0,-37], skull:[['M-8 -46.5 L-3 -50.5 L3 -50.5 L8 -46.5 L9.5 -40.5 L6.5 -36 L-6.5 -36 L-9.5 -40.5z','skin',1.8],['M-9.2 -41.5 L9.2 -41.5 L9.5 -40.5 L6.5 -36 L-6.5 -36 L-9.5 -40.5z','shade',0],['M3 -50.5 L8 -46.5 L9.5 -40.5 L6.5 -36 L4.5 -36 L6.5 -41 L5 -47z','shade',0]],
      scar:[['M-7.5 -46 L-2 -38.5',null,1.1,'scar']],
      mouth:[[ell(0,-33.8,6.8,2.4),'mouth',1.4],[ell(0,-33.2,3,0.9),'tongue',0]], mouthAt:[0,-33],
      jaw:[['M-10.5 -37.5 L10.5 -37.5 L9.5 -32.5 L5 -29.5 L-5 -29.5 L-9.5 -32.5z','light',1.8],['M4 -37.5 L10.5 -37.5 L9.5 -32.5 L5 -29.5 L2.5 -29.6 L6 -33z','shade',0]], jawAt:[0,-36],
      tusk:[['M-8 -33 Q-10 -38 -7.6 -43 L-6.4 -38.5 Q-6.4 -35.5 -5.8 -33z','bone',1.3]], tuskAt:[-7,-33],
      eye:[[ell(-4.3,-41.6,2.9,1.8),'glow',0],[ell(-4.3,-41.6,1.7,0.9),'eye',0]], eyeAt:[-4.3,-41.6], pupil:[[ell(-4.1,-41.6,0.4,0.8),'pupil',0]], pupilIn:0.2, lookK:0.45,
      lid:[['M-6.2 -41.6 l3.8 0',null,1.4,'line']],
      brow:[['M-9 -44.6 L-1.6 -42.6 L-1.8 -44.2 L-8.6 -46.6z','brow',0]], browAt:[-5,-44],
      helmet:[['M-9.5 -44.5 L-8.5 -50.5 L-3 -53.5 L3 -53.5 L8.5 -50.5 L9.5 -44.5 L4 -45.5 L0 -44 L-4 -45.5z','iron',1.6],['M-8.5 -50.5 Q-15 -52.5 -17 -61 Q-11.5 -56 -6 -52.5z','bone',1.4],['M8.5 -50.5 Q15 -52.5 17 -61 Q11.5 -56 6 -52.5z','bone',1.4],['M-0.6 -53 L0.6 -53 L0.6 -46 L-0.6 -46z','ironDark',0],['M3 -53.5 L8.5 -50.5 L9.5 -44.5 L4 -45.5z','shade',0]],
      chest:[['M-12 -37 L12 -37 L10.5 -21 L0 -17.5 L-10.5 -21z','iron',1.6],['M0 -36.5 L0 -18.5',null,1,'ironDark'],['M-8 -33 L-6 -27 M7 -34 L8 -29',null,1,'rust'],['M0 -37 L12 -37 L10.5 -21 L0 -17.5z','shade',0]],
      pauldron:[['M-18 -35.5 L-11.5 -40.5 L-9 -34.5 L-13 -30 L-18.5 -31.5z','iron',1.6],['M-15.5 -38.5 L-21 -46 L-13 -39.5z','ironDark',1.2]], pauldronAt:[-14,-35],
      cloth:[['M-6 -13 L6 -13 L7 -3 L5 -5.5 L3 -1.5 L1 -4.5 L-1 -0.5 L-3 -4.5 L-5 -1.5 L-7 -4.5z','cloth',1.4]],
      fist:fist(17,-21,3.4,3.1,1.6), handAt:[17,-21], handGap:3,
      axe:[['M23 -5 L24.6 -5 L24.6 -44 L23 -44z','wood',1.4],['M24.6 -43 L35 -47 L33 -40 L36 -34 L33 -27 L24.6 -30z','iron',1.4],['M30 -44 L31 -41 M33 -33 L31.5 -31',null,1,'rust']],
      headY:1.6, legK:1.15, weapons:['axe','club','sword'], weapon:'axe', px:48
    } },
    imp:{ düster:{
      // small and bent: a big head with ears and horns, eye pits with a glowing spark, a grin with fangs, thin limbs, a tail, a sack on the back, a pick in the claw
      H:50, shadow:[[ell(0,1.2,10,2),'shadowC',0]],
      leg:[['M-6 -10 L-5.4 -3.2 L-7 0 L-2.4 0 L-3 -3.2 L-2.6 -10z','leg',1.4],['M-7.6 0 l1 -1.6 M-5.4 0 l0.6 -1.8 M-3.2 0 l0.4 -1.6',null,1,'bone'],['M-4.2 -10 L-3.8 -3.2 L-3 -3.2 L-2.6 -10z','shade',0]], hip:[-4.3,-10],
      body:[['M-8 -10 Q-10.5 -18 -7.5 -24 Q0 -28 7.5 -24 Q10.5 -18 8 -10 Q0 -7.5 -8 -10z','skin',1.5],['M3 -26.5 Q7.5 -25 9.5 -19 Q10 -13 8 -10 Q6 -9 4.5 -9 Q7 -16 3 -26.5z','shade',0],['M-6 -20 l3 0.8 M-6 -17 l3 0.8 M6 -20 l-3 0.8 M6 -17 l-3 0.8',null,1,'dark']],
      belly:[['M-4 -17.5 Q0 -14 4 -17.5 Q3 -11.5 0 -11 Q-3 -11.5 -4 -17.5z','light',0]],
      belt:[['M-8.6 -12.4 Q0 -9.6 8.6 -12.4',null,1.6,'belt']], buckle:[[ell(-4.4,-10.6,1.9,1.7),'leather',1.1]],
      neck:[0,-25], skull:[['M-10 -33 Q-11 -42 -4 -45 Q0 -46 4 -45 Q11 -42 10 -33 Q8 -26 0 -25.5 Q-8 -26 -10 -33z','skin',1.6],['M-6 -43.4 Q-8.4 -48 -6.4 -51.5 Q-5 -47.5 -3.4 -44.8z','bone',1.2],['M6 -43.4 Q8.4 -48 6.4 -51.5 Q5 -47.5 3.4 -44.8z','bone',1.2],['M4 -45 Q11 -42 10 -33 Q8 -26 2 -25.6 Q7 -31 6.5 -38 Q6 -43 4 -45z','shade',0]],
      scar:[['M5.5 -42 L8.5 -36',null,1,'scar']],
      ear:[['M-9.6 -38.4 L-18 -42.4 L-10.2 -32.6z','skin',1.4],['M-10.6 -37.4 L-15.2 -40 L-10.8 -34.4z','dark',0]], earAt:[-9.8,-36],
      mouth:[[ell(0,-29,4.4,2.2),'mouth',1.2]], mouthAt:[0,-29],
      jaw:[['M-5.6 -30 Q0 -26.6 5.6 -30',null,1.4,'line'],['M-3.2 -29 l0.8 2.2 l0.8 -2z','bone',0.8],['M3.2 -29 l-0.8 2.2 l-0.8 -2z','bone',0.8]], jawAt:[0,-29],
      eye:[[ell(-4,-35.6,3.1,3.5),'socket',0]], eyeAt:[-4,-35.6], pupil:[[ell(-3.7,-35.2,1.7,1.7),'glow',0],[ell(-3.7,-35.2,0.85,0.85),'eye',0]], pupilIn:0.3, lookK:0.9,
      lid:[['M-7 -35.6 q3 1.4 6 0',null,1.3,'line']],
      brow:[['M-7.6 -39.8 L-1.4 -38.2 L-1.6 -39.4 L-7.2 -41.4z','brow',0]], browAt:[-4.5,-39.6],
      tail:[['M2.5 -12 Q12 -9 14 -16 Q15.4 -21.6 19.6 -21',null,2.4,'line'],['M2.5 -12 Q12 -9 14 -16 Q15.4 -21.6 19.6 -21',null,1.3,'skin'],['M18.6 -23.6 L23 -20.4 L18.2 -18.8z','dark',1]], tailAt:[2.5,-12],
      sack:[['M-13.5 -21 Q-17 -31 -10 -35.4 Q-4 -36.6 -3.2 -29.6 L-5.6 -21.4z','sack',1.4],['M-11.2 -35 l2 -2.6 l1.6 2.4',null,1.2,'sackDark'],['M-12.4 -27 q2.4 1.4 5 0',null,1,'sackDark']], sackAt:[-8,-24],
      load:{ gold:[[ell(-9.6,-32.2,1.2,1),'gold',0.6],[ell(-7.4,-31,1,0.9),'gold',0.6]], ore:[['M-10.8 -33 l2 -1.2 l1.4 1.6 l-1.8 1.2z','ore',0.6]] },
      cloth:[['M-4.6 -11 L4.6 -11 L5.4 -4.4 L3.6 -5.8 L2 -3 L0 -5.2 L-2 -3 L-3.6 -5.8 L-5.4 -4.4z','cloth',1.1]],
      fist:fist(12,-16,2.6,2.4,1.3), handAt:[12,-16], handGap:2,
      headY:0, legK:1, weapons:['pick','club'], weapon:'pick', px:24
    } }
  };
  // the imp as a beast (user, November 2026): no ears, no horns, no mouth, the head sunk between the shoulders; the eyes, the tail, the sack and the pick stay
  { const I=SHAPES.imp.düster; SHAPES.imp.bestie=Object.assign({},I,{ skull:[I.skull[0],I.skull[3]], ear:null, scar:null, mouth:[], jaw:[], headY:5.5 }); PAL.imp.bestie=PAL.imp.düster; }
  // tools and weapons any kind can hold (the ork's axe is its own, per style)
  const WEAPONS={
    club:[['M22 -6 L25 -6 L28.5 -37 Q24 -45 18.5 -37z','wood',1.6],['M19 -36 l-3 -1 M28 -36 l3 -1 M20.5 -30 l-3 0 M27 -30 l3 0',null,1.4,'ironDark']],
    sword:[['M23.2 -15 L24.8 -15 L24.8 -45 L24 -48 L23.2 -45z','iron',1.3],['M19.5 -15 L28.5 -15 L28.5 -13 L19.5 -13z','ironDark',1.2],['M23.2 -13 L24.8 -13 L24.8 -7 L23.2 -7z','wood',1]],
    pick:[['M23.2 -4 L24.8 -4 L24.8 -30 L23.2 -30z','wood',1.2],['M15 -29 Q24 -34.4 33 -29 L33 -27.4 Q24 -31.6 15 -27.4z','iron',1.2]]
  };
  // where each is held (its grip, in its own coordinates)
  const GRIP={ axe:[24,-15], club:[23.5,-12], sword:[24,-10], pick:[24,-12] };
  // ---- a spec: kind, style, stats 0..1, gear, hue shift, scar; the seed rolls one ----
  function rng(seed){ let a=seed>>>0||1; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  const stylesOf=kind=>Object.keys(SHAPES[kind]||SHAPES.ork);
  function roll(seed,kind){
    const r=rng(seed), pick=a=>a[Math.floor(r()*a.length)]; kind=kind||'ork'; const st=pick(stylesOf(kind)), S=SHAPES[kind][st];
    return { kind, style:st, traits:{ klug:r(), stark:r(), flink:r(), wild:r() }, hue:(r()*2-1)*(kind==='imp'?12:22), scar:r()<0.4,
      gear:{ helmet:r()<0.5, chest:r()<0.5, pauldrons:r()<0.45, cloth:r()<0.6, weapon:pick(['none'].concat(S.weapons)), hands:true, load:pick(['none','gold','ore']) }, seed };
  }
  function defaults(kind){
    const S=SHAPES[kind]&&SHAPES[kind].düster;
    return { kind, style:'düster', traits:{ klug:0.5, stark:0.5, flink:0.5, wild:0.5 }, hue:0, scar:kind!=='imp', gear:{ helmet:true, chest:false, pauldrons:true, cloth:true, weapon:S?S.weapon:'none', hands:true, load:'gold' } };
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
  function build(spec){
    const kind=(spec&&spec.kind)||'ork'; spec=Object.assign({},defaults(kind),spec||{}); spec.kind=kind;
    if(!SHAPES[kind][spec.style]) spec.style=stylesOf(kind)[0];
    const S=SHAPES[kind][spec.style], t=Object.assign({},defaults(kind).traits,spec.traits), G=Object.assign({},defaults(kind).gear,spec.gear);
    const pal=Object.assign({ shadowC:'rgba(0,0,0,0.35)' },PAL[kind][spec.style]); SKIN_KEYS.forEach(k=>{ pal[k]=hueShift(pal[k],spec.hue); });
    const armoured=!!(G.pauldrons&&S.pauldron); pal.hand=armoured?pal.iron:pal.skin; pal.handLine=armoured?pal.ironDark:pal.dark;       // the hands: skin, or armour with the shoulder plates
    const P=(id,pivot,shapes,kids)=>({ id, pivot, shapes:shapes||[], kids:(kids||[]).filter(Boolean) });
    const mirrorShapes=sh=>sh.map(([d,f,w,st])=>[mirror(d),f,w,st]);
    const shiftX=(sh,dx)=>sh.map(([d,f,w,st])=>[d.replace(/^M(-?[\d.]+)/,(m0,x)=>'M'+(parseFloat(x)+dx).toFixed(2)),f,w,st]);       // ellipses moved over keep their shape
    const ex=S.eyeAt, br=S.browAt, R=v=>[-v[0],v[1]];
    const headKids=[
      P('skull',[0,S.neck[1]-4],S.skull,[spec.scar&&S.scar?P('scar',[0,S.neck[1]-7],S.scar):null,
        S.ear?P('earL',S.earAt,S.ear):null, S.ear?P('earR',R(S.earAt),mirrorShapes(S.ear)):null]),
      G.helmet&&S.helmet?P('helmet',[0,S.neck[1]-8],S.helmet):null,
      P('mouth',S.mouthAt,S.mouth),
      P('jaw',S.jawAt,S.jaw,S.tusk?[P('tuskL',S.tuskAt,S.tusk),P('tuskR',R(S.tuskAt),mirrorShapes(S.tusk))]:[]),
      P('eyeL',ex,S.eye,[P('pupilL',ex,S.pupil)]),
      P('eyeR',R(ex),shiftX(S.eye,-2*ex[0]),[P('pupilR',R(ex),shiftX(S.pupil,-2*ex[0]-2*(S.pupilIn||0)))]),
      P('lidL',ex,S.lid), P('lidR',R(ex),mirrorShapes(S.lid)),
      P('browL',br,S.brow), P('browR',R(br),mirrorShapes(S.brow))
    ];
    const bodyKids=[
      P('belly',[0,-20],S.belly), G.chest&&S.chest?P('chest',[0,-28],S.chest):null,
      G.cloth&&S.cloth?P('cloth',[0,-14],S.cloth):null,
      P('belt',[0,-14],S.belt), P('buckle',[0,-14],S.buckle),
      G.pauldrons&&S.pauldron?P('pauldronL',S.pauldronAt,S.pauldron):null, G.pauldrons&&S.pauldron?P('pauldronR',R(S.pauldronAt),S.pauldronR||mirrorShapes(S.pauldron)):null,
      P('head',S.neck,[],headKids)
    ];
    // the weapon or tool: held by the right hand (its grip in the fist, the fist drawn over the haft), or, without hands, floating beside it
    const hands=G.hands!==false, wName=G.weapon&&G.weapon!=='none'?G.weapon:null, wShapes=wName?((wName==='axe'&&S.axe)||WEAPONS[wName]||SHAPES.ork.düster.axe):null, grip=GRIP[wName]||[24,-16], ha=S.handAt;
    const weapon=wShapes?P('weapon',hands?grip:[24,-22],wShapes):null;
    const handKids=hands?[P('handL',R(ha),[],[P('fistL',R(ha),mirrorShapes(S.fist))]),P('handR',ha,[],[weapon,P('fistR',ha,S.fist)])]:[weapon];
    const sack=S.sack&&G.load&&G.load!=='none'?P('sack',S.sackAt,S.sack.concat(S.load[G.load]||[])):null;
    const tree=P('root',[0,0],[],[P('shadow',[0,0],S.shadow), S.tail?P('tail',S.tailAt,S.tail):null, sack,
      P('legL',S.hip,S.leg),P('legR',R(S.hip),mirrorShapes(S.leg)),P('body',[0,S.hip[1]],S.body,bodyKids)].concat(handKids));
    // the stats as proportions
    const ls=(0.85+0.45*t.flink)*S.legK, bw=(0.85+0.4*t.stark)*(1.1-0.2*t.flink), hs=0.85+0.45*t.klug, js=1.15-0.35*t.klug, ts=0.6+0.9*t.wild, ps=0.8+0.4*t.stark;
    const hip=-S.hip[1], lift=-(hip*ls-hip), half=Math.abs(ha[0]);
    const base={
      shadow:{ sx:bw }, legL:{ x:-(bw-1)*Math.abs(S.hip[0])*0.7, y:lift, sy:ls }, legR:{ x:(bw-1)*Math.abs(S.hip[0])*0.7, y:lift, sy:ls }, body:{ y:lift, sx:bw },
      head:{ y:S.headY, sx:hs/bw, sy:hs }, jaw:{ sx:js, sy:js }, tuskL:{ sy:ts }, tuskR:{ sy:ts }, pauldronL:{ sx:ps, sy:ps }, pauldronR:{ sx:ps, sy:ps },
      sack:{ y:lift }, tail:{ y:lift },
      handL:{ x:-(bw-1)*half-S.handGap, y:lift, sx:1.15, sy:1.15 }, handR:{ x:(bw-1)*half+S.handGap, y:lift, sx:1.15, sy:1.15 },       // a gap between body and hand: they float
      weapon:hands?{ x:ha[0]-grip[0], y:ha[1]-grip[1], r:12 }:{ x:(bw-1)*16-5, y:lift }
    };
    return { tree, base, pal, spec, hands, H:S.H, px:S.px||48, has:{ helmet:!!S.helmet, chest:!!S.chest, pauldrons:!!S.pauldron, load:!!S.sack }, lookK:S.lookK, browBase:(t.wild-0.5)*14 };
  }
  // how far a part moves sideways when the ork half turns (turn -1 .. 1): the face more than the skull, so the flat figure seems to turn
  const TURN={ skull:0.6, earL:0.6, earR:0.6, helmet:0.7, mouth:1.4, jaw:1.4, eyeL:2.2, eyeR:2.2, lidL:2.2, lidR:2.2, browL:2.2, browR:2.2, belly:1.6, chest:1.0, cloth:1.1, buckle:2.2 };
  // the parts pulled apart (the "parts" view): where each one drifts
  const EXPLODE={ legL:[-6,6], legR:[6,6], belly:[0,4], belt:[0,7], buckle:[0,11], cloth:[0,14], chest:[0,-4], head:[0,-10], skull:[0,-5], helmet:[0,-14], jaw:[0,7], mouth:[0,3], eyeL:[-5,-3], eyeR:[5,-3], lidL:[-5,-3], lidR:[5,-3], browL:[-7,-8], browR:[7,-8], pupilL:[-1.5,0], pupilR:[1.5,0], pauldronL:[-9,-4], pauldronR:[9,-4], handL:[-9,2], handR:[9,2], weapon:[6,-4], earL:[-6,-2], earR:[6,-2], tail:[8,2], sack:[-8,-4] };
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
    put('earL',{ r:-3*Math.sin(s.t*1.1)-14*twitch+6*roar }); put('earR',{ r:3*Math.sin(s.t*1.1)+14*twitch-6*roar });
    put('tail',{ r:Math.sin(s.t*2.3)*9+Math.sin(w)*6*walkK+roar*Math.sin(s.t*30)*6 });
    put('sack',{ y:-1.1*Math.abs(Math.sin(w-0.4))+0.3*breath, r:-2*Math.sin(w)*walkK });
    // the floating hands: they swing against each other while it walks (as arms would), bob a little behind the body, go up when it roars
    put('handL',{ x:s.turn*1.2-0.6*Math.sin(w)*walkK, y:1.6*Math.sin(w)*walkK-1.1*Math.abs(Math.sin(w+0.7))*walkK+Math.sin(s.t*2+1)*0.6-6*roar, r:-8*Math.sin(w)*walkK+12*roar });
    put('handR',{ x:s.turn*1.2+0.6*Math.sin(w)*walkK-2*roar, y:-1.6*Math.sin(w)*walkK-1.1*Math.abs(Math.sin(w+0.7))*walkK+Math.sin(s.t*2)*0.6-9*roar, r:8*Math.sin(w)*walkK-14*roar });
    put('weapon',rig.hands?{ r:Math.sin(s.t*1.3)*3-roar*48 }:{ x:-s.turn, y:Math.sin(s.t*2)*0.8-Math.abs(Math.sin(w))*0.6*walkK, r:Math.sin(s.t*1.3)*4-roar*40 });
    const closed=s.blink>0?1:0, k=rig.lookK||1;
    ['L','R'].forEach(sd=>{ put('eye'+sd,{ x:turnOf('eye'+sd), sy:1-0.9*closed+(roar?0.15:0) }); put('pupil'+sd,{ x:s.look[0]*k, y:s.look[1]*k*0.6, a:closed?0:1 }); put('lid'+sd,{ x:turnOf('lid'+sd), a:closed }); });
    put('browL',{ x:turnOf('browL'), y:s.moodK[1], r:s.moodK[0]+rig.browBase }); put('browR',{ x:turnOf('browR'), y:s.moodK[1], r:-s.moodK[0]-rig.browBase });
    // the resting transform of the values, then the parts view on top
    Object.keys(rig.base).forEach(id=>{ const b=rig.base[id]; if(!P[id]) put(id,{}); const v=P[id]; v.x+=b.x||0; v.y+=b.y||0; v.r+=b.r||0; v.sx*=b.sx||1; v.sy*=b.sy||1; });
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
  return { build, roll, defaults, create, step, pose, svg, canvas, MOODS, KINDS:Object.keys(SHAPES), stylesOf, weaponsOf:(kind,style)=>(SHAPES[kind][style]||SHAPES[kind][stylesOf(kind)[0]]).weapons };
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
.orkv-stage canvas[hidden]{ display:none }
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
  const KIND_NAME={ ork:'Ork', imp:'Imp' }, STYLE_NAME={ düster:'Düster', klassisch:'Klassisch', bestie:'Bestie' }, WEAPON_NAME={ none:'keine', axe:'Axt', club:'Keule', sword:'Schwert', pick:'Spitzhacke' };
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
  <label for="orkvKind">Art</label><select id="orkvKind">${SvgRig.KINDS.map(k=>`<option value="${k}">${KIND_NAME[k]||k}</option>`).join('')}</select>
  <label for="orkvStyle">Stil</label><select id="orkvStyle"></select>
  <button id="orkvRoll">Würfeln</button>
  <button id="orkvWalk" aria-pressed="true">Auf und ab</button>
  <button id="orkvMouse" aria-pressed="false">Schaut zur Maus</button>
  <button id="orkvBlink">Blinzeln</button>
  <button id="orkvRoar">Brüllen</button>
  <button id="orkvParts" aria-pressed="false">Einzelteile</button>
</div>
<div class="orkv-row"><span class="orkv-group">Werte</span>${TRAITS.map(([k,n,what])=>`<label class="orkv-slider" for="orkvT_${k}">${n} <small>(${what})</small><input type="range" id="orkvT_${k}" min="0" max="100" value="50"></label>`).join('')}</div>
<div class="orkv-row"><span class="orkv-group">Ausrüstung</span>
  <label for="orkvWeapon">Waffe</label><select id="orkvWeapon"></select>
  <label for="orkvLoad" data-for="load">Last</label><select id="orkvLoad" data-for="load"><option value="none">keine</option><option value="gold">Gold</option><option value="ore">Erz</option></select>
  <button id="orkvG_hands" aria-pressed="false">Hände</button><button id="orkvG_helmet" aria-pressed="false">Helm</button><button id="orkvG_chest" aria-pressed="false">Brustpanzer</button><button id="orkvG_pauldrons" aria-pressed="false">Schulterplatten</button><button id="orkvG_cloth" aria-pressed="false">Lendenschurz</button><button id="orkvScar" aria-pressed="false">Narbe</button>
</div>
<div class="orkv-row">
  <label for="orkvMood">Stimmung</label><select id="orkvMood">${Object.keys(SvgRig.MOODS).map(m=>`<option value="${m}">${m}</option>`).join('')}</select>
  <label for="orkvFx">Nachbearbeitung</label><select id="orkvFx"><option value="vector">Vektor (SVG)</option><option value="boil">Wackel-Linie</option><option value="pixel">Pixel</option><option value="smooth" selected>Pixel, glatt hochgerechnet</option><option value="soft">Weich</option></select>
  <label for="orkvRes">Pixelgröße</label><select id="orkvRes"><option value="24">24 px</option><option value="32">32 px</option><option value="48" selected>48 px</option><option value="64">64 px</option><option value="128">128 px</option></select>
</div>
<div class="orkv-sprites" id="orkvSprites" aria-label="Der Ork als Sprite von 16 bis 128 Pixeln"></div>
<p class="orkv-note">Ein Baukasten statt einer Zeichnung: zwei Stile mit denselben Teilen und Bewegungen. Die Werte formen den Körper (Klugheit: größerer Kopf und kleinerer Kiefer, Stärke: breiter, Gewandtheit: längere Beine und schlanker, Wildheit: längere Hauer und finsterere Brauen). „Würfeln“ zieht aus einem Seed Stil, Werte, Hautton, Narbe und Ausrüstung. Die Ausrüstung hängt an den Körperteilen und macht jede Bewegung mit. Die Hände schweben ohne Arme neben dem Körper und halten die Waffe; ohne Hände schwebt die Waffe allein. Unten derselbe Ork als Sprite, in der gewählten Nachbearbeitung.</p>`;
    const $=id=>root.querySelector('#'+id), stage=$('orkvStage'), svgEl=$('orkvSvg'), cv=$('orkvCanvas'), turb=$('orkvTurb');
    let spec=SvgRig.defaults('ork'), rig, out;
    const s=SvgRig.create(), opt={ walk:true, mouse:null, followMouse:false, explode:false, fx:'smooth', res:48 };
    // the controls show the spec; a change rebuilds the rig
    // the choices follow the kind: its styles, its weapons and tools, the gear it can wear, a load for those who carry one
    const fill=(sel,list,names)=>{ sel.innerHTML=list.map(v=>`<option value="${v}">${names[v]||v}</option>`).join(''); };
    const show=()=>{ $('orkvKind').value=spec.kind; fill($('orkvStyle'),SvgRig.stylesOf(spec.kind),STYLE_NAME); $('orkvStyle').value=rig.spec.style;
      fill($('orkvWeapon'),['none'].concat(SvgRig.weaponsOf(spec.kind,rig.spec.style)),WEAPON_NAME);
      ['helmet','chest','pauldrons'].forEach(k=>{ $('orkvG_'+k).hidden=!rig.has[k]; });
      root.querySelectorAll('[data-for="load"]').forEach(e=>{ e.hidden=!rig.has.load; }); $('orkvLoad').value=spec.gear.load||'none'; TRAITS.forEach(([k])=>{ $('orkvT_'+k).value=Math.round(spec.traits[k]*100); }); $('orkvWeapon').value=spec.gear.weapon;
      ['helmet','chest','pauldrons','cloth'].forEach(k=>$('orkvG_'+k).setAttribute('aria-pressed',!!spec.gear[k])); $('orkvG_hands').setAttribute('aria-pressed',spec.gear.hands!==false); $('orkvScar').setAttribute('aria-pressed',!!spec.scar); };
    const rebuild=()=>{ rig=SvgRig.build(spec); out=SvgRig.svg($('orkvRig'),rig); show(); };
    rebuild();
    $('orkvKind').addEventListener('change',e=>{ spec=SvgRig.defaults(e.target.value); rebuild(); opt.res=rig.px; $('orkvRes').value=String(rig.px); });       // each kind its own pixel size (the user: the imp at 24, the ork at 48)
    $('orkvStyle').addEventListener('change',e=>{ spec.style=e.target.value; rebuild(); });
    $('orkvLoad').addEventListener('change',e=>{ spec.gear.load=e.target.value; rebuild(); });
    TRAITS.forEach(([k])=>$('orkvT_'+k).addEventListener('input',e=>{ spec.traits[k]=e.target.value/100; rebuild(); }));
    $('orkvWeapon').addEventListener('change',e=>{ spec.gear.weapon=e.target.value; rebuild(); });
    ['helmet','chest','pauldrons','cloth'].forEach(k=>$('orkvG_'+k).addEventListener('click',()=>{ spec.gear[k]=!spec.gear[k]; rebuild(); }));
    $('orkvG_hands').addEventListener('click',()=>{ spec.gear.hands=spec.gear.hands===false; rebuild(); });
    $('orkvScar').addEventListener('click',()=>{ spec.scar=!spec.scar; rebuild(); });
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
