// Level goals as a table. A level has one or more goals; reaching any of them wins the level.
// Goals with a "way" are the alternatives of a gate (design: frontal assault vs the cunning way with a bigger reward).
// check(state, goal) -> { done, text }. The level code (index.html) calls them every few ticks.
const GOALS={
  conquer_portal:{
    label:()=>'Das Weltportal erobern',
    check:(st)=>{
      const tiles=tilesOfRoom('portal'), owned=tiles.filter(t=>st.grid[t.y][t.x].owned).length;
      return { done:tiles.length>0&&owned===tiles.length, text:`${owned}/${tiles.length} Portalfelder erobert` };
    }
  },
  defeat_boss:{
    label:g=>`${g.bossName||'Den Boss'} im Kampf besiegen`,
    check:(st)=>{
      const boss=st.creatures.find(c=>c.isBoss);
      const down=!boss ? !!st.war.bossDead : (boss.faction==='good' && boss.unconscious);
      return { done:down, text: boss&&boss.faction==='good' ? `${Math.max(0,Math.round(boss.hp))}/${boss.maxHp} Lebenspunkte` : (down?'besiegt':'—') };
    }
  },
  steal_gold:{
    corrupts:true,
    corruptText:b=>`${b.name} wurde um sein Gold gebracht und gehört nun euch. Er wird euch in den nächsten Leveln dienen.`,
    label:g=>`Das Gold des Königs rauben (${g.amount} aus dem Hort ins Lager) und ihn korrumpieren`,
    check:(st,g)=>{
      const got=Math.round((st.war.stolen||0)*10)/10;
      const boss=st.creatures.find(c=>c.isBoss&&c.faction==='good');
      return { done:got>=g.amount && !!boss && !boss.unconscious, text:`${Math.min(got,g.amount)}/${g.amount} im Lager` };
    }
  },
  undermine_roots:{
    corrupts:true,
    corruptText:b=>`${b.name} sieht seinen heiligen Hain verdorren. Er folgt euch nun und wird euch in den nächsten Leveln dienen.`,
    label:g=>`Die Wurzeln des Weltenbaums untergraben (${g.amount} von ${g.total||8}) und Oberon korrumpieren`,
    check:(st,g)=>{
      const n=st.war.roots||0, boss=st.creatures.find(c=>c.isBoss&&c.faction==='good');
      return { done:n>=g.amount && !!boss && !boss.unconscious, text:`${Math.min(n,g.amount)}/${g.amount} Wurzeln` };
    }
  },
  pull_sword:{
    corrupts:true,
    corruptText:b=>`${b.name} ist nur noch ein König ohne Legende. Er folgt euch nun und wird euch in den nächsten Leveln dienen.`,
    label:()=>'Excalibur aus dem Stein ziehen (nur ein Würdiger kann es) und Artus korrumpieren',
    check:(st)=>{ const boss=st.creatures.find(c=>c.isBoss&&c.faction==='good'); return { done:!!st.war.swordPulled && !!boss && !boss.unconscious, text:st.war.swordPulled?'gezogen':'noch im Stein' }; }
  }
};

// Side goals of ordinary levels: reaching one pays an artifact when the level is won (see artifacts.js). Progress is tracked in state.war.
// check(state, goal) -> { done, text }
const SIDE_GOALS={
  take_rooms:{
    label:g=>g.text,
    check:(st,g)=>{ const tiles=Object.values(st.war.takenTiles||{}), n=g.room==='any'?tiles.length:tiles.filter(t=>t===g.room).length; return { done:n>=g.n, text:`${Math.min(n,g.n)}/${g.n} Felder erobert` }; }
  },
  kill_heroes:{
    label:g=>g.text,
    check:(st,g)=>{ const n=st.war.heroKills||0; return { done:n>=g.n, text:`${Math.min(n,g.n)}/${g.n} Helden besiegt` }; }
  },
  kill_last:{
    label:g=>g.text,
    check:(st)=>({ done:!!st.war.knightDead, text:st.war.knightDead?'gefallen':'noch auf freiem Fuß' })
  },
  stock:{
    label:g=>g.text,
    check:(st,g)=>{ const n=Math.floor(g.good==='gold'?st.gold:st.ore); return { done:n>=g.n, text:`${Math.min(n,g.n)}/${g.n} im Lager` }; }
  }
};
