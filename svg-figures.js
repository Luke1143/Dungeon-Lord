// SVG figures in the game (user, November 2026: the game moves to figures built from moving parts, svg-rig.js; the pixel sprites stay as legacy).
// This adapter turns a creature of the game into a picture of its rig, for the 2D board and the 3D view alike (drawCreatureSprite in index.html):
//   - its look: genes rolled from its kind and id (the same imp looks the same forever), its level (the imp's ears), its scars (one per knock-out),
//     what it carries (gold or ore in the sack), the pick in its hand;
//   - its motion: walking (4 steps of the walk), standing (2 breaths), working (a swing of the pick: digging, claiming, reinforcing, building), blinking now and then;
//   - its view: walking towards the camera the front, away from it the back, sideways the front half turned that way (the camera's yaw in 3D, up the screen in 2D).
// Each picture is a square canvas, the figure nearly its whole height (the pixel imp is wider for its height and reads as big), drawn at the kind's pixel size and grown
// smoothly (EPX), marked `_svg` (read smoothly) and `_cells` (one tile, whatever its pixels). Pictures are kept per creature and pose,
// the oldest dropped first (and their textures with them, View3D.dropCanvas).
const SvgFigures=(()=>{
  const KINDS={ imp:{ px:24 } };       // the kinds drawn from rigs so far; their pixel size (the figure's height)
  const MAX=1600, cache=new Map(), rigs=new Map(), bases=new WeakMap();
  const hash=s=>{ let h=2166136261; for(const ch of String(s)){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; };
  function baseSpec(c){
    let b=bases.get(c); if(b) return b;
    b=SvgRig.roll(hash(c.kind+':'+(c.id||0))||1,c.kind);
    b.gear=Object.assign(b.gear,{ weapon:'pick', hands:true, ears:true }); b.shadow=false;
    bases.set(c,b); return b;
  }
  function rigOf(c,load,view){
    const b=baseSpec(c), key=c.kind+'|'+(c.id||0)+'|'+(c.level||1)+'|'+(c.scars||0)+'|'+load+'|'+view;
    let r=rigs.get(key); if(r) return { r, key };
    r=SvgRig.build(Object.assign({},b,{ level:Math.min(12,c.level||1), scars:c.scars||0, view, gear:Object.assign({},b.gear,{ load }) }));
    if(rigs.size>400) rigs.delete(rigs.keys().next().value);
    rigs.set(key,r); return { r, key };
  }
  // EPX: a corner takes the colour of two equal neighbours (twice as big, the edges crisp)
  function epx2(src){
    const w=src.width, h=src.height, a=src.getContext('2d').getImageData(0,0,w,h).data, c=document.createElement('canvas'); c.width=w*2; c.height=h*2;
    const g=c.getContext('2d'), out=g.createImageData(w*2,h*2), o=out.data;
    const px=(x,y)=>{ x=Math.max(0,Math.min(w-1,x)); y=Math.max(0,Math.min(h-1,y)); const i=(y*w+x)*4; return (a[i]<<24|a[i+1]<<16|a[i+2]<<8|a[i+3])>>>0; };
    const put=(x,y,v)=>{ const i=(y*w*2+x)*4; o[i]=v>>>24; o[i+1]=(v>>>16)&255; o[i+2]=(v>>>8)&255; o[i+3]=v&255; };
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const P=px(x,y), A=px(x,y-1), B=px(x+1,y), C=px(x-1,y), D=px(x,y+1);
      put(2*x,2*y,(C===A&&C!==D&&A!==B)?A:P); put(2*x+1,2*y,(A===B&&A!==C&&B!==D)?B:P); put(2*x,2*y+1,(D===C&&D!==B&&C!==A)?C:P); put(2*x+1,2*y+1,(B===D&&B!==A&&D!==C)?D:P); }
    g.putImageData(out,0,0); return c;
  }
  const WORK=new Set(['digging','claiming','reinforcing','building','buildingBridge']), SWING=[0,0.45,1,0.35];
  // the picture of creature c now: moving (it moved in the last moments), extra ('gold' | 'ore' | null), view ('front' | 'back'), turn (-1, 0, 1)
  function canvasFor(c,now,moving,extra,view,turn){
    const load=extra==='gold'||extra==='ore'?extra:'none', { r:rig, key }=rigOf(c,load,view||'front');
    const work=!moving&&WORK.has(c.state), off=(c.id||0)*0.37;
    const step=moving?Math.floor(now/140+off)%4:0, swing=work?SWING[Math.floor(now/150+off)%4]:0, breath=moving||work?0:Math.floor(now/700+off)%2;
    const blink=!work&&((now/1000+off*4.3)%4.2)<0.14?1:0, tq=moving?(turn||0):0;
    const fkey=key+'|'+step+'|'+swing+'|'+breath+'|'+blink+'|'+tq;
    let cv=cache.get(fkey);
    if(cv){ cache.delete(fkey); cache.set(fkey,cv); return cv; }
    // the pose: a still state of the rig
    const s=SvgRig.create(); s.walking=moving; s.phase=step*Math.PI/2+0.4; s.turn=tq; s.t=breath*1.5+0.3; s.swing=swing; s.blink=blink?0.1:0; s.nextBlink=1e9; s.look=[tq*0.8,0];
    const P=SvgRig.pose(s,rig), px=(KINDS[c.kind]||{ px:24 }).px, N=Math.round(px/0.92), small=document.createElement('canvas'); small.width=small.height=N;
    const g=small.getContext('2d'), k=px/rig.H; SvgRig.canvas(g,rig,P,k,N/2,N-1);
    const im=g.getImageData(0,0,N,N), d=im.data; for(let i=3;i<d.length;i+=4) d[i]=d[i]>110?255:0; g.putImageData(im,0,0);       // a pixel sprite has no half pixels
    cv=epx2(small); cv._svg=true; cv._cells=1;       // grown once (the 3D view reads it smoothly; twice would cost four times the memory)
    cache.set(fkey,cv);
    if(cache.size>MAX){ const old=cache.keys().next().value, oc=cache.get(old); cache.delete(old); if(typeof VIEW3D_ALL!=='undefined') VIEW3D_ALL.forEach(v=>v.dropCanvas&&v.dropCanvas(oc)); }
    return cv;
  }
  // which view: walking away from the camera the back, towards it the front, sideways the front half turned (dx, dy: the step on the floor)
  function viewOf(c,dx,dy,yaw3d){
    const f=yaw3d===undefined?[0,-1]:[-Math.sin(yaw3d),-Math.cos(yaw3d)], r=yaw3d===undefined?[1,0]:[Math.cos(yaw3d),-Math.sin(yaw3d)];
    const along=dx*f[0]+dy*f[1], side=dx*r[0]+dy*r[1];
    if(Math.abs(along)<0.004&&Math.abs(side)<0.004) return;
    if(Math.abs(along)>Math.abs(side)*0.8){ c._view=along>0?'back':'front'; c._turn=0; }
    else { c._view='front'; c._turn=side>0?1:-1; }
  }
  const active=kind=>!!KINDS[kind]&&typeof OPTIONS!=='undefined'&&OPTIONS.figures!=='pixel'&&typeof SvgRig!=='undefined';
  return { active, canvasFor, viewOf, KINDS, get size(){ return cache.size; } };
})();
