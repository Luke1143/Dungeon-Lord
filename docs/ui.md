# Oberfläche der Level-Ansicht (nach Dungeon Keeper)

Die Welt füllt das ganze Fenster, links liegt das Menü (`ui-panel.js` und das Panel in `index.html`), daneben fallen die Meldungen als Symbole ein. Kein Herunterscrollen: Jede Seite des Menüs passt in den festen Rahmen.

- **Menü** von oben: Minimap, Gold/Erz/Eisen/Imps, fünf Reiter, die Kachelfläche, darunter ein Streifen mit dem Erklärtext (Hinweis zur Kachel unter der Maus, Modus, Untersuchung).
- **Reiter:** ❔ Übersicht (Welle, Lohn, Nebenziel, Graben/Untersuchen, Einstellungen, Debug), 🏰 Gebäude, ✨ Zauber, 🪤 Fallen und Türen (noch nicht vorhanden, gesperrt), 🐲 Kreaturen (eine Kachel je Art mit Porträt und Zahl; Klick springt reihum zu einer Kreatur).
- **Kacheln** (`.tile`): Symbol, Name, Preis; sie sind die alten Knöpfe (`.roomBtn`, `#summonBtn` …) mit neuem Aussehen, die Spiellogik hat sich nicht geändert. Die Hinweistexte stehen in `UI_HINTS`. Die Symbole sind vorerst Emoji; eigene Pixelsymbole kommen später.
- **Meldungen** (`#eventStack`): Jede Meldung des Ereignisprotokolls ist ein Symbol, das von oben auf den Stapel fällt. Die Form verrät die Art (Stufenaufstieg, Tod, Gefahr, Lager voll, Bau, Graben, Gold, Idee). Ein Klick springt zum Ort und zeigt den Text im Erklärstreifen; die Meldung verschwindet danach (oder nach etwa 1500 Ticks).
- **Raus:** die Legende der Materialien (Erz, Eisen, Bronze, Stahl), die Ereignisliste, die Tastenleiste am unteren Rand (steht jetzt in der Übersicht).
- **Arena und Ludus-Kampf** nutzen dasselbe Menü ohne Reiter: oben die Teams und Zauber, darunter der Zauberreiter.

## Bildeffekt in 3D
Über das 3D-Bild der Level-Ansicht legt `view3d.js` einen kleinen Nachbearbeitungsschritt: Das Bild wird zuerst in eine Textur gerendert, dann weichzeichnet ein Shader es leicht (die harten Pixelkanten der Sprites verschmelzen mit der Welt), helle Stellen leuchten etwas nach, die Ecken werden dunkler. Stufen: aus, weich, dunstig (Knopf 🌫 oder Taste F, wird gemerkt). Die Stufe „weich" ist voreingestellt.

Stufen 2 und 3 ahmen einen Röhrenmonitor nach (Taste F / Knopf 🌫 📺): Das Bild wird klein gerendert, die Farbe verschmiert seitlich wie bei Composite-Video (Farbe breiter als Helligkeit), Scanlines lassen dunkle Lücken zwischen den Zeilen, eine feine Maske aus Rot-Grün-Blau-Streifen liegt darüber, das Glas wölbt sich leicht; Stufe 3 reduziert zusätzlich die Farben mit geordnetem Dithering.

## Eigene Pixelsymbole
`icons.js` zeichnet alle Symbole des Menüs selbst (12 × 12, aus Rechtecken, Kreisen und Linien, mit dunklem Rand): Gebäude, Zauber, Reiter und die Meldungen. Die Brücke in den Arenen hat jetzt die Bohlen der Kampagnenbrücke. Der Bildeffekt liegt in `postfx.js` und gilt auch für den Ludus-Hof.
