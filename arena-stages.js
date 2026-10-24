// Arena stages: hand-shaped fighting grounds for the arena and the Ludus (the pit's seeded random cave stays as "Offene Grube").
// Each stage fills the walled yard of arenaPit() with a shape that changes how fights are fought: chokepoints, bridges over lava, cover for archers.
// A stage returns the two camps {A:[x,y], B:[x,y]}; the rest of the match set-up is the same as everywhere.
const ARENA_STAGE_LIST=[['choke','Engpass'],['bridge','Brücke über Lava'],['ring','Ring'],['island','Lavainsel'],['pillars','Säulenhalle'],['lanes','Gassen']];
function arenaStageBuild(g,kind,dims){
  arenaPit(g,dims);
  const f=({ S:0.5, M:0.75, L:1 })[dims]||0.5, w=Math.round((WORLD_COLS-4)*f), h=Math.round((WORLD_ROWS-4)*f), x0=(WORLD_COLS-w)>>1, y0=(WORLD_ROWS-h)>>1;
  const reset=t=>{ t.gold=false; t.ore=false; t.gem=false; t.water=false; t.lava=false; t.castle=false; t.crystal=false; t.crystalFloor=false; t.goldPile=0; t.orePile=0; t.reinforced=false; t.marked=false; t.room=null; t.natural=true; };
  const inside=(x,y)=>x>=x0&&y>=y0&&x<x0+w&&y<y0+h;
  const floor=(x,y)=>{ if(!inside(x,y)) return; const t=g[y][x]; t.type='floor'; reset(t); };
  const wall=(x,y)=>{ if(!inside(x,y)) return; const t=g[y][x]; t.type='bedrock'; reset(t); };
  const lava=(x,y)=>{ if(!inside(x,y)) return; const t=g[y][x]; t.type='water'; reset(t); t.lava=true; t.natural=false; };
  const bridge=(x,y)=>{ if(!inside(x,y)) return; const t=g[y][x]; t.type='floor'; reset(t); t.lava=true; t.room='bridge'; t.owned=true; t.natural=false; };
  const rect=(fn,xa,ya,xb,yb)=>{ for(let y=ya;y<=yb;y++) for(let x=xa;x<=xb;x++) fn(x,y); };
  rect(floor,x0,y0,x0+w-1,y0+h-1);
  const cx=x0+(w>>1), cy=y0+(h>>1), L=x0+2, R=x0+w-3, T=y0+1, Bt=y0+h-2;
  let A=[L,cy], B=[R,cy];
  if(kind==='choke'){
    // a wall across the middle with one narrow gap, and a few pillars on each side
    rect(wall,cx,y0,cx,y0+h-1); rect(floor,cx,cy-1,cx,cy);
    [[-6,-3],[-6,3],[-3,0],[6,-3],[6,3],[3,0]].forEach(([dx,dy])=>wall(cx+dx,cy+dy));
  } else if(kind==='bridge'){
    // two platforms over a river of lava; two narrow bridges
    const lw=Math.max(5,Math.round(w/4)); rect(lava,cx-(lw>>1),y0,cx+(lw>>1),y0+h-1);
    [cy-Math.round(h/4),cy+Math.round(h/4)].forEach(by=>rect(bridge,cx-(lw>>1),by,cx+(lw>>1),by));
  } else if(kind==='ring'){
    // a big block in the middle: the fight goes round it
    const rw=Math.max(5,Math.round(w/3)), rh=Math.max(4,Math.round(h/2)); rect(wall,cx-(rw>>1),cy-(rh>>1),cx+(rw>>1),cy+(rh>>1));
  } else if(kind==='island'){
    // a lava moat with an island in the middle, four bridges; the camps stand on the outer ring
    const mw=Math.round(w/3), mh=Math.round(h/3); rect(lava,cx-mw,cy-mh,cx+mw,cy+mh);
    rect(floor,cx-(mw>>1),cy-(mh>>1),cx+(mw>>1),cy+(mh>>1));
    rect(bridge,cx-mw,cy,cx-(mw>>1)-1,cy); rect(bridge,cx+(mw>>1)+1,cy,cx+mw,cy); rect(bridge,cx,cy-mh,cx,cy-(mh>>1)-1); rect(bridge,cx,cy+(mh>>1)+1,cx,cy+mh);
  } else if(kind==='pillars'){
    for(let y=y0+2;y<y0+h-1;y+=3) for(let x=x0+4;x<x0+w-3;x+=4) if(Math.abs(x-cx)>2||Math.abs(y-cy)>2) wall(x+((y-y0)%6===2?2:0),y);
  } else if(kind==='lanes'){
    // three lanes divided by walls that have gaps near the ends and in the middle
    const gy1=y0+Math.round(h/3), gy2=y0+Math.round(2*h/3);
    [gy1,gy2].forEach(y=>{ rect(wall,x0+3,y,x0+w-4,y); rect(floor,cx-1,y,cx,y); rect(floor,x0+5,y,x0+6,y); rect(floor,x0+w-7,y,x0+w-6,y); });
    A=[L,cy]; B=[R,cy];
  }
  // the camps must stand on ground
  const nearFloor=([x,y])=>{ for(let r=0;r<8;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ const t=g[y+dy]&&g[y+dy][x+dx]; if(t&&t.type==='floor'&&t.room!=='bridge') return [x+dx,y+dy]; } return [x,y]; };
  return { A:nearFloor(A), B:nearFloor(B) };
}
