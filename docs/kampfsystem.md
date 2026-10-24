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
