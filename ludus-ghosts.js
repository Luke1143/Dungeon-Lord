// Ghosts: the team of an ended run stands on the ladder of the next runs, as a rival team (it killed you, or it was the champion).
// ludusMeta.ghosts=[{ id, name, killer, champion, members:[{kind,name,level,xp,gifts,inventory,learned,seed}] }]; they replace the ladder figure of their strength
const LUDUS_GHOST_MAX=10;
function ludusSaveGhost(team,killer,champion){
  const members=team.map((m,i)=>({ id:'g'+i, kind:m.kind, name:m.name, level:m.level, xp:m.xp, seed:m.seed, gifts:JSON.parse(JSON.stringify(m.gifts||[])), inventory:JSON.parse(JSON.stringify(m.inventory||[])), learned:(m.learned||[]).slice() }));
  ludusMeta.ghosts=(ludusMeta.ghosts||[]).concat([{ id:'gh'+Date.now().toString(36)+Math.floor(Math.random()*1e4), name:members[0].name+(members.length>1?' & Co':''), killer:killer||'', champion:!!champion, members }]);
  if(ludusMeta.ghosts.length>LUDUS_GHOST_MAX){ const weakest=ludusMeta.ghosts.reduce((a,b)=>(ludusGhostLevel(b)+(b.champion?99:0)<ludusGhostLevel(a)+(a.champion?99:0)?b:a)); ludusMeta.ghosts=ludusMeta.ghosts.filter(x=>x!==weakest); }       // the list is full: the weakest goes, champions stay
}
const ludusGhostLevel=g=>Math.round(g.members.reduce((a,m)=>a+m.level,0)/g.members.length);
