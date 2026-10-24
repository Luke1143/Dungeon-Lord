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
