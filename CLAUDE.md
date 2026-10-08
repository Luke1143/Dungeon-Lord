# Dungeon Lord

Browser game, prototype in `index.html`, design in `docs/godhand.md` (read it before changing game rules).

## Working with the user
- Conversation in **German**; code, comments and UI text as in the prototype (UI is German).
- The user has minimal programming experience. Claude writes, tests and pushes everything and decides details on its own judgement.

## Principles (from the design doc)
- One verb: everything is `interact()`. Recipes belong to the target. New content = new table entry, not new code branches.
- Rooms are foremen (assign jobs), creatures have wishes. Possession-proof: anything the AI can do, the player can do the same way.
- Deterministic apart from hit rolls; everything visible in the world.

## Roadmap
1. Game loop: defeat (throne lost), victory (world portal conquered), hero waves, start/end screen.
2. More rooms and creatures (see doc parts 15/16), spells, traps, doors.
3. Split `index.html` into modules; campaign levels; tutorial; sound.

## Git
Develop on the branch given by the session; push when done so the user can `git pull`.
