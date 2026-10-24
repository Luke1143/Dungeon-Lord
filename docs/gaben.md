# Gaben (procedural perks of the Ludus)

After every tournament round won, the fighter chooses one of three **gifts** (Gaben). They last for the run, stack, and can bend the run: from "+20 % tempo" to "immune to stun, but every blow costs 30 % more stamina" or "two-handers in one hand, but no armour".

## Design
- A gift is **data**: `{id, name, rarity, power, fx:[{k, v, role}], wild}` (`gifts.js`), stored in `ludus.fighter.gifts` and copied to `creature.gifts` by `arenaApplyFighter`. New effects = new catalogue entry plus one hook, no new code branches per gift.
- **Building blocks**: multiplicative stats (`GIFT_MUL`: strength, health, defense, tempo, attack speed, stamina cost/regen, dodge, damage taken, fatigue, status chance, xp, gold) and rules (`GIFT_FLAG`: immunities, lifesteal, thorns, cheat death, rage, lunger/sniper stance, ambidextrous, two-hander in one hand, …). Banes (no armour, no shield, no sprint, fragile) are rules too.
- **Power budget by rarity** (common 1.1 … legendary 5.6). A bane **raises** the budget by 0.9 × its cost, so pacts are strong when they hurt. Some boons *need* a bane (the giant: two-handers in one hand needs "no armour" or "no shield").
- **Rarity odds** shift with fame (luck), as in Megabonk/Risk of Rain. Multipliers are clamped to 0.35–3.
- **Affinity**: boons are weighted by what the fighter owns (a two-hander makes the giant 3× likelier, a bow the marksman, …), so builds emerge. The third card is the **wild card**: one rarity higher and drawn without affinity, so it can point in a new direction.
- Possession-proof and deterministic: the gifts only change numbers and rules of the existing systems.

## Hooks (index.html / creatures.js)
`giftMul(c,key)` (product), `giftOn(c,key)` (rule present), `giftParam(c,key)` (boon strength). Used in: strength, max HP, defense, tempo, swing cost, stamina costs and regen, dex, damage taken, fatigue, status immunity and chance, lifesteal/thorns/cheat death/on-kill effects, stance, flee, worn slots, dual wield, xp, gold.

## Ideas not built yet
Synergy sets (gifts that react to each other), rerolls through fame, gifts for the Eroberungsmodus (persistent creatures), banishing a gift.

## Sources
Build-biased offers with off-archetype wildcards (wayline.io), data-driven perk architecture (gamedev.net "how I coded the perks"), rarity + luck in Megabonk, three picks per level up and stacking in Risk of Rain 2 mods, slot pressure in Risk of Vampire; Hades/Noita/FTL for pacts and make-or-break trade-offs.
