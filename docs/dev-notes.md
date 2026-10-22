# Dev notes

Newest version on top.

## 0.5 - Sprite and 3D exploration (prototypes only, game unchanged)
All in `prototypes/`, open the files directly in a browser. Three.js 0.160 (MIT) is vendored in `lib/`.
- `3d-spike.html`: map as 3D blocks with billboard sprites, camera pan/rotate/zoom, picking. Now with the modular imp walking and carrying sacks.
- `imp-parts.html`: modular imp (head, body, legs, sack) animated with whole-pixel offsets; hands deliberately dropped (design statement in `design.md`).
- `zoo-humanoid.html`: hero, orc, warlock and three skeleton concepts (floating bones, hero chest, soul lantern). `equipment.html`: armor and weapons as rules on tagged pixels. `skelett-familie.html`: one skeleton base, six variants through soul colour, bone tone and weapon only.
- `skelett-familie.html` now has the final skeleton look (big square skull, wide collarbone, short ribcage with empty pixels, one-pixel spine; soul ring kept as an option). `zoo-bestien.html`: hellhound (ember back), beetle (domed shell with seam), fly (huge eye, wing beat). `zoo-sprites.js` bundles held, orc, warlock, skeleton and the three beasts as `ZOO[key].frame(t, facingRight, moving)`; `3d-spike.html` loads it and lets one of each wander next to the imps.
- `imp-silhouetten.html`, `imp-round.html`, `imp-oval.html`, `imp-flat.html`, `imp-detail.html`, `imp-head.html`, `imp-final.html`, `imp-creature.html`, `imp-styles*.html`, `sprite-32-test.html`: design explorations, kept as history. Own designs only; no art from other games.
- Sprites are generated in code (ellipses, shading, edge rules); a creature is a table entry of parts plus a palette.
- Next: move the part composer into `index.html` and replace the emojis; decide whether the level renderer goes 3D.

## 0.4 - View and comfort
- **Layout**: the level fills the window (`#viewport`, resized by a `ResizeObserver`); the side panel is 290 px wide and scrolls on its own, stats sit in a 2-column grid. Below 900 px it stacks. Top bar holds speed, zoom, throne, minimap and menu buttons.
- **Zoom** (`zoom`, 0.5x-3x, saved in localStorage): `draw()` applies one transform, so all drawing code still works in 32 px tile units. `VIEW_COLS/VIEW_ROWS` are now derived from viewport size and zoom. Mouse wheel zooms at the cursor, `+`/`-`/`0` on the keyboard.
- **Pan**: WASD or arrow keys, middle mouse drag, minimap click/drag, `Home` jumps to the throne.
- **Minimap** (`drawMinimap`, key `M`): terrain, rooms, gold, imps, creatures (heroes red) and the visible area; hidden caves stay hidden.
- **Speed** (`gameSpeed`): pause (Space), 1x, 2x, 4x (keys 1/2/3). `tickLoop` replaces the fixed interval.
- `docs/sprite-muster.html` added (sprite sample referenced in design.md).

## 0.3 - Campaign skeleton (main menu + overworld)
- **Screens**: `menuScreen` (Neue Welt / Kampagne fortsetzen, optional seed), `overworldScreen`, `levelScreen`. `showScreen(name)` switches; `gameTick` and autosave only run on the level screen.
- **Overworld** (`buildWorld(seed)`): deterministic from the seed, never saved (only `{seed,pos,visited,levelNode,inLevel}` goes to `dungeon-lord-campaign-v1`). 80x45 tiles from three value-noise layers (water, grass, forest, hills, mountain, swamp).
- **Nodes**: `OW_TURNS` (9) columns left to right, 1 / 2-3 / ... / 1 nodes; column 0 is the river village, the last one the capital. Terrain under a node picks its type from `LOCATION_TYPES` (table: label, description, side goal, name suffixes). Edges lead to the next column; every node is reachable.
- **Flow**: click a glowing node -> "Angreifen" -> `startLevel(nodeId)`. Win -> `finishLevel()` returns to the map, capital won -> back to menu. Loss -> run deleted (permadeath), back to menu. "Level neu starten" restarts the current level.
- **Difficulty**: `state.war.difficulty` = column index; `spawnWave` adds it to the wave number for size, hero level and hero types.
- Location types so far only change name and text; level generation per type (roots, dwarf structures, rivers) is still to do.

## 0.2 - Game loop (war)
- **Weltportal** (`portal` room, 2x2, placed 30+ tiles from the throne, not buildable/demolishable). Conquering all portal tiles = **victory**.
- **Waves**: as soon as a walkable path from portal to throne exists (`portalConnected`, checked every 5 ticks), heroes spawn at the portal. First wave after 150 ticks, then every `max(180, 340 - 12*wave)` ticks. Wave size `1 + 0.8*wave` (max 10), hero level `1 + (wave-1)/2`.
- **Heroes** (faction `good`, category `hero`): Barbar, Dieb, Zauberer (wave 3+), Ritter (wave 5+). They fight hostiles within 8 tiles, otherwise march to the throne (`tickHero`). They never flee. Killing a hero pays a bounty (30 gold per level).
- **Defeat**: heroes standing in the throne room reduce `war.throneHp` (strength x 0.25 per tick); it regenerates when no hero is inside. 0 = defeat.
- End overlay with "Neues Spiel"; simulation freezes when `war.over` is set.
- Saves use `localStorage` when `window.storage` (Claude artifact API) is missing. Key `dungeon-lord-v1`.
- Cleanup: removed duplicate `forge`/`arena` table entries; state creation unified in `makeDefaultState()`.

**Not balanced yet** - needs playtesting (wave strength vs. defenders, throne damage rate).

## 0.1 - Prototype import
Prototype from the lost original project plus `docs/godhand.md`.

## 0.6 Sprites in the game
- `sprites.js` (repo root, MIT/CC0 like the rest) generates all creature sprites in code: imp (with gold/ore sack), hellhound, beetle, fly, warlock, four hero classes (the hero body with palette variants), plus ork and skeleton for later. `index.html` loads it and `drawActor` draws `ZOO[kind]` via `drawCreatureSprite`; facing and walk animation come from the render position, unconscious creatures are drawn rotated. Kinds without a sprite still fall back to the emoji.
- Props (bed, throne, candle, shelf, book, fire, furnace, kiln, bellows, anvil, bench, trough, grain, chicken, chick, coin, ore, ingot, corpse) are `ZOO['prop_*']` entries too (overview: `prototypes/props.html`). `PROP_OF` in `index.html` maps the old emoji to them; `drawEmoji` and `drawSlots` draw the sprite, thoughts and effects keep the emoji. Tiles get a speckle overlay from `TILEGEN` (sprites.js; kinds floor, flag for room floors, rock, gold, ore) on top of the flat tile/room colour, so room colours still identify rooms. Not yet converted: the metal pipeline (tinted ingots, ore clusters, anvil bloom), effects, thoughts, overworld, UI icons, floor and wall tiles.
- Still emoji: effects, thoughts, metal pipeline and the overworld. Cargo icons over carriers remain as the amount indicator.
- Equipment is part of `sprites.js` now: `ZOO[key].frame(t, facingRight, moving, equip)` with `equip = { mat, helm, chest, legs, weapon, shield }`. Rules work on tagged pixels (head/torso/legs); tier 3 adds plume, jaw guard and pauldrons (silhouette changes), weapons and shields are one sprite each. `equipLook(c)` in `index.html` derives it from the inventory (armour family = tier, quality = one material better/worse, weapon family = sprite). Overview: `prototypes/equipment-zoo.html`.
- Next: ranged/magic weapon sprites need hand-tuning, creature-specific gear anchors for non-humanoids stay out (beasts carry nothing), then the decision on the 3D renderer.

## Reference: Dungeon Keeper wiki
- The user pointed to https://dungeonkeeper.fandom.com/wiki/Dungeon_Keeper_Wiki as a source of design answers (rooms, creatures, happiness, payday, imp behaviour). Direct fetching is blocked (HTTP 402), single pages turn up through web search.
- Use it for mechanics and design principles only. Names, art, sounds and exact numbers stay our own (see CLAUDE.md, open-source rule).

## 0.7 3D view in the game
- `view3d.js` is a second renderer for the level (Three.js, loaded on demand from `lib/`). Toggle with the `3D` button or `V`; the choice is remembered. Q/E rotate the camera, WASD and middle-drag pan relative to it, the wheel zooms, the minimap and all clicks work as before.
- How it works without touching the game rules: `draw()` in 3D mode runs the old 2D drawing on a throwaway canvas while `capture` collects every sprite, prop and emoji the 2D code wants to draw (position, scale, offsets); `View3D.render` turns that list into billboards and ground decals. Terrain comes from `tileInfo3d(x,y)` (walls as blocks with the tile texture, floors/water as planes). Marks, queued rooms, room selection and the drag rectangle are drawn on the transparent 2D canvas above, projected with `View3D.project`. Picking uses a ray against the tile meshes (`tileFromEvent`).
- Known gaps: the metal pipeline is only approximated (ingots as the ingot sprite, ore piles as emoji), no torch light or shadows yet, effects and thoughts are plain emoji billboards, bridges still look like water, the camera pitch and wall contrast are first guesses, and it has only been checked with software rendering.
- 3D lights: torches, candles, fires, kilns and furnaces cast warm flickering point lights (the eight nearest to the camera, `LIGHT_KEYS` in `view3d.js`).

## 0.8 Textures, room flavour, imps
- `TILEGEN.full(kind, variant)` (sprites.js) gives opaque 16x16 block textures: conquered floor (`owned`), room floors (throne, library, dormitory, storage, hatchery, arena, smelter, forge, bridge, portal, entrance) and room walls (`wall:<room>`, `brick`). Overview: `prototypes/tiles.html`. Flat colour plus speckle (`TILEGEN.gen`) stays for neutral floor, rock, gold and ore.
- `tileLook2d`, `wallFaceSpec` and `floorSpec` in `index.html` decide the look; walls take the look of the room they face (in 3D per face, in 2D by the first neighbouring room). `wallTorchItems()` puts torches on walls next to conquered floor (3D only, each one a light).
- Imps are drawn at `IMP_SCALE` (0.62); the crowd shrinking was removed again.
- Marked for real 3D models later (design doc): bookshelves, beds, throne, anvil, kiln, crates, hay bales, doors, torch brackets, arena podiums.

## 0.9 Balance check (tools/balance-sim.js)
- `NODE_PATH=$(npm root -g) node tools/balance-sim.js [maxTicks]` runs the level headless (Playwright + Chromium): it digs a corridor from the portal to the throne, puts a fixed set of defenders (none/small/medium/large) in the throne room, removes the imps and calls `gameTick()` until the throne falls. Math.random is seeded, so runs repeat.
- First results (throne 100 hp, 350 ms per tick, first wave 150 ticks after the break-through, no traps, no healing, no imps):
  - Difficulty 0: none 374 ticks (wave 1), small 1210 (wave 4), medium 1488 (wave 5), large 1758 (wave 6).
  - Difficulty 2: wave 1 / 2 / 3 / 4 for none / small / medium / large.
  - Difficulty 4 and up: the throne falls in wave 1 even against the large set (diff 8: 8 level-5 heroes in the first wave).
  - Finding: with imps, **one imp conquers the portal about 65 ticks after the corridor opens, well before the first wave (150 ticks)**. Waves never matter if the player rushes. Needs a design decision (longer conquest, conquest blocked while heroes are near, shorter first wave, or something else).
  - Finding: difficulty is added in full to the wave number, so late turns start with wave-9 strength.

## 1.0 Imps, scouts, effects
- **Imp bug fixed**: imps flipped between "waits for work" and "picks up gold" forever when a pile existed but no reachable store accepted gold (storage filter off, room walled off, store full of other goods). `findHaulJob` now only takes a pile if `computeStorageSlots('gold')` is not empty, there is room, and `findStorageTile` finds a way; the ore job got the same reachability check. Reproduction was a store with the gold filter off (454 state flips in 500 ticks before, 0 after).
- **Waves and scouts**: `tickWar` runs the wave timer from level start (`WAVE_FIRST_TICKS` 450), no longer only after the portal is connected. When a hero has no walkable way to the throne, `heroDig` follows `digRouteToThrone` (Dijkstra: floor 1, water 2, rock 10, reinforced rock 20, bedrock blocked) and digs with the normal `interact` verb (`recipeFor` lets heroes dig any rock). The hint line shows the countdown to the scouts.
- **fx.js**: particle system with its own PRNG (no influence on seeded runs). `emitFx(type, x, y, opts)` in `index.html`; recipes: chip, dig, claim, reinforce, build, poof, hit. 2D draws them in `drawParticles`, 3D collects them as `particle` items. Dig progress shows as cracks (`TILEGEN.crack`, stages 1-4 from `t.work`), also on the 3D block faces.
- **Torches**: `wallTorchItems()` emits `wallTorch` items (wall direction dx,dy); `View3D` builds a small stick mesh fixed to the wall face and leaning away from it with a flame sprite on top. dx=dy=0 stands upright (floor torch).
- Balance sim with sealed portal and scouts, no imps: throne falls in wave 1-2 from difficulty 4 up even against nine defenders, difficulty 0 lasts until wave 4-5 with a medium set. The sim does not model a real player (no traps, healing, imps, levelling), so treat it as a lower bound.
- **Reinforced walls (tug of war)**: `wallNeutralized(x,y)` compares `wallScores`: player = owned floors (1 each) + imps and player creatures within one tile, enemy = floors with `t.enemy` (0.5 each) + heroes within one tile; enemy must be strictly greater. `recipeFor` gives heroes no dig recipe for a reinforced wall unless neutralized; `digRouteToThrone(c, allowReinforced)` treats a non-neutralized reinforced wall as impassable, `heroDig` falls back to the cheapest route through reinforced walls and waits next to the wall (`state 'probing'`). Heroes mark floors they stand on as `enemy` (red tint in 2D and 3D); an imp's claim clears it. `decayReinforcedWalls()` (every `WAR_CHECK_INTERVAL` ticks) removes the reinforcement from walls that no longer touch owned floor. Heroes never dig diamond fields (they would never break).
- Test: throne ring fully reinforced, no imps, no defenders: the first scout probes the wall (tick ~750), the wave-2 group tips the contest and breaks in (~tick 810-860).
- Sim with the tug-of-war rule, 3 imps, pre-reinforced ring (`node tools/balance-sim.js 3500 3 ring 0,2,4,6`): the throne still falls every time. Difficulty 0 holds until wave 2/3/4/4 for none/small/medium/large defenders (tick ~960/1290/1460/1570); difficulty 2: wave 2-3; difficulty 4: wave 1-4 (only the large set reaches wave 4); difficulty 6: wave 1-2. Defenders mostly die (1-3 of 3-9 left). Conclusion: the walls delay the heroes by a few hundred ticks, but the fights are lost: heroes (levelling every two waves, groups of 3-10) out-fight the starting creatures, so the lever is hero strength / wave size / defender strength, not the walls. Open question for the player: target survival (e.g. wave 5 at difficulty 0, wave 3 at difficulty 4 with a sensible army?).

## 1.1 Combat feel, finite waves
- **Tug of war** now counts territory only (`wallScores`): player = owned floor tiles, enemy = hero-held floor tiles at half weight.
- **Finite pool**: `waveTotal(diff)` = 3 + diff/2 (3..8) waves; `spawnWave` stops after the last one, which adds "Der Ritter" (knight, level + 2, fine hammer, heavy armour, tower shield). Hero level `1 + (wave + diff - 1) / 3`, size `1 + 0.7 (wave + diff)`. `heroGear(kind, level, boss)` gives heroes weapons, armour and shields (tier crude/plain/fine by level). The UI shows `wave/total`, the hint line the countdown or the remaining heroes.
- **Hit feedback**: `resolveAttack` calls `hitFx` (index.html): white silhouette flash (`silhouetteOf`, 130 ms, 2D and 3D), visual knockback away from the attacker (`kbx/kby`, eased in `drawActor`), blood via `FX.blood` (blobs with gravity; they land as floor stains or hit a wall tile and stay as wall stains), gibs and a pool on kills (`FX.gibs`). `BLOOD` table gives the colour per kind (skeleton: bone chips). Stains live 90-170 s, at most 320; drawn by `drawStains` in 2D and as decals in 3D. Effects freeze while the game is paused.
- Visual-only knockback: the creature does not change tiles. A real shove is a possible next step.
- Sim with finite waves, territory-only tug of war (5x5), 3 imps, pre-reinforced ring (`node tools/balance-sim.js 6000 3 ring 0,4`): difficulty 0 (3 waves): none/small/medium lose at tick ~1030/1150/1570, **large holds** (all heroes dead, throne untouched). Difficulty 4 (5 waves): lost at ~660/860/1010/1325 (wave 1-3). Without territory widening the ring was unbreakable (5000 ticks, heroes piled up), so heroes now dig out and take the ground around a wall they cannot break (`heroWiden`) and commit to one siege wall (`c.siege`).

