# Waffen: Bausystem aus Teilen (Entwurf, R&D)

Ziel: Eine Waffe ist die Summe ihrer Teile. Größe, Länge, Breite und Balance der Teile bestimmen Aussehen und Werte zugleich, und auch lächerliche Waffen sind spielbar (ein Goblin mit riesigem Schwert, ein Riese mit Dolch). Das Aussehen *ist* der Wert: Wer die Waffe sieht, sieht ihre Stärken (Prüffrage aus godhand.md Teil 20). Der Prototyp der Formeln liegt in `tools/weapon-model-proto.js` (`node tools/weapon-model-proto.js`).

## Was andere Spiele und die Physik lehren
- **Mount & Blade Bannerlord** trennt Länge (= Reichweite), Gewicht und Gewichtsverteilung. Zu schwere Waffen treffen, bevor sie ihr Tempo erreichen, und sind kraftlos; das Schwungtempo hängt an der Verteilung um den Drehpunkt, nicht nur am Gewicht ([Developer Blog](https://gamebanshee.com/k43ha), [Wiki](https://mountandblade.fandom.com/wiki/Melee_weapons)).
- **Echte Schwerter**: Handling folgt dem Trägheitsmoment um die Hand, nicht nur dem Schwerpunkt; ein Knauf gleicht nur dann aus, wenn er zur Klinge passt ([MyArmoury](https://myarmoury.com/talk/viewtopic.php?p=163480), [Uni Kiel](https://www.tf.uni-kiel.de/matwis/amat/iss/kap_c/advanced/ac_3_2.html), [r/wma](https://lr.us.psf.lt/r/wma/comments/1etss4w/pommel_weight)). Genau dein "Knauf balanciert die Klinge".
- **Noita** macht Wände aus Teilen mit klar getrennten Werten (Zauberverzögerung, Nachladezeit, Streuung); die Absurdität entsteht aus Kombinationen, nicht aus Sondertabellen ([Wiki](https://noita.wiki.gg/wiki/Wand_Generation)).
- **Veloren / Sands of Aura**: Der Kopf legt Schadenscharakter und Rolle fest, Griff und Schaft Tempo und Skalierung, ein Knauf ist optional ([Veloren](https://hackmd.io/@veloren/H1UwcDpi_), [Sands of Aura](https://sandsofaura.wiki.gg/wiki/Head)).

## Das Modell
Alle Maße sind **Sprite-Pixel** und werden gezeichnet, wie sie sind. So folgt das Aussehen den Werten ohne Zusatzregel.

**Teile (je ein Paar stetiger Werte, nicht mehr nur Varianten):**
- **Kopf**: Länge `hl`, Breite `hw`, Material (Dichte). Die Form legt den *Modus* fest: Klinge (schneidet, fegt), Spitze (stößt, Linie), Wucht (schmettert).
- **Schaft**: Länge `sl`, Material (Holz leicht, Knochen mittel, Eisen schwer).
- **Knauf**: Größe `pm` (0 = keiner), Gegengewicht.

**Abgeleitet:**
- **Masse** M = Kopf (Fläche × Dichte) + Schaft + Knauf.
- **Trägheitsmoment** I um die Hand (Massen × Abstand²). Die Hand sitzt am Schaftende; ein Knauf hinter der Hand senkt I.
- **Schwerpunkt** b = Abstand des Schwerpunkts von der Hand geteilt durch die Gesamtlänge (0 = an der Hand, 1 = an der Spitze).
- **Reichweite in Felder** = 1 + ⌊ Gesamtlänge × Größe des Trägers ÷ 12 ⌋. Dieselbe Waffe reicht für einen Riesen weiter als für einen Goblin.
- **Breite des Schlags** (Felder neben dem Ziel): aus `hw` × Größe des Trägers: schmal = 1, breit = 3, riesig = 5.
- **Schlagdauer** T ∝ (I / I_ref)^0,33 ÷ (Stärke / S_ref)^0,4. Exponenten unter ½, damit der Wahnsinn begrenzt bleibt (Bannerlord: zu schwer = kraftlos).
- **Schaden** D ∝ (I / I_ref)^0,38 × (Stärke / S_ref)^0,45. Schaden wächst mit der Waffe *und* dem Träger, deshalb zählt ein starker Träger mehr als ein großer Dolch.
- **Trefferchance je Feld** wächst mit der Schlagfläche (Breite × Kopflänge), gedeckelt zwischen 20 % und 97 %. Kleine Waffen schlagen oft zu, treffen aber seltener; riesige treffen fast immer, sind aber lahm und leicht zu meiden.

**Balance** (der "gute Schwertschmied"): Jede Kopfform hat einen Zielwert für b (Klinge etwa 0,30, Axt 0,52, Speer 0,42, Wucht 0,62). Nahe am Ziel gibt eine *Balance-Güte* bis 1: −15 % Schlagdauer, +10 % Schaden, +8 % Trefferchance. Weit weg: keine Boni, aber kein Strafmalus. Eine **Memewaffe** (Riesenkopf, winziger Knauf) bekommt dafür einen Wucht-Bonus auf den Schaden, der ihr Tempo nicht ausgleicht: Das Ergebnis liegt knapp unter der ausgewogenen Waffe, aber mit Ein-Schlag-Potenzial. Das ist der Handel: Balance = rundum am besten, Extreme = Spezialisten.

**Hände** ergeben sich aus der Masse relativ zum Träger. Was ein Träger nur mit zwei Händen schwingt, nimmt den Schild-Platz (heutiger Platz 'lh') mit.

**Tile-Muster** (aus Länge und Breite statt aus Tabellen): Reichweite n = n Felder in der Blickrichtung. Breite 3 = die beiden Nachbarfelder des vordersten Feldes (Fegen). Modus Spitze = nur die Linie, kein Fegen. Modus Wucht = Zielfeld plus ein Stoß-Feld dahinter. Jedes Feld würfelt einzeln, nur Feinde werden getroffen (kein Eigenbeschuss).

## Fernkampf und angeborene Waffen (entschieden)
- **Bogen**: Pfeil = Kopf (Schaden, Trefferfläche), Bogen = Schaft (Länge und Zuggewicht: Reichweite und Stärke des Trägers, der ihn spannen kann), Sehne = Knauf (Spannung: eine straffe Sehne gibt Wucht und Reichweite, kostet aber Zeit zum Spannen; Balance-Wert wie beim Knauf). Armbrust, Stäbe und Wurfspeere folgen derselben Zuordnung (Stab: Kristall = Kopf, Stab = Schaft, Fokus = Knauf). Fernkampf zielt weiter auf das Ziel, nicht auf ein Feld.
- **Angeborene Waffen** (Horn, Klauen, Chitin) sind **keine Teile**, sondern abstrakte Werte der Art: ein Einhorn hat etwas mehr Grundschaden, der Käfer etwas mehr Rüstung. Sie wandern in die Artentabelle (`SPECIES`), nicht in das Waffensystem.

## Beispiele (Prototyp, noch nicht kalibriert)
Mensch (Stärke 10, Größe 1): Dolch T≈1,5 Ticks, Schaden 5, Treffer 45 %; Schwert 2,9 / 12 / 64 %; Speer 3,7 / 16 / 49 % mit Reichweite 2; Axt 4,0 / 17 / 70 %; Hammer 4,2 / 19 / 74 %. Das "Schwert von Guts" (Kopf 20×5 Pixel): Mensch 12 Ticks / Schaden 61 / Reichweite 2, breit; Goblin (Stärke 4, Größe 0,7) 18 Ticks / 40 / Reichweite 2, ohne Fegen, Riese 8,6 Ticks / 90 / Reichweite 3, breit. Riese mit Dolch: 1 Tick, Schaden 8, Treffer 45 %: eine lächerliche Salve.
Die Spanne im Schaden pro Sekunde ist noch etwa 3:1. Abgeglichen wird mit dem vorhandenen Duell-Test (Ork gegen Ork, je 24 Läufe pro Paarung, `ArenaLab`): Ziel für Standardformen höchstens 55:45.

## Aussehen und Schmiede
- Kopf, Schaft und Knauf werden mit ihren echten Pixelmaßen gezeichnet. Der Sprite verträgt eine Waffe von etwa 10 Pixeln gut; größere dürfen den Körper überlappen und bleiben auf drei Größenstufen gedeckelt, damit nichts aus dem 16-Pixel-Raster fällt.
- Schilde und Rüstung folgen derselben Regel: Größe ≈ Verteidigung (ein sehr gepanzerter Buckler ist groß).
- Die Schmiede wählt Teile nach Vorliebe des Schmieds und seiner Geschicklichkeit (Zielbalance trifft nur ein geschickter Schmied). Güte (krude bis episch) hebt die *Effizienz* (kleinere Strafen, höhere Balance-Boni), nicht die Größe.

## Stufenplan
1. Teile mit stetigen Maßen und Formeln im Code (`weaponStats(parts, wielder)`), Anzeige im Inspektor und im Ludus-Tab; Schlagdauer und Reichweite aus den Formeln statt aus der Familientabelle.
2. Tile-Muster mit Würfeln je Feld (ohne Vorwarnung), Kalibrierung gegen den Duell-Test.
3. Vorwarnung (leuchtende Felder) und Festlegen des Feldes während des Ausholens.
4. Schmiede und Spielerführung (Balance-Anzeige), Zufallswaffen mit Gewichtung nach Güte.

## Offen
- Soll die Schlagdauer von Wesen mit Größe 0,7 oder 1,4 mehr vom Träger oder von der Waffe abhängen?
- Zuggewicht und Stärke: ab welcher Stärke spannt ein Träger einen schweren Bogen noch (sonst Schlagdauer ×2)?

## Stand der Umsetzung
- **Stufe 1 ist drin** (`weapons.js`, `partsOf`, `swingFactorOf`, `reachOf`, `itemDescription`): Köpfe haben echte Pixelmaße, Schäfte echte Längen, der Knauf hat die Größen 0, 1, 2. Aus Masse, Trägheitsmoment und Schwerpunkt folgen Schadensfaktor, Schlagdauer und Balance; die Reichweite in Feldern folgt aus der Gesamtlänge mal Größe des Trägers (Speer +3,5 Pixel für den Stoß). Alle Werte sind *relativ zur typischen Waffe der Familie*, deshalb behalten die Familientabellen ihre Bedeutung (Axt schwer, Dolch schnell).
- Seltene Extreme (Hünenklinge, Riesenbeil, Felsklotz, Riesenkeule, Hellebardenspitze, extrem lange Schäfte, großer Knauf) fallen mit 6 % (normal), 12 % (fein) und 20 % (episch) pro Teil; Schmiede wählen nur gewöhnliche Teile.
- Der Träger geht in die Schlagdauer ein ((8 / Stärke)^0,4, begrenzt auf 0,6 bis 1,8); der Schaden bleibt wie bisher additiv zur Grundstärke.
- Duell-Test (Ork gegen Ork, 14 Waffen je Familie, 5 Läufe): alle Familien liegen zwischen 45 % und 58 % Siegen.
- Noch offen: Fernkampf nach Pfeil/Bogen/Sehne, Hände aus der Masse, Tile-Muster und Würfeln je Feld (Stufe 2).
