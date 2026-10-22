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

