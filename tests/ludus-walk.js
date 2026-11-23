// The Ludus played through its real page (clicks, not calls): a new school, map, ladder, arena, pit, a bout with its result, then a tournament day,
// the rounds, the end of the tournament, the map, a debt for board and lodging, a gladiator's card, the sheet, temple and bath, an offer, a stranger asking to join
// and the end of a run. Every step is a picture in tests/out/walk-*.png.
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
    for(let v=0;v<8;v++){ const sp=await p.$('[data-verdict$=":spare"]'); if(!sp) break; if(v===0) await take('08-verdict-'+k); await sp.click(); await p.waitForTimeout(300); }       // a won bout: spare the loser
    const go=await p.$('#luForcedGo'), adv=await p.$('#luTourneyGo');
    if(go){ await go.click(); await playMatch(); } else if(adv){ await adv.click(); } else break;
    await take('08-round-'+k); const ev=await p.$('#luFollowGo'); if(ev) await ev.click();
  }
  const gift=await p.$('[data-gift]'); if(gift){ await take('09-gift'); await gift.click(); }
  await p.evaluate(()=>{ ludus.event=null; ludusTab='map'; ludusRender(); }); await take('10-map');
  await p.evaluate(()=>{ ludus.gold=0; ludus.event=null; ludus.forced=null; ludusRender(); }); const e=await p.$('#luEndDay'); if(e) await e.click();
  await p.evaluate(()=>{ ludus.event=null; ludusRender(); }); await take('11-debt');
  // the newer parts: a gladiator's card (its folds opened), the sheet with happiness, temple and bath, an offer for a gladiator, a stranger who asks to join, the end of a run
  await p.evaluate(()=>{ ludus.forced=null; ludus.event=null; ludus.verdict=null; ludus.followup=null; ludus.giftChoice=null; ludus.gold=300; const id=ludus.map.region, n=ludusRegionNpcs(id).find(x=>!x.boss&&!ludusIsChamp(id,'npc',x.id))||ludusRegionNpcs(id)[0]; ludusOnPick(n.id); });
  await take('12-card'); for(const sm of await p.$$('details.luMore summary')) await sm.click(); await take('12-card-open');
  await p.evaluate(()=>{ ludusPicked=null; ludus.rooms.temple=1; ludus.rooms.bath=1; ludusRender(); });
  for(const [t,n] of [['sheet','13-sheet'],['temple','14-temple'],['bath','15-bath']]){ await p.click(`[data-tab="${t}"]`); await take(n); }
  await p.evaluate(()=>{ while(ludus.team.length<2) ludus.team.push({ id:'mW'+ludus.team.length, name:'Secundus', kind:'goblin', level:9, xp:xpForLevel(9), inventory:[], learned:[], gifts:[], seed:7, honor:0, job:'rest' });
    const t=Object.values(ludus.teams).find(x=>x.region===ludus.map.region&&ludusTeamMembers(x.id).length&&!ludusTeamMembers(x.id).some(n=>n.boss)); if(t) t.gold=9999; ludus.lastOffer=-99;
    const ev=ludusEventDef('offer').make(); if(ev){ ludus.event=Object.assign({ id:'offer' },ev); ludusRender(); } });
  if(await p.$('[data-event]')){ await take('16-offer'); await p.click('[data-event="1"]'); await p.evaluate(()=>{ ludus.followup=null; ludusRender(); }); }
  await p.evaluate(()=>{ const id=ludus.map.region, d=ludusRegionNpcs(id).find(n=>ludusFeels(n)&&!n.boss&&!n.rival&&!ludusIsChamp(id,'npc',n.id)&&!ludusAlliedSchool(n)); if(!d) return; d.happiness=10; d.bond=0;
    const ev=ludusEventDef('defector').make(()=>0); if(ev){ ludus.event=Object.assign({ id:'defector' },ev,{ npc:d.id }); ludusRender(); } });
  if(await p.$('[data-event]')){ await take('17-defector'); await p.click('[data-event="0"]'); await p.evaluate(()=>{ ludus.followup=null; ludusRender(); }); }
  await p.evaluate(()=>{ ludusLegacyEnd(ludus.team); ludus.over=true; ludus.cause='Gefallen'; ludusTab='start'; ludusRender(); }); await take('18-end');
  const misses=await p.evaluate(()=>[...I18N_MISSES]);
  finish('ludus walk',errs,misses.length?'missing translations: '+misses.slice(0,6).join(' | '):'');
  await browser.close();
})();
