# Spezies, Klassen, Werte, Fähigkeiten — Entwurf

**Stand:** Entwurf vom 26.11.2026, zur gemeinsamen Entscheidung. Nichts davon ist im Spiel umgesetzt außer dem, was unter „Bestand“ steht. Danach wird `docs/godhand.md` (Teil 4, 16, 22) angepasst.

## Leitlinien (Nutzer, 26.11.2026)

1. Jede **Spezies** bekommt eine angeborene **aktive** und eine angeborene **passive** Fähigkeit.
2. Jede Kreatur bekommt ein **Grundaussehen aus ihrer DNA** (Gene), dazu **Aussehen durch ihre Werte**.
3. Jede Kreatur bekommt **zufällige Startwerte in einer Spanne ihrer Spezies**: Orks wenig Intelligenz, dafür stark; Menschen ausgeglichen usw.
4. Jede Kreatur kann einen von **mehreren Pfaden** einschlagen; nicht jede kann alles (Ork: Krieger oder Schamane).
5. Der eingeschlagene Pfad ist ihre **Klasse**. Die Klasse schaltet **klassenspezifische Fähigkeiten** frei (wie eine RPG-Klasse): Mensch-Paladin = aktive und passive Fähigkeit der Spezies Mensch, dazu Fähigkeitsplätze und Fähigkeiten der Klasse Paladin.
6. **Hierarchisch:** Ork → Krieger oder Schamane; Ork-Krieger → Berserker oder Stürmer; Ork-Schamane → Priester oder Unheilsprophet (Namen nicht final).
7. Eine Klasse hat **kein eigenes Aussehen**: das Aussehen hängt diegetisch davon ab, was die Kreatur trägt. Die Klasse bestimmt nur, was sie bevorzugt (ein Warlock holt sich Robe und Zauberhut aus dem Lager, ein Krieger die Plattenrüstung, ein Jäger Leder).
8. Vermutung des Nutzers zur Klassenwahl: eine Mischung aus **Werten und Stufe**. Ein Goblin, der in der Bibliothek arbeitet, steigert seine Intelligenz und schlägt den Magiepfad ein; einer in der Schmiede steigert Stärke und schlägt den Stärkepfad ein.

---

## Bestand: die Werte heute

| Wert | Woher | Wächst mit der Stufe |
|---|---|---|
| **Leben** | Art × Zufall 0,9–1,1 | +20 % je Stufe |
| **Stärke** | Art × Zufall 0,9–1,1 | +20 % je Stufe |
| **Verteidigung** (%) | Art × Zufall, Ausrüstung | nein |
| **Geschick** | Art × Zufall | langsam, je Art (`dexGrowth`) |
| **Tempo** (Bewegung und Aktionsrate) | Art × Zufall, Ausrüstung | nein |
| **Glück** | einmal gewürfelt, Deckel 25 % | nein |
| **Ausdauer** | fest (Sprint, Flucht, Gaben) | nein |
| **Loyalität**, **Zufriedenheit** | Art, Lohn, Arbeit, Räume | nein |
| **Trefferchance** | 60 % + 4,5 % je Stufe | ja |
| **Stufe**, **Erfahrung** | jede gelungene Arbeit +1, Treffer +1, Training +1, Tötung +3, Duellsieg +5; Kosten verdoppeln sich je Stufe, keine Obergrenze | — |

Dazu Flags der Art: Typ (Bestie, Horde, Untot, Held, Boss), `intellectual` (kann Geistesarbeit), `needsFood`, `avoidsWater`, `canFight`, `usesEquipment`, Inventarplätze, Kampfhaltung (angriffslustig, standhaft, Kiter), Arbeitsvorlieben (liebt, duldet, hasst), Waffen- und Ausrüstungsvorlieben.

**Es gibt keinen Wert für Intelligenz oder Magie.** Die Figuren haben vier Merkmale, die ihr Aussehen formen (`klug`: Kopf, `stark`: Schultern, `flink`: Beine, `wild`: Hauer und Brauen); im Spiel kommt davon nur Stärke und Geschick aus echten Werten.

## Vorschlag: vier Grundwerte

| Grundwert | Wirkt auf | Wächst durch (Arbeit, die die Kreatur tut) | Aussehen |
|---|---|---|---|
| **Stärke** | Schaden, Tragen, Leben (teilweise) | Schmiede, Schmelze, Graben, Trainingspuppe, Nahkampf | breitere Schultern, größere Hände |
| **Geschick** | Treffen, Ausweichen, Fernkampf, Tempo (wenig) | Fernkampf, Fallen, Diebstahl, Kundschaften, Werkbank | längere, schlankere Beine |
| **Intelligenz** | Zauberschaden, Forschung, Wissensplätze | Bibliothek (forschen, schreiben, lesen) | größerer Kopf, kleinerer Kiefer |
| **Wille** | Heilung, Flüche, Widerstand, Moral | Tempel (beten, opfern), Friedhof, Gefängnis (bekehren) | finsterere Brauen, längere Hauer (heute „Wildheit“) |

- **Startwerte:** je Spezies eine Spanne je Grundwert, gewürfelt bei der Geburt (Ork: Stärke hoch, Intelligenz niedrig; Mensch: alles mittel; Goblin: Geschick hoch, Stärke niedrig; Dunkelelf: Geschick und Intelligenz hoch …).
- **Wachstum durch Tun:** Erfahrung bleibt wie heute (jede gelungene Arbeit), aber sie ist nach Quelle markiert. Beim Stufenaufstieg wachsen die Grundwerte im Verhältnis der Erfahrung, die aus ihren Quellen kam. Deterministisch und im Inspektor nachlesbar („Stärke +2 aus der Schmiede, Intelligenz +1 aus der Bibliothek“).
- **Leben, Verteidigung, Tempo, Glück, Ausdauer** bleiben abgeleitete Werte wie heute (Art, Stufe, Ausrüstung). Die Zahlen des Balancings bleiben damit nutzbar.
- **Aussehen durch Werte** hängt dann wirklich an den vier Grundwerten.

## Vorschlag: wie eine Kreatur ihre Klasse wählt

**Werte und Stufe, wie vorgeschlagen.** Die Klasse wird an festen Stufen gewählt, an denen heute schon die Fähigkeiten kommen:

| Stufe | Was geschieht |
|---|---|
| 1–4 | ohne Klasse: nur Spezies (aktive und passive Fähigkeit der Spezies) |
| **5** | **erste Klasse**: unter den Pfaden ihrer Spezies der, dessen Leitwert am höchsten ist (Ork: Krieger ← Stärke, Schamane ← Wille) |
| **10** | **zweite Klasse**: unter den Zweigen ihrer Klasse der, dessen Leitwert am höchsten ist (Ork-Krieger: Berserker ← Stärke, Stürmer ← Geschick) |
| später | evtl. dritte Stufe oder ein **Aufstieg**, der die Spezies ändert (Warlock → Lich mit dem Necronomicon) |

- Der Spieler lenkt die Klasse **über die Arbeit** (die Räume sind die Vorarbeiter): wer in die Bibliothek geht, wird klüger und eher Magier. Besitzergreifung funktioniert genauso (der Spieler arbeitet selbst in der Bibliothek).
- Gleichstand: der Wert, der zuletzt gewachsen ist.
- Ob der Spieler zusätzlich bestimmen kann (z. B. ein Ritual am Altar), ist offen.

## Vorschlag: Hierarchie und Überlappung

- **Klassen sind gemeinsame Bausteine** (Krieger, Magier, Priester, Schurke, Jäger und ihre Zweige). Jede Spezies hat eine **Auswahl** davon als Pfade. So können Mensch und Ork **dieselbe Klasse** erreichen (Mensch: Akolyth → Priester; Ork: Schamane → Priester), aber nicht jede Spezies jede Klasse.
- Die Spezies färbt die Klasse über ihre eigene aktive und passive Fähigkeit und ihre Werte. Ein Ork-Priester und ein Mensch-Priester teilen die Klassenfähigkeiten, nicht die Spezies-Fähigkeiten.
- Ein Name kann je Spezies anders heißen (Ork „Schamane“ = Klasse Priester, Stufe 1), wenn wir das wollen.
- **Bestien** haben keine Klassen (oder höchstens einen Pfad); **Bosse** und **Legendäre** sind feste Einzelstücke.
- Die heutigen Arten, die eigentlich Klassen sind (Warlock, Zauberer, Dunkler Priester, Dunkler Ritter, Ritter, Paladin, Dieb, Bogenschütze, Mönch, Barbar, Handwerker), werden **Voreinstellungen**: Mensch mit Klasse X und Stufe Y. Die Spiegelkreaturen (Zauberer ↔ Warlock, Barbar ↔ Ork) sind dann dieselbe Klasse auf zwei Seiten.

---

## Bestand: alle Kreaturen

Spalte **Vorschlag**: was die Art nach der Trennung wäre. *Kursiv* = geplant, nicht im Spiel.

### Die dunkle Seite

| Typ | Art | Vorschlag |
|---|---|---|
| Bestie | Imp | Bestie (Arbeiter) |
| Bestie | Fliege | Bestie |
| Bestie | Käfer | Bestie |
| Bestie | Höllenhund | Bestie |
| Bestie | Echse | Bestie |
| Bestie | Spinne | Bestie |
| Bestie | Dämonenbrut | Bestie |
| Horde | Goblin | **Spezies** |
| Horde | Ork | **Spezies** |
| Horde | Troll | **Spezies** |
| Horde | Dunkelelf | **Spezies** |
| Horde | Warlock | Mensch + Klasse (Magier-Pfad) |
| Horde | Dunkler Priester | Mensch + Klasse (Priester-Pfad) |
| Horde | Dunkler Ritter | Mensch + Klasse (Krieger-Pfad, Stufe 2) |
| Horde | Succubus | **Spezies** (Dämonin) |
| Horde | Dämon | **Spezies** |
| Untot | Skelett | **Spezies** (untot) |
| Untot | Banshee | **Spezies** |
| Untot | Ghul | **Spezies** |
| Untot | Zombie | **Spezies** |
| Untot | Geist | **Spezies** |
| Untot | Vampir | **Spezies** |
| Untot | Werwolf | **Spezies** |
| Legendär | Lich | Aufstieg (Warlock auf Stufe 10 + Necronomicon), Spezies untot |
| Legendär | Drache | Einzelstück |
| Legendär | *Gefallener Held* | *Aufstieg eines Helden?* |

### Die gute Seite

| Typ | Art | Vorschlag |
|---|---|---|
| Fabelwesen | Yule | Wichtel + Klasse Dieb? oder Bestie |
| Fabelwesen | Fee | **Spezies** oder Bestie |
| Fabelwesen | Greif | Bestie |
| Fabelwesen | Einhorn | Bestie |
| Fabelwesen | Golem | Bestie (Konstrukt) |
| Fabelwesen | Kitsune | Bestie oder Spezies |
| Legion | Zauberer | Mensch + Klasse (Magier-Pfad) |
| Legion | Zwerg | **Spezies** |
| Legion | Barbar | Mensch + Klasse (Krieger-Pfad) |
| Legion | Paladin | Mensch + Klasse (Priester- oder Krieger-Pfad) |
| Legion | Bogenschütze | Mensch + Klasse (Jäger-Pfad) |
| Legion | Mönch | Mensch + Klasse |
| Legion | Ritter | Mensch + Klasse (Krieger-Pfad) |
| Legion | Elf(enkrieger) | **Spezies** Elf + Klasse |
| Legion | Dieb | Mensch + Klasse (Schurken-Pfad) |
| Legion | Riese | **Spezies** |
| Legion | Handwerker | Mensch ohne Klasse (Arbeiter) |
| Himmlische | Irrlicht | Bestie |
| Himmlische | Engel | **Spezies** |
| Himmlische | Phönix | Bestie |
| Himmlische | Dryade | **Spezies** |
| Himmlische | Schutzengel | Engel + Klasse? |
| Legendär | *Lord des Landes*, *Held*, *Avatar* | *Einzelstücke* |

### Bosse

Zwergenkönig, Artus, Herakles, Oberon, Dungeon Lord: Einzelstücke mit eigener Spezies (Zwerg, Mensch, Mensch, Elf, offen) und eigenen Fähigkeiten.

### Spezies danach (Vorschlag)

**Mensch, Ork, Goblin, Troll, Dunkelelf, Elf, Zwerg, Riese, Dämon, Succubus, Skelett, Ghul, Zombie, Vampir, Werwolf, Banshee, Geist, Engel, Dryade, Fee, Wichtel.** Für jede legen wir gemeinsam fest: Pfade (Stufe 5), Zweige (Stufe 10), aktive und passive Fähigkeit, Spannen der vier Grundwerte.

---

## Bestand: alle Fähigkeiten

### Aktive (im Spiel, `creatures.js`)

| Fähigkeit | Ziel | Wirkung | Heute angeboren bei (Stufe 5 / 10) |
|---|---|---|---|
| Eile | selbst | Tempo ×1,6 kurz | Imp, Fliege, Höllenhund, Echse, Goblin, Dieb, Mönch, Yule |
| Teleport | Kachel | Sprung auf eigenes Gebiet | Imp, Dunkelelf, Geist, Zauberer |
| Rundumhieb | Fläche 1 | trifft alle Angrenzenden | Käfer, Ork, Troll, Dunkler Ritter, Skelett, Zombie, Drache, Barbar, Ritter, Mönch, Riese, Golem, Greif |
| Ausfallschritt | Kreatur 3 | heranspringen und zuschlagen | Echse, Spinne, Goblin, Dunkelelf, Ghul, Vampir, Werwolf, Dieb, Bogenschütze, Yule |
| Sturzflug | Kreatur 7 | herabstürzen und zuschlagen | Greif |
| Feuerball | Kachel 5 | Schaden im Umkreis | Warlock, Dämon, Lich, Zauberer, Bogenschütze, Phönix |
| Heilung | Verbündeter 3 | +25 % Leben | Dunkler Priester, Paladin, Elf, Dryade, Fee, Einhorn, Engel, Schutzengel |
| Fluch | Gegner 4 | schwächt zwei Gegner | Warlock, Dunkler Priester, Succubus, Banshee, Geist, Kitsune |
| Lähmen | Fläche 5 | Gegner erstarren | Spinne, Banshee, Irrlicht |
| Verzaubern | Gegner 6 | ein Held kämpft kurz für die Dunkelheit | Succubus, Vampir, Kitsune |
| Beschwören | selbst | zwei Skelette | Lich |
| Wutschrei | selbst | schlägt fester zu | Dämonenbrut, Ork, Dunkler Ritter, Werwolf, Barbar, Ritter |
| Panzerhaltung | selbst | Verteidigung kurz hoch | Käfer, Zwerg, Golem |
| Segen | Fläche 3 | Verteidigung und Leben für Verbündete | Paladin |
| Antreiben | Fläche 5 | Verbündete schneller | Fee, Irrlicht |
| Mauerbruch | Kachel 1 | bricht Wand, Raum oder Brücke | Troll, Zwerg, Riese |
| Dornen | Gegner 4 | Wurzeln halten fest | Elf, Dryade |
| Atem | Fläche 5 | Feuer, doppelter Schlag | Dämon, Drache |
| Richten | Fläche 4 | heiliges Licht, doppelter Schlag | Engel |
| Schwarm | Fläche 6 | zieht Gegner auf sich | Fliege |
| Heulen | Fläche 3 | schwächt Gegner | Höllenhund |
| Selbstzerstörung | Fläche 2 | explodiert, stirbt | Dämonenbrut |
| Verzehren | selbst | frisst eine Leiche, heilt, lernt evtl. | Ghul, Zombie |
| Wecken | Verbündeter 4 | weckt einen Bewusstlosen | Einhorn |
| Stehlen | selbst | stiehlt Gold aus der Schatzkammer | Yule (von Natur aus) |
| Schutz *(passiv)* | — | fängt einmal einen tödlichen Schlag ab | Schutzengel |
| Wiedergeburt *(passiv)* | — | steigt einmal aus der Asche auf | Phönix |

Lernwege: Stufe 5 und 10 (angeboren), Fähigkeitsbuch in der Bibliothek, Verzehren, Beute. Wissensplätze: Bestien 2, Horde 3, Untote 2, Lich und Drache 4, Dungeon Lord 5.

### Passive Eigenheiten (je Art, `SPECIES.passive`)

| Art | Eigenheit |
|---|---|
| Imp | Fluchtinstinkt: weicht Feinden aus |
| Fliege | fliegt: ignoriert Wasser und Gedränge |
| Käfer | Chitinpanzer: hohe Verteidigung, meidet Wasser |
| Höllenhund | nervös: auf fremdem Boden langsamer |
| Echse | liebt feuchte Gänge, frisst Hühner |
| Spinne | jagt Fliegen, lauert im Dunkeln |
| Dämonenbrut | kommt im Rudel, von Lava gerufen |
| Goblin | Schlitzohr: liebt Handwerk, feige im Kampf |
| Ork | Raufbold: liebt die Arena, hasst Schreibkram |
| Troll | regeneriert langsam |
| Dunkelelf | schießt aus dem Schatten |
| Warlock | Gelehrter: forscht lieber als zu kämpfen |
| Dunkler Priester | heilt Verbündete in der Nähe |
| Dunkler Ritter | schwer gepanzert |
| Succubus | verzaubert Helden |
| Dämon | speit Feuer, arbeitet nie |
| Skelett | erhebt sich aus Leichen, fürchtet nichts |
| Ghul | steigt aus Gräbern, schnell und zäh |
| Zombie | steht aus alten Leichen auf, langsam und zäh |
| Banshee | ihr Schrei lähmt |
| Geist | schwer zu treffen, kalte Hand schwächt |
| Vampir | heilt sich an jedem Biss |
| Werwolf | heilt sich langsam |
| Lich | beschwört Skelette |
| Drache | atmet Feuer |
| Barbar | Berserker: kämpft bis zum Ende |
| Dieb | schlängelt sich durch Gedränge |
| Zauberer | Gelehrter: springt Verbündeten bei |
| Elfenkrieger | Waldläufer: schnell und treffsicher |
| Bogenschütze | schießt aus der Ferne |
| Mönch | ein Streich folgt dem anderen |
| Paladin | geweiht: heilt in der Nähe |
| Ritter | Plattenpanzer |
| Zwerg | zäh wie ein Berg |
| Riese | ein Hieb wirft zurück |
| Golem | fast unverwundbar, sehr langsam |
| Dryade | heilt, wirft Dornen |
| Yule | stiehlt Gold |
| Fee | heilt in der Nähe |
| Greif | stürzt sich aus der Ferne herab |
| Einhorn | heilt und weckt |
| Kitsune | verhext Gegner |
| Irrlicht | treibt Verbündete an |
| Engel | heilt und richtet |
| Phönix | steigt aus der Asche auf |
| Schutzengel | rettet einmal vor dem Tod |
| Handwerker | baut für die Gegner, flieht |

Viele dieser Eigenheiten sind heute nur Text (Lockmittel, Vorlieben) und keine Regel. Mit Leitlinie 1 bekommt jede Spezies genau eine passive Fähigkeit als Regel.

---

## Zu entscheiden (gemeinsam, der Reihe nach)

1. Die vier Grundwerte (Stärke, Geschick, Intelligenz, Wille): so, oder andere?
2. Klassenwahl an Stufe 5 und 10 nach dem höchsten Leitwert: so?
3. Welche Arten Spezies werden, welche Klasse, welche Bestie oder Einzelstück (Tabelle oben).
4. Die Klassenbäume: gemeinsame Bausteine (Krieger, Magier, Priester, Schurke, Jäger …) mit Zweigen.
5. Je Spezies: Pfade, aktive und passive Fähigkeit, Spannen der Grundwerte.
6. Je Klasse: Fähigkeiten, Plätze, bevorzugte Ausrüstung und Kleidung.
7. Bestien: ohne Klasse? Bosse: fest?
