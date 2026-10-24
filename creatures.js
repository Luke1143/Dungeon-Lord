// Abilities (godhand Teil 22, docs/faehigkeiten.md): a table of what a creature can do, who learns what at level 5 and 10, and the few rules around it.
//   target:   'self' | 'foe' | 'area' | 'ally' | 'tile'  (what the manual use aims at; the AI picks by the `auto` rule)
//   range:    tiles; cooldown: ticks; power: how much a slot is worth (the weakest learned ability is forgotten first)
//   passive:  no use, other rules ask `knows(c,id)`
//   quiet:    no log line
// run(c, ctx) may return false when nothing happened (the ability stays ready). ctx = { foe, ally, tile } when the player aims.
// Cooldowns are plain ticks counted down on the creature (c.abil.cd), no mana (godhand: "Nur Abklingzeiten").
const nearD=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const freeTileNear=(c,t)=>{ const res=bfsFind(t.x,t.y,(x,y)=>nearD({x,y},t)===1 && !tileOccupied(x,y,c)); return res?res.target:null; };
const ABILITIES={
  haste:    { name:'Eile',          icon:'💨', target:'self', range:8, cooldown:90, power:2, text:'Eile!', quiet:true,
              auto:c=>!(c.hastedTicks>0) && bossFoesNear(c,8).length>0,
              run:c=>{ if(c.kind==='imp'){ c.hasteTicks=HASTE_DURATION; c.hasteCooldown=HASTE_COOLDOWN; } else c.hastedTicks=24; } },
  teleport: { name:'Teleport',      icon:'🌀', target:'tile', range:10, cooldown:80, power:4, text:'springt durch den Raum',
              auto:c=>{ const f=bossFoesNear(c,10).filter(o=>nearD(o,c)>=4)[0]; return f?{ foe:f }:null; },
              run:(c,ctx)=>{ let t=ctx&&ctx.tile; if(!t&&ctx&&ctx.foe) t=freeTileNear(c,ctx.foe); if(!t) return false;
                spawnEffect('teleportOut',c.x,c.y); c.x=t.x; c.y=t.y; c.renderX=t.x; c.renderY=t.y; c.fx=t.x+0.5; c.fy=t.y+0.5; c.path=[]; spawnEffect('teleportIn',t.x,t.y);
                if(c.kind==='imp') c.teleportCooldown=TELEPORT_COOLDOWN; } },
  sweep:    { name:'Rundumhieb',    icon:'🌀', target:'area', range:1, cooldown:50, power:3, text:'schlägt einen Kreis um sich!',
              auto:c=>bossFoesNear(c,1).length>0, run:c=>{ const fs=bossFoesNear(c,1); if(!fs.length) return false; fs.forEach(f=>resolveAttack(c,f,null)); } },
  lunge:    { name:'Ausfallschritt',icon:'🏃', target:'foe', range:3, cooldown:60, power:3, text:'springt heran und schlägt zu!',
              auto:c=>{ const f=bossFoesNear(c,3).find(o=>nearD(o,c)>=2); return f?{ foe:f }:null; },
              run:(c,ctx)=>{ const f=ctx&&ctx.foe; if(!f) return false; const t=nearD(f,c)<=1?{x:c.x,y:c.y}:freeTileNear(c,f); if(!t) return false;
                c.x=t.x; c.y=t.y; c.renderX=t.x; c.renderY=t.y; c.fx=t.x+0.5; c.fy=t.y+0.5; c.path=[]; resolveAttack(c,f,null); } },
  swoop:    { name:'Sturzflug',     icon:'🦅', target:'foe', range:7, cooldown:80, power:3, text:'stürzt auf einen Gegner herab!',
              auto:c=>{ const f=bossFoesNear(c,7).find(o=>nearD(o,c)>=3); return f?{ foe:f }:null; }, run:(c,ctx)=>ABILITIES.lunge.run(c,ctx) },
  fireball: { name:'Feuerball',     icon:'🔥', target:'tile', range:5, cooldown:70, power:4, text:'schleudert einen Feuerball!',
              auto:c=>{ const f=bossFoesNear(c,5).find(o=>nearD(o,c)>=2)||bossFoesNear(c,5)[0]; return f?{ foe:f }:null; },
              run:(c,ctx)=>{ const t=(ctx&&ctx.tile)||(ctx&&ctx.foe); if(!t) return false;
                const hit=state.creatures.concat(state.imps).filter(o=>o!==c&&!o.held&&!o.unconscious&&areHostile(c,o)&&nearD(o,t)<=1); if(!hit.length) return false;
                hit.forEach(f=>{ resolveAttack(c,f,null); }); emitFx('dig',t.x,t.y,{ color:'#ff7a20' }); } },
  heal:     { name:'Heilung',       icon:'💚', target:'ally', range:3, cooldown:40, power:3, text:'heilt einen Verbündeten.', quiet:true,
              auto:c=>{ const o=state.creatures.find(o=>o!==c&&o.faction===c.faction&&!o.unconscious&&o.hp<o.maxHp*0.6&&nearD(o,c)<=3); return o?{ ally:o }:null; },
              run:(c,ctx)=>{ const o=ctx&&ctx.ally; if(!o) return false; o.hp=Math.min(o.maxHp,o.hp+Math.round(o.maxHp*0.25)); emitFx('claim',o.x,o.y); } },
  curse:    { name:'Fluch',         icon:'🥶', target:'foe', range:4, cooldown:60, power:3, text:'schwächt die Gegner.', quiet:true,
              auto:c=>bossFoesNear(c,4).some(f=>!(f.weakTicks>0)), run:c=>{ const fs=bossFoesNear(c,4).filter(f=>!(f.weakTicks>0)).slice(0,2); if(!fs.length) return false; fs.forEach(f=>{ f.weakTicks=40; }); } },
  paralyze: { name:'Lähmen',        icon:'😱', target:'area', range:5, cooldown:70, power:4, text:'Eindringlinge erstarren!',
              auto:c=>bossFoesNear(c,5).length>0, run:c=>{ bossFoesNear(c,5).forEach(f=>{ f.rootedTicks=14; f.path=[]; }); } },
  charm:    { name:'Verzaubern',    icon:'💋', target:'foe', range:6, cooldown:90, power:4, text:'verdreht einem Helden den Kopf: er kämpft kurz für die Dunkelheit!',
              auto:c=>bossFoesNear(c,6).some(f=>f.category==='hero'&&!f.isBoss&&!f.charmedTicks),
              run:c=>{ const fs=bossFoesNear(c,6).filter(f=>f.category==='hero'&&!f.isBoss&&!f.charmedTicks); if(!fs.length) return false; const f=fs[Math.floor(Math.random()*fs.length)];
                f.charmedFrom=f.faction; f.charmedTicks=30; f.faction=c.faction; f.fightTarget=null; f.path=[]; } },
  summon:   { name:'Beschwören',    icon:'💀', target:'self', range:8, cooldown:140, power:5, text:'ruft Knochen aus dem Boden!',
              auto:c=>bossFoesNear(c,8).length>0,
              run:c=>{ for(let i=0;i<2;i++){ const res=bfsFind(c.x,c.y,(x,y)=>nearD({x,y},c)>=1&&!tileOccupied(x,y,c)); const at=res?res.target:{x:c.x,y:c.y};
                const sk=createHorde('skeleton',at.x,at.y); sk.faction=c.faction; state.creatures.push(sk); emitFx('claim',at.x,at.y); } } },
  rage:     { name:'Wutschrei',     icon:'💢', target:'self', range:4, cooldown:100, power:3, text:'brüllt auf und schlägt fester zu!',
              auto:c=>!(c.rageTicks>0)&&bossFoesNear(c,4).length>0, run:c=>{ c.rageTicks=20; } },
  guard:    { name:'Panzerhaltung', icon:'🛡️', target:'self', range:3, cooldown:120, power:3, text:'geht in Deckung.', quiet:true,
              auto:c=>!(c.tempDefenseTicks>0)&&bossFoesNear(c,3).length>0&&c.hp<c.maxHp*0.85, run:c=>{ c.tempDefense=40; c.tempDefenseTicks=30; } },
  blessing: { name:'Segen',         icon:'✨', target:'area', range:3, cooldown:120, power:4, text:'spricht einen Segen.',
              auto:c=>bossFoesNear(c,6).length>0&&state.creatures.some(o=>o!==c&&o.faction===c.faction&&!o.unconscious&&nearD(o,c)<=3),
              run:c=>{ state.creatures.forEach(o=>{ if(o.faction===c.faction&&!o.unconscious&&nearD(o,c)<=3){ o.tempDefense=Math.max(o.tempDefense||0,25); o.tempDefenseTicks=40; o.hp=Math.min(o.maxHp,o.hp+Math.round(o.maxHp*0.1)); } }); } },
  haste_others:{ name:'Antreiben',   icon:'💨', target:'area', range:5, cooldown:60, power:3, text:'', quiet:true,
              auto:c=>state.creatures.some(o=>o!==c&&o.faction===c.faction&&!o.unconscious&&!(o.rallyTicks>0)&&nearD(o,c)<=5)&&bossFoesNear(c,9).length>0,
              run:c=>{ state.creatures.forEach(o=>{ if(o!==c&&o.faction===c.faction&&!o.unconscious&&nearD(o,c)<=5) o.rallyTicks=24; }); } },
  wallbreak:{ name:'Mauerbruch',    icon:'💥', target:'tile', range:1, cooldown:60, power:3, text:'bricht die Mauer!',
              auto:()=>null,
              run:(c,ctx)=>{ const t=ctx&&ctx.tile; if(!t) return false; const g=state.grid[t.y]&&state.grid[t.y][t.x]; if(!g||g.type==='bedrock') return false;
                if(g.type==='rock'){ g.type='floor'; g.owned=false; g.natural=true; g.gold=false; g.ore=false; g.marked=false; g.reinforced=false; }
                else if(g.goodRoom){ g.goodRoom=null; } else if(g.room==='bridge'){ g.room=null; } else return false;
                if(typeof SFX!=='undefined') SFX.play('break',{ x:t.x, y:t.y }); emitFx('dig',t.x,t.y,{ color:'#8a7a68' }); } },
  thorns:   { name:'Dornen',        icon:'🌿', target:'foe', range:4, cooldown:60, power:3, text:'lässt Wurzeln wachsen: ein Eindringling sitzt fest!',
              auto:c=>bossFoesNear(c,4).length>0, run:c=>{ const fs=bossFoesNear(c,4); if(!fs.length) return false; const f=fs[Math.floor(Math.random()*fs.length)]; f.rootedTicks=22; f.path=[]; } },
  breath:   { name:'Atem',          icon:'🐲', target:'area', range:5, cooldown:70, power:5, text:'atmet Feuer!',
              auto:c=>bossFoesNear(c,5).length>0, run:c=>{ const fs=bossFoesNear(c,5); if(!fs.length) return false; fs.forEach(f=>{ resolveAttack(c,f,null); resolveAttack(c,f,null); }); } },
  smite:    { name:'Richten',       icon:'⚡', target:'area', range:4, cooldown:90, power:5, text:'richtet mit heiligem Licht!',
              auto:c=>bossFoesNear(c,4).length>0, run:c=>{ const fs=bossFoesNear(c,4); if(!fs.length) return false; fs.forEach(f=>{ resolveAttack(c,f,null); resolveAttack(c,f,null); }); } },
  swarm:    { name:'Schwarm',       icon:'🪰', target:'area', range:6, cooldown:100, power:2, text:'', quiet:true,
              auto:c=>bossFoesNear(c,6).some(f=>f.fightTarget!==c), run:c=>{ bossFoesNear(c,6).forEach(f=>{ f.fightTarget=c; }); } },
  howl:     { name:'Heulen',        icon:'🐺', target:'area', range:3, cooldown:80, power:3, text:'heult: die Gegner zucken zurück.',
              auto:c=>bossFoesNear(c,3).length>0, run:c=>{ bossFoesNear(c,3).forEach(f=>{ f.weakTicks=40; }); } },
  burst:    { name:'Selbstzerstörung', icon:'💥', target:'area', range:2, cooldown:999, power:2, text:'platzt in einer Feuersbrunst!',
              auto:c=>c.hp<c.maxHp*0.5&&bossFoesNear(c,1).length>0,
              run:c=>{ const fs=bossFoesNear(c,2); if(!fs.length) return false; fs.forEach(f=>{ resolveAttack(c,f,null); resolveAttack(c,f,null); resolveAttack(c,f,null); }); emitFx('dig',c.x,c.y,{ color:'#ff7a20' }); killCreature(c,null); } },
  devour:   { name:'Verzehren',     icon:'🦷', target:'self', range:1, cooldown:80, power:3, text:'', quiet:true,
              auto:c=>c.hp<c.maxHp*0.8&&state.corpses.some(co=>nearD(co,c)<=1),
              run:c=>{ const i=state.corpses.findIndex(co=>nearD(co,c)<=1); if(i<0) return false; state.corpses.splice(i,1); c.hp=Math.min(c.maxHp,c.hp+Math.round(c.maxHp*0.35));
                if(Math.random()<0.25) learnRandomAbility(c); } },
  revive:   { name:'Wecken',        icon:'🦄', target:'ally', range:4, cooldown:150, power:5, text:'weckt einen Gefallenen!',
              auto:c=>state.creatures.some(o=>o!==c&&o.faction===c.faction&&o.unconscious&&!o.imprisoned&&nearD(o,c)<=4),
              run:c=>{ const o=state.creatures.find(o=>o!==c&&o.faction===c.faction&&o.unconscious&&!o.imprisoned&&nearD(o,c)<=4); if(!o) return false; o.unconscious=false; o.hp=Math.max(1,Math.round(o.maxHp*0.4)); } },
  pilfer:   { name:'Stehlen',       icon:'🧦', target:'self', range:99, cooldown:50, power:2, text:'', quiet:true,
              auto:c=>c.faction==='good'&&(state.gold||0)>0&&!!state.grid[c.y]&&state.grid[c.y][c.x].owned,
              run:c=>{ const g=Math.min(state.gold,25); if(g<=0) return false; state.gold-=g; c.loot=(c.loot||0)+g; logEvent(`${actorLabel(c)} stiehlt ${g} Gold!`, c.x, c.y); } },
  ward:     { name:'Schutz',        icon:'😇', passive:true, power:5, text:'fängt einmal einen tödlichen Schlag für einen Verbündeten ab' },
  rebirth:  { name:'Wiedergeburt',  icon:'🔥', passive:true, power:5, text:'steigt einmal aus der Asche wieder auf' }
};
// Who learns what at level 5 and level 10 (docs/faehigkeiten.md). Bosses keep their own list (BOSS_ABILITIES), the Dungeon Lord learns from artifacts.
const SPECIES_ABILITIES={
  imp:['haste','teleport'], fly:['haste','swarm'], beetle:['sweep','guard'], hound:['haste','howl'], lizard:['haste','lunge'], brood:['rage','burst'],
  ork:['rage','sweep'], goblin:['haste','lunge'], troll:['sweep','wallbreak'], warlock:['fireball','curse'], darkelf:['lunge','teleport'], priest:['heal','curse'],
  darkknight:['rage','sweep'], succubus:['curse','charm'], demon:['fireball','breath'], skeleton:['sweep',null], ghoul:['lunge','devour'], zombie:['sweep','devour'],
  banshee:['paralyze','curse'], ghost:['curse','teleport'], vampire:['lunge','charm'], werewolf:['rage','lunge'], lich:['fireball','summon'], dragon:['breath','sweep'],
  barbarian:['rage','sweep'], thief:['haste','lunge'], wizard:['fireball','teleport'], knight:['sweep','rage'], paladin:['heal','blessing'], archer:['lunge','fireball'],
  monk:['haste','sweep'], elf:['thorns','heal'], dwarf:['guard','wallbreak'], giant:['sweep','wallbreak'], golem:['guard','sweep'], dryad:['thorns','heal'],
  yule:['haste','lunge'], fairy:['heal','haste_others'], griffin:['swoop','sweep'], unicorn:['heal','revive'], kitsune:['curse','charm'], wisp:['haste_others','paralyze'],
  angel:['heal','smite'], phoenix:['fireball','rebirth'], guardian:['ward','heal']
};
// known from the start and outside the slots: the creature's nature
const BASE_ABILITIES={ yule:['pilfer'] };
// what a creature of this kind might write into a book as a new idea (by fighting style, plus the kind's own two)
const ARCHETYPE_POOL={ fighter:['rage','sweep','guard','lunge'], assassin:['haste','lunge','curse','teleport'], support:['heal','curse','haste_others','blessing'], mage:['fireball','curse','heal','summon'] };
const HEALERS={ paladin:{ radius:3, amount:2 }, dryad:{ radius:4, amount:2 }, fairy:{ radius:5, amount:2 }, unicorn:{ radius:3, amount:3 }, angel:{ radius:4, amount:3 }, priest:{ radius:3, amount:2 } };


// ---- combat stances: a rule every creature follows, separate from its passive ----
//   aggressive: a foe one tile out of reach is closed in with the blow (a lunge), so runners are still hit
//   steadfast:  a blow moves nothing, the creature holds its ground
//   kite:       a ranged attacker with a foe at its throat takes one step back after the shot
const STANCES={
  aggressive:{ label:'Angriffslustig', text:'schließt mit jedem Schlag eine Lücke von einem Feld' },
  steadfast: { label:'Standhaft',      text:'hält die Stellung, ein Schlag bewegt nichts' },
  kite:      { label:'Kiter',          text:'weicht nach dem Schuss einen Schritt zurück, wenn ein Feind dicht dran ist' }
};
const STANCE_OF={ barbarian:'aggressive', ork:'aggressive', goblin:'aggressive', werewolf:'aggressive', hound:'aggressive', thief:'aggressive', demon:'aggressive', brood:'aggressive', lizard:'aggressive',
  griffin:'aggressive', vampire:'aggressive', ghoul:'aggressive', phoenix:'aggressive', kitsune:'aggressive', unicorn:'aggressive', fly:'aggressive', succubus:'aggressive', yule:'aggressive',
  troll:'steadfast', golem:'steadfast', knight:'steadfast', paladin:'steadfast', dwarf:'steadfast', giant:'steadfast', skeleton:'steadfast', zombie:'steadfast', darkknight:'steadfast', dragon:'steadfast',
  dwarfking:'steadfast', arthur:'steadfast', herakles:'steadfast', guardian:'steadfast', angel:'steadfast', monk:'steadfast', beetle:'steadfast', ghost:'steadfast', warlock:'kite',
  archer:'kite', wizard:'kite', elf:'kite', darkelf:'kite', priest:'kite', lich:'kite', banshee:'kite', dryad:'kite', wisp:'kite', fairy:'kite', oberon:'kite' };
function stanceOf(c){ return STANCE_OF[c.kind] || (reachOf(c)>1 ? 'kite' : 'aggressive'); }

const ABILITY_LEVELS=[5,10];
// slots: innate abilities and learned ones share them (godhand: beasts 0-1, horde 3, undead 2, legendary 4+); two belong to the innate pair
function knowSlots(c){
  if(c.kind==='dungeonlord') return 5;
  const k=SPECIES[c.kind]||{};
  if(c.kind==='lich'||c.kind==='dragon') return 4;
  if(k.category==='beast') return 2;
  if(k.category==='undead') return 2;
  return 3;
}
function innateIds(c){ return (SPECIES_ABILITIES[c.kind]||[]).filter(Boolean); }
// what the creature can do now: its innate abilities by level, its nature, what it learned (cut to the free slots)
function knownAbilities(c){
  if(c.kind==='dungeonlord') return lordAbilityIds();
  const lv=c.level||1, out=[];
  (SPECIES_ABILITIES[c.kind]||[]).forEach((id,i)=>{ if(id && lv>=ABILITY_LEVELS[i]) out.push(id); });
  const free=Math.max(0, knowSlots(c)-innateIds(c).length);
  (c.learned||[]).slice(0,free).forEach(id=>{ if(!out.includes(id)) out.push(id); });
  (BASE_ABILITIES[c.kind]||[]).forEach(id=>{ if(!out.includes(id)) out.push(id); });
  return out;
}
function knows(c,id){ return knownAbilities(c).includes(id); }
function learnableSlots(c){ return Math.max(0, knowSlots(c)-innateIds(c).length); }
// a new ability goes into a free slot, or replaces the weakest learned one when it is better
function learnAbility(c,id){
  const a=ABILITIES[id]; if(!a) return false;
  c.learned=c.learned||[];
  if(c.learned.includes(id) || innateIds(c).includes(id)) return false;
  const slots=learnableSlots(c); if(slots<=0) return false;
  if(c.learned.length>=slots){
    const weakest=c.learned.reduce((w,x)=> (ABILITIES[x].power<ABILITIES[w].power)?x:w, c.learned[0]);
    if(ABILITIES[weakest].power>=a.power) return false;
    c.learned=c.learned.filter(x=>x!==weakest); logEvent(`${actorLabel(c)} vergisst "${ABILITIES[weakest].name}".`, c.x, c.y);
  }
  c.learned.push(id);
  logEvent(`${actorLabel(c)} lernt "${a.name}"!`, c.x, c.y);
  return true;
}
function archetypeOf(c){ const k=SPECIES[c.kind]||{}; if(c.kind==='warlock'||c.kind==='wizard'||c.kind==='lich'||c.kind==='priest') return 'mage'; return k.style||'fighter'; }
function rollNewAbility(c){
  const pool=(ARCHETYPE_POOL[archetypeOf(c)]||[]).filter(id=>!knownAbilities(c).includes(id));
  return pool.length?pool[Math.floor(Math.random()*pool.length)]:null;
}
function learnRandomAbility(c){ const id=rollNewAbility(c); return id?learnAbility(c,id):false; }

// ---- cooldowns and use ----
function abilityCd(c,id){
  if(c.kind==='imp'){ if(id==='haste') return c.hasteCooldown||0; if(id==='teleport') return c.teleportCooldown||0; }
  return ((c.abil&&c.abil.cd)||{})[id]||0;
}
function abilityCdMax(c,id){ if(c.kind==='imp'){ if(id==='haste') return HASTE_COOLDOWN; if(id==='teleport') return TELEPORT_COOLDOWN; } return ABILITIES[id].cooldown; }
function useAbility(c,id,ctx){
  const a=ABILITIES[id]; if(!a || a.passive || !knows(c,id) || abilityCd(c,id)>0 || c.unconscious || c.exhausted) return false;
  if(a.run(c,ctx||{})===false) return false;
  if(c.kind!=='imp' && typeof spendStamina==='function') spendStamina(c,ABILITY_STAMINA);
  c.abil=c.abil||{ cd:{}, used:{} }; c.abil.cd[id]=a.cooldown;
  if(!a.quiet && a.text) logEvent(`${actorLabel(c)} ${a.text}`, c.x, c.y);
  c.shout=a.icon; c.shoutTicks=8;
  dbg('ability', `${actorLabel(c)}: ${id}`);
  return true;
}
// the AI uses its abilities while foes are about (imps have their own errands, see tryImpAbilities)
function runAbilities(c,manual){
  if(c.unconscious || c.kind==='imp') return;
  c.abil=c.abil||{ cd:{}, used:{} };
  if(c.shoutTicks>0) c.shoutTicks--; else c.shout=null;
  for(const k in c.abil.cd) if(c.abil.cd[k]>0) c.abil.cd[k]--;
  if(manual) return;       // a possessed creature uses its abilities when the player says so
  for(const id of knownAbilities(c)){
    const a=ABILITIES[id]; if(!a||a.passive||abilityCd(c,id)>0||!a.auto) continue;
    if(c.kind==='dungeonlord' && ['teleport','lunge','swoop'].includes(id)) continue;     // the Lord keeps his throne
    const ctx=a.auto(c); if(!ctx) continue;
    useAbility(c,id,ctx===true?{}:ctx);
  }
}
// the Dungeon Lord learns abilities from artifacts (docs/faehigkeiten.md, question 4), not from levels
function lordAbilityIds(){
  const out=[]; ((typeof campaign!=='undefined'&&campaign&&campaign.artifacts)||[]).forEach(id=>{ const a=ARTIFACT_BY_ID[id]; (a&&a.abilities||[]).forEach(x=>{ if(!out.includes(x)) out.push(x); }); });
  return out;
}
// what the player aims at in first person with an ability: the foe under the crosshair, the nearest hurt ally, the tile ahead
function abilityAim(c,id){
  const a=ABILITIES[id], dx=Math.cos(c.fpYaw||0), dy=Math.sin(c.fpYaw||0), ctx={};
  const foes=bossFoesNear(c,a.range||6).sort((p,q)=>nearD(p,c)-nearD(q,c));
  const tg=typeof fpPickTarget==='function'?fpPickTarget(c):null;
  ctx.foe=(tg&&tg.foe)||foes[0];
  ctx.ally=state.creatures.filter(o=>o!==c&&o.faction===c.faction&&!o.unconscious&&nearD(o,c)<=(a.range||3)).sort((p,q)=>(p.hp/p.maxHp)-(q.hp/q.maxHp))[0];
  if(a.target==='tile'){
    let t=null; const cx=c.fx||c.x+0.5, cy=c.fy||c.y+0.5;
    for(let d=a.range;d>=1;d--){ const x=Math.floor(cx+dx*d), y=Math.floor(cy+dy*d); if(x<0||y<0||x>=WORLD_COLS||y>=WORLD_ROWS) continue;
      const g=state.grid[y][x]; if(id==='wallbreak'){ if(d===1){ t={x,y}; break; } continue; }
      if(id==='fireball' && ctx.foe){ t={x:ctx.foe.x,y:ctx.foe.y}; break; }
      if(isWalkable(x,y)&&!tileOccupied(x,y,c)&&g.type==='floor'){ t={x,y}; break; } }
    ctx.tile=t;
  }
  return ctx;
}
