// The Ludus tour, played without the screen of the match (every bout is fought out by the engine at once):
// a new school, the ladder of the first region, pit and arena bouts, the day's tasks (rest, train, work), board and lodging (paid and unpaid), a whole tournament, travelling on.
// Usage: NODE_PATH=$(npm root -g) node tests/ludus.js
const { open, finish }=require('./lib');
(async()=>{
  const { browser, page:p, errs }=await open();
  await p.evaluate(()=>{ window.storage.set=async()=>{}; showScreen('ludus'); });
  const r=await p.evaluate(async()=>{
    const out={ problems:[] }, bad=t=>out.problems.push(t), sleep=ms=>new Promise(r=>setTimeout(r,ms));
    // fights a bout at once (as the match screen would), returns the headline
    const showAll=()=>{ LUDUS_TABS.forEach(([t])=>{ ludusTab=t; ludusRender(); if(t==='map') ludusMapDraw(); }); };
    const fight=o=>{ ludusFight(o); const st=state; let n=0; while(arenaStep(st)&&n<8000) n++; const head=ludusResolve(st); ludusLeaveMatch(); if(ludus.verdict){ const w=ludusMember(ludus.verdict.w)||ludus.fighter; ludus.verdict.list.forEach(id=>{ const n=ludusNpc(id); if(n) ludusVerdict(w,n,false,ludus.map.region); }); ludus.verdict=null; } return head; };       // a verdict after a won arena bout: spare
    ludusMeta.unlockAll=true; ludusMeta.ghosts=[]; ludusNewRun('ork','Testa');
    showAll();
    // the card of a gladiator clicked in the dungeon
    { const n=ludusRegionNpcs(ludus.map.region).find(x=>!x.boss); ludusOnPick(n.id); if(!document.getElementById('luPickClose')) bad('no card for a clicked gladiator'); ludusPicked=null; ludusRender(); }
    const board=ludusBoard(ludus.map.region);
    out.board=board.map(x=>x.rank+'.'+x.name+(x.champ?'*':'')+' L'+x.level+' '+x.honor).join(' | ');
    if(board.length!==LUDUS_TOUR.roster+2) bad('board size '+board.length);
    if(!board[0].champ) bad('no champion on place 1');
    // the pit: scouting for the line-up, a bout, no gold, loot
    // somebody has to come to the pit: a day without anyone there passes
    for(let d=0;d<8;d++){ ludus.options=null; ludusBusy=false; ludusTab='pit'; ludusRender(); for(let i=0;i<300&&!ludus.options;i++) await sleep(50); if(ludus.options&&ludus.options.length) break; ludus.forced=null; ludus.event=null; ludusEndDay(); ludus.forced=null; ludus.event=null; }
    if(!ludus.options||!ludus.options.length) bad('no pit options');
    else { const g0=ludus.gold, d0=ludus.day, s0=ludus.stash.length, up=ludusRent(); out.pit=fight(ludus.options[0]); out.pitText=ludusResultText;
      if(ludus.gold!==g0-up) bad('pit paid gold: '+(ludus.gold-g0)); if(ludus.day!==d0+1) bad('pit did not take a day'); out.pitLoot=ludus.stash.length-s0; }
    // the arena
    for(let d=0;d<8&&!ludusArenaOffers().length;d++){ ludus.forced=null; ludus.event=null; ludusEndDay(); ludus.forced=null; ludus.event=null; }
    const offers=ludusArenaOffers(); out.offers=offers.map(o=>o.mode+':'+o.title);
    if(!offers.length) bad('no arena offers');
    ludusTab='arena'; ludusRender(); for(let i=0;i<300&&!(ludus.arenaEst);i++) await sleep(50);
    out.est=ludus.arenaEst&&ludus.arenaEst.est;
    const g1=ludus.gold; if(offers.length) out.arena=fight(Object.assign({},offers[0],{ members:[ludus.team[0].id], reward:30 })); out.arenaText=ludusResultText;
    if(out.arena==='Sieg'&&ludus.gold<=g1) bad('arena win without gold');
    // the verdict: the player's word over a living loser, and the world's rule over the player's own
    { const ns=ludusRegionNpcs(ludus.map.region).filter(x=>!x.boss&&!ludusIsChamp(ludus.map.region,'npc',x.id)), a=ns[0], b=ns[1], w=ludus.team[0];
      a.fame=6; const f0=ludusFame(w), g0=ludus.gold; ludus.verdict={ w:w.id, list:[a.id,b.id] }; ludusRender();
      if(!document.querySelector('[data-verdict]')) bad('no verdict panel');
      document.querySelector(`[data-verdict="${a.id}:exec"]`).click(); if(a.status!=='dead') bad('execution did not kill'); if(ludusFame(w)!==f0+2+3) bad('execution fame '+(ludusFame(w)-f0));
      b.gold=30; const bond0=b.bond||0; document.querySelector(`[data-verdict="${b.id}:spare"]`).click(); if(b.status!=='active') bad('spared one died'); if(ludus.gold<=g0) bad('no ransom'); if((b.bond||0)<=bond0) bad('no gratitude');
      if(ludus.verdict) bad('verdict not finished'); out.verdict=ludusNote;
      // the world's rule: bold and a famous executioner as loser -> the axe; a friend -> mercy
      const c=ns[2], d=ns[3]; c.bold=1; d.fame=10; d.execs=3; if(!ludusAiExecutes(c,d)) bad('a bold winner spared a famous executioner');
      c.bold=0.2; d.fame=0; d.execs=0; c.rel={}; c.rel[d.id]=3; if(ludusAiExecutes(c,d)) bad('a friend was executed');
      // over an own gladiator: a spare one joins for it, then is executed by a merciless winner
      const extra={ id:'mX', name:'Opfer', kind:'goblin', level:1, xp:0, inventory:[], learned:[], gifts:[], seed:1, honor:0 }; ludus.team.push(extra); c.bold=1;
      ludusVerdict(c,extra,true,ludus.map.region); if(ludus.team.includes(extra)) bad('executed own gladiator still in the team'); }
    // free for all: one of the own among three gladiators, every one a side of his own
    { const npcs=ludusRegionNpcs(ludus.map.region).filter(n=>!n.boss&&!ludusIsChamp(ludus.map.region,'npc',n.id)).slice(0,3), foes=npcs.map(ludusNpcFoe);
      const o={ arena:true, ffa:true, mode:'ffa', variant:'ffa', foes, kind:foes[0].kind, level:foes[0].level, name:foes[0].name, title:'FFA', layout:'pit', members:[ludus.team[0].id], reward:20 };
      const setup=ludusMatchSetup(o,'t'); if(setup.teams.length!==4) bad('ffa sides '+setup.teams.length);
      const st=arenaBuild(setup,''); if(st.arena.anchors.length!==4||new Set(st.creatures.map(c=>c.faction)).size!==4) bad('ffa build');
      const keep=ludus.team.map(m=>JSON.stringify(m)); out.ffa=fight(o); out.ffaText=ludusResultText; }
    // a second gladiator, so that line-ups matter
    ludus.gold+=500; const guest=ludusTavernGuests()[0]; if(guest){ ludusRecruit(guest.id); } out.team=ludus.team.map(m=>m.name+' L'+m.level).join(', ');
    // the day's tasks: one works, one trains (with a training room), the day ends without a bout
    ludus.rooms.training=1; ludus.gold=200; ludus.forced=null; ludus.event=null;
    ludus.team[0].job='work'; if(ludus.team[1]) ludus.team[1].job='train';
    { const g=ludus.gold, xp=ludus.team[1]?ludus.team[1].xp||0:0, d=ludus.day; ludusEndDay(); out.dayNote=ludusDayNote;
      if(ludus.day!==d+1) bad('end of day did not pass a day');
      const exp=ludusWage(ludusRegionNode().col)-ludusRent()-(ludus.team[1]?ludusTrainCost(ludus.team[1]):0);
      if(ludus.team[1]&&(ludus.team[1].xp||0)<=xp) bad('training gave no experience'); out.dayGold=ludus.gold-g; }
    ludus.team.forEach(m=>{ m.job='fight'; });
    // board and lodging not paid -> the next morning a bout for nothing
    ludus.gold=0; ludus.forced=null; ludus.event=null; ludusEndDay(); ludus.event=null;
    if(!ludus.forced||ludus.forced.type!=='rent') bad('unpaid board did not force a bout');
    else { showAll(); const o=ludusForcedBout(); out.rent=fight(Object.assign({},o,{ members:[ludus.team[0].id] })); if(ludus.gold>0) bad('debt bout paid gold: '+ludus.gold); }
    // the tournament: make the school strong enough, jump to day 29
    ludus.team.forEach(m=>{ m.level=12; m.xp=xpForLevel(12); m.hp=undefined; }); ludus.gold=300;
    ludus.day=29; ludus.forced=null; ludus.event=null; ludus.debt=false; ludusAdvanceDay([]);
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
