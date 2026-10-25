// Events of the Ludus: short street scenes between the fights. Each one is staged in its own 3D room (the fighter and up to three others), so the player can read the
// situation (are the bandits well armed?) before deciding. After the choice a follow-up tells what came of it, then the day goes on.
// An event is data: make() decides whether it can happen now and returns what it needs {cast:[{kind,level,tier,seed,name,npc?}], ...}; the result is stored in `ludus.event`.
// Events may use the persistent characters of the world (ludus-world.js) and change how they stand to the fighter, which later events read.
const LUDUS_STORY_WEIGHT=4;
const ludusAnon=(r,kinds,level,tier,name)=>({ kind:kinds[Math.floor(r()*kinds.length)], level:Math.max(1,level), tier, seed:Math.floor(r()*1e9), name });
const ludusPick=(r,l)=>l[Math.floor(r()*l.length)];
const ludusKindOf=k=>SPECIES[k].label;
function ludusGrantXp(n){ const prev=state; try{ if(!state||!state.eventLog) state=makeDefaultState(); ludus.team.forEach(m=>{ const c=ludusMemberCreature(m); grantXp(c,n); m.level=c.level; m.xp=c.xp; }); } finally { state=prev; } }
// the event's bout, fought against its cast
function ludusEventBout(ev,reward){
  const foes=ev.cast.filter(s=>s.role!=='friend'), o={ variant:foes.length>1?'swarm':'duel', foes, diff:'fair', reward, kind:foes[0].kind, level:Math.max(...foes.map(x=>x.level)), name:foes[0].name };
  o.title=foes.length>1?`${foes.map(x=>x.name).join(' und ')}`:`${foes[0].name} (${ludusKindOf(foes[0].kind)})`; return o;
}
const LUDUS_EVENTS=[
  { id:'growl', title:'Ein Fauchen im Tunnel',
    make:()=>({ cast:[] }),
    text:()=>'Nach deinem Kampf gehst du wie immer in die Taverne. Doch dann hörst du aus einem fernen Tunnel im Dungeon ein seltsames Fauchen.',
    options:[
      { label:'Ignorieren', run:()=>({ text:'Du bleibst sitzen. Das Fauchen verhallt, und niemand spricht mehr davon.' }) },
      { label:'Untersuchen', run:()=>{ if(Math.random()<0.5){ const g=20+Math.round(Math.random()*20); ludus.gold+=g; return { text:`Im Tunnel liegt der Rest eines Lagers. Du findest ${g} Gold.` }; } return { text:'Im Dunkeln wartet etwas Hungriges auf dich!', fight:1.5 }; } },
      { label:'Eine Falle stellen', trait:['skeleton','zombie','ghoul','goblin','thief','lizard'], run:f=>{ const x=14+3*f.level; ludusGrantXp(x); ludus.gold+=30; return { text:`Das Wesen tappt in deine Falle, die du schnell zusammengebaut hast. Du bekommst ${x} Erfahrung und 30 Gold.` }; } }
    ] },
  { id:'peddler', title:'Ein fahrender Händler',
    make:r=>({ cast:[ludusAnon(r,['dwarf','goblin'],2,2,'Händler')] }),
    text:()=>'Ein Händler mit einem großen Sack baut seinen Stand im Hof auf. "Ein Buch gefällig? Nur heute, und es ist sein Geld wert!"',
    options:[
      { label:'Kaufen (25 Gold)', when:()=>ludus.gold>=25, run:()=>{ const c=ludusCreature(), pool=(ARCHETYPE_POOL[archetypeOf(c)]||[]).filter(id=>ABILITIES[id]&&!knownAbilities(c).includes(id)); if(!pool.length) return { text:'Er hat nichts, was du nicht schon kennst.' }; const id=pool[Math.floor(Math.random()*pool.length)]; ludus.gold-=25; ludus.bookbag.push(id); return { text:`Du kaufst das Buch "${ABILITIES[id].name}". Es liegt im Inventar.` }; } },
      { label:'Schriftrolle kaufen (20 Gold)', when:()=>ludus.gold>=20, run:()=>{ ludus.gold-=20; const id=ludusGiveScroll(); return { text:`Du kaufst eine Schriftrolle: ${ludusScrollName(id)}. Sie wirkt einmal im Kampf.` }; } },
      { label:'Ablehnen', run:()=>({ text:'Du zuckst mit den Schultern. Der Händler packt wieder ein.', exit:true }) },
      { label:'Beutel stehlen', trait:['thief','goblin','kitsune'], run:()=>{ const g=30+Math.round(Math.random()*20); ludus.gold+=g; return { text:`Unauffällig verschwindet sein Beutel in deiner Tasche: +${g} Gold.` }; } }
    ] },
  { id:'wounded', title:'Ein verwundeter Gladiator',
    make:r=>{ const pool=ludusNpcPool(); const n=pool.length?ludusPick(r,pool):null; const s=n?Object.assign(ludusNpcFoe(n),{ role:'foe' }):ludusAnon(r,ludusKinds(),ludus.fighter.level,1,'Gladiator'); return { cast:[s], npc:n?n.id:null }; },
    text:ev=>`Am Rand des Hofs sitzt ${ev.cast[0].name} mit blutigem Bein. "Bitte, ich habe kein Geld mehr für einen Heiler."`,
    options:[
      { label:'Helfen (10 Gold)', when:()=>ludus.gold>=10, run:(f,ev)=>{ ludus.gold-=10; ludusGainRenown(2); const n=ludusNpc(ev.npc); if(n){ n.bond=Math.min(3,(n.bond||0)+1); n.met=1; n.last={ t:'helped', d:ludus.day }; } let extra=''; if(Math.random()<0.5){ const id=ludusGiveScroll(); extra=` Zum Dank schenkt er dir eine Schriftrolle: ${ludusScrollName(id)}.`; } return { text:`${ev.cast[0].name} verbindet das Bein, dankt dir und erzählt überall von deiner Güte. +2 Ansehen.${extra}` }; } },
      { label:'Ausrauben', run:(f,ev)=>{ const g=18; ludus.gold+=g; ludus.fame=Math.max(0,ludus.fame-1); const n=ludusNpc(ev.npc); if(n){ n.bond=Math.max(-3,(n.bond||0)-2); n.met=1; n.last={ t:'robbed', d:ludus.day }; } return { text:`Du nimmst ihm den letzten Beutel: +${g} Gold. Die anderen sehen es und tuscheln: −1 Ruhm.` }; } },
      { label:'Weitergehen', run:()=>({ text:'Du gehst weiter, ohne dich umzudrehen.' }) }
    ] },
  { id:'feast', title:'Ein Fest im Hof',
    make:r=>({ cast:[ludusAnon(r,ludusKinds(),2,1,'Feiernder'),ludusAnon(r,ludusKinds(),2,1,'Trommler')] }),
    text:()=>'Im Hof wird gefeiert: Fässer, Spieße und Musik. Ein Trommler ruft dich in die Runde.',
    options:[
      { label:'Mitfeiern (8 Gold)', when:()=>ludus.gold>=8, run:f=>{ ludus.gold-=8; f.energy=100; return { text:'Du isst, trinkst und tanzt. Am Morgen bist du ausgeschlafen wie nie.' }; } },
      { label:'Armdrücken', trait:['troll','giant','dwarf','golem','barbarian','ork'], run:f=>{ const x=12+3*f.level; ludusGrantXp(x); return { text:`Du gewinnst fünf Runden Armdrücken und lernst dabei: +${x} Erfahrung.` }; } },
      { label:'Weitergehen', run:()=>({ text:'Du hast heute keine Lust auf Gesellschaft.' }) }
    ] },
  { id:'bandits', title:'Banditen in der Gasse',
    make:r=>{
      const pool=ludusNpcPool(), fl=ludus.fighter.level; let cast;
      if(pool.length>=2 && r()<0.5){ const a=ludusPick(r,pool), b=ludusPick(r,pool.filter(n=>n!==a)); cast=[a,b].map(n=>Object.assign(ludusNpcFoe(n),{ role:'foe' })); }
      else { const t=Math.floor(r()*3), kinds=['goblin','thief','ork','barbarian','skeleton','darkelf'].filter(k=>SPECIES[k]); cast=[0,1].map(()=>Object.assign(ludusAnon(r,kinds,fl-1+Math.floor(r()*2),t,ludusPick(r,LUDUS_NAMES)),{ role:'foe' })); }
      return { cast, toll:10+3*fl };
    },
    text:ev=>`In einer dunklen Gasse versperren dir ${ev.cast[0].name} und ${ev.cast[1].name} den Weg. "Her mit dem Geld, dann passiert dir nichts!"`,
    options:[
      { label:ev=>`Schutzgeld zahlen (${ev.toll} Gold)`, when:ev=>ludus.gold>=ev.toll, run:(f,ev)=>{ ludus.gold-=ev.toll; ev.cast.forEach(s=>{ const n=ludusNpc(s.npc); if(n){ n.met=1; n.last={ t:'paid', d:ludus.day }; } }); return { text:`Du zählst ${ev.toll} Gold in ihre Hände. Die beiden grinsen und lassen dich vorbei.`, exit:true }; } },
      { label:'Kämpfen', run:(f,ev)=>({ text:'Du ziehst blank. "Dann holen wir es uns eben!"', bout:ludusEventBout(ev,14+5*f.level) }) },
      { label:'Davonlaufen', run:(f,ev)=>{ const loss=Math.min(ludus.gold,Math.round(ev.toll/3)); ludus.gold-=loss; f.energy=Math.max(10,(f.energy===undefined?100:f.energy)-10); ev.cast.forEach(s=>{ const n=ludusNpc(s.npc); if(n){ n.met=1; n.last={ t:'scared', d:ludus.day }; } }); return { text:`Du rennst los und lässt dabei ${loss} Gold fallen. Hinter dir lachen sie.` }; } },
      { label:'Einschüchtern', trait:['ork','troll','giant','barbarian','werewolf','minotaur'], run:()=>({ text:'Du knurrst die beiden an und trittst einen Schritt vor. Sie werden blass und verschwinden in der Dunkelheit.', exit:true }) }
    ] },
  // ---- stories about characters of the world ----
  { id:'beggar', title:'Ein Bettler in der Gasse', story:true,
    make:r=>{ const l=ludusNpcPoolAll().filter(n=>n.last&&n.last.t==='surrender'&&!n.helped&&ludus.day-n.last.d>=2); if(!l.length) return null; const n=ludusPick(r,l); return { cast:[Object.assign(ludusNpcFoe(n),{ role:'friend' })], npc:n.id }; },
    text:ev=>{ const n=ludusNpc(ev.npc); return `In der Gasse bittet dich ein verkrüppeltes Wesen um Kleingeld. Als du dich umdrehst, erkennst du ${n.name}: ${ludusKindOf(n.kind)}, der sich an Tag ${n.last.d} im Kampf gegen dich ergeben hat.`; },
    options:[
      { label:'Ein paar Münzen geben (5 Gold)', when:()=>ludus.gold>=5, run:(f,ev)=>{ ludus.gold-=5; const n=ludusNpc(ev.npc); n.helped=ludus.day; n.bond=Math.min(3,(n.bond||0)+1); n.thanks=ludus.day+3; n.last={ t:'helped', d:ludus.day }; return { text:`Du gibst ${n.name} ein paar Münzen und wünschst ihm viel Glück für seine Zukunft.`, exit:true }; } },
      { label:'Wegschicken', run:(f,ev)=>{ const n=ludusNpc(ev.npc); n.helped=ludus.day; n.bond=Math.max(-3,(n.bond||0)-1); n.last={ t:'sent', d:ludus.day }; return { text:`Du schüttelst den Kopf. ${n.name} senkt den Blick und humpelt davon.`, exit:true }; } },
      { label:'Ausrauben', run:(f,ev)=>{ const n=ludusNpc(ev.npc); n.helped=ludus.day; n.bond=Math.max(-3,(n.bond||0)-2); n.last={ t:'robbed', d:ludus.day }; ludus.gold+=6; ludus.fame=Math.max(0,ludus.fame-1); return { text:`Du nimmst ${n.name} die letzten Münzen ab: +6 Gold. Er sagt nichts, aber er wird es nicht vergessen. −1 Ruhm.`, exit:true }; } }
    ] },
  { id:'thanks', title:'Ein Dank vor der Taverne', story:true,
    make:r=>{ const l=ludusNpcPoolAll().filter(n=>n.thanks&&n.thanks<=ludus.day&&(n.bond||0)>=1); if(!l.length) return null; const n=ludusPick(r,l); return { cast:[Object.assign(ludusNpcFoe(n),{ role:'friend' })], npc:n.id }; },
    text:ev=>{ const n=ludusNpc(ev.npc); return `${n.name} wartet vor der Taverne. Er steht wieder aufrecht. "Du hast mir geholfen, als niemand es getan hat. Ich schulde dir etwas."`; },
    options:[
      { label:'Ins Team aufnehmen', when:()=>ludusSlotsFree()>0, run:(f,ev)=>{ const n=ludusNpc(ev.npc); n.thanks=0; ludusJoinTeam(n); return { text:`${n.name} schlägt ein. Von nun an kämpft er an deiner Seite, und sein Platz im Team gehört ihm.` }; } },
      { label:'Die Hand schütteln', run:(f,ev)=>{ const n=ludusNpc(ev.npc); n.thanks=0; ludus.gold+=15; return { text:`${n.name} drückt dir 15 Gold in die Hand. "Für das nächste Huhn." Dann geht er seiner Wege.`, exit:true }; } }
    ] },
  { id:'revenge', title:'Eine alte Rechnung', story:true,
    make:r=>{ const l=ludusNpcPool().filter(n=>(n.bond||0)<=-2&&n.last&&ludus.day-n.last.d>=3); if(!l.length) return null; const n=ludusPick(r,l); return { cast:[Object.assign(ludusNpcFoe(n),{ role:'foe' })], npc:n.id, toll:20+3*ludus.fighter.level }; },
    text:ev=>{ const n=ludusNpc(ev.npc); return `${n.name} hat auf dich gewartet. "Du erinnerst dich an mich? Heute zahlst du zurück."`; },
    options:[
      { label:'Kämpfen', run:(f,ev)=>{ const n=ludusNpc(ev.npc); n.bond=Math.min(0,n.bond+1); return { text:'Du nickst nur und ziehst deine Waffe.', bout:ludusEventBout(ev,20+6*f.level) }; } },
      { label:ev=>`Abfinden (${ev.toll} Gold)`, when:ev=>ludus.gold>=ev.toll, run:(f,ev)=>{ ludus.gold-=ev.toll; const n=ludusNpc(ev.npc); n.bond=0; n.last={ t:'paid', d:ludus.day }; return { text:`Du zahlst ${ev.toll} Gold. ${n.name} spuckt aus, nimmt das Geld und lässt es gut sein.`, exit:true }; } }
    ] }
];
// every character that is alive, whether or not in reach of a bout (the maimed beg in the street)
const ludusNpcPoolAll=()=>(ludus.world||[]).filter(n=>n.status==='active');
const ludusEventDef=id=>LUDUS_EVENTS.find(e=>e.id===id);
const ludusEventOptions=(def)=>def.options.filter(o=>!o.trait||o.trait.includes(ludus.fighter.kind));
function ludusMaybeEvent(){
  if(ludus.over||ludus.forced) return;
  const r=Math.random, cands=LUDUS_EVENTS.map(d=>({ d, ev:d.make(r) })).filter(x=>x.ev);
  const story=cands.filter(x=>x.d.story);
  if(Math.random()>(story.length?0.75:0.3)) return;
  const list=cands.reduce((a,x)=>a.concat(Array(x.d.story?LUDUS_STORY_WEIGHT:1).fill(x)),[]), pick=list[Math.floor(Math.random()*list.length)];
  ludus.event=Object.assign({ id:pick.d.id },pick.ev);
}
function ludusEventChoose(i){
  const ev=ludus.event, def=ev&&ludusEventDef(ev.id), opt=def&&ludusEventOptions(def)[i]; if(!opt) return;
  ludus.event=null; const out=opt.run(ludus.fighter,ev)||{};
  if(out.fight||out.bout) ludus.forced={ type:'event', opp:out.bout||ludusQuickBout('fair',out.fight) };
  ludus.followup={ title:def.title, text:out.text||'', cast:out.cast||ev.cast, exit:!!out.exit };
  ludusSave(); ludusRender();
}
const ludusEventCast=()=>{ const src=ludus.event||ludus.followup; return src?src.cast.map(s=>Object.assign(ludusLookOf(s),{ exit:!!(ludus.followup&&!ludus.event&&ludus.followup.exit) })):[]; };
