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

## Offene Entscheidungen
- Tod: dauerhaft, oder Verletzung mit Heilkosten, oder wählbarer Schwierigkeitsgrad?
- Ein Kämpfer oder ein Team (1–3) von Anfang an? Teammates kaufen oder gewinnen?
- Turnierform: feste Leiter, Auswahl aus Aushängen, oder Saison mit Kalender?
- Wirtschaft: Unterhalt der Kämpfer, Preise, Ruhm-Schwellen.
- Rolle der Rassen/Spezies: freie Wahl oder Rekrutierung nur über Händler.

## Zwischenschritte (Arena als Testbank, unabhängig vom Ludus)
- Roster: jede Kreatur einzeln, "Kopieren" statt "×N".
- Sprite mit Idle-Animation im Roster, Ausrüstung direkt auf dem Sprite sichtbar.
- Reroll-Knopf für das prozedurale Aussehen der Ausrüstung.
