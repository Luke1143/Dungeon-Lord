// Which emojis still reach the screen as emojis (not swapped for a pixel picture, see EMOJI_SHAPES in icons.js)?
// Walks the main screens (menu, options, world map, level with every tab, arena, every Ludus page, Ludus map) and lists what it finds, with the element.
// Usage: NODE_PATH=$(npm root -g) node tests/emoji.js   (STRICT=1: fail when any emoji is left)
const { open, buildScene, startArena, finish }=require('./lib');
(async()=>{
  const { browser, page:p, errs }=await open();
  const found={};
  const scan=async(where)=>{ await p.waitForTimeout(200);
    const list=await p.evaluate(()=>{ const re=/\p{Extended_Pictographic}/gu, out={};
      document.querySelectorAll('body *').forEach(el=>{ if(el.offsetParent===null) return; for(const n of el.childNodes){ if(n.nodeType!==3) continue; const m=n.textContent.match(re); if(m) m.forEach(ch=>{ out[ch+'  <'+el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(typeof el.className==='string'&&el.className?'.'+el.className.split(' ')[0]:'')+'>']=1; }); } });
      return Object.keys(out); });
    list.forEach(k=>{ (found[k]=found[k]||new Set()).add(where); }); };
  // canvas: emojis drawn as text (not swapped) while the game runs
  await p.evaluate(()=>{ window.__canvasEmoji={}; const re=/\p{Extended_Pictographic}/u, C=CanvasRenderingContext2D.prototype, inner=C.fillText;
    C.fillText=function(t,...a){ const s=String(t); if(re.test(s)&&!(s.length<=4&&emojiIconCanvas(s,1))) window.__canvasEmoji[s]=(window.__canvasEmoji[s]||0)+1; return inner.call(this,t,...a); }; });
  await scan('menu');
  await p.evaluate(()=>{ const b=document.getElementById('menuOptions'); if(b) b.click(); }); await scan('options'); await p.evaluate(()=>{ if(typeof optionsClose==='function') optionsClose(); });
  await p.click('#menuNew'); await p.waitForTimeout(1000); await scan('world map');
  await p.evaluate(buildScene); await p.waitForTimeout(800); await scan('level');
  const tabs=await p.evaluate(()=>document.querySelectorAll('.dkTab').length);
  for(let i=0;i<tabs;i++){ await p.evaluate(i=>document.querySelectorAll('.dkTab')[i].click(),i); await scan('level tab '+i); }
  await p.evaluate(()=>setView3d(true)); await p.waitForTimeout(1500);
  await p.evaluate(startArena,'pit'); await p.waitForTimeout(1500); await scan('arena');
  await p.evaluate(async()=>{ arenaLeave(); await ludusOpen(); ludusNewRun('ork','Grom'); }); await p.waitForTimeout(800);
  for(const t of ['inn','pit','train','smith','lib','tour','gear','sheet']){ await p.evaluate(t=>{ ludusTab=t; ludusRender(); },t); await scan('ludus '+t); }
  await p.evaluate(()=>{ ludusNewRun('ork','Grom','map'); ludusTab='map'; ludusRender(); }); await scan('ludus map');
  const canvas=await p.evaluate(()=>window.__canvasEmoji);
  const rows=Object.entries(found).sort();
  rows.forEach(([k,v])=>console.log('  page   '+k.padEnd(34)+[...v].join(', ')));
  Object.entries(canvas).forEach(([k,n])=>console.log('  canvas '+k.padEnd(34)+n+' times'));
  if(!rows.length&&!Object.keys(canvas).length) console.log('  no emoji left on these screens');
  finish('emoji census',errs,process.env.STRICT&&(rows.length||Object.keys(canvas).length)?'emojis left (STRICT)':'');
  await browser.close();
})();
