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

## Meta-Fortschritt als Ort (neu)
- **Der Hof ist ein 3D-Raum** (`hub3d.js`, Three.js): Orbit-Kamera (Ziehen dreht, Rad zoomt, Klick auf ein Gebäude öffnet seinen Reiter), Gäste laufen durch die Taverne, der Kämpfer des Laufs steht am Kamin. Gebäude, die noch nicht gebaut sind, erscheinen als Bauplatz mit Schloss.
- **Räume** (`LUDUS_ROOMS`) werden mit **Ansehen** gekauft und in Stufen ausgebaut; Ansehen kommt aus Siegen (Grube +1, Turnier +2, Meister +10, Lauf-Ende Ruhm/2) und bleibt über alle Läufe. Die Taverne gibt es von Anfang an, die Grube kostet 10, genau so viel wie ein neuer Spieler (12) besitzt.
  - **Taverne** (3 Stufen): besseres Huhn und stärkerer Schlaf. **Grube** (3): größere Preise. **Schmiede** (4): die Qualität der Ware (Stufe 1 nur grobe Ware aus dem schlechtesten von sechs Teile-Würfen, Stufe 4 episch aus dem besten) und die **Sorten** (Waffenarten, Rüstungsgewichte, Schilde) werden einzeln gekauft (`LUDUS_CATS`). **Bücherei** (3): Stärke der angebotenen Fähigkeiten. **Turnierhalle** (2): Wochenturnier, höhere Preise.
- Debug: "alle Kreaturen freigeschaltet" und "alle Räume voll ausgebaut" im Startbildschirm.
- Offen: weitere Räume (Küche, Schlafsaal als Heilung, Markt), Kreaturen-Freischaltung aus der Kampagne, Darstellung von Waffen- und Rüstungsständern in der Schmiede nach Sorten.
