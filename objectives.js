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
    label:g=>`Das Gold des Königs rauben (${g.amount} aus dem Hort ins Lager) und ihn korrumpieren`,
    check:(st,g)=>{
      const got=Math.round((st.war.stolen||0)*10)/10;
      const boss=st.creatures.find(c=>c.isBoss&&c.faction==='good');
      return { done:got>=g.amount && !!boss && !boss.unconscious, text:`${Math.min(got,g.amount)}/${g.amount} im Lager` };
    }
  }
};
