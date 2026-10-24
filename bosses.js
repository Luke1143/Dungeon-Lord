// Boss abilities as a table (design: bosses escalate; new boss ability = a new row). Each ability has a trigger and an effect:
//   cooldown: ticks between uses, only while a foe is near (`range`)
//   hpBelow:  once, when the boss falls under this share of its life
// An ability announces itself in the log, shows an icon over the boss for a moment and uses the same systems as everybody (resolveAttack, spawnHero ...).
// Cosmetic randomness only through Math.random like the rest of the game; the state lives on the boss (c.abil).
const BOSS_ABILITIES={
  dwarfking:[
    { id:'dwarves',  hpBelow:0.6, icon:'📯', text:'Alberich bläst das Horn: Zwerge eilen herbei!', run:c=>{ ['dwarf','dwarf'].forEach((k,i)=>bossSpawnNear(c,k,3+i)); } },
    { id:'quake',    cooldown:70, range:2, icon:'💥', text:'Alberich lässt den Boden beben!',
      run:c=>{ bossFoesNear(c,2).forEach(f=>{ resolveAttack(c,f,null); }); for(let i=0;i<4;i++) emitFx('dig', c.x+((i%2)?1:-1)*(1+(i>>1)), c.y, { color:'#6b5a48' }); if(typeof SFX!=='undefined') SFX.play('break',{ x:c.x, y:c.y }); } }
  ],
  oberon:[
    { id:'entangle', cooldown:80, range:7, icon:'🌿', text:'Oberon ruft die Wurzeln: ein Eindringling sitzt fest!',
      run:c=>{ const fs=bossFoesNear(c,7); if(!fs.length) return false; const f=fs[Math.floor(Math.random()*fs.length)]; f.rootedTicks=26; f.path=[]; } },
    { id:'rejuvenate', hpBelow:0.5, icon:'🌳', text:'Oberon trinkt aus dem Weltenbaum und erholt sich! Bogenschützen treten hervor.',
      run:c=>{ c.hp=Math.min(c.maxHp,c.hp+Math.round(c.maxHp*0.35)); ['archer','archer'].forEach((k,i)=>bossSpawnNear(c,k,3+i)); } }
  ],
  arthur:[
    { id:'rally',    cooldown:120, range:8, icon:'🚩', text:'Artus ruft: „Für Camelot!“ Seine Ritter schlagen schneller zu.',
      run:c=>{ state.creatures.forEach(o=>{ if(factionOf(o)==='good' && !o.unconscious && Math.abs(o.x-c.x)+Math.abs(o.y-c.y)<=9){ o.rallyTicks=32; o.alert=true; } }); } },
    { id:'shieldwall', hpBelow:0.4, icon:'🛡️', text:'Artus hebt den Schild: die Tafelrunde schließt ihre Reihen!',
      run:c=>{ c.tempDefense=50; c.tempDefenseTicks=44; ['knight','knight'].forEach((k,i)=>bossSpawnNear(c,k,3+i)); } }
  ],
  herakles:[
    { id:'rage',     hpBelow:0.5, icon:'🦁', text:'Herakles brüllt vor Zorn und ruft seine Streiter!',
      run:c=>{ c.baseTempo=(c.baseTempo||1)*1.4; c.alert=true; ['paladin','knight','archer'].forEach((k,i)=>bossSpawnNear(c,k,3+i)); } },
    { id:'club',     cooldown:90, range:2, icon:'💢', text:'Herakles schwingt die Keule im Kreis!',
      run:c=>{ bossFoesNear(c,2).forEach(f=>{ resolveAttack(c,f,null); resolveAttack(c,f,null); }); } }
  ]
};

function bossFoesNear(c,r){
  return state.creatures.concat(state.imps).filter(o=>o!==c && !o.held && !o.unconscious && areHostile(c,o) && Math.abs(o.x-c.x)+Math.abs(o.y-c.y)<=r && (r<=1 || lineClear(c.x,c.y,o.x,o.y)));
}
// a reinforcement of the boss's side appears on a free floor tile near it
function bossSpawnNear(c,kind,radius){
  const mods=waveMods(state.war), lvl=Math.max(1,Math.round((c.level||3)*0.8)+(mods.levelBonus||0));
  const res=bfsFind(c.x,c.y,(x,y)=>Math.abs(x-c.x)+Math.abs(y-c.y)>=2 && !tileOccupied(x,y,c));
  const at=res?res.target:{ x:c.x, y:c.y };
  const h=createHero(kind, at.x, at.y); h.level=lvl; h.maxHp=statMaxHp(h); h.hp=h.maxHp; h.inventory=heroGear(kind,lvl,false,mods.gearTier||1);
  state.creatures.push(h); emitFx('claim', at.x, at.y);
}
function runBossAbilities(c){
  const list=BOSS_ABILITIES[c.kind]; if(!list || c.faction!=='good' || c.unconscious) return;
  const st=c.abil=c.abil||{ cd:{}, used:{} };
  if(c.shoutTicks>0) c.shoutTicks--; else c.shout=null;
  for(const a of list){
    if(a.hpBelow){
      if(st.used[a.id] || c.hp>c.maxHp*a.hpBelow) continue;
      st.used[a.id]=true;
    } else {
      st.cd[a.id]=(st.cd[a.id]||0)-1;
      if(st.cd[a.id]>0) continue;
      if(!bossFoesNear(c,a.range).length) { st.cd[a.id]=0; continue; }
      st.cd[a.id]=a.cooldown;
    }
    if(a.run(c)===false) continue;
    c.shout=a.icon; c.shoutTicks=8;
    logEvent(a.text, c.x, c.y);
    dbg('boss', `${actorLabel(c)}: ${a.id}`);
  }
}
