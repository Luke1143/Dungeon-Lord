// The creature kit: humanoid creatures are put together from three parts (head, body, legs) and a few extras, each part in a colour of its own.
// A new creature is a new line in KIT_LOOKS (a recipe), not new drawing code; a new shape is a new entry in the parts tables and every recipe can use it.
// Parts are drawn facing left on small grids with role letters; the kit stacks them from the ground up, poses them (bob, steps, nod) and tags the pixels
// (H head, T body, L legs), so the equipment rules of sprites.js (helm, chest, greaves, weapon, shield) work on every combination. See docs/sprite-kit.md.
(()=>{
if(typeof ZOO==='undefined'||!globalThis.SPRITEBASE) return;
const { mk, put, ell, cap, shade, eyes, eyesGood2, armour, weaponPal, MATS }=SPRITEBASE, N=16;
const rect=(p,x0,y0,x1,y1,c)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) put(p,x,y,c); };
const px=(p,list,c)=>list.forEach(([x,y])=>put(p,x,y,c));

// ---- heads: { w, h, fwd (how far it leans towards the face), draw(evil) } ; letters: s S z skin, F G hair/hat, x extra ----
const eye=(p,x,y,evil)=>{ if(evil) eyes(p,[[x,y,2,2,x,y]]); else eyesGood2(p,[[x,y]]); };
const HEADS={
  // the human head: round skull, square jaw, nose
  human:{ w:9, h:8, fwd:0, draw(evil){ const p=mk(9,8); ell(p,4.6,3.6,3.9,3.4,'s'); rect(p,1,5,5,7,'s'); put(p,0,4,'s'); put(p,0,5,'s'); shade(p,'s','S','z'); eye(p,1,3,evil); return p; } },
  // a narrow, long face (elves, vampires)
  fine:{ w:8, h:8, fwd:0, draw(evil){ const p=mk(8,8); ell(p,4.2,3.4,3.4,3.3,'s'); rect(p,1,5,4,6,'s'); rect(p,2,7,3,7,'s'); put(p,0,4,'s'); shade(p,'s','S','z'); eye(p,1,3,evil); return p; } },
  // the ork: small skull, huge jaw with a tusk
  ork:{ w:8, h:7, fwd:2, draw(evil){ const p=mk(8,7); ell(p,4,3.0,3.1,2.7,'s'); ell(p,2.4,4.6,2.3,1.5,'s'); shade(p,'s','S','z'); px(p,[[1,3],[1,4],[2,4]],'w'); if(evil) eyes(p,[[2,1,2,2,2,1]]); else eyesGood2(p,[[2,1]]); return p; } },
  // big round head with a wide mouth (goblins)
  imp:{ w:8, h:7, fwd:1, draw(evil){ const p=mk(8,7); ell(p,4,3.5,3.9,3.3,'s'); shade(p,'s','S','z'); eye(p,1,2,evil); px(p,[[1,5],[2,5],[3,5]],'z'); put(p,2,5,'w'); return p; } },
  // a heavy, low brow and a jutting jaw (trolls, giants)
  brute:{ w:9, h:7, fwd:1, draw(evil){ const p=mk(9,7); ell(p,4.5,3.2,4.3,3.0,'s'); rect(p,0,4,5,6,'s'); shade(p,'s','S','z'); rect(p,0,1,4,1,'z'); eye(p,1,2,evil); if(evil) px(p,[[0,5],[2,5]],'w'); return p; } },
  // a bare skull
  skull:{ w:8, h:7, fwd:1, draw(){ const p=mk(8,7); ell(p,4,3.0,3.8,3.0,'s'); rect(p,1,5,5,6,'s'); shade(p,'s','S','z'); eyes(p,[[1,2,2,2,1,2],[4,2,2,2,4,2]]); put(p,3,4,'p'); px(p,[[1,6],[3,6],[5,6]],'p'); return p; } },
  // the wolf: a long muzzle, a dark nose
  wolf:{ w:10, h:7, fwd:3, draw(evil){ const p=mk(10,7); ell(p,6,3.2,3.6,3.0,'s'); rect(p,0,3,5,5,'s'); rect(p,1,6,5,6,'s'); shade(p,'s','S','z'); put(p,0,3,'p'); eye(p,4,2,evil); px(p,[[1,5],[3,5]],'w'); return p; } },
  // a block of stone with one glowing eye slit
  block:{ w:8, h:6, fwd:0, draw(){ const p=mk(8,6); rect(p,0,0,7,5,'s'); put(p,0,0,'.'); put(p,7,0,'.'); shade(p,'s','S','z'); rect(p,1,2,4,2,'p'); put(p,1,2,'x'); put(p,2,2,'x'); put(p,5,4,'z'); put(p,6,3,'z'); return p; } },
  // a closed helm with a slit (knights of the dark)
  helm:{ w:8, h:8, fwd:0, draw(){ const p=mk(8,8); ell(p,4,3.6,3.8,3.5,'s'); rect(p,1,5,6,7,'s'); shade(p,'s','S','z'); rect(p,0,3,4,3,'p'); put(p,1,3,'x'); put(p,3,3,'x'); px(p,[[2,5],[2,6],[4,5],[4,6]],'z'); return p; } }
};
// ---- tops: what sits on a head (hair, hats, ears, horns); may grow above it (returns extra pixels relative to the head's top-left, y<0 is above) ----
const hairMask=(p,test)=>{ for(let y=0;y<p.h;y++) for(let x=0;x<p.w;x++){ const c=p.g[y][x]; if(c!=='.'&&c!=='p'&&c!=='e'&&c!=='w'&&test(x,y)) p.g[y][x]=(y<=0||x<=3)?'G':'F'; } };
const TOPS={
  none:()=>[],
  hair:(p)=>{ hairMask(p,(x,y)=>y<=2||(x>=p.w-3&&y<=4)); px(p,[[1,2],[2,2],[3,2]],'g'); return []; },
  long:(p)=>{ hairMask(p,(x,y)=>y<=2||x>=p.w-3); px(p,[[1,2],[2,2],[3,2]],'g'); return [[p.w-1,p.h,'F'],[p.w-2,p.h,'F'],[p.w-1,p.h+1,'F']]; },
  mohawk:(p)=>{ hairMask(p,(x,y)=>y<=1&&x>=2&&x<=p.w-2); return [[3,-1,'G'],[4,-1,'F'],[5,-1,'F'],[4,-2,'G'],[5,-2,'F']]; },
  tonsure:(p)=>{ hairMask(p,(x,y)=>x>=p.w-3&&y>=2&&y<=4); return []; },
  lionhood:(p)=>{ hairMask(p,(x,y)=>!(x<=4&&y>=2&&y<=6)); return [[p.w-3,-1,'F'],[p.w-2,-1,'G'],[p.w-2,-2,'F'],[2,-1,'F'],[2,-2,'G'],[p.w-1,p.h,'F'],[p.w-2,p.h,'F'],[p.w-1,p.h+1,'g']]; },
  hood:(p)=>{ hairMask(p,(x,y)=>!(x<=4&&y>=2&&y<=6)); return [[p.w-2,-1,'F'],[p.w-3,-1,'G']]; },
  cowl:(p)=>{ hairMask(p,(x,y)=>y<=1||x>=p.w-4); return []; },
  wizhat:(p)=>{ hairMask(p,(x,y)=>y<=1); const o=[]; for(let x=-1;x<=p.w;x++) o.push([x,0,'F']); [[1,-1,6],[2,-2,4],[3,-3,3],[4,-4,2]].forEach(([x0,y,w])=>{ for(let i=0;i<w;i++) o.push([x0+i,y,i===0?'G':'F']); }); o.push([5,-5,'F']); return o; },
  crown:(p)=>{ hairMask(p,(x,y)=>y<=1||(x>=p.w-3&&y<=4)); return [[1,-1,'y'],[3,-1,'y'],[5,-1,'y'],[1,0,'y'],[2,0,'y'],[3,0,'y'],[4,0,'y'],[5,0,'y']]; },
  horns:(p)=>[[1,-1,'x'],[0,-2,'x'],[p.w-3,-1,'x'],[p.w-2,-2,'x']],
  hornsHair:(p)=>{ hairMask(p,(x,y)=>y<=1||x>=p.w-3); return [[1,-1,'x'],[0,-2,'x'],[p.w-3,-1,'x'],[p.w-2,-2,'x'],[p.w-1,p.h,'F']]; },
  ears:(p)=>{ hairMask(p,(x,y)=>y<=2||(x>=p.w-3&&y<=5)); px(p,[[1,2],[2,2],[3,2]],'g'); return [[p.w-3,3,'s'],[p.w-2,2,'s'],[p.w-1,1,'S'],[p.w-1,p.h,'F']]; },
  bigears:(p)=>[[p.w-1,1,'s'],[p.w,0,'s'],[p.w,1,'S'],[p.w+1,0,'z'],[p.w-1,2,'z']],
  wolfears:(p)=>[[p.w-4,-1,'s'],[p.w-4,-2,'z'],[p.w-2,-1,'s'],[p.w-1,-2,'z'],[p.w-1,-1,'s']],
  leaves:(p)=>{ hairMask(p,(x,y)=>y<=2||x>=p.w-3); return [[1,-1,'G'],[3,-1,'F'],[4,-2,'G'],[6,-1,'F'],[p.w,2,'G'],[p.w,4,'F'],[p.w-1,p.h,'F'],[2,0,'y']]; },
  plume:(p)=>[[3,-1,'x'],[4,-1,'x'],[5,-1,'x'],[6,-1,'x'],[p.w,0,'x'],[p.w,1,'x'],[p.w-1,0,'x']],
  spikes:(p)=>[[1,-1,'z'],[3,-1,'z'],[5,-1,'z'],[1,-2,'s'],[5,-2,'s']],
  halo:(p)=>{ hairMask(p,(x,y)=>y<=2||(x>=p.w-3&&y<=5)); return [[2,-2,'y'],[3,-2,'y'],[4,-2,'y'],[5,-2,'y']]; },
  bonecrown:(p)=>[[1,-1,'y'],[3,-1,'y'],[5,-1,'y'],[1,-2,'y'],[5,-2,'y'],[3,-2,'x']]
};
// ---- bodies: letters t T u cloth, y trim; `robe` bodies reach the ground and need no legs ----
const BODIES={
  tunic:()=>{ const p=mk(9,7); ell(p,4.5,3.5,4.3,3.3,'t'); shade(p,'t','T','u'); for(let x=0;x<9;x++) if(p.g[4][x]!=='.') p.g[4][x]='u'; put(p,3,4,'y'); return p; },
  slim:()=>{ const p=mk(7,7); ell(p,3.5,3.5,3.2,3.4,'t'); shade(p,'t','T','u'); for(let x=0;x<7;x++) if(p.g[4][x]!=='.') p.g[4][x]='y'; return p; },
  broad:()=>{ const p=mk(10,8); ell(p,5,4.0,4.3,3.7,'t'); ell(p,4.2,4.8,2.0,2.0,'T'); shade(p,'t','T','u'); for(let x=1;x<9;x++) if(p.g[6][x]!=='.') p.g[6][x]='y'; return p; },
  bulk:()=>{ const p=mk(12,9); ell(p,6,5.0,5.8,3.9,'t'); ell(p,7.5,2.6,4.2,2.6,'t'); ell(p,4.6,5.6,2.4,2.2,'T'); shade(p,'t','T','u'); for(let x=1;x<11;x++) if(p.g[7][x]!=='.') p.g[7][x]='y'; return p; },
  small:()=>{ const p=mk(7,5); ell(p,3.5,2.5,3.3,2.4,'t'); shade(p,'t','T','u'); for(let x=0;x<7;x++) if(p.g[3][x]!=='.') p.g[3][x]='y'; return p; },
  stout:()=>{ const p=mk(10,6); ell(p,5,3,4.8,2.9,'t'); shade(p,'t','T','u'); for(let x=0;x<10;x++) if(p.g[4][x]!=='.') p.g[4][x]='u'; put(p,3,4,'y'); put(p,4,4,'y'); return p; },
  stone:()=>{ const p=mk(11,8); rect(p,1,0,9,7,'t'); rect(p,0,1,10,5,'t'); shade(p,'t','T','u'); px(p,[[3,2],[4,3],[4,4],[7,1],[7,2],[6,5]],'u'); put(p,5,3,'y'); return p; },
  ribs:()=>{ const p=mk(8,7); ell(p,4,2.6,3.8,2.5,'t'); rect(p,3,5,4,6,'t'); shade(p,'t','T','u'); [1,3].forEach(y=>{ for(let x=2;x<=5;x++) if(p.g[y][x]!=='.') p.g[y][x]='p'; }); return p; },
  robe:()=>{ const p=mk(9,10); for(let y=0;y<10;y++){ const hw=2.3+y*0.34; for(let x=0;x<9;x++) if(Math.abs(x+.5-4.5)<=hw) put(p,x,y,'t'); } shade(p,'t','T','u'); for(let x=0;x<9;x++) if(p.g[9][x]!=='.') p.g[9][x]='u'; for(let y=1;y<9;y++) put(p,3,y,'y'); p.robe=true; return p; },
  gown:()=>{ const p=mk(8,10); for(let y=0;y<10;y++){ const hw=y<4?2.6:2.0+(y-3)*0.34; for(let x=0;x<8;x++) if(Math.abs(x+.5-4)<=hw) put(p,x,y,'t'); } shade(p,'t','T','u'); for(let x=0;x<8;x++) if(p.g[3][x]!=='.') p.g[3][x]='y'; p.robe=true; return p; }
};
// ---- legs: letters l L d, foot f ----
const LEGS={
  boots:()=>{ const p=mk(3,4); cap(p,1.5,0.6,1.5,3.0,1.1,'l'); shade(p,'l','L','d'); px(p,[[0,3],[1,3],[2,3],[0,2],[1,2]],'f'); return p; },
  stumps:()=>{ const p=mk(4,4); cap(p,2,0.6,2,3.0,1.5,'l'); shade(p,'l','L','d'); return p; },
  short:()=>{ const p=mk(3,2); rect(p,0,0,2,1,'l'); put(p,2,0,'d'); px(p,[[0,1],[1,1],[2,1]],'f'); return p; },
  thin:()=>{ const p=mk(2,4); rect(p,0,0,1,3,'l'); put(p,1,0,'d'); put(p,1,1,'d'); put(p,0,3,'f'); put(p,1,3,'f'); return p; },
  pillars:()=>{ const p=mk(4,4); rect(p,0,0,3,3,'l'); rect(p,3,0,3,2,'d'); put(p,0,0,'L'); rect(p,0,3,3,3,'f'); return p; },
  paws:()=>{ const p=mk(3,4); rect(p,1,0,2,2,'l'); put(p,2,1,'d'); rect(p,0,3,2,3,'l'); put(p,0,3,'L'); return p; },
  bones:()=>{ const p=mk(2,4); rect(p,1,0,1,3,'l'); put(p,0,3,'L'); return p; }
};
// ---- extras behind the body: (set, B, t) with B = { x0,x1,y0,y1 } of the body; letters o O (colour `back`) ----
const BACKS={
  cape:(set,B)=>{ for(let y=B.y0+1;y<=13;y++){ set(B.x1+1,y,'o'); if(y>B.y0+3) set(B.x1+2,y,y%2?'o':'O'); } set(B.x1,B.y0,'o'); },
  tail:(set,B,t)=>{ const w=Math.floor(t/2)%2; [[1,5],[2,4],[3,3],[4,2+w],[4,1+w]].forEach(([dx,dy])=>set(B.x1+dx,B.y0+dy,'o')); set(B.x1+5,B.y0+w,'O'); },
  wolftail:(set,B,t)=>{ const w=Math.floor(t/2)%2; [[1,4],[2,3+w],[3,3+w],[2,4+w],[3,2+w]].forEach(([dx,dy])=>set(B.x1+dx,B.y0+dy,'o')); },
  batwings:(set,B,t)=>{ const up=Math.floor(t/2)%2?-1:0; [[1,-2,'O'],[2,-3,'O'],[3,-3,'O'],[4,-2,'O'],[2,-2,'o'],[3,-2,'o'],[1,-1,'o'],[2,-1,'o'],[3,-1,'o'],[4,-1,'O'],[1,0,'o'],[2,0,'o'],[3,0,'o'],[4,0,'O'],[2,1,'o'],[4,1,'O']].forEach(([dx,dy,c])=>set(B.x1+dx-1,B.y0+1+dy+up,c)); },
  wings:(set,B,t)=>{ const up=Math.floor(t/2)%2?-1:0; [[0,-1],[1,-2],[2,-3],[3,-3],[1,-1],[2,-2],[3,-2],[1,0],[2,-1],[3,-1],[2,0],[3,0],[2,1],[3,1],[3,2],[3,3]].forEach(([dx,dy])=>set(B.x1+dx,B.y0+1+dy+up,(dx+dy)%2?'O':'o')); },
  pack:(set,B)=>{ rectSet(set,B.x1,B.y0+1,B.x1+1,B.y0+4,'o'); set(B.x1+1,B.y0+1,'O'); },
  quiver:(set,B)=>{ [[0,-1],[1,-2],[0,0],[1,-1],[1,0]].forEach(([dx,dy])=>set(B.x1+dx,B.y0+dy,'o')); set(B.x1+1,B.y0-3,'O'); set(B.x1+2,B.y0-3,'O'); }
};
const rectSet=(set,x0,y0,x1,y1,c)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) set(x,y,c); };
// ---- marks in front: (f, H, B) boxes of head and body; drawn over the finished figure ----
const at=(f,x,y)=>(x>=0&&y>=0&&x<N&&y<15)?f.g[y][x]:'.', on=(f,x,y,c)=>{ if(x>=0&&y>=0&&x<N&&y<15) f.g[y][x]=c; }, over=(f,x,y,c)=>{ if(at(f,x,y)!=='.') f.g[y][x]=c; };
const MARKS={
  beard:(f,H)=>{ [[2,5],[3,5],[4,5],[1,6],[2,6],[3,6],[4,6],[5,6],[2,7],[3,7],[4,7],[3,8]].forEach(([dx,dy])=>on(f,H.x0+dx,H.y0+dy,dy>=7?'g':'F')); },
  fangs:(f,H)=>over(f,H.x0+1,H.y0+6,'w'),
  collar:(f,H,B)=>{ [[B.x1,B.y0-1],[B.x1+1,B.y0-2],[B.x1-1,B.y0]].forEach(([x,y])=>on(f,x,y,'x')); },
  rot:(f,H,B)=>{ [[B.x0+1,B.y0+2],[B.x1-2,B.y0+4],[H.x0+5,H.y0+4]].forEach(([x,y])=>over(f,x,y,'x')); },
  moss:(f,H,B)=>{ [[B.x0+2,B.y0],[B.x0+3,B.y0],[B.x1-2,B.y0],[H.x1-1,H.y0],[H.x1-2,H.y0]].forEach(([x,y])=>over(f,x,y,'X')); },
  pelt:(f,H)=>{ for(let y=H.y0;y<=H.y0+2;y++) for(let x=H.x0;x<=H.x1;x++){ const c=at(f,x,y); if(c!=='.'&&c!=='p'&&c!=='e') on(f,x,y,y===H.y0?'X':'x'); } for(let y=H.y0+3;y<=H.y0+6;y++) on(f,H.x1,y,'x'); on(f,H.x0+2,H.y0-1,'x'); on(f,H.x1-1,H.y0-1,'x'); },
  sash:(f,H,B)=>{ for(let i=0;i<=B.x1-B.x0;i++){ const x=B.x0+i, y=B.y0+1+Math.floor(i*0.6); if(at(f,x,y)!=='.'&&f.tag[y][x]==='T') f.g[y][x]='x'; } }
};

// ---- colours: one colour per part, the light and the dark shade are derived ----
const hex=c=>{ const n=parseInt(c.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; };
const mix=(c,k)=>'#'+hex(c).map(v=>Math.max(0,Math.min(255,Math.round(k>1?v+(255-v)*(k-1):v*k))).toString(16).padStart(2,'0')).join('');
function palette(c){
  const P={ k:'rgba(0,0,0,0.30)', p:'#14100c', e:'#ffffff', w:'#f2e8d5' };
  const tri=(base,a,b,d)=>{ if(!base) return; P[a]=base; P[b]=mix(base,1.28); P[d]=mix(base,0.66); };
  tri(c.skin,'s','S','z'); tri(c.body,'t','T','u'); tri(c.legs||c.body,'l','L','d');
  const hair=c.hair||c.body; P.F=hair; P.G=mix(hair,1.3); P.g=mix(hair,0.6);
  P.f=c.feet||mix(c.legs||c.body,0.55); P.y=c.trim||mix(c.body,0.6);
  const ex=c.extra||c.trim||c.body; P.x=ex; P.X=mix(ex,1.35);
  const bk=c.back||ex; P.o=bk; P.O=mix(bk,1.35);
  return P;
}

// ---- the figure ----
function build(look,t,facingRight,moving,equip){
  const f=mk(N,N), k=t%4; f.tag=Array.from({length:N},()=>Array(N).fill(''));
  const evil=!look.good, head=HEADS[look.head].draw(evil), extra=(TOPS[look.top||'none'])(head)||[], body=BODIES[look.body](), leg=body.robe?null:LEGS[look.legs||'boots']();
  const bob=moving?[0,-1,0,-1][k]:0, ff=moving?[-1,0,1,0][k]:0, fb=-ff, nod=moving?[0,0,1,0][k]:(Math.floor(t/2)%2?1:0);
  // the stack, from the ground up
  const legTop=leg?15-leg.h:15, by=(body.robe?15-body.h:legTop-body.h+1)+(look.bodyDy||0), bx=Math.round(7.5-body.w/2+0.01)+(look.bodyDx||0);
  const hx=Math.round(7.5-head.w/2)-HEADS[look.head].fwd+(look.headDx||0), room=Math.max(0,...extra.map(e=>-e[1])), hy=Math.max(look.headMin||0,room,by-head.h+(look.neck===undefined?3:look.neck));       // what grows above the head (a hat, horns) pushes it down into the shoulders
  const tb=(part,ox,oy,tag)=>{ for(let y=0;y<part.h;y++) for(let x=0;x<part.w;x++){ const c=part.g[y][x]; if(c!=='.'&&ox+x>=0&&oy+y>=0&&ox+x<N&&oy+y<N){ f.g[oy+y][ox+x]=c; f.tag[oy+y][ox+x]=tag; } } };
  const set=(x,y,c)=>{ if(x>=0&&y>=0&&x<N&&y<15) f.g[y][x]=c; };
  for(let x=4;x<=12;x++) put(f,x,15,'k');
  const B={ x0:bx, x1:bx+body.w-1, y0:by+bob, y1:by+bob+body.h-1 }, H={ x0:hx, x1:hx+head.w-1, y0:hy+bob+nod, y1:hy+bob+nod+head.h-1 };
  (look.back||[]).forEach(b=>BACKS[b](set,B,t));
  if(leg){ const span=2*leg.w+1, lx=bx+Math.round((body.w-span)/2+0.5); tb(leg,lx+leg.w+1+fb,legTop,'L'); tb(body,bx,by+bob,'T'); tb(leg,lx+ff,legTop,'L'); }
  else { tb(body,bx,by+bob,'T'); set(bx+2+ff,14,'f'); set(bx+body.w-3+fb,14,'f'); }
  tb(head,H.x0,H.y0,'H');
  extra.forEach(([x,y,c])=>{ const X=H.x0+x, Y=H.y0+y; if(X>=0&&X<N&&Y>=0&&Y<15&&(f.g[Y][X]==='.'||f.tag[Y][X]==='H'||y<0)){ f.g[Y][X]=c; f.tag[Y][X]=y>=0&&y<head.h&&x>=0&&x<head.w?'H':''; } });
  (look.marks||[]).forEach(m=>MARKS[m](f,H,B));
  const wear=look.wear?Object.assign({},look.wear,equip?{ weapon:equip.weapon, shield:equip.shield, weapon2:equip.weapon2, wparts:equip.wparts, wparts2:equip.wparts2, wmat:equip.wmat }:{}):equip;
  if(wear){ armour(f,wear); f.pal={ R:'#b02a2a', ...weaponPal(wear.wmat), ...(MATS[wear.mat||'eisen']) }; }
  if(facingRight) f.g=f.g.map(r=>r.slice().reverse());
  return f;
}
const swapEyes=f=>{ f.g=f.g.map(r=>r.map(c=>c==='e'?'p':(c==='p'?'e':c))); return f; };
function entry(look){ return { name:look.name, humanoid:true, kit:look, pal:palette(look.colors), frame:(t,fr,mv,eq)=>build(look,t,fr,mv,eq) }; }
// a converted hero (the player's side): darker cloth, the eyes of the horde
function ally(z){ const pal={}; Object.keys(z.pal).forEach(c=>{ pal[c]=(c==='e'||c==='p'||c==='k'||c==='w')?z.pal[c]:mix(z.pal[c],0.66); }); return { ...z, name:z.name+' (bekehrt)', pal, frame:(t,fr,mv,eq)=>swapEyes(z.frame(t,fr,mv,eq)) }; }

// ---- the recipes: head + top, body, legs, extras, colours (skin, hair, body, legs, trim, extra) ----
const L=(name,head,top,body,legs,colors,more)=>Object.assign({ name, head, top, body, legs, colors },more||{});
const SKIN='#e0b48c', TAN='#d09a74', PALE='#e6d6b4';
const KIT_LOOKS={
  // the heroes and their allies
  barbarian:L('Barbar','human','mohawk','tunic','boots',{ skin:TAN, hair:'#b0561e', body:'#8a4a28', legs:'#7a5a3c', trim:'#d4af37', extra:'#c9a36a' },{ good:true, back:['pack'] }),
  thief:L('Dieb','human','hood','slim','thin',{ skin:SKIN, hair:'#3a3a46', body:'#3a3a46', legs:'#2a2a32', trim:'#8a2a2a' },{ good:true }),
  worker:L('Arbeiter','human','hair','tunic','boots',{ skin:SKIN, hair:'#6a4a2a', body:'#7a6a4a', legs:'#5a4a30', trim:'#4a3e28' },{ good:true }),
  wizard:L('Zauberer','human','wizhat','robe',null,{ skin:SKIN, hair:'#4a5ab0', body:'#4a5ab0', trim:'#e8c04a', feet:'#3a2c1a' },{ good:true, marks:['beard'] }),
  elf:L('Elf','fine','ears','slim','thin',{ skin:PALE, hair:'#d8d090', body:'#2f7a3a', legs:'#3a5a2a', trim:'#d4af37' },{ good:true }),
  archer:L('Bogenschütze','human','cowl','slim','boots',{ skin:SKIN, hair:'#3a6a3a', body:'#5a6a3a', legs:'#4a3a24', trim:'#3a2a18', extra:'#7a5a3a' },{ good:true, back:['quiver'] }),
  monk:L('Mönch','human','tonsure','gown',null,{ skin:SKIN, hair:'#6a4a2a', body:'#c8741c', trim:'#f2e8d5', feet:'#5a3a20' },{ good:true }),
  knight:L('Ritter','helm','plume','tunic','boots',{ skin:'#8d949c', body:'#8d949c', legs:'#6a7078', trim:'#d4af37', extra:'#b02a2a', feet:'#3a3e44' },{ good:true }),
  paladin:L('Paladin','helm','halo','stout','pillars',{ skin:'#e8e4d8', body:'#e8e4d8', legs:'#c8c4b8', trim:'#f0d060', extra:'#f0d060', back:'#2a4a9a', feet:'#8a8678' },{ good:true, back:['cape'] }),
  dwarf:L('Zwerg','human','hair','stout','short',{ skin:TAN, hair:'#b8561e', body:'#6a4a30', legs:'#5a3a24', trim:'#d4af37' },{ good:true, marks:['beard'] }),
  giant:L('Riese','brute','hair','bulk','pillars',{ skin:TAN, hair:'#3a2a1a', body:'#7a8a5e', legs:'#5a4a36', trim:'#c9a36a', feet:'#3a2c1c' },{ good:true, marks:['beard'] }),
  dryad:L('Dryade','fine','leaves','gown',null,{ skin:'#b8d090', hair:'#3f8a4a', body:'#6a4a2a', trim:'#e86ad0', feet:'#4a3420' },{ good:true }),
  golem:L('Golem','block','none','stone','pillars',{ skin:'#8a8a92', body:'#7c7c84', legs:'#6a6a72', trim:'#6ad0ff', extra:'#6ad0ff', feet:'#4a4a52' },{ good:true, marks:['moss'], neck:1 }),
  angel:L('Engel','human','halo','gown',null,{ skin:SKIN, hair:'#f0d8a0', body:'#f4f0e4', trim:'#f0d060', extra:'#ffffff', feet:'#c8c0a8' },{ good:true, back:['wings'] }),
  guardian:L('Schutzengel','fine','halo','slim','thin',{ skin:PALE, hair:'#bfe8ff', body:'#cfe4f4', legs:'#a8c4dc', trim:'#6aa8d8', extra:'#eaf6ff' },{ good:true, back:['wings'] }),
  // the bosses
  dwarfking:L('Zwergenkönig','human','crown','stout','short',{ skin:TAN, hair:'#b8561e', body:'#5a2c14', legs:'#4a2410', trim:'#f0d060', back:'#8a1a1a' },{ good:true, marks:['beard'], back:['cape'] }),
  oberon:L('Oberon','fine','leaves','robe',null,{ skin:'#e2d4b4', hair:'#e8e0a0', body:'#2f7a3a', trim:'#f0d060', extra:'#b02a2a', feet:'#1f3a1a' },{ good:true, back:['cape'] }),
  herakles:L('Herakles','human','lionhood','bulk','boots',{ skin:TAN, hair:'#d8a048', body:'#c08a62', legs:'#7a4a14', trim:'#5a3410', back:'#c8801c', feet:'#4a2c0c' },{ good:true, back:['cape'] }),
  arthur:L('Artus','human','crown','tunic','boots',{ skin:SKIN, hair:'#c8a030', body:'#2a4a9a', legs:'#8d949c', trim:'#f0d060', extra:'#b02a2a' },{ good:true, marks:['beard'], back:['cape'] }),
  // the horde
  ork:L('Ork','ork','none','broad','stumps',{ skin:'#5f8f3a', body:'#5f8f3a', legs:'#4e6b30', trim:'#6b4a35' }),
  goblin:L('Goblin','imp','bigears','small','short',{ skin:'#8aa83a', body:'#7a6a3a', legs:'#5a4a2a', trim:'#5a3a24' }),
  troll:L('Troll','brute','spikes','bulk','pillars',{ skin:'#6a8a96', body:'#6a8a96', legs:'#52707a', trim:'#4a3a2a', feet:'#3a4e56' }),
  ghoul:L('Ghul','skull','none','ribs','bones',{ skin:'#a2b07e', body:'#7e8c5e', legs:'#566240', trim:'#3e3e30' },{ headDx:-1 }),
  zombie:L('Zombie','human','hair','tunic','thin',{ skin:'#7a9a6a', hair:'#3a3a2c', body:'#5a5a46', legs:'#3a3a2c', trim:'#34342a', extra:'#8a2a2a' },{ marks:['rot'], headDx:-1 }),
  priest:L('Dunkler Priester','human','hood','robe',null,{ skin:'#b09a8a', hair:'#2a1a3a', body:'#2a1a3a', trim:'#b02a2a', feet:'#120a1a' }),
  darkelf:L('Dunkelelf','fine','ears','slim','thin',{ skin:'#6a6a9a', hair:'#e8e8f0', body:'#1e1a2e', legs:'#161224', trim:'#8a2a8a' }),
  vampire:L('Vampir','fine','hair','slim','thin',{ skin:'#d8d0d0', hair:'#1a1014', body:'#1a1014', legs:'#1a1014', trim:'#8f1a28', extra:'#6a0f1a' },{ back:['cape'], marks:['fangs','collar'] }),
  darkknight:L('Dunkler Ritter','helm','horns','tunic','boots',{ skin:'#3a3a48', body:'#25252f', legs:'#1c1c24', trim:'#8a1a1a', extra:'#e02818', back:'#6a0f1a', feet:'#0e0e14' },{ back:['cape'] }),
  succubus:L('Succubus','fine','hornsHair','slim','thin',{ skin:'#e0a0b8', hair:'#34102c', body:'#8a2a70', legs:'#44163a', trim:'#f0d060', extra:'#f0e0c0', back:'#b03a5a' },{ back:['batwings'] }),
  demon:L('Dämon','brute','horns','broad','stumps',{ skin:'#c43a1c', body:'#8a2418', legs:'#4a0e0c', trim:'#2a0605', extra:'#f0e0c0', back:'#3a0a14' },{ back:['batwings'] }),
  werewolf:L('Werwolf','wolf','wolfears','broad','paws',{ skin:'#6a4a34', body:'#5a3e2a', legs:'#4a3220', trim:'#765238', extra:'#6a4a34' },{ back:['wolftail'] }),
  lich:L('Lich','skull','bonecrown','robe',null,{ skin:'#e8e0d0', body:'#3a1a5a', trim:'#f0c040', extra:'#6ad0ff', feet:'#120820' })
};
globalThis.SPRITEKIT={ HEADS, TOPS, BODIES, LEGS, BACKS, MARKS, LOOKS:KIT_LOOKS, build, palette, entry };
Object.keys(KIT_LOOKS).forEach(k=>{ const z=entry(KIT_LOOKS[k]); ZOO[k]=z; if(KIT_LOOKS[k].good) ZOO[k+'_ally']=ally(z); else delete ZOO[k+'_ally']; });
// ================= the beasts: four-legged creatures from the same idea (body, head, legs, tail, extras; one colour per part) =================
// Everything is drawn facing left straight into the 16x16 frame. Letters: b B d body, h H q head, l L legs, n snout/beak/claws, c C accent, v V wings, x horn.
const BEAST_BODIES={       // the box of the trunk; the head sits at its front (left), the tail at its back
  barrel:{ x0:4, x1:12, y0:6, y1:10 }, lean:{ x0:5, x1:12, y0:7, y1:10 }, low:{ x0:4, x1:11, y0:8, y1:11 }, big:{ x0:3, x1:12, y0:5, y1:11 }
};
// eyes of two pixels: the horde looks out of a dark eye with a white glint in front, the good ones out of a white eye with a dark pupil in front
const beye=(P,evil,front,y)=>{ P(front+1,y,evil?'p':'e'); P(front,y,evil?'e':'p'); };
const BEAST_HEADS={       // (P, ax, ay, evil, t): ax = the trunk's front column, ay = its shoulder row; returns the top-front corner (for horns and hats)
  cat:(P,ax,ay,evil)=>{ for(let y=ay-3;y<=ay;y++) for(let x=ax-3;x<=ax;x++) P(x,y,y===ay-3?'H':'h'); P(ax-3,ay-4,'h'); P(ax,ay-4,'h'); P(ax-3,ay-5,'q'); P(ax,ay-5,'q'); beye(P,evil,ax-3,ay-2); P(ax-4,ay-1,'n'); P(ax-3,ay,'q'); return { x:ax-2, y:ay-4 }; },
  fox:(P,ax,ay,evil)=>{ for(let y=ay-3;y<=ay-1;y++) for(let x=ax-2;x<=ax;x++) P(x,y,y===ay-3?'H':'h'); P(ax-3,ay-1,'n'); P(ax-4,ay-1,'n'); P(ax-3,ay-2,'h'); P(ax-5,ay-1,'p'); P(ax-1,ay-4,'h'); P(ax,ay-4,'h'); P(ax,ay-5,'c'); P(ax-1,ay-5,'c'); beye(P,evil,ax-2,ay-2); P(ax,ay,'h'); P(ax-1,ay,'n'); return { x:ax-2, y:ay-4 }; },
  horse:(P,ax,ay,evil)=>{ P(ax,ay,'h'); P(ax,ay-1,'h'); P(ax+1,ay-1,'h'); P(ax,ay-2,'h'); P(ax+1,ay-2,'c'); P(ax+1,ay-3,'c'); P(ax+2,ay-1,'c'); P(ax+1,ay,'c');
    for(let y=ay-5;y<=ay-3;y++) for(let x=ax-2;x<=ax;x++) P(x,y,y===ay-5?'H':'h'); P(ax-3,ay-4,'n'); P(ax-3,ay-3,'n'); P(ax-4,ay-3,'n'); P(ax,ay-6,'h'); beye(P,evil,ax-2,ay-4); return { x:ax-2, y:ay-6 }; },
  lizard:(P,ax,ay,evil,t)=>{ for(let x=ax-3;x<=ax;x++) P(x,ay-1,'H'); for(let x=ax-5;x<=ax;x++) P(x,ay,'h'); for(let x=ax-4;x<=ax;x++) P(x,ay+1,'n'); beye(P,evil,ax-3,ay-1); if(t%4===2){ P(ax-6,ay,'c'); P(ax-7,ay-1,'c'); } return { x:ax-2, y:ay-2 }; },
  dragon:(P,ax,ay,evil)=>{ P(ax,ay+1,'h'); P(ax+1,ay,'h'); for(let y=ay-3;y<=ay;y++) for(let x=ax-3;x<=ax;x++) P(x,y,y===ay-3?'H':'h'); for(let x=ax-5;x<=ax-4;x++){ P(x,ay-1,'h'); P(x,ay,'q'); } P(ax-5,ay-2,'h'); P(ax-5,ay-1,'n');
    P(ax-4,ay+1,'e'); P(ax-2,ay+1,'e'); P(ax-1,ay-4,'c'); P(ax,ay-4,'c'); P(ax,ay-5,'C'); P(ax+1,ay-5,'c'); beye(P,evil,ax-3,ay-2); return { x:ax-2, y:ay-4 }; },
  eagle:(P,ax,ay,evil)=>{ P(ax,ay,'H'); P(ax+1,ay,'h'); for(let y=ay-4;y<=ay-1;y++) for(let x=ax-2;x<=ax;x++) P(x,y,'H'); P(ax+1,ay-2,'h'); P(ax+1,ay-1,'h'); P(ax-3,ay-2,'n'); P(ax-4,ay-2,'n'); P(ax-4,ay-1,'n'); P(ax-3,ay-1,'n'); beye(P,evil,ax-2,ay-3); P(ax,ay-5,'h'); return { x:ax-2, y:ay-5 }; }
};
const BEAST_LEGS={       // (P, x, yTop, step, near, front): one leg from the trunk down to the ground (row 14)
  thin:(P,x,y0,d,near)=>{ for(let y=y0;y<14;y++) P(x+d,y,near?'l':'L'); P(x+d-1,14,'L'); P(x+d,14,'L'); },
  thick:(P,x,y0,d,near)=>{ for(let y=y0;y<=14;y++){ P(x+d,y,near?'l':'L'); P(x+d+1,y,'L'); } P(x+d-1,14,'n'); },
  paws:(P,x,y0,d,near)=>{ for(let y=y0;y<14;y++) P(x+d,y,near?'l':'L'); P(x+d-1,14,near?'n':'L'); P(x+d,14,near?'l':'L'); },
  splay:(P,x,y0,d,near,front)=>{ for(let y=y0;y<=13;y++) P(x+d,y,near?'l':'L'); const s=front?-1:1; P(x+d+s,13,'L'); P(x+d+s,14,'L'); P(x+d+2*s,14,'l'); },
  talons:(P,x,y0,d,near,front)=>{ const c=front?'n':(near?'l':'L'); for(let y=y0;y<14;y++) P(x+d,y,c); P(x+d-1,14,front?'n':'L'); P(x+d,14,c); if(front) P(x+d-2,14,'n'); }
};
const BEAST_TAILS={       // (P, x, y, t, n): from the trunk's back column outwards
  stub:(P,x,y)=>{ P(x,y,'b'); P(x+1,y-1,'c'); },
  drag:(P,x,y,t)=>{ const s=Math.floor(t/2)%2; P(x,y,'b'); P(x,y+1,'b'); P(x+1,y+1,'b'); P(x+1,y+2,'d'); P(x+2,y+2,'b'); P(x+3,y+2+s,'d'); P(x+4,y+2+s,'d'); },
  up:(P,x,y,t)=>{ const s=Math.floor(t/2)%2; P(x,y,'b'); P(x+1,y-1,'b'); P(x+1,y-2,'b'); P(x+2,y-3,'b'); P(x+2,y-4,'b'); P(x+1+s,y-5,'c'); },
  bushy:(P,x,y,t,n)=>{ for(let i=0;i<(n||1);i++){ const ty=y-1+i*2-(n>1?1:0); P(x,ty,'b'); P(x+1,ty,'b'); P(x+1,ty-1,'B'); P(x+2,ty-1,'b'); P(x+2,ty,'b'); P(x+3,ty-1,'c'); P(x+3,ty,'c'); } },
  hair:(P,x,y,t)=>{ const s=Math.floor(t/2)%2; P(x,y,'c'); P(x,y+1,'c'); P(x+1,y+1,'c'); P(x+1,y+2,'C'); P(x+1+s,y+3,'c'); P(x+1+s,y+4,'C'); },
  spade:(P,x,y,t)=>{ const s=Math.floor(t/2)%2; P(x,y+1,'b'); P(x+1,y,'b'); P(x+1,y+1,'d'); P(x+2,y-1,'b'); P(x+2,y-2-s,'b'); P(x+1,y-3-s,'c'); P(x+2,y-3-s,'c'); P(x+3,y-3-s,'c'); P(x+2,y-4-s,'C'); },
  lion:(P,x,y,t)=>{ const s=Math.floor(t/2)%2; P(x,y,'b'); P(x+1,y+1,'b'); P(x+2,y+1,'b'); P(x+2,y-s,'b'); P(x+2,y-1-s,'c'); P(x+3,y-1-s,'c'); P(x+2,y-2-s,'C'); }
};
const BEAST_EXTRAS={      // (P, B, top, t): B = trunk box (with the bob), top = the head's top-front corner
  ridge:(P,B)=>{ for(let x=B.x0+2;x<=B.x1-1;x+=2) P(x,B.y0-1,'c'); },
  featherwings:(P,B,top,t)=>{ const up=Math.floor(t/2)%2, x=B.x0+3, y=B.y0; (up?[[0,-1],[1,-2],[2,-3],[3,-4],[4,-4],[1,-1],[2,-2],[3,-3],[4,-3],[5,-3],[2,-1],[3,-2],[4,-2],[3,-1]]:[[0,-1],[1,-1],[2,-1],[3,-1],[4,-1],[5,0],[1,0],[2,0],[3,0],[4,0],[2,1],[3,1],[4,1],[5,1],[4,2],[5,2]]).forEach(([dx,dy],i)=>P(x+dx,y+dy,i%3===0?'V':'v')); },
  batwings:(P,B,top,t)=>{ const up=Math.floor(t/2)%2, x=B.x0+2, y=B.y0; (up?[[0,-1],[1,-2],[2,-3],[3,-4],[4,-5],[5,-5],[6,-4],[1,-1],[2,-2],[3,-3],[4,-4],[5,-4],[2,-1],[3,-2],[4,-3],[6,-3],[4,-2],[6,-2]]:[[0,-1],[1,-2],[2,-3],[3,-3],[4,-3],[5,-2],[6,-1],[1,-1],[2,-2],[3,-2],[4,-2],[2,-1],[3,-1],[4,-1],[5,-1],[6,0]]).forEach(([dx,dy],i)=>P(x+dx,y+dy,i<7?'V':'v')); },
  horn:(P,B,top)=>{ P(top.x-1,top.y,'x'); P(top.x-2,top.y-1,'x'); P(top.x-3,top.y-2,'x'); },
  cap:(P,B,top)=>{ for(let x=top.x-1;x<=top.x+2;x++) P(x,top.y+1,'e'); P(top.x,top.y,'x'); P(top.x+1,top.y,'x'); P(top.x+2,top.y,'x'); P(top.x+2,top.y-1,'x'); P(top.x+3,top.y-1,'x'); P(top.x+4,top.y,'e'); },
  belly:(P,B)=>{ for(let x=B.x0+2;x<=B.x1-2;x++) P(x,B.y1,'n'); },
  stripes:(P,B)=>{ for(let x=B.x0+3;x<=B.x1-1;x+=2){ P(x,B.y0,'q'); P(x,B.y0+1,'q'); } }
};
function beastPalette(c){
  const P={ k:'rgba(0,0,0,0.30)', p:'#14100c', e:'#ffffff' }, tri=(base,a,b,d)=>{ P[a]=base; P[b]=mix(base,1.3); P[d]=mix(base,0.62); };
  tri(c.body,'b','B','d'); tri(c.head||c.body,'h','H','q'); P.l=c.legs||mix(c.body,0.85); P.L=mix(P.l,0.62);
  P.n=c.snout||mix(c.body,1.4); P.c=c.accent||mix(c.body,0.6); P.C=mix(P.c,1.35); P.v=c.wing||c.body; P.V=mix(P.v,1.35); P.x=c.horn||P.c;
  return P;
}
function beastFrame(look,t,facingRight,moving){
  const f=mk(N,N), k=t%4, bob=moving?[0,-1,0,-1][k]:0, ff=moving?[-1,0,1,0][k]:0, fb=-ff, evil=!look.good;
  const P=(x,y,c)=>{ if(x>=0&&y>=0&&x<N&&y<15) f.g[y][x]=c; };
  const T=Object.assign({},BEAST_BODIES[look.body],look.box||{}), B={ x0:T.x0, x1:T.x1, y0:T.y0+bob, y1:T.y1+bob };
  for(let x=T.x0;x<=T.x1;x++) put(f,x,15,'k');
  const ex=look.extras||[], leg=BEAST_LEGS[look.legs||'thin'];
  ex.filter(e=>/wings/.test(e)).forEach(e=>BEAST_EXTRAS[e](P,B,null,t));       // wings lie behind the trunk
  // far legs, the tail, the trunk, near legs, the head
  leg(P,T.x0+3,T.y1,fb,false,true); leg(P,T.x1-3,T.y1,ff,false,false);
  BEAST_TAILS[look.tail||'stub'](P,T.x1+1,B.y0+1,t,look.tails);
  const cx=(T.x0+T.x1)/2, cy=(B.y0+B.y1)/2, rx=(T.x1-T.x0)/2+0.4, ry=(T.y1-T.y0)/2+0.45;
  for(let y=B.y0;y<=B.y1;y++) for(let x=T.x0;x<=T.x1;x++){ const dx=(x-cx)/rx, dy=(y-cy)/ry; if(dx*dx+dy*dy<=1) P(x,y,y===B.y0?'B':(y===B.y1?'d':'b')); }
  leg(P,T.x0+1,T.y1,ff,true,true); leg(P,T.x1-1,T.y1,fb,true,false);
  const top=BEAST_HEADS[look.head](P,T.x0+1,B.y0+(look.headDy===undefined?1:look.headDy),evil,t);
  ex.filter(e=>!/wings/.test(e)).forEach(e=>BEAST_EXTRAS[e](P,B,top,t));
  if(facingRight) f.g=f.g.map(r=>r.slice().reverse());
  return f;
}
const beastEntry=look=>({ name:look.name, humanoid:false, beast:look, pal:beastPalette(look.colors), frame:(t,fr,mv)=>beastFrame(look,t,fr,mv) });
const Q=(name,body,head,legs,tail,colors,more)=>Object.assign({ name, body, head, legs, tail, colors },more||{});
const BEAST_LOOKS={
  lizard:Q('Echse','low','lizard','splay','drag',{ body:'#4f8a3a', snout:'#a8d070', accent:'#e8c040', legs:'#3f7a30' },{ extras:['ridge','belly'], box:{ y0:8, y1:12 }, headDy:2 }),
  dragon:Q('Drache','big','dragon','thick','spade',{ body:'#9a2a24', snout:'#e8a840', accent:'#f0c050', wing:'#5a1220', legs:'#7a1e1a' },{ extras:['batwings'], box:{ x0:5, x1:13, y0:6 } }),
  unicorn:Q('Einhorn','barrel','horse','thin','hair',{ body:'#f0ecf4', snout:'#f0d8e8', accent:'#e87ad0', horn:'#f0d060', legs:'#d8d0e0' },{ good:true, extras:['horn'] }),
  kitsune:Q('Kitsune','lean','fox','paws','bushy',{ body:'#e08a3a', snout:'#fff4e0', accent:'#fff4e0', legs:'#8a4a20' },{ good:true, tails:3 }),
  yule:Q('Yule','barrel','cat','paws','up',{ body:'#3a3e54', snout:'#e8a0b0', accent:'#f2e8d5', horn:'#c43a3a', legs:'#2e3246' },{ good:true, extras:['cap','stripes'], box:{ y0:7 } }),
  griffin:Q('Greif','big','eagle','talons','lion',{ body:'#b08840', head:'#f0e8d0', snout:'#e8a830', accent:'#6a4a20', wing:'#d8c090', legs:'#8a6830' },{ good:true, extras:['featherwings'], box:{ y0:6 } })
};
Object.assign(globalThis.SPRITEKIT||(globalThis.SPRITEKIT={}),{ BEAST_BODIES, BEAST_HEADS, BEAST_LEGS, BEAST_TAILS, BEAST_EXTRAS, BEASTS:BEAST_LOOKS });
Object.keys(BEAST_LOOKS).forEach(k=>{ const z=beastEntry(BEAST_LOOKS[k]); ZOO[k]=z; if(BEAST_LOOKS[k].good) ZOO[k+'_ally']={ ...z, name:z.name+' (bekehrt)', frame:(t,fr,mv)=>swapEyes(z.frame(t,fr,mv)) }; else delete ZOO[k+'_ally']; });
})();
