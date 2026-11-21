// The Ludus tour, played without the screen of the match (every bout is fought out by the engine at once):
// a new school, the ladder of the first region, pit and arena bouts, the weekly rent (paid and unpaid), a whole tournament, travelling on.
// Usage: NODE_PATH=$(npm root -g) node tests/ludus.js
const { open, finish }=require('./lib');
(async()=>{
  const { browser, page:p, errs }=await open();
  await p.evaluate(()=>{ window.storage.set=async()=>{}; showScreen('ludus'); });
  const r=await p.evaluate(async()=>{
    const out={ problems:[] }, bad=t=>out.problems.push(t), sleep=ms=>new Promise(r=>setTimeout(r,ms));
    // fights a bout at once (as the match screen would), returns the headline
    const showAll=()=>{ LUDUS_TABS.forEach(([t])=>{ ludusTab=t; ludusRender(); if(t==='map') ludusMapDraw(); }); };
    const fight=o=>{ ludusFight(o); const st=state; let n=0; while(arenaStep(st)&&n<8000) n++; const head=ludusResolve(st); ludusLeaveMatch(); return head; };
    ludusMeta.unlockAll=true; ludusMeta.ghosts=[]; ludusNewRun('ork','Testa');
    showAll();
    const board=ludusBoard(ludus.map.region);
    out.board=board.map(x=>x.rank+'.'+x.name+(x.champ?'*':'')+' L'+x.level+' '+x.honor).join(' | ');
    if(board.length!==LUDUS_TOUR.roster+2) bad('board size '+board.length);
    if(!board[0].champ) bad('no champion on place 1');
    // the pit: scouting for the line-up, a bout, no gold, loot
    ludusTab='pit'; ludusRender(); for(let i=0;i<300&&!(ludus.options&&ludus.options.length);i++) await sleep(50);
    if(!ludus.options||!ludus.options.length) bad('no pit options');
    else { const g0=ludus.gold, d0=ludus.day, s0=ludus.stash.length; out.pit=fight(ludus.options[0]); out.pitText=ludusResultText;
      if(ludus.gold!==g0) bad('pit paid gold'); if(ludus.day!==d0+1) bad('pit did not take a day'); out.pitLoot=ludus.stash.length-s0; }
    // the arena
    const offers=ludusArenaOffers(); out.offers=offers.map(o=>o.mode+':'+o.title);
    if(!offers.length) bad('no arena offers');
    ludusTab='arena'; ludusRender(); for(let i=0;i<300&&!(ludus.arenaEst);i++) await sleep(50);
    out.est=ludus.arenaEst&&ludus.arenaEst.est;
    const g1=ludus.gold; out.arena=fight(Object.assign({},offers[0],{ members:[ludus.team[0].id], reward:30 })); out.arenaText=ludusResultText;
    if(out.arena==='Sieg'&&ludus.gold<=g1) bad('arena win without gold');
    // a second gladiator, so that line-ups matter
    ludus.gold+=500; const guest=ludusTavernGuests()[0]; if(guest){ ludusRecruit(guest.id); } out.team=ludus.team.map(m=>m.name+' L'+m.level).join(', ');
    // the rent: paid
    ludus.day=6; ludus.forced=null; ludus.event=null; const g2=ludus.gold; ludusAdvanceDay([]); out.rentPaid=g2-ludus.gold; if(ludus.forced) bad('rent forced although paid: '+ludus.forced.type);
    // the rent: not paid -> a bout for nothing
    ludus.day=13; ludus.gold=0; ludus.forced=null; ludus.event=null; ludusAdvanceDay([]);
    if(!ludus.forced||ludus.forced.type!=='rent') bad('unpaid rent did not force a bout');
    else { showAll(); const o=ludusForcedBout(); out.rent=fight(Object.assign({},o,{ members:[ludus.team[0].id] })); if(ludus.gold!==0) bad('rent bout paid gold: '+ludus.gold); }
    // the tournament: make the school strong enough, jump to day 29
    ludus.team.forEach(m=>{ m.level=12; m.xp=xpForLevel(12); m.hp=undefined; }); ludus.gold=300;
    ludus.day=29; ludus.forced=null; ludus.event=null; ludusAdvanceDay([]);
    if(!ludus.tourney) bad('no tournament on day 30');
    else {
      out.bracket=ludus.tourney.slots.map(ludusEntryName).join(', '); showAll();
      let guard=0;
      while(ludus.tourney&&guard++<20){
        const o=ludusTourneyBout();
        if(o) fight(o); else ludusTourneyAdvance();
        if(ludus.tourney){ ludusTab='tour'; ludusRender(); }
        ludus.event=null; ludus.giftChoice=null; ludus.followup=null;
      }
      out.champ=ludusEntryName(ludusChamp(ludus.map.region)); out.cleared=ludus.map.cleared.length; out.dayAfter=ludus.day;
      if(ludus.tourney) bad('tournament did not end');
    }
    // travel on, if the region is won
    if(ludus.map.cleared.includes(ludus.map.region)){
      ludus.forced=null; ludus.event=null; ludus.giftChoice=null;
      const next=ludusMapNeighbours(ludus.map.at).find(ludusCanTravel);
      if(next===undefined) bad('no way on'); else { ludusMapTravel(next); out.travel=ludusHere().name+' col '+ludusHere().col; out.board2=ludusBoard(ludus.map.region).length; }
    }
    showAll(); ludus.over=true; ludusTab='start'; ludusRender();
    out.misses=[...I18N_MISSES];
    return out;
  });
  console.log(JSON.stringify(r,null,1));
  finish('ludus tour',errs,(r.problems.length?r.problems.join('; '):'')+(r.misses.length?' missing translations':''));
  await browser.close();
})();
