// Smoke test: menu, a campaign level (2D and 3D, 400 ticks), an arena match in 3D with fog, a Ludus bout to the end, no missing translations.
// Usage: NODE_PATH=$(npm root -g) node tests/smoke.js
const { open, finish }=require('./lib');
(async()=>{
  const { browser, page:p, errs }=await open({ viewport:{ width:1200, height:800 } });
  let problem='';
  await p.click('#menuNew'); await p.waitForTimeout(800);
  await p.evaluate(()=>{ const n=world.nodes.find(n=>n.col===0)||world.nodes[0]; startLevel(n.id); }); await p.waitForTimeout(2500);
  const lv=await p.evaluate(()=>{ setView3d(false); for(let i=0;i<400;i++) gameTick(); setView3d(true); return { screen, ticks:state.tickCount }; });
  await p.waitForTimeout(1500);
  if(lv.screen!=='level') problem+='campaign did not start; ';
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
