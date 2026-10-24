# Kampfsystem: Ausdauer, Schadensarten und Flucht (Entwurf)

Anlass: Wer in der Arena flieht, endet meistens in einem Patt. Beide laufen gleich schnell, der Flüchtende sucht das nächste Feld mit Abstand 7, der Verfolger holt auf, und beide wandern wie Krabben seitwärts durch den Hof, bis die Zeit abläuft (heute begrenzt nur die Aufgabe nach etwa 20 Sekunden Flucht das Ganze). Das Ziel dieses Entwurfs: **Flucht darf kein Dauerzustand sein, den der Verfolger nicht beenden kann.**

## Ausdauer (kurz, im Kampf) neben Müdigkeit (lang, Schlaf)
- Die bisherige **Energie** (`energy`, Schlaf im Dungeon) bleibt als Müdigkeit: Sie trägt Schlafsaal, Arbeitstage und Hunger. Die neue **Ausdauer** (`stamina`) ist die kurze Kampfressource: schnell leer, schnell wieder voll. So bleibt der Dungeon-Alltag unberührt, und der Ludus bekommt trotzdem Souls-Gefühl.
- **Jede Kampfhandlung kostet Ausdauer**: ein Hieb nach Waffe (schwere Waffe viel, Dolch wenig, Masse und Schlagdauer als Maß), ein Ausfallschritt, eine Fähigkeit, Blocken mit dem Schild, Rennen. Nach einer Handlung gibt es eine kurze Pause (etwa 1 Sekunde), danach läuft die Erholung zügig (Souls: ein Hieb kostet ordentlich, die Erholung ist schnell).
- **Kopplung**: nicht hart. Über 30 % Ausdauer läuft alles normal. Darunter fällt das Tempo (Schläge und Schritte) linear bis auf 60 %; bei 0 geht gerade noch Gehen, keine Hiebe und Fähigkeiten, bis wieder 15 % da sind. Harte Sperren erzeugen "Todesspiralen", weiche geben einen Unterschied, den man sieht.

## Flucht wird zum Sprint, der Ausdauer kostet
- Wer flieht, **rennt**: etwa 30 % schneller, aber jeder Schritt kostet Ausdauer. Der Verfolger geht normal und holt auf, sobald die Beine leer sind. Der Flüchtende wird dann langsam (60 %) und ist einholbar.
- **In die Enge getrieben** (Verfolger anliegend und kein Feld mit größerem Abstand): Er dreht sich um und kämpft ("Verzweiflung": ein Hieb zu 120 %). Das beendet das Seitwärtslaufen von innen.
- Der Flüchtende läuft zum Feld mit **größtem Abstand**, nicht zum nächsten Feld mit Abstand 7, und nicht an Wänden entlang im Kreis.
- Die Aufgabe nach langer Flucht (60 Ticks) bleibt als Sicherung.

## Schadensarten und Zustände
Die Art ergibt sich aus der **Kopfform** der Waffe (die Teile sind schon da), nicht aus einer Tabelle pro Waffe:
- **Wucht** (Hammer, Keule, Streitkolben, Blockköpfe): Chance auf **Betäubung** (kurz kein Handeln). Die Chance wächst mit dem Anteil der Wucht am Gegnerleben und schrumpft mit Rüstung.
- **Schnitt** (Klingen, Beile, Dolch auf Breitklinge): Chance auf **Blutung** (Schaden über einige Ticks, stapelt zweimal; Blutende erholen Ausdauer langsamer).
- **Stich** (Speer, Pfeile, Bolzen, Spitzköpfe): Chance auf **Verlangsamung** (Bein getroffen, 70 % Tempo für einige Ticks). Das ist die Antwort auf Flüchtende.
- **Magie**: Feuer = Brand (Schaden über Zeit), Eis = Verlangsamung, Blitz = kurze Betäubung.
- Rüstung senkt die Chance (prozentual wie beim Schaden), Zustände sind als Symbol über dem Kopf sichtbar ("alles sichtbar"). Jede Art kann eigene Widerstände haben (Untote bluten nicht, Golems sind betäubungsfest), das bleibt als Passiv-Material.

## Reihenfolge (Vorschlag)
1. Ausdauer (nur Kosten, Erholung, weiche Kopplung) und Flucht als Sprint samt Einschließen.
2. Zustände Wucht / Schnitt / Stich, Anzeige über dem Kopf.
3. Magie-Zustände, Widerstände der Arten, Feinabstimmung mit dem Duell-Test.

## Stand: Stufe 1 ist drin (Ausdauer, Flucht)
- **Ausdauer** (`stamina`, 0 bis 100): Ein Hieb kostet 4 + 7 × Schlagdauer-Faktor (Dolch ≈ 8, Schwert 11, Axt 14, Hammer 17), eine Fähigkeit 12, ein Fluchtschritt 7. Nach einer Handlung 1 Tick Pause (nach einem Fluchtschritt 2), dann +8 pro Tick, mal 0,6 bis 1 je nach Ausgeschlafenheit (`energy`), ×0,6 bei Blutung (kommt mit Stufe 2), ×0,25 auf der Flucht. Unter 30 % läuft das Tempo linear bis auf 60 % herunter (`staminaTempoF` in `statTempo`), bei 0 ist die Kreatur erschöpft (`exhausted`): keine Hiebe, keine Fähigkeiten, bis wieder 15 % da sind.
- **Flucht** (`fleePlan`): Kämpfer rennen (Tempo ×1,3, kostet Ausdauer) zum erreichbaren Feld mit dem größten Abstand zum Verfolger (mindestens 3 Felder mehr als jetzt), legen sich auf diesen Weg für 5 Schritte fest (kein Hin und Her) und kämpfen weiter ("verzweifelt", 8 Ticks), wenn es keinen solchen Weg gibt. Imps behalten die alte Flucht.
- **Zielen im Nahkampf**: Gegen einen Läufer wird auf sein nächstes Feld gezielt, wenn es in Reichweite liegt (Wahrscheinlichkeit nach Stufe und Geschick).
- **Ludus**: Ausgeschlafenheit (`energy`) sinkt mit jedem Kampf (−12) und Training (−15), Schlafen setzt sie auf 100, ein Huhn gibt +10; sie bestimmt, wie schnell die Ausdauer im Kampf zurückkommt.
- Anzeige: Ausdauer als gelber Streifen unter dem Lebensbalken in der Arena-Liste, die blaue Kugel der Ich-Ansicht zeigt jetzt die Ausdauer (grün).
- **Befund aus dem Test** (60 Duelle mit gemischten Arten): Der Krabbenlauf (Flüchtender mit Feind in zwei Feldern Nähe) ist um etwa 30 % seltener geworden; ein schnellerer Flüchtender (Echse, Werwolf) bleibt auch erschöpft schneller als sein Verfolger und wird erst durch die Aufgabe nach 60 Ticks Flucht beendet. Dafür sind die Zustände der Stufe 2 gedacht (Verlangsamung, Blutung).

## Idee: Erschöpfungsschaden (Schlaf) als vierte Schadensart
- Eine Schadensart, die **Ausgeschlafenheit (`energy`)** statt Leben abzieht. Fällt die Ausgeschlafenheit vor dem Leben auf 0, **schläft die Kreatur ein** (bewusstlos, der bestehende Zustand `unconscious`) und stirbt nicht. Nur der Verlust von Leben kann töten; Erschöpfung ist immer der gewaltlose Weg. Das passt zu Gefangenen, Bekehren, Ludus ("wer ohnmächtig wird, überlebt") und "Losing is fun".
- **Umrechnung**: Der Schaden zählt anteilig (Schaden ÷ Maximalleben × 100), damit ein Hieb gleich schwer wiegt, egal ob er Leben oder Schlaf kostet. Das gilt für Kreaturen mit Ausgeschlafenheit; Untote, Golems und Geister sind immun (sie schlafen nicht).
- **Quellen**: Schlafstaub (Fee, Dryade), Klagen der Banshee, Kuss der Succubus, ein Schlafzauber, vielleicht Knüppel und Netz als gewaltlose Waffen. Gegenmittel: ein Huhn gibt etwas zurück, das Bett alles.
- **Wirkung auf Ausdauer**: Weil die Ausgeschlafenheit die Erholung der Ausdauer steuert, wird ein müdes Opfer auch schneller erschöpft: Schlafschaden hat eine eingebaute Verstärkung, aber nur bis zum Einschlafen.
- Anzeige: zweiter, blauer Balken unter dem Lebensbalken und ein "Z" über dem Kopf kurz vor dem Einschlafen.
