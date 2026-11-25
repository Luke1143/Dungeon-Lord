// Smoke test: menu, a campaign level (2D and 3D, 400 ticks; the imps and orks as SVG figures, the gear fitted to every humanoid; the hand pointer; every relief, picture effect and figure look compiles), an arena match in 3D with fog, a Ludus bout to the end, no missing translations.
// Usage: NODE_PATH=$(npm root -g) node tests/smoke.js
const { open, finish }=require('./lib');
(async()=>{
  const { browser, page:p, errs }=await open({ viewport:{ width:1200, height:800 } });
  let problem=''; const shaderErr=[]; p.on('console',m=>{ if(/Shader Error|Program Info Log|THREE\.WebGLProgram/.test(m.text())) shaderErr.push(m.text().slice(0,200)); });
  // the figure workshop from the main menu: it opens over everything, Escape closes it
  await p.click('#menuFigures'); await p.waitForTimeout(500);
  if(!await p.$('#figureWorkshop')) problem+='the figure workshop did not open; ';
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  if(await p.$('#figureWorkshop')) problem+='Escape did not close the figure workshop; ';
  await p.click('#menuNew'); await p.waitForTimeout(800);
  await p.evaluate(()=>{ const n=world.nodes.find(n=>n.col===0)||world.nodes[0]; startLevel(n.id); }); await p.waitForTimeout(2500);
  const lv=await p.evaluate(()=>{ setView3d(false); for(let i=0;i<400;i++) gameTick(); setView3d(true); return { screen, ticks:state.tickCount }; });
  await p.waitForTimeout(1500);
  if(lv.screen!=='level') problem+='campaign did not start; ';
  // the imps are SVG figures (svg-figures.js): pictures made from their rigs, front and back, 2D too; the legacy pixel sprites still work
  const fig=await p.evaluate(async()=>{ const m=state.imps[0]; if(!m) return 'no imp';
    const a=SvgFigures.canvasFor(m,Date.now(),true,'gold','back',0), b=SvgFigures.canvasFor(m,Date.now(),false,null,'front',0);
    if(!a._svg||!b._svg||a===b) return 'imp pictures wrong';
    setView3d(false); draw(); setOption('figures','pixel'); draw(); setOption('figures','svg'); setView3d(true); await new Promise(r=>setTimeout(r,300));
    for(const kind of Object.keys(SvgFigures.KINDS)){ if(!SvgFigures.active(kind)) return kind+' is no SVG figure'; const f={ kind, id:7, level:3 }, cv=SvgFigures.canvasFor(f,Date.now(),true,null,'back',0); if(!cv._svg) return kind+' picture wrong'; }       // every kind with a rig
    { const sk={ kind:'skeleton', id:9, level:2 }, cv=SvgFigures.canvasFor(sk,Date.now(),true,null,'front',1); if(!cv._svg) return 'the skeleton from the side drew nothing'; }
    { const f3=OPTIONS.fig3d; OPTIONS.fig3d=true; const sk={ kind:'skeleton', id:11, level:2, _yaw8:3 }, cv=SvgFigures.canvasFor(sk,Date.now(),true,{ weapon:'schwert', shield:'kite' },'front',0); const ok3=SvgFigures.canvasFor({ kind:'ork', id:12, level:2, _yaw8:5 },Date.now(),true,{ weapon:'axt', chest:1 },'front',0); OPTIONS.fig3d=f3; if(!cv._svg) return 'the 2.5D skeleton drew nothing'; if(!ok3._svg) return 'the 2.5D ork drew nothing'; }       // the 2.5D test (Rig3D)       // the side view (a test: the skeleton walking sideways)
    { const pl=SvgRig.plan({ kind:'skeleton2', gear:{ helmet:true, helmStyle:'horns', chest:true, pauldrons:true, greaves:true, cloth:true, shield:'kite', weapon:'sword' } }), g=document.createElement('canvas').getContext('2d');       // the armour in 2.5D, every direction
      for(let y=0;y<8;y++){ const F=Rig3D.frame(y*Math.PI/4,0.85); Rig3D.skeleton(F,pl,{ t:1, phase:y, walking:y%2===1 }); if(F.items.length<40||F.items.some(it=>/NaN/.test(it.d))) return 'the armoured 2.5D skeleton is broken at yaw '+y*45; }
      Rig3D.canvas(g,pl,{ t:1 },1,0.4,2,50,120);
      for(const spec of [{ kind:'orkB', style:'pirscher', gear:{ weapon:'axe', cloth:true } },{ kind:'orkB', style:'schinder', gear:{ helmet:true, chest:true, pauldrons:true, greaves:true, cloth:true, shield:'kite', weapon:'spear' } },{ kind:'human', style:'veteran', gear:{ weapon:'sword' } },{ kind:'human', style:'bauer', gear:{ helmet:true, chest:true, shield:'round' } },{ kind:'goblinB', style:'grinser', gear:{ weapon:'club', cloth:true } },{ kind:'goblinB', style:'flitzer', gear:{ helmet:true, chest:true, pauldrons:true, greaves:true, weapon:'spear' } },{ kind:'trollB', gear:{ weapon:'club', cloth:true, helmet:true } },{ kind:'darkelfB', gear:{ weapon:'bow', chest:true } },{ kind:'vampireB', gear:{ weapon:'dagger' } },{ kind:'warlockB', gear:{ weapon:'staff' } },{ kind:'warlockB', gear:{ helmet:true, pauldrons:true } },{ kind:'ghoul', gear:{ weapon:'none', cloth:true } },{ kind:'zombie', gear:{ weapon:'none', cloth:true } },{ kind:'priest', gear:{ weapon:'staff', cloth:true } },{ kind:'darkknight', gear:{ weapon:'sword', cloth:true } },{ kind:'succubus', gear:{ weapon:'dagger', cloth:true } },{ kind:'demon', gear:{ weapon:'axe', cloth:true } },{ kind:'lich', gear:{ weapon:'staff', cloth:true } },{ kind:'werewolf', gear:{ weapon:'none', cloth:true } },{ kind:'werewolf', gear:{ helmet:true, chest:true, pauldrons:true, greaves:true } },{ kind:'lich', gear:{ helmet:true, chest:true } }]){ const po=SvgRig.plan(spec);       // the ork and the human of flesh in 2.5D (one kit of parts)
        for(let y=0;y<8;y++){ const F=Rig3D.frame(y*Math.PI/4,0.85); Rig3D.skeleton(F,po,{ t:1, phase:y, walking:y%2===1, roar:y===4?0.3:0 }); if(F.items.length<30||F.items.some(it=>/NaN/.test(it.d))) return 'the 2.5D '+spec.kind+' is broken at yaw '+y*45; } } }
    return SvgFigures.size>1?'':'no imp pictures drawn'; });
  if(fig) problem+=fig+'; ';
  // one body plan for every humanoid (svg-rig.js): the gear lands on the right parts at any size, strength widens the shoulders much more than the hips;
  // the figure viewer opens with every kind and style
  const fit=await p.evaluate(async()=>{
    const find=(part,id)=>part.id===id?part:part.kids.reduce((a,k)=>a||find(k,id),null);
    const nums=d=>(d.match(/-?\d*\.?\d+/g)||[]).map(Number), pts=d=>{ const n=nums(d), o=[]; for(let i=0;i+1<n.length;i+=2) o.push([n[i],n[i+1]]); return o; };
    const box=d=>{ const q=pts(d); return [Math.min(...q.map(v=>v[0])),Math.min(...q.map(v=>v[1])),Math.max(...q.map(v=>v[0])),Math.max(...q.map(v=>v[1]))]; };
    const widthAt=(q,y)=>{ let w=0; q.forEach((a,i)=>{ const b=q[(i+1)%q.length]; if((a[1]-y)*(b[1]-y)<=0&&a[1]!==b[1]) w=Math.max(w,Math.abs(a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]))); }); return w; };
    const iron=(rig,id)=>find(rig.tree,id).shapes.find(s=>s[1]==='iron')[0];
    const out=[], gear={ helmet:true, chest:true, pauldrons:true, cloth:true };
    const specs=[]; for(const kind of SvgRig.KINDS.filter(k=>!SvgRig.kindInfo(k).only3d)){ for(const style of SvgRig.stylesOf(kind)) for(const stark of [0,1]) specs.push([{ kind, style, traits:{ klug:0.5, stark, flink:0.5, wild:0.5 }, gear },kind+'/'+style+'/'+stark]);
      for(let seed=1;seed<=24;seed++) specs.push([Object.assign(SvgRig.roll(seed*7919,kind),{ gear }),kind+'/seed '+seed*7919]); }       // and rolled ones: every gene
    for(const [spec,at] of specs){
      const rig=SvgRig.build(spec);
      const skP=pts(find(rig.tree,'skull').shapes[0][0]), sk=box(find(rig.tree,'skull').shapes[0][0]), hm=box(iron(rig,'helmet')), pl=box(iron(rig,'pauldronL')), bdP=pts(find(rig.tree,'body').shapes[0][0]);
      // the helmet: its rim at the brows (in the upper part of the head), a little broader than the head there
      const rim=(hm[3]-sk[1])/(sk[3]-sk[1]); if(rim<0.2||rim>0.75) out.push(at+': helmet rim at '+rim.toFixed(2)+' of the head');
      const hw=hm[2]/widthAt(skP,hm[3]-0.3); if(hw<1||hw>1.35) out.push(at+': helmet '+hw.toFixed(2)+' of the head at its rim');
      // the shoulder plate: its middle on the body's edge at its height
      const py=(pl[1]+pl[3])/2, px=-(pl[0]+pl[2])/2/widthAt(bdP,py); if(px<0.7||px>1.2) out.push(at+': shoulder plate at '+px.toFixed(2)+' of the shoulder');
      // the breastplate: from the shoulders down to the waist, as broad as the body
      const ch=box(iron(rig,'chest')), bw=Math.max(...[0,1,2,3,4,5,6,7,8].map(i=>widthAt(bdP,ch[1]+0.5+(ch[3]-ch[1]-3)*i/8))), cw=ch[2]/bw; if(cw<0.95||cw>1.2) out.push(at+': breastplate '+cw.toFixed(2)+' of the body');
    }
    for(const kind of SvgRig.KINDS.filter(k=>!SvgRig.kindInfo(k).only3d)){ const m=st=>{ const r=SvgRig.build({ kind, traits:{ klug:0.5, stark:st, flink:0.5, wild:0.5 }, gear }); return [-box(iron(r,'pauldronL'))[0],-find(r.tree,'legL').pivot[0]]; };       // the hips: where the legs sit
      const a=m(0), b=m(1); if(b[0]/a[0]<b[1]/a[1]+0.3) out.push(kind+': strength widens the hips as much as the shoulders'); }
    const host=document.createElement('div'); document.body.appendChild(host); const v=SvgOrkViewer.open(host);
    for(const kind of SvgRig.KINDS){ const sel=host.querySelector('#orkvKind'); sel.value=kind; sel.dispatchEvent(new Event('change'));
      for(const style of SvgRig.stylesOf(kind)){ const st=host.querySelector('#orkvStyle'); st.value=style; st.dispatchEvent(new Event('change')); await new Promise(r=>setTimeout(r,60)); }
      host.querySelector('#orkvRoll').click(); await new Promise(r=>setTimeout(r,60)); }
    v.close(); host.remove();
    return out.join('; '); });
  if(fit) problem+=fit+'; ';
  // the Dungeon Lord's hand: the pointer over the 3D board hides the system pointer and lights the dungeon
  { const box=await (await p.$('#board')).boundingBox(); await p.mouse.move(box.x+box.width/2,box.y+box.height/2); await p.waitForTimeout(400);
    const cur=await p.evaluate(()=>document.getElementById('board').style.cursor); if(cur!=='none') problem+='the hand pointer did not take over; '; await p.mouse.move(2,2); }
  // the deepest relief (parallax occlusion) and every picture effect must compile
  await p.evaluate(()=>setOption('relief',3)); for(let l=0;l<6;l++){ await p.evaluate(v=>setPostLevel(v),l); await p.waitForTimeout(300); } await p.evaluate(()=>setPostLevel(1));
  // every figure look (with and without outline), over no filter and over the painted world
  for(const post of [0,5]){ await p.evaluate(v=>setPostLevel(v),post); const nf=await p.evaluate(()=>FIG_LOOKS.length); for(let f=1;f<nf;f++){ await p.evaluate(f=>{ setOption('outline',f%2===0); setOption('figSmooth',f%3===0); setOption('figLook',f); },f); await p.waitForTimeout(250); } }
  await p.evaluate(()=>{ setOption('figLook',0); setOption('outline',false); setOption('figSmooth',false); setPostLevel(1); });
  await p.evaluate(()=>{ setOption('relief',1); });
  if(shaderErr.length) problem+='shader: '+shaderErr[0]+'; ';
  await p.evaluate(()=>{ arenaStart({ teams:[{name:'A',groups:[arenaGroup('ork',2,3)]},{name:'B',groups:[arenaGroup('knight',2,3)]}], map:{layout:'ring',dims:'S',seed:'s',lava:1,water:1,crystal:0,near:1}, fog:true, batch:1 }); });
  await p.waitForTimeout(2000);
  // the orks of the arena are SVG figures too: their gear from the game (equipLook), a blow swung by the hand, turned towards a target on the left
  const orkFig=await p.evaluate(()=>{ const o=state.creatures.find(c=>c.kind==='ork'); if(!o) return 'no ork in the arena'; if(!SvgFigures.active('ork')) return 'the ork is no SVG figure';
    const pose=Object.assign(poseOf('over',0.45),{ p:0.45, anim:{ motion:'over' } }), a=SvgFigures.canvasFor(o,Date.now(),false,equipLook(o),'front',0,pose,true), b=SvgFigures.canvasFor(o,Date.now(),false,equipLook(o),'front',0,null,false);
    return a._svg&&a._cells>1&&a!==b?'':'ork pictures wrong'; });
  if(orkFig) problem+=orkFig+'; ';
  const ludus=await p.evaluate(async()=>{
    arenaLeave(); await ludusOpen(); ludusNewRun('ork','Grom'); ludus.options=null; ludusScoutOpponent();
    for(let i=0;i<200&&!(ludus.options&&ludus.options.length);i++) await new Promise(r=>setTimeout(r,50));
    const o=(ludus.options||[])[0]; if(!o) return 'no opponent';
    ludus.opp=o; const st=arenaBuild(ludusMatchSetup(o,''),''); let n=0; while(arenaStep(st)&&n<3000) n++; return n>0?'':'bout did not run'; });
  if(ludus) problem+=ludus+'; ';
  const misses=await p.evaluate(()=>[...I18N_MISSES]);
  if(misses.length) problem+='missing translations: '+misses.slice(0,10).join(' | ');
  finish('smoke',errs,problem);
  await browser.close();
})();
