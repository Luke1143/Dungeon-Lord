# Balancing (Stand der ersten ausführlichen Runde)

Gemessen wurde mit Simulationen (`arenaSimulate`, Duelle ohne Grafik) und einem Bot, der komplette Ludus-Läufe spielt (heilen, einkaufen, bauen, Gaben nehmen, Ereignisse, Turniere). Die Skripte liegen nicht im Repository; die Vorgehensweise steht hier, damit sie wiederholt werden kann.

## Was gefunden und geändert wurde
1. **Rüstung half Helden nicht.** Nur Arten mit `usesEquipment` ziehen Werte aus der Ausrüstung; Barbar, Dieb, Ritter usw. nicht (ihre Ausrüstung ist Teil der Basiswerte). Im Ludus ist Ausrüstung aber der Fortschritt. Jetzt tragen im Ludus (und in Arena-Aufbauten mit `gearAll`) alle Kämpfer ihre Ausrüstung wirksam (`c.gearUser`).
2. **Kämpfe waren zu kurz** (etwa 25 Ticks, zwei, drei Treffer). Alles Neue (Ausdauer, Statuseffekte, Flucht, Rüstung) kam nicht zur Geltung. Im Ludus haben alle Kämpfer doppelt so viel Leben (`LUDUS_HP_MULT`, Kämpfe etwa 45 Ticks).
3. **Niederlagen waren fast immer tödlich** (der Bonus für Bewusstlosigkeit galt nur für den Kampfsaal der Kampagne). Jetzt gilt er auch in Ludus-Kämpfen; nur ein vernichtender Treffer tötet. Gemessen: etwa 3 % der Niederlagen enden tödlich.
4. **Waffen** (Gewinnrate gegen Schwert + Kettenrüstung, gleiche Art, Stufe 5, je 200 Kämpfe): vorher Armbrust 0,79, Eisstab 0,77, Bogen 0,70, Speer 0,64, Hammer 0,16, Wurfspeer 0,33. Angepasst: Armbrust 9→5,5, Eisstab 9→5, Blitzstab 6→4,5, Bogen 5→4, Speer 6→4,7, Feuerstab 4→5,5, Wurfspeer 3→4,5, Streitkolben 10→10,5, Axt 11→12,5. Danach liegen alle zwischen 0,42 und 0,65.
5. **Rüstung**: Abzüge auf Ausweichen waren so hoch, dass Rüstung kaum etwas brachte (nackt gegen Kettenrüstung 0,5). Rüstungswerte 10/20/32 → 14/26/42, Abzug auf Ausweichen −2/−6/−12 → −1/−3/−6; Turmschild 32→28.
6. **Arten sind sehr verschieden stark** (Drache gewinnt gegen alles, Dieb/Kobold/Priester verlieren gegen alles). `LUDUS_POWER` (ludus-world.js) gibt die Stärke jeder Art in Stufen an (gemessen: Art auf Stufe 3+x gegen ein Feld aus zwölf Arten, x bei 50 %). Damit werden **schwache Arten verstärkt** (mehr Leben und Stärke, `ludusKindBoost`) und **starke gebremst**; Gegner werden mit ihrer eigenen Art auf die passende Stufe gebracht (`ludusMatchLevel`), starke Arten (Drache, Engel …) erscheinen als Gegner erst, wenn der Kämpfer hoch genug ist.
7. **Spähen** nutzt 4 statt 2 Probekämpfe; geschätzte und tatsächliche Gewinnrate liegen bei „fair" nah beieinander (0,5 gegen 0,45 bis 0,55).
8. **Tempo**: Erfahrung aus Kämpfen ×2 (Stufe 6 bis 10 nach 90 Tagen statt 4 bis 6); Turnierrunden werden an den Kämpfer angepasst: die Stufe des Rivalen wird per Probekämpfen so gesucht (`ludusFitLevel`), dass die Gewinnrate von 0,8 (erste Runde) auf 0,4 (letzte) sinkt; die feste Leiter machte einzelne Rivalen (ein Vampir) unschlagbar, andere trivial. Die Rivalen der unteren Plätze sind schwächere Arten. Die ersten drei Kämpfe eines Laufs können nicht töten (`mercy`). Stärke der Arten wird als Faktor, nicht als Stufenzahl umgerechnet. Ansehen kommt dreimal so schnell (Sieg 2/4/6, Turnier 8, Meister 30), die Räume sind billiger, die Schmiede beginnt mit Stufe 1 (grobe Ware), und ein **Bankett** wandelt überschüssiges Gold in Ansehen um.
9. **Gaben**: Gabe aus 25 zufälligen je Seltenheit (Gewinnrate gegen einen gleichen Gegner, Grundwert 0,52): gewöhnlich 0,55, selten 0,59, episisch 0,62, legendär 0,71; die besten Einzelstücke gewinnen fast immer („God Run"), die schlechtesten nur 0,3 (Fallen). Das ist gewollt und bleibt.

## Ergebnis des Bots (acht Arten, 90 Tage, `fair` gewählt)
Gewinnrate in „fair"-Kämpfen 0,5 bis 0,7 (Schätzung 0,5), vier von acht überleben die 90 Tage, Stufe 7 bis 8, drei bis acht Turniersiege, Gold wird knapp (Bankett).

## Offene Punkte
- Ausrüstung ist weiter nur ein mäßiger Vorteil (Kettenrüstung statt nackt etwa 55 bis 60 %). Falls Spieler zu wenig vom Einkaufen spüren, Rüstung noch stärker machen.
- Die Messung der Artenstärke ist grob (zwei Probekämpfe pro Gegner und Stufe, Rauschen etwa ±0,07). Die Tabelle sollte bei größeren Änderungen an Arten oder Waffen neu gemessen werden.
- Tag-Team-Kämpfe und Rudel wurden nur über den Bot getestet, nicht einzeln.
- Der Drache ist mit dem Abzug (×0,29) noch immer die stärkste Wahl.

## Nachtrag: Budget statt Artenstärke (siehe budget.md)
Die Tabelle `LUDUS_POWER` und der Abzug für starke Arten sind weg: Starke Arten werden nicht mehr abgeschwächt, Kämpfe werden aus dem Budget gebaut. Turnierkämpfe gehen auf Leben und Tod (kein Aufgeben, keine Flucht, keine Bewusstlosigkeit), die Rivalen sind in der ersten Runde leicht (Gewinnrate 0,95) und werden bis 0,6 schwerer; die erste Runde kommt an Tag 8, danach alle 5 Tage. Beim Bot-Test (acht Arten, 45 Tage, richtig ausgeruht) überlebten fünf.
