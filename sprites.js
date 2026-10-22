// Shared creature sprite generators (16x16, flat, code-based). Used by the game (index.html) and the 3D test.
// ZOO[key] = { name, pal, frame(t, facingRight, moving) } -> { g: 16x16 char grid } ('.' = empty, 'k' = ground shadow).
// Extracted from zoo-humanoid.html, skelett-familie.html and zoo-bestien.html (those stay the design playground).
const ZOO=(()=>{
const ZOO={}, BASEPAL={ p:'#14100c', e:'#ffffff', w:'#f2e8d5', k:'rgba(0,0,0,0.30)' };

// ---- humanoids: held, ork, warlock (native facing: left) ----
(()=>{
const N=16;
const mk=(w,h)=>({w,h,g:Array.from({length:h},()=>Array(w).fill('.'))});
const put=(p,x,y,c)=>{ if(x>=0&&y>=0&&x<p.w&&y<p.h) p.g[y][x]=c; };
function ell(p,cx,cy,rx,ry,c){ for(let y=0;y<p.h;y++) for(let x=0;x<p.w;x++){ const dx=(x+.5-cx)/rx, dy=(y+.5-cy)/ry; if(dx*dx+dy*dy<=1) put(p,x,y,c); } }
function cap(p,x0,y0,x1,y1,r,c){ for(let y=0;y<p.h;y++) for(let x=0;x<p.w;x++){ const px=x+.5,py=y+.5,vx=x1-x0,vy=y1-y0,L=vx*vx+vy*vy||1; let t=((px-x0)*vx+(py-y0)*vy)/L; t=Math.max(0,Math.min(1,t)); const dx=px-(x0+vx*t),dy=py-(y0+vy*t); if(dx*dx+dy*dy<=r*r) put(p,x,y,c); } }
function shade(p,base,light,dark){ const at=(x,y)=>(x<0||y<0||x>=p.w||y>=p.h)?'.':p.g[y][x], o=p.g.map(r=>r.slice());
  for(let y=0;y<p.h;y++) for(let x=0;x<p.w;x++) if(p.g[y][x]===base){ if(at(x,y+1)==='.'||at(x+1,y)==='.') o[y][x]=dark; else if(at(x,y-1)==='.'||(at(x-1,y)==='.'&&y<p.h/2)) o[y][x]=light; }
  p.g=o; return p; }
function blit(dst,part,ox,oy){ for(let y=0;y<part.h;y++) for(let x=0;x<part.w;x++){ const c=part.g[y][x]; if(c!=='.') put(dst,ox+x,oy+y,c); } }
// eyes: black with a white pupil (size set per creature)
function eyes(p,list){ list.forEach(([x,y,w,h,px,py])=>{ for(let j=0;j<h;j++) for(let i=0;i<w;i++) put(p,x+i,y+j,'p'); put(p,px,py,'e'); }); }

// good creatures: white eyes with a black pupil on the front side (evil ones keep black eyes with white pupils)
function eyesGood2(p,list){ list.forEach(([x,y])=>{ for(let j=0;j<2;j++) for(let i=0;i<2;i++) put(p,x+i,y+j,'e'); put(p,x,y,'p'); put(p,x,y+1,'p'); }); }
function eyesGood(p,list){ list.forEach(([x,y,w,h])=>{ for(let j=0;j<h;j++) for(let i=0;i<w;i++) put(p,x+i,y+j,'e'); put(p,x,y+1,'p'); put(p,x,y+2,'p'); }); }
function skullPart(small){
  const sk=mk(7,6); ell(sk,3.5,2.7,3.2,2.7,'s'); shade(sk,'s','S','z');
  eyes(sk,[[1,2,2,2,1,2],[4,2,2,2,4,2]]); put(sk,3,4,'p'); [1,2,3,4,5].forEach((x,i)=>put(sk,x,5,i%2?'p':'w')); return sk;
}
// ---------- creatures: each returns its parts, the code poses them ----------
const CREATURES={
 held:{ name:'Held', note:'Kleine weiße Augen mit schwarzer Pupille, strenge Braue, Nase, eckiger Kiefer, blonder Schopf, breite Schultern, Gürtel. Entschlossen statt niedlich.',
  pal:{s:'#e0b48c',S:'#f2cfa8',z:'#b88a62',F:'#e8c04a',G:'#f6dc7a',g:'#8a5a28',t:'#3b6fb6',T:'#5a8ad0',u:'#274a80',y:'#d4af37',l:'#7a5a3c',L:'#9a7650',m:'#4e3a26',b:'#4e3a26'},
  parts(){
   const head=mk(9,8); ell(head,4.6,3.6,3.9,3.4,'s'); for(let y=5;y<=7;y++) for(let x=1;x<=5;x++) put(head,x,y,'s'); put(head,0,4,'s'); put(head,0,5,'s'); shade(head,'s','S','z');
   for(let y=0;y<8;y++) for(let x=0;x<9;x++) if(head.g[y][x]!=='.'&&(y<=2||(x>=6&&y<=4))) head.g[y][x]=(y<=0||x<=3)?'G':'F';
   eyesGood2(head,[[1,3]]); put(head,1,2,'g'); put(head,2,2,'g'); put(head,3,2,'g');
   const torso=mk(9,7); ell(torso,4.5,3.5,4.3,3.3,'t'); shade(torso,'t','T','u'); for(let x=0;x<9;x++) if(torso.g[4][x]!=='.') torso.g[4][x]='u'; put(torso,3,4,'y');
   const leg=mk(3,4); cap(leg,1.5,0.6,1.5,3.0,1.1,'l'); shade(leg,'l','L','m'); put(leg,0,3,'b'); put(leg,1,3,'b'); put(leg,2,3,'b'); put(leg,0,2,'b'); put(leg,1,2,'b');
   return {head,torso,leg,hx:3,hy:0,tx:3,ty:5,lyBack:11,lxBack:9,lxFront:5,ly:11};
  } },
 ork:{ name:'Ork', note:'Kleiner Kopf über breiten Schultern, gewaltiger Kiefer mit L-förmigem Hauer, mächtiger Bauch, jetzt aufrechter.',
  pal:{s:'#5f8f3a',S:'#86b05a',z:'#3d6224',t:'#5f8f3a',T:'#86b05a',u:'#3d6224',c:'#6b4a35',C:'#8a6446',l:'#4e6b30',L:'#6a8c42',y:'#324a20'},
  parts(){
   const head=mk(8,7); ell(head,4,3.0,3.1,2.7,'s'); ell(head,2.4,4.6,2.3,1.5,'s'); shade(head,'s','S','z'); [[1,3],[1,4],[2,4]].forEach(([x,y])=>put(head,x,y,'w')); eyes(head,[[2,1,2,2,2,1]]);
   const torso=mk(10,8); ell(torso,5,4.0,4.3,3.7,'t'); ell(torso,4.2,4.8,2.0,2.0,'T'); shade(torso,'t','T','u'); for(let x=1;x<9;x++) if(torso.g[6][x]!=='.') torso.g[6][x]='c';
   const leg=mk(4,4); cap(leg,2,0.6,2,3.0,1.5,'l'); shade(leg,'l','L','y');
   return {head,torso,leg,hx:2,hy:0,tx:3,ty:4,lxBack:9,lxFront:4,ly:11,lyBack:11};
  } },
 warlock:{ name:'Warlock', note:'Spitze Kapuze, das Gesicht ein schwarzes Nichts mit zwei weißen Punkten. Die Robe ersetzt die Beine.',
  pal:{v:'#7b4bb0',V:'#9a6ad0',x:'#4a2a70',s:'#14100c',R:'#2f1a48'},
  parts(){
   const hood=mk(9,9); ell(hood,4.8,5.2,3.9,3.7,'v'); ell(hood,6.6,2.0,1.7,2.0,'v'); put(hood,7,0,'v'); shade(hood,'v','V','x');
   for(let y=3;y<=7;y++) for(let x=0;x<=4;x++){ const dx=(x+.5-2.9)/2.4, dy=(y+.5-5.2)/2.6; if(dx*dx+dy*dy<=1) put(hood,x,y,'p'); }
   put(hood,1,4,'e'); put(hood,1,5,'e'); put(hood,3,4,'e'); put(hood,3,5,'e');
   const robe=mk(9,9); for(let y=0;y<9;y++){ const hw=2.3+y*0.38; for(let x=0;x<9;x++) if(Math.abs(x+.5-4.5)<=hw) put(robe,x,y,'v'); }
   shade(robe,'v','V','x'); for(let x=0;x<9;x++) if(robe.g[8][x]!=='.') robe.g[8][x]='x';
   return {hood,robe,hx:2,hy:0,rx:3,ry:6};
  } },
 skelA:{ name:'Skelett A · Schwebend', note:'Schädel, Rippenkorb und Becken schweben mit Lücken übereinander, wie von einem unsichtbaren Faden gehalten. Stockbeine.',
  pal:{s:'#e8dcc8',S:'#faf3e4',z:'#b8ab94',u:'#8f836f'},
  parts(){ return { compose(f,a){
   const skull=skullPart(); const ribs=mk(8,5); ell(ribs,4,2.5,3.8,2.4,'s'); shade(ribs,'s','S','z'); [1,3].forEach(y=>{ for(let x=2;x<=5;x++) if(ribs.g[y][x]!=='.') ribs.g[y][x]='u'; });
   const pelvis=mk(6,2); ell(pelvis,3,1,2.9,1.0,'s'); shade(pelvis,'s','S','z');
   [[6+a.ff,12],[9+a.fb,12]].forEach(([x,y])=>{ for(let j=0;j<3;j++) put(f,x,y+j,'z'); put(f,x,y+2,'s'); });
   blit(f,pelvis,5,11+a.bob); blit(f,ribs,4,6+a.bob+(a.k%2?0:0)); blit(f,skull,4,a.bob+a.nod-0);
  } }; } },
 skelB:{ name:'Skelett B · Heldenbrust', note:'Breite Schulterleiste, V-förmiger Brustkorb zur schmalen Taille, langer Eierschädel mit scharfen Wangenknochen. Aufrecht und edel.',
  pal:{s:'#e8dcc8',S:'#faf3e4',z:'#b8ab94',u:'#8f836f'},
  parts(){ return { compose(f,a){
   const skull=mk(7,8); ell(skull,3.5,3.6,3.2,3.5,'s'); put(skull,0,4,'s'); put(skull,6,4,'s'); shade(skull,'s','S','z');
   eyes(skull,[[1,2,2,2,1,2],[4,2,2,2,4,2]]); put(skull,3,4,'p'); put(skull,3,5,'p'); [2,3,4].forEach((x,i)=>put(skull,x,7,i%2?'p':'w'));
   const torso=mk(10,6); const W=[10,8,7,6,4,4]; W.forEach((w,y)=>{ const x0=Math.floor((10-w)/2); for(let x=0;x<w;x++) put(torso,x0+x,y,'s'); }); shade(torso,'s','S','z');
   [2,4].forEach(y=>{ for(let x=3;x<=6;x++) if(torso.g[y][x]!=='.') torso.g[y][x]='u'; });
   const leg=(x,y)=>{ for(let j=0;j<3;j++) put(f,x,y+j,'z'); put(f,x,y+2,'s'); };
   leg(6+a.ff,12); leg(9+a.fb,12);
   blit(f,torso,3,7+a.bob); blit(f,skull,4,a.bob+a.nod);
  } }; } },
 skelC:{ name:'Skelett C · Seelenlaterne', note:'Der Brustkorb ist ein hohler Ring, in dem noch eine goldene Seele glimmt: der gefallene Held brennt innen weiter. Kleiner Schädel, Stockbeine.',
  pal:{s:'#e8dcc8',S:'#faf3e4',z:'#b8ab94',u:'#8f836f',y:'#ffd23f',Y:'#ff9a3c'},
  parts(){ return { compose(f,a){
   const skull=skullPart(true);
   const ring=mk(10,8); ell(ring,5,4,4.8,3.9,'s'); ell(ring,5,4,3.2,2.5,'p'); shade(ring,'s','S','z');
   [3].forEach(y=>{ for(let x=2;x<=7;x++) put(ring,x,y,'u'); }); put(ring,4,4,'y'); put(ring,5,4,'y'); put(ring,5,5,'Y'); put(ring,4,5,'Y'); put(ring,5,3,'Y');
   const leg=(x,y)=>{ for(let j=0;j<3;j++) put(f,x,y+j,'z'); put(f,x,y+2,'s'); };
   leg(6+a.ff,12); leg(9+a.fb,12);
   blit(f,ring,3,6+a.bob); blit(f,skull,4,a.bob+a.nod);
  } }; } }
};

  const doc=null;
  // ---- equipment: rules on tagged pixels (head 'H', torso 'T', legs 'L'), no per-creature armour art ----
  // equip = { mat:'leder'|'bronze'|'eisen'|'stahl', helm:0-3, chest:0-3, legs:0-2, weapon:name, shield:'buckler'|'kite'|'tower' }
  const MATS={
    leder:{m:'#8a5a34',M:'#b07a4a',n:'#5a3820',W:'#8a5a34',K:'#5a3820'},
    bronze:{m:'#b87a2e',M:'#e0a64e',n:'#7a4c18',W:'#d4a04a',K:'#7a4c18'},
    eisen:{m:'#8d949c',M:'#c4cad1',n:'#575e66',W:'#c4cad1',K:'#575e66'},
    stahl:{m:'#b4c4d6',M:'#e6f0fb',n:'#6b7e92',W:'#e6f0fb',K:'#6b7e92'}
  };
  const WEAPONS={   // grip = pixel held at the anchor behind the back; 'j' = wood
    schwert:{ px:[[1,0,'W'],[1,1,'W'],[1,2,'W'],[1,3,'W'],[1,4,'W'],[1,5,'W'],[0,6,'K'],[1,6,'K'],[2,6,'K'],[1,7,'j'],[1,8,'j']], grip:[1,7] },
    axt:{ px:[[1,2,'j'],[1,3,'j'],[1,4,'j'],[1,5,'j'],[1,6,'j'],[1,7,'j'],[1,8,'j'],[2,0,'W'],[3,0,'W'],[2,1,'W'],[3,1,'W'],[2,2,'W'],[3,2,'W'],[2,3,'W']], grip:[1,7] },
    hacke:{ px:[[0,0,'W'],[1,0,'W'],[2,0,'W'],[3,0,'W'],[0,1,'W'],[3,1,'W'],[1,1,'j'],[1,2,'j'],[1,3,'j'],[1,4,'j'],[1,5,'j'],[1,6,'j'],[1,7,'j'],[1,8,'j']], grip:[1,7] },
    stab:{ px:[[0,0,'Q'],[1,0,'Q'],[2,0,'Q'],[0,1,'Q'],[1,1,'q'],[2,1,'Q'],[1,2,'Q'],[1,3,'j'],[1,4,'j'],[1,5,'j'],[1,6,'j'],[1,7,'j'],[1,8,'j']], grip:[1,6] },
    speer:{ px:[[1,0,'W'],[1,1,'W'],[1,2,'j'],[1,3,'j'],[1,4,'j'],[1,5,'j'],[1,6,'j'],[1,7,'j'],[1,8,'j'],[1,9,'j']], grip:[1,6] },
    bogen:{ px:[[1,0,'j'],[0,1,'j'],[0,2,'j'],[0,3,'j'],[0,4,'j'],[0,5,'j'],[0,6,'j'],[1,7,'j'],[1,1,'W'],[1,2,'W'],[1,3,'W'],[1,4,'W'],[1,5,'W'],[1,6,'W']], grip:[0,3] }
  };
  const SHIELDS={   // drawn in front of the chest (left side), no arm needed
    buckler:[[0,0,'m'],[1,0,'M'],[0,1,'M'],[1,1,'M'],[0,2,'n'],[1,2,'m']],
    kite:[[0,0,'M'],[1,0,'M'],[2,0,'m'],[0,1,'m'],[1,1,'M'],[2,1,'m'],[0,2,'m'],[1,2,'m'],[2,2,'n'],[1,3,'n'],[2,3,'n'],[1,4,'n']],
    tower:[[0,0,'M'],[1,0,'M'],[2,0,'M'],[0,1,'m'],[1,1,'M'],[2,1,'m'],[0,2,'m'],[1,2,'m'],[2,2,'m'],[0,3,'m'],[1,3,'M'],[2,3,'m'],[0,4,'m'],[1,4,'m'],[2,4,'n'],[0,5,'n'],[1,5,'n'],[2,5,'n']]
  };
  const bbox=(f,tag)=>{ let x0=99,x1=-1,y0=99,y1=-1; for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(f.tag[y][x]===tag){ x0=Math.min(x0,x); x1=Math.max(x1,x); y0=Math.min(y0,y); y1=Math.max(y1,y); } return {x0,x1,y0,y1}; };
  function armour(f,e){
    const H=bbox(f,'H'), T=bbox(f,'T'), L=bbox(f,'L');
    const set=(x,y,c)=>{ if(x>=0&&y>=0&&x<N&&y<N) f.g[y][x]=c; };
    if(e.helm){
      const t=e.helm;
      for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(f.tag[y][x]==='H'){
        const c=f.g[y][x]; if(c==='p'||c==='e'||c==='w') continue;
        const rel=y-H.y0, back=x>=H.x0+5;
        if(rel<=Math.min(t,3) || (t>=2&&back&&rel<=4)) f.g[y][x]=(rel===0||(x<=H.x0+3&&rel<=1))?'M':'m';
      }
      if(t>=2) for(let r=4;r<=5;r++) if(f.tag[H.y0+r]&&f.tag[H.y0+r][H.x0+4]==='H') set(H.x0+4,H.y0+r,'n');   // cheek plate
      if(t===3){ for(let x=H.x0;x<=H.x0+3;x++) if(f.tag[H.y1]&&f.tag[H.y1][x]==='H') set(x,H.y1,'n');           // jaw guard
        [[H.x1+1,H.y0],[H.x1+1,H.y0+1],[H.x1+2,H.y0+1]].forEach(([x,y])=>set(x,y,'R')); }                        // plume trails behind the helm
    }
    if(e.chest){
      const t=e.chest;
      for(let y=T.y0;y<=T.y1;y++) for(let x=T.x0;x<=T.x1;x++) if(f.tag[y][x]==='T'){
        const rel=y-T.y0;
        if(t===1&&rel>=1&&rel<=4) f.g[y][x]=rel===1?'M':(rel===4?'n':'m');
        if(t>=2) f.g[y][x]=rel<=1?'M':(rel>=5?'n':'m');
      }
      if(t>=2) set(T.x1-1,T.y0+4,'M');                                                                            // rivet
      if(t===3){ [[T.x1+1,T.y0,'M'],[T.x1+1,T.y0+1,'m'],[T.x1,T.y0-1,'M'],[T.x0-1,T.y0+1,'M'],[T.x0-1,T.y0+2,'m']].forEach(([x,y,c])=>set(x,y,c)); }   // pauldrons widen the silhouette
    }
    if(e.legs){ for(let y=L.y0;y<=L.y1;y++) for(let x=0;x<N;x++) if(f.tag[y][x]==='L'&&y>=(e.legs===1?L.y1-1:L.y1-2)) f.g[y][x]=y===L.y1?'n':'m'; }
    if(e.shield&&SHIELDS[e.shield]){ const sy=T.y0+1; SHIELDS[e.shield].forEach(([x,y,c])=>set(T.x0-3+x,sy+y,c)); }
    if(e.weapon&&WEAPONS[e.weapon]){ const wp=WEAPONS[e.weapon], ox=T.x1+2-wp.grip[0], oy=T.y0+3-wp.grip[1];
      wp.px.forEach(([x,y,c])=>{ const X=ox+x, Y=oy+y; if(X>=0&&X<N&&Y>=0&&Y<N&&f.tag[Y][X]==='') f.g[Y][X]=c; }); }
  }
  function frame(key,t,facingRight,moving,equip){
    const f=mk(N,N), P=CREATURES[key].parts(), k=t%4;
    f.tag=Array.from({length:N},()=>Array(N).fill(''));
    const tb=(part,ox,oy,tag)=>{ for(let y=0;y<part.h;y++) for(let x=0;x<part.w;x++){ const c=part.g[y][x]; if(c!=='.'&&ox+x>=0&&oy+y>=0&&ox+x<N&&oy+y<N){ f.g[oy+y][ox+x]=c; f.tag[oy+y][ox+x]=tag; } } };
    const bob=moving?[0,-1,0,-1][k]:0, ff=moving?[-1,0,1,0][k]:0, fb=-ff, nod=moving?[0,0,1,0][k]:(Math.floor(t/2)%2?1:0);
    for(let x=4;x<=12;x++) put(f,x,15,'k');
    if(key==='warlock'){ blit(f,P.robe,P.rx,P.ry+bob); put(f,P.rx+2+ff,14,'R'); put(f,P.rx+5+fb,14,'R'); blit(f,P.hood,P.hx,P.hy+bob+nod); }
    else {
      tb(P.leg,P.lxBack+fb,P.lyBack,'L'); tb(P.torso,P.tx,P.ty+bob,'T'); tb(P.leg,P.lxFront+ff,P.ly,'L'); tb(P.head,P.hx,P.hy+bob+nod,'H');
      if(equip){ armour(f,equip); f.pal={ j:'#6b4a2f', R:'#b02a2a', Q:'#9a6aff', q:'#e8d8ff', ...(MATS[equip.mat||'eisen']) }; }
    }
    if(facingRight) f.g=f.g.map(r=>r.slice().reverse());
    return f;
  }
  const HUM={ held:true, ork:true, warlock:false };
  Object.keys(HUM).forEach(key=>{ ZOO[key]={ name:CREATURES[key].name, humanoid:HUM[key], pal:{...BASEPAL,...CREATURES[key].pal}, frame:(t,fr,mv,eq)=>frame(key,t,fr,mv,eq) }; });
})();

// ---- skeleton (native facing: front, symmetric) ----
(()=>{
const N=16;
const mk=(w,h)=>({w,h,g:Array.from({length:h},()=>Array(w).fill('.'))});
const put=(p,x,y,c)=>{ if(x>=0&&y>=0&&x<p.w&&y<p.h) p.g[y][x]=c; };
function ell(p,cx,cy,rx,ry,c){ for(let y=0;y<p.h;y++) for(let x=0;x<p.w;x++){ const dx=(x+.5-cx)/rx, dy=(y+.5-cy)/ry; if(dx*dx+dy*dy<=1) put(p,x,y,c); } }
function shade(p,base,light,dark){ const at=(x,y)=>(x<0||y<0||x>=p.w||y>=p.h)?'.':p.g[y][x], o=p.g.map(r=>r.slice());
  for(let y=0;y<p.h;y++) for(let x=0;x<p.w;x++) if(p.g[y][x]===base){ if(at(x,y+1)==='.'||at(x+1,y)==='.') o[y][x]=dark; else if(at(x,y-1)==='.'||(at(x-1,y)==='.'&&y<p.h/2)) o[y][x]=light; }
  p.g=o; return p; }
function blit(dst,part,ox,oy){ for(let y=0;y<part.h;y++) for(let x=0;x<part.w;x++){ const c=part.g[y][x]; if(c!=='.') put(dst,ox+x,oy+y,c); } }
const eye=(p,x,y,w,h,px,py)=>{ for(let j=0;j<h;j++) for(let i=0;i<w;i++) put(p,x+i,y+j,'p'); put(p,px,py,'e'); };
// ---------- new look: big square skull, wide collarbone, short rib cage with empty pixels, spine, pelvis, thin legs ----------
function skullNew(helm){
  const sk=mk(9,6);
  for(let x=1;x<=7;x++) put(sk,x,0,'s');
  for(let y=1;y<=3;y++) for(let x=0;x<9;x++) put(sk,x,y,'s');
  for(let x=1;x<=7;x++) put(sk,x,4,'s');
  [2,4,6].forEach(x=>put(sk,x,5,'s')); [3,5].forEach(x=>put(sk,x,5,'p'));   // teeth
  shade(sk,'s','S','z');
  eye(sk,1,2,2,2,1,2); eye(sk,6,2,2,2,6,2); put(sk,4,3,'p'); put(sk,4,4,'p');
  if(helm){ for(let x=0;x<9;x++){ if(sk.g[0][x]!=='.') sk.g[0][x]='M'; if(sk.g[1][x]!=='.') sk.g[1][x]='m'; } put(sk,0,2,'n'); put(sk,8,2,'n'); }
  return sk;
}
function bodyNew(){
  const b=mk(9,7), row=(y,x0,w)=>{ for(let x=0;x<w;x++) put(b,x0+x,y,'s'); };
  row(0,0,9);                                  // collarbone, wider than the ribs
  row(1,1,7); put(b,1,2,'s'); put(b,7,2,'s'); // first rib, then empty gap with side bones
  row(3,2,5); put(b,2,4,'s'); put(b,6,4,'s'); // second rib, side bones
  for(let y=1;y<=5;y++) put(b,4,y,'z');        // spine, one pixel
  row(6,2,5);                                  // pelvis
  shade(b,'s','S','z');
  return b;
}

  const pal={ s:'#e8dcc8',S:'#faf3e4',z:'#b8ab94',u:'#8f836f',m:'#8d949c',M:'#c4cad1',n:'#575e66' };
  function frame(t,fr,moving){
    const f=mk(N,N), k=t%4, bob=moving?[0,-1,0,-1][k]:0, nod=moving?[0,0,1,0][k]:0;
    for(let x=4;x<=12;x++) put(f,x,15,'k');
    const lx=6-(moving&&k===1?1:0), rx=8+(moving&&k===3?1:0);
    [lx,rx].forEach(x=>{ put(f,x,12,'z'); put(f,x,13,'s'); put(f,x,14,'s'); put(f,x+(x<7?-1:1),14,'s'); });
    blit(f,bodyNew(),3,6+bob); blit(f,skullNew(false),3,bob+nod);
    return f;
  }
  ZOO.skelett={ name:'Skelett', pal:{...BASEPAL,...pal}, frame };
})();

// ---- beasts: hound, beetle, fly (native facing: right) ----
(()=>{
const N=16;
const mk=(w,h)=>({w,h,g:Array.from({length:h},()=>Array(w).fill('.'))});
const put=(p,x,y,c)=>{ if(x>=0&&y>=0&&x<p.w&&y<p.h) p.g[y][x]=c; };
function ell(p,cx,cy,rx,ry,c){ for(let y=0;y<p.h;y++) for(let x=0;x<p.w;x++){ const dx=(x+.5-cx)/rx, dy=(y+.5-cy)/ry; if(dx*dx+dy*dy<=1) put(p,x,y,c); } }
function shade(p,base,light,dark){ const at=(x,y)=>(x<0||y<0||x>=p.w||y>=p.h)?'.':p.g[y][x], o=p.g.map(r=>r.slice());
  for(let y=0;y<p.h;y++) for(let x=0;x<p.w;x++) if(p.g[y][x]===base){ if(at(x,y+1)==='.'||at(x+1,y)==='.') o[y][x]=dark; else if(at(x,y-1)==='.'||(at(x-1,y)==='.'&&y<p.h/2)) o[y][x]=light; }
  p.g=o; return p; }
const eye=(p,x,y,px,py)=>{ for(let j=0;j<2;j++) for(let i=0;i<2;i++) put(p,x+i,y+j,'p'); put(p,px,py,'e'); };
const shadow=(f,x0,x1)=>{ for(let x=x0;x<=x1;x++) put(f,x,15,'k'); };

// Hellhound: charcoal-red body, ember glow along the back (the one feature)
function hound(t){
  const f=mk(N,N), k=t%4, bob=(k%2)?0:-1, flick=(Math.floor(t/2)%2)===0;
  shadow(f,2,14);
  const lift=(pair)=> (k===pair||k===pair+1)?1:0;               // diagonal pairs lift alternately
  const b=mk(N,N), span=(y,x0,x1,c)=>{ for(let x=x0;x<=x1;x++) put(b,x,y,c); };
  span(4,10,11,'z'); span(5,9,11,'z');                           // ears
  span(5,12,13,'s'); span(6,9,13,'s'); span(7,2,14,'s'); span(8,2,15,'s'); span(9,2,13,'s'); span(10,3,10,'s'); // lower back, raised head, snout
  [[1,6],[1,5],[0,4]].forEach(([x,y])=>put(b,x,y,'s'));           // tail
  shade(b,'s','S','z');
  eye(b,11,6,12,6); put(b,15,8,'p');          // eye and nose
  for(let x=3;x<=8;x++) if((x+(flick?0:1))%2===0) put(b,x,6,'y'); // ember glow, flickers
  put(b,0,3,flick?'y':'Y');                                       // tail tip spark
  for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(b.g[y][x]!=='.') put(f,x,y+bob,b.g[y][x]);
  const L=(x,w,up,c)=>{ for(let y=11+bob;y<=13-up;y++) for(let i=0;i<w;i++) put(f,x+i,y,c); for(let i=0;i<w;i++) put(f,x+i,13-up,'s'); };
  L(6,1,lift(2),'z'); L(11,1,lift(2),'z');                  // far legs
  L(3,2,lift(0),'s'); L(9,2,lift(0),'s');                   // near legs, thick
  return f;
}
// Beetle: domed shell with a seam and a gloss highlight; tripod gait
function beetle(t){
  const f=mk(N,N), k=t%4;
  shadow(f,2,14);
  const b=mk(N,N);
  ell(b,7,8.2,5.6,3.6,'s');
  ell(b,13,9.6,2,1.8,'h');                                         // head
  shade(b,'s','S','z'); shade(b,'h','H','Z');
  for(let x=3;x<=11;x++) put(b,x,8,'u');                          // seam between wing cases
  [[4,6],[5,6],[4,7]].forEach(([x,y])=>put(b,x,y,'w'));          // gloss
  eye(b,13,8,14,8); put(b,15,11,'z'); put(b,15,12,'z');           // eye, mandible
  for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(b.g[y][x]!=='.') put(f,x,y,b.g[y][x]);
  const lx=[[4,k===0||k===2],[7,k===1||k===3],[10,k===0||k===2]];
  lx.forEach(([x,up])=>{ put(f,x,12,'z'); put(f,x,13,'s'); if(!up) put(f,x,14,'s'); });
  return f;
}
// Fly: tiny body, huge eye, two wing beats; hovers
function fly(t){
  const f=mk(N,N), k=t%4, up=(k%2)===0, hov=[0,-1,0,1][k];
  for(let x=5;x<=10;x++) put(f,x,15,'k');                         // shadow stays on the ground
  const b=mk(N,N);
  const wy=up?6:9;
  ell(b,5.8,wy,2.6,1.4,'W'); ell(b,8.6,wy-1,1.8,1.2,'W');
  ell(b,7,9.4,2.6,2,'s'); ell(b,10.2,8.4,2.2,2,'s');
  shade(b,'s','S','z');
  eye(b,10,7,10,7); put(b,12,9,'z');
  [[6,11],[8,11]].forEach(([x,y])=>{ put(b,x,y,'z'); put(b,x,y+1,'z'); });
  for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(b.g[y][x]!=='.') put(f,x,y+hov,b.g[y][x]);
  return f;
}
const BEASTS=[
 { name:'Höllenhund', note:'Kohlerot, Glut auf dem Rücken. Läuft in diagonalen Beinpaaren.', make:hound, pal:{s:'#7a3a2e',S:'#a85a44',z:'#4a1f1a',y:'#ffb02e',Y:'#ff7a1a'} },
 { name:'Käfer', note:'Gewölbter Panzer mit Naht und Glanzpunkt. Läuft im Dreibeingang.', make:beetle, pal:{s:'#3f7a5a',S:'#6cc08e',z:'#244a38',u:'#173025',w:'#d6ffe6',h:'#2f5a44',H:'#4f8a68',Z:'#1b3a2c'} },
 { name:'Fliege', note:'Winzig, riesiges Auge, flirrende Flügel. Schwebt über dem Boden.', make:fly, pal:{s:'#4d4a56',S:'#7a7788',z:'#2a2831',W:'rgba(150,185,205,0.85)'} }
];

  BEASTS.forEach(v=>{ ZOO[{'Höllenhund':'hound','Käfer':'beetle','Fliege':'fly'}[v.name]]={ name:v.name, pal:{...BASEPAL,...v.pal}, frame:(t,fr,mv)=>{ const f=v.make(mv||v.name==='Fliege'?t:0); if(!fr) f.g=f.g.map(r=>r.slice().reverse()); return f; } }; });
})();

// ---- imp: bent-over sack carrier (native facing: left). extra = 'gold' | 'ore' | null (carried load) ----
(()=>{
const IMP_PAL={ o:'#d9622b', h:'#f08a4b', O:'#8f3a1a', R:'#5a1810', p:'#14100c', e:'#ffffff', b:'#c9a96a', B:'#8a7048', y:'#f4d03f', Y:'#b8860b', g:'#aab3bd', G:'#6b7580', s:'rgba(0,0,0,0.30)' };
const IMP_N=16;
const impMk=(w,h)=>({w,h,g:Array.from({length:h},()=>Array(w).fill('.'))});
const impPut=(p,x,y,c)=>{ if(x>=0&&y>=0&&x<p.w&&y<p.h) p.g[y][x]=c; };
function impEll(p,cx,cy,rx,ry,c){ for(let y=0;y<p.h;y++) for(let x=0;x<p.w;x++){ const dx=(x+.5-cx)/rx, dy=(y+.5-cy)/ry; if(dx*dx+dy*dy<=1) impPut(p,x,y,c); } }
function impCap(p,x0,y0,x1,y1,r,c){ for(let y=0;y<p.h;y++) for(let x=0;x<p.w;x++){ const px=x+.5,py=y+.5,vx=x1-x0,vy=y1-y0,L=vx*vx+vy*vy||1; let t=((px-x0)*vx+(py-y0)*vy)/L; t=Math.max(0,Math.min(1,t)); const dx=px-(x0+vx*t),dy=py-(y0+vy*t); if(dx*dx+dy*dy<=r*r) impPut(p,x,y,c); } }
function impShade(p,base,light,dark){ const at=(x,y)=>(x<0||y<0||x>=p.w||y>=p.h)?'.':p.g[y][x], o=p.g.map(r=>r.slice());
  for(let y=0;y<p.h;y++) for(let x=0;x<p.w;x++) if(p.g[y][x]===base){ if(at(x,y+1)==='.'||at(x+1,y)==='.') o[y][x]=dark; else if(at(x,y-1)==='.'||(at(x-1,y)==='.'&&y<p.h/2)) o[y][x]=light; }
  p.g=o; return p; }
const IMP_PARTS=(()=>{
  const head=impMk(9,8); impEll(head,4.5,4.1,4.5,3.9,'o'); impShade(head,'o','h','O');
  [[1,2],[5,2]].forEach(([x,y])=>{ for(let j=0;j<3;j++){ impPut(head,x,y+j,'p'); impPut(head,x+1,y+j,'p'); } impPut(head,x,y+1,'e'); });
  const body=impMk(8,7); impEll(body,4,3.6,4,3.5,'o'); impEll(body,3.2,4.3,2,1.8,'h'); impShade(body,'o','h','O');
  const leg=impMk(3,4); impCap(leg,1.5,0.6,1.5,3.0,1.1,'o'); impShade(leg,'o','h','O'); [0,1,2].forEach(x=>impPut(leg,x,3,'R'));
  const sack=c=>{ const p=impMk(8,8); impEll(p,4,4.9,3.9,3.1,'b'); [[3,1],[4,1],[2,0],[5,0]].forEach(([x,y])=>impPut(p,x,y,'b')); impPut(p,3,0,'B'); impPut(p,4,0,'B'); impShade(p,'b','b','B');
    const gl=c==='gold'?['y','Y']:c==='ore'?['g','G']:null; if(gl){ impPut(p,2,4,gl[0]); impPut(p,3,3,gl[0]); impPut(p,5,5,gl[0]); impPut(p,5,3,gl[1]); impPut(p,3,6,gl[1]); } return p; };
  return { head, body, leg, sack:{gold:sack('gold'),ore:sack('ore')} };
})();
function impBlit(dst,part,ox,oy){ for(let y=0;y<part.h;y++) for(let x=0;x<part.w;x++){ const c=part.g[y][x]; if(c!=='.') impPut(dst,ox+x,oy+y,c); } }
// state: 'stehen' | 'laufen' | 'gold' | 'erz'
function impFrame(state,t,facingRight){
  const f=impMk(IMP_N,IMP_N), carry=state==='gold'||state==='erz', walk=state!=='stehen', hunch=carry?1:0, k=t%4;
  const bob=walk?[0,-1,0,-1][k]:0, footF=walk?[-1,0,1,0][k]:0, footB=-footF, headLag=walk?[0,0,1,0][k]:(Math.floor(t/2)%2?1:0);
  for(let x=4;x<=12;x++) impPut(f,x,15,'s');
  impBlit(f,IMP_PARTS.leg,10+footB,11);
  if(carry) impBlit(f,IMP_PARTS.sack[state==='gold'?'gold':'ore'],8,1+hunch+bob+(walk&&k===2?1:0));
  impBlit(f,IMP_PARTS.body,6,5+hunch+bob);
  impBlit(f,IMP_PARTS.leg,5+footF,11);
  impBlit(f,IMP_PARTS.head,1,1+hunch+bob+headLag);
  if(facingRight) f.g=f.g.map(r=>r.slice().reverse());
  return f;
}

  ZOO.imp={ name:'Imp', pal:{...IMP_PAL}, frame:(t,fr,mv,carry)=>{ const st=carry==='gold'?'gold':carry?'erz':(mv?'laufen':'stehen'); return impFrame(st,(carry&&!mv)?0:(st==='stehen'?(Math.floor(t/2)%2?2:0):t),fr); } };
})();

// ---- hero classes: the humanoid hero with palette variants (equipment rules will change silhouettes later) ----
(()=>{
  const held=ZOO.held, v=pal=>({ ...held, pal:{...held.pal,...pal} });
  ZOO.barbarian=v({ t:'#8a4a28',T:'#b06a3c',u:'#5a2c14',F:'#b0561e',G:'#d8782e' });
  ZOO.thief=v({ t:'#3a3a46',T:'#555566',u:'#22222a',F:'#2a2218',G:'#3c3224',l:'#2a2a32',L:'#3c3c46',m:'#1c1c22',b:'#1c1c22' });
  ZOO.wizard=v({ t:'#4a5ab0',T:'#6a7ad0',u:'#2e3a80',F:'#d0d0d8',G:'#eeeef4' });
  ZOO.knight=v({ t:'#8d949c',T:'#c4cad1',u:'#575e66',F:'#8d949c',G:'#c4cad1' });
})();
return ZOO;
})();
