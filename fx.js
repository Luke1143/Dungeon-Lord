// Particle effects: one small system for everything that bursts, puffs and sparkles.
// New effect = new entry in RECIPES. The game calls FX.emit(type, x, y, opts) at the moment something happens;
// the renderers (2D canvas, 3D view) only draw FX.particles. Cosmetic only: uses its own random numbers, never Math.random(),
// so effects can not change the outcome of a seeded simulation.
const FX=(()=>{
  const particles=[], stains=[], MAX=420, MAX_STAINS=320;
  let solidAt=()=>false;   // set by the game: is this tile a wall?
  let seed=1337;
  const rnd=()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  const between=(a,b)=>a+(b-a)*rnd();
  const pick=arr=>arr[Math.floor(rnd()*arr.length)];
  // p: x,y tile position (centre of the tile = +0.5), z height in tiles, v* speed in tiles/s, grav, drag, grow (size per s),
  // life in s, size in tiles, color, shape 'chip' (square) | 'puff' (round), fade (alpha at birth, shrinks to 0)
  function add(p){ if(particles.length>=MAX) particles.shift(); particles.push(Object.assign({ z:0.3, vx:0, vy:0, vz:0, grav:0, drag:0, grow:0, age:0, life:0.8, size:0.06, color:'#fff', shape:'chip', alpha:1 },p)); }
  const shade=(hex,amt)=>{ const m=/^#?([0-9a-f]{6})$/i.exec(hex); if(!m) return hex; const n=parseInt(m[1],16); const f=v=>Math.max(0,Math.min(255,Math.round(v+amt))); return '#'+[(n>>16)&255,(n>>8)&255,n&255].map(f).map(v=>v.toString(16).padStart(2,'0')).join(''); };

  const RECIPES={
    // a few chips while a wall is being hit
    chip(x,y,o){ for(let i=0;i<2;i++){ const a=rnd()*6.28; add({ x:x+0.5, y:y+0.5, z:between(0.4,0.8), vx:Math.cos(a)*1.1, vy:Math.sin(a)*1.1, vz:between(0.8,1.8), grav:7, life:between(0.35,0.6), size:between(0.04,0.07), color:shade(o.color||'#6b5a48',pick([-25,0,25])) }); } },
    // the block breaks: fragments fly out, a dust cloud rises
    dig(x,y,o){
      const c=o.color||'#6b5a48';
      for(let i=0;i<14;i++){ const a=rnd()*6.28, s=between(0.8,2.4); add({ x:x+0.5, y:y+0.5, z:between(0.3,0.9), vx:Math.cos(a)*s, vy:Math.sin(a)*s, vz:between(1,3.2), grav:8, drag:0.4, life:between(0.5,1.0), size:between(0.05,0.1), color:shade(c,pick([-30,-10,10,30])) }); }
      for(let i=0;i<7;i++){ const a=rnd()*6.28, s=between(0.1,0.6); add({ x:x+0.5+Math.cos(a)*0.25, y:y+0.5+Math.sin(a)*0.25, z:between(0.2,0.6), vx:Math.cos(a)*s, vy:Math.sin(a)*s, vz:between(0.2,0.6), drag:1.2, grow:0.5, life:between(0.7,1.3), size:between(0.22,0.34), color:shade('#8a7a68',pick([-10,0,15])), shape:'puff', alpha:0.55 }); }
    },
    // area conquered: a small magical cloud with rising sparkles
    claim(x,y,o){
      for(let i=0;i<7;i++){ const a=rnd()*6.28, s=between(0.05,0.35); add({ x:x+0.5+Math.cos(a)*0.2, y:y+0.5+Math.sin(a)*0.2, z:between(0.1,0.3), vx:Math.cos(a)*s, vy:Math.sin(a)*s, vz:between(0.25,0.55), drag:0.8, grow:0.45, life:between(0.9,1.5), size:between(0.2,0.3), color:pick(['#9a6ad0','#b48ae8','#7b4bb0']), shape:'puff', alpha:0.5 }); }
      for(let i=0;i<12;i++){ const a=rnd()*6.28, r=between(0.1,0.4); add({ x:x+0.5+Math.cos(a)*r, y:y+0.5+Math.sin(a)*r, z:between(0.05,0.3), vx:Math.cos(a+1.57)*0.5, vy:Math.sin(a+1.57)*0.5, vz:between(0.5,1.3), drag:0.3, life:between(0.7,1.3), size:between(0.03,0.055), color:pick(['#f4d03f','#fff2a0','#d8b8ff','#ffffff']) }); }
    },
    reinforce(x,y,o){ for(let i=0;i<8;i++){ const a=rnd()*6.28; add({ x:x+0.5, y:y+0.5, z:between(0.3,0.9), vx:Math.cos(a)*1.4, vy:Math.sin(a)*1.4, vz:between(0.5,1.6), grav:6, life:between(0.25,0.5), size:0.04, color:pick(['#c4d4e4','#9db4c9','#ffffff']) }); } },
    build(x,y,o){
      for(let i=0;i<6;i++){ const a=rnd()*6.28, s=between(0.1,0.5); add({ x:x+0.5, y:y+0.5, z:between(0.1,0.4), vx:Math.cos(a)*s, vy:Math.sin(a)*s, vz:between(0.2,0.5), drag:1.2, grow:0.4, life:between(0.6,1.1), size:between(0.18,0.28), color:'#b0a088', shape:'puff', alpha:0.45 }); }
      for(let i=0;i<6;i++){ const a=rnd()*6.28; add({ x:x+0.5, y:y+0.5, z:0.3, vx:Math.cos(a)*1.0, vy:Math.sin(a)*1.0, vz:between(1,2), grav:7, life:between(0.4,0.7), size:between(0.04,0.07), color:pick(['#8a5a34','#b07a4a','#d4af37']) }); }
    },
    // knocked out or killed
    poof(x,y,o){ for(let i=0;i<6;i++){ const a=rnd()*6.28, s=between(0.1,0.5); add({ x:x+0.5, y:y+0.5, z:between(0.2,0.5), vx:Math.cos(a)*s, vy:Math.sin(a)*s, vz:between(0.3,0.8), drag:1.0, grow:0.5, life:between(0.6,1.0), size:between(0.2,0.3), color:'#c8c0b8', shape:'puff', alpha:0.5 }); } },
    // a shot: small bright specks flying from the shooter to the target
    shot(x,y,o){ const dx=o.tx-x, dy=o.ty-y, L=Math.hypot(dx,dy)||1, v=16; for(let i=0;i<5;i++) add({ x:x+0.5+dx/L*0.3*i, y:y+0.5+dy/L*0.3*i, z:0.5, vx:dx/L*v, vy:dy/L*v, life:L/v, size:0.05, color:i%2?'#fff6c0':'#ffd870' }); },
    hit(x,y,o){ for(let i=0;i<4;i++){ const a=rnd()*6.28; add({ x:x+0.5, y:y+0.5, z:between(0.3,0.7), vx:Math.cos(a)*1.2, vy:Math.sin(a)*1.2, vz:between(0.5,1.5), grav:6, life:between(0.2,0.4), size:0.045, color:pick(['#ff6a4a','#ffd23f','#ffffff']) }); } }
  };

  // ---- blood and gibs: fat blobs fly out of a hit, stick to floor and walls for a while ----
  const dim=(hex,amt)=>shade(hex,amt);
  function addStain(st){ if(stains.length>=MAX_STAINS) stains.shift(); stains.push(Object.assign({ age:0, life:110 },st)); }
  // dx,dy: direction of the blow (away from the attacker); amount: number of blobs
  function blood(x,y,dx,dy,amount,color,opts){
    const o=opts||{}, L=Math.hypot(dx,dy)||1; dx/=L; dy/=L;
    for(let i=0;i<amount;i++){
      const a=Math.atan2(dy,dx)+between(-0.9,0.9), s=between(1.2,(o.power||3.2));
      add({ blood:true, x:x+0.5, y:y+0.5, z:between(0.35,0.8), vx:Math.cos(a)*s, vy:Math.sin(a)*s, vz:between(0.8,3), grav:9.5, drag:0.15, life:2, size:between(0.05,o.big?0.17:0.12), color:dim(color,pick([-30,-10,0,15])), shape:'blob' });
    }
  }
  function gibs(x,y,color,bone,amount){
    const n=amount||8;
    for(let i=0;i<n;i++){ const a=rnd()*6.28, s=between(1,3.4); add({ blood:true, bounce:0.35, x:x+0.5, y:y+0.5, z:between(0.3,0.7), vx:Math.cos(a)*s, vy:Math.sin(a)*s, vz:between(2,5), grav:11, drag:0.2, life:2.2, size:between(0.08,0.17), color:i%3===0&&bone?'#e8dcc8':dim(color,pick([-45,-25,-5])), shape:'chip' }); }
    blood(x,y,0,0.01,12,color,{power:3.6,big:true});
    for(let i=0;i<4;i++) addStain({ kind:'floor', x:x+0.5+between(-0.35,0.35), y:y+0.5+between(-0.35,0.35), size:between(0.18,0.34), color:dim(color,-20) });
  }
  function landed(p){ addStain({ kind:'floor', x:p.x, y:p.y, size:p.size*between(2.2,3.4), color:dim(p.color,-15), life:between(90,140) }); }
  function hitWall(p,tx,ty,nx,ny){
    const wx=nx? tx+0.5+nx*0.5 : p.x, wz=ny? ty+0.5+ny*0.5 : p.y;
    addStain({ kind:'wall', tx, ty, nx, ny, x:wx, y:wz, h:Math.max(0.12,Math.min(0.95,p.z)), size:p.size*between(1.2,1.9), color:dim(p.color,-10), life:between(110,170) });
  }

  function emit(type,x,y,opts){ const r=RECIPES[type]; if(r) r(x,y,opts||{}); }
  function update(dt){
    if(dt<=0) return;
    updateStains(dt);
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i]; p.age+=dt;
      if(p.age>=p.life){ particles.splice(i,1); continue; }
      const damp=Math.max(0,1-p.drag*dt);
      p.vx*=damp; p.vy*=damp; p.vz=p.vz*damp-p.grav*dt;
      const ox=p.x, oy=p.y;
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.z+=p.vz*dt;
      if(p.blood){
        const tx=Math.floor(p.x), ty=Math.floor(p.y), otx=Math.floor(ox), oty=Math.floor(oy);
        if((tx!==otx||ty!==oty) && solidAt(tx,ty)){
          if(p.bounce){ if(tx!==otx) p.vx=-p.vx*0.5; if(ty!==oty) p.vy=-p.vy*0.5; p.x=ox; p.y=oy; }
          else { const nx=tx!==otx?otx-tx:0, ny=(tx===otx||Math.abs(p.vy)>Math.abs(p.vx))&&ty!==oty?oty-ty:0; hitWall(p,tx,ty,nx,nx?0:ny); particles.splice(i,1); continue; }
        }
        if(p.z<=0.02){
          if(p.bounce && p.vz<-0.8){ p.z=0.02; p.vz=-p.vz*p.bounce; p.vx*=0.7; p.vy*=0.7; if(rnd()<0.5) landed(p); }
          else { landed(p); particles.splice(i,1); continue; }
        }
      } else if(p.z<0.02 && p.grav>0){ p.z=0.02; p.vz=0; p.vx*=0.5; p.vy*=0.5; }
      p.size+=p.grow*dt;
    }
  }
  // current look of a particle: { x, y, z, size, color, alpha, shape }
  function updateStains(dt){ for(let i=stains.length-1;i>=0;i--){ stains[i].age+=dt; if(stains[i].age>=stains[i].life) stains.splice(i,1); } }
  const stainView=st=>({ where:st.kind, x:st.x, y:st.y, h:st.h, nx:st.nx, ny:st.ny, tx:st.tx, ty:st.ty, size:st.size, color:st.color, alpha:Math.min(1,(st.life-st.age)/(st.life*0.25))*0.9 });
  const view=p=>({ x:p.x, y:p.y, z:p.z, size:p.size, color:p.color, alpha:p.alpha*Math.min(1,(1-p.age/p.life)*1.8), shape:p.shape });
  return { particles, stains, emit, blood, gibs, update, updateStains, stainView, set solidAt(f){ solidAt=f; }, reset(){ particles.length=0; stains.length=0; }, view, RECIPES, get count(){ return particles.length; } };
})();
