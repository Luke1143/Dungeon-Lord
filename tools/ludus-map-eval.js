// Ludus map mode: how do teams saved by tools/ludus-map-bot.js (SNAPS=1) fare against the city bouts made with the current LUDUS_CITY parameters?
// Every bout is tested with the team at several level shifts (-2..+2), so the win rate against the level difference can be read off.
// Usage: NODE_PATH=$(npm root -g) node tools/ludus-map-eval.js '{"round":0.99}' [shardIndex=0] [shardCount=1] [runs=12]   (the first argument overrides LUDUS_CITY values; run the shards side by side)
// The result is one JSON line per shard; tools/ludus-map-eval-sum.py (or any script) can add the shards up.
const { chromium }=require('playwright'); const fs=require('fs'), path=require('path'), os=require('os');
const GAME=process.env.GAME||path.resolve(__dirname,'..'), SNAP_DIR=process.env.SNAP_DIR||path.join(os.tmpdir(),'ludus-map-snaps');
const PARAMS=JSON.parse(process.argv[2]||'{}'), SHARD=+process.argv[3]||0, SHARDS=+process.argv[4]||1, RUNS=+process.argv[5]||12;
const files=fs.readdirSync(SNAP_DIR).filter(f=>f.endsWith('.json')).sort();
let snaps=[]; files.forEach(f=>JSON.parse(fs.readFileSync(path.join(SNAP_DIR,f),'utf8')).forEach((s,i)=>snaps.push(Object.assign({file:f,i},s))));
snaps=snaps.filter((s,i)=>i%SHARDS===SHARD);
(async()=>{
  const b=await chromium.launch(); const p=await (await b.newContext()).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+GAME+'/index.html'); await p.waitForTimeout(300);
  await p.evaluate(()=>{ window.storage.set=async()=>{}; showScreen('ludus'); });
  const rows=[];
  for(const sn of snaps){
    const r=await p.evaluate(([sn,PARAMS,RUNS])=>{
      Object.assign(LUDUS_CITY,PARAMS); ludusMeta.unlockAll=true; ludusMeta.ghosts=[]; ludusNewRun(sn.team[0].kind,'E','map');
      const base=JSON.parse(JSON.stringify(sn.team)); ludus.sel=0; ludus.day=50; const w=ludusMapWorld();
      const n=w.nodes.find(x=>x.col===sn.col&&ludusIsCity(x))||w.nodes.find(x=>x.col===sn.col); ludus.map.at=n.id;
      const mk=s=>base.map(m=>Object.assign({},m,{ level:Math.max(1,m.level+s), xp:xpForLevel(Math.max(1,m.level+s)), hp:undefined, energy:100 }));
      ludus.team=mk(0);
      const rounds=ludusCupRoundsFor(n), shifts=[-2,-1,0,1,2], res={}, fits=[]; shifts.forEach(s=>res[s]=[]);
      for(let r=0;r<rounds;r++){
        ludus.team=mk(0); ludus.cup={ node:n.id, round:r, rounds }; const o=ludusCupBout(); fits.push(o.fitRate===undefined?-1:o.fitRate);
        shifts.forEach(s=>{ ludus.team=mk(s); let wins=0; for(let q=0;q<RUNS;q++){ try{ wins+=arenaSimulate(ludusMatchSetup(o,'e'+q),1,null).wins[0]; }catch(e){} } res[s].push(wins/RUNS); });
      }
      return { col:sn.col, level:sn.level, d:sn.level-ludusCityLevel(sn.col), n:sn.team.length, gifts:sn.team.reduce((a,m)=>a+(m.gifts||[]).length,0), res, fits };
    },[sn,PARAMS,RUNS]);
    rows.push(r);
  }
  console.log(JSON.stringify({ params:PARAMS, shard:SHARD, rows, errs:errs.slice(0,2) })); await b.close();
})();
