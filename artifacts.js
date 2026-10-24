// Artifacts: rewards for side goals and gates (design: "Artefakte sind Perks, wie Überraschungstüten, meist mit Preis").
// Every artifact is a table entry: what it is (weapon, armour or charm), how rare, what it gives (an item for the Dungeon Lord and/or free skill ranks)
// and what it costs (a permanent boost for the heroes on the world map). New artifact = new row. Cosmetic names are free; nothing is taken from other games.
const RARITIES=['common','uncommon','rare','epic','legendary'];
const RARITY_LABEL={ common:'gewöhnlich', uncommon:'ungewöhnlich', rare:'selten', epic:'episch', legendary:'legendär' };
const RARITY_COLOR={ common:'#c9b98a', uncommon:'#7fd07a', rare:'#6aa8ff', epic:'#c28aff', legendary:'#ffb040' };
// slot: weapon|armor (an item the Dungeon Lord carries) or charm; item: id of an ITEMS entry; ranks: free skill ranks (see SKILLS); curse: permanent boost to the heroes' stats
const ARTIFACTS=[
  { id:'rusty_axe',     name:'Rostige Heldenaxt',      rarity:'common',    slot:'weapon', item:'axe_plain',       text:'Eine Axt, die schon manchen Helden begleitet hat.' },
  { id:'dwarf_hatchet', name:'Zwergenbeil',            rarity:'uncommon',  slot:'weapon', item:'axe_fine',        text:'Gut gehärtet, mit eingravierten Runen.' },
  { id:'night_blade',   name:'Nachtklinge',            rarity:'rare',      slot:'weapon', item:'sword_epic',      text:'Sie schneidet das Licht.', ranks:{ lordStr:1 } },
  { id:'rock_breaker',  name:'Felsenbrecher',          rarity:'epic',      slot:'weapon', item:'hammer_epic',     text:'Ein Hammer, der Mauern wie Eierschalen bricht.', ranks:{ lordStr:2 }, curse:{ iron:0.8 } },
  { id:'ash_staff',     name:'Aschestab',              rarity:'rare',      slot:'weapon', item:'wandFire_epic',   text:'Ein verkohlter Stab, der nie ganz erkaltet.', ranks:{ lordReserve:1 } },
  { id:'leather_skin',  name:'Lederhaut',              rarity:'common',    slot:'armor',  item:'lightArmor_plain', text:'Zäh und leicht.' },
  { id:'chain_coat',    name:'Kettenpanzer',           rarity:'uncommon',  slot:'armor',  item:'mediumArmor_fine', text:'Tausend kleine Ringe.' },
  { id:'iron_hide',     name:'Eisenhaut',              rarity:'rare',      slot:'armor',  item:'heavyArmor_fine',  text:'Schwer, aber sie hält.', ranks:{ lordHp:1 } },
  { id:'black_plate',   name:'Schwarzstahlpanzer',     rarity:'epic',      slot:'armor',  item:'heavyArmor_epic',  text:'In einer mondlosen Nacht geschmiedet.', ranks:{ lordHp:2 }, curse:{ iron:0.8 } },
  { id:'gold_vein',     name:'Goldader im Fläschchen', rarity:'common',    slot:'charm',  ranks:{ startGold:2 },        text:'Ein Fläschchen, in dem das Gold fließt.' },
  { id:'heart_of_hen',  name:'Hühnerherz',             rarity:'uncommon',  slot:'charm',  ranks:{ creatureHp:2 },       text:'Es schlägt noch.' },
  { id:'bone_horn',     name:'Knochenhorn',            rarity:'uncommon',  slot:'charm',  ranks:{ impTempo:2 },         text:'Ein Ruf, den jeder Imp versteht.' },
  { id:'blood_crown',   name:'Blutkrone',              rarity:'rare',      slot:'charm',  ranks:{ lordStr:2, creatureStr:1 }, curse:{ training:1.2 }, text:'Sie macht Mächtige stärker und Gegner wütender.' },
  { id:'soul_lantern',  name:'Seelenlaterne',          rarity:'epic',      slot:'charm',  ranks:{ lordReserve:3 },      text:'Darin brennt eine Seele, die nicht aufgeben will.' },
  { id:'ring_hoard',    name:'Ring des Hortes',        rarity:'legendary', slot:'charm',  ranks:{ creatureStr:2, startGold:3 }, curse:{ iron:1.5 }, text:'Gold ruft nach Gold.' },
  { id:'world_seed',    name:'Same des Weltenbaums',   rarity:'legendary', slot:'charm',  ranks:{ creatureHp:3, lordReserve:2 }, curse:{ magic:1.5 }, text:'Er wächst im Dunkeln weiter.' },
  { id:'stone_sword',   name:'Das Schwert aus dem Stein', rarity:'legendary', slot:'weapon', item:'sword_epic', ranks:{ lordStr:3, lordHp:1 }, curse:{ training:1.5 }, text:'Nur der Würdige zieht es. Jetzt gehört es dir.' },
  // gate trophies
  { id:'alberich_hammer', name:'Alberichs Hammer',     rarity:'epic',      slot:'weapon', item:'hammer_epic', ranks:{ lordStr:2 }, text:'Die Hand des Zwergenkönigs hat ihn zuletzt gehalten.' },
  { id:'oberon_staff',    name:'Stab des Hains',       rarity:'epic',      slot:'weapon', item:'wandBolt_epic', ranks:{ lordReserve:2 }, text:'Er riecht nach Moos und Harz.' },
  { id:'round_plate',     name:'Tafelrundenpanzer',    rarity:'epic',      slot:'armor',  item:'heavyArmor_epic', ranks:{ lordHp:2 }, text:'Jedes Wappen darauf ist schon verblasst.' }
];
const ARTIFACT_BY_ID=Object.fromEntries(ARTIFACTS.map(a=>[a.id,a]));
// what a gate gives: the frontal way a trophy, the cunning way a legendary
const GATE_REWARDS={ gate_dwarf:{ frontal:'alberich_hammer', cunning:'ring_hoard' }, gate_elf:{ frontal:'oberon_staff', cunning:'world_seed' }, gate_human:{ frontal:'round_plate', cunning:'stone_sword' } };

// Which rarity a side goal pays: it grows with the campaign (rounds and conquered regions), with a chance of one rarity more or less
function rollArtifact(rng, progress){
  const base=Math.min(3, Math.floor(progress/2.5)), r=rng();
  const idx=Math.max(0, Math.min(3, base + (r<0.15?-1:(r>0.9?1:0))));    // legendary artifacts come from gates only
  const rarity=RARITIES[idx];
  const pool=ARTIFACTS.filter(a=>a.rarity===rarity && !a.trophy && !Object.values(GATE_REWARDS).some(g=>g.frontal===a.id||g.cunning===a.id));
  return (pool.length?pool:ARTIFACTS.filter(a=>a.rarity==='common'))[Math.floor(rng()*Math.max(1,pool.length))];
}
function artifactRanks(c,skill){ return ((c&&c.artifacts)||[]).reduce((n,id)=>n+(((ARTIFACT_BY_ID[id]||{}).ranks||{})[skill]||0),0); }
// the best weapon and armour among the owned artifacts: what the Dungeon Lord carries
function lordArtifactGear(c){
  const gear={};
  ['weapon','armor'].forEach(slot=>{
    const best=((c&&c.artifacts)||[]).map(id=>ARTIFACT_BY_ID[id]).filter(a=>a&&a.slot===slot).sort((a,b)=>RARITIES.indexOf(b.rarity)-RARITIES.indexOf(a.rarity))[0];
    if(best) gear[slot]=best.item;
  });
  return gear;
}
