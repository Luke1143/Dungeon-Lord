// Procedural dungeons from the campaign's own building blocks: the tile grid of index.html (emptyTile), its room types (ROOM_TYPES; the props of a room
// come from its type and size, as in the campaign), reinforced walls, corridors. The Ludus builds each region's dungeon with it (ludus-hub.js);
// later the campaign's AI dungeon lords shall build theirs the same way (docs/design.md).
//
// dungeonGen({ seed, rooms:[{ id, type, w, h, pool, site }], loops, cell:[w,h] })
//   type: a campaign room type (or null: bare floor); pool: a basin of water inside (the bath); site: not built yet (unclaimed floor, no room type)
//   returns { grid, cols, rows, rooms:{ id:{ x, y, w, h, cx, cy, type } } } — x, y the room's top left floor tile, cx, cy its middle
// Deterministic by seed. The rooms lie on a loose grid of cells (shuffled by the seed, shifted a little in their cells); a spanning tree of corridors
// joins neighbouring cells, `loops` more corridors make rings. A corridor never cuts through a room: it starts and ends at a room's edge.
function dungeonGen(opt){
  const rnd=seededRng(typeof opt.seed==='number'?opt.seed:dungeonHash(String(opt.seed||'dungeon')));
  const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
  const list=opt.rooms.slice();
  for(let i=list.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [list[i],list[j]]=[list[j],list[i]]; }
  const n=list.length, gc=Math.max(1,Math.ceil(Math.sqrt(n*1.4))), gr=Math.ceil(n/gc);
  const cw=opt.cell?opt.cell[0]:Math.max(...list.map(r=>r.w))+5, ch=opt.cell?opt.cell[1]:Math.max(...list.map(r=>r.h))+5;       // a cell: the widest room and room for a corridor around it (fixed: rooms keep their cells when they grow)
  const cols=gc*cw+2, rows=gr*ch+2, g=[];
  for(let y=0;y<rows;y++){ const row=[]; for(let x=0;x<cols;x++) row.push(emptyTile()); g.push(row); }
  const floor=(x,y,room)=>{ const t=g[y][x]; t.type='floor'; t.owned=true; t.natural=false; t.discovered=true; t.room=room||null; };
  const out={};
  // the rooms, each in its cell (a short last row is centred)
  list.forEach((r,i)=>{
    const cx=i%gc, cy=Math.floor(i/gc), inRow=cy===gr-1?n-cy*gc:gc, off=Math.floor((gc-inRow)*cw/2);
    const x=1+off+cx*cw+ri(2,cw-r.w-2), y=1+cy*ch+ri(2,ch-r.h-2);
    for(let yy=y;yy<y+r.h;yy++) for(let xx=x;xx<x+r.w;xx++){
      floor(xx,yy,r.site?null:r.type);
      if(r.site) g[yy][xx].owned=false;
      if(r.pool && xx>x && yy>y && xx<x+r.w-1 && yy<y+r.h-1){ const t=g[yy][xx]; t.type='water'; t.room=null; }
    }
    out[r.id]={ x, y, w:r.w, h:r.h, cx:x+(r.w-1)/2, cy:y+(r.h-1)/2, type:r.site?null:r.type, cell:[cx,cy] };
  });
  // corridors: a spanning tree over neighbouring cells, then a few loops
  const ids=list.map(r=>r.id), at={}; ids.forEach(id=>{ at[out[id].cell.join(',')]=id; });
  const edges=[]; ids.forEach(id=>{ const [cx,cy]=out[id].cell; [[1,0],[0,1]].forEach(([dx,dy])=>{ const o=at[(cx+dx)+','+(cy+dy)]; if(o) edges.push([id,o,rnd()]); }); });
  // a short last row: its rooms also reach up to the cell above them that is nearest
  ids.forEach(id=>{ const [cx,cy]=out[id].cell; if(cy>0&&!at[cx+','+(cy-1)]){ let best=null, bd=1e9; ids.forEach(o=>{ if(out[o].cell[1]!==cy-1) return; const d=Math.abs(out[o].cx-out[id].cx); if(d<bd){ bd=d; best=o; } }); if(best) edges.push([id,best,rnd()]); } });
  edges.sort((a,b)=>a[2]-b[2]);
  const root={}; const find=a=>root[a]===undefined||root[a]===a?(root[a]=a):(root[a]=find(root[a]));
  const tree=[], spare=[]; edges.forEach(e=>{ const a=find(e[0]), b=find(e[1]); if(a!==b){ root[a]=b; tree.push(e); } else spare.push(e); });
  const links=tree.concat(spare.slice(0,Math.max(0,opt.loops===undefined?2:opt.loops)));
  const inRoom=(x,y)=>ids.some(id=>{ const r=out[id]; return x>=r.x&&y>=r.y&&x<r.x+r.w&&y<r.y+r.h; });
  const dig=(x,y)=>{ if(x<1||y<1||x>=cols-1||y>=rows-1||inRoom(x,y)) return; floor(x,y,null); };
  // a door on the side of a room that faces the other one, then an L to the other's door
  const door=(r,o)=>{ const dx=o.cx-r.cx, dy=o.cy-r.cy;
    if(Math.abs(dx)>=Math.abs(dy)) return { x:dx>0?r.x+r.w:r.x-1, y:Math.round(Math.max(r.y,Math.min(r.y+r.h-1,r.cy))), h:true };
    return { x:Math.round(Math.max(r.x,Math.min(r.x+r.w-1,r.cx))), y:dy>0?r.y+r.h:r.y-1, h:false }; };
  links.forEach(([a,b])=>{
    const A=out[a], B=out[b], p=door(A,B), q=door(B,A);
    let x=p.x, y=p.y; dig(x,y);
    const stepX=()=>{ while(x!==q.x){ x+=Math.sign(q.x-x); dig(x,y); } }, stepY=()=>{ while(y!==q.y){ y+=Math.sign(q.y-y); dig(x,y); } };
    if(p.h){ const mid=Math.round((p.x+q.x)/2); while(x!==mid){ x+=Math.sign(mid-x); dig(x,y); } stepY(); stepX(); }
    else { const mid=Math.round((p.y+q.y)/2); while(y!==mid){ y+=Math.sign(mid-y); dig(x,y); } stepX(); stepY(); }
  });
  // the walls next to the floor are reinforced (the campaign's look of a claimed dungeon); the border is bedrock; one sees what lies near the floor
  const open=t=>t.type==='floor'||t.type==='water';
  for(let y=0;y<rows;y++) for(let x=0;x<cols;x++){ const t=g[y][x];
    if(x===0||y===0||x===cols-1||y===rows-1){ t.type='bedrock'; t.room=null; t.owned=false; continue; }
    if(t.type!=='rock') continue;
    let near=false, touch=false; for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++){ const m=g[y+dy]&&g[y+dy][x+dx]; if(m&&open(m)){ near=true; if(Math.abs(dx)+Math.abs(dy)===1) touch=true; } }
    if(touch) t.reinforced=true;
    t.seen=near; }
  for(let y=0;y<rows;y++) for(let x=0;x<cols;x++){ const t=g[y][x]; if(open(t)||t.type==='bedrock') t.seen=true; }
  return { grid:g, cols, rows, rooms:out };
}
function dungeonHash(s){ let h=2166136261; for(const ch of String(s)){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }
// a world state around a generated grid that the campaign's draw code accepts (the parts of makeDefaultState it reads)
function dungeonState(d){
  return { grid:d.grid, imps:[], gold:0, eventLog:[], creatures:[], hatcheries:{}, tickCount:0, corpses:[], libraryBooks:{}, looseItems:[], effects:[], ore:0, iron:0,
    storageFilters:{}, smelters:{}, forges:{}, arenas:{}, storageWarnings:{}, graves:{}, war:typeof newWar==='function'?newWar():{} };
}
