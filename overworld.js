// The world economy of the campaign (design: docs/design.md, "Die Weltwirtschaft").
// Pure rules on the world graph and the campaign record, no drawing. New region types and events are table entries.
//
//   world    = { terrain, nodes:[{id,x,y,col,type,name}], edges:[{a,b}] }          (from buildWorld, never saved)
//   campaign = { seed, pos, round, bonus, conquered:[ids], known:[ids], skillPoints, eventsSeen:[], log:[] }   (saved)
//
// The good side owns every region that is not conquered. Hero power per stat = (production of the owned regions that are still
// connected to the capital) x (time factor, grows every round) + short-lived bonuses from events. Conquering a producer or cutting
// its supply line lowers it at once; waiting raises it. That is the trade-off between rushing and taking the economy apart.
const OW=(()=>{
  const STATS={
    food:     { label:'Nachschub',   short:'Helden',  desc:'mehr Helden pro Welle' },
    iron:     { label:'Rüstung',     short:'Ausrüstung', desc:'bessere Waffen und Rüstung' },
    training: { label:'Ausbildung',  short:'Stufe',   desc:'höhere Heldenstufen' },
    magic:    { label:'Magie',       short:'Magie',   desc:'mehr Zauberer' },
    fort:     { label:'Befestigung', short:'Wellen',  desc:'mehr Wellen pro Level' }
  };
  const STAT_KEYS=Object.keys(STATS);
  const STAT_CAP=20;                 // for the bars on the map
  const TIME_BASE=0.5, TIME_GROWTH=0.12;   // time factor = 0.5 + 0.12 per round (x1.5 after 8 rounds, x2.3 after 15)
  const ALARM_PER_REGION=0.07;       // war footing: every conquered region raises all hero power by 7 %
  const BONUS_DECAY=0.75;            // event bonuses fade by a quarter every round
  const GEAR_NAMES=['krude','normale','meisterliche','epische'];

  // prod: delivered to the good side per round (while connected to the capital)
  // local: extra for the level of this region; aura: extra for the levels of neighbouring regions
  // gen: terrain parameters for the level generator (see makeDefaultState)
  const REGION_TYPES={
    river_village:{ label:'Flussdorf', ai:'panic',        playable:true,  prod:{},                 local:{},                   gen:{ rivers:[2,3], lakes:[0,1] },
      desc:'Ein Dorf an vielen Flüssen. Leichte Beute.', side:'Das gesamte Dorf untergraben.', suffixes:['bach','furt','au','mühl'] },
    village:      { label:'Handelsdorf', ai:'panic',      playable:true,  prod:{ food:1 },         local:{},                   gen:{ rivers:[1,2] },
      desc:'Ein Marktflecken an der Handelsstraße. Er füttert die Heere der Gegend.', side:'Die Vorratskammern plündern.', suffixes:['markt','stedt','heim','furt'] },
    farmland:     { label:'Farmland', ai:'cautious',         playable:true,  prod:{ food:2 },         local:{ size:1 },          gen:{ rivers:[1,2], goldVeins:-2 },
      desc:'Weite Felder und Scheunen. Von hier kommt der Nachschub der Heere.', side:'Die Scheunen niederbrennen.', suffixes:['feld','hof','acker','au'] },
    camp:         { label:'Trainingslager', ai:'drilled',   playable:true,  prod:{ training:2 },     local:{ levelBonus:1 },    gen:{},
      desc:'Hier üben die Helden. Wer es zerschlägt, bremst ihre Ausbildung.', side:'Die Waffenmeister ausschalten.', suffixes:['lager','platz','wacht','heim'] },
    forge:        { label:'Zwergenschmiede', ai:'cautious',  playable:true,  prod:{ iron:2 },         local:{ gearTier:1 },      gen:{ caveDensity:0.45, oreVeins:3 },
      desc:'Tunnel und Esse im Berg. Hier wird die Rüstung der Helden geschmiedet.', side:'Die Schmiede plündern und ein Artefakt suchen.', suffixes:['fels','berg','esse','hammer'] },
    mine:         { label:'Bergwerk', ai:'cautious',         playable:true,  prod:{ iron:1 },         local:{},                   gen:{ caveDensity:0.44, oreVeins:4, goldVeins:3 },
      desc:'Stollen voller Erz und Gold. Es liefert das Eisen für die Schmieden.', side:'Die Erzlager leeren.', suffixes:['stollen','grube','schacht','berg'] },
    tower:        { label:'Magierturm', ai:'cautious',       playable:true,  prod:{ magic:2 },        local:{ wizards:1 },       gen:{ lakes:[0,1] },
      desc:'Ein Turm, in dem Zauberer lernen. Er schickt Magier ins Feld.', side:'Die Bibliothek erobern.', suffixes:['turm','warte','spitz','licht'] },
    elf_forest:   { label:'Elfenwald', ai:'aggressive',        playable:true,  prod:{ magic:1, food:1 }, local:{},                  gen:{ caveDensity:0.43, rivers:[1,2] },
      desc:'Ein uralter Wald, von Wurzeln durchzogen.', side:'Den Waldfürsten unterwerfen.', suffixes:['wald','hain','tann','lauf'] },
    fortress:     { label:'Festung', ai:'fortified',          playable:true,  prod:{ fort:2 },         local:{ waves:1 }, aura:{ waves:1 }, gen:{ bedrock:2 },
      desc:'Feste Mauern. Sie verstärkt die Gebiete ringsum und liefert Wachen.', side:'Den Burgherrn stürzen.', suffixes:['burg','stein','wacht','trutz'] },
    bog:          { label:'Moorsiedlung', ai:'panic',     playable:true,  prod:{},                 local:{},                   gen:{ lakes:[2,3], rivers:[1,2] },
      desc:'Nebel, Schlamm und argwöhnische Bewohner. Kaum Nutzen für die Heere, aber viel Wasser.', side:'Das Dorf versenken.', suffixes:['moor','sumpf','brück','nebel'] },
    // Gates: natural chokepoints, every road to the capital passes through them. Mythic places (free myths and sagas only), a boss each.
    // Two ways through: the frontal assault (beat the boss in an epic fight) or the cunning way (a special goal with a bigger reward).
    gate_dwarf:   { label:'Pforte: Alberichs Hallen', ai:'greedy', playable:true, gate:true, race:'dwarf', fixedName:'Alberichs Hallen', terrain:'mountain', prod:{ iron:3 }, local:{ waves:2, gearTier:1 },
      gen:{ caveDensity:0.46, oreVeins:5, goldVeins:4, bedrock:2 },
      boss:{ name:'Alberich, der Zwergenkönig' }, setup:'dwarf_hoard',
      goals:[ { id:'defeat_boss', way:'frontal', bossName:'Alberich' }, { id:'steal_gold', way:'cunning', amount:15 } ],
      paths:{ frontal:'Alberich im Kampf besiegen und die Halle erobern.', cunning:'Ihm das geliebte Gold stehlen und ihn korrumpieren: er dient dir dann als mächtige Einheit.' },
      desc:'Tief im Berg liegt der Hort des Zwergenkönigs. Der einzige Weg nach Osten führt durch seine Hallen.', side:'Das Gold des Königs rauben.', suffixes:[] },
    gate_elf:     { label:'Pforte: Hain des Weltenbaums', ai:'hyper', playable:true, gate:true, race:'elf', fixedName:'Hain des Weltenbaums', terrain:'forest', prod:{ magic:3 }, local:{ waves:2, wizards:2 },
      gen:{ caveDensity:0.43, rivers:[1,2], lakes:[1,2] },
      boss:{ name:'Oberon, Schützer des heiligen Hains' }, setup:'elf_grove', spawnAt:'grove', heroPool:['elf','elf','elf','wizard'],
      goals:[ { id:'defeat_boss', way:'frontal', bossName:'Oberon' }, { id:'undermine_roots', way:'cunning', amount:6 } ],
      paths:{ frontal:'Oberon im Hain stellen und besiegen. Er schickt seine Krieger, bis er fällt.', cunning:'Die Wurzeln des Weltenbaums überall im Land untergraben, während Oberon seine Krieger auf dich hetzt. Dann wird er korrumpiert und dient dir.' },
      desc:'Ein heiliger Hain um einen uralten Weltenbaum. Oberon wacht über ihn und seine Wurzeln, die sich durchs ganze Land ziehen.', side:'Die Wurzeln des Weltenbaums untergraben.', suffixes:[] },
    // Humans: King Arthur of Camelot (legend). The sword in the stone can only be drawn by someone worthy.
    gate_human:   { label:'Pforte: Camelot', ai:'drilled', playable:true, gate:true, race:'human', fixedName:'Camelot', terrain:'grass', prod:{ training:3 }, local:{ waves:2, levelBonus:1 },
      gen:{ rivers:[1,2], caveDensity:0.38 },
      boss:{ name:'Artus, König von Camelot' }, setup:'camelot', spawnAt:'castle', heroPool:['knight','knight','barbarian','wizard'],
      goals:[ { id:'defeat_boss', way:'frontal', bossName:'Artus' }, { id:'pull_sword', way:'cunning' } ],
      paths:{ frontal:'Artus an seiner Tafelrunde stellen und im Zweikampf besiegen.', cunning:'Excalibur aus dem Stein ziehen. Das gelingt nur einem Würdigen (Stufe 5 oder ein Verbündeter, besessen!). Artus verliert seine Legende und dient dir.' },
      desc:'Eine Burg, in der ein König auf der Tafelrunde sitzt und seit Jahrhunderten auf den Würdigen wartet.', side:'Excalibur ziehen.', suffixes:[] },
    gate_hydra:   { label:'Pforte: Sumpf der Hydra', playable:true, gate:true, enabled:false, fixedName:'Sumpf der Hydra', terrain:'swamp', prod:{ fort:2, food:1 }, local:{ waves:2 },
      gen:{ lakes:[3,4], rivers:[2,3] },
      boss:{ name:'Die Hydra' },
      paths:{ frontal:'Die Hydra erschlagen, bevor sie nachwächst.', cunning:'Die Quelle des Sumpfs vergiften: die Hydra schwächelt und lässt sich unterwerfen.' },
      desc:'Ein Sumpf, dessen Herrin viele Köpfe hat.', side:'Die Quelle vergiften.', suffixes:[] },
    gate_labyrinth:{ label:'Pforte: Das Labyrinth', playable:true, gate:true, enabled:false, fixedName:'Das Labyrinth', terrain:'hills', prod:{ fort:3 }, local:{ waves:2, levelBonus:1 },
      gen:{ caveDensity:0.36, bedrock:3 },
      boss:{ name:'Der Minotaurus' },
      paths:{ frontal:'Den Minotaurus im Labyrinth stellen und erschlagen.', cunning:'Den Faden der Wächter durchtrennen: das Labyrinth öffnet sich, der Minotaurus folgt dir.' },
      desc:'Ein Irrgarten aus Stein. Wer hinein will, muss dem Wesen im Zentrum begegnen.', side:'Den Faden durchtrennen.', suffixes:[] },
    event:        { label:'Verlassener Ort',  playable:false, prod:{},                 local:{},                   gen:{},
      desc:'Hier gibt es nichts zu erobern, nur ein Ereignis.', side:'', suffixes:['rast','pfad','kreuz','stein'] },
    capital:      { label:'Hauptstadt des Guten', ai:'drilled', playable:true, prod:{ food:1, iron:1, magic:1, training:1, fort:1 }, local:{ waves:2 }, gen:{ bedrock:2 },
      desc:'Der Sitz des Heldenkönigs. Hier endet jede Kampagne.', side:'Den Boss der Welt besiegen oder unterwerfen.', suffixes:[] }
  };

  // Events: dice decide. fx changes stocks (negative = the good side loses), gain = player-side effects.
  const EVENTS=[
    { id:'reinforcements', title:'Verstärkung trifft ein', text:'Söldner ziehen zum Heer der Guten.', dice:6, outcomes:[
      { upTo:2, text:'Nur ein kleiner Trupp.', fx:{ food:1 } },
      { upTo:5, text:'Ein ordentlicher Trupp marschiert auf.', fx:{ food:3 } },
      { upTo:6, text:'Eine ganze Kompanie schließt sich an!', fx:{ food:5, training:2 } } ] },
    { id:'plague', title:'Seuche im Heerlager', text:'Fieber geht um.', dice:6, outcomes:[
      { upTo:2, text:'Die Seuche ist schwer: die Ausbildung leidet.', fx:{ training:-3, food:-2 } },
      { upTo:5, text:'Ein paar Kranke, sonst nichts.', fx:{ food:-1 } },
      { upTo:6, text:'Die Heiler haben alles im Griff.', fx:{} } ] },
    { id:'smugglers', title:'Schmuggler', text:'Händler bieten dir Erz an, das eigentlich den Schmieden zusteht.', dice:6, outcomes:[
      { upTo:2, text:'Eine Falle! Die Schmuggler arbeiten für die Gegenseite.', fx:{ iron:2 } },
      { upTo:4, text:'Ein ehrlicher Handel: Die Schmieden verlieren Nachschub.', fx:{ iron:-2 } },
      { upTo:6, text:'Gutes Geschäft. Das Erz fehlt den Heeren, und du bekommst Beute.', fx:{ iron:-3 }, gain:{ skillPoints:1 } } ] },
    { id:'spy', title:'Eine Spionin', text:'Eine Späherin bietet dir Einblick in die Pläne der Gegner.', dice:6, outcomes:[
      { upTo:2, text:'Sie wurde erwischt, ohne etwas zu verraten.', fx:{} },
      { upTo:5, text:'Du erfährst, was in zwei Regionen steckt.', reveal:2 },
      { upTo:6, text:'Sie kennt die ganze Gegend.', reveal:4 } ] },
    { id:'famine', title:'Missernte', text:'Das Wetter schlägt zu.', dice:6, outcomes:[
      { upTo:2, text:'Hunger. Die Heere schrumpfen.', fx:{ food:-4 } },
      { upTo:5, text:'Eine magere Ernte.', fx:{ food:-2 } },
      { upTo:6, text:'Die Ernte ist trotzdem gut.', fx:{ food:1 } } ] },
    { id:'tournament', title:'Ritterturnier', text:'Die Guten feiern und üben.', dice:6, outcomes:[
      { upTo:2, text:'Das Turnier endet im Streit.', fx:{ training:-1 } },
      { upTo:5, text:'Die Ritter lernen voneinander.', fx:{ training:2 } },
      { upTo:6, text:'Ein großes Fest: neue Waffen und neuer Mut.', fx:{ training:3, iron:1 } } ] },
    { id:'wanderer', title:'Ein Wanderer', text:'Ein alter Mann am Wegrand murmelt von Schwachstellen.', dice:6, outcomes:[
      { upTo:3, text:'Er redet wirr.', fx:{} },
      { upTo:6, text:'Er verrät dir einen Weg: du bekommst einen Fertigkeitspunkt.', gain:{ skillPoints:1 } } ] }
  ];

  const rngFor=(c,salt)=>mulberry32(hashSeed(String(c.seed)+'|'+salt));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function initCampaign(c){
    c.round=c.round||0; c.bonus=c.bonus||{};
    c.conquered=c.conquered||[]; c.allies=c.allies||[]; c.known=c.known||[]; c.skillPoints=c.skillPoints||0; c.eventsSeen=c.eventsSeen||[]; c.log=c.log||[];
    return c;
  }
  const neighbours=(world,id)=>world.edges.filter(e=>e.a===id||e.b===id).map(e=>e.a===id?e.b:e.a);

  // regions that can still deliver: owned by the good side AND connected to the capital through other owned regions
  function connected(world,c){
    const cap=world.nodes.find(n=>n.type==='capital');
    const free=id=>!c.conquered.includes(id);
    const seen=new Set([cap.id]), q=[cap.id];
    while(q.length){ const id=q.shift(); neighbours(world,id).forEach(nb=>{ if(!seen.has(nb) && free(nb)){ seen.add(nb); q.push(nb); } }); }
    return seen;
  }
  // production of the current round, per stat, with the regions that deliver it
  function income(world,c){
    const live=connected(world,c), out={}, sources={};
    STAT_KEYS.forEach(k=>{ out[k]=0; sources[k]=[]; });
    world.nodes.forEach(n=>{
      const prod=REGION_TYPES[n.type].prod;
      Object.keys(prod).forEach(k=>{
        if(c.conquered.includes(n.id)) return;
        const cut=!live.has(n.id);
        sources[k].push({ id:n.id, name:n.name, type:n.type, amount:prod[k], cut });
        if(!cut) out[k]+=prod[k];
      });
    });
    return { out, sources };
  }
  const timeFactor=c=>TIME_BASE+TIME_GROWTH*(c.round||0);
  // hero power right now: sources x time + event bonuses
  function power(world,c){
    const inc=income(world,c), tf=timeFactor(c), alarm=1+ALARM_PER_REGION*c.conquered.length, stats={};
    STAT_KEYS.forEach(k=>{ stats[k]=Math.max(0, inc.out[k]*tf*alarm+(c.bonus[k]||0)); });
    return { stats, income:inc, tf, alarm };
  }
  function advanceRound(world,c){
    c.round++;
    STAT_KEYS.forEach(k=>{ if(c.bonus[k]) c.bonus[k]=Math.abs(c.bonus[k])<0.3?0:c.bonus[k]*BONUS_DECAY; });
  }

  function applyEvent(world,c,ev,roll){
    const o=ev.outcomes.find(x=>roll<=x.upTo)||ev.outcomes[ev.outcomes.length-1];
    if(o.fx) Object.keys(o.fx).forEach(k=>{ c.bonus[k]=(c.bonus[k]||0)+o.fx[k]; });
    if(o.gain && o.gain.skillPoints) c.skillPoints+=o.gain.skillPoints;
    let revealed=[];
    if(o.reveal){
      const unknown=world.nodes.filter(n=>!knownTo(world,c,n.id));
      const r=rngFor(c,'reveal'+c.round+roll);
      while(revealed.length<o.reveal && unknown.length){ const i=Math.floor(r()*unknown.length); revealed.push(unknown.splice(i,1)[0].id); }
      c.known=c.known.concat(revealed);
    }
    return { event:ev, roll, outcome:o, revealed };
  }
  // an event for the node (deterministic per seed and node) or a random global event of the round
  function rollEvent(world,c,salt){
    const r=rngFor(c,'event'+salt);
    const ev=EVENTS[Math.floor(r()*EVENTS.length)], roll=1+Math.floor(r()*ev.dice);
    return applyEvent(world,c,ev,roll);
  }
  // does a global event happen after this round? (about one round in four)
  function roundEvent(world,c){
    const r=rngFor(c,'round'+c.round);
    if(r()>=0.25) return null;
    return rollEvent(world,c,'r'+c.round);
  }

  function knownTo(world,c,id){
    if(c.known.includes(id)||c.conquered.includes(id)) return true;
    const n=world.nodes[id];
    if(n.type==='capital'||REGION_TYPES[n.type].gate) return true;   // the capital and the gates are always known: you plan around them
    if(c.pos<0) return n.col===0;
    return id===c.pos || neighbours(world,c.pos).includes(id);
  }

  // what the level of this region will look like: global stocks plus local type bonuses plus auras of neighbours
  function levelMods(world,c,node){
    const rt=REGION_TYPES[node.type], st=power(world,c).stats, notes=[];
    const local=rt.local||{};
    let aura={ waves:0 };
    neighbours(world,node.id).forEach(nb=>{ const t=world.nodes[nb]; if(!c.conquered.includes(nb)){ const a=REGION_TYPES[t.type].aura; if(a&&a.waves) aura.waves+=a.waves; } });
    const v=k=>Math.round(st[k]*10)/10;
    const gearIdx=clamp((st.iron<3?0:st.iron<6?1:st.iron<10?2:3)+(local.gearTier||0),0,3);
    const mods={
      waves:clamp(3+Math.floor(st.fort/3)+(local.waves||0)+aura.waves,3,9),
      size:Math.floor(st.food/4)+(local.size||0),
      levelBonus:Math.floor(st.training/4)+(local.levelBonus||0),
      gearTier:gearIdx,
      wizards:Math.floor(st.magic/4)+(local.wizards||0)
    };
    notes.push(`${mods.waves} Wellen (Befestigung ${v('fort')}${local.waves?', Festung':''}${aura.waves?`, ${aura.waves} durch Nachbarfestungen`:''})`);
    notes.push(`+${mods.size} Helden pro Welle (Nachschub ${v('food')}${local.size?', Farmland':''})`);
    notes.push(`Heldenstufe +${mods.levelBonus} (Ausbildung ${v('training')}${local.levelBonus?', Lager':''})`);
    notes.push(`${GEAR_NAMES[gearIdx]} Ausrüstung (Rüstung ${v('iron')}${local.gearTier?', Schmiede':''})`);
    notes.push(`${mods.wizards} zusätzliche Zauberer (Magie ${v('magic')}${local.wizards?', Turm':''})`);
    mods.notes=notes; mods.gearName=GEAR_NAMES[gearIdx];
    return mods;
  }

  // "Losing is fun": explain where the heroes' strength came from and what could be done about it
  function explainDefeat(world,c,war){
    const pw=power(world,c), lines=[];
    const mods=war&&war.mods;
    if(mods){
      lines.push(`Die Gegner hatten ${war.wave}/${war.poolTotal||mods.waves} Rekruten angeworben:`);
      mods.notes.forEach(t=>lines.push('· '+t));
    }
    // the stat that weighed most for this level, and which producers were still running
    const weight={ food:pw.stats.food/4, iron:pw.stats.iron/3, training:pw.stats.training/4, magic:pw.stats.magic/4, fort:pw.stats.fort/3 };
    const top=STAT_KEYS.slice().sort((a,b)=>weight[b]-weight[a])[0];
    const src=pw.income.sources[top].filter(s=>!s.cut), cut=pw.income.sources[top].filter(s=>s.cut);
    lines.push('');
    lines.push(`Die Heldenmacht ist Quellen mal Zeit mal Alarm: Runde ${c.round}, Zeitfaktor ×${pw.tf.toFixed(2)}, Alarmstufe ×${pw.alarm.toFixed(2)} (jede eroberte Region versetzt die Guten in Kriegsbereitschaft).`);
    lines.push(`Der größte Brocken war ${STATS[top].label} (${pw.stats[top].toFixed(1)}): ${STATS[top].desc}.`);
    if(src.length) lines.push(`Noch lieferten: ${src.map(s=>s.name+' ('+REGION_TYPES[s.type].label+')').join(', ')}. Wer eine davon erobert oder ihre Straße zur Hauptstadt kappt, schwächt diesen Wert sofort.`);
    else lines.push('Hier lieferte keine Quelle mehr; dein Verlust hatte einen anderen Grund (Zeitfaktor, Ereignisse oder dein Dungeon).');
    if(cut.length) lines.push(`Schon abgeschnitten: ${cut.map(s=>s.name).join(', ')}.`);
    lines.push(`Du hattest ${c.conquered.length} Regionen erobert. Ein kürzerer Weg lässt der Gegnerwirtschaft weniger Zeit, ein breiterer nimmt ihr Quellen.`);
    return lines;
  }

  return { STATS, STAT_KEYS, STAT_CAP, GEAR_NAMES, REGION_TYPES, EVENTS, initCampaign, neighbours, connected, income, power, timeFactor, advanceRound, rollEvent, roundEvent, knownTo, levelMods, explainDefeat };
})();
