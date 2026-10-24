// Level terrain: sizes, layouts and special features (design: "Die Level sind klein und gleichförmig").
// A region type names a `dims` (map size) and a `layout` (how its caves are shaped) in its `gen` table; new layout = a new entry in LAYOUTS.
// The functions work on the tile grid `g` and use the globals of index.html (WORLD_COLS/ROWS, levelGen, randInt, growCaveSystem ...).
const LEVEL_DIMS={ S:[56,38], M:[68,46], L:[84,58], XL:[96,64] };
const DEFAULT_DIMS=[48,32];

// everything depends on the map's area: veins, lakes and distances grow with it
const areaFactor=()=> (WORLD_COLS*WORLD_ROWS)/(DEFAULT_DIMS[0]*DEFAULT_DIMS[1]);

function terrainInZone(x,y){ return x>=2 && y>=2 && x<WORLD_COLS-2 && y<WORLD_ROWS-2 && !(x<=7 && y<=7); }   // the rock around the throne stays
function carveNatural(g,x,y){
  if(!terrainInZone(x,y)) return;
  const t=g[y][x];
  if(t.type==='rock' && !t.room){ t.type='floor'; t.owned=false; t.natural=true; t.gold=false; t.ore=false; }
}
function carveRect(g,x0,y0,x1,y1){ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) carveNatural(g,x,y); }
// a walker from (x,y) to (tx,ty) with jogs, `w` tiles wide
function carveTunnel(g,x,y,tx,ty,w,jog){
  for(let guard=0; guard<600 && (x!==tx||y!==ty); guard++){
    carveRect(g,x,y,x+w-1,y+w-1);
    if(Math.random()<jog){ if(Math.random()<0.5) y+=Math.random()<0.5?1:-1; else x+=Math.random()<0.5?1:-1; }
    else if(x!==tx && (y===ty || Math.random()<0.55)) x+= tx>x?1:-1; else y+= ty>y?1:-1;
    x=Math.max(2,Math.min(WORLD_COLS-3,x)); y=Math.max(2,Math.min(WORLD_ROWS-3,y));
  }
  carveRect(g,tx,ty,tx+w-1,ty+w-1);
}

const LAYOUTS={
  // organic caverns joined by winding tunnels (the original generator)
  caverns:(g)=>{ growCaveSystem(g); },

  // mines: long straight galleries with shafts between them and chambers at the crossings
  tunnels:(g)=>{
    const rows=Math.max(2,Math.round(WORLD_ROWS/11)), ys=[];
    for(let r=0;r<rows;r++){
      const y=Math.round(6+(WORLD_ROWS-12)*(r+0.5)/rows)+randInt(-1,1); ys.push(y);
      carveTunnel(g,3,y,WORLD_COLS-4,y+randInt(-2,2),Math.random()<0.4?2:1,0.12);
    }
    for(let r=0;r+1<ys.length;r++){
      const shafts=Math.max(2,Math.round(WORLD_COLS/16));
      for(let s=0;s<shafts;s++){ const x=randInt(8,WORLD_COLS-6); carveTunnel(g,x,ys[r],x+randInt(-3,3),ys[r+1],1,0.1); }
    }
    ys.forEach(y=>{ for(let i=0,n=Math.max(2,Math.round(WORLD_COLS/18));i<n;i++){ const x=randInt(9,WORLD_COLS-12), w=randInt(4,6), h=randInt(3,5); carveRect(g,x,y-Math.floor(h/2),x+w,y+Math.ceil(h/2)); } });
    growCaveSystemSmall(g,0.34);
  },

  // fortress: rectangular halls from a binary split, joined by straight corridors, bedrock pillars inside the big ones
  halls:(g)=>{
    const leaves=[];
    const split=(x0,y0,x1,y1,depth)=>{
      const w=x1-x0+1, h=y1-y0+1;
      if(depth>=5 || (w<18 && h<14) || Math.random()<0.1 && depth>=3){ leaves.push({ x0,y0,x1,y1 }); return; }
      const horiz = w<h*1.2 ? true : (h<w*0.8 ? false : Math.random()<0.5);
      if(horiz && h>=14){ const c=randInt(y0+6,y1-6); split(x0,y0,x1,c-1,depth+1); split(x0,c,x1,y1,depth+1); }
      else if(!horiz && w>=18){ const c=randInt(x0+8,x1-8); split(x0,y0,c-1,y1,depth+1); split(c,y0,x1,y1,depth+1); }
      else leaves.push({ x0,y0,x1,y1 });
    };
    split(3,3,WORLD_COLS-4,WORLD_ROWS-4,0);
    leaves.forEach(l=>{
      const w=randInt(Math.min(5,l.x1-l.x0-2),Math.max(5,l.x1-l.x0-2)), h=randInt(Math.min(4,l.y1-l.y0-2),Math.max(4,l.y1-l.y0-2));
      l.rx=randInt(l.x0+1,Math.max(l.x0+1,l.x1-w-1)); l.ry=randInt(l.y0+1,Math.max(l.y0+1,l.y1-h-1)); l.rw=w; l.rh=h;
      carveRect(g,l.rx,l.ry,l.rx+w-1,l.ry+h-1);
      l.cx=l.rx+(w>>1); l.cy=l.ry+(h>>1);
      if(w>=8 && h>=6) for(let px=l.rx+2;px<l.rx+w-2;px+=3) for(let py=l.ry+2;py<l.ry+h-2;py+=3){ if(terrainInZone(px,py) && Math.random()<0.7){ const t=g[py][px]; t.type='bedrock'; t.natural=false; } }
    });
    // neighbours in the list share a wall: join each hall to the next, plus a few extra loops
    for(let i=1;i<leaves.length;i++) carveTunnel(g,leaves[i-1].cx,leaves[i-1].cy,leaves[i].cx,leaves[i].cy,1,0);
    for(let i=0;i<Math.floor(leaves.length/3);i++){ const a=leaves[randInt(0,leaves.length-1)], b=leaves[randInt(0,leaves.length-1)]; if(a!==b) carveTunnel(g,a.cx,a.cy,b.cx,b.cy,1,0.05); }
  },

  // canyon: two or three wide meandering passages from edge to edge with caves along them
  canyon:(g)=>{
    const n=WORLD_ROWS>=50?3:2;
    for(let i=0;i<n;i++){
      const y0=Math.round(10+(WORLD_ROWS-18)*(i+0.5)/n), w=randInt(3,4);
      let y=y0;
      for(let x=3;x<WORLD_COLS-3;x++){
        carveRect(g,x,y,x+1,y+w-1);
        if(Math.random()<0.3) y=Math.max(4,Math.min(WORLD_ROWS-4-w,y+(Math.random()<0.5?-1:1)));
      }
      // wide bays
      for(let b=0,m=Math.round(WORLD_COLS/14);b<m;b++){ const x=randInt(6,WORLD_COLS-10); carveRect(g,x,y0-randInt(1,3),x+randInt(4,7),y0+w+randInt(1,3)); }
    }
    for(let i=0;i+1<n;i++){ const x=randInt(10,WORLD_COLS-10); carveTunnel(g,x,12+i*(WORLD_ROWS/n),x+randInt(-4,4),12+(i+1)*(WORLD_ROWS/n),2,0.15); }
    growCaveSystemSmall(g,0.36);
  }
};

// the cellular generator at another density, used to add side caves to the structured layouts
function growCaveSystemSmall(g,density){
  const old=levelGen.caveDensity; levelGen.caveDensity=density;
  try{ growCaveSystem(g); } finally { if(old===undefined) delete levelGen.caveDensity; else levelGen.caveDensity=old; }
}

// sealed treasure chambers: hidden pockets of rock with gold (and sometimes a gem). They are found by digging, not by the heroes.
function growVaults(g,count){
  for(let i=0;i<count;i++){
    for(let tries=0;tries<150;tries++){
      const w=randInt(3,5), h=randInt(3,4), x=randInt(4,WORLD_COLS-w-4), y=randInt(4,WORLD_ROWS-h-4);
      if(Math.abs(x-2)+Math.abs(y-2)<16) continue;
      let ok=true;
      for(let yy=y-2;yy<=y+h+1&&ok;yy++) for(let xx=x-2;xx<=x+w+1;xx++){ const t=g[yy][xx]; if(t.type!=='rock'||t.room||t.gold||t.ore||t.gem||t.natural){ ok=false; break; } }
      if(!ok) continue;
      carveRect(g,x,y,x+w-1,y+h-1);
      const cells=[]; for(let yy=y;yy<y+h;yy++) for(let xx=x;xx<x+w;xx++) cells.push([xx,yy]);
      cells.sort(()=>Math.random()-0.5).slice(0,Math.max(2,Math.floor(cells.length/3))).forEach(([xx,yy])=>{ g[yy][xx].goldPile=randInt(20,50); });
      break;
    }
  }
}

function growTerrainLayout(g){
  const fn=LAYOUTS[levelGen.layout]||LAYOUTS.caverns;
  fn(g);
  growVaults(g, genRange(levelGen.vaults,[1,2])+Math.floor(areaFactor()/2));
}

// ---- features laid over the finished terrain (after rivers and lakes) ----
const farFromThrone=(x,y,d)=> Math.abs(x-2)+Math.abs(y-2)>=d;
function blobCells(x,y,size){
  const cells=[[x,y]], seen=new Set([x+','+y]);
  for(let i=0;i<cells.length && cells.length<size;i++){
    const [cx,cy]=cells[i];
    [[1,0],[-1,0],[0,1],[0,-1]].sort(()=>Math.random()-0.5).forEach(([dx,dy])=>{
      const nx=cx+dx, ny=cy+dy, k=nx+','+ny;
      if(cells.length<size && !seen.has(k) && terrainInZone(nx,ny) && Math.random()<0.8){ seen.add(k); cells.push([nx,ny]); }
    });
  }
  return cells;
}
// lava: like water an obstacle for walkers (only a bridge crosses it), but nobody swims and nobody bathes in it
function growLava(g,count){
  for(let i=0;i<count;i++){
    let x,y,tries=0; do{ x=randInt(8,WORLD_COLS-8); y=randInt(8,WORLD_ROWS-8); tries++; } while(!farFromThrone(x,y,14) && tries<60);
    blobCells(x,y,randInt(7,16)).forEach(([cx,cy])=>{ const t=g[cy][cx]; if((t.type==='rock'||t.type==='floor') && !t.room && t.type!=='bedrock'){ t.type='water'; t.lava=true; t.natural=false; t.owned=false; t.gold=false; t.ore=false; } });
  }
}
// crystal caves: a cavern whose walls are crystal veins (a richer kind of gold, shown in blue)
function growCrystalCave(g,count){
  for(let i=0;i<count;i++){
    let cx,cy,tries=0; do{ cx=randInt(10,WORLD_COLS-10); cy=randInt(10,WORLD_ROWS-10); tries++; } while(!farFromThrone(cx,cy,16) && tries<60);
    const r=randInt(4,6);
    for(let y=cy-r;y<=cy+r;y++) for(let x=cx-r;x<=cx+r;x++){
      if(!terrainInZone(x,y)) continue; const d=Math.hypot(x-cx,y-cy); if(d>r) continue;
      const t=g[y][x];
      if(d<r-1.5){ if(t.type==='rock' && !t.room){ t.type='floor'; t.natural=true; t.owned=false; t.gold=false; t.ore=false; t.crystalFloor=true; } else if(t.type==='floor' && t.natural) t.crystalFloor=true; }
      else if(t.type==='rock' && !t.room && !t.gem && Math.random()<0.75){ t.gold=true; t.crystal=true; t.ore=false; }
    }
  }
}
// ruins: an old walled hall in the rock, found by digging; it keeps gold and a relic (an item lying on the floor)
function growRuins(g,count){
  for(let i=0;i<count;i++){
    for(let tries=0;tries<150;tries++){
      const w=randInt(7,9), h=randInt(5,6), x=randInt(4,WORLD_COLS-w-4), y=randInt(4,WORLD_ROWS-h-4);
      if(!farFromThrone(x,y,18)) continue;
      let ok=true;
      for(let yy=y-1;yy<=y+h&&ok;yy++) for(let xx=x-1;xx<=x+w;xx++){ const t=g[yy][xx]; if(t.type!=='rock'||t.room||t.gold||t.ore||t.gem||t.natural){ ok=false; break; } }
      if(!ok) continue;
      for(let yy=y-1;yy<=y+h;yy++) for(let xx=x-1;xx<=x+w;xx++){
        const t=g[yy][xx], wall=(yy===y-1||yy===y+h||xx===x-1||xx===x+w);
        if(wall){ t.castle=true; continue; }
        t.type='floor'; t.natural=true; t.owned=false; t.castle=true;
        if((xx-x)%3===1 && (yy-y)%2===1 && xx>x && xx<x+w-1 && yy>y && yy<y+h-1){ t.type='bedrock'; t.natural=false; t.castle=true; }   // pillars
      }
      const free=[]; for(let yy=y;yy<y+h;yy++) for(let xx=x;xx<x+w;xx++) if(g[yy][xx].type==='floor') free.push([xx,yy]);
      free.sort(()=>Math.random()-0.5);
      free.slice(0,3).forEach(([xx,yy])=>{ g[yy][xx].goldPile=randInt(20,45); });
      const [rx,ry]=free[3]; g[ry][rx].relic=true;
      break;
    }
  }
}
function growTerrainFeatures(g){
  const k=Math.sqrt(areaFactor()), n=r=>Math.max(0,Math.round(r*k));
  growLava(g, n(genRange(levelGen.lava,[0,1])));
  growCrystalCave(g, n(genRange(levelGen.crystal,[0,1])));
  growRuins(g, n(genRange(levelGen.ruins,[0,1])));
}
// the Dungeon Lord's throne is always generated in the top-left corner; the finished map is then mirrored at random so every corner gets its turn
function mirrorLevel(g){
  const fx=Math.random()<0.5, fy=Math.random()<0.5;
  if(fy) g.reverse();
  if(fx) g.forEach(r=>r.reverse());
  return { fx, fy, throne:{ x:fx?WORLD_COLS-3:2, y:fy?WORLD_ROWS-3:2 } };
}
// relic tiles become items on the floor (picked by gear tier, mostly fine, sometimes epic)
function placeRelics(g,st){
  const ids=Object.keys(ITEMS).filter(id=>/_(fine|epic)$/.test(id));
  for(let y=0;y<WORLD_ROWS;y++) for(let x=0;x<WORLD_COLS;x++){
    const t=g[y][x]; if(!t.relic) continue; t.relic=false;
    const pool=ids.filter(id=>/_epic$/.test(id)===(Math.random()<0.3));
    st.looseItems.push(looseOf({ id:pool[Math.floor(Math.random()*pool.length)], q:1 }, x, y));
  }
}

// sets the map size for the region about to be generated; returns the growth factor
function setLevelDims(){
  const d=LEVEL_DIMS[levelGen.dims]||DEFAULT_DIMS;
  WORLD_COLS=d[0]; WORLD_ROWS=d[1];
  return areaFactor();
}
