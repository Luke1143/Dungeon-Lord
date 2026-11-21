// Ludus tour: a bot plays whole runs and reports how far a school gets (docs/ludus.md). Every bout is fought out by the engine at once (no match screen).
// Policy: sleep when someone is badly hurt; fight in the arena when the chances for the line-up are good, else in the pit (fair); buy better gear, recruit when there is room;
// pay the rent (or fight for it), fight every own bout of a tournament, move on to the right as soon as a region is won.
// Usage: NODE_PATH=$(npm root -g) node tools/ludus-tour-bot.js [kinds=ork] [maxDay=150] [repeats=1] [arenaMin=0.6]
const { chromium }=require('playwright'); const path=require('path');
const GAME=process.env.GAME||path.resolve(__dirname,'..');
const KINDS=(process.argv[2]||'ork').split(','), MAXDAY=+process.argv[3]||150, REPEAT=+process.argv[4]||1, ARENA_MIN=+(process.argv[5]||0.6);
(async()=>{
  const b=await chromium.launch();
  for(const kind of KINDS) for(let rep=0;rep<REPEAT;rep++){
    const p=await (await b.newContext()).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file://'+GAME+'/index.html'); await p.waitForTimeout(400);
    await p.evaluate(()=>{ window.storage.set=async()=>{}; showScreen('ludus'); });
    const res=await p.evaluate(async([kind,MAXDAY,ARENA_MIN])=>{
      const sleep=ms=>new Promise(r=>setTimeout(r,ms)), log=[], tourneys=[]; let tStart=null; const _x=[], stats={ pit:[0,0], arena:[0,0], rent:[0,0], tourney:[0,0], rentPaid:0, regions:[] };
      const fight=(o,tag)=>{ const w0=ludus.wins; ludusFight(o); const st=state; let n=0; while(arenaStep(st)&&n<8000) n++; ludusResolve(st); ludusLeaveMatch(); const won=ludus.wins>w0; stats[tag][won?0:1]++; return won; };
      const has=(m,type)=>(m.inventory||[]).filter(i=>instDef(i)&&instDef(i).type===type);
      const shop=()=>{ if(!ludusRoomTier('forge')) return; const stock=ludusStock();
        ludus.team.forEach(m=>['weapon','armor','shield'].forEach(type=>{ const cur=has(m,type), curT=cur.length?Math.max(...cur.map(ludusTierIndex)):-1;
          const opts=stock.filter(it=>{ const d=ITEMS[it.id]; return d.type===type&&(type!=='weapon'||d.hands!==2||!has(m,'shield').length)&&(type!=='shield'||!has(m,'weapon').some(w=>instDef(w).hands===2))&&ludusTierIndex(it)>curT&&ludus.gold-ludusPrice(it.id)>=ludusRent()+10; });
          if(!opts.length) return; const it=opts.sort((a,c)=>ludusPrice(a.id)-ludusPrice(c.id))[0]; ludus.gold-=ludusPrice(it.id); const inst={ id:it.id, q:it.q, s:it.s }; ludus.stash.push(inst); ludusGiveItem(inst,m); stock.splice(stock.indexOf(it),1); })); };
      // the stash: what fits better than what is worn goes on
      const wear=()=>ludus.stash.slice().forEach(inst=>{ const d=instDef(inst); if(!d||!['weapon','armor','shield'].includes(d.type)) return; const m=ludus.team.find(x=>{ const cur=has(x,d.type); return !cur.length||Math.max(...cur.map(ludusTierIndex))<ludusTierIndex(inst); }); if(m) ludusGiveItem(inst,m); });
      const build=()=>{ for(const id of ['inn','forge','hall','pit','training','library']){ const t=ludus.rooms[id]||0, c=LUDUS_ROOMS[id].cost[t]; if(c!==undefined&&ludus.renown>=c){ ludusBuyRoom(id); return; } } };
      const t0=performance.now(); ludusMeta.unlockAll=true; ludusMeta.roomsAll=false; ludusMeta.ghosts=[]; ludusNewRun(kind,'Bot');
      let guard=0;
      while(!ludus.over&&ludus.day<MAXDAY&&guard++<2000){
        if(ludus.giftChoice){ const g=ludus.giftChoice.slice().sort((a,c)=>c.power-a.power)[0]; ludus.team[0].gifts.push(g); ludus.giftChoice=null; }
        ludus.followup=null;
        if(ludus.event){ const d=ludusEventDef(ludus.event.id), opts=ludusEventOptions(d); let pick=opts.findIndex(o=>!o.when||o.when(ludus.event)); ludusEventChoose(Math.max(0,pick)); ludus.followup=null; continue; }
        ludus.pick=ludus.team.map(m=>m.id);
        build(); shop(); wear();
        for(const g of ludusTavernGuests().slice().sort((x,y)=>y.level-x.level)){ if(ludusSlotsFree()>0&&ludus.gold>=ludusRecruitPrice(g)+ludusRent()+20&&(g.bond||0)>-2){ ludusRecruit(g.id); break; } }
        if(ludus.forced){
          const t=ludus.forced.type;
          if(t==='tourney'){
            if(!tStart){ const reg=ludus.map.region, ch=ludusChamp(reg), cg=ch&&(ch.t==='own'?ludusMember(ch.id):ludusNpc(ch.id)), np=ludusRegionNpcs(reg);
              tStart={ day:ludus.day, col:ludusHere().col, L:ludusRegionLevel(ludusHere().col), champ:cg?cg.kind+cg.level:'-', field:np.length?Math.round(10*np.reduce((a,n)=>a+n.level,0)/np.length)/10:0, top:np.length?Math.max(...np.map(n=>n.level)):0, own:ludus.team.map(m=>m.kind+m.level).join('+') }; }
            const o=ludusTourneyBout(); if(o) fight(o,'tourney'); else ludusTourneyAdvance();
            if(!ludus.tourney){ const ch=ludusChamp(ludus.map.region); tStart.won=!!ch&&ch.t==='own'; tStart.winner=ludusEntryName(ch); tourneys.push(tStart); tStart=null; }
            continue; }
          const o=ludusForcedBout(); fight(Object.assign({},o,{ members:[ludus.team.slice().sort((a,c)=>c.level-a.level)[0].id] }),t==='rent'?'rent':'arena'); continue;
        }
        if(ludus.map.cleared.includes(ludus.map.region)||!ludusIsRegion(ludusHere())){ const nx=ludusMapNeighbours(ludus.map.at).filter(ludusCanTravel); if(nx.length){ const w=ludusMapWorld(); const to=nx.sort((a,c)=>w.nodes[a].col-w.nodes[c].col)[0]; ludusMapTravel(to); if(ludusIsRegion(ludusHere())) stats.regions.push([ludus.day,ludusHere().col]); continue; } }
        const hurt=Math.min(...ludus.team.map(m=>ludusHealPct(ludusMemberCreature(m),m)));
        const tIn=ludusTourneyIn();
        if(hurt<50||(tIn<=1&&hurt<90)){ ludusHealAll(ludusSleepHeal()); ludus.team.forEach(m=>{ m.energy=100; }); ludusAdvanceDay([],true); continue; }
        // the arena when the chances are good
        ludus.arenaEst=null; ludusArenaScout(); for(let i=0;i<400&&!ludus.arenaEst;i++) await sleep(20);
        const offers=ludusArenaOffers(), est=ludus.arenaEst?ludus.arenaEst.est:{};
        let best=-1; offers.forEach((o,i)=>{ if(est[i]!==undefined&&est[i]>=ARENA_MIN&&ludusPickFor(LUDUS_MODES[o.mode].size)&&(best<0||ludusArenaReward(o,est[i])>ludusArenaReward(offers[best],est[best]))) best=i; });
        if(best>=0&&tIn>2){ ludusArenaFight(best); const st=state; let n=0; while(arenaStep(st)&&n<8000) n++; const w0=ludus.wins; ludusResolve(st); ludusLeaveMatch(); stats.arena[ludus.wins>w0?0:1]++; continue; }
        // else the pit
        ludus.options=null; ludusBusy=false; ludusScoutOpponent(); for(let i=0;i<600&&!ludus.options;i++) await sleep(20);
        const o=(ludus.options||[]).find(x=>x.diff==='fair')||(ludus.options||[])[0]; if(!o){ ludusAdvanceDay([]); continue; }
        fight(o,'pit');
      }
      // the world: who is alive where, how strong, what happened
      const w=ludusMapWorld(), cols={}; (ludus.world||[]).filter(n=>n.status==='active').forEach(n=>{ const c=w.nodes[n.region].col; const e=cols[c]=cols[c]||{ n:0, lv:0, max:0 }; e.n++; e.lv+=n.level; e.max=Math.max(e.max,n.level); });
      const world=Object.keys(cols).sort((a,c)=>a-c).map(c=>`c${c}:${cols[c].n}x L${(cols[c].lv/cols[c].n).toFixed(1)}/${cols[c].max}`).join(' ');
      const chron=(ludus.chronicle||[]), count=re=>chron.filter(e=>re.test(e.t)).length;
      return { tourneys, world, deaths:count(/fällt/), moves:count(/zieht weiter/), rookies:count(/Neuling/), msPerDay:Math.round((performance.now()-t0)/ludus.day), kind, over:ludus.over, cause:ludus.cause, day:ludus.day, level:ludusLevel(), team:ludus.team.map(m=>m.kind+m.level).join('+'), gold:ludus.gold, cleared:ludus.map.cleared.length, col:ludusHere().col, stats, log:log.slice(-8) };
    },[kind,MAXDAY,ARENA_MIN]);
    console.log(JSON.stringify(Object.assign(res,{ errs:errs.slice(0,3) })));
    await p.close();
  }
  await b.close();
})();
