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

## Optionen und Bildstimmung
- **Optionen** (`options.js`, Zahnrad in der Leiste, Knopf im Hauptmenü, Taste O): Ansicht 3D/2D, Stimmungslicht, Schatten unter Kreaturen, Tiefe der Figuren, Bildeffekt. Eine neue Einstellung ist eine neue Zeile in `OPTION_ROWS`. Gespeichert im Browser (`dungeon-lord-options`, dazu wie bisher `dungeon-lord-3d` und `dungeon-lord-post`).
- **3D ist die Standardansicht**; 2D bleibt in den Optionen und auf Taste V.
- **Stimmungslicht** (`View3D.setMood`): das gleichmäßige Tageslicht ist gedämpft und kühler, Fackeln und Feuer leuchten stärker und weiter, der Bildrand dunkelt ab (`#vignette`). Fackeln hängen jetzt an jeder Wand eines Raums, nicht nur an verstärkten Wänden; Thronsaal und Lava leuchten selbst.
- **Schatten**: ein weicher Fleck unter jeder Kreatur (`View3D.setShadows`); Kreaturen sind in 3D etwas größer.
- **Fels und Wände** (3D): Fels ohne offene Seite ist oben eine dunkle Masse; die Oberkante einer Wand über offenem Boden fängt Licht (heller Rand); die Wandfläche wird zum Boden hin dunkler. Verstärkte Wände tragen eine Abdeckung aus versetzten Steinplatten statt der flachen blaugrauen Fläche (`rim`, `mass`, `face`, `cap` in `tileInfo3d` und der Textur in `view3d.js`).
- **Gedankenblasen**: Was eine Kreatur denkt (Kampf, Hunger, Schlaf, Laune, Freizeit ...), zeigt eine eigene Pixel-Blase (`THOUGHT_SHAPES`, `thoughtCanvas` in `icons.js`, gezeichnet von `drawThought`) statt eines Emojis; was noch keine Zeichnung hat, bleibt Emoji. In 3D schwebt die Blase über dem Kopf, bei großen Kreaturen höher.
- **Wasser und Lava** (3D): je eine lebende Textur, die einige Male pro Sekunde neu gezeichnet wird (Wellen und Glanzlichter auf dem Wasser, fließende Glut in der Lava). Jede Kachel zeigt ein eigenes Viertel davon, damit sich das Muster nicht kachelweise wiederholt. Lava ist unbeleuchtet (sie glüht selbst) und wirft Licht auf ihre Umgebung (`liquidTex`, `drawLiquid` in `view3d.js`).
- **Arena** (2D und 3D, nur Aussehen, die Regeln bleiben gleich): der Bedrock um den Kampfplatz ist die Arenamauer (Sandsteinziegel mit roter Borte, Steinkappe, Fackeln). Hinter jedem Lager hängen bis zu drei Banner in den Teamfarben (rot mit Hörnern für die dunkle Seite, blau mit Krone für die Helden). Frei stehende Blöcke im Hof sind niedrige Steinblöcke, in der Säulenhalle bleiben es hohe Säulen (`arenaDressWalls` in `arena.js`, `arenaBannerItems` in `index.html`, `lowGeo` und `MODELS.wallBanner0/1` in `view3d.js`).
- **Weltkarte**: die Namen der Orte überlappen nicht mehr. Jede Beschriftung nimmt den ersten freien Platz (unter dem Ort, rechts, links, darüber); ein „Unbekannt“, das keinen Platz findet, entfällt (`owDrawLabels` in `index.html`).
- **Kleine Effekte**: Splitter und Staub beim Graben springen von der getroffenen Wandseite (in 3D vorher in der Wand versteckt), Funken beim Schmieden und am Amboss der Schmelze, Glut am Schmelzofen. Alle erscheinen im Moment des Schlags, wie der Ton (`strikeDelay`).
