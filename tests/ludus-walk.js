// The Ludus played through its real page (clicks, not calls): a new school, map, ladder, arena, pit, a bout with its result, then a tournament day,
// the rounds, the end of the tournament, the map, and a debt for board and lodging. Every step is a picture in tests/out/walk-*.png.
// Usage: NODE_PATH=$(npm root -g) node tests/ludus-walk.js
const { open, shot, finish }=require('./lib');
(async()=>{
  const { browser, page:p, errs }=await open();
  const take=async n=>{ await p.waitForTimeout(1200); console.log('  '+await shot(p,'walk-'+n)); };
  const playMatch=async()=>{ await p.waitForTimeout(800); await p.evaluate(()=>{ const st=state; let n=0; while(arenaStep(st)&&n<8000) n++; }); await p.waitForTimeout(1500); await take('match-end'); const c=await p.$('#ludusContinue'); if(c&&await c.isVisible()) await c.click(); await p.waitForTimeout(1000); };
  await p.evaluate(()=>{ window.storage.set=async()=>{}; window.storage.get=async()=>null; });
  await p.click('#menuLudus'); await take('01-start');
  await p.click('#luStart'); await take('02-map');
  for(const [t,n] of [['tour','03-ladder'],['arena','04-arena'],['pit','05-pit']]){ await p.click(`[data-tab="${t}"]`); await p.waitForTimeout(t==='tour'?0:6000); await take(n); }
  const b=await p.$('[data-fight="0"]'); if(b){ await b.click(); await playMatch(); await take('06-after-pit'); }
  // a tournament: a stronger school, the day before
  await p.evaluate(()=>{ const m=ludus.team[0]; m.level=8; m.xp=xpForLevel(8); m.hp=undefined; ludus.day=9; ludus.event=null; ludus.forced=null; ludusRender(); });
  await p.click('#luEndDay'); await take('07-tourney');
  for(let k=0;k<6;k++){
    const go=await p.$('#luForcedGo'), adv=await p.$('#luTourneyGo');
    if(go){ await go.click(); await playMatch(); } else if(adv){ await adv.click(); } else break;
    await take('08-round-'+k); const ev=await p.$('#luFollowGo'); if(ev) await ev.click();
  }
  const gift=await p.$('[data-gift]'); if(gift){ await take('09-gift'); await gift.click(); }
  await p.evaluate(()=>{ ludus.event=null; ludusTab='map'; ludusRender(); }); await take('10-map');
  await p.evaluate(()=>{ ludus.gold=0; ludus.event=null; ludus.forced=null; ludusRender(); }); const e=await p.$('#luEndDay'); if(e) await e.click();
  await p.evaluate(()=>{ ludus.event=null; ludusRender(); }); await take('11-debt');
  const misses=await p.evaluate(()=>[...I18N_MISSES]);
  finish('ludus walk',errs,misses.length?'missing translations: '+misses.slice(0,6).join(' | '):'');
  await browser.close();
})();
