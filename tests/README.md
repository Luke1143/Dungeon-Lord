# Tests

Browser tests with Playwright and Chromium: they open `index.html` from this checkout, play a little and look for errors.
In the cloud sessions Node and Playwright are installed globally; elsewhere: `npm i -g playwright && npx playwright install chromium`.

```
tests/run.sh            # smoke, work, emoji (about a minute); exit code 1 when one fails
tests/run.sh shots      # plus screenshots of the main views into tests/out/ (not in git)
NODE_PATH=$(npm root -g) node tests/shots.js arena,ludus   # only some pictures (prefix of the file name)
```

| Test | What it checks |
|---|---|
| `smoke.js` | menu, a campaign level (400 ticks, 2D and 3D), an arena match in 3D with fog, a Ludus bout to the end, no missing translations (`I18N_MISSES`) |
| `work.js` | forge station, smelter (bellows, anvil) and digging at work; their effects (sparks, embers, chips) are emitted |
| `ludus.js` | the Ludus tour without the match screen: ladder, pit (no gold, loot), arena, rent paid and unpaid, a whole tournament, travelling on; the living world runs along (gladiators fight each other every evening) |
| `emoji.js` | which emojis still reach the screen as emojis on the main screens (`STRICT=1` fails on any) |
| `ludus-walk.js` | the Ludus through its real page (clicks): new school, map, ladder, arena, pit, a bout, a tournament with its rounds, the map, a debt; pictures `walk-*.png` (part of `run.sh shots`) |
| `shots.js` | screenshots: menu, world map (also revealed), dungeon 2D/3D, toolbar, panel, portal, arena layouts, Ludus, options |

`lib.js` holds what they share: `open()` (browser, page, collected errors), `buildScene()` (a test dungeon with rooms and creatures next to the throne),
`startArena(layout)`, `shot()`, `finish()`. Any page error or console error fails a test.

Longer measurements (balancing) are in `tools/`: `balance-sim.js`, `balance-campaign.js`, `ludus-tour-bot.js` (plays whole Ludus runs).
