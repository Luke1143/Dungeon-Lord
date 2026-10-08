# Dev notes

Newest version on top.

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
