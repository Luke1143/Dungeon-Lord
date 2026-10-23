// Headless balance check along a campaign: real level mods from the world economy at three progress stages (early, mid, late),
// for chosen region types, against a stage-sized defender set. Reports time of first contact and how the level ends.
// Usage: NODE_PATH=$(npm root -g) node tools/balance-campaign.js [maxTicks=7000] [regions, default a mix] [seed words]
const { chromium } = require('playwright');
const path = require('path');
const MAX_TICKS = Number(process.argv[2]) || 7000;
const REGIONS = (process.argv[3] || 'village,farmland,camp,forge,tower,fortress,gate_dwarf,gate_elf,gate_human,capital').split(',');
const SEEDS = (process.argv[4] || 'Alpha,Beta').split(',');
const STAGES = [ { name: 'early', round: 1, conquered: 1, defenders: ['hound','hound','beetle'] },
                 { name: 'mid',   round: 5, conquered: 4, defenders: ['hound','hound','hound','beetle','beetle','warlock'] },
                 { name: 'late',  round: 10, conquered: 8, defenders: ['hound','hound','hound','hound','beetle','beetle','beetle','warlock','warlock'] } ];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  for (const seedWord of SEEDS) for (const stage of STAGES) for (const region of REGIONS) {
    const p = await b.newPage({ viewport: { width: 1000, height: 700 } });
    await p.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
    await p.waitForTimeout(300);
    const res = await p.evaluate(({ stage, region, MAX_TICKS, seedWord }) => {
      let seed = 777; Math.random = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
      newCampaign(seedWord);
      const node = world.nodes.find(n => n.type === region);
      if (!node) return { skip: true };
      campaign.round = stage.round;
      campaign.conquered = world.nodes.filter(n => n.type !== 'capital' && !n.gate && n.id !== node.id && !OW.REGION_TYPES[n.type].gate).slice(0, stage.conquered).map(n => n.id);
      startLevel(node.id);
      const throne = tilesOfRoom('throne');
      for (let y = 0; y < WORLD_ROWS; y++) for (let x = 0; x < WORLD_COLS; x++) { const t = state.grid[y][x]; if (t.type === 'rock' && neighbors(x, y).some(([nx, ny]) => state.grid[ny][nx].type === 'floor' && state.grid[ny][nx].owned)) t.reinforced = true; }
      while (state.imps.length > 3) state.imps.pop();
      while (state.imps.length < 3) { const im = state.imps[0]; state.imps.push(Object.assign({}, im, { id: 9000 + state.imps.length, path: [], task: null, state: 'idle' })); }
      const make = { hound: createHound, beetle: createBeetle, warlock: createWarlock };
      stage.defenders.forEach((k, i) => { const s = throne[i % throne.length]; state.creatures.push(make[k](s.x, s.y)); });
      const mods = state.war.mods; let contact = -1, t = 0;
      for (; t < MAX_TICKS && !state.war.over; t++) {
        gameTick();
        if (contact < 0 && state.creatures.some(h => h.category === 'hero' && [-2,-1,0,1,2].some(dy => [-2,-1,0,1,2].some(dx => { const g = state.grid[h.y + dy] && state.grid[h.y + dy][h.x + dx]; return g && g.owned; })))) contact = t;
      }
      return { mods: `w${mods.waves} s${mods.size} l${mods.levelBonus} g${mods.gearTier} z${mods.wizards}`, ai: OW.REGION_TYPES[region].ai, pool: state.keep ? state.keep.total : 0, recruited: state.keep ? state.keep.recruited : 0, contact, over: state.war.over || 'survived', tick: t, hp: Math.round(state.war.throneHp), won: state.war.over === 'won' };
    }, { stage, region, MAX_TICKS, seedWord });
    console.log(res.skip ? `${seedWord} ${stage.name.padEnd(5)} ${region.padEnd(11)} (not in this world)` : `${seedWord} ${stage.name.padEnd(5)} ${region.padEnd(11)} ${String(res.ai).padEnd(10)} ${res.mods.padEnd(16)} pool ${String(res.pool).padStart(2)} recruited ${String(res.recruited).padStart(2)} contact ${String(res.contact).padStart(5)} -> ${res.over} at ${res.tick}, throne ${res.hp}`);
    await p.close();
  }
  await b.close();
})();
