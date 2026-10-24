// Gifts: procedural run perks for the Ludus (docs/gaben.md). A gift is a few effects built from a catalogue: boons (what you gain) and, often, banes (what it costs).
// The generator spends a power budget by rarity; banes raise the budget, so a gift can be anything from a small plain bonus to a make-or-break pact
// ("immune to stun, but every blow costs 30 % more stamina", "two-handed weapons in one hand, but no armour"). Gifts are data: {id, name, rarity, fx:[{k, v, role}]}.
const GIFT_RARITY=['Gewöhnlich','Selten','Episch','Legendär'];
const GIFT_NOUN=['Gabe','Segen','Pakt','Erbe'];
const GIFT_BUDGET=[1.1,2.1,3.5,5.6];
// multiplicative effects: good = the direction of a boon; w = how much one step of 30 % is worth; name = the adjective in the title
const GIFT_MUL={
  strength:    { good:1, w:1.0, name:'Wuchtig',     text:v=>`Stärke ×${v}` },
  maxHp:       { good:1, w:0.8, name:'Zäh',         text:v=>`Leben ×${v}` },
  defense:     { good:1, w:0.9, name:'Eisern',      text:v=>`Verteidigung ×${v}` },
  tempo:       { good:1, w:1.2, name:'Flink',       text:v=>`Tempo ×${v}` },
  atkSpeed:    { good:1, w:1.2, name:'Rasend',      text:v=>`Angriffstempo ×${v}` },
  staminaCost: { good:-1, w:0.6, name:'Sparsam',    text:v=>`Ausdauerkosten ×${v}` },
  staminaRegen:{ good:1, w:0.6, name:'Ausdauernd',  text:v=>`Ausdauererholung ×${v}` },
  dodge:       { good:1, w:0.8, name:'Wendig',      text:v=>`Ausweichen ×${v}` },
  damageTaken: { good:-1, w:1.1, name:'Unverwundbar', text:v=>`Erlittener Schaden ×${v}` },
  fatigueTaken:{ good:-1, w:0.4, name:'Wach',       text:v=>`Müdigkeitsschaden ×${v}` },
  procMul:     { good:1, w:0.5, name:'Tückisch',    text:v=>`Chance auf Zustände (Betäubung, Blutung, Verlangsamung) ×${v}` },
  xp:          { good:1, w:0.5, name:'Lernbegierig', text:v=>`Erfahrung ×${v}` },
  gold:        { good:1, w:0.5, name:'Goldgierig',  text:v=>`Gold aus Kämpfen ×${v}` }
};
// rules: boon cost = power; param (if any) scales with rarity; bane = the same rule seen from the other side
const GIFT_FLAG={
  stunImmune:   { power:1.3, name:'Unerschütterlich', text:()=>'immun gegen Betäubung' },
  bleedImmune:  { power:1.0, name:'Blutstill',        text:()=>'immun gegen Blutung' },
  slowImmune:   { power:1.0, name:'Standfest',        text:()=>'immun gegen Verlangsamung' },
  sleepImmune:  { power:0.8, name:'Schlaflos',        text:()=>'wird von Hieben nicht müde' },
  twoHandOne:   { power:2.2, name:'Hüne',             text:()=>'führt Zweihandwaffen in einer Hand (auch mit Schild)', needs:['noArmor','noShield'] },
  lifesteal:    { power:1.4, name:'Blutdürstig',      param:[0.1,0.18,0.28,0.4], text:p=>`heilt ${Math.round(p*100)} % des angerichteten Schadens` },
  thorns:       { power:1.2, name:'Dornig',           param:[0.15,0.25,0.4,0.6], text:p=>`gibt ${Math.round(p*100)} % des erlittenen Schadens zurück` },
  sprintFree:   { power:1.0, name:'Läufer',           text:()=>'Fluchtschritte kosten keine Ausdauer' },
  fearless:     { power:0.8, name:'Furchtlos',        text:()=>'flieht nie' },
  onKillHeal:   { power:1.3, name:'Plünderer',        param:[0.15,0.25,0.4,0.6], text:p=>`heilt ${Math.round(p*100)} % des Lebens, wenn ein Feind fällt` },
  onKillStamina:{ power:0.9, name:'Triumph',          text:()=>'füllt die Ausdauer, wenn ein Feind fällt' },
  cheatDeath:   { power:2.4, name:'Unsterblich',      text:()=>'überlebt einmal pro Kampf einen tödlichen Treffer mit 1 Leben' },
  rage:         { power:1.6, name:'Berserker',        param:[0.4,0.7,1.1,1.6], text:p=>`je weniger Leben, desto stärker (bis +${Math.round(p*100)} %)` },
  lunger:       { power:0.8, name:'Stürmer',          text:()=>'kämpft immer mit Ausfallschritt (angriffslustig)' },
  sniper:       { power:0.8, name:'Schütze',          text:()=>'weicht im Kampf immer zurück (Kiter)' },
  dualNoPenalty:{ power:0.7, name:'Beidhändig',       text:()=>'die Nebenhand schlägt ohne Abzug' },
  // banes: cost (what the gift is worth more for taking it)
  noArmor:      { cost:2.0, name:'ohne Rüstung',      text:()=>'kann keine Rüstung tragen' },
  noShield:     { cost:0.9, name:'ohne Schild',       text:()=>'kann kein Schild tragen' },
  noFlight:     { cost:0.5, name:'ohne Rückzug',      text:()=>'kann nicht sprinten' },
  frail:        { cost:1.0, name:'zerbrechlich',      text:()=>'Verteidigung wirkt nur halb' }
};
const BANE_FLAGS=['noArmor','noShield','noFlight','frail'];
// the generator ---------------------------------------------------------------------------------------
const ln13=Math.log(1.3);
const mulPower=(k,v)=>{ const d=GIFT_MUL[k]; return d.w*Math.abs(Math.log(v))/ln13; };
const mulValue=(k,power,boon)=>{ const d=GIFT_MUL[k], dir=(d.good>0)===boon?1:-1; return +Math.min(3,Math.max(0.35,Math.exp(dir*power/d.w*ln13))).toFixed(2); };
function giftFxList(g){ return g.fx; }
// a rule is on when any gift names it (as a boon or as a bane)
function giftOn(c,key){ return !!(c.gifts&&c.gifts.some(g=>g.fx.some(f=>f.k===key))); }
// multiplier of all gifts for a stat (1 when none)
function giftMul(c,key){ if(!c.gifts||!c.gifts.length) return 1; let m=1; c.gifts.forEach(g=>g.fx.forEach(f=>{ if(f.k===key) m*=f.v; })); return m; }
// the parameter of a rule gift (the best one), 0 when none
function giftParam(c,key){ if(!c.gifts) return 0; let p=0; c.gifts.forEach(g=>g.fx.forEach(f=>{ if(f.k===key&&f.role==='boon') p=Math.max(p,f.v===true?1:f.v); })); return p; }
// "weights" nudge the offer towards what the fighter can use, without ever excluding the strange finds
function giftWeight(key,c){
  const worn=c?wornSlots(c):{}, w=worn.rh&&instDef(worn.rh), twoH=c&&(c.inventory||[]).some(i=>(instDef(i)||{}).hands===2&&(instDef(i)||{}).type==='weapon');
  const ranged=!!(w&&w.cat!=='melee'), melee=!!(w&&w.cat==='melee');
  switch(key){
    case 'twoHandOne': return twoH?3:0.4;
    case 'dualNoPenalty': return (c&&dualWielding(c))?3:0.3;
    case 'sniper': return ranged?2.5:0.6;
    case 'lunger': return melee?1.5:0.6;
    case 'noArmor': return (worn.body)?0.2:1.5;
    case 'noShield': return (worn.lh&&instDef(worn.lh)&&instDef(worn.lh).type==='shield')?0.3:1.5;
    case 'frail': return worn.body?0.5:1.2;
    default: return 1;
  }
}
function pickWeighted(r,keys,c){ const ws=keys.map(k=>giftWeight(k,c)), tot=ws.reduce((a,b)=>a+b,0); let x=r()*tot; for(let i=0;i<keys.length;i++){ x-=ws[i]; if(x<=0) return keys[i]; } return keys[keys.length-1]; }
function genGift(r,rarity,c,avoid){
  const boonKeys=Object.keys(GIFT_MUL).concat(Object.keys(GIFT_FLAG).filter(k=>GIFT_FLAG[k].power&&!GIFT_FLAG[k].cost)).filter(k=>!(avoid&&avoid.has(k)));
  const fx=[], used=new Set();
  const addBane=(budgetLeft)=>{
    const mulBane=r()<0.6, keys=mulBane?Object.keys(GIFT_MUL):BANE_FLAGS;
    const k=pickWeighted(r,keys,c); if(used.has(k)) return 0; used.add(k);
    if(mulBane){ const p=Math.min(budgetLeft,0.6+r()*1.2); const v=mulValue(k,p,false); fx.push({ k, v, role:'bane' }); return mulPower(k,v); }
    fx.push({ k, v:true, role:'bane' }); return GIFT_FLAG[k].cost;
  };
  const budget=GIFT_BUDGET[rarity]*(0.85+r()*0.3); let baneCost=0, power=0;
  const trade=rarity>=1 ? r()<0.5+0.1*rarity : r()<0.12;
  // the wild ones first: a rule that needs a bane (a make-or-break pact)
  let main=pickWeighted(r,boonKeys,c);
  if(rarity>=2 && r()<0.35) main=pickWeighted(r,['twoHandOne','cheatDeath','rage','lifesteal','thorns','stunImmune'],c);
  const mainDef=GIFT_FLAG[main];
  if(mainDef&&mainDef.needs){ const need=pickWeighted(r,mainDef.needs,c); fx.push({ k:need, v:true, role:'bane' }); used.add(need); baneCost+=GIFT_FLAG[need].cost; }
  else if(trade){ const n=rarity>=2&&r()<0.4?2:1; for(let i=0;i<n;i++) baneCost+=addBane(budget*0.6); }
  const total=budget+baneCost*0.9;
  const addBoon=k=>{
    if(used.has(k)) return 0; used.add(k);
    const d=GIFT_FLAG[k];
    if(d&&d.power){ const v=d.param?d.param[rarity]:true; fx.push({ k, v, role:'boon' }); return d.power; }
    const want=Math.min(total-power, Math.max(0.5,(total-power)*(0.55+r()*0.45))); const v=mulValue(k,want,true); fx.push({ k, v, role:'boon' }); return mulPower(k,v);
  };
  power+=addBoon(main);
  let guard=0; while(power<total*0.8 && guard++<4){ const k=pickWeighted(r,boonKeys.filter(x=>!used.has(x)),c); if(!k) break; power+=addBoon(k); }
  const boons=fx.filter(f=>f.role==='boon'), first=boons[0];
  const adj=k=>(GIFT_MUL[k]||GIFT_FLAG[k]).name;
  const g={ id:'g'+Math.floor(r()*1e9), rarity, power:+(power-baneCost*0.9).toFixed(1), fx };
  g.name=`${GIFT_NOUN[rarity]}: ${boons.slice(0,2).map(f=>adj(f.k)).join(' & ')}`; g.adj=boons.slice(0,2).map(f=>adj(f.k));
  return g;
}
// the title is composed at display time, so it follows the language
function giftTitle(g){ const T=typeof Tr==='function'?Tr:(x=>x); return T(GIFT_NOUN[g.rarity])+': '+(g.adj||[]).map(T).join(' & '); }
function giftLines(g){
  return g.fx.map(f=>{ const d=GIFT_MUL[f.k]||GIFT_FLAG[f.k]; const T=typeof Tr==='function'?Tr:(x=>x); return { role:f.role, text:GIFT_MUL[f.k]?d.text(f.v,T):d.text(f.v===true?undefined:f.v,T) }; });
}
// the offer after a tournament round: three gifts; luck (fame) and the number of gifts so far shift the rarities; one is a wild card (a rarity higher, any effect)
function genGiftOffer(r,c,fame){
  const odds=[Math.max(20,62-fame*1.2),28+fame*0.4,9+fame*0.7,1+fame*0.25], tot=odds.reduce((a,b)=>a+b,0);
  const roll=()=>{ let x=r()*tot; for(let i=0;i<4;i++){ x-=odds[i]; if(x<=0) return i; } return 0; };
  const out=[], avoid=new Set();
  for(let i=0;i<3;i++){
    const wild=i===2; let rar=roll(); if(wild) rar=Math.min(3,rar+1);
    const g=genGift(r,rar,wild?null:c,avoid); g.wild=wild; out.push(g);
    g.fx.filter(f=>f.role==='boon').slice(0,1).forEach(f=>avoid.add(f.k));
  }
  return out;
}
