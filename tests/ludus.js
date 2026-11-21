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
    // losing is part of the game: a bout may kill the whole school; the test goes on with a fresh gladiator
    const revive=()=>{ if(ludus.team.length) return; ludus.over=false; ludus.cause=''; ludus.team.push({ id:'mR'+ludus.day, name:'Tertius', kind:'ork', level:2, xp:xpForLevel(2), inventory:[], learned:[], gifts:[], seed:3, honor:0 }); ludus.sel=0; out.revived=(out.revived||0)+1; };
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
    // trade: buy a piece from a gladiator, sell him a better one, give a gift
    { const n=ludusRegionNpcs(ludus.map.region).find(x=>!x.boss&&x.status==='active'&&(x.inventory||[]).length); if(n){
      ludus.forced=null; ludus.event=null; ludus.verdict=null; ludus.giftChoice=null; ludus.followup=null;
      ludus.gold=500; const k0=n.inventory.length, s0=ludus.stash.length; ludusPicked=n.id; ludusRender(); document.querySelector('[data-tbuy="0"]').click();
      if(n.inventory.length!==k0-1||ludus.stash.length!==s0+1) bad('buying failed');
      const best={ id:'sword_epic', q:1, s:7 }; ludus.stash.push(best); n.gold=999; ludusRender(); const sb=[...document.querySelectorAll('[data-tsell]')].find(b=>ludus.stash[+b.dataset.tsell]===best); if(!sb) bad('no sell offer for a better piece'); else { sb.click(); if(!n.inventory.includes(best)) bad('selling failed'); }
      const b0=n.bond||0; document.getElementById('luGift').click(); if((n.bond||0)!==Math.min(3,b0+1)) bad('gift failed'); ludusPicked=null; ludusRender(); } }
    // challenges: the player challenges a bold gladiator from his card, the duel is an arena offer the next day with the own gladiator named in it
    { const id=ludus.map.region, ns=ludusRegionNpcs(id).filter(x=>!x.boss&&!ludusIsChamp(id,'npc',x.id)&&x.status==='active'), n=ns[0];
      ludus.forced=null; ludus.event=null; ludus.verdict=null; ludus.challenges=[]; ludus.day=Math.min(ludus.day,3); ludus.lastAiChallenge=ludus.day;       // far from the tournament: nobody challenges just before one
      n.bold=1; n.bond=3; n.hp=undefined; n.maimed=false; ludusPicked=n.id;       // bold enough to accept, too fond of the school to execute (the test goes on with the team)
       ludusRender(); const btn=document.getElementById('luChallenge');
      if(!btn) bad('no challenge button'); else { btn.click(); const c=(ludus.challenges||[]).find(x=>x.npc===n.id); if(!c||c.day!==ludus.day+1) bad('challenge not booked');
        ludusPicked=null; ludusEndDay(); ludus.forced=null; ludus.event=null;
        const offers=ludusArenaOffers(), k=offers.findIndex(o=>o.challenge===c.id); if(k<0) bad('no challenge offer: '+offers.map(o=>o.title).join(', '));
        else { const h0=ludusMember(c.own).honor||0; ludusTab='arena'; ludusRender(); out.challenge=fight(offers[k]); out.challengeText=ludusResultText; revive(); if(!c.done) bad('challenge not marked as fought');
          if(out.challenge==='Sieg'&&ludusMember(c.own)&&(ludusMember(c.own).honor||0)<h0+LUDUS_CHALLENGE.bonus) bad('no honour bonus for the duel'); } }
      // who does not come is a coward
      const m=ludus.team[0], v=ludusRegionNpcs(id).find(x=>!x.boss&&!ludusIsChamp(id,'npc',x.id)&&x.status==='active'), h=m.honor=40; ludus.challenges=[{ id:'cx', own:m.id, npc:v.id, day:ludus.day, by:'npc' }]; ludus.forced=null; ludus.event=null; ludusEndDay();
      if((m.honor||0)!==h-LUDUS_CHALLENGE.coward) bad('the coward kept his honour: '+m.honor);
      // the world challenges: a bold gladiator who hates the school
      const g=ludusRegionNpcs(id).find(x=>!x.boss&&!ludusIsChamp(id,'npc',x.id)&&x.status==='active'&&!x.maimed); g.bold=1; g.bond=-3; g.hp=undefined; ludus.lastAiChallenge=-99; ludus.challenges=[]; ludusLifePlan();
      if(!(ludus.challenges||[]).some(c=>c.by==='npc'&&c.day===ludus.day)) bad(`no challenge from the world (day ${ludus.day}, tourney in ${ludusTourneyIn()}, ${g.status})`);
      ludus.challenges=[]; ludus.arenaOffers=null;
      // enemies settle it among themselves first
      const [a,b2,x,y]=ns; ns.forEach(q=>{ q.rel={}; }); a.rel[y.id]=-3; const pr=ludusFeudPairs([a,b2,x,y]); if(!(pr[0][0]===a&&pr[0][1]===y&&pr[0][2])) bad('feud not paired first'); }
    // free for all: one of the own among three gladiators, every one a side of his own
    { const npcs=ludusRegionNpcs(ludus.map.region).filter(n=>!n.boss&&!ludusIsChamp(ludus.map.region,'npc',n.id)&&n.status==='active').slice(0,3); npcs.forEach(n=>{ n.bond=3; n.rel={}; }); const foes=npcs.map(ludusNpcFoe);
      const o={ arena:true, ffa:true, mode:'ffa', variant:'ffa', foes, kind:foes[0].kind, level:foes[0].level, name:foes[0].name, title:'FFA', layout:'pit', members:[ludus.team[0].id], reward:20 };
      const setup=ludusMatchSetup(o,'t'); if(setup.teams.length!==4) bad(`ffa sides ${setup.teams.length} (${npcs.length} gladiators, day ${ludus.day})`);
      const st=arenaBuild(setup,''); if(st.arena.anchors.length!==4||new Set(st.creatures.map(c=>c.faction)).size!==4) bad('ffa build');
      // alliances: the school asks one of the field (well disposed, as all three are here: for nothing), two others who like each other stand together on their own
      ludus.arenaOffers={ day:ludus.day, region:ludus.map.region, list:[o] }; delete o.members; npcs[1].rel={ [npcs[2].id]:2 }; npcs[2].rel={ [npcs[1].id]:2 };
      ludus.forced=null; ludus.event=null; ludus.verdict=null; ludus.followup=null; ludus.giftChoice=null; ludusPicked=null; ludusTab='arena'; ludusRender(); const pb=document.querySelector('[data-pact="0:1"]'); if(!pb) bad('no alliance button'); else pb.click();
      if(o.pact!==1) bad('alliance not made'); const pacts=ludusPacts(o); out.pacts=JSON.stringify(pacts); if(JSON.stringify(pacts)!=='[[0,1],[2,3]]') bad('pacts '+out.pacts);
      { const st2=arenaBuild(ludusMatchSetup(o,'p'),''); withState(st2,()=>{ const side=t=>st2.creatures.find(c=>arenaTeamOf(c)===t);
        if(areHostile(side(0),side(1))) bad('allies hostile'); if(!areHostile(side(0),side(2))) bad('foes not hostile');
        arenaBetray(side(0),side(1)); if(!areHostile(side(0),side(1))||!(st2.arena.betrayals||[]).length) bad('betrayal did not break the pact');
        st2.creatures.filter(c=>arenaTeamOf(c)>1).forEach(c=>{ c.unconscious=true; }); st2.arena.pacts=[[0,1]]; if(!areHostile(side(0),side(1))) bad('allies alone did not fight it out'); }); }
      o.members=[ludus.team[0].id]; ludus.arenaOffers=null;
      const keep=ludus.team.map(m=>JSON.stringify(m)); out.ffa=fight(o); out.ffaText=ludusResultText; revive(); }
    // a second gladiator, so that line-ups matter
    ludus.gold+=500; const guest=ludusTavernGuests()[0]; if(guest){ ludusRecruit(guest.id); } if(ludus.team.length<2) ludus.team.push({ id:'mY', name:'Secundus', kind:'goblin', level:2, xp:xpForLevel(2), inventory:[], learned:[], gifts:[], seed:2, honor:0 });       // nobody in the tavern: a second one all the same out.team=ludus.team.map(m=>m.name+' L'+m.level).join(', ');
    // three teams of two: two of the own against two teams of the region; friends team up first, a whole team can be an ally
    if(ludus.team.length>=2){ const id=ludus.map.region, ns=ludusRegionNpcs(id).filter(n=>!n.boss&&!ludusIsChamp(id,'npc',n.id)&&n.status==='active'&&!n.maimed).slice(0,4);
      if(ns.length===4){ ns.forEach(n=>{ n.bond=3; n.rel={}; n.hp=undefined; }); ns[0].rel[ns[3].id]=2;
        const t=ludusTeamUp(ns); if(!t[0].includes(ns[0])||!t[0].includes(ns[3])) bad('friends did not team up');
        const foes=[].concat(...t).map(ludusNpcFoe), o={ arena:true, ffa:true, mode:'teams', variant:'ffa', foes, groups:[[0,1],[2,3]], kind:foes[0].kind, level:foes[0].level, name:foes[0].name, title:'T', layout:'pit', baseReward:40, members:ludus.team.slice(0,2).map(m=>m.id) };
        const setup=ludusMatchSetup(o,'t3'); if(setup.teams.length!==3||setup.teams.some(x=>x.groups.length!==2)) bad('teams setup '+setup.teams.map(x=>x.groups.length));
        o.pact=2; if(JSON.stringify(ludusPacts(o))!=='[[0,2]]') bad('team pact '+JSON.stringify(ludusPacts(o)));
        ludus.forced=null; ludus.event=null; out.teams=fight(o); out.teamsText=ludusResultText; revive(); } }
    // the world's own free for all: four gladiators, two of them friends who stand together
    { const id=ludus.map.region, ns=ludusRegionNpcs(id).filter(n=>!n.boss&&!ludusIsChamp(id,'npc',n.id)&&n.status==='active').slice(0,4);
      if(ns.length===4){ ns.forEach(n=>{ n.rel={}; n.hp=undefined; }); ns[1].rel[ns[2].id]=2; ns[2].rel[ns[1].id]=2; const w0=ns.map(n=>(n.wins||0)+(n.losses||0));
        ludusLifeFfa(ns,id); out.lifeFfa=(ludus.chronicle||[]).slice(0,12).map(e=>e.t).filter(t=>/Jeder gegen jeden/.test(t)); if(!out.lifeFfa.some(t=>/^Jeder gegen jeden/.test(t))||!out.lifeFfa.some(t=>/verbünden sich/.test(t))) bad('no free for all of the world in the chronicle');
        if(ns.some((n,k)=>(n.wins||0)+(n.losses||0)!==w0[k]+1)) bad('free for all not counted'); } }
    // the day's tasks: one works, one trains (with a training room), the day ends without a bout
    ludus.rooms.training=1; ludus.gold=200; ludus.forced=null; ludus.event=null;
    ludus.team[0].job='work'; if(ludus.team[1]) ludus.team[1].job='train';
    { const g=ludus.gold, xp=ludus.team[1]?ludus.team[1].xp||0:0, d=ludus.day; ludusEndDay(); out.dayNote=ludusDayNote;
      if(ludus.day!==d+1) bad('end of day did not pass a day');
      const exp=ludusWage(ludusRegionNode().col)-ludusRent()-(ludus.team[1]?ludusTrainCost(ludus.team[1]):0);
      if(ludus.team[1]&&(ludus.team[1].xp||0)<=xp) bad('training gave no experience'); out.dayGold=ludus.gold-g; }
    ludus.team.forEach(m=>{ m.job='fight'; });
    // board and lodging not paid -> the next morning a bout for nothing
    ludus.day=Math.min(ludus.day,5); ludus.gold=0; ludus.forced=null; ludus.event=null; ludus.giftChoice=null; ludus.followup=null; ludus.verdict=null; ludusEndDay(); ludus.event=null;
    if(!ludus.forced||ludus.forced.type!=='rent') bad('unpaid board did not force a bout: '+JSON.stringify({ forced:ludus.forced, day:ludus.day, gold:ludus.gold, debt:ludus.debt, note:ludusDayNote, over:ludus.over, tIn:ludusTourneyIn() }));
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
    showAll();
    // the nemesis: the killer of this run outlives it, grows a level and waits in the next run, in the region that fits him; revenge strikes him off
    { const id=ludus.map.region, k=ludusRegionNpcs(id).find(n=>!n.boss&&!ludusIsChamp(id,'npc',n.id)); k.level=1; k.xp=0; ludusMeta.nemeses=[];
      ludusNemesisSync(k,'exec',[ludus.team[0]]); const e=(ludusMeta.nemeses||[])[0]; if(!e||e.victims.length!==1||e.victims[0].how!=='exec') bad('no nemesis saved');
      ludus.over=true; ludusTab='start'; ludusRender(); if(!document.body.innerText.includes(Tr('Deine Erzfeinde'))) bad('no nemeses at the end of the run');
      ludusNewRun('ork','Quarta'); const n=(ludus.world||[]).find(x=>x.nemesis===e.id);
      if(!n) bad('nemesis not in the new world'); else { out.nemesis=n.name+' L'+n.level+' r'+n.region+' col '+ludusMapWorld().nodes[n.region].col; if(n.level!==2||n.bond!==-3) bad('nemesis not grown or not hostile');
        ludusMapDraw(); ludus.event=null; ludus.forced=null; ludusPicked=n.id; ludus.map.region=n.region; ludusRender(); if(!document.querySelector('.luBane')) bad('no nemesis line on the card'); ludusPicked=null;
        const f0=ludus.fame; const t=ludusVerdict(ludus.team[0],n,true,n.region); out.revenge=t; if(ludus.fame<f0+LUDUS_NEMESIS.revenge||(ludusMeta.nemeses||[]).length) bad('no revenge'); } }
    ludus.over=true; ludusTab='start'; ludusRender();
    out.misses=[...I18N_MISSES];
    return out;
  });
  console.log(JSON.stringify(r,null,1));
  finish('ludus tour',errs,(r.problems.length?r.problems.join('; '):'')+(r.misses.length?' missing translations':''));
  await browser.close();
})();
