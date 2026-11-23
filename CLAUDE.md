# Dungeon Lord

Browser game, prototype in `index.html`. Overview and scope: `docs/design.md`. Level rules: `docs/godhand.md` (read it before changing game rules).

## Working with the user
- Conversation in **German**. Code, identifiers, syntax and comments in **English**, uniformly (existing German comments get translated when touched). In-game text is written in German in the source; English (the default) comes from the translation layer `i18n.js` + `lang-en.js` (German → English dictionary, patterns with `{0}`), German is selectable in the main menu. New UI text: write it in German in the code and add the English line to `lang-en.js`; test with `I18N_MISSES` in the browser console.
- The user has minimal programming experience. Claude writes, tests and pushes everything and decides details on its own judgement.

## Principles (from the design doc)
- One verb: everything is `interact()`. Recipes belong to the target. New content = new table entry, not new code branches.
- Rooms are foremen (assign jobs), creatures have wishes. Possession-proof: anything the AI can do, the player can do the same way.
- Deterministic apart from hit rolls; everything visible in the world.
- Style rule (user, November 2026): creatures have floating hands without arms. The hands hold what the creature carries (a weapon's grip sits in the fist) and swing with it; nobody swings what they do not hold. No arms, no baked-in tools. The legacy pixel sprites still follow the old rule (no hands, the held item is the hand, an empty-handed action is a swing arc effect, see `anim.js`) until they are replaced.
- Art direction (user, November 2026): the game moves to SVG figures built from moving parts (`svg-rig.js`, a kit of creature kinds sharing parts, motion and stats), in the grim style; they are drawn as pixel sprites (48 px, smoothly upscaled). Everything is replaced step by step; the pixel sprites stay as legacy until then.
- Open source: only own or freely licensed content (code MIT, graphics CC0, see `LICENSE`, `LICENSE-ART`). No third-party assets, libraries or fonts without a clear free license. Do not use names, art or sounds from other games.

## Roadmap
Gesamtbild und Ausbaustufen stehen in `docs/design.md` (zuerst lesen). Kurzfassung:
1. Ein gutes Level: Balancing von Heldenwellen, Thronschaden, Kampf (Game Loop, Sieg und Niederlage stehen schon, siehe `docs/dev-notes.md`).
2. Kampagnen-Skelett: Startbildschirm, Overworld mit wenigen Leveln, Ergebnis und Dungeon-Lord-Fortschritt zwischen Leveln.
3. Volle Kampagne (~10 Level mit Quirks und Nebenzielen, Finale), danach New Game Plus.
4. Spaeter: Dungeon Lord als Figur, Tutorial, Ton, `index.html` in Module teilen.

## Tests
Browser tests in `tests/` (Playwright): `tests/run.sh` after every change to game code, `tests/run.sh shots` for screenshots into `tests/out/`. New checks go there, not into throwaway scripts (see `tests/README.md`).

## Git
Develop on the branch given by the session; push when done so the user can `git pull`.
