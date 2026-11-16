# Kreaturen-Baukasten (`sprite-kit.js`)

Alle Zweibeiner (Helden, Bosse, Horde: 32 Arten) werden aus **drei Teilen** zusammengesetzt, jedes in eigener Farbe: **Kopf, Körper, Beine**. Dazu kommen kleine Zusätze. Eine neue Kreatur ist eine neue Zeile in `KIT_LOOKS` (ein Rezept), kein neuer Zeichen-Code. Eine neue Form ist ein neuer Eintrag in einer Teile-Tabelle und steht danach jedem Rezept offen.

## Teile
- **Köpfe** (`HEADS`): `human`, `fine` (schmal: Elfen, Vampire), `ork`, `imp` (rund, breiter Mund), `brute` (schwere Stirn), `skull`, `wolf`, `block` (Stein), `helm` (geschlossener Helm).
- **Aufsätze** (`TOPS`): `hair`, `long`, `mohawk`, `tonsure`, `hood`, `cowl`, `wizhat`, `crown`, `horns`, `hornsHair`, `ears`, `bigears`, `wolfears`, `leaves`, `plume`, `spikes`, `halo`, `bonecrown`. Was über den Kopf hinausragt, schiebt den Kopf von selbst tiefer in die Schultern.
- **Körper** (`BODIES`): `tunic`, `slim`, `broad`, `bulk` (Riesen, Trolle), `small`, `stout` (Zwerge), `stone`, `ribs`, und bodenlange `robe`, `gown` (brauchen keine Beine).
- **Beine** (`LEGS`): `boots`, `stumps`, `short`, `thin`, `pillars`, `paws`, `bones`.
- **Hinten** (`BACKS`): `cape`, `tail`, `wolftail`, `batwings`, `wings`, `pack`, `quiver`.
- **Zeichen vorn** (`MARKS`): `beard`, `fangs`, `collar`, `rot`, `moss`, `pelt`, `sash`.

## Rezept
`L(Name, Kopf, Aufsatz, Körper, Beine, Farben, mehr)`. Farben: `skin`, `hair`, `body`, `legs`, `trim` (Gürtel, Saum), `extra` (Hörner, Federbusch, Helmschlitz), `back` (Umhang, Flügel, Schwanz), `feet`. Je Farbe werden heller und dunkler Ton von selbst abgeleitet. `good:true` gibt weiße Augen mit schwarzer Pupille und erzeugt die bekehrte Fassung (`_ally`, dunkler, Augen der Horde). `wear` legt einem Boss feste Rüstung an.

Beispiel: `goblin:L('Goblin','imp','bigears','small','short',{ skin:'#8aa83a', body:'#7a6a3a', legs:'#5a4a2a', trim:'#5a3a24' })`.

## Wie es zusammengesetzt wird
Die Figur wird vom Boden nach oben gestapelt (Beine, Körper, Kopf), dadurch ergeben sich die Größen von selbst: Goblin und Zwerg sind klein, Troll, Riese und Golem breit und massig. Laufbewegung (Wippen, Schritte, Nicken) ist für alle gleich. Die Pixel sind markiert (Kopf, Körper, Beine), deshalb passen die Ausrüstungsregeln aus `sprites.js` (Helm, Brust, Beinschienen, Waffe, Schild) auf jede Kombination.

## Tiere (derselbe Gedanke für Vierbeiner)
Rezept: `Q(Name, Rumpf, Kopf, Beine, Schwanz, Farben, mehr)` in `BEAST_LOOKS`.
- **Rumpf** (`BEAST_BODIES`): `barrel`, `lean`, `low`, `big`; `box` im Rezept verschiebt oder streckt ihn.
- **Kopf** (`BEAST_HEADS`): `cat`, `fox`, `horse`, `lizard`, `dragon`, `eagle`.
- **Beine** (`BEAST_LEGS`): `thin`, `thick`, `paws`, `splay` (gespreizt, Echsen), `talons` (vorn Vogelklauen).
- **Schwanz** (`BEAST_TAILS`): `stub`, `drag`, `up`, `bushy` (mit `tails:3` drei Stück), `hair`, `spade`, `lion`.
- **Extras** (`BEAST_EXTRAS`): `ridge`, `featherwings`, `batwings`, `horn`, `cap`, `belly`, `stripes`.
- Farben: `body`, `head`, `legs`, `snout`, `accent`, `wing`, `horn`.

Damit gebaut: Echse, Drache, Einhorn, Kitsune, Julkatze, Greif. Ein neues Tier ist eine Zeile, zum Beispiel ein Wolf: `Q('Wolf','lean','fox','paws','bushy',{ body:'#6a6a72' })`.

## Noch nicht im Baukasten
Imp, Dämonenbrut, Warlock, Skelett, Dungeon Lord (eigene Zeichnungen), Höllenhund, Käfer und Fliege (eigene Zeichnungen, sie waren schon gut) sowie Phönix, Geist, Banshee, Irrlicht und Fee (eigene Grundformen in `sprites.js`). Für Käfer und Spinnen fehlt dem Tier-Baukasten noch ein Panzer-Rumpf und Beine in Sechser- und Achtergruppen.

## Platz: jedes Teil hat ein eigenes Feld
Die Figur selbst (Kopf, Körper, Beine) steht in einem Feld von 16 × 16 Pixeln. Was darüber hinausreicht (Flügel, Schwänze, Umhänge, Hüte, Hörner), wird nicht mehr abgeschnitten und nicht mehr in die Figur gequetscht: Das Bild wächst dann auf 32 × 32, das Feld der Figur liegt unten in der Mitte. `spriteCanvas` liefert beide Größen; `spriteK(cv)` sagt, wie viele Felder das Bild breit ist, `spriteCell(cv)` gibt nur das Feld (für Symbole und Porträts). Alle Zeichenstellen (2D, 3D, Arena-Leiste, Ludus-Halle) stellen die Figur mit ihrem Feld auf die Kachel, das Übrige ragt hinaus.

## Tiefe
Jede Kreatur (nicht nur die aus dem Baukasten) bekommt beim Zeichnen eine dunkle Kopie, die einen Pixel nach hinten versetzt ist (`spriteCanvas` in `index.html`, Stärke `SPRITE_DEPTH`). So wirkt die Figur wie ein dicker Ausschnitt. Möbel, Irrlicht, Geist und Banshee bleiben flach (`SPRITE_FLAT`).
