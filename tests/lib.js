// Shared helpers for the browser tests: start Chromium, open the game, collect page errors, build a test dungeon.
// The game runs from this checkout (or $GAME); pictures go to tests/out (not in git).
const { chromium }=require('playwright'); const path=require('path'), fs=require('fs');
const GAME=process.env.GAME||path.resolve(__dirname,'..');
const OUT=process.env.OUT||path.join(__dirname,'out');
const GL_ARGS=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];   // WebGL without a GPU, for the 3D view

// a browser with one page on the main menu; errs collects page errors and console errors
async function open(opts={}){
  const browser=await chromium.launch({ args:GL_ARGS });
  const page=await (await browser.newContext({ viewport:opts.viewport||{ width:1440, height:900 }, deviceScaleFactor:opts.scale||1 })).newPage();
  const errs=[]; page.on('pageerror',e=>errs.push('page: '+e.message)); page.on('console',m=>{ if(m.type()==='error') errs.push('console: '+m.text().slice(0,200)); });
  await page.goto('file://'+GAME+'/index.html'); await page.waitForTimeout(800);
  return { browser, page, errs };
}
function shot(page,name,clip){ fs.mkdirSync(OUT,{ recursive:true }); const file=path.join(OUT,name+'.png'); return page.screenshot(clip?{ path:file, clip }:{ path:file }).then(()=>file); }

// runs in the page: a campaign level with a corridor and rooms next to the throne, creatures in it, 120 ticks played; returns the camera spot
function buildScene(){
  startLevel(0);
  const th=tilesOfRoom('throne'), cx=Math.round(th.reduce((a,t)=>a+t.x,0)/th.length), cy=Math.round(th.reduce((a,t)=>a+t.y,0)/th.length), g=state.grid;
  const carve=(x0,y0,x1,y1,room)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){ const t=g[y]&&g[y][x]; if(!t||t.type==='bedrock'||t.room==='throne') continue;
    t.type='floor'; t.owned=true; t.owner='evil'; t.natural=false; t.gold=false; t.ore=false; t.gem=false; t.discovered=true; t.seen=true; t.room=room||null; } };
  const W=WORLD_COLS, H=WORLD_ROWS, X=Math.max(3,Math.min(W-27,Math.round((cx+W/2)/2)-12)), Y=Math.max(9,Math.min(H-11,Math.round((cy+H/2)/2)));
  for(let x=Math.min(cx,X);x<=Math.max(cx,X+22);x++) carve(x,Y,x,Y,null);
  carve(cx,Math.min(cy,Y),cx,Math.max(cy,Y),null);
  carve(X,Y-1,X+22,Y+1,null); carve(X+1,Y-6,X+6,Y-2,'dormitory'); carve(X+9,Y-6,X+14,Y-2,'hatchery'); carve(X+1,Y+2,X+6,Y+6,'storage'); carve(X+9,Y+2,X+14,Y+6,'forge'); carve(X+17,Y-5,X+22,Y+5,'library'); carve(X+17,Y+6,X+22,Y+10,'smelter');
  ['ork','ork','goblin','troll','darkelf','vampire','spider','lizard','skeleton','demon'].forEach((k,i)=>state.creatures.push(createHorde(k,X+2+i*2,Y)));
  state.creatures.push(createWarlock(X+18,Y));
  for(let i=0;i<120;i++) gameTick();
  jumpCameraTo(X+11,Y);
  return { x:X+11, y:Y, n:state.creatures.length };
}
// runs in the page: an arena match (layout: pit, caverns, ring, pillars, ...)
function startArena(layout){
  arenaStart({ teams:[{ name:'A', groups:[arenaGroup('ork',3,4),arenaGroup('troll',1,4),arenaGroup('warlock',1,4)] },{ name:'B', groups:[arenaGroup('knight',2,4),arenaGroup('wizard',1,4),arenaGroup('archer',2,4)] }],
    map:{ layout:layout||'pit', dims:'S', seed:'test', lava:0, water:0, crystal:0, near:1 }, fog:false, batch:1 });
}
// prints the errors and sets the exit code: a test fails on any page error
function finish(name,errs,extraFail){
  const fail=errs.length>0||!!extraFail;
  console.log((fail?'FAIL ':'ok   ')+name+(errs.length?'\n  '+errs.slice(0,8).join('\n  '):'')+(extraFail?'\n  '+extraFail:''));
  if(fail) process.exitCode=1;
}
module.exports={ open, shot, buildScene, startArena, finish, GAME, OUT };
