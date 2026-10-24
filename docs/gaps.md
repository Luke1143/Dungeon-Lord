# Abgleich Design und Code

Stand: nach Gegner-Burg, Zug der Guten, Ego-Ansicht, Animationen, Ton und Musik. Verglichen wurden `design.md`, `godhand.md` und der Code. ✅ gebaut · 🟡 teilweise · ❌ fehlt.

## Kampagne und Weltkarte
| Thema | Stand | Anmerkung |
|---|---|---|
| Weltkarte, 11 Spalten, Pforten, Weltwirtschaft, Ereignisse mit Würfeln, Runden | ✅ | |
| Zug der Guten (Alarm, Boten, Armeen, Legenden) | ✅ | Armeen sind nur eine Begegnung (Level mit Bonus), kein eigenes Kartenspiel |
| Nebenziele der Orte | ✅ | `REGION_TYPES[...].sideGoal` mit `SIDE_GOALS` (Räume erobern, Helden besiegen, Ritter stürzen, Erz lagern), Belohnung ein Artefakt; für Pforten gilt der Weg (direkt: Trophäe, listig: legendäres Artefakt) |
| Optionale Level, die eine Pforte erleichtern | ❌ | |
| Pforten: Zwerge, Elfen, Menschen | ✅ | Hydra und Labyrinth sind abgeschaltet |
| Finale: Boss der Hauptstadt (besiegen oder unterwerfen) | ✅ | Herakles in seiner Halle: direkt (im Löwenfell fast unverwundbar, wird bei halbem Leben zornig und ruft Verstärkung) oder listig (Fell stehlen, dann korrumpieren). Das Ende der Kampagne zeigt nur eine Meldung, kein Abspann |
| Levellänge 10 min bis 1 h nach Entwicklungsstufe | ❌ | Kartengröße fest 48×32 |
| Zeitdruck als Nebenziel (z. B. Atlantis) | ❌ | |
| New Game Plus | ❌ | |

## Fortschritt, Belohnungen
| Thema | Stand | Anmerkung |
|---|---|---|
| Fertigkeitspunkt pro Sieg und Ausgeben | ✅ | Weltkarte, Knopf „Fertigkeiten einsetzen“: Lord-Leben, -Stärke, -Reserve, Kreaturen-Leben und -Stärke, Imp-Eifer, Startgold; prozentual, `SKILLS` ist eine Tabelle |
| Perks | ❌ | |
| Artefakte, Seltenheiten, Belohnungen | ✅ | `artifacts.js`: 20 Einträge in fünf Seltenheiten, Waffen und Rüstungen trägt der Lord, Talismane geben Fertigkeitsränge, manche haben einen Preis (Heldenmacht dauerhaft höher). Fundorte auf der Karte (Labyrinth, Rand der Welt) fehlen noch |
| Vault (Stase, Mitnehmen) | ❌ | |
| Verbündete aus korrumpierten Bossen | ✅ | |
| Unbegrenzte Skalierung | ❌ | Deckel: Verteidigung 80 %, Heldenstufe 10, Wellen 3 bis 12; Design verlangt Formeln ohne Deckel |

## Der Dungeon Lord
| Thema | Stand | Anmerkung |
|---|---|---|
| Figur, Besessenheit, Ego-Ansicht, Aktionsanimationen | ✅ | |
| Tod: bewusstlos im Thronsaal mit eigenem Lebenspool, Run endet erst, wenn der Pool leer ist | ✅ | `faintLord`, `state.war.lordPool` |
| Ausrüstung und Artefakt-Slot | 🟡 | trägt ein Inventar, es gibt keine Quelle dafür |

## Level: Räume und Kreaturen (godhand.md)
| Thema | Stand | Anmerkung |
|---|---|---|
| Räume: Thron, Lager, Schlafsaal, Bibliothek, Hühnerfarm, Arena, Schmelze, Schmiede, Brücke | ✅ | |
| Räume: Gefängnis (bekehren), Friedhof, Tempel, Taverne, Wachposten, Werkstatt, Rüstkammer | ❌ | Arbeitskategorien kennen sie schon, die Räume nicht |
| Bekehren und Korrumpieren gefallener Helden | ❌ | |
| Zauber: Imp beschwören, Aufheben, Besessenheit | ✅ | weitere Zauber und Fähigkeiten (Teil 22) fehlen |
| Fallen | ❌ | in den Gesprächen erwähnt, nicht im Design verankert |
| Bedürfnisse (Hunger, Schlaf, Lohn, Zufriedenheit) | ✅ | |
| Wahrnehmung (Teil 7) | 🟡 | **Wahrnehmungsradius ist neu** (Gegner werden nur in der Nähe, auf eigenem Boden oder bei Belagerung bemerkt); Geschicklichkeits-Wurf und „übersehen“ fehlen |
| Kreaturen: Bestien (Imp, Fliege, Käfer, Höllenhund), Horde (Warlock, Ork, Goblin, Troll), Untote (Skelett) | 🟡 | fehlen laut godhand Teil 16: Echse, Dämonenbrut, Dunkelelf, Dunkler Priester, Dunkler Ritter, Succubus, Dämon, Banshee, Ghoul, Zombie, Geist, Vampir, Werwolf, Lich, Drache, Gefallener Held |
| Kreaturen des Guten: Barbar, Dieb, Zauberer, Ritter, Elf, Bogenschütze, Mönch, Paladin, Zwerg, Riese (und Bosse) | 🟡 | fehlen: Fabelwesen (Yule, Fee, Greif, Einhorn, Golem, Kitsune), Himmlische (Irrlicht, Engel, Phönix, Dryade), Held, Avatar |
| Eigenleben der Kreaturen | 🟡 | **neu**: Marotten (gucken, gähnen, summen, heulen, schnüffeln, plaudern); Freundschaften, Streit, Rudel, Tagesablauf fehlen |
| Arena (Teil 27) | ✅ | |
| Moral, Kampfstile, Bewusstlos statt tot | ✅ | |

## Gegner
| Thema | Stand | Anmerkung |
|---|---|---|
| Gegner-Burg mit Handwerkern, Rekruten, Profilen, Räumen, Technik | ✅ | |
| Boss-Fähigkeiten und Phasen | 🟡 | Herakles hat Phase 2; Alberich, Oberon und Artus kämpfen noch nur normal |
| Die Guten spiegeln den Spieler (Teil 24) | 🟡 | Heldenarten, Bedürfnisse der Wartenden; Zauberer/Barbar als Spiegel ja, eigene Räume-Jobs der Helden nein |

## Darstellung und Technik
| Thema | Stand | Anmerkung |
|---|---|---|
| Sprites, 2D und 3D, Nebel, Modelle, Ton, Musik | ✅ | Modelle für kleine Dinge (Münzen, Hühner) bleiben Sprites |
| Tutorial | ❌ | bewusst später |
| `index.html` in Module teilen | ❌ | die Datei ist über 9000 Zeilen lang |
| Code-Sprache einheitlich Englisch | 🟡 | ein Teil der alten Kommentare ist noch deutsch |

## Vorschlag für die Reihenfolge
1. ~~Fertigkeitspunkte ausgeben und Tod des Lords mit Lebenspool~~ (gebaut).
2. ~~Belohnungen: Artefakte aus Nebenzielen und Pforten~~ (gebaut). Offen: Artefakte, die Kreaturen betreffen, und versteckte Funde.
3. ~~Finale mit Boss der Hauptstadt~~ (gebaut).
4. **Gefängnis und Bekehren** (bringt Eigenleben und Bossmechanik zusammen).
5. **Eigenleben vertiefen**: Freundschaften, Streit, Rudelverhalten.
6. Deckel entfernen, NG+, Vault.
