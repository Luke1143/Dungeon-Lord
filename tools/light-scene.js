// The imps (SVG figures) under different light, to judge how they read: a dark stretch, next to a wall torch, a few steps from it, at lava,
// in the forge, under the Dungeon Lord's hand (the 3D pointer, it casts light); then the same with the mood light off and with the old pixel imps.
// Pictures into tests/out/light-*.png and one sheet, light-sheet.png.
// Usage: NODE_PATH=$(npm root -g) node tools/light-scene.js
const { open, buildScene, OUT }=require('../tests/lib');
const path=require('path');
(async()=>{
  const { browser, page:p, errs }=await open();
  await p.click('#menuNew'); await p.waitForTimeout(1200);
  const cam=await p.evaluate(buildScene);
  // the spots: by a torch of the corridor, three steps from it, at the far end of the corridor (dark), at lava carved into the corridor, in the forge
  const spots=await p.evaluate(c=>{
    gameSpeed=0; state.creatures=[];
    const g=state.grid, X=c.x-11, Y=c.y;
    for(let x=X+19;x<=X+22;x++){ const t=g[Y+1][x]; t.type='water'; t.lava=true; t.room=null; }
    const torch=wallTorchItems().filter(t=>t.kind==='wallTorch'&&Math.abs(t.y-Y)<=1&&t.x>=X&&t.x<=X+16).sort((a,b)=>a.x-b.x)[0];
    const forge=computeRooms().find(r=>r.type==='forge'), st=forge&&forgeStations(forge)[0], ft=st?{ x:st.fire.x, y:st.fire.y+1 }:{ x:X+11, y:Y+4 };       // beside the forge's fire
    const s={ torch:torch?{ x:torch.x, y:torch.y }:{ x:X+4, y:Y }, mid:torch?{ x:torch.x+3, y:Y }:{ x:X+7, y:Y }, dark:{ x:X+1, y:Y-1 }, lava:{ x:X+20, y:Y }, forge:{ x:ft.x, y:ft.y } };
    state.imps=Object.values(s).map((q,i)=>{ const m=createImp(q.x,q.y); m.level=[2,5,8,11,6][i]; m.carryAmount=i%2?5:0; m.renderX=m.x; m.renderY=m.y; return m; });
    return s;
  },cam);
  const shots=[];
  const take=async(name,at,opts)=>{
    await p.evaluate(([at,o])=>{ setOption('mood',o.mood!==false); setOption('figures',o.fig||'svg'); setView3d(true); setZoom(2.4); jumpCameraTo(at.x,at.y); },[at,opts||{}]);
    await p.mouse.move(5,5); await p.waitForTimeout(900);
    if(opts&&opts.hand){ const box=await (await p.$('#board')).boundingBox(), pt=await p.evaluate(at=>View3D.project(at.x+1.2,at.y+0.8,0),at); await p.mouse.move(box.x+pt.x,box.y+pt.y); await p.waitForTimeout(900); }
    const box=await (await p.$('#viewport')).boundingBox(), f=path.join(OUT,'light-'+name+'.png');
    await p.screenshot({ path:f, clip:{ x:Math.round(box.x+box.width/2-330), y:Math.round(box.y+box.height/2-210), width:660, height:420 } }); shots.push([name,f]); console.log('  '+f);
  };
  await take('dunkel',spots.dark); await take('fackel',spots.torch); await take('drei-schritte',spots.mid); await take('lava',spots.lava); await take('schmiede',spots.forge);
  await take('hand',spots.dark,{ hand:true }); await take('ohne-stimmung',spots.torch,{ mood:false }); await take('pixel-alt',spots.torch,{ fig:'pixel' });
  // one sheet of all
  const q=await browser.newPage({ viewport:{ width:1340, height:1720 } });
  const b64=shots.map(([n,f])=>[n,require('fs').readFileSync(f).toString('base64')]);
  await q.setContent('<body style="margin:0;background:#111"><canvas id=c width=1340 height=1720></canvas></body>');
  await q.evaluate(async b64=>{ const g=document.getElementById('c').getContext('2d'); g.fillStyle='#111'; g.fillRect(0,0,1340,1720); g.font='20px sans-serif';
    for(let i=0;i<b64.length;i++){ const [n,d]=b64[i], im=new Image(); im.src='data:image/png;base64,'+d; await im.decode(); const x=(i%2)*670+5, y=Math.floor(i/2)*430+5; g.drawImage(im,x,y,660,420); g.fillStyle='rgba(0,0,0,0.6)'; g.fillRect(x,y,200,30); g.fillStyle='#e8d9b0'; g.fillText(n,x+8,y+21); } },b64);
  await (await q.$('#c')).screenshot({ path:path.join(OUT,'light-sheet.png') }); console.log('  '+path.join(OUT,'light-sheet.png'));
  console.log(errs.length?'errors:\n  '+errs.slice(0,8).join('\n  '):'no errors');
  await browser.close();
})();
