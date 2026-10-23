// Action animations with clear rules. One table says which motion a verb gets; the renderers (2D, 3D, first person) only read the pose.
// New verb = new row in ACT_ANIM. Cosmetic only: no random numbers, nothing here changes game state.
//
//   verb       motion   what it looks like
//   attack     over/side  alternating blows: from above, then across (weapon in hand, otherwise a fist)
//   dig        over       a chop from above (fist tinted rock-grey)
//   reinforce  tap        short hammering taps (steel-blue fist)
//   build      tap        short hammering taps (wood-brown fist)
//   claim      stomp      a hop with a stamp, no tool (purple dust)
//   pull       lift       a pull upwards, no tool
//   tap        tap        generic workshop work
//   carrying a load is not an action: the sack on the sprite is the only sign.
const ACT_ANIM={
  attack:   { motion:['over','side'], ms:340 },
  dig:      { motion:['over'], ms:380, tint:'#8a7a68' },
  reinforce:{ motion:['tap'],  ms:300, tint:'#9db4c9' },
  build:    { motion:['tap'],  ms:300, tint:'#c8914a' },
  claim:    { motion:['stomp'], ms:400, tint:'#b48ae8' },
  pull:     { motion:['lift'], ms:420 },
  tap:      { motion:['tap'],  ms:300 }
};
// creature states that imply a verb when the caller did not name one
const STATE_VERB={ digging:'dig', reinforcing:'reinforce', claiming:'claim', building:'build', buildingBridge:'build', fighting:'attack',
  forgeWork:'tap', smelterWork:'tap', writing:'tap' };
const ANIM_ALIAS={ bridge:'build' };

const easeIn=t=>t*t, easeOut=t=>1-(1-t)*(1-t), lerp=(a,b,t)=>a+(b-a)*t;

// called at the moment a swing is performed. target: {x,y} tile the action is aimed at (optional, sets the lunge direction)
function startAnim(actor, speed){
  let verb=actor.verb||STATE_VERB[actor.state]||'tap';
  verb=ANIM_ALIAS[verb]||verb;
  const rule=ACT_ANIM[verb]||ACT_ANIM.tap;
  actor.animCount=(actor.animCount||0)+1;
  const motion=rule.motion[actor.animCount%rule.motion.length];
  let dx=0, dy=0;
  if(actor.actTarget){ dx=Math.sign(actor.actTarget.x-actor.x); dy=Math.sign(actor.actTarget.y-actor.y); }
  actor.anim={ verb, motion, start:Date.now(), dur:rule.ms/Math.max(1,speed||1), dx, dy, tint:rule.tint };
  actor.verb=null; actor.actTarget=null;
}

// pose at progress p (0..1): held tool angle (0 = pointing up, clockwise positive, mirrored for facing left), offsets of the hand in tiles
// (ox forward, oy up), body lunge toward the target and hop in tiles, camera kick for first person
function poseOf(motion,p){
  const o={ held:true, angle:0.3, ox:0, oy:0, lunge:0, hop:0, kick:0 };
  const kick=(a,b)=>p>=a&&p<b ? Math.sin((p-a)/(b-a)*Math.PI) : 0;
  if(motion==='over'){
    if(p<0.35){ const t=easeOut(p/0.35); o.angle=lerp(0.3,-0.7,t); o.oy=lerp(0,0.3,t); }
    else if(p<0.55){ const t=easeIn((p-0.35)/0.2); o.angle=lerp(-0.7,2.0,t); o.oy=lerp(0.3,-0.15,t); o.lunge=0.18*t; }
    else { const t=(p-0.55)/0.45; o.angle=lerp(2.0,0.3,t); o.oy=lerp(-0.15,0,t); o.lunge=0.18*(1-t); }
    o.kick=kick(0.5,0.85);
  } else if(motion==='side'){
    if(p<0.35){ const t=easeOut(p/0.35); o.angle=lerp(0.4,-1.1,t); o.ox=lerp(0,-0.35,t); }
    else if(p<0.55){ const t=easeIn((p-0.35)/0.2); o.angle=lerp(-1.1,1.6,t); o.ox=lerp(-0.35,0.45,t); o.lunge=0.15*t; }
    else { const t=(p-0.55)/0.45; o.angle=lerp(1.6,0.4,t); o.ox=lerp(0.45,0,t); o.lunge=0.15*(1-t); }
    o.kick=kick(0.5,0.85);
  } else if(motion==='tap'){
    const t=p<0.5?p*2:(1-p)*2; o.angle=0.3+0.9*easeIn(t); o.oy=-0.1*t; o.kick=kick(0.35,0.65)*0.4;
  } else if(motion==='stomp'){
    o.held=false;
    o.hop = p<0.45 ? 0.25*Math.sin(p/0.45*Math.PI/2) : (p<0.6 ? 0.25*(1-(p-0.45)/0.15) : 0);
    o.kick=kick(0.55,0.85)*0.8;
  } else if(motion==='lift'){
    o.held=false; o.hop=0.1*Math.sin(p*Math.PI); o.oy=0.2*Math.sin(p*Math.PI);
  }
  return o;
}
// the current pose of an actor, or null while it is not performing an action
function currentPose(actor){
  const a=actor.anim; if(!a) return null;
  const p=(Date.now()-a.start)/a.dur;
  if(p>=1){ actor.anim=null; return null; }
  return Object.assign(poseOf(a.motion,Math.max(0,p)), { anim:a, p });
}

// ---- held objects as small square canvases with the grip at the bottom centre (so rotating the canvas rotates around the hand) ----
const TOOL_S=24, TOOL_CACHE={};
const FIST_COLORS={ imp:'#e0662c', dungeonlord:'#3a3a4a', worker:'#d8a878' };
function toolCanvas(weapon, fistColor, tint){
  const key=(weapon||'fist')+'|'+(fistColor||'')+'|'+(tint||'');
  if(TOOL_CACHE[key]) return TOOL_CACHE[key];
  const cv=document.createElement('canvas'); cv.width=cv.height=TOOL_S; const g=cv.getContext('2d');
  const gx=TOOL_S/2, gy=TOOL_S-1;
  const wp=weapon && typeof TOOLGEN!=='undefined' ? TOOLGEN.weapon(weapon) : null;
  if(wp){
    wp.px.forEach(([x,y,c])=>{ g.fillStyle=c; g.fillRect(gx-wp.grip[0]+x, gy-wp.grip[1]+y-1, 1, 1); });
    g.fillStyle=fistColor||'#d8a878'; g.fillRect(gx-1,gy-2,3,3);                 // the hand around the grip
  } else {
    const c=fistColor||'#d8a878', d='#00000040';
    const rows=['.ccc.','cCcCc','ccccc','cDDDc','.ccc.'];
    rows.forEach((r,y)=>[...r].forEach((ch,x)=>{ if(ch==='.') return; g.fillStyle=ch==='C'?'#ffffff30':ch==='D'?d:c; g.fillRect(gx-2+x, gy-5+y, 1, 1); }));
  }
  if(tint){ g.globalCompositeOperation='source-atop'; g.fillStyle=tint; g.globalAlpha=0.45; g.fillRect(0,0,TOOL_S,TOOL_S); }
  return TOOL_CACHE[key]=cv;
}
