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
  ork:'common', barbarian:'common', zombie:'common', lizard:'common', yule:'common', succubus:'common', wizard:'common', banshee:'common', ghost:'common', monk:'common', archer:'common', darkelf:'common', dryad:'common', elf:'common',
  beetle:'strong', ghoul:'strong', troll:'strong', knight:'strong', dwarf:'strong', golem:'strong', kitsune:'strong', paladin:'strong', giant:'strong', guardian:'strong',
  darkknight:'epic', werewolf:'epic', vampire:'epic', phoenix:'epic', unicorn:'epic', griffin:'epic', lich:'epic', demon:'epic',
  angel:'legendary', dragon:'legendary'
};
// measured worth in orks at level 1 (the ork itself is the unit)
const CREATURE_WORTH={ beetle:1.5, hound:0.56, warlock:0.38, barbarian:1.06, thief:0.55, wizard:0.84, elf:1.15, archer:0.77, monk:0.92, paladin:1.9, dwarf:1.4, giant:2.1, ork:1, goblin:0.42, troll:1.5, skeleton:0.55, ghoul:1.5, priest:0.45, darkelf:0.77, vampire:2.7, dryad:0.71, golem:1.6, lizard:1.05, brood:0.6, darkknight:2.4, succubus:1, demon:3.1, banshee:0.84, zombie:1.08, ghost:0.85, werewolf:2.7, lich:2.6, dragon:12, yule:1, fairy:0.62, griffin:2.8, unicorn:2.8, kitsune:1.7, wisp:0.55, angel:5.7, phoenix:2.7, guardian:1.2, knight:1.5 };
const creatureTier=k=>BUDGET_TIERS.find(t=>t.id===CREATURE_TIER[k])||BUDGET_TIERS[1];
const creatureBudget=k=>creatureTier(k).budget;
const creatureWorth=k=>CREATURE_WORTH[k]||creatureBudget(k);
// what a kind at a level is worth: the levels multiply life and strength, so the worth grows with the square
const creatureWorthAt=(k,level)=>creatureWorth(k)*Math.pow(levelScale(level)/levelScale(1),2);
// the level at which a kind is worth `w` orks (at least 1)
const creatureLevelFor=(k,w)=>Math.max(1,Math.min(40,Math.round((Math.sqrt(Math.max(0.01,w/creatureWorth(k)))-1)/LEVEL_SCALE_PER_LEVEL+1)));
