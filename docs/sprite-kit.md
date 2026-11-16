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

## Noch nicht im Baukasten
Imp, Dämonenbrut, Warlock, Skelett, Dungeon Lord (eigene Zeichnungen) und die Tiere und Geister (Vierbeiner, Vögel, Geist, Irrlicht, Fee; sie haben in `sprites.js` eigene Grundformen). Offen aus der Durchsicht: Julkatze, Echse, Geist gegen Banshee.

## Tiefe
Jede Kreatur (nicht nur die aus dem Baukasten) bekommt beim Zeichnen eine dunkle Kopie, die einen Pixel nach hinten versetzt ist (`spriteCanvas` in `index.html`, Stärke `SPRITE_DEPTH`). So wirkt die Figur wie ein dicker Ausschnitt. Möbel, Irrlicht, Geist und Banshee bleiben flach (`SPRITE_FLAT`).
