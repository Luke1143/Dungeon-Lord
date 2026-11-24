// The Dungeon Lord's hand, the pointer (user, November 2026: evil and demonic; a pose and a motion for each thing a click would do, so the player
// sees it before clicking). Drawn from parts on a canvas each frame: a torn wrist that smoulders, the back of the hand with glowing veins and spikes
// on the knuckles, five fingers that curl (each by its own amount), long black claws. Seen from the back, the fingers reaching away from the player,
// into the screen (user); the tip of the index claw is the point a click goes to (`tip`, in parts of the picture).
// A pose is a table entry: how far each finger curls (thumb, index, middle, ring, little), how wide they spread, how far each turns in (aim), and a motion; the colour of its glow
// comes with the context (index.html, handContext). view3d.js draws it as the 3D pointer and makes its glow a light; in 2D it is the mouse cursor.
const HandArt=(()=>{
  const POSES={
    idle:   { c:[0.25,0.2,0.25,0.3,0.35], spread:1,    anim:'flex' },      // nothing to do here: the claws flex slowly
    dig:    { c:[0.75,0,0.9,0.92,0.95],   spread:0.8,  anim:'tap' },       // dig: the index claw taps the rock
    inspect:{ c:[0.75,0,0.9,0.92,0.95],   spread:0.8,  anim:'steady', eye:true },       // look: pointing, an eye opens on the back of the hand
    grab:   { c:[0,0.12,0.85,0.9,0.92],   spread:1,    anim:'pinch', aim:[0.35,0.12,0,0,0], len:[1.5,1.05,1,1,1], pincer:true },       // pick up: thumb and index pinch together, as to lift a creature by the scruff (user)
    hold:   { c:[0,0.15,0.9,0.92,0.95],   spread:1,    anim:'sway', aim:[0.95,0.12,0,0,0], len:[1.5,1.05,1,1,1], pincer:true },       // holding: thumb and index pinched shut on the scruff, swaying with the load
    cast:   { c:[0,0,0,0,0.05],           spread:1.35, anim:'orb' },       // a spell: the fingers wide over a flickering orb of its colour
    place:  { c:[0.1,0.05,0.05,0.05,0.1], spread:1.2,  anim:'hover' },     // build a room: the open hand hovers, pressing the room into the ground
    smash:  { c:[1,1,1,1,1],              spread:0.9,  anim:'slam' },      // tear down: the fist slams
    possess:{ c:[0.15,0.1,0.1,0.1,0.15],  spread:1.3,  anim:'swirl' }      // possess: a swirl of the soul below the open fingers
  };
  // the fingers: where they start on the knuckle line, their length, their angle from straight down
  const FINGERS=[ { x:-23, y:-4, L:27, a:-1.0, w:8.5 }, { x:-13, y:7, L:36, a:-0.3, w:8 }, { x:-2.5, y:9, L:40, a:-0.05, w:8 }, { x:8, y:8, L:37, a:0.2, w:7.6 }, { x:17, y:4, L:28, a:0.48, w:6.8 } ];       // a: the angle from straight down, outwards on each side
  const SKIN='#241419', SKIN_HI='#432331', OUT='#050203', CLAW='#0b0709', CLAW_HI='#7a5a6c', VEIN='#ff5a1e';
  const tip={ x:0.35, y:0.12 };
  const rgba=(hex,a)=>{ const n=parseInt(hex.slice(1),16); return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`; };
  // draw the hand into g (a canvas of S pixels): o = { pose, t (seconds), color (its glow), press (0..1, a click squeezes) }
  function draw(g,S,o){
    const P=POSES[o.pose]||POSES.idle, t=o.t||0, col=o.color||'#c8a6ff', press=o.press||0, k=S/128;
    g.clearRect(0,0,S,S); g.save(); g.translate(0,S); g.scale(k,-k);       // drawn fingers-down, shown fingers-up (away from the player)
    // the motion: the whole hand moves (tap, slam, sway), the fingers curl (flex, clutch)
    let dy=0, rot=0, sc=1-0.06*press; const curl=P.c.slice();
    if(P.anim==='flex') curl.forEach((c,i)=>{ curl[i]=c+Math.sin(t*1.6+i*0.9)*0.08; });
    if(P.anim==='tap'){ const s=Math.max(0,Math.sin(t*6)); dy=5*s*s; curl[1]=0.05+0.25*s; }
    const aim=(P.aim||[0,0,0,0,0]).slice();
    if(P.anim==='pinch'){ const s=0.5+0.5*Math.sin(t*3.4); aim[0]+=0.55*s; aim[1]-=0.06*s; }       // the pinch opens and closes
    if(P.anim==='sway') rot=Math.sin(t*2.2)*0.09;
    if(P.anim==='slam'){ const s=Math.max(0,Math.sin(t*4.5)); dy=-7*s+10*s**6; }
    if(P.anim==='hover') dy=Math.sin(t*2)*2;
    curl.forEach((c,i)=>{ curl[i]=Math.max(0,Math.min(1,c+0.4*press)); });
    g.translate(64,34+dy); g.rotate(rot); g.scale(sc*1.04,sc*1.04);
    // what lies below the fingers (drawn first, under the hand): the orb of a spell, the swirl of a soul, the room's mark
    const pulse=0.75+0.25*Math.sin(t*5);
    if(P.anim==='orb'||P.anim==='swirl'){ const R=13*pulse, gr=g.createRadialGradient(0,64,1,0,64,R*1.9); gr.addColorStop(0,'#fff'); gr.addColorStop(0.25,rgba(col,0.95)); gr.addColorStop(1,rgba(col,0)); g.fillStyle=gr; g.beginPath(); g.arc(0,64,R*1.9,0,7); g.fill();
      if(P.anim==='swirl'){ g.strokeStyle=rgba(col,0.9); g.lineWidth=2; for(let a=0;a<3;a++){ g.beginPath(); for(let s=0;s<20;s++){ const ang=t*3+a*2.1+s*0.25, r=2+s*0.7; g.lineTo(Math.cos(ang)*r,64+Math.sin(ang)*r*0.6); } g.stroke(); } }
      else for(let i=0;i<6;i++){ const ang=t*2+i, r=6+((t*30+i*13)%14); g.fillStyle=rgba(col,0.8); g.fillRect(Math.cos(ang)*r*0.8-1,64-r*0.9,2,3); } }       // sparks rising
    // a glow around the hand in the context's colour
    { const gr=g.createRadialGradient(0,22,6,0,24,58); gr.addColorStop(0,rgba(col,0.42*pulse)); gr.addColorStop(1,rgba(col,0)); g.fillStyle=gr; g.fillRect(-64,-40,128,128); }
    g.lineJoin='round'; g.lineCap='round';
    // the wrist: torn off, smouldering at the edge
    const wrist=new Path2D('M-13 -30 L-15 -18 L13 -18 L12 -30 L8 -26 L4 -31 L0 -26 L-4 -32 L-8 -27z');
    g.fillStyle=SKIN; g.fill(wrist); g.strokeStyle=OUT; g.lineWidth=2.2; g.stroke(wrist);
    g.strokeStyle=VEIN; g.lineWidth=1.6; g.shadowColor=VEIN; g.shadowBlur=6; g.beginPath(); g.moveTo(-13,-30); g.lineTo(-8,-27); g.lineTo(-4,-32); g.lineTo(0,-26); g.lineTo(4,-31); g.lineTo(8,-26); g.lineTo(12,-30); g.stroke(); g.shadowBlur=0;
    // the fingers behind the back of the hand first (their roots hide under it), then the back of the hand, then the knuckles
    const tips=[];
    FINGERS.forEach((f,i)=>{
      const c=curl[i], a=f.a*P.spread+aim[i], w=f.w, FL=f.L*(P.len?P.len[i]:1), L1=FL*0.55*(1-0.45*c), L2=FL*0.45*(1-0.85*c), a2=a+(P.pincer&&i===1?-0.35:(i===0?0.4:(i<2?0.1:-0.1))*(1+c));       // in a pinch the index's outer member bends towards the thumb       // the outer member bends in, towards the palm
      const bx=f.x, by=f.y+14, jx=bx+Math.sin(a)*L1, jy=by+Math.cos(a)*L1-c*2, tx=jx+Math.sin(a2)*L2, ty=jy+Math.cos(a2)*L2-c*4;
      // the finger: a dark outline, the skin, a highlight; the knuckle between its members
      const path=new Path2D(); path.moveTo(bx,by); path.lineTo(jx,jy); path.lineTo(tx,ty);
      g.strokeStyle=OUT; g.lineWidth=w+3; g.stroke(path); g.strokeStyle=SKIN; g.lineWidth=w; g.stroke(path); g.strokeStyle=SKIN_HI; g.lineWidth=w*0.28; g.stroke(path);
      g.fillStyle=SKIN_HI; g.beginPath(); g.arc(jx,jy,w*0.42,0,7); g.fill(); g.strokeStyle=OUT; g.lineWidth=1; g.stroke();
      tips.push({ x:tx, y:ty, a:a2, c, i });
    });
    // the claws at the tips: long, black, hooked; folded away when the fingers curl into a fist
    tips.forEach(({ x, y, a, c, i })=>{
      const cl=(i===0?9:13)*(1-0.55*c), dx=Math.sin(a), dyc=Math.cos(a), hook=(i<2?-1:1)*3*(1-c);
      const claw=new Path2D(); claw.moveTo(x-dyc*2.6,y+dx*2.6); claw.quadraticCurveTo(x+dx*cl*0.6+hook,y+dyc*cl*0.6,x+dx*cl+hook*1.5,y+dyc*cl); claw.lineTo(x+dyc*2.6,y-dx*2.6); claw.closePath();
      g.fillStyle=CLAW; g.fill(claw); g.strokeStyle=OUT; g.lineWidth=1.2; g.stroke(claw);
      if(i===1){ const q=g.getTransform().transformPoint(new DOMPoint(x+dx*cl+hook*1.5,y+dyc*cl)); tip.x=q.x/g.canvas.width; tip.y=q.y/g.canvas.height; }       // where a click goes
      g.strokeStyle=CLAW_HI; g.lineWidth=0.8; g.beginPath(); g.moveTo(x+dx*cl*0.2,y+dyc*cl*0.2); g.lineTo(x+dx*cl*0.75+hook,y+dyc*cl*0.75); g.stroke();
      if(c>0.15){ g.fillStyle=rgba(col,0.35+0.4*c); g.beginPath(); g.arc(x,y,1.6,0,7); g.fill(); }       // the knuckles of a fist glow faintly
    });
    // the back of the hand
    const back=new Path2D('M-16 -19 Q-27 -4 -27 8 Q-26 19 -16 23 Q0 27 14 24 Q25 20 24 8 Q23 -5 16 -19z');
    g.fillStyle=SKIN; g.fill(back); g.strokeStyle=OUT; g.lineWidth=2.4; g.stroke(back);
    { const gr=g.createLinearGradient(-24,0,20,0); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(0.35,'rgba(110,60,80,0.35)'); gr.addColorStop(1,'rgba(0,0,0,0.35)'); g.fillStyle=gr; g.fill(back); }
    // glowing veins over the back, from the wrist to the knuckles
    g.strokeStyle=VEIN; g.lineWidth=1.3; g.shadowColor=VEIN; g.shadowBlur=5+3*pulse; g.globalAlpha=0.8;
    g.lineWidth=1.1; [[-3,-19,-5,-6,-12,12],[-5,-6,-1,4,-2,17],[5,-19,7,-4,8,16],[7,-4,12,4,15,11]].forEach(([x1,y1,x2,y2,x3,y3])=>{ g.beginPath(); g.moveTo(x1,y1); g.quadraticCurveTo(x2,y2,x3,y3); g.stroke(); });       // two veins that fork
    g.shadowBlur=0; g.globalAlpha=1;
    // spikes on the knuckles, bone-dark, pointing back
    [[-13,18],[-2.5,20],[8,19],[17,15]].forEach(([x,y],i)=>{ const sp=new Path2D(); sp.moveTo(x-2.6,y); sp.lineTo(x+(i-1.5)*0.8,y-7-(i===1?2:0)); sp.lineTo(x+2.6,y); sp.closePath(); g.fillStyle='#120b0e'; g.fill(sp); g.strokeStyle=OUT; g.lineWidth=1; g.stroke(sp); });
    // the eye on the back of the hand (looking): opens in the context's colour
    if(P.eye){ const open=0.55+0.45*Math.abs(Math.sin(t*1.2)); g.fillStyle='#0a0406'; g.beginPath(); g.ellipse(-3,2,8,5*open,0,0,7); g.fill(); g.fillStyle=col; g.shadowColor=col; g.shadowBlur=8; g.beginPath(); g.ellipse(-3,2,2.4,4*open,0,0,7); g.fill(); g.shadowBlur=0; }
    g.restore();
  }
  // the 2D cursor: a still picture of a pose (cached), its hotspot at the index finger's tip
  const urls=new Map();
  function cursor(pose,color){
    const key=pose+'|'+color; let u=urls.get(key); if(u) return u;
    const c=document.createElement('canvas'); c.width=c.height=48; draw(c.getContext('2d'),48,{ pose, t:0.3, color });
    u=`url(${c.toDataURL()}) ${Math.round(tip.x*48)} ${Math.round(tip.y*48)}, crosshair`; urls.set(key,u); return u;
  }
  return { draw, cursor, POSES, tip };
})();
