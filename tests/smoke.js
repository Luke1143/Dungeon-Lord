// Smoke test: menu, a campaign level (2D and 3D, 400 ticks; the imps as SVG figures; every relief, picture effect and figure look compiles), an arena match in 3D with fog, a Ludus bout to the end, no missing translations.
// Usage: NODE_PATH=$(npm root -g) node tests/smoke.js
const { open, finish }=require('./lib');
(async()=>{
  const { browser, page:p, errs }=await open({ viewport:{ width:1200, height:800 } });
  let problem=''; const shaderErr=[]; p.on('console',m=>{ if(/Shader Error|Program Info Log|THREE\.WebGLProgram/.test(m.text())) shaderErr.push(m.text().slice(0,200)); });
  await p.click('#menuNew'); await p.waitForTimeout(800);
  await p.evaluate(()=>{ const n=world.nodes.find(n=>n.col===0)||world.nodes[0]; startLevel(n.id); }); await p.waitForTimeout(2500);
  const lv=await p.evaluate(()=>{ setView3d(false); for(let i=0;i<400;i++) gameTick(); setView3d(true); return { screen, ticks:state.tickCount }; });
  await p.waitForTimeout(1500);
  if(lv.screen!=='level') problem+='campaign did not start; ';
  // the imps are SVG figures (svg-figures.js): pictures made from their rigs, front and back, 2D too; the legacy pixel sprites still work
  const fig=await p.evaluate(async()=>{ const m=state.imps[0]; if(!m) return 'no imp';
    const a=SvgFigures.canvasFor(m,Date.now(),true,'gold','back',0), b=SvgFigures.canvasFor(m,Date.now(),false,null,'front',0);
    if(!a._svg||!b._svg||a===b) return 'imp pictures wrong';
    setView3d(false); draw(); setOption('figures','pixel'); draw(); setOption('figures','svg'); setView3d(true); await new Promise(r=>setTimeout(r,300));
    return SvgFigures.size>1?'':'no imp pictures drawn'; });
  if(fig) problem+=fig+'; ';
  // the deepest relief (parallax occlusion) and every picture effect must compile
  await p.evaluate(()=>setOption('relief',3)); for(let l=0;l<6;l++){ await p.evaluate(v=>setPostLevel(v),l); await p.waitForTimeout(300); } await p.evaluate(()=>setPostLevel(1));
  // every figure look (with and without outline), over no filter and over the painted world
  for(const post of [0,5]){ await p.evaluate(v=>setPostLevel(v),post); const nf=await p.evaluate(()=>FIG_LOOKS.length); for(let f=1;f<nf;f++){ await p.evaluate(f=>{ setOption('outline',f%2===0); setOption('figSmooth',f%3===0); setOption('figLook',f); },f); await p.waitForTimeout(250); } }
  await p.evaluate(()=>{ setOption('figLook',0); setOption('outline',false); setOption('figSmooth',false); setPostLevel(1); });
  await p.evaluate(()=>{ setOption('relief',1); });
  if(shaderErr.length) problem+='shader: '+shaderErr[0]+'; ';
  await p.evaluate(()=>{ arenaStart({ teams:[{name:'A',groups:[arenaGroup('ork',2,3)]},{name:'B',groups:[arenaGroup('knight',2,3)]}], map:{layout:'ring',dims:'S',seed:'s',lava:1,water:1,crystal:0,near:1}, fog:true, batch:1 }); });
  await p.waitForTimeout(2000);
  const ludus=await p.evaluate(async()=>{
    arenaLeave(); await ludusOpen(); ludusNewRun('ork','Grom'); ludus.options=null; ludusScoutOpponent();
    for(let i=0;i<200&&!(ludus.options&&ludus.options.length);i++) await new Promise(r=>setTimeout(r,50));
    const o=(ludus.options||[])[0]; if(!o) return 'no opponent';
    ludus.opp=o; const st=arenaBuild(ludusMatchSetup(o,''),''); let n=0; while(arenaStep(st)&&n<3000) n++; return n>0?'':'bout did not run'; });
  if(ludus) problem+=ludus+'; ';
  const misses=await p.evaluate(()=>[...I18N_MISSES]);
  if(misses.length) problem+='missing translations: '+misses.slice(0,10).join(' | ');
  finish('smoke',errs,problem);
  await browser.close();
})();
