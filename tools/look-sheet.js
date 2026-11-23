// Picture sheets to choose the look by eye (docs/ui.md): the same scene (the test dungeon of tests/lib.js, relief "deep") at three zoom levels,
//   look-figures.png    figure looks (rows) x zoom (columns), the world without a filter
//   look-outline.png    the same with the outline on
//   look-world.png      world effects (rows) x zoom (columns), figures sharp: is the parallax still there under each filter?
//   look-mix.png        a few hand-picked mixes of world effect and figure look, near and middle
// Usage: NODE_PATH=$(npm root -g) node tools/look-sheet.js [figures,outline,world,mix,paint]   (pictures into tests/out/; without a list all but paint)
const { open, buildScene, OUT }=require('../tests/lib');
const path=require('path');
(async()=>{
  const { browser, page:p, errs }=await open();
  await p.click('#menuNew'); await p.waitForTimeout(1200);       // a new campaign (the level needs its world map)
  const cam=await p.evaluate(buildScene);
  // seven creatures of different kinds in a row in the corridor next to the rooms, standing still (the game is paused)
  await p.evaluate(c=>{ gameSpeed=0; const kinds=['ork','goblin','troll','darkelf','vampire','skeleton','warlock']; const pick=kinds.map(k=>state.creatures.find(x=>x.kind===k)).filter(Boolean);
    pick.forEach((x,i)=>{ x.x=c.x-6+i*2; x.y=c.y+(i%2); x.renderX=x.x; x.renderY=x.y; x.state='idle'; x.path=null; }); window.__look={ x:c.x, y:c.y+0.5 }; },cam);
  await p.evaluate(()=>{ setView3d(true); gameSpeed=0; OPTIONS.relief=3; applyLook(); });
  await p.waitForTimeout(1500);
  const ZOOMS=[[0.8,'weit'],[1.4,'mittel'],[2.2,'nah']];
  const FIG=[['Wie die Welt',0],['Scharf',1],['Weich',2],['Grob',3],['Röhre',4],['Schichten',5],['Schein',6]];
  const WORLD=[['Aus',0],['Weich',1],['Röhre',2],['Pixel glatt',4],['Gemalt',5]];
  // one picture: the middle of the board around the scene
  const grab=async({ zoom, post, fig, line })=>{
    // the camera on the row of creatures; the picture is cut around where that spot lands on the screen
    await p.evaluate(([zoom,post,fig,line])=>{ OPTIONS.figLook=fig; OPTIONS.outline=line; applyLook(); setPostLevel(post); setZoom(zoom);
      jumpCameraTo(window.__look.x,window.__look.y); },[zoom,post,fig,line]);
    await p.waitForTimeout(900);
    const at=await p.evaluate(()=>View3D.project(window.__look.x+0.5,window.__look.y+0.5,0.4));
    const box=await (await p.$('#viewport')).boundingBox(), W=480, H=300;
    const x=Math.max(box.x,Math.min(box.x+box.width-W,box.x+at.x-W/2)), y=Math.max(box.y,Math.min(box.y+box.height-H,box.y+at.y-H/2));
    return (await p.screenshot({ clip:{ x:Math.round(x), y:Math.round(y), width:W, height:H } })).toString('base64');
  };
  // a sheet: rows x columns of pictures with their names, drawn on a canvas in a blank page
  const ONLY=(process.argv[2]||'').split(',').filter(Boolean);
  const sheet=async(file,title,rows,cols,cell)=>{
    const name=file.replace(/^look-|\.png$/g,''); if(ONLY.length?!ONLY.includes(name):name==='paint') return;
    const pics=[]; for(const r of rows){ const line=[]; for(const c of cols) line.push(await grab(cell(r,c))); pics.push(line); }
    const q=await browser.newPage({ viewport:{ width:200+cols.length*490, height:70+rows.length*310 } });
    await q.setContent('<body style="margin:0;background:#111"><canvas id=c></canvas></body>');
    await q.evaluate(async([title,rows,cols,pics])=>{
      const cv=document.getElementById('c'); cv.width=200+cols.length*490; cv.height=70+rows.length*310; const g=cv.getContext('2d');
      g.fillStyle='#111'; g.fillRect(0,0,cv.width,cv.height); g.fillStyle='#e8d9b0'; g.font='bold 26px sans-serif'; g.fillText(title,16,34);
      g.font='20px sans-serif'; cols.forEach((c,i)=>g.fillText(c,200+i*490+8,62));
      for(let r=0;r<rows.length;r++){ g.fillStyle='#e8d9b0'; g.fillText(rows[r],12,70+r*310+150);
        for(let i=0;i<cols.length;i++){ const im=new Image(); im.src='data:image/png;base64,'+pics[r][i]; await im.decode(); g.drawImage(im,200+i*490,70+r*310); } }
    },[title,rows.map(r=>r[0]),cols.map(c=>c[1]),pics]);
    await (await q.$('#c')).screenshot({ path:path.join(OUT,file) }); await q.close(); console.log('  '+path.join(OUT,file));
  };
  await sheet('look-figures.png','Figuren-Stil × Zoom (Umgebung ohne Filter, Relief Tief)',FIG,ZOOMS,(f,z)=>({ zoom:z[0], post:0, fig:f[1], line:false }));
  await sheet('look-outline.png','Figuren-Stil mit Umriss × Zoom',FIG.slice(1),ZOOMS,(f,z)=>({ zoom:z[0], post:0, fig:f[1], line:true }));
  await sheet('look-world.png','Bildeffekt der Umgebung × Zoom (Figuren scharf, Relief Tief)',WORLD,ZOOMS,(w,z)=>({ zoom:z[0], post:w[1], fig:1, line:false }));
  await sheet('look-paint.png','Gemalt: Relief bleibt? (Relief Tief, Figuren scharf)',[['Aus',0],['Gemalt',5],['Pixel glatt',4]],ZOOMS.slice(1),(w,z)=>({ zoom:z[0], post:w[1], fig:1, line:false }));
  const MIX=[['Röhre + Röhre',2,4,false],['Gemalt + Schichten',5,5,true],['Gemalt + Weich',5,2,true],['Pixel glatt + Grob',4,3,true],['Weich + Schein',1,6,false],['Röhre + Scharf/Umriss',2,1,true]];
  await sheet('look-mix.png','Mischungen: Umgebung + Figuren',MIX,ZOOMS.slice(1),(m,z)=>({ zoom:z[0], post:m[1], fig:m[2], line:m[3] }));
  console.log(errs.length?'errors:\n  '+errs.slice(0,8).join('\n  '):'no errors');
  await browser.close();
})();
