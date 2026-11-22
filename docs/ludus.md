# Ludus — Arena als zweiter Spielmodus (Konzeptentwurf)

Status: Entwurf zum Ausarbeiten. Die Creature Arena (`arena.js`) bleibt zugleich Testbank; der Ludus-Modus baut darauf auf.

## Neues Gerüst: die Tournee (seit November 2026, gilt vor allem Älteren unten)

Leitsatz des Nutzers: **Simulation zuerst, Spiel danach.** Die anderen Gladiatoren sollen wie der Spieler leben (kämpfen, aufsteigen, Beute sammeln, sterben), unabhängig von ihm. Zuerst wird das Gerüst umgebaut, die lebende Welt kommt danach darauf.

### Die Regeln auf einen Blick (gilt für die Schule des Spielers und alle Gladiatoren der Welt gleich)
1. **Ein Tag:** Jeder Gladiator hat eine Aufgabe: **Kämpft**, **Ruht**, **Trainiert** oder **Arbeitet**. Pro Tag hat die Schule höchstens einen Kampf (Grube oder Arena); es treten die an, die auf Kämpft stehen. Der Kampf beendet den Tag, sonst „Tag beenden“.
2. **Am Abend** tut jeder seine Aufgabe: Ruhen heilt (das Bett der Taverne, 50 bis 85 %), Training gibt Erfahrung gegen Gold (Trainingsraum nötig), Arbeit bringt das Doppelte der eigenen Kost. Wer auf Kämpft stand und nicht gekämpft hat, ruht. Wer gekämpft hat, heilt an diesem Abend nicht (ein Huhn hilft sofort).
3. **Kost und Logis:** Jeden Abend kostet jeder Gladiator 2 Gold + 1 je Spalte der Karte. Kann die Schule nicht zahlen, zahlt sie nichts, und am nächsten Morgen muss einer die Schuld in der Arena abkämpfen, ohne jeden Lohn; dafür isst er an diesem Tag umsonst (sonst käme eine Schule mit einem einzigen Kämpfer nie mehr aus der Schuld heraus).
4. **Grube:** niemand stirbt, kein Gold; Erfahrung und das beste Stück des Besiegten. **Arena:** Lebensgefahr (Aufgeben und Ohnmacht gehen); Gold, Ruhm, Ansehen, Ehre, je schlechter die Aussichten, desto mehr. Gegner sind immer Gladiatoren, die sich an diesem Tag für Grube oder Arena entschieden haben.
5. **Turnier alle 10 Tage** (Tag 10, 20, 30 …) in jeder Region, Pflicht für alle ihre Gladiatoren: 8 Plätze, drei Tage (Viertelfinale, Halbfinale, Finale). Wer gewinnt, ist Platz 1 der Region.
6. **Tournee:** Weiter nach rechts geht es erst als Platz 1 der Region; eine Etappe kostet einen Tag (unterwegs ruhen alle ein wenig). Platz 1 der Hauptstadt gewinnt den Lauf. Stirbt der letzte Gladiator, ist der Lauf vorbei.
7. **Wanderung:** Nach jedem Turnier zieht weiter, wer 2 Stufen über seiner Region steht (Champions bei 3); in der letzten Spalte tritt er als Legende ab. Neulinge beginnen ganz links.

### Vom Nutzer festgelegt
- **Jede Runde ist ein Tag.**
- **Pflichtkämpfe fast ganz weg.** Es bleiben nur der Mietkampf und das Turnier.
- **Kost und Logis (früher Miete):** täglich ein kleiner Satz Gold je eigenem Kämpfer (vorher: jede Woche). Fehlt das Gold, wird er stattdessen in einen **Arenakampf ohne jede Belohnung** geworfen.
- **Nicht jeder Tag ist ein Kampf:** Das Management drumherum ist ein ständiges Abwägen zwischen Kämpfen und anderen Tätigkeiten. Die Regeln sollen klar verständlich, nicht willkürlich und in sich logisch sein; der Roguelike-Kern bleibt.
- **Grube (Pit):** immer verfügbar, gibt **kein Gold**, nur Erfahrung und den **besten Gegenstand des Gegners**. **Niemand stirbt** (auf beiden Seiten).
- **Arena:** echte Kämpfe um Ruhm, Gold und Ehre, mit Lebensgefahr (Regeln wie bisher: Aufgeben und Ohnmacht sind möglich). Hohes Risiko, hoher Lohn. Verschiedene **Kampfarten**: verschiedene Arenen und Teamgrößen (1 gegen 1, 3 gegen 3, Jeder gegen jeden usw.).
- **Turnier:** alle **10 Tage** (vorher 30). Alle Kämpfer am Ort **müssen** teilnehmen. Der **Endgegner (Boss)** muss besiegt werden; danach geht es auf der Weltkarte in die nächste Region (Tournee), wo in 30 Tagen das nächste Turnier mit dem nächsten Boss wartet.
- **Kaderverwaltung:** Der Spieler entscheidet, wer heute antritt, wer geheilt wird, wer für welchen Kampf passt.
- **Jede Region hat eine Rangliste, der Boss steht immer auf Platz 1.** Besiegt der Spieler den Boss, ist er der neue Platz 1 und muss den Titel verteidigen, bis er selbst weiterzieht.
- **Neue Gladiatoren** entstehen links auf der Karte als Neulinge (wie der Spieler) und kämpfen sich nach rechts. Nur die Bosse entstehen mit der Welt (oder aus früheren Läufen).

### Von Claude entschieden (änderbar)
- **Ein einziger Ludus-Modus:** die Tournee auf der Karte. Der klassische Modus (Wochenrangliste, Wochenkampf, Pflichtkampf nach 3 Tagen) und die Städteturniere des alten Kartenmodus entfallen.
- **Region = eine Stadt der Karte** (auch der Startort). Wegpunkte mit Ereignis bleiben Zwischenhalte ohne Rangliste. Weiterreisen geht nur nach rechts und erst, wenn man in der Region Platz 1 geworden ist. Eine Reise kostet einen Tag je Etappe. Platz 1 der Hauptstadt (letzte Spalte) gewinnt den Lauf.
- **Kalender:** Turnier an jedem 10. Tag (Tag 10, 20, 30 …), unabhängig davon, wann man angekommen ist.
- **Tagesaufgaben** statt eines Ruhetags für alle: siehe die Regeln oben.
- **Arena-Angebote** kommen aus der Rangliste der Region: Man kämpft gegen deren Gladiatoren (nie gegen den Boss außerhalb des Turniers). Ein Arenasieg bringt **Ehre** (Punkte der Rangliste), Gold, Ruhm und Ansehen; die Ehre bestimmt die Plätze unter dem Boss.
- **Kampfarten:** Duell (1:1), Doppel (2:2), Trio (3:3), Rudel (einer gegen eine Meute) und **Jeder gegen jeden** (einer der eigenen unter drei bis vier Gladiatoren, jeder für sich, der Letzte gewinnt; ab vier Gladiatoren in der Arena). Die Arena-Engine kennt dafür beliebig viele Seiten: Seite 0 ist 'evil', Seite 1 'good', jede weitere eine eigene Fraktion 'ffa2', 'ffa3' … (`arenaSideFaction`), sodass niemand Verbündeter eines Fremden ist; jede weitere Seite startet so weit wie möglich von den anderen; gewonnen hat die letzte Seite, die noch steht (bei Zeitablauf die mit dem meisten Leben).
- **Turnier:** ein K.-o.-Baum mit 8 Plätzen, 1 gegen 1, eine Runde pro Tag (Viertelfinale, Halbfinale, Finale). Der Boss ist an 1 gesetzt, dazu alle eigenen Kämpfer und die Besten der Rangliste. Kämpfe ohne eigene Beteiligung werden simuliert (mit der echten Engine). Turnierkämpfe folgen den Arenaregeln. Wer das Finale gewinnt, ist Platz 1 (auch ein fremder Gladiator, der den Boss schlägt).
- **Kost und Logis:** 2 Gold + 1 je Spalte, je Gladiator und Tag (Arbeit bringt das Doppelte).

### Stand der Umsetzung (`ludus-tour.js`)
- **Karte und Regionen:** Die Welt kommt aus `buildWorld` (aus dem Lauf-Seed, nicht gespeichert). Jede Stadt ist eine Region (`ludusRegionEnsure`): ein Boss (`ludusBossMake`, Stärke 1,6 Orks der Regionsstufe, eine Güte besserer Ausrüstung; ein Geisterteam früherer Läufe, dessen Stufe passt, nimmt seinen Platz ein) und 9 Gladiatoren (0,6 bis 1,15 Orks der Regionsstufe). Regionsstufe = 1 + Spalte (höchstens 9), stärkere Arten gibt es erst weiter rechts (`ludusRegionKinds`).
- **Rangliste** (`ludusBoard`): der Champion (anfangs der Boss) auf Platz 1, dann alle nach Ehre. Eigene Kämpfer starten in jeder neuen Region mit 0 Ehre. Arenasieg: +10 Ehre je Gegner (+10, wenn ein Gegner mehr Ehre hatte), die Besiegten −5; Niederlage: −5, die Sieger +8. Turniersieg je Runde +15.
- **Aufstellung:** Am Kämpferkärtchen schaltet das Schwert-Symbol, wer heute antritt (`ludus.pick`). Die Grube nimmt alle Aufgestellten, die Arena die ersten so viele, wie die Kampfart braucht. Wer an einem Tag nicht kämpft, erholt sich um eine halbe Bettruhe.
- **Grube:** wie früher zwei oder drei Angebote (leicht, fair, mit ausgebauter Grube schwer), für die Aufstellung ausgesucht; `noDeath` in der Arena-Engine: niemand stirbt, auf keiner Seite. Lohn: Erfahrung (Grube Stufe 3: +25 %) und das teuerste Stück aus der Ausrüstung der Gegner.
- **Arena** (`ludusArenaOffers`): Angebote aus den Gladiatoren, die heute in die Arena gekommen sind (siehe die lebende Welt), nie der Champion. Die Aussichten werden mit 4 Probekämpfen geschätzt; der Preis ist (14 + 9 × Stufe) × Faktor der Kampfart × (1,6 − 1,1 × Aussichten), zwischen halb und doppelt. Dazu Ruhm, Ansehen (5 bis 12 nach Risiko) und Ehre. Die Turnierhalle hebt Arena- und Turnierpreise um 25 % bzw. 50 %.
- **Kost und Logis** (`ludusPayUpkeep`): jeden Abend; reicht das Gold nicht, wird nichts bezahlt und am nächsten Morgen kommt der Schuldkampf (Duell gegen einen Gladiator der Region) ohne Gold, Erfahrung oder Ehre; fällt er auf einen Turniertag, kommt er nach dem Turnier. Die Gladiatoren der Welt zahlen dasselbe; wer weniger als drei Tage Kost hat, arbeitet oder geht (wenn wagemutig) in die Arena.
- **Turnier** (`ludusTourneyStart`): an jedem 10. Tag in der Region, in der man ist. 8 Plätze: Champion an 1, alle eigenen Kämpfer, die Besten der Rangliste; gesetzt wie üblich (1–8, 4–5, 2–7, 3–6). Eine Runde pro Tag; eigene Kämpfe gegen Fremde werden gespielt, alle anderen mit der Engine ausgefochten (`ludusTourneySim`). Sieger des Finales wird Champion: ein eigener Kämpfer bringt 40 + 30 × Spalte Gold, Ruhm, Ansehen und eine Gabe, und die Region gilt als gewonnen. Danach ändert sich die Region (20 % gehen, die anderen wachsen, Neulinge kommen).
- **Reise:** nur nach rechts und erst, wenn die Region gewonnen ist (Wegpunkte dazwischen sind frei); eine Etappe kostet einen Tag. Wer geht, gibt den Titel ab (der Beste der Region wird Champion). Platz 1 in der letzten Spalte gewinnt den Lauf.
- Entfallen: Wochenrangliste und Herausforderungen, Wochenkampf, Pflichtkampf nach 3 Tagen, Städteturniere, Aufrüstung der Städte, Referenzteams (der alte Kartenmodus und seine Bots).
- **Bot** (`tools/ludus-tour-bot.js`): spielt ganze Läufe. Erste Läufe (100 Tage): eine Ork-Schule gewann das erste Turnier an Tag 30 und verlor die nächsten zwei in Spalte 1; eine Goblin-Schule gewann erst das dritte. Gold sammelt sich an (über 500), die Miete drückt kaum. Das Balancing der Tournee steht noch aus.

### Gnade oder Hinrichtung (`ludusVerdict` in `ludus-life.js`)
- Vom Nutzer: Wer in der Arena gewinnt, entscheidet über einen Verlierer, der noch lebt. Hinrichten bringt Ruhm, proportional zum Ruhm des Verlierers (wer oft hinrichtet, hat viel Ruhm und ist eine Ruhm-Piñata, wenn er selbst verliert); Verschonen bringt Gold und eine gute Beziehung zum Verlierer. Wer oft hinrichtet, läuft Gefahr, selbst hingerichtet zu werden. So hat die KI einen Anreiz und der Spieler eine Abwägung.
- **Regeln:** gilt in der Arena und im Turnier (nicht in der Grube, nicht beim Schuldkampf). Hinrichten: der Verlierer stirbt, der Sieger bekommt 2 + die Hälfte von dessen Ruhm. Verschonen: der Verlierer zahlt Lösegeld aus seinem Gold (höchstens 10 + 6 × Regionsstufe) und ist dem Sieger verbunden (+2, wer nichts zahlen kann +3). Jeder Arenasieg bringt 1 Ruhm. Jeder Gladiator hat eigenen Ruhm und eine Henker-Bilanz (`execs`).
- **Die KI** (auch über die eigenen Gladiatoren, wenn sie verlieren) richtet hin, wenn 0,7 × Wagemut + 0,03 × Ruhm des Verlierers + 0,12 × seine Hinrichtungen − 0,25 × Beziehung über 0,55 liegt; kein Würfel. In den ersten drei Kämpfen eines Laufs bleiben die eigenen verschont (wie bisher).
- **Der Spieler** entscheidet nach einem gewonnenen Arenakampf für jeden lebenden Verlierer (Tafel „Das Urteil“); bis dahin geht der Tag nicht weiter.
- Gemessen (drei Bots, 120 Tage): 100 bis 120 Hinrichtungen in der ganzen Welt, die drei Berühmtesten mit Ruhm 23 bis 60; die Bots richteten 6 bis 15 Mal hin und verschonten 51 bis 73 Mal (sie richten hin, wenn es mindestens 5 Ruhm bringt).

### Beziehungen und Handel
- **Beziehung** (−3 … 3): ein Gladiator der Welt zur Schule (`bond`) und zu jedem anderen (`rel`). Verschonen: der Verschonte +2 zum Sieger (+3, wenn er nichts zahlen konnte). Hinrichten: wer mit dem Hingerichteten befreundet war (+1 und mehr), −2 zum Henker. Ein Geschenk (5 Gold je Stufe des Beschenkten) +1. Ein Verkauf an ihn +1.
- **Handel auf der Karte:** seine Stücke kaufen für Wert × (1,3 − 0,1 × Beziehung); ihm Stücke aus dem Vorrat verkaufen, die besser sind als was er trägt, für Wert × (0,6 + 0,05 × Beziehung), wenn er so viel Gold hat (er legt das Stück gleich an).
- **Die KI handelt auch:** Wer knapp bei Kasse ist (weniger als drei Tage Kost), verkauft am Abend sein bestes Stück an den Reichsten seiner Region, der es brauchen kann, für Wert × (0,8 + 0,05 × Beziehung).

### Herausforderungen (`ludusChallenge` in `ludus-life.js`)
- **Fordern:** auf der Karte eines Gladiators der Region fordert der ausgewählte eigene Kämpfer ihn zum Duell am nächsten Tag in der Arena. Nicht den Champion oder Boss (die trifft man im Turnier), nicht kurz vor oder während eines Turniers, nicht wer schon eine Verabredung hat.
- **Annahme ohne Würfel:** er nimmt an, wenn er der Schule grollt (Beziehung −1 oder schlechter), wenn er sich für ebenbürtig hält (Stärke mindestens 0,8 der deines Kämpfers) oder wenn er wagemutig ist (0,7 und mehr). Sonst lehnt er ab und verliert 5 Ehre. Die Karte sagt vorher, was er tun wird.
- **Das Duell** steht am Tag als eigenes Angebot oben in der Arena, mit dem genannten eigenen Kämpfer (egal welche Aufgabe er hat). Es zahlt den anderthalbfachen Preis, der Sieger bekommt 10 Ehre mehr und 1 Ruhm mehr. Der Herausgeforderte steht an dem Tag für niemand anderen bereit.
- **Wer nicht antritt, kneift:** endet der Tag ohne das Duell, verliert der eigene Kämpfer 10 Ehre, der andere bekommt 5. Die Abendvorschau warnt davor. Wer eine Verabredung hat, kämpft vorher nicht mehr (er schont sich); fällt der Gegner trotzdem aus (tot), verfällt das Duell ohne Strafe.
- **Die KI fordert auch:** jeden Morgen (höchstens alle 3 Tage, nicht vor einem Turnier) fordert der eifrigste Gladiator der Region den eigenen Kämpfer mit der meisten Ehre heraus, für heute. Eifer = Wagemut + 0,3 × Groll gegen die Schule + 0,3, wenn der Eigene höchstens 30 Ehre vor ihm liegt; ab 1,15 fordert er.
- **Fehden unter sich:** in der Arena des Abends kämpfen verfeindete Gladiatoren (Beziehung −2 oder schlechter, in eine Richtung reicht) zuerst gegeneinander, auch in den anderen Regionen; die Chronik nennt es Fehde.

### Bündnisse bei „Jeder gegen jeden“ (`ludusPacts` in `ludus-life.js`, `arenaAllied` in `arena.js`)
- **Regel:** Verbündete greifen einander nicht an, solange noch irgendeine andere Seite steht; danach ist das Bündnis vorbei, und sie fechten es unter sich aus. Die Engine fragt das in `areHostile` ab, also gilt es für Spieler, Besessene und KI gleich.
- **Die Schule fragt** im Angebot je Gegner: wer ihr wohlgesinnt ist (Beziehung 1 und mehr), kommt umsonst; neutral oder misstrauisch für 6 Gold je seiner Stufe (das Gold geht an ihn); verfeindet (−2 und schlechter) gar nicht. Ein Bündnis je Kampf.
- **Die KI verbündet sich selbst:** zwei Gegner im Feld, deren Beziehungen in beide Richtungen zusammen 3 oder mehr ergeben, stehen zusammen (paarweise). Das Angebot zeigt es vorher an.
- **Nach dem Kampf:** ein gehaltenes Bündnis macht den Verbündeten der Schule um 1 gewogener. Wer einen Verbündeten schlägt, solange das Bündnis gilt (geht nur mit einem besessenen Gladiator), begeht Verrat: das Bündnis bricht sofort, der Verratene wird zum Feind (−3), die Chronik erzählt es.
- **Drei Teams zu zwei** (`teams`, ab zwei eigenen Gladiatoren und vier in der Arena): zwei eigene gegen zwei Teams der Region. Die Teams bilden sich selbst: erst wer sich mag (Beziehungen beider Richtungen zusammen 2 oder mehr), der Rest nach Stärke. Ein Bündnis schließt man mit einem ganzen Team (Preis = Summe der Einzelpreise, keins, wenn einer verfeindet ist); zwei Teams verbünden sich selbst, wenn sie sich im Schnitt je Paar mit 3 oder mehr mögen. Preis 2,2-fach.
- **Abends unter sich:** kommen mindestens fünf Gladiatoren in die Arena der Region, tragen die vier schwächsten ein „Jeder gegen jeden“ aus, mit denselben Bündnisregeln (von der Engine ausgefochten). Ein gehaltenes Bündnis (beide leben) bringt beiden +1 zueinander; so wachsen Freundschaften und Lager. Die Chronik nennt Bündnisse und den Letzten, der stehen bleibt.
- Leitsatz (Nutzer): „Verlieren macht Spaß“ — der Modus spielt sich wie ein Roguelike; Tod und Hinrichtung der ganzen Schule bleiben hart.

### Der Erzfeind (`ludus-ghosts.js`, nach dem Leitsatz „Verlieren macht Spaß“)
- **Wer einen deiner Gladiatoren tötet oder hinrichtet, wird zum Erzfeind** (`ludusMeta.archEnemies`, die fünf mit den meisten Opfern): er überlebt den Lauf mit Name, Art, Ausrüstung, Ruhm, Hinrichtungen und seinen Opfern (wen, wie, an welchem Tag). Er ist der Schule verfeindet (−3) und wagemutig, fordert also gern heraus und richtet gern hin.
- **Rang:** Opfer + überlebte Läufe ergeben den Titel: Erzfeind, ab 3 Geißel, ab 6 Schrecken der Schulen. Ein Aufstieg steht in der Chronik; Karte und Rangliste zeigen den Titel.
- **Er wächst und jagt:** mit jedem neuen Lauf eine Stufe mehr; er beginnt in der Region, deren Stufe zu ihm passt (Regionsstufe = seine Stufe − 1, mindestens die erste). Alle 4 Tage zieht ein Erzfeind, der woanders ist, eine Region näher an deine Schule (auf den Wegen, Wegpunkte werden durchquert; nicht während eines Turniers, nicht als Champion). Er wandert nicht nach rechts ab und tritt nicht als Legende ab.
- **Rache:** wer von deiner Schule ihn tötet oder hinrichtet, bekommt +5 Ruhm, und er ist für immer fort (stirbt er anders, ebenso). Seine Freunde (Beziehung zu ihm 1 und mehr) grollen der Schule (−2). Keiner von ihnen tritt an seine Stelle: Erzfeind wird man nur durch eigene Tat (einen deiner Gladiatoren töten oder hinrichten).
- **Abgrenzung zu einem fremden Patent** (US 10,926,179 B2 und Fortsetzungen, Warner Bros., bis etwa 2036; geprüft im November 2026, keine Rechtsberatung): dessen Hauptansprüche decken ab, dass eine Begegnung des Spieler-Avatars mit Gegner A die Werte eines **anderen** Gegners B ändert (auch über einen Rang in einer Fraktionshierarchie). Regel für uns: eine Tat der eigenen Gladiatoren ändert nur den Betroffenen selbst und die eigene Schule; Ausnahme ist der allgemeine Groll von Freunden eines Getöteten (verbreitete Mechanik mit Vorbildern vor 2015). Kein Nachfolger übernimmt die Rolle eines Erzfeinds. Im Englischen heißt er „Arch-enemy“, im Code `ludusArch…`.
- **Eigenheiten** (echte Kampfregeln, als Gabe „Erzfeind“): beim Entstehen eine Stärke und eine Schwäche, mit jedem Rang eine Stärke mehr (Geißel 2, Schrecken 3). Feste Regel aus seiner Kennung, kein Würfel; nie dieselbe Art doppelt. Stärken: flieht nie, immun gegen Betäubung oder Blutung, Lebensraub, Dornen, Berserker, Leben, Stärke, Verteidigung, Heilung beim Fall eines Feindes, weniger Schaden durch Schnitt, Stich oder Hieb. Schwächen: mehr Schaden durch Schnitt, Stich oder Hieb (×1,6: die richtige Waffe wählen), zerbrechlich, kann nicht sprinten, hohe Ausdauerkosten, langsam. Die Karte zeigt sie.
- **Die Bühne:** steht ein Erzfeind im Kampf, hält der Kampf am Anfang an: Name und Rang, Art, Stufe und Ruhm, seine Opfer, seine Eigenheiten und ein Spruch. „Kämpfen“ lässt ihn los.
- Ein nicht beendeter Lauf schreibt seine Erzfeinde so zurück, wie sie gerade sind; die Tafel am Ende eines Laufs zeigt alle.

### Das Dungeon der Region (`hub3d.js`)
- Vom Nutzer: Die 3D-Ansicht im Ludus ist ein prozedural erzeugtes, zusammenhängendes Dungeon, neu für jede Region; alle Gladiatoren sind darin sichtbar, in dem Raum, der zu ihrer Tätigkeit passt. Anklicken soll später Diplomatie öffnen (Verhandeln, Handel, Beitritt, Bündnisse für Jeder-gegen-jeden), die auch die KI nutzt.
- **Räume:** Taverne, Grube, Trainingsraum, Schmiede, Bücherei (die Gebäude der Schule, mit ihren Ausbaustufen oder als Bauplatz), dazu Arena (Tribünen, Banner), Werkstatt, Turnierhalle (Sitz des Champions, immer da) und die Gasse der Ereignisse. Sie liegen in einer aus dem Lauf und der Region gewürfelten Ordnung auf einem 3 × 3-Raster, ein wenig versetzt; Gänge mit dunklen Wänden und Fackeln verbinden Nachbarn (ein Baum und zwei Schleifen mehr), nur dort, wo kein Raum steht. Ein Reiter fährt die Kamera zu seinem Raum (Karte und Rangliste: Turnierhalle), ein angeklickter Gladiator holt sie zu seinem.
- **Wer wo steht:** Gladiatoren der Region nach ihrem Tagesplan (Grube, Arena, Ruhe in der Taverne, Arbeit in der Werkstatt), der Champion in der Turnierhalle. Die eigenen mit rotem Ring nach ihrer Aufgabe (Kämpft: Turnierhalle, Ruht: Taverne, Trainiert: Trainingsraum, Arbeitet: Werkstatt), der ausgewählte und ein angeklickter mit goldenem Ring; während eines Ereignisses steht der ausgewählte in der Gasse.
- **Anklicken:** ein eigener wird ausgewählt; ein Fremder zeigt seine Karte (Art, Stufe, Platz, Ehre, Siege, Niederlagen, Getötete, Leben, heutiger Plan, Ausrüstung, Geschichte mit der Schule) mit „Anheuern“ (jeder außer dem Champion, wenn ein Platz frei ist).

### Bedienung (aus einem Durchgang über die echte Seite, `tests/ludus-walk.js`)
- **Heute Abend:** Die Kämpferkarte zeigt, was der Abend bringt, wenn der Tag jetzt endet: je Gladiator die Wirkung seiner Aufgabe (Heilung, Lohn, Erfahrung und Kosten des Trainings, oder warum er stattdessen ruht), Kost und Logis, und Warnungen (wer mit weniger als 35 % Leben kämpfen soll, wenn das Gold nicht für Kost und Logis reicht).
- **Grube:** bis zu drei Angebote, mit der besten Aussicht zuerst; „Leicht/Fair/Schwer“ richtet sich nach der Aussicht selbst (ab 65 % leicht, ab 35 % fair). Keine Lava-Arenen in der Grube (dort stirbt niemand). Der Ausbau der Grube gibt +25 % und +50 % Erfahrung.
- **Ergebnis** nennt auch nach einer Niederlage die gewonnene Erfahrung; die Tagesnotiz (Aufgaben, Kost) steht dahinter, mit „·“ getrennt.
- **Obere Leiste:** Kost und Logis pro Tag (mit Warnung, wenn das Gold nicht reicht), Tage bis zum Turnier bzw. die laufende Turnierrunde.

### Die lebende Welt (`ludus-life.js`)
Vom Nutzer: Die Gegner in Grube und Arena sind echte Gladiatoren, die sich selbst entscheiden, dort anzutreten.
- **Gladiatoren sind Kämpfer wie die eigenen:** derselbe Datensatz wie ein Mitglied des Teams (Stufe, Erfahrung, Leben, Ausgeruhtheit, echtes Inventar, Fähigkeiten, Gaben) plus Gold, Ehre, Siege, Niederlagen, Getötete und Wagemut (`bold`). Sie kämpfen mit genau diesen Werten (`ludusOppGroup` nimmt ihren Datensatz), und was ein Kampf mit ihnen macht, bleibt (Wunden, Erfahrung, verlorene Ausrüstung). Wer sich der Schule anschließt, bringt alles mit; wer sie verlässt, nimmt es mit.
- **Das ganze Land lebt vom ersten Tag an:** Alle Regionen werden zu Beginn gefüllt.
- **Morgens** entscheidet jeder Gladiator der eigenen Region (`ludusLifePlan`): unter 55 % Leben, verletzt oder am Tag vor dem Turnier ruht er; sonst Grube oder Arena (Wagemutige öfter Arena) oder Ruhe. Der Champion geht nur ab und zu in die Arena und ist außerhalb des Turniers nicht herausforderbar. Die Rangliste zeigt, wer heute wo ist.
- **Grube und Arena des Spielers** bieten nur, wer heute dort ist: in der Grube Gruppen so groß wie die Aufstellung, nach Stärke gestaffelt, die Aussichten werden geprüft und leicht/fair/schwer ausgewählt; in der Arena zwei Duelle (Mitte und Spitze), Doppel oder Trio, und ein Rudel aus den Schwächsten. Ist niemand da, gibt es heute nichts. Wer gegen den Spieler gekämpft hat, kämpft an diesem Tag nicht mehr. In der Grube nimmt der Spieler dem Besiegten sein bestes Stück wirklich ab.
- **Abends** kämpfen die übrigen gegeneinander (`ludusLifeEvening`), Paare ähnlicher Stärke: in der eigenen Region mit der echten Engine (`ludusLifeBout`), in den anderen Regionen geschätzt (Siegchance nach Stärke hoch 1,5; Stärke = Art und Stufe, Ausrüstung, Wunden; der Verlierer eines Arenakampfs stirbt mit 6 %). Folgen wie beim Spieler: Erfahrung (gleiche Formel), Wunden, in der Grube das beste Stück des Verlierers (getragen, wenn besser, sonst verkauft), in der Arena Gold und Ehre, Tote. Wer ruht, heilt die Hälfte.
- **Einkauf:** Gladiatoren mit Gold kaufen bessere Ausrüstung, eine Güte über der getragenen, bis eine Güte über dem Üblichen der Region.
- **Turniere:** Alle Regionen haben am selben Tag Turnier; außerhalb der eigenen Region wird es aus den besten acht geschätzt. Turnierkämpfe in der eigenen Region ohne Spieler laufen mit der echten Engine und können töten.
- **Wanderung:** Nach den Turnieren zieht, wer 2 Stufen über der Stufe seiner Region steht (und nicht Champion ist), in die am wenigsten volle Region rechts davon (über Wegpunkte hinweg). Neulinge entstehen nur in der ersten Spalte; eine Region mit weniger als 6 Gladiatoren bekommt Zugereiste.
- **Chronik:** In der Rangliste steht alles aus der eigenen Region (Beute in der Grube, Tote, Turniersieger, wer weiterzieht oder ankommt, Neulinge), aus anderen Regionen nur Tode und Turniersieger der nächsten zwei Spalten (dorthin geht der Weg).
- **Namen:** Jeder Gladiator hat Vor- und Beinamen (20 × 22), eindeutig im ganzen Land.
- **Champions ziehen auch weiter**, eine Stufe später als die anderen (3 über der Regionsstufe); den Titel übernimmt der mit der meisten Ehre. In der letzten Spalte tritt ab, wer herauswächst (als Legende).
- **Gemessen** (Bot, `tools/ludus-tour-bot.js`, vier Arten, 180 Tage; der Bot geht in die Arena ab 60 % Aussicht, sonst in die Grube, ruht unter 50 % Leben):
  - Vorher (Champions blieben für immer): 1 bis 4 Regionen; ein Bot hing über 90 Tage an einem Elfen der Stufe 7 in einer Region der Stufe 2; rechts Stufe 12 bis 13 im Schnitt (Spitzen 17); bis 3700 Gold übrig.
  - Jetzt: 17 von 20 Turnieren gewonnen, 3 bis 5 Regionen in 180 Tagen. Das Feld einer Region liegt im Schnitt 1 bis 2 Stufen über der Regionsstufe, der Champion 2 bis 3; die eigenen Kämpfer liegen zur Turnierzeit 3 bis 5 Stufen über der Regionsstufe (sie kämpfen jeden Tag). Die letzte Spalte hat Stufe 8 bis 10. Gold am Ende 40 bis 1500.
  - Damals offen: Ein ganzer Lauf über alle 11 Spalten dauerte 330 bis 360 Tage (30 Tage je Turnier). Gelöst mit Turnier alle 10 Tage und Tagesaufgaben (unten).
- **Gemessen mit Tagesaufgaben, täglicher Kost und Turnier alle 10 Tage** (vier Bots, 150 Tage; der Bot lässt Verletzte ruhen, einen arbeiten, wenn das Gold knapp ist, den Schwächsten trainieren, wenn genug da ist):
  - 2 von 4 Schulen gewannen den Lauf (Tag 113 und 133), eine stand an Tag 150 in Spalte 5, eine rutschte ab (ab Spalte 3 elf Turniere verloren, oft verschuldet).
  - 24 bis 45 Tage ohne Kampf (Ruhe, Arbeit, Training). Gold am Ende 215 bis 3500.
  - Vorher gefunden und behoben: (1) Ein einzelner Kämpfer kam aus der Schuld nie heraus (jeden Morgen Schuldkampf, abends wieder keine Kost) — jetzt isst, wer die Schuld abkämpft, an dem Tag umsonst. (2) Gaben „Goldgierig“ stapelten sich bis ins Vielfache (eine Schule hatte 38 790 Gold) — Gold und Erfahrung aus Gaben sind jetzt insgesamt auf das Doppelte begrenzt.
  - Ein Tag dauert etwa eine halbe Sekunde (vier Bots gleichzeitig: 1,7 s).

## Grundidee
Der Spieler führt eine Kampfschule (Ludus), trainiert und rüstet Kämpfer aus und schickt sie durch Turniere. Statt der Overworld gibt es einen Marktplatz (Townsquare); statt Dungeon-Bau gibt es Kämpfe in der Arena. Ein Kampf kann autobattle laufen oder per Besessenheit selbst gesteuert werden (gleiche Regeln wie im Hauptspiel: was die KI kann, kann der Spieler).

## Schleife
1. Marktplatz: Kämpfer heilen, Ausrüstung kaufen / schmieden / neu auswürfeln, Teammates anheuern, Fähigkeiten (Bücher) kaufen.
2. Turnier wählen: Reihe von Kämpfen (Gegner, Gelände, Sonderregeln) mit Preisgeld und Ruhm.
3. Kampf (Auto oder selbst), Beute und Gold danach.
4. Ergebnis: Ruhm steigt, neue Turniere öffnen sich, Verletzungen und Tod haben Folgen.

## Fortschritt
- Gold (Alltag), Ruhm (schaltet Turniere und Händler frei), Gunst (Sonderwährung für Spezialgüter, optional).
- Nur Kreaturen, Waffen, Rüstungen, Fähigkeiten und Räume, die im Hauptspiel schon freigeschaltet wurden (Vault/Kampagnenstand), tauchen auf. Die Kampagne speist den Ludus, der Ludus gibt kleine Belohnungen zurück (Zukunftsidee).
- Kämpfer leveln wie im Hauptspiel (Stufen 5/10, Fähigkeiten), Ausrüstung ist prozedural (Teile, Güte, Reroll).

## Entschieden (Nutzer)
- Roguelike mit Permadeath, gleiche Mechaniken wie im Hauptspiel. Wer ohnmächtig wird (Faint), statt zu sterben, überlebt.
- Start: eine beliebige bekannte Kreatur, Stufe 1, ohne Ausrüstung.
- Pit Matches: kleine 1v1-Kämpfe, jederzeit machbar, sehr ausbalanciert, geringe Einsätze, Gewinn nur Gold.
- Wöchentliche Turniere mit kleinem Leaderboard; prozedurale Gegner mit Namen und Ausrüstung wie im Hauptspiel.
- Jeder Kampf ist ein Zug, strikte Zeitfenster (Tage/Wochen als Takt).
- Globales Leaderboard: gewinnen heißt, Platz 1 zu schlagen.
- Heilung wie im Hauptspiel: Hühner essen/kaufen; ohne Geld im Bett schlafen = eine Runde aussetzen.
- Mehrere Shops: Schmiede, Bücherei usw.

## Vorschläge (zur Diskussion)
- Globale Rangliste ohne Server: Jede Woche gibt es einen festen Seed (aus dem Datum). Alle Spieler bekommen dieselben Gegner. Das Ergebnis (Punkte, Runden) lässt sich vergleichen; ein echtes Online-Ranking kann später als optionales Backend dazukommen. Ohne Server ist "Platz 1" ein Geisterfeld (prozedurale Rivalen, deren Ergebnis aus dem Seed folgt).
- Kopplung Hauptspiel ↔ Ludus: lose und einseitig stark. Das Hauptspiel schaltet Inhalte frei (Katalog), der Ludus gibt Sachwerte zurück (Zauber/Artefakt-Funde, Ruhm-Titel), aber keine Zahlenvorteile für die Kampagne.
- Meta-Progression: persistenter Ludus (Gebäude: Schlafsaal, Schmiede, Bücherei, Küche), über Läufe hinweg ausbaubar mit Ruhm.
- Austausch von Kreaturen: Hauptspiel → Ludus als Startoption (Vault-Kreaturen); Ludus → Hauptspiel nur als Verbündeter über die Vault, gegen Ressourcen.

## Zwischenschritte (Arena als Testbank, unabhängig vom Ludus)
- Roster: jede Kreatur einzeln, "Kopieren" statt "×N".
- Sprite mit Idle-Animation im Roster, Ausrüstung direkt auf dem Sprite sichtbar.
- Reroll-Knopf für das prozedurale Aussehen der Ausrüstung.

## Stand der Umsetzung (ludus.js)
- Läuft: Neuer Lauf (freie Kreatur, Stufe 1, 40 Gold, ohne Ausrüstung), Pit-Kämpfe als 1v1 (Gegner und Ausrüstungsstufe werden per Probekämpfen so gewählt, dass das Duell ungefähr ausgeglichen ist), Taverne (Huhn / Schlafen), Schmiede (täglich wechselndes Angebot, Verkauf, Aussehen neu würfeln), Permadeath, Rekorde.
- Debug-Schalter "alles freigeschaltet" im Startbildschirm (an). Ohne ihn nur Startkreaturen, bis die Freischaltung aus der Kampagne angebunden ist.
- Offen: Bücherei (Fähigkeiten kaufen), wöchentliche Turniere mit Seed-Rangliste, Ludus-Ausbau (Meta-Fortschritt), Anbindung an Vault/Kampagne.

## Stand (Fortsetzung)
- **Bücherei**: drei Bücher am Tag (Fähigkeiten passend zur Art, Preis nach Kraft); gelernt wird mit den Regeln des Hauptspiels (Plätze, schwächste wird ersetzt).
- **Wochenturnier**: zehn Rivalen aus einem Seed, der nur von der Kalenderwoche abhängt; alle Spieler treffen dieselben Gegner (Stufe 1 bis 17, steigende Ausrüstung). Von unten nach oben besiegen, der Meister gibt 10 Ruhm und einen Titel. Jeder Kampf kostet einen Tag.
- **Zwei Waffen und Waffensystem** (siehe waffen.md) gelten auch im Ludus; der Reiter "Ausrüstung" legt Waffen an (zwei Einhandwaffen = Doppelführung).
- Offen: echtes Online-Ranking (nur mit Server), Meta-Fortschritt (Ausbau des Ludus über Läufe), Freischaltung der Kreaturen aus der Kampagne statt Debug-Schalter.

## Ausbau der Räume (gehört jetzt zum Lauf, nicht zur Meta-Progression)

**Stand:** Räume, Ansehen und freigeschaltete Waffenkategorien gehören zum jeweiligen Lauf und beginnen bei jedem neuen Kämpfer von vorn (Taverne und Grube Stufe 1). Gespeichert über Läufe hinweg bleiben nur Rekorde und Debug-Schalter. Die eigentliche Meta-Progression wird noch neu entworfen (offen). Die Beschreibung unten nennt noch die alte Idee, dass der Ausbau über Läufe bleibt.

- **Der Hof ist ein 3D-Raum** (`hub3d.js`, Three.js): Orbit-Kamera (Ziehen dreht, Rad zoomt, Klick auf ein Gebäude öffnet seinen Reiter), Gäste laufen durch die Taverne, der Kämpfer des Laufs steht am Kamin. Gebäude, die noch nicht gebaut sind, erscheinen als Bauplatz mit Schloss.
- **Räume** (`LUDUS_ROOMS`) werden mit **Ansehen** gekauft und in Stufen ausgebaut; Ansehen kommt aus Siegen (Grube +1, Turnier +2, Meister +10, Lauf-Ende Ruhm/2) und bleibt über alle Läufe. Die Taverne gibt es von Anfang an, die Grube kostet 10, genau so viel wie ein neuer Spieler (12) besitzt.
  - **Taverne** (3 Stufen): besseres Huhn und stärkerer Schlaf. **Grube** (3): größere Preise. **Schmiede** (4): die Qualität der Ware (Stufe 1 nur grobe Ware aus dem schlechtesten von sechs Teile-Würfen, Stufe 4 episch aus dem besten) und die **Sorten** (Waffenarten, Rüstungsgewichte, Schilde) werden einzeln gekauft (`LUDUS_CATS`). **Bücherei** (3): Stärke der angebotenen Fähigkeiten. **Turnierhalle** (2): Wochenturnier, höhere Preise.
- Debug: "alle Kreaturen freigeschaltet" und "alle Räume voll ausgebaut" im Startbildschirm.
- Offen: weitere Räume (Küche, Schlafsaal als Heilung, Markt), Kreaturen-Freischaltung aus der Kampagne, Darstellung von Waffen- und Rüstungsständern in der Schmiede nach Sorten.

## Hof überarbeitet (neu)
- **Die Kamera gehört dem gewählten Raum.** Jedes Gebäude ist eine eigene Bühne (`hub3d.js`); beim Wechsel schwingt die Kamera schnell hinüber, die anderen Räume sind danach nicht mehr zu sehen. Der Kämpfer steht vor der Tür und geht kurz nach dem Schwenk hinein. Die Orbit-Kamera ist eng begrenzt (leichtes Drehen und Zoomen).
- **Bauplätze statt Ausbau-Reiter**: Jedes Gebäude hat seinen Reiter. Ein noch nicht gebauter Raum zeigt einen leeren Bauplatz mit Pflöcken und Seil, die einzige Möglichkeit ist, ihn zu bauen. Gebaute Räume haben unten den Knopf für die nächste Stufe, die Schmiede dort auch das Sortiment.
- **Die Grube gibt es von Anfang an** (Stufe 1 kostenlos), damit niemand festsitzt. Ausbau Stufe 2 und 3 kostet Ansehen.
- **Bücher** aus der Bücherei liegen im Inventar und müssen dort gelernt werden (mit den Regeln des Hauptspiels).
- **Trainingsraum** (neu, 3 Stufen): eine Runde am Dummy gibt Erfahrung ohne Schaden, kostet Gold und einen Tag.

## Fortschritt, Druck und Abwechslung (neu)
- **Tage drücken**: Alle 5 Tage kommt ein **Wochenkampf als Pflichtkampf** (fairer Gegner, ohne Rangliste, siehe unten), und wer **3 Tage nicht kämpft**, wird vom Wirt in einen Pflichtkampf geschickt (fairer Gegner, halber Preis). Oben stehen "Wochenkampf in X Tagen" und "Pflichtkampf spätestens in Y Tagen". So lässt sich nicht endlos schlafen und üben; Training und Schlaf kosten Tage und schieben den Druck näher.
- **Die Grube bietet Auswahl**: ein *leichter* Kampf (Siegchance etwa 80 %, 60 % Preis) und ein *fairer* (etwa 50 %); mit ausgebauter Grube (Stufe 2) kommt ein *schwerer* dazu (etwa 30 %, 170 % Preis). Die Schwierigkeit wird mit Probekämpfen gemessen, nicht geschätzt.
- **Kampfvarianten**: Duell, **Rudel** (2 bis 3 schwächere Gegner) und **Tag-Team** (ein Verbündeter, zwei Gegner); manchmal liegt **Ausrüstung in der Grube** (wer keinen Feind in der Nähe hat, geht zuerst hin und nimmt sie auf).
- **Ereignisse** nach Kämpfen (30 %): kurze Geschichten mit Wahlmöglichkeiten, dazu Optionen, die ein **Merkmal der Art** freischaltet (Skelett: Falle stellen, Dieb: Beutel stehlen, Troll: Armdrücken), im Stil von FTL. Heute vier Ereignisse (Fauchen im Tunnel, Händler, Gladiator, Fest); eine Wahl kann einen Pflichtkampf (Hinterhalt) auslösen.

## Gaben
After a won tournament round the fighter picks one of three procedural gifts, see `gaben.md`.

## Die Welt: persistente Charaktere und Ereignisse (neu)
- **Welt** (`ludus.world`, `ludus-world.js`): zehn dauerhafte Charaktere `{name, Art, Stufe, Ausrüstungsstufe, Look-Seed, Zustand}`. Duelle und Tag-Teams der Grube werden gegen sie gekämpft (Rudel bleiben anonym). Sie behalten Aussehen und Ausrüstung, steigen auf, können **fallen**, sich **ergeben** (dann sind sie bis zur nächsten Runde verkrüppelt und aus der Grube) oder dich besiegen.
- **Erinnerung:** Jeder Charakter weiß, was zuletzt zwischen euch geschah (besiegt, ergeben, geholfen, ausgeraubt, Schutzgeld …) und eine Bindung (−3…3). Das lesen die Ereignisse.
- **Erneuerung** nach jeder Turnierrunde (`ludusRepopulate`): 25 % scheiden aus, die übrigen steigen mit Wahrscheinlichkeit auf, Verkrüppelte erholen sich, neue kommen nach, bis wieder zehn da sind.
- **Taverne:** Gäste sind der Gefährte, bekannte Charaktere und ein paar Fremde (jeder Tag hat dieselbe Besetzung); in der 3D-Taverne sitzen genau sie.
- **Gefährte:** ein Charakter kann sich dir anschließen und kämpft dann in Tag-Team-Kämpfen an deiner Seite (steigt jede Woche auf, kann aber auch fallen).
- **Ereignisse** (`ludus-events.js`, jeden Tag möglich) haben einen **eigenen 3D-Raum** (Gasse): der Kämpfer und bis zu drei andere stehen darin, mit ihrer echten Ausrüstung, sodass man die Lage lesen kann (sind die Banditen schlecht bewaffnet? kämpfen oder Schutzgeld zahlen?). Nach der Wahl kommt ein **Nachspiel** mit Beschreibung und Folgen, erst dann geht der Tag weiter.
- **Geschichten** über Charaktere haben höheres Gewicht: der Bettler (ein Charakter, der sich ergeben hat), später der Dank vor der Taverne mit dem Angebot, Gefährte zu werden, oder die alte Rechnung (Rache für Ausrauben/Wegschicken).
- Ereignisse sind Daten: `make()` (kann es jetzt passieren, wer spielt mit?), `text()`, `options` mit `run()`, das `{text, fight|bout, exit}` zurückgibt.

## Das Team (neu)
- Die Taverne bestimmt die **Teamplätze**: Stufe 1 ein Mitstreiter neben dem Kämpfer, Stufe 2 zwei, Stufe 3 drei. Mitstreiter werden in der Taverne **angeheuert** (Gäste mit „Anheuern", Preis nach Stufe und Bindung) oder treten über Ereignisse bei (der Bettler, dem man half). **Entlassen** gibt den Platz frei.
- Jedes Mitglied hat eigene Ausrüstung, Wunden, Erfahrung, Fähigkeiten, Bücher und Gaben. Die Reiter im Kopf der Kämpferkarte wählen, wer gerade angezeigt und ausgerüstet wird. Schlafen heilt das ganze Team, Huhn und Training wirken auf das gewählte Mitglied.
- **Kämpfe:** Wer allein ist, bekommt wie bisher gelegentlich einen geliehenen Mitstreiter (Tag-Team). Sobald ein Team da ist, gibt es keine Tag-Team-Kämpfe mehr: Es kämpft das ganze Team gegen gleich viele Gegner (Gruppe) oder ein größeres Rudel. Der Preis wächst mit der Teamgröße. Turnierrunden bringen ein Gefolge mit.
- **Tod:** Fällt ein Mitglied, ist es weg (und in der Welt tot). Der Lauf endet, wenn das ganze Team gefallen ist.
- **Gaben** nach dem Turnier: man wählt auch, wer sie bekommt.
- Die Stufe des Teams (Durchschnitt) bestimmt, wie stark Gegner und Turnierrivalen sind.

## Arenen (neu)
Neben der offenen Grube und den Höhlen gibt es geformte Kampfplätze (`arena-stages.js`): **Engpass** (Mauer mit schmaler Lücke), **Brücke über Lava** (zwei Plattformen, zwei schmale Brücken), **Ring** (großer Block in der Mitte), **Lavainsel** (Insel in einem Lavagraben, vier Brücken), **Säulenhalle** (Deckung für Schützen) und **Gassen** (drei Bahnen mit Lücken). Jeder Pit-Kampf und jede Turnierrunde hat eine Arena; die Probekämpfe der Grube zählen sie mit, die Schwierigkeit stimmt also.

## Tempo
Der Wochenkampf kommt alle 5 Tage (Pflichtkampf nach 3 Tagen ohne Kampf), Erfahrung aus Kämpfen ×3,5, Ansehen ×1,5.

## Gemeinsames Inventar (neu)
Das Team teilt sich einen Vorrat (`ludus.stash` für Ausrüstung, `ludus.bookbag` für Bücher). Ein Mitglied trägt nur, was es anhat; Einkäufe, Beute und Funde landen im Vorrat. Der Reiter „Inventar" zeigt alles als Gitter mit den Pixelbildern des Spiels (Waffen aus ihren Teilen, Schilde, Rüstungen; der Rand zeigt die Güteklasse, ein Buchstabe in der Ecke den Träger). Ein Stück wird einem Mitglied angelegt, weitergegeben oder abgelegt; Würfeln und Verkaufen gelten für alle Stücke. Bücher werden von einem gewählten Mitglied gelernt.
Die Karte eines Kampfes steht jetzt für die ganze Probe fest (`fixedMap`): Die Probekämpfe der Grube und der echte Kampf finden auf derselben Höhle statt, sonst stimmte die Schätzung nicht mit dem Kampf überein.

## Schriftrollen (neu)
Die Zauber der Götterhand aus dem Hauptspiel (Heilen, Wecken, Fluch, Eile, Feuerball, Blitz, Lähmen) gibt es im Ludus nur als **Schriftrollen zum einmaligen Gebrauch**: Sie werden in der Bücherei gekauft (zwei am Tag), liegen als Beute (15 % nach einem Kampf, 40 % nach einem Turnier) oder kommen aus Ereignissen (Händler, verwundeter Gladiator). Im Kampf zeigt der Zauberreiter nur die Rollen im Besitz; ein Zauber verbraucht eine Rolle. Herbeirufen gibt es nicht.
## Seltenheit
Späte Arten sind mit Absicht stärker (Budget, `docs/budget.md`) und seltener unter den Gegnern und in der Welt: Episch etwa ein Fünftel so oft wie Gewöhnlich, Legendär etwa ein Zwanzigstel, Lich und Drache fast nie (`budget.js`, `creatureRarity`).
## Seiten
Wer in welchem Lager beginnt, wird pro Kampf gewürfelt (`swapSides`, aus dem Seed), damit Karten ohne Gleichgewicht nicht immer dieselbe Seite begünstigen.

## Früher: Pflichtkämpfe und Kartenmodus (durch die Tournee ersetzt)

- **Wochenkampf:** Alle 5 Tage (erstmals Tag 8) ist ein Kampf Pflicht. Er ist ein normaler Kampf (kein Tod-Zwang) und bringt Gold, aber keinen Fortschritt in der Rangliste. Wer 3 Tage nicht kämpft, muss ebenfalls antreten.
- **Rangliste (klassischer Modus):** Die Turnierhalle hat einen Knopf „Herausfordern": freiwillig, auf Leben und Tod, mit den alten Belohnungen (Gabe, Ansehen, Ruhm, Titel).
- **Kartenmodus (`ludus-map.js`):** In der Startmaske wählbar, sobald freigeschaltet (Debug-Schalter „alle Kreaturen", 8 Siege in einem Lauf oder ein Titel). Die Welt kommt aus `buildWorld` wie in der Kampagne (aus dem Lauf-Seed neu gebaut, nicht gespeichert). Jede Reise zu einer Nachbarstadt kostet einen Tag; Wegepunkte mit Ereignis-Symbol lösen ein Ereignis oder einen Fund aus. Die Hauptstadt öffnet ihre Tore erst, wenn 6 Städte erobert sind (`LUDUS_CITY.needs`).
- **Turnier einer Stadt:** 2 bis 4 Runden an aufeinanderfolgenden Tagen (Team wird über Nacht gepflegt), jede Runde auf Leben und Tod. Sieg = weiter, Niederlage = raus aus dem Turnier. Das Finale gibt es gegen eine Figur der Rangliste (je weiter rechts die Stadt, desto höher der Platz; die Hauptstadt hat den Meister) oder gegen ein Geisterteam, dessen Stufe zur Stadt passt. Finalsieg: Stadt erobert (Gold, Ansehen, Ruhm, Gabe). Hauptstadt erobert = Lauf gewonnen.

### Früher: Stärke der Städte (Balancing des alten Kartenmodus, Werkzeuge entfernt)
- Jede Stadt hat eine **Stufe** (`ludusCityLevel`): 1 + 1 je Spalte der Karte, höchstens 9 (die Erfahrung für die nächste Stufe verdoppelt sich je Stufe, über 9 kommt man im Lauf kaum). Die Zahl steht an der Stadt, gefärbt nach deinen Aussichten (Leicht / Machbar / Ausgeglichen / Riskant / Aussichtslos, nach dem Stufenunterschied). Im Stadtfeld steht außerdem, worauf die Gegner abgestimmt sind: Stufe, Güte der Ausrüstung und Zahl der Gaben.
- Die Gegner hängen **nicht von deinem Team**, sondern von der Stadt ab: Probekämpfe gegen ein **Referenzteam** (`ludusRefTeam`) suchen die Gegnerstufe, bei der das Referenzteam eine Zielquote gewinnt. Das Referenzteam sind deine Kreaturenarten auf der Stufe der Stadt, mit Schwert und leichter Rüstung der Güte, die man dort üblicherweise trägt (grob bis Spalte 2, schlicht bis 7, danach fein), und den Gaben, die man auf dem üblichen Weg bis dahin hat (0,6 je Spalte nach der ersten). Wer stärker ist (mehr Stufen, bessere Ausrüstung, mehr Gaben, Schriftrollen, Steuerung von Hand), gewinnt sicherer; wer zu früh kommt, verliert.
- Zielquoten für das Referenzteam (`LUDUS_CITY`): Runde 0,99 − 0,012 je Spalte, Finale 0,97 − 0,025 je Spalte. Weder Art noch Stufe werden zurechtgebogen: Die Gegnerstufe liegt höchstens 4 über der Stadtstufe (`maxOver`); braucht eine schwache Art mehr, nimmt eine stärkere ihren Platz (`ludusCupCandidateG` wählt unter sechs Kandidaten den, der der Quote am nächsten kommt; eine Figur, die selbst auf Stufe 1 zu mächtig ist, weicht einer geringeren Art, eine zu schwache einer stärkeren). Geisterteams werden nur schwächer, nie stärker, als die Stadt erlaubt.
- Erfahrung aus einem Stadtkampf richtet sich nach der Stadtstufe, nicht nach der (angepassten) Gegnerstufe.
- **Aufrüstung:** Wer ewig trainiert, macht die Karte leicht (Bots mit einer Stufe Abstand eroberten sie nach 125 Tagen ohne Verlust). Darum rüsten die Städte auf: ab Tag 90 steigt jede Stadtstufe um 1, danach alle 20 Tage um 1 (`driftStart`, `driftEvery`; die Karte zeigt es an). Geisterteams werden nach ihrer Grundstufe (ohne Aufrüstung) den Städten zugeordnet.
- Die Suche nach den Gegnern ist ein Generator (`ludusFitLevelG`, `ludusCupBoutG`): Sie läuft in kleinen Schritten, die Seite bleibt bedienbar, und schon beim Ergebnisbild der Runde davor wird die nächste Runde gesucht (`ludusCupSearch`).

**Gemessen** (`tools/ludus-map-bot.js` spielt Läufe, `tools/ludus-map-eval.js` testet gespeicherte Teams gegen die Stadtkämpfe, 65 Teams aus Bot-Läufen):

| Stufenunterschied zur Stadt | −2 | −1 | 0 | +1 | +2 |
|---|---|---|---|---|---|
| Runde gewonnen | 0,70 | 0,83 | 0,90 | 0,94 | 0,96 |
| Finale gewonnen | 0,63 | 0,78 | 0,86 | 0,92 | 0,96 |

Eine Stufe mehr oder weniger verschiebt die Quote also um 4 bis 8 Punkte; ein Turnier mit drei Runden gewinnt man auf der Stadtstufe etwa 7 von 10 Mal, mit einer Stufe mehr 8 von 10, mit zweien mehr 9 von 10.

**Bot-Läufe** (`tools/ludus-map-bot.js`, höchstens 140 Tage, sechs Arten): Der Bot hält sich in der Grube an die Stadtstufe plus einen Abstand und erobert dann die tiefste Stadt, für die es reicht.
- Ohne Abstand (tritt genau auf der Stadtstufe an): 1 von 6 Bots gewann (Elf, Tag 78), die anderen fielen nach 5 bis 7 eroberten Städten (Tag 31 bis 76). Rund 4,5 von 100 Kämpfen gingen verloren.
- Mit einer Stufe Abstand (Fassung ohne Aufrüstung): 3 von 5 Bots gewannen (nach 124 bis 129 Tagen), zwei fielen. Rund 1,6 von 100 Kämpfen gingen verloren. Dieses Training ist es, das die Aufrüstung der Städte bremst.
- Gewollt ist also: Wer genau auf der Stadtstufe antritt, schafft die Karte selten (etwa jeder Sechste), wer mit Reserve und Zeit kommt, meistens. Offen: Die Bots nutzen keine Schriftrollen und steuern nicht von Hand; Spieler dürften besser abschneiden.

## Geister: frühere Teams als Rivalen (`ludus-ghosts.js`)
- **In der Tournee:** Ein Geisterteam, dessen Stufe zur Region passt (Regionsstufe + 2, ±1), wird dort Boss: sein stärkstes Mitglied steht auf Platz 1. Wird es im Turnier geschlagen, tritt es ab. Die Punkte unten beschreiben die alte Rangliste.
- Endet ein Lauf durch den Tod des Teams (oder durch die Eroberung der Hauptstadt), wird das ganze Team (Kreaturen, Stufen, Ausrüstung, Gaben, Fähigkeiten) in `ludusMeta.ghosts` gespeichert (höchstens 10, die ältesten fallen heraus).
- In jedem späteren Lauf ersetzt ein Geist die Ranglistenfigur seiner Stärke (durchschnittliche Stufe → Platz; belegte Plätze rücken zum nächsten freien). Er ist in der Turnierhalle als „früheres Team" markiert.
- Der Kampf ist Team gegen Team, mit den gespeicherten Werten und ohne Anpassung an das eigene Team (im Kartenmodus als Finale, im klassischen Modus als Herausforderung).
- Besiegt: Das Team tritt ab (verschwindet aus der Liste), das beste Ausrüstungsstück fällt dem Sieger zu, dazu Ruhm und Ansehen.
