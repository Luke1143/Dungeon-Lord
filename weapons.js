// The weapon model (docs/waffen.md): a weapon is head + shaft + pommel with real pixel sizes, and its numbers follow from them.
// Mass and its spread around the hand give the moment of inertia I; I sets the damage and the wind-up (bigger = harder and slower, with exponents below ½),
// the centre of mass against the balance a head shape wants gives a balance quality, length (times the wielder's size) gives the reach in tiles.
// Everything is relative to the *typical* weapon of the family, so the family tables (strength, swing) keep their meaning and the parts move a weapon around them.
const WEAPON_MODE={ dagger:'blade', sword:'blade', spear:'spear', axe:'axe', mace:'blunt', hammer:'blunt' };
const WEAPON_BAL_TARGET={ blade:0.30, axe:0.52, spear:0.42, blunt:0.62 };
const HEAD_RHO={ bronze:0.9, eisen:1, stahl:1.05, schwarz:1.05 }, SHAFT_RHO={ wood:0.35, bone:0.28, iron:0.8 };
const WEAPON_STRESS=0.38, WEAPON_SWING_EXP=0.33, WEAPON_WIELD_EXP=0.4, WIELDER_STR_REF=8;
// the physical picture of one set of parts: sizes in pixels, mass, inertia about the hand, centre of mass (0 = hand, 1 = tip)
function weaponPhysics(info, p, mode){
  const h=info.heads[p.head], sl=info.lensPx[p.len], gp=0.25*sl, pm=p.pommel|0;
  const mK=(h.n_px||h.hl*h.hw)*(HEAD_RHO[p.mat]||1), mS=sl*(SHAFT_RHO[p.shaft]||0.35), mP=pm*pm*1.2+(pm?0.3:0);
  const xK=(sl-gp)+h.hl/2, xS=(sl-2*gp)/2, xP=-gp-0.6-pm*0.3;
  const M=mK+mS+mP, xc=(mK*xK+mS*xS+mP*xP)/M;
  const I=mK*xK*xK+mS*(sl*sl/12+xS*xS)+mP*xP*xP, R=(sl-gp)+h.hl, b=xc/R, target=WEAPON_BAL_TARGET[mode]||0.35;
  return { hl:h.hl, hw:h.hw, sl, pm, M, I, R, b, target, bal:Math.max(0,1-Math.abs(b-target)/0.3) };
}
const WEAPON_TYPICAL=new Map();
function weaponTypical(name,mat,mode){
  const key=name+'|'+mat; if(WEAPON_TYPICAL.has(key)) return WEAPON_TYPICAL.get(key);
  const info=TOOLGEN.parts(name), ph=weaponPhysics(info,{ head:0, len:Math.floor(info.lens/2), shaft:'wood', pommel:0, mat },mode);
  WEAPON_TYPICAL.set(key,ph); return ph;
}
// the factors of one weapon against the typical one of its family: damage, wind-up; plus what to show
function weaponModel(name,p,mode){
  const info=TOOLGEN.parts(name), ph=weaponPhysics(info,p,mode), ty=weaponTypical(name,p.mat,mode);
  const over=(x)=>Math.max(0,x.b-x.target);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const strengthF=clamp(Math.pow(ph.I/ty.I,WEAPON_STRESS)*(1+0.10*ph.bal)/(1+0.10*ty.bal)*(1+0.6*over(ph))/(1+0.6*over(ty)),0.45,3.2);
  const swingF=clamp(Math.pow(ph.I/ty.I,WEAPON_SWING_EXP)*(1-0.15*ph.bal)/(1-0.15*ty.bal),0.5,3);
  return Object.assign(ph,{ strengthF, swingF });
}
// reach in tiles of a melee weapon in the hands of a creature of a given size (1 = next to the foe)
function weaponReachTiles(R,scale,mode){ const r=(R+(mode==='spear'?3.5:0))*(scale||1);   // a thrust reaches further than a swing
  return r>=22?3:(r>=12?2:1); }
function weaponBalanceLabel(m){ return m.b-m.target>0.12?'kopflastig':(m.b-m.target<-0.12?'griffbetont':'ausgewogen'); }

// ===== Damage profiles (docs/kampfsystem.md): every blow is a vector over [cut, pierce, blunt] =====
// The share of the damage that follows the weapon's profile grows with its grade; the rest is blunt (the grip, the weight, the fist).
// Armour weighs its defence by the kind, species take more or less of each kind, and size nudges it. All factors average about 1, so a plain blow works as before.
const DMG_KINDS=['cut','pierce','blunt'], DMG_LABEL={ cut:'Schnitt', pierce:'Stich', blunt:'Hieb' };
const WEAPON_PROFILE={ dagger:[0.45,0.55,0], sword:[0.7,0.3,0], axe:[0.7,0.1,0.2], spear:[0.1,0.8,0.1], javelin:[0.05,0.9,0.05], mace:[0,0.4,0.6], hammer:[0,0,1], bow:[0,1,0], crossbow:[0,1,0], wandFire:[1,0,0], wandIce:[0,1,0], wandBolt:[0,0,1] };
const HEAD_SHIFT={ 'Breitklinge':[0.1,-0.1,0], 'Kurzklinge':[0,0.1,0], 'Hünenklinge':[0.15,-0.15,0], 'Stachelkopf':[0,0.2,-0.2], 'Stachelkugel':[0,0.2,-0.2], 'Flügelkopf':[0.1,0,-0.1], 'Hakenspitze':[0.1,-0.1,0], 'Breitspitze':[0.1,-0.1,0], 'Doppelbeil':[0.1,0,-0.1], 'Bartaxt':[0.1,0.05,-0.15], 'Maulkopf':[0,0,0], 'Nadel':[-0.2,0.2,0], 'Hellebardenspitze':[0.3,-0.2,-0.1], 'Riesenbeil':[0.1,0,-0.1] };
const NATURAL_PROFILE={ werewolf:[0.8,0.2,0], hound:[0.3,0.6,0.1], lizard:[0.6,0.3,0.1], dragon:[0.5,0.3,0.2], unicorn:[0,0.8,0.2], griffin:[0.5,0.4,0.1], vampire:[0.3,0.6,0.1], beetle:[0.2,0.6,0.2], fly:[0,0.9,0.1], ghoul:[0.7,0.1,0.2], goblin:[0.4,0.4,0.2], thief:[0.3,0.5,0.2], brood:[0.5,0.4,0.1], demon:[0.5,0.2,0.3], banshee:[0.3,0,0.7] };
const ARMOR_MULT={ lightArmor:[0.6,0.9,1.5], mediumArmor:[1.5,0.6,0.9], heavyArmor:[1.0,1.5,0.5] };      // leather: strong against blunt, mail against cuts, plate against piercing; each is weak against another
const SPECIES_RESIST={ skeleton:[0.4,0.5,1.5], zombie:[0.8,0.9,1.1], golem:[0.5,0.5,0.9], beetle:[0.8,1,1.1], dragon:[0.7,0.8,1], ghoul:[0.9,1,1.1], lich:[0.6,0.7,1.2] };
const SIZE_DMG={ small:[1,0.9,1.15], normal:[1,1,1], large:[1,1.2,0.85] };
const GRADE_CONV={ crude:0.6, plain:0.8, fine:0.9, epic:1.0 };
const sumVec=(a,b,k)=>a.map((v,i)=>v+b[i]*k);
function normVec(v){ const s=v.reduce((a,b)=>a+Math.max(0,b),0)||1; return v.map(x=>Math.max(0,x)/s); }
// the profile of one weapon instance (the family's, shifted by the shape of its head) and how much of the damage follows it
function weaponProfile(inst){
  const d=instDef(inst); if(!d||d.type!=='weapon') return [0,0,1];
  let v=(WEAPON_PROFILE[d.family]||[0,0,1]).slice();
  const p=partsOf(inst); if(p&&HEAD_SHIFT[p.headName]) v=sumVec(v,HEAD_SHIFT[p.headName],1);
  return normVec(v);
}
function weaponConv(inst){ const d=instDef(inst); return Math.max(0.3,Math.min(1,(GRADE_CONV[d.tier]||0.8)*Math.min(1.1,instQuality(inst)))); }
// the damage vector of a creature's blow right now: [cut, pierce, blunt] adding up to 1
function attackProfile(c){
  const inst=activeWeapon(c);          // whoever holds a weapon strikes with it (also the heroes, whose gear adds no stats but is real)
  if(!inst) return normVec(NATURAL_PROFILE[c.kind]||[0,0,1]);
  const k=weaponConv(inst), w=weaponProfile(inst);
  return normVec([w[0]*k, w[1]*k, w[2]*k+(1-k)]);
}
// defence against one kind: what the body has, plus armour weighted by kind, plus shield and guard
function defenseVs(c,kind){
  const i=DMG_KINDS.indexOf(kind); let d=(c.baseDefense||0)+(c.tempDefense||0);
  if(!usesEquipment(c)&&c.inventory){ const ar=wornItems(c).find(x=>(instDef(x)||{}).type==='armor'), fam=ar&&instDef(ar).family; if(fam&&ARMOR_MULT[fam]) d=(c.baseDefense||0)*ARMOR_MULT[fam][i]+(c.tempDefense||0); }       // a hero's armour is part of its base defence: it only gives the kind its weight
  if(usesEquipment(c)&&c.inventory) wornItems(c).forEach(inst=>{ const def=instDef(inst); if(!def) return; const v=instStat(inst,'defense'); if(!v) return; d+=v*(def.type==='armor'&&ARMOR_MULT[def.family]?ARMOR_MULT[def.family][i]:1); });
  return Math.max(0,d);
}
const resistOf=(c,i)=>(SPECIES_RESIST[c.kind]||[1,1,1])[i]*SIZE_DMG[sizeClassOf(c.kind||'imp')][i];
// how well a creature stands against each kind (for the inspector): damage taken per kind relative to a plain blow
function takenVs(c){ return DMG_KINDS.map((k,i)=>{ const d=defenseVs(c,k); return (1-d/(d+DEFENSE_K))*resistOf(c,i); }); }
function profileText(v){ return DMG_KINDS.map((k,i)=>v[i]>=0.05?`${DMG_LABEL[k]} ${Math.round(v[i]*100)} %`:'').filter(Boolean).join(' · '); }
