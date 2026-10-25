# Ludus — Arena als zweiter Spielmodus (Konzeptentwurf)

Status: Entwurf zum Ausarbeiten. Die Creature Arena (`arena.js`) bleibt zugleich Testbank; der Ludus-Modus baut darauf auf.

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
- **Tage drücken**: Alle 7 Tage kommt eine **Turnierrunde als Pflichtkampf** (die nächste Rivalin der Rangliste), und wer **4 Tage nicht kämpft**, wird vom Wirt in einen Pflichtkampf geschickt (fairer Gegner, halber Preis). Oben stehen "Turnier in X Tagen" und "Pflichtkampf spätestens in Y Tagen". So lässt sich nicht endlos schlafen und üben; Training und Schlaf kosten Tage und schieben den Druck näher.
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
Die Turnierrunde kommt alle 5 Tage (Pflichtkampf nach 3 Tagen ohne Kampf), Erfahrung aus Kämpfen ×3,5, Ansehen ×1,5.

## Gemeinsames Inventar (neu)
Das Team teilt sich einen Vorrat (`ludus.stash` für Ausrüstung, `ludus.bookbag` für Bücher). Ein Mitglied trägt nur, was es anhat; Einkäufe, Beute und Funde landen im Vorrat. Der Reiter „Inventar" zeigt alles als Gitter mit den Pixelbildern des Spiels (Waffen aus ihren Teilen, Schilde, Rüstungen; der Rand zeigt die Güteklasse, ein Buchstabe in der Ecke den Träger). Ein Stück wird einem Mitglied angelegt, weitergegeben oder abgelegt; Würfeln und Verkaufen gelten für alle Stücke. Bücher werden von einem gewählten Mitglied gelernt.
Die Karte eines Kampfes steht jetzt für die ganze Probe fest (`fixedMap`): Die Probekämpfe der Grube und der echte Kampf finden auf derselben Höhle statt, sonst stimmte die Schätzung nicht mit dem Kampf überein.

## Schriftrollen (neu)
Die Zauber der Götterhand aus dem Hauptspiel (Heilen, Wecken, Fluch, Eile, Feuerball, Blitz, Lähmen) gibt es im Ludus nur als **Schriftrollen zum einmaligen Gebrauch**: Sie werden in der Bücherei gekauft (zwei am Tag), liegen als Beute (15 % nach einem Kampf, 40 % nach einem Turnier) oder kommen aus Ereignissen (Händler, verwundeter Gladiator). Im Kampf zeigt der Zauberreiter nur die Rollen im Besitz; ein Zauber verbraucht eine Rolle. Herbeirufen gibt es nicht.
## Seltenheit
Späte Arten sind mit Absicht stärker (Budget, `docs/budget.md`) und seltener unter den Gegnern und in der Welt: Episch etwa ein Fünftel so oft wie Gewöhnlich, Legendär etwa ein Zwanzigstel, Lich und Drache fast nie (`budget.js`, `creatureRarity`).
## Seiten
Wer in welchem Lager beginnt, wird pro Kampf gewürfelt (`swapSides`, aus dem Seed), damit Karten ohne Gleichgewicht nicht immer dieselbe Seite begünstigen.
