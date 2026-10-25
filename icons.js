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
function uiIconCanvas(id,scale){
  const key=id+'|'+scale; if(ICON_CACHE2[key]) return ICON_CACHE2[key];
  const shapes=UI_ICON_SHAPES[id]; if(!shapes) return null;
  const N=14, g0=[]; for(let y=0;y<N;y++) g0.push(new Array(N).fill(null));
  const put=(x,y,c)=>{ x=Math.round(x)+1; y=Math.round(y)+1; if(x>=0&&y>=0&&x<N&&y<N) g0[y][x]=c; };
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
  return ICON_CACHE2[key]=cv;
}
const uiIconURL=(id,scale)=>{ const c=uiIconCanvas(id,scale||2); return c?c.toDataURL():''; };
const uiIconImg=(id,scale,cls)=>`<img class="${cls||'pxIcon'}" src="${uiIconURL(id,scale)}" alt="">`;
