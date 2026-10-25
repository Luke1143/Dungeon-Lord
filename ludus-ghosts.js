// Ghosts: the team of an ended run stands on the ladder of the next runs, as a rival team (it killed you, or it was the champion).
// ludusMeta.ghosts=[{ id, name, killer, champion, members:[{kind,name,level,xp,gifts,inventory,learned,seed}] }]; they replace the ladder figure of their strength
const LUDUS_GHOST_MAX=10;
function ludusSaveGhost(team,killer,champion){
  const members=team.map((m,i)=>({ id:'g'+i, kind:m.kind, name:m.name, level:m.level, xp:m.xp, seed:m.seed, gifts:JSON.parse(JSON.stringify(m.gifts||[])), inventory:JSON.parse(JSON.stringify(m.inventory||[])), learned:(m.learned||[]).slice() }));
  ludusMeta.ghosts=(ludusMeta.ghosts||[]).concat([{ id:'gh'+Date.now().toString(36)+Math.floor(Math.random()*1e4), name:members[0].name+(members.length>1?' & Co':''), killer:killer||'', champion:!!champion, members }]).slice(-LUDUS_GHOST_MAX);
}
const ludusGhostLevel=g=>Math.round(g.members.reduce((a,m)=>a+m.level,0)/g.members.length);
// the ladder with the ghosts put in: each takes the place of its strength (a taken place goes to the next free one)
function ludusLadderWithGhosts(lad){
  const out=lad.slice(), taken=new Set();
  (ludusMeta.ghosts||[]).slice().sort((a,b)=>ludusGhostLevel(b)-ludusGhostLevel(a)).forEach(g=>{
    const want=Math.max(0,Math.min(9,9-Math.round((ludusGhostLevel(g)-1)/1.8)));
    let i=want; for(let d=0;d<10;d++){ const c=[want-d,want+d].find(x=>x>=0&&x<10&&!taken.has(x)); if(c!==undefined){ i=c; break; } }
    taken.add(i); const lead=g.members[0];
    out[i]=Object.assign({},lad[i],{ kind:lead.kind, level:lead.level, name:g.name, ghost:g, rank:i+1 });
  });
  return out;
}
const ludusGhostFoes=g=>g.members.map(m=>({ kind:m.kind, level:m.level, tier:0, seed:m.seed, name:m.name, ghost:true, member:Object.assign({},m,{ hp:undefined, energy:100 }) }));
function ludusGhostBout(rival,reward){
  const g=rival.ghost, foes=ludusGhostFoes(g);
  return { kind:foes[0].kind, level:Math.max(...foes.map(f=>f.level)), foes, variant:foes.length>1?'group':'duel', title:`${g.name}${g.champion?' (Champion)':''}`, reward:Math.round(reward*ludusHallMult()), diff:'hard', ghostId:g.id, ghostName:g.name, ghostKiller:g.killer, rank:rival.rank };
}
// beaten: the team retires; one piece of its gear falls to the winner
function ludusGhostRetire(o){
  const g=(ludusMeta.ghosts||[]).find(x=>x.id===o.ghostId); if(!g) return '';
  ludusMeta.ghosts=ludusMeta.ghosts.filter(x=>x!==g);
  const pool=g.members.reduce((a,m)=>a.concat((m.inventory||[]).filter(i=>instDef(i)&&['weapon','armor','shield'].includes(instDef(i).type))),[]);
  pool.sort((a,b)=>ludusTierIndex(b)-ludusTierIndex(a)); let t=` ${g.name} tritt ab.`;
  if(pool.length){ const it=JSON.parse(JSON.stringify(pool[0])); ludus.stash.push(it); t+=` Beute: ${instLabel(it)}.`; }
  ludus.fame+=3; ludusGainRenown(Math.round(15*ludusHallMult())); return t;
}
