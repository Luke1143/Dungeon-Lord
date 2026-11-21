// Creature budget (docs/budget.md): every kind belongs to a tier, and a tier is worth a number of "orks at level 1" in a fight.
// A dragon is a legend and stays one: balance is made by what stands against it (how many, how strong), never by weakening it.
// WORTH is what was measured by duels (an ork = 1, one kind against N orks on the same ground, Ludus rules); BUDGET is what the tier is meant to be worth.
// Where the two differ, the measurement is the truth for building encounters and the difference is a note for whoever tunes the kind (docs/budget.md).
const BUDGET_TIERS=[
  { id:'minor',     label:'Gering',     budget:0.5 },
  { id:'common',    label:'Gewöhnlich', budget:1 },
  { id:'strong',    label:'Stark',      budget:1.7 },
  { id:'epic',      label:'Episch',     budget:2.8 },
  { id:'legendary', label:'Legendär',   budget:5 }
];
const CREATURE_TIER={
  goblin:'minor', warlock:'minor', priest:'minor', skeleton:'minor', thief:'minor', wisp:'minor', fairy:'minor', hound:'minor', brood:'minor',
  ork:'common', barbarian:'common', zombie:'common', lizard:'common', spider:'common', yule:'common', succubus:'common', wizard:'common', banshee:'common', ghost:'common', monk:'common', archer:'common', darkelf:'common', dryad:'common', elf:'common',
  beetle:'strong', ghoul:'strong', troll:'strong', knight:'strong', dwarf:'strong', golem:'strong', kitsune:'strong', paladin:'strong', giant:'strong', guardian:'strong',
  darkknight:'epic', werewolf:'epic', vampire:'epic', phoenix:'epic', unicorn:'epic', griffin:'epic', lich:'epic', demon:'epic',
  angel:'legendary', dragon:'legendary'
};
// measured worth in orks at level 1 (the ork itself is the unit)
const CREATURE_WORTH={ beetle:1.5, hound:0.56, warlock:0.38, barbarian:1.06, thief:0.55, wizard:0.84, elf:1.15, archer:0.77, monk:0.92, paladin:1.9, dwarf:1.4, giant:2.1, ork:1, goblin:0.42, troll:1.5, skeleton:0.55, ghoul:1.5, priest:0.45, darkelf:0.77, vampire:2.7, dryad:0.71, golem:1.6, lizard:1.05, brood:0.6, darkknight:2.4, succubus:1, demon:3.1, banshee:0.84, zombie:1.08, spider:1, ghost:0.85, werewolf:2.7, lich:2.6, dragon:12, yule:1, fairy:0.62, griffin:2.8, unicorn:2.8, kitsune:1.7, wisp:0.55, angel:5.7, phoenix:2.7, guardian:1.2, knight:1.5 };
const creatureTier=k=>BUDGET_TIERS.find(t=>t.id===CREATURE_TIER[k])||BUDGET_TIERS[1];
const creatureBudget=k=>creatureTier(k).budget;
const creatureWorth=k=>CREATURE_WORTH[k]||creatureBudget(k);
// measured at level 4 with plain gear against orks of the same (tools/worth-measure.js, 30 fights a probe; the ork is 1 by definition). Armed kinds grow with their gear,
// beasts do not: an epic beast is worth less against equipped orks than at level 1 with crude gear (docs/budget.md)
const CREATURE_WORTH_L4={ angel:3, archer:0.61, banshee:0.57, barbarian:1.35, beetle:0.94, brood:0.67, darkelf:0.59, darkknight:2.14, demon:1.67, dragon:8.33, dryad:0.53, dwarf:1.58, elf:0.94, fairy:0.34, ghost:0.66, ghoul:0.83, giant:2, goblin:0.61, golem:1.5, griffin:1.8, guardian:0.82, hound:0.63, kitsune:0.83, knight:1.4, lich:1.71, lizard:0.74, monk:1.4, ork:1, paladin:1.44, phoenix:1.41, priest:0.42, skeleton:1.06, spider:0.65, succubus:0.69, thief:0.76, troll:1.48, unicorn:1.63, vampire:2.73, warlock:0.15, werewolf:1.8, wisp:0.35, wizard:0.45, yule:0.62, zombie:1.25 };
// the worth of a kind before the levels' growth: the level-1 measurement, moving to the level-4 one over levels 1 to 4, held from there
const creatureWorthBase=(k,level)=>{ const a=creatureWorth(k), b=CREATURE_WORTH_L4[k]; if(!b) return a; const t=Math.max(0,Math.min(1,((level||1)-1)/3)); return a+(b-a)*t; };
// what a kind at a level is worth: the levels multiply life and strength, so the worth grows with the square
const creatureWorthAt=(k,level)=>creatureWorthBase(k,level)*Math.pow(levelScale(level)/levelScale(1),2);
// the level at which a kind is worth `w` orks (at least 1, at most 40)
const creatureLevelFor=(k,w)=>{ let best=1, bd=Infinity; const t=Math.max(0.01,w); for(let l=1;l<=40;l++){ const d=Math.abs(Math.log(creatureWorthAt(k,l)/t)); if(d<bd){ bd=d; best=l; } } return best; };
// how often a kind shows up among opponents and in the world: the late creatures are stronger on purpose and rare, the lich and the dragon extremely rare
const CREATURE_RARITY_TIER={ minor:1, common:1, strong:0.7, epic:0.22, legendary:0.05 }, CREATURE_RARITY_KIND={ lich:0.015, dragon:0.01 };
const creatureRarity=k=>CREATURE_RARITY_KIND[k]!==undefined?CREATURE_RARITY_KIND[k]:(CREATURE_RARITY_TIER[creatureTier(k).id]||1);
function creaturePickWeighted(r,kinds){ const ws=kinds.map(creatureRarity), tot=ws.reduce((a,b)=>a+b,0); let x=r()*tot; for(let i=0;i<kinds.length;i++){ x-=ws[i]; if(x<=0) return kinds[i]; } return kinds[kinds.length-1]; }
