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

## Schadensprofile (Entwurf nach Überblick über das Gesamtsystem)
**Heute** (index.html, `resolveAttack`): Schaden = Stärke des Angreifers (Grundstärke × Stufenfaktor + Stärke der Waffe, Fertigkeiten) → Glück verdoppelt oder halbiert → Verteidigung mindert prozentual (`d / (d + K)`, ein einziger Wert aus Art, Rüstung und Schild) → mindestens 1 → Leben sinkt; bei 0 entscheidet der Überschuss zwischen bewusstlos und tot (`knockOutOrKill`). Fähigkeiten und Bosse rufen dasselbe `resolveAttack` auf. Es gibt keine Schadensart, keinen Zustand und keine Wirkung der Größe.

**Neu: jeder Schlag ist ein Vektor aus Schnitt, Stich und Hieb.** Der Gesamtschaden bleibt, was er heute ist (Stärke und Waffe); neu ist, *wie er sich aufteilt* und *wie er verteidigt wird*.
- **Aufteilung**: Der Anteil `conv` des Schadens geht nach dem Profil der Waffe, der Rest ist Hieb (die Faust, der Griff, das Gewicht). `conv` steigt mit der Güte (krude ≈ 0,6, gewöhnlich 0,8, fein 0,9, episch 1,0, mal der Verarbeitung): Ein krudes Schwert ist mehr Keule als Messer. Ohne Waffe gilt das **natürliche Profil der Art**: Faust = Hieb, Krallen = Schnitt, Hörner und Fangzähne = Stich (kleiner Aufschlag auf den Grundschaden, wie das Horn des Einhorns).
- **Profil der Waffe** folgt der **Kopfform** (die Teile sind schon da): Klinge Schnitt 0,7 / Stich 0,3; Dolch Stich 0,55 / Schnitt 0,45; Axt Schnitt 0,7 / Hieb 0,2 / Stich 0,1; Speer Stich 0,8 / Schnitt 0,1 / Hieb 0,1; Morgenstern Hieb 0,6 / Stich 0,4; Hammer und Keule Hieb 1,0. Einzelne Köpfe verschieben das (Breitklinge mehr Schnitt, Stachelkopf mehr Stich, Hakenspitze etwas Schnitt). Magie: Feuer = Schnitt, Eis = Stich, Blitz = Hieb.
- **Verteidigung je Art**: Jede Rüstung gewichtet ihre Verteidigung nach der Schadensart (Mittel über die drei ≈ 1, damit die heutige Balance hält): Plattenrüstung stark gegen Stich (Pfeile, Speere), Kettenrüstung stark gegen Schnitt, Leder und Polster stark gegen Hieb, jede schwach gegen eine andere (Platte gegen Hieb, Kette gegen Stich, Leder gegen Schnitt): ein Dreieck, das auch historisch stimmt. Der Vorschlag des Nutzers (Platte gegen Schnitt, Kette gegen Stich) ist eine Alternative mit derselben Struktur. Schilde: gleichmäßig.
- **Arten**: Jede Art bekommt Faktoren auf den erlittenen Schaden je Art (`resist`): Skelett Schnitt 0,4 / Stich 0,5 / Hieb 1,5; Golem 0,5 / 0,5 / 0,9; Zombie 0,8 / 0,9 / 1,1; Käfer 0,8 / 1,0 / 1,1; Drache 0,7 / 0,8 / 1,0. Kein Faktor = 1.
- **Größe**: kleiner Aufschlag, nicht mehr: Große Kreaturen nehmen etwas mehr Stich (+20 %) und weniger Hieb (−15 %), kleine mehr Hieb (+15 %). Speere gegen Riesen, Hämmer gegen Imps.
- **Zusammen**: `Schaden = Σ über Art: Anteil × Gesamtschaden × (1 − Verteidigung_Art) × Artfaktor × Größenfaktor`, anschließend wie bisher (mindestens 1, Leben, bewusstlos oder tot).

**Hieb enthält die Erschöpfung.** Die Hälfte des Hiebschadens geht als **Müdigkeit** an die Ausgeschlafenheit statt an das Leben. Fällt sie vor dem Leben auf 0, schläft die Kreatur ein (bewusstlos, nie tot), nur Lebensverlust tötet. So werden Fäuste, Keulen und Hämmer die bewusste "Kampfsport"-Wahl (ohnmächtig statt tot), und ein Ludus-Kämpfer mit Keule überlebt öfter. Untote, Golems und Geister sind immun gegen die Müdigkeit.

**Zustände und Wirkung**: Jede Art würfelt mit der Chance `Anteil_Art × Schaden ÷ Maximalleben`, vermindert durch die Verteidigung gegen diese Art: Hieb → **Betäubung** (kurz kein Handeln), Schnitt → **Blutung**, Stich → **Verlangsamung**. **Blutung und Brand sind kein Schaden über Zeit, sondern ein Malus-Wurf bei jeder Handlung** (Schritt, Hieb, Fähigkeit: mit der Stärke der Blutung die Chance, 1 Leben zu verlieren); wer ruht, blutet nicht weiter. Stapel bis 3. Untote bluten nicht, Golems sind betäubungsfest.

**Überlegungen**
- Abwärtskompatibel: Ohne Profile (Imps, Bosse, Fähigkeiten) gilt "alles Hieb mit Faktor 1", die heutige Rechnung bleibt wirksam, bis die Tabellen gefüllt sind.
- Lesbarkeit: Im Inspektor und im Ludus-Reiter steht das Profil als drei farbige Punkte (Schnitt rot, Stich grau, Hieb braun); beim Treffer zeigt die Zahl die Hauptart ("durchschlägt Kette").
- Prüfung: Duell-Test mit allen Waffen gegen alle drei Rüstungen und gegen Skelett, Golem und Käfer: kein Paar darf das Ergebnis zu weit kippen (Ziel 35:65 im ungünstigen Fall).
- Quellen: In *Dark Souls 3* hat jede Rüstung getrennte Werte für Hieb, Schnitt und Stich, schwere Sets sind gegen genau eine Art schwach ([Wiki](https://darksouls.fandom.com/wiki/Smough%27s_Set_(Dark_Souls_III)), [Wiki](https://darksouls.fandom.com/wiki/Fallen_Knight_Set)); in *RimWorld* wird Schaden in scharf, stumpf und Hitze geteilt, getroffene Rüstung wandelt scharf teilweise in stumpf um ([Wiki](https://rimworldwiki.com/wiki/Armor_-_Sharp)). Das entspricht deiner Idee der Umwandlung: ein stumpfes Schwert wird zur Keule.

## Stand: Schadensprofile und Zustände sind drin
- **Vektor**: `attackProfile(c)` (weapons.js) = Anteil der Waffe (Familienprofil, verschoben durch die Kopfform, mal Güte × Verarbeitung, 60 bis 100 %) plus Rest als Hieb; ohne Waffe das natürliche Profil der Art (`NATURAL_PROFILE`, Standard Hieb). **Verteidigung** `defenseVs(c,Art)`: Körper plus Rüstung gewichtet (`ARMOR_MULT`: Leder gut gegen Hieb, Kette gegen Schnitt, Platte gegen Stich, je eine Schwäche), bei Kreaturen ohne eigene Ausrüstungswerte (Helden) gewichtet die getragene Rüstung die Grundverteidigung; dazu Artfaktoren (`SPECIES_RESIST`) und Größe (`SIZE_DMG`). Inspektor und Reiter zeigen Schadensart, Rüstungsstärken und Widerstände.
- **Zustände** (index.html, bei `tickStamina`): Hieb betäubt (2 bis 3 Ticks, danach 4 Ticks Schutz), Schnitt lässt bluten (bis 3 Stapel, bei Feuer "Brand"), Stich verlangsamt (Tempo ×0,7, 8 Ticks); Chance = durchgekommener Schaden der Art ÷ Maximalleben × Faktor (Blutung 1,6, Stich 1,8, Hieb 0,8), höchstens 50 %, durch Rüstung vermindert. Blutung kostet nur bei **Handlungen** (Schritt, Hieb, Fähigkeit): 10 % je Stapel, 4 % des Maximallebens. Immunitäten in `STATUS_IMMUNE` (Skelett, Zombie, Ghul, Lich, Banshee: kein Bluten; Golem: auch keine Betäubung; Geist und Irrlicht: nichts).
- **Erschöpfung**: Die Hälfte des durchgekommenen Hiebschadens geht (×2) als Müdigkeit an `energy`; bei 0 schläft die Kreatur ein (`faintCreature(c,true)`, Leben bleibt, kein Tod), wacht nach 90 Ticks mit 45 Ausgeschlafenheit auf. Untote, Golems, Geister gelten als nicht müde.
- **Test** (72 Dreierkämpfe, gemischte Arten und Rüstungen): Zustände greifen ordentlich (Betäubung 64, Blutung 91, Verlangsamung 175), 14 Einschlafen, 140 bewusstlos, 88 gefallen. Der Duell-Test der Waffen bleibt zwischen 39 % und 54 %, nur die Armbrust liegt mit 77 % vorn (Balancing später).
