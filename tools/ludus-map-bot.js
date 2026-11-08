// Ludus map mode: a bot plays whole runs and reports how far it gets (docs/ludus.md, "Stärke der Städte").
// Policy: grind in the pit until the level is `margin` above a city's recommended level, then take the deepest city the level is enough for (every one on the way too); rest, shop, recruit, take events.
// Usage: NODE_PATH=$(npm root -g) node tools/ludus-map-bot.js [kinds=ork] [maxDay=120] [margin=0] [grindDiff=fair|easy|auto] [repeats=1]
// Environment: SNAPS=1 saves the team at every cup entry to $SNAP_DIR (default: the temp folder) for tools/ludus-map-eval.js; CUPLOG=1 prints every cup bout; LOGN=n prints the last n actions.
const { chromium }=require('playwright'); const fs=require('fs'), path=require('path'), os=require('os');
const GAME=process.env.GAME||path.resolve(__dirname,'..'), SNAP_DIR=process.env.SNAP_DIR||path.join(os.tmpdir(),'ludus-map-snaps');
const KINDS=(process.argv[2]||'ork').split(','), MAXDAY=+process.argv[3]||120, MARGIN=+(process.argv[4]||0), GDIFF=process.argv[5]||'fair', REPEAT=+process.argv[6]||1;
(async()=>{
  const b=await chromium.launch(); const results=[];
  for(const kind of KINDS) for(let rep=0;rep<REPEAT;rep++){
    const p=await (await b.newContext()).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file://'+GAME+'/index.html'); await p.waitForTimeout(300);
    await p.evaluate(()=>{ window.storage.set=async()=>{}; showScreen('ludus'); });
    const res=await p.evaluate(async ([kind,MAXDAY,MARGIN,GDIFF,LOGN])=>{
      ludusMeta.unlockAll=true; ludusMeta.roomsAll=false; ludusMeta.ghosts=[]; ludusNewRun(kind,'Bot','map');
      const sleep=ms=>new Promise(r=>setTimeout(r,ms)); const log=[], cupLog=[], snaps=[]; let guard=0;
      const stats={ cup:{}, grind:[0,0], weekly:[0,0] }; let lastLevelDay=1, lastLevel=1;
      const fight=(o,kindTag)=>{
        const w0=ludus.wins; ludus.opp=o; const st=arenaBuild(ludusMatchSetup(o,''),''); const prev=state, ps=screen; state=st; screen='level'; let n=0; while(arenaStep(st)&&n<6000) n++;
        ludusResolved=false; ludusResolve(st); state=prev; screen=ps;
        const won=ludus.wins>w0;
        if(o.cup){ const k=(o.final?'F':'R'); (stats.cup[k]=stats.cup[k]||[0,0])[won?0:1]++; }
        else if(kindTag==='grind') stats.grind[won?0:1]++; else stats.weekly[won?0:1]++;
        return won;
      };
      const has=(m,type)=>(m.inventory||[]).filter(i=>instDef(i)&&instDef(i).type===type);
      const shop=()=>{ if(!ludusRoomTier('forge')) return; const stock=ludusStock();
        ludus.team.forEach(m=>{ ['weapon','armor','shield'].forEach(type=>{ const cur=has(m,type), curT=cur.length?Math.max(...cur.map(ludusTierIndex)):-1;
          const opts=stock.filter(it=>{ const d=ITEMS[it.id]; return d.type===type && (type!=='weapon'||d.hands!==2||!has(m,'shield').length) && (type!=='shield'||!has(m,'weapon').some(w=>instDef(w).hands===2)) && ludusTierIndex(it)>curT && ludus.gold-ludusPrice(it.id)>=8; });
          if(!opts.length) return; const it=opts.sort((a,b2)=>ludusPrice(a.id)-ludusPrice(b2.id))[0]; ludus.gold-=ludusPrice(it.id); const inst={ id:it.id, q:it.q, s:it.s }; ludus.stash.push(inst); ludusGiveItem(inst,m); stock.splice(stock.indexOf(it),1); }); }); };
      const build=()=>{ const order=['forge','inn','pit','hall','training','library']; for(const id of order){ const t=ludus.rooms[id]||0, cost=LUDUS_ROOMS[id].cost[t]; if(cost!==undefined&&ludus.renown>=cost){ ludusBuyRoom(id); return; } } };
      const rest=()=>{ const pct=Math.min(...ludus.team.map(m=>ludusHealPct(ludusMemberCreature(m),m))); if(!(pct<60 || (ludusWeekIn()<=1&&pct<85) || (ludusIdleIn()<=1&&pct<75))) return false;
        if(ludus.gold>=ludusChickenCost()+15){ ludus.team.forEach(m=>{ if(ludus.gold>=ludusChickenCost()){ ludus.gold-=ludusChickenCost(); ludusHeal(ludusChickenHeal(),m); } }); }
        ludusHealAll(ludusSleepHeal()); ludus.team.forEach(m=>{ m.energy=100; }); ludusAdvanceDay(); return true; };
      // the shortest way (by steps) from the current node to any node of the set
      const nextStep=(from,goalIds)=>{ const w=ludusMapWorld(); const prevOf={}; const q=[from]; prevOf[from]=-1; while(q.length){ const c=q.shift(); if(goalIds.includes(c)&&c!==from){ let s=c; while(prevOf[s]!==from) s=prevOf[s]; return s; } ludusMapNeighbours(c).forEach(nb=>{ if(!(nb in prevOf)){ prevOf[nb]=c; q.push(nb); } }); } return null; };
      const grind=async()=>{ ludus.options=null; ludusBusy=false; ludusScoutOpponent(); let w=0; while(!ludus.options&&w++<600) await sleep(15); const opts=ludus.options||[]; if(!opts.length){ ludusAdvanceDay(); return; }
        const want=GDIFF==='auto'?(ludusLevel()<3?'easy':'fair'):GDIFF; const o=opts.find(x=>x.diff===want)||opts.find(x=>x.diff==='fair')||opts[0]; fight(o,'grind'); };
      while(!ludus.over && ludus.day<MAXDAY && guard++<1500){
        if(ludus.giftChoice){ const g=ludus.giftChoice.slice().sort((a,b2)=>b2.power-a.power)[0]; ludus.team[Math.floor(Math.random()*ludus.team.length)].gifts.push(g); ludus.giftChoice=null; }
        if(ludus.followup) ludus.followup=null;
        if(ludus.event){ const d=ludusEventDef(ludus.event.id), opts=ludusEventOptions(d); let pick=opts.findIndex(o=>!o.when||o.when(ludus.event)); if(pick<0) pick=0; ludusEventChoose(pick); ludus.followup=null; }
        build(); shop();
        for(const gst of ludusTavernGuests().slice().sort((x,y)=>y.level-x.level)){ if(ludusSlotsFree()>0&&ludus.gold>=ludusRecruitPrice(gst)+40&&(gst.bond||0)>-2){ ludusRecruit(gst.id); break; } }
        if(ludusLevel()>lastLevel){ lastLevel=ludusLevel(); lastLevelDay=ludus.day; }
        if(ludus.forced){ const o=ludusForcedBout(); const t0=ludus.forced.type; if(o.cup){ const n=ludusCupNode(); const row=[ludus.day,t0,'c'+n.col,(o.final?'F':'R')+ludus.cup.round,'L'+ludusLevel(),'d'+(ludusLevel()-ludusCityLevel(n.col)),'fit'+(o.fitRate===undefined?'-':o.fitRate.toFixed(2)),'n'+ludus.team.length,'t'+ludusAverageTier(),o.foes.map(f=>f.kind+f.level).join('+')]; log.push(row); cupLog.push(row); } fight(o,t0); continue; }
        if(rest()){ log.push([ludus.day,'rest']); continue; }
        const w=ludusMapWorld(), cur=w.nodes[ludus.map.at];
        // the city to go for: the deepest one the level is enough for; on the way every city the level is enough for is taken (stalled for long: enter anyway)
        const cities=w.nodes.filter(n=>ludusCanEnter(n)).sort((a,b2)=>a.col-b2.col);
        const ready=cities.filter(n=>ludusLevel()>=ludusCityLevel(n.col)+MARGIN);
        const stalled=ludus.day-lastLevelDay>25;
        const tgt=ready.length?ready[ready.length-1]:(stalled?cities[0]:null);
        if(tgt){
          if(ready.includes(cur)||cur.id===tgt.id){ snaps.push({ col:cur.col, conq:ludusConquered(), level:ludusLevel(), day:ludus.day, team:JSON.parse(JSON.stringify(ludus.team)) }); ludusCupEnter(); log.push([ludus.day,'enter',cur.name,'c'+cur.col,'L'+ludusLevel(),'rec'+ludusCityLevel(cur.col)]); continue; }
          const s=nextStep(cur.id,[tgt.id]); if(s!==null){ const d0=ludus.day; ludusMapTravel(s); log.push([ludus.day,'travel',cur.name+'->'+ludusMapWorld().nodes[s].name,ludus.day===d0?'BLOCKED':'ok',ludus.event?'event':'',ludus.giftChoice?'gift':'']); continue; }
        }
        log.push([ludus.day,'grind','L'+ludusLevel()]); await grind();
      }
      const cities=ludusMapWorld().nodes.filter(n=>ludusIsCity(n)).length;
      return { kind, over:ludus.over, cause:ludus.cause, day:ludus.day, wins:ludus.wins, level:ludusLevel(), conquered:ludusConquered(), cities, stats, gifts:ludus.team.reduce((a,m)=>a+(m.gifts||[]).length,0), team:ludus.team.length, log:log.slice(-LOGN), cupLog, snaps };
    },[kind,MAXDAY,MARGIN,GDIFF,+process.env.LOGN||6]);
    res.errs=errs.slice(0,3); results.push(res); if(process.env.SNAPS){ fs.mkdirSync(SNAP_DIR,{recursive:true}); fs.writeFileSync(path.join(SNAP_DIR,kind+'_'+rep+'.json'),JSON.stringify(res.snaps)); } delete res.snaps;
    if(process.env.LOGN) console.log(res.log.map(x=>x.join(' ')).join('\n')); if(process.env.CUPLOG) console.log(res.cupLog.map(x=>x.join(' ')).join('\n')); console.log(JSON.stringify({ k:res.kind, over:res.over, cause:(res.cause||'').slice(0,40), day:res.day, L:res.level, conq:res.conquered+'/'+res.cities, cup:res.stats.cup, grind:res.stats.grind, wk:res.stats.weekly, gifts:res.gifts, n:res.team, errs:res.errs.length?res.errs:undefined }));
    await p.close();
  }
  await b.close();
})();
