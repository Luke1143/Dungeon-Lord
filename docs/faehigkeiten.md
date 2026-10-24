# Fähigkeiten — Entwurf zum Besprechen

Ausgangspunkt ist GODHAND Teil 22 und der Imp, der es schon vormacht: **Eile ab Stufe 5, Teleport ab Stufe 10.** Dieses Muster verallgemeinern wir: Jede Art bekommt zwei angeborene Fähigkeiten, eine auf Stufe 5 und eine auf Stufe 10. Alles darüber hinaus (Bücher, Verzehren, Beute) kommt später auf demselben Weg dazu.

**Stand: umgesetzt** (`creatures.js`, siehe Entscheidungen am Ende). Die Tabellen unten sind der Stand des Spiels, mit zwei Abweichungen vom ersten Vorschlag: Legendäre (Lich, Drache) lernen auch auf Stufe 5 und 10, und der Imp behält seine eigene Logik für Eile und Teleport.

## 1. Die Regeln (aus GODHAND, mit Anpassungen)

| Regel | Vorschlag |
|---|---|
| Fähigkeit = anderes Rezept | Eine Fähigkeit ändert nur, was ein Interact auslöst. Der besessene Spieler benutzt dieselbe Liste wie die KI. |
| Keine Mana-Ressource | Nur Abklingzeiten. |
| Angeboren | Stufe 5 und Stufe 10 je eine Fähigkeit pro Art. Heute sind die Fähigkeiten von Anfang an da (`CREATURE_ABILITIES`); dann wandern sie auf diese Stufen. |
| Wissensplätze | Bestien 1, Horde 3, Untote 2, Legendäre 4. Zwei davon belegen die angeborenen Fähigkeiten, der Rest wird durch Bücher, Verzehren oder Beute gefüllt. Ist alles voll, wird die schwächste vergessen. |
| Zielarten | selbst · Kachel · Kreatur · Fläche (mit Reichweite und Abklingzeit) |
| Stil wählt die Fähigkeit | Attentäter nutzen Sprünge und Teleport, um an die Hinteren zu kommen, Kämpfer um aufzuholen, Unterstützer wirken auf bedrängte Verbündete. |
| Anzeige | Ein Symbol über dem Kopf beim Auslösen (haben wir), ein Eintrag im Log nur bei Auffälligem. |

**Fähigkeiten des Spielers (der Dungeon Lord):** Er hat Imp beschwören, Aufheben, Besessenheit. Die Zauberleiste bekommt Platz für gelernte Fähigkeiten (Teleport, Eile, Feuerball ... aus Artefakten oder Büchern) und teilt sich die Abklingzeiten mit seinen Kreaturen.

## 2. Die Bibliothek der Fähigkeiten

Die Tabelle, aus der alle Arten wählen. Jede Zeile ist ein Eintrag, den man auch in einem Buch finden kann.

| Fähigkeit | Ziel | Reichweite | Abklingzeit | Wirkung | Heute schon als |
|---|---|---|---|---|---|
| **Eile** | selbst | — | 90 | Tempo ×1,6 für 24 Ticks | Imp, Stufe 5 |
| **Teleport** | Kachel | 10 | 80 | springt auf eigenes Gebiet | Imp, Stufe 10 |
| **Rundumhieb** | Fläche | 1 | 50 | trifft alle Angrenzenden | `quake`/`club` der Bosse |
| **Ausfallschritt** | Kreatur | 3 | 60 | springt heran und schlägt zu | Greif (Sturzflug) |
| **Feuerball** | Kachel | 5 | 70 | Schaden im kleinen Umkreis | Lich/Drache (ähnlich) |
| **Heilung** | Kreatur | 3 | 40 | stellt Leben wieder her | Heil-Auren |
| **Fluch** | Kreatur | 4 | 60 | schwächt das Ziel (−30 % Stärke, 40 Ticks) | Geist, Kitsune |
| **Lähmen** | Fläche | 5 | 70 | Gegner stehen still | Banshee |
| **Verzaubern** | Kreatur | 6 | 90 | Held kämpft 30 Ticks für uns | Succubus |
| **Beschwören** | selbst | 8 | 140 | ruft zwei Verbündete | Lich, Oberon |
| **Wutschrei** | selbst | — | 100 | Stärke ×1,4 für 20 Ticks | neu |
| **Mauerbruch** | Kachel | 1 | 60 | zerstört Räume und Brücken | neu |
| **Dornen** | Kreatur | 4 | 60 | hält ein Ziel fest (Wurzeln) | Oberon |
| **Atem** | Fläche | 5 | 70 | Feuer auf alles in Reichweite | Drache |

## 3. Wer bekommt was (Vorschlag)

Je Art: **Stufe 5 / Stufe 10**. Die Vorschläge bauen auf dem Charakter der Art auf (Passiv, Stil, Aussehen).

### Die dunkle Seite

| Art | Stufe 5 | Stufe 10 | Gedanke |
|---|---|---|---|
| **Imp** | Eile | Teleport | schon so |
| **Fliege** | Eile | Schwarm (zieht Feinde an) | Plagegeist |
| **Käfer** | Rundumhieb | Panzerhaltung (Verteidigung ×2 kurz) | Bollwerk |
| **Höllenhund** | Eile | Heulen (Fluch auf alle in 3) | Rudelgeist |
| **Echse** | Eile | Zungenschlag (Ausfallschritt) | Jäger |
| **Dämonenbrut** | Wutschrei | Selbstzerstörung (Fläche, tötet sich) | Kamikaze |
| **Ork** | Wutschrei | Rundumhieb | Raufbold |
| **Goblin** | Eile | Ausfallschritt | Schlitzohr |
| **Troll** | Rundumhieb | Mauerbruch | schiebt sich durch |
| **Warlock** | Feuerball | Fluch | Gelehrter |
| **Dunkelelf** | Ausfallschritt | Teleport | Attentäter |
| **Dunkler Priester** | Heilung | Fluch | Unterstützer |
| **Dunkler Ritter** | Wutschrei | Rundumhieb | schwerer Kämpfer |
| **Succubus** | Fluch | Verzaubern | Unterstützer |
| **Dämon** | Feuerball | Atem (Feuer, reichweitenarm) | Brandstifter |
| **Skelett** | Rundumhieb | — (nur 1) | Untote 2 Plätze, einfach |
| **Ghoul** | Ausfallschritt | Verzehren (heilt, frisst Leichen) | Aasfresser |
| **Zombie** | Rundumhieb | Verzehren | Brocken |
| **Banshee** | Lähmen | Fluch | Geist |
| **Geist** | Fluch | Teleport | körperlos |
| **Vampir** | Ausfallschritt | Verzaubern | Attentäter |
| **Werwolf** | Wutschrei | Ausfallschritt | Jäger |
| **Lich** | Feuerball | Beschwören | Legendär (4 Plätze) |
| **Drache** | Atem | Rundumhieb | Legendär |

### Die gute Seite

| Art | Stufe 5 | Stufe 10 | Gedanke |
|---|---|---|---|
| **Barbar** | Wutschrei | Rundumhieb | |
| **Dieb** | Eile | Ausfallschritt | |
| **Zauberer** | Feuerball | Teleport | |
| **Ritter** | Rundumhieb | Wutschrei | |
| **Paladin** | Heilung | Segen (Verteidigung ×1,5 für alle in 3) | |
| **Bogenschütze** | Ausfallschritt (zurück) | Feuerball (Brandpfeil) | |
| **Mönch** | Eile | Rundumhieb | |
| **Elf** | Dornen | Heilung | |
| **Zwerg** | Panzerhaltung | Mauerbruch | |
| **Riese** | Rundumhieb | Mauerbruch | |
| **Golem** | Panzerhaltung | Rundumhieb | |
| **Dryade** | Dornen | Heilung | |
| **Yule** | Eile | Ausfallschritt | |
| **Fee** | Heilung | Eile (auf andere) | |
| **Greif** | Ausfallschritt | Rundumhieb | |
| **Einhorn** | Heilung | Wecken (Gefallene) | |
| **Kitsune** | Fluch | Verzaubern | |
| **Irrlicht** | Eile (auf andere) | Blenden (Lähmen) | |
| **Engel** | Heilung | Richten (Fläche, doppelter Schlag) | |
| **Phönix** | Feuerball | Wiedergeburt | |
| **Schutzengel** | Schutz (fängt einen Schlag ab) | Heilung | |

## 4. Wie sie erlernt werden

| Weg | Ablauf |
|---|---|
| **Stufe 5 und 10** | Die angeborenen Fähigkeiten. Ein Banner über dem Kopf zeigt den Moment. |
| **Fähigkeitsbuch** | Eine Idee in der Bibliothek wird ein Buch, das statt Wissen eine Fähigkeit enthält. Wer es liest, lernt (braucht einen freien Wissensplatz, sonst wird die schwächste vergessen). |
| **Verzehren** | Zombie, Ghoul und Vampir lernen beim Fressen (Gehirne, Leichen). Wir können das auf Leichen beschränken. |
| **Beute** | Besiegte Zauberer, Priester und Bosse lassen Schriftrollen fallen. |

## 5. Fragen an dich

1. **Stufen 5 und 10 für alle?** Der Imp macht es so. Für Legendäre (Lich, Drache) fände ich 3 und 6 passender, weil sie sonst kaum je Stufe 10 erreichen. Für Bestien eine Fähigkeit.
2. **Sollen die jetzigen angeborenen Fähigkeiten (Banshee-Schrei, Succubus-Charme ...) auf Stufe 5 verschoben werden?** Dann ist ein Stufe-1-Dämon wehrlos, aber Stufen bedeuten etwas.
3. **Wissensplätze:** Reicht eine einfache Zahl (2/3/4) oder wollen wir eine Anzeige im Inspektor (Plätze, Fähigkeiten mit Abklingzeit)?
4. **Der Spieler:** Soll der Dungeon Lord eine Zauberleiste mit den Fähigkeiten seiner Artefakte bekommen (z. B. Teleport auf eigenes Gebiet)? Und lernt der Lord selbst Fähigkeiten über Skillpunkte?
5. **Gute Seite:** Sollen Heldengruppen auch Fähigkeiten mit steigender Stufe lernen (dann werden späte Wellen gefährlicher), oder nur Bosse und besondere Helden?
6. **Bücher:** Soll die Bibliothek auch Fähigkeitsbücher erforschen (Heureka mit Zufallsbuch), oder nur Wissen wie heute?

## 6. Entscheidungen und Umsetzung

1. **Stufe 5 und 10 für alle Arten**, einheitlich. Bestien auch (zwei Fähigkeiten, aber kein Platz für gelernte).
2. **Die bisherigen angeborenen Fähigkeiten wandern auf Stufe 5 und 10.** Kreaturen zu trainieren und wachsen zu lassen lohnt sich damit. Ausnahmen: Yule stiehlt von Anfang an (`BASE_ABILITIES`), Wiedergeburt (Phönix) und Schutz (Schutzengel) sind Fähigkeiten auf Stufe 10 beziehungsweise 5.
3. **Anzeige:** im Inspektor eine Zeile mit gelernten Fähigkeiten (mit Abklingzeit), gesperrten (🔒 mit Stufe) und freien Bücherplätzen. In der Ego-Sicht die Leiste unten mit den Tasten 2 bis 6 und Abklingbalken.
4. **Der Lord lernt über Artefakte** (acht neue, `abilities` in `artifacts.js`: Eile, Wutschrei, Heilung, Rundumhieb, Teleport, Feuerball, Beschwören, Atem), nicht über Stufen. Als Besessener benutzt der Spieler sie mit 2–6. Im Wachzustand setzt die KI sie im Kampf ein, aber ohne den Thron zu verlassen (kein Teleport, kein Ausfallschritt).
5. **Gute Seite:** Helden lernen mit der Stufe wie alle anderen. Besiegte Helden lassen mit 30 % eine **Schriftrolle** mit einer ihrer Fähigkeiten fallen.
6. **Bücher:** Schreiber in der Bibliothek schreiben nach einer Forschung mit 35 % eines ihrer Fähigkeiten in ein Buch und mit 8 % eine neue Idee, passend zum Archetyp (`ARCHETYPE_POOL`). Wer ein Buch liest (Freizeit), lernt mit 40 %. Wissensplätze: 5 Lord, 4 Lich und Drache, 3 Horde und Legion, 2 Bestien und Untote. Zwei davon belegen die angeborenen Fähigkeiten, der Rest ist für Bücher frei. Ist alles voll, ersetzt eine stärkere Fähigkeit die schwächste.
7. **Nicht gebaut:** Verzehren als Lernweg für Zombie und Ghoul ist nur die Fähigkeit "Verzehren" (Leichen fressen heilt, mit 25 % lernt er etwas); eine eigene Zauberleiste für den Lord außerhalb der Besessenheit; das Vergessen auf Wunsch.
