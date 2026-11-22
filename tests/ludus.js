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
    // teams: every gladiator of the world in a team of his region; the table; hiring a lone one, two small teams merging; an old save's purse
    { const id=ludus.map.region, act=(ludus.world||[]).filter(n=>n.status==='active');
      if(act.some(n=>!ludusTeam(n.team)||ludusTeam(n.team).region!==n.region)) bad('a gladiator without a team of his region');
      if(act.some(n=>n.gold!==undefined)) bad('gold still on a gladiator');
      out.teams0=ludusTeamTable(id).map(x=>x.name+':'+x.size).join(' | '); if(!ludusTeamTable(id).some(x=>x.t==='own')) bad('the school is not in the table');
      ludus.event=null; ludus.forced=null; ludusTab='tour'; ludusRender(); if(!document.body.innerText.includes(Tr('Tabelle der Teams'))) bad('no team table on the board');
      const solos=ludusRegionNpcs(id).filter(n=>ludusTeamSize(n)===1&&!n.boss&&!n.rival&&!ludusIsChamp(id,'npc',n.id));
      const big=Object.values(ludus.teams).find(t=>t.region===id&&ludusTeamMembers(t.id).length>=2&&!ludusTeamMembers(t.id).some(n=>n.boss));
      if(solos.length&&big){ const k0=ludusTeamMembers(big.id).length; ludusTeamMembers(big.id).forEach(m=>{ m.rel={}; }); solos.forEach(n=>{ n.rel={}; n.maimed=false; }); big.gold=5000; ludusTeamsHire(); out.hire=big.name+' '+k0+'->'+ludusTeamMembers(big.id).length; if(ludusTeamMembers(big.id).length!==k0+1) bad('a rich team did not hire a lone gladiator'); }
      const two=ludusRegionNpcs(id).filter(n=>ludusTeamSize(n)===1&&!n.boss); if(two.length>=2){ const [a2,b2]=two; a2.rel=Object.assign({},a2.rel,{ [b2.id]:2 }); b2.rel=Object.assign({},b2.rel,{ [a2.id]:2 }); ludusTeamsMerge(); if(a2.team!==b2.team) bad('two lone friends did not merge'); }
      const old={ id:'nOld', name:'Alter Mann', kind:'ork', level:2, status:'active', region:id, gold:77, inventory:[], learned:[], gifts:[] }; ludus.world.push(old); ludusTeamsTidy(); if(!ludusTeamOf(old)||ludusGold(old)!==77||old.gold!==undefined) bad('an old purse was not taken over');
      old.status='dead'; ludusTeamsTidy(); if(Object.values(ludus.teams).some(t=>!ludusTeamMembers(t.id).length)) bad('an empty team is left');
      const anyone=ludusRegionNpcs(id).find(n=>!n.boss); ludusPicked=anyone.id; ludusRender(); if(!document.body.innerText.includes('Team:')&&!document.body.innerText.includes(Tr('Team: {0} (allein) · Kasse {1} Gold').slice(0,4))) bad('no team on the card'); ludusPicked=null; ludusRender(); }
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
      ludusTeamOf(b).gold=30; const bond0=b.bond||0; document.querySelector(`[data-verdict="${b.id}:spare"]`).click(); if(b.status!=='active') bad('spared one died'); if(ludus.gold<=g0) bad('no ransom'); if((b.bond||0)<=bond0) bad('no gratitude');
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
      const best={ id:'sword_epic', q:1, s:7 }; ludus.stash.push(best); ludusTeamOf(n).gold=999; ludusRender(); const sb=[...document.querySelectorAll('[data-tsell]')].find(b=>ludus.stash[+b.dataset.tsell]===best); if(!sb) bad('no sell offer for a better piece'); else { sb.click(); if(!n.inventory.includes(best)) bad('selling failed'); }
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
    // the rival: the killer of this run outlives it, grows a level and waits in the next run, in the region that fits him; revenge strikes him off
    { const id=ludus.map.region, k=ludusRegionNpcs(id).find(n=>!n.boss&&!ludusIsChamp(id,'npc',n.id)); k.level=1; k.xp=0; k.rival=undefined; ludusMeta.rivals=[];
      revive(); ludus.over=false; ludusRivalMark(k,[ludus.team[0]],'exec'); const e=(ludusMeta.rivals||[])[0]; if(!e||e.victims.length!==1||e.victims[0].how!=='exec') bad('no rival saved');
      ludus.over=true; ludusTab='start'; ludusRender(); if(!document.body.innerText.includes(Tr('Deine Rivalen'))) bad('no rivals at the end of the run');
      ludusNewRun('ork','Quarta'); const n=(ludus.world||[]).find(x=>x.rival===e.id);
      if(!n) bad('rival not in the new world'); else { out.rival=n.name+' L'+n.level+' r'+n.region+' col '+ludusMapWorld().nodes[n.region].col; if(n.level!==2||n.bond!==-3) bad('rival not grown or not hostile');
        ludusMapDraw(); ludus.event=null; ludus.forced=null; ludusPicked=n.id; ludus.map.region=n.region; ludusRender(); if(!document.querySelector('.luBane')) bad('no rival line on the card'); ludusPicked=null;
        // his traits: a strength and a weakness, real in the fight; the stage when he steps into the sand
        const ne=ludusRivalOf(n); if(!ne||(ne.traits||[]).filter(t=>t.role==='boon').length<1||(ne.traits||[]).filter(t=>t.role==='bane').length!==1||!(n.gifts||[]).some(g=>g.id==='rival')) bad('no traits: '+JSON.stringify(ne&&ne.traits));
        out.traits=ludusRivalTraitsText(n);
        { const c=ludusMemberCreature(n), w=ne.traits.find(t=>t.k.startsWith('taken_')&&t.role==='bane'); if(w&&resistOf(c,DMG_KINDS.indexOf(w.k.slice(6)))<=resistOf(arenaMake(n.kind,0,0),DMG_KINDS.indexOf(w.k.slice(6)))) bad('weakness has no effect'); }
        ludus.event=null; ludus.forced=null; ludus.verdict=null; ludusFight({ arena:true, mode:'duel', variant:'duel', foes:[ludusNpcFoe(n)], kind:n.kind, level:n.level, name:n.name, title:n.name, layout:'pit', reward:10, members:[ludus.team[0].id] });
        const stg=document.getElementById('rivalStage'); out.stage=stg&&stg.innerText.replace(/\n+/g,' | '); if(!stg) bad('no rival stage'); else document.getElementById('rivalStageGo').click();
        if(document.getElementById('rivalStage')) bad('stage did not close'); { const st=state; let k=0; while(arenaStep(st)&&k<8000) k++; ludusResolve(st); ludusLeaveMatch(); ludus.verdict=null; revive(); }
        if(n.status!=='active'){ n.status='active'; ludusMeta.rivals=(ludusMeta.rivals||[]).concat([ne]); n.avenged=false; }       // he fell in the stage bout: back for the rest of the test
        // the hunt: from elsewhere he comes one region nearer every 4 days
        const far=ludusMapWorld().nodes.filter(x=>ludusIsRegion(x)&&x.col===2)[0], home=ludus.map.region; n.region=far.id; ludus.map.region=home; ludus.day=8; ludus.tourney=null;
        const d0=ludusRivalStep(far.id,home); ludusRivalHunt(); out.hunt=far.col+'->'+ludusMapWorld().nodes[n.region].col; if(n.region===far.id||ludusMapWorld().nodes[n.region].col>=far.col) bad('the rival did not hunt: '+out.hunt);
        // his rank grows with his victims
        ludusRivalMark(n,[{ name:'A', kind:'ork' },{ name:'B', kind:'ork' }],'kill'); if(ludusRivalRank(ludusRivalOf(n))!=='Erzrivale') bad('no rank: '+ludusRivalRank(ludusRivalOf(n)));
        // revenge: his friends bear the school a grudge, but none of them takes his place
        const fr=ludusRegionNpcs(n.region).find(x=>x!==n&&!x.rival&&!x.boss); if(fr){ fr.rel=Object.assign({},fr.rel,{ [n.id]:2 }); fr.bond=0; }
        const f0=ludus.fame; const t=ludusVerdict(ludus.team[0],n,true,n.region); out.revenge=t; if(ludus.fame<f0+LUDUS_RIVAL.revenge||(ludusMeta.rivals||[]).some(x=>x.id===e.id)) bad('no revenge');
        if(fr&&(fr.rival||(fr.bond||0)>-2)) bad('a friend took his place, or bears no grudge'); out.friend=fr&&(fr.name+' bond '+fr.bond); } }
    // a save from before the rename: the old list and marks are taken over, a sworn successor is dropped
    { const keep=ludusMeta.rivals; ludusMeta.rivals=[]; ludusMeta.nemeses=[{ id:'neX', name:'Alt', kind:'ork', level:3, victims:[], runs:1, sworn:'Y' }]; ludusMeta.archEnemies=[{ id:'arX', name:'Alt2', kind:'ork', level:2, victims:[], runs:0 }];
      const g=ludusRegionNpcs(ludus.map.region)[0]; g.nemesis='neX'; g.gifts=[{ id:'nemesis', fx:[] }]; ludusRivalMigrate();
      if(ludusMeta.nemeses||ludusMeta.archEnemies||!ludusMeta.rivals.some(e=>e.id==='arX')||!ludusMeta.rivals.some(e=>e.id==='neX'&&!e.sworn)||g.rival!=='neX'||g.nemesis||g.gifts[0].id!=='rival') bad('old save not taken over');
      delete g.rival; g.gifts=[]; ludusMeta.rivals=keep; }
    // the legacy: kinds learnt by deed, the heirloom, trophies, the hall of the fallen
    { ludusMeta.unlockAll=false; ludusMeta.known=[]; const other=arenaKinds().find(k=>!LUDUS_STARTER_KINDS.includes(k));
      if(ludusKinds().some(k=>!LUDUS_STARTER_KINDS.includes(k))) bad('unknown kinds offered'); ludusLearnKind(other); if(!ludusKinds().includes(other)) bad('a learnt kind is not offered');
      if(!(ludusMeta.trophies||[]).length) bad('no trophy for the revenge'); if(!(ludusMeta.fallen||[]).length) bad('nobody in the hall of the fallen');
      ludus.stash.push({ id:'sword_epic', q:1, s:3 }); ludusLegacyEnd(ludus.team); ludus.over=true; ludusTab='start'; ludusRender();
      const hb=document.querySelector('[data-heir="0"]'); if(!hb) bad('no heirloom choice'); else hb.click();
      const heir=ludusMeta.heirloom; if(!heir) bad('no heirloom kept'); out.heirloom=heir&&instLabel(heir);
      if(!document.body.innerText.includes(Tr('Halle der Gefallenen'))) bad('no hall of the fallen on the start screen');
      ludusNewRun(other,'Quinta'); out.legacyStart={ gold:ludus.gold, note:ludusNote, kind:ludus.team[0].kind };
      if(ludus.gold!==LUDUS_START_GOLD+ludusTrophyGold()) bad('no trophy gold: '+ludus.gold);
      if(heir&&!(ludus.team[0].inventory||[]).some(i=>i.id===heir.id)) bad('the heirloom is not worn'); if(ludusMeta.heirloom) bad('the heirloom was not spent'); }
    ludus.over=true; ludusTab='start'; ludusRender();
    out.misses=[...I18N_MISSES];
    return out;
  });
  console.log(JSON.stringify(r,null,1));
  finish('ludus tour',errs,(r.problems.length?r.problems.join('; '):'')+(r.misses.length?' missing translations':''));
  await browser.close();
})();
