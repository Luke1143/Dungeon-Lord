# Dungeon Lord — Gesamtdesign

Dieses Dokument beschreibt das Spiel von Anfang bis Ende. Es ist die Karte, auf der alles andere liegt.

- **Dieses Dokument:** Was ist das Spiel, wie läuft eine Partie, was gehört in welche Ausbaustufe.
- **[godhand.md](godhand.md):** Das Regelwerk *innerhalb eines Levels* (Interact, Kreaturen, Räume, Kampf). Wenn es um Levelmechanik geht, gilt godhand.md.
- **[dev-notes.md](dev-notes.md):** Was zuletzt gebaut wurde.

Status: **Entwurf.** Mit *(Vorschlag)* markierte Stellen sind Annahmen und noch nicht entschieden. Offene Fragen stehen am Ende.

---

## 1. Vision

**Dungeon Keeper trifft Roguelike, Tamagotchi und Dwarf Fortress light.**

Das Original *Dungeon Keeper* ist die Hauptinspiration: Man ist der Böse, gräbt sich durch Fels, baut Räume, hält eine Horde bei Laune und wehrt Helden ab. Dazu kommen

- ein **Roguelike-Rahmen**: eine Kampagne aus etwa 10 Leveln, die von Level zu Level härter wird, mit einem Finale und danach einem New Game Plus,
- **Tamagotchi-Kreaturen**: Sie haben Bedürfnisse und Launen und handeln nach eigenem Antrieb, statt Befehle wie RTS-Einheiten abzuarbeiten,
- eine **Dwarf-Fortress-artige Kampagnenkarte** (Overworld), auf der jedes Level einen Ort mit eigenem Charakter hat.

## 2. Grundsätze

| Grundsatz | Bedeutung |
|---|---|
| **Simpel und sauber** | Wenige Regeln, die überall gelten. Neuer Inhalt ist ein neuer Tabelleneintrag, kein neuer Sonderfall im Code. |
| **Plakativ böse** | Die Ziele sind immer eindeutig böse: ein Dorf untergraben, einen Thronsaal erobern, ein Artefakt stehlen. |
| **Der Spieler kann alles, was die KI kann** | Die KI benutzt dieselben Systeme wie der Spieler. Steuert der Spieler einen Imp per Zauber, funktioniert die Steuerung genau so wie bei der KI. Gibt es einen Unterschied, ist es ein Designfehler. |
| **Götter-Simulation** | Die Welt ist eine Simulation, in der alles **konsistenten, nachvollziehbaren Regeln** folgt. Der Spieler ist ein Gott, der in diese Welt eingreift. Was für ein Ding gilt, gilt für alle Dinge dieser Art. |
| **Offen und frei** | Das Projekt bleibt so offen wie möglich. Alles ist selbst gemacht oder frei lizenziert, damit es ohne rechtliche Hürden veröffentlicht werden kann. |
| **Diegetisch** | Was passiert, passiert sichtbar in der Welt. Keine Zahlen aus dem Nichts. |
| **Eskalation** | Jedes Level ist schwerer als das vorige. Der Spieler wird stärker, aber die Welt schneller. |

(Die ausführliche Philosophie des Levels steht in godhand.md, Teil 1.)

## 3. Kernschleife

```
Neues Spiel
   └─ Kampagnenkarte wird erzeugt (Overworld mit verzweigenden Wegen)
        └─ Spieler bahnt sich seinen Weg: pro Zug ein Ort, der angegriffen wird
             └─ Level wird prozedural erzeugt (Ortstyp bestimmt Aussehen und Regeln)
                  ├─ Primärziel: das feindliche Portal erobern (immer)
                  ├─ Nebenziele: je nach Ort (z. B. Thronsaal erobern, Artefakt stehlen)
                  └─ Niederlage: der eigene Thronsaal fällt → der Run ist vorbei (Permadeath)
             └─ Sieg → Belohnung (Artefakt, Zauber, Dungeon Lord wird stärker)
             └─ Schwierigkeit steigt mit jedem Zug
        └─ ... bis zum Endziel: die ultimative Hauptstadt des Guten erobern
             └─ Finale: der Boss der Welt — besiegen oder unterwerfen (bekehren, korrumpieren)
   └─ New Game Plus: neue, härtere Welt;
      der Dungeon Lord bleibt, samt Upgrades und Artefakten
      (und das beliebig oft: NG+ 1, NG+ 50, NG+ 900 ...)
```

Eine Partie ist damit ein **Run** (eine Kampagne). Wer verliert, beginnt von vorn. Der Dungeon Lord ist der rote Faden, der von Level zu Level und von Welt zu Welt mitgeht.

## 4. Die Overworld

Eine Kampagnenkarte im Stil von Dwarf Fortress, erzeugt beim Start eines neuen Spiels.

- **Endziel:** Immer die ultimative Hauptstadt des Guten zu erobern.
- **Der Weg ist frei gewählt:** Der Spieler bahnt sich seinen Weg selbst. Der Weg **verzweigt sich**, jede Abzweigung ist eine Entscheidung.
- **Jeder Zug ein Level:** Jeder Schritt auf der Karte ist ein Angriff auf einen Ort. Die **Schwierigkeit steigt mit jedem Zug**, egal welchen Weg man nimmt.
- **Orte haben einen Typ**, und der Typ prägt das Level (siehe unten).
- Jeder Ort hat **Eigenschaften und Quirks**, **eigene Spielmechaniken** und einen **Nebenauftrag** zusätzlich zum Primärziel.
- *(Vorschlag)* Ein Run hat etwa 10 Züge. Die Karte enthält mehr Orte, als man besucht.

### Beispiele

| Ort | Charakter | Beispiel-Nebenziel |
|---|---|---|
| **Flusswasser** | Startdorf. Eine Karte mit vielen Flüssen. Leichter Einstieg. | Das gesamte Dorf untergraben |
| **Zwergberg** | Siedlung des Zwergenkönigs. Viele Tunnel und Strukturen. | Gegnerischen Thronsaal erobern und ein mächtiges Artefakt stehlen; oder die Schatzkammer des Zwergenkönigs plündern |
| **Elfenwald** | Auf der Spielkarte von Wurzeln durchzogen. | Oberon unterwerfen und den Weltenbaum entwurzeln |
| **... (weitere Orte)** | Je Ortstyp ein eigener Flavour. | Noch zu entwerfen |
| **Hauptstadt des Guten** | Endziel der Kampagne. Dort wartet der Boss der Welt. | Den Boss besiegen oder unterwerfen |

### Bosse

Der Boss ist je nach **Biom und Weltgenerierung verschieden**. Es sind **Karikaturen mythischer Helden** wie Artus, Beowulf oder Herkules. Die Bosse **eskalieren** mit dem Level, und in späteren Welten (New Game Plus) können es **Götter aus Mythen** sein. „Gutfried“ war nur ein Platzhalter.

Für „Offen und frei“ gilt: Es werden nur Figuren aus Mythen und Sagen verwendet, nie eine geschützte Film- oder Spielfassung.

### Prozedurale Level mit wiederkehrenden Elementen

Alle Level werden **vollständig prozedural** erzeugt. Der **Ortstyp** auf der Overworld bestimmt, welche wiederkehrenden Elemente in der Spielkarte vorkommen:

- Ein **Elfenwald** ist auf der Spielkarte von **Wurzeln** durchzogen.
- Eine **Zwergenzivilisation** enthält **Zwergenbauwerke** (Tunnel, Hallen, Strukturen).
- Ein **Flussdorf** hat viele **Flüsse**.

Zwei Elfenwälder sehen also verschieden aus, fühlen sich aber gleich an. Neue Ortstypen sollen als neuer Tabelleneintrag aus Bausteinen entstehen, nicht als neuer Code.

### Belohnungen

Ein Artefakt kann eine **Waffe**, eine **Rüstung** oder ein **Zauber** sein und geht **direkt an den Dungeon Lord**. Der Dungeon Lord wird mit jedem gewonnenen Level etwas stärker.

## 5. Das Level

Jedes Level ist ein Dungeon-Keeper-artiger Spielabschnitt. Sein **Kern ist Aufbau und Verteidigung des Dungeons**: graben, bauen, Kreaturen versorgen, Helden abwehren.

**Primärziel — immer gleich:** das feindliche Portal erobern.
**Nebenziele — je Ort verschieden:** siehe Overworld, z. B. „plündere die Schatzkammer des Zwergenkönigs“. Sie belohnen den Spieler, zum Beispiel mit einem Artefakt.
**Niederlage:** der eigene Thronsaal geht verloren. Das beendet den ganzen Run (Permadeath).

**Zwei Spielweisen, ein Dungeon Lord:**

| Dungeon Lord … | Spielgefühl |
|---|---|
| sitzt auf dem Thron | Management-RTS: graben, bauen, Kreaturen und Räume verwalten |
| steht auf (per Besessenheit) | Top-down-Action wie *Overlord*: der Lord kämpft und erledigt persönlich, was nur er kann |

Den Dungeon Lord selbst zu steuern setzt den Zauber **Besessenheit** voraus, genau wie bei jeder anderen Kreatur. Der Lord ist von Haus aus **etwas stärker** als eine Kreatur derselben Stufe.

Die Regeln der Räume, Kreaturen, Bedürfnisse und des Kampfes stehen in **godhand.md**.

### Dauer und Zeitdruck

Normalerweise gibt es **kein Zeitlimit**. Zum Sieg samt aller Nebenziele braucht man etwa **20 bis 40 Minuten**, mit **starker Variation** je nach Ort. Manche Orte bringen **Zeitdruck als Nebenziel** mit: Auf einer Karte wie „Atlantis“ lautet es zum Beispiel „gewinne, bevor das Dungeon überflutet“.

### Gefallene Helden

Gefallene Helden kann der Spieler **bekehren oder korrumpieren**, statt sie nur zu besiegen. Das nutzt das Gefängnis (godhand.md, Teil 15: „bekehren“). Auch Bosse lassen sich so unterwerfen *(Annahme)*.

### Darstellung

- **Sprites statt Emojis** für Figuren, Kacheln und Beute. Einfache Pixel-Sprites, selbst gezeichnet.
- **Maßstab:** Figuren sind 16×16 Pixel, Kacheln 32×32, beides mit gleich großen Pixeln. Eine Figur ist halb so breit wie eine Kachel, also passen **bis zu vier Figuren auf ein Feld**. Das passt zu den Regeln der Kachelbelegung (godhand.md, Teil 19: jede weitere Kreatur bremst).
- **Paletten statt neuer Zeichnungen:** Fraktionen und Perks färben dasselbe Sprite um (Eis-Imp, Gift-Imp, Nekromant).
- **Emojis bleiben** für Gedanken und Stimmung in Sprechblasen (godhand.md, Teil 17 und 26).
- **Keine sichtbaren Hände.** Kreaturen haben keine Hände und keine Arme im Bild, Hände sind unsichtbar (wie in RimWorld). Was eine Kreatur trägt oder hält, zeigt sich über das Objekt selbst (Sack auf dem Rücken, Werkzeug, Waffe), nicht über Arme. Bei Bedarf darf ein Objekt eine abstrakte Hand mitbringen, die zum Objekt gehört und nicht zur Kreatur. *(Entscheidung nach Prototypen in `prototypes/imp-parts.html`.)*
- **Kreaturen aus Teilen** *(Vorschlag, erprobt)*: Kopf, Körper, Beine und Tragegut sind getrennte kleine Sprites, die der Code zusammensetzt. Animiert wird durch Verschieben um ganze Pixel, nie durch Drehen. Der Sack erscheint nur, wenn die Kreatur etwas trägt (diegetisch). Paletten färben dieselben Teile um.
- **Augen zeigen die Seite** *(entschieden)*: Alles auf der Seite des Spielers oder neutral hat schwarze Augen mit weißen Pupillen, nur die Heldenseite hat weiße Augen mit schwarzen Pupillen. So erkennt man auch aus der Ferne, wer Freund und wer Feind ist.
- **Ausrüstung verändert die Silhouette mit der Stufe** *(Vorschlag, erprobt in `prototypes/equipment.html`)*: Rüstung ist eine Regel auf den Pixeln der Kreatur (Helm färbt den Kopf, Panzer den Rumpf, Schienen die Beine), kein Sprite pro Kreatur. Niedrige Stufen färben nur um, höhere Stufen dürfen die Silhouette verändern (Schulterplatten, Gesichtsschutz, Helmkamm), über Ankerpunkte der Kreatur (Kopf, Schulter, Rücken, Griff). Bestien tragen keine Rüstung und keine Werkzeuge. Material (Leder, Bronze, Eisen, Stahl) ist eine Palette.
- **Der Imp** *(Stand der Prototypen)*: Profilansicht, gebückt, großer Kopf mit zwei großen schwarzen Augen mit weißen Pupillen und sonst keinem Gesichtsdetail, rot-brauner Grundton, Sack auf dem Rücken beim Tragen von Gold oder Erz. 16×16, flach, ohne Kontur.
- **3D-Optik** *(Vorschlag, erprobt in `prototypes/3d-spike.html`)*: Gelände als Blöcke, Kreaturen als Billboard-Sprites. Der Imp schaut je nach Bewegungsrichtung auf dem Bildschirm nach links oder rechts.
- *Hinweis:* Teil 26 („Drei Sichtplätze“, „Stapel“) beschreibt die Darstellung noch mit Emojis auf 32 Pixeln und muss für Sprites angepasst werden.
- Ein Muster mit Imp, Dungeon Lord, Held und Warlock liegt als `sprite-muster.html` vor.

## 6. Der Dungeon Lord, Artefakte und die Vault

- Der Dungeon Lord ist der **Avatar des Spielers**.
- Er wächst mit **jedem gewonnenen Level** (siehe „Fortschritt im Run“).
- **Artefakte** (Waffen, Rüstungen, Zauber) stecken in seinem Besitz.
- Im **New Game Plus** nimmt er alles mit: Stufe, Upgrades und Artefakte. Die Welt dagegen wird neu und schwerer erzeugt.
- **Permadeath:** Fällt der Thronsaal, geht **alles** verloren. Es gibt **keine Meta-Progression** im Sinne von dauerhaften Freischaltungen.

### Artefakte und ihre Fundorte

Artefakte kommen auf zwei Wegen ins Spiel:

- als **Belohnung für Nebenziele** (z. B. die Schatzkammer des Zwergenkönigs plündern),
- **versteckt auf der Karte**: etwa in einem Labyrinth oder am Rand der Welt, wie im Original *Dungeon Keeper*.

Viele Artefakte wirken auf die Kreaturen statt auf den Lord. Beispiele:

- eine **Kreatur mit ins nächste Level nehmen**,
- **alle Kreaturen steigen eine Stufe auf**,
- eine **Kreatur vom Feind stehlen**,
- **etwas in die Vault transferieren** (siehe unten).

### Seltenheit

Artefakte haben fünf Seltenheitsstufen: **common, uncommon, rare, epic, legendary**. Das Artefakt „In die Vault transferieren“ ist **legendary**, zusammen mit etwa **einem Dutzend** weiterer legendärer Artefakte.

### Alles ist aufhebbar

Der **Aufheben-Zauber** (godhand.md, Teil 9) soll auf **alles** in der Welt wirken: Kreatur, Stein, Artefakt, Waffe, Huhn, Imp. Dafür gibt es keine Ausnahmeliste, nur eine Regel. *Hinweis: Teil 9 nennt bisher nur Kreaturen und Ausrüstung als Ziele. Er muss auf alle Objekte erweitert werden.*

### Die Vault

Die Vault ist ein Lager **außerhalb einer Kampagne**. Was in der Vault liegt, überlebt Permadeath. Sie ist die einzige Ausnahme von „alles geht verloren“ und **kein Fortschrittsbaum**: Man bringt nur mit, was man selbst gefunden und eingelagert hat.

**So kommt etwas hinein (Regel statt Menü):**

1. Der Spieler findet ein Artefakt **„In die Vault transferieren“**.
2. **Imps tragen es in die Bibliothek.**
3. Von dort kann der Spieler es **benutzen** und danach **ein Objekt auswählen**.
4. Das gewählte Objekt **verschwindet aus der Welt und landet in der Vault**, egal ob Kreatur, Rüstung, Huhn oder Imp.

**So kommt etwas heraus:** Beim **Start eines neuen Runs** wählt der Spieler, was er aus der Stase holt, und eine **neue Welt wird erzeugt**. Ausrüstung geht an den Dungeon Lord. Kreaturen, zum Beispiel ein Drache auf Stufe 10, erscheinen am Eingang des ersten Levels. Danach geht es los.

**Wie viel man mitnehmen darf:** So viel, wie der Spieler **tragen und benutzen kann**. Es gibt dafür keine eigene Vault-Regel, sondern die normalen Regeln der Welt. Hat der Dungeon Lord Slots für Kopf, Brust, Beine und Waffen- bzw. Armplätze, bringt es nichts, fünf Brustrüstungen mitzunehmen. Es sei denn, eine Spielmechanik macht daraus etwas (siehe unten).

**Was die Vault ist:** eine **Stase**. Das Objekt ist aus der Welt entfernt, wie in einem Pokéball oder bei Gordon Freeman: *wake me when you need me*. Es altert und lebt dort nicht weiter.

**Aufbau:** Die Vault ist eine **einfache Liste, nach Typ sortiert**.

**Keine Obergrenze beim Einlagern.** Das Einlagern ist selten (es braucht ein legendäres Artefakt), und der Gewinn beim Mitnehmen ist hoch. Die **Seltenheit** ist die Begrenzung, nicht eine Platzgrenze.

Wichtig für den Entwurf: Die Vault darf nicht zur versteckten Meta-Progression werden. Sie bleibt aktiver Eingriff des Spielers in eine Simulation, nicht ein Konto, das von selbst wächst.

### Gebäude, die man in der Welt findet *(Platzhalter)*

Neben den Räumen, die der Spieler selbst baut, soll es **Gebäude geben, die man in der Welt findet**. Die „mythische Zwergenschmelze“ ist dafür vorerst nur ein Platzhalter. Welche Gebäude es gibt und was sie tun, ist noch offen. Eine mögliche Idee für eines davon: überzählige Gegenstände hineinwerfen und etwas Neues herausbekommen.

### Der Tod des Dungeon Lords

Wird der Dungeon Lord im Kampf **besiegt**, ist er nicht gleich tot: Er wird **in den Thronsaal teleportiert** und liegt dort **bewusstlos**. Bewusstlos hat er einen **neuen Lebenspool**. Ist dieser Pool **ganz aufgebraucht**, ist der Lord **verloren** und der **Run vorbei**.

Der bewusstlose Lord ist verwundbar, denn der Thronsaal ist das Ziel der Helden.

*Hinweis:* godhand.md (Teil 25) sagt für Kreaturen „Massiver Überschussschaden tötet immer“. Für den Lord gilt stattdessen der eigene Lebenspool. Ob das für alle Kreaturen gelten soll, ist offen.

### Fortschritt im Run: Skillpunkte und Perks

Der Kernablauf eines Levels bleibt **immer derselbe**: graben, bauen, versorgen, verteidigen, Portal erobern. Was sich ändert, sind die **Zahlen** und die **Regeln**, die der Spieler sammelt. So wird der Dungeon-Keeper-Ablauf zu einem **inkrementellen Roguelike**.

**Skillpunkte (harte Werte).** Jedes gewonnene Level gibt dem Dungeon Lord **einen Skillpunkt**. Der Spieler setzt ihn selbst ein, entweder

- **in den Dungeon Lord** (Leben, Stärke, Mana usw.) oder
- **in den Dungeon** (z. B. Rüstung +1 für die Kreaturen).

*Offen:* Wie der Dungeon-Anteil aufgeteilt ist, ist noch nicht entschieden (siehe offene Fragen).

**Perks (veränderte Regeln).** Wie in jedem guten Roguelike verändern Perks die Regeln und verschieben nicht nur Zahlen. Beispiele:

- Vampire haben 10 % mehr Lebensraub, fressen aber doppelt so viel.
- Skelette können in der Bibliothek arbeiten, hassen aber Warlocks.

**Artefakte sind Perks, wie Überraschungstüten.** Ein Artefakt kann alles Mögliche sein: ein Perk, ein Kreatureneffekt (siehe oben) oder eine Waffe. Gute Perks haben meist einen Preis, damit eine echte Entscheidung entsteht.

*Hinweis zur Umsetzung:* Ein Perk soll sich als **Eigenschaft oder Ausnahme einer bestehenden Regel** ausdrücken lassen (godhand.md, Teil 18 und 20), nicht als eigener Code. Dann kostet ein neuer Perk nur einen Tabelleneintrag.

### Unendliche Skalierung

Manche Spielelemente sollen sich **ohne Obergrenze** skalieren lassen, sodass ein guter Run bis **NG+ 900 und weiter** gehen kann. Das heißt:

- **Schwierigkeit** wächst als Formel pro Zug und läuft über das New Game Plus **weiter** (der Zug-Zähler wird nicht zurückgesetzt).
- Mitgenommene Stärke (Lord, Kreaturen, Artefakte) muss **ebenfalls ohne feste Obergrenze** wachsen können, sonst ist der Run irgendwann nicht mehr zu gewinnen.
- Im Code gibt es für die skalierenden Werte **keine festen Obergrenzen** und keine Tabellen, die irgendwann enden. Werte kommen aus Formeln. Zahlen müssen sehr groß werden dürfen, ohne dass etwas überläuft oder falsch angezeigt wird.

**Das Kernproblem *(Hinweis, Lösung offen)*:** Ein Skillpunkt pro Level wächst **linear**. Eine Schwierigkeit, die jede Runde um einen festen Prozentsatz steigt, wächst **exponentiell** und läuft davon. Ein „+1 Rüstung“ ist bei kleinen Werten viel und bei großen kaum etwas. Außerdem rechnet das Kampfsystem Verteidigung heute in **Prozent** (z. B. Käfer 35 %), und Prozent hören bei 100 auf.

**Gewählte Lösung:** Die Punkte 1, 2 und 4. Punkt 3 ist nicht gewählt, bleibt aber für einzelne Perks möglich.

1. **Gegner wachsen langsam in den Werten** (etwa polynomial) und **qualitativ schneller**: mehr Gegner, neue Typen, neue Regeln.
2. **Skillpunkte wirken relativ**, zum Beispiel „+5 % pro Punkt“ auf den aktuellen Wert, statt fest „+1“.
3. **Perks stapeln sich als Multiplikatoren**, damit die Spielerstärke geometrisch wachsen kann.
4. **Verteidigung ohne Deckel**, etwa Schaden × K ÷ (K + Rüstung). Dann bringt jede Rüstung etwas, und nichts erreicht 100 %.

## 7. Umfang in Stufen *(Vorschlag)*

Ziel: Jede Stufe ist **in sich spielbar**. Man kann nach jeder Stufe aufhören und hat ein Spiel.

| Stufe | Inhalt | Fertig, wenn … |
|---|---|---|
| **1 — Ein gutes Level** | Graben, Räume, Kreaturen mit Bedürfnissen, Heldenwellen, Sieg und Niederlage, Kampf, Besessenheit. Balancing. | ein einzelnes Level von Anfang bis Ende Spaß macht |
| **2 — Kampagnen-Skelett** | Startbildschirm, Overworld mit verzweigendem Weg und wenigen Orten, zwei Ortstypen mit je eigenen Kartenbausteinen, Schwierigkeit pro Zug, Permadeath, Dungeon Lord hat Stufe und einen Artefakt-Slot | man einen kurzen Run mit 3 Zügen spielen kann und bei einer Niederlage von vorn beginnt |
| **3 — Volle Kampagne** | ~10 Züge, mehrere Ortstypen mit Quirks und Nebenzielen, Eskalation, Hauptstadt und Boss als Finale | man eine Kampagne durchspielen kann |
| **4 — New Game Plus** | neue, härtere Welt nach einem gewonnenen Run, Übernahme des Dungeon Lords, Schwierigkeit und Stärke ohne Obergrenze | ein zweiter Durchgang sich anders anfühlt und NG+ 20 noch funktioniert |
| **5 — Artefakte und Vault** | Artefakte mit Seltenheitsstufen und Kreatureneffekten, Vault außerhalb der Kampagne, Gebäude in der Welt | man eine Kreatur über Permadeath hinweg mitnehmen kann |
| **Später** | Dungeon Lord als steuerbare Figur mit Kampf, Tutorial, Ton, Module statt einer Datei | — |

## 8. Stand heute

Nach Durchsicht von `index.html` und `dev-notes.md`:

| Bereich | Stand |
|---|---|
| Weltkarte | 48×32, Kamera mit WASD, Nebel des Krieges, Goldadern, natürliche Höhlen |
| Graben, Imps | Ja (Markieren, Imps arbeiten, Verstärken, Erobern) |
| Räume | Thronsaal, Lagerraum, Schlafsaal, Bibliothek, Hühnerfarm, Arena; Weltportal fest |
| Kreaturen | Imp, Fliege, Käfer, Höllenhund, Warlock |
| Helden | Barbar, Dieb, Zauberer, Ritter; kommen in Wellen, sobald der Weg vom Portal zum Thron frei ist |
| Sieg / Niederlage | Ja (Portal erobert / Thronsaal verloren), Endbildschirm mit „Neues Spiel“ |
| Besessenheit | Ja (Zauber) |
| Speichern | Ja (localStorage) |
| Balancing | **Nein.** Wellenstärke gegen Verteidigung und Thronschaden sind ungetestet |
| Dungeon Lord als Figur | Nein (bisher nur der Thronsaal) |
| Sprache im Code | Gemischt: Bezeichner meist englisch, einzelne Kommentare deutsch. Angleichung steht aus. |
| Overworld, Level-Auswahl, Artefakte, Fortschritt zwischen Leveln, Finale, New Game Plus | Nein |

## 9. Entschieden

| Frage | Entscheidung |
|---|---|
| Overworld-Navigation | Endziel ist immer die Hauptstadt des Guten. Der Spieler bahnt sich den Weg selbst, es gibt verzweigende Wege, die Schwierigkeit steigt mit jedem Zug. |
| Niederlage | Permadeath: ein verlorener Thronsaal beendet den Run, und **alles geht verloren**. |
| Darstellung | Pixel-Sprites (Figur 16×16, Kachel 32×32, bis zu vier Figuren pro Feld), Emojis nur in Sprechblasen. |
| Hände | Kreaturen haben keine sichtbaren Hände oder Arme. Getragenes zeigt sich über das Objekt. |
| Imp-Grundgestalt | Gebückter Sackträger mit großem Kopf, großen schwarzen Augen mit weißen Pupillen, rot-braun, ohne Ohren, Hörner, Schwanz und Mund. |
| Augen | Spielerseite und Neutrale: schwarze Augen, weiße Pupillen. Heldenseite: weiße Augen, schwarze Pupillen. |
| Pixelgröße | Bei 16×16 bleiben wir. Ein Wechsel auf 24×24 (Kachel 48×48) wurde erwogen und verworfen. |
| Offenheit | Das Projekt soll so offen wie möglich sein. Nur selbst Gemachtes oder frei Lizenziertes, keine fremden Inhalte ohne klare Lizenz. |
| Meta-Progression | Keine dauerhaften Freischaltungen. |
| Vault | Kommt. Ein Artefakt „In die Vault transferieren“ bringt ein gewähltes Objekt in Stase. Keine Obergrenze, die Seltenheit begrenzt. |
| Vault, Herausholen | Beim Start eines neuen Runs wählt der Spieler, was er mitnimmt, so viel er tragen und benutzen kann (Slots, Traglast). Ausrüstung geht an den Lord, Kreaturen erscheinen am Eingang. Eine neue Welt wird erzeugt. |
| Simulation | Alles folgt konsistenten Regeln. Der Aufheben-Zauber wirkt auf alles. |
| Artefakt-Fundorte | Belohnung für Nebenziele und versteckt auf der Karte (z. B. Labyrinth, Rand der Welt). |
| Kernablauf | Ist in jedem Level derselbe. Fortschritt kommt durch Skillpunkte (harte Werte) und Perks (Regeln). |
| Skillpunkte | Jedes gewonnene Level gibt einen. Einsetzbar im Dungeon Lord (Leben, Stärke, Mana usw.) oder im Dungeon. |
| Artefakte | Sind Perks, wie Überraschungstüten, meist mit Preis. |
| Skalierungslösung | Gegner wachsen langsam in den Werten und schneller in der Vielfalt, Skillpunkte wirken relativ („+X % pro Punkt“), Verteidigung hat keinen Deckel (Schaden × K ÷ (K + Rüstung)). |
| Tod des Lords | Im Kampf besiegt, wird er in den Thronsaal teleportiert und liegt bewusstlos. Bewusstlos hat er einen neuen Lebenspool. Ist der aufgebraucht, ist er verloren und der Run vorbei. |
| Lord steuern | Setzt den Zauber Besessenheit voraus, wie bei jeder Kreatur. Der Lord ist nativ etwas stärker als eine Kreatur gleicher Stufe. |
| Levellänge | Normal ohne Zeitlimit, mit allen Nebenzielen etwa 20 bis 40 Minuten, starke Variation je Ort. Manche Orte haben Zeitdruck als Nebenziel (z. B. Atlantis: gewinne, bevor das Dungeon überflutet). |
| Bosse | Je Biom und Weltgenerierung verschieden: Karikaturen mythischer Helden (Artus, Beowulf, Herkules), später Götter aus Mythen. Eskalierend. „Gutfried“ war ein Platzhalter. |
| Gefallene Helden | Können bekehrt oder korrumpiert statt nur besiegt werden. |
| Seltenheit | common, uncommon, rare, epic, legendary. „In die Vault transferieren“ ist legendary, zusammen mit etwa einem Dutzend weiterer legendärer Artefakte. |
| Vault, Aufbau | Einfache Liste, nach Typ sortiert. |
| Gebäude in der Welt | Platzhalter für Gebäude, die der Spieler in der Welt findet (die „mythische Zwergenschmelze“ ist ein Platzhalter). |
| Sprache im Code | Code, Syntax und Kommentare einheitlich auf Englisch. |
| Skalierung | Manche Elemente skalieren ohne Obergrenze, ein Run soll bis NG+ 900 und weiter möglich sein. |
| Level-Erzeugung | Vollständig prozedural mit wiederkehrenden Elementen, die der Ortstyp bestimmt (Elfenwald: Wurzeln, Zwergenzivilisation: Zwergenbauwerke). |

## 10. Offene Fragen

Ohne Antwort gilt der Vorschlag in Klammern.

1. **Skillpunkte im Dungeon:** Wie werden Punkte aufgeteilt: nur zwischen Dungeon Lord und Dungeon, oder wachsen beide immer? Wie fein: allgemein (alle Kreaturen) oder sehr granular („ich skille nur auf Skelette“)? *(Noch kein Vorschlag: Du überlegst weiter.)*
2. **Finale:** Ist das Finale ein einzelnes Level mit dem Boss in der Hauptstadt? *(Vorschlag: ja.)*
3. **Biome und Bosse:** Welche Biome und welche Bosse gibt es? *(Vorschlag: Für Stufe 2 reichen zwei Biome mit je einem Boss.)*
4. **Bekehren und Korrumpieren:** Welche Regeln gelten (Dauer, Chance, Kosten), und was ist das Ergebnis? *(Vorschlag: Arbeit im Gefängnis, das Ergebnis ist eine Kreatur des Spielers mit eigener Palette und einem Perk „korrumpiert“.)*
5. **Lebenspool der Bewusstlosen:** Gilt der eigene Lebenspool im bewusstlosen Zustand nur für den Lord oder für alle Kreaturen? *(Vorschlag: für alle, damit die Regel überall gleich ist. godhand.md, Teil 25, würde dann angepasst.)*
