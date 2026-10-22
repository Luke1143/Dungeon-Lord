// Headless balance check: how long does the throne last against the heroic waves?
// Usage: NODE_PATH=$(npm root -g) node tools/balance-sim.js [maxTicks] [imps=3] [ring|open] [difficulties, e.g. 0,2,4]
// Needs Playwright with Chromium (see docs/dev-notes.md). The player is a fixed defender set standing in the throne room;
// the portal stays sealed, so the heroes tunnel to the throne themselves.
const { chromium } = require('playwright');
const path = require('path');
const MAX_TICKS = Number(process.argv[2]) || 6000;
const IMPS = Number(process.argv[3] ?? 3);          // imps the player has
const RING = (process.argv[4] ?? 'ring') === 'ring'; // walls around the throne pre-reinforced ('ring') or not ('open')
const DEFENDERS = {
  none: [],
  small: ['hound','hound','beetle'],
  medium: ['hound','hound','hound','beetle','beetle','warlock'],
  large: ['hound','hound','hound','hound','beetle','beetle','beetle','warlock','warlock']
};
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const rows = [];
  for (const diff of (process.argv[5] ? process.argv[5].split(',').map(Number) : [0, 2, 4, 6])) {
    for (const [dname, list] of Object.entries(DEFENDERS)) {
      const p = await b.newPage({ viewport: { width: 1000, height: 700 } });
      await p.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
      await p.waitForTimeout(300);
      const res = await p.evaluate(({ diff, list, MAX_TICKS, IMPS, RING }) => {
        let seed = 12345 + diff; Math.random = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
        document.getElementById('menuNew').click(); startLevel(0);
        state.war.difficulty = diff;
        // sealed portal: the heroes have to dig their own way (unless window.__corridor is set)
        const portal = tilesOfRoom('portal')[0], throne = tilesOfRoom('throne');
        const tx = throne[0].x, ty = throne[0].y;
        const carve = (x, y) => { const t = state.grid[y][x]; if (t.room === 'portal') return; if (t.type !== 'floor') { t.type = 'floor'; } t.owned = true; t.discovered = true; };   // never own portal tiles: that would be a victory
        if (window.__corridor) {
          for (let x = Math.min(portal.x, tx); x <= Math.max(portal.x, tx); x++) carve(x, portal.y);
          for (let y = Math.min(portal.y, ty); y <= Math.max(portal.y, ty); y++) carve(tx, y);
        }
        // the player: a few imps (they claim ground back and reinforce walls) and a ring of reinforced walls around the dungeon
        while (state.imps.length > IMPS) state.imps.pop();
        while (state.imps.length < IMPS) { const im = state.imps[0]; state.imps.push(Object.assign({}, im, { id: 9000 + state.imps.length, path: [], task: null, state: 'idle' })); }
        if (RING) for (let y = 0; y < WORLD_ROWS; y++) for (let x = 0; x < WORLD_COLS; x++) { const t = state.grid[y][x]; if (t.type === 'rock' && neighbors(x, y).some(([nx, ny]) => state.grid[ny][nx].type === 'floor' && state.grid[ny][nx].owned)) t.reinforced = true; }
        const spots = throne.slice();
        const make = { hound: createHound, beetle: createBeetle, warlock: createWarlock };
        list.forEach((k, i) => { const s = spots[i % spots.length]; state.creatures.push(make[k](s.x, s.y)); });
        let t = 0, minHp = 100;
        for (; t < MAX_TICKS && !state.war.over; t++) { gameTick(); minHp = Math.min(minHp, state.war.throneHp); }
        const heroes = state.creatures.filter(c => c.category === 'hero').length;
        const mine = state.creatures.filter(c => c.faction !== 'good').length;
        return { over: state.war.over, tick: t, wave: state.war.wave, minHp: Math.round(minHp), heroesAlive: heroes, defendersLeft: mine };
      }, { diff, list, MAX_TICKS, IMPS, RING });
      rows.push({ diff, defenders: dname, ...res });
      console.log(`diff ${diff} · ${dname.padEnd(6)} -> ${res.over || 'survived'} at tick ${res.tick}, wave ${res.wave}, min throne hp ${res.minHp}, heroes alive ${res.heroesAlive}, defenders left ${res.defendersLeft}`);
      await p.close();
    }
  }
  await b.close();
})();
