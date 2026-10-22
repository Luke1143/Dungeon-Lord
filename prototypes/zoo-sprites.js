// Shared creature sprite generators (16x16, flat, code-based). Used by the 3D test.
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
  function frame(key,t,facingRight,moving){
    const f=mk(N,N), P=CREATURES[key].parts(), k=t%4;
    const bob=moving?[0,-1,0,-1][k]:0, ff=moving?[-1,0,1,0][k]:0, fb=-ff, nod=moving?[0,0,1,0][k]:(Math.floor(t/2)%2?1:0);
    for(let x=4;x<=12;x++) put(f,x,15,'k');
    if(key==='warlock'){ blit(f,P.robe,P.rx,P.ry+bob); put(f,P.rx+2+ff,14,'R'); put(f,P.rx+5+fb,14,'R'); blit(f,P.hood,P.hx,P.hy+bob+nod); }
    else { blit(f,P.leg,P.lxBack+fb,P.lyBack); blit(f,P.torso,P.tx,P.ty+bob); blit(f,P.leg,P.lxFront+ff,P.ly); blit(f,P.head,P.hx,P.hy+bob+nod); }
    if(facingRight) f.g=f.g.map(r=>r.slice().reverse());
    return f;
  }
  ['held','ork','warlock'].forEach(key=>{ ZOO[key]={ name:CREATURES[key].name, pal:{...BASEPAL,...CREATURES[key].pal}, frame:(t,fr,mv)=>frame(key,t,fr,mv) }; });
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
return ZOO;
})();
