# GODHAND

**Das Regelwerk der Welt.** Ein einziges Verb, das definiert, wie jedes Wesen in diesem Dungeon mit allem interagiert — ob von der KI gesteuert oder vom Spieler besessen.

---

## Teil 1 — Designphilosophie

| Grundsatz | Bedeutung |
|---|---|
| **Ein Verb** | Alles ist Interact. Kein zweiter Knopf, keine Sonderaktionen. |
| **Diegetisch** | Was passiert, passiert sichtbar in der Welt. Keine Zahlen aus dem Nichts. |
| **Deterministisch** | Jede Kombination aus Akteur und Ziel hat **genau ein** Rezept. Zufall nur beim Treffer. |
| **Fehlbar** | Kreaturen patzen, übersehen Dinge, haben Launen. Keine Roboter. |
| **Emergent** | Regeln erzeugen Geschichten. Wir schreiben keine Ereignisse, wir schaffen Bedingungen. |
| **Erweiterbar** | Neue Objekte bringen ihr Verhalten selbst mit. Keine zentrale Tabelle, die wächst. |
| **Possession-fest** | Alles, was die KI kann, kann der Spieler mit denselben Mitteln. Sonst: Designfehler. |
| **Zwei Agenden** | Räume wollen Arbeit erledigt sehen. Kreaturen wollen leben. Aus dem Aufeinandertreffen entsteht das Spiel. |

---

## Teil 2 — Die Kernregel

> Jede Handlung ist ein **Interact** auf eine Kachel.
> Was geschieht, bestimmt das **Ziel**. Wie gut, bestimmt der **Akteur**.

**Auch Bewegung ist Interact.** Außer Reichweite → hinlaufen. In Reichweite → Rezept ausführen. Die Trennung zwischen Wegsuche und Arbeit entfällt vollständig.

Reichweite gehört zum **Rezept**, nicht zur Kreatur: Graben 1, Blitzstab 4, Teleport sehr viel mehr. Damit entfällt jede Blickrichtung.

### Ablauf

1. **Zielen** — Kachel innerhalb der Rezeptreichweite.
2. **Rezept bestimmen** — aus Akteur (Art, Beruf, Inventar, Checkliste, Eigenheiten) und Ziel (Typ, Markierung, Inhalt, Besitz). **Immer genau eines.**
3. **Annähern** — außer Reichweite: hinlaufen, bei Ankunft neu bewerten.
4. **Würfeln** — Treffer oder Fehlschlag.
5. **Wirken** — Arbeitspunkte des Ziels sinken, Akteur erhält Erfahrung.
6. **Auslösen** — bei null greift der Effekt.

**Ein Fehlschlag bewirkt exakt nichts.** Bei Wand, Huhn oder Gegner gleichermaßen.
**Interact ins Leere** = Inspizieren.

### Arbeitspunkte liegen am Ziel

- Zwei Imps an derselben Wand addieren ihre Arbeit.
- Wird eine Kreatur weggenommen, bleibt der Fortschritt.
- Kein Killstealing — wer schlägt, bekommt Erfahrung.

| Ziel | Arbeitspunkte |
|---|---|
| Gegenstand aufheben | 1 |
| Territorium beanspruchen | 3 |
| Fels abbauen | 20 |
| Bedrock | unendlich |

### Eindeutigkeit bei mehrdeutigen Zielen

Ein **sichtbarer Zustand in der Welt** entscheidet — nie ein zweiter Knopf.

| Ziel | Zustand | Ergebnis |
|---|---|---|
| Fels | **markiert** | abbauen |
| Fels | unmarkiert, an eigenem Gebiet | verstärken |
| Fels | unmarkiert, ohne eigenes Gebiet | nichts |

---

## Teil 3 — Kreaturentypen

| Typ | Zufriedenheit | Lohn | Schlaf | Nahrung | Inventar | Arbeit | Grundwerte |
|---|---|---|---|---|---|---|---|
| **Bestie** | nein | nein | ja | ja | nein | keine | hoch |
| **Horde** | ja | ja | ja | ja | ja (3) | alle Arten | mittel |
| **Untot** | ja | ja | **nein** | ja | ja (3) | keine intellektuelle | mittel |

**Bestien** — nicht humanoid, keine Zufriedenheit, keine Bezahlung. Nur Energie und Hunger. Können nicht arbeiten, tragen nichts, sind dafür körperlich stark. Früh im Spiel überlegen.
*Höllenhund, Spinne, Käfer, Fliege, Wyvern …*

**Horde** — das Heer der dunklen Mächte. Eigenwillig, mit Vorlieben und Abneigungen. Können jede Arbeit erledigen, müssen aber teils dazu gezwungen werden (Aufheben-Zauber) und werden dabei unglücklich. Ausschließlich humanoid.
*Ork, Warlock, Succubus, Dämonenbrut, Troll, Dunkelelf …*

**Untote** — rastlose Tote ohne Gehirn. Keine intellektuelle Arbeit, **kein Zufriedenheitsmalus durch Arbeit**, kein Schlafbedarf. Nahrung brauchen sie weiterhin.
*Skelett, Zombie*

### Spezialkreaturen

Das Framework braucht Platz für Hybride, die mehreren Kategorien angehören — extrem mächtig, aber mit besonderen Ansprüchen. Sie sind Ausnahmen **innerhalb** der Regeln, nicht daneben.

| Kreatur | Zugehörigkeit | Besonderheit |
|---|---|---|
| **Geist** | untot, nicht humanoid | mechanisch wie eine Bestie |
| **Vampir** | untot mit Gehirn | verweigert Handwerk; **schläft zur Zufriedenheitsregeneration**; gestörter Schlaf bringt ihn aus der Fassung; sehr langsamer Hunger, aber braucht **lebende Humanoide** als Nahrung |
| **Drache** | humanoider Wyvern | bevorzugt intellektuelle Arbeit, mächtiger Krieger; **Horde-Kreaturen verlieren Zufriedenheit durch seine Präsenz** |
| **Lich** | untot **und** Horde | Aufstieg: Warlock auf Stufe 10 liest das Necronomicon. Greift alle anderen Warlocks an, damit niemand sein Wissen erlangt; jeder Gefallene wird zum Untoten seiner Privatarmee. Eigene Schlafkammer, arbeitet ausschließlich in der Bibliothek. |

*Noch nicht final — als Beispiele für die Bandbreite, die das Framework tragen muss.*

---

## Teil 4 — Kreaturenwerte

| Wert | Wirkung | Skaliert mit Stufe |
|---|---|---|
| **Lebenspunkte** | Aushalten von Schaden | ja, +20 % je Stufe (additiv) |
| **Stärke** | Schaden bzw. Wucht pro Treffer | ja, +20 % je Stufe |
| **Verteidigung** | Schadensminderung in %, Deckel 80 | nein — aus Art und Ausrüstung |
| **Geschicklichkeit** | Treffen, Ausweichen (Deckel 40 %), **Wahrnehmung**, später **Verstecken und Entdecken** | ja, artabhängig langsam |
| **Glück** | Doppelschaden bzw. halber Schaden, Deckel 25 % | nein — einmalig gewürfelt |
| **Tempo** | Bewegung **und** Aktionsrate (ein Wert) | nein — aus Art und Ausrüstung |
| **Loyalität** | Geduld vor dem Zusammenbruch | nein |
| **Zufriedenheit** | Treibstoff für Loyalität | nein |

**Zusammengelegt:** Tempo und Arbeitstempo. Wer rennt wie der Blitz, schlägt auch schnell zu.
**Nicht eingeführt:** ein eigener Wahrnehmungswert — Geschicklichkeit übernimmt das.

---

## Teil 5 — Bedürfnisse und Wünsche

Kreaturen führen **keine Aufgabenliste ab**. Sie haben Wünsche.

### Die Kette

> **Bedürfnis → Wunsch → Objekt**

Ein niedriger Wert erzeugt einen Wunsch. Welchen, hängt von der Art ab. Und **jeder Wunsch kann über mehrere Objekte befriedigt werden**.

| Bedürfnis | mögliche Wünsche |
|---|---|
| Hunger | essen |
| Energie | schlafen |
| Zufriedenheit | Unterhaltung **oder** essen **oder** schlafen **oder** arbeiten **oder** … |
| Bezahlung | Lohn holen |

Ein Ork frisst aus Vergnügen. Ein Warlock isst, um sich zu heilen. Eine wütende Kreatur stopft im Fressanfall Hühner in sich hinein oder legt sich aus Trotz in ihr Lair statt zu arbeiten.

**Das System muss offen genug sein, jedes Objekt sinnvoll mit jedem Bedürfnis zu verknüpfen — je nach Kreatur.**

Wünsche entstehen nur in der **Freizeit**. Wer arbeitet, hat keine.

### Zwei Zustände: Arbeit oder Freizeit

Es gibt genau zwei Zustände. Sie schließen sich aus.

| Zustand | Wer entscheidet | Bedürfnisse |
|---|---|---|
| **Arbeit** | der Raum | kann sich nicht darum kümmern |
| **Freizeit** | die Kreatur selbst | kümmert sich selbst |

Eine arbeitende Kreatur kann sich **nicht** um ihre Bedürfnisse kümmern. Sie meldet nur, wenn ein Schwellenwert unterschritten wird — den Rest entscheidet der Raum.

### Gelegenheiten

In der **Freizeit** prüft eine Kreatur beiläufig, was sie sieht — mechanisch identisch zum Aufheben von Waffen oder zum Untersuchen in der Bibliothek:

| Wer sieht was | Frage an sich selbst |
|---|---|
| Bibliothekar sieht Huhn | „Habe ich das schon abgehakt?" |
| Kreatur in Freizeit sieht Huhn | „Habe ich genug Hunger, dass es sich lohnt?" |
| Ork sieht Schwert | „Ist das besser als meins?" |

Wer ausgeschlafen zur Arbeit unterwegs ist und die Hühnerfarm passiert, frühstückt — auch ohne kritischen Hunger. Das verhindert, dass er kurz darauf erneut entlassen wird.

Eine **arbeitende** Kreatur läuft vorbei. Sie hat einen Auftrag.

---

## Teil 6 — Räume als Vorarbeiter

> **Die Kreatur sagt, was sie will. Der Raum sagt, was sie soll.**

### Räume sind die Wildcards

Ein Raum vergibt **unsichtbare Werkzeuge**, die Rezepte verändern, und erteilt **Arbeitsaufträge**.

| Kreatur will | Raum antwortet |
|---|---|
| arbeiten | „Schmiede eine Waffe." |
| arbeiten | „Such nach Inspiration." |
| arbeiten | „Halte die Hitze." |

Das ist alles. Für Essen, Ausrüstung, Einlagern oder Lohn braucht es **keine** Ansage — dort geht die Kreatur hin und prüft die Kacheln selbst.

**Der Raum weist Arbeit zu, er zaubert nicht.** Gegenstände erscheinen nie in Händen.

### Kein Auskunftsdienst — die Kachel antwortet selbst

Der Raum nennt **keine** Kacheln. Das wäre für einen besessenen Spieler nicht nachvollziehbar und damit ein Verstoß gegen die Possession-Regel.

Stattdessen:

> **Geh in den Raum. Prüf die Kacheln, bis eine passt.**

Ein Imp mit Gold betritt das Lager (Raumlagen sind öffentlich bekannt) und geht die Kacheln durch, bis eine das Gold annimmt. Er muss den Raum nicht auf einen Schlag erfassen — eine nach der anderen genügt.

Für den besessenen Spieler ist das identisch: Er klickt auf eine Lagerkachel, und entweder greift das Rezept oder nicht.

Der Raum behält damit **genau eine** Aufgabe: Arbeit vergeben und Werkzeuge ausgeben.

### Der Raum ist der Boss

Eine arbeitende Kreatur hat **kein Freispiel**. Sie sieht nur: *Ich arbeite in der Bibliothek, das ist mein Auftrag.* Arbeit **ersetzt** ihr normales Verhalten vollständig.

Der Raum spielt dabei ein völlig anderes Spiel. Er sieht keine Bedürfnisse, keine Gefühle. Er sieht nur: *Ich brauche x Arbeiter, ich habe Werkzeug Lupe und Werkzeug Federkiel zu vergeben.*

**Meldet eine Kreatur, dass ein Bedürfnis unter den Schwellenwert fällt, entlässt der Raum sie** — und sucht den Nächsten. Ob sie sich danach tatsächlich kümmert, sieht der Raum nicht und interessiert ihn nicht.

Diegetisch ist das die Gnade des Dungeon Lords: „Geh essen. Der Nächste."

**Schalter „Kreaturen behalten"** (z. B. Wachposten): Der Raum entlässt nicht. Die Kreatur arbeitet trotz Bedürfnis weiter — mit allen Folgen.

**Bei Rückkehr wird der Stammarbeiter bevorzugt**, sonst entsteht eine Abwärtsspirale.

### Anstellung ist volatil

- Vergeben durch Interact mit einer freien Arbeitsstation.
- **Angestellt heißt: hat einen Auftrag** — nicht: steht in diesem Raum. Bibliothekare und Schmelzer bleiben angestellt, während sie durchs Dungeon laufen.
- Wer weggeht, hat Freizeit. Kein Kündigen nötig.
- Der besessene Spieler kündigt, indem er weggeht.

### Werkzeuge gehören dem Raum

Abstrakt, nicht als Gegenstand. **Grund:** Echte Werkzeuge erzeugen ein Henne-Ei-Problem — kein Eisen ohne Spitzhacke, keine Spitzhacke ohne Eisen. Diese Tür bleibt zu.

Der Beruf **ersetzt** keine Grundfähigkeiten, er **erweitert** sie.

---

## Teil 7 — Wahrnehmung

| Wissen | Verfügbarkeit |
|---|---|
| **Wo Räume liegen** | öffentlich — Bedienstete kennen das Haus ihres Herrn |
| **Was in Räumen ist** | nur durch Hinsehen |
| **Lose Objekte** | Sichtradius, gekoppelt an Geschicklichkeit |

### Der Wurf fällt im Moment der Entscheidung

Wahrnehmung ist **kein Scan**. Es wird nicht jeden Tick für jedes sichtbare Objekt gewürfelt — das wären viele Operationen für wenig Ertrag.

> **Standard: Die Kreatur sieht alles in Reichweite.**
> Gewürfelt wird erst, wenn eine Gelegenheit tatsächlich auslösen *würde*.

Ein Wurf pro echter Gelegenheit. Misslingt er, wird **dieses eine Objekt** für **diese eine Kreatur** kurz als übersehen vermerkt; nach Ablauf des Cooldowns ist es wieder im Spiel. Die Chance zu scheitern ist gering und hängt an der Geschicklichkeit.

**Nur für unaufgeforderte Gelegenheiten.** Was die Kreatur aktiv verfolgt, kann sie nie übersehen — ein hungriger Ork, der vor seinem Huhn steht und es nicht bemerkt, wirkt nicht eigenwillig, sondern kaputt.

Daraus entstehen die gewünschten Quirks:

| Beobachtung | Bedeutung |
|---|---|
| Ork geht an der Waffenkammer vorbei, ohne zuzugreifen | hatte gerade anderes im Sinn |
| Kreatur in Freizeit läuft am Buch vorbei | hat es nicht bemerkt |
| Bibliothekar passiert das Wasser ohne Geistesblitz | die Brücke bleibt noch unerforscht |

**Kritische Bedürfnisse reichen weiter.** Wer verhungert, sucht gezielt statt beiläufig.

**Leere Räume werden gemerkt.** Findet eine Kreatur in Hühnerfarm 1 nichts, streicht sie diese kurz und geht zu Farm 2.

**Später im Kampf:** Dieselbe Geschicklichkeit steuert automatisch **Verstecken** und **Entdecken versteckter Feinde**. Kein neues System nötig.

---

## Teil 8 — Räume haben Minispiele

Jeder Raum bekommt eine eigene Mechanik, die seine Arbeit charakterisiert.

| Raum | Minispiel |
|---|---|
| **Bibliothek** | Ostereiersuche — Objekte untersuchen, bis eine Idee kommt |
| **Schmelze** | Timing — Hitze aufbauen, Luppe schmieden, bevor sie erkaltet |
| **Schmiede** | Produktion nach Sollbestand |
| **Rüstkammer** | Lager nur für Ausrüstung, je Kachel nach Art filterbar |
| *weitere* | *noch zu entwerfen* |

### Forschung im Detail

Jeder Bibliothekar führt eine eigene Liste untersuchter Dinge. Ein Objekt bleibt für **alle** interessant, bis ein Buch daraus entstanden ist — so sammeln mehrere Angestellte Erfahrung.

**Heureka-Wurf:** Ein steigender Zähler erhöht die Chance bei jedem weiteren Blick. Erfolg ist auf Dauer garantiert, der Zeitpunkt offen.

**Wissen ist ein Überraschungsei.** Wer etwas findet, weiß nur, *dass* er etwas hat. Erst das Buch verrät was. Eine Kreatur kann mit einer ungeschriebenen Idee sterben — die Erkenntnis liegt dann bei ihrer Leiche.

**Risiko bei gezielter Untersuchung:** Untersucht der besessene Spieler gezielt und scheitert, ist das Objekt **für diese Kreatur dauerhaft verbrannt**. Ohne dieses Risiko könnte der Spieler das System auswendig lernen und umgehen. Ein Softlock ist ausgeschlossen, weil Kreaturen über den Eingang entlassen werden können.

**Eigenheiten sperren Rezepte.** *Warlocks rühren keine Leichen an.* Arbeiten nur Warlocks in der Bibliothek, bleibt der Friedhof unentdeckt. Der Ekel-Emoji beim Vorbeigehen macht es diagnostizierbar.

---

## Teil 9 — Der Aufheben-Zauber

**Absolute Autorität.** Die Interventionsfunktion des Spielers gewinnt immer.

| Aktion | Folge |
|---|---|
| Kreatur in vollen Raum setzen | Raum entlässt eine andere |
| Imp neben Grabauftrag setzen | Imp gräbt diesen Bereich |
| Kreatur in verstärkten Eingang setzen | verlässt das Dungeon endgültig |
| Ausrüstung auf Kreatur fallen lassen | wird ausgerüstet, wenn nutzbar |

---

## Teil 10 — Neubewertung unterwegs

**Diegetisch:** Die Kreatur sieht erst vor Ort, dass die Wand weg ist.

**Bei Feindkontakt entscheidet der Raum:**

| Situation | Verhalten |
|---|---|
| in Wachposten angestellt | greift an |
| in zivilem Raum angestellt | wird entlassen, entscheidet selbst |
| in Freizeit | entscheidet selbst |

**Imps fliehen immer.**

---

## Teil 11 — Sonderfälle (Merkliste)

| # | Fall | Regelung |
|---|---|---|
| 1 | Ausrüstung ablegen, kein Lagerplatz frei | auf Schmiedestation oder in die Schmelze werfen |
| 2 | Herrenlose Ausrüstung in der Schmelze | wird wie Erz eingeschmolzen |
| 3 | Kreatur findet bessere Ausrüstung | Tausch, altes Stück fällt zu Boden |
| 4 | Imp trägt Gold **und** Erz, zielt auf Lager | Kachel prüft der Reihe nach; erstes Passendes wird abgelegt, Rest beim nächsten Interact |
| 5 | Mehrere Waffen auf einer Kachel | Der Stapel gibt das beste Stück her, **das der Zugreifende benutzen kann**. Ein Ork greift durch den Zauberstab hindurch zum Schwert. |
| 6 | Bibliothekar/Schmelzer verlässt den Raum | bleibt angestellt: Auftrag, nicht Standort |
| 7 | Ziel verschwindet während der Anreise | Neubewertung bei Ankunft |
| 8 | Spieler untersucht gezielt und scheitert | Objekt für diese Kreatur gesperrt |
| 9 | Imps | Bestien mit Inventar, ohne Ausrüstungsnutzen; Thronsaal ist ihr Mutterraum |
| 10 | Kritisch verletzte Kreatur | Imp trägt sie zum Lair — derselbe Transportjob wie Gold |
| 11 | Vampir braucht lebende Humanoide | Nahrungsquelle ist eine andere Kreatur |
| 12 | Lich greift Warlocks an | Kreatur wird zum Feind im eigenen Dungeon |

---

## Teil 12 — Umsetzungshinweise

**Schrittweise migrieren.** `interact()` zunächst **neben** der bestehenden Zustandsmaschine aufbauen. Dann Ziel für Ziel überführen: Fels und Erz zuerst, dann Transport, dann Stationen.

**Rezepte gehören zum Ziel.** Kein zentrales Nachschlagewerk, das Kombinationen auflöst.

**Ein Transportsystem statt acht.** Aufheben, prüfen, hinbringen — Ladung als Parameter.

**Wunsch-Ebene einziehen.** Bedürfnisse erzeugen Wünsche, Wünsche suchen Objekte. Die Zuordnung Wunsch→Objekt muss je Art überschreibbar sein.

**Nähe schlägt Priorität.** Auftragswahl über Punktebewertung: Grundgewicht minus Entfernung, plus Trägheit, plus abklingender Spielerhinweis, plus Zufall je Individuum.

**Räume cachen.** `computeRooms()` einmal pro Tick, bei Kartenänderung verwerfen. Aktuell 28 Aufrufe, teils in Pfadsuch-Prüfungen.

**Lackmustest:** Zwei Imps an einer Wand müssen ihre Arbeit addieren. Hält das, trägt das Fundament.

---

# Teil 13 — Referenz-Architektur

Alles im Spiel steht in einer Tabelle und trägt eine eindeutige Kennung. Jeder Eintrag darf auf jeden anderen verweisen. Es gibt keine Sonderfälle im Code, nur Einträge, die aufeinander zeigen.

| Tabelle | Kennung | Verweist auf |
|---|---|---|
| `SPECIES` | Kreaturenart | Jobs die sie mag/hasst, Waffenkategorien, Nahrungsquellen |
| `ROOMS` | Raumart | Jobs die er vergibt, Stationen, Mindestgröße, Stufenwirkung |
| `JOBS` | Jobart | Zielfilter, Ergebnis, Raum der ihn vergibt |
| `ITEMS` | Gegenstand | Typ, Tags, Werte, herstellender Raum |
| `RECIPES` | Interaktion | Zielbedingung, Aufwand, Ergebnis |
| `CARGO` | Frachtart | Aufnahme, Zielsuche, Ablieferung |
| `NEEDS` | Bedürfnis | Wünsche die es auslöst |
| `WISHES` | Wunsch | Objekte/Räume die ihn erfüllen |

**Grundregel:** Ein neuer Inhalt ist ein neuer Tabelleneintrag, kein neuer Code. Wenn eine Erweiterung eine neue Verzweigung braucht, ist die Tabelle falsch geschnitten.

---

# Teil 14 — Generische Jobs

Ein Job ist kein Verhalten, sondern ein **Auftrag mit Parametern**. Erz holen und Eisen holen sind derselbe Job mit anderem Ziel. Ein Buch schreiben und an der Puppe trainieren sind derselbe Interact mit anderem Ziel.

| Job | Was die Kreatur tut | Parameter |
|---|---|---|
| **holen** | Objekt nach Filter suchen und aufnehmen | Objektfilter |
| **bringen** | Getragenes zum passenden Ziel tragen | Zielfilter |
| **bedienen** | Eine Station bearbeiten, bis ein Ergebnis entsteht | Station, Aufwand, Ergebnis |
| **suchen** | Umherziehen und Unbekanntes prüfen | Prüffilter, Ergebnis |
| **üben** | Auf ein Ziel einwirken, das nicht zerstört wird | Ziel, Belohnung |
| **bewachen** | In Raumnähe bleiben, Feinde angreifen | Radius |
| **bekehren** | Auf einen Gefangenen einwirken | Zielkreatur |
| **opfern** | Kreatur oder Gegenstand auf einem Altar darbringen | Ziel, Gegenleistung |
| **kämpfen** | Gegner angreifen, bis er besiegt ist | Zielkreatur |
| **verwahren** | Etwas an seinen Platz räumen | Zielfilter |
| **entlassen** | *Systemjob — jeder Raum besitzt ihn* | — |

**`entlassen` hat jeder Raum.** Er ist die einzige Möglichkeit, wie eine arbeitende Kreatur wieder zu ihren eigenen Wünschen kommt. Ausgelöst durch Bedürfnis-Schwellenwert oder den Spieler.

### Beispiel: derselbe Job, verschiedene Ziele

| Aufgabe | Job | Ziel |
|---|---|---|
| Gold einlagern | bringen | Lagerkachel, Filter Gold |
| Erz zur Schmelze | bringen | Rennofen |
| Buch ins Regal | bringen | freies Regal |
| Leiche zur Farm | bringen | Futtertrog |
| Eisen schmieden | bedienen | Schmiedestation |
| Luppe hämmern | bedienen | Amboss |
| Wissen finden | suchen | alles Unbekannte |
| Trainieren | üben | Trainingspuppe |
| Buch schreiben | bedienen | Schreibpult |

---

# Teil 15 — Räume

Jeder Raum vergibt Jobs unter Bedingungen. Alle besitzen zusätzlich `entlassen`.

| Raum | Baubar | Mindestgröße | Jobs | Bedingung für Vergabe |
|---|---|---|---|---|
| **Thronsaal** | nein (Start) | 3×3 | — | Sitz des Dungeon Lords. **Verlust = Niederlage** |
| **Eingang** | nein | 2×2 | — | Portal aus der Anderswelt; neue Kreaturen erscheinen hier |
| **Weltportal** | **nein** | — | — | **immer feindlich**; Eroberung = Sieg über die Karte |
| **Schlafsaal** | ja | 1 | — | Kreaturen richten selbst ein Lair ein |
| **Hühnerfarm** | ja | 3×3 | füttern | Futtervorrat unter Schwelle |
| **Lagerhaus** | ja | 1 | verwahren | freie Kachel und Filter passt |
| **Bibliothek** | ja | 3×3 | suchen, bedienen *(schreiben)* | 1) Wissen unentdeckt · 2) Kreatur trägt eine Idee |
| **Schmelze** | ja | 3×3 | bedienen *(Balg, Amboss)* | Roherz vorhanden bzw. Luppe glüht |
| **Schmiede** | ja | 3×3 | bedienen | Sollbestand unterschritten und Eisen vorrätig |
| **Rüstkammer** | ja | 1 | verwahren | freie Kachel, Ausrüstungsfilter passt |
| **Handwerkskammer** | ja | 3×3 | bedienen | Komponentenbedarf für Türen und Fallen |
| **Trainingskammer** | ja | 3×3 | üben | freie Puppe und Kreatur unter Höchststufe |
| **Taverne** | ja | 3×3 | bedienen *(kochen)*, **erfüllt Wünsche** | Hühner vorrätig |
| **Tempel** | ja | 3×3 | beten, opfern | Altar frei |
| **Friedhof** | ja | 3×3 | verwahren *(bestatten)* | Leiche vorhanden — Untote können auferstehen |
| **Gefängnis** | ja | 3×3 | bekehren | Gefangener vorhanden |
| **Wachposten** | ja | 1 | bewachen | immer; Schalter **Kreaturen behalten** |
| **Arena** | ja | 3×3 | kämpfen | zwei Kreaturen eingeworfen — eine kommt heraus |
| **Brücke** | ja | 1 | — | überbrückt Wasser und Abgründe |

---

# Teil 16 — Kreaturen

## Die dunklen Mächte

| Typ | Kreaturen |
|---|---|
| **Bestien** | Imp, Käfer, Fliege, Höllenhund, Echse, Dämonenbrut |
| **Horde** | Goblin, Ork, Warlock, Dunkelelf, Troll, Dunkler Priester, Dunkler Ritter, Succubus, Dämon |
| **Untote** | Skelett, Banshee, Ghoul, Zombie, Geist, Vampir, Werwolf |
| **Legendär** | Lich, Drache, Gefallener Held |

## Die Kräfte des Guten

| Typ | Kreaturen |
|---|---|
| **Fabelwesen** *(Bestien)* | Yule, Fee, Greif, Einhorn, Golem, Kitsune |
| **Legion** *(Horde)* | Zauberer, Zwerg, Barbar, Paladin, Bogenschütze, Mönch, Ritter, Elf, Dieb, Riese |
| **Himmlische** *(Untote)* | Irrlicht, Engel, Phönix, Dryade, Schutzengel |
| **Legendär** | Lord des Landes, Held, Avatar |

## Was jede Art festlegt

| Feld | Bedeutung |
|---|---|
| `typ` | Bestie · Horde · Untot · Legendär |
| `seite` | böse · gut · neutral |
| Grundwerte | Leben, Stärke, Verteidigung, Geschick, Tempo, Lohn |
| `jobPrefs` | Welche Jobs sie liebt, duldet oder hasst |
| `weaponCats` | Nahkampf · Fernkampf · Magie |
| `gearPrefs` | Tag-Gewichte für Ausrüstung |
| `nahrung` | Huhn · Leiche · lebende Humanoide · keine |
| `eigenheiten` | Gesperrte oder bevorzugte Rezepte |
| `lockmittel` | Was sie ins Dungeon zieht |

**Die Typregeln aus Teil 3 gelten:** Bestien haben keine Zufriedenheit, keinen Lohn und kein Inventar. Untote schlafen nicht und leiden nicht unter verhasster Arbeit, können aber keine intellektuelle Arbeit. Legendäre sind Hybride mit eigenen Ansprüchen.

---

# Teil 17 — Arbeit hat Meinungen

Jede Art bewertet jeden Job. Die Bewertung wirkt **bei jeder abgeschlossenen Arbeit** auf die Zufriedenheit.

Die Wirkung hängt **am einzelnen Schwung**, nicht am fertigen Werkstück. Zufriedenheit entsteht direkt aus dem Zusammenspiel von Interact und Objekt: Schwung aufs Schreibpult hebt, Schwung auf den Amboss senkt.

| Bewertung | Wirkung je Schwung | Freiwillig? |
|---|---|---|
| **liebt** | Zufriedenheit steigt | sucht ihn aktiv |
| **neutral** | keine Änderung | nimmt ihn, wenn nichts anderes da ist |
| **hasst** | Zufriedenheit sinkt | **nie freiwillig** — nur durch den Aufheben-Zauber |

**Jeder Fehlschlag nagt zusätzlich ein wenig** — unabhängig davon, ob die Arbeit geliebt wird. So haben Kreaturen manchmal einfach einen schlechten Tag.

**Beispiel Warlock:** liebt *suchen* und *schreiben*, duldet *verwahren*, **hasst** *bedienen* in Schmelze und Schmiede. Er wird dort nie von allein arbeiten. Wirfst du ihn hinein, arbeitet er — und wird mit jedem Hammerschlag unglücklicher.

**Untote sind ausgenommen:** Sie empfinden keine verhasste Arbeit, nur Unfähigkeit zu intellektueller.

### Stimmung sichtbar machen

Ein gleitender Durchschnitt über etwa hundert Ticks. Ein Emoji erscheint **nur bei deutlicher Abweichung oder anhaltendem Trend** — nicht als Dauerdekoration.

| Zustand | Anzeige |
|---|---|
| sehr zufrieden | 😄 |
| sinkender Trend | 😟 |
| kurz vor dem Ausbruch | 😡 |
| Ekel vor einem Objekt | 🤢 |

Das macht die Ursache-Wirkung-Kette lesbar: Bibliothek erschöpft → nur noch verhasste Arbeit → 😟 → 😡 → Ausbruch. Der Spieler sieht das Problem kommen und kann handeln.

---

# Teil 18 — Eigenschaften statt Kombinationstabelle

## Warum keine N:N-Matrix

Bei 45 Kreaturen, 18 Räumen und 45 Gegenständen hätte eine echte Kombinationstabelle mehrere tausend Felder. Sie wäre nach zwei Erweiterungen unpflegbar, und jede neue Kreatur bräuchte Dutzende neuer Zellen.

> **Umkehrung: Der Empfänger stellt eine Frage. Das Objekt antwortet.**

Der Tempel fragt nicht „was bist du?", sondern „welchen Opferwert hast du?". Er kennt keine einzige Kreatur und keinen einzigen Gegenstand.

| Raum | Frage | Wer antwortet |
|---|---|---|
| **Tempel** | Opferwert? | alles — Kreatur: Stufe × Seltenheit · Ausrüstung: Materialwert |
| **Arena** | Kampfwert? | Kreaturen; Gegenstände antworten **null** und liegen nur herum |
| **Taverne** | Nährwert? | Huhn, Leiche |
| **Schmelze** | Metallgehalt? | Erz, Ausrüstung |
| **Gefängnis** | Bekehrbar? | feindliche Kreaturen |
| **Friedhof** | Bestattbar? | Leichen |
| **Schmiede** | Rohstoff? | Eisen |

**Der Aufwand wächst additiv statt multiplikativ.** Eine neue Kreatur braucht eine Handvoll Eigenschaftswerte, keine Zeile in jeder Tabelle.

## Kein Interact ist ein Blindgänger

Jeder Raum hat ein **Rückfall-Rezept**: Passt nichts, liegt das Ding einfach da und kann wieder aufgehoben werden. Besser als eine erfundene Wirkung.

Viele vermeintliche Sonderfälle lösen sich dadurch von selbst — und werden zu Spielzügen:

| Fall | Was geschieht | Warum es gut ist |
|---|---|---|
| Waffe in die **Arena** | liegt da, der nächste Kämpfer hebt sie auf | Du kannst deinem Champion heimlich aufrüsten |
| Waffe ins **Gefängnis** | der Gefangene hebt sie auf | Bewaffneter Gefangener wehrt sich, bricht vielleicht aus |
| Waffe in den **Tempel** | Opferwert = Materialwert | Meisterliche Ware bringt mehr Gunst |
| Feind **opfern** | Opferwert = Stufe × Seltenheit | Ein gefangener Paladin ist ein großes Opfer |
| Feind in die **Arena** | er kämpft | Genau das, was die Arena tut |

---

# Teil 19 — Kachelbelegung und Bewegungsmalus

Jede Kachel bremst nach dem, was auf ihr liegt — **ohne Unterscheidung**, ob Gegenstand oder Kreatur. Der Malus stapelt mit der Anzahl.

| Ursache | Wirkung |
|---|---|
| Eigenes Territorium | volle Geschwindigkeit |
| Neutraler oder feindlicher Boden | leichte Verlangsamung |
| Wasser | starke Verlangsamung |
| Jedes lose Objekt auf der Kachel | stapelnder Malus |
| Jede weitere Kreatur auf der Kachel | derselbe stapelnde Malus |

**Ausnahme: Ordentlich Verstautes zählt nicht.** Was in Lagerkacheln, Regalen oder Ausrüstungsschränken liegt, bremst niemanden — sonst würde ausgerechnet ein volles Lagerhaus zäh, wo Imps am meisten laufen.

Das macht Ordnung mechanisch wertvoll und Raumplanung wichtig: Ein Engpass voller herumliegender Beute wird zum echten Nadelöhr.

---

# Teil 20 — Passive Fähigkeiten

Jede Art bekommt eine dauerhafte Eigenheit. Die meisten sind **Ausnahmen von den Kachelregeln** aus Teil 19 und brauchen daher kein eigenes System.

| Kreatur | Passiv |
|---|---|
| **Fliege** | fliegt — ignoriert Wasser und Gedränge |
| **Geist** | körperlos — ignoriert alle Kachelmali |
| **Troll** | schiebt sich durch — ignoriert Gedränge |
| **Dieb** | schlängelt sich durch — kein Malus durch Objekte |
| **Golem** | unbeirrbar — immun gegen Verlangsamung, aber grundsätzlich langsam |
| **Höllenhund** | nervös — doppelter Malus auf feindlichem Boden |
| **Käfer** | Chitinpanzer — hohe Verteidigung, meidet Wasser vollständig |
| **Imp** | Fluchtinstinkt — flieht immer vor Feinden |

Weitere Arten bekommen ihre Passive beim Einbau. **Richtlinie:** Ein Passiv soll die Kreatur *charakterisieren*, nicht nur ihre Zahlen verschieben — und möglichst als Ausnahme einer bestehenden Regel formulierbar sein.

---

# Teil 21 — Empfohlene Umsetzungsreihenfolge

| # | Schritt | Warum zuerst |
|---|---|---|
| 1 | **Arbeit hat Meinungen** (Teil 17) | größte Emergenzlücke; fertig entworfen; wenig Code |
| 2 | **Bewegungsmalus** (Teil 19) | klein, generisch, sofort spürbar, macht Raumplanung wichtig |
| 3 | **Eigenschaften-Abfrage** (Teil 18) | sobald die ersten fragenden Räume existieren |
| 4 | **Passive Fähigkeiten** (Teil 20) | baut auf 2 und 3 auf |
| 5 | **Kampfsystem** | Voraussetzung für Arena, Wachposten, Ork-Infighting |
| 6 | **Weitere Räume und Kreaturen** | erst wenn die Systeme darunter tragen |

---

# Teil 22 — Fähigkeiten

## Eine Fähigkeit ist ein anderes Rezept

Fähigkeiten sind **kein zweites System neben Interact**. Eine ausgewählte Fähigkeit verändert nur, welches Rezept ein Interact auslöst.

> Teleport ausgewählt → Klick auf Kachel = dorthin teleportieren.
> Nichts ausgewählt → Klick auf Kachel = das übliche Rezept.

Daraus folgt: Die **Zauberleiste bei Besessenheit ist dieselbe Liste**, aus der die KI wählt. Kein Parallelsystem, kein Sonderpfad.

**Keine Mana-Ressource.** Nur Abklingzeiten. Ein weiterer Balken würde die Tabelle aufblähen, ohne Charakter zu erzeugen.

## Aufbau

| Feld | Bedeutung |
|---|---|
| `id`, `label`, `icon` | Kennung und Anzeige |
| `ziel` | selbst · Kachel · Kreatur · Fläche |
| `reichweite` | in Kacheln; Nahkampf = 1 |
| `abklingzeit` | Ticks bis zur Wiederverwendung |
| `wirkung` | was beim Auslösen geschieht |
| `bedarf` | Wissensplätze, die sie belegt |
| `stil` | welcher Kampfstil sie bevorzugt einsetzt |

## Zielarten decken alles ab

| Zielart | Beispiele |
|---|---|
| **selbst** | Eile, Verteidigungshaltung, Wutschrei |
| **Kachel** | Teleport, Feuerball, Fallgrube |
| **Kreatur** | Heilung, Fluch, Ausfallschritt |
| **Fläche** | Rundumhieb, Kettenblitz, Segen |

## Wissen ist ein zweites Inventar

Eine Kreatur kann nur so viele Fähigkeiten halten, wie sie **Wissensplätze** hat. Gleiche Mechanik wie das Gegenstands-Inventar, gleiche Regeln: Ist es voll und sie lernt etwas Besseres, vergisst sie das Schwächste.

| Typ | Wissensplätze |
|---|---|
| Bestien | 0–1 |
| Horde | 3 |
| Untote | 2 *(kein Verstand für Komplexes)* |
| Legendär | 4+ |

## Woher Fähigkeiten kommen

| Quelle | Ablauf |
|---|---|
| **Stufe 5 und 10** | jede Art erlernt ihre zwei angeborenen Fähigkeiten |
| **Fähigkeitsbuch** | Interact in der Bibliothek — die Kreatur liest und lernt |
| **Verzehren** | Zombie und Ghoul fressen Gehirne statt zu lesen |
| **Beute** | Schriftrollen von besiegten Feinden |

Alle vier Wege enden im selben Ergebnis: ein Eintrag mehr in der Wissensliste.

## Beispiele

| Fähigkeit | Ziel | Reichweite | Wirkung |
|---|---|---|---|
| **Eile** | selbst | — | Tempo stark erhöht, begrenzte Dauer |
| **Teleport** | Kachel | 10 | sofortiger Ortswechsel auf eigenem Gebiet |
| **Rundumhieb** | Fläche | 1 | trifft alle angrenzenden Gegner |
| **Feuerball** | Kachel | 5 | Schaden im kleinen Umkreis |
| **Ausfallschritt** | Kreatur | 3 | heranspringen und sofort zuschlagen |
| **Heilung** | Kreatur | 3 | stellt Lebenspunkte wieder her |
| **Fluch** | Kreatur | 4 | senkt Werte des Ziels zeitweise |
| **Mauerbruch** | Kachel | 1 | beschädigt Räume und Brücken |

---

# Teil 23 — Kampfstile

Jede Art hat einen von drei Stilen. Der Stil bestimmt **die Zielauswahl** — nicht die Werte.

| Stil | Sucht sich | Verhalten |
|---|---|---|
| **Attentäter** | verwundbare Ziele mit hohem Schadenspotential | durchbricht die Frontlinie, geht an die hinteren Reihen |
| **Kämpfer** | das nächstgelegene Ziel | schlägt auf das ein, was zuerst vor ihm steht |
| **Unterstützer** | bedrängte Verbündete, dann deren Angreifer | heilt, verstärkt, greift ein statt anzuführen |

**Der Stil wählt auch die Fähigkeit.** Ein Dunkelelf nutzt Teleport, um an den Rittern vorbeizukommen und direkt den Priester anzugreifen — dieselbe Fähigkeit, die ein Kämpfer nur zum Aufholen verwenden würde.

Damit entsteht Taktik ohne Taktik-Code: Drei Zielauswahlfunktionen ergeben zusammen mit Reichweiten und Fähigkeiten ein Schlachtbild, das niemand skriptet.

---

# Teil 24 — Spiegelkreaturen

Viele Kreaturen des Guten sind mechanisch identisch mit bestehenden bösen — nur Name, Aussehen und Seite unterscheiden sich.

| Gut | Entspricht | Böse |
|---|---|---|
| Yule | ↔ | Imp |
| Fee | ↔ | Fliege |
| Zauberer | ↔ | Warlock |
| Barbar | ↔ | Ork |
| Riese | ↔ | Troll |

Das spart Arbeit und ist stimmig: Beide Seiten brauchen Arbeiter, Kundschafter, Gelehrte und Schläger. Ein Spiegeleintrag verweist auf die Vorlage und überschreibt nur, was wirklich abweicht.

---

## Nachtrag zu Teil 20 — Was kein Passiv ist

Die bisherige Imp-Fähigkeit **Extra-Gold-Chance** fällt weg. Sie verschiebt nur eine Zahl und erzeugt keinen Charakter. Der Imp behält seinen **Fluchtinstinkt**.

**Prüffrage für jedes Passiv:** Könnte ein Zuschauer es beim Beobachten erkennen, ohne die Zahlen zu sehen? Wenn nein, ist es kein Passiv, sondern ein Bonus — und gehört in die Grundwerte.

## Nachtrag zu Teil 19 — Malus im Lagerhaus bleibt

Anders als zunächst vorgeschlagen bremsen auch **verstaute** Güter. Begründung: Lagerräume kosten nichts zu bauen — ohne Malus würde der Spieler schlicht jeden Korridor zum Lager erklären.

Diegetisch ist es ohnehin stimmiger: Eine Kreatur, die sich durch eine prallgefüllte Kammer schiebt, an Regalen vorbeimanövriert und sich umsieht, kommt eben langsamer voran.

---

## Nachtrag zu Teil 17 — Vier Arbeitskategorien

Statt Vorlieben je Raum werden **Räume kategorisiert** und Arten bewerten die Kategorie.

| Kategorie | Räume |
|---|---|
| **Geistesarbeit** | Bibliothek, Tempel, Friedhof |
| **Soziales** | Taverne, Gefängnis |
| **Handwerk** | Schmelze, Schmiede, Handwerkskammer |
| **Kampf** | Arena, Wachposten, Trainingskammer |

Alle übrigen Räume sind neutral.

**Kampf wurde ergänzt**, weil der Ork sonst keine Kategorie hätte, die er liebt — er wäre ohne eigenes Verschulden dauerhaft unzufrieden. Mit der vierten Kategorie macht ihn sowohl Wachdienst als auch Training zufrieden.

### Regeln für die Zuweisung

| Regel | Begründung |
|---|---|
| **Mindestens eine Kategorie „liebt"** | sonst ist die Art überall unglücklich — ein Defekt, kein Charakter |
| **Höchstens zwei „liebt"** | sonst fehlt die Spannung |
| Beliebig viele „hasst" | ein Spezialist darf zwei Kategorien ablehnen |

**Beispiele:** Warlock liebt Geistesarbeit, hasst Handwerk, neutral bei Sozialem und Kampf. Troll liebt Handwerk und Kampf, hasst Geistesarbeit.

### Untote

Untote können **nur Handwerk** — für Geistesarbeit fehlt der Verstand, für Soziales die Ausstrahlung. Sie sind dabei **immer neutral**: Sie leiden nicht unter der Arbeit, gewinnen aber auch nie Zufriedenheit daraus.

---

## Nachtrag zu Teil 19 — Gemessene Werte

| Lage | Kachelkosten | 10 Kacheln mit Tempo 1,0 |
|---|---|---|
| Eigener Boden, leer | 1,00 | 10 Ticks |
| Neutraler Boden | 1,30 | 13 Ticks |
| Eigener Boden, 2 Gold | 1,70 | 18 Ticks |
| Eigener Boden, 3 Gold | 2,05 | 19 Ticks |
| 3 Gold + 3 Kreaturen | 3,55 | — |
| **Deckel** | **6,00** | niemand bleibt völlig stecken |

Je Gegenstand +0,35 · je weiterer Kreatur +0,50.

Ein volles Lagerhaus halbiert also grob das Tempo — spürbar, aber nicht lähmend. Genau der beabsichtigte Preis dafür, dass Lagerräume nichts kosten.

---

# Teil 25 — Kampf

## Feindschaft ist eine Frage, keine Eigenschaft

Kreaturen tragen **kein Feindbild** mit sich herum. Stattdessen lässt sich jederzeit fragen: *Sind diese beiden gerade feindlich?* Die Antwort hat drei Quellen.

| Quelle | Entsteht durch | Dauer |
|---|---|---|
| **Fraktion** | Böse gegen Gut | dauerhaft |
| **Groll** | Tantrum · Angriff erlitten · Ork-Infighting bei niedriger Zufriedenheit | **läuft ab** |
| **Auftrag** | Arena, Wachposten | endet mit dem Job |

**Groll ist zeitlich begrenzt — das ist entscheidend.** Zwei Orks prügeln sich, danach ist es vorbei. Genau daraus entstehen Geschichten statt Dauerfehden.

### In der Arena kämpft niemand aus Hass

Die Arena vergibt den Job **kämpfen** mit einem Ziel — genau wie die Schmiede *bedienen* vergibt. Der Kämpfer ist angestellt, nicht verfeindet. Deshalb kann er danach problemlos neben seinem Gegner schlafen.

Das erklärt zugleich, warum Arenakämpfe milder ausgehen dürfen als echte Gefechte.

## Die Kampfleiste

Bei Emoji-Grafik ist ein Kampf auf der Karte kaum von zwei herumstehenden Kreaturen zu unterscheiden. Die Leiste löst das vollständig.

| Element | Zweck |
|---|---|
| Streifen am unteren Rand | erscheint nur, solange gekämpft wird |
| Links eigene, rechts gegnerische Teilnehmer | sofortige Übersicht über das Kräfteverhältnis |
| Gekreuzte Schwerter in der Mitte | eindeutig: hier wird gekämpft |
| Lebensbalken unter jedem Symbol | Verlauf ohne Zahlen lesbar |
| **Zauber wirken auf die Symbole** | einziger Weg, im Getümmel gezielt einzugreifen |

**Bei Infighting stehen beide Seiten in eurer Farbe** — kein Sonderfall, sondern die sofortige Meldung, dass etwas schiefläuft.

Die Symbole sind für GODHAND schlicht weitere Ziele: Ein Zauber darauf ist derselbe Interact wie auf eine Kachel.

**Textlog bleibt knapp:** je ein Eintrag bei Kampfbeginn, bei Bewusstlosigkeit und bei Tod. Die laufende Information liefert die Leiste, nicht der Text.

## Bewusstlos statt tot

Verliert eine Kreatur alle Lebenspunkte, ist sie nicht zwangsläufig tot. Die Chance auf Bewusstlosigkeit stammt aus **bereits vorhandenen Werten** — kein neuer Kennwert.

| Faktor | Wirkung |
|---|---|
| **Überschussschaden** | Wie weit ging der Treffer über null hinaus? Knapp = gute Chance · über die halbe Maximalgesundheit = **immer tödlich** |
| **Glück** | Der einzige Wert, der nie skaliert. Wer Glück hat, wacht später wieder auf |
| **Kontext** | Arena erhöht deutlich · Gefecht am Weltportal senkt |

Damit bekommt Glück endlich einen zweiten, spürbaren Auftritt, und die Overkill-Regel braucht keine eigene Mechanik.

### Bewusstlose sind Fracht

Eine bewusstlose Kreatur ist ein Transportgut wie jedes andere — das System steht bereits (Sonderfall 10).

| Wessen Kreatur | Ziel |
|---|---|
| Eigene | Schlafsaal, zum Erholen |
| Feindliche | Gefängnis, zur Bekehrung |
| Beliebige | Tempel, als Opfer |

**Darstellung:** das um 90 Grad gedrehte Emoji — auf einen Blick lesbar, ohne neues Symbol.

## Kampfstile bestimmen die Zielwahl

Siehe Teil 23. Drei Zielauswahlfunktionen — Attentäter, Kämpfer, Unterstützer — ergeben zusammen mit Reichweiten und Fähigkeiten ein Schlachtbild, das niemand skriptet.

---

## Nachtrag zu Teil 25 — Gemessene Kampfwerte

**Kampfschaden ist von der Arbeitswucht entkoppelt** (Faktor 0,5). Stärke treibt beides, im Kampf aber gedämpft — sonst wären Gefechte nach zwei Schlägen vorbei und weder lesbar noch beeinflussbar.

| Paarung | Ø Schlagabtausche | Sieger |
|---|---|---|
| Höllenhund vs. Käfer | 6,2 | Käfer (97 %) |
| Käfer vs. Warlock | 4,9 | Käfer (100 %) |
| Warlock vs. Fliege | 6,1 | Warlock (92 %) |
| Höllenhund vs. Fliege | 3,8 | Höllenhund (97 %) |

Der Käfer ist der harte Konter zum Höllenhund: 35 % Verteidigung gegen einen Glaskanonier mit 5 Lebenspunkten. Genau die Art Paarung, die Aufstellung wichtig macht.

### Bewusstlosigkeit nach Kontext

| Kontext | Anteil bewusstlos statt tot |
|---|---|
| Normaler Kampf | 53 % |
| **Arena** | 91 % |
| Weltportal | 35 % |

**Massiver Überschussschaden tötet immer** — auch in der Arena.

---

## Nachtrag zu Teil 25 — Lebenspunkte statt Dämpfung

Der zunächst eingeführte Kampfschaden-Faktor ist **entfernt**. Stattdessen wurden die Grundlebenspunkte in der Artentabelle angehoben — dieselbe Wirkung, aber ohne Sonderregel im Kampfcode.

| Art | Leben vorher | jetzt | Stärke |
|---|---|---|---|
| Fliege | 5 | 12 | 1 |
| Imp | 10 | 18 | 2 |
| Höllenhund | 5 | 18 | 4 |
| Warlock | 8 | 20 | 2 |
| Käfer | 14 | 34 | 3 |

Ergebnis: 8–10 Schlagabtausche statt 3 — lang genug, um einzugreifen.

## Moral

**Kein eigener Kennwert.** Die Kampfmoral wird aus vorhandenen Werten abgeleitet:

> Moral = Lebensanteil + (Loyalität − 50) × 0,4 + (Zufriedenheit − 50) × 0,2

Rückzug unter Moral 40. Daraus ergeben sich die gemessenen Fluchtschwellen:

| Kreatur | Flieht unter |
|---|---|
| **Imp** | immer — kämpft nie |
| Fliege, Höllenhund | 19 % Leben |
| Käfer | 20 % |
| Warlock (Standard) | 22 % |
| **Warlock, zufrieden und treu** | **7 %** |
| **Warlock, mürrisch und illoyal** | **57 %** |

Damit wird Zufriedenheitspflege unmittelbar kampfrelevant: Eine vernachlässigte Truppe bricht, bevor sie den Feind erreicht. **Untote kennen keine Furcht** und fliehen nie.

---

# Teil 26 — Darstellung

Statt mehrerer Einzellösungen gibt es **zwei Ebenen**, die jede Kreatur gleich behandelt.

| Ebene | Ort | Zeigt | Quelle |
|---|---|---|---|
| **Gedanke** | über dem Kopf | was sie will oder gerade beschäftigt | eine Funktion, eine Rangfolge |
| **Schwung** | auf der Kachel | die laufende Handlung als Bewegung | `swingBudget` |

Das ersetzt das bisherige Hin- und Herblinken zwischen Kreatur und Werkzeug sowie die separate Stimmungsanzeige.

## Der Schwung braucht keinen neuen Zustand

`swingBudget` zählt bereits von 0 bis `SWING_COST` und wird beim Treffer zurückgesetzt. Das ist eine **fertige Animationsphase**:

> Phase = swingBudget / SWING_COST

Das Werkzeug holt sichtbar aus, während die Phase steigt, und schlägt beim Nulldurchgang zu. Ein Fehlschlag sieht anders aus als ein Treffer — ohne dass irgendwo etwas gespeichert wird.

### Das Werkzeug ergibt sich aus dem Kontext

Dieselbe Animation, nur ein anderes Symbol:

| Handlung | Symbol |
|---|---|
| Graben | ⛏️ |
| Verstärken | 🧱 |
| Schmieden | 🔨 |
| Blasebalg | 💨 |
| Schreiben | ✒️ |
| Kampf mit Waffe | das Symbol der getragenen Waffe |
| Kampf ohne Waffe | ✊ |

**Eine Funktion, eine Tabelle.** Ein Angriff ist dieselbe Animation wie ein Grabschlag — nur mit Schwert statt Spitzhacke. Das ist die visuelle Entsprechung dazu, dass beides derselbe Interact ist.

## Der Gedanke folgt einer Rangfolge

Genau **ein** Emoji über dem Kopf, nach fester Ordnung — das erste Zutreffende gewinnt:

| # | Zustand | Symbol |
|---|---|---|
| 1 | bewusstlos | 💫 |
| 2 | auf der Flucht | ❗ |
| 3 | im Kampf | ⚔️ |
| 4 | kurz vor dem Ausbruch | 😡 |
| 5 | kritischer Hunger | 🍗 |
| 6 | kritische Müdigkeit | 💤 |
| 7 | Ekel vor einem Objekt | 🤢 |
| 8 | Stimmung deutlich abweichend | 😟 / 😄 |
| 9 | aktuelle Arbeit | 📖 · 🔥 · 🔨 … |
| 10 | Freizeit | die Tätigkeit |
| — | sonst | nichts |

**Warum eine Rangfolge und keine Sammlung:** Zwei Emojis über einem Kopf sind unlesbar, und bei 20 Kreaturen auf dem Bildschirm entsteht Rauschen. Die Ordnung sorgt dafür, dass immer das Dringendste sichtbar ist.

**Nichts anzeigen ist erlaubt.** Eine zufriedene Kreatur bei gewöhnlicher Arbeit braucht kein Symbol.

---

## Nachtrag zu Teil 26 — Drei Sichtplätze

Kacheln und Kreaturen nutzen **dieselbe Geometrie**. Drei Plätze — dieselbe Zahl wie Inventarplätze und Lagerstufen.

| Platz | Bei Kreaturen | Bei Kacheln |
|---|---|---|
| **rechts** | Waffe | erster Gegenstand |
| **links** | Schild | zweiter Gegenstand |
| **unten Mitte** | Rüstung | dritter Gegenstand |

Andere getragene Dinge belegen freie Plätze der Reihe nach: Ein Imp mit zwei Goldstücken zeigt sie rechts und links.

**Unterschieden wird über Radius und Größe:** Kachelinhalte sitzen außen und größer, Getragenes enger und kleiner. So bleibt auf einen Blick lesbar, was nur herumliegt und was jemand bei sich trägt — auch wenn eine Kreatur über einen Goldhaufen läuft.

### Stapel sind Sammlungen, keine Zustände

Drei Goldmünzen statt 🪙 → 💰 → 💎. Man sieht die Menge, statt sie am Symbol ablesen zu müssen.

**Bei mehr als drei Dingen** werden die ersten drei gezeigt. Vier Symbole auf 32 Pixeln wären unlesbar; die genaue Menge nennt der Inspektor.

**Preis dieser Entscheidung:** Die Lagerstufe ist nicht mehr am Symbol einer teilgefüllten Kachel ablesbar. Bewusst in Kauf genommen — der Inspektor nennt sie.

---

## Nachtrag zu Teil 25 — Stärke skaliert gegenläufig zum Tempo

Weil Tempo **auch die Schlagrate** bestimmt (Teil 4), ist der Schaden je Zeit das Produkt aus Stärke und Tempo. Damit schnelle Kreaturen nicht automatisch überlegen sind, gilt:

> **Langsam = wuchtig. Schnell = leicht.**

| Art | Tempo | Stärke | Schaden je 10 Ticks |
|---|---|---|---|
| Käfer | 0,5 | 8 | 14,4 |
| Höllenhund | 2,8 | 2 | 18,5 |
| Warlock | 1,0 | 2 | 6,8 |
| Fliege | 1,8 | 1 | 6,1 |

Ergebnis im Tick-Betrieb: Käfer gegen Höllenhund steht bei 42 zu 58 — Panzer gegen Geschwindigkeit ist ein echtes Duell.

**Beim Einbau neuer Arten** gilt diese Faustregel: Stärke × Tempo ergibt den Schaden. Ein Troll mit Tempo 0,5 braucht hohe Stärke, eine Assassine mit Tempo 3 kommt mit wenig aus.

**Warnung aus der Praxis:** `actionCount` ruft den Tick bei schnellen Kreaturen mehrfach je Tick auf. Funktionen, die darin laufen — Bewegung, Schwung — dürfen das Tempo **nicht erneut** anwenden, sonst skaliert es quadratisch. Beide Stellen addieren deshalb je Aufruf genau 1.

---

## Nachtrag zu Teil 25 — Treffer-Rückmeldung

Ohne Animation ist ein Treffer auf der Karte nicht zu erkennen. Deshalb bekommt jede getroffene Kreatur eine kurze Rückmeldung von rund einer Viertelsekunde:

| Ereignis | Rückmeldung |
|---|---|
| Treffer | Zittern und roter Schleier |
| Kritischer Treffer (Glück) | stärkeres Zittern, kräftigeres Rot |
| Ausgewichen | kurzes seitliches Wegducken, kein Rot |

Der Zeitstempel des letzten Treffers dient zugleich der Kampfleiste als Hinweis, wer noch beteiligt ist.

## Kampfleiste — Feinheit aus der Praxis

Fliehende Kreaturen blieben zunächst dauerhaft in der Leiste stehen: Ein verwundeter Höllenhund (Tempo 2,8) entkommt einem Käfer (Tempo 0,5) für immer, und der Kampf endet nie formal.

**Regel:** Fliehende zählen nur, solange sie in den letzten Sekunden getroffen wurden.

Das entstandene Verhalten ist dabei genau richtig und bleibt erhalten — **ein schneller Verwundeter entkommt einem langsamen Verfolger.** Wer ihn erwischen will, braucht Reichweite oder Geschwindigkeit.

---

# Teil 27 — Die Arena

## Form statt Fläche

**Bewusste Ausnahme vom allgemeinen Stufenschema.** Bei allen anderen Räumen zählen Fläche und Verstärkung; bei der Arena zählt die **Geometrie** — sie braucht einen Ring aus Zuschauerplätzen um eine Grube. Gestaffelt wird daher nach Kantenlänge.

| Kantenlänge | Name | Stufe | Gemessen bei quadratischem Bau |
|---|---|---|---|
| unter 4 | — | keine Arena | — |
| 4 | **Kampfgrube** | 1 | 4 Grubenkacheln, 12 Plätze |
| 5 | **Arena** | 2 | 9 Grubenkacheln, 16 Plätze |
| 6+ | **Kolosseum** | 3 | 16 Grubenkacheln, 20 Plätze |

**Randkacheln sind Zuschauerplätze, das Innere ist die Grube.** Zwei Podeste liegen oben und unten in der Mitte der Grube.

## Wie Kämpfe zustande kommen

| Weg | Ablauf |
|---|---|
| **Freiwillig** | Eine Kreatur, die Kampf *liebt*, stellt sich auf ein freies Podest und wartet |
| **Durch den Spieler** | Aufheben-Zauber auf die Arena setzt die Kreatur auf ein freies Podest |

Findet sich kein Gegner, verlässt der Wartende nach einer Weile den Ring.

**Es wird nicht aus Hass gekämpft.** Die Arena weist die Gegner über `fightTarget` zu — der Auftrag-Zweig der Feindschaftsabfrage aus Teil 25. Danach können beide problemlos nebeneinander schlafen.

## Zuschauer brauchen keine Ankündigung

Zuschauen ist eine Freizeitbeschäftigung wie das Hühnerbeobachten. Ihre Suchfunktion findet Zuschauerplätze an Arenen mit **laufendem** Kampf. Wer in Freizeit ist und einen Platz erreichen kann, geht hin.

Kein Meldesystem, kein Aushang — der Kampf ist sichtbar, das genügt.

## Aufgeben statt sterben

Flucht bedeutet in der Arena **Aufgabe**. Die Moralregel aus Teil 25 greift unverändert.

| Verlierer | Folge |
|---|---|
| **Eigene Kreatur** | wird verschont, verlässt den Ring, verliert etwas Zufriedenheit |
| **Feindliche Kreatur** | kommt nicht heraus — bleibt liegen, bis ein Imp sie fortschafft |

**Der Daumen ist der Spieler.** Mit dem Aufheben-Zauber lässt sich der Unterlegene herausholen, ins Gefängnis bringen oder auf den Altar werfen. Keine neue Oberfläche nötig.

Der Sieger erhält Erfahrung und Zufriedenheit.
