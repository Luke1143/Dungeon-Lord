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
  forgeWork:'tap', training:'attack', smelterWork:'tap', writing:'tap' };
const SOUND_OF={ dig:'chop', reinforce:'tap', build:'build', claim:'stomp', pull:'lift', tap:'tap' };
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
  if(typeof SFX!=='undefined'){       // the sound of the blow lands with the strike, not with the wind-up
    const snd=SOUND_OF[verb]||'tap', strike=(motion==='side'||motion==='over'?0.5:0.4)*actor.anim.dur/1000;
    if(verb==='attack') SFX.play('whoosh',{ x:actor.x, y:actor.y, delay:strike*0.4 });
    else SFX.play(snd,{ x:actor.x, y:actor.y, delay:strike });
  }
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

// ---- what is drawn: only what is really held (a weapon, from TOOLGEN) swings; every swing leaves an arc of light in the verb's colour ----
// Canvases are square with the pivot (the hand) at the bottom centre, so rotating the canvas rotates around the hand.
const TOOL_S=24, TOOL_CACHE={};
function toolCanvas(weapon){
  if(!weapon || typeof TOOLGEN==='undefined') return null;
  if(TOOL_CACHE[weapon]) return TOOL_CACHE[weapon];
  const wp=TOOLGEN.weapon(weapon); if(!wp) return null;
  const cv=document.createElement('canvas'); cv.width=cv.height=TOOL_S; const g=cv.getContext('2d');
  const gx=TOOL_S/2, gy=TOOL_S-1;
  wp.px.forEach(([x,y,c])=>{ g.fillStyle=c; g.fillRect(gx-wp.grip[0]+x, gy-wp.grip[1]+y-1, 1, 1); });
  return TOOL_CACHE[weapon]=cv;
}
// a crescent that trails behind the swing direction (the swing turns clockwise, so the arc lies counter-clockwise of the tool)
function slashCanvas(tint){
  const key='slash|'+(tint||''); if(TOOL_CACHE[key]) return TOOL_CACHE[key];
  const cv=document.createElement('canvas'); cv.width=cv.height=TOOL_S; const g=cv.getContext('2d');
  const gx=TOOL_S/2, gy=TOOL_S-1, a0=-1.35, a1=-0.05;
  for(let a=a0;a<=a1;a+=0.03){
    const u=(a-a0)/(a1-a0), th=3.2*Math.sin(Math.PI*Math.pow(u,0.8)), ro=11.5;
    for(let r=ro-th;r<=ro;r+=0.5){
      const x=Math.round(gx+r*Math.sin(a)), y=Math.round(gy-r*Math.cos(a));
      g.fillStyle=r>ro-th*0.45 ? '#ffffff' : (tint||'#e8f0ff'); g.globalAlpha=0.35+0.65*u; g.fillRect(x,y,1,1);
    }
  }
  return TOOL_CACHE[key]=cv;
}
// how visible the arc is (it flashes around the strike)
function slashAlpha(pose){ const a=pose.anim; if(!a || a.motion==='stomp' || a.motion==='lift') return 0; const lo=a.motion==='tap'?0.25:0.3, hi=a.motion==='tap'?0.65:0.75; return pose.p>lo&&pose.p<hi ? Math.sin((pose.p-lo)/(hi-lo)*Math.PI) : 0; }
