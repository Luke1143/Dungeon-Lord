# Kreatur-Budget

Jede Art gehört zu einer **Stufe** (`budget.js`), und jede Stufe ist eine Anzahl **Orks auf Stufe 1** wert:

| Stufe | Budget | Arten |
|---|---|---|
| Gering | 0,5 | Kobold, Warlock, Priester, Skelett, Dieb, Irrlicht, Fee, Höllenhund, Dämonenbrut |
| Gewöhnlich | 1 | Ork, Barbar, Zombie, Echse, Yule, Sukkubus, Zauberer, Banshee, Geist, Mönch, Bogenschütze, Dunkelelf, Dryade, Elf |
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
