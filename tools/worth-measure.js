// Measures what each kind is worth in orks (docs/budget.md): the kind against orks of the same level and gear quality, Ludus rules, open pit.
// Stronger than an ork: one of the kind against N orks; weaker: M of the kind against one ork. The worth is the count at which the fights are even
// (interpolated between the two counts around 50 %): N, or 1/M. Every fight has freshly rolled gear and its own ground, and the sides swap every other fight.
// Usage: NODE_PATH=$(npm root -g) node tools/worth-measure.js [level=4] [tier=1] [runs=20] [kinds=all]
const { chromium }=require('playwright'); const path=require('path');
const GAME=process.env.GAME||path.resolve(__dirname,'..'), LEVEL=+(process.argv[2]||4), TIER=+(process.argv[3]||1), RUNS=+(process.argv[4]||20), ONLY=(process.argv[5]||'').split(',').filter(Boolean);
(async()=>{
  const b=await chromium.launch(), p=await b.newPage(); await p.goto('file://'+GAME+'/index.html'); await p.waitForTimeout(500);
  const kinds=ONLY.length?ONLY:await p.evaluate(()=>arenaKinds());
  for(const k of kinds){
    const r=await p.evaluate(([k,L,T,R])=>{
      // the rate at which `a` of the kind beat `o` orks
      const rate=(a,o)=>{ let w=0; for(let i=0;i<R;i++){ const ga=arenaGroup(k,a,L); ga.tier=T; const go=arenaGroup('ork',o,L); go.tier=T;
        const setup={ teams:[{ name:'A', groups:[ga] },{ name:'B', groups:[go] }], map:{ layout:'pit', dims:'S', seed:'w'+i, lava:0, water:0, crystal:0, near:1 }, fog:false, batch:1, ludus:true, fixedMap:true, swapSides:i%2===1 };
        w+=arenaSimulate(arenaExpand(setup),1).wins[0]; } return w/R; };
      const seen=[]; const r1=rate(1,1); seen.push(['1:1',r1]);
      const cross=(pts)=>{ const [x0,y0]=pts[pts.length-2], [x1,y1]=pts[pts.length-1]; return y0===y1?x1:x0+(y0-0.5)/(y0-y1)*(x1-x0); };
      if(r1>=0.5){ const pts=[[1,r1]]; let n=1, last=r1; while(last>=0.5&&n<14){ n++; last=rate(1,n); pts.push([n,last]); seen.push(['1:'+n,last]); } return { k, worth:+cross(pts).toFixed(2), seen }; }
      const pts=[[1,1-r1]]; let m=1, last=r1; while(last<0.5&&m<8){ m++; last=rate(m,1); pts.push([m,1-last]); seen.push([m+':1',last]); }
      return { k, worth:+(1/cross(pts)).toFixed(2), seen };
    },[k,LEVEL,TIER,RUNS]);
    const old=await p.evaluate(k=>creatureWorth(k),k);
    console.log(JSON.stringify({ k:r.k, worth:r.worth, table:old, seen:r.seen.map(([n,x])=>n+'='+x.toFixed(2)).join(' ') }));
  }
  await b.close();
})();
