// prototype of the part-based weapon model (units: sprite pixels); all constants are first guesses
const RHO={ head:1.0, shaft:0.35, pommel:1.0 };
function weapon(p){          // p: { hl,hw, sl, pm, mode }
  const gp=0.25*p.sl;                                  // hand sits a quarter of the shaft from the end
  const mK=RHO.head*p.hl*p.hw, mS=RHO.shaft*p.sl, mP=RHO.pommel*p.pm*p.pm;
  const xK=(p.sl-gp)+p.hl/2, xS=(p.sl-2*gp)/2, xP=-gp-p.pm/2;
  const M=mK+mS+mP, xc=(mK*xK+mS*xS+mP*xP)/M;
  const I=mK*xK*xK + mS*(p.sl*p.sl/12+xS*xS) + mP*xP*xP;
  const R=(p.sl-gp)+p.hl;
  const b=xc/R;                                        // centre of mass: 0 = at the hand, 1 = at the tip
  const target={ blade:0.30, axe:0.52, spear:0.42, blunt:0.62 }[p.mode];
  const bal=Math.max(0,1-Math.abs(b-target)/0.3);      // 1 = well balanced
  return { M, I, R, b, bal };
}
const REF=weapon({ hl:6, hw:2, sl:2, pm:1, mode:'blade' });
function stats(w,p,wielder){
  const sc=wielder.scale, str=wielder.str;
  const reachTiles=1+Math.floor(w.R*sc/12), breadth=p.hw*sc>=9?5:(p.hw*sc>=5?3:1);
  const T=3*Math.pow(w.I/REF.I,0.33)/Math.pow(str/10,0.4)*(1-0.15*w.bal);          // ticks of wind-up
  const D=10*Math.pow(w.I/REF.I,0.38)*Math.pow(str/10,0.45)*(1+0.10*w.bal)*(1+0.6*Math.max(0,w.b-({ blade:0.30,axe:0.52,spear:0.42,blunt:0.62 }[p.mode])));
  const area=p.hw*Math.min(p.hl,6);                                          // what the strike zone covers
  const acc=Math.max(0.2,Math.min(0.97,0.62+0.12*Math.log2(area/12)+0.08*w.bal));
  return { reachTiles, breadth, T:+T.toFixed(2), D:+D.toFixed(1), acc:+acc.toFixed(2), dps:+(D*acc/T).toFixed(2) };
}
const H={ str:10, scale:1 }, GOB={ str:4, scale:0.7 }, GIANT={ str:24, scale:1.4 };
const W={
  Dolch:{ hl:4, hw:1, sl:1, pm:0, mode:'blade' },
  Schwert:{ hl:6, hw:2, sl:2, pm:1, mode:'blade' },
  Speer:{ hl:3, hw:1.5, sl:12, pm:0, mode:'spear' },
  Axt:{ hl:4, hw:4, sl:6, pm:0, mode:'axe' },
  Hammer:{ hl:4, hw:4, sl:8, pm:1, mode:'blunt' },
  'Guts-Schwert':{ hl:20, hw:5, sl:5, pm:2, mode:'blade' },
  'Keule: Riesenkopf, winziger Knauf':{ hl:8, hw:8, sl:6, pm:0, mode:'blunt' },
  'Ausgewogene Keule (Knauf passt)':{ hl:8, hw:8, sl:6, pm:3, mode:'blunt' },
};
const rows=[];
for(const [n,p] of Object.entries(W)){ const w=weapon(p); rows.push([n,'Mensch',JSON.stringify(stats(w,p,H)),'bal '+w.bal.toFixed(2)]); }
const gs=W['Guts-Schwert'], gw=weapon(gs); rows.push(['Guts-Schwert','Goblin',JSON.stringify(stats(gw,gs,GOB)),'']);
rows.push(['Guts-Schwert','Riese',JSON.stringify(stats(gw,gs,GIANT)),'']);
const dw=weapon(W.Dolch); rows.push(['Dolch','Riese',JSON.stringify(stats(dw,W.Dolch,GIANT)),'']);
rows.push(['Schwert','Goblin',JSON.stringify(stats(weapon(W.Schwert),W.Schwert,GOB)),'']);
rows.forEach(r=>console.log(r.join(' | ')));
