// Our own pixel icons for the menu, the tiles and the falling events (12 x 12, drawn from a few shapes, with a dark outline added around everything).
// An icon is a list of shapes: ['r',x,y,w,h,colour] rectangle, ['c',cx,cy,radius,colour] disc, ['l',x0,y0,x1,y1,colour] line, ['p',x,y,colour] pixel.
const ICON_PAL={ w:'#f4f0e8', k:'#e8dcc0', K:'#b0a488', s:'#a8afb8', S:'#646b74', l:'#a8703a', L:'#6a4020', W:'#5a3820', g:'#e8c040', G:'#a07820', r:'#c8402e', R:'#7a1a14', b:'#4a7fd0', B:'#284a8a', y:'#ffd24a', f:'#f08020', e:'#4a9a3a', E:'#2a5a22', p:'#8a4ab0', c:'#60c8e0', o:'#1a120a' };
const UI_ICON_SHAPES={
  storage:[['r',1,3,10,8,'l'],['r',1,3,10,2,'L'],['r',1,7,10,1,'L'],['r',5,5,2,3,'g']],
  dormitory:[['r',0,7,12,3,'b'],['r',0,4,3,4,'w'],['r',0,9,12,2,'W'],['r',3,6,9,1,'B'],['r',0,10,1,2,'W'],['r',11,10,1,2,'W']],
  library:[['r',2,1,8,10,'r'],['r',2,1,2,10,'R'],['r',4,2,5,8,'k'],['r',5,4,3,1,'g'],['r',5,6,3,1,'K'],['r',5,8,3,1,'K']],
  hatchery:[['c',5,7,3,'w'],['r',7,2,3,3,'w'],['p',8,1,'r'],['p',9,1,'r'],['p',10,3,'y'],['p',8,3,'o'],['r',3,5,2,2,'w'],['r',4,10,1,2,'y'],['r',6,10,1,2,'y']],
  bridge:[['r',0,5,12,2,'l'],['r',0,7,12,1,'L'],['r',1,2,1,5,'W'],['r',10,2,1,5,'W'],['l',1,2,10,2,'W'],['r',0,9,12,3,'f'],['p',2,10,'y'],['p',6,11,'y'],['p',9,10,'y']],
  smelter:[['r',1,3,10,8,'s'],['r',3,5,6,6,'S'],['r',4,7,4,4,'f'],['r',5,8,2,3,'y'],['r',8,0,2,3,'S']],
  forge:[['r',1,6,9,2,'S'],['r',3,8,5,2,'S'],['r',2,10,7,1,'S'],['r',0,6,2,1,'S'],['r',8,1,4,3,'s'],['l',9,4,6,8,'l']],
  arena:[['l',1,1,10,10,'s'],['l',10,1,1,10,'s'],['r',0,8,3,1,'g'],['r',9,8,3,1,'g'],['p',1,1,'w'],['p',10,1,'w']],
  prison:[['r',1,1,10,10,'S'],['r',2,2,8,8,'o'],['r',3,2,1,8,'s'],['r',6,2,1,8,'s'],['r',9,2,1,8,'s'],['r',2,5,8,1,'S']],
  armory:[['r',2,1,8,6,'s'],['r',3,7,6,2,'s'],['r',4,9,4,1,'s'],['r',5,2,2,7,'r'],['r',3,4,6,2,'r']],
  tavern:[['r',2,3,6,8,'y'],['r',2,2,6,2,'w'],['r',8,5,2,1,'G'],['r',9,5,1,4,'G'],['r',8,8,2,1,'G'],['r',3,5,1,5,'g']],
  graveyard:[['r',3,3,6,8,'s'],['r',4,2,4,1,'s'],['r',5,4,2,5,'S'],['r',4,5,4,1,'S'],['r',1,11,10,1,'e']],
  guardpost:[['r',2,0,1,12,'W'],['r',3,1,7,4,'r'],['r',3,5,5,1,'R'],['r',3,1,7,1,'R']],
  training:[['c',6,6,5,'w'],['c',6,6,4,'r'],['c',6,6,2,'w'],['p',6,6,'r']],
  temple:[['r',1,1,10,2,'s'],['r',3,0,6,1,'s'],['r',2,3,2,7,'k'],['r',5,3,2,7,'k'],['r',8,3,2,7,'k'],['r',1,10,10,2,'s']],
  demolish:[['c',6,6,5,'f'],['c',6,6,3,'y'],['c',6,6,1,'w'],['l',0,0,3,3,'f'],['l',11,0,8,3,'f'],['l',0,11,3,8,'f'],['l',11,11,8,8,'f']],
  summon:[['c',6,7,4,'r'],['r',2,1,2,4,'R'],['r',8,1,2,4,'R'],['r',3,6,2,2,'y'],['r',7,6,2,2,'y'],['r',4,10,4,1,'o'],['p',4,9,'w'],['p',7,9,'w']],
  pick:[['r',3,6,7,5,'k'],['r',3,3,1,4,'k'],['r',5,2,1,5,'k'],['r',7,3,1,4,'k'],['r',9,4,1,3,'k'],['r',1,6,3,2,'k']],
  possess:[['r',0,5,12,3,'w'],['r',2,4,8,5,'w'],['r',3,3,6,7,'w'],['c',6,6,3,'p'],['p',6,6,'o'],['p',5,5,'w']],
  retreat:[['r',1,3,5,6,'W'],['r',2,4,3,5,'o'],['l',11,6,5,6,'c'],['l',5,6,7,3,'c'],['l',5,6,7,9,'c'],['r',8,5,4,2,'c']],
  berserk:[['c',6,7,4,'r'],['r',2,2,2,3,'R'],['r',8,2,2,3,'R'],['l',3,4,5,6,'o'],['l',9,4,7,6,'o'],['r',4,6,1,1,'y'],['r',7,6,1,1,'y'],['r',4,9,4,1,'o'],['p',5,9,'w'],['p',7,9,'w']],
  info:[['r',3,1,6,2,'w'],['r',8,3,2,3,'w'],['r',6,6,3,2,'w'],['r',5,8,2,1,'w'],['r',5,10,2,2,'w']],
  tabRooms:[['r',1,4,10,8,'s'],['r',1,1,2,3,'s'],['r',5,1,2,3,'s'],['r',9,1,2,3,'s'],['r',5,7,2,5,'W'],['r',3,6,1,2,'o'],['r',8,6,1,2,'o']],
  tabSpells:[['r',5,0,2,12,'c'],['r',0,5,12,2,'c'],['r',3,3,6,6,'w'],['c',6,6,2,'y']],
  tabTraps:[['r',1,8,10,2,'S'],['l',1,8,3,4,'s'],['l',4,8,6,4,'s'],['l',7,8,9,4,'s'],['r',5,5,2,3,'S']],
  tabCreatures:[['c',6,5,4,'k'],['r',4,8,4,3,'k'],['r',3,4,2,2,'o'],['r',7,4,2,2,'o'],['r',5,9,2,1,'o'],['p',6,6,'K']],
  evLevel:[['c',6,6,4,'y'],['r',5,0,2,12,'y'],['r',0,5,12,2,'y'],['c',6,6,2,'w']],
  evDeath:[['c',6,5,4,'k'],['r',4,8,4,3,'k'],['r',3,4,2,2,'o'],['r',7,4,2,2,'o'],['r',5,9,1,2,'o'],['r',7,9,1,2,'o']],
  evDanger:[['l',1,1,10,10,'s'],['l',10,1,1,10,'s'],['r',0,8,3,1,'r'],['r',9,8,3,1,'r']],
  evFull:[['r',1,3,10,8,'l'],['r',1,3,10,2,'L'],['r',1,7,10,1,'L'],['r',4,5,4,1,'r'],['r',3,5,1,3,'r']],
  evBuild:[['r',6,1,5,4,'S'],['l',7,4,2,10,'l'],['r',0,10,6,2,'s']],
  evDig:[['l',1,10,9,2,'l'],['r',5,1,6,1,'s'],['r',9,1,2,3,'s'],['r',3,2,3,1,'s'],['r',2,3,2,2,'s']],
  evGold:[['c',6,6,5,'g'],['c',6,6,3,'G'],['r',5,4,2,5,'g']],
  evIdea:[['c',6,5,4,'y'],['r',5,9,2,2,'s'],['r',4,9,4,1,'S'],['p',5,4,'w']],
  evDebug:[['c',6,7,4,'r'],['r',5,2,2,2,'o'],['l',1,6,4,6,'o'],['l',8,6,11,6,'o'],['r',5,5,2,6,'o']],
  evMessage:[['r',2,1,8,10,'k'],['r',1,1,1,10,'K'],['r',4,3,5,1,'S'],['r',4,5,5,1,'S'],['r',4,7,4,1,'S']]
};
const ICON_CACHE2={};
// shapes → a 14 x 14 picture (the 12 x 12 field plus a dark outline), each pixel `scale` px; off moves the shapes (a 9 x 9 thought shape sits in the middle with 1.5)
function shapesCanvas(shapes,scale,off){
  const N=14, d=1+(off||0), g0=[]; for(let y=0;y<N;y++) g0.push(new Array(N).fill(null));
  const put=(x,y,c)=>{ x=Math.round(x+d); y=Math.round(y+d); if(x>=0&&y>=0&&x<N&&y<N) g0[y][x]=c; };
  shapes.forEach(s=>{
    const c=ICON_PAL[s[s.length-1]]||'#f0f';
    if(s[0]==='r') for(let y=0;y<s[4];y++) for(let x=0;x<s[3];x++) put(s[1]+x,s[2]+y,c);
    else if(s[0]==='c'){ const r=s[3]; for(let y=-r;y<=r;y++) for(let x=-r;x<=r;x++) if(x*x+y*y<=r*r+0.5) put(s[1]+x,s[2]+y,c); }
    else if(s[0]==='l'){ const n=Math.max(Math.abs(s[3]-s[1]),Math.abs(s[4]-s[2]))||1; for(let i=0;i<=n;i++) put(s[1]+(s[3]-s[1])*i/n,s[2]+(s[4]-s[2])*i/n,c); }
    else if(s[0]==='p') put(s[1],s[2],c);
  });
  const out=[...g0.map(r=>r.slice())];
  for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(!g0[y][x]){ for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const q=g0[y+dy]&&g0[y+dy][x+dx]; if(q){ out[y][x]=ICON_PAL.o; break; } } }
  const cv=document.createElement('canvas'); cv.width=cv.height=N*scale; const g=cv.getContext('2d');
  for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(out[y][x]){ g.fillStyle=out[y][x]; g.fillRect(x*scale,y*scale,scale,scale); }
  return cv;
}
function uiIconCanvas(id,scale){
  const key=id+'|'+scale; if(ICON_CACHE2[key]) return ICON_CACHE2[key];
  const shapes=UI_ICON_SHAPES[id]; if(!shapes) return null;
  return ICON_CACHE2[key]=shapesCanvas(shapes,scale);
}
const uiIconURL=(id,scale)=>{ const c=uiIconCanvas(id,scale||2); return c?c.toDataURL():''; };
const uiIconImg=(id,scale,cls)=>`<img class="${cls||'pxIcon'}" src="${uiIconURL(id,scale)}" alt="">`;

// ---- thoughts: what a creature thinks, as our own pixel icon in a small white bubble (instead of an emoji). 9 x 9, same shape language as above.
// A thought without an entry falls back to its emoji (thoughtCanvas returns null).
const THOUGHT_SHAPES={
  '⚔️':[['l',1,1,7,7,'S'],['l',7,1,1,7,'S'],['p',2,6,'G'],['p',6,6,'G'],['p',0,8,'L'],['p',8,8,'L'],['p',1,7,'L'],['p',7,7,'L'],['p',1,1,'s'],['p',7,1,'s']],
  '💤':[['r',0,2,5,1,'b'],['l',4,3,0,6,'b'],['r',0,7,5,1,'b'],['r',5,0,4,1,'c'],['p',7,1,'c'],['r',5,2,4,1,'c']],
  '🍗':[['c',3,3,3,'l'],['r',1,1,2,2,'g'],['l',5,5,7,7,'w'],['p',8,6,'w'],['p',6,8,'w'],['p',8,8,'w']],
  '😡':[['c',4,4,4,'r'],['l',1,2,3,3,'o'],['l',7,2,5,3,'o'],['p',3,4,'o'],['p',5,4,'o'],['r',3,6,3,1,'o']],
  '😟':[['c',4,4,4,'y'],['p',3,3,'o'],['p',5,3,'o'],['p',2,7,'o'],['r',3,6,3,1,'o'],['p',6,7,'o']],
  '😄':[['c',4,4,4,'y'],['p',3,3,'o'],['p',5,3,'o'],['p',2,5,'o'],['r',3,6,3,1,'o'],['p',6,5,'o']],
  '💫':[['r',1,2,3,1,'y'],['r',2,1,1,3,'y'],['r',5,4,3,1,'y'],['r',6,3,1,3,'y'],['r',2,6,3,1,'g'],['r',3,5,1,3,'g']],
  '❗':[['r',3,0,3,6,'r'],['r',3,7,3,2,'r']],
  '🤢':[['c',4,4,4,'e'],['p',3,3,'o'],['p',5,3,'o'],['p',2,6,'o'],['p',3,5,'o'],['p',4,6,'o'],['p',5,5,'o'],['p',6,6,'o']],
  '💬':[['p',1,4,'o'],['p',4,4,'o'],['p',7,4,'o']],
  '🐾':[['c',4,6,2,'W'],['p',1,3,'W'],['p',3,2,'W'],['p',5,2,'W'],['p',7,3,'W']],
  '📖':[['r',0,2,4,6,'k'],['r',5,2,4,6,'k'],['r',4,2,1,7,'K'],['r',1,3,2,1,'S'],['r',1,5,2,1,'S'],['r',6,3,2,1,'S'],['r',6,5,2,1,'S']],
  '🔍':[['c',3,3,3,'S'],['c',3,3,2,'c'],['l',5,5,8,8,'l'],['p',2,2,'w']],
  '🔨':[['r',1,1,7,3,'S'],['r',1,1,7,1,'s'],['r',4,4,2,5,'l']],
  '🔥':[['c',4,6,3,'f'],['r',3,2,3,3,'f'],['p',4,1,'f'],['c',4,6,1,'y'],['p',4,4,'y']],
  '⛓️':[['r',0,0,4,4,'S'],['r',1,1,2,2,'w'],['r',5,5,4,4,'S'],['r',6,6,2,2,'w'],['r',3,3,3,3,'s'],['p',4,4,'w']],
  '🌿':[['l',1,8,7,1,'E'],['r',2,4,2,2,'e'],['r',5,1,2,2,'e'],['r',5,5,2,2,'e'],['p',1,6,'e']],
  '👀':[['r',0,2,4,5,'S'],['r',1,3,2,3,'k'],['r',5,2,4,5,'S'],['r',6,3,2,3,'k'],['p',2,4,'o'],['p',7,4,'o']],
  '👁️':[['r',1,3,7,3,'S'],['r',2,2,5,5,'S'],['r',2,3,5,3,'k'],['c',4,4,1,'p'],['p',4,4,'o']],
  '🥱':[['c',4,4,4,'y'],['r',2,3,2,1,'o'],['r',5,3,2,1,'o'],['r',3,5,3,3,'o'],['p',4,6,'r']],
  '🤔':[['c',4,4,4,'y'],['p',3,3,'o'],['p',5,3,'o'],['r',2,2,2,1,'o'],['r',3,6,3,1,'o'],['r',6,6,3,2,'g']],
  '🎵':[['r',5,0,1,6,'o'],['r',5,0,3,1,'o'],['p',7,1,'o'],['c',3,6,2,'o']],
  '💢':[['r',0,0,3,1,'r'],['r',0,0,1,3,'r'],['r',6,0,3,1,'r'],['r',8,0,1,3,'r'],['r',0,8,3,1,'r'],['r',0,6,1,3,'r'],['r',6,8,3,1,'r'],['r',8,6,1,3,'r']],
  '💪':[['r',1,4,6,3,'l'],['c',5,3,2,'l'],['r',1,7,3,2,'l'],['p',5,2,'g']],
  '✨':[['r',3,0,1,7,'y'],['r',0,3,7,1,'y'],['p',3,3,'w'],['r',7,6,1,3,'g'],['r',6,7,3,1,'g']],
  '💨':[['r',0,2,6,1,'c'],['p',6,1,'c'],['r',2,5,7,1,'c'],['p',8,4,'c'],['r',0,7,4,1,'c']],
  '🐌':[['c',5,4,3,'l'],['c',5,4,1,'g'],['r',0,7,9,2,'k'],['p',1,6,'k'],['p',0,5,'o']],
  '😈':[['c',4,5,3,'p'],['p',1,1,'p'],['p',2,2,'p'],['p',7,1,'p'],['p',6,2,'p'],['p',3,4,'y'],['p',5,4,'y'],['r',3,7,3,1,'o']],
  '🦴':[['l',2,2,6,6,'K'],['p',1,1,'K'],['p',2,1,'K'],['p',1,2,'K'],['p',7,7,'K'],['p',6,7,'K'],['p',7,6,'K']],
  '⏩':[['l',0,1,3,4,'y'],['l',3,4,0,7,'y'],['r',0,2,2,5,'y'],['l',4,1,7,4,'y'],['l',7,4,4,7,'y'],['r',4,2,2,5,'y']],
  '🐺':[['c',4,5,3,'s'],['p',1,1,'s'],['p',2,2,'s'],['p',7,1,'s'],['p',6,2,'s'],['p',3,4,'o'],['p',5,4,'o'],['p',4,7,'o']],
  '🌀':[['c',4,4,4,'b'],['c',4,4,3,'w'],['c',4,4,2,'b'],['c',4,4,1,'w'],['r',4,0,4,1,'b']]
};
const THOUGHT_CACHE={};
function thoughtCanvas(ch){
  if(THOUGHT_CACHE[ch]!==undefined) return THOUGHT_CACHE[ch];
  const shapes=THOUGHT_SHAPES[ch]; if(!shapes) return THOUGHT_CACHE[ch]=null;
  const W=13, H=14, g0=[]; for(let y=0;y<H;y++) g0.push(new Array(W).fill(null));
  const put=(x,y,c)=>{ x=Math.round(x); y=Math.round(y); if(x>=0&&y>=0&&x<W&&y<H) g0[y][x]=c; };
  // the bubble: a rounded white field with a tail, outlined
  for(let y=1;y<=10;y++) for(let x=1;x<=11;x++) if(!((y===1||y===10)&&(x===1||x===11))) put(x,y,'#f4f0e8');
  [[3,11],[4,11],[3,12]].forEach(([x,y])=>put(x,y,'#f4f0e8'));
  shapes.forEach(s=>{
    const c=ICON_PAL[s[s.length-1]]||'#f0f', P=(x,y)=>put(x+2,y+1.5,c);
    if(s[0]==='r') for(let y=0;y<s[4];y++) for(let x=0;x<s[3];x++) P(s[1]+x,s[2]+y);
    else if(s[0]==='c'){ const r=s[3]; for(let y=-r;y<=r;y++) for(let x=-r;x<=r;x++) if(x*x+y*y<=r*r+0.5) P(s[1]+x,s[2]+y); }
    else if(s[0]==='l'){ const n=Math.max(Math.abs(s[3]-s[1]),Math.abs(s[4]-s[2]))||1; for(let i=0;i<=n;i++) P(s[1]+(s[3]-s[1])*i/n,s[2]+(s[4]-s[2])*i/n); }
    else if(s[0]==='p') P(s[1],s[2]);
  });
  const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const g=cv.getContext('2d');
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ if(g0[y][x]){ g.fillStyle=g0[y][x]; g.fillRect(x,y,1,1); } else if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>g0[y+dy]&&g0[y+dy][x+dx])){ g.fillStyle='#1a120a'; g.fillRect(x,y,1,1); } }
  return THOUGHT_CACHE[ch]=cv;
}

// ---- emojis → our own pixel icons, everywhere ----
// An emoji in this table never reaches the screen as an emoji: in the page (buttons, labels, the log) it is swapped for a small picture
// as soon as it appears, and a canvas that draws it alone (the world in 2D and 3D, the arena, the Ludus) draws the picture instead.
// Same shape language as above (12 x 12). 'ui:id' borrows a menu icon, 'th' the thought of the same emoji. An emoji not in the table stays an emoji.
const EMOJI_SHAPES={
  '⏸':[['r',3,2,2,8,'w'],['r',7,2,2,8,'w']],
  '▶':[['r',4,1,1,10,'w'],['r',5,2,1,8,'w'],['r',6,3,1,6,'w'],['r',7,4,1,4,'w'],['r',8,5,1,2,'w']],
  '⏩':[['r',1,2,1,8,'w'],['r',2,3,1,6,'w'],['r',3,4,1,4,'w'],['r',4,5,1,2,'w'],['r',6,2,1,8,'w'],['r',7,3,1,6,'w'],['r',8,4,1,4,'w'],['r',9,5,1,2,'w']],
  '⏭':[['r',2,1,1,10,'w'],['r',3,2,1,8,'w'],['r',4,3,1,6,'w'],['r',5,4,1,4,'w'],['r',6,5,1,2,'w'],['r',8,1,2,10,'w']],
  '🏰':[['r',1,5,10,6,'s'],['r',1,3,2,2,'s'],['r',5,3,2,2,'s'],['r',9,3,2,2,'s'],['r',1,10,10,1,'S'],['r',4,7,4,4,'W'],['r',5,6,2,1,'W'],['r',6,0,1,3,'W'],['r',7,0,3,2,'r']],
  '🗺':[['r',1,2,10,8,'k'],['r',4,2,1,8,'K'],['r',7,2,1,8,'K'],['p',2,8,'r'],['p',3,7,'r'],['p',5,6,'r'],['p',6,5,'r'],['l',8,3,10,5,'r'],['l',10,3,8,5,'r']],
  '⚙':[['c',6,6,4,'s'],['r',5,0,2,2,'s'],['r',5,10,2,2,'s'],['r',0,5,2,2,'s'],['r',10,5,2,2,'s'],['p',2,2,'s'],['p',9,2,'s'],['p',2,9,'s'],['p',9,9,'s'],['c',6,6,2,'S'],['r',5,5,2,2,'o']],
  '🔊':[['r',1,4,3,4,'s'],['r',4,3,1,6,'s'],['r',5,2,1,8,'s'],['r',6,1,1,10,'s'],['r',8,4,1,4,'w'],['r',10,2,1,8,'w'],['p',9,3,'w'],['p',9,8,'w']],
  '🔇':[['r',1,4,3,4,'s'],['r',4,3,1,6,'s'],['r',5,2,1,8,'s'],['r',6,1,1,10,'s'],['l',8,4,11,7,'r'],['l',11,4,8,7,'r']],
  '🎵':[['r',4,1,6,2,'y'],['r',4,2,1,7,'y'],['r',9,2,1,6,'y'],['c',3,9,2,'y'],['c',8,8,2,'y']],
  '🗂':[['r',1,2,4,2,'G'],['r',1,4,10,7,'g'],['r',1,4,10,1,'G'],['r',2,7,8,1,'G']],
  '💰':[['r',4,1,4,2,'l'],['r',5,3,2,1,'L'],['c',6,8,4,'l'],['r',3,5,6,1,'l'],['r',5,6,2,4,'g'],['r',4,7,4,1,'g'],['p',3,7,'k']],
  '🪙':'ui:evGold',
  '🪨':[['c',6,7,4,'S'],['c',5,6,3,'s'],['r',2,10,9,1,'S'],['p',4,5,'w'],['p',5,4,'k']],
  '⛓':[['r',0,3,5,5,'s'],['r',1,4,3,3,'o'],['r',7,3,5,5,'s'],['r',8,4,3,3,'o'],['r',3,5,6,1,'S']],
  '👹':'ui:summon', '⛏':'ui:evDig', '🐞':'ui:evDebug', '⚔':'ui:evDanger', '👁':'ui:possess', '🛏':'ui:dormitory', '↩':'ui:retreat',
  '❔':'ui:info', '💀':'ui:evDeath', '🛡':'ui:armory', '📚':'ui:library', '🔨':'ui:forge',
  '🔥':[['r',5,1,2,2,'f'],['p',8,3,'f'],['p',3,4,'f'],['r',4,3,4,3,'f'],['c',6,8,3,'f'],['r',3,5,6,4,'f'],['r',5,6,2,2,'y'],['c',6,9,1,'y'],['r',5,9,3,1,'y']],
  '🌀':[['c',6,6,5,'c'],['c',6,6,4,'b'],['c',6,6,3,'c'],['c',6,6,2,'b'],['p',6,6,'w'],['r',6,1,1,3,'B'],['r',7,8,3,1,'B']],
  '💚':[['c',4,4,3,'e'],['c',8,4,3,'e'],['r',2,5,9,3,'e'],['r',3,7,7,1,'e'],['r',4,8,5,1,'e'],['r',5,9,3,1,'e'],['p',6,10,'e'],['p',3,3,'w']],
  '🦄':[['r',4,5,4,1,'y'],['r',3,6,6,1,'y'],['r',2,7,8,3,'y'],['r',0,10,12,1,'G'],['p',6,1,'y'],['p',6,2,'y'],['p',2,3,'y'],['p',10,3,'y'],['p',0,6,'y'],['p',11,6,'y']],
  '🥶':[['l',6,0,6,11,'c'],['l',1,6,11,6,'c'],['l',2,2,10,10,'c'],['l',10,2,2,10,'c'],['p',6,6,'w'],['p',5,1,'c'],['p',7,1,'c'],['p',5,11,'c'],['p',7,11,'c']],
  '⚡':[['l',8,0,4,5,'y'],['l',9,0,5,5,'y'],['r',3,5,7,1,'y'],['l',8,6,4,11,'y'],['l',7,6,3,11,'y']],
  '😱':[['c',6,6,5,'c'],['r',3,3,2,2,'w'],['r',7,3,2,2,'w'],['p',4,4,'o'],['p',8,4,'o'],['r',5,7,2,3,'o'],['p',1,9,'w'],['p',11,9,'w']],
  '➕':[['r',5,1,2,10,'e'],['r',1,5,10,2,'e']],
  '🔒':[['r',3,1,6,1,'s'],['r',3,1,1,5,'s'],['r',8,1,1,5,'s'],['r',2,5,8,6,'g'],['r',2,5,8,1,'G'],['r',5,7,2,2,'o']],
  '🍷':[['r',3,1,6,1,'s'],['r',3,2,6,3,'R'],['r',4,5,4,1,'R'],['p',4,2,'r'],['r',5,6,2,4,'s'],['r',3,10,6,1,'s']],
  '👑':[['r',1,3,1,3,'g'],['r',5,2,2,4,'g'],['r',10,3,1,3,'g'],['r',1,6,10,3,'g'],['r',1,9,10,1,'G'],['p',3,7,'b'],['p',6,7,'r'],['p',8,7,'b']],
  '💎':[['r',3,2,6,2,'c'],['r',2,4,8,1,'c'],['r',3,5,6,1,'b'],['r',4,6,4,1,'b'],['r',5,7,2,2,'b'],['p',4,3,'w'],['p',5,2,'w']],
  '🔲':[['r',1,1,10,10,'s'],['r',3,3,6,6,'o']],
  '🎉':[['r',1,9,2,2,'g'],['r',2,8,2,2,'g'],['r',3,7,2,2,'g'],['r',4,6,2,2,'G'],['p',7,2,'r'],['p',9,4,'b'],['p',6,4,'y'],['p',10,7,'e'],['p',8,6,'p'],['p',5,1,'c'],['p',11,2,'f'],['p',9,9,'r']],
  '🪑':[['r',3,1,2,10,'l'],['r',3,6,7,2,'l'],['r',8,8,2,3,'L'],['r',5,1,1,5,'L']],
  '🍗':'th', '💤':'th', '💢':'th', '💨':'th', '✨':'th', '💬':'th', '🐾':'th', '📖':'th', '🔍':'th', '🌿':'th', '💪':'th', '🦴':'th', '💫':'th', '❗':'th'
};
const EMOJI_ICON_CACHE={};
const emojiKey=ch=>String(ch).replace(/\uFE0F/g,'').trim();
// the picture for an emoji (null when it has none); scale: px per pixel
function emojiIconCanvas(ch,scale){
  const k=emojiKey(ch), sc=scale||1, ck=k+'|'+sc;
  if(EMOJI_ICON_CACHE[ck]!==undefined) return EMOJI_ICON_CACHE[ck];
  let e=EMOJI_SHAPES[k], cv=null;
  if(!e){ const id=emojiItemOf(k); if(id===undefined) return null; if(id) cv=itemIconCanvas(id,14*sc); return EMOJI_ICON_CACHE[ck]=cv; }   // a piece of gear: its own picture
  if(e==='th'){ const t=THOUGHT_SHAPES[k]||THOUGHT_SHAPES[k+'\uFE0F']; if(t) cv=shapesCanvas(t,sc,1.5); }
  else if(typeof e==='string' && e.startsWith('ui:')) cv=uiIconCanvas(e.slice(3),sc);
  else if(e) cv=shapesCanvas(e,sc);
  return EMOJI_ICON_CACHE[ck]=cv;
}
// the first piece of gear (weapon, armour, shield) that wears this emoji and has a picture; undefined while the game is not loaded yet
let EMOJI_ITEMS=null;
function emojiItemOf(k){
  if(typeof ITEMS==='undefined'||typeof itemIconCanvas!=='function') return undefined;
  if(!EMOJI_ITEMS){ EMOJI_ITEMS={}; Object.keys(ITEMS).forEach(id=>{ const d=ITEMS[id], e=d&&d.icon&&emojiKey(d.icon); if(e&&!(e in EMOJI_ITEMS)&&['weapon','armor','shield'].includes(d.type)){ let ok=false; try{ ok=!!itemIconCanvas(id,14); }catch(err){} if(ok) EMOJI_ITEMS[e]=id; } }); }
  return EMOJI_ITEMS[k]||null;
}
const EMOJI_URL={};
const emojiIconURL=(ch,scale)=>{ const k=emojiKey(ch)+'|'+scale; if(EMOJI_URL[k]===undefined){ const c=emojiIconCanvas(ch,scale); EMOJI_URL[k]=c?c.toDataURL():''; } return EMOJI_URL[k]; };
// a canvas that draws one emoji alone draws its picture, as big as the font, placed like the text would be
(function patchEmojiCanvas(){
  const C=CanvasRenderingContext2D.prototype, fill=C.fillText;
  C.fillText=function(t,x,y,...a){
    const s=typeof t==='string'?t:String(t);
    if(s.length<=4 && !/[A-Za-z0-9]/.test(s)){
      const cv=emojiIconCanvas(s,1);
      if(cv){
        const m=/(\d+(?:\.\d+)?)px/.exec(this.font), px=m?+m[1]:16, size=px*1.05;
        const al=this.textAlign, bl=this.textBaseline;
        const x0=al==='center'?x-size/2:(al==='right'||al==='end')?x-size:x;
        const y0=bl==='middle'?y-size/2:bl==='top'||bl==='hanging'?y:bl==='bottom'||bl==='ideographic'?y-size:y-size*0.85;
        const sm=this.imageSmoothingEnabled; this.imageSmoothingEnabled=false; this.drawImage(cv,x0,y0,size,size); this.imageSmoothingEnabled=sm;
        return;
      }
    }
    return fill.call(this,t,x,y,...a);
  };
})();
// the page: emojis in text are swapped for pictures (whole pixels: 14 px, or 28 px in big text)
let EMOJI_DOM_RE=null;
const emojiDomRe=()=>EMOJI_DOM_RE||(EMOJI_DOM_RE=new RegExp('('+Object.keys(EMOJI_SHAPES).concat(Object.keys((emojiItemOf('')!==undefined&&EMOJI_ITEMS)||{})).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')\uFE0F?','gu'));
const EMOJI_SKIP=new Set(['SCRIPT','STYLE','OPTION','SELECT','TEXTAREA','TITLE','CANVAS']);
function emojiDomSwap(root){
  const nodes=[];
  if(root.nodeType===3) nodes.push(root);
  else { if(EMOJI_SKIP.has(root.nodeName)) return; const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); while(w.nextNode()) nodes.push(w.currentNode); }
  nodes.forEach(n=>{
    const par=n.parentNode, t=n.nodeValue; if(!par||!t||EMOJI_SKIP.has(par.nodeName)||par.isContentEditable) return;
    const RE=emojiDomRe(); RE.lastIndex=0; if(!RE.test(t)) return;
    let fs=14; try{ fs=parseFloat(getComputedStyle(par).fontSize)||14; }catch(e){}
    const sc=fs>=21?2:1, frag=document.createDocumentFragment(); let last=0;
    t.replace(RE,(m,ch,i)=>{
      const url=emojiIconURL(ch,sc); if(!url) return m;
      if(i>last) frag.appendChild(document.createTextNode(t.slice(last,i)));
      const im=document.createElement('img'); im.className='emi'+(sc>1?' emi2':''); im.src=url; im.alt=''; im.draggable=false; frag.appendChild(im);
      last=i+m.length; return m;
    });
    if(last===0) return;
    if(last<t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    par.replaceChild(frag,n);
  });
}
(function watchEmojis(){
  const start=()=>{
    emojiDomSwap(document.body);
    let queue=[], planned=false;
    const flush=()=>{ planned=false; const q=queue; queue=[]; q.forEach(n=>{ if(n.isConnected) emojiDomSwap(n); }); };
    new MutationObserver(list=>{
      list.forEach(m=>{ if(m.type==='characterData') queue.push(m.target); else m.addedNodes.forEach(n=>{ if(n.nodeType===1||n.nodeType===3) queue.push(n); }); });
      if(queue.length&&!planned){ planned=true; Promise.resolve().then(flush); }
    }).observe(document.body,{ childList:true, subtree:true, characterData:true });
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();   // after every script, so the gear is known
})();
