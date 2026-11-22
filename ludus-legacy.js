// The legacy: what a school leaves to the next one (docs/ludus.md, "Das Vermächtnis"). Losing is part of the game; it should move something forward.
// 1. Kinds are learnt by deed: a new school may be of a starter kind, or of any kind a school of yours has beaten in a bout or had fight for it.
// 2. The heirloom: at the end of a run the player picks one of the three best pieces the school owned (none picked: the best); the first gladiator of the next school starts with it.
// 3. Trophies: every rival avenged is a trophy; each gives the next schools 5 gold more at the start (at most 50).
// 4. The hall of the fallen: who of yours died, when, how and by whose hand (the last 24).
// ludusMeta: { known:[kind], heirloom:inst|null, heirloomChoice:[inst], trophies:[{ name, kind, level, rank, run }], fallen:[{ name, kind, level, day, how, by, run }], v }
const LUDUS_LEGACY={ trophyGold:5, trophyGoldMax:50, fallen:24, choice:3 };

// ---- kinds ----
function ludusLearnKind(kind){
  if(!kind||!SPECIES[kind]||LUDUS_STARTER_KINDS.includes(kind)) return;
  ludusMeta.known=ludusMeta.known||[]; if(ludusMeta.known.includes(kind)) return;
  ludusMeta.known.push(kind); if(ludus&&ludus.map) ludusChron(ludus.map.region,'legacy',`Deine Schulen kennen jetzt die Art ${SPECIES[kind].label}: neue Schulen können sie wählen.`);
}
const ludusKnownKind=k=>LUDUS_STARTER_KINDS.includes(k)||(ludusMeta.known||[]).includes(k);

// ---- the hall of the fallen ----
function ludusHallAdd(m,how,by){
  if(!m) return;
  ludusMeta.fallen=(ludusMeta.fallen||[]).concat([{ name:m.name, kind:m.kind, level:m.level, day:ludus.day, how, by:by||'', run:ludusMeta.runs||0 }]).slice(-LUDUS_LEGACY.fallen);
}

// ---- trophies ----
function ludusTrophyAdd(n,e){
  ludusMeta.trophies=(ludusMeta.trophies||[]).concat([{ name:n.name, kind:n.kind, level:n.level, rank:e?ludusRivalRank(e):'', run:ludusMeta.runs||0 }]);
}
const ludusTrophyGold=()=>Math.min(LUDUS_LEGACY.trophyGoldMax,LUDUS_LEGACY.trophyGold*(ludusMeta.trophies||[]).length);

// ---- the heirloom: chosen at the end of a run from the best pieces of the school (what the last fighters wore, what lay in the stash) ----
function ludusLegacyEnd(team){
  const pool=[].concat(...(team||[]).map(m=>m.inventory||[]),ludus.stash||[],...(ludus.team||[]).map(m=>m.inventory||[]))
    .filter(i=>instDef(i)&&['weapon','armor','shield'].includes(instDef(i).type));
  const seen=new Set(), best=pool.sort((a,b)=>ludusPrice(b.id)-ludusPrice(a.id)||((b.q||1)-(a.q||1))).filter(i=>{ const k=JSON.stringify([i.id,i.q,i.s]); if(seen.has(k)) return false; seen.add(k); return true; }).slice(0,LUDUS_LEGACY.choice);
  ludusMeta.heirloomChoice=best.map(i=>{ const c=JSON.parse(JSON.stringify(i)); delete c.pin; delete c.off; return c; });
}
function ludusHeirloomPick(k){
  const c=(ludusMeta.heirloomChoice||[])[k]; if(!c) return;
  ludusMeta.heirloom=c; ludusMeta.heirloomChoice=[]; ludusNote=`Erbstück für die nächste Schule: ${instLabel(c)}.`; ludusSave(); ludusRender();
}
// a new school: the heirloom goes to its first gladiator, the trophies give gold
function ludusLegacyStart(){
  ludus.gold+=ludusTrophyGold();
  const h=ludusMeta.heirloom||(ludusMeta.heirloomChoice||[])[0]; ludusMeta.heirloom=null; ludusMeta.heirloomChoice=[];
  if(h&&instDef(h)){ ludus.stash.push(h); ludusGiveItem(h,ludus.team[0]); ludus.heirloom=instLabel(h); }
}

// ---- what the start screen and the end of a run show ----
function ludusLegacyHTML(){
  const t=ludusMeta.trophies||[], f=(ludusMeta.fallen||[]).slice().reverse(), known=(ludusMeta.known||[]).filter(k=>SPECIES[k]);
  const choice=ludusMeta.heirloomChoice||[];
  let h='<h3>Vermächtnis</h3>';
  if(choice.length) h+=`<p>Wähle ein Erbstück für die nächste Schule (sonst erbt sie das erste):</p>${choice.map((i,k)=>`<div class="luItem"><span>${ludusEsc(instLabel(i))}</span><button data-heir="${k}">Vererben</button></div>`).join('')}`;
  else if(ludusMeta.heirloom) h+=`<p>Erbstück für die nächste Schule: ${ludusEsc(instLabel(ludusMeta.heirloom))}</p>`;
  h+=`<p class="luHint">Gelernte Arten: ${known.length?known.map(k=>ludusEsc(SPECIES[k].label)).join(', '):'noch keine'} (eine Art lernt deine Schule, wenn sie einen Kampf gegen sie gewinnt oder ein Gladiator dieser Art für sie kämpft).</p>`;
  h+=`<p class="luHint">Trophäen: ${t.length?t.map(x=>ludusEsc(x.name)).join(', '):'noch keine'}${t.length?` · +${ludusTrophyGold()} Startgold`:''} (jeder Rivale, an dem du Rache nimmst, gibt 5 Gold mehr zum Start, höchstens 50).</p>`;
  if(f.length) h+=`<h3>Halle der Gefallenen</h3>${f.slice(0,8).map(x=>`<div class="luItem"><span>${ludusEsc(x.name)} — ${SPECIES[x.kind]?SPECIES[x.kind].label:x.kind}, Stufe ${x.level}</span><span>${x.how==='exec'?'hingerichtet':'gefallen'}${x.by?' '+(x.how==='exec'?'von':'durch')+' '+ludusEsc(x.by):''}, Tag ${x.day}</span></div>`).join('')}`;
  return h;
}
function ludusWireLegacy(el){ el.querySelectorAll('[data-heir]').forEach(b=>b.addEventListener('click',()=>ludusHeirloomPick(+b.dataset.heir))); }

// a save from before the legacy: the debug switch that opened every kind was on by default; from now on kinds are learnt
function ludusLegacyMigrate(){ if((ludusMeta.v||1)<2){ ludusMeta.unlockAll=false; ludusMeta.v=2; } }
