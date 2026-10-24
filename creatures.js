// Creature abilities (godhand Teil 16): like the boss abilities in bosses.js, a table row each, for ordinary creatures of either side.
//   cooldown/range: used every `cooldown` ticks while a foe is within `range` (or, with `need`, while `need(c)` says it is worth it)
//   quiet: no line in the event log (for abilities that fire all the time)
// run(c) may return false when nothing happened (the ability then stays ready).
const CREATURE_ABILITIES={
  banshee:[ { id:'wail', cooldown:70, range:5, icon:'😱', text:'Eine Banshee kreischt: die Eindringlinge erstarren!',
    run:c=>{ bossFoesNear(c,5).forEach(f=>{ f.rootedTicks=14; f.path=[]; }); } } ],
  ghost:[ { id:'chill', cooldown:60, range:3, icon:'🥶', text:'Ein Geist streift seine Opfer: sie werden schwach.',
    run:c=>{ bossFoesNear(c,3).forEach(f=>{ f.weakTicks=40; }); } } ],
  succubus:[ { id:'charm', cooldown:90, range:6, icon:'💋', text:'Eine Succubus verdreht einem Helden den Kopf: er kämpft kurz für die Dunkelheit!',
    run:c=>{ const fs=bossFoesNear(c,6).filter(f=>f.category==='hero' && !f.isBoss && !f.charmedTicks); if(!fs.length) return false; const f=fs[Math.floor(Math.random()*fs.length)];
      f.charmedFrom=f.faction; f.charmedTicks=30; f.faction=c.faction; f.fightTarget=null; f.path=[]; } } ],
  demon:[ { id:'inferno', cooldown:80, range:2, icon:'🔥', text:'Ein Dämon speit Höllenfeuer!',
    run:c=>{ bossFoesNear(c,2).forEach(f=>{ resolveAttack(c,f,null); }); for(let i=0;i<4;i++) emitFx('dig', c.x+((i%2)?1:-1)*(1+(i>>1)), c.y, { color:'#e8501c' }); } } ],
  lich:[ { id:'raise', cooldown:140, range:8, icon:'💀', text:'Ein Lich ruft Knochen aus dem Boden!',
    run:c=>{ for(let i=0;i<2;i++){ const res=bfsFind(c.x,c.y,(x,y)=>Math.abs(x-c.x)+Math.abs(y-c.y)>=1 && !tileOccupied(x,y,c)); const at=res?res.target:{ x:c.x, y:c.y };
      const sk=createHorde('skeleton',at.x,at.y); sk.faction=c.faction; state.creatures.push(sk); emitFx('claim',at.x,at.y); } } } ],
  dragon:[ { id:'breath', cooldown:70, range:5, icon:'🐲', text:'Ein Drache atmet Feuer!',
    run:c=>{ bossFoesNear(c,5).forEach(f=>{ resolveAttack(c,f,null); resolveAttack(c,f,null); }); } } ],
  yule:[ { id:'pilfer', cooldown:50, range:99, icon:'🧦', text:'Ein Yule stiehlt Gold aus der Schatzkammer!', quiet:true,
    need:c=>c.faction==='good' && (state.gold||0)>0 && !!state.grid[c.y] && state.grid[c.y][c.x].owned,
    run:c=>{ const g=Math.min(state.gold,25); if(g<=0) return false; state.gold-=g; c.loot=(c.loot||0)+g; logEvent(`${actorLabel(c)} stiehlt ${g} Gold!`, c.x, c.y); } } ],
  griffin:[ { id:'swoop', cooldown:80, range:7, icon:'🦅', text:'Ein Greif stürzt auf einen Gegner herab!',
    run:c=>{ const fs=bossFoesNear(c,7).filter(f=>Math.abs(f.x-c.x)+Math.abs(f.y-c.y)>=3); if(!fs.length) return false; const f=fs[0];
      const res=bfsFind(f.x,f.y,(x,y)=>Math.abs(x-f.x)+Math.abs(y-f.y)===1 && !tileOccupied(x,y,c)); if(!res) return false;
      c.x=res.target.x; c.y=res.target.y; c.path=[]; resolveAttack(c,f,null); } } ],
  unicorn:[ { id:'revive', cooldown:150, range:4, icon:'🦄', text:'Ein Einhorn weckt einen Gefallenen!', quiet:false,
    need:c=>state.creatures.some(o=>o!==c && o.faction===c.faction && o.unconscious && !o.imprisoned && Math.abs(o.x-c.x)+Math.abs(o.y-c.y)<=4),
    run:c=>{ const o=state.creatures.find(o=>o!==c && o.faction===c.faction && o.unconscious && !o.imprisoned && Math.abs(o.x-c.x)+Math.abs(o.y-c.y)<=4); if(!o) return false; o.unconscious=false; o.hp=Math.max(1,Math.round(o.maxHp*0.4)); } } ],
  kitsune:[ { id:'hex', cooldown:60, range:6, icon:'🦊', text:'Eine Kitsune verhext ihre Gegner.', quiet:true,
    run:c=>{ bossFoesNear(c,6).slice(0,2).forEach(f=>{ f.weakTicks=60; }); } } ],
  wisp:[ { id:'haste', cooldown:60, range:5, icon:'✨', quiet:true,
    need:c=>state.creatures.some(o=>o!==c && o.faction===c.faction && !o.unconscious && !(o.rallyTicks>0) && Math.abs(o.x-c.x)+Math.abs(o.y-c.y)<=5),
    run:c=>{ state.creatures.forEach(o=>{ if(o!==c && o.faction===c.faction && !o.unconscious && Math.abs(o.x-c.x)+Math.abs(o.y-c.y)<=5) o.rallyTicks=24; }); } } ],
  angel:[ { id:'smite', cooldown:90, range:4, icon:'⚡', text:'Ein Engel richtet mit heiligem Licht!',
    run:c=>{ bossFoesNear(c,4).forEach(f=>{ resolveAttack(c,f,null); resolveAttack(c,f,null); }); } } ]
};
// aura healing: every few ticks creatures of the same side near a healer regain life
const HEALERS={ paladin:{ radius:3, amount:2 }, dryad:{ radius:4, amount:2 }, fairy:{ radius:5, amount:2 }, unicorn:{ radius:3, amount:3 }, angel:{ radius:4, amount:3 }, priest:{ radius:3, amount:2 } };
