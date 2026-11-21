# Kreatur-Budget

Jede Art gehört zu einer **Stufe** (`budget.js`), und jede Stufe ist eine Anzahl **Orks auf Stufe 1** wert:

| Stufe | Budget | Arten |
|---|---|---|
| Gering | 0,5 | Kobold, Warlock, Priester, Skelett, Dieb, Irrlicht, Fee, Höllenhund, Dämonenbrut |
| Gewöhnlich | 1 | Ork, Barbar, Zombie, Echse, Spinne, Yule, Sukkubus, Zauberer, Banshee, Geist, Mönch, Bogenschütze, Dunkelelf, Dryade, Elf |
| Stark | 1,7 | Käfer, Ghul, Troll, Ritter, Zwerg, Golem, Kitsune, Paladin, Riese, Schutzengel |
| Episch | 2,8 | Dunkler Ritter, Werwolf, Vampir, Phönix, Einhorn, Greif, Lich, Dämon |
| Legendär | 5 | Engel, Drache |

**Regel:** Eine Art wird nicht abgeschwächt, damit ein Kampf ausgeglichen ist. Ein Drache bleibt ein Drache; ausgeglichen wird, **was ihm gegenübersteht**: wie viele und wie starke Gegner. Im Ludus baut `ludusCandidate` jeden Kampf aus dem Budget (ein Drache trifft auf einen Schwarm aus Orks, ein Kobold auf einen Kobold), und die Probekämpfe der Grube wählen aus den Kandidaten die passenden. Nur sehr schwache Arten werden angehoben (auf mindestens 0,7 Orks), nie umgekehrt.

## Gemessen
`CREATURE_WORTH` ist, was Duelle ergeben haben (eine Art auf Stufe 1 mit grober Ausrüstung gegen N Orks, Ludus-Regeln, 20 Kämpfe je Probe). Der Ork ist die Einheit. Abweichungen vom Stufenbudget:

- **Drache: gemessen 12, Soll 5** (rund 2,4-fach über dem Budget). Das ist die auffälligste Abweichung. Schwächer machen kostet ihm nichts von seinem Status (fünf Orks sind immer noch eine Legende); ob man das will, ist eine Entscheidung für den Spielwert in der Kampagne.
- Engel gemessen 5,7 (Soll 5), Dämon 3,1, Greif 2,8, Einhorn 2,8, Vampir, Werwolf und Phönix 2,7, Lich 2,6 (Soll 2,8): passen.
- Riese 2,1 und Paladin 1,9 liegen leicht über „Stark", Kitsune 1,7 passt. Elf 1,15, Dunkelelf 0,77, Dryade 0,71 und Bogenschütze 0,77 sind leicht schwächer als „Gewöhnlich".
- Der Wert wächst mit dem Quadrat der Stufe (Leben und Stärke wachsen beide); bei Stufe 6 ist der Drache sogar etwa 24 Orks wert, er wächst also stärker als der Ork.

## Grenzen
Die Messung ist ein Duell gegen Orks. Gegen Fernkämpfer (Elf, Zauberer) oder Fliegende kann dieselbe Art deutlich besser oder schlechter abschneiden. Die Kampfwahl im Ludus gleicht das mit den Probekämpfen aus.


## Zweite Messung: Stufe 4 mit schlichter Ausrüstung (November 2026)
Die erste Messung (Stufe 1, grobe Ausrüstung) trifft nicht, was im Ludus meist kämpft: mittlere Stufen mit schlichter Ausrüstung. Bewaffnete Arten wachsen mit ihrer Ausrüstung (Helden bekommen ab Stufe 3 bessere Rüstung, alle Arten Waffen und Rüstung in der Güte ihrer Gruppe), Bestien nicht. Darum gibt es jetzt zwei Werte: `CREATURE_WORTH` (Stufe 1, grob) und `CREATURE_WORTH_L4` (Stufe 4, schlicht). `creatureWorthAt` geht von Stufe 1 bis 4 vom einen zum anderen und hält ab Stufe 4 den zweiten; `creatureLevelFor` sucht die passende Stufe dazu.

Messung (`tools/worth-measure.js 4 1 30`): die Art gegen Orks derselben Stufe und Güte, offene Grube, Ludus-Regeln; jeder Kampf mit neu gewürfelter Ausrüstung (die Teile einer Waffe machen viel aus) und eigenem Gelände, die Seiten wechseln jeden zweiten Kampf (sonst hat eine Seite einen Vorteil: Ork gegen Ork kam auf 65 %). Stärker als ein Ork: einer gegen N Orks; schwächer: M der Art gegen einen Ork; der Wert ist die Anzahl, bei der es ausgeglichen steht. Die Streuung liegt bei etwa ±15 % (Ork gegen Ork: 47 % bis 60 %).

Vorher behoben: (1) Monster bekamen in der Arena immer ihre grobe Startausrüstung, Helden dagegen Ausrüstung in der Güte der Gruppe (Ork 4 gegen Ritter 4: 2 zu 28) — jetzt haben alle die Güte ihrer Gruppe, und wer eine Waffe führt, bekommt ab „schlicht“ eine leichte Rüstung. (2) Ein Nahkämpfer, der einem zurückweichenden Schützen nachsetzte, schlug auf das Feld, auf dem der Schütze beim Ausholen stand (Elf 2 schlug Ork 8 in 6 von 10, Banshee 8 in 9 von 10) — jetzt zielt neu, wer nachsetzt oder neu heranrückt.

| Art | Stufe 1, grob | Stufe 4, schlicht |
|---|---|---|
| dragon | 12 | 8.33 |
| angel | 5.7 | 3 |
| vampire | 2.7 | 2.73 |
| darkknight | 2.4 | 2.14 |
| giant | 2.1 | 2 |
| griffin | 2.8 | 1.8 |
| werewolf | 2.7 | 1.8 |
| lich | 2.6 | 1.71 |
| demon | 3.1 | 1.67 |
| unicorn | 2.8 | 1.63 |
| dwarf | 1.4 | 1.58 |
| golem | 1.6 | 1.5 |
| troll | 1.5 | 1.48 |
| paladin | 1.9 | 1.44 |
| phoenix | 2.7 | 1.41 |
| knight | 1.5 | 1.4 |
| monk | 0.92 | 1.4 |
| barbarian | 1.06 | 1.35 |
| zombie | 1.08 | 1.25 |
| ork | 1 | 1 |
| skeleton | 0.55 | 1.06 |
| beetle | 1.5 | 0.94 |
| elf | 1.15 | 0.94 |
| ghoul | 1.5 | 0.83 |
| kitsune | 1.7 | 0.83 |
| guardian | 1.2 | 0.82 |
| thief | 0.55 | 0.76 |
| lizard | 1.05 | 0.74 |
| succubus | 1 | 0.69 |
| brood | 0.6 | 0.67 |
| ghost | 0.85 | 0.66 |
| spider | 1 | 0.65 |
| hound | 0.56 | 0.63 |
| yule | 1 | 0.62 |
| archer | 0.77 | 0.61 |
| goblin | 0.42 | 0.61 |
| darkelf | 0.77 | 0.59 |
| banshee | 0.84 | 0.57 |
| dryad | 0.71 | 0.53 |
| wizard | 0.84 | 0.45 |
| priest | 0.45 | 0.42 |
| wisp | 0.55 | 0.35 |
| fairy | 0.62 | 0.34 |
| warlock | 0.38 | 0.15 |
