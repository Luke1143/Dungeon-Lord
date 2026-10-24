# Abgleich: GODHAND gegen den Stand des Spiels

Stand: nach dem Roster-Ausbau (Teil 16), Ausrüstung, Terrain, Vault und Perks. Geprüft wurde im Code (`index.html`, `keep.js`, `creatures.js`, `bosses.js`, `terrain.js`, `sprites.js`) und im laufenden Spiel. ✅ = wie im Dokument, 🟡 = teilweise oder anders, ❌ = fehlt, ➕ = mehr als das Dokument.

## 1. Was dem Dokument entspricht

| Teil | Inhalt | Stand |
|---|---|---|
| 1, 2 | Ein Verb `interact()`, Rezepte am Ziel, Reichweite am Rezept, Fehlschlag bewirkt nichts | ✅ (`recipeFor`, `applyRecipe`) |
| 2 | Arbeitspunkte liegen am Ziel (`t.work`), zwei Imps addieren | ✅ Lackmustest hält |
| 3 | Bestie ohne Zufriedenheit/Lohn/Inventar, Horde mit 3 Plätzen | ✅ |
| 4 | Stufenskalierung +20 % additiv, Geschick-Deckel 40, Glück-Deckel 25, Tempo = Bewegung + Schlagrate | ✅ |
| 5 | Freizeit-Wünsche (`LEISURE_ACTIVITIES`, Vorlieben je Art) | ✅ als Tabelle, aber keine eigenen `NEEDS`/`WISHES` (siehe 3) |
| 6 | Räume als Vorarbeiter für Schmelze, Schmiede, Bibliothek; Anstellung volatil; Werkzeuge abstrakt | ✅ |
| 7 | Wo Räume liegen ist öffentlich | ✅ |
| 8 | Minispiele: Bibliothek (Heureka), Schmelze (Hitze, Luppe), Schmiede (Sollbestand), Rüstkammer | ✅ |
| 9 | Aufheben-Zauber: ausrüsten, verstärkten Eingang = fortschicken, in volle Räume setzen | ✅ |
| 11 | Sonderfall 3 (besseres Stück: Tausch), 9 (Imps: Thronsaal als Mutterraum) | ✅ |
| 15 | Räume: Thron, Eingang, Portal, Schlafsaal, Hühnerfarm, Lager, Bibliothek, Schmelze, Schmiede, Rüstkammer, Trainingskammer, Taverne, Tempel, Friedhof, Gefängnis, Wachposten, Arena, Brücke | ✅ 18 von 19 (siehe 3) |
| 16 | Roster: 18 von 20 Bösen, alle Legion und Himmlischen, 5 von 6 Fabelwesen | ✅ (siehe 3 für den Rest) |
| 17 | Arbeit hat Meinungen: je Schwung wirksam, Fehlschlag nagt, vier Kategorien, hasst = nie freiwillig | ✅ |
| 19 | Bewegungsmalus: Boden, Wasser, Gegenstände, Gedränge, Deckel 6, gemessene Werte | ✅ |
| 20 | Passive: Fliege, Dieb, Höllenhund, Käfer, Imp | ✅ |
| 23 | Kampfstile: Attentäter, Kämpfer, Unterstützer wählen das Ziel | ✅ |
| 25 | Feindschaft als Frage (Fraktion, Groll, Auftrag), Groll läuft ab, Bewusstlos statt tot (Überschuss, Glück, Kontext), Moral-Formel, Untote fliehen nie, Treffer-Rückmeldung, Kampfleiste | ✅ |
| 26 | Zwei Ebenen: Gedanke (Rangfolge in `thoughtOf`) und Schwung (`swingBudget`, `STATE_VERB`) | ✅ |
| 26 | Drei Sichtplätze rechts/links/Mitte unten | ✅ |
| 27 | Arena: Form statt Fläche (Kampfgrube, Arena, Kolosseum), Podeste, Zuschauer als Freizeit | ✅ |

## 2. Wo wir bewusst vom Dokument abweichen

| Dokument | Spiel | Warum |
|---|---|---|
| Verteidigung in %, Deckel 80 (Teil 4) | Formel `d/(d+60)`, kein Deckel | Entscheidung für unendliche Skalierung (`design.md`) |
| Ein Raum, ein Platz ("Mindestgröße 3×3") für Trainingskammer, Taverne, Tempel, Friedhof | Mindestgröße 6 Kacheln | einfacher zu bauen, feiner abgestuft; Wachposten hat 1 |
| Taverne: bedienen (kochen), erfüllt Wünsche, Bedingung "Hühner vorrätig" (Teil 15) | Taverne ist ein Freizeitort: Trinken kostet 2 Gold, Hühner spielen keine Rolle | schnelle Umsetzung; Gold ist die Senke |
| Dämonenbrut als Horde (Teil 3) und als Bestie (Teil 16) — das Dokument widerspricht sich | als Bestie umgesetzt, kommt im Rudel | bei Lava |
| Fabelwesen sind Bestien (Teil 16) | Yule, Fee, Greif, Einhorn, Kitsune sind Kategorie `hero` mit Fähigkeiten, laufen mit der Legion | brauchen Marschlogik und Gefecht |
| Untote brauchen weiter Nahrung und haben Zufriedenheit (Teil 3) | Untote essen nicht, haben keine Zufriedenheit | Teil 17 sagt "fühlen nichts"; einfacher |
| Untote arbeiten nur im Handwerk (Nachtrag Teil 17) | Untote sind überall neutral, keine Sperre für Geistesarbeit | noch nicht durchgesetzt |
| Lich entsteht aus einem Warlock auf Stufe 10 (Teil 3) | Lich wird von Bibliothek + Friedhof + Tempel angelockt | Aufstieg fehlt |
| Drache bevorzugt Geistesarbeit, Horde verliert Zufriedenheit in seiner Nähe | Drache arbeitet nie, kein Präsenz-Effekt | Platzhalter |
| Fähigkeiten werden auf Stufe 5 und 10 gelernt, mit Wissensplätzen (Teil 22) | Fähigkeiten sind von Anfang an da, stehen in `CREATURE_ABILITIES`/`BOSS_ABILITIES` | schneller und lesbarer, keine Wissensverwaltung |
| Spiegelkreaturen als Verweis auf die Vorlage (Teil 24) | Yule, Fee, Barbar, Riese, Zauberer sind eigene Einträge | mehr Charakter, mehr Pflege |
| Teil 19 "Verstautes zählt nicht" gegen den Nachtrag "bremst auch" | Nachtrag gilt (Lager bremst) | wie im Nachtrag |
| Waffen sind ein Eintrag je Familie | Waffen bestehen aus Kopf, Schaft, Knauf (prozedural) | Entscheidung des Spielers |
| 3 Inventarplätze ohne Arten | Rüstung, rechte Hand, linke Hand, Zweihänder belegen beide | Entscheidung des Spielers |

## 3. Was im Dokument steht und noch fehlt

**Räume und Jobs**
- ❌ **Handwerkskammer** (Türen und Fallen): gibt es nicht, auch keine Türen und Fallen.
- ❌ **Opfern** im Tempel (Opferwert, Feinde und Ausrüstung auf den Altar): der Tempel kennt nur Beten.
- ❌ **Taverne als Arbeitsraum** (kochen).
- ❌ **Wachposten "Kreaturen behalten"**: die Kreatur verlässt den Posten bei Hunger oder Müdigkeit.
- ❌ **Stammarbeiter bevorzugt** bei der Rückkehr in einen Raum.

*Nachtrag (erledigt):* Wachposten-Schalter "Kreaturen behalten" ✅, Opfern im Tempel ✅ (Wehrlose Feinde und Ausrüstung auf den Altar), Wahrnehmungswürfe ✅ (Geschick-abhängig, für Freizeit, Ausrüstung und Heureka), bewusstlose Eigene ins Bett tragen ✅, Passive für Troll, Golem, Geist und Flieger ✅ (Flieger überqueren Wasser und Lava), Untote verweigern Geistes- und Sozialarbeit ✅, Lockregeln gecacht (5 ms auf 0,9 ms) ✅.
- ❌ **Bekehren als Job**: Gefangene werden passiv bekehrt, wenn Kreaturen in der Nähe stehen.
- ❌ **Generische Job-Tabelle** (`JOBS`: holen, bringen, bedienen, suchen, üben, bewachen, bekehren, opfern, kämpfen, verwahren, entlassen): die Zustände sind weiterhin im Code verteilt.
- ❌ **`NEEDS`- und `WISHES`-Tabellen** (Teil 13): Bedürfnisse laufen in `tickCreatureNeeds`, Wünsche in `LEISURE_ACTIVITIES`.
- ❌ **Eigenschaften-Abfrage** (Teil 18: Opferwert, Kampfwert, Nährwert, Metallgehalt): Räume und Fracht prüfen Typen, nicht Werte. Rückfall-Rezepte (Waffe in die Arena, ins Gefängnis, in den Tempel) fehlen.

**Wahrnehmung (Teil 7)**
- ❌ **Wurf bei der Gelegenheit** und "übersehen"-Merker: Kreaturen sehen alles in ihrem Radius, `noticesFoe` ist radiusbasiert und nicht an Geschick gekoppelt.
- ❌ **Leere Räume werden gemerkt** (Hühnerfarm 1 leer, also Farm 2).
- ❌ **Verstecken und Entdecken** im Kampf.
- ❌ **Verbranntes Objekt** nach gezieltem Fehlschlag bei der Untersuchung.

**Fähigkeiten (Teil 22)**
- ❌ **Zauberleiste mit Abklingzeiten**: der Spieler hat nur Imp beschwören, Aufheben, Besessenheit. Imps lernen Eile (Stufe 5) und Teleport (Stufe 10).
- ❌ **Wissensplätze, Fähigkeitsbücher, Verzehren (Zombie/Ghoul), Beute-Schriftrollen**.
- ❌ **Stil wählt die Fähigkeit** (nur die Zielwahl folgt dem Stil).

**Kreaturen**
- ❌ **Legendäre Gute**: Lord des Landes, Held, Avatar.
- ❌ **Spinne, Wyvern** (Beispiele in Teil 3).
- ❌ **Vampir**: braucht lebende Humanoide, schläft zur Regeneration; er lockt nur und heilt sich beim Biss.
- ❌ **Lich**: Aufstieg aus dem Warlock, Angriff auf andere Warlocks, Privatarmee.
- ❌ **Drache**: Zufriedenheitsabzug für die Horde.
- 🟡 **Passive** (Teil 20): fehlen für **Troll** (schiebt durch), **Golem** (unbeirrbar, die Bewegungsregel ist da, aber niemand trägt das Flag), **Geist** (körperlos), und für alle neuen Flieger (Greif, Engel, Fee, Phönix, Irrlicht ignorieren kein Wasser, Lava oder Gedränge).
- ❌ **Bewusstlose Eigene** werden nicht von Imps ins Bett getragen (Sonderfall 10), sie erholen sich allein. Bewusstlose Feinde ins Gefängnis ✅, als Opfer ❌.
- ❌ **Sonderfall 1, 2, 4**: Ausrüstung in die Schmelze werfen, Imp trägt Gold und Erz zugleich.
- ❌ **Lich gegen Warlocks** (Sonderfall 12), Vampir-Nahrung (11).

**Umsetzungshinweise (Teil 12)**
- 🟡 `computeRooms()` ist nicht gecacht (35 Aufrufe); `tickLures` kostet 5 ms von etwa 16 ms je Tick auf großen Karten (Lockregeln rechnen Räume und Randfelder jedes Mal neu).
- ❌ Auftragswahl über Punktebewertung (Nähe, Trägheit, Spielerhinweis).

**Arena (Teil 27)**
- 🟡 **Aufgeben statt sterben** ist nicht als eigene Regel zu erkennen: Flucht folgt der Moral, es gibt keinen Unterschied "eigene verschont, feindliche bleiben liegen".

## 4. Was das Spiel mehr hat als das Dokument

- ➕ **Kampagne**: Overworld mit prozeduraler Weltkarte, Züge der Guten (Boten, Armeen, Alarm), Regionstypen mit Nebenzielen, Tore mit Bossen und zwei Wegen, Hauptstadt-Finale, New Game Plus, Permadeath, Lord-Tod mit Reserve.
- ➕ **Fortschritt**: Skillpunkte, Artefakte in fünf Seltenheiten mit Preis, acht Perks, Vault mit Siegel der Stase.
- ➕ **Boss-Fähigkeiten** (Alberich, Oberon, Artus, Herakles) und `CREATURE_ABILITIES` für 12 weitere Arten; Heil-Auren (`HEALERS`), Status (schwach, bezaubert, gelähmt).
- ➕ **Gegnerische KI (`keep.js`)**: der Feind baut Räume, rekrutiert, besetzt Posten, mit Technikbedingungen.
- ➕ **Kreaturenleben**: Antics, Bindungen, Trauer, Streit, Lockregeln für die Horde, Gefängnis-Bekehrung, Gefallene Helden.
- ➕ **Prozedurale Ausrüstung** (Kopf, Schaft, Knauf), Rassenvorlieben, Beute beim Tod, Rüstkammer, Schmied wählt Teile.
- ➕ **Terrain**: vier Layouts, vier Größen, Thron in jeder Ecke, Lava, Kristallhöhlen, Ruinen mit Relikten, versteckte Schatzkammern.
- ➕ **Darstellung**: 3D-Ansicht mit Ego-Perspektive und Besessenheit, prozedurale Musik, Nebel des Krieges, Wandfackeln, Effekte, Animationsregeln ("keine Hände").
- ➕ **Werkzeuge**: Debug-Panel, Fehler-Toast mit Zählern, Balance-Simulationen.

## 5. Vorschlag zur Reihenfolge

1. **Aufräumen vor Balancing** (klein, sofort wirksam): Passive nachtragen (Troll, Golem, Geist, Flieger), `tickLures` und `computeRooms` cachen, Undote: Geistesarbeit sperren.
2. **Lücken, die das Spielgefühl am stärksten ändern**: Wahrnehmung mit Würfen (Quirks), Wachposten "behalten", Bewusstlose tragen, Opfern im Tempel.
3. **Das große Fundament**: Job-Tabelle und Eigenschaften-Abfrage (`NEEDS`, `WISHES`, `JOBS`). Das ist aufwendig und bringt dem Spieler wenig, aber jede neue Kreatur und jeder Raum wird billiger.
4. **Fähigkeiten**: Zauberleiste mit Abklingzeiten für den Spieler, Wissensplätze.
5. **Legendäre Helden und Sonderkreaturen** (Lich, Vampir, Drache).
