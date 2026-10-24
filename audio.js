// Sound: everything is synthesised with the Web Audio API (noise bursts, filtered tones), no sound files, no third-party assets.
// New sound = new entry in RECIPES. Cosmetic only: it has its own random numbers and never touches the game state.
// SFX.play(name, { x, y, delay }) is positional: volume falls with the distance to the listener (the camera, or the possessed body).
const SFX=(()=>{
  let ac=null, master=null, noiseBuf=null, muted=false, vol=0.55, lx=0, ly=0, voices=0, dripTimer=null;
  const last={};
  try{ muted=localStorage.getItem('dl_muted')==='1'; }catch(e){}
  let seed=4242; const rnd=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
  const between=(a,b)=>a+(b-a)*rnd();

  function ensure(){
    if(ac){ if(ac.state==='suspended') ac.resume(); return ac; }
    try{
      ac=new (window.AudioContext||window.webkitAudioContext)();
      master=ac.createGain(); master.gain.value=muted?0:vol; master.connect(ac.destination);
      noiseBuf=ac.createBuffer(1,ac.sampleRate*1.5,ac.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=rnd()*2-1;
      startAmbient();
    }catch(e){ ac=null; }
    return ac;
  }
  // ---- building blocks ----
  function out(gain,pan,t0){
    const g=ac.createGain(); g.gain.value=gain; let node=g;
    if(ac.createStereoPanner){ const p=ac.createStereoPanner(); p.pan.value=Math.max(-1,Math.min(1,pan)); g.connect(p); node=p; }
    node.connect(master); return g;
  }
  function noise(dst,t,dur,{ type='lowpass', f0=800, f1=null, q=0.8, gain=1, attack=0.004 }={}){
    const src=ac.createBufferSource(); src.buffer=noiseBuf; src.loop=true; src.playbackRate.value=between(0.9,1.1);
    const flt=ac.createBiquadFilter(); flt.type=type; flt.Q.value=q; flt.frequency.setValueAtTime(f0,t); if(f1) flt.frequency.exponentialRampToValueAtTime(f1,t+dur);
    const env=ac.createGain(); env.gain.setValueAtTime(0.0001,t); env.gain.exponentialRampToValueAtTime(gain,t+attack); env.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    src.connect(flt); flt.connect(env); env.connect(dst); src.start(t,between(0,0.5)); src.stop(t+dur+0.02);
  }
  function tone(dst,t,dur,{ type='sine', f0=200, f1=null, gain=0.5, attack=0.004 }={}){
    const o=ac.createOscillator(); o.type=type; o.frequency.setValueAtTime(f0,t); if(f1) o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
    const env=ac.createGain(); env.gain.setValueAtTime(0.0001,t); env.gain.exponentialRampToValueAtTime(gain,t+attack); env.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(env); env.connect(dst); o.start(t); o.stop(t+dur+0.02);
  }
  // ---- the sounds ----
  const RECIPES={
    whoosh:(d,t)=>{ noise(d,t,0.2,{ type:'bandpass', f0:between(350,500), f1:between(1400,2000), q:1.2, gain:0.5, attack:0.05 }); },
    hit:(d,t)=>{ noise(d,t,0.12,{ type:'lowpass', f0:1100, f1:300, gain:0.9 }); tone(d,t,0.13,{ f0:between(130,170), f1:60, gain:0.7 }); },
    crit:(d,t)=>{ RECIPES.hit(d,t); noise(d,t,0.2,{ type:'highpass', f0:2500, gain:0.35 }); tone(d,t,0.3,{ f0:90, f1:40, gain:0.7 }); },
    kill:(d,t)=>{ RECIPES.crit(d,t); noise(d,t+0.05,0.35,{ type:'lowpass', f0:700, f1:150, gain:0.8 }); },
    chop:(d,t)=>{ noise(d,t,0.08,{ type:'highpass', f0:1600, gain:0.7 }); tone(d,t,0.1,{ f0:between(190,240), f1:80, gain:0.55 }); },
    tap:(d,t)=>{ tone(d,t,0.06,{ type:'square', f0:between(850,1000), f1:650, gain:0.25 }); noise(d,t,0.04,{ type:'highpass', f0:3000, gain:0.4 }); },
    stomp:(d,t)=>{ tone(d,t,0.22,{ f0:95, f1:38, gain:0.9 }); noise(d,t,0.16,{ type:'lowpass', f0:500, f1:150, gain:0.7 }); },
    lift:(d,t)=>{ tone(d,t,0.25,{ type:'triangle', f0:180, f1:320, gain:0.3 }); },
    break:(d,t)=>{ noise(d,t,0.4,{ type:'lowpass', f0:1400, f1:200, gain:1 }); tone(d,t,0.3,{ f0:75, f1:35, gain:0.7 }); noise(d,t+0.06,0.2,{ type:'highpass', f0:2000, gain:0.4 }); },
    claim:(d,t)=>{ tone(d,t,0.35,{ f0:520, f1:520, gain:0.3 }); tone(d,t+0.08,0.35,{ f0:780, f1:780, gain:0.25 }); tone(d,t+0.16,0.45,{ f0:1040, f1:1040, gain:0.2 }); },
    build:(d,t)=>{ noise(d,t,0.12,{ type:'bandpass', f0:900, q:2, gain:0.5 }); tone(d,t,0.08,{ type:'square', f0:300, f1:200, gain:0.25 }); },
    step:(d,t)=>{ noise(d,t,0.07,{ type:'lowpass', f0:between(350,600), gain:0.55 }); },
    horn:(d,t)=>{ tone(d,t,0.7,{ type:'sawtooth', f0:146, f1:150, gain:0.2, attack:0.12 }); tone(d,t,0.7,{ type:'sawtooth', f0:220, f1:224, gain:0.12, attack:0.12 }); },
    levelup:(d,t)=>{ [392,494,587,784].forEach((f,i)=>tone(d,t+i*0.09,0.3,{ type:'triangle', f0:f, f1:f, gain:0.25 })); },
    drip:(d,t)=>{ tone(d,t,0.22,{ f0:between(1100,1500), f1:500, gain:0.18 }); },
    click:(d,t)=>{ tone(d,t,0.04,{ type:'square', f0:700, f1:500, gain:0.12 }); }
  };
  const MIN_GAP={ step:90, hit:40, chop:50, tap:50, whoosh:60, build:60 };

  function listener(x,y){ lx=x; ly=y; }
  function play(name,o){
    const r=RECIPES[name]; if(!r||muted) return;
    if(!ac&&!ensure()) return; if(ac.state!=='running') return;
    const now=performance.now(); if(MIN_GAP[name] && now-(last[name]||0)<MIN_GAP[name]) return; last[name]=now;
    if(voices>26) return;
    const op=o||{}; let g=1, pan=0;
    if(op.x!==undefined){ const dx=op.x-lx, dy=op.y-ly, dist=Math.hypot(dx,dy); if(dist>20) return; g=1/(1+dist*0.28); pan=dx/10; }
    const t=ac.currentTime+(op.delay||0), d=out(g*(op.gain||1),pan,t);
    voices++; setTimeout(()=>{ voices--; }, 700+(op.delay||0)*1000);
    r(d,t);
  }
  // ---- atmosphere: now and then a drip ----
  function startAmbient(){
    const drip=()=>{ if(!muted && ac && ac.state==='running') play('drip',{ x:lx+between(-8,8), y:ly+between(-8,8) }); dripTimer=setTimeout(drip, between(3500,11000)); };
    dripTimer=setTimeout(drip, 4000);
    startMusic();
  }
  // ---- procedural music (dark ambient with a pulse): a pad on a slow minor/phrygian progression, a bass line, sparse echoing lead notes, and drums that come in with the danger ----
  // intensity 0 = quiet (building), 1 = heroes in the dungeon, 2 = fighting. Everything is generated, nothing is recorded.
  let musicOn=true, musicGain=null, wet=null, delay=null, intensity=0, intensityTarget=0, step=0, nextT=0, musicTimer=null, bar=0, leadIdx=7, padNodes=[];
  try{ musicOn=localStorage.getItem('dl_music')!=='0'; }catch(e){}
  const BPM=84, STEP=60/BPM/4;
  const SCALE=[0,1,3,5,7,8,10], ROOT=45;                        // A phrygian
  const PROG=[{r:0,t:[0,3,7]},{r:1,t:[0,4,7]},{r:0,t:[0,3,7]},{r:-2,t:[0,4,7]}];
  const mtof=m=>440*Math.pow(2,(m-69)/12);
  const scaleNote=i=>{ const o=Math.floor(i/7), d=((i%7)+7)%7; return ROOT+12+o*12+SCALE[d]; };
  function impulse(){ const len=ac.sampleRate*2.4, b=ac.createBuffer(2,len,ac.sampleRate); for(let c=0;c<2;c++){ const d=b.getChannelData(c); for(let i=0;i<len;i++) d[i]=(rnd()*2-1)*Math.pow(1-i/len,2.6); } return b; }
  function startMusic(){
    musicGain=ac.createGain(); musicGain.gain.value=musicOn?0.5:0; musicGain.connect(master);
    const conv=ac.createConvolver(); conv.buffer=impulse(); wet=ac.createGain(); wet.gain.value=0.45; wet.connect(conv); conv.connect(musicGain);
    delay=ac.createDelay(1); delay.delayTime.value=STEP*3; const fb=ac.createGain(); fb.gain.value=0.42; delay.connect(fb); fb.connect(delay); delay.connect(wet);
    nextT=ac.currentTime+0.3; musicTimer=setInterval(scheduleMusic, 120);
  }
  function voice(type,f,t,dur,gain,{ cutoff=1200, att=0.01, rel=0.2, send=0, detune=0 }={}){
    const o=ac.createOscillator(); o.type=type; o.frequency.value=f; o.detune.value=detune;
    const flt=ac.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=cutoff; flt.Q.value=2;
    const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(gain,t+att); g.gain.setValueAtTime(gain,t+Math.max(att,dur)); g.gain.exponentialRampToValueAtTime(0.0001,t+dur+rel);
    o.connect(flt); flt.connect(g); g.connect(musicGain); if(send){ const sg=ac.createGain(); sg.gain.value=send; g.connect(sg); sg.connect(delay); sg.connect(wet); }
    o.start(t); o.stop(t+dur+rel+0.05);
  }
  function drum(kind,t,gain){
    if(kind==='kick'){ const o=ac.createOscillator(); o.frequency.setValueAtTime(130,t); o.frequency.exponentialRampToValueAtTime(42,t+0.14); const g=ac.createGain(); g.gain.setValueAtTime(gain,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.22); o.connect(g); g.connect(musicGain); o.start(t); o.stop(t+0.25); }
    else { const src=ac.createBufferSource(); src.buffer=noiseBuf; const f=ac.createBiquadFilter(); f.type=kind==='hat'?'highpass':'bandpass'; f.frequency.value=kind==='hat'?7000:1800; const g=ac.createGain(); const d=kind==='hat'?0.05:0.14; g.gain.setValueAtTime(gain,t); g.gain.exponentialRampToValueAtTime(0.0001,t+d); src.connect(f); f.connect(g); g.connect(musicGain); src.start(t,rnd()); src.stop(t+d+0.02); }
  }
  function scheduleMusic(){
    if(!ac||ac.state!=='running'||!musicOn||muted){ if(ac) nextT=Math.max(nextT,ac.currentTime+0.1); return; }
    intensity+=(intensityTarget-intensity)*0.15;
    while(nextT<ac.currentTime+0.35){
      const t=nextT, s=step%16, br=Math.floor(step/16), chord=PROG[Math.floor(br/2)%PROG.length], I=intensity;
      if(s===0 && br%2===0){                                   // a new chord every two bars: a slowly breathing pad
        chord.t.forEach((iv,i)=>{ const m=ROOT-12+chord.r+iv; [-7,7].forEach(dt=>voice('sawtooth',mtof(m+12),t,STEP*30,0.045,{ cutoff:500+250*Math.sin(br)+I*500, att:1.6, rel:2.2, detune:dt, send:0.5 })); });
        voice('sine',mtof(ROOT-24+chord.r),t,STEP*30,0.2,{ att:0.5, rel:1.5 });
      }
      // bass: one long note when quiet, a pulse when the danger rises
      if(I<0.6){ if(s===0 || s===8) voice('triangle',mtof(ROOT-12+chord.r),t,STEP*6,0.16,{ cutoff:420, att:0.03, rel:0.4 }); }
      else { const pat=[1,0,0,1,0,1,0,0,1,0,0,1,0,0,1,0]; if(pat[s]) voice('sawtooth',mtof(ROOT-12+chord.r+(s===11&&I>1.4?7:0)),t,STEP*1.4,0.14,{ cutoff:300+I*180, att:0.005, rel:0.1 }); }
      // lead: sparse notes by a random walk through the scale, with echo
      const pLead=0.11-0.04*I;
      if(s%2===0 && rnd()<pLead){ leadIdx=Math.max(2,Math.min(13,leadIdx+Math.round(between(-2,2)))); voice('triangle',mtof(scaleNote(leadIdx)),t,STEP*2,0.13,{ cutoff:2600, att:0.01, rel:0.9, send:0.7 }); }
      // drums
      if(I>0.5){ if(s%8===0||(s===10&&I>1.2)) drum('kick',t,0.5); if(s%4===2) drum('hat',t,0.07+0.05*I); }
      if(I>1.3){ if(s%4===0) drum('kick',t,0.35); if(s===4||s===12) drum('snare',t,0.18); }
      nextT+=STEP; step++;
    }
  }
  function setIntensity(i){ intensityTarget=i; }
  function setMusic(on){ musicOn=on; try{ localStorage.setItem('dl_music', on?'1':'0'); }catch(e){} if(musicGain) musicGain.gain.value=on?0.5:0; }
  function setMuted(m){ muted=m; try{ localStorage.setItem('dl_muted', m?'1':'0'); }catch(e){} if(master) master.gain.value=m?0:vol; }
  return { ensure, play, listener, setMuted, setIntensity, setMusic, get music(){ return musicOn; }, get muted(){ return muted; }, RECIPES };
})();
