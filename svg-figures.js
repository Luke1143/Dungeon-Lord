// SVG figures in the game (user, November 2026: the game moves to figures built from moving parts, svg-rig.js; the pixel sprites stay as legacy).
// This adapter turns a creature of the game into a picture of its rig, for the 2D board and the 3D view alike (drawCreatureSprite in index.html).
// The kinds so far: the imp, the ork, the goblin, the troll, the dark elf, the vampire, the warlock and the skeleton (one body plan for every humanoid, svg-rig.js).
//   - its look: genes rolled from its kind and id (the same creature looks the same forever), its level (the imp's ears), its scars (one per knock-out),
//     its stats (strength: the shoulders, from the strength it was born with and growing with every level; agility: the legs),
//     what it carries (the imp: gold or ore in the sack, the pick in its hand; the ork: the weapon, shield and armour it wears, in their material);
//   - its motion: walking (4 steps of the walk), standing (2 breaths), a blow (the hand swings what it holds, following the action's pose of anim.js,
//     the figure turned towards a target on its left), working without a pose (a swing of the pick), blinking now and then;
//   - its view: walking towards the camera the front, away from it the back, sideways the front half turned that way (the camera's yaw in 3D, up the screen in 2D).
// Each picture is a square canvas, the figure nearly its whole height (the pixel imp is wider for its height and reads as big), drawn at the kind's pixel size and grown
// smoothly (EPX), marked `_svg` (read smoothly) and `_cells` (one tile, whatever its pixels). Pictures are kept per creature and pose,
// the oldest dropped first (and their textures with them, View3D.dropCanvas).
const SvgFigures=(()=>{
  const KINDS={ imp:{ px:24, cells:1 }, ork:{ px:48, cells:1.5, tall:1.12 }, goblin:{ px:32, cells:1.4 }, troll:{ px:64, cells:1.5 }, darkelf:{ px:48, cells:1.5 }, vampire:{ px:48, cells:1.4 }, warlock:{ px:48, cells:1.4 }, skeleton:{ px:64, cells:1.6, rig:'skeleton2', side:true, r3d:true } };       // (r3d: it can be drawn from the 2.5D rig, a test: Options, Creatures)       // (rig: the kind of rig when it is not the game's kind: the skeletons are the second, the fantasy skeleton; user)       // the kinds drawn from rigs so far: their pixel size (the figure's height), how many cells wide the picture is (room for the weapon),
  // tall: how much taller than others of its size it stands (user: an ork at least as tall as a man, rather taller)
  const MAX=1600, cache=new Map(), rigs=new Map(), bases=new WeakMap();
  const hash=s=>{ let h=2166136261; for(const ch of String(s)){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; };
  function baseSpec(c){
    let b=bases.get(c); if(b) return b;
    b=SvgRig.roll(hash(c.kind+':'+(c.id||0))||1,(KINDS[c.kind]&&KINDS[c.kind].rig)||c.kind);
    b.gear=c.kind==='imp'?{ weapon:'pick', hands:true, arms:true, ears:true, cloth:b.gear.cloth }:{ hands:true, arms:true, cloth:SvgRig.defaults(c.kind).gear.cloth };       // arms link the hands to the shoulders b.shadow=false;       // the imps work: no armour; the others wear what they wear
    bases.set(c,b); return b;
  }
  // what it wears and carries: the imp its load; the others the game's look of their gear (equipLook in index.html: weapon, shield, armour weight, material, helmet form)
  const WEAPON_OF={ axt:'axe', schwert:'sword', keule:'club', hammer:'hammer', dolch:'dagger', speer:'spear', bogen:'bow', stab:'staff' };
  function gearOf(c,extra){
    if(c.kind==='imp') return { load:extra==='gold'||extra==='ore'?extra:'none' };
    const e=extra&&typeof extra==='object'?extra:{}, w=e.chest||0;
    return { weapon:WEAPON_OF[e.weapon]||'none', shield:e.shield||undefined, helmet:w>0, chest:w>0, pauldrons:w>=3, mat:w>0?e.mat:undefined, helmStyle:w>0?['plain','crest','horns'][e.hstyle||0]:undefined };
  }
  // the stats as traits: strength from what it was born with (0.9 to 1.1 of its kind) and its level, agility from its dexterity
  function traitsOf(c,b){
    const sp=typeof SPECIES!=='undefined'&&SPECIES[c.kind]; if(!sp) return b.traits;
    const born=v=>Math.max(0,Math.min(1,(v-0.9)/0.2)), st=Math.min(1,0.15+0.3*born((c.baseStrength||sp.strength)/sp.strength)+0.05*((c.level||1)-1));
    return Object.assign({},b.traits,{ stark:Math.round(st*20)/20, flink:Math.round(born((c.baseDex||sp.dex)/(sp.dex||1))*20)/20 });
  }
  function rigOf(c,gear,view){
    const b=baseSpec(c), key=c.kind+'|'+(c.id||0)+'|'+(c.level||1)+'|'+(c.scars||0)+'|'+JSON.stringify(gear)+'|'+view;
    let r=rigs.get(key); if(r) return { r, key };
    r=SvgRig.build(Object.assign({},b,{ level:Math.min(12,c.level||1), scars:c.scars||0, view, traits:traitsOf(c,b), gear:Object.assign({},b.gear,gear) }));
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
  // the swing of the hand from an action's pose (anim.js: the held tool's angle, 0.3 at rest, back for the wind-up, forward for the blow): 1 up and back .. -1 down and forward
  function swingOf(pose){
    if(!pose||!pose.held) return 0; const a=pose.angle;
    const v=a<0.3?Math.min(1,(0.3-a)/1.0):-Math.min(1,(a-0.3)/1.5); return Math.round(v*4)/4;
  }
  // the picture of creature c now: moving (it moved in the last moments), extra (the imp: 'gold' | 'ore' | null; the others: the game's look of their gear),
  // view ('front' | 'back'), turn (-1, 0, 1), pose (the action's pose of anim.js, or null), left (the action aims to the left; aiming right the figure is turned that way)
  // the 2.5D test (Rig3D in svg-rig.js): the figure seen from its eighth of a turn and the camera's height (the 3D view looks down 49 degrees; the flat map not at all)
  const plans=new Map();
  function canvas3d(c,now,moving,extra,pose,KD){
    const yaw8=c._yaw8||0, pitch=(typeof capture!=='undefined'&&capture)?0.85:0, gear=gearOf(c,extra), b=baseSpec(c), pk=c.kind+'|'+(c.id||0)+'|'+(c.level||1)+'|'+JSON.stringify(gear);
    let pl=plans.get(pk); if(!pl){ pl=SvgRig.plan(Object.assign({},b,{ level:c.level||1, traits:traitsOf(c,b), gear:Object.assign({},b.gear,gear) })); if(plans.size>300) plans.delete(plans.keys().next().value); plans.set(pk,pl); }
    const off=(c.id||0)*0.37, step=moving?Math.floor(now/140+off)%4:0, swing=pose?swingOf(pose):0, fkey='3d|'+pk+'|'+yaw8+'|'+pitch+'|'+step+'|'+swing;
    let cv=cache.get(fkey); if(cv){ cache.delete(fkey); cache.set(fkey,cv); return cv; }
    const st={ phase:step*Math.PI/2+0.4, walking:moving, t:0.3, swing, roar:0 }, px=KD.px, N=Math.round(px/(0.92*(KD.tall||1))*KD.cells), small=document.createElement('canvas'); small.width=small.height=N;
    const g=small.getContext('2d'); Rig3D.canvas(g,pl,st,yaw8*Math.PI/4,pitch,px/pl.H,N/2,N-1);
    const im=g.getImageData(0,0,N,N), d=im.data; for(let i=3;i<d.length;i+=4) d[i]=d[i]>110?255:0; g.putImageData(im,0,0);
    cv=epx2(small); cv._svg=true; cv._cells=KD.cells; cache.set(fkey,cv);
    if(cache.size>MAX){ const old=cache.keys().next().value, oc=cache.get(old); cache.delete(old); if(typeof VIEW3D_ALL!=='undefined') VIEW3D_ALL.forEach(v=>v.dropCanvas&&v.dropCanvas(oc)); }
    return cv;
  }
  function canvasFor(c,now,moving,extra,view,turn,pose,left){
    if(KINDS[c.kind]&&KINDS[c.kind].r3d&&typeof OPTIONS!=='undefined'&&OPTIONS.fig3d&&typeof Rig3D!=='undefined') return canvas3d(c,now,moving,extra,pose,KINDS[c.kind]);
    const KD0=KINDS[c.kind]; if(KD0&&KD0.side&&moving&&(view||'front')==='front'&&turn){ view=turn>0?'right':'left'; turn=0; }       // a kind with a side view (a test: the skeleton) walking sideways shows its profile
    const { r:rig, key }=rigOf(c,gearOf(c,extra),view||'front');
    const act=!!pose, work=!act&&!moving&&WORK.has(c.state), off=(c.id||0)*0.37;
    const step=moving?Math.floor(now/140+off)%4:0, swing=act?swingOf(pose):(work?SWING[Math.floor(now/150+off)%4]:0), breath=moving||work||act?0:Math.floor(now/700+off)%2;
    const blink=!work&&!act&&((now/1000+off*4.3)%4.2)<0.14?1:0, tq=moving?(turn||0):0, flip=act&&!left?1:0;       // (the weapon is on the left of the picture: a blow to the right turns the figure)
    const fkey=key+'|'+step+'|'+swing+'|'+breath+'|'+blink+'|'+tq+'|'+flip;
    let cv=cache.get(fkey);
    if(cv){ cache.delete(fkey); cache.set(fkey,cv); return cv; }
    // the pose: a still state of the rig
    const s=SvgRig.create(); s.walking=moving; s.phase=step*Math.PI/2+0.4; s.turn=tq; s.t=breath*1.5+0.3; s.swing=swing; s.blink=blink?0.1:0; s.nextBlink=1e9; s.look=[tq*0.8,0];
    const KD=KINDS[c.kind]||{ px:24, cells:1 }, P=SvgRig.pose(s,rig), px=KD.px, N=Math.round(px/(0.92*(KD.tall||1))*KD.cells), small=document.createElement('canvas'); small.width=small.height=N;
    const g=small.getContext('2d'), k=px/rig.H; if(flip){ g.translate(N,0); g.scale(-1,1); } SvgRig.canvas(g,rig,P,k,N/2,N-1);
    const im=g.getImageData(0,0,N,N), d=im.data; for(let i=3;i<d.length;i+=4) d[i]=d[i]>110?255:0; g.putImageData(im,0,0);       // a pixel sprite has no half pixels
    cv=epx2(small); cv._svg=true; cv._cells=KD.cells;       // grown once (the 3D view reads it smoothly; twice would cost four times the memory)
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
    c._yaw8=((Math.round(Math.atan2(side,-along)/(Math.PI/4))%8)+8)%8;       // for the 2.5D test: the way it faces, in eighths (0 towards the camera, 2 to the right)
  }
  const active=kind=>!!KINDS[kind]&&typeof OPTIONS!=='undefined'&&OPTIONS.figures!=='pixel'&&typeof SvgRig!=='undefined';
  return { active, canvasFor, viewOf, KINDS, get size(){ return cache.size; } };
})();
