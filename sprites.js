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
    stahl:{m:'#b4c4d6',M:'#e6f0fb',n:'#6b7e92',W:'#e6f0fb',K:'#6b7e92'},
    schwarz:{m:'#25252f',M:'#41414f',n:'#0e0e14',W:'#5a5a6c',K:'#0e0e14'}      // blackened plate of the Dungeon Lord
  };
  const WEAPONS={   // grip = pixel held at the anchor behind the back; 'j' = wood
    schwert:{ px:[[1,0,'W'],[1,1,'W'],[1,2,'W'],[1,3,'W'],[1,4,'W'],[1,5,'W'],[0,6,'K'],[1,6,'K'],[2,6,'K'],[1,7,'j'],[1,8,'j']], grip:[1,7] },
    axt:{ px:[[1,2,'j'],[1,3,'j'],[1,4,'j'],[1,5,'j'],[1,6,'j'],[1,7,'j'],[1,8,'j'],[2,0,'W'],[3,0,'W'],[2,1,'W'],[3,1,'W'],[2,2,'W'],[3,2,'W'],[2,3,'W']], grip:[1,7] },
    hacke:{ px:[[0,0,'W'],[1,0,'W'],[2,0,'W'],[3,0,'W'],[0,1,'W'],[3,1,'W'],[1,1,'j'],[1,2,'j'],[1,3,'j'],[1,4,'j'],[1,5,'j'],[1,6,'j'],[1,7,'j'],[1,8,'j']], grip:[1,7] },
    stab:{ px:[[0,0,'Q'],[1,0,'Q'],[2,0,'Q'],[0,1,'Q'],[1,1,'q'],[2,1,'Q'],[1,2,'Q'],[1,3,'j'],[1,4,'j'],[1,5,'j'],[1,6,'j'],[1,7,'j'],[1,8,'j']], grip:[1,6] },
    keule:{ px:[[0,0,'W'],[2,0,'W'],[1,0,'K'],[0,1,'W'],[1,1,'W'],[2,1,'W'],[1,2,'W'],[1,3,'j'],[1,4,'j'],[1,5,'j'],[1,6,'j'],[1,7,'j'],[1,8,'j']], grip:[1,7] },   // spiked mace
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
      // no pauldrons: creatures have no arms, so armour never sticks out of the torso
    }
    if(e.legs){ for(let y=L.y0;y<=L.y1;y++) for(let x=0;x<N;x++) if(f.tag[y][x]==='L'&&y>=(e.legs===1?L.y1-1:L.y1-2)) f.g[y][x]=y===L.y1?'n':'m'; }
    if(e.shield&&SHIELDS[e.shield]){ const sy=T.y0+1; SHIELDS[e.shield].forEach(([x,y,c])=>set(T.x0-3+x,sy+y,c)); }
    if(e.weapon&&WEAPONS[e.weapon]){ const wp=WEAPONS[e.weapon], ox=T.x1+2-wp.grip[0], oy=T.y0+3-wp.grip[1];
      wp.px.forEach(([x,y,c])=>{ const X=ox+x, Y=oy+y; if(X>=0&&X<N&&Y>=0&&Y<N&&f.tag[Y][X]==='') f.g[Y][X]=c; }); }
  }
  // held tools as standalone pixel art (for the swing animations): the weapon alone, with its grip point
  globalThis.TOOLGEN={ weapon(name){
    const wp=WEAPONS[name]; if(!wp) return null;
    const pal={ j:'#6b4a2f', Q:'#9a6aff', q:'#e8d8ff', ...MATS.eisen };
    return { grip:wp.grip, px:wp.px.map(([x,y,c])=>[x,y,pal[c]||'#c4cad1']) };
  } };
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
  // a boss keeps the look of its armour, but what it holds comes from its inventory like for everybody else (nothing is baked into the sprite)
  const bossEq=(base,eq)=>Object.assign({},base,eq?{ weapon:eq.weapon, shield:eq.shield }:{});
  ZOO.barbarian=v({ t:'#8a4a28',T:'#b06a3c',u:'#5a2c14',F:'#b0561e',G:'#d8782e' });
  ZOO.thief=v({ t:'#3a3a46',T:'#555566',u:'#22222a',F:'#2a2218',G:'#3c3224',l:'#2a2a32',L:'#3c3c46',m:'#1c1c22',b:'#1c1c22' });
  ZOO.worker=v({ t:'#7a6a4a',T:'#9a8a62',u:'#4a3e28',F:'#6a4a2a',G:'#8a6a3a',l:'#5a4a30',L:'#6a5a3c',m:'#3a2c1a',b:'#3a2c1a' });
  ZOO.wizard=v({ t:'#4a5ab0',T:'#6a7ad0',u:'#2e3a80',F:'#d0d0d8',G:'#eeeef4' });
  // the dwarf king (a boss that can be corrupted): the hero body, red beard, heavy armour; the ally version has the player side's eyes
  const dwarf=swap=>({ ...held, name:'Zwergenkönig', pal:{ ...held.pal, F:'#b8561e', G:'#d8782e', t:'#5a2c14', T:'#7a4a2a', u:'#3a1c0c' },
    frame:(t,fr,mv,eq)=>{ const f=held.frame(t,fr,mv,bossEq({ mat:'bronze', helm:1, chest:3, legs:2 },eq)); if(swap) f.g=f.g.map(r=>r.map(c=>c==='e'?'p':(c==='p'?'e':c))); return f; } });
  ZOO.dwarfking=dwarf(false); ZOO.dwarfking_ally=dwarf(true);
  // Oberon, lord of the sacred grove: pale fey king, silver-gold hair, green robes, a feathered crown (helm tier 3) and a staff
  const fey=swap=>({ ...held, name:'Oberon', pal:{ ...held.pal, s:'#e2d4b4', S:'#f4ead0', F:'#e8e0a0', G:'#fff8c0', t:'#2f7a3a', T:'#4fa05a', u:'#1f5a2a', l:'#2f5a2a', L:'#3f7a3a', m:'#1f3a1a', b:'#1f3a1a' },
    frame:(t,fr,mv,eq)=>{ const f=held.frame(t,fr,mv,bossEq({ mat:'leder', helm:3, chest:1, legs:1 },eq)); if(swap) f.g=f.g.map(r=>r.map(c=>c==='e'?'p':(c==='p'?'e':c))); return f; } });
  ZOO.oberon=fey(false); ZOO.oberon_ally=fey(true);
  // Herakles, the world's hero: a lion pelt for a hood, a club; the ally version has the player side's eyes
  const hera=swap=>({ ...held, name:'Herakles', humanoid:true, pal:{ ...held.pal, F:'#c8801c', G:'#f0b040', t:'#b07a2c', T:'#d8a048', u:'#7a4a14', s:'#d09a74', S:'#e8b890' },
    frame:(t,fr,mv,eq)=>{ const f=held.frame(t,fr,mv,bossEq({ mat:'leder', helm:0, chest:1, legs:1 },eq)); if(swap) f.g=f.g.map(r=>r.map(c=>c==='e'?'p':(c==='p'?'e':c))); return f; } });
  ZOO.herakles=hera(false); ZOO.herakles_ally=hera(true);
  ZOO.elf=v({ s:'#e6d6b4', S:'#f6ead0', F:'#d8d090', G:'#f0eab0', t:'#2f7a3a', T:'#4fa05a', u:'#1f5a2a', l:'#3a5a2a', L:'#4a7a3a', m:'#243a1c', b:'#243a1c' });
  // King Arthur: crowned human king in steel and blue; the ally version has the player side's eyes
  const arthur=swap=>({ ...held, name:'Artus', pal:{ ...held.pal, F:'#c8a030', G:'#e8c850', t:'#2a4a9a', T:'#4a6ad0', u:'#1a2a6a' },
    frame:(t,fr,mv,eq)=>{ const f=held.frame(t,fr,mv,bossEq({ mat:'stahl', helm:2, chest:2, legs:1 },eq)); if(swap) f.g=f.g.map(r=>r.map(c=>c==='e'?'p':(c==='p'?'e':c))); return f; } });
  ZOO.arthur=arthur(false); ZOO.arthur_ally=arthur(true);
  // The Dungeon Lord: not a man but a haunted suit of black plate, closed spiked helm, two burning eyes in the slit, a spiked mace.
  // Drawn by hand (no skin anywhere); native facing left like the other humanoids.
  const LORD_TOP=[
    '.....M.M.M......',
    '.....mMmMmm.....',
    '....mMmmmmmm....',
    '....mnEnnEnm....',
    '....mmnnnnmm....',
    '.M..nmmmmmnM.M..',
    '.MMmMMmnnmMMmMM.',
    '..mMmmMmmMmmmm..',
    '..mnmMmnnmMmn...',
    '...nmmmMMmmm....',
    '....nmmnnmmn....'];
  const LORD_LEGS=[
    ['.....mmn.mmn....','.....mmn.mmn....','.....nnn.nnn....'],
    ['....mmn...mmn...','....mmn...mmn...','....nnn...nnn...'],
    ['.....mmn.mmn....','.....mmn.mmn....','.....nnn.nnn....'],
    ['.....mmn...mmn..','.....mmn...mmn..','.....nnn...nnn..']];
  ZOO.dungeonlord={ name:'Dungeon Lord', humanoid:true, pal:{ m:'#25252f',M:'#454556',n:'#0e0e14',W:'#6a6a7c',j:'#4a3624',E:'#ff4a1c',F:'#ffc040',k:'rgba(0,0,0,0.30)' },
    frame:(t,fr,mv,eq)=>{
      const k=t%4, bob=mv?[0,1,0,1][k]:(Math.floor(t/2)%2?1:0), rows=[];
      for(let y=0;y<16;y++) rows.push('................');
      LORD_TOP.forEach((r,y)=>{ if(y+bob<15) rows[y+bob+1-1]=r; });
      if(bob) rows[0]='................';
      const legs=LORD_LEGS[mv?k:0]; legs.forEach((r,i)=>{ rows[11+i+0]=r; });
      rows[14]=LORD_LEGS[mv?k:0][2]; rows[15]='....kkkkkkkkk...';
      let g=rows.map(r=>r.split('')); const wpal={};
      if(eq&&eq.weapon&&globalThis.TOOLGEN){ const w=TOOLGEN.weapon(eq.weapon); if(w) w.px.forEach(([x,y,c])=>{ const X=14-w.grip[0]+x, Y=8-w.grip[1]+y+bob; if(X>=0&&X<16&&Y>=0&&Y<15){ let ch=Object.keys(wpal).find(k=>wpal[k]===c); if(!ch){ ch=String(Object.keys(wpal).length); wpal[ch]=c; } g[Y][X]=ch; } }); }
      const flick=Math.floor(t/3)%2;
      g=g.map(r=>r.map(c=>c==='E'?(flick?'F':'E'):c));
      if(fr) g=g.map(r=>r.slice().reverse());
      return { g, pal:wpal };
    } };
  // variants of the hero body: tweak(frame) changes pixels in native (left-facing) orientation
  const vary=(name,pal,tweak,base)=>({ ...held, name, humanoid:true, pal:{...held.pal,...pal},
    frame:(t,fr,mv,eq)=>{ const f=held.frame(t,false,mv,base?Object.assign({},base,eq?{ weapon:eq.weapon, shield:eq.shield }:{}):eq); if(tweak) tweak(f); if(fr) f.g=f.g.map(r=>r.slice().reverse()); return f; } });
  const headRows=f=>{ let y0=99; f.tag.forEach((r,y)=>r.forEach(c=>{ if(c==='H'&&y<y0) y0=y; })); return y0; };
  const beard=col=>f=>{ const y0=headRows(f); [[4,6],[5,6],[6,6],[7,6],[4,7],[5,7],[6,7],[5,8]].forEach(([x,dy])=>{ const y=y0+dy; if(y<15&&(f.g[y][x]==='.'||f.tag[y][x]==='T'||f.tag[y][x]==='H')) f.g[y][x]=col; }); };
  ZOO.archer=vary('Bogenschütze',{ F:'#3a6a3a', G:'#5a9a5a', t:'#5a6a3a', T:'#7a8a52', u:'#3a4a24', l:'#4a3a24', L:'#6a5a3a' });
  ZOO.monk=vary('Mönch',{ t:'#c8741c', T:'#e89a3c', u:'#8a4a10', F:'#e0b48c', G:'#f2cfa8', l:'#c8741c', L:'#e89a3c', m:'#8a4a10', b:'#5a3a20' },f=>{ f.g.forEach((r,y)=>r.forEach((c,x)=>{ if(f.tag[y][x]==='H'&&(c==='F'||c==='G')) f.g[y][x]=c==='G'?'S':'s'; })); });
  ZOO.paladin=vary('Paladin',{ t:'#e8e4d8', T:'#ffffff', u:'#a8a498', F:'#f0d060', G:'#fff0a0', y:'#f0d060' },null,{ mat:'stahl', helm:2, chest:3, legs:1 });
  ZOO.dwarf=vary('Zwerg',{ F:'#b8561e', G:'#d8782e', t:'#6a4a30', T:'#8a6a4a', u:'#3a2a1a', l:'#5a3a24', L:'#7a5a3a', m:'#2e1e12', b:'#2e1e12' },beard('F'),{ mat:'bronze', helm:1, chest:2, legs:1 });
  ZOO.giant=vary('Riese',{ t:'#8a6a4a', T:'#a8886a', u:'#5a4026', F:'#6a4a2a', G:'#8a6a3a', s:'#d09a74', S:'#e8b890', l:'#6a5238', L:'#8a7050' });
  ZOO.knight=v({ t:'#8d949c',T:'#c4cad1',u:'#575e66',F:'#8d949c',G:'#c4cad1' });
})();

// ---- props: furniture, goods and small things (ZOO['prop_*'], drawn like creatures; t only drives flicker) ----
(()=>{
  const mk=(w,h)=>({w,h,g:Array.from({length:h},()=>Array(w).fill('.'))});
  const put=(p,x,y,c)=>{ if(x>=0&&y>=0&&x<p.w&&y<p.h) p.g[y][x]=c; };
  const rect=(p,x,y,w,h,c)=>{ for(let j=0;j<h;j++) for(let i=0;i<w;i++) put(p,x+i,y+j,c); };
  const ell=(p,cx,cy,rx,ry,c)=>{ for(let y=0;y<p.h;y++) for(let x=0;x<p.w;x++){ const dx=(x+.5-cx)/rx, dy=(y+.5-cy)/ry; if(dx*dx+dy*dy<=1) put(p,x,y,c); } };
  const shade=(p,base,light,dark)=>{ const at=(x,y)=>(x<0||y<0||x>=p.w||y>=p.h)?'.':p.g[y][x], o=p.g.map(r=>r.slice());
    for(let y=0;y<p.h;y++) for(let x=0;x<p.w;x++) if(p.g[y][x]===base){ if(at(x,y+1)==='.'||at(x+1,y)==='.') o[y][x]=dark; else if(at(x,y-1)==='.'||at(x-1,y)==='.') o[y][x]=light; } p.g=o; return p; };
  const PAL={ w:'#8a5a34',W:'#b07a4a',d:'#5a3820', r:'#a02a2a',R:'#c84a4a', c:'#efe2c6', y:'#f4d03f',Y:'#b8860b', v:'#7b4bb0',V:'#9a6ad0',x:'#4a2a70',
    s:'#8d949c',S:'#c4cad1',z:'#575e66', o:'#ff7a1a',f:'#ffd23f',F:'#fff2a0', k:'#2a2018', g:'#6b7a3a',G:'#9aaa4a', b:'#b4533a',B:'#d8785a', i:'#4a6a9a',I:'#7a9ac8',
    n:'#7a6a58',N:'#a89a84', a:'#c9a96a',A:'#e8cf94', e:'#ffffff', p:'#14100c', h:'#e8dcc8',H:'#faf3e4',Z:'#b8ab94', l:'#3c4a5a', t:'#c8342e' };
  const add=(key,fn,pal)=>{ ZOO['prop_'+key]={ name:key, prop:true, pal:{...PAL,...(pal||{})}, frame:(t)=>fn(t) }; };
  const flick=t=>Math.floor(t/2)%2;
  add('bed',()=>{ const f=mk(16,16); rect(f,2,7,12,6,'w'); rect(f,2,12,2,2,'d'); rect(f,12,12,2,2,'d'); rect(f,5,7,8,5,'r'); rect(f,5,7,8,1,'R'); rect(f,3,7,3,3,'c'); shade(f,'w','W','d'); return f; });
  add('throne',()=>{ const f=mk(16,16); rect(f,5,1,6,9,'v'); rect(f,3,7,2,5,'v'); rect(f,11,7,2,5,'v'); rect(f,4,9,8,3,'v'); rect(f,5,1,6,1,'y'); rect(f,4,12,2,2,'Y'); rect(f,10,12,2,2,'Y'); put(f,7,4,'y'); put(f,8,4,'y'); put(f,7,5,'Y'); put(f,8,5,'Y'); shade(f,'v','V','x'); return f; });
  add('candle',t=>{ const f=mk(16,16); rect(f,6,12,4,2,'Y'); rect(f,7,6,2,6,'c'); put(f,7,5,'p'); put(f,8,5-flick(t)+0,'p'); put(f,7,4-flick(t),'f'); put(f,8,4-flick(t),'o'); put(f,7,3-flick(t),'F'); return f; });
  add('shelf',()=>{ const f=mk(16,16); rect(f,2,2,12,12,'w'); rect(f,3,3,10,3,'d'); rect(f,3,8,10,3,'d');
    [[3,'r'],[4,'i'],[5,'y'],[6,'g'],[7,'r'],[8,'c'],[9,'i'],[10,'y'],[11,'g'],[12,'r']].forEach(([x,c],i)=>{ rect(f,x,3,1,3,c); rect(f,x,8,1,3,[ 'i','r','y','g','c'][(i+2)%5]); });
    shade(f,'w','W','d'); return f; });
  add('book',()=>{ const f=mk(16,16); rect(f,4,5,8,7,'t'); rect(f,4,5,1,7,'d'); rect(f,5,11,7,1,'c'); rect(f,6,7,4,1,'y'); rect(f,6,9,3,1,'y'); return f; });
  add('fire',t=>{ const f=mk(16,16); rect(f,3,11,10,3,'s'); rect(f,4,10,8,1,'z'); ell(f,8,7,3,3.6,'o'); ell(f,8,8.4,1.8,2.4,'f'); put(f,flick(t)?5:10,5,'o'); put(f,8,flick(t)?2:3,'f'); shade(f,'s','S','z'); return f; });
  add('furnace',()=>{ const f=mk(16,16); rect(f,3,4,10,10,'s'); rect(f,6,8,4,6,'k'); rect(f,3,3,10,1,'z'); rect(f,6,1,4,3,'z'); put(f,7,10,'d'); put(f,8,10,'d'); shade(f,'s','S','z'); return f; });
  add('kiln',()=>{ const f=mk(16,16); for(let y=1;y<=14;y++){ const hw=2.6+y*0.3; for(let x=0;x<16;x++) if(Math.abs(x+.5-8)<=hw) put(f,x,y,'b'); } rect(f,6,10,4,4,'k'); put(f,7,11,'o'); put(f,8,12,'o'); [[3,5],[10,5],[5,8],[11,8],[4,12],[11,12]].forEach(([x,y])=>put(f,x,y,'n')); shade(f,'b','B','d'); return f; });
  add('bellows',t=>{ const f=mk(16,16); const sq=flick(t); ell(f,7,8+sq,5,3.6-sq*0.6,'w'); rect(f,11,8,4,2,'z'); rect(f,2,6,3,2,'d'); [4,7,10].forEach(x=>rect(f,x-1,6+sq,1,5-sq*1,'d')); shade(f,'w','W','d'); return f; });
  add('anvil',()=>{ const f=mk(16,16); rect(f,3,4,10,3,'s'); rect(f,1,5,3,2,'s'); rect(f,5,7,6,3,'s'); rect(f,4,10,8,3,'s'); shade(f,'s','S','z'); return f; });
  add('bench',()=>{ const f=mk(16,16); rect(f,2,6,12,3,'w'); rect(f,3,9,2,5,'d'); rect(f,11,9,2,5,'d'); shade(f,'w','W','d'); return f; });
  add('trough',()=>{ const f=mk(16,16); rect(f,2,8,12,5,'w'); rect(f,3,7,10,2,'a'); put(f,5,6,'A'); put(f,8,6,'A'); put(f,10,6,'A'); shade(f,'w','W','d'); return f; });
  add('grain',()=>{ const f=mk(16,16); [4,8,12].forEach((x,i)=>{ for(let y=7;y<=13;y++) put(f,x,y,'g'); put(f,x,6-(i%2),'A'); put(f,x-1,7,'a'); put(f,x+1,8,'a'); put(f,x,5-(i%2),'A'); }); return f; });
  add('chicken',t=>{ const f=mk(16,16), h=flick(t); ell(f,7,9,4.4,3.4,'h'); ell(f,11.5,6+h,2.1,2.1,'h'); put(f,12,4+h,'t'); put(f,11,4+h,'t'); put(f,14,7+h,'y'); put(f,15,7+h,'Y'); put(f,12,6+h,'p'); put(f,12,5+h,'p'); put(f,3,7,'Z'); put(f,2,6,'Z'); put(f,6,13,'Y'); put(f,9,13,'Y'); shade(f,'h','H','Z'); return f; });
  add('chick',t=>{ const f=mk(16,16), h=flick(t); ell(f,8,10,3,2.6,'f'); ell(f,10.4,7.6+h,1.9,1.9,'f'); put(f,12,8+h,'o'); put(f,11,7+h,'p'); put(f,7,13,'o'); put(f,9,13,'o'); return f; });
  add('torch',t=>{ const f=mk(16,16); rect(f,7,8,2,6,'d'); rect(f,6,7,4,2,'z'); put(f,7,6-flick(t)+1,'o'); put(f,8,6-flick(t)+1,'o'); put(f,7,5-flick(t)+1,'f'); put(f,8,5-flick(t)+1,'f'); put(f,7,4-flick(t)+1,'F'); put(f,8,6,'o'); put(f,7,6,'o'); rect(f,7,5,2,1,'f'); return f; });
  add('flame',t=>{ const f=mk(16,16), k=flick(t); ell(f,8,10.5,2.6,3.8,'o'); ell(f,8,11.4,1.4,2.4,'f'); put(f,8,6-k,'o'); put(f,8,7,'o'); put(f,8,12,'F'); put(f,7+k,5,'o'); return f; });
  add('pelt',()=>{ const f=mk(16,16); ell(f,8,9,6.4,4.2,'n'); ell(f,8,9,5.2,3.2,'o'); [[3,8],[5,12],[12,8],[10,13],[8,6]].forEach(([x,y])=>put(f,x,y,'n')); put(f,3,6,'o'); put(f,12,6,'o'); ell(f,13,10,1.6,1.4,'o'); put(f,13,9,'p'); shade(f,'o','O','n'); return f; },{ o:'#c8801c', O:'#e8a838', n:'#7a4a14' });
  add('excalibur',t=>{ const f=mk(16,16); ell(f,8,11,6,3.4,'s'); rect(f,4,9,8,4,'s'); shade(f,'s','S','z'); rect(f,7,1,2,9,'W'); put(f,7,1,'F'); rect(f,5,6,6,1,'y'); put(f,8,5-(flick(t)),'F'); return f; });
  add('roundtable',()=>{ const f=mk(16,16); ell(f,8,8,7.2,5.6,'d'); ell(f,8,8,6.2,4.8,'w'); ell(f,8,8,3.4,2.4,'W'); for(let i=0;i<12;i++){ const a=i/12*6.283; put(f,Math.round(8+Math.cos(a)*6.6),Math.round(8+Math.sin(a)*5.2),'y'); } shade(f,'w','W','d'); return f; });
  add('coin',()=>{ const f=mk(16,16); ell(f,8,9,4,3.6,'y'); ell(f,8,9,2.4,2.1,'Y'); put(f,6,7,'F'); put(f,7,7,'F'); shade(f,'y','F','Y'); return f; });
  add('ore',()=>{ const f=mk(16,16); ell(f,8,9,5,4,'n'); ell(f,6.5,8,2.2,2,'N'); put(f,10,8,'y'); put(f,9,11,'y'); shade(f,'n','N','k'); return f; });
  add('bloom',t=>{ const f=mk(16,16); ell(f,8,9,4.6,3.6,'o'); ell(f,7,8,2.6,2,'f'); put(f,11,7,'F'); put(f,5,10,'F'); if(flick(t)) put(f,9,6,'F'); shade(f,'o','f','t'); return f; });
  add('bloomcool',()=>{ const f=mk(16,16); ell(f,8,9,4.6,3.6,'n'); ell(f,7,8,2.4,1.8,'N'); put(f,10,10,'k'); put(f,6,11,'k'); shade(f,'n','N','k'); return f; });
  add('ingot',()=>{ const f=mk(16,16); rect(f,3,7,10,5,'s'); rect(f,4,6,8,1,'S'); rect(f,5,12,6,1,'z'); shade(f,'s','S','z'); return f; });
  add('corpse',()=>{ const f=mk(16,16); ell(f,8,6.5,3.5,3,'h'); rect(f,6,6,2,2,'p'); rect(f,9,6,2,2,'p'); put(f,7,6,'e'); put(f,10,6,'e'); put(f,8,9,'p'); rect(f,3,11,10,1,'Z'); rect(f,3,13,10,1,'Z'); put(f,2,10,'h'); put(f,13,10,'h'); put(f,2,14,'h'); put(f,13,14,'h'); shade(f,'h','H','Z'); return f; });
})();
return ZOO;
})();

// ---- tile overlays: 16x16 pixel-art speckle drawn over the flat tile colour (kinds: floor, flag, rock, gold, ore) ----
const TILEGEN=(()=>{
  const rng=seed=>{ let t=seed>>>0; return ()=>((t=Math.imul(t^t>>>15,t|1)),(t^=t+Math.imul(t^t>>>7,t|61)),((t^t>>>14)>>>0)/4294967296); };
  const PAL={ l:'rgba(255,240,210,0.10)', d:'rgba(0,0,0,0.20)', k:'rgba(0,0,0,0.38)', y:'#f4d03f', Y:'#b8860b', o:'#c2703a', O:'#7a3f1e' };
  function gen(kind,seed){
    const r=rng(seed*7919+kind.length*131), g=Array.from({length:16},()=>Array(16).fill('.'));
    const put=(x,y,c)=>{ if(x>=0&&y>=0&&x<16&&y<16) g[y][x]=c; };
    const rock=kind==='rock'||kind==='gold'||kind==='ore';
    for(let y=0;y<16;y++) for(let x=0;x<16;x++){ const v=r(); if(v<(rock?0.15:0.09)) put(x,y,'l'); else if(v<(rock?0.37:0.22)) put(x,y,'d'); }
    if(rock){ for(let i=0;i<(r()<0.55?1:0);i++){ let x=1+Math.floor(r()*13), y=1+Math.floor(r()*7); for(let j=0;j<5+Math.floor(r()*3);j++){ put(x,y,'k'); x+=r()<0.5?1:0; y+=1; } } }
    else if(kind==='floor'&&r()<0.35){ let x=2+Math.floor(r()*10), y=2+Math.floor(r()*12); for(let j=0;j<4;j++){ put(x,y,'k'); x+=1; y+=r()<0.5?1:0; } }
    if(kind==='flag'){ for(let i=0;i<16;i++){ put(i,0,'l'); put(0,i,'l'); put(i,15,'d'); put(15,i,'d'); } }
    if(kind==='gold') for(let i=0;i<5;i++){ const x=1+Math.floor(r()*12), y=1+Math.floor(r()*12); put(x,y,'y'); put(x+1,y,'y'); put(x,y+1,'Y'); put(x+2,y,'Y'); }
    if(kind==='ore') for(let i=0;i<5;i++){ const x=1+Math.floor(r()*12), y=1+Math.floor(r()*12); put(x,y,'o'); put(x+1,y,'o'); put(x,y+1,'O'); put(x+1,y+1,'O'); }
    return { g, pal:PAL };
  }

  // ---- full tile textures (opaque, own palette, in the spirit of block texture packs): conquered floors, room floors and room walls ----
  const FULL={};
  const grid=(c)=>Array.from({length:16},()=>Array(16).fill(c));
  const mk=(kind,fn)=>{ FULL[kind]=fn; };
  // stone slabs: 2x2 slabs with a light top-left edge and dark mortar
  function slabs(g,r,P,n){ const sz=16/n; for(let sy=0;sy<n;sy++) for(let sx=0;sx<n;sx++) for(let y=0;y<sz;y++) for(let x=0;x<sz;x++){ const X=sx*sz+x, Y=sy*sz+y; g[Y][X]= (x===sz-1||y===sz-1)?P.m:((x===0||y===0)?P.A:(r()<0.16?P.b:P.a)); } }
  function planks(g,r,P,rows,seamP){ const h=16/rows; for(let p=0;p<rows;p++){ const sx=Math.floor(r()*14)+1; for(let y=0;y<h;y++) for(let x=0;x<16;x++){ const Y=p*h+y; g[Y][x]= y===h-1?P.d:(r()<0.1?P.W:(p%2?P.w:P.W2||P.w)); if(x===sx&&y<h-1) g[Y][x]=P.d; if(y===0&&(x%5!==0)&&r()<0.5) g[Y][x]=P.W; } } }
  mk('owned',(v)=>{ const r=rng(v*31+1), P={ a:'#6d6256', A:'#867a6b', b:'#5f554a', m:'#3b342c', y:'#b8963c' }, g=grid(P.a); slabs(g,r,P,2);
    if(v%2===1){ [[8,6],[7,7],[9,7],[6,8],[10,8],[7,9],[9,9],[8,10]].forEach(([x,y])=>{ g[y][x]=P.y; }); }
    return { g, pal:{ a:P.a, A:P.A, b:P.b, m:P.m, y:P.y } }; });
  mk('throne',(v)=>{ const r=rng(v*17+2), P={ r:'#7a1f2b', R:'#5a1420', y:'#d4af37', Y:'#9a7a24', p:'#a8344a' }, g=grid(P.r);
    for(let y=0;y<16;y++) for(let x=0;x<16;x++){ if((x+y)%4===0&&x>1&&y>1&&x<14&&y<14) g[y][x]=P.R; if(r()<0.06) g[y][x]=P.p; }
    for(let i=0;i<16;i++){ g[0][i]=P.y; g[15][i]=P.Y; g[i][0]=P.y; g[i][15]=P.Y; g[1][i]=P.R; g[14][i]=P.R; g[i][1]=P.R; g[i][14]=P.R; }
    [[4,4],[11,4],[4,11],[11,11],[7,7],[8,8]].forEach(([x,y])=>{ g[y][x]=P.y; }); return { g, pal:P }; });
  mk('library',(v)=>{ const r=rng(v*13+3), P={ w:'#8a5a34', W:'#9c6a3e', W2:'#7e5030', d:'#3f2916' }, g=grid(P.w); planks(g,r,P,4); return { g, pal:P }; });
  mk('dormitory',(v)=>{ const r=rng(v*19+4), P={ b:'#2f3f7a', B:'#5a6ab0', c:'#1f2a56', y:'#d8c070' }, g=grid(P.b);
    for(let y=0;y<16;y++) for(let x=0;x<16;x++) if(r()<0.08) g[y][x]=P.c;
    for(let i=1;i<15;i++){ g[2][i]=P.B; g[13][i]=P.B; g[i][2]=P.B; g[i][13]=P.B; }
    [[8,6],[7,7],[9,7],[8,8],[7,9],[9,9],[8,10],[8,7],[8,9]].forEach(([x,y])=>{ g[y][x]=P.y; }); return { g, pal:P }; });
  mk('storage',(v)=>{ const r=rng(v*23+5), P={ w:'#7a6240', W:'#8d7450', d:'#463822', z:'#6a6e74' }, g=grid(P.w);
    for(let x=0;x<16;x++) for(let y=0;y<16;y++){ g[y][x]= (x%4===3)?P.d:(r()<0.1?P.W:P.w); }
    for(let x=0;x<16;x++){ g[3][x]=P.z; g[12][x]=P.z; } [[2,3],[6,3],[10,3],[14,3],[2,12],[6,12],[10,12],[14,12]].forEach(([x,y])=>{ g[y][x]=P.W; }); return { g, pal:P }; });
  mk('hatchery',(v)=>{ const r=rng(v*29+6), P={ h:'#b8a24a', H:'#d8c468', d:'#8f7a2c' }, g=grid(P.h);
    for(let i=0;i<34;i++){ const x=Math.floor(r()*13), y=Math.floor(r()*16), c=r()<0.5?P.H:P.d; g[y][x]=c; g[y][x+1]=c; if(r()<0.5) g[y][x+2]=c; } return { g, pal:P }; });
  mk('prison',(v)=>{ const r=rng(v*53+17), P={ s:'#3c3c44', S:'#4c4c56', k:'#1c1c22', i:'#8d949c', y:'#6a5a3a' }, g=grid(P.s);
    for(let y=0;y<16;y++) for(let x=0;x<16;x++){ const q=r(); if(q<0.15) g[y][x]=P.S; else if(q<0.22) g[y][x]=P.k; }
    for(let x=0;x<16;x++){ g[7][x]=P.k; g[8][x]=P.k; } for(let y=0;y<16;y++){ g[y][7]=P.k; g[y][8]=P.k; }
    [[3,3],[12,3],[3,12],[12,12]].forEach(([x,y])=>{ g[y][x]=P.i; g[y+1][x]=P.i; g[y][x+1]=P.y; }); return { g, pal:P }; });
  mk('arena',(v)=>{ const r=rng(v*37+7), P={ s:'#c9b080', S:'#dcc898', d:'#b39a68', r:'#7a2a22' }, g=grid(P.s);
    for(let y=0;y<16;y++) for(let x=0;x<16;x++){ const q=r(); if(q<0.12) g[y][x]=P.S; else if(q<0.3) g[y][x]=P.d; }
    if(v%3===2) for(let i=0;i<5;i++){ g[4+Math.floor(r()*8)][4+Math.floor(r()*8)]=P.r; } return { g, pal:P }; });
  const slag=(v)=>{ const r=rng(v*41+8), P={ s:'#2c2624', n:'#3d3532', o:'#ff7a1a', f:'#ffd23f', k:'#1a1512' }, g=grid(P.s);
    for(let y=0;y<16;y++) for(let x=0;x<16;x++){ const q=r(); if(q<0.2) g[y][x]=P.n; else if(q<0.28) g[y][x]=P.k; }
    let x=Math.floor(r()*14)+1, y=0; for(let j=0;j<16;j++){ g[y][x]=r()<0.2?P.f:P.o; if(r()<0.5) x=Math.max(0,Math.min(15,x+(r()<0.5?-1:1))); y++; if(y>15) break; if(r()<0.25) break; } return { g, pal:P }; };
  mk('smelter',slag); mk('forge',slag);
  mk('bridge',(v)=>{ const r=rng(v*43+9), P={ w:'#a07a48', W:'#b58c58', d:'#4e3a20' }, g=grid(P.w); planks(g,r,P,4); [[2,1],[13,1],[2,9],[13,9]].forEach(([x,y])=>{ g[y][x]=P.d; }); return { g, pal:P }; });
  const rune=(base,glow)=>(v)=>{ const r=rng(v*47+10), P={ s:base, n:'#3a4560', c:glow, k:'#141a2c' }, g=grid(P.s);
    for(let y=0;y<16;y++) for(let x=0;x<16;x++) if(r()<0.18) g[y][x]=P.n;
    for(let i=2;i<14;i++){ g[2][i]=P.c; g[13][i]=P.c; g[i][2]=P.c; g[i][13]=P.c; } [[8,5],[7,6],[9,6],[6,7],[10,7],[8,8],[7,9],[9,9],[8,10]].forEach(([x,y])=>{ g[y][x]=P.c; }); return { g, pal:P }; };
  mk('portal',rune('#26304a','#46b4ff')); mk('entrance',rune('#243a2a','#6ad06a'));
  // walls
  const bricks=(g,r,P)=>{ for(let row=0;row<4;row++){ const off=(row%2)*4; for(let y=0;y<4;y++) for(let x=0;x<16;x++){ const Y=row*4+y; const bx=(x+off)%8; g[Y][x]= (y===3||bx===7)?P.m:(y===0?P.A:(r()<0.2?P.b:P.a)); } } };
  const brickKind=(pal)=>(v)=>{ const r=rng(v*53+11), g=grid(pal.a); bricks(g,r,pal); return { g, pal }; };
  const BRICK={ a:'#6e6258', A:'#837668', b:'#5f554b', m:'#3a332c' };
  mk('brick',brickKind(BRICK));
  mk('wall:throne',(v)=>{ const r=rng(v*59+12), P={ a:'#58405c', A:'#6e5272', b:'#4a3350', m:'#2c1f31', r:'#a82a36', R:'#7a1f2b', y:'#d4af37' }, g=grid(P.a); bricks(g,r,P);
    for(let y=0;y<12;y++) for(let x=5;x<=10;x++) g[y][x]=(x===5||x===10)?P.R:P.r; for(let x=5;x<=10;x++) g[0][x]=P.y; [[5,12],[6,12],[9,12],[10,12],[6,13],[9,13],[7,13],[8,13]].forEach(([x,y])=>{ g[y][x]=(x<7||x>8)?P.r:P.R; }); g[14][7]=P.y; g[14][8]=P.y; return { g, pal:P }; });
  mk('wall:library',(v)=>{ const r=rng(v*61+13), P={ w:'#7a4e2c', d:'#3a2412', r:'#a02a2a', i:'#2f5a9a', y:'#d4b030', g:'#3f7a3a', c:'#e8dcc0', p:'#7a3a8a' }, g=grid(P.d); const cols=[P.r,P.i,P.y,P.g,P.c,P.p];
    [0,5,10,15].forEach(y=>{ for(let x=0;x<16;x++) g[y][x]=P.w; });
    [1,6,11].forEach(y0=>{ let x=1; while(x<15){ const w=1+Math.floor(r()*2), c=cols[Math.floor(r()*cols.length)], top=Math.floor(r()*2); for(let i=0;i<w&&x+i<15;i++) for(let y=y0+top;y<y0+4;y++) g[y][x+i]=c; x+=w; } });
    return { g, pal:P }; });
  mk('wall:dormitory',(v)=>{ const r=rng(v*67+14), P={ a:'#6e6258', A:'#837668', b:'#5f554b', m:'#3a332c', c:'#3a4a8a', C:'#5a6ab0', y:'#d8c070' }, g=grid(P.a); bricks(g,r,P);
    for(let y=1;y<16;y++) for(let x=2;x<14;x++) g[y][x]=(x%3===0)?P.C:P.c; for(let x=1;x<15;x++) g[0][x]=P.y; return { g, pal:P }; });
  mk('wall:storage',(v)=>{ const r=rng(v*71+15), P={ w:'#7a6240', W:'#8d7450', d:'#463822', z:'#6a6e74' }, g=grid(P.w);
    for(let qy=0;qy<2;qy++) for(let qx=0;qx<2;qx++) for(let y=0;y<8;y++) for(let x=0;x<8;x++){ const X=qx*8+x, Y=qy*8+y; g[Y][X]=(x===0||y===0||x===7||y===7)?P.d:((x===y||x+y===7)?P.W:P.w); }
    return { g, pal:P }; });
  mk('wall:hatchery',(v)=>{ const r=rng(v*73+16), P={ h:'#b8a24a', H:'#d8c468', d:'#8f7a2c', s:'#5a4020' }, g=grid(P.h);
    for(let y=0;y<16;y++) for(let x=0;x<16;x++){ if(r()<0.2) g[y][x]=P.H; else if(r()<0.18) g[y][x]=P.d; }
    [3,11].forEach(y=>{ for(let x=0;x<16;x++) g[y][x]=P.s; }); for(let x=0;x<16;x++) g[7][x]=P.d; return { g, pal:P }; });
  mk('wall:arena',(v)=>{ const r=rng(v*79+17), P={ a:'#b89a68', A:'#cdb27c', b:'#a08256', m:'#6a5232', r:'#a02a2a' }, g=grid(P.a); bricks(g,r,P); for(let x=0;x<16;x++){ g[6][x]=P.r; g[7][x]=P.r; } return { g, pal:P }; });
  const soot=(v)=>{ const r=rng(v*83+18), P={ a:'#2e2826', A:'#3d3532', b:'#201b19', m:'#141110', o:'#ff7a1a', f:'#ffd23f' }, g=grid(P.a); bricks(g,r,P);
    for(let i=0;i<3;i++){ const x=1+Math.floor(r()*13), y=3+4*Math.floor(r()*3); g[y][x]=P.o; g[y][x+1]=r()<0.4?P.f:P.o; } return { g, pal:P }; };
  mk('wall:smelter',soot); mk('wall:forge',soot);
  ['bridge','portal','entrance'].forEach(k=>mk('wall:'+k,brickKind(BRICK)));
  // damage overlay for a block being dug: stage 1 (first hairlines) to 4 (about to break)
  function crack(stage,seed){
    const r=rng(seed*101+17), g=Array.from({length:16},()=>Array(16).fill('.')), put=(x,y,c)=>{ if(x>=0&&y>=0&&x<16&&y<16&&(g[y][x]==='.'||c==='k')) g[y][x]=c; };
    const branches=1+stage;
    for(let b=0;b<branches;b++){
      let x=6+Math.floor(r()*4), y=6+Math.floor(r()*4), dx=r()<0.5?-1:1, dy=r()<0.5?-1:1; const len=2+stage*2+Math.floor(r()*3);
      for(let i=0;i<len;i++){ put(x,y,'k'); put(x+1,y,'l'); if(r()<0.5) x+=dx; else y+=dy; if(r()<0.2) dx=-dx; }
    }
    return { g, pal:{ k:'rgba(0,0,0,0.6)', l:'rgba(255,255,255,0.14)' } };
  }
  // the grove of the world tree: moss floor, twisted roots, bark
  mk('grove',(v)=>{ const r=rng(v*89+19), P={ g:'#2f5a2a', G:'#3f7a38', d:'#244a20', w:'#f0f0e0', y:'#f4d03f', p:'#e88ab0' }, g=grid(P.g);
    for(let y=0;y<16;y++) for(let x=0;x<16;x++){ const q=r(); if(q<0.2) g[y][x]=P.G; else if(q<0.34) g[y][x]=P.d; }
    for(let i=0;i<2;i++){ g[Math.floor(r()*15)][Math.floor(r()*15)]=pickFlower(r,P); } return { g, pal:P }; });
  const pickFlower=(r,P)=>[P.w,P.y,P.p][Math.floor(r()*3)];
  mk('root',(v)=>{ const r=rng(v*97+20), P={ b:'#3a2616', B:'#6a4426', m:'#2f5a2a', k:'#1f140a' }, g=grid(P.b);
    for(let y=0;y<16;y++) for(let x=0;x<16;x++){ const q=r(); if(q<0.15) g[y][x]=P.k; else if(q<0.22) g[y][x]=P.m; }
    for(let i=0;i<3;i++){ let x=Math.floor(r()*16), y=0, dx=r()<0.5?-1:1; for(let j=0;j<16;j++){ g[y][Math.max(0,Math.min(15,x))]=P.B; if(x>=0&&x<15) g[y][Math.max(0,Math.min(15,x+1))]=P.B; y++; if(y>15) break; if(r()<0.4) x+=dx; } }
    return { g, pal:P }; });
  mk('tree',(v)=>{ const r=rng(v*101+21), P={ a:'#4a3320', b:'#5e432b', c:'#3a2616', m:'#2f5a2a', l:'#4fa05a' }, g=grid(P.a);
    for(let x=0;x<16;x++){ const col=x%4===0?P.c:(x%4===2?P.b:P.a); for(let y=0;y<16;y++){ g[y][x]=(r()<0.1)?P.b:col; } }
    for(let i=0;i<5;i++) g[Math.floor(r()*16)][Math.floor(r()*16)]=P.m;
    g[7][7]=P.c; g[7][8]=P.c; g[8][7]=P.c; g[8][8]=P.c; g[6][7]=P.l; return { g, pal:P }; });
  mk('castle',(v)=>{ const r=rng(v*103+22), P={ a:'#8d949c', A:'#a8b0b8', b:'#767d85', m:'#4a5058' }, g=grid(P.a);
    for(let y=0;y<16;y++) for(let x=0;x<16;x++){ const chess=((x>>3)+(y>>3))%2===0; g[y][x]=chess?(r()<0.14?P.A:P.a):(r()<0.14?P.a:P.b); if(x%8===0||y%8===0) g[y][x]=P.m; }
    return { g, pal:P }; });
  mk('wall:castle',(v)=>{ const r=rng(v*107+23), P={ a:'#8d949c', A:'#a8b0b8', b:'#767d85', m:'#4a5058', c:'#2a4a9a', C:'#4a6ad0', y:'#d4af37' }, g=grid(P.a); bricks(g,r,P);
    for(let y=0;y<12;y++) for(let x=5;x<=10;x++) g[y][x]=(x===5||x===10)?P.c:P.C; for(let x=5;x<=10;x++) g[0][x]=P.y; g[12][6]=P.c; g[12][9]=P.c; g[13][7]=P.c; g[13][8]=P.c; g[14][7]=P.y; g[14][8]=P.y; return { g, pal:P }; });
  const has=kind=>!!FULL[kind];
  function full(kind,seed){ const o=FULL[kind](seed), pal={}; o.g.forEach(row=>row.forEach(c=>{ pal[c]=c; })); return { g:o.g, pal, opaque:true }; }   // cells hold colours directly
  return { gen, full, has, crack };
})();

// ---- the horde: variants of the ork body, and the risen skeleton ----
(()=>{
  const ork=ZOO.ork; if(!ork) return;
  const v=(name,pal)=>({ ...ork, name, humanoid:true, pal:{...ork.pal,...pal} });
  ZOO.goblin=v('Goblin',{ s:'#8aa83a', S:'#b0cc58', z:'#5a7a24', t:'#7a6a3a', T:'#9a8a52', u:'#4a3e22', c:'#5a3a24', C:'#7a5236', l:'#5a4a2a', L:'#7a6a3c', y:'#2e2414' });
  ZOO.troll=v('Troll',{ s:'#6a8a96', S:'#8fb0bc', z:'#445a64', t:'#6a8a96', T:'#8fb0bc', u:'#445a64', c:'#4a3a2a', C:'#6a5238', l:'#52707a', L:'#6e909a', y:'#2c3c42' });
  // the skeleton: bones in the skeleton family's look (skull, ribs, thin legs), eyes black with white pupils like the rest of the horde
  const N=16, mk=(w,h)=>({w,h,g:Array.from({length:h},()=>Array(w).fill('.'))});
  const put=(p,x,y,c)=>{ if(x>=0&&y>=0&&x<p.w&&y<p.h) p.g[y][x]=c; };
  const pal={ k:'rgba(0,0,0,0.30)', s:'#e8dcc8', S:'#faf3e4', z:'#b8ab94', u:'#8f836f', p:'#14100c', e:'#ffffff', w:'#f2e8d5' };
  ZOO.skeleton={ name:'Skelett', humanoid:true, pal, frame:(t,fr,mv,eq)=>{
    const f=mk(N,N), k=t%4, bob=mv?[0,-1,0,-1][k]:0, ff=mv?[-1,0,1,0][k]:0, fb=-ff, nod=mv?[0,0,1,0][k]:(Math.floor(t/2)%2?1:0);
    for(let x=4;x<=12;x++) put(f,x,15,'k');
    const skull=mk(7,7); for(let y=0;y<7;y++) for(let x=0;x<7;x++){ const dx=(x+.5-3.5)/3.3, dy=(y+.5-3.2)/3.2; if(dx*dx+dy*dy<=1) put(skull,x,y,'s'); }
    [[1,2],[2,2],[1,3],[2,3],[4,2],[5,2],[4,3],[5,3]].forEach(([x,y],i)=>put(skull,x,y,(i%4===0)?'e':'p')); put(skull,3,4,'p'); [2,3,4].forEach((x,i)=>put(skull,x,6,i%2?'p':'w'));
    const ribs=mk(8,6); for(let y=0;y<6;y++){ const w=y===5?4:8-(y>>1); const x0=Math.floor((8-w)/2); for(let x=0;x<w;x++) put(ribs,x0+x,y,(y%2===0||x===0||x===w-1)?'s':'p'); } for(let y=0;y<6;y++) put(ribs,3,y,'u');
    const leg=(x,y)=>{ for(let j=0;j<3;j++) put(f,x,y+j,'z'); put(f,x,y+2,'s'); put(f,x+1,y+2,'s'); };
    leg(6+fb,12); leg(9+ff,12);
    const blit=(p,ox,oy)=>{ for(let y=0;y<p.h;y++) for(let x=0;x<p.w;x++) if(p.g[y][x]!=='.') put(f,ox+x,oy+y,p.g[y][x]); };
    blit(ribs,4,6+bob); blit(skull,4,0+bob+nod);
    if(eq&&eq.weapon&&globalThis.TOOLGEN){ const w=TOOLGEN.weapon(eq.weapon); if(w){ const wp={}; w.px.forEach(([x,y,c])=>{ let ch=Object.keys(wp).find(q=>wp[q]===c); if(!ch){ ch=String(Object.keys(wp).length); wp[ch]=c; } const X=13-w.grip[0]+x, Y=8-w.grip[1]+y+bob; if(X>=0&&X<16&&Y>=0&&Y<15) f.g[Y][X]=ch; }); f.pal=wp; } }
    if(fr) f.g=f.g.map(r=>r.slice().reverse());
    return f; } };
})();

// ---- converted heroes: the same body on the player's side (player-side eyes, darker clothes) ----
(()=>{
  const dark=hex=>{ const m=/^#?([0-9a-f]{6})$/i.exec(hex); if(!m) return hex; const n=parseInt(m[1],16), f=(v,k)=>Math.max(0,Math.min(255,Math.round(v*k))); return '#'+[f((n>>16)&255,0.62),f((n>>8)&255,0.55),f(n&255,0.72)].map(v=>v.toString(16).padStart(2,'0')).join(''); };
  ['barbarian','thief','wizard','knight','elf','archer','monk','paladin','dwarf','giant'].forEach(k=>{
    const z=ZOO[k]; if(!z||ZOO[k+'_ally']) return;
    const pal={}; Object.keys(z.pal).forEach(c=>{ pal[c]=(c==='e'||c==='p'||c==='k')?z.pal[c]:dark(z.pal[c]); });
    ZOO[k+'_ally']={ ...z, name:z.name+' (bekehrt)', pal, frame:(t,fr,mv,eq)=>{ const f=z.frame(t,fr,mv,eq); f.g=f.g.map(r=>r.map(c=>c==='e'?'p':(c==='p'?'e':c))); return f; } };
  });
})();
